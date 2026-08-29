/**
 * IVE API — N_ind Participation Ratio (Theorem 2)
 *
 * POST /api/n-ind
 *   Body: { claimId, gamma? }
 *
 * Computes N_ind = (∑λ_i)² / ∑λ_i² from the RBF Gram matrix of the claim's
 * evidence embeddings. Persists the result as an NIndComputation record.
 *
 * Returns the participation ratio and the eigenvalue spectrum.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeParticipationRatio } from "@/lib/eis";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = await req.json();
  const { claimId, gamma } = body;
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

  // Verify claim ownership
  if (claim.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const embeddings = claim.evidence.map((e) => JSON.parse(e.embedding) as number[]);
  const result = computeParticipationRatio(embeddings, gamma);

  // Persist the computation
  const record = await db.nIndComputation.create({
    data: {
      claimId,
      numEvidence: result.numEvidence,
      numSources: result.numSources,
      nInd: result.nInd,
      gamma: result.gamma,
      eigenvalues: JSON.stringify(result.eigenvalues),
    },
  });

  return NextResponse.json({
    ...result,
    id: record.id,
    claimId,
    createdAt: record.createdAt,
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const claimId = req.nextUrl.searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "claimId query param required" }, { status: 400 });
  }

  // Verify claim ownership
  const claim = await db.claim.findUnique({ where: { id: claimId } });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  if (claim.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const records = await db.nIndComputation.findMany({
    where: { claimId },
    orderBy: { createdAt: "desc" },
  });
  const result = records.map((r) => ({
    ...r,
    eigenvalues: JSON.parse(r.eigenvalues) as number[],
  }));
  return NextResponse.json({ records: result });
}
