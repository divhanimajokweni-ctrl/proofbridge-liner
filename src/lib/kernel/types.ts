// Epistemic Runtime v0.8 — Core Kernel Types
// LAST ITERATION: 10 architectural strengthening recommendations integrated

// ============================================================================
// §1 — PRIMITIVE KINDS
// ============================================================================

/** The four orthogonal primitives */
export type PrimitiveKind = 'fact' | 'proof' | 'policy' | 'projection';

// ============================================================================
// §2 — FACT TYPES (including drift detection)
// ============================================================================

/** Fact types that flow through the acceptance pipeline */
export type FactType =
  | 'observation'
  | 'migration_plan'
  | 'migration_execute'
  | 'migration_verify'
  | 'migration_complete'
  | 'migration_rollback'
  | 'projection_registered'
  | 'projection_deprecated'
  | 'schema_change'
  | 'policy_change'
  | 'identity_change'
  | 'system'
  | 'operational_drift_observed';  // §6 — Drift Facts

// ============================================================================
// §3 — ENUMS & LEVELS
// ============================================================================

/** Severity levels for policy violations */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Policy evaluation result */
export type PolicyResult = 'accept' | 'reject' | 'defer';

/** Evidence lifecycle states */
export type EvidenceState = 'pending' | 'verified' | 'failed' | 'expired' | 'revoked';

// ============================================================================
// §4 — CAPABILITY SETS (§2 — Authorization)
// ============================================================================

/** Capability set for authorization — vendor-neutral */
export type Capability =
  | 'automation.review'
  | 'automation.fix'
  | 'automation.deploy'
  | 'automation.triage'
  | 'security.analysis'
  | 'security.deep-analysis'
  | 'vision.debug'
  | 'webhook.ingest'
  | 'app.build';

/** Capability set attached to observations and projections */
export type CapabilitySet = Capability[];

// ============================================================================
// §5 — OBSERVATION AUTHENTICATION (§7)
// ============================================================================

/** Authentication method used for observation submission */
export type ObservationAuthMethod = 'mtls' | 'oidc' | 'iam-role' | 'api-key' | 'internal';

/** Observation authentication metadata */
export interface ObservationAuth {
  /** How this observation was authenticated */
  method: ObservationAuthMethod;
  /** Identity of the submitter (verified by auth method) */
  identity: string;
  /** OIDC issuer (if method is oidc) */
  issuer?: string;
  /** IAM role ARN (if method is iam-role) */
  roleArn?: string;
  /** mTLS certificate fingerprint (if method is mtls) */
  certFingerprint?: string;
}

// ============================================================================
// §6 — AUTOMATION PROVENANCE (§5)
// ============================================================================

/** Provenance record for automation actions — stores hashes, not content */
export interface AutomationProvenance {
  /** Agent or service that produced this action */
  agent: string;
  /** SHA-256 of the prompt/instruction (NOT the prompt itself) */
  promptHash: string;
  /** SHA-256 hashes of tool calls made during execution */
  toolCallHashes: string[];
  /** SHA-256 of the output/result (NOT the output itself) */
  outputHash: string;
  /** Whether a human approved this action */
  humanApproved: boolean;
  /** Human approver identity (if approved) */
  humanApprover?: string;
}

/** Provenance can be embedded in observation bodies */
export type ProvenancedBody = Record<string, unknown> & { provenance?: AutomationProvenance };

// ============================================================================
// §7 — FACT (§1 Observation Versioning, §2 Capabilities, §3 Correlation, §7 Auth)
// ============================================================================

/** A Fact — what happened. Immutable, append-only. */
export interface Fact {
  /** Deterministic fact ID: SHA-256 of canonical bytes */
  id: string;
  /** Type of fact */
  type: FactType;
  /** The payload — what actually happened */
  body: Record<string, unknown>;
  /** Canonical RFC8785 JSON bytes */
  canonicalBytes: string;
  /** SHA-256 hash of canonicalBytes */
  hash: string;
  /** Monotonically increasing sequence number */
  sequence: number;
  /** Logical timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
  /** Identity that submitted this fact */
  submittedBy: string;
  /** Ed25519 signature over canonicalBytes */
  signature: string;
  /** When the acceptance pipeline accepted this fact */
  acceptedAt: number;
  /** Schema ID that validated this fact's body */
  schemaId: string;

  // --- §1 — Observation Versioning ---
  /** Version of the schema at validation time */
  schemaVersion?: number;
  /** Producer service name (e.g., "kilo-bot", "CodeReviewService") */
  producer?: string;
  /** Version of the producer service (e.g., "2.6.1") */
  producerVersion?: string;

  // --- §2 — Capability Sets ---
  /** Capability set required/used for this observation */
  capabilities?: CapabilitySet;

  // --- §3 — Correlation Graph ---
  /** What action caused this observation (direct parent) */
  causationId?: string;
  /** What workflow this observation belongs to (correlation scope) */
  correlationId?: string;
  /** Parent fact that triggered this observation */
  parentFactId?: string;

  // --- §7 — Observation Authentication ---
  /** Authentication metadata for this observation */
  auth?: ObservationAuth;
}

// ============================================================================
// §8 — PROOF
// ============================================================================

/** A Proof — why we believe it. Cryptographic evidence. */
export interface Proof {
  id: string;
  /** The fact this proof attests to */
  factId: string;
  /** Kind of proof */
  kind: 'ancestry' | 'inclusion' | 'consistency' | 'batch';
  /** MMR root at time of proof generation */
  mmrRoot: string;
  /** Proof path (array of sibling hashes) */
  proofPath: string[];
  /** Index in the MMR */
  mmrIndex: number;
  /** Ed25519 signature */
  signature: string;
  /** Timestamp from injected clock */
  timestamp: number;
}

// ============================================================================
// §9 — POLICY
// ============================================================================

/** A Policy — whether to accept. Deterministic evaluation rules. */
export interface PolicyRule {
  id: string;
  /** Human-readable name */
  name: string;
  /** Policy version */
  version: number;
  /** Deterministic IR opcodes */
  ir: PolicyOpcode[];
  /** Severity if violated */
  severity: Severity;
  /** Fact types this policy applies to */
  appliesTo: FactType[];
  /** Whether this policy is active */
  active: boolean;
  /** Creation timestamp (injected) */
  createdAt: number;
}

/** Deterministic policy IR opcodes */
export type PolicyOpcode =
  | { op: 'LOAD_FIELD'; field: string }
  | { op: 'LOAD_CONST'; value: unknown }
  | { op: 'EQ' }
  | { op: 'NEQ' }
  | { op: 'LT' }
  | { op: 'LTE' }
  | { op: 'GT' }
  | { op: 'GTE' }
  | { op: 'IN_RANGE'; lo: number; hi: number }
  | { op: 'NOT_IN_RANGE'; lo: number; hi: number }
  | { op: 'CONTAINS' }
  | { op: 'NOT_CONTAINS' }
  | { op: 'TYPE_IS'; typeName: string }
  | { op: 'AND' }
  | { op: 'OR' }
  | { op: 'NOT' }
  | { op: 'EVERY'; count: number }
  | { op: 'SOME'; count: number }
  | { op: 'LOOKUP'; table: string; key: string }
  | { op: 'RESULT'; policy: PolicyResult };

// ============================================================================
// §10 — PROJECTION + CONFIDENCE INVARIANT (§4)
// ============================================================================

/**
 * INVARIANT: Trust scores, confidence values, and Bayesian posteriors
 * are NEVER stored as Facts. They are ALWAYS Projections.
 * Only evidence events ("Review Passed", "Fix Accepted", "Rollback Occurred")
 * become Facts. Confidence is derived, not observed.
 */

/** A Projection — how to consume. Derived view of facts. */
export interface Projection {
  /** Deterministic ID derived from name + version */
  id: string;
  /** Human-readable name */
  name: string;
  /** Version — incremented by ProjectionRegistered facts */
  version: number;
  /** The fact types this projection consumes */
  consumes: FactType[];
  /** Current state derived from consumed facts */
  state: Record<string, unknown>;
  /** MMR root of all facts that contributed to this projection */
  factRoot: string;
  /** Hash of the projection state */
  stateHash: string;
  /** Registration timestamp */
  registeredAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Whether deprecated */
  deprecated: boolean;
}

// ============================================================================
// §11 — PROJECTION MANIFEST (§9)
// ============================================================================

/** Projection manifest — metadata for auditable projections */
export interface ProjectionManifest {
  id: string;
  version: number;
  /** Other projections this one depends on */
  dependencies: string[];
  /** Capability set required for this projection */
  capabilitySet: CapabilitySet;
  /** SHA-256 of the projection handler code */
  projectionHash: string;
  /** Whether this projection is deterministic */
  deterministic: boolean;
  /** Owner/team responsible */
  owner: string;
}

// ============================================================================
// §12 — REPLAY CERTIFICATE (§8)
// ============================================================================

/** Replay certificate — first-class evidence of deterministic replay verification */
export interface ReplayCertificate {
  /** Projection name that was replayed */
  projection: string;
  /** SHA-256 of the projection state */
  projectionHash: string;
  /** Number of facts processed during replay */
  factCount: number;
  /** MMR root after replay */
  factRoot: string;
  /** Runtime version used for replay */
  runtimeVersion: string;
  /** Policy version used for replay */
  policyVersion: string;
  /** Whether replay verification passed */
  passed: boolean;
  /** Timestamp from injected clock */
  timestamp: number;
  /** Signature over the certificate */
  signature: string;
}

// ============================================================================
// §13 — OBSERVATION ADAPTER (§10)
// ============================================================================

/** Observation adapter — vendor-neutral translation layer between external systems and ER */
export interface ObservationAdapter {
  /** Source system name (e.g., "github-actions", "gitlab-ci", "kilo-bot") */
  sourceSystem: string;
  /** Translate external event into ER observation format */
  adapt(event: unknown): Promise<{
    type: FactType;
    body: Record<string, unknown>;
    capabilities: CapabilitySet;
    auth: ObservationAuth;
  }>;
}

// ============================================================================
// §14 — EVIDENCE ENVELOPE & ACCEPTANCE
// ============================================================================

/** Evidence envelope — the container for a fact + its proofs */
export interface EvidenceEnvelope {
  /** SHA-256 of canonical bytes */
  id: string;
  /** The fact */
  fact: Fact;
  /** Proofs attesting to this fact */
  proofs: Proof[];
  /** Current evidence state */
  state: EvidenceState;
  /** PII redaction applied */
  redactedFields: string[];
  /** Schema that validated this envelope */
  schemaId: string;
}

/** Acceptance pipeline result */
export interface AcceptanceResult {
  accepted: boolean;
  fact: Fact | null;
  proof: Proof | null;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// §15 — RUNTIME PROVIDERS
// ============================================================================

/** Runtime providers — all dependency-injected */
export interface RuntimeProviders {
  clock: ClockProvider;
  entropy: EntropyProvider;
  uuid: UuidProvider;
  signer: SignerProvider;
  storage: StorageProvider;
}

/** Clock provider — injects deterministic timestamps */
export interface ClockProvider {
  now(): number;
  /** Reset for replay */
  reset(initialTime: number): void;
}

/** Entropy provider — injects deterministic randomness */
export interface EntropyProvider {
  bytes(length: number): Uint8Array;
  /** Reset for replay */
  reset(seed: Uint8Array): void;
}

/** UUID provider — injects deterministic UUID generation */
export interface UuidProvider {
  generate(): string;
  /** Reset for replay */
  reset(seed: string): void;
}

/** Signer provider — injects signing capability */
export interface SignerProvider {
  sign(canonicalBytes: string): string;
  verify(canonicalBytes: string, signature: string, publicKey: string): boolean;
  getPublicKey(): string;
  getAlgorithm(): string;
}

/** Storage provider — injects persistence */
export interface StorageProvider {
  append(fact: Fact): Promise<void>;
  getFact(id: string): Promise<Fact | null>;
  getFacts(since?: number, limit?: number): Promise<Fact[]>;
  getProof(factId: string): Promise<Proof | null>;
  appendProof(proof: Proof): Promise<void>;
  getProofs(factId: string): Promise<Proof[]>;
  /** For projection state */
  saveProjection(projection: Projection): Promise<void>;
  getProjection(id: string): Promise<Projection | null>;
  /** WORM guarantee — no delete, no update */
  readonly isWORM: boolean;
}

// ============================================================================
// §16 — MMR STRUCTURES
// ============================================================================

/** MMR Node */
export interface MMRNode {
  /** Index in the MMR */
  index: number;
  /** Hash value */
  hash: string;
  /** For leaf nodes, the fact ID */
  factId?: string;
}

/** MMR Proof (inclusion proof) */
export interface MMRProof {
  /** Index of the element */
  index: number;
  /** Root hash at time of proof */
  rootHash: string;
  /** Authentication path (sibling hashes) */
  authPath: string[];
  /** Peak hashes */
  peaks: string[];
}

// ============================================================================
// §17 — SCHEMA & CONFIG
// ============================================================================

/** Schema definition */
export interface SchemaDefinition {
  id: string;
  name: string;
  version: number;
  factType: FactType;
  jsonSchema: Record<string, unknown>;
  createdAt: number;
}

/** Kernel configuration */
export interface KernelConfig {
  /** Initial clock time for deterministic replay */
  initialClockTime: number;
  /** Entropy seed for deterministic replay */
  entropySeed: Uint8Array;
  /** UUID namespace for deterministic replay */
  uuidNamespace: string;
  /** Signer private key (hex) */
  signerPrivateKey: string;
}

// ============================================================================
// §18 — VERIFICATION & REPLAY
// ============================================================================

/** Verification assertion result */
export interface VerificationAssertion {
  name: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/** Replay verification result */
export interface ReplayVerification {
  /** First run projection root */
  projectionRoot1: string;
  /** Second run projection root */
  projectionRoot2: string;
  /** Whether roots match */
  rootsMatch: boolean;
  /** Canonical bytes match */
  canonicalBytesMatch: boolean;
  /** Signatures match */
  signaturesMatch: boolean;
  /** MMR roots match */
  mmrRootsMatch: boolean;
  /** Fact IDs match */
  factIdsMatch: boolean;
  /** All checks pass */
  deterministic: boolean;
  /** Individual assertions */
  assertions: VerificationAssertion[];
}
