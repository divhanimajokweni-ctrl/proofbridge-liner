# Task 6 — Panels Engineer (HBK / CAD / Artifacts / Explorer)

## Task
Build 4 React panels for the VVU IVE workspace, each reading from the canonical Zustand store and composing the shared `PanelFrame`/`StatCard`/`StatusPill`/`MonoTable`/`SectionLabel` primitives. Cinematic dark theme, gold accents, framer-motion entrance animations, lucide-react icons. No fabricated engineering evidence — missing values must surface explicitly.

## Files Produced
- `src/components/ive/panels/HbkWorkspacePanel.tsx` — HBK MK-II case study workspace
- `src/components/ive/panels/CadViewerPanel.tsx` — Procedural CAD viewer with per-part SVG wireframes
- `src/components/ive/panels/ArtifactsPanel.tsx` — Evidence package browser + tabbed JSON viewer
- `src/components/ive/panels/ExplorerPanel.tsx` — Repository file tree explorer

## Work Log
1. Read project context: worklog (frozen identity + forbidden terms), useIveStore selectors, frozen types (ArtifactFile / CadPart / ExplorerNode / LedgerEntry), CAD_PARTS + HBK_ARCHITECTURE, ARTIFACTS + LEDGER, contract builders, primitives, and reference panels.
2. Built HbkWorkspacePanel — 3-column grid: CAD parts list | active-part detail (name, file, description, parameters MonoTable, KCL with line numbers + tokenized highlighting) | 3-tier architecture cards (each with mission, owns, requiresEngineeringData items flagged with CircleAlert + REQUIRES ENG. DATA pill). Bottom: 8 numbered architecture rules. Footer safety note: "Hydraulic actuation authority UNDEFINED. Baseline architecture is observation-first and fails to a non-actuating state."
3. Built CadViewerPanel — tab-based part selector across 4 CAD parts. Per-part SVG wireframes with framer-motion pathLength draw-in animations: hydro-gateway skid + 9 markers + pipe axis; pressure-pipe 4 concentric circles + 8 bolt holes; skid-base rectangle + mounting points + dimension annotations; pump-module motor + coupler + impeller + discharge + flow arrow. Side parameters MonoTable, KCL source viewer, boundary note.
4. Built ArtifactsPanel — 2-column grid: artifacts manifest MonoTable (Name, Path, Schema, Status pill by PRESENT/MISSING/REQUIRES_VALIDATION, Description) + legend | tabbed JSON viewer with 4 tabs (results.json, metrics.json, ledger.json, provenance.json). Custom regex tokenizer colors keys gold / strings mint / numbers amber / booleans violet. Copy button via navigator.clipboard with Check confirmation.
5. Built ExplorerPanel — top breadcrumb bar, 2-column grid: collapsible file tree (ChevronRight rotation, Folder/FolderOpen icons, meta hints) | file detail card (kind, meta, mock preview area with "REQUIRES VALIDATION — file preview not available in this environment"). Empty state + freeze note.
6. Resolved ESLint `react-hooks/static-components` violations: refactored ExplorerPanel's icon resolver from a `fileIconFor(name)` function call (flagged as creating a component during render) to a module-level `FilePreviewIcon` + `TreeNodeIcon` pair backed by a static `FILE_ICON_BY_EXT: Record<string, LucideIcon>` lookup (property access pattern, mirrors the established `NODE_ICONS[node.id]` pattern in ProofGraphPanel).
7. Cleaned up the PumpModuleWireframe `<defs>` so the `flow-arrow` marker is declared once at the top of the SVG instead of after the path that references it.
8. Verified: `bun run lint` clean on all 4 panel files (only pre-existing errors remain in CommandPalette.tsx + PanelRouter.tsx — out of scope). `bunx tsc --noEmit` clean on all 4 panel files. `dev.log` shows successful compilation. No forbidden terms (SAFE_FOR_DEPLOYMENT / Engineering certified / FEA verified / Physically validated / System safe / Epistemic Runtime) appear in any of the 4 files.

## Stage Summary
All 4 panels are self-contained, follow the established visual language, are responsive (grid collapses to 1 col on mobile), and preserve the no-fabrication contract. The PanelRouter already lazy-loads each panel by named export; no routing changes were required.
