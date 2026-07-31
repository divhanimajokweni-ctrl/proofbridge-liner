# Task 1 — Workspace Foundation (Capability Registry, Layout Engine, Workspace Store)

## Agent: Z.ai Code
## Date: 2026-03-05

## Summary

Created three foundational TypeScript modules for the VVU "Operating Environment" workspace. All files are in `src/lib/vvu/`. No existing files were modified.

## Files Created

### 1. `src/lib/vvu/capability-registry.ts`
- **Capability** interface with `TrustJourneyStep` (supports discover/learn/interactive/reveal/license steps with optional knowledge checks)
- **ProductManifest** interface with workspace component path, shortcuts, and capability references
- **8 capabilities** defined:
  - `verify-authenticity` → ProofBridge, Trust Sphere
  - `detect-water-loss` → HBK
  - `manage-community-pools` → Ubuntu Pools
  - `run-inference` → HBK, Epistemic Runtime
  - `trace-provenance` → ProofBridge, Epistemic Runtime
  - `monitor-circuit-health` → AIR Runtime
  - `simulate-scenarios` → 72h Simulation
  - `explore-trust-network` → Trust Sphere
- **7 product manifests** defined (all existing products)
- **Lookup maps**: `CAPABILITY_MAP`, `PRODUCT_MANIFEST_MAP`
- **Helper functions**: `getCapabilitiesForProduct()`, `getProductsForCapability()`, `getCapabilitiesForTier()`, `getCapabilitiesForEdition()`, `searchCapabilities()`

### 2. `src/lib/vvu/layout-engine.ts`
- **LayoutConfig** interface with dock positions, focus mode, active product, pinned panels, custom ordering
- **DockConfig** interface with visible/pinned/width/items
- **LayoutValidationResult** interface for validation output
- **Default layout generator** — left dock with product navigation, right dock for capability context
- **Validation** — checks structure, types, dock widths, item IDs, produces errors/warnings
- **Persistence** — `saveLayout()` / `loadLayout()` / `clearLayout()` using localStorage
- **Migration** — version-based migration system with `migrateV0ToV1()` and extensibility for future versions
- **Layout helpers** — `updateDock()`, `addDockItem()`, `removeDockItem()`, `reorderDockItems()`, `toggleFocusMode()`, `setActiveProductInLayout()`, `togglePinnedPanel()`

### 3. `src/lib/vvu/workspace-store.ts`
- **Zustand store** (`useWorkspaceStore`) with full workspace state management
- **Core state**: activeProduct, activeCapability, focusMode
- **Dock state**: left/right/top/bottom with visible/pinned/width/items
- **Trust passport**: per-capability progress tracking with localStorage persistence
- **Actions**: setActiveProduct, setActiveCapability, toggleFocusMode, toggleDock, pinDock, setDockWidth, setDockItems, updateTrustProgress, resetTrustProgress, isTrustStepCompleted, isTrustJourneyCompleted, persistLayout, loadLayout, resetLayout
- **Selectors**: selectActiveProduct, selectActiveCapability, selectFocusMode, selectDock, selectTrustProgress, selectIsStepCompleted

## Lint Status
- 0 errors, 1 warning (pre-existing, unrelated to our code)

## Design Decisions
- Trust journey steps use string IDs for flexibility and serialisation
- Layout engine is separate from the store — the store delegates to the engine for persistence/migration
- Focus mode auto-hides side docks when entering, restores when exiting
- Trust passport is persisted separately from layout in localStorage
- All helper functions are pure (no side effects) for testability
