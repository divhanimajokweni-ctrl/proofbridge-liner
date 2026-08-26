# VRES v1.0 Structural Migration — Component/Route/Activity Inventory

**Date:** 2026-08-25
**Branch:** `feat/vres1-scrubbed`
**Starting commit:** `c948cfc`
**Phase:** 0 + 1 (Audit + Architecture Mapping)

---

## PHASE 1A CORRECTION: "LANDSCAPE" IS NOT A PAGE

**Current state:** `"Landscape"` is a `useState` label in `src/app/page.tsx`:
```ts
const [environment, setEnvironment] = useState<"portrait" | "landscape">("portrait");
```

It does NOT:
1. Change browser/page orientation ❌
2. Render a separate page ❌
3. Mount a separate workspace ❌
4. Change viewport ownership ❌
5. Provide independent routing ❌
6. Provide a full-screen working environment ❌
7. Have its own World/Room hierarchy ❌

**Documented as:** "Landscape is a dashboard label/state, not a true landscape page."

The existing dashboard is SOURCE MATERIAL, not the target architecture.

---

## INVENTORY: Existing Components → Target Mapping

### Dashboard Shell

| Existing Component | Path | Current Purpose | Route/Tab | Reusable? | Target Room | Target Activity | Missing Capability |
|---|---|---|---|---|---|---|---|
| `IveHeader` | `src/components/ive/ive-header.tsx` | Tab navigation bar (16 tabs) | All tabs | ✅ (navigation preserved as room switcher) | World → Room nav | — | Needs World/Room routing |
| `IveFooter` | `src/components/ive/ive-footer.tsx` | Status indicators | All | ✅ | World footer | — | — |
| `ParticleField` | `src/components/ive/particle-field.tsx` | Ambient background | All | ✅ | World backdrop | — | — |
| `HoloSigil` | `src/components/ive/holo-sigil.tsx` | Logo/brand | Header | ✅ | World brand | — | — |

### Portrait View (Home Base)

| Existing Component | Path | Current Purpose | Reusable? | Target Room | Target Activity | Missing |
|---|---|---|---|---|---|---|
| `PortraitView` | `src/components/ive/portrait-view.tsx` | Master Graph + widgets | ✅ | World landing | World overview | Needs spatial graph, not card grid |
| `HowzitModal` | `src/components/ive/howzit-modal.tsx` | Onboarding (Building/Validating) | ✅ | World entry | — | — |
| `ZkpModal` | `src/components/ive/zkp-modal.tsx` | ZKP role verification | ✅ | World → Room gate | Participation gate | — |

### Tab Components (16 total → mapped to Rooms)

| Tab | Path | Current Purpose | Reusable? | Target Room | Target Activity | Missing |
|---|---|---|---|---|---|---|
| `OverviewTab` | `tabs/overview-tab.tsx` | KPIs, watchdog gates, AIR feed | ✅ | World overview | — | — |
| `HbkTab` | `tabs/hbk-tab.tsx` | Fourier viz, perf table | ⚠️ partial | **BUILD ROOM** | HBK MKII | **No 3D viewport** — only 2D charts/tables. Missing: 13+ parts, explode, section, wireframe, data path, auto-orbit, part selection, annotation panel |
| `FacilitatorTab` | `tabs/facilitator-tab.tsx` | LLM chat | ✅ | **STUDY ROOM** | Facilitator Agent | — |
| `IntegrationTab` | `tabs/integration-tab.tsx` | CAD/GIS/V-model/AHP | ✅ | **BUILD ROOM** | Agnostic Integration | — |
| `AirTab` | `tabs/air-tab.tsx` | Live event stream, evidence decay | ✅ | **DATA ROOM** | AIR Runtime | — |
| `CryptoTab` | `tabs/crypto-tab.tsx` | zipenc, governance artifacts | ✅ | **VAULT ROOM** | Mint/Export | — |
| `SandboxTab` | `tabs/sandbox-tab.tsx` | 5 modes (Build/Arena/Logic/Stickman/Marketplace) | ✅ | **GAME ROOM** | Accretion Sandbox | — |
| `CanvasTab` | `tabs/canvas-tab.tsx` | Plugin dashboard, bridge state machine | ✅ | **DATA ROOM** | Self-Service Canvas | — |
| `AerospaceTab` | `tabs/aerospace-tab.tsx` | WebGL 3D iframe (three.js) | ⚠️ iframe | **BUILD ROOM** | 3D Mechanics | Contains DRC table + terminal INSIDE iframe HTML, not in React. Needs extraction. |
| `SearmTab` | `tabs/searm-tab.tsx` | Claim Builder iframe | ✅ | **STUDY ROOM** | SEARM | — |
| `FieldTab` | `tabs/field-tab.tsx` | Construction photos + vision pass | ✅ | **DATA ROOM** | Field Evidence | — |
| `DevSdkTab` | `tabs/dev-sdk-tab.tsx` | Mod upload form + store API | ✅ | **VAULT ROOM** | Dev SDK | — |
| `StudioTab` | `tabs/studio-tab.tsx` | 6 worksheet selectors + SVG graphs | ⚠️ partial | **BUILD/STUDY** | Studio Worksheets | Worksheets are selectors, not working viewports |
| `AntpayTab` | `tabs/antpay-tab.tsx` | ZAR pricing, wallet flow | ✅ | **FINANCE ROOM** | ANTPAY Billing | — |
| `PoolsTab` | `tabs/pools-tab.tsx` | Stokvel, ProofBridge receipts | ✅ | **FINANCE ROOM** | Ubuntu Pools | — |
| `IntegrationsTab` | `tabs/integrations-tab.tsx` | Connection graph, org groups | ✅ | World overview | Integrations | — |

### 3D / WebGL Components

| Component | Path | Technology | Reusable? | Target | Missing |
|---|---|---|---|---|---|
| Aerospace iframe | `public/vvu-aerospace.html` | three.js r128, true WebGL 3D | ✅ (extract from iframe) | BUILD ROOM → 3D Mechanics | Trapped in iframe — needs React three.js component |
| Logic Tiles iframe | `public/vvu-logic-tiles.html` | Canvas 2D | ✅ | GAME ROOM → Logic Tiles | — |
| Stickman iframes | `public/vvu-stickman-*.html` | Canvas 2D | ✅ | GAME ROOM → Stickman | — |
| AntonVVU | `src/components/ive/anton-vvu.tsx` | Canvas 2D | ✅ | GAME ROOM → AntonVVU | — |
| AntonGame | `src/components/ive/anton-game.tsx` | Canvas 2D | ✅ | GAME ROOM → AntonGame | — |
| `HoloSigil` | `src/components/ive/holo-sigil.tsx` | CSS animation | ✅ | World brand | — |

### HBK MKII — Critical Gap Analysis

**Current state:** `HbkTab` contains 2D charts (Fourier basis SVG, performance table, architecture cards). There is NO 3D HBK MKII implementation in React.

The Aerospace iframe (`vvu-aerospace.html`) contains a three.js scene with 4 bodies (base plate, battery pack, aerogel jacket, ASI sensor) — but this is NOT HBK MKII. It's a generic 4-body assembly demo.

**Missing for HBK MKII acceptance (Phase 6):**
1. ❌ 13+ physical parts (currently 0 in React, 4 in iframe)
2. ❌ LGA array
3. ❌ Capacitors
4. ❌ Battery pack (exists in iframe, not in React)
5. ❌ Base plate (exists in iframe, not in React)
6. ❌ Explode slider 0–100 (exists in iframe, not in React)
7. ❌ Section control (half/full)
8. ❌ Grid toggle
9. ❌ Wireframe toggle
10. ❌ Data Path animation
11. ❌ Auto-orbit (exists in iframe, not in React)
12. ❌ Rotate/zoom (exists in iframe, not in React)
13. ❌ Part selection
14. ❌ ESC unlock
15. ❌ Annotation panel
16. ❌ Photo input
17. ❌ Schematic ingestion
18. ❌ PARTS adaptation
19. ❌ DRC table (exists in iframe HTML, not in React)
20. ❌ Terminal (exists in iframe HTML, not in React)
21. ❌ Status: SYSTEM NOMINAL
22. ❌ Comprehension transition
23. ❌ 3D kinematics transition

### Role Gating

| Component | Path | Current Implementation | Reusable? |
|---|---|---|---|
| `ROLE_TIERS` | `src/lib/ive/architecture.ts` | 7 roles with `visibleTabs` arrays | ✅ |
| Role state | `src/app/page.tsx` | `useState<UserRole>("guest")` | ✅ (move to World state) |
| ZKP flow | `src/components/ive/zkp-modal.tsx` | Modal with 7 attestation sources | ✅ |

### Data Layer

| File | Path | Content | Reusable? |
|---|---|---|---|
| `data.ts` | `src/lib/ive/data.ts` | KPIs, watchdog gates, integration sources, V-model, AHP, evidence, AIR events, crypto stages, governance artifacts, HBK runs | ✅ |
| `architecture.ts` | `src/lib/ive/architecture.ts` | Pricing tiers, pools, integrations, ZKP sources, role tiers, studio worksheets, ribbon, master graph nodes | ✅ |

### API Routes

| Route | Path | Purpose | Reusable? |
|---|---|---|---|
| `POST /api/facilitator` | `src/app/api/facilitator/route.ts` | LLM chat | ✅ |
| `GET /api/hbk` | `src/app/api/hbk/route.ts` | HBK run table | ✅ |
| `GET /api/governance` | `src/app/api/governance/route.ts` | Governance artifacts | ✅ |
| `GET/POST /api/store/registry` | `src/app/api/store/registry/route.ts` | Mod store | ✅ |
| `POST /api/store/upload` | `src/app/api/store/upload/route.ts` | Mod upload | ✅ |

---

## WHAT DOES NOT EXIST (honest gaps)

1. ❌ **No World container** — no spatial runtime, no viewport transition
2. ❌ **No Room container** — no reusable working-viewport component
3. ❌ **No Activity registry** — tabs are not activities with viewport ownership
4. ❌ **No HBK MKII 3D implementation** — only 2D charts in React, 4-body demo in iframe
5. ❌ **No Villa Ravine** — does not exist anywhere
6. ❌ **No Exploded Hardware** — does not exist anywhere
7. ❌ **No /sandbox directory** — not created
8. ❌ **No evidence pipeline** — `setup.sh` / `run.sh` do not exist
9. ❌ **No NMBM Data Sandbox** — does not exist
10. ❌ **No `vvu-dashboard/` directory** — the ProofBridge deployment system is a separate codebase, not present here
11. ❌ **No `lib/epistemic/` directory** — TrajectoryVerifier does not exist here
12. ❌ **No `src/server.ts`** — Hono API gateway is not in this repo
13. ❌ **No Sovereign Registry** — on-chain contracts are not in this repo

---

## TARGET ROOM → ACTIVITY MAPPING (proposed)

| Room | Source Tab(s) | Activity | Viewport Owner | Status |
|---|---|---|---|---|
| **BUILD** | `hbk-tab` + `aerospace-tab` (3D part) + `integration-tab` + `studio-tab` (worksheets 2-3) | HBK MKII 3D | Activity viewport | **REQUIRES NEW 3D IMPLEMENTATION** |
| **BUILD** | `aerospace-tab` (DRC part) | Ingestion | Activity viewport | Extract from iframe |
| **BUILD** | `aerospace-tab` (3D mechanics part) | 3D Mechanics | Activity viewport | Extract from iframe |
| **BUILD** | — | Villa Ravine | Activity viewport | **DOES NOT EXIST — must build** |
| **BUILD** | — | Exploded Hardware | Activity viewport | **DOES NOT EXIST — must build** |
| **STUDY** | `facilitator-tab` + `searm-tab` + `studio-tab` (worksheet 1) | Lesson Stepper | Activity viewport | Partial |
| **STUDY** | `hbk-tab` (Fourier viz part) | Interactive Diagram | Activity viewport | Reusable |
| **STUDY** | — | HBK MKII Docs | Activity viewport | **DOES NOT EXIST — must build** |
| **FINANCE** | `antpay-tab` + `pools-tab` | Ubuntu Pool | Activity viewport | Reusable |
| **FINANCE** | `pools-tab` (ledger part) | Pool Ledger | Activity viewport | Reusable |
| **FINANCE** | — | NMBM Budget Sandbox | Activity viewport | **DOES NOT EXIST — must build** |
| **GAME** | `sandbox-tab` (all 5 modes) | Gaming Hub | Full-screen Activity | Reusable |
| **DATA** | `air-tab` + `canvas-tab` + `field-tab` | NMBM Data Sandbox | Activity viewport | Partial |
| **DATA** | `air-tab` (evidence part) | Evidence Pipeline | Activity viewport | Reusable |
| **VAULT** | `crypto-tab` + `devsdk-tab` | Mint / Export / Vault | Activity viewport | Reusable |

---

## SUMMARY

**Existing components:** 16 tab components, 6 shell/utility components, 2 data files, 5 API routes, 10 public HTML/image assets.

**Reusable as-is:** 14 of 16 tabs (mapped to Rooms without internal changes needed).

**Requires new implementation:**
- World container (spatial, not state toggle)
- Room container (viewport-owning)
- HBK MKII 3D (13+ parts, all interactions)
- Villa Ravine (does not exist)
- Exploded Hardware (does not exist)
- /sandbox directory + pipeline
- NMBM Data Sandbox
- HBK MKII Docs

**Requires extraction from iframe:**
- DRC table (from `vvu-aerospace.html`)
- Terminal (from `vvu-aerospace.html`)
- 3D mechanics controls (from `vvu-aerospace.html`)

**NOT in this repository (separate codebase):**
- `vvu-dashboard/` (React Flow DAG dashboard)
- `lib/epistemic/` (TrajectoryVerifier)
- `src/server.ts` (Hono API)
- Sovereign Registry contracts
- Deploy production script
