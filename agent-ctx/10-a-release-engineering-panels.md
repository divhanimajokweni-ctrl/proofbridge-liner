# Task 10-a — Release-Engineering Surfaces Builder (RR / ADP / INT)

**Agent:** Release-Engineering Panels Builder
**Task ID:** 10-a
**Scope:** Build 3 named-export React panels for the VVU IVE workspace — Release Report, Adapter Attribution, Integrity Closure. These are the release-engineering surfaces mandated by the Execution and Preservation Constraints addendum.

## Pre-work Context Review

Read worklog.md (frozen identity, forbidden terms, architecture decisions) and the key files:
- `src/lib/ive/release.ts` — data source for all three panels (REQUIRED_FIXES, DISPOSITION="NO-GO", DISPOSITION_RATIONALE, PIPELINE_RUNS, PIPELINE_PRESERVATION_RULES, LICENSE_STATUS, ADAPTER_ATTRIBUTION, ADAPTER_RULES, CHECKSUM_SPEC, LEDGER_ROOT_DESCRIPTION, CHECKSUM_ENTRIES).
- `src/store/useIveStore.ts` — canonical Zustand store (read `contract.run_id` and `contract.ledger_status` selectors for display-only provenance links).
- `src/lib/ive/types.ts` — frozen contract types (ExplicitMissing, etc.).
- `src/components/ive/primitives.tsx` — PanelFrame, StatCard, StatusPill, MonoTable, SectionLabel, Kbd (all used).
- `src/components/ive/panels/OverviewPanel.tsx` and `ProofGraphPanel.tsx` — visual-language reference (framer-motion staggered entrance, ive-surface cards, gold accent, mono telemetry).

## Visual Language Honored

- Dark cinematic theme via `ive-surface` (frosted glass) for all cards.
- Gold accent `#C9A84C` (`--ive-gold`) for primary brand; semantic colors used per-panel: blocked-red (`--ive-blocked` #ff4d5f) for Release Report, pending-blue (`--ive-pending` #3d9bff) for Adapter Attribution, gold (`--ive-gold`) for Integrity Closure.
- `ive-mono` for telemetry/labels; `ive-scroll`, `ive-grid-bg`, `ive-divider` utilities used.
- `PanelFrame` wraps every panel (title/tag/accent/mission).
- `framer-motion` entrance animations: `initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04~0.05}}`.
- `lucide-react` icons (OctagonAlert, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Scale, Lock, Hash, GitBranch, Clock, Cpu, FileText, Search, X, AlertTriangle, CornerDownRight, Workflow, FileLock2, ListChecks, Ban).
- NO indigo/blue primary. NO emojis. Strict TypeScript. `"use client"` at top. Named exports only.
- No fabricated engineering evidence — every missing value surfaces as UNDEFINED / MISSING / NOT_EVALUATED / OUT_OF_SCOPE / REQUIRES VALIDATION / PENDING. Hash column in the covered-artifacts registry is explicitly "REQUIRES VALIDATION" (no fabricated hashes).
- Forbidden terms (SAFE_FOR_DEPLOYMENT / Engineering certified / FEA verified / Physically validated / System safe) are absent.

## Work Log

### 1. ReleaseReportPanel.tsx (RR, accent #ff4d5f — blocked red)

- **Disposition hero banner**: dominant blocked-red gradient banner with OctagonAlert icon (drop-shadow glow). Large `NO-GO` headline (text-4xl/5xl, text-shadow glow). DISPOSITION_RATIONALE below. StatusPills for "Blocks Submission" (pulsing) + "Pipeline Retained".
- **Stat row (4 StatCards)**: Total Fixes, Blockers (severity=BLOCKER count), Blocking Submission (blocksSubmission=true count), Non-blocking.
- **Required Fixes table**: custom responsive table. Mobile: stacked card layout. Desktop: 6-column grid [ID | Severity | Affected File | Evidence | Minimum Action | Blocks Submission]. Each row has a colored left accent bar matching severity. SeverityPill component color-codes BLOCKER=blocked-red, HIGH=#CC7722, MEDIUM=gold, LOW=muted. BlocksPill component: YES=blocked-red, NO=muted. Evidence and Minimum Action cells use break-words + leading-relaxed for long-text readability.
- **Pipeline Execution Preservation**: PIPELINE_RUNS rendered as cards (PipelineRunCard component) with left accent bar (green=retained), runId, timestamp, target, environment, source commit (REQUIRES VALIDATION shown blocked-red), config hash (REQUIRES VALIDATION shown blocked-red), retained badge, and note in a sub-box. PIPELINE_PRESERVATION_RULES as numbered checklist (7 rules) with CheckCircle2 icons and staggered motion.
- **License Handling**: card with Scale icon, "MISSING — REQUIRES DECISION" in blocked-red, Detail and Action sub-boxes, plus the explicit note "Do not select or fabricate a software license without authorization from the repository owner." in an amber/gold caution box.
- **Closing Statement**: gradient blocked-red banner with ShieldAlert icon and the exact closing text from the task spec ("Disposition: NO-GO. Three BLOCKER required fixes must be resolved. The existing pipeline execution is retained; this is a packaging/integration gap, not a pipeline rejection or architecture redesign."). Footer includes contract run_id (read from store) and counts.

### 2. AdapterAttributionPanel.tsx (ADP, accent #3d9bff — pending blue)

- **Top: ADAPTER_RULES as rule-card list**: 4 cards in a 2-col grid, each with ShieldCheck icon, "MUST" badge, rule number, full rule text, left vertical accent bar in blue.
- **Stat row (4 StatCards)**: Attributed Fields, Explicit-Missing Treatments (count), Runs MISSING/REQUIRES (count), Branch Inference=PROHIBITED.
- **Warning banner**: amber/gold gradient banner with ShieldAlert icon. Exact text: "The adapter must never infer hardware, metrics, proof results, API execution, or engineering status from filenames or branch names. Branch `mi300x-rocm-run-20260804` is NOT used to infer hardware." Branch name styled in a mono gold pill.
- **Search/filter input**: useState `query` + useMemo `filtered` (no setState-in-effect). Filter matches against field, sourceArtifact, sourceField, and transformation. Includes a clear (X) button. Shows current/total entry count.
- **Attribution entries (card-per-entry)**: AttributionCard component renders each entry with a left vertical accent bar in blue. Top row: gold FileText icon, "Normalized Field" label, field name in mono gold, and sourceRun StatusPill (pulse if explicit missing). Middle grid: Source Artifact, Source Field, Source Run (with GitBranch icon, color-coded by missing vs concrete). Bottom grid: Transformation (Workflow icon) and Missing Treatment (ShieldAlert icon, gold-tinted box). Staggered motion entrance (delay i*0.04, capped at 0.4s).
- **Empty state**: dashed-border box with AlertTriangle icon when no entries match filter.
- **Footer note**: card with Workflow icon and exact text "Every normalized value retains its source attribution. The adapter fails or emits an explicit missing state when the input schema is invalid." Includes contract run_id and per-field retention summary.
- Helper `isExplicitMissing()` checks against the ExplicitMissing union — type-safe without stringly-typed comparison.

### 3. IntegrityClosurePanel.tsx (INT, accent #C9A84C — gold)

- **Stat row (4 StatCards)**: Spec Rules Satisfied (x/total), Covered Artifacts count, Algorithm=SHA-256, Independent Verify=REQUIRES VALIDATION (warn).
- **Checksum Index Specification**: section header with Hash icon and satisfied/total counter, "FULLY SATISFIED" or "PARTIAL — REQUIRES VALIDATION" StatusPill (pulses when partial). Each CHECKSUM_SPEC rule rendered as a row with CheckCircle2 (satisfied, green) or XCircle (not satisfied, blocked-red), rule text, "SATISFIED"/"NOT SATISFIED" badge, and evidence line in mono with "evidence ·" prefix. Staggered motion.
- **Ledger Root Boundary**: prominent amber-bordered gradient banner with ShieldAlert icon, "Boundary Notice · Honest Description" label, "INTERNAL ONLY" StatusPill. LEDGER_ROOT_DESCRIPTION verbatim. 3-column grid below summarizing: Internally Consistent (green, "Within the submitted package"), Not Externally Signed (red, "Not anchored or co-signed"), Not Immutable (red, "Not independently authenticated"). Footer line shows contract ledger_status read from store.
- **Covered Artifacts registry**: MonoTable with columns [Path | Algorithm | Hash | Status]. Path column uses break-all. Hash column shows "REQUIRES VALIDATION" in gold — no fabricated hashes. Status column uses StatusPillForEntry (green for COMPUTED, gold for REQUIRES VALIDATION). Footer note emphasizes hash column never fabricated.
- **Integrity Closure Rules**: 3-col grid of 6 rule cards (Index excludes itself, Deterministic filename ordering, Safe filename handling, Covers the authoritative manifest, Independent verification, No post-checksum modification). Each with its own lucide icon (Ban, ListChecks, FileLock2, FileText, ShieldCheck, Lock) in gold-tinted badge.
- **Closure Note**: gradient amber/gold banner with ShieldCheck icon and exact text: "The checksum index is generated only after all release artifacts are finalized. No covered artifact may be modified after checksum generation."

## Verification

- `bun run lint` — 0 errors in any of the 3 new panel files. (1 pre-existing warning in `upload/VVU-Legacy-Dashboard/.../layout.tsx` is outside task scope.)
- `bunx tsc --noEmit` — 0 errors in any of the 3 new panel files. Pre-existing errors in `upload/`, `examples/`, `skills/`, and the `ProofGraph` import in `useIveStore.ts` are outside task scope.
- `dev.log` — Module-not-found errors for the three panels (logged when files didn't exist yet) have been resolved; latest compile is `✓ Compiled in 16s` with `GET / 200` confirmed.

## Stage Summary — Files Produced

- `/home/z/my-project/src/components/ive/panels/ReleaseReportPanel.tsx` (export `ReleaseReportPanel`)
- `/home/z/my-project/src/components/ive/panels/AdapterAttributionPanel.tsx` (export `AdapterAttributionPanel`)
- `/home/z/my-project/src/components/ive/panels/IntegrityClosurePanel.tsx` (export `IntegrityClosurePanel`)
