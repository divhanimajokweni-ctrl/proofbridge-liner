/**
 * EIS — Verification State Lattice
 *
 * Per Theorem 4: The verification state lattice is
 *   PROVEN >= VERIFIED >= SUPPORTED >= OBSERVED >= INCONCLUSIVE
 *   FALSIFIED (incomparable — terminal denial)
 *
 * IVE computation (Theorem 4, Step 2):
 *   state(c) = max { state(e) : e ∈ E(c) }
 *
 * EIS enforcement (Theorem 4, Step 3):
 *   Mathematical Proof > Semantic Validity > Empirical Validation > Operational Validation
 *
 * Only mathematical claims can be PROVEN.
 * Only semantic / mathematical claims can be VERIFIED.
 */

import {
  CLAIM_TYPE_RANK,
  ClaimType,
  STATE_RANK,
  VerificationState,
} from "./types";

/**
 * Compare two verification states under the lattice order.
 * Returns: positive if a > b, negative if a < b, 0 if equal.
 *
 * FALSIFIED is incomparable with affirmative states — returns 0 in mixed comparisons.
 */
export function compareStates(
  a: VerificationState,
  b: VerificationState
): number {
  // FALSIFIED is incomparable with anything except itself
  if (a === "FALSIFIED" && b !== "FALSIFIED") return 0;
  if (b === "FALSIFIED" && a !== "FALSIFIED") return 0;
  return STATE_RANK[a] - STATE_RANK[b];
}

/**
 * Returns true if state a >= state b in the lattice.
 */
export function stateAtLeast(
  a: VerificationState,
  b: VerificationState
): boolean {
  return compareStates(a, b) >= 0;
}

/**
 * Returns the lattice supremum (max) of two states.
 * FALSIFIED dominates everything (it's a denial — if any evidence falsifies,
 * the claim is falsified).
 */
export function latticeSup(
  a: VerificationState,
  b: VerificationState
): VerificationState {
  if (a === "FALSIFIED" || b === "FALSIFIED") return "FALSIFIED";
  return STATE_RANK[a] >= STATE_RANK[b] ? a : b;
}

/**
 * Compute the IVE verification state for a claim given its evidence.
 *
 * Theorem 4, Step 2: state(c) = max { state(e) : e ∈ E(c) }
 *
 * EIS enforcement (Theorem 4, Step 3): the claim TYPE caps the maximum
 * achievable state. Only mathematical claims can be PROVEN; only
 * mathematical/semantic claims can be VERIFIED.
 */
export function computeClaimState(
  claimType: ClaimType,
  evidenceStates: VerificationState[]
): VerificationState {
  if (evidenceStates.length === 0) return "UNTESTED";

  // Aggregate evidence by lattice supremum
  let aggregate: VerificationState = "UNTESTED";
  for (const s of evidenceStates) {
    aggregate = latticeSup(aggregate, s);
  }

  // Apply claim-type cap (EIS enforcement)
  const typeRank = CLAIM_TYPE_RANK[claimType];
  let cap: VerificationState;
  if (typeRank >= 4) cap = "PROVEN";           // mathematical
  else if (typeRank >= 3) cap = "VERIFIED";    // semantic
  else if (typeRank >= 2) cap = "SUPPORTED";   // empirical
  else cap = "OBSERVED";                         // operational

  // If evidence exceeds cap, clamp down
  if (STATE_RANK[aggregate] > STATE_RANK[cap]) return cap;
  return aggregate;
}

/**
 * Returns a human-readable description of the lattice ordering.
 */
export function latticeDescription(): string {
  return (
    "PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE; " +
    "FALSIFIED (incomparable, terminal denial); " +
    "UNVALIDATED / UNTESTED / STALE (pre-conditions)"
  );
}

/**
 * Returns all verification states in lattice order (strongest first).
 */
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

/**
 * Returns the color token for a state, used by the IVE UI.
 */
export function stateColor(s: VerificationState): string {
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
