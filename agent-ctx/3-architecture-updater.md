# Task 3: Architecture Component Updates

## Agent: architecture-updater
## Date: 2026-03-04

## Summary
Updated the Architecture component (`src/components/epistemic/architecture.tsx`) with 4 targeted changes:

### Changes Made

1. **"Deprecation Is Not Kernel" Insight** — Already present in `CORE_INSIGHTS` array (added by prior agent). Verified it has correct title, description, `Binary` icon, and `"verified"` status.

2. **"Kernel Invariant" Callout** — Added a prominent callout box after the insights grid and before the Key Equations section inside `CoreInsightsPanel()`. Styled as a dark/highlighted box with:
   - `border-2 border-verified/50` for theorem-like border
   - `bg-verified/5 dark:bg-verified/10` for subtle background
   - Gradient accent bar at top (`from-verified/0 via-verified to-verified/0`)
   - `Binary` icon + "THE KERNEL INVARIANT" label
   - Full invariant text with highlighted keywords in `font-mono font-bold text-verified`
   - Italic closing statement about replaceable infrastructure

3. **Migration Adapter** — Added "Migration Adapter" as a sub-component under "Adapters" in `ARCHITECTURE_LAYERS` (alongside Git, K8s, Argo, CLI, API).

4. **Gap #10 Status Update** — Changed "Failure Facts" gap status from `"planned"` to `"in-progress"` since we now have `migration_failed` facts.

### Verification
- `bun run lint`: 0 errors, 0 warnings
- Dev server: compiling and serving successfully
- All 4 changes confirmed present in the file
