/**
 * Epistemic Objects Store — local persistence for disagreements.
 *
 * Per operator directive: "Every challenge and response is stored as an
 * epistemic object — not just a chat log, but a structured record of:
 * the claim, the challenge type, the evidence used, the user's response,
 * and the final resolution (Verified / Unresolved / Revised)."
 *
 * This creates a boundary dataset — the most valuable data for improving
 * the system. If IVE challenges 100 claims and 80 are resolved with new
 * evidence, you know where the system is strong. If 20 remain unresolved,
 * you know where the model needs work.
 *
 * Storage: localStorage (Phase 1). Phase 2 will move to the database via
 * /api/studi/challenge (POST and GET).
 */

import type { EpistemicObject } from "./challenge-scanner";

const STORAGE_KEY = "vvu-epistemic-objects";

export function loadEpistemicObjects(): EpistemicObject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EpistemicObject[]) : [];
  } catch {
    return [];
  }
}

export function saveEpistemicObject(obj: EpistemicObject): void {
  if (typeof window === "undefined") return;
  const existing = loadEpistemicObjects();
  const filtered = existing.filter((o) => o.id !== obj.id);
  const updated = [...filtered, obj].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateEpistemicObject(
  id: string,
  patch: Partial<EpistemicObject>,
): EpistemicObject | null {
  if (typeof window === "undefined") return null;
  const existing = loadEpistemicObjects();
  const idx = existing.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const updated = { ...existing[idx], ...patch };
  existing[idx] = updated;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return updated;
}

export function deleteEpistemicObject(id: string): void {
  if (typeof window === "undefined") return;
  const existing = loadEpistemicObjects();
  const filtered = existing.filter((o) => o.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function resetEpistemicObjects(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function generateEpistemicObjectId(): string {
  return `eo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Aggregate statistics for the boundary dataset.
 * Used by the Challenge Mode badge + the operator's epistemic dashboard.
 */
export function getEpistemicStats(): {
  total: number;
  by_resolution: Record<string, number>;
  by_challenge_type: Record<string, number>;
  resolution_rate: number; // (verified + revised) / total
} {
  const all = loadEpistemicObjects();
  if (all.length === 0) {
    return {
      total: 0,
      by_resolution: {},
      by_challenge_type: {},
      resolution_rate: 0,
    };
  }
  const byResolution: Record<string, number> = {};
  const byChallengeType: Record<string, number> = {};
  let resolved = 0;
  for (const obj of all) {
    byResolution[obj.final_resolution] = (byResolution[obj.final_resolution] ?? 0) + 1;
    for (const c of obj.challenges) {
      byChallengeType[c.type] = (byChallengeType[c.type] ?? 0) + 1;
    }
    if (obj.final_resolution === "verified" || obj.final_resolution === "revised") {
      resolved++;
    }
  }
  return {
    total: all.length,
    by_resolution: byResolution,
    by_challenge_type: byChallengeType,
    resolution_rate: resolved / all.length,
  };
}
