/**
 * VVU Layout Engine
 *
 * Manages workspace layout persistence, validation, and migration.
 * Layouts are serialised to localStorage so the user's workspace
 * configuration survives page reloads.
 *
 * Layout version history:
 *  v1 — Initial schema with dock positions, focus mode, and pinned panels.
 */

import { CAPABILITIES, PRODUCT_MANIFESTS } from "./capability-registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for a single dock edge. */
export interface DockConfig {
  /** Whether the dock is visible */
  visible: boolean;
  /** Whether the dock is pinned (stays open without hover) */
  pinned: boolean;
  /** Width in pixels (for left/right) or height in pixels (for top/bottom) */
  width: number;
  /** Capability/product IDs displayed in this dock */
  items: string[];
}

/** Full workspace layout configuration. */
export interface LayoutConfig {
  /** Schema version for migration support */
  version: number;
  /** Dock configuration for each edge */
  docks: {
    left: DockConfig;
    right: DockConfig;
    top: DockConfig;
    bottom: DockConfig;
  };
  /** Whether focus mode is active (hides docks, minimises chrome) */
  focusMode: boolean;
  /** Currently active product ID */
  activeProduct: string | null;
  /** Panel IDs that are pinned open */
  pinnedPanels: string[];
  /** User-customisable ordering — maps item ID to sort index */
  customOrder: Record<string, number>;
}

/** Result of layout validation. */
export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAYOUT_STORAGE_KEY = "vvu-layout";
const CURRENT_LAYOUT_VERSION = 1;

/** All known capability IDs */
const ALL_CAPABILITY_IDS = new Set(CAPABILITIES.map((c) => c.id));

/** All known product IDs */
const ALL_PRODUCT_IDS = new Set(PRODUCT_MANIFESTS.map((p) => p.id));

/** Minimum dock width */
const MIN_DOCK_WIDTH = 48;

/** Maximum dock width */
const MAX_DOCK_WIDTH = 600;

// ---------------------------------------------------------------------------
// Default Layout
// ---------------------------------------------------------------------------

/**
 * Generate the default workspace layout.
 * Left dock holds product navigation, right dock holds capability context,
 * top and bottom docks are hidden by default.
 */
export function createDefaultLayout(): LayoutConfig {
  return {
    version: CURRENT_LAYOUT_VERSION,
    docks: {
      left: {
        visible: true,
        pinned: false, // Icon Rail: collapsed by default, hover-to-expand
        width: 68, // Icon Rail collapsed width
        items: PRODUCT_MANIFESTS.map((p) => p.id),
      },
      right: {
        visible: false,
        pinned: false,
        width: 320,
        items: [],
      },
      top: {
        visible: false,
        pinned: false,
        width: 56,
        items: [],
      },
      bottom: {
        visible: true,
        pinned: true,
        width: 40,
        items: [],
      },
    },
    focusMode: false,
    activeProduct: "sphere",
    pinnedPanels: [],
    customOrder: {},
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a LayoutConfig object.
 * Returns a result with any errors or warnings found.
 */
export function validateLayout(layout: unknown): LayoutValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!layout || typeof layout !== "object") {
    return { valid: false, errors: ["Layout must be a non-null object"], warnings: [] };
  }

  const cfg = layout as Record<string, unknown>;

  // Version check
  if (typeof cfg.version !== "number" || cfg.version < 1) {
    errors.push("Layout version must be a positive number");
  }

  // Docks check
  if (!cfg.docks || typeof cfg.docks !== "object") {
    errors.push("Layout must have a 'docks' object");
  } else {
    const docks = cfg.docks as Record<string, unknown>;
    for (const position of ["left", "right", "top", "bottom"]) {
      if (!docks[position] || typeof docks[position] !== "object") {
        errors.push(`Dock '${position}' is missing or not an object`);
        continue;
      }
      const dock = docks[position] as Record<string, unknown>;

      if (typeof dock.visible !== "boolean") {
        errors.push(`Dock '${position}.visible' must be a boolean`);
      }
      if (typeof dock.pinned !== "boolean") {
        errors.push(`Dock '${position}.pinned' must be a boolean`);
      }
      if (typeof dock.width !== "number") {
        errors.push(`Dock '${position}.width' must be a number`);
      } else if (dock.width < MIN_DOCK_WIDTH || dock.width > MAX_DOCK_WIDTH) {
        warnings.push(
          `Dock '${position}.width' (${dock.width}px) is outside recommended range (${MIN_DOCK_WIDTH}–${MAX_DOCK_WIDTH}px)`,
        );
      }
      if (!Array.isArray(dock.items)) {
        errors.push(`Dock '${position}.items' must be an array`);
      } else {
        const items = dock.items as string[];
        for (const item of items) {
          if (!ALL_CAPABILITY_IDS.has(item) && !ALL_PRODUCT_IDS.has(item)) {
            warnings.push(`Dock '${position}' contains unknown item: '${item}'`);
          }
        }
      }
    }
  }

  // Focus mode
  if (cfg.focusMode !== undefined && typeof cfg.focusMode !== "boolean") {
    errors.push("focusMode must be a boolean");
  }

  // Active product
  if (cfg.activeProduct !== null && cfg.activeProduct !== undefined) {
    if (typeof cfg.activeProduct !== "string") {
      errors.push("activeProduct must be a string or null");
    } else if (!ALL_PRODUCT_IDS.has(cfg.activeProduct)) {
      warnings.push(`activeProduct '${cfg.activeProduct}' is not a known product`);
    }
  }

  // Pinned panels
  if (!Array.isArray(cfg.pinnedPanels)) {
    errors.push("pinnedPanels must be an array");
  }

  // Custom order
  if (cfg.customOrder !== undefined && typeof cfg.customOrder !== "object") {
    errors.push("customOrder must be an object");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Serialise and save a layout to localStorage.
 * Returns true on success, false on failure (e.g. localStorage unavailable).
 */
export function saveLayout(layout: LayoutConfig): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const json = JSON.stringify(layout);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load and deserialise a layout from localStorage.
 * Returns null if no layout exists, or if the stored layout is invalid.
 */
export function loadLayout(): LayoutConfig | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const json = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!json) return null;

    const parsed: unknown = JSON.parse(json);
    const result = validateLayout(parsed);

    if (!result.valid) {
      console.warn("[VVU Layout] Stored layout is invalid, discarding:", result.errors);
      return null;
    }

    // Log warnings but still use the layout
    if (result.warnings.length > 0) {
      console.warn("[VVU Layout] Layout loaded with warnings:", result.warnings);
    }

    // Run migration if needed
    return migrateLayout(parsed as LayoutConfig);
  } catch {
    return null;
  }
}

/**
 * Remove the stored layout from localStorage.
 */
export function clearLayout(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/**
 * Migrate a layout to the current version.
 * Handles version upgrades by applying transformations in sequence.
 */
export function migrateLayout(layout: LayoutConfig): LayoutConfig {
  let current = { ...layout };

  // v0 (unversioned) → v1
  if (!current.version || current.version < 1) {
    current = migrateV0ToV1(current);
  }

  // Future migrations go here:
  // if (current.version < 2) { current = migrateV1ToV2(current); }

  return current;
}

/**
 * Migrate from unversioned (v0) to v1.
 * Adds missing fields with sensible defaults.
 */
function migrateV0ToV1(layout: LayoutConfig): LayoutConfig {
  const defaults = createDefaultLayout();

  return {
    version: 1,
    docks: {
      left: layout.docks?.left ?? defaults.docks.left,
      right: layout.docks?.right ?? defaults.docks.right,
      top: layout.docks?.top ?? defaults.docks.top,
      bottom: layout.docks?.bottom ?? defaults.docks.bottom,
    },
    focusMode: layout.focusMode ?? defaults.focusMode,
    activeProduct: layout.activeProduct ?? defaults.activeProduct,
    pinnedPanels: layout.pinnedPanels ?? defaults.pinnedPanels,
    customOrder: layout.customOrder ?? defaults.customOrder,
  };
}

// ---------------------------------------------------------------------------
// Layout Helpers
// ---------------------------------------------------------------------------

/**
 * Update a single dock's configuration.
 */
export function updateDock(
  layout: LayoutConfig,
  position: "left" | "right" | "top" | "bottom",
  updates: Partial<DockConfig>,
): LayoutConfig {
  return {
    ...layout,
    docks: {
      ...layout.docks,
      [position]: {
        ...layout.docks[position],
        ...updates,
      },
    },
  };
}

/**
 * Add an item to a dock.
 */
export function addDockItem(
  layout: LayoutConfig,
  position: "left" | "right" | "top" | "bottom",
  itemId: string,
): LayoutConfig {
  const dock = layout.docks[position];
  if (dock.items.includes(itemId)) return layout; // already present
  return updateDock(layout, position, {
    items: [...dock.items, itemId],
  });
}

/**
 * Remove an item from a dock.
 */
export function removeDockItem(
  layout: LayoutConfig,
  position: "left" | "right" | "top" | "bottom",
  itemId: string,
): LayoutConfig {
  const dock = layout.docks[position];
  return updateDock(layout, position, {
    items: dock.items.filter((id) => id !== itemId),
  });
}

/**
 * Reorder items in a dock by applying customOrder.
 */
export function reorderDockItems(
  layout: LayoutConfig,
  position: "left" | "right" | "top" | "bottom",
  customOrder: Record<string, number>,
): LayoutConfig {
  const dock = layout.docks[position];
  const sorted = [...dock.items].sort((a, b) => {
    const orderA = customOrder[a] ?? Infinity;
    const orderB = customOrder[b] ?? Infinity;
    return orderA - orderB;
  });
  return updateDock(layout, position, { items: sorted });
}

/**
 * Toggle focus mode.
 */
export function toggleFocusMode(layout: LayoutConfig): LayoutConfig {
  return {
    ...layout,
    focusMode: !layout.focusMode,
    // When entering focus mode, auto-hide side docks
    docks: {
      ...layout.docks,
      left: {
        ...layout.docks.left,
        visible: !layout.focusMode ? false : layout.docks.left.visible,
        pinned: !layout.focusMode ? false : layout.docks.left.pinned,
      },
      right: {
        ...layout.docks.right,
        visible: !layout.focusMode ? false : layout.docks.right.visible,
        pinned: !layout.focusMode ? false : layout.docks.right.pinned,
      },
    },
  };
}

/**
 * Set the active product in the layout.
 */
export function setActiveProductInLayout(
  layout: LayoutConfig,
  productId: string | null,
): LayoutConfig {
  return {
    ...layout,
    activeProduct: productId,
  };
}

/**
 * Pin/unpin a panel.
 */
export function togglePinnedPanel(
  layout: LayoutConfig,
  panelId: string,
): LayoutConfig {
  const isPinned = layout.pinnedPanels.includes(panelId);
  return {
    ...layout,
    pinnedPanels: isPinned
      ? layout.pinnedPanels.filter((id) => id !== panelId)
      : [...layout.pinnedPanels, panelId],
  };
}
