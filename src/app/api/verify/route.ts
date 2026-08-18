/**
 * IVE API — Verify (run the IVE verification pass)
 *
 * POST /api/verify
 *   Body: { claimId }
 *
 * Runs Theorem 4 Step 2: state(c) = max { state(e) : e ∈ E(c) }
 * Applies the EIS claim-type cap (Step 3).
 * Persists the new claim state.
 *
 * Returns the recomputed claim state and a brief trace.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ClaimType, VerificationState, computeClaimState, statesInOrder } from "@/lib/eis";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { claimId } = body;
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  const claim = await db.claim.findUnique({
    where: { id: claimId },
    include: { evidence: true },
  });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }

  const evidenceStates = claim.evidence.map(
    (e) => e.state as VerificationState
  );
  const previousState = claim.state as VerificationState;
  const newState = computeClaimState(
    claim.claimType as ClaimType,
    evidenceStates
  );

  await db.claim.update({
    where: { id: claimId },
    data: { state: newState },
  });

  // Build a verification trace
  const trace = {
    previousState,
    newState,
    evidenceStates,
    claimType: claim.claimType,
    appliedCap:
      claim.claimType === "mathematical"
        ? "PROVEN"
        : claim.claimType === "semantic"
        ? "VERIFIED"
        : claim.claimType === "empirical"
        ? "SUPPORTED"
        : "OBSERVED",
    latticeOrder: statesInOrder(),
    rule: "state(c) = max { state(e) : e ∈ E(c) } capped by claimType",
  };

  return NextResponse.json({ trace });
}
