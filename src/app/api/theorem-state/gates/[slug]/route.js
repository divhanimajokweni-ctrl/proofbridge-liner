import { NextResponse } from "next/server";
import { db } from "@/lib/db";
const VALID_STATUSES = /* @__PURE__ */ new Set([
  "GO",
  "FILED",
  "RESOLVED",
  "DRAFT",
  "READY",
  "PENDING",
  "NOT-FILED",
  "BLOCKED"
]);
async function PATCH(req, { params }) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { error: "missing slug" },
      { status: 400 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "expected JSON object body" },
      { status: 400 }
    );
  }
  const { status, note } = body;
  if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      {
        error: "invalid status",
        validStatuses: Array.from(VALID_STATUSES)
      },
      { status: 422 }
    );
  }
  const update = { status };
  if (typeof note === "string" && note.length > 0) {
    update.note = note.slice(0, 2048);
  }
  try {
    const existing = await db.studiGate.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { error: `gate '${slug}' not found` },
        { status: 404 }
      );
    }
    const updated = await db.studiGate.update({
      where: { slug },
      data: update
    });
    return NextResponse.json({
      slug: updated.slug,
      label: updated.label,
      status: updated.status,
      note: updated.note,
      updatedAt: updated.updatedAt.toISOString(),
      // Echo back the previous status for the UI toast.
      previousStatus: existing.status
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "database update failed",
        detail: err instanceof Error ? err.message : "unknown"
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";