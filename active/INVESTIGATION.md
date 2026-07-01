# INVESTIGATION — VVU OS DASHBOARD — 2026-07-01

## Task
Investigate the current frontend architecture, backend services, and infrastructure of VVU OS to plan a high-performance system dashboard with kernel telemetry, container/cgroup supervision, time-series core, and virtualized real-time visualization.

## Current State — Frontend

### Architecture
- **Framework**: Next.js 14+ (App Router), React with `'use client'` components
- **CSS**: Tailwind CSS v4 (`@import "tailwindcss"`), custom design tokens in CSS variables (`app/styles/variables.css`)
- **Animations**: framer-motion (motion.div, AnimatePresence)
- **Rendering**: All client-side (`'use client'` in page.tsx and all components)
- **Deployment**: Vercel (`76.76.21.21`), production at `venturevisionubuntu.co.za`

### Main Dashboard (app/page.tsx — 1019 lines)
Single monolithic `'use client'` component containing:
- 4-tab navigation (Deck, Terminal, Infrastructure, Globe)
- Simulated trust signal meter (fake timer increments)
- Simulated CPU telemetry (random number oscillator)
- SVG Sparkline component (inline, 127x30px)
- Canvas TelemetryGlobe (3D node sphere with rotation)
- AntonyTrack mascot queue animation
- AgentChat terminal (calls POST /api/agent/converse)
- Project grid with drawer detail panel
- All data is **mocked/simulated** — no real telemetry sources

### Extracted Components (app/components/)
| Component | Lines | Description |
|---|---|---|
| `AntonyQueueEngine.tsx` | ~120 | Animated task queue display |
| `EntityLanding.tsx` | ~170 | Landing page with CSS grid |
| `KernelConsole.tsx` | ~150 | Basic kernel process viewer |
| `KernelConsoleV2.tsx` | ~200 | Full microkernel control panel with PCB table, IPC, scheduler |
| `ProjectGrid.tsx` | ~103 | Staggered project card grid |
| `Sidebar.tsx` | ~65 | Navigation sidebar |
| `SiteHeader.tsx` | ~80 | Site header |
| `SiteFooter.tsx` | ~60 | Site footer |
| `VelocityChart.tsx` | ~208 | SVG area chart with CSV export |

### CSS Architecture
- **Tailwind v4** in `globals.css` (shadcn/ui theme variables)
- **Custom design tokens** in `app/styles/variables.css` (261 lines):
  - Colors: void, surface, card, border, gold, cyan, green, crimson, orange, blue, purple
  - Typography: Syne (display), IBM Plex Mono (mono), DM Sans (body)
  - Spacing/radius, motion easings, keyframe animations
- **Modern CSS features used**: ❌ NONE
  - Container queries (`@container`): ❌ Not used
  - `light-dark()` color scheme: ❌ Not used
  - `:has()` selectors: ❌ Not used
  - `content-visibility: auto`: ❌ Not used
  - `clamp()` for fluid typography: ❌ Not used in dashboard (used only in `/pools` and `/proofbridge` pages)
- **Layout**: Inline styles with hardcoded color hex values (duplicating CSS variable tokens)

### DOM Virtualization
- **None**. The dashboard renders all items (project cards, processes) eagerly.
- No windowing/virtualization libraries installed.
- No `content-visibility` or `contain: layout style paint` for off-screen elements.

### Responsive Design
- Current approach: Tailwind breakpoint classes (sm:, md:, lg:)
- Hardcoded pixel values throughout inline styles
- No fluid grid using `grid-template-columns: repeat(auto-fit, minmax(...))` in the dashboard

## Current State — Backend

### Kernel/Operatus
- **src/lib/kernel/vvu-operatus.ts**: Singleton microkernel runtime
  - Spawns 4 operators: HAL-DRV, SAFELINER, SAFEKRIPTE, AUDIT-BUS
  - Priority-preemptive scheduler with IPC mailboxes
  - System status, process list, kernel panic/reboot
  - All **in-process** Node.js — no separate daemon, no eBPF, no cgroups

### Live Services (server/)
| Service | Port | Description |
|---|---|---|
| `safekrypte-lite.ts` | 5096 | ED25519 signing service, email keygen/pubkey |
| `safeline-lite.ts` | 5097 | Credential issuance + email-credential |
| `vvu-operatus-server.ts` | 4096 | Operatus HTTP surface |
| `mock_sarb_endpoint.ts` | — | Mock SARB for testing |

### Real-Time Communication
- **WebSocket/SSE**: ❌ NONE — no infrastructure exists
- The docs page mentions `wss://ant.vvu.africa/v1/stream` as a planned endpoint but it is **not implemented**
- All data is request-response REST (fetch/POST/GET)

### Time-Series & Caching
- **Time-series DB**: ❌ NONE — no InfluxDB, TimescaleDB, or equivalent
- **Redis**: ❌ NONE — not installed or configured
- All metrics are ephemeral, in-memory, and simulated

### Process/Container Orchestration
- **Process monitoring**: In-process Node.js only (simulated PCB table)
- **Docker daemon access**: `/var/run/docker.sock` exists (Docker v27.5.1 installed) but **no code consumes it**
- **cgroups access**: None
- **/proc or /sys scraping**: None

### System Telemetry
- **eBPF**: ❌ Not available (no kernel headers, containerized environment)
- **CPU/Memory/Disk telemetry**: None (all simulated in page.tsx useState)

## Current Branch
`compliance-fabric`

## Required Branch
`compliance-fabric` (Tier-3 for core infrastructure changes)

## Downstream Dependencies
- All 12 VVU services/pages depend on the Operatus runtime for "live" status
- The AgentChat component depends on `/api/agent/converse`
- Vercel deployment pipeline (pre-push hook) must pass build
- No existing real-time infrastructure — introducing WebSocket/SSE requires new server components

## Gaps vs. Target Architecture

| Target Feature | Current State | Gap Severity |
|---|---|---|
| CSS Grid + auto-fit + minmax | Minimal usage; hardcoded grids | MODERATE |
| Container queries (@container) | Not used anywhere | HIGH |
| light-dark() color scheme | Tailwind dark mode only (.dark class) | LOW |
| :has() selectors | Not used | MODERATE |
| clamp() fluid typography | Used in 2 pages only | LOW |
| content-visibility: auto | Not used | HIGH |
| DOM virtualization | Not used — 1000s of rows would tank perf | CRITICAL |
| WebSocket/SSE streaming | Not implemented | CRITICAL |
| eBPF kernel tracing | Not available in this environment | HIGH |
| Rust/Go telemetry daemon | Not built | CRITICAL |
| Time-series database | Not configured | CRITICAL |
| Redis caching | Not configured | CRITICAL |
| /proc + /sys scraping | Not implemented | HIGH |
| Docker socket monitoring | Not implemented | HIGH |
| Anomaly detection | Not implemented | MEDIUM |
| Log aggregation (Vector/FluentBit) | Not configured | MEDIUM |

## Hard Failures In Scope
- **HF-5 (Key Management)**: Not directly touched by dashboard work
- **HF-1 (Audit Trail)**: If dashboard adds real-time command execution, audit logging required
- **HF-2 (Circuit Breaker)**: If dashboard controls Docker/process lifecycle, circuit breaker needed

## Unknowns Before Planning
1. Is eBPF possible in this environment? (Containerized — likely NO without kernel privileges)
2. Will the WebSocket/SSE server be a new Node.js service or integrated into the Next.js app?
3. What is the minimum viable set of telemetry metrics? (CPU? Memory? Docker? All 3?)
4. Should the time-series data start with SQLite (zero-dependency) or require TimescaleDB/InfluxDB?
5. Who is the primary audience? (Developer ops, investor compliance dashboard, or both?)
6. What is the acceptable latency for real-time updates? (1s? 100ms? 16ms?)

## Stale Context Risk
- Session is active and uninterrupted
- All file reads from disk are current as of 2026-07-01 17:09 UTC
- No stale context risk at this time
