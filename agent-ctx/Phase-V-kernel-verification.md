# Phase-V: Kernel Verification Section Component

## Task Summary
Created the `KernelVerificationSection` component at `/home/z/my-project/src/components/epistemic/kernel-verification.tsx` and integrated it into the page navigation.

## Files Created
- `/home/z/my-project/src/components/epistemic/kernel-verification.tsx` — New section component (770 lines)

## Files Modified
- `/home/z/my-project/src/app/page.tsx` — Added "kernel" section to SectionId type, SECTIONS array, SECTION_META, lazy import, and SECTION_COMPONENTS
- `/home/z/my-project/src/lib/kernel/runtime.ts` — Fixed MMR verification assertion to handle empty MMR (avoided `Invalid leaf index: 0` error when no facts exist)

## Component Features
1. **Fetches from /api/kernel on mount** — Uses inline `useEffect` pattern consistent with project conventions
2. **Kernel verification status banner** — Shows VERIFIED/DEGRADED status with green/red styling
3. **4 stat cards row** — Verification (12/12), MMR Root, Fact Count, Sequence number
4. **12 Assertions card** — Lists all pass/fail assertions with green checkmarks / red X
5. **4 Primitives card** — Fact, Proof, Policy, Projection with IMPLEMENTED status and descriptions
6. **Infrastructure card** — 12 items (Acceptance Pipeline, Schema Registry, Sequencer, MMR, RFC8785, SHA256, Ed25519, WORM, Replay, Policy Engine, Projection Engine, Redaction) with IMPLEMENTED status
7. **Constitution Rules card** — 7 rules with COMPLIANT status and icons
8. **Replay Verification card** — Button to run /api/kernel/verify, shows deterministic/non-deterministic verdict with all check results
9. **Submit Test Fact card** — Type selector (12 fact types), JSON body textarea, submit button that POSTs to /api/kernel, shows acceptance result
10. **Visual design** — Green checkmarks (verified), amber warnings (repairing), red failures (violating), consistent with project theme
11. **Animations** — framer-motion fadeIn, staggered children, spring animations matching existing section patterns

## Bug Fix
Fixed `src/lib/kernel/runtime.ts` line 284: MMR `getInclusionProof(0)` threw `Invalid leaf index: 0` when MMR was empty. Changed to check `this.mmr.size > 0` before calling `getInclusionProof()`.

## Lint Status
All lint errors in our files are resolved. Remaining 4 errors are pre-existing in `src/lib/epd/validator.ts`.

## API Verification
- `GET /api/kernel` → 200 OK (returns full kernel data with 12/12 assertions passing)
- `GET /api/kernel/verify` → 200 OK (returns deterministic replay verification)
- `POST /api/kernel` → 200 OK (accepts test fact submissions)
