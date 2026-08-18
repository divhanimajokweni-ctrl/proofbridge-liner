/**
 * VVU-IVE Webhook Subsystem — Admin/Audit Worker Entry Script
 * ----------------------------------------------------------------------------
 * Run: bun run webhook:admin
 *
 * Spawns ONE AdminWorker instance. For Sept 15 launch, run 2 replicas
 * (static pool). Consumes from `vvu-webhook-audit` topic, persists audit
 * events to Postgres (redundant audit trail).
 *
 * Env vars: same as webhook-worker.
 */

import { AdminWorker } from "@/lib/webhook";

const worker = new AdminWorker();

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`[admin-worker] Received ${signal}, shutting down...`);
  await worker.stop();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

(async () => {
  // eslint-disable-next-line no-console
  console.log("[admin-worker] Starting");
  await worker.start();
  // eslint-disable-next-line no-console
  console.log("[admin-worker] Running. Press Ctrl+C to stop.");
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[admin-worker] FATAL on start:", err);
  process.exit(1);
});
