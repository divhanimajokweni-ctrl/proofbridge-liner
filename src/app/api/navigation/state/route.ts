export const dynamic = "force-static";
export const revalidate = 5;

import fs from "node:fs";
import path from "node:path";
import { DEFAULT_LIFECYCLE } from "@/lib/validation/state";

function readJsonSafe(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export async function GET() {
  const root = path.join(process.cwd(), "VVU-VAL-001");
  const stateFile = path.join(root, "protocol", "state.json");
  const frozenFile = path.join(root, "protocol", "frozen-build.json");
  const replayFile = path.join(root, "evidence", "replay-result.json");
  const archiveFile = path.join(root, "release", "manifest.json");
  const evidenceDir = path.join(root, "evidence");

  const state = readJsonSafe(stateFile) ?? {};
  const frozen = readJsonSafe(frozenFile);
  const replay = readJsonSafe(replayFile);
  const archive = readJsonSafe(archiveFile);

  const hasFrozen = !!frozen?.frozen_at;
  let lifecycle: typeof DEFAULT_LIFECYCLE = { ...DEFAULT_LIFECYCLE };

  if (state.state && ["REHEARSAL", "RUNNING", "VERIFYING", "COMPLETE", "FAILED", "ARCHIVED"].includes(state.state)) {
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
  lifecycle.runtimeHealthy = readJsonSafe(path.join(root, "release", "runtime-health.json"))?.healthy ?? null;

  if (lifecycle.state === "RUNNING") {
    const archiveReady = lifecycle.deploymentReady === true;
    if (archiveReady && lifecycle.evidenceReady && lifecycle.productionPublished === true) {
      lifecycle.state = "COMPLETE";
    } else if (lifecycle.replayPassed === false || lifecycle.state === "FAILED") {
      lifecycle.state = "FAILED";
    }
  }

  return Response.json(lifecycle);
}

function safeBool(value: any): boolean | null {
  if (value === true || value === "true" || value === "PASS" || value === "archived") return true;
  if (value === false || value === "false" || value === "FAIL" || value === "INVALID") return false;
  return null;
}
