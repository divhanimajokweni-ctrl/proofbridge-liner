# Task ID: 3 — Trust Passport Component

## Agent: main

## Summary
Created the Trust Passport component for the VVU platform — a dark-themed visualization showing the user's trust maturity across all capabilities.

## File Created
- `/src/components/vvu/trust-passport.tsx`

## Component Architecture

### Exports
1. **`TrustPassport`** — Full-page visualization
2. **`TrustPassportMini`** — Compact version for right dock

### Internal Components
1. **`TrustScoreCircle`** — SVG circular gauge (0-100) with animated arc
2. **`TrustScoreMiniCircle`** — 56px compact version
3. **`MaturityTimeline`** — 7-stage horizontal timeline with glow effects
4. **`CapabilityEntryCard`** — Per-capability entry with progress bar
5. **`ThreeRootStatus`** — History/Semantic/Trust root status indicators

### Data Flow
- `useWorkspaceStore` → `trustPassport` → `buildPassportEntry()` → `TrustPassportEntry[]`
- `calculateOverallMaturity()` and `calculateTrustScore()` from three-roots.ts
- `CAPABILITIES` and `CAPABILITY_MAP` from capability-registry.ts

### Styling
- Dark background (#0a0a0f)
- Glassmorphism (backdrop-blur-xl, bg-white/[0.03], border-white/[0.06])
- Emerald primary (#10b981), Amber accent (#C9A84C)
- Font-mono for labels and numbers
- Framer Motion animations with staggered delays

## Decisions
- Replaced `Certificate` icon (not in lucide-react) with `Award`
- Used deterministic seed for event/attestation counts (not Math.random)
- Maturity derived from progress ratio thresholds
- Background glow color matches current maturity stage
