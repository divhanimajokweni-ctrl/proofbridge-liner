/**
 * packages/trust-runtime/decay-counter.ts
 *
 * P0 fix: adapter failure counters (and any monotonic pressure counter) must decay,
 * or a failure from six months ago still participates in today's decision.
 *
 * Model: x(t) = x0 * e^(-lambda * t), lambda = ln(2) / half_life
 *
 * TIER: Verified operational reality — this is standard exponential decay,
 * not a novel claim. No stability proof implied or required.
 */

import { DecayingCounter } from './types';

export function createDecayingCounter(initial = 0, now: number = Date.now()): DecayingCounter {
  return { value: initial, lastUpdated: now };
}

/** Applies decay in place up to `now`, without adding a new event. Call before reading `.value`. */
export function decayCounter(
  counter: DecayingCounter,
  now: number,
  halfLifeMs: number
): DecayingCounter {
  const elapsed = now - counter.lastUpdated;
  if (elapsed <= 0) return counter;
  const lambda = Math.log(2) / halfLifeMs;
  counter.value = counter.value * Math.exp(-lambda * elapsed);
  counter.lastUpdated = now;
  return counter;
}

/** Records a new event (e.g. a failure), decaying prior state first. */
export function recordEvent(
  counter: DecayingCounter,
  halfLifeMs: number,
  weight = 1,
  now: number = Date.now()
): DecayingCounter {
  decayCounter(counter, now, halfLifeMs);
  counter.value += weight;
  return counter;
}

/** Reads the current decayed value without mutating lastUpdated permanently beyond `now`. */
export function readDecayedValue(
  counter: DecayingCounter,
  halfLifeMs: number,
  now: number = Date.now()
): number {
  const elapsed = now - counter.lastUpdated;
  if (elapsed <= 0) return counter.value;
  const lambda = Math.log(2) / halfLifeMs;
  return counter.value * Math.exp(-lambda * elapsed);
}

/** Normalizes a decayed counter value to [0,1] against a saturation constant for use in GateMetrics. */
export function normalizeCounter(value: number, saturation: number): number {
  if (saturation <= 0) return 0;
  return Math.min(1, Math.max(0, value / saturation));
}
