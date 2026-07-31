/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// Epistemic Runtime v0.8 — Operational Collector (Strengthened)
// External systems produce observations. They enter AcceptancePipeline.
// Only then may OperationalSnapshotFact exist.
//
// CONTRACT: This collector is READ-ONLY. It only creates observations
// and submits them through the pipeline. It NEVER writes directly
// to the fact log or any storage.
//
// STRENGTHENING (§1–§10):
//   §1 — Observation Versioning (schemaId, schemaVersion, producer, producerVersion)
//   §2 — Capability Sets for policy enforcement
//   §3 — Correlation Graph (causationId, correlationId, parentFactId)
//   §5 — Automation Provenance in observation bodies
//   §7 — Observation Authentication metadata
//   §10 — Adapter Integration (vendor-neutral entry point)

import type {
  FactType,
  AcceptanceResult,
  ObservationAuth,
  ObservationAuthMethod,
  CapabilitySet,
  ObservationAdapter,
} from './types';
import type { RuntimeKernel } from './runtime';

// ============================================================================
// §1 — ObservationSource (Versioned + Authenticated + Capabilities)
// ============================================================================

/**
 * An observation source — produces versioned, authenticated observations
 * from external systems.
 *
 * DETERMINISM INVARIANT: Implementations must be DETERMINISTIC — no
 * Date.now(), Math.random(), or other non-deterministic APIs.
 * Configuration drives output.
 *
 * Each observation now carries:
 *   - schemaId + schemaVersion: what schema validated this shape
 *   - producer + producerVersion: which service produced it
 *   - capabilities: what this observation can do (for policy gates)
 *   - auth: how this observation was authenticated
 *   - causationId/correlationId/parentFactId: correlation graph links
 */
export interface ObservationSource {
  /** Unique name for this source */
  name: string;
  /** Producer name (e.g., "kilo-bot", "GitSource") */
  producer: string;
  /** Producer version (e.g., "1.0", "2.6.1") */
  producerVersion: string;
  /** Collect observations from the external system */
  collect(): Promise<Array<{
    type: FactType;
    body: Record<string, unknown>;
    schemaId: string;
    schemaVersion: number;
    capabilities: CapabilitySet;
    auth: ObservationAuth;
    causationId?: string;
    correlationId?: string;
    parentFactId?: string;
  }>>;
}

// ---------------------------------------------------------------------------
// Built-in Sources — each now carries producer, version, capabilities, auth
// ---------------------------------------------------------------------------

/**
 * GitSource — collects git log entries as observations.
 *
 * DETERMINISTIC: Given the same repoPath and commits config, always produces
 * the same observations. Does NOT use Date.now() or Math.random().
 *
 * In production, this would shell out to `git log` and parse the output.
 * For the kernel's deterministic replay guarantee, we accept pre-computed
 * commit data via the `commits` config parameter.
 *
 * CAPABILITIES: ['automation.review'] — git commits trigger review workflows.
 * AUTH: internal — git-source identity (within the ER trust boundary).
 */
export interface GitSourceConfig {
  /** Path to the git repository (used as metadata, not accessed at runtime) */
  repoPath: string;
  /** Pre-computed commit entries — drives deterministic output */
  commits: Array<{
    hash: string;
    author: string;
    message: string;
    branch: string;
    sequence: number;
  }>;
}

export class GitSource implements ObservationSource {
  readonly name: string;
  readonly producer: string = 'GitSource';
  readonly producerVersion: string = '1.0';
  private config: GitSourceConfig;

  constructor(config: GitSourceConfig) {
    this.name = `git:${config.repoPath}`;
    this.config = config;
  }

  async collect(): Promise<Array<{
    type: FactType;
    body: Record<string, unknown>;
    schemaId: string;
    schemaVersion: number;
    capabilities: CapabilitySet;
    auth: ObservationAuth;
    causationId?: string;
    correlationId?: string;
    parentFactId?: string;
  }>> {
    return this.config.commits.map((commit) => ({
      type: 'observation' as FactType,
      body: {
        source: 'git',
        repoPath: this.config.repoPath,
        commitHash: commit.hash,
        author: commit.author,
        message: commit.message,
        branch: commit.branch,
        commitSequence: commit.sequence,
        // §1 — Observation Versioning embedded in body
        schemaId: 'observation-git-v1',
        schemaVersion: 1,
        producer: this.producer,
        producerVersion: this.producerVersion,
      },
      schemaId: 'observation-git-v1',
      schemaVersion: 1,
      capabilities: ['automation.review'] as CapabilitySet,
      auth: {
        method: 'internal' as ObservationAuthMethod,
        identity: 'git-source',
      } as ObservationAuth,
      // §3 — Correlation: git commits may have causation/correlation
      causationId: undefined,
      correlationId: `git-branch-${commit.branch}`,
      parentFactId: undefined,
    }));
  }
}

/**
 * FileSystemSource — collects file system change observations.
 *
 * DETERMINISTIC: Given the same watchPaths and changes config,
 * always produces the same observations.
 *
 * In production, this would use filesystem watchers (e.g., chokidar).
 * For deterministic replay, changes are provided via config.
 *
 * CAPABILITIES: ['automation.review', 'automation.fix'] — file changes
 *   may trigger both review and auto-fix workflows.
 * AUTH: internal — fs-source identity (within the ER trust boundary).
 */
export interface FileSystemSourceConfig {
  /** Paths being watched (metadata) */
  watchPaths: string[];
  /** Pre-computed file change entries */
  changes: Array<{
    path: string;
    changeType: 'created' | 'modified' | 'deleted';
    contentHash: string;
    sizeBytes: number;
    sequence: number;
  }>;
}

export class FileSystemSource implements ObservationSource {
  readonly name: string;
  readonly producer: string = 'FileSystemSource';
  readonly producerVersion: string = '1.0';
  private config: FileSystemSourceConfig;

  constructor(config: FileSystemSourceConfig) {
    this.name = `filesystem:${config.watchPaths.join(',')}`;
    this.config = config;
  }

  async collect(): Promise<Array<{
    type: FactType;
    body: Record<string, unknown>;
    schemaId: string;
    schemaVersion: number;
    capabilities: CapabilitySet;
    auth: ObservationAuth;
    causationId?: string;
    correlationId?: string;
    parentFactId?: string;
  }>> {
    return this.config.changes.map((change) => ({
      type: 'observation' as FactType,
      body: {
        source: 'filesystem',
        watchPaths: this.config.watchPaths,
        filePath: change.path,
        changeType: change.changeType,
        contentHash: change.contentHash,
        sizeBytes: change.sizeBytes,
        changeSequence: change.sequence,
        // §1 — Observation Versioning embedded in body
        schemaId: 'observation-fs-v1',
        schemaVersion: 1,
        producer: this.producer,
        producerVersion: this.producerVersion,
      },
      schemaId: 'observation-fs-v1',
      schemaVersion: 1,
      capabilities: ['automation.review', 'automation.fix'] as CapabilitySet,
      auth: {
        method: 'internal' as ObservationAuthMethod,
        identity: 'fs-source',
      } as ObservationAuth,
      // §3 — Correlation: file changes chain to the branch/pipeline
      causationId: undefined,
      correlationId: `fs-watch-${this.config.watchPaths.join(',')}`,
      parentFactId: undefined,
    }));
  }
}

/**
 * CISource — collects CI/CD pipeline status observations.
 *
 * DETERMINISTIC: Given the same pipeline and runs config,
 * always produces the same observations.
 *
 * CAPABILITIES: ['automation.deploy', 'automation.review'] — CI status
 *   may trigger deployment or review workflows.
 * AUTH: internal — ci-source identity (within the ER trust boundary).
 */
export interface CISourceConfig {
  /** CI/CD pipeline name */
  pipeline: string;
  /** Pre-computed CI run entries */
  runs: Array<{
    runId: string;
    status: 'success' | 'failure' | 'running' | 'cancelled';
    stage: string;
    commitHash: string;
    durationMs: number;
    sequence: number;
  }>;
}

export class CISource implements ObservationSource {
  readonly name: string;
  readonly producer: string = 'CISource';
  readonly producerVersion: string = '1.0';
  private config: CISourceConfig;

  constructor(config: CISourceConfig) {
    this.name = `ci:${config.pipeline}`;
    this.config = config;
  }

  async collect(): Promise<Array<{
    type: FactType;
    body: Record<string, unknown>;
    schemaId: string;
    schemaVersion: number;
    capabilities: CapabilitySet;
    auth: ObservationAuth;
    causationId?: string;
    correlationId?: string;
    parentFactId?: string;
  }>> {
    return this.config.runs.map((run) => ({
      type: 'observation' as FactType,
      body: {
        source: 'ci',
        pipeline: this.config.pipeline,
        runId: run.runId,
        status: run.status,
        stage: run.stage,
        commitHash: run.commitHash,
        durationMs: run.durationMs,
        runSequence: run.sequence,
        // §1 — Observation Versioning embedded in body
        schemaId: 'observation-ci-v1',
        schemaVersion: 1,
        producer: this.producer,
        producerVersion: this.producerVersion,
      },
      schemaId: 'observation-ci-v1',
      schemaVersion: 1,
      capabilities: ['automation.deploy', 'automation.review'] as CapabilitySet,
      auth: {
        method: 'internal' as ObservationAuthMethod,
        identity: 'ci-source',
      } as ObservationAuth,
      // §3 — Correlation: CI runs correlate to their commit
      causationId: `git-commit-${run.commitHash}`,
      correlationId: `ci-pipeline-${this.config.pipeline}`,
      parentFactId: undefined,
    }));
  }
}

// ---------------------------------------------------------------------------
// OperationalCollector — the orchestrator (Strengthened)
// ---------------------------------------------------------------------------

/**
 * OperationalCollector — collects observations from external systems
 * and submits them through the AcceptancePipeline.
 *
 * INVARIANT: This collector NEVER writes directly to the fact log.
 * All observations flow through kernel.submit() which routes through
 * the AcceptancePipeline. This preserves the universal write gate
 * contract.
 *
 * STRENGTHENING: Now passes versioning, capabilities, auth, and
 * correlation metadata through to the kernel. Also supports adapter-
 * based collection via collectFromAdapter().
 */
export class OperationalCollector {
  private sources: Map<string, ObservationSource> = new Map();

  /**
   * Register an observation source.
   */
  registerSource(source: ObservationSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Remove a previously registered source by name.
   */
  removeSource(name: string): void {
    this.sources.delete(name);
  }

  /**
   * Collect all observations from all registered sources
   * and submit them through the kernel's acceptance pipeline.
   *
   * Each observation is submitted individually so that the pipeline
   * can accept/reject each one independently.
   *
   * The submittedBy field uses the source name to maintain provenance.
   * The schemaId is now sourced from the observation's own schemaId
   * field (§1 — Observation Versioning), allowing per-source schemas.
   *
   * Versioning, capabilities, auth, and correlation metadata are
   * embedded in the observation body so the acceptance pipeline
   * can access them during policy evaluation.
   */
  async collect(kernel: RuntimeKernel): Promise<AcceptanceResult[]> {
    const results: AcceptanceResult[] = [];

    for (const [sourceName, source] of this.sources) {
      const observations = await source.collect();

      for (const observation of observations) {
        // §1 — Merge versioning metadata into body for pipeline access
        const enrichedBody: Record<string, unknown> = {
          ...observation.body,
          // Ensure versioning fields are present in the body
          // so the acceptance pipeline can validate and store them
          schemaId: observation.body.schemaId ?? observation.schemaId,
          schemaVersion: observation.body.schemaVersion ?? observation.schemaVersion,
          producer: observation.body.producer ?? source.producer,
          producerVersion: observation.body.producerVersion ?? source.producerVersion,
          // §2 — Capabilities for policy gates
          capabilities: observation.capabilities,
          // §7 — Auth metadata
          auth: observation.auth,
          // §3 — Correlation graph
          causationId: observation.causationId,
          correlationId: observation.correlationId,
          parentFactId: observation.parentFactId,
        };

        const result = await kernel.submit(
          observation.type,
          enrichedBody,
          `operational-collector:${sourceName}`,
          observation.schemaId,
        );
        results.push(result);
      }
    }

    return results;
  }

  /**
   * §10 — Collect from an ObservationAdapter and submit through the pipeline.
   *
   * This is the vendor-neutral entry point — ER should NEVER
   * know about specific external systems. The adapter translates
   * the external event into ER's internal format.
   *
   * The adapter provides:
   *   - type + body: the translated observation
   *   - capabilities: what this observation can do
   *   - auth: how it was authenticated
   *
   * The collector enriches the body with versioning defaults
   * if the adapter doesn't provide them, ensuring every fact
   * in the log carries complete provenance metadata.
   */
  async collectFromAdapter(
    adapter: ObservationAdapter,
    event: unknown,
    kernel: RuntimeKernel,
  ): Promise<AcceptanceResult> {
    const adapted = await adapter.adapt(event);

    const enrichedBody: Record<string, unknown> = {
      ...adapted.body,
      // §1 — Default versioning if adapter doesn't provide
      schemaId: adapted.body.schemaId ?? 'observation-v1',
      schemaVersion: adapted.body.schemaVersion ?? 1,
      producer: adapted.body.producer ?? 'unknown',
      producerVersion: adapted.body.producerVersion ?? '0.0',
      // §2 — Capabilities from adapter
      capabilities: adapted.capabilities,
      // §7 — Auth from adapter
      auth: adapted.auth,
    };

    const result = await kernel.submit(
      adapted.type,
      enrichedBody,
      `adapter:${adapter.sourceSystem}`,
      (adapted.body.schemaId as string) ?? 'schema-observation-v1',
    );

    return result;
  }

  /**
   * Get the names of all registered sources.
   */
  listSources(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Check if a source is registered.
   */
  hasSource(name: string): boolean {
    return this.sources.has(name);
  }

  /**
   * Get the count of registered sources.
   */
  get sourceCount(): number {
    return this.sources.size;
  }
}


