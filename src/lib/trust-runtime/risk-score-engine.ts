/**
 * packages/trust-runtime/risk-score-engine.ts
 *
 * NAMING NOTE (read before renaming this back): the original proposal called this
 * a "Lyapunov function." It isn't one. A Lyapunov function V(x) requires:
 *   1. V(x) >= 0, with V(x) = 0 only at an equilibrium point
 *   2. A defined equilibrium x_eq
 *   3. A PROOF that dV/dt <= 0 along trajectories of the actual state-transition
 *      operator F (the Epistemic Runtime's belief-update function)
 *
 * None of those three are established here. This is a hand-weighted composite
 * risk score — a legitimate and useful early-warning signal, but calling it
 * "Lyapunov" implies a stability guarantee this code does not provide. If you
 * later derive an actual proof that dV/dt <= 0 against your real F, rename this
 * back and cite the proof in this docstring. Until then, `computeLyapunov` exists
 * below ONLY as a deprecated alias so existing call sites don't break silently.
 *
 * FIX APPLIED vs. original proposal: intentAge and drift are REQUIRED to already
 * be normalized to [0,1] by the caller (GateMetrics enforces this by type/contract).
 * The original proposal squared a possibly-unnormalized intentAge directly, which
 * violates the project's own bounded-state invariant — an unnormalized intentAge^2
 * term grows unboundedly as an intent approaches its 72h expiry, right when you
 * need the score to be MOST stable, not least. Squaring a [0,1] value is safe.
 *
 * TIER: Verified operational reality as a risk score. NOT a control-theoretic
 * stability guarantee — do not represent it as one in docs, PRs, or diligence
 * materials.
 */

import { GateMetrics, RiskScoreSnapshot } from './types';

export interface RiskWeights {
  exposure: number;
  failures: number;
  entropy: number;
  velocity: number;
  acceleration: number;
  intentAgeSquared: number;
  drift: number;
  driftIntentAgeCross: number;
  convergencePenalty: number;
}

/** Default weights are UNDERIVED — same P0 caveat as every other threshold in this
 *  package. Treat as a starting point for Phase 3 observation, tune from empirical
 *  false-positive/false-negative rates before any Phase 4 enforcement. */
export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  exposure: 0.25,
  failures: 0.2,
  entropy: 0.1,
  velocity: 0.1,
  acceleration: 0.1,
  intentAgeSquared: 0.1,
  drift: 0.15,
  driftIntentAgeCross: 0.1,
  convergencePenalty: 0.2,
};

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Asserts every metric is in [0,1] — fails loudly rather than silently producing
 *  an unbounded score. This is the guard that prevents the P0 violation described
 *  above from recurring. */
function assertNormalized(m: GateMetrics): void {
  for (const [key, value] of Object.entries(m)) {
    if (value < 0 || value > 1 || Number.isNaN(value)) {
      throw new AIRUnnormalizedMetricError(key, value);
    }
  }
}

export class AIRUnnormalizedMetricError extends Error {
  constructor(public readonly field: string, public readonly value: number) {
    super(
      `GateMetrics.${field} = ${value} is outside [0,1]. All gate outputs must be normalized ` +
        `before reaching the risk score engine — this is a bounded-state invariant violation, ` +
        `not a cosmetic issue.`
    );
    this.name = 'AIRUnnormalizedMetricError';
  }
}

/**
 * Composite risk score in [0, ~1.3] (the max possible sum of weights times 1.0 each
 * plus cross terms; in practice stays much lower). This is an early-warning
 * indicator, not a proven-stable control quantity.
 */
export function computeRiskScore(m: GateMetrics, weights: RiskWeights = DEFAULT_RISK_WEIGHTS): number {
  assertNormalized(m);
  return (
    weights.exposure * m.exposure +
    weights.failures * m.failures +
    weights.entropy * m.entropy +
    weights.velocity * m.velocity +
    weights.acceleration * m.acceleration +
    weights.intentAgeSquared * m.intentAge ** 2 +
    weights.drift * m.drift +
    weights.driftIntentAgeCross * m.drift * m.intentAge +
    weights.convergencePenalty * m.convergencePenalty
  );
}

/** @deprecated Use computeRiskScore. Kept only so existing call sites referencing
 *  the original "Lyapunov" naming from the proposal doc don't break silently. */
export const computeLyapunov = computeRiskScore;

export function computeDeltaScore(currentScore: number, previousScore: number): number {
  return currentScore - previousScore;
}

export function computeSmoothedScore(
  currentScore: number,
  previousSmoothed: number,
  alpha: number
): number {
  return alpha * currentScore + (1 - alpha) * previousSmoothed;
}

export function takeSnapshot(
  m: GateMetrics,
  previousSmoothed: number,
  alpha: number,
  timestamp: number = Date.now(),
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): RiskScoreSnapshot {
  const score = computeRiskScore(m, weights);
  const smoothedScore = computeSmoothedScore(score, previousSmoothed, alpha);
  return { timestamp, score, smoothedScore };
}
