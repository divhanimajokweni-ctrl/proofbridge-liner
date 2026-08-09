/**
 * IVE API — Aggregate VVU system state
 *
 * GET /api/state
 *
 * Returns the full state of the IVE for the authenticated user: all claims
 * with their evidence, authorization records, circuit breaker events,
 * and N_ind computations. Also returns a system-level summary.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ClaimType,
  EvidenceSource,
  VerificationState,
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
      authorizations: { orderBy: { createdAt: "desc" }, take: 5 },
      circuitEvents: { orderBy: { trippedAt: "desc" }, take: 5 },
      nIndRecords: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = claims.map((c) => ({
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

  // System-level summary
  const totalClaims = claims.length;
  const authorizedClaims = claims.filter((c) =>
    c.authorizations.some((a) => a.authorized)
  ).length;
  const breakerTripped = claims.filter((c) =>
    c.circuitEvents.some((e) => e.triggered)
  ).length;
  const totalEvidence = claims.reduce((s, c) => s + c.evidence.length, 0);

  // State distribution
  const stateCounts: Record<string, number> = {};
  for (const c of claims) {
    stateCounts[c.state] = (stateCounts[c.state] ?? 0) + 1;
  }

  return NextResponse.json({
    claims: mapped,
    summary: {
      totalClaims,
      authorizedClaims,
      breakerTripped,
      totalEvidence,
      stateCounts,
      evidenceBound: "Claim ≤ Evidence ≤ Verification ≤ Authorization ≤ Action",
      authorizationFormula: "A = C · E · I · S · R",
      failClosed: true,
    },
  });
}
