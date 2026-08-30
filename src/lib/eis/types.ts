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

export const AUTH_THRESHOLD: VerificationState = "SUPPORTED";

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

export type EvidenceSource = "you.com" | "brave" | "firecrawl" | "watchdog";

export const EVIDENCE_SOURCES: EvidenceSource[] = [
  "you.com",
  "brave",
  "firecrawl",
  "watchdog",
];

export interface AuthorizationConjuncts {
  claimOk: boolean;
  evidenceOk: boolean;
  integrityOk: boolean;
  safetyOk: boolean;
  reviewOk: boolean;
}

export interface AuthorizationResult extends AuthorizationConjuncts {
  authorized: boolean;
  reason: string;
}

export interface ParticipationRatioResult {
  nInd: number;
  numEvidence: number;
  numSources: number;
  gamma: number;
  eigenvalues: number[];
}

export interface HeatKernelResult {
  steps: HeatKernelStep[];
  finalL2Norm: number;
  finalHighFreqEnergy: number;
  retention: number;
}

export interface HeatKernelStep {
  step: number;
  l2Norm: number;
  highFreqEnergy: number;
  nodeValues: number[];
}

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
