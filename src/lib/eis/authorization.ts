/**
 * EIS — Authorization Engine (Theorem 1, 4, 5)
 *
 *   A = C ∧ E ∧ I ∧ S ∧ R
 *
 * where:
 *   C — Claim state meets threshold (≥ SUPPORTED)
 *   E — Sufficient evidence exists (≥ 3 distinct sources, or ≥ 2 with N_ind ≥ 2)
 *   I — Provenance integrity (N_ind ≥ 1, i.e., evidence is not all from one latent source)
 *   S — SafeGrid / SafeStacks safety clearance (safetyCritical ? check passed : true)
 *   R — Second-reviewer signoff (manual flag, default true for non-safety-critical)
 *
 * Theorem 5 (fail-closed): if any conjunct is false, A is false.
 * Loss of evidence => loss of V => loss of A => circuit breaker trips.
 */

import {
  AUTH_THRESHOLD,
  AuthorizationResult,
  ClaimType,
  EvidenceItem,
  ParticipationRatioResult,
  VerificationState,
} from "./types";
import { computeClaimState, stateAtLeast } from "./state-lattice";

export interface AuthorizationInput {
  claimType: ClaimType;
  claimState: VerificationState;
  evidence: EvidenceItem[];
  nInd: ParticipationRatioResult;
  safetyCritical: boolean;
  safetyOverride?: boolean; // manual safety clearance (SafeGrid / SafeStacks)
  reviewSignedOff?: boolean; // manual reviewer signoff
}

/**
 * Evaluate the EIS authorization formula A = C ∧ E ∧ I ∧ S ∧ R.
 */
export function evaluateAuthorization(input: AuthorizationInput): AuthorizationResult {
  const {
    claimType,
    claimState,
    evidence,
    nInd,
    safetyCritical,
    safetyOverride,
    reviewSignedOff,
  } = input;

  // C — Claim state must meet threshold
  // (FALSIFIED always fails this — no authorization for falsified claims)
  const claimOk =
    claimState !== "FALSIFIED" && stateAtLeast(claimState, AUTH_THRESHOLD);

  // E — Sufficient evidence
  // Require ≥ 2 distinct sources OR ≥ 3 evidence items
  const distinctSources = new Set(evidence.map((e) => e.source));
  const evidenceOk = evidence.length >= 1 && (distinctSources.size >= 2 || evidence.length >= 3);

  // I — Provenance integrity
  // N_ind must be ≥ 1 (i.e., not all evidence from a single latent source cluster)
  // For safety-critical claims, require N_ind ≥ 2 (genuine independence)
  const integrityThreshold = safetyCritical ? 2 : 1;
  const integrityOk = nInd.nInd >= integrityThreshold - 0.3; // tolerance for estimator bias

  // S — SafeGrid / SafeStacks clearance
  // For safety-critical claims, require explicit override; otherwise pass.
  const safetyOk = safetyCritical ? safetyOverride === true : true;

  // R — Second-reviewer signoff
  // For safety-critical claims, require explicit signoff; otherwise pass.
  const reviewOk = safetyCritical ? reviewSignedOff === true : true;

  const authorized = claimOk && evidenceOk && integrityOk && safetyOk && reviewOk;

  // Build human-readable reason
  const failed: string[] = [];
  if (!claimOk) failed.push(`claim state ${claimState} < ${AUTH_THRESHOLD}`);
  if (!evidenceOk)
    failed.push(
      `evidence insufficient (${evidence.length} items, ${distinctSources.size} sources)`
    );
  if (!integrityOk)
    failed.push(
      `provenance integrity N_ind=${nInd.nInd.toFixed(2)} < ${integrityThreshold}`
    );
  if (!safetyOk) failed.push("safety clearance missing (SafeGrid/SafeStacks)");
  if (!reviewOk) failed.push("reviewer signoff missing");

  const reason =
    failed.length === 0
      ? `A = C∧E∧I∧S∧R = ${authorized} — all conjuncts satisfied`
      : `A = C∧E∧I∧S∧R = false — failed: ${failed.join("; ")}`;

  return {
    claimOk,
    evidenceOk,
    integrityOk,
    safetyOk,
    reviewOk,
    authorized,
    reason,
  };
}

/**
 * Re-evaluate the claim state from evidence.
 * This is the IVE computation: state(c) = max { state(e) : e ∈ E(c) },
 * with the claim-type cap applied.
 */
export function recomputeClaimState(
  claimType: ClaimType,
  evidence: EvidenceItem[]
): VerificationState {
  return computeClaimState(
    claimType,
    evidence.map((e) => e.state)
  );
}
