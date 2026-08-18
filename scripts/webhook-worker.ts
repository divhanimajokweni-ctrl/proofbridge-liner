/**
 * VVU-IVE Webhook Subsystem — Webhook Worker Entry Script
 * ----------------------------------------------------------------------------
 * Run: bun run webhook:worker
 *   (or: bun --hot scripts/webhook-worker.ts for file-watching)
 *
 * Spawns ONE WebhookWorker instance. For Sept 15 launch, run 12 active + 2
 * standby replicas (per K8s deployment). For local dev, one instance is
 * sufficient — Kafka partitioning handles distribution.
 *
 * Env vars:
 *   WEBHOOK_TRANSPORT     = kafka | memory   (default: kafka)
 *   KAFKA_BROKERS         = localhost:9092,localhost:9093,...
 *   KAFKA_CLIENT_ID       = vvu-ive-webhook  (optional)
 *   WORKER_GROUP_ID      = vvu-webhook-delivery-workers (override for canaries)
 *
 * Graceful shutdown:
 *   SIGINT / SIGTERM → stop consumer, disconnect producer, exit 0.
 */

import { WebhookWorker } from "@/lib/webhook";

const worker = new WebhookWorker();

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`[webhook-worker] Received ${signal}, shutting down...`);
  await worker.stop();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

(async () => {
  // eslint-disable-next-line no-console
  console.log(
    `[webhook-worker] Starting — transport=${process.env.WEBHOOK_TRANSPORT ?? "kafka"}, ` +
      `brokers=${process.env.KAFKA_BROKERS ?? "localhost:9092"}`,
  );
  await worker.start();
  // eslint-disable-next-line no-console
  console.log("[webhook-worker] Running. Press Ctrl+C to stop.");
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[webhook-worker] FATAL on start:", err);
  process.exit(1);
});
