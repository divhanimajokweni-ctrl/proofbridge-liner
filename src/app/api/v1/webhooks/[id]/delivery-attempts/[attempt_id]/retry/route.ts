/**
 * VVU-IVE Webhook Subsystem — Manual Replay API Route
 * ----------------------------------------------------------------------------
 * POST /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry
 *
 * Operator-initiated manual replay of a failed/skipped delivery.
 *
 * CRITICAL: This is the ONLY way a skipped (CB OPEN) delivery resumes.
 * The contract mandates that when a CB closes, old skipped events STAY in
 * the DLQ until an operator explicitly replays them. This prevents accidental
 * replay storms.
 *
 * Behavior:
 *   1. Look up the DLQ entry by deliveryId (= attempt_id in URL)
 *   2. If already replayed → 409 Conflict
 *   3. If the delivery is in DELIVERED state → 409 Conflict (already succeeded)
 *   4. Otherwise: reset delivery status to PENDING, publish to Kafka, mark
 *      DLQ entry as replayed (replayedBy=operator, replayedAt=now)
 *   5. The webhook worker picks up the replayed delivery from Kafka and runs
 *      the normal pipeline (CB check + retry + DLQ).
 *
 * Auth: TODO — add admin auth (NextAuth.js session check). For Sept 15 launch,
 * this route is intended for internal operator use only.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishReplay } from "@/lib/webhook/publish";
import { markReplayed } from "@/lib/webhook/dlq";
import { getBreakerState } from "@/lib/webhook/circuit-breaker";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string; attempt_id: string }>;
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { id: webhookId, attempt_id: deliveryId } = await ctx.params;

  // Look up the DLQ entry
  const dlqEntry = await db.deadLetterQueueEntry.findFirst({
    where: { deliveryId, webhookId },
    orderBy: { createdAt: "desc" },
  });

  if (!dlqEntry) {
    return NextResponse.json(
      {
        error: "DLQ entry not found",
        webhookId,
        deliveryId,
      },
      { status: 404 },
    );
  }

  // Already replayed?
  if (dlqEntry.replayedAt) {
    return NextResponse.json(
      {
        error: "Delivery already replayed",
        replayedAt: dlqEntry.replayedAt,
        replayedBy: dlqEntry.replayedBy,
      },
      { status: 409 },
    );
  }

  // Check if the delivery is already DELIVERED (operator may have a stale view)
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });
  if (delivery?.status === "DELIVERED") {
    return NextResponse.json(
      {
        error: "Delivery already succeeded — no replay needed",
        deliveryId,
        status: delivery.status,
      },
      { status: 409 },
    );
  }

  // Operator identity (TODO: wire to NextAuth.js session)
  const operatorId = req.headers.get("x-operator-id") ?? "operator";

  // Mark the DLQ entry as replayed BEFORE publishing (so concurrent replays
  // are rejected by the 409 check above)
  await markReplayed(deliveryId, dlqEntry.reason as never, operatorId);

  // Reset the delivery record to PENDING so the worker re-processes it
  await db.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "PENDING",
      statusReason: `Manual replay by ${operatorId} at ${new Date().toISOString()}`,
      updatedAt: new Date(),
    },
  });

  // Fetch the original payload snapshot from the DLQ entry
  // (kept as STRING — publishReplay expects the pre-serialized payload so
  // the Idempotency-Key can match across original + replay)
  const payloadStr = dlqEntry.payload;

  // Publish to Kafka — webhook worker will pick up + run full pipeline
  // (CB check → retry → DLQ if still failing)
  //
  // CRITICAL: We use publishReplay() NOT publishDelivery() so the EXISTING
  // delivery_id is preserved. The external system will see the SAME
  // Idempotency-Key header as the original delivery — this is the
  // at-least-once contract from Pillar 5.
  const result = await publishReplay({
    deliveryId,
    webhookId,
    eventId: dlqEntry.eventId,
    payload: payloadStr,
    replayedBy: operatorId,
  });

  // Read current CB state so the operator knows what to expect
  const cbState = await getBreakerState(webhookId);

  return NextResponse.json(
    {
      ok: true,
      message: "Replay queued",
      deliveryId,
      webhookId,
      kafkaPartition: result.kafkaPartition,
      kafkaOffset: result.kafkaOffset,
      circuitBreakerState: cbState?.state ?? "CLOSED",
      note:
        "If the circuit breaker is OPEN for this webhook, the replay will be " +
        "skipped (sent back to DLQ as circuit_breaker_open_skipped). " +
        "Force-reset the breaker first via " +
        "POST /api/v1/webhooks/[id]/circuit-breaker/reset if needed.",
    },
    { status: 202 },
  );
}
