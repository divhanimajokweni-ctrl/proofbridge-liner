/**
 * VVU-IVE Webhook Subsystem — Single Webhook Inspect + Soft-Disable
 * ----------------------------------------------------------------------------
 * GET    /api/v1/webhooks/[id]  — Read webhook + CB state
 * PATCH  /api/v1/webhooks/[id]  — Soft-enable/disable (admin toggle, NOT CB)
 *
 * The PATCH endpoint does NOT affect CB state. To reset a tripped CB, use
 *   POST /api/v1/webhooks/[id]/circuit-breaker/reset
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setWebhookEnabled } from "@/lib/webhook/publish";
import { getBreakerState } from "@/lib/webhook/circuit-breaker";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const webhook = await db.webhook.findUnique({ where: { id } });
  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  // Include current CB state
  const cbState = await getBreakerState(id);
  // Aggregate delivery stats
  const stats = await db.webhookDelivery.groupBy({
    by: ["status"],
    where: { webhookId: id },
    _count: true,
  });

  return NextResponse.json({
    webhook,
    circuitBreaker: cbState ?? { state: "CLOSED", terminalFailureCount: 0 },
    deliveryStats: stats.reduce(
      (acc, s) => ({ ...acc, [s.status]: s._count }),
      {} as Record<string, number>,
    ),
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "PATCH body must include { enabled: boolean }" },
      { status: 400 },
    );
  }
  try {
    await setWebhookEnabled(id, body.enabled);
    return NextResponse.json({ id, enabled: body.enabled });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}
