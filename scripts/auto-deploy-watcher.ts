/**
 * auto-deploy-watcher.ts — VVU automatic deployment chain.
 *
 * Standing operating principle: "no lifting a finger."
 *
 * Architecture:
 *   ┌─────────────────────────┐
 *   │  Next.js dev server      │  (next dev -p 3000)
 *   │  polls ./src for changes │  → triggers HMR
 *   └────────────┬─────────────┘
 *                │ onFileChange
 *                ▼
 *   ┌─────────────────────────┐
 *   │  auto-deploy-watcher.ts │  ← THIS FILE
 *   │  • debounce 5s          │
 *   │  • verify build passes  │
 *   │  • run hardhat test     │
 *   │  • trigger GPU pipeline │
 *   └────────────┬─────────────┘
 *                │ onVerifiedSuccess
 *                ▼
 *   ┌─────────────────────────┐
 *   │  GitHub Actions dispatch│  (POST /repos/{owner}/{repo}/
 *   │  → gpu-pipeline-         │   dispatches  with event_type
 *   │    activation.yml        │   = "dev-sync-verified")
 *   └────────────┬─────────────┘
 *                │ onWorkflowSuccess
 *                ▼
 *   ┌─────────────────────────┐
 *   │  AMD MI300x runner       │
 *   │  → smoke GPU             │
 *   │  → run tests              │
 *   │  → retrieve benchmarks   │
 *   │  → activate() on         │
 *   │    Arbitrum + Polygon    │
 *   └────────────┬─────────────┘
 *                │ onActivateMined
 *                ▼
 *   ┌─────────────────────────┐
 *   │  deploy.sh               │  (called by the runner or by
 *   │  → vercel --prod          │   the watcher directly if no
 *   │  → bind LEDGER_ADDRESS    │   self-hosted GPU runner exists)
 *   │  → boot watchdog          │
 *   └────────────┬─────────────┘
 *                ▼
 *   Live on venturevisionubuntu.co.za
 *
 * This watcher handles the local half of the chain (file change →
 * verified build → trigger GitHub dispatch). The remote half is handled
 * by .github/workflows/gpu-pipeline-activation.yml.
 *
 * Required env:
 *   GITHUB_TOKEN          — fine-grained PAT with `actions: write`
 *                           + `contents: read` on the repo.
 *   GITHUB_REPOSITORY     — e.g. "vvu-studi/venture-vision-ubuntu"
 *   DEV_SERVER_PORT       — default 3000 (the dev server to monitor)
 *   WATCH_PATHS           — comma-separated list of paths to watch
 *                           (default: "src/,contracts/,public/")
 *   DEBOUNCE_MS           — default 5000 (wait for file settles)
 *   DRY_RUN               — default "false" (when "true", prints
 *                           what it WOULD do without dispatching)
 *
 * Run with:
 *   GITHUB_TOKEN=... GITHUB_REPOSITORY=... bun run scripts/auto-deploy-watcher.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync, spawn } from "node:child_process";

// ── Configuration ──────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const DEV_SERVER_PORT = process.env.DEV_SERVER_PORT || "3000";
const WATCH_PATHS = (process.env.WATCH_PATHS || "src,contracts,public")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS || "5000");
const DRY_RUN = (process.env.DRY_RUN || "false") === "true";

const ROOT = path.resolve(__dirname, "..");
const WORKLOG = path.join(ROOT, "worklog.md");
const PIPELINE_RUNS_DIR = path.join(ROOT, ".pipeline-runs");

// ── Helpers ────────────────────────────────────────────────────────────
function log(msg: string) {
  const ts = new Date().toISOString();
  console.log(`[auto-deploy-watcher ${ts}] ${msg}`);
}

function err(msg: string) {
  const ts = new Date().toISOString();
  console.error(`[auto-deploy-watcher ${ts}][ERROR] ${msg}`);
}

function appendWorklog(entry: string) {
  fs.appendFileSync(WORKLOG, entry + "\n");
}

function run(cmd: string, opts: { cwd?: string; timeoutMs?: number } = {}): {
  ok: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
} {
  try {
    const stdout = execSync(cmd, {
      cwd: opts.cwd || ROOT,
      timeout: opts.timeoutMs || 120_000,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout: stdout.toString(), stderr: "", code: 0 };
  } catch (e: any) {
    return {
      ok: false,
      stdout: e.stdout?.toString() || "",
      stderr: e.stderr?.toString() || "",
      code: e.status ?? null,
    };
  }
}

// ── Step 1: detect changes via fs.watch ────────────────────────────────
const changedPaths = new Set<string>();
let debounceTimer: NodeJS.Timeout | null = null;

function watchPath(p: string) {
  if (!fs.existsSync(p)) {
    err(`watch path does not exist: ${p}`);
    return;
  }
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    // Watch the directory recursively. fs.watch on Linux uses inotify
    // and recurses by default for new files.
    fs.watch(p, { recursive: true }, (event, filename) => {
      if (!filename) return;
      const full = path.join(p, filename);
      changedPaths.add(full);
      scheduleFlush();
    });
    log(`watching ${p} (recursive)`);
  } else {
    fs.watch(p, (event) => {
      changedPaths.add(p);
      scheduleFlush();
    });
    log(`watching ${p}`);
  }
}

function scheduleFlush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const paths = Array.from(changedPaths);
    changedPaths.clear();
    debounceTimer = null;
    onChanges(paths).catch((e) => {
      err(`onChanges failed: ${e?.stack || e}`);
    });
  }, DEBOUNCE_MS);
}

// ── Step 2: handle the change batch ────────────────────────────────────
async function onChanges(changed: string[]) {
  if (changed.length === 0) return;
  log(`detected ${changed.length} changed path(s):`);
  for (const p of changed.slice(0, 5)) log(`  - ${path.relative(ROOT, p)}`);
  if (changed.length > 5) log(`  ... (+${changed.length - 5} more)`);

  // Filter out noise: worklog, .next, node_modules, .pipeline-runs
  const significant = changed.filter((p) => {
    const rel = path.relative(ROOT, p);
    return (
      !rel.startsWith("node_modules") &&
      !rel.startsWith(".next") &&
      !rel.startsWith(".pipeline-runs") &&
      rel !== "worklog.md" &&
      rel !== "dev.log" &&
      rel !== "watchdog.log" &&
      !rel.endsWith(".log")
    );
  });
  if (significant.length === 0) {
    log(`all changes were noise (logs / caches) — ignoring.`);
    return;
  }
  log(`${significant.length} significant change(s) — running verification chain.`);

  // ── Step 2a: Hardhat compile ────────────────────────────────────────
  log("Step A: hardhat compile …");
  const compileResult = run("npx hardhat compile", { timeoutMs: 60_000 });
  if (!compileResult.ok) {
    err("hardhat compile FAILED — refusing to dispatch pipeline.");
    appendWorklog(
      `\n[auto-deploy-watcher] compile FAILED on ${new Date().toISOString()}; ` +
        `changes: ${significant.map((p) => path.relative(ROOT, p)).join(", ")}`
    );
    return;
  }
  log("Step A: hardhat compile OK");

  // ── Step 2b: Hardhat test ──────────────────────────────────────────
  log("Step B: hardhat test …");
  const testResult = run(
    "TS_NODE_PROJECT='./tsconfig.hardhat.json' TS_NODE_TRANSPILE_ONLY=1 npx hardhat test",
    { timeoutMs: 120_000 }
  );
  if (!testResult.ok) {
    err("hardhat test FAILED — refusing to dispatch pipeline.");
    err(testResult.stderr.slice(-500));
    appendWorklog(
      `\n[auto-deploy-watcher] test FAILED on ${new Date().toISOString()}`
    );
    return;
  }
  log("Step B: hardhat test OK");

  // ── Step 2c: Next.js build ──────────────────────────────────────────
  log("Step C: next build …");
  const buildResult = run("npm run build", { timeoutMs: 180_000 });
  if (!buildResult.ok) {
    err("next build FAILED — refusing to dispatch pipeline.");
    err(buildResult.stderr.slice(-500));
    appendWorklog(
      `\n[auto-deploy-watcher] build FAILED on ${new Date().toISOString()}`
    );
    return;
  }
  log("Step C: next build OK");

  // ── Step 2d: Dispatch GitHub pipeline ──────────────────────────────
  log("Step D: dispatching gpu-pipeline-activation.yml …");
  if (DRY_RUN) {
    log("DRY_RUN=true — not dispatching. Would have POSTed to:");
    log(`  POST https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`);
    log(`  event_type: dev-sync-verified`);
    appendWorklog(
      `\n[auto-deploy-watcher] DRY-RUN dispatch on ${new Date().toISOString()} — ` +
        `compile + test + build all OK.`
    );
    return;
  }

  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
    err("GITHUB_TOKEN or GITHUB_REPOSITORY not set — cannot dispatch.");
    err("Set them in env or run with DRY_RUN=true.");
    return;
  }

  // Record the run start for provenance.
  if (!fs.existsSync(PIPELINE_RUNS_DIR)) {
    fs.mkdirSync(PIPELINE_RUNS_DIR, { recursive: true });
  }
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runFile = path.join(PIPELINE_RUNS_DIR, `${runId}.json`);
  const runRecord = {
    runId,
    timestamp: new Date().toISOString(),
    changedPaths: significant.map((p) => path.relative(ROOT, p)),
    steps: {
      hardhatCompile: "OK",
      hardhatTest: "OK",
      nextBuild: "OK",
    },
    dispatched: false,
  };

  // Dispatch via repository_dispatch event.
  const dispatchResult = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "dev-sync-verified",
        client_payload: {
          runId,
          timestamp: runRecord.timestamp,
          changedPaths: runRecord.changedPaths,
          source: "auto-deploy-watcher.ts",
        },
      }),
    }
  );

  if (dispatchResult.status === 204) {
    log(`Step D: dispatched OK (event_type=dev-sync-verified)`);
    runRecord.dispatched = true;
    fs.writeFileSync(runFile, JSON.stringify(runRecord, null, 2));
    appendWorklog(
      `\n[auto-deploy-watcher] dispatched ${runId} on ${new Date().toISOString()} — ` +
        `AMD pipeline will trigger; on success it activates the contracts ` +
        `on Arbitrum Sepolia + Polygon Amoy, then deploys to Vercel.`
    );
  } else {
    err(`Step D: dispatch FAILED — HTTP ${dispatchResult.status}`);
    const body = await dispatchResult.text();
    err(body.slice(0, 500));
    runRecord.dispatched = false;
    fs.writeFileSync(runFile, JSON.stringify(runRecord, null, 2));
    appendWorklog(
      `\n[auto-deploy-watcher] dispatch FAILED on ${new Date().toISOString()} — ` +
        `HTTP ${dispatchResult.status}. Local verification chain still passed.`
    );
  }
}

// ── Boot ────────────────────────────────────────────────────────────────
async function main() {
  log("auto-deploy-watcher starting");
  log(`  GITHUB_REPOSITORY: ${GITHUB_REPOSITORY || "(not set — will DRY_RUN)"}`);
  log(`  DEV_SERVER_PORT:   ${DEV_SERVER_PORT}`);
  log(`  WATCH_PATHS:       ${WATCH_PATHS.join(", ")}`);
  log(`  DEBOUNCE_MS:       ${DEBOUNCE_MS}`);
  log(`  DRY_RUN:           ${DRY_RUN}`);
  log(`  ROOT:              ${ROOT}`);

  if (!GITHUB_TOKEN && !DRY_RUN) {
    err("GITHUB_TOKEN not set — refusing to start (would dispatch with no auth).");
    err("Set DRY_RUN=true if you only want to verify the chain locally.");
    process.exit(1);
  }

  for (const p of WATCH_PATHS) {
    const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
    watchPath(abs);
  }

  log("watcher armed — waiting for changes …");
  log("Chain: change → hardhat compile → hardhat test → next build → dispatch.");
  log("On dispatch: AMD MI300x pipeline runs → contracts activate → Vercel deploy.");
}

main().catch((e) => {
  err(`boot failed: ${e?.stack || e}`);
  process.exit(1);
});
