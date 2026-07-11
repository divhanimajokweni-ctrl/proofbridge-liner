// contracts/api/types.ts
// ───────────────────────────────────────────────────────────────
// ProofBridge Trust API — Contract Types
// RC1 FROZEN — Do not modify without architectural review
// ───────────────────────────────────────────────────────────────

// ─── Trust Configuration ──────────────────────────────────────
// ProofBridge does NOT know what the hashes represent.
// It only signs: "I have signed Configuration Version X."

export interface TrustConfiguration {
  configurationId: string;
  configurationVersion: string;
  policyDocumentHash: string;       // opaque to ProofBridge
  domainManifestHash: string;       // opaque to ProofBridge
  consumerApplication: string;      // e.g. "ubuntu-pools", "ubuntu-water"
  createdAt: number;
}

// ─── Trust Context ────────────────────────────────────────────
// The core entity. Not a pool. Not a policy. A Trust Context.

export interface TrustContext {
  contextId: string;
  trustAnchor: string;
  configurationReceipt: string;
  verificationPolicy: VerificationPolicy;
  receiptRoot: string;
  status: TrustContextStatus;
  createdAt: number;
  updatedAt: number;
}

export type TrustContextStatus =
  | "initializing"
  | "active"
  | "suspended"
  | "frozen"
  | "terminated";

// ─── Trust Context Creation ───────────────────────────────────

export interface CreateTrustContextRequest {
  configuration: TrustConfiguration;
  verificationPolicy: VerificationPolicy;
}

export interface CreateTrustContextResponse {
  contextId: string;
  trustAnchor: string;
  configurationReceipt: string;
  verificationPolicy: VerificationPolicy;
  receiptRoot: string;
}

// ─── Verification Policy ──────────────────────────────────────

export interface VerificationPolicy {
  policyId: string;
  policyVersion: string;
  rules: VerificationRule[];
  circuitBreaker: CircuitBreakerConfig;
}

export interface VerificationRule {
  ruleId: string;
  ruleType: VerificationRuleType;
  parameters: Record<string, unknown>;
  severity: "block" | "warn" | "log";
}

export type VerificationRuleType =
  | "rate_limit"
  | "spending_cap"
  | "calldata_scan"
  | "identity_proof"
  | "custom";

export interface CircuitBreakerConfig {
  enabled: boolean;
  maxTransactionsPerMinute: number;
  maxVolumePerWindow: number;
  windowHours: number;
  killSwitchEnabled: boolean;
}

// ─── Trust Event ──────────────────────────────────────────────

export interface TrustEvent {
  eventId: string;
  contextId: string;
  eventType: string;
  eventVersion: string;
  payload: unknown;
  previousEventHash: string;
  eventHash: string;
  timestamp: number;
}

// ─── Trust Event Journal Request ──────────────────────────────

export interface JournalEventRequest {
  contextId: string;
  eventType: string;
  eventVersion: string;
  payload: unknown;
  agentId: string;
  targetContract?: string;
  calldata?: string;
  valueETH?: number;
  signatureProof?: string;
}

// ─── Receipt ──────────────────────────────────────────────────

export interface TrustContextReceipt {
  receiptId: string;
  contextId: string;
  eventId: string;
  receiptType: ReceiptType;
  status: "approved" | "rejected" | "halted";
  reason?: string;
  hashChainAnchor: string;
  merkleProof: string[];
  timestamp: number;
  latencyMs: number;
}

export type ReceiptType =
  | "configuration"
  | "event_journal"
  | "verification"
  | "attestation"
  | "kill_switch"
  | "execution";

// ─── Verification Result ──────────────────────────────────────

export interface VerificationResult {
  allowed: boolean;
  reason?: string;
  riskScore?: number;
  simulationGasUsed?: number;
  latencyMs: number;
  receipt?: TrustContextReceipt;
}

// ─── Agent Request (pre-signing gate) ─────────────────────────

export interface AgentTransactionRequest {
  agentId: string;
  contextId: string;
  targetContract: string;
  calldata: string;
  valueETH: number;
  signatureProof: string;
}

// ─── Kill Switch ──────────────────────────────────────────────

export interface KillSwitchState {
  active: boolean;
  activatedAt?: number;
  activatedBy?: string;
  reason?: string;
}

// ─── Chronicle Entry (projection) ─────────────────────────────

export interface ChronicleEntry {
  chronicleId: string;
  contextId: string;
  status: "APPROVED" | "REJECTED" | "HALTED";
  agentId: string;
  targetContract: string;
  valueETH: number;
  reason?: string;
  latencyMs?: number;
  timestamp: number;
}

// ─── Agent Execution Contract ─────────────────────────────────

/**
 * Agent Identity — registered once, purpose is immutable.
 * One agent, one purpose. That keeps reasoning clean.
 */
export interface AgentIdentity {
  agentId: string;
  displayName: string;
  purpose: string;
  capabilities: string[];
  restrictions: string[];
  signingKeyRef: string;
  registeredAt: number;
}

/**
 * TaskSpec — structured task given to an agent.
 * Agent cannot expand scope beyond this spec.
 */
export interface TaskSpec {
  taskId: string;
  description: string;
  scope: string[];
  constraints: string[];
  contextId: string;
  policyId: string;
  createdAt: number;
}

/**
 * DiffManifest — what the agent changed.
 */
export interface DiffManifest {
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
  testsAdded: number;
  testsModified: number;
}

/**
 * ExecutionEvidence — verification results from the agent's work.
 */
export interface ExecutionEvidence {
  typecheck: { passed: boolean; errorCount: number };
  lint: { passed: boolean; errorCount: number };
  tests: { passed: boolean; total: number; passedCount: number; failed: number };
  build: { passed: boolean };
  coverage?: { statements?: number; branches?: number };
}

/**
 * ExecutionReceipt — cryptographic record of an agent's execution.
 * Signed with the agent's HMAC key. Hash-chained per agent.
 */
export interface ExecutionReceipt {
  receiptId: string;
  agentId: string;
  agentVersion: string;
  taskId: string;
  taskSpecHash: string;
  repository: {
    branch: string;
    baseCommit: string;
    headCommit: string;
  };
  evidence: ExecutionEvidence;
  diffManifest: DiffManifest;
  timestamp: number;
  contextId: string;
}

/**
 * ExecutionContractResult — output of enforceExecutionContract.
 */
export interface ExecutionContractResult {
  allowed: boolean;
  receipt?: ExecutionReceipt;
  verificationStatus: "pending" | "verified" | "rejected";
  reason?: string;
  violations: Array<{
    ruleId: string;
    severity: string;
    message: string;
  }>;
  latencyMs: number;
}

/**
 * VerificationAttestation — independent verification of an execution receipt.
 */
export interface VerificationAttestation {
  attestationId: string;
  receiptId: string;
  verifiedBy: string;
  status: "verified" | "rejected";
  reason?: string;
  timestamp: number;
}

/**
 * FounderBrief — plain-English summary of what changed and why.
 */
export interface FounderBrief {
  taskId: string;
  agentId: string;
  whatChanged: string;
  whyChanged: string;
  howItWorks: string;
  risksRemaining: string;
  summary: string;
  receiptId: string;
  timestamp: number;
}
