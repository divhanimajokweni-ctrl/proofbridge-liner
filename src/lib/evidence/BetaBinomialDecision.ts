/**
 * β-Binomial Decision Layer
 * -------------------------
 * Risk analysis using a Beta-Binomial hierarchical model with intra-cluster
 * correlation ρ. Samples segment failure rates from Beta(α, β) where:
 *
 *   α = μ(1−ρ)/ρ
 *   β = (1−μ)(1−ρ)/ρ
 *
 * μ = baseline segment failure rate, ρ = intra-cluster correlation.
 *
 * Compares a "treatment" DMA (near the detected leak zone, riskMultiplier > 1)
 * against a "control" DMA (nominal risk) via Monte Carlo simulation.
 *
 * Outputs: Relative Risk (RR), Risk Difference (RD), Information Density.
 *
 * Reference: vvu_hbk_bayesian.html (Decision Support Layer section).
 */

import { RNG, gaussianNoise } from './HydroBayesianKernel';

// ─── Samplers ────────────────────────────────────────────────────────────

/**
 * Marsaglia-Tsang gamma sampler. Used to sample Beta(α, β) variates.
 * For shape < 1, uses the boosting trick (Marsaglia & Tsang 2000).
 */
export function sampleGamma(shape: number, rng: RNG): number {
  if (shape < 1) {
    const u = rng.next();
    return sampleGamma(1 + shape, rng) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number;
    let v: number;
    do {
      x = gaussianNoise(0, 1, rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng.next();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Sample from Beta(α, β) via two Gamma variates. */
export function sampleBeta(a: number, b: number, rng: RNG): number {
  const x = sampleGamma(a, rng);
  const y = sampleGamma(b, rng);
  return x / (x + y);
}

// ─── β-Binomial parameters ───────────────────────────────────────────────

export interface BetaBinomialParams {
  mu: number;   // baseline segment failure rate (default 0.12)
  rho: number;  // intra-cluster correlation (default 0.15)
}

export const DEFAULT_PARAMS: BetaBinomialParams = {
  mu: 0.12,
  rho: 0.15,
};

export function alphaBeta(params: BetaBinomialParams): { a: number; b: number } {
  const { mu, rho } = params;
  return {
    a: (mu * (1 - rho)) / rho,
    b: ((1 - mu) * (1 - rho)) / rho,
  };
}

// ─── Simulation ──────────────────────────────────────────────────────────

/**
 * Simulate one DMA: draw a per-DMA failure rate from Beta(α, β), multiply by
 * the risk multiplier, then run `trials` Bernoulli draws per segment.
 * Returns the realized failure rate.
 */
export function simulateDMA(
  params: BetaBinomialParams,
  nSegments: number,
  trials: number,
  riskMultiplier: number,
  rng: RNG,
): number {
  const { a, b } = alphaBeta(params);
  let fails = 0;
  let total = 0;
  for (let s = 0; s < nSegments; s++) {
    const p = Math.min(0.95, sampleBeta(a, b, rng) * riskMultiplier);
    let f = 0;
    for (let t = 0; t < trials; t++) {
      if (rng.next() < p) f++;
    }
    fails += f;
    total += trials;
  }
  return total > 0 ? fails / total : 0;
}

// ─── Decision result ─────────────────────────────────────────────────────

export interface DecisionResult {
  treatmentRate: number;
  controlRate: number;
  relativeRisk: number;        // RR = treatment / control
  riskDifferencePct: number;   // RD = (treatment - control) × 100
  informationDensity: number;  // 0..100, fused with HBK posterior peak
  params: BetaBinomialParams;
  nSegments: number;
  trials: number;
  treatmentRiskMultiplier: number;
}

/**
 * Run the β-Binomial decision layer.
 *
 * @param params        β-Binomial parameters (μ, ρ)
 * @param posteriorPeak current HBK posterior peak (for information density fusion)
 * @param gridCellCount HBK grid cell count (for information density normalization)
 */
export function runRiskAnalysis(
  params: BetaBinomialParams = DEFAULT_PARAMS,
  posteriorPeak: number = 0,
  gridCellCount: number = 32 * 32,
  rng: RNG = new RNG(),
  opts: { nSegments?: number; trials?: number; treatmentRiskMultiplier?: number } = {},
): DecisionResult {
  const nSegments = opts.nSegments ?? 18;
  const trials = opts.trials ?? 40;
  const treatmentRiskMultiplier = opts.treatmentRiskMultiplier ?? 1.4;

  const treatmentRate = simulateDMA(
    params,
    nSegments,
    trials,
    treatmentRiskMultiplier,
    rng,
  );
  const controlRate = simulateDMA(params, nSegments, trials, 1.0, rng);

  const rr = controlRate > 0 ? treatmentRate / controlRate : 0;
  const rd = (treatmentRate - controlRate) * 100;
  const infoGained =
    posteriorPeak > 0
      ? Math.min(1, (posteriorPeak * gridCellCount) / 40)
      : 0;
  const id = Math.max(0, Math.min(100, 55 + rr * 12 + infoGained * 20));

  return {
    treatmentRate,
    controlRate,
    relativeRisk: rr,
    riskDifferencePct: rd,
    informationDensity: id,
    params,
    nSegments,
    trials,
    treatmentRiskMultiplier,
  };
}

// ─── Interpretation ──────────────────────────────────────────────────────

export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export function classifyRisk(rr: number): RiskTier {
  if (rr >= 2.5) return 'CRITICAL';
  if (rr >= 1.8) return 'HIGH';
  if (rr >= 1.2) return 'MODERATE';
  return 'LOW';
}
