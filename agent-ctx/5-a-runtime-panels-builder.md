# Task 5-a · IVE Runtime Panels (Evidence / Plugin / AMD / Zoo)

**Agent**: IVE Runtime Panels Builder
**Task ID**: 5-a
**Scope**: Build 4 React panels for the VVU IVE workspace — Evidence Runtime, Plugin Registry, AMD Runtime, Zoo Runtime.

## Context Read

- `worklog.md` — frozen identity (no fabricated engineering evidence; missing values must be explicit).
- `src/store/useIveStore.ts` — canonical Zustand store with selectors: `evidenceTimeline`, `evidenceCursor`, `advanceEvidence`, `resetEvidence`, `plugins`, `setPluginState`, `hardwareProfile`, `contract`, `zooStatus`, `proofProgress`.
- `src/lib/ive/types.ts` — `EvidenceEvent`, `PluginMeta`, `PluginState`, `HardwareProfile`, `ZooApiStatus` frozen types.
- `src/lib/ive/evidence.ts` — `EVIDENCE_TIMELINE` (10 events), `PLUGINS` (8 plugins, native flag).
- `src/lib/ive/contract.ts` — `buildFrozenContract` (ROCm speedup 4.249, native API NOT_DEMONSTRATED, wrapper IMPLEMENTED at pipeline/compute_provider.py).
- `src/components/ive/primitives.tsx` — `PanelFrame`, `StatCard`, `StatusPill`, `MonoTable`, `SectionLabel`, `Kbd`.
- `OverviewPanel.tsx`, `ProofGraphPanel.tsx` — visual language reference (gold accent #C9A84C, semantic tokens `--ive-proven`/`--ive-blocked`/`--ive-pending`/`--ive-zk`, `ive-surface` frosted cards, `ive-mono` telemetry labels, framer-motion entrance).

## Files Produced

1. `src/components/ive/panels/EvidenceRuntimePanel.tsx` — vertical timeline with revealed/pending states, level color-coding, EVIDENCED / NOT EVIDENCED badges, Advance/Reset actions, Runtime State card (proofProgress bar + ledger/provenance/release pills), level legend, evidence-discipline note.
2. `src/components/ive/panels/PluginRegistryPanel.tsx` — top stats (running/activated/installed/not-installed), native-vs-wrapper legend, lifecycle state-machine stepper reference, plugin cards grid with per-plugin interactive lifecycle stepper (click state to set), lifecycle distribution MonoTable.
3. `src/components/ive/panels/AmdRuntimePanel.tsx` — provider/device/speedup/status StatCards, HIP/ROCm/PyTorch stack, CPU-vs-ROCm benchmark bar visualization, system_info style trace card with explicit REQUIRES VALIDATION for memory/exec time, emulation context note, hardware profile MonoTable.
4. `src/components/ive/panels/ZooRuntimePanel.tsx` — conflation-guard banner, two-column Native (blocked/red) vs Wrapper (implemented/green) cards with load_model/set_param/re-render vs wrapper.load_kcl/evaluate/snapshot, integration-point card, comparison MonoTable (Method/Type/Status/Evidence).

## Constraints Honored

- `"use client"` at the top of every file.
- No fabricated engineering values — memory and execution time explicitly `REQUIRES VALIDATION`; seed determinism `NOT_EVALUATED`; remote cloud compute `NotImplemented`.
- No forbidden terms (SAFE_FOR_DEPLOYMENT, Engineering certified, FEA verified, etc.).
- No indigo/blue primary colors.
- All 4 files pass ESLint cleanly (verified).
- Responsive: grids collapse to 1 column on mobile via `lg:grid-cols-*` and `sm:grid-cols-*` breakpoints.
- Imports only from established store/types/primitives.
