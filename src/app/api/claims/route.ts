/**
 * IVE API — Claims
 *
 * GET  /api/claims       — list all claims for authenticated user with relations
 * POST /api/claims       — create a new claim for authenticated user
 *
 * Backend: EIS (Evidence Independence Specification)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ClaimType,
  EvidenceSource,
  VerificationState,
  computeClaimState,
} from "@/lib/eis";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const claims = await db.claim.findMany({
    where: { userId },
    include: {
      evidence: { orderBy: { collectedAt: "asc" } },
      authorizations: { orderBy: { createdAt: "desc" } },
      circuitEvents: { orderBy: { trippedAt: "desc" } },
      nIndRecords: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse JSON fields and map to EIS types
  const result = claims.map((c) => ({
    ...c,
    claimType: c.claimType as ClaimType,
    state: c.state as VerificationState,
    evidence: c.evidence.map((e) => ({
      ...e,
      source: e.source as EvidenceSource,
      state: e.state as VerificationState,
      embedding: JSON.parse(e.embedding) as number[],
    })),
    nIndRecords: c.nIndRecords.map((n) => ({
      ...n,
      eigenvalues: JSON.parse(n.eigenvalues) as number[],
    })),
  }));

  return NextResponse.json({ claims: result });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = await req.json();
  const {
    title,
    description,
    claimType = "empirical",
    intendedAction = "deploy",
    safetyCritical = true,
  } = body;

  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  const claim = await db.claim.create({
    data: {
      title,
      description: description ?? "",
      claimType: claimType as ClaimType,
      intendedAction,
      safetyCritical: Boolean(safetyCritical),
      state: "UNTESTED",
      userId,
    },
  });

  return NextResponse.json({ claim });
}
