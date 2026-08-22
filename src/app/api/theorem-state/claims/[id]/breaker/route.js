import { NextResponse } from "next/server";
import { db } from "@/lib/db";
const ALLOWED_REASONS = /* @__PURE__ */ new Set([
  "evidence_lost",
  "verification_failed",
  "safety_violation",
  "stale_evidence",
  "operator_override"
]);
async function POST(req, { params }) {
  const { id: claimId } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
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
    select: { id: true, title: true, claimType: true, safetyCritical: true }
  });
  if (!claim) {
    return NextResponse.json(
      { error: "claim not found", claimId },
      { status: 404 }
    );
  }
  const tripped = body.tripped;
  let reason = typeof body.reason === "string" && body.reason.trim().length > 0 ? body.reason.trim().slice(0, 200) : tripped ? "operator_override" : "operator_override";
  if (!ALLOWED_REASONS.has(reason)) {
    reason = "operator_override";
  }
  const record = await db.circuitBreaker.create({
    data: {
      claimId,
      triggered: tripped,
      reason
    }
  });
  return NextResponse.json({
    id: record.id,
    claimId,
    tripped,
    reason,
    trippedAt: record.trippedAt.toISOString(),
    claimTitle: claim.title,
    claimType: claim.claimType
  });
}

export const dynamic = "force-dynamic";