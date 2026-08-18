/**
 * PATCH /api/theorem-state/gates/[slug]
 *
 * Update a STUDI governance gate's status (and optionally a note).
 *
 * Request body (JSON):
 *   {
 *     "status":  "GO" | "FILED" | "RESOLVED" |
 *                "DRAFT" | "READY" |
 *                "PENDING" | "NOT-FILED" | "BLOCKED",
 *     "note"?:   string  // optional operator note appended
 *   }
 *
 * Returns the updated gate (slug, label, status, note, updatedAt).
 *
 * Fail-closed note: this endpoint does NOT directly open the IVE
 * engineering-release valve. It only mutates a gate row. The next
 * /api/theorem-state poll (≤5s) picks up the new gate list, recomputes
 * the STUDI verdict, and the Evolution Matrix morphs accordingly.
 * If the gate flip causes STUDI to go PROVEN but IVE's breaker is still
 * tripped, IVE stays at INCONCLUSIVE — Theorem 5 still holds.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set([
  "GO",
  "FILED",
  "RESOLVED",
  "DRAFT",
  "READY",
  "PENDING",
  "NOT-FILED",
  "BLOCKED",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { error: "missing slug" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
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
  const { status, note } = body as { status?: unknown; note?: unknown };

  if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      {
        error: "invalid status",
        validStatuses: Array.from(VALID_STATUSES),
      },
      { status: 422 }
    );
  }

  // Build the update payload — only mutate fields we were given.
  const update: { status: string; note?: string } = { status };
  if (typeof note === "string" && note.length > 0) {
    update.note = note.slice(0, 2048); // cap to avoid runaway rows
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
      data: update,
    });

    return NextResponse.json({
      slug: updated.slug,
      label: updated.label,
      status: updated.status,
      note: updated.note,
      updatedAt: updated.updatedAt.toISOString(),
      // Echo back the previous status for the UI toast.
      previousStatus: existing.status,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "database update failed",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
