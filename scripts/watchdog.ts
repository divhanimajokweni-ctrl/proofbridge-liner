/**
 * Watchdog agent — boots after deploy and runs for the lifetime of
 * the production deployment.
 *
 * Responsibilities:
 *   1. Poll /api/theorem-state every 5s.
 *   2. If the breaker stays TRIPPED for more than 60s, page the
 *      operator (stdout + Webhook if configured).
 *   3. Mirror the latest verdict to the on-chain VVUIVELedger
 *      contract so external systems can verify the valve's state
 *      without trusting the operator UI.
 *   4. Append every decision to vvu_intent_logs (via the
 *      /api/telemetry/intent endpoint — implemented in route.ts
 *      when telemetry routes ship).
 *
 * Environment:
 *   - DASHBOARD_URL        (default http://localhost:3000)
 *   - LEDGER_ADDRESS       (the deployed VVUIVELedger address)
 *   - LEDGER_RPC_URL       (Arbitrum RPC URL)
 *   - LEDGER_PRIVATE_KEY   (operator key, has OPERATOR_ROLE)
 *   - TELEMETRY_DB_URL     (Supabase psql URL — for intent_logs)
 *   - ALERT_WEBHOOK_URL    (optional — Slack/PagerDuty on breaker trip)
 *
 * Run with: bun run scripts/watchdog.ts
 * Production: bundled into the Vercel deployment via package.json
 *             "watchdog:prod" script.
 */

import { config as loadEnv } from "dotenv";
import * as path from "node:path";

// Load .env if present (local dev). In production Vercel, env vars
// are injected directly.
try {
  loadEnv({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // dotenv not installed or no .env — fall through to process.env.
}

const DASHBOARD_URL =
  process.env.DASHBOARD_URL || "http://localhost:3000";
const POLL_INTERVAL_MS = 5_000;
const BREAKER_TRIP_ALERT_THRESHOLD_MS = 60_000;
const LEDGER_ADDRESS = process.env.LEDGER_ADDRESS || "";
const LEDGER_RPC_URL = process.env.LEDGER_RPC_URL || "";
const LEDGER_PRIVATE_KEY = process.env.LEDGER_PRIVATE_KEY || "";
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || "";

interface TheoremState {
  studiVerdict: "UNKNOWN" | "INCONCLUSIVE" | "PROVEN";
  iveVerdict: "UNKNOWN" | "INCONCLUSIVE" | "PROVEN";
  breaker: "NORMAL" | "TRIPPED";
  confidence: number;
  lastUpdatedAt: string;
}

const VERDICT_ENCODE: Record<string, number> = {
  UNKNOWN: 0,
  INCONCLUSIVE: 1,
  PROVEN: 2,
};

const BREAKER_ENCODE: Record<string, number> = {
  NORMAL: 0,
  TRIPPED: 1,
};

async function fetchTheoremState(): Promise<TheoremState | null> {
  try {
    const r = await fetch(`${DASHBOARD_URL}/api/theorem-state`, {
      cache: "no-store",
    });
    if (!r.ok) {
      console.warn(`[watchdog] theorem-state HTTP ${r.status}`);
      return null;
    }
    return (await r.json()) as TheoremState;
  } catch (e) {
    console.warn(
      `[watchdog] theorem-state fetch error:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

async function alertOperator(text: string) {
  console.error(`[watchdog][ALERT] ${text}`);
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // best-effort — don't crash on alert failure
  }
}

// ── On-chain mirror (optional — only if ledger env present) ──────────────
async function mirrorToLedger(state: TheoremState): Promise<void> {
  if (!LEDGER_ADDRESS || !LEDGER_RPC_URL || !LEDGER_PRIVATE_KEY) return;
  // Lazy-load ethers so the script still runs without ethers installed
  // (in which case the ledger mirror is silently skipped).
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(LEDGER_RPC_URL);
    const wallet = new ethers.Wallet(LEDGER_PRIVATE_KEY, provider);
    const abi = [
      "function postVerdict(uint8,uint8,uint8,uint16) external",
    ];
    const ledger = new ethers.Contract(LEDGER_ADDRESS, abi, wallet);
    const studiVerdict = VERDICT_ENCODE[state.studiVerdict] ?? 0;
    const iveVerdict = VERDICT_ENCODE[state.iveVerdict] ?? 0;
    const breaker = BREAKER_ENCODE[state.breaker] ?? 0;
    const confidenceBp = Math.min(10000, Math.round(state.confidence * 10000));
    const tx = await ledger.postVerdict(
      studiVerdict,
      iveVerdict,
      breaker,
      confidenceBp
    );
    console.log(`[watchdog] ledger mirror tx: ${tx.hash}`);
    await tx.wait();
  } catch (e) {
    console.warn(
      `[watchdog] ledger mirror failed:`,
      e instanceof Error ? e.message : String(e)
    );
  }
}

async function main() {
  console.log(`[watchdog] booting`);
  console.log(`[watchdog] dashboard: ${DASHBOARD_URL}`);
  console.log(`[watchdog] poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(
    `[watchdog] ledger mirror: ${LEDGER_ADDRESS ? "enabled" : "disabled (no env)"}`
  );
  console.log(
    `[watchdog] alert webhook: ${ALERT_WEBHOOK_URL ? "enabled" : "disabled (no env)"}`
  );

  let breakerTrippedSince: number | null = null;

  const tick = async () => {
    const state = await fetchTheoremState();
    if (!state) return;

    if (state.breaker === "TRIPPED") {
      if (breakerTrippedSince === null) {
        breakerTrippedSince = Date.now();
        console.warn(
          `[watchdog] breaker TRIPPED at ${state.lastUpdatedAt} — IVE=${state.iveVerdict}`
        );
      } else if (
        Date.now() - breakerTrippedSince >
        BREAKER_TRIP_ALERT_THRESHOLD_MS
      ) {
        await alertOperator(
          `VVU IVE breaker TRIPPED for >${BREAKER_TRIP_ALERT_THRESHOLD_MS / 1000}s — IVE=${state.iveVerdict}, STUDI=${state.studiVerdict}. EIS Theorem 5 fail-closed bound active.`
        );
        // Reset the timer so we don't alert every tick — only every
        // additional 60s.
        breakerTrippedSince = Date.now();
      }
    } else {
      if (breakerTrippedSince !== null) {
        console.log(`[watchdog] breaker NORMAL — recovered`);
      }
      breakerTrippedSince = null;
    }

    // Mirror to ledger every tick (cheap; ledger dedups by timestamp).
    await mirrorToLedger(state);
  };

  // Run the first tick immediately so we don't wait 5s for initial state.
  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

main().catch((e) => {
  console.error(`[watchdog] fatal:`, e);
  process.exit(1);
});
