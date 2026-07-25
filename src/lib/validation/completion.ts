import fs from "node:fs";
import path from "node:path";

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

  if (!fs.existsSync(frozenPath)) {
    missing.push("frozen-build");
    reasons.push("Freeze metadata missing.");
  }

  const frozen = fs.existsSync(frozenPath) ? safeReadJson(frozenPath) : null;
  if (!frozen?.frozen_at) {
    missing.push("frozen-build-metadata");
    reasons.push("Freeze metadata incomplete.");
  }

  if (!fs.existsSync(replayPath)) {
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

  if (!fs.existsSync(archivePath)) {
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

  if (!fs.existsSync(statePath)) {
    missing.push("state");
    reasons.push("Validation state file missing.");
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
    reasons.push("Ready to execute ValidationComplete().");
  }

  return { shouldAttempt, reasons, missing };
}

export async function executeValidationComplete(): Promise<CompletionResult> {
  const check = await shouldAttemptCompletion();
  if (!check.shouldAttempt) {
    return check;
  }

  const root = path.join(process.cwd(), "VVU-VAL-001");
  const completionRecord = {
    event: "ValidationComplete",
    executed_at: new Date().toISOString(),
    frozen: safeReadJson(path.join(root, "protocol", "frozen-build.json")),
    archive: safeReadJson(path.join(root, "release", "manifest.json")),
    replay: safeReadJson(path.join(root, "evidence", "replay-result.json")),
  };

  const target = path.join(root, "release", "completion-record.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(completionRecord, null, 2));

  return {
    shouldAttempt: true,
    reasons: ["ValidationComplete() executed.", "Completion record written."],
    missing: [],
  };
}

function safeReadJson(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
