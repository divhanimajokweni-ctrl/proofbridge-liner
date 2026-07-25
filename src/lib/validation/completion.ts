import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { DEFAULT_LIFECYCLE, DEFAULT_GATES, type GateResult, type ValidationLifecycle } from "./state";
import { readEnvelope, envelopeStatus } from "./envelope";

export interface CompletionResult {
  shouldAttempt: boolean;
  reasons: string[];
  missing: string[];
  gateResults: GateResult[];
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
  const incidentsPath = path.join(root, "release", "incidents.json");
  const circuitPath = path.join(root, "release", "circuit-breaker.json");
  const deploymentRecordPath = path.join(root, "release", "deployment-record.json");

  const frozen = existsJson(frozenPath);
  const replay = existsJson(replayPath);
  const archive = existsJson(archivePath);
  const state = existsJson(statePath) ?? {};
  const gates = existsJson(gatesPath);

  if (!frozen?.frozen_at) {
    missing.push("frozen-build");
    reasons.push("Freeze metadata missing.");
  }

  const replayPass = typeof replay?.passed === "boolean" ? replay.passed : typeof replay?.status === "string" ? replay.status.toLowerCase() === "pass" : false;
  if (!replayPass) {
    missing.push("replay-failed");
    reasons.push("Replay verification did not pass.");
  }

  const archived = typeof archive?.status === "string" ? archive.status.toLowerCase() === "archived" : false;
  const hoursReady = typeof archive?.hours === "number" ? archive.hours >= 72 : false;
  if (!archived && !hoursReady) {
    missing.push("archive-incomplete");
    reasons.push("Evidence archive not complete.");
  }

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

  const incidents = existsJson(incidentsPath);
  const unresolvedSev1 = Array.isArray(incidents?.sev1) && incidents.sev1.length > 0;
  const unresolvedSev2 = Array.isArray(incidents?.sev2) && incidents.sev2.length > 0;
  if (unresolvedSev1) {
    missing.push("incidents-sev1");
    reasons.push("Unresolved SEV-1 incidents present.");
  }
  if (unresolvedSev2) {
    missing.push("incidents-sev2");
    reasons.push("Unresolved SEV-2 incidents present.");
  }

  const circuitBreaker = existsJson(circuitPath);
  const circuitOpen = circuitBreaker?.open === true;
  if (circuitOpen) {
    missing.push("circuit-breaker");
    reasons.push("Circuit breaker is active.");
  }

  if (fs.existsSync(deploymentRecordPath)) {
    missing.push("deployment-record-exists");
    reasons.push("deployment-record.json already exists.");
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
  const gateEEvidence = readEnvelope(root, "protocol/gate-e-compliance.json");
  const gateFEvidence = readEnvelope(root, "protocol/gate-f-readiness.json");
  const gateGEvidence = readEnvelope(root, "protocol/gate-g-release.json");
  const evidenceDir = path.join(root, "evidence");

  const state = existsJson(statePath) ?? {};
  const frozen = existsJson(frozenPath);
  const replay = existsJson(replayPath);
  const archive = existsJson(archivePath);
  const runtimeHealth = existsJson(runtimeHealthPath);
  const gates = existsJson(gatesPath);

  const gateResults = normalizeGates(gates);
  const allGatesPassed = gateResults.every((g) => g.passed);

  const hasFrozen = !!frozen?.frozen_at;
  let lifecycle: ValidationLifecycle = { ...DEFAULT_LIFECYCLE };

  if (state.state && ["REHEARSAL","RUNNING","VERIFYING","COMPLETE","FAILED","ARCHIVED","DEPLOY_PENDING","DEPLOYING","DEPLOYED","HEALTH_CHECK","PRODUCTION_ACTIVE"].includes(state.state)) {
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
  lifecycle.archivePassed = typeof archive?.status === "string" ? archive.status.toLowerCase() === "archived" : (archive?.hours ?? 0) >= 72;
  lifecycle.frozenBuildVerified = !!frozen?.frozen_at;
  lifecycle.deploymentReady = safeBool(archive?.status) ?? (!!archive && (archive.hours ?? 0) >= 72) ?? null;
  lifecycle.productionPublished = safeBool(archive?.production_published) ?? null;
  lifecycle.runtimeHealthy = runtimeHealth?.healthy ?? null;
  lifecycle.currentGate = gateResults.find((g) => !g.passed)?.gate ?? (allGatesPassed ? "ALL" : null);
  lifecycle.gatePassed = allGatesPassed;

  const incidents = existsJson(path.join(root, "release", "incidents.json"));
  const unresolvedSev1 = Array.isArray(incidents?.sev1) && incidents.sev1.length > 0;
  const unresolvedSev2 = Array.isArray(incidents?.sev2) && incidents.sev2.length > 0;
  const circuitBreaker = existsJson(path.join(root, "release", "circuit-breaker.json"));
  const circuitOpen = circuitBreaker?.open === true;
  const deploymentRecordExists = fs.existsSync(path.join(root, "release", "deployment-record.json"));

  const gateEComplete = envelopeStatus(gateEEvidence) === "PASS";
  const gateFComplete = envelopeStatus(gateFEvidence) === "PASS";
  const gateGComplete = envelopeStatus(gateGEvidence) === "PASS";

  lifecycle.deploymentEligible = allGatesPassed && gateEComplete && gateFComplete && gateGComplete && !unresolvedSev1 && !unresolvedSev2 && !circuitOpen && !deploymentRecordExists && lifecycle.archivePassed && lifecycle.replayPassed && lifecycle.frozenBuildVerified;
  lifecycle.productionDeployed = lifecycle.deploymentReady === true && lifecycle.productionPublished === true;

  const archiveReady = lifecycle.deploymentReady === true;
  if (lifecycle.state === "RUNNING" || lifecycle.state === "COMPLETE") {
    if (lifecycle.deploymentEligible) {
      lifecycle.state = "DEPLOY_PENDING";
      lifecycle.deployPhase = "Pending deployment";
    } else if (allGatesPassed && archiveReady && hourCount >= 72) {
      lifecycle.state = "COMPLETE";
      lifecycle.deployPhase = "Awaiting deployment";
    }
  }

  if (lifecycle.state === "DEPLOY_PENDING") {
    const record = existsJson(deploymentRecordPath);
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

  if (lifecycle.phase == null && frozen?.phase) lifecycle.phase = frozen.phase;
  if (lifecycle.activeGate == null) lifecycle.activeGate = lifecycle.currentGate;
  if (lifecycle.score == null && typeof lifecycle.validationIndex === "number") lifecycle.score = lifecycle.validationIndex;
  if (lifecycle.elapsed == null && frozen?.frozen_at) {
    const frozenAt = new Date(frozen.frozen_at).getTime();
    if (!Number.isNaN(frozenAt)) lifecycle.elapsed = Date.now() - frozenAt;
  }
  if (!lifecycle.nextAction) {
    lifecycle.nextAction = lifecycle.deploymentEligible ? "Deploy validation" : lifecycle.state === "PRODUCTION_ACTIVE" ? "Observe production" : "Continue evidence collection";
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
      gateResults: check.gateResults,
    };
  }

  fs.writeFileSync(recordPath, JSON.stringify({ status: "deployed", deployed_at: new Date().toISOString() }, null, 2));

  const completionRecord = {
    event: "ProductionDeploy",
    executed_at: new Date().toISOString(),
    frozen: existsJson(frozenPath),
    archive: existsJson(archivePath),
    replay: existsJson(replayPath),
    gates: normalizeGates(existsJson(gatesPath)),
  };

  const target = path.join(root, "release", "completion-record.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(completionRecord, null, 2));

  return {
    shouldAttempt: true,
    reasons: ["ProductionDeploy() executed.", "Deployment record written."],
    missing: [],
    gateResults: check.gateResults,
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

function existsJson(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeBool(value: any): boolean | null {
  if (value === true || value === "true" || value === "PASS" || value === "archived") return true;
  if (value === false || value === "false" || value === "FAIL" || value === "INVALID") return false;
  return null;
}

function runCommand(command: string, args: string[], options: any) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = require("node:child_process").spawn(command, args, { ...options, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}
