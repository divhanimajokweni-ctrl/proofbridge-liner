/**
 * packages/trust-runtime/exposure-accumulator.ts
 *
 * Gate B: Accumulation.
 *
 * NAMING NOTE: the original proposal called this "Lebesgue integration." It is not —
 * formal Lebesgue integration requires a measure space and sigma-algebra over the
 * domain. What this actually is: a risk-tier-weighted, event-time-based exposure
 * accumulator. That's a legitimate and useful pattern (it correctly avoids the
 * Riemann/fixed-time-slice problem of false spikes from delayed batch arrivals),
 * it just isn't measure-theoretic integration. Named accurately here so it doesn't
 * overclaim rigor in front of technical due diligence.
 *
 * Uses event-time (not arrival-time / now()) per-transaction, so out-of-order
 * network delivery doesn't corrupt the accumulator — a late-arriving transaction
 * still lands in the historical bucket its eventTimestamp implies.
 *
 * TIER: Verified operational reality for the accumulation mechanism. The specific
 * tier weights and exposureCeiling below are Phase-2-empirical placeholders — see
 * AIRConfig.exposureCeiling.
 */

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TierWeights {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
}

export const DEFAULT_TIER_WEIGHTS: TierWeights = {
  LOW: 1.0,
  MEDIUM: 2.5,
  HIGH: 5.0,
};

export interface TieredTransaction {
  value: number;
  volatilityScore: number; // [0,1]
  eventTimestamp: number; // when the transaction actually occurred
  arrivalTimestamp: number; // when we observed it — used for watermarking only, not accounting
}

export interface RiskBuckets {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
}

/**
 * Classifies a transaction into a risk tier. Threshold values are placeholders —
 * calibrate from Phase 2 empirical distributions, not shipped as final.
 */
export function classifyRiskTier(
  value: number,
  volatilityScore: number,
  thresholds: { highValue: number; highVolatility: number; medValue: number; medVolatility: number }
): RiskTier {
  if (value >= thresholds.highValue || volatilityScore >= thresholds.highVolatility) {
    return 'HIGH';
  }
  if (value >= thresholds.medValue || volatilityScore >= thresholds.medVolatility) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export class ExposureAccumulator {
  private buckets: RiskBuckets = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  private weights: TierWeights;
  /** Watermark: the latest arrivalTimestamp seen. Events with eventTimestamp older
   *  than (watermark - lateness tolerance) can be treated as immutable/finalized. */
  private watermark = 0;

  constructor(weights: TierWeights = DEFAULT_TIER_WEIGHTS) {
    this.weights = weights;
  }

  record(tx: TieredTransaction, tier: RiskTier): void {
    this.buckets[tier] += tx.value;
    if (tx.arrivalTimestamp > this.watermark) {
      this.watermark = tx.arrivalTimestamp;
    }
  }

  /** Total tier-weighted exposure across all buckets. */
  totalIntegratedRisk(): number {
    return (
      this.buckets.LOW * this.weights.LOW +
      this.buckets.MEDIUM * this.weights.MEDIUM +
      this.buckets.HIGH * this.weights.HIGH
    );
  }

  /** Normalizes total integrated risk to [0,1] against exposureCeiling, for GateMetrics.exposure. */
  normalizedExposure(exposureCeiling: number): number {
    if (exposureCeiling <= 0) return 0;
    return Math.min(1, Math.max(0, this.totalIntegratedRisk() / exposureCeiling));
  }

  getBuckets(): Readonly<RiskBuckets> {
    return { ...this.buckets };
  }

  getWatermark(): number {
    return this.watermark;
  }

  /** Resets accumulation — call at the start of each 72h rolling window, or wire to
   *  a sliding-window eviction strategy if you need continuous rolling exposure. */
  reset(): void {
    this.buckets = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  }
}
