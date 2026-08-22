import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeClaimState, statesInOrder } from "@/lib/eis";
async function POST(req) {
  const body = await req.json();
  const { claimId } = body;
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    include: { evidence: true }
  });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  const evidenceStates = claim.evidence.map(
    (e) => e.state
  );
  const previousState = claim.state;
  const newState = computeClaimState(
    claim.claimType,
    evidenceStates
  );
  await db.claim.update({
    where: { id: claimId },
    data: { state: newState }
  });
  const trace = {
    previousState,
    newState,
    evidenceStates,
    claimType: claim.claimType,
    appliedCap: claim.claimType === "mathematical" ? "PROVEN" : claim.claimType === "semantic" ? "VERIFIED" : claim.claimType === "empirical" ? "SUPPORTED" : "OBSERVED",
    latticeOrder: statesInOrder(),
    rule: "state(c) = max { state(e) : e \u2208 E(c) } capped by claimType"
  };
  return NextResponse.json({ trace });
}

export const dynamic = "force-dynamic";