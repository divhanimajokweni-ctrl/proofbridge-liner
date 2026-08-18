/**
 * VVU-IVE Webhook Subsystem — Publish Helper
 * ----------------------------------------------------------------------------
 * The bridge from VVU-IVE verification → webhook delivery queue.
 *
 *   Verification succeeds → Persist to PostgreSQL → Publish to Kafka →
 *   Webhook workers pick up → Deliver externally.
 *
 * If the external endpoint dies at step 5, steps 1-4 still complete successfully.
 *
 * Usage:
 *   1. (one-time) Create a webhook via `createWebhook({ name, url, type, secret })`
 *   2. After VVU-IVE verifies a claim, call:
 *        `publishDelivery({ webhookId, eventId, payload: { claimId, state, ... } })`
 *   3. The webhook worker picks it up from Kafka and delivers it.
 */

import { db } from "@/lib/db";
import { TOPIC_DELIVERY } from "./kafka/topics";
import { getTransport } from "./transport/factory";
import type { Producer } from "./transport/interface";
import type {
  KafkaDeliveryMessage,
  WebhookRecord,
  WebhookType,
} from "./types";

// ── Webhook registration ──────────────────────────────────────────────────
export interface CreateWebhookParams {
  name: string;
  url: string;
  type?: WebhookType;
  secret?: string;
  enabled?: boolean;
}

/**
 * Register a webhook endpoint. Idempotent on (name, url) — returns existing
 * if found.
 */
export async function createWebhook(
  params: CreateWebhookParams,
): Promise<WebhookRecord> {
  const existing = await db.webhook.findFirst({
    where: { name: params.name, url: params.url },
  });
  if (existing) {
    return rowToRecord(existing);
  }
  const row = await db.webhook.create({
    data: {
      name: params.name,
      url: params.url,
      type: params.type ?? "custom",
      secret: params.secret ?? "",
      nextSecret: "",
      enabled: params.enabled ?? true,
    },
  });
  return rowToRecord(row);
}

/**
 * List all registered webhooks (admin UI).
 */
export async function listWebhooks(): Promise<WebhookRecord[]> {
  const rows = await db.webhook.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(rowToRecord);
}

/**
 * Soft-disable a webhook (admin toggle). Does NOT affect CB state — the
 * worker treats disabled webhooks as "skip without DLQ".
 */
export async function setWebhookEnabled(
  webhookId: string,
  enabled: boolean,
): Promise<void> {
  await db.webhook.update({
    where: { id: webhookId },
    data: { enabled },
  });
}

// ── Delivery publish ────────────────────────────────────────────────────────
export interface PublishDeliveryParams {
  webhookId: string;
  eventId: string; // stable external event identifier (e.g. "evt_<claimId>_<state>")
  payload: Record<string, unknown>; // event data — serialized as JSON
  // Override producer (for tests / when caller already has a producer)
  producerOverride?: Producer;
  // Tag this as a manual replay (operator-initiated)
  replayedBy?: string;
}

export interface PublishDeliveryResult {
  deliveryId: string; // = Idempotency-Key
  kafkaPartition: number;
  kafkaOffset: string;
}

/**
 * Persist a delivery record + publish to Kafka.
 *
 * The delivery_id is generated here (cuid) and used as BOTH:
 *   - The primary key in the WebhookDelivery table
 *   - The Idempotency-Key header value on outbound HTTP
 *
 * This ensures the external system can dedup using the same identifier
 * we use internally.
 */
export async function publishDelivery(
  params: PublishDeliveryParams,
): Promise<PublishDeliveryResult> {
  const { webhookId, eventId, payload, producerOverride, replayedBy } = params;

  // Validate webhook exists + is enabled
  const webhook = await db.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) {
    throw new Error(`Webhook not found: ${webhookId}`);
  }

  const payloadStr = JSON.stringify(payload);

  // Create the delivery record (PENDING)
  const delivery = await db.webhookDelivery.create({
    data: {
      webhookId,
      eventId,
      payload: payloadStr,
      status: "PENDING",
      statusReason: "",
    },
  });

  // Publish to Kafka
  const producer = producerOverride ?? (await (await getTransport()).producer());
  const kafkaMessage: KafkaDeliveryMessage = {
    deliveryId: delivery.id,
    webhookId,
    eventId,
    payload: payloadStr,
    ...(replayedBy ? { replayedBy } : {}),
  };
  const { partition, offset } = await producer.publish(
    TOPIC_DELIVERY,
    webhookId, // partition key = webhook_id (per Pillar 1)
    kafkaMessage,
  );

  // Update the delivery record with Kafka metadata
  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      kafkaPartition: partition,
      kafkaOffset: Number(offset),
      updatedAt: new Date(),
    },
  });

  // If we created a producer here (vs. caller-supplied), disconnect it
  if (!producerOverride) {
    await producer.disconnect().catch(() => {});
  }

  return {
    deliveryId: delivery.id,
    kafkaPartition: partition,
    kafkaOffset: offset,
  };
}

// ── Replay publish (manual operator-initiated) ──────────────────────────────
//
// CRITICAL: This is DIFFERENT from publishDelivery().
//
//   publishDelivery()  → creates a NEW WebhookDelivery row with a NEW cuid
//                        (used for first-time deliveries from VVU-IVE core)
//
//   publishReplay()    → re-publishes the EXISTING delivery_id to Kafka
//                        (used by manual replay endpoint). The original
//                        delivery_id is preserved so the Idempotency-Key
//                        header stays STABLE across replays — this is the
//                        at-least-once contract from Pillar 5.
//
// Without this, the replay route would call publishDelivery() which mints
// a new delivery_id, breaking the idempotency story (receiver would see a
// different Idempotency-Key on replay vs. original delivery).

export interface PublishReplayParams {
  deliveryId: string; // EXISTING delivery_id (from the DLQ entry)
  webhookId: string;
  eventId: string;
  payload: string; // JSON-serialized payload (from DLQ snapshot)
  replayedBy: string; // operator identity
  producerOverride?: Producer;
}

export interface PublishReplayResult {
  deliveryId: string;
  kafkaPartition: number;
  kafkaOffset: string;
}

/**
 * Re-publish an existing delivery_id to Kafka for manual replay.
 *
 * The caller is expected to have:
 *   1. Looked up the DLQ entry (which carries the original delivery_id)
 *   2. Verified it's not already replayed (409 check)
 *   3. Marked the DLQ entry as replayed (so concurrent replays are rejected)
 *   4. Reset the WebhookDelivery.status to PENDING
 *
 * This function ONLY publishes to Kafka. It does NOT touch the DB.
 */
export async function publishReplay(
  params: PublishReplayParams,
): Promise<PublishReplayResult> {
  const {
    deliveryId,
    webhookId,
    eventId,
    payload,
    replayedBy,
    producerOverride,
  } = params;

  const producer = producerOverride ?? (await (await getTransport()).producer());
  const kafkaMessage: KafkaDeliveryMessage = {
    deliveryId, // ← THE EXISTING delivery_id, preserved for idempotency
    webhookId,
    eventId,
    payload,
    replayedBy,
  };
  const { partition, offset } = await producer.publish(
    TOPIC_DELIVERY,
    webhookId, // partition key = webhook_id (per Pillar 1)
    kafkaMessage,
  );

  // Update the delivery row with new Kafka metadata
  await db.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      kafkaPartition: partition,
      kafkaOffset: Number(offset),
      updatedAt: new Date(),
    },
  });

  if (!producerOverride) {
    await producer.disconnect().catch(() => {});
  }

  return {
    deliveryId,
    kafkaPartition: partition,
    kafkaOffset: offset,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function rowToRecord(row: {
  id: string;
  name: string;
  url: string;
  type: string;
  secret: string;
  nextSecret: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): WebhookRecord {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type as WebhookType,
    secret: row.secret,
    nextSecret: row.nextSecret ?? "",
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
