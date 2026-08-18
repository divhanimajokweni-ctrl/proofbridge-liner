"use client";

/**
 * Theorem State Store — the single source of truth for what the
 * Evolution Matrix should be visualising.
 *
 * The matrix is NOT a decorative loop. It is the visible face of the
 * fail-closed valve that binds STUDI's governance state to IVE's
 * engineering-release state. This store holds that valve's current
 * verdict and is updated by the theorem-state poller (which itself
 * reads from the live ledger + STUDI gate list + EIS breaker state).
 *
 * Verdict lattice (per workspace):
 *
 *   STUDI:  UNKNOWN        → sphere (0)   (gates not all met — warning hold)
 *           INCONCLUSIVE   → sphere (0)   (mixed — warning hold)
 *           PROVEN         → antone (1)   (all gates met — trust established)
 *
 *   IVE:    UNKNOWN        → web spider (2)   (no proven claims yet)
 *           INCONCLUSIVE   → web spider (2)  (pulsing red — breakers tripped)
 *           PROVEN         → Miles (3)       (release authorised)
 *
 * The breaker state is global: if any EIS Theorem-5 breaker is tripped,
 * IVE falls back to INCONCLUSIVE regardless of claim state. That's the
 * fail-closed bound, visible in the matrix.
 */

import { create } from "zustand";

export type TheoremVerdict = "UNKNOWN" | "INCONCLUSIVE" | "PROVEN";
export type BreakerState = "NORMAL" | "TRIPPED";
export type WorkspaceId = "studi" | "ive";

export interface TheoremState {
  /** STUDI verdict — derived from the governance gate list. */
  studiVerdict: TheoremVerdict;
  /** IVE verdict — derived from claim state × breaker state. */
  iveVerdict: TheoremVerdict;
  /** Global EIS Theorem-5 breaker. */
  breaker: BreakerState;
  /** 0..1 — confidence in the current verdict (auth-claim ratio). */
  confidence: number;
  /** Per-claim live state, for the IVE Claim Verification Injector UI. */
  iveClaims: TheoremIveClaimRow[];
  /** Last time the poller successfully updated the store. */
  lastUpdatedAt: number | null;
  /** True while the initial load is in flight. */
  loading: boolean;
  /** Last error from the poller, if any. */
  error: string | null;
  /** Manual override — non-null when the standalone page slider is dragging. */
  manualStageOverride: number | null;
  /** Setter — called by the poller on every successful /api/theorem-state. */
  hydrate: (next: TheoremSnapshot) => void;
  /** Standalone-page manual override — pins the matrix at a chosen stage. */
  setManualOverride: (stage: number | null) => void;
  clearManualOverride: () => void;
}

/** Per-claim live state as the injector UI renders it. */
export interface TheoremIveClaimRow {
  id: string;
  title: string;
  description: string;
  claimType: string;
  state: string;
  intendedAction: string;
  safetyCritical: boolean;
  authorized: boolean;
  breakerTripped: boolean;
  authorizationReason: string;
  authorizationUpdatedAt: string | null;
  breakerReason: string;
  breakerUpdatedAt: string | null;
}

/** Shape of the data the poller pushes into the store. */
export interface TheoremSnapshot {
  studiVerdict: TheoremVerdict;
  iveVerdict: TheoremVerdict;
  breaker: BreakerState;
  confidence: number;
  iveClaims: TheoremIveClaimRow[];
}

export const useTheoremStore = create<TheoremState>((set) => ({
  studiVerdict: "UNKNOWN",
  iveVerdict: "UNKNOWN",
  breaker: "NORMAL",
  confidence: 0,
  iveClaims: [],
  lastUpdatedAt: null,
  loading: true,
  error: null,
  manualStageOverride: null,
  hydrate: (next) =>
    set({
      ...next,
      loading: false,
      error: null,
      lastUpdatedAt: Date.now(),
    }),
  setManualOverride: (stage) => set({ manualStageOverride: stage }),
  clearManualOverride: () => set({ manualStageOverride: null }),
}));

// ─── Verdict → morph stage mapping (per workspace) ──────────────────────────

const STUDI_STAGE: Record<TheoremVerdict, number> = {
  UNKNOWN: 0,
  INCONCLUSIVE: 0,
  PROVEN: 1,
};

const IVE_STAGE: Record<TheoremVerdict, number> = {
  UNKNOWN: 2,
  INCONCLUSIVE: 2,
  PROVEN: 3,
};

export function stageForWorkspace(
  workspace: WorkspaceId,
  state: TheoremState
): number {
  // Manual override wins (standalone page slider).
  if (state.manualStageOverride !== null) return state.manualStageOverride;
  if (workspace === "studi") return STUDI_STAGE[state.studiVerdict];
  return IVE_STAGE[state.iveVerdict];
}

/**
 * Combined stage for the Valve Cockpit — the morph across all 4
 * stages of the VVU trust story as a single fail-closed valve:
 *
 *   0  SPHERE       STUDI not yet PROVEN (valve's upstream input not ready)
 *   1  ANTONE       STUDI PROVEN · IVE UNKNOWN (governance done, release pending)
 *   2  WEB-SPIDER   STUDI PROVEN · IVE INCONCLUSIVE (active, not yet released)
 *                   — pulsing red when breaker TRIPPED
 *   3  MILES        STUDI PROVEN · IVE PROVEN (full engineering release GO)
 *
 * If STUDI is not PROVEN, the valve's input isn't ready — the matrix
 * stays at sphere regardless of what IVE is doing. This is the visible
 * face of the fail-closed bound: STUDI gates blocked ⇒ IVE release
 * cannot proceed, no matter how many claims are authorised.
 */
export function stageForCockpit(state: TheoremState): number {
  // Manual override wins (standalone page slider).
  if (state.manualStageOverride !== null) return state.manualStageOverride;
  if (state.studiVerdict !== "PROVEN") return 0; // sphere
  if (state.iveVerdict === "PROVEN") return 3; // miles
  if (state.iveVerdict === "INCONCLUSIVE") return 2; // web-spider (+pulsing red if breaker)
  return 1; // antone — STUDI done, IVE waiting
}

// ─── Selectors ──────────────────────────────────────────────────────────────

export function useTheoremStage(workspace: WorkspaceId): {
  stage: number;
  verdict: TheoremVerdict;
  breaker: BreakerState;
  confidence: number;
  loading: boolean;
} {
  return useTheoremStore((s) => {
    const verdict = workspace === "studi" ? s.studiVerdict : s.iveVerdict;
    return {
      stage: stageForWorkspace(workspace, s),
      verdict,
      breaker: s.breaker,
      confidence: s.confidence,
      loading: s.loading,
    };
  });
}
