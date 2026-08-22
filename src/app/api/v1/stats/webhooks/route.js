import { NextResponse } from "next/server";
import { db } from "@/lib/db";
async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1e3);
  const [
    totalWebhooks,
    activeWebhooks,
    openBreakers,
    dlqDepth,
    delivered24h,
    failed24h,
    dlq24h
  ] = await Promise.all([
    db.webhook.count(),
    db.webhook.count({ where: { enabled: true } }),
    db.webhookCircuitBreakerState.count({
      where: { state: "OPEN" }
    }),
    db.deadLetterQueueEntry.count({
      where: { replayedBy: "" }
    }),
    db.webhookDelivery.count({
      where: { status: "DELIVERED", updatedAt: { gte: since } }
    }),
    db.webhookDelivery.count({
      where: { status: "FAILED", updatedAt: { gte: since } }
    }),
    db.webhookDelivery.count({
      where: { status: "DLQ", updatedAt: { gte: since } }
    })
  ]);
  const totalTerminal = delivered24h + failed24h + dlq24h;
  const last24hSuccessRate = totalTerminal === 0 ? null : delivered24h / totalTerminal;
  return NextResponse.json({
    totalWebhooks,
    activeWebhooks,
    openBreakers,
    dlqDepth,
    last24h: {
      delivered: delivered24h,
      failed: failed24h,
      dlq: dlq24h,
      successRate: last24hSuccessRate
    },
    contract: {
      version: "v1.1",
      lockedAt: "2026-08-18",
      launchAt: "2026-09-15"
    }
  });
}

export const runtime = "nodejs";