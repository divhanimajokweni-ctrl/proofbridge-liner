// ============================================================================
// VVU Trust Runtime — Canonical Event Model
// ============================================================================
// Architecture: Event-driven runtime with Command → Event → Store → Reducer → Projection
// Layer:        RuntimeEvent schema + State types + Command types
// ============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Kernel States
// ---------------------------------------------------------------------------

export const KERNEL_STATES = [
  "IDLE",
  "INGESTING",
  "ATTESTING",
  "VERIFYING",
  "COMMITTING",
  "SETTLED",
  "HAZARD",
] as const;

export type KernelState = (typeof KERNEL_STATES)[number];

// ---------------------------------------------------------------------------
// State Machine — Transition Map
// ---------------------------------------------------------------------------

export const ALLOWED_TRANSITIONS: Record<KernelState, KernelState[]> = {
  IDLE: ["INGESTING"],
  INGESTING: ["ATTESTING", "HAZARD"],
  ATTESTING: ["VERIFYING", "HAZARD"],
  VERIFYING: ["COMMITTING", "HAZARD"],
  COMMITTING: ["SETTLED", "HAZARD"],
  SETTLED: ["IDLE"],
  HAZARD: ["IDLE"],
};

/** Returns true if `from → to` is a legal state transition. */
export function isValidTransition(
  from: KernelState,
  to: KernelState,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// RuntimeEvent — Canonical Event Contract
// ---------------------------------------------------------------------------

export const RuntimeEventVersion = 1;

/**
 * Every RuntimeEvent carries an envelope with tracing metadata and a
 * versioned payload. This is the **single source of truth** — every
 * subsystem (state machine, event store, reducer, UI, colony, metrics,
 * audit) consumes the same event.
 */
export type RuntimeEvent = {
  /** Globally unique event identifier (e.g. UUIDv7). Used for idempotency. */
  eventId: string;
  /** Discriminated event type. */
  type: RuntimeEventType;
  /** Schema version for forward/backward compatibility. */
  version: number;
  /** When the event was created (Unix ms). */
  timestamp: number;
  /** Global sequence number (monotonic). */
  sequence: number;
  /** Links events across a single workflow (e.g. a verification attempt). */
  correlationId: string;
  /** Identifies the event that directly caused this one (causal chain). */
  causationId: string | null;
  /** Originating subsystem (e.g. "safe-krypte", "proof-bridge", "user"). */
  source: string;
  /** Version-specific payload. */
  payload: RuntimeEventPayload;

  // Governance & Multi-Tenancy Fields
  /** Tenant identifier for multi-tenant isolation. */
  tenantId: string;
  /** Stream identifier for event sourcing. */
  streamId: string;
  /** Version within the stream (1-indexed). */
  streamVersion: number;
  /** Governance schema version. */
  schemaVersion: number;
  /** SHA-256 hash of canonical payload. */
  payloadHash: string;
  /** SHA-256 hash of (previousHash:eventId:payloadHash). */
  eventHash: string;
  /** Previous event hash in chain (null for genesis). */
  previousHash: string | null;
};

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

export type RuntimeEventType =
  | "EvidenceReceived"
  | "EvidenceRejected"
  | "AttestationStarted"
  | "AttestationVerified"
  | "AttestationFailed"
  | "AttestationRetrying"
  | "BayesianUpdated"
  | "ReceiptCommitted"
  | "ReceiptFailed"
  | "LedgerConfirmed"
  | "CircuitBreakerOpened"
  | "CircuitBreakerClosed"
  | "QueueDrained"
  | "RuntimeIdle"
  | "SystemError";

// ---------------------------------------------------------------------------
// Event Payloads (version 1)
// ---------------------------------------------------------------------------

export type EvidencePayload = {
  claim: string;
  source: string;
  confidence: "low" | "medium" | "high";
  tags?: string[];
};

export type AttestationPayload = {
  receiptId: string;
  platform: "AMD SEV-SNP" | "Intel SGX" | "AWS Nitro" | "software";
  measurement: string;
};

export type BayesianPayload = {
  trust: number; // 0..1
  sigma: number;
  confidence: number; // 0..100
  epoch: number;
  quorumPass: number;
  quorumTotal: number;
};

export type ReceiptPayload = {
  receiptId: string;
  receiptHash: string;
  envelopeHash: string;
  signature: string;
  chainHash: string;
};

export type LedgerPayload = {
  seq: number;
  blockHeight: string;
  txHash: string;
};

export type CircuitBreakerPayload = {
  action: "open" | "close";
  reason: string;
  threshold?: number;
};

export type SystemErrorPayload = {
  code: string;
  message: string;
  subsystem: string;
  recoverable: boolean;
};

/**
 * Discriminated union of all event payloads, keyed by event type.
 */
export type RuntimeEventPayload = {
  EvidenceReceived: EvidencePayload;
  EvidenceRejected: { claim: string; reason: string };
  AttestationStarted: { receiptId: string; platform: string };
  AttestationVerified: AttestationPayload;
  AttestationFailed: { receiptId: string; error: string };
  AttestationRetrying: { receiptId: string; attempt: number; maxAttempts: number };
  BayesianUpdated: BayesianPayload;
  ReceiptCommitted: ReceiptPayload;
  ReceiptFailed: { receiptId: string; error: string };
  LedgerConfirmed: LedgerPayload;
  CircuitBreakerOpened: CircuitBreakerPayload;
  CircuitBreakerClosed: CircuitBreakerPayload;
  QueueDrained: { count: number; duration: number };
  RuntimeIdle: { idleDuration: number };
  SystemError: SystemErrorPayload;
}[RuntimeEventType];

// ---------------------------------------------------------------------------
// Commands — Express Intent, Events Record Facts
// ---------------------------------------------------------------------------

export type Command =
  | { type: "SubmitEvidence"; evidence: EvidencePayload; idempotencyKey: string; tenantId?: string; streamId?: string }
  | { type: "VerifyAttestation"; receiptId: string; platform: string; tenantId?: string; streamId?: string }
  | { type: "CommitReceipt"; receipt: ReceiptPayload; tenantId?: string; streamId?: string }
  | { type: "ConfirmLedger"; seq: number; blockHeight: string; tenantId?: string; streamId?: string }
  | { type: "TriggerCircuitBreaker"; action: "open" | "close"; reason: string; tenantId?: string; streamId?: string }
  | { type: "ResetRuntime"; tenantId?: string; streamId?: string };

// ---------------------------------------------------------------------------
// RuntimeState — Derived from Events
// ---------------------------------------------------------------------------

export interface RuntimeState {
  /** Current kernel state. */
  kernelState: KernelState;
  /** Global sequence number (last processed event). */
  sequence: number;
  /** Bayesian trust estimate. */
  trust: number;
  /** Standard deviation of trust estimate. */
  sigma: number;
  /** Confidence percentage. */
  confidence: number;
  /** Current epoch. */
  epoch: number;
  /** Quorum counts. */
  quorum: { pass: number; total: number };
  /** Evidence store (immutable append). */
  evidenceLeaves: EvidenceLeaf[];
  /** Receipt chain. */
  receipts: ReceiptEntry[];
  /** Hash chain integrity flag. */
  hashChainIntact: boolean;
  /** Whether the circuit breaker is open (system halted). */
  circuitBreakerOpen: boolean;
  /** Last hazard reason if in HAZARD state. */
  hazardReason: string | null;
  /** Last system error. */
  lastError: { code: string; message: string; recoverable: boolean } | null;
  /** Runtime start timestamp. */
  startedAt: number;
  /** Last event timestamp. */
  lastEventAt: number;
}

export interface EvidenceLeaf {
  id: string;
  claim: string;
  source: string;
  confidence: "low" | "medium" | "high";
  tags: string[];
  verified: boolean;
  addedAt: number;
}

export interface ReceiptEntry {
  receiptId: string;
  receiptHash: string;
  envelopeHash: string;
  signature: string;
  chainHash: string;
  committedAt: number;
}

// ---------------------------------------------------------------------------
// Projections — Derived Views for Consumers
// ---------------------------------------------------------------------------

export interface ColonyProjection {
  activeCarriers: number;
  verificationQueueDepth: number;
  canopyLeafCount: number;
  canopyGrowthRate: number; // leaves per minute
  sentinelPatrolIntensity: number; // 0 (idle) to 1 (max)
  kernelState: KernelState;
  trustScore: number;
  hazardMode: boolean;
  hasUnverifiedEvidence: boolean;
}

export interface UIProjection {
  kernelState: KernelState;
  trust: number;
  sigma: number;
  confidence: number;
  epoch: number;
  quorum: { pass: number; total: number };
  sequence: number;
  hashChainIntact: boolean;
  circuitBreakerOpen: boolean;
  hazardReason: string | null;
  lastError: { code: string; message: string } | null;
  evidenceLeaves: EvidenceLeaf[];
  receipts: ReceiptEntry[];
}

export interface MetricsProjection {
  eventCount: number;
  eventRate: number; // events per minute
  verificationCount: number;
  verificationFailures: number;
  circuitBreakerTriggers: number;
  averageConfidence: number;
  hazardEventCount: number;
  renderLatency: number; // ms, moving average
  droppedFrames: number;
  fps: number;
}

export interface NotificationProjection {
  activeAlerts: Alert[];
  hazardMode: boolean;
  circuitBreakerOpen: boolean;
  unverifiedCount: number;
  pendingVerifications: number;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  eventType: RuntimeEventType;
  timestamp: number;
  acknowledged: boolean;
}

// ---------------------------------------------------------------------------
// Zod Schemas for Runtime Validation
// ---------------------------------------------------------------------------

export const RuntimeEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.enum([
    "EvidenceReceived",
    "EvidenceRejected",
    "AttestationStarted",
    "AttestationVerified",
    "AttestationFailed",
    "AttestationRetrying",
    "BayesianUpdated",
    "ReceiptCommitted",
    "ReceiptFailed",
    "LedgerConfirmed",
    "CircuitBreakerOpened",
    "CircuitBreakerClosed",
    "QueueDrained",
    "RuntimeIdle",
    "SystemError",
  ]),
  version: z.number().int().positive(),
  timestamp: z.number().positive(),
  sequence: z.number().int().nonnegative(),
  correlationId: z.string().min(1),
  causationId: z.string().nullable(),
  source: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});
