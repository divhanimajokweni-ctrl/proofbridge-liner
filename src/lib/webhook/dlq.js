import { db } from "@/lib/db";
import { TOPIC_DLQ } from "./kafka/topics";
async function sendToDLQ(params) {
  const {
    deliveryId,
    webhookId,
    eventId,
    payload,
    reason,
    finalHttpStatus,
    producer,
    triggeredBy = "system"
  } = params;
  const existing = await db.deadLetterQueueEntry.findFirst({
    where: { deliveryId, reason },
    orderBy: { createdAt: "desc" }
  });
  let entryId;
  if (existing) {
    entryId = existing.id;
  } else {
    const created = await db.deadLetterQueueEntry.create({
      data: {
        deliveryId,
        webhookId,
        eventId,
        reason,
        finalHttpStatus,
        payload,
        replayedBy: ""
      }
    });
    entryId = created.id;
  }
  if (producer) {
    const dlqMessage = {
      deliveryId,
      webhookId,
      eventId,
      payload,
      // Tag with triggeredBy for audit
      // (KafkaDeliveryMessage has replayedBy?: string, reuse it)
      replayedBy: triggeredBy
    };
    try {
      await producer.publish(TOPIC_DLQ, webhookId, dlqMessage);
    } catch (err) {
      console.error(
        `[dlq] Failed to publish to Kafka DLQ topic (delivery_id=${deliveryId}):`,
        err
      );
    }
  }
  return { dlqEntryId: entryId };
}
async function markReplayed(deliveryId, reason, replayedBy) {
  await db.deadLetterQueueEntry.updateMany({
    where: { deliveryId, reason },
    data: {
      replayedBy,
      replayedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function listDLQEntries(filters) {
  var _a, _b;
  const where = {};
  if (filters.webhookId) where.webhookId = filters.webhookId;
  if (filters.reason) where.reason = filters.reason;
  if (filters.unreplayedOnly) where.replayedAt = null;
  return db.deadLetterQueueEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: (_a = filters.limit) != null ? _a : 100,
    skip: (_b = filters.offset) != null ? _b : 0
  });
}
export {
  listDLQEntries,
  markReplayed,
  sendToDLQ
};
