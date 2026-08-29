/**
 * EIS — Circuit Breaker (Theorem 5 — fail-closed)
 *
 *   Loss of E(S) => Loss of V(S) => Loss of A(S) => breaker trips
 *
 * The breaker is fail-closed: when tripped, all authorization is revoked
 * until reverification restores the evidence bound.
 */

import {
  CircuitBreakerEvent,
  CircuitBreakerReason,
} from "./types";

/**
 * Determine whether the circuit breaker should trip for a claim.
 *
 * The breaker trips when:
 *   - Evidence has been removed (evidence_lost)
 *   - Claim state dropped below INCONCLUSIVE (verification_failed)
 *   - A safety-critical claim lost safety clearance (safety_violation)
 *   - Evidence has not been refreshed within the staleness window (stale_evidence)
 *   - N_ind dropped below the integrity threshold (integrity_breach)
 */
export function shouldTripBreaker(input: {
  evidenceCount: number;
  previousEvidenceCount: number;
  claimState: string;
  safetyCritical: boolean;
  safetyOk: boolean;
  nInd: number;
  integrityThreshold: number;
  lastEvidenceAt: Date;
  stalenessMs: number;
}): { trip: boolean; reason: CircuitBreakerReason | "" } {
  const {
    evidenceCount,
    previousEvidenceCount,
    claimState,
    safetyCritical,
    safetyOk,
    nInd,
    integrityThreshold,
    lastEvidenceAt,
    stalenessMs,
  } = input;

  // Evidence was lost
  if (evidenceCount < previousEvidenceCount && evidenceCount === 0) {
    return { trip: true, reason: "evidence_lost" };
  }

  // Verification failed — claim state fell below INCONCLUSIVE
  if (
    claimState === "FALSIFIED" ||
    claimState === "STALE" ||
    claimState === "UNTESTED"
  ) {
    return { trip: true, reason: "verification_failed" };
  }

  // Safety-critical claim lost safety clearance
  if (safetyCritical && !safetyOk) {
    return { trip: true, reason: "safety_violation" };
  }

  // Integrity breach — N_ind fell below threshold
  if (nInd < integrityThreshold - 0.5) {
    return { trip: true, reason: "integrity_breach" };
  }

  // Stale evidence — no refresh within window
  const ageMs = Date.now() - lastEvidenceAt.getTime();
  if (ageMs > stalenessMs && evidenceCount > 0) {
    return { trip: true, reason: "stale_evidence" };
  }

  return { trip: false, reason: "" };
}

/**
 * Returns true if the breaker is currently tripped (fail-closed).
 */
export function isTripped(events: CircuitBreakerEvent[]): boolean {
  if (events.length === 0) return false;
  // Sort by trippedAt desc
  const sorted = [...events].sort(
    (a, b) => b.trippedAt.getTime() - a.trippedAt.getTime()
  );
  return sorted[0].triggered;
}

/**
 * Format a breaker reason as human-readable text.
 */
export function describeBreakerReason(reason: CircuitBreakerReason | ""): string {
  switch (reason) {
    case "evidence_lost":
      return "All supporting evidence was removed — fail-closed per Theorem 5";
    case "verification_failed":
      return "Claim verification state collapsed below INCONCLUSIVE";
    case "safety_violation":
      return "Safety-critical claim lost SafeGrid/SafeStacks clearance";
    case "stale_evidence":
      return "Evidence exceeded staleness window without refresh";
    case "integrity_breach":
      return "Provenance integrity N_ind dropped below threshold";
    default:
      return "No breaker trip";
  }
}
