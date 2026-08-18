/**
 * VVU-IVE Webhook Subsystem — Aggregate stats endpoint (dashboard widget)
 * ----------------------------------------------------------------------------
 * GET /api/v1/stats/webhooks
 *
 * Returns the high-level numbers shown on the Webhook Delivery card in the
 * IVE Plugin Registry:
 *   - totalWebhooks, activeWebhooks
 *   - openBreakers (count of CBs in OPEN state)
 *   - dlqDepth (count of unreplayed DLQ entries across all webhooks)
 *   - last24hSuccessRate (DELIVERED / (DELIVERED + FAILED + DLQ) in last 24h)
 *
 * Used by: src/components/ive-workspace/plugin-registry.tsx
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalWebhooks,
    activeWebhooks,
    openBreakers,
    dlqDepth,
    delivered24h,
    failed24h,
    dlq24h,
  ] = await Promise.all([
    db.webhook.count(),
    db.webhook.count({ where: { enabled: true } }),
    db.webhookCircuitBreakerState.count({
      where: { state: "OPEN" },
    }),
    db.deadLetterQueueEntry.count({
      where: { replayedBy: "" },
    }),
    db.webhookDelivery.count({
      where: { status: "DELIVERED", updatedAt: { gte: since } },
    }),
    db.webhookDelivery.count({
      where: { status: "FAILED", updatedAt: { gte: since } },
    }),
    db.webhookDelivery.count({
      where: { status: "DLQ", updatedAt: { gte: since } },
    }),
  ]);

  const totalTerminal = delivered24h + failed24h + dlq24h;
  const last24hSuccessRate =
    totalTerminal === 0 ? null : delivered24h / totalTerminal;

  return NextResponse.json({
    totalWebhooks,
    activeWebhooks,
    openBreakers,
    dlqDepth,
    last24h: {
      delivered: delivered24h,
      failed: failed24h,
      dlq: dlq24h,
      successRate: last24hSuccessRate,
    },
    contract: {
      version: "v1.1",
      lockedAt: "2026-08-18",
      launchAt: "2026-09-15",
    },
  });
}
