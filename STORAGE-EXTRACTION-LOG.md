# VVU Storage Extraction & Cleanup Log

**Date:** 2026-08-15
**Executor:** Z.ai Code Agent
**Before:** 717 MB (excl. node_modules) | **After:** 348 MB | **Saved:** 369 MB (51.5%)

---

## Phase 1: PDF Extraction → Markdown

All PDFs were extracted to `.md` files using `pdftotext`. Original PDFs were removed after successful extraction.

| # | Original PDF | Extracted MD | Lines |
|---|---|---|---|
| 1 | `upload/VRES-v1.0.pdf` (311K) | `upload/VRES-v1.0.md` | 5,653 |
| 2 | `validation/VVU-VAL-001/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf` (205K) | `.md` | 1,184 |
| 3 | `outreach-docs/VVU-Dev-Spec-Technical-Outreach-Edition.pdf` (33K) | `.md` | 867 |
| 4 | `outreach-docs/VVU-Assembly-Prototype-Lifecycle-Spec-Guide-Outreach-Edition.pdf` (27K) | `.md` | 750 |
| 5 | `outreach-docs/VVU-User-Manual-Outreach-Edition.pdf` (26K) | `.md` | 625 |
| 6 | `outreach-docs/VVU-Research-Proposal-Academic-Partnership-Edition.pdf` (26K) | `.md` | 560 |
| 7 | `outreach-docs/VVU-Fabricator-Spec-Guide-Outreach-Edition.pdf` (26K) | `.md` | 708 |
| 8 | `outreach-docs/VVU-Admin-Spec-Operations-Outreach-Edition.pdf` (26K) | `.md` | 727 |
| 9 | `test/test-deed.pdf` (2K) | `test/test-deed.md` | 25 |

**Total PDFs extracted:** 9 | **Total lines recovered:** 11,099

---

## Phase 2: Archive Removal

Archives that were already extracted alongside their contents were removed:

| Archive | Size | Already Extracted To |
|---|---|---|
| `upload/VVU-Legacy-Dashboard.zip` | 481K | `upload/VVU-Legacy-Dashboard/` |
| `upload/demo-project.zip` | 168K | `upload/demo-project/` |
| `disposable-storage/files-extracted/trust-runtime.zip` | 51K | `disposable-storage/files-extracted/*.ts` |

---

## Phase 3: Nuclear Cleanup

| Target | Size | Reason |
|---|---|---|
| `disposable-storage/` (entire) | **3.0 MB** | Explicitly disposable; 90%+ duplicate of `upload/` and `validation/` |
| `tool-results/` | 156 KB | Disposable tool output cache |
| `.next/` (build cache) | **333 MB** | Fully regenerable via `next dev` |
| `final-landing.png` | 1.3 MB | Stale verification screenshot |
| `clerk-verified.png` | 333 KB | Stale verification screenshot |
| `landing-page-verified.png` | 329 KB | Stale verification screenshot |
| `verify-landing.png` | 314 KB | Stale verification screenshot |
| `landing-page-check.png` | 99 KB | Stale verification screenshot |

---

## Phase 4: Git GC

Ran `git add -A` + `git gc --aggressive --prune=now` to shrink repository object store.

---

## What Was Kept

### Images (PNG/JPG/WEBP/SVG)
All image assets were **preserved** — they're useful for:
- **Brand identity** (logos, favicons)
- **Design templates** (VR canvas, digital eguide case studies)
- **Social cards** (editorial, swiss style backgrounds)
- **IVE/UI integration** references for cookbooks and documentation

A visual album was created at `visual-album.html` with all 46 assets cataloged with:
- Tabbed navigation (Brand, Design Templates, Social Cards, Case Studies, All)
- Lightbox viewer for full-size inspection
- Category badges (Brand, Design, IVE, UI)

### Source Code
All `src/`, `air/`, `contracts/`, `packages/`, `server/`, `mini-services/`, `docs/`, `config/`, `lib/`, `prisma/` directories were preserved.

### Validation
The canonical `validation/VVU-VAL-001/` directory was preserved (only the duplicate in `disposable-storage/` was removed).

---

## Remaining Storage Notes

| Item | Size | Recommendation |
|---|---|---|
| `node_modules/` | 1.2 GB | Standard — `bun install` regenerates |
| `.git/objects/` | ~300 MB | Consider BFG repo-cleaner for history bloat |
| `skills/design/design-templates/` | ~49 MB | 5 monolithic HTML files >1.4MB each — consider CDN |
| `skills/` total | ~61 MB | Design templates + skill scripts |
| `upload/VVU-Legacy-Dashboard/` | 2.0 MB | Extracted dashboard — consider if still needed |

---

## Files Modified by This Session

### Created
- `src/lib/evidence/openrouter-reranker.ts` — Server-side AIR evidence reranker
- `src/app/api/evidence/rerank/route.ts` — Authenticated rerank API route
- `src/components/vvu/model-provider-config.tsx` — Model provider UI with OpenRouter preset
- `visual-album.html` — Visual asset gallery
- `STORAGE-EXTRACTION-LOG.md` — This file
- 9 × `.md` files from PDF extraction

### Modified
- `.env.local` — Added OPENROUTER_API_KEY, Clerk API URLs, TFC tokens
- `next.config.ts` — Added allowedDevOrigins, Clerk image remotePattern
- `src/components/auth/clerk-provider.tsx` — Added ClerkErrorBoundary
- `src/proxy.ts` — Added domain-aware Clerk middleware

### Deleted
- 9 × PDF files (extracted to .md)
- 3 × ZIP archives (already extracted)
- `disposable-storage/` (entire directory)
- `tool-results/` (entire directory)
- `.next/` (build cache)
- 5 × stale verification screenshots
