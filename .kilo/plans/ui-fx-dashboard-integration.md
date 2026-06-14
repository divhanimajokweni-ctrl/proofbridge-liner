# UI-FX Dashboard Integration Plan

## Goal
Replace the current basic inline-style `src/app/page.tsx` with production-grade animated dashboard components from `vvv/UI-FX.md`, integrated into the live Next.js app. Elite execution quality.

## Scope
Both components, both implemented:
1. **AntColonyLoader** — animated colony matrix loading overlay (initial page load / loading states)
2. **AdvancedGlobeTelemetry** — Three.js interactive 3D globe with ZA hub markers and telemetry arcs

Replit app-storage images: inspect for available assets first. If found, integrate them where they enhance the architecture (e.g., globe textures, node markers, UI iconography). If not found or not usable, build custom assets that align with the Ubuntu/ant-colony visual language. Either path must result in a cohesive, elite visual finish.

Viewport: body `overflow: hidden` stays. Everything fits within `100vh` (`100dvh` fallback). No scrolling.

## Pre-conditions
- `three` and `@types/three` must be installed
- `vvv/UI-FX.md` is the source of truth
- No component library installed; inline styles / CSS modules only
- Body has `overflow: hidden` → all content must viewport-fit

## Design Decisions (Confirmed)
- **Components**: Both `AntColonyLoader` and `AdvancedGlobeTelemetry`
- **Replit images**: Inspect bucket first; use if they enhance architecture, otherwise build custom assets aligned with Ubuntu/ant-colony visual language
- **Viewport**: `overflow: hidden` stays. All content fits within `100vh` / `100dvh`. No scrolling.
- **Lindiwe**: Keep `/api/lindiwe` POST for real queries; supplement with local mock responses for fallback/demo states
- **Gate state**: Fetch live from `/api/metrics/gate-*` endpoints; fall back to simulated cards on failure or for unmonitored gates

## Execution Steps

### 1. Install dependencies
```bash
npm install three @types/three
```

### 2. Inspect for Replit images
Search workspace and public dirs for any previously uploaded images. If present, inventory and decide placement.

### 3. Scaffold component files
Create `src/components/fx/AntColonyLoader.tsx` and `src/components/fx/AdvancedGlobeTelemetry.tsx` faithfully from UI-FX.md.

### 4. Rebuild `src/app/page.tsx`
- Replace inline gate cards with a full-viewport dashboard grid
- Mount `AntColonyLoader` on initial load; dismiss on complete
- Add `AdvancedGlobeTelemetry` in a dedicated panel
- Restyle Lindiwe query bar to match dark terminal palette
- Use palette: `#0d1117` (bg), `#1c2535` (border), `#c8a96e` (gold), `#3ecf8e` (green), `#00E5FF` (cyan), `#FF3333` (alert red), `#8F9CAE` (text-muted)

### 5. Enforce viewport constraint
All containers use `height: 100vh` / `100dvh`. No scrolling. Globe canvas fills its container. Grid uses CSS Grid with `fr` units to share viewport real-time between panels.

### 6. Validate
- `npm run dev` → page renders with 0 runtime errors
- Globe canvas mounts, orbits on drag, tooltips appear on node hover
- AntColonyLoader animates, progresses to 100%, dismisses → ~8s
- No missing asset 404s; no overflowing content
- All 7 gates + proofbridge + target calls return 200 (existing checks)

## Open Questions for Confirmation Before Execution
1. **Lindiwe API integration**: Current page POSTs to `/api/lindiwe`. Should the rebuilt dashboard keep this call, or replace with local mock responses matching the UI-FX.md Lindiwe behavior?
2. **Gate state source**: Current cards are hardcoded. Should real gate statuses be fetched from existing `/api/metrics/gate-*` endpoints, or stay simulated for the demo view?
