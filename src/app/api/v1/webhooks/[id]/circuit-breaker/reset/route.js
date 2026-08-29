import { NextResponse } from "next/server";
import { forceReset } from "@/lib/webhook/circuit-breaker";
async function POST(_req, ctx) {
  const { id: webhookId } = await ctx.params;
  await forceReset(webhookId);
  return NextResponse.json({
    ok: true,
    webhookId,
    message: "Circuit breaker force-reset to CLOSED. Skipped events remain in DLQ until explicitly replayed via POST /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry."
  });
}

export const runtime = "nodejs";