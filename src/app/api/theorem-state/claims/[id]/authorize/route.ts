/**
 * POST /api/theorem-state/claims/[id]/authorize
 *
 * Operational state injection: writes a new Authorization record for
 * the claim, setting the live `authorized` field.
 *
 * The verdict computation in /api/theorem-state reads the LATEST
 * authorization record per claim — so this endpoint is the canonical
 * way for an operator to flip a claim's authorization state under
 * live conditions. Repeated calls append records; the latest wins.
 * This preserves the audit trail (every authorization transition is
 * recorded) while keeping the verdict logic simple and predictable.
 *
 * Body:
 *   { authorized: boolean, reason?: string }
 *
 * The persisted Authorization record always carries the 5 conjuncts
 * (C, E, I, S, R) as the operator-stated assertion. If authorized is
 * false, all five are recorded as false (rejection). The EIS backend's
 * computeAuthorization (which re-evaluates from evidence) is the
 * reference implementation; this endpoint is the OPERATIONAL OVERRIDE
 * used by the live system validation harness.
 *
 * Fail-closed bound preserved: this endpoint mutates only a row. It
 * cannot force IVE to PROVEN on its own — the breaker can still trip
 * (and the latest breaker record wins, see breaker/route.ts). Theorem
 * 5 still holds.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params;

  let body: { authorized?: boolean; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 }
    );
  }

  if (typeof body.authorized !== "boolean") {
    return NextResponse.json(
      { error: "authorized (boolean) is required" },
      { status: 422 }
    );
  }

  // Verify the claim exists before writing anything.
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, title: true, claimType: true, safetyCritical: true },
  });
  if (!claim) {
    return NextResponse.json(
      { error: "claim not found", claimId },
      { status: 404 }
    );
  }

  const authorized = body.authorized;
  const reason =
    typeof body.reason === "string" && body.reason.trim().length > 0
      ? body.reason.slice(0, 500)
      : authorized
        ? "operator override — all five conjuncts asserted"
        : "operator revoke — claim no longer meets threshold";

  // Persist the Authorization record. The 5 conjuncts (C, E, I, S, R)
  // are recorded as the operator-stated assertion. When authorized is
  // true, all five are recorded as true (full override). When false,
  // all five are false (clean rejection).
  const record = await db.authorization.create({
    data: {
      claimId,
      claimOk: authorized,
      evidenceOk: authorized,
      integrityOk: authorized,
      safetyOk: authorized,
      reviewOk: authorized,
      authorized,
      reason,
    },
  });

  return NextResponse.json({
    id: record.id,
    claimId,
    authorized,
    reason,
    createdAt: record.createdAt.toISOString(),
    claimTitle: claim.title,
    claimType: claim.claimType,
  });
}
