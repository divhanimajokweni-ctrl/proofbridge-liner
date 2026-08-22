import { config as loadEnv } from "dotenv";
import * as path from "node:path";
try {
  loadEnv({ path: path.resolve(process.cwd(), ".env") });
} catch (e) {
}
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3000";
const POLL_INTERVAL_MS = 5e3;
const BREAKER_TRIP_ALERT_THRESHOLD_MS = 6e4;
const LEDGER_ADDRESS = process.env.LEDGER_ADDRESS || "";
const LEDGER_RPC_URL = process.env.LEDGER_RPC_URL || "";
const LEDGER_PRIVATE_KEY = process.env.LEDGER_PRIVATE_KEY || "";
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || "";
const VERDICT_ENCODE = {
  UNKNOWN: 0,
  INCONCLUSIVE: 1,
  PROVEN: 2
};
const BREAKER_ENCODE = {
  NORMAL: 0,
  TRIPPED: 1
};
async function fetchTheoremState() {
  try {
    const r = await fetch(`${DASHBOARD_URL}/api/theorem-state`, {
      cache: "no-store"
    });
    if (!r.ok) {
      console.warn(`[watchdog] theorem-state HTTP ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (e) {
    console.warn(
      `[watchdog] theorem-state fetch error:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}
async function alertOperator(text) {
  console.error(`[watchdog][ALERT] ${text}`);
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
  } catch (e) {
  }
}
async function mirrorToLedger(state) {
  var _a, _b, _c;
  if (!LEDGER_ADDRESS || !LEDGER_RPC_URL || !LEDGER_PRIVATE_KEY) return;
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(LEDGER_RPC_URL);
    const wallet = new ethers.Wallet(LEDGER_PRIVATE_KEY, provider);
    const abi = [
      "function postVerdict(uint8,uint8,uint8,uint16) external"
    ];
    const ledger = new ethers.Contract(LEDGER_ADDRESS, abi, wallet);
    const studiVerdict = (_a = VERDICT_ENCODE[state.studiVerdict]) != null ? _a : 0;
    const iveVerdict = (_b = VERDICT_ENCODE[state.iveVerdict]) != null ? _b : 0;
    const breaker = (_c = BREAKER_ENCODE[state.breaker]) != null ? _c : 0;
    const confidenceBp = Math.min(1e4, Math.round(state.confidence * 1e4));
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
  let breakerTrippedSince = null;
  const tick = async () => {
    const state = await fetchTheoremState();
    if (!state) return;
    if (state.breaker === "TRIPPED") {
      if (breakerTrippedSince === null) {
        breakerTrippedSince = Date.now();
        console.warn(
          `[watchdog] breaker TRIPPED at ${state.lastUpdatedAt} \u2014 IVE=${state.iveVerdict}`
        );
      } else if (Date.now() - breakerTrippedSince > BREAKER_TRIP_ALERT_THRESHOLD_MS) {
        await alertOperator(
          `VVU IVE breaker TRIPPED for >${BREAKER_TRIP_ALERT_THRESHOLD_MS / 1e3}s \u2014 IVE=${state.iveVerdict}, STUDI=${state.studiVerdict}. EIS Theorem 5 fail-closed bound active.`
        );
        breakerTrippedSince = Date.now();
      }
    } else {
      if (breakerTrippedSince !== null) {
        console.log(`[watchdog] breaker NORMAL \u2014 recovered`);
      }
      breakerTrippedSince = null;
    }
    await mirrorToLedger(state);
  };
  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}
main().catch((e) => {
  console.error(`[watchdog] fatal:`, e);
  process.exit(1);
});
