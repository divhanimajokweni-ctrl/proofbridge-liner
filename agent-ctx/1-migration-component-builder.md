# Task 1: Migration Section Component

## Agent: migration-component-builder

## Summary
Created the `MigrationSection` component at `/home/z/my-project/src/components/epistemic/migration.tsx` and registered it in the main dashboard at `page.tsx`.

## What Was Done

### 1. Created `/home/z/my-project/src/components/epistemic/migration.tsx`
A comprehensive `"use client"` React component exporting `MigrationSection` with 8 panels:

1. **Four Primitive Invariant Panel** — Visual diagram of the Evidence Kernel architecture showing Fact/Proof/Policy/Projection primitives over replaceable infrastructure (Git, K8s, Argo, MMR, ZK, TEE, CLI, Dashboard, Migration). Includes the key invariant: "The kernel never knows what deprecation means. It only knows Facts."

2. **Migration Adapter Flow Panel** — Interactive 5-step vertical flow (Plan → Execute → Verify → Complete → Update Projections) with click-to-expand invariant banners, step status indicators, and emitted Fact types.

3. **Migration Facts Panel** — Styled TypeScript interface display (collapsible full/compact) for `MigrationFact`, plus a scrollable timeline of recent migration facts with mock data.

4. **Failure as Facts Panel** — WRONG vs RIGHT comparison (throw Error vs FailureFact interface), invariant banner "The kernel never throws exceptions. It only appends Facts.", and recent failure facts list with recoverable/unrecoverable indicators.

5. **Policy Time Travel Panel** — WRONG vs CORRECT pattern comparison, invariant "Replaying 2026 migration facts with 2032 policies must produce identical results.", and visual policy version timeline with effective date ranges.

6. **Projection Versioning Panel** — ProjectionRegistration and ProjectionDeprecated Fact type interfaces, invariant "Every projection has a version. Versions are Facts.", and registered projections list with status.

7. **Specification Alignment Table** — Full 9-row alignment table with StatusPill badges (✅ Aligned / 🔜 Required) and coverage progress bar (56%).

8. **Deterministic Ordering Panel** — Ordering function display, 3-tier explanation (LogicalSequence → Timestamp → FactId), invariant "No Date.now() in the acceptance pipeline", and anti-pattern warning.

### 2. Registered in `page.tsx`
- Added `"migration"` to `SectionId` type union
- Added entry to `SECTIONS` array with GitBranch icon
- Added entry to `SECTION_META` record
- Added lazy import for `MigrationSection`
- Added mapping in `SECTION_COMPONENTS`

### 3. Quality
- **Lint: 0 errors, 0 warnings**
- Follows project design patterns (Shell, H3, CodeBlock, InvariantBanner, StatusPill, etc.)
- Uses framer-motion animations matching acceptance-engine.tsx patterns
- Uses project color tokens: verified, repairing, violating, quarantined
- Dark mode compatible
- Responsive grid layout
- Self-contained with mock data

## Files Changed
- Created: `src/components/epistemic/migration.tsx`
- Modified: `src/app/page.tsx` (SectionId, SECTIONS, SECTION_META, lazy import, SECTION_COMPONENTS)
