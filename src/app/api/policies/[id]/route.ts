import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/policies/[id] — full policy detail with shards, merges, proofs, violations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const policy = await db.policy.findUnique({
    where: { id },
    include: {
      shards: { orderBy: { region: "asc" } },
      merges: { orderBy: { createdAt: "desc" }, take: 20 },
      proofs: { orderBy: { createdAt: "desc" }, take: 10 },
      violations: { orderBy: { createdAt: "desc" }, take: 20 },
      shadowEvents: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });
  if (!policy) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ policy });
}

// DELETE /api/policies/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.policy.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
