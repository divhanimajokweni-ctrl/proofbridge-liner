import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { DEFAULT_LIFECYCLE, DEFAULT_GATES, type GateResult, type ValidationLifecycle } from "./state";

export interface CompletionResult {
  shouldAttempt: boolean;
  reasons: string[];
  missing: string[];
}

export async function shouldAttemptCompletion(): Promise<CompletionResult> {
  const root = path.join(process.cwd(), "VVU-VAL-001");
  const missing: string[] = [];
  const reasons: string[] = [];

  const frozenPath = path.join(root, "protocol", "frozen-build.json");
  const replayPath = path.join(root, "evidence", "replay-result.json");
  const archivePath = path.join(root, "release", "manifest.json");
  const statePath = path.join(root, "protocol", "state.json");
  const gatesPath = path.join(root, "protocol", "gates.json");

  const exists = (p: string) => fs.existsSync(p);

  if (!exists(frozenPath)) {
    missing.push("frozen-build");
    reasons.push("Freeze metadata missing.");
  }

  const frozen = exists(frozenPath) ? safeReadJson(frozenPath) : null;
  if (!frozen?.frozen_at) {
    missing.push("frozen-build-metadata");
    reasons.push("Freeze metadata incomplete.");
  }

  if (!exists(replayPath)) {
    missing.push("replay-result");
    reasons.push("Replay verification missing.");
  } else {
    const replay = safeReadJson(replayPath);
    const replayPass = typeof replay?.passed === "boolean" ? replay.passed : typeof replay?.status === "string" ? replay.status.toLowerCase() === "pass" : false;
    if (!replayPass) {
      missing.push("replay-failed");
      reasons.push("Replay verification did not pass.");
    }
  }

  if (!exists(archivePath)) {
    missing.push("archive");
    reasons.push("Evidence archive missing.");
  } else {
    const archive = safeReadJson(archivePath);
    const archived = typeof archive?.status === "string" ? archive.status.toLowerCase() === "archived" : false;
    const hoursReady = typeof archive?.hours === "number" ? archive.hours >= 72 : false;
    if (!archived && !hoursReady) {
      missing.push("archive-incomplete");
      reasons.push("Evidence archive not complete.");
    }
  }

  if (!exists(statePath)) {
    missing.push("state");
    reasons.push("Validation state file missing.");
  }

  if (!exists(gatesPath)) {
    missing.push("gates");
    reasons.push("Gate results missing.");
  }

  const gates = exists(gatesPath) ? safeReadJson(gatesPath) : null;
  const gateResults = normalizeGates(gates);
  const allPassed = gateResults.every((g) => g.passed);
  if (!allPassed) {
    missing.push("gates-incomplete");
    reasons.push("One or more protocol gates have not passed.");
  }

  if (frozen?.validation_index != null) {
    const threshold = frozen.threshold ?? 0.95;
    if (typeof frozen.validation_index !== "number" || frozen.validation_index < threshold) {
      missing.push("validation-index");
      reasons.push(`Validation index ${frozen.validation_index} below threshold ${threshold}.`);
    }
  }

  if (frozen?.frozen_at) {
    const frozenAt = new Date(frozen.frozen_at).getTime();
    const elapsedMs = Date.now() - frozenAt;
    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    if (elapsedMs < seventyTwoHoursMs) {
      missing.push("runtime-incomplete");
      reasons.push(`72-hour runtime incomplete; elapsed ${Math.floor(elapsedMs / 1000)}s.`);
    }
  }

  const shouldAttempt = missing.length === 0;

  if (shouldAttempt) {
    reasons.push("All protocol gates passed.");
    reasons.push("Ready to execute ProductionDeploy().");
  }

  return { shouldAttempt, reasons, missing, gateResults };
}

export async function evaluateGates(): Promise<{ lifecycle: ValidationLifecycle; gates: GateResult[] }> {
  const root = path.join(process.cwd(), "VVU-VAL-001");
  const statePath = path.join(root, "protocol", "state.json");
  const frozenPath = path.join(root, "protocol", "frozen-build.json");
  const replayPath = path.join(root, "evidence", "replay-result.json");
  const archivePath = path.join(root, "release", "manifest.json");
  const runtimeHealthPath = path.join(root, "release", "runtime-health.json");
  const gatesPath = path.join(root, "protocol", "gates.json");
  const evidenceDir = path.join(root, "evidence");

  const state = safeReadJson(statePath) ?? {};
  const frozen = safeReadJson(frozenPath);
  const replay = safeReadJson(replayPath);
  const archive = safeReadJson(archivePath);
  const runtimeHealth = safeReadJson(runtimeHealthPath);
  const gates = safeReadJson(gatesPath);

  const gateResults = normalizeGates(gates);
  const allGatesPassed = gateResults.every((g) => g.passed);

  const hasFrozen = !!frozen?.frozen_at;
  let lifecycle: ValidationLifecycle = { ...DEFAULT_LIFECYCLE };

  if (state.state && ["REHEARSAL", "RUNNING", "VERIFYING", "COMPLETE", "FAILED", "ARCHIVED", "DEPLOY_PENDING", "DEPLOYING", "DEPLOYED", "HEALTH_CHECK", "PRODUCTION_ACTIVE"].includes(state.state)) {
    lifecycle.state = state.state;
  } else if (!hasFrozen) {
    lifecycle.state = "REHEARSAL";
  } else {
    lifecycle.state = "RUNNING";
    lifecycle.currentHour = typeof frozen.current_hour === "number" ? frozen.current_hour : null;
    lifecycle.currentPhase = frozen.phase ?? null;
    lifecycle.validationIndex = typeof frozen.validation_index === "number" ? frozen.validation_index : null;
  }

  let hourCount = 0;
  try {
    if (fs.existsSync(evidenceDir)) {
      hourCount = fs.readdirSync(evidenceDir, { withFileTypes: true }).filter((entry) => /^Hour-\d{2}$/.test(entry.name) && entry.isDirectory()).length;
    }
  } catch {
    hourCount = 0;
  }

  lifecycle.evidenceReady = hourCount > 0;
  lifecycle.replayPassed = typeof replay?.status === "string" ? replay.status.toLowerCase() === "pass" : typeof replay?.passed === "boolean" ? replay.passed : null;
  lifecycle.deploymentReady = safeBool(archive?.status) ?? (!!archive && (archive.hours ?? 0) >= 72) ?? null;
  lifecycle.productionPublished = safeBool(archive?.production_published) ?? null;
  lifecycle.runtimeHealthy = runtimeHealth?.healthy ?? null;
  lifecycle.currentGate = gateResults.find((g) => !g.passed)?.gate ?? (allGatesPassed ? "ALL" : null);
  lifecycle.gatePassed = allGatesPassed;

  const archiveReady = lifecycle.deploymentReady === true;
  if (lifecycle.state === "RUNNING" || lifecycle.state === "COMPLETE") {
    if (!archiveReady || !lifecycle.evidenceReady || lifecycle.productionPublished !== true) {
      if (allGatesPassed && hasFrozen && archiveReady && hourCount >= 72) {
        lifecycle.state = "DEPLOY_PENDING";
        lifecycle.deployPhase = "Pending deployment";
      } else if (allGatesPassed) {
        lifecycle.state = "COMPLETE";
        lifecycle.deployPhase = "Awaiting archive";
      }
    } else if (archiveReady && lifecycle.evidenceReady && lifecycle.productionPublished === true) {
      lifecycle.state = "PRODUCTION_ACTIVE";
      lifecycle.deployPhase = "Published";
    }
  }

  if (lifecycle.state === "DEPLOY_PENDING") {
    const deploymentRecordPath = path.join(root, "release", "deployment-record.json");
    if (fs.existsSync(deploymentRecordPath)) {
      const record = safeReadJson(deploymentRecordPath);
      if (record?.status === "deploying") {
        lifecycle.state = "DEPLOYING";
        lifecycle.deployPhase = "Deploying";
      } else if (record?.status === "deployed") {
        lifecycle.state = "DEPLOYED";
        lifecycle.deployPhase = "Deployed";
      } else if (record?.status === "healthy") {
        lifecycle.state = "HEALTH_CHECK";
        lifecycle.deployPhase = "Health check";
      } else if (record?.status === "production") {
        lifecycle.state = "PRODUCTION_ACTIVE";
        lifecycle.deployPhase = "Published";
      }
    }
  }

  return { lifecycle, gates: gateResults };
}

export async function executeProductionDeploy() {
  const check = await shouldAttemptCompletion();
  if (!check.shouldAttempt) {
    return check;
  }

  const root = path.join(process.cwd(), "VVU-VAL-001");
  const recordPath = path.join(root, "release", "deployment-record.json");

  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, JSON.stringify({ status: "deploying", started_at: new Date().toISOString() }, null, 2));

  const command = process.env.VVU_DEPLOY_COMMAND ?? "bash VVU-VAL-001/deploy/argocd/scripts/deploy.sh";
  const result = await runCommand("bash", ["-lc", command], { cwd: root, stdio: "pipe" });

  if (result.code !== 0) {
    fs.writeFileSync(recordPath, JSON.stringify({ status: "failed", error: result.stderr || result.stdout, failed_at: new Date().toISOString() }, null, 2));
    return {
      shouldAttempt: false,
      reasons: ["ProductionDeploy() failed.", (result.stderr || result.stdout || "").trim()],
      missing: ["deploy-execution"],
    };
  }

  fs.writeFileSync(recordPath, JSON.stringify({ status: "deployed", deployed_at: new Date().toISOString() }, null, 2));

  const completionRecord = {
    event: "ProductionDeploy",
    executed_at: new Date().toISOString(),
    frozen: safeReadJson(path.join(root, "protocol", "frozen-build.json")),
    archive: safeReadJson(path.join(root, "release", "manifest.json")),
    replay: safeReadJson(path.join(root, "evidence", "replay-result.json")),
    gates: normalizeGates(safeReadJson(path.join(root, "protocol", "gates.json"))),
  };

  const target = path.join(root, "release", "completion-record.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(completionRecord, null, 2));

  return {
    shouldAttempt: true,
    reasons: ["ProductionDeploy() executed.", "Deployment record written."],
    missing: [],
  };
}

function normalizeGates(gates: any): GateResult[] {
  if (!Array.isArray(gates)) return DEFAULT_GATES;
  return gates.map((g: any) => ({
    gate: String(g.gate ?? g.name ?? "?"),
    passed: typeof g.passed === "boolean" ? g.passed : typeof g.status === "string" ? g.status.toLowerCase() === "pass" : false,
    detail: g.detail ?? g.description ?? "",
  }));
}

function safeBool(value: any): boolean | null {
  if (value === true || value === "true" || value === "PASS" || value === true) return true;
  if (value === false || value === "false" || value === "FAIL" || value === "INVALID") return false;
  return null;
}

function safeReadJson(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function runCommand(command: string, args: string[], options: any) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(command, args, { ...options, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}
