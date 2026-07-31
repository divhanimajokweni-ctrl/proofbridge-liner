/**
 * VVU Workspace Store
 *
 * Zustand-based state management for the VVU workspace.
 * Manages active product/capability, dock states, focus mode,
 * trust journey progress, and layout persistence.
 */

import { create } from "zustand";
import {
  type LayoutConfig,
  type DockConfig,
  createDefaultLayout,
  loadLayout,
  saveLayout,
  updateDock,
  toggleFocusMode as engineToggleFocusMode,
  setActiveProductInLayout,
} from "./layout-engine";
import {
  type WorkspaceMode,
  type EpistemicMaturity,
  getWorkspaceModeForMaturity,
  getDockItemsForMode,
  MATURITY_STAGES,
  getMaturityIndex,
} from "./three-roots";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Runtime state for a single dock edge. */
export interface DockState {
  visible: boolean;
  pinned: boolean;
  width: number;
  items: string[];
}

/** Progress through a trust journey for a capability. */
export interface TrustJourneyProgress {
  /** IDs of completed steps */
  completedSteps: string[];
  /** Whether the full journey is completed */
  completed: boolean;
  /** ISO timestamp of last progress update */
  lastUpdated: string;
}

/** Full workspace state. */
export interface WorkspaceState {
  // ---- Core state ----
  activeProduct: string | null;
  activeCapability: string | null;
  focusMode: boolean;

  // ---- Workspace Mode ----
  workspaceMode: WorkspaceMode;
  currentMaturity: EpistemicMaturity;
  showTrustPassport: boolean;
  showAgentPanel: boolean;
  activeAgentId: string | null;

  // ---- Docks ----
  docks: {
    left: DockState;
    right: DockState;
    top: DockState;
    bottom: DockState;
  };

  // ---- Trust ----
  trustPassport: Record<string, TrustJourneyProgress>;

  // ---- Layout ----
  layoutVersion: number;

  // ---- Actions ----
  setActiveProduct: (id: string | null) => void;
  setActiveCapability: (id: string | null) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setCurrentMaturity: (maturity: EpistemicMaturity) => void;
  toggleTrustPassport: () => void;
  toggleAgentPanel: () => void;
  setActiveAgent: (id: string | null) => void;
  toggleFocusMode: () => void;
  toggleDock: (position: "left" | "right" | "top" | "bottom") => void;
  pinDock: (position: "left" | "right" | "top" | "bottom") => void;
  setDockWidth: (position: "left" | "right" | "top" | "bottom", width: number) => void;
  setDockItems: (position: "left" | "right" | "top" | "bottom", items: string[]) => void;
  updateTrustProgress: (capabilityId: string, stepId: string, completed: boolean) => void;
  resetTrustProgress: (capabilityId: string) => void;
  isTrustStepCompleted: (capabilityId: string, stepId: string) => boolean;
  isTrustJourneyCompleted: (capabilityId: string) => boolean;
  persistLayout: () => void;
  loadLayout: () => void;
  resetLayout: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRUST_STORAGE_KEY = "vvu-trust-passport";

/**
 * Convert a DockConfig (from layout-engine) to a DockState (runtime).
 */
function dockConfigToState(cfg: DockConfig): DockState {
  return {
    visible: cfg.visible,
    pinned: cfg.pinned,
    width: cfg.width,
    items: cfg.items,
  };
}

/**
 * Load trust passport from localStorage.
 */
function loadTrustPassport(): Record<string, TrustJourneyProgress> {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const json = window.localStorage.getItem(TRUST_STORAGE_KEY);
    if (!json) return {};
    return JSON.parse(json) as Record<string, TrustJourneyProgress>;
  } catch {
    return {};
  }
}

/**
 * Save trust passport to localStorage.
 */
function saveTrustPassport(passport: Record<string, TrustJourneyProgress>): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(passport));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  const defaultLayout = createDefaultLayout();

  return {
    // ---- Initial state ----
    activeProduct: defaultLayout.activeProduct,
    activeCapability: null,
    focusMode: defaultLayout.focusMode,
    workspaceMode: "engineering" as WorkspaceMode,
    currentMaturity: "unknown" as EpistemicMaturity,
    showTrustPassport: false,
    showAgentPanel: false,
    activeAgentId: null,
    docks: {
      left: dockConfigToState(defaultLayout.docks.left),
      right: dockConfigToState(defaultLayout.docks.right),
      top: dockConfigToState(defaultLayout.docks.top),
      bottom: dockConfigToState(defaultLayout.docks.bottom),
    },
    trustPassport: {},
    layoutVersion: defaultLayout.version,

    // ---- Actions ----

    setActiveProduct: (id) => {
      set({ activeProduct: id });
      // Auto-persist after product change
      const state = get();
      get().persistLayout();
      // Suppress unused variable warning — state is used for side effects
      void state;
    },

    setActiveCapability: (id) => {
      set({ activeCapability: id });
    },

    setWorkspaceMode: (mode) => {
      set((state) => ({
        workspaceMode: mode,
        // Update dock items based on the new workspace mode
        docks: {
          ...state.docks,
          left: {
            ...state.docks.left,
            items: getDockItemsForMode(mode, "left"),
          },
          right: {
            ...state.docks.right,
            items: getDockItemsForMode(mode, "right"),
          },
          bottom: {
            ...state.docks.bottom,
            items: getDockItemsForMode(mode, "bottom"),
          },
        },
      }));
      get().persistLayout();
    },

    setCurrentMaturity: (maturity) => {
      const mode = getWorkspaceModeForMaturity(maturity);
      set({ currentMaturity: maturity, workspaceMode: mode });
      // Also update dock items for the new mode
      get().setWorkspaceMode(mode);
    },

    toggleTrustPassport: () => {
      set((state) => ({ showTrustPassport: !state.showTrustPassport }));
    },

    toggleAgentPanel: () => {
      set((state) => ({ showAgentPanel: !state.showAgentPanel }));
    },

    setActiveAgent: (id) => {
      set({ activeAgentId: id });
    },

    toggleFocusMode: () => {
      set((state) => {
        const newFocus = !state.focusMode;
        return {
          focusMode: newFocus,
          // When entering focus mode, auto-hide side docks
          docks: {
            ...state.docks,
            left: {
              ...state.docks.left,
              visible: newFocus ? false : state.docks.left.visible,
              pinned: newFocus ? false : state.docks.left.pinned,
            },
            right: {
              ...state.docks.right,
              visible: newFocus ? false : state.docks.right.visible,
              pinned: newFocus ? false : state.docks.right.pinned,
            },
          },
        };
      });
      get().persistLayout();
    },

    toggleDock: (position) => {
      set((state) => ({
        docks: {
          ...state.docks,
          [position]: {
            ...state.docks[position],
            visible: !state.docks[position].visible,
          },
        },
      }));
      get().persistLayout();
    },

    pinDock: (position) => {
      set((state) => ({
        docks: {
          ...state.docks,
          [position]: {
            ...state.docks[position],
            pinned: !state.docks[position].pinned,
          },
        },
      }));
      get().persistLayout();
    },

    setDockWidth: (position, width) => {
      // Clamp width to reasonable bounds
      const clampedWidth = Math.max(48, Math.min(600, width));
      set((state) => ({
        docks: {
          ...state.docks,
          [position]: {
            ...state.docks[position],
            width: clampedWidth,
          },
        },
      }));
      get().persistLayout();
    },

    setDockItems: (position, items) => {
      set((state) => ({
        docks: {
          ...state.docks,
          [position]: {
            ...state.docks[position],
            items,
          },
        },
      }));
      get().persistLayout();
    },

    updateTrustProgress: (capabilityId, stepId, completed) => {
      set((state) => {
        const existing = state.trustPassport[capabilityId];
        const completedSteps = existing?.completedSteps ?? [];

        const newSteps = completed
          ? completedSteps.includes(stepId)
            ? completedSteps
            : [...completedSteps, stepId]
          : completedSteps.filter((id) => id !== stepId);

        const newPassport = {
          ...state.trustPassport,
          [capabilityId]: {
            completedSteps: newSteps,
            completed: newSteps.length > 0, // At least one step completed
            lastUpdated: new Date().toISOString(),
          },
        };

        // Persist trust passport
        saveTrustPassport(newPassport);

        return { trustPassport: newPassport };
      });
    },

    resetTrustProgress: (capabilityId) => {
      set((state) => {
        const newPassport = { ...state.trustPassport };
        delete newPassport[capabilityId];
        saveTrustPassport(newPassport);
        return { trustPassport: newPassport };
      });
    },

    isTrustStepCompleted: (capabilityId, stepId) => {
      const state = get();
      const progress = state.trustPassport[capabilityId];
      if (!progress) return false;
      return progress.completedSteps.includes(stepId);
    },

    isTrustJourneyCompleted: (capabilityId) => {
      const state = get();
      const progress = state.trustPassport[capabilityId];
      if (!progress) return false;
      return progress.completed;
    },

    persistLayout: () => {
      const state = get();
      const layout: LayoutConfig = {
        version: state.layoutVersion,
        docks: {
          left: state.docks.left,
          right: state.docks.right,
          top: state.docks.top,
          bottom: state.docks.bottom,
        },
        focusMode: state.focusMode,
        activeProduct: state.activeProduct,
        pinnedPanels: [],
        customOrder: {},
      };
      saveLayout(layout);
    },

    loadLayout: () => {
      const loaded = loadLayout();
      if (!loaded) return;

      // Also load trust passport
      const trustPassport = loadTrustPassport();

      set({
        activeProduct: loaded.activeProduct,
        focusMode: loaded.focusMode,
        docks: {
          left: dockConfigToState(loaded.docks.left),
          right: dockConfigToState(loaded.docks.right),
          top: dockConfigToState(loaded.docks.top),
          bottom: dockConfigToState(loaded.docks.bottom),
        },
        layoutVersion: loaded.version,
        trustPassport,
      });
    },

    resetLayout: () => {
      const defaults = createDefaultLayout();
      set({
        activeProduct: defaults.activeProduct,
        activeCapability: null,
        focusMode: defaults.focusMode,
        workspaceMode: "engineering" as WorkspaceMode,
        currentMaturity: "unknown" as EpistemicMaturity,
        showTrustPassport: false,
        showAgentPanel: false,
        activeAgentId: null,
        docks: {
          left: dockConfigToState(defaults.docks.left),
          right: dockConfigToState(defaults.docks.right),
          top: dockConfigToState(defaults.docks.top),
          bottom: dockConfigToState(defaults.docks.bottom),
        },
        layoutVersion: defaults.version,
        trustPassport: {},
      });
      get().persistLayout();
      // Also clear trust passport from storage
      saveTrustPassport({});
    },
  };
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select the active product ID. */
export const selectActiveProduct = (state: WorkspaceState) => state.activeProduct;

/** Select the active capability ID. */
export const selectActiveCapability = (state: WorkspaceState) => state.activeCapability;

/** Select focus mode state. */
export const selectFocusMode = (state: WorkspaceState) => state.focusMode;

/** Select a specific dock's state. */
export const selectDock =
  (position: "left" | "right" | "top" | "bottom") => (state: WorkspaceState) =>
    state.docks[position];

/** Select trust journey progress for a capability. */
export const selectTrustProgress =
  (capabilityId: string) => (state: WorkspaceState) =>
    state.trustPassport[capabilityId] ?? null;

/** Select whether a specific trust step is completed. */
export const selectIsStepCompleted =
  (capabilityId: string, stepId: string) => (state: WorkspaceState) => {
    const progress = state.trustPassport[capabilityId];
    if (!progress) return false;
    return progress.completedSteps.includes(stepId);
  };

/** Select the current workspace mode. */
export const selectWorkspaceMode = (state: WorkspaceState) => state.workspaceMode;

/** Select the current epistemic maturity. */
export const selectCurrentMaturity = (state: WorkspaceState) => state.currentMaturity;

/** Select whether the trust passport is visible. */
export const selectShowTrustPassport = (state: WorkspaceState) => state.showTrustPassport;

/** Select whether the agent panel is visible. */
export const selectShowAgentPanel = (state: WorkspaceState) => state.showAgentPanel;
