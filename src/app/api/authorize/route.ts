/**
 * IVE API — Authorization (Theorem 1, 4, 5)
 *
 * POST /api/authorize
 *   Body: { claimId, safetyOverride?, reviewSignedOff? }
 *
 * Evaluates A = C ∧ E ∧ I ∧ S ∧ R and persists the result.
 * Also recomputes N_ind inline if no recent record exists.
 *
 * Backend: EIS authorization.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ClaimType,
  EvidenceSource,
  VerificationState,
  evaluateAuthorization,
  computeParticipationRatio,
  recomputeClaimState,
} from "@/lib/eis";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { claimId, safetyOverride, reviewSignedOff } = body;
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  const claim = await db.claim.findUnique({
    where: { id: claimId },
    include: { evidence: true, nIndRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }

  // Map DB rows to EIS types
  const evidence = claim.evidence.map((e) => ({
    ...e,
    source: e.source as EvidenceSource,
    state: e.state as VerificationState,
    embedding: JSON.parse(e.embedding) as number[],
  }));

  // Recompute claim state from evidence
  const recomputedState = recomputeClaimState(
    claim.claimType as ClaimType,
    evidence
  );
  if (recomputedState !== claim.state) {
    await db.claim.update({
      where: { id: claimId },
      data: { state: recomputedState },
    });
  }

  // Compute or reuse N_ind
  let nIndResult = claim.nIndRecords[0];
  if (!nIndResult || evidence.length === 0) {
    const embeddings = evidence.map((e) => e.embedding);
    const computed = computeParticipationRatio(embeddings);
    nIndResult = await db.nIndComputation.create({
      data: {
        claimId,
        numEvidence: computed.numEvidence,
        numSources: computed.numSources,
        nInd: computed.nInd,
        gamma: computed.gamma,
        eigenvalues: JSON.stringify(computed.eigenvalues),
      },
    });
  }

  const nInd = {
    nInd: nIndResult.nInd,
    numEvidence: nIndResult.numEvidence,
    numSources: nIndResult.numSources,
    gamma: nIndResult.gamma,
    eigenvalues: JSON.parse(nIndResult.eigenvalues) as number[],
  };

  // Evaluate A = C ∧ E ∧ I ∧ S ∧ R
  const auth = evaluateAuthorization({
    claimType: claim.claimType as ClaimType,
    claimState: recomputedState,
    evidence,
    nInd,
    safetyCritical: claim.safetyCritical,
    safetyOverride: safetyOverride ?? false,
    reviewSignedOff: reviewSignedOff ?? false,
  });

  // Persist the authorization record
  const record = await db.authorization.create({
    data: {
      claimId,
      claimOk: auth.claimOk,
      evidenceOk: auth.evidenceOk,
      integrityOk: auth.integrityOk,
      safetyOk: auth.safetyOk,
      reviewOk: auth.reviewOk,
      authorized: auth.authorized,
      reason: auth.reason,
    },
  });

  return NextResponse.json({
    ...auth,
    id: record.id,
    claimId,
    claimState: recomputedState,
    nInd,
    createdAt: record.createdAt,
  });
}
