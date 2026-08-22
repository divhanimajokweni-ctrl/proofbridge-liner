import {
  AUTH_THRESHOLD
} from "./types";
import { computeClaimState, stateAtLeast } from "./state-lattice";
function evaluateAuthorization(input) {
  const {
    claimType,
    claimState,
    evidence,
    nInd,
    safetyCritical,
    safetyOverride,
    reviewSignedOff
  } = input;
  const claimOk = claimState !== "FALSIFIED" && stateAtLeast(claimState, AUTH_THRESHOLD);
  const distinctSources = new Set(evidence.map((e) => e.source));
  const evidenceOk = evidence.length >= 1 && (distinctSources.size >= 2 || evidence.length >= 3);
  const integrityThreshold = safetyCritical ? 2 : 1;
  const integrityOk = nInd.nInd >= integrityThreshold - 0.3;
  const safetyOk = safetyCritical ? safetyOverride === true : true;
  const reviewOk = safetyCritical ? reviewSignedOff === true : true;
  const authorized = claimOk && evidenceOk && integrityOk && safetyOk && reviewOk;
  const failed = [];
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
  const reason = failed.length === 0 ? `A = C\u2227E\u2227I\u2227S\u2227R = ${authorized} \u2014 all conjuncts satisfied` : `A = C\u2227E\u2227I\u2227S\u2227R = false \u2014 failed: ${failed.join("; ")}`;
  return {
    claimOk,
    evidenceOk,
    integrityOk,
    safetyOk,
    reviewOk,
    authorized,
    reason
  };
}
function recomputeClaimState(claimType, evidence) {
  return computeClaimState(
    claimType,
    evidence.map((e) => e.state)
  );
}
export {
  evaluateAuthorization,
  recomputeClaimState
};
