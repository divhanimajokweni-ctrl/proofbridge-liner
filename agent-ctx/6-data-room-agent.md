# Task 6 — Data Room Agent

## Task
Build the DATA ROOM for the VVU IVE — 3 new activity components (NMBM Data Sandbox / AIR Runtime / Field Evidence) + room router with 5 activity cards (EIS / HBK / NMBM Sandbox / AIR Runtime / Field Evidence).

## Files Created
1. `src/components/ive/data-room/nmbm-sandbox.tsx` — pipeline runner simulating setup.sh + run.sh, with Data Status Table (8 rows per §5 of spec), terminal output (10 setup + 7 pipeline lines built progressively), file tree sidebar (8 nodes), VIEW EVIDENCE JSON receipt (5 observations × 11 provenance fields, 5 passes, SHA-256 hash).
2. `src/components/ive/data-room/air-runtime.tsx` — Audit Integrity Runtime. Live event stream (2s push interval, 20-event rolling window, 4 levels: OBS/ALERT/EIS/ERROR) + evidence decay tracker (5 items, 60s half-life, green→amber→red decay bar). Runtime stats header (events/sec, total, active, avg trust).
3. `src/components/ive/data-room/field-evidence.tsx` — 6 inline-SVG photo placeholders (no network calls) with vision analysis panel (4 features × confidence %, correlation to EIS evidence, SHA-256 attestation hash).
4. `src/components/ive/rooms/data-room.tsx` — room router with 5 cards in responsive grid (1/2/3 cols). EIS + HBK cards render summary-only placeholder panels (with `summaryOnly: true` flag) pointing users to the main workspace view toggle. NMBM/AIR/Field Evidence cards render their full activity components.

## Conventions Followed
- kernel-theme CSS variables (cyan #00d4ff / green #00ff88 / amber #ffb800 / red #ff4d4d — NOT indigo/blue).
- Utility classes: `.k-card`, `.k-card-title`, `.k-badge` + 5 variants, `.k-grid-bg`, `.k-glow-cyan`, `.k-cursor`.
- Room router pattern modeled after `src/components/ive/rooms/finance-room.tsx` (grid ↔ full-screen activity with BACK button + sticky header + sticky footer with SIMULATION data label).
- Terminal output pattern adapted from `src/components/ive/build-room/ingestion-terminal.tsx`.
- All components `'use client'`, self-contained, accept no props.

## EIS + HBK Cards
Per task spec ("to keep this simpler: render a placeholder that says 'see main workspace'"), EIS and HBK cards open a SummaryPlaceholder panel showing:
- Spec reference (02c_EVIDENCE_INDEPENDENCE_SPEC_EIS_v1.md for EIS, 01b_TECHNICAL_DEMONSTRATION_BRIEF.md for HBK)
- 5 key properties (score formula, verdict threshold, reject rule, quality flags, pipeline passes for EIS; posterior, prior, update, output, engine for HBK)
- Amber-bordered "See main workspace →" callout
- Activity metadata tiles + status badges (EXISTS, PRIORITY, MAIN WORKSPACE)
- Engine source code reference (EISv1Engine.ts / HydroBayesianKernel.ts)

## Verification
- Lint: 0 errors, 0 warnings ✓
- TypeScript (tsc --noEmit): 0 errors in 4 new files (only pre-existing errors in unrelated examples/, skills/, evidence/ files) ✓
- Agent-browser smoke test (temporarily wired DataRoom into page.tsx, then restored original):
  - Grid view: 5 cards rendered with correct status badges (EXISTS green / PARTIAL amber) + PRIORITY + MAIN WORKSPACE badges ✓
  - NMBM Sandbox end-to-end: RUN SETUP → 10 terminal lines + state DONE → RUN PIPELINE enables → 7 pipeline lines + EVIDENCE state DONE → VIEW EVIDENCE reveals full JSON receipt with 5 observations × 11 provenance fields + 5 passes ✓
  - AIR Runtime: stats update live (TOTAL EVENTS 10→21 over 6s = 2s push interval ✓), 5 evidence items aging with color-shifting decay bar ✓
  - Field Evidence: 6 inline-SVG photo thumbnails (pipe joint, DMA inlet, valve, hydrant, manhole, segment break), vision analysis panel with VISION PASS badge + 4 features × confidence % + correlation + SHA-256 hash ✓
  - EIS Summary Placeholder: spec reference + score formula + amber "See main workspace" callout + engine source code reference ✓
  - Mobile (412×915): no horizontal overflow (body scrollWidth == viewport width) ✓
- Original page.tsx (1408 lines, Tasks 1+2 EIS WORKSPACE + HBK LOCALIZATION) restored intact ✓

## Hand-off Notes for Orchestrator
- DataRoom is ready to be wired into the VVU IVE World container / top-level navigation.
- EIS + HBK cards currently render SummaryPlaceholder panels. To wire the full EIS/HBK content (instead of the summary), change the `summaryOnly: true` flag to false on those two cards and provide the `Component` field — e.g. `Component: EISWorkspace` and `Component: HBKPanel`. The existing `src/components/evidence/hbk-panel.tsx` can be reused directly; for EIS, the inline code in `src/app/page.tsx` (the `view === 'eis'` branch) would need to be extracted to a component first.
- All activity components are self-contained and accept no props — they can be rendered in any container.
- The kernel-theme CSS classes are defined globally in `src/app/globals.css` and don't require any new styles.
