import fs from "node:fs";
import path from "node:path";

export type ValidationState = "REHEARSAL" | "RUNNING" | "COMPLETE" | "FAILED" | "ARCHIVED";

export interface StateDerivation {
  state: ValidationState;
  showRehearsal: boolean;
  showValidation: boolean;
  showEvidence: boolean;
  showRuntime: boolean;
  showDeployments: boolean;
  showAdministration: boolean;
  primaryRoute: "/rehearsal" | "/validation" | "/evidence";
  overviewFocus: "rehearsal" | "validation" | "evidence" | "production";
  canPromote: boolean;
  isProductionReady: boolean;
}

let cached: StateDerivation | null = null;

export function invalidateStateCache() {
  cached = null;
}

function readJsonSafe(filePath: string): any {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readFrozen() {
  const candidates = [
    path.join(process.cwd(), "VVU-VAL-001", "protocol", "frozen-build.json"),
    path.join(process.cwd(), "validation", "frozen-build.json"),
  ];
  for (const file of candidates) {
    const data = readJsonSafe(file);
    if (data) return data;
  }
  return null;
}

function readStateFile() {
  return readJsonSafe(path.join(process.cwd(), "VVU-VAL-001", "protocol", "state.json"));
}

function readValidationIndex() {
  return readJsonSafe(path.join(process.cwd(), "VVU-VAL-001", "protocol", "validation-index.json"));
}

function readReplay() {
  return readJsonSafe(path.join(process.cwd(), "VVU-VAL-001", "evidence", "replay-result.json"));
}

function readArchiveManifest() {
  return readJsonSafe(path.join(process.cwd(), "VVU-VAL-001", "release", "manifest.json"));
}

function isArchiveComplete(archive: any): boolean {
  if (!archive) return false;
  if (archive.status === "archived") return true;
  if (archive.hours && archive.hours >= 72) return true;
  return false;
}

function isReplayPass(replay: any): boolean {
  if (!replay) return false;
  if (typeof replay.passed === "boolean") return replay.passed;
  if (typeof replay.status === "string") return replay.status.toLowerCase() === "pass";
  return false;
}

function validationIndexPasses(meta: any): boolean {
  if (!meta) return false;
  const threshold = meta.threshold ?? 0.95;
  const value = meta.value ?? meta.validation_index ?? meta.index ?? 0;
  return typeof value === "number" && value >= threshold;
}

function is72HourComplete(frozen: any): boolean {
  if (!frozen?.frozen_at) return false;
  const frozenAt = new Date(frozen.frozen_at).getTime();
  if (Number.isNaN(frozenAt)) return false;
  const seventyTwoHours = 72 * 60 * 60 * 1000;
  return Date.now() - frozenAt >= seventyTwoHours;
}

export function deriveValidationState(): StateDerivation {
  if (cached) return cached;

  const frozen = readFrozen();
  const stateFile = readStateFile();
  const replay = readReplay();
  const archive = readArchiveManifest();
  const index = readValidationIndex();

  const hasFrozen = !!frozen;
  const replayPasses = isReplayPass(replay);
  const archiveReady = isArchiveComplete(archive);
  const thresholdPass = hasFrozen ? validationIndexPasses(index) : false;
  const phaseComplete = hasFrozen ? is72HourComplete(frozen) : false;

  let state: ValidationState;
  if (stateFile?.state && ["REHEARSAL", "RUNNING", "COMPLETE", "FAILED", "ARCHIVED"].includes(stateFile.state)) {
    state = stateFile.state;
  } else if (!hasFrozen) {
    state = "REHEARSAL";
  } else if (stateFile?.state === "FAILED" || !replayPasses) {
    state = "FAILED";
  } else if (phaseComplete && archiveReady && thresholdPass) {
    state = "COMPLETE";
  } else {
    state = "RUNNING";
  }

  const isComplete = state === "COMPLETE";
  const isArchived = state === "ARCHIVED";
  const isFailed = state === "FAILED";
  const isRunning = state === "RUNNING";
  const isRehearsal = state === "REHEARSAL";

  const primaryRoute: StateDerivation["primaryRoute"] = isComplete || isArchived ? "/evidence" : "/validation";
  const overviewFocus: StateDerivation["overviewFocus"] = isRehearsal ? "rehearsal" : isComplete || isArchived ? "production" : "validation";

  cached = {
    state,
    showRehearsal: isRehearsal || isRunning,
    showValidation: isRunning,
    showEvidence: isComplete || isArchived,
    showRuntime: isRunning || isComplete || isArchived,
    showDeployments: isComplete || isArchived,
    showAdministration: isRunning || isComplete || isArchived,
    primaryRoute,
    overviewFocus,
    canPromote: isComplete && !isArchived,
    isProductionReady: isComplete || isArchived,
  };

  return cached;
}

export function shouldAttemptCompletion(): boolean {
  const frozen = readFrozen();
  if (!frozen) return false;
  const replay = readReplay();
  const archive = readArchiveManifest();
  const index = readValidationIndex();
  return (
    isReplayPass(replay) &&
    isArchiveComplete(archive) &&
    validationIndexPasses(index) &&
    is72HourComplete(frozen)
  );
}
