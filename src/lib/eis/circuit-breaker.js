function shouldTripBreaker(input) {
  const {
    evidenceCount,
    previousEvidenceCount,
    claimState,
    safetyCritical,
    safetyOk,
    nInd,
    integrityThreshold,
    lastEvidenceAt,
    stalenessMs
  } = input;
  if (evidenceCount < previousEvidenceCount && evidenceCount === 0) {
    return { trip: true, reason: "evidence_lost" };
  }
  if (claimState === "FALSIFIED" || claimState === "STALE" || claimState === "UNTESTED") {
    return { trip: true, reason: "verification_failed" };
  }
  if (safetyCritical && !safetyOk) {
    return { trip: true, reason: "safety_violation" };
  }
  if (nInd < integrityThreshold - 0.5) {
    return { trip: true, reason: "integrity_breach" };
  }
  const ageMs = Date.now() - lastEvidenceAt.getTime();
  if (ageMs > stalenessMs && evidenceCount > 0) {
    return { trip: true, reason: "stale_evidence" };
  }
  return { trip: false, reason: "" };
}
function isTripped(events) {
  if (events.length === 0) return false;
  const sorted = [...events].sort(
    (a, b) => b.trippedAt.getTime() - a.trippedAt.getTime()
  );
  return sorted[0].triggered;
}
function describeBreakerReason(reason) {
  switch (reason) {
    case "evidence_lost":
      return "All supporting evidence was removed \u2014 fail-closed per Theorem 5";
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
export {
  describeBreakerReason,
  isTripped,
  shouldTripBreaker
};
