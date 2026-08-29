# Task 7 — IVE System Panels (Telemetry, Terminal, Watchdog, Lindiwe)

**Agent**: Panel Builder (system surfaces)
**Task ID**: 7
**Scope**: Build 4 named-export React panels for the VVU IVE workspace.

## Context Reviewed

- `worklog.md` — project identity, frozen contract, forbidden terms, architecture decisions.
- `src/store/useIveStore.ts` — canonical Zustand store. Selectors used: `telemetry`, `contract`, `sphereVerified`, `sphereTotal`, `circuitBreaker`.
- `src/lib/ive/types.ts` — `Telemetry`, `HardwareProfile`, `ExplicitMissing`, `ZooApiStatus`.
- `src/lib/ive/evidence.ts` — LEDGER + EVIDENCE_TIMELINE (referenced for visual language).
- `src/lib/ive/contract.ts` — `buildFrozenContract()` produces the telemetry + hardware_profile data the TelemetryPanel reads.
- `src/components/ive/primitives.tsx` — `PanelFrame`, `StatCard`, `StatusPill`, `MonoTable`, `SectionLabel`. All four panels compose from these.
- `src/components/ive/panels/OverviewPanel.tsx` + `ProofGraphPanel.tsx` — visual reference for motion timing, accent usage, grid layouts.

## Files Produced

1. `/home/z/my-project/src/components/ive/panels/TelemetryPanel.tsx`
   - Selectors: `telemetry`, `contract`, `sphereVerified`, `sphereTotal`, `circuitBreaker`.
   - Stats row (Run ID, Mesh Density, Circuit Breaker, Speedup Ratio).
   - Live Mesh card with verified/total + density progress bar.
   - MESH ACTIVITY sparkline (display-only oscillator, 48 bars, 420ms interval, seeded by `sphereVerified`).
   - Zoo API integration card (native/wrapper/integration with StatusPills).
   - Raw telemetry MonoTables for `rawSimulationMeta`, `rawTrainingMetrics`, `rawBenchmarkData`.
   - Hardware profile grid (device, backend, speedup, provider, pytorch, hip).
   - `coerce()` helper converts any value to render-safe string; `isExplicitMissing()` preserves UNDEFINED/MISSING/REQUIRES VALIDATION markers in `var(--ive-blocked)`.

2. `/home/z/my-project/src/components/ive/panels/TerminalPanel.tsx`
   - Deterministic replay terminal. 6 fixed command→output lines (boot, load hbk-mkii, generate obligations, run solver, write ledger, release status).
   - `ReplayBody` child component owns `revealed` state + interval; parent remounts it via `key={replayNonce}` on Replay click (avoids `setState`-in-effect lint error).
   - Blinking cursor (`ive-blink`) when replay completes.
   - Read-only disabled input line at bottom with `ive>` prompt.
   - REPLAY badge in actions + Replay button.
   - Auto-scrolls to bottom on new line. Cleanup on unmount via `mounted` flag + `clearInterval`.
   - Sequence manifest table below the terminal (static reference).
   - No interactive execution — purely deterministic.

3. `/home/z/my-project/src/components/ive/panels/WatchdogPanel.tsx`
   - Reads `circuitBreaker` from store (default NORMAL).
   - State machine: NORMAL → DEGRADED → FAIL_CLOSED.
   - Concentric SVG rings (3 circles, current state highlighted + pulsing via framer-motion).
   - State stepper cards showing each state with ACTIVE/TRAVERSED/ARMED pills.
   - 6 safety interlocks as cards with StatusPills (Hydraulic actuation authority=UNDEFINED, Secure boot=REQUIRES VALIDATION, Firmware integrity=REQUIRES VALIDATION, Independent safety circuits=REQUIRES VALIDATION, Fault detection/isolation=REQUIRES VALIDATION, Recovery after reset=NOT_EVALUATED).
   - Prominent banner: "Tier 1 fails to a non-actuating state. Hydraulic actuation authority is UNDEFINED until resolved."
   - StatCards for Watchdog Uptime (REQUIRES VALIDATION), Last Heartbeat (REQUIRES VALIDATION), Actuation Authority (UNDEFINED).
   - Tier separation section (Tier 1 / Tier 2 / Heartbeat).
   - Footer note: "Safety enforcement occurs inside Tier 1 and cannot be bypassed by Tier 2."

4. `/home/z/my-project/src/components/ive/panels/LindiwePanel.tsx`
   - Violet accent (`#b23dff`).
   - Agent identity hero with pulsing Bot icon + pulse-ring.
   - State stepper: DORMANT → LISTENING → ANALYZING → PROPOSING → REVIEWING. Only DORMANT active.
   - 5 capabilities (Read CAD params=NOT_DEMONSTRATED, Auto-generate specs=REQUIRES VALIDATION, Suggest design changes=REQUIRES VALIDATION, Review evidence packages=REQUIRES VALIDATION, Flag missing inputs=REQUIRES VALIDATION).
   - Illustrative conversation (engineer→lindiwe) clearly labeled ILLUSTRATIVE / NOT LIVE.
   - Capability map (Reasoning, Safety Posture, Audit Surface).
   - Architectural note: "Native Zoo Agent API (Zookeeper) execution is NOT_DEMONSTRATED. All capabilities are REQUIRES VALIDATION within the frozen submission scope."

## Design Decisions

- **Accent per panel**: Telemetry=#3d9bff (pending blue, fits live runtime), Terminal=#3dffb0 (proven green, classic terminal), Watchdog=#ff4d5f (blocked red, safety surface), Lindiwe=#b23dff (zk violet, agent surface). None use indigo/blue primary.
- **No fabricated values**: every missing value uses ExplicitMissing markers. `coerce()` falls back to "UNDEFINED" for null/undefined, never to fabricated defaults.
- **Forbidden terms avoided**: no "SAFE_FOR_DEPLOYMENT", "Engineering certified", "FEA verified", "Physically validated", "System safe", "Epistemic Runtime".
- **Responsive**: all grids collapse to 1 column on mobile (`grid-cols-2 sm:grid-cols-4` etc., `lg:grid-cols-[...]` for two-column layouts).
- **Framer Motion**: subtle `initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}` entrances throughout. Watchdog rings use animated `motion.circle` for pulse effect.
- **Lint compliance**: fixed `verifiedRef.current = verified` (moved into useEffect) and `setRevealed(0)` in effect (restructured with `key={replayNonce}` remount pattern).

## Verification

- `bun run lint` — all 4 panel files pass. Remaining lint errors are pre-existing in `CommandPalette.tsx` and `PanelRouter.tsx` (not in scope of this task).
- `dev.log` — `✓ Compiled in 13.9s`. Module-not-found errors are only for panels OTHER agents are responsible for (ExplorerPanel, ArtifactsPanel, etc.); my 4 panels resolve cleanly via the PanelRouter's dynamic imports.
