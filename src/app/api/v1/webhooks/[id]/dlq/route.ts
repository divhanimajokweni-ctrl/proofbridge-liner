/**
 * VVU-IVE Webhook Subsystem — DLQ Admin (list endpoint)
 * ----------------------------------------------------------------------------
 * GET /api/v1/webhooks/[id]/dlq
 *
 * List DLQ entries for a webhook. Filterable by reason + replay status.
 *
 * Default: 100 most-recent entries, descending.
 */

import { NextRequest, NextResponse } from "next/server";
import { listDLQEntries } from "@/lib/webhook/dlq";
import type { DLQReason } from "@/lib/webhook";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { id: webhookId } = await ctx.params;
  const url = new URL(req.url);
  const reasonParam = url.searchParams.get("reason") as DLQReason | null;
  const unreplayedOnly = url.searchParams.get("unreplayed") === "true";
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const offset = Number(url.searchParams.get("offset") ?? "0");

  const entries = await listDLQEntries({
    webhookId,
    reason: reasonParam ?? undefined,
    unreplayedOnly,
    limit,
    offset,
  });

  return NextResponse.json({ entries, count: entries.length });
}
