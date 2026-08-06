/**
 * packages/trust-runtime/state-drift.ts
 *
 * Gate E: State Drift. Resolves "is this intent safe?" (true at signing time) from
 * "is this intent STILL safe?" (must hold true at execution time, up to 72h later).
 *
 * State is represented as a compressed numeric vector (not a full graph/tree diff —
 * that's O(n^2)+ and unnecessary). Distance is plain Euclidean distance over that
 * vector. Getting the *feature selection* for that vector right (which fields go
 * into it) is the actual hard problem here and is deployment-specific — this file
 * provides the distance mechanism, not the feature set.
 *
 * TIER: Verified operational reality for the distance mechanism. The specific
 * fields that belong in a given snapshotState vector are a product/domain decision,
 * not something this file can decide generically.
 */

export type StateVector = Record<string, number>;

/** Euclidean distance between two state vectors. Keys present in only one vector
 *  are treated as 0 in the other — this is intentional (a field appearing/disappearing
 *  IS drift), not a bug. */
export function computeStateDistance(current: StateVector, snapshot: StateVector): number {
  const keys = new Set([...Object.keys(current), ...Object.keys(snapshot)]);
  let sumSquares = 0;
  for (const key of keys) {
    const a = current[key] ?? 0;
    const b = snapshot[key] ?? 0;
    sumSquares += (a - b) ** 2;
  }
  return Math.sqrt(sumSquares);
}

/** Normalizes raw drift distance to [0,1] against maxDrift, for GateMetrics.drift. */
export function normalizedDrift(current: StateVector, snapshot: StateVector, maxDrift: number): number {
  if (maxDrift <= 0) return 0;
  const distance = computeStateDistance(current, snapshot);
  return Math.min(1, distance / maxDrift);
}

/** Gate E check. */
export function checkDriftGate(
  current: StateVector,
  snapshot: StateVector,
  maxDrift: number
): { tripped: boolean; distance: number; normalized: number } {
  const distance = computeStateDistance(current, snapshot);
  const normalized = maxDrift > 0 ? Math.min(1, distance / maxDrift) : 0;
  return { tripped: distance > maxDrift, distance, normalized };
}
