// Trust Runtime Dashboard — TypeScript interfaces
// These types define the shape of the data returned by the Trust Runtime
// Dashboard API, transformed from raw database records.

/** Confidence result from mapping — overall system trust score */
export interface ConfidenceResult {
  confidence: number;       // 0.0 - 1.0
  label: "SAFE" | "WARNING" | "TRIP";
  color: string;           // CSS color
  explanation: string;
}

/** Evidence panel data — derived from shadow event divergence */
export interface EvidenceResult {
  currentValue: number;
  history: Array<{ timestamp: string; value: number }>;
  threshold: number;
  status: "normal" | "elevated" | "critical";
}

/** Likelihood panel data — Bayesian inference from merge stats */
export interface LikelihoodResult {
  prior: number;
  likelihood: number;
  posterior: number;
  delta: number;
  components: Array<{ name: string; value: number }>;
}

/** Historical delta data — change tracking over time */
export interface HistoricalDeltaResult {
  recentChanges: Array<{ timestamp: string; delta: number; type: string }>;
  trend: "up" | "down" | "stable";
  summary: string;
}

/** Complete dashboard state — the top-level response object */
export interface TrustRuntimeState {
  timestamp: string;
  confidence: ConfidenceResult;
  evidence: EvidenceResult;
  likelihood: LikelihoodResult;
  historicalDelta: HistoricalDeltaResult;
  proofChainLength: number;
  epochId: string;
  genesisId: string;
  runtimeHealth: number;
  circuitStatuses: Array<{
    id: string;
    name: string;
    status: "active" | "pending" | "failed";
    constraints: number;
    lastVerified: string;
  }>;
  verificationGates: Array<{
    name: string;
    wave: number;
    status: "passed" | "pending" | "failed";
    timestamp: string;
  }>;
  posteriorDistribution: Array<{ x: number; y: number }>;
}
