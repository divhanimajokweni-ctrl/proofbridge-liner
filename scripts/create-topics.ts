/**
 * VVU-IVE Webhook Subsystem — Kafka Topic Creation Script
 * ----------------------------------------------------------------------------
 * Run: bun run webhook:create-topics
 *
 * Idempotent — safe to run on every deploy. Creates (or updates config on):
 *   vvu-webhook-delivery        12 partitions, RF=3, 7d retention
 *   vvu-webhook-delivery-dlq    12 partitions, RF=3, 30d retention
 *   vvu-webhook-audit           12 partitions, RF=3, 7d retention
 *
 * Env vars:
 *   KAFKA_BROKERS   = localhost:9092,localhost:9093,...
 */

import { createTopics } from "@/lib/webhook/kafka/admin";

(async () => {
  // eslint-disable-next-line no-console
  console.log("[create-topics] Connecting to Kafka...");
  const results = await createTopics();
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(
      `  ${r.topic.padEnd(30)} ${r.status}${r.error ? ` — ${r.error}` : ""}`,
    );
  }
  // eslint-disable-next-line no-console
  console.log("[create-topics] Done.");
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[create-topics] FATAL:", err);
  process.exit(1);
});
