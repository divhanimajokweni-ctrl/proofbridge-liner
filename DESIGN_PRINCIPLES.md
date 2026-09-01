# VVU Design Principles — LOCKED

> **The base viewport remains visually unchanged. New functionality appears only when the user asks for it.**

This is the single most important rule for this project. It is a **regression criterion**, not a suggestion.

---

## The Rule

If an upgrade makes the default viewport look materially busier, **the upgrade fails**.

The current aesthetic — dark 3D terrain as hero, minimal HUD, negative space — is worth protecting. The goal is not "fit more information onto the screen." The goal is "expose more capability without making the screen look busier."

## What You Must NOT Do

| ❌ Don't | Why |
|---------|-----|
| Add a permanent HUD element | The HUD is already at its final size |
| Add a permanent sidebar | Sidebars eat the terrain's negative space |
| Add extra cards to the default view | Cards fragment the visual field |
| Add labels everywhere | Labels are noise; the terrain is the signal |
| Add a giant mobile toolbar | Mobile toolbars steal half the viewport |
| Replace the existing navigation | The nav works; changing it = regression |
| Shrink the terrain to accommodate controls | The terrain IS the product |

## What You SHOULD Do

| ✅ Do | How |
|-------|-----|
| Default state = clean terrain | Exactly what exists now: boot → terrain → nav |
| Tap a node → contextual panel appears | Only when the user asks for it |
| Dismiss the panel → clean screen returns | The panel is temporary, not permanent |
| "Water" overlay takes over the viewport | The overlay IS the workspace, not an addition |
| "B2B" overlay same principle | Temporary full-screen workspace |
| Mobile = contextual, not squeezed | Idle → tap → controls → dismiss → idle |

## Contextual Interaction Model

```
IDLE (clean terrain)
  ↓ user taps a pipe node
SELECTED (node detail panel appears)
  ↓ user takes an action
ACTIVATED (action controls appear)
  ↓ user dismisses
IDLE (clean terrain again)
```

The user gets the full engineering depth **without carrying all of that information on the screen simultaneously**.

## Regression Test

Before merging ANY change, answer this question:

> "Does the default viewport (boot screen dismissed, no overlay open) look materially busier than the baseline screenshot at `docs/baseline-viewport.png`?"

If the answer is **yes**, the change is blocked. Fix it or don't merge it.

---

## Build Sequence (Locked Order)

This sequence must be followed in order. Each step must pass the regression test above before moving to the next.

1. **BASELINE** — Capture current default viewport state as the regression baseline
2. **Existing functionality test** — Audit what works vs what's broken right now
3. **Fix existing regressions ONLY** — Repair what's broken. Do NOT add new features.
4. **Mobile interaction layer** — Contextual tap/select/dismiss (not permanent toolbars)
5. **Utility network** — Pipe nodes on the terrain (visible only when relevant)
6. **EPANET tank state** — Tank pressure/flow data (contextual panel, not permanent)
7. **Leak-node interaction** — Tap a pipe → activate leak simulation (contextual)
8. **Moisture simulation** — Ground moisture overlay (toggleable, not default)
9. **Demolish/Rebuild** — Terrain modification tool (action-only, not idle)
10. **Snapshot export** — Export current state (button in existing nav, not new panel)
11. **B2B overlay** — Commercial view (temporary workspace, like existing overlays)
12. **Desktop + smartphone regression test** — Verify the default viewport is unchanged

---

*This document is the source of truth for visual design decisions. Any conflict between a feature request and this document → this document wins.*
