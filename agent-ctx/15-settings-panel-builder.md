# Task 15 — Settings Panel Builder

**Agent**: Settings panel builder (subagent)
**Task ID**: 15
**Task**: Build `src/components/ive/panels/SettingsPanel.tsx` — the IVE user-preferences surface (21st panel).

## Context read
- `worklog.md` (last ~60 lines) — project stable through Task 14 (MissionControl + StatsHUD + accent underline). Settings panel was the [LOW] next-phase recommendation #6.
- `src/store/useIveStore.ts` — confirmed `settings: IVESettings` selector and `updateSettings(patch)` action, persisted to localStorage key `ive-settings-v1`. `IVESettings` interface has `autoSkipBoot`, `animationIntensity`, `defaultOpenMissionControl`, `defaultOpenStatsHud`, `accentOverride: string | "gold"`, `showBootSoundWave`.
- `src/components/ive/primitives.tsx` — `PanelFrame`, `SectionLabel`, `Kbd`, `StatusPill`, `StatCard`, `MonoTable` confirmed.
- `src/components/ive/panels/OverviewPanel.tsx` — visual language reference (frosted cards, mono labels, gold accents, motion entrance).
- `src/components/ui/switch.tsx` — Radix Switch, exports `Switch`.
- `src/components/ui/button.tsx` — Button with `outline`/`destructive`/`ghost` variants, `sm`/`default` sizes.
- `src/hooks/use-toast.ts` — exports `toast({ title, description })`; `Toaster` already mounted in `src/app/layout.tsx`.
- `PanelRouter.tsx` already wired to dynamic-import `../panels/SettingsPanel` (`.then((m) => m.SettingsPanel)`) — the missing module was the cause of the pre-existing "Module not found" in dev.log; this task resolves it.

## Work Log
- Created `/home/z/my-project/src/components/ive/panels/SettingsPanel.tsx` (~440 lines, strict TS, `"use client"`, named export `SettingsPanel`, no default export).
- Visual language: dark cinematic theme, `PanelFrame` wrapper (title "Settings", tag "SET", accent "#8b949e", mission "User preferences — boot auto-skip, animation intensity, widget defaults, accent override."). A small "local · no telemetry" status pill in the header actions slot.
- Six sections matching the spec, each wrapped in a `SectionShell` (motion fade-in-up entrance, icon + title + description header):
  1. **Boot & Animation** (Zap, gold) — Auto-skip boot Switch; Show boot sound-wave Switch; Animation intensity segmented control (3 buttons Full/Reduced/None with check icon on active).
  2. **Widget Defaults** (SettingsIcon, gray) — Default-open Mission Control + Default-open Stats HUD Switches; muted note that defaults apply on next mount.
  3. **Accent Color** (Palette, violet) — 6 clickable swatch circles (Gold/Sage/Ember/Mint/Steel/Violet) with ring+glow on the active one; "Reset to default" outline button; current-value readout (renders a read-only `<input>` when `accentOverride` is a custom hex outside the palette, otherwise shows `"gold" → #C9A84C` or the hex); note clarifying frozen engineering colors are not affected.
  4. **Keyboard Shortcuts Reference** (KeyboardIcon, blue) — 2-column grid of 9 shortcuts using the `Kbd` primitive: ⌘K, F8, T, M, H, [ / ], g c/r/u/h/s, ?, Esc.
  5. **Data & Privacy** (Database, green) — Card explaining localStorage persistence (key `ive-settings-v1`, no server, clearing browser storage resets). "Reset all settings" button using two-click confirm pattern: first click arms (button label changes to "Click again to confirm" + destructive variant), second click calls `updateSettings(DEFAULT_SETTINGS)` and fires `toast({ title: "Settings reset", ... })`. Disarming on mouse-leave/blur for safety.
  6. **Footer** — "IVE Settings v1 · Preferences are local to this browser." + persisted-status pill + collapsible `<details>` showing the current settings JSON (pretty-printed, max-h-72 scroll, proven-green tint) for transparency.
- All toggles call `updateSettings({ ... })` immediately — `updateSettings` handles localStorage persistence internally, so no extra wiring needed.
- Accent swatches set `accentOverride` to `"gold"` for the Gold swatch and the literal hex for the others (matches the `string | "gold"` type).
- Framer-motion entrance on each section (`opacity 0→1`, `y 12→0`, 0.32s ease-out).
- Accessibility: `role="radiogroup"` + `role="radio"` + `aria-checked` on the segmented control; `aria-label` on every Switch; `aria-pressed` on swatches; `aria-label` on the read-only custom-hex input.
- No indigo/blue primary colors used for accents (Steel #3d9bff and Violet #b23dff appear only as user-selectable swatch options, not as the panel's own accent — panel accent is gray #8b949e per the catalog entry).
- No emojis. Lucide icons only (Settings, Zap, Palette, Keyboard, Database, RotateCcw, Check, ShieldCheck).

## Verification
- `bun run lint` → **0 errors, 0 warnings** in project sources (the only remaining warning is an unrelated legacy file in `/home/z/my-project/upload/VVU-Legacy-Dashboard/.../layout.tsx` — pre-existing, not touched by this task).
- `curl http://localhost:3000/` → **HTTP 200**; dev.log shows no new compile errors after file creation. The pre-existing "Module not found: ../panels/SettingsPanel" error in dev.log (from PanelRouter's dynamic import) is now resolved by this file existing.
- Confirmed `SettingsPanel` is a named export (matches the `.then((m) => m.SettingsPanel)` import in PanelRouter).

## Stage Summary — file produced
- **NEW**: `src/components/ive/panels/SettingsPanel.tsx` — 21st IVE panel, completes the panel catalog (all 20 → 21 surfaces). Settings persisted to localStorage `ive-settings-v1` via the canonical Zustand store; no server round-trips; full transparency view of the JSON in the footer.
