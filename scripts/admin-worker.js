import { AdminWorker } from "@/lib/webhook";
const worker = new AdminWorker();
async function shutdown(signal) {
  console.log(`[admin-worker] Received ${signal}, shutting down...`);
  await worker.stop();
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
(async () => {
  console.log("[admin-worker] Starting");
  await worker.start();
  console.log("[admin-worker] Running. Press Ctrl+C to stop.");
})().catch((err) => {
  console.error("[admin-worker] FATAL on start:", err);
  process.exit(1);
});
