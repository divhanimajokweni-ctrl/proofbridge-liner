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

// Epistemic Runtime v0.8 — Typed Observation SDK
// Prevents schema drift by providing typed emitter functions.
// Instead of emitObservation(any), we have specific typed functions
// that compile into OperationalObservation internally.
//
// INVARIANT: It is IMPOSSIBLE to emit untyped observations through this SDK.
// Every observation has a schemaId, schemaVersion, and capabilitySet
// that are determined at compile time — not at runtime.

import type { FactType, CapabilitySet, AutomationProvenance } from './types';

// ============================================================================
// §1 — VERSIONED OBSERVATION INTERFACE
// ============================================================================

/**
 * VersionedObservation — all observations emitted through the SDK
 * must declare version metadata. This makes every observation
 * traceable to a specific schema version and producer version.
 *
 * The kernel's AcceptancePipeline validates against the declared
 * schemaId + schemaVersion before admitting the observation
 * into the fact log.
 */
export interface VersionedObservation {
  /** Schema that validates this observation's payload (e.g., "kilo/bot-command") */
  schemaId: string;
  /** Version of the schema at emission time */
  schemaVersion: number;
  /** Producer service name (e.g., "KiloBot", "CodeReviewService") */
  producer: string;
  /** Version of the producer service (e.g., "2.6.1") */
  producerVersion: string;
  /** Capability set required/used for this observation */
  capabilitySet: CapabilitySet;
  /** Timestamp — will be replaced by injected clock during pipeline */
  timestamp: number;
  /** Owner of this observation — user, organization, or system */
  owner: { type: 'user' | 'organization' | 'system'; id: string };
  /** The actual payload — what happened */
  payload: Record<string, unknown>;
  /** Whether PII redaction has been applied */
  redacted: boolean;
  /** What action caused this observation (direct parent) — §3 Correlation */
  causationId?: string;
  /** What workflow this observation belongs to — §3 Correlation */
  correlationId?: string;
  /** Parent fact that triggered this observation — §3 Correlation */
  parentFactId?: string;
}

// ============================================================================
// §2 — TYPED EMITTER FUNCTION TYPE
// ============================================================================

/**
 * TypedEmitter — a generic function type that produces a VersionedObservation
 * from typed parameters. The payload shape is determined by the type parameter T,
 * preventing any ad-hoc or untyped observation emission.
 *
 * Optional causation/correlation/parentFactId can be provided for
 * building the correlation graph (§3).
 */
export type TypedEmitter<T extends Record<string, unknown>> = (
  params: T,
  options?: { causationId?: string; correlationId?: string; parentFactId?: string },
) => VersionedObservation;

// ============================================================================
// §3 — TYPED EMITTER IMPLEMENTATIONS
// ============================================================================

// ─── Bot Command ─────────────────────────────────────────────────────────

/**
 * Emit a bot command observation.
 *
 * Tracks commands issued through the Kilo bot platform.
 * The responseHash follows the provenance pattern: stores a hash
 * of the response, not the response itself.
 */
export const emitBotCommand: TypedEmitter<{
  command: string;
  user: string;
  platform: string;
  responseHash?: string;
}> = (params, options) => ({
  schemaId: 'kilo/bot-command',
  schemaVersion: 1,
  producer: 'KiloBot',
  producerVersion: '1.0',
  capabilitySet: ['automation.review'],
  timestamp: Date.now(), // Will be replaced by injected clock during pipeline
  owner: { type: 'user', id: params.user },
  payload: {
    command: params.command,
    platform: params.platform,
    responseHash: params.responseHash ?? null,
  },
  redacted: false,
  ...options,
});

// ─── Code Review ─────────────────────────────────────────────────────────

/**
 * Emit a code review started observation.
 *
 * Marks the beginning of a review cycle on a pull request.
 * Schema version 2 includes the repository field for
 * cross-repo review tracking.
 */
export const emitReviewStarted: TypedEmitter<{
  prId: string;
  owner: string;
  repository: string;
}> = (params, options) => ({
  schemaId: 'kilo/code-review',
  schemaVersion: 2,
  producer: 'CodeReviewService',
  producerVersion: '2.6.1',
  capabilitySet: ['automation.review'],
  timestamp: Date.now(),
  owner: { type: 'user', id: params.owner },
  payload: {
    prId: params.prId,
    repository: params.repository,
    phase: 'started',
  },
  redacted: false,
  ...options,
});

/**
 * Emit a code review completed observation.
 *
 * Marks the end of a review cycle with outcome and comment metadata.
 * Comment content is NOT stored — only the count, following the
 * provenance pattern.
 */
export const emitReviewCompleted: TypedEmitter<{
  prId: string;
  owner: string;
  outcome: string;
  commentCount: number;
}> = (params, options) => ({
  schemaId: 'kilo/code-review',
  schemaVersion: 2,
  producer: 'CodeReviewService',
  producerVersion: '2.6.1',
  capabilitySet: ['automation.review'],
  timestamp: Date.now(),
  owner: { type: 'user', id: params.owner },
  payload: {
    prId: params.prId,
    outcome: params.outcome,
    commentCount: params.commentCount,
    phase: 'completed',
  },
  redacted: false,
  ...options,
});

// ─── Auto Fix ─────────────────────────────────────────────────────────────

/**
 * Emit an auto fix observation.
 *
 * Every automated fix carries AutomationProvenance: the agent identity,
 * prompt hash, tool call hashes, and output hash. This makes every fix
 * traceable back to its prompt and tool calls — without storing
 * the actual content.
 *
 * If provenance is not provided, a default with 'unknown' hashes
 * and humanApproved=false is used. In production, the fix service
 * MUST provide real provenance data.
 */
export const emitFixCreated: TypedEmitter<{
  issueId: string;
  branch: string;
  prUrl: string;
  fixStatus: string;
  provenance?: AutomationProvenance;
}> = (params, options) => ({
  schemaId: 'kilo/auto-fix',
  schemaVersion: 1,
  producer: 'AutoFixService',
  producerVersion: '1.0',
  capabilitySet: ['automation.fix'],
  timestamp: Date.now(),
  owner: { type: 'system', id: 'auto-fix' },
  payload: {
    issueId: params.issueId,
    branch: params.branch,
    prUrl: params.prUrl,
    fixStatus: params.fixStatus,
    provenance: params.provenance ?? {
      agent: 'AutoFixService',
      promptHash: 'unknown',
      toolCallHashes: [],
      outputHash: 'unknown',
      humanApproved: false,
    },
  },
  redacted: false,
  ...options,
});

// ─── Security Finding ─────────────────────────────────────────────────────

/**
 * Emit a security finding observation.
 *
 * Tracks security findings from the Security Agent.
 * The analysisHash follows the provenance pattern: stores a hash
 * of the analysis result, not the result itself.
 */
export const emitSecurityFinding: TypedEmitter<{
  findingId: string;
  severity: string;
  status: string;
  analysisHash?: string;
}> = (params, options) => ({
  schemaId: 'kilo/security-finding',
  schemaVersion: 1,
  producer: 'SecurityAgent',
  producerVersion: '1.0',
  capabilitySet: ['security.analysis'],
  timestamp: Date.now(),
  owner: { type: 'system', id: 'security-agent' },
  payload: {
    findingId: params.findingId,
    severity: params.severity,
    status: params.status,
    analysisHash: params.analysisHash ?? null,
  },
  redacted: false,
  ...options,
});

// ─── Deployment ────────────────────────────────────────────────────────────

/**
 * Emit a deployment observation.
 *
 * Tracks CI/CD deployment runs with commit hash traceability.
 * The environment field captures the deployment target (staging, production, etc.)
 */
export const emitDeployment: TypedEmitter<{
  runId: string;
  status: string;
  commitHash: string;
  environment: string;
}> = (params, options) => ({
  schemaId: 'kilo/deployment',
  schemaVersion: 1,
  producer: 'DeployPipeline',
  producerVersion: '1.0',
  capabilitySet: ['automation.deploy'],
  timestamp: Date.now(),
  owner: { type: 'system', id: 'deploy-pipeline' },
  payload: {
    runId: params.runId,
    status: params.status,
    commitHash: params.commitHash,
    environment: params.environment,
  },
  redacted: false,
  ...options,
});

// ─── Operational Drift ─────────────────────────────────────────────────────

/**
 * Emit an operational drift observation.
 *
 * §6 — Drift Facts. When the DriftDetector detects that a projection's
 * computed state hash differs from the live system hash, it emits this
 * observation. This is a special fact type ('operational_drift_observed')
 * that triggers automatic reconciliation.
 */
export const emitDriftObserved: TypedEmitter<{
  projectionName: string;
  projectionHash: string;
  liveSystemHash: string;
  discrepancy: string;
}> = (params, options) => ({
  schemaId: 'er/operational-drift',
  schemaVersion: 1,
  producer: 'DriftDetector',
  producerVersion: '1.0',
  capabilitySet: ['security.analysis'],
  timestamp: Date.now(),
  owner: { type: 'system', id: 'drift-detector' },
  payload: {
    projectionName: params.projectionName,
    projectionHash: params.projectionHash,
    liveSystemHash: params.liveSystemHash,
    discrepancy: params.discrepancy,
  },
  redacted: false,
  ...options,
});

// ─── Agent Session ─────────────────────────────────────────────────────────

/**
 * Emit an agent session observation.
 *
 * Tracks Cloud Agent sessions that combine multiple capabilities
 * (automation.fix + vision.debug). The humanApproved flag records
 * whether a human reviewed and approved the agent's output,
 * following the provenance invariant.
 */
export const emitAgentSession: TypedEmitter<{
  sessionId: string;
  steps: number;
  outputHash: string;
  humanApproved: boolean;
}> = (params, options) => ({
  schemaId: 'kilo/agent-session',
  schemaVersion: 1,
  producer: 'CloudAgent',
  producerVersion: '1.0',
  capabilitySet: ['automation.fix', 'vision.debug'],
  timestamp: Date.now(),
  owner: { type: 'system', id: 'cloud-agent' },
  payload: {
    sessionId: params.sessionId,
    steps: params.steps,
    outputHash: params.outputHash,
    humanApproved: params.humanApproved,
  },
  redacted: false,
  ...options,
});
