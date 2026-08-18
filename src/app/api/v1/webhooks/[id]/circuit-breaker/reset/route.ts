/**
 * VVU-IVE Webhook Subsystem — Circuit Breaker Admin
 * ----------------------------------------------------------------------------
 * POST /api/v1/webhooks/[id]/circuit-breaker/reset
 *
 * Force-reset a tripped CB. Used by operators after fixing the endpoint.
 *
 * CRITICAL: This does NOT auto-replay skipped events. They stay in the DLQ
 * until explicitly replayed via
 *   POST /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry
 * This is the contract Pillar 4 — prevents accidental replay storms.
 */

import { NextRequest, NextResponse } from "next/server";
import { forceReset } from "@/lib/webhook/circuit-breaker";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  _req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { id: webhookId } = await ctx.params;
  await forceReset(webhookId);
  return NextResponse.json({
    ok: true,
    webhookId,
    message:
      "Circuit breaker force-reset to CLOSED. Skipped events remain in DLQ " +
      "until explicitly replayed via " +
      "POST /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry.",
  });
}
