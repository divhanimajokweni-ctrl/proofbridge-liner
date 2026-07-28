/**
 * packages/trust-runtime/intent-aging.ts
 *
 * Addresses the core temporal-chasm problem: an intent signed at Hour 1 may be
 * based on data that's stale or structurally invalid by Hour 48. This decays the
 * intent's effective decision-making weight over its lifetime and hard-expires it
 * at maxIntentAgeMs (default 72h).
 *
 * TIER: Verified operational reality. Straightforward exponential decay on a
 * bounded lifetime — no contraction-mapping or fixed-point proof is claimed here,
 * this purely dampens influence over time (see gate-convergence.ts docstring for
 * why that's a distinct, weaker claim than Banach contraction).
 */

import { Intent } from './types';

export interface IntentWeightResult {
  /** Current decayed weight, in [0, baseWeight]. */
  weight: number;
  /** Normalized age in [0,1], 1.0 meaning fully expired. Feed into GateMetrics.intentAge. */
  normalizedAge: number;
  /** True once the intent has exceeded maxIntentAgeMs and must be rejected/re-signed. */
  expired: boolean;
}

/**
 * Computes the intent's current decayed weight and normalized age.
 *
 * decayFactor(t) = k_base * e^(-lambda * elapsedHours)
 * lambda is derived so that decayFactor reaches `floorAtExpiry` exactly at maxIntentAgeMs,
 * giving a principled (not arbitrary) decay rate tied to the actual expiry window.
 */
export function evaluateIntentWeight(
  intent: Intent,
  now: number,
  maxIntentAgeMs: number,
  floorAtExpiry = 0.01
): IntentWeightResult {
  const elapsedMs = now - intent.createdAt;
  const normalizedAge = Math.min(1, Math.max(0, elapsedMs / maxIntentAgeMs));
  const expired = elapsedMs >= maxIntentAgeMs;

  if (expired) {
    return { weight: 0, normalizedAge: 1, expired: true };
  }

  // Solve lambda such that e^(-lambda * maxIntentAgeMs) == floorAtExpiry
  const lambda = -Math.log(floorAtExpiry) / maxIntentAgeMs;
  const decayFactor = Math.exp(-lambda * elapsedMs);
  const weight = intent.baseWeight * decayFactor;

  return { weight, normalizedAge, expired: false };
}

/** Convenience guard for the gate pipeline — throws if the intent must be halted. */
export function assertIntentNotExpired(intent: Intent, now: number, maxIntentAgeMs: number): void {
  const { expired } = evaluateIntentWeight(intent, now, maxIntentAgeMs);
  if (expired) {
    throw new AIRIntentExpiredError(intent.id, now - intent.createdAt, maxIntentAgeMs);
  }
}

export class AIRIntentExpiredError extends Error {
  constructor(
    public readonly intentId: string,
    public readonly ageMs: number,
    public readonly maxAgeMs: number
  ) {
    super(
      `Intent ${intentId} expired: age ${Math.round(ageMs / 1000)}s exceeds max ${Math.round(
        maxAgeMs / 1000
      )}s`
    );
    this.name = 'AIRIntentExpiredError';
  }
}
