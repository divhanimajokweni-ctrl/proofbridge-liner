# Task 4 · Study Room Agent · Work Record

## Task
Build the **STUDY ROOM** for the VVU IVE — a self-contained Next.js 16 component exposing 3 learning activities (Facilitator Agent, Lesson Stepper, Residual Trunk) wired to a backend LLM endpoint.

## Files Created
1. `src/app/api/facilitator/route.ts` — POST endpoint using z-ai-web-dev-sdk (glm-4-flash, runtime='nodejs')
2. `src/components/ive/study-room/facilitator-agent.tsx` — chat UI with suggested chips, typing indicator, auto-scroll
3. `src/components/ive/study-room/lesson-stepper.tsx` — 9-step interactive lesson with Play/Pause/Step/Reset
4. `src/components/ive/study-room/residual-trunk.tsx` — 8-layer expandable engineering-chain diagram
5. `src/components/ive/rooms/study-room.tsx` — router component (grid ↔ full-screen activity)

## Key Decisions
- **Facilitator API**: System prompt is prepended server-side (not client) to keep the prompt out of the visible transcript and prevent client-side tampering. Sanitises messages to last 24 turns, caps content at 4000 chars. Returns `{ content, model, classification }`. If LLM throws, returns a 200 with an offline-message content so the UI degrades gracefully instead of erroring.
- **Lesson Stepper**: 9 lessons hardcoded as a `Lesson[]` array (title + body + takeaway + duration). Initial state per DWS 03a is `currentStep=4` (3/9 done). Auto-advance runs every 4s via `setTimeout`; the effect is purely a timer scheduler (no synchronous `setState` in the body — fixed the `react-hooks/set-state-in-effect` lint rule). The "stop playing at end" logic lives inside the timer callback (`advance()`) and `togglePlay()` handles the replay-from-step-1 case.
- **Residual Trunk**: 8 layers rendered as expandable `<button>` cards connected by a vertical gradient line (cyan → amber → dim). Layer 5 expanded by default to show the inputs/outputs/artifact detail format. Status colors: layers 1-5 green (IMPLEMENTED), 6-7 amber (PARTIAL), 8 dim (FUTURE) — matches the build state documented in 03a.
- **Router**: Follows the build-room.tsx pattern — `useState(selectedId)` toggles between grid view and full-screen activity view. Each card carries meta badges (MODEL/STATUS, STEPS/DONE, LAYERS/IMPL) and the Facilitator Agent is marked PRIORITY.

## Verification Results
- **Lint**: `bun run lint` → 0 errors, 0 warnings ✓
- **Page compile**: GET / 200, no compile errors ✓
- **Facilitator API** (`POST /api/facilitator`): 200 OK, returned valid EIS content: `"EIS v1.0 is the Evidence Independence Scoring system that prevents evidence inflation by classifying observations into VALID, MISSING, ANOMALOUS, CORRELATED, or INDEPENDENT. The score is calculated as PRIMARY(0.3) + CORRELATED(0.2) + INDEPENDENT(0.4), with a threshold of 0.8."` ✓
- **Facilitator chat end-to-end**: welcome msg → click "What is EIS v1.0?" chip → user bubble right-aligned cyan + assistant bubble left-aligned with dim bg appear, transcript shows the LLM reply ✓
- **Lesson Stepper**: 9 lessons rendered, lessons 1-3 marked DONE, 4 marked LIVE, 5-9 upcoming. Play button → status flips to PLAYING; after 5s step advanced from 4 → 6 (67% progress) ✓
- **Residual Trunk**: 8 layer cards rendered with correct status indicators (1-5 IMPLEMENTED green check, 6-7 PARTIAL amber warning, 8 FUTURE dim boxes icon). Layer 5 expanded by default showing full description + inputs/outputs + artifact name. Click layer 1 → expands showing inputs/outputs/artifact. ✓
- **Kernel-theme aesthetic**: confirmed via computed styles — bg = `rgb(6, 10, 16)`, `--k-cyan-bright = #00d4ff`, `--k-green-bright = #0f8`, k-grid-bg applied (NOT indigo/blue) ✓
- **Mobile (412×915)**: no horizontal overflow; lesson step list collapses to horizontal scroller at mobile width; facilitator chips wrap; residual trunk layer cards stack single-column ✓
- **Browser console**: no errors (only Fast Refresh + React DevTools logs) ✓
- **Original page.tsx**: backed up to `/tmp/page.tsx.backup` before verification, restored after — original EIS WORKSPACE + HBK LOCALIZATION view intact ✓

## Stage Summary
The Study Room is the fourth room in the VVU IVE and the first to integrate an LLM (z-ai-web-dev-sdk · glm-4-flash) for domain Q&A. The Facilitator Agent is the priority activity: it answers technical questions about EIS v1.0, HBK, HOM, the 72h protocol, and the Zero Fabrication Mandate, with the system prompt encoded verbatim per the task spec. The Lesson Stepper provides the structured 9-step curriculum (3/9 done per 03a) with full Play/Pause/Step/Reset controls. The Residual Trunk visualises the 8-layer engineering chain from municipal water network → auditable evidence record, with each layer expandable to reveal its inputs/outputs/artifact. All 5 files use the kernel-theme dark aesthetic, are responsive, and lint clean.
