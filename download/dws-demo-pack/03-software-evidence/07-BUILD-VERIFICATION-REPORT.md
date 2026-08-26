# Build Verification Report

**Date:** 2026-08-26
**Branch:** `feat/vres1-scrubbed`
**Commit:** `26660f5`

---

## Build State

| Check | Result |
|---|---|
| `bun run lint` | ✅ Clean (0 errors, 0 warnings) |
| Dev server (port 3000) | ✅ All routes 200 |
| Console errors | ✅ 0 |
| Runtime errors | ✅ 0 |
| Git push to GitHub | ✅ Fast-forward, no force |
| Secret scanning | ✅ Pass (all tokens scrubbed via git-filter-repo) |
| Tracked files | 1,215 |
| IVE components | 27 |
| API routes | 6 |
| Static HTML demos | 10 |
| Screenshots | 40+ |

## How to Verify Independently

```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner
git checkout feat/vres1-scrubbed
bun install
bun run lint    # should be clean
bun run dev     # should serve at localhost:3000
```

## Key URLs in the Running Application

| URL | What it shows |
|---|---|
| `/` | World container — 6 selectable rooms |
| `/vvu-drone-simulator.html` | 3D drone with wind + gusts + flight recorder |
| `/vvu-aerospace.html` | WebGL 3D aerospace (KCL extraction, DRC) |
| `/vvu-engineering-stack.html` | 16:9 systems-engineering architecture figure |
| `/api/store/registry` | Store registry JSON API |
| `/api/hbk` | HBK Mk-II kernel run table |

## Data Status for All Water-Related Demos

| Item | Status |
|---|---|
| NMBM water data | **PLACEHOLDER / SIMULATION** — not real municipal data |
| Hydraulic baseline scenarios | **SYNTHETIC** — generated to simulate realistic sensor behaviour |
| Field evidence photos (construction site) | **REAL** — but NOT water-infrastructure specific; they demonstrate the evidence-ingestion workflow, not water validation |
| SCADA / repair records | **NONE** — no municipal SCADA data has been provided |
