import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishReplay } from "@/lib/webhook/publish";
import { markReplayed } from "@/lib/webhook/dlq";
import { getBreakerState } from "@/lib/webhook/circuit-breaker";
async function POST(req, ctx) {
  var _a, _b;
  const { id: webhookId, attempt_id: deliveryId } = await ctx.params;
  const dlqEntry = await db.deadLetterQueueEntry.findFirst({
    where: { deliveryId, webhookId },
    orderBy: { createdAt: "desc" }
  });
  if (!dlqEntry) {
    return NextResponse.json(
      {
        error: "DLQ entry not found",
        webhookId,
        deliveryId
      },
      { status: 404 }
    );
  }
  if (dlqEntry.replayedAt) {
    return NextResponse.json(
      {
        error: "Delivery already replayed",
        replayedAt: dlqEntry.replayedAt,
        replayedBy: dlqEntry.replayedBy
      },
      { status: 409 }
    );
  }
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId }
  });
  if ((delivery == null ? void 0 : delivery.status) === "DELIVERED") {
    return NextResponse.json(
      {
        error: "Delivery already succeeded \u2014 no replay needed",
        deliveryId,
        status: delivery.status
      },
      { status: 409 }
    );
  }
  const operatorId = (_a = req.headers.get("x-operator-id")) != null ? _a : "operator";
  await markReplayed(deliveryId, dlqEntry.reason, operatorId);
  await db.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "PENDING",
      statusReason: `Manual replay by ${operatorId} at ${(/* @__PURE__ */ new Date()).toISOString()}`,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  const payloadStr = dlqEntry.payload;
  const result = await publishReplay({
    deliveryId,
    webhookId,
    eventId: dlqEntry.eventId,
    payload: payloadStr,
    replayedBy: operatorId
  });
  const cbState = await getBreakerState(webhookId);
  return NextResponse.json(
    {
      ok: true,
      message: "Replay queued",
      deliveryId,
      webhookId,
      kafkaPartition: result.kafkaPartition,
      kafkaOffset: result.kafkaOffset,
      circuitBreakerState: (_b = cbState == null ? void 0 : cbState.state) != null ? _b : "CLOSED",
      note: "If the circuit breaker is OPEN for this webhook, the replay will be skipped (sent back to DLQ as circuit_breaker_open_skipped). Force-reset the breaker first via POST /api/v1/webhooks/[id]/circuit-breaker/reset if needed."
    },
    { status: 202 }
  );
}

export const runtime = "nodejs";