/**
 * IVE API — Claims
 *
 * GET  /api/claims       — list all claims with relations
 * POST /api/claims       — create a new claim
 *
 * Backend: EIS (Evidence Independence Specification)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ClaimType,
  VerificationState,
  computeClaimState,
} from "@/lib/eis";

export const dynamic = "force-dynamic";

export async function GET() {
  const claims = await db.claim.findMany({
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

import { EvidenceSource } from "@/lib/eis";

export async function POST(req: NextRequest) {
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
    },
  });

  return NextResponse.json({ claim });
}
