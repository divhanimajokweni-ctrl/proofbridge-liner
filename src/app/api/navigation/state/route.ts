export const dynamic = "force-static";
export const revalidate = 5;

import fs from "node:fs";
import path from "node:path";

function readJsonSafe(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export async function GET() {
  const stateFile = path.join(process.cwd(), "VVU-VAL-001", "protocol", "state.json");
  const frozenFile = path.join(process.cwd(), "VVU-VAL-001", "protocol", "frozen-build.json");
  const replay = path.join(process.cwd(), "VVU-VAL-001", "evidence", "replay-result.json");
  const archive = path.join(process.cwd(), "VVU-VAL-001", "release", "manifest.json");

  const state = readJsonSafe(stateFile);
  const frozen = readJsonSafe(frozenFile);
  const replayResult = readJsonSafe(replay);
  const release = readJsonSafe(archive);

  const hasFrozen = !!frozen;
  const replayPasses = typeof replayResult?.passed === "boolean" ? replayResult.passed : typeof replayResult?.status === "string" ? replayResult.status.toLowerCase() === "pass" : false;
  const archiveReady = !!release && (release.status === "archived" || (typeof release.hours === "number" && release.hours >= 72));
  const thresholdPass = hasFrozen ? (() => { const threshold = frozen.threshold ?? 0.95; const value = frozen.value ?? frozen.validation_index ?? frozen.index ?? 0; return typeof value === "number" && value >= threshold; })() : false;
  const phaseComplete = hasFrozen ? (() => { const frozenAt = new Date(frozen.frozen_at).getTime(); return !Number.isNaN(frozenAt) && Date.now() - frozenAt >= 72 * 60 * 60 * 1000; })() : false;

  let derivedState = "REHEARSAL";
  if (state?.state && ["REHEARSAL","RUNNING","COMPLETE","FAILED","ARCHIVED"].includes(state.state)) {
    derivedState = state.state;
  } else if (!hasFrozen) {
    derivedState = "REHEARSAL";
  } else if (state?.state === "FAILED" || !replayPasses) {
    derivedState = "FAILED";
  } else if (phaseComplete && archiveReady && thresholdPass) {
    derivedState = "COMPLETE";
  } else {
    derivedState = "RUNNING";
  }

  return Response.json({
    state: derivedState,
    frozen: frozen ? { validation_event: frozen.validation_event, frozen_at: frozen.frozen_at, commit_short: frozen.commit_short, image_status: frozen.image_status } : null,
  });
}
