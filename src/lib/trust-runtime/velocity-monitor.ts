/**
 * packages/trust-runtime/velocity-monitor.ts
 *
 * Gate C (Velocity) and Gate D (Acceleration).
 *
 * P0 bottleneck this addresses: a single 72h-denominator derivative dilutes any
 * 5-minute catastrophic drain to statistical invisibility. This computes the
 * derivative at multiple simultaneous time resolutions and compares the local
 * (5m) rate against the macro (72h) trend.
 *
 * TIER: The multi-window comparison is a legitimate, verified-reality rate-limiting
 * pattern. It is NOT a rigorous multi-dimensional gradient in the differential-
 * geometry sense — it's several plain first differences compared against each
 * other. Named/commented accordingly.
 *
 * Raw single-sample derivatives are noisy; smoothedVelocity applies an EWMA
 * before it's used for acceleration comparison, per the noise-reduction guidance.
 */

export interface ExposureSample {
  timestamp: number;
  exposure: number;
}

export interface VelocityReading {
  window: '5m' | '1h' | '24h' | '72h';
  velocity: number; // units of exposure per second
}

const WINDOW_MS: Record<VelocityReading['window'], number> = {
  '5m': 5 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
};

/** Finds the sample closest to (but not after) `targetTime` in a time-ordered sample array. */
function findSampleAt(samples: readonly ExposureSample[], targetTime: number): ExposureSample | null {
  let candidate: ExposureSample | null = null;
  for (const s of samples) {
    if (s.timestamp <= targetTime) {
      candidate = s;
    } else {
      break;
    }
  }
  return candidate;
}

/** Computes velocity (exposure/sec) over each window, using the earliest available
 *  sample at or before (now - window) as the baseline. Returns null for a window
 *  if there isn't enough history yet — callers should skip that window's gate
 *  rather than treat a missing baseline as zero velocity. */
export function computeMultiWindowVelocity(
  samples: readonly ExposureSample[],
  now: number
): Partial<Record<VelocityReading['window'], number>> {
  const current = findSampleAt(samples, now);
  if (!current) return {};

  const result: Partial<Record<VelocityReading['window'], number>> = {};
  for (const window of Object.keys(WINDOW_MS) as VelocityReading['window'][]) {
    const target = now - WINDOW_MS[window];
    const baseline = findSampleAt(samples, target);
    if (!baseline || baseline.timestamp >= current.timestamp) continue;
    const dt = (current.timestamp - baseline.timestamp) / 1000; // seconds
    if (dt <= 0) continue;
    result[window] = (current.exposure - baseline.exposure) / dt;
  }
  return result;
}

/** EWMA smoothing over a rolling velocity history to reduce single-sample noise. */
export function smoothVelocity(history: readonly number[], alpha = 0.3): number {
  if (history.length === 0) return 0;
  let smoothed = history[0];
  for (let i = 1; i < history.length; i++) {
    smoothed = alpha * history[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

/** Gate C check: local (5m) velocity must not exceed maxVelocity. */
export function checkVelocityGate(
  velocities: Partial<Record<VelocityReading['window'], number>>,
  maxVelocity: number
): { tripped: boolean; localVelocity: number | null } {
  const local = velocities['5m'] ?? null;
  if (local === null) return { tripped: false, localVelocity: null };
  return { tripped: Math.abs(local) > maxVelocity, localVelocity: local };
}

/** Gate D check: local (5m) velocity must not deviate too sharply from the 72h
 *  macro trend. This is the acceleration/structural-break detector. */
export function checkAccelerationGate(
  velocities: Partial<Record<VelocityReading['window'], number>>,
  maxAcceleration: number
): { tripped: boolean; deviation: number | null } {
  const local = velocities['5m'];
  const macro = velocities['72h'];
  if (local === undefined || macro === undefined) return { tripped: false, deviation: null };
  const deviation = Math.abs(local - macro);
  return { tripped: deviation > maxAcceleration, deviation };
}

/** Normalizes a velocity/acceleration reading to [0,1] against its threshold, for GateMetrics. */
export function normalizeAgainstThreshold(value: number, threshold: number): number {
  if (threshold <= 0) return 0;
  return Math.min(1, Math.abs(value) / threshold);
}
