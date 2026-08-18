/**
 * POST /api/theorem-state/claims/[id]/breaker
 *
 * Operational state injection: writes a new CircuitBreaker record for
 * the claim, setting the live `triggered` field.
 *
 * The verdict computation in /api/theorem-state reads the LATEST
 * CircuitBreaker record per claim. If that latest record has
 * triggered=true, the global EIS Theorem-5 breaker is TRIPPED, and
 * the IVE verdict falls back to INCONCLUSIVE (with pulsing-red on the
 * matrix) regardless of how many claims are authorised.
 *
 * Body:
 *   { tripped: boolean, reason?: string }
 *
 * Typical reasons (selected by the operator in the UI):
 *   "evidence_lost"        — evidence was retracted or expired
 *   "verification_failed"  — SMT solver returned UNSAT
 *   "safety_violation"     — SafeGrid / SafeStacks flagged a fault
 *   "stale_evidence"       — evidence age exceeded the bound
 *
 * Fail-closed bound: when `tripped: true`, the IVE hero matrix drops
 * to web-spider + pulsing-red (INCONCLUSIVE). When the operator
 * resets (`tripped: false`), a new record with triggered=false is
 * appended, and the breaker returns to NORMAL — but ONLY for this
 * claim. If any other claim still has a latest-record of triggered,
 * the global breaker stays TRIPPED.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = new Set([
  "evidence_lost",
  "verification_failed",
  "safety_violation",
  "stale_evidence",
  "operator_override",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params;

  let body: { tripped?: boolean; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 }
    );
  }

  if (typeof body.tripped !== "boolean") {
    return NextResponse.json(
      { error: "tripped (boolean) is required" },
      { status: 422 }
    );
  }

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

  const tripped = body.tripped;
  let reason =
    typeof body.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 200)
      : tripped
        ? "operator_override"
        : "operator_override";

  // Normalize the reason — fall back to operator_override if unknown.
  if (!ALLOWED_REASONS.has(reason)) {
    reason = "operator_override";
  }

  const record = await db.circuitBreaker.create({
    data: {
      claimId,
      triggered: tripped,
      reason,
    },
  });

  return NextResponse.json({
    id: record.id,
    claimId,
    tripped,
    reason,
    trippedAt: record.trippedAt.toISOString(),
    claimTitle: claim.title,
    claimType: claim.claimType,
  });
}
