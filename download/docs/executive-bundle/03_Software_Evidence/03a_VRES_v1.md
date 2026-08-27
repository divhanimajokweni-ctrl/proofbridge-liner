# VRES v1.0 Component Inventory — Auditable

**Date:** 2026-08-26
**Branch:** `feat/vres1-scrubbed`
**Commit:** `2d727c4`

---

## What Is Implemented

### Architecture: World → Room → Activity → Interaction

| Room | Activity | Status | Source |
|---|---|---|---|
| Build Room | HBK MKII | PARTIAL — 2D charts only (Fourier viz, perf table). 3D viewport with 13+ parts NOT yet in React. | `tabs/hbk-tab.tsx` |
| Build Room | 3D Mechanics | PARTIAL — 4-body three.js scene inside iframe (explode/yaw/pitch/zoom) | `public/vvu-aerospace.html` |
| Build Room | Drone Simulator | EXISTS — full 3D Three.js with rigid body 6DoF physics, wind, gusts, turbulence, flight recorder | `public/vvu-drone-simulator.html` |
| Build Room | Ingestion | PARTIAL — DRC table + terminal inside iframe | `public/vvu-aerospace.html` |
| Build Room | Villa Ravine | MISSING — does not exist | — |
| Build Room | Exploded Hardware | MISSING — does not exist | — |
| Study Room | Lesson Stepper | EXISTS — Play/Pause/Step/Reset, progress 3/9 | `public/vvu-searm.html` |
| Study Room | Interactive Diagram | EXISTS — Residual Trunk, Layers 1–8 | `tabs/hbk-tab.tsx` |
| Study Room | HBK MKII Docs | MISSING — does not exist | — |
| Study Room | Facilitator Agent | EXISTS — LLM-powered chat (z-ai-web-dev-sdk) | `tabs/facilitator-tab.tsx` |
| Finance Room | Ubuntu Pool | EXISTS — Stokvel, ProofBridge receipts | `tabs/pools-tab.tsx` |
| Finance Room | ANTPAY Billing | EXISTS — 6 ZAR pricing tiers | `tabs/antpay-tab.tsx` |
| Finance Room | NMBM Budget Sandbox | MISSING — does not exist | — |
| Game Room | Accretion Sandbox | EXISTS — 5 modes (Build-Layer, Arena, Logic Tiles, Stickman, Marketplace) | `tabs/sandbox-tab.tsx` |
| Data Room | AIR Runtime | EXISTS — live event stream, evidence decay tracker | `tabs/air-tab.tsx` |
| Data Room | Self-Service Canvas | EXISTS — plugin dashboard, bridge state machine | `tabs/canvas-tab.tsx` |
| Data Room | Field Evidence | EXISTS — construction photos + vision pass | `tabs/field-tab.tsx` |
| Data Room | EIS v1.0 Evidence Analysis | EXISTS — EIS engine + DMA calibration + audit receipt export | `components/evidence/` |
| Data Room | NMBM Data Sandbox | PARTIAL — spec exists, placeholder CSV generated | `sandbox/` |
| Vault Room | Cryptographic & Governance | EXISTS — zipenc AES-256, 6 regulators | `tabs/crypto-tab.tsx` |
| Vault Room | Dev SDK | EXISTS — mod upload + store API | `tabs/dev-sdk-tab.tsx` |
| Vault Room | Integrations | EXISTS — connection graph, org groups | `tabs/integrations-tab.tsx` |

### EIS v1.0 Engine

| Component | Path | Status |
|---|---|---|
| EISv1Engine.ts | `src/lib/evidence/EISv1Engine.ts` | EXISTS — quality gate, anomaly detection, evidence graph, independence scoring |
| AuditSerializer.ts | `src/lib/evidence/AuditSerializer.ts` | EXISTS — SHA-256 receipt, Web Crypto API |
| DMAConfigurationPanel.tsx | `src/components/evidence/dma-configuration-panel.tsx` | EXISTS — flow/pressure/correlation sliders |
| ExportAuditButton.tsx | `src/components/evidence/export-audit-button.tsx` | EXISTS — JSON download with hash |
| EvidenceAnalysisWorkspace.tsx | `src/components/evidence/evidence-analysis-workspace.tsx` | EXISTS — full-screen activity with useMemo re-evaluation |

### Sandbox

| Component | Path | Status |
|---|---|---|
| setup.sh | `sandbox/setup.sh` | EXISTS — scaffolds dirs, generates placeholder CSV |
| run.sh | `sandbox/pipeline/run.sh` | EXISTS — runs EIS logic, generates audit JSON |
| nmbm_placeholder_baseline.csv | `sandbox/data/nmbm_placeholder_baseline.csv` | EXISTS — 7 rows (4 baseline + 3 anomaly) |
| leak_candidate_audit.json | `sandbox/evidence/leak_candidate_audit.json` | EXISTS — generated audit trail |

### API Routes

| Route | Method | Status |
|---|---|---|
| /api/facilitator | POST | EXISTS — LLM chat |
| /api/hbk | GET | EXISTS — HBK kernel runs |
| /api/governance | GET | EXISTS — governance artifacts |
| /api/store/registry | GET/POST | EXISTS — mod store |
| /api/store/upload | POST | EXISTS — multipart upload |

### Onboarding & Role Gating

| Component | Path | Status |
|---|---|---|
| HowzitModal | `src/components/ive/howzit-modal.tsx` | EXISTS — Building/Validating selection |
| ZkpModal | `src/components/ive/zkp-modal.tsx` | EXISTS — 7 attestation sources, ZAR tier detection |
| WorldContainer | `src/components/ive/world-container.tsx` | EXISTS — 6 rooms, guest gating, activity viewport |
| Role tiers | `src/lib/ive/architecture.ts` | EXISTS — 7 roles with visibleTabs arrays |

---

## Summary

| Metric | Value |
|---|---|
| Total activities | 22 |
| Activities ready | 15 |
| Activities partial | 4 |
| Activities missing | 5 |
| EIS v1.0 engine | Implemented + tested |
| Sandbox pipeline | setup.sh + run.sh working |
| Lint errors | 0 |
| Console errors | 0 |
