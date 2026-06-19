# SafeStakes Landing Pages: Implementation Plan

## Goal
Integrate SafeStakes storyline, Loss Velocity Engine concept, and Ubuntu Meta-Protocol framing into the existing VVU terminal UI without breaking the current dark aesthetic or rewrite routing.

## Pre-flight summary
- `next.config.mjs` already rewrites `/proofbridge`, `/gates`, `/gate-1`..`6` → `/vvv/` static HTML ✅
- VVU pages use absolute `/vvv/pools.css` — no relative-path issues ✅
- `app/api/verify/route.ts`, `app/api/mint/route.ts`, `middleware.ts` all present ✅
- `.vercelignore` and release commit already done ✅

## Key design decision
**Reuse `public/vvv/` terminal pages.** They already match the VVU dark, crimson-accented UI. We do NOT create a parallel `/safestakes/` folder. SafeStakes lives inside VVU (`/proofbridge` sections, new `/gate-7-loss-velocity/` or inline in Gate 2).

## Implementation steps

### Step 1 — Content audit (read-only)
- Read `public/vvv/index.html` (proofbridge.html) to identify insertion points for SafeStakes copy.
- Read `public/vvv/gate-2.html` to confirm crimson styling is the right place to introduce Loss Velocity Engine narrative.
- Read `public/vvv/pools.css` to verify crimson palette already covers the tactics below.

### Step 2 — Landing page expansion (`public/vvv/proofbridge.html`)
Add two new sections after the existing hero:
1. **"The SafeStakes Bridge — Harm Reduction as Architecture"** (shared earlier)
   - Loss Velocity Engine paragraph
   - Redirect-to-Earn paragraph
   - Ubuntu Meta-Protocol paragraph
2. **"The Seven Pillars"** table/summary
   - Map Pillars 1–7 with names + quarters
   - Crimson highlight on Pillars 2–4 (Mainframe triad)
   - Annotation: SafeStakes integration at Pillar 5 (Scaling) and Pillar 7 (Upscaling)

Style: match existing terminal `.vvu-section`, `.vvu-card` classes; reuse `--crimson` (already set in pools.css).

### Step 3 — New dedicated route: `/gate-7-loss-velocity/`
Mirror existing `gate-N.html` pattern:
- `public/vvv/gate-7.html`
- Add rewrite in `next.config.mjs`: `/gate-7` → `/vvv/gate-7.html`
- Content: Loss Velocity Engine deep-dive, velocity threshold behaviour, underwriting mechanics (COMB → TEST → SIGN), SafeStakes HSM pool structure
- Style: crimson accent boards, terminal scroll aesthetic

Verify `/gate-7` returns 200 and inherits `/vvv/pools.css`.

### Step 4 — Gate 2 (`public/vvv/gate-2.html`) contextual update
Gate 2 is already crimson. Add a "Loss Velocity Watch" subsection with:
- Threshold trigger description (non-judgemental)
- Redirect-to-Earn visual indicator (Ubuntu Pools contribution preview)
- No spinner or score counter — static/educational content only

### Step 5 — Build & validate
Run:
```
npm run build
```
Verify:
- `/` → 200
- `/proofbridge` → 200
- `/gates` → 200
- `/gate-1` .. `/gate-7` → 200
- `/api/verify` → 200
- `/api/mint` → 200

## Files to modify
| File | Action |
|------|--------|
| `public/vvv/proofbridge.html` | Add SafeStakes + Seven Pillars sections |
| `public/vvv/gate-2.html` | Add Loss Velocity Watch subsection |
| `public/vvv/gate-7.html` | **Create** — Loss Velocity Engine deep-dive |
| `next.config.mjs` | Add `/gate-7` rewrite |

## Files to NOT touch
- `.env` / `.env.local` — secrets
- `.replit` — local-only config
- Three untracked HTML files in root — excluded, do not commit
- `app/api/verify/route.ts`, `app/api/mint/route.ts`, `middleware.ts` — already correct

## Validation criteria
- Build passes
- All 7 gates + proofbridge return 200
- Zero new relative paths or broken assets
- CSS stays single-file (`/vvv/pools.css`)
- No secrets committed
