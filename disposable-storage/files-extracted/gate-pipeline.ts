/**
 * packages/trust-runtime/gate-pipeline.ts
 *
 * Orchestrates: Temporal Validity -> Convergence -> Accumulation -> Velocity ->
 * Acceleration -> State Drift -> Risk Score -> Circuit Breaker.
 *
 * Runs in `config.enforceAt` mode ('observe' | 'enforce'). Per the phased rollout
 * plan (Phase 1-3 = observe, Phase 4 = enforce), this pipeline ALWAYS computes and
 * returns full results, but only throws/halts execution when enforceAt === 'enforce'.
 * This lets you wire it into the real request path from day one for telemetry
 * without risking false-positive halts before thresholds are empirically tuned.
 *
 * TIER: Orchestration logic is verified-reality. The gates it calls carry their
 * own tier notes (see each file) — this file does not upgrade any of their claims.
 */

import { AIRConfig, GateMetrics, Intent, DEFAULT_AIR_CONFIG } from './types';
import { evaluateIntentWeight, assertIntentNotExpired } from './intent-aging';
import { checkDriftGate, normalizedDrift, StateVector } from './state-drift';
import {
  ExposureSample,
  computeMultiWindowVelocity,
  checkVelocityGate,
  checkAccelerationGate,
  normalizeAgainstThreshold,
} from './velocity-monitor';
import { computeRiskScore, computeDeltaScore, computeSmoothedScore } from './risk-score-engine';
import {
  CircuitBreakerState,
  evaluateCircuitBreaker,
  EscalationPolicy,
  DEFAULT_ESCALATION_POLICY,
} from './circuit-breaker';
import { AIRState } from './types';

export interface GatePipelineInput {
  intent: Intent;
  currentState: StateVector;
  exposureHistory: readonly ExposureSample[];
  /** [0,1] entropy/contradiction score from the Epistemic Runtime. */
  entropy: number;
  /** [0,1] normalized failure pressure, already decayed (see decay-counter.ts). */
  failures: number;
  /** [0,1] Gate A convergence penalty — 0 if contracting normally. */
  convergencePenalty: number;
  previousSmoothedScore: number;
  previousBreakerState: CircuitBreakerState;
  now: number;
}

export interface GatePipelineResult {
  metrics: GateMetrics;
  score: number;
  deltaScore: number;
  smoothedScore: number;
  breakerState: CircuitBreakerState;
  halted: boolean;
  haltReason: string | null;
}

export class AIRHaltedError extends Error {
  constructor(public readonly reason: string, public readonly state: AIRState) {
    super(`AIR pipeline halted [${state}]: ${reason}`);
    this.name = 'AIRHaltedError';
  }
}

export function runGatePipeline(
  input: GatePipelineInput,
  config: AIRConfig = DEFAULT_AIR_CONFIG,
  escalationPolicy: EscalationPolicy = DEFAULT_ESCALATION_POLICY
): GatePipelineResult {
  const { intent, currentState, exposureHistory, entropy, failures, convergencePenalty, now } = input;
  const enforcing = config.enforceAt === 'enforce';

  // Gate 0: Temporal Validity
  if (enforcing) {
    assertIntentNotExpired(intent, now, config.maxIntentAgeMs);
  }
  const { normalizedAge } = evaluateIntentWeight(intent, now, config.maxIntentAgeMs);

  // Gate E: State Drift (computed here, applied to composite score; hard-gate optional)
  const driftResult = checkDriftGate(currentState, intent.snapshotState, config.maxDrift);

  // Gate C/D: Velocity and Acceleration
  const velocities = computeMultiWindowVelocity(exposureHistory, now);
  const velocityGate = checkVelocityGate(velocities, config.maxVelocity);
  const accelerationGate = checkAccelerationGate(velocities, config.maxAcceleration);
  const normalizedVelocity =
    velocityGate.localVelocity !== null
      ? normalizeAgainstThreshold(velocityGate.localVelocity, config.maxVelocity)
      : 0;
  const normalizedAcceleration =
    accelerationGate.deviation !== null
      ? normalizeAgainstThreshold(accelerationGate.deviation, config.maxAcceleration)
      : 0;

  // Gate B: Accumulation — caller supplies normalized exposure via exposureHistory's
  // latest sample against config.exposureCeiling; this pipeline assumes the caller's
  // ExposureAccumulator already normalized it into GateMetrics.exposure. See
  // exposure-accumulator.ts::normalizedExposure().
  const latestExposureSample = exposureHistory[exposureHistory.length - 1];
  const normalizedExposureValue = latestExposureSample
    ? Math.min(1, Math.max(0, latestExposureSample.exposure / config.exposureCeiling))
    : 0;

  const metrics: GateMetrics = {
    exposure: normalizedExposureValue,
    failures: clamp01(failures),
    entropy: clamp01(entropy),
    velocity: normalizedVelocity,
    acceleration: normalizedAcceleration,
    intentAge: normalizedAge,
    drift: driftResult.normalized,
    convergencePenalty: clamp01(convergencePenalty),
  };

  const score = computeRiskScore(metrics);
  const deltaScore = computeDeltaScore(score, input.previousSmoothedScore);
  const smoothedScore = computeSmoothedScore(score, input.previousSmoothedScore, config.riskScoreSmoothingAlpha);

  const breakerState = evaluateCircuitBreaker(
    input.previousBreakerState,
    { score, deltaScore, now },
    config,
    escalationPolicy
  );

  let halted = false;
  let haltReason: string | null = null;

  if (enforcing) {
    if (breakerState.current === 'TRIPPED' || breakerState.current === 'ESCALATED') {
      halted = true;
      haltReason = `Circuit breaker state=${breakerState.current}, score=${score.toFixed(
        3
      )}, deltaScore=${deltaScore.toFixed(3)}`;
    } else if (driftResult.tripped) {
      halted = true;
      haltReason = `State drift ${driftResult.distance.toFixed(4)} exceeds maxDrift ${config.maxDrift}`;
    } else if (velocityGate.tripped) {
      halted = true;
      haltReason = `Local velocity ${velocityGate.localVelocity?.toFixed(4)} exceeds maxVelocity ${
        config.maxVelocity
      }`;
    } else if (accelerationGate.tripped) {
      halted = true;
      haltReason = `Acceleration deviation ${accelerationGate.deviation?.toFixed(
        4
      )} exceeds maxAcceleration ${config.maxAcceleration}`;
    }
  }

  const result: GatePipelineResult = { metrics, score, deltaScore, smoothedScore, breakerState, halted, haltReason };

  if (halted && haltReason) {
    throw new AIRHaltedError(haltReason, breakerState.current);
  }

  return result;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
