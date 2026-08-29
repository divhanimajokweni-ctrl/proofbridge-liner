import { WebhookWorker } from "@/lib/webhook";
const worker = new WebhookWorker();
async function shutdown(signal) {
  console.log(`[webhook-worker] Received ${signal}, shutting down...`);
  await worker.stop();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
(async () => {
  var _a, _b;
  console.log(
    `[webhook-worker] Starting \u2014 transport=${(_a = process.env.WEBHOOK_TRANSPORT) != null ? _a : "kafka"}, brokers=${(_b = process.env.KAFKA_BROKERS) != null ? _b : "localhost:9092"}`
  );
  await worker.start();
  console.log("[webhook-worker] Running. Press Ctrl+C to stop.");
})().catch((err) => {
  console.error("[webhook-worker] FATAL on start:", err);
  process.exit(1);
});
