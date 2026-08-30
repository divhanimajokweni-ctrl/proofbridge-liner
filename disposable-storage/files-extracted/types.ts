/**
 * packages/trust-runtime/types.ts
 *
 * Shared types for the AIR (Autonomous Intelligence Runtime) safety pipeline.
 *
 * TIER NOTE: These types describe VERIFIED-OPERATIONAL-READY structures — every
 * field here is consumed by an implemented gate in this package, not a future one.
 */

/** Normalized [0,1] metrics produced by each gate, consumed by the risk score engine. */
export interface GateMetrics {
  /** Weighted, tier-bucketed exposure as a fraction of the configured ceiling. [0,1] */
  exposure: number;
  /** Exponentially-decayed failure pressure, normalized against a saturation constant. [0,1] */
  failures: number;
  /** Belief-state entropy/contradiction score from the Epistemic Runtime. [0,1] */
  entropy: number;
  /** Normalized first-derivative (velocity) of state relative to MAX_VELOCITY. [0,1] */
  velocity: number;
  /** Normalized second-derivative (acceleration) relative to MAX_ACCELERATION. [0,1] */
  acceleration: number;
  /** Intent age normalized against the intent's max lifetime (e.g. 72h). [0,1] */
  intentAge: number;
  /** Normalized state-drift distance relative to MAX_DRIFT. [0,1] */
  drift: number;
  /** Contraction-penalty from Gate A (0 when contracting normally, grows if diverging). [0,1] */
  convergencePenalty: number;
}

/** A single point-in-time sample of the composite risk score. */
export interface RiskScoreSnapshot {
  timestamp: number;
  score: number;
  smoothedScore: number;
}

/** Exponentially-decayed monotonic counter (e.g. adapter failures, rate-limit pressure). */
export interface DecayingCounter {
  value: number;
  lastUpdated: number;
}

/** Circuit breaker states, ordered from safest to most severe. Hysteresis lives in circuit-breaker.ts. */
export type AIRState = 'NORMAL' | 'WARNING' | 'TRIPPED' | 'RECOVERY' | 'ESCALATED';

/** A signed intent awaiting execution within the 72h settlement window. */
export interface Intent {
  id: string;
  createdAt: number;
  /** Snapshot of infrastructure state at signing time — the basis for drift comparison. */
  snapshotState: Record<string, number>;
  /** Original epistemic weight, decayed over time via intent-aging.ts. */
  baseWeight: number;
}

/** Configuration thresholds. All defaults here are STARTING POINTS ONLY.
 *  TIER NOTE: per the phased rollout, these are NOT final — Phase 2 requires
 *  logging metrics for 30 days and deriving P95/P99/P99.9 empirical thresholds
 *  before any of these are used for enforcement (Phase 4). Until then this
 *  pipeline should be run in `enforceAt: 'observe'` mode (see gate-pipeline.ts).
 */
export interface AIRConfig {
  /** Max age of an intent before forced expiry, in ms. Default 72h. */
  maxIntentAgeMs: number;
  /** Half-life for exponential decay counters, in ms. Default 5 minutes. */
  decayHalfLifeMs: number;
  /** Max permissible state-drift distance before Gate E fails. */
  maxDrift: number;
  /** Max permissible contraction ratio (Gate A) before convergence penalty applies. */
  maxContraction: number;
  /** Max local (5m) velocity before Gate C trips. */
  maxVelocity: number;
  /** Max deviation between local and macro-trend velocity before Gate D trips (acceleration). */
  maxAcceleration: number;
  /** Absolute ceiling on tier-weighted accumulated exposure (Gate B). */
  exposureCeiling: number;
  /** Smoothing factor (EWMA alpha) for the composite risk score. */
  riskScoreSmoothingAlpha: number;
  /** Composite risk score thresholds for state transitions. */
  riskScoreThresholds: {
    warning: number;
    tripped: number;
    escalated: number;
  };
  /** Delta-score thresholds (rate of change) for state transitions. */
  deltaScoreThresholds: {
    warning: number;
    tripped: number;
    escalated: number;
  };
  /** Whether gates raise (enforce) or only record (observe). Phase 1-3 = 'observe'. */
  enforceAt: 'observe' | 'enforce';
}

export const DEFAULT_AIR_CONFIG: AIRConfig = {
  maxIntentAgeMs: 72 * 60 * 60 * 1000,
  decayHalfLifeMs: 5 * 60 * 1000,
  maxDrift: 1.0, // TBD Phase 2 empirical — placeholder unit distance
  maxContraction: 1.0, // TBD Phase 2 empirical
  maxVelocity: 1.0, // TBD Phase 2 empirical
  maxAcceleration: 1.0, // TBD Phase 2 empirical
  exposureCeiling: 1.0, // TBD Phase 2 empirical — set to your actual risk-budget unit
  riskScoreSmoothingAlpha: 0.2,
  riskScoreThresholds: { warning: 0.6, tripped: 0.75, escalated: 0.9 },
  deltaScoreThresholds: { warning: 0.05, tripped: 0.1, escalated: 0.2 },
  enforceAt: 'observe',
};
