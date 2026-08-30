import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const DEV_SERVER_PORT = process.env.DEV_SERVER_PORT || "3000";
const WATCH_PATHS = (process.env.WATCH_PATHS || "src,contracts,public").split(",").map((p) => p.trim()).filter(Boolean);
const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS || "5000");
const DRY_RUN = (process.env.DRY_RUN || "false") === "true";
const ROOT = path.resolve(__dirname, "..");
const WORKLOG = path.join(ROOT, "worklog.md");
const PIPELINE_RUNS_DIR = path.join(ROOT, ".pipeline-runs");
function log(msg) {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[auto-deploy-watcher ${ts}] ${msg}`);
}
function err(msg) {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  console.error(`[auto-deploy-watcher ${ts}][ERROR] ${msg}`);
}
function appendWorklog(entry) {
  fs.appendFileSync(WORKLOG, entry + "\n");
}
function run(cmd, opts = {}) {
  var _a, _b, _c;
  try {
    const stdout = execSync(cmd, {
      cwd: opts.cwd || ROOT,
      timeout: opts.timeoutMs || 12e4,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { ok: true, stdout: stdout.toString(), stderr: "", code: 0 };
  } catch (e) {
    return {
      ok: false,
      stdout: ((_a = e.stdout) == null ? void 0 : _a.toString()) || "",
      stderr: ((_b = e.stderr) == null ? void 0 : _b.toString()) || "",
      code: (_c = e.status) != null ? _c : null
    };
  }
}
const changedPaths = /* @__PURE__ */ new Set();
let debounceTimer = null;
function watchPath(p) {
  if (!fs.existsSync(p)) {
    err(`watch path does not exist: ${p}`);
    return;
  }
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
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
      err(`onChanges failed: ${(e == null ? void 0 : e.stack) || e}`);
    });
  }, DEBOUNCE_MS);
}
async function onChanges(changed) {
  if (changed.length === 0) return;
  log(`detected ${changed.length} changed path(s):`);
  for (const p of changed.slice(0, 5)) log(`  - ${path.relative(ROOT, p)}`);
  if (changed.length > 5) log(`  ... (+${changed.length - 5} more)`);
  const significant = changed.filter((p) => {
    const rel = path.relative(ROOT, p);
    return !rel.startsWith("node_modules") && !rel.startsWith(".next") && !rel.startsWith(".pipeline-runs") && rel !== "worklog.md" && rel !== "dev.log" && rel !== "watchdog.log" && !rel.endsWith(".log");
  });
  if (significant.length === 0) {
    log(`all changes were noise (logs / caches) \u2014 ignoring.`);
    return;
  }
  log(`${significant.length} significant change(s) \u2014 running verification chain.`);
  log("Step A: hardhat compile \u2026");
  const compileResult = run("npx hardhat compile", { timeoutMs: 6e4 });
  if (!compileResult.ok) {
    err("hardhat compile FAILED \u2014 refusing to dispatch pipeline.");
    appendWorklog(
      `
[auto-deploy-watcher] compile FAILED on ${(/* @__PURE__ */ new Date()).toISOString()}; changes: ${significant.map((p) => path.relative(ROOT, p)).join(", ")}`
    );
    return;
  }
  log("Step A: hardhat compile OK");
  log("Step B: hardhat test \u2026");
  const testResult = run(
    "TS_NODE_PROJECT='./tsconfig.hardhat.json' TS_NODE_TRANSPILE_ONLY=1 npx hardhat test",
    { timeoutMs: 12e4 }
  );
  if (!testResult.ok) {
    err("hardhat test FAILED \u2014 refusing to dispatch pipeline.");
    err(testResult.stderr.slice(-500));
    appendWorklog(
      `
[auto-deploy-watcher] test FAILED on ${(/* @__PURE__ */ new Date()).toISOString()}`
    );
    return;
  }
  log("Step B: hardhat test OK");
  log("Step C: next build \u2026");
  const buildResult = run("npm run build", { timeoutMs: 18e4 });
  if (!buildResult.ok) {
    err("next build FAILED \u2014 refusing to dispatch pipeline.");
    err(buildResult.stderr.slice(-500));
    appendWorklog(
      `
[auto-deploy-watcher] build FAILED on ${(/* @__PURE__ */ new Date()).toISOString()}`
    );
    return;
  }
  log("Step C: next build OK");
  log("Step D: dispatching gpu-pipeline-activation.yml \u2026");
  if (DRY_RUN) {
    log("DRY_RUN=true \u2014 not dispatching. Would have POSTed to:");
    log(`  POST https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`);
    log(`  event_type: dev-sync-verified`);
    appendWorklog(
      `
[auto-deploy-watcher] DRY-RUN dispatch on ${(/* @__PURE__ */ new Date()).toISOString()} \u2014 compile + test + build all OK.`
    );
    return;
  }
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
    err("GITHUB_TOKEN or GITHUB_REPOSITORY not set \u2014 cannot dispatch.");
    err("Set them in env or run with DRY_RUN=true.");
    return;
  }
  if (!fs.existsSync(PIPELINE_RUNS_DIR)) {
    fs.mkdirSync(PIPELINE_RUNS_DIR, { recursive: true });
  }
  const runId = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const runFile = path.join(PIPELINE_RUNS_DIR, `${runId}.json`);
  const runRecord = {
    runId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    changedPaths: significant.map((p) => path.relative(ROOT, p)),
    steps: {
      hardhatCompile: "OK",
      hardhatTest: "OK",
      nextBuild: "OK"
    },
    dispatched: false
  };
  const dispatchResult = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: "dev-sync-verified",
        client_payload: {
          runId,
          timestamp: runRecord.timestamp,
          changedPaths: runRecord.changedPaths,
          source: "auto-deploy-watcher.ts"
        }
      })
    }
  );
  if (dispatchResult.status === 204) {
    log(`Step D: dispatched OK (event_type=dev-sync-verified)`);
    runRecord.dispatched = true;
    fs.writeFileSync(runFile, JSON.stringify(runRecord, null, 2));
    appendWorklog(
      `
[auto-deploy-watcher] dispatched ${runId} on ${(/* @__PURE__ */ new Date()).toISOString()} \u2014 AMD pipeline will trigger; on success it activates the contracts on Arbitrum Sepolia + Polygon Amoy, then deploys to Vercel.`
    );
  } else {
    err(`Step D: dispatch FAILED \u2014 HTTP ${dispatchResult.status}`);
    const body = await dispatchResult.text();
    err(body.slice(0, 500));
    runRecord.dispatched = false;
    fs.writeFileSync(runFile, JSON.stringify(runRecord, null, 2));
    appendWorklog(
      `
[auto-deploy-watcher] dispatch FAILED on ${(/* @__PURE__ */ new Date()).toISOString()} \u2014 HTTP ${dispatchResult.status}. Local verification chain still passed.`
    );
  }
}
async function main() {
  log("auto-deploy-watcher starting");
  log(`  GITHUB_REPOSITORY: ${GITHUB_REPOSITORY || "(not set \u2014 will DRY_RUN)"}`);
  log(`  DEV_SERVER_PORT:   ${DEV_SERVER_PORT}`);
  log(`  WATCH_PATHS:       ${WATCH_PATHS.join(", ")}`);
  log(`  DEBOUNCE_MS:       ${DEBOUNCE_MS}`);
  log(`  DRY_RUN:           ${DRY_RUN}`);
  log(`  ROOT:              ${ROOT}`);
  if (!GITHUB_TOKEN && !DRY_RUN) {
    err("GITHUB_TOKEN not set \u2014 refusing to start (would dispatch with no auth).");
    err("Set DRY_RUN=true if you only want to verify the chain locally.");
    process.exit(1);
  }
  for (const p of WATCH_PATHS) {
    const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
    watchPath(abs);
  }
  log("watcher armed \u2014 waiting for changes \u2026");
  log("Chain: change \u2192 hardhat compile \u2192 hardhat test \u2192 next build \u2192 dispatch.");
  log("On dispatch: AMD MI300x pipeline runs \u2192 contracts activate \u2192 Vercel deploy.");
}
main().catch((e) => {
  err(`boot failed: ${(e == null ? void 0 : e.stack) || e}`);
  process.exit(1);
});
