# VVU·IVE Mobile UI — Command Palette / Gesture Spec

Target: `release/beta-v1.0-real`

## Mobile layout

Mobile is an icon-first interaction surface rather than a compressed desktop status rail.

Persistent controls:
- Data / runtime
- Evidence / EIS
- Proof graph
- Shadow mode
- Release / pass state
- Command palette

Keep labels and secondary metrics out of the persistent rail. Labels and detailed values are revealed contextually.

## Gestures

- Tap: open subsystem
- Long press: reveal label/value
- Swipe left/right: move between primary subsystems
- Swipe up: open command palette
- Swipe down: dismiss palette / return
- Pinch: zoom sphere/graph

## Command palette

The command palette owns the file legend and secondary navigation.

Sections:
- Search VVU·IVE
- Recent artifacts
- Files: Evidence, Contracts, CAD, Verification, Releases
- Commands: Verify, Inspect, Compare, Repair, Export, Shadow Mode

## Interaction rule

Primary state remains visible. File names, verbose legends, and diagnostic metrics are discoverable on demand.

## Implementation note

The existing VVU·IVE source already includes a reusable command component at:
`apps/ive/src/components/ui/command.tsx`

The mobile behavior should be implemented as a responsive interaction layer without changing the underlying evidence, authorization, proof, or release state model.
