/**
 * packages/trust-runtime/circuit-breaker.ts
 *
 * Replaces a binary OPEN/CLOSED breaker with a 5-state machine that has
 * hysteresis, so the system doesn't oscillate at a threshold boundary.
 *
 * State evolution:
 *   NORMAL -> WARNING -> TRIPPED -> RECOVERY -> NORMAL
 *   TRIPPED -> ESCALATED (after repeated trips within a cooldown window)
 *
 * TIER: Verified operational reality — standard hysteresis state machine pattern.
 */

import { AIRState, AIRConfig } from './types';

export interface CircuitBreakerState {
  current: AIRState;
  /** Timestamp the current state was entered. */
  enteredAt: number;
  /** Count of TRIPPED entries within the escalation window, for escalation logic. */
  tripCountInWindow: number;
  /** Start of the current escalation-counting window. */
  escalationWindowStart: number;
}

export function createCircuitBreakerState(now: number = Date.now()): CircuitBreakerState {
  return { current: 'NORMAL', enteredAt: now, tripCountInWindow: 0, escalationWindowStart: now };
}

export interface EvaluationInput {
  score: number;
  deltaScore: number;
  now: number;
}

export interface EscalationPolicy {
  /** Rolling window over which repeated trips count toward escalation. */
  windowMs: number;
  /** Number of TRIPPED entries within windowMs that forces ESCALATED. */
  tripsToEscalate: number;
  /** Minimum time RECOVERY must hold before returning to NORMAL, to prevent flapping. */
  minRecoveryHoldMs: number;
}

export const DEFAULT_ESCALATION_POLICY: EscalationPolicy = {
  windowMs: 60 * 60 * 1000, // 1 hour
  tripsToEscalate: 3,
  minRecoveryHoldMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Evaluates the next state given current state, score, and rate-of-change.
 * This is a pure function — the caller owns persisting the returned state.
 * In `observe` mode (config.enforceAt), this still computes state transitions
 * for logging/telemetry but callers should NOT act on TRIPPED/ESCALATED by
 * halting execution until Phase 4.
 */
export function evaluateCircuitBreaker(
  state: CircuitBreakerState,
  input: EvaluationInput,
  config: AIRConfig,
  policy: EscalationPolicy = DEFAULT_ESCALATION_POLICY
): CircuitBreakerState {
  const { score, deltaScore, now } = input;
  const { riskScoreThresholds: rt, deltaScoreThresholds: dt } = config;

  const rawTarget: AIRState =
    score >= rt.escalated || deltaScore >= dt.escalated
      ? 'ESCALATED'
      : score >= rt.tripped || deltaScore >= dt.tripped
      ? 'TRIPPED'
      : score >= rt.warning || deltaScore >= dt.warning
      ? 'WARNING'
      : 'NORMAL';

  // Reset escalation window if it has expired.
  let tripCountInWindow = state.tripCountInWindow;
  let escalationWindowStart = state.escalationWindowStart;
  if (now - escalationWindowStart > policy.windowMs) {
    tripCountInWindow = 0;
    escalationWindowStart = now;
  }

  // Hysteresis: don't leave TRIPPED/ESCALATED straight to NORMAL — force a RECOVERY hold first.
  if (
    (state.current === 'TRIPPED' || state.current === 'ESCALATED') &&
    rawTarget === 'NORMAL'
  ) {
    return {
      current: 'RECOVERY',
      enteredAt: now,
      tripCountInWindow,
      escalationWindowStart,
    };
  }

  if (state.current === 'RECOVERY') {
    if (rawTarget === 'TRIPPED' || rawTarget === 'ESCALATED') {
      // Instability during recovery — go straight back, don't finish the hold.
      return finalizeTransition(rawTarget, now, tripCountInWindow, escalationWindowStart, policy);
    }
    const held = now - state.enteredAt;
    if (held < policy.minRecoveryHoldMs) {
      return state; // stay in RECOVERY until the hold completes
    }
    return { current: 'NORMAL', enteredAt: now, tripCountInWindow: 0, escalationWindowStart: now };
  }

  if (rawTarget === state.current) {
    return state; // no transition
  }

  return finalizeTransition(rawTarget, now, tripCountInWindow, escalationWindowStart, policy);
}

function finalizeTransition(
  target: AIRState,
  now: number,
  tripCountInWindow: number,
  escalationWindowStart: number,
  policy: EscalationPolicy
): CircuitBreakerState {
  let nextTripCount = tripCountInWindow;
  let nextTarget = target;

  if (target === 'TRIPPED') {
    nextTripCount = tripCountInWindow + 1;
    if (nextTripCount >= policy.tripsToEscalate) {
      nextTarget = 'ESCALATED';
    }
  }

  return {
    current: nextTarget,
    enteredAt: now,
    tripCountInWindow: nextTripCount,
    escalationWindowStart,
  };
}
