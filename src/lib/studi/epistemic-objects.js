var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
const STORAGE_KEY = "vvu-epistemic-objects";
function loadEpistemicObjects() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
function saveEpistemicObject(obj) {
  if (typeof window === "undefined") return;
  const existing = loadEpistemicObjects();
  const filtered = existing.filter((o) => o.id !== obj.id);
  const updated = [...filtered, obj].sort(
    (a, b) => b.timestamp.localeCompare(a.timestamp)
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
function updateEpistemicObject(id, patch) {
  if (typeof window === "undefined") return null;
  const existing = loadEpistemicObjects();
  const idx = existing.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const updated = __spreadValues(__spreadValues({}, existing[idx]), patch);
  existing[idx] = updated;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return updated;
}
function deleteEpistemicObject(id) {
  if (typeof window === "undefined") return;
  const existing = loadEpistemicObjects();
  const filtered = existing.filter((o) => o.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
function resetEpistemicObjects() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
function generateEpistemicObjectId() {
  return `eo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function getEpistemicStats() {
  var _a, _b;
  const all = loadEpistemicObjects();
  if (all.length === 0) {
    return {
      total: 0,
      by_resolution: {},
      by_challenge_type: {},
      resolution_rate: 0
    };
  }
  const byResolution = {};
  const byChallengeType = {};
  let resolved = 0;
  for (const obj of all) {
    byResolution[obj.final_resolution] = ((_a = byResolution[obj.final_resolution]) != null ? _a : 0) + 1;
    for (const c of obj.challenges) {
      byChallengeType[c.type] = ((_b = byChallengeType[c.type]) != null ? _b : 0) + 1;
    }
    if (obj.final_resolution === "verified" || obj.final_resolution === "revised") {
      resolved++;
    }
  }
  return {
    total: all.length,
    by_resolution: byResolution,
    by_challenge_type: byChallengeType,
    resolution_rate: resolved / all.length
  };
}
export {
  deleteEpistemicObject,
  generateEpistemicObjectId,
  getEpistemicStats,
  loadEpistemicObjects,
  resetEpistemicObjects,
  saveEpistemicObject,
  updateEpistemicObject
};
