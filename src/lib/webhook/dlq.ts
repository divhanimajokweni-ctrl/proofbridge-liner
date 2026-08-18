/**
 * VVU-IVE Webhook Subsystem — Dead Letter Queue (Pillar 4)
 * ----------------------------------------------------------------------------
 * Safety net for:
 *   - Events that exhausted all 4 attempts ("exhausted_retries")
 *   - Events that hit a non-retryable error ("non_retryable_error")
 *   - Events skipped because the CB was OPEN ("circuit_breaker_open_skipped")
 *
 * Retention: 30 days.
 * CRITICAL: Skipped events DO NOT auto-retry when CB closes. They stay in
 * the DLQ until an operator explicitly replays them via
 *   POST /api/v1/webhooks/{id}/delivery-attempts/{attempt_id}/retry
 * This prevents accidental replay storms.
 *
 * Two-stage persistence (belt + suspenders):
 *   1. Kafka topic `vvu-webhook-delivery-dlq` (30-day retention, 12 partitions)
 *      — provides a Kafka-side audit trail and external system visibility
 *   2. Postgres `DeadLetterQueueEntry` table — queryable by operators via
 *      the manual replay API
 */

import { db } from "@/lib/db";
import { TOPIC_DLQ } from "./kafka/topics";
import type { Producer } from "./transport/interface";
import type {
  DLQReason,
  KafkaDeliveryMessage,
} from "./types";

export interface SendToDLQParams {
  deliveryId: string;
  webhookId: string;
  eventId: string;
  payload: string;
  reason: DLQReason;
  finalHttpStatus: number;
  // Optional producer instance — if provided, also publish to Kafka DLQ topic
  producer?: Producer;
  // For audit: who/what triggered the DLQ entry
  triggeredBy?: string;
}

/**
 * Persist a DLQ entry to Postgres AND optionally publish to Kafka DLQ topic.
 *
 * Idempotent: if a DLQ entry with the same deliveryId+reason already exists,
 * returns the existing entry instead of duplicating.
 */
export async function sendToDLQ(
  params: SendToDLQParams,
): Promise<{ dlqEntryId: string }> {
  const {
    deliveryId,
    webhookId,
    eventId,
    payload,
    reason,
    finalHttpStatus,
    producer,
    triggeredBy = "system",
  } = params;

  // 1. Persist to Postgres (idempotent on deliveryId+reason via unique check)
  // Note: We don't have a unique constraint on (deliveryId, reason), so we
  // check first to avoid duplicates. This is a soft check — under contention,
  // two workers might both write, but the DLQ is append-only audit so this
  // is acceptable.
  const existing = await db.deadLetterQueueEntry.findFirst({
    where: { deliveryId, reason },
    orderBy: { createdAt: "desc" },
  });
  let entryId: string;
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
        replayedBy: "",
      },
    });
    entryId = created.id;
  }

  // 2. Publish to Kafka DLQ topic (for external audit consumers, retention)
  if (producer) {
    const dlqMessage: KafkaDeliveryMessage = {
      deliveryId,
      webhookId,
      eventId,
      payload,
      // Tag with triggeredBy for audit
      // (KafkaDeliveryMessage has replayedBy?: string, reuse it)
      replayedBy: triggeredBy,
    };
    try {
      await producer.publish(TOPIC_DLQ, webhookId, dlqMessage);
    } catch (err) {
      // Kafka publish failure is non-fatal — the DB row is the source of
      // truth. Log and continue.
      // eslint-disable-next-line no-console
      console.error(
        `[dlq] Failed to publish to Kafka DLQ topic (delivery_id=${deliveryId}):`,
        err,
      );
    }
  }

  return { dlqEntryId: entryId };
}

/**
 * Mark a DLQ entry as replayed (operator-initiated via the manual replay
 * API). Sets replayedBy + replayedAt so the audit trail is complete.
 *
 * Does NOT delete the entry — audit history is preserved.
 */
export async function markReplayed(
  deliveryId: string,
  reason: DLQReason,
  replayedBy: string,
): Promise<void> {
  await db.deadLetterQueueEntry.updateMany({
    where: { deliveryId, reason },
    data: {
      replayedBy,
      replayedAt: new Date(),
    },
  });
}

/**
 * List DLQ entries for admin UI. Filterable by webhook, reason, and
 * replay status.
 */
export async function listDLQEntries(filters: {
  webhookId?: string;
  reason?: DLQReason;
  unreplayedOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters.webhookId) where.webhookId = filters.webhookId;
  if (filters.reason) where.reason = filters.reason;
  if (filters.unreplayedOnly) where.replayedAt = null;

  return db.deadLetterQueueEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
    skip: filters.offset ?? 0,
  });
}
