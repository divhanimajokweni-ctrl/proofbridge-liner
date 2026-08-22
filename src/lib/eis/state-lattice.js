import {
  CLAIM_TYPE_RANK,
  STATE_RANK
} from "./types";
function compareStates(a, b) {
  if (a === "FALSIFIED" && b !== "FALSIFIED") return 0;
  if (b === "FALSIFIED" && a !== "FALSIFIED") return 0;
  return STATE_RANK[a] - STATE_RANK[b];
}
function stateAtLeast(a, b) {
  return compareStates(a, b) >= 0;
}
function latticeSup(a, b) {
  if (a === "FALSIFIED" || b === "FALSIFIED") return "FALSIFIED";
  return STATE_RANK[a] >= STATE_RANK[b] ? a : b;
}
function computeClaimState(claimType, evidenceStates) {
  if (evidenceStates.length === 0) return "UNTESTED";
  let aggregate = "UNTESTED";
  for (const s of evidenceStates) {
    aggregate = latticeSup(aggregate, s);
  }
  const typeRank = CLAIM_TYPE_RANK[claimType];
  let cap;
  if (typeRank >= 4) cap = "PROVEN";
  else if (typeRank >= 3) cap = "VERIFIED";
  else if (typeRank >= 2) cap = "SUPPORTED";
  else cap = "OBSERVED";
  if (STATE_RANK[aggregate] > STATE_RANK[cap]) return cap;
  return aggregate;
}
function latticeDescription() {
  return "PROVEN \u2265 VERIFIED \u2265 SUPPORTED \u2265 OBSERVED \u2265 INCONCLUSIVE; FALSIFIED (incomparable, terminal denial); UNVALIDATED / UNTESTED / STALE (pre-conditions)";
}
function statesInOrder() {
  return [
    "PROVEN",
    "VERIFIED",
    "SUPPORTED",
    "OBSERVED",
    "INCONCLUSIVE",
    "UNVALIDATED",
    "UNTESTED",
    "STALE",
    "FALSIFIED"
  ];
}
function stateColor(s) {
  switch (s) {
    case "PROVEN":
      return "emerald";
    case "VERIFIED":
      return "green";
    case "SUPPORTED":
      return "lime";
    case "OBSERVED":
      return "amber";
    case "INCONCLUSIVE":
      return "orange";
    case "UNVALIDATED":
      return "zinc";
    case "UNTESTED":
      return "slate";
    case "STALE":
      return "stone";
    case "FALSIFIED":
      return "red";
  }
}
export {
  compareStates,
  computeClaimState,
  latticeDescription,
  latticeSup,
  stateAtLeast,
  stateColor,
  statesInOrder
};
