/**
 * Hydro-Bayesian Kernel (HBK)
 * --------------------------
 * Sequential Bayesian state estimation over a discrete location grid.
 *
 *   P(S_t | O_1:t) ∝ P(O_t | S_t) · P(S_t | S_{t-1})
 *
 * Location is inferred from distance-attenuated acoustic/pressure amplitude
 * at fixed listening taps; leak magnitude is profiled from the live flow
 * surplus. Mining-blast noise is handled as a Poisson mixture and
 * down-weighted (not excluded) to suppress false positives.
 *
 * Reference: vvu_hbk_bayesian.html (HBK section).
 * Classification: SIMULATION — NOT MUNICIPAL OPERATIONAL DATA.
 */

// ─── Grid configuration ──────────────────────────────────────────────────

export const GRID_N = 32;                 // 32×32 candidate-location grid
export const DOMAIN_HALF = 4;              // scene units, matches DMA boundary [-4, 4]
export const CELL_SIZE = (2 * DOMAIN_HALF) / GRID_N;
export const METERS_PER_UNIT = 1500;       // scene-unit → real-world meters
export const INITIAL_RADIUS_M = DOMAIN_HALF * Math.SQRT2 * METERS_PER_UNIT;

export interface SensorNode {
  name: string;
  x: number;
  z: number;
}

/** Fixed listening taps — reuse pipe/sensor geometry positions. */
export const SENSOR_NODES: SensorNode[] = [
  { name: 'FLOW',  x: -2, z: 0 },
  { name: 'PRESS', x: 2,  z: 0 },
  { name: 'BR_N',  x: 0,  z: 4 },
  { name: 'BR_S',  x: 0,  z: -4 },
];

// ─── State ────────────────────────────────────────────────────────────────

export interface TrueLeak {
  x: number;
  z: number;
  q: number;       // magnitude
}

export interface HBKState {
  baselineFlow: number;
  baselinePressure: number;
  currentFlow: number;
  currentPressure: number;
  leakActive: boolean;
  trueLeak: TrueLeak | null;        // hidden ground truth (blind fault injection)
  blastActive: boolean;
  blastFiltered: number;
  posteriorPeak: number;            // max posterior mass (0..1)
  credibleRadiusM: number;          // 95% credible radius in meters
  mapCell: { x: number; z: number }; // MAP estimate (scene units)
  ticks: number;
  verified: boolean;
  verifiedAtTick: number | null;
  localizationErrorM: number | null; // |MAP - trueLeak| in meters (computed on verify)
}

export function createInitialState(): HBKState {
  return {
    baselineFlow: 97.0,
    baselinePressure: 48.4,
    currentFlow: 97.0,
    currentPressure: 48.4,
    leakActive: false,
    trueLeak: null,
    blastActive: false,
    blastFiltered: 0,
    posteriorPeak: 0,
    credibleRadiusM: INITIAL_RADIUS_M,
    mapCell: { x: 0, z: 0 },
    ticks: 0,
    verified: false,
    verifiedAtTick: null,
    localizationErrorM: null,
  };
}

// ─── RNG (seedable for reproducibility) ───────────────────────────────────

/**
 * Mulberry32 — small, fast, seedable PRNG. Defaulting to Math.random when
 * seed is null keeps the live demo non-deterministic, but exposing a seed
 * makes the audit trail reproducible (matches the EIS Zero-Fabrication
 * reproducibility principle).
 */
export class RNG {
  private s: number | null;
  constructor(seed: number | null = null) {
    this.s = seed;
  }
  next(): number {
    if (this.s === null) return Math.random();
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function gaussianNoise(mean: number, sigma: number, rng: RNG): number {
  const u = 1 - rng.next();
  const v = rng.next();
  return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Forward model ────────────────────────────────────────────────────────

/** Predicted signal amplitude at a listening tap given a candidate leak. */
export function predictedAmplitude(
  cx: number,
  cz: number,
  q: number,
  sensor: SensorNode,
): number {
  const dx = cx - sensor.x;
  const dz = cz - sensor.z;
  const d2 = dx * dx + dz * dz;
  const decay = 2.2;
  return q * 3.2 * Math.exp(-d2 / (2 * decay * decay));
}

export function cellCenter(i: number, j: number): { x: number; z: number } {
  return {
    x: -DOMAIN_HALF + (i + 0.5) * CELL_SIZE,
    z: -DOMAIN_HALF + (j + 0.5) * CELL_SIZE,
  };
}

// ─── Observation simulation ──────────────────────────────────────────────

export type ObservationMap = Record<string, number>;

/**
 * Simulate sensor observations from the hidden ground-truth leak.
 * If blastActive, a Poisson-arriving impulse mixture (mining blast transients)
 * is added to the readings.
 */
export function simulateObservations(state: HBKState, rng: RNG): ObservationMap {
  const obs: ObservationMap = {};
  const q = state.trueLeak ? state.trueLeak.q : 0;
  const tx = state.trueLeak ? state.trueLeak.x : 0;
  const tz = state.trueLeak ? state.trueLeak.z : 0;
  for (const s of SENSOR_NODES) {
    let val = predictedAmplitude(tx, tz, q, s) + gaussianNoise(0, 0.15, rng);
    if (state.blastActive) {
      // Poisson-arriving impulse mixture
      if (rng.next() < 0.4) val += 1.5 + rng.next() * 1.5;
    }
    obs[s.name] = val;
  }
  return obs;
}

// ─── Sequential Bayesian update ──────────────────────────────────────────

/**
 * Sequential Bayesian update: posterior(x) ∝ prior(x) · L(O_t | x)
 *
 * Magnitude q is profiled from the live flow surplus each tick.
 * Mixture-noise robustness: widen (down-weight) the likelihood during a
 * blast instead of hard-excluding samples — this is the FPR-suppression
 * mixture.
 *
 * Numerical stability: uses the log-sum-exp trick. When qHat (estimated
 * from flow surplus) doesn't match the true magnitude q, the raw Gaussian
 * likelihood exp(-diff²/2σ²) underflows to zero for all cells, collapsing
 * the posterior. By computing in log-space and subtracting the max log-value
 * before exponentiating, we preserve the relative likelihood ratios without
 * underflow. A prior floor (1e-12) prevents log(0) and allows the posterior
 * to recover from a near-collapsed state as qHat converges toward q.
 */
export function bayesianUpdate(
  posterior: Float64Array,
  state: HBKState,
  obs: ObservationMap,
): Float64Array {
  const qHat = Math.max(0.5, state.currentFlow - state.baselineFlow);
  const sigma = state.blastActive ? 0.9 : 0.18; // widen during blast
  const newPosterior = new Float64Array(GRID_N * GRID_N);
  const logPost = new Float64Array(GRID_N * GRID_N);
  const PRIOR_FLOOR = 1e-12;

  // Pass 1: compute log-posterior = log(prior) + log(likelihood), track max
  let maxLog = -Infinity;
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const idx = i * GRID_N + j;
      const { x, z } = cellCenter(i, j);
      let logL = 0;
      for (const s of SENSOR_NODES) {
        const pred = predictedAmplitude(x, z, qHat, s);
        const diff = obs[s.name] - pred;
        logL += -(diff * diff) / (2 * sigma * sigma);
      }
      const logPrior = Math.log(Math.max(posterior[idx], PRIOR_FLOOR));
      const logVal = logPrior + logL;
      logPost[idx] = logVal;
      if (logVal > maxLog) maxLog = logVal;
    }
  }

  // Pass 2: log-sum-exp normalization (subtract max to prevent underflow)
  let total = 0;
  for (let k = 0; k < logPost.length; k++) {
    newPosterior[k] = Math.exp(logPost[k] - maxLog);
    total += newPosterior[k];
  }
  if (total > 0) {
    for (let k = 0; k < newPosterior.length; k++) newPosterior[k] /= total;
  }
  return newPosterior;
}

// ─── MAP + 95% credible radius ──────────────────────────────────────────

export interface MapResult {
  mapCell: { x: number; z: number };
  posteriorPeak: number;
  credibleRadiusM: number;
}

/**
 * MAP estimate + 95% credible radius (smallest radius around the MAP cell
 * containing 95% of the posterior mass).
 */
export function computeMapAndRadius(posterior: Float64Array): MapResult {
  let maxP = -1;
  let mi = 0;
  let mj = 0;
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const idx = i * GRID_N + j;
      if (posterior[idx] > maxP) {
        maxP = posterior[idx];
        mi = i;
        mj = j;
      }
    }
  }
  const mapCell = cellCenter(mi, mj);

  // Smallest radius around MAP containing 95% of posterior mass
  const cells: Array<{ p: number; d: number }> = [];
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const idx = i * GRID_N + j;
      const c = cellCenter(i, j);
      cells.push({
        p: posterior[idx],
        d: Math.hypot(c.x - mapCell.x, c.z - mapCell.z),
      });
    }
  }
  cells.sort((a, b) => b.p - a.p);
  let cum = 0;
  let radius = 0;
  for (const c of cells) {
    cum += c.p;
    if (c.d > radius) radius = c.d;
    if (cum >= 0.95) break;
  }

  return {
    mapCell,
    posteriorPeak: maxP,
    credibleRadiusM: radius * METERS_PER_UNIT,
  };
}

// ─── Tick orchestration ─────────────────────────────────────────────────

export interface TickResult {
  posterior: Float64Array;
  state: HBKState;
  verified: boolean;
  evidence: Array<{ type: string; id: string; value: string }>;
  logLines: Array<{ level: string; message: string }>;
}

/**
 * Run one Bayesian tick: converge live hydraulic telemetry toward the true
 * leak signature, simulate observations, update posterior, compute MAP.
 *
 * Verification rule (per HTML reference):
 *   verified when credibleRadiusM ≤ 500 AND posteriorPeak > 0.04
 */
export function bayesTick(
  posterior: Float64Array,
  state: HBKState,
  rng: RNG,
): TickResult {
  const logLines: Array<{ level: string; message: string }> = [];
  const evidence: Array<{ type: string; id: string; value: string }> = [];

  // Shallow-copy state so React detects the change (setState(sameRef) bails out).
  const next: HBKState = { ...state };
  next.ticks = state.ticks + 1;

  // Live hydraulic telemetry converges toward the true leak signature
  const targetFlow = state.baselineFlow + (state.trueLeak?.q ?? 0);
  const targetPressure =
    state.baselinePressure - (state.trueLeak?.q ?? 0) * 0.18;
  next.currentFlow =
    state.currentFlow +
    (targetFlow - state.currentFlow) * 0.35 +
    gaussianNoise(0, 0.4, rng);
  next.currentPressure =
    state.currentPressure +
    (targetPressure - state.currentPressure) * 0.35 +
    gaussianNoise(0, 0.08, rng);

  // Sequential Bayesian update
  const obs = simulateObservations(next, rng);
  const newPosterior = bayesianUpdate(posterior, next, obs);
  const { mapCell, posteriorPeak, credibleRadiusM } = computeMapAndRadius(newPosterior);

  next.mapCell = mapCell;
  next.posteriorPeak = posteriorPeak;
  next.credibleRadiusM = credibleRadiusM;

  if (next.blastActive) {
    next.blastFiltered = state.blastFiltered + 1;
    if (next.ticks % 3 === 0) {
      logLines.push({
        level: 'BAYES',
        message: 'Blast-corrupted samples down-weighted (mixture likelihood)',
      });
    }
  }

  // Verification
  // Gate: qHat must converge toward the true flow surplus before allowing
  // verification. Early ticks have qHat << q (the flow hasn't risen yet),
  // which biases the posterior toward cells near sensors (highest predicted
  // amplitude). Requiring ticks >= MIN_VERIFY_TICKS AND the flow surplus to
  // exceed 5.0 L/s ensures the magnitude estimate has stabilized before we
  // trust the spatial posterior.
  let verified = false;
  const flowSurplus = next.currentFlow - next.baselineFlow;
  const qHatConverged = flowSurplus >= 5.0; // ~40% of typical q (8-18)
  const minTicksMet = next.ticks >= MIN_VERIFY_TICKS;
  if (
    !next.verified &&
    minTicksMet &&
    qHatConverged &&
    next.credibleRadiusM <= VERIFICATION_TARGET_RADIUS_M &&
    next.posteriorPeak > VERIFICATION_MIN_PEAK
  ) {
    verified = true;
    next.verified = true;
    next.verifiedAtTick = next.ticks;

    if (next.trueLeak) {
      const errM =
        Math.hypot(
          mapCell.x - next.trueLeak.x,
          mapCell.z - next.trueLeak.z,
        ) * METERS_PER_UNIT;
      next.localizationErrorM = Math.round(errM);
      logLines.push({
        level: 'SUCCESS',
        message: `HBK: VERIFIED_CANDIDATE. 95% credible radius ${Math.round(next.credibleRadiusM)}m ≤ 500m target`,
      });
      logLines.push({
        level: 'BAYES',
        message: `Localization error vs ground truth: ${Math.round(errM)}m`,
      });
    }

    // Spawn corroborating evidence (mirrors the HTML reference)
    if (next.trueLeak) {
      evidence.push({
        type: 'SCADA_FLOW',
        id: 'FM01',
        value: `Flow surge +${((next.trueLeak.q / next.baselineFlow) * 100).toFixed(1)}%`,
      });
      evidence.push({
        type: 'SCADA_PRESS',
        id: 'PT14',
        value: `Pressure drop ${(next.baselinePressure - next.currentPressure).toFixed(1)}m`,
      });
      evidence.push({
        type: 'ACOUSTIC',
        id: 'AC-07',
        value: 'Posterior concentrated within 500m (95% CI)',
      });
    }
  } else if (next.ticks > TICK_BUDGET && !next.verified) {
    logLines.push({
      level: 'ALERT',
      message: 'Bayesian search exceeded tick budget — insufficient discriminating evidence',
    });
  }

  return { posterior: newPosterior, state: next, verified, evidence, logLines };
}

// ─── Blind fault injection ───────────────────────────────────────────────

/**
 * Inject a hidden ground-truth leak — the algorithm never sees this directly.
 * Resets the posterior to a flat (uninformative) prior over the full DMA.
 */
export function injectBlindLeak(state: HBKState, rng: RNG): {
  state: HBKState;
  trueLeak: TrueLeak;
} {
  const trueX = (rng.next() * 2 - 1) * 3.2;
  const trueZ = (rng.next() * 2 - 1) * 3.2;
  const trueQ = 8 + rng.next() * 10;
  const trueLeak: TrueLeak = { x: trueX, z: trueZ, q: trueQ };

  const next: HBKState = {
    ...state,
    leakActive: true,
    verified: false,
    verifiedAtTick: null,
    blastFiltered: 0,
    trueLeak,
    ticks: 0,
    posteriorPeak: 0,
    credibleRadiusM: INITIAL_RADIUS_M,
    localizationErrorM: null,
  };
  return { state: next, trueLeak };
}

/** Reset posterior to uniform prior. */
export function uniformPrior(): Float64Array {
  const p = new Float64Array(GRID_N * GRID_N);
  p.fill(1 / (GRID_N * GRID_N));
  return p;
}

// ─── Posterior → color (for heatmap visualization) ──────────────────────

/**
 * Map a normalized posterior value [0,1] to an HSL color matching the
 * kernel theme: dim blue (low) → cyan → green (high).
 * Matches the HTML reference: HSL(0.75 - 0.75*norm, 1.0, 0.12 + 0.35*norm)
 */
export function posteriorToColor(norm: number): { h: number; s: number; l: number } {
  const clamped = Math.max(0, Math.min(1, norm));
  return {
    h: 0.75 - 0.75 * clamped,
    s: 1.0,
    l: 0.12 + 0.35 * clamped,
  };
}

// ─── Blast handling ──────────────────────────────────────────────────────

/** Activate mining-blast transient (Poisson impulse train). */
export function activateBlast(state: HBKState): HBKState {
  return { ...state, blastActive: true };
}

/** Deactivate blast transient — restore nominal σ. */
export function deactivateBlast(state: HBKState): HBKState {
  return { ...state, blastActive: false };
}

// ─── Verification helpers ────────────────────────────────────────────────

export const VERIFICATION_TARGET_RADIUS_M = 500;
export const VERIFICATION_MIN_PEAK = 0.04;
export const MIN_VERIFY_TICKS = 15; // give qHat time to converge + dramatic search phase (~6s)
export const TICK_BUDGET = 150;

export function isVerifiable(state: HBKState): boolean {
  return (
    state.credibleRadiusM <= VERIFICATION_TARGET_RADIUS_M &&
    state.posteriorPeak > VERIFICATION_MIN_PEAK
  );
}
