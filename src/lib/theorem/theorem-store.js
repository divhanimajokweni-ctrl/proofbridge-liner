"use client";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { create } from "zustand";
const useTheoremStore = create((set) => ({
  studiVerdict: "UNKNOWN",
  iveVerdict: "UNKNOWN",
  breaker: "NORMAL",
  confidence: 0,
  iveClaims: [],
  lastUpdatedAt: null,
  loading: true,
  error: null,
  manualStageOverride: null,
  hydrate: (next) => set(__spreadProps(__spreadValues({}, next), {
    loading: false,
    error: null,
    lastUpdatedAt: Date.now()
  })),
  setManualOverride: (stage) => set({ manualStageOverride: stage }),
  clearManualOverride: () => set({ manualStageOverride: null })
}));
const STUDI_STAGE = {
  UNKNOWN: 0,
  INCONCLUSIVE: 0,
  PROVEN: 1
};
const IVE_STAGE = {
  UNKNOWN: 2,
  INCONCLUSIVE: 2,
  PROVEN: 3
};
function stageForWorkspace(workspace, state) {
  if (state.manualStageOverride !== null) return state.manualStageOverride;
  if (workspace === "studi") return STUDI_STAGE[state.studiVerdict];
  return IVE_STAGE[state.iveVerdict];
}
function stageForCockpit(state) {
  if (state.manualStageOverride !== null) return state.manualStageOverride;
  if (state.studiVerdict !== "PROVEN") return 0;
  if (state.iveVerdict === "PROVEN") return 3;
  if (state.iveVerdict === "INCONCLUSIVE") return 2;
  return 1;
}
function useTheoremStage(workspace) {
  return useTheoremStore((s) => {
    const verdict = workspace === "studi" ? s.studiVerdict : s.iveVerdict;
    return {
      stage: stageForWorkspace(workspace, s),
      verdict,
      breaker: s.breaker,
      confidence: s.confidence,
      loading: s.loading
    };
  });
}
export {
  stageForCockpit,
  stageForWorkspace,
  useTheoremStage,
  useTheoremStore
};
