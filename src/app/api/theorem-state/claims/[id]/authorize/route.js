import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
  if (typeof body.authorized !== "boolean") {
    return NextResponse.json(
      { error: "authorized (boolean) is required" },
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
  const authorized = body.authorized;
  const reason = typeof body.reason === "string" && body.reason.trim().length > 0 ? body.reason.slice(0, 500) : authorized ? "operator override \u2014 all five conjuncts asserted" : "operator revoke \u2014 claim no longer meets threshold";
  const record = await db.authorization.create({
    data: {
      claimId,
      claimOk: authorized,
      evidenceOk: authorized,
      integrityOk: authorized,
      safetyOk: authorized,
      reviewOk: authorized,
      authorized,
      reason
    }
  });
  return NextResponse.json({
    id: record.id,
    claimId,
    authorized,
    reason,
    createdAt: record.createdAt.toISOString(),
    claimTitle: claim.title,
    claimType: claim.claimType
  });
}

export const dynamic = "force-dynamic";