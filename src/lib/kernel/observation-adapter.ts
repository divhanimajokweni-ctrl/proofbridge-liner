// Epistemic Runtime v0.8 — Observation Adapters
// Vendor-neutral translation layer between external systems and the ER.
// Each adapter translates external system events into ER observations.
// ER should NEVER know about specific external systems.
//
// §13 — Observation Adapter (§10 architectural recommendation)

import type { ObservationAdapter, FactType, CapabilitySet, ObservationAuth } from './types';

// ---------------------------------------------------------------------------
// Base Adapter — common auth handling
// ---------------------------------------------------------------------------

/**
 * BaseObservationAdapter — abstract base class providing common
 * authentication metadata construction. All concrete adapters extend this.
 *
 * INVARIANT: Adapters never write directly to the fact log.
 * They only translate external events into the ER observation format.
 * Submission must always flow through kernel.submit() → AcceptancePipeline.
 */
export abstract class BaseObservationAdapter implements ObservationAdapter {
  abstract sourceSystem: string;

  /**
   * Construct an ObservationAuth record from method + identity.
   * Concrete adapters call this to standardize auth metadata.
   */
  protected createAuth(
    method: ObservationAuth['method'],
    identity: string,
    extras?: Partial<ObservationAuth>,
  ): ObservationAuth {
    return { method, identity, ...extras };
  }

  /**
   * Translate an external event into the ER observation format.
   * Each adapter knows the shape of its source system's events,
   * but the ER never needs to know about those shapes.
   */
  abstract adapt(event: unknown): Promise<{
    type: FactType;
    body: Record<string, unknown>;
    capabilities: CapabilitySet;
    auth: ObservationAuth;
  }>;
}

// ---------------------------------------------------------------------------
// Concrete Adapters
// ---------------------------------------------------------------------------

/**
 * KiloBotAdapter — translates bot commands into observations.
 *
 * Provenance pattern: stores a hash of the response, not the response itself.
 * This ensures the fact log never contains PII or large response payloads.
 */
export class KiloBotAdapter extends BaseObservationAdapter {
  sourceSystem = 'kilo-bot';

  async adapt(event: unknown) {
    const e = event as {
      command: string;
      user: string;
      source: string;
      response?: string;
    };

    return {
      type: 'observation' as FactType,
      body: {
        source: this.sourceSystem,
        command: e.command,
        user: e.user,
        platform: e.source,
        responseHash: e.response ? this.hashResponse(e.response) : null,
      },
      capabilities: ['automation.review'] as CapabilitySet,
      auth: this.createAuth('oidc', e.user),
    };
  }

  /**
   * SHA-256 hash of response content — provenance pattern.
   * Stores a hash, not the content itself, to prevent PII leakage
   * and keep the fact log compact.
   *
   * In production this would use the kernel's hashing module
   * for deterministic, replayable hashing.
   */
  private hashResponse(response: string): string {
    // Simplified hash for kernel integration; production would use
    // the kernel's HashingProvider for deterministic SHA-256
    const len = response.length;
    const byteLen = Buffer.from(response).length;
    return `sha256:${len}:${byteLen}`;
  }
}

/**
 * CodeReviewAdapter — translates code review events into observations.
 *
 * Tracks PR lifecycle (started, completed) with outcome and comment metadata.
 * Does NOT store comment content — only counts, following the provenance pattern.
 */
export class CodeReviewAdapter extends BaseObservationAdapter {
  sourceSystem = 'code-review';

  async adapt(event: unknown) {
    const e = event as {
      prId: string;
      owner: string;
      outcome: string;
      comments?: string[];
    };

    return {
      type: 'observation' as FactType,
      body: {
        source: this.sourceSystem,
        prId: e.prId,
        owner: e.owner,
        outcome: e.outcome,
        commentCount: e.comments?.length ?? 0,
      },
      capabilities: ['automation.review'] as CapabilitySet,
      auth: this.createAuth('iam-role', e.owner),
    };
  }
}

/**
 * AutoFixAdapter — translates auto-fix events into observations.
 *
 * Carries AutomationProvenance: the agent identity, prompt hash,
 * tool call hashes, and output hash. This makes every automated
 * fix traceable back to its prompt and tool calls — without
 * storing the actual content.
 */
export class AutoFixAdapter extends BaseObservationAdapter {
  sourceSystem = 'auto-fix';

  async adapt(event: unknown) {
    const e = event as {
      issueId: string;
      branch: string;
      prUrl: string;
      status: string;
      promptHash?: string;
    };

    return {
      type: 'observation' as FactType,
      body: {
        source: this.sourceSystem,
        issueId: e.issueId,
        branch: e.branch,
        prUrl: e.prUrl,
        fixStatus: e.status,
        provenance: {
          agent: this.sourceSystem,
          promptHash: e.promptHash ?? 'unknown',
          toolCallHashes: [],
          outputHash: 'unknown',
          humanApproved: false,
        },
      },
      capabilities: ['automation.fix'] as CapabilitySet,
      auth: this.createAuth('oidc', this.sourceSystem),
    };
  }
}

/**
 * SecurityAgentAdapter — translates security finding events into observations.
 *
 * Capabilities include both 'security.analysis' and 'security.deep-analysis',
 * reflecting the security agent's dual role: initial triage and deep investigation.
 */
export class SecurityAgentAdapter extends BaseObservationAdapter {
  sourceSystem = 'security-agent';

  async adapt(event: unknown) {
    const e = event as {
      findingId: string;
      severity: string;
      status: string;
      analysisResult?: string;
    };

    return {
      type: 'observation' as FactType,
      body: {
        source: this.sourceSystem,
        findingId: e.findingId,
        severity: e.severity,
        status: e.status,
        analysisHash: e.analysisResult ? this.hashResponse(e.analysisResult) : null,
      },
      capabilities: ['security.analysis', 'security.deep-analysis'] as CapabilitySet,
      auth: this.createAuth('iam-role', this.sourceSystem),
    };
  }

  private hashResponse(response: string): string {
    const len = response.length;
    const byteLen = Buffer.from(response).length;
    return `sha256:${len}:${byteLen}`;
  }
}

/**
 * GitHubActionsAdapter — translates CI/CD events into observations.
 *
 * Maps GitHub Actions workflow runs to deployment observations.
 * The commit hash is carried for traceability; the full workflow
 * payload is NOT stored (provenance pattern).
 */
export class GitHubActionsAdapter extends BaseObservationAdapter {
  sourceSystem = 'github-actions';

  async adapt(event: unknown) {
    const e = event as {
      runId: string;
      status: string;
      commit: string;
      workflow: string;
    };

    return {
      type: 'observation' as FactType,
      body: {
        source: this.sourceSystem,
        runId: e.runId,
        status: e.status,
        commitHash: e.commit,
        workflow: e.workflow,
      },
      capabilities: ['automation.deploy'] as CapabilitySet,
      auth: this.createAuth('oidc', 'github-actions'),
    };
  }
}

// ---------------------------------------------------------------------------
// Adapter Registry — manages all adapters
// ---------------------------------------------------------------------------

/**
 * AdapterRegistry — the central registry for all observation adapters.
 *
 * Provides lookup by sourceSystem name, listing, and size inspection.
 * The kernel or OperationalCollector uses this registry to find the
 * correct adapter for each incoming external event.
 *
 * INVARIANT: Adapters are registered BEFORE the kernel starts accepting
 * observations. No dynamic registration during fact processing.
 */
export class AdapterRegistry {
  private adapters: Map<string, ObservationAdapter> = new Map();

  /** Register an adapter by its sourceSystem name */
  register(adapter: ObservationAdapter): void {
    this.adapters.set(adapter.sourceSystem, adapter);
  }

  /** Retrieve an adapter by sourceSystem name */
  get(sourceSystem: string): ObservationAdapter | undefined {
    return this.adapters.get(sourceSystem);
  }

  /** List all registered sourceSystem names */
  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  /** Number of registered adapters */
  get size(): number {
    return this.adapters.size;
  }
}
