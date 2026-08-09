/**
 * IVE API — Claim detail
 *
 * GET    /api/claims/[id]  — fetch a single claim with relations
 * PATCH  /api/claims/[id]  — update claim fields (state, safetyCritical, etc.)
 * DELETE /api/claims/[id]  — remove a claim (cascade)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ClaimType,
  EvidenceSource,
  VerificationState,
} from "@/lib/eis";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { id } = await params;
  const claim = await db.claim.findUnique({
    where: { id },
    include: {
      evidence: { orderBy: { collectedAt: "asc" } },
      authorizations: { orderBy: { createdAt: "desc" } },
      circuitEvents: { orderBy: { trippedAt: "desc" } },
      nIndRecords: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }

  if (claim.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = {
    ...claim,
    claimType: claim.claimType as ClaimType,
    state: claim.state as VerificationState,
    evidence: claim.evidence.map((e) => ({
      ...e,
      source: e.source as EvidenceSource,
      state: e.state as VerificationState,
      embedding: JSON.parse(e.embedding) as number[],
    })),
    nIndRecords: claim.nIndRecords.map((n) => ({
      ...n,
      eigenvalues: JSON.parse(n.eigenvalues) as number[],
    })),
  };

  return NextResponse.json({ claim: result });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { id } = await params;

  // Verify ownership
  const existing = await db.claim.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { state, safetyCritical, intendedAction, claimType } = body;

  const claim = await db.claim.update({
    where: { id },
    data: {
      ...(state !== undefined && { state: state as VerificationState }),
      ...(safetyCritical !== undefined && { safetyCritical: Boolean(safetyCritical) }),
      ...(intendedAction !== undefined && { intendedAction }),
      ...(claimType !== undefined && { claimType: claimType as ClaimType }),
    },
  });

  return NextResponse.json({ claim });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { id } = await params;

  // Verify ownership
  const existing = await db.claim.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await db.claim.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
