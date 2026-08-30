import {
  CLAIM_TYPE_RANK,
  ClaimType,
  STATE_RANK,
  VerificationState,
} from "./types";

export function compareStates(
  a: VerificationState,
  b: VerificationState
): number {
  if (a === "FALSIFIED" && b !== "FALSIFIED") return 0;
  if (b === "FALSIFIED" && a !== "FALSIFIED") return 0;
  return STATE_RANK[a] - STATE_RANK[b];
}

export function stateAtLeast(
  a: VerificationState,
  b: VerificationState
): boolean {
  return compareStates(a, b) >= 0;
}

export function latticeSup(
  a: VerificationState,
  b: VerificationState
): VerificationState {
  if (a === "FALSIFIED" || b === "FALSIFIED") return "FALSIFIED";
  return STATE_RANK[a] >= STATE_RANK[b] ? a : b;
}

export function computeClaimState(
  claimType: ClaimType,
  evidenceStates: VerificationState[]
): VerificationState {
  if (evidenceStates.length === 0) return "UNTESTED";

  let aggregate: VerificationState = "UNTESTED";
  for (const s of evidenceStates) {
    aggregate = latticeSup(aggregate, s);
  }

  const typeRank = CLAIM_TYPE_RANK[claimType];
  let cap: VerificationState;
  if (typeRank >= 4) cap = "PROVEN";
  else if (typeRank >= 3) cap = "VERIFIED";
  else if (typeRank >= 2) cap = "SUPPORTED";
  else cap = "OBSERVED";

  if (STATE_RANK[aggregate] > STATE_RANK[cap]) return cap;
  return aggregate;
}

export function latticeDescription(): string {
  return (
    "PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE; " +
    "FALSIFIED (incomparable, terminal denial); " +
    "UNVALIDATED / UNTESTED / STALE (pre-conditions)"
  );
}

export function statesInOrder(): VerificationState[] {
  return [
    "PROVEN",
    "VERIFIED",
    "SUPPORTED",
    "OBSERVED",
    "INCONCLUSIVE",
    "UNVALIDATED",
    "UNTESTED",
    "STALE",
    "FALSIFIED",
  ];
}

export function stateColor(s: VerificationState): string {
  switch (s) {
    case "PROVEN": return "emerald";
    case "VERIFIED": return "green";
    case "SUPPORTED": return "lime";
    case "OBSERVED": return "amber";
    case "INCONCLUSIVE": return "orange";
    case "UNVALIDATED": return "zinc";
    case "UNTESTED": return "slate";
    case "STALE": return "cyan";
    case "FALSIFIED": return "red";
  }
}
