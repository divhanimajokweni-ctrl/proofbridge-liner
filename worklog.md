# VVU IVE — Evidence Analysis Workspace · Build Worklog

Project: Next.js 16 implementation of the VVU AIR KERNEL Evidence Analysis Workspace
for the NMBM (Nelson Mandela Bay Municipality) DWS (Department of Water and Sanitation)
domain-validation demonstration.

Source briefs (in /home/z/my-project/upload):
- 01a_ONE_PAGE_EXECUTIVE_BRIEF.md
- 01b_TECHNICAL_DEMONSTRATION_BRIEF.md
- 02a_HYDRAULIC_OBSERVABILITY_MODEL_HOM.md
- 02c_EVIDENCE_INDEPENDENCE_SPEC_EIS_v1.md
- 03a_VRES_v1_INVENTORY.md
- 04a_WATER_INFRASTRUCTURE_EVIDENCE_LEAKAGE_VALIDATION_BRIEF.md
- 08-NMBM-DATA-SANDBOX-SPECIFICATION.md
- 10-72-HOUR-VALIDATION-PROTOCOL.md
- SEARM1 (3).html — visual reference for terminal aesthetic
- Pasted Content_1787791376431.txt — AIR KERNEL Evidence Console reference

---
Task ID: 0
Agent: orchestrator (main)
Task: Plan the build, set up worklog, reflect on UI/architecture.

Work Log:
- Read all 10 uploaded briefs to understand the engineering model
- Identified the visual target: dark observability dashboard, cyan #00d4ff / green #00ff88 / amber #ffb800 / red #ff4d4d, monospace font, terminal aesthetic (NOT indigo/blue)
- Mapped the 5 EIS evidence states: VALID, MISSING, ANOMALOUS, CORRELATED, INDEPENDENT, INSUFFICIENT
- Mapped the 5-Pass Validation Pipeline: Collect & Normalize → Physical Boundary Checks → MNF Baseline → EIS Independence → Evidence Log Export
- Mapped the 10-step Hydraulic Incident Replay from 04a brief
- Mapped the DMA calibration parameters: flowDeviationThreshold (1-50%), pressureDropThreshold (1-30%), correlationTimeWindowMs (1-1440 min)

Architecture decisions:
- Single route `/` (per project constraint)
- All EIS logic in src/lib/evidence/ (TypeScript, deterministic, server-side)
- API: POST /api/evidence/compute returns EIS verdict + audit receipt hash
- UI: terminal-themed dark dashboard built with shadcn/ui primitives + custom CSS variables for cyan/green/amber
- Sticky footer with SIMULATION data label (per Zero Fabrication Mandate)
- 11-field provenance spine per observation
- 10-step interactive replay (Play/Pause/Step/Reset controls)
- DMA calibration sliders that re-evaluate EIS in real time (useMemo)
- Audit export as JSON download with SHA-256 hash

Stage Summary:
- Build plan locked. Proceeding to implement EIS engine, audit serializer, scenario data, API, UI components, and main page in sequence. Lint + agent-browser verification at end.

---
Task ID: 1
Agent: orchestrator (main)
Task: Build the complete VVU AIR KERNEL Evidence Analysis Workspace — EIS engine, audit serializer, scenario data, API routes, terminal-themed UI, and end-to-end browser verification.

Work Log:
- Built EIS v1.0 engine (src/lib/evidence/EISv1Engine.ts): quality gate, anomaly detection, independence classification, scoring formula (PRIMARY 0.3 + CORRELATED 0.2 + INDEPENDENT 0.5 cap), false-positive rejection rule (PRIMARY + pump_context → REJECTED)
- Built Audit Serializer (src/lib/evidence/AuditSerializer.ts): SHA-256 Web Crypto, 11-field provenance spine per observation, deterministic canonical body (timestamp excluded from hash to guarantee reproducibility per 02c spec)
- Built hydraulic scenario (src/lib/evidence/hydraulicScenario.ts): DMA-7 SCADA table, MNF baselines (97.0 L/s flow, 48.6 m pressure), 5 observations (flow + pressure + field + acoustic + context), 10-step replay sequence per 04a brief
- Built 2 API routes:
  - POST /api/evidence/compute — returns verdict + pipeline + observations + audit hash
  - POST /api/evidence/audit — returns full audit receipt JSON with Content-Disposition attachment header
- Built main page (src/app/page.tsx): terminal-themed dark dashboard with 8 panels — Header, Replay Timeline (10 steps), Control Bar (Play/Pause/Step/Reset + pump sim toggle + export), 5-Pass Pipeline, EIS Trust Gauge, Corroborating Evidence, SCADA Telemetry, Audit Receipt, Provenance Chain (11-field), Data Classification
- Added kernel-theme CSS variables (cyan #00d4ff, green #00ff88, amber #ffb800, red #ff4d4d) — NOT indigo/blue
- Fixed engine bug: PRIMARY observation was being classified as CORRELATED with itself (now matched by sensorId + timestamp identity)
- Fixed pressure baseline (48.5 → 48.6 m) so 5.14% drop at 04:00 exceeds the 5% threshold
- Fixed pump sim: when pumpStateChanged=true, context observation becomes measurementType=PUMP_STATUS so the false-positive rule fires
- Fixed timeline: BASELINE step (id 1) was being excluded — now all 10 steps render and initial state shows BASELINE (score 0.00)
- Fixed deterministic hashing: removed generatedAtUtc from canonical body so same input → same hash
- Updated layout metadata title + next.config allowedDevOrigins to suppress cross-origin dev warning

Verification Results (Agent Browser + VLM):
- Lint: 0 errors, 0 warnings ✓
- Dev server: all routes 200, no runtime errors ✓
- Page renders dark terminal theme (cyan/green/amber, NOT indigo/blue) ✓
- All 8 panels visible and properly aligned in 3-column desktop layout ✓
- Mobile responsive: collapses to single column at 390px, no horizontal overflow ✓
- Sticky footer present with SIMULATION data classification label ✓
- 10-step replay verdict transitions verified:
  - Step 1 BASELINE: score 0.00, INSUFFICIENT_EVIDENCE ✓
  - Step 2 ANOMALY: score 0.50, INSUFFICIENT_EVIDENCE (PRIMARY + CORRELATED only) ✓
  - Step 7 INDEPENDENCE: score 1.00, VERIFIED_CANDIDATE (PRIMARY + CORRELATED + 2 INDEPENDENT + CONTEXTUAL) ✓
- Pump sim toggle: REJECTED_FALSE_POSITIVE with correct reason ✓
- Audit receipt: deterministic hash (same input → same hash), different inputs → different hashes, all 11 provenance fields present ✓
- VLM screenshot verification: all 4 verification points PASS (verdict red, reason mentions pump, pass 4 fail, evidence red alert)

Stage Summary:
- Complete VVU AIR KERNEL Evidence Analysis Workspace implemented and verified end-to-end.
- All engineering rules from 02c EIS spec enforced: zero fabrication, independence scoring prevents evidence inflation, false-positive rejection on pump context, 100% deterministic reproducibility.
- Audit receipt exports as SHA-256 hashed JSON with 11-field provenance per observation — auditable to municipal engineering standard.
- The system correctly demonstrates the core EIS principle: "5 sensors agree ≠ 5 independent proofs" — even with flow + pressure anomaly, refuses to verify without independent corroboration from field + acoustic sources.
