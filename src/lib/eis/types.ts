/**
 * EIS — Evidence Independence Specification
 * Type definitions for the VVU backend.
 *
 * The EIS defines the valid claim–evidence relationships that the
 * IVE (Integrated Verification Environment) operates on. It is the
 * backend of the IVE per the VVU stack:
 *
 *   Claim ≤ Evidence ≤ Verification ≤ Authorization ≤ Action
 *
 * (Theorem 1 — VVU System Closure under the Evidence Bound)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Verification state lattice (Theorem 4)
//
//   PROVEN >= VERIFIED >= SUPPORTED >= OBSERVED >= INCONCLUSIVE
//   FALSIFIED (incomparable — terminal denial)
//   UNVALIDATED / UNTESTED / STALE (pre-conditions)
// ─────────────────────────────────────────────────────────────────────────────

export type VerificationState =
  | "PROVEN"
  | "VERIFIED"
  | "SUPPORTED"
  | "OBSERVED"
  | "INCONCLUSIVE"
  | "FALSIFIED"
  | "UNVALIDATED"
  | "UNTESTED"
  | "STALE";

// Numeric rank for lattice comparison. Higher = stronger evidence.
// FALSIFIED is negative — it's a denial, not a weak affirmation.
export const STATE_RANK: Record<VerificationState, number> = {
  PROVEN: 8,
  VERIFIED: 7,
  SUPPORTED: 6,
  OBSERVED: 5,
  INCONCLUSIVE: 4,
  UNVALIDATED: 2,
  UNTESTED: 1,
  STALE: 0,
  FALSIFIED: -1,
};

// Authorization threshold — claim state must be >= this for C conjunct.
export const AUTH_THRESHOLD: VerificationState = "SUPPORTED";

// ─────────────────────────────────────────────────────────────────────────────
// Claim types — EIS ranks mathematical > semantic > empirical > operational
// ─────────────────────────────────────────────────────────────────────────────

export type ClaimType =
  | "mathematical"
  | "semantic"
  | "empirical"
  | "operational";

export const CLAIM_TYPE_RANK: Record<ClaimType, number> = {
  mathematical: 4,
  semantic: 3,
  empirical: 2,
  operational: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Mesh sources
// ─────────────────────────────────────────────────────────────────────────────

export type EvidenceSource = "you.com" | "brave" | "firecrawl" | "watchdog";

export const EVIDENCE_SOURCES: EvidenceSource[] = [
  "you.com",
  "brave",
  "firecrawl",
  "watchdog",
];

// ─────────────────────────────────────────────────────────────────────────────
// Authorization formula: A = C ∧ E ∧ I ∧ S ∧ R
//
//   C — Claim state meets threshold
//   E — Sufficient evidence exists
//   I — Provenance integrity (N_ind >= threshold)
//   S — SafeGrid / SafeStacks safety clearance
//   R — Second-reviewer signoff
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthorizationConjuncts {
  claimOk: boolean;      // C
  evidenceOk: boolean;   // E
  integrityOk: boolean;  // I
  safetyOk: boolean;     // S
  reviewOk: boolean;     // R
}

export interface AuthorizationResult extends AuthorizationConjuncts {
  authorized: boolean;   // A = C ∧ E ∧ I ∧ S ∧ R
  reason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Participation ratio (Theorem 2)
//
//   N_ind = (∑λ_i)² / ∑λ_i²
//
// where λ_i are eigenvalues of the RBF Gram matrix
//   G_ij = exp(-γ ‖φ_i - φ_j‖²)
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticipationRatioResult {
  nInd: number;
  numEvidence: number;
  numSources: number; // estimated latent sources
  gamma: number;
  eigenvalues: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Heat kernel diffusion (Theorem 3)
//
//   u_t = -κ L u
//
// where L = D - A is the graph Laplacian of the provenance graph.
// ─────────────────────────────────────────────────────────────────────────────

export interface HeatKernelResult {
  steps: HeatKernelStep[];
  finalL2Norm: number;
  finalHighFreqEnergy: number;
  retention: number; // finalL2 / initialL2
}

export interface HeatKernelStep {
  step: number;
  l2Norm: number;
  highFreqEnergy: number;
  nodeValues: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuit breaker (Theorem 5 — fail-closed)
// ─────────────────────────────────────────────────────────────────────────────

export type CircuitBreakerReason =
  | "evidence_lost"
  | "verification_failed"
  | "safety_violation"
  | "stale_evidence"
  | "integrity_breach";

export interface CircuitBreakerEvent {
  triggered: boolean;
  reason: CircuitBreakerReason | "";
  trippedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregate VVU system state — exposed via /api/state
// ─────────────────────────────────────────────────────────────────────────────

export interface ClaimWithRelations {
  id: string;
  title: string;
  description: string;
  claimType: ClaimType;
  state: VerificationState;
  intendedAction: string;
  safetyCritical: boolean;
  createdAt: Date;
  updatedAt: Date;
  evidence: EvidenceItem[];
  authorizations: AuthorizationRecord[];
  circuitEvents: CircuitBreakerRecord[];
  nIndRecords: NIndRecord[];
}

export interface EvidenceItem {
  id: string;
  claimId: string;
  source: EvidenceSource;
  content: string;
  embedding: number[];
  weight: number;
  state: VerificationState;
  collectedAt: Date;
}

export interface AuthorizationRecord extends AuthorizationResult {
  id: string;
  claimId: string;
  createdAt: Date;
}

export interface CircuitBreakerRecord {
  id: string;
  claimId: string;
  triggered: boolean;
  reason: string;
  trippedAt: Date;
}

export interface NIndRecord {
  id: string;
  claimId: string;
  numEvidence: number;
  numSources: number;
  nInd: number;
  gamma: number;
  eigenvalues: number[];
  createdAt: Date;
}
