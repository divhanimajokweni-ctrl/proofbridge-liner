# PLAN — VVU OS DASHBOARD MVP — 2026-07-01

## Business Intent
Transform the current monolithic, mock-data dashboard into a high-performance, real-time system operations interface using modern CSS (container queries, light-dark(), :has(), clamp()), DOM virtualization, and a WebSocket-based telemetry backend that streams live /proc, Docker, and kernel metrics.

## User Story
As a VVU OS operator, I need a real-time dashboard that displays live system metrics (CPU, memory, Docker containers, process list) with sub-100ms updates, responsive widget layouts that adapt to any viewport, and virtualized DOM rendering that maintains 60fps even with thousands of data points, so that I can monitor and control the infrastructure without performance degradation.

## Acceptance Criteria
- [ ] **AC-1**: Dashboard uses CSS Grid with `repeat(auto-fit, minmax(...))` for fluid widget layout
- [ ] **AC-2**: Widgets use `@container` queries instead of media queries for layout adaptation
- [ ] **AC-3**: Color scheme uses `light-dark()` for automatic OS-level theme switching
- [ ] **AC-4**: Stateful styling via `:has()` selectors (e.g., card:has(> .active))
- [ ] **AC-5**: Fluid typography via `clamp()` throughout
- [ ] **AC-6**: `content-visibility: auto` + `contain: layout style paint` applied to all off-screen widgets
- [ ] **AC-7**: Process table and metric lists use DOM virtualization (virtual-scroll, max 40 visible rows)
- [ ] **AC-8**: WebSocket server streams live /proc/stat, /proc/meminfo, Docker stats at 1s interval
- [ ] **AC-9**: Frontend consumes WebSocket and updates widgets in real time without polling
- [ ] **AC-10**: Monolithic `page.tsx` is broken into focused route pages (`/dashboard`, `/dashboard/infra`, `/dashboard/telemetry`)
- [ ] **AC-11**: Old `app/page.tsx` is preserved and routes default to `/dashboard`
- [ ] **AC-12**: Build passes (`npm run build`), no regressions on existing routes

## Compliance Gate Status
- **Hard failures in scope**: HF-1 (audit trail for dashboard commands), HF-2 (circuit breaker for Docker/process control)
- **This plan does not touch**: HF-3 (SafeKrypte), HF-4 (SafeLiner), HF-5 (key management)
- **Risk note**: WebSocket server introduces a new persistent process. Must be monitored in production.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        VERCEL (Next.js)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ /dashboard   │  │ /dashboard/  │  │ /dashboard/telemetry     │ │
│  │ Overview     │  │ infra         │  │ Globe + streaming        │ │
│  │ (CSS Grid +  │  │ (Docker +     │  │ (WebSocket consumer)    │ │
│  │  container   │  │  Process)    │  │                          │ │
│  │  queries)    │  │ Virtualized   │  │                          │ │
│  └─────────────┘  └──────────────┘  └──────────────────────────┘ │
│                       │   ▲ WebSocket ▲                           │
└───────────────────────┼───┼──────────┼───────────────────────────┘
                        │   │          │
              ┌─────────▼───┴──────────┴──────────┐
              │    WebSocket Telemetry Server       │
              │    (:3001)                           │
              │                                     │
              │  ┌─ /proc collector ─────────────┐  │
              │  │  /proc/stat → CPU%            │  │
              │  │  /proc/meminfo → Memory       │  │
              │  │  /proc/loadavg → Load         │  │
              │  └───────────────────────────────┘  │
              │  ┌─ Docker collector ────────────┐  │
              │  │  /var/run/docker.sock → stats │  │
              │  └───────────────────────────────┘  │
              │  ┌─ OS collector ────────────────┐  │
              │  │  os.cpus(), os.freemem(), etc │  │
              │  └───────────────────────────────┘  │
              │  ┌─ In-memory time buffer ───────┐  │
              │  │  Ring buffer: last 300 epochs │  │
              │  │  (5 min at 1s intervals)      │  │
              │  └───────────────────────────────┘  │
              └─────────────────────────────────────┘
```

## Affected Files — Track A (Frontend)

| File | Change |
|---|---|
| `app/globals.css` | Add `@container` support, `light-dark()`, `:has()` utilities, `content-visibility` classes |
| `app/styles/variables.css` | Add `light-dark()` color tokens, clamp() typography scale, container query breakpoints |
| `app/layout.tsx` | Add dashboard route segment layout if needed |
| `app/dashboard/page.tsx` | NEW — Dashboard overview with CSS Grid + container queries |
| `app/dashboard/infra/page.tsx` | NEW — Infrastructure view with virtualized process table + Docker stats |
| `app/dashboard/telemetry/page.tsx` | NEW — Telemetry globe + streaming metrics |
| `app/components/DashboardWidget.tsx` | NEW — Reusable widget shell with container query support |
| `app/components/ProcessTable.tsx` | NEW — Virtualized process table (40-row window) |
| `app/components/MetricCard.tsx` | NEW — Single metric card with sparkline |
| `app/components/SystemStatusBar.tsx` | NEW — Live status bar consuming WebSocket |
| `app/components/MetricsGrid.tsx` | NEW — CSS Grid with auto-fill for metric cards |
| `app/page.tsx` | Simplify to redirect to `/dashboard` |

## Affected Files — Track A (Backend)

| File | Change |
|---|---|
| `server/telemetry-server.ts` | NEW — WebSocket server + /proc + Docker collectors |
| `server/lib/proc-collector.ts` | NEW — /proc/stat, /proc/meminfo, /proc/loadavg parser |
| `server/lib/docker-collector.ts` | NEW — Docker stats from /var/run/docker.sock |
| `server/lib/telemetry-types.ts` | NEW — TypeScript types for all telemetry messages |
| `package.json` | Add `ws` dependency (WebSocket library) |

## Test Assertions
1. `/proc/stat` parsing → returns CPU user/nice/system/idle as numbers
2. `/proc/meminfo` parsing → returns MemTotal, MemFree, MemAvailable as numbers
3. WebSocket server starts on port 3001 and accepts connections
4. WebSocket client receives `telemetry:pulse` events at 1s intervals
5. Container query renders at different widths → widget layout responds
6. Virtualized process table with 1000 rows → only 40 DOM nodes rendered
7. `light-dark()` applies correct colors in light/dark modes
8. Build passes with `npm run build`
9. Existing routes `/`, `/api/*`, `/pools`, `/proofbridge` continue to work

## Branch
`compliance-fabric`

## Token Budget Estimate
- Frontend CSS + components: ~50 edits across 10 files
- WebSocket server + collectors: ~30 edits across 4 new files
- Route extraction from page.tsx: ~20 edits
- Validation + debug: ~10 edits
- Total: ~110 turn budget estimate (high-complexity session)

## Handoff Plan
If this session is interrupted, preserve:
1. Running WebSocket server details (port 3001)
2. The /proc collector parse format and field mapping
3. CSS container query pattern established in DashboardWidget
4. Any virtual-scroll implementation decisions

## APPROVED BY: _______________ DATE: _______________
