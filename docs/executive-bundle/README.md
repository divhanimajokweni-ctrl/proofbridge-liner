# VVU IVE — Executive Documentation Bundle for DWS

**Date:** 2026-08-26
**Classification:** SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA
**Repository:** github.com/divhanimajokweni-ctrl/proofbridge-liner
**Branch:** feat/vvu-gov-deploy
**Custom Domain:** vvu-gov.space-z.ai

---

## Purpose

This bundle contains the complete executive documentation for the **VVU IVE**
(Verifiable Verification Unit — Independent Verification Engine), an
evidence-verification layer for municipal water infrastructure. It is presented
for review by the **Department of Water and Sanitation (DWS)** in advance of a
domain-validation engagement with the Nelson Mandela Bay Municipality (NMBM).

The VVU IVE is built on:
- **Next.js 16** application runtime (governed deployment on `vvu-gov.space-z.ai`)
- **EIS v1.0** (Evidence Independence Specification) — prevents evidence
  inflation by scoring source independence
- **HBK Bayesian Localization** — probabilistic localization of candidate
  leak zones from sparse hydraulic observations
- **Zero Fabrication Mandate** — the system never asserts a conclusion it
  cannot trace back to a specific observation

---

## Document Index (10 Documents + This README)

| # | Folder | File | Description |
|---|---|---|---|
| 01a | `01_Executive/` | `01a_one_page_executive_brief.md` | One-page executive summary — the entire pitch on a single page |
| 01b | `01_Executive/` | `01b_technical_demonstration_brief.md` | Technical demonstration walkthrough for the DWS meeting |
| 02a | `02_Scientific/` | `02a_HOM.md` | Hydraulic Observability Model — what sparse sensors can and cannot see |
| 02b | `02_Scientific/` | `02b_sparse_sensor_hypothesis.md` | Engineering hypothesis bounding what HOM claims (and what it explicitly disclaims) |
| 02c | `02_Scientific/` | `02c_EIS_v1.md` | Evidence Independence Specification v1.0 — the formal scoring model |
| 02d | `02_Scientific/` | `02d_architecture_figure.md` | System architecture: World → Room → Activity → Interaction + evidence pipeline |
| 03a | `03_Software_Evidence/` | `03a_VRES_v1.md` | VRES v1 Inventory — Verifiable Runtime Evidence Stack |
| 03b | `03_Software_Evidence/` | `03b_repository_verification.md` | Repository verification report — build, lint, routes, custom domain |
| 04a | `04_Water_Demo/` | `04a_leakage_validation_brief.md` | Water infrastructure leakage validation brief |
| 04b | `04_Water_Demo/` | `04b_NMBM_sandbox_spec.md` | NMBM Data Sandbox Specification |
| 04c | `04_Water_Demo/` | `04c_hydraulic_incident_replay.md` | 10-step hydraulic incident replay script (simulation data) |
| 05a | `05_Pilot/` | `05a_72h_protocol.md` | 72-hour validation protocol |
| 05b | `05_Pilot/` | `05b_data_requirements.md` | Data requirements for DWS validation — fields, success criteria |

> **Count:** 13 markdown files total — 10 substantive documents +
> `02d_architecture_figure.md` (a markdown figure, not a PNG) +
> `03b_repository_verification.md` + this `README.md` index.

---

## Folder Structure

```
docs/executive-bundle/
├── README.md                       ← you are here
├── 01_Executive/                   ← exec audience
│   ├── 01a_one_page_executive_brief.md
│   └── 01b_technical_demonstration_brief.md
├── 02_Scientific/                  ← scientific foundation
│   ├── 02a_HOM.md
│   ├── 02b_sparse_sensor_hypothesis.md
│   ├── 02c_EIS_v1.md
│   └── 02d_architecture_figure.md
├── 03_Software_Evidence/           ← software proof
│   ├── 03a_VRES_v1.md
│   └── 03b_repository_verification.md
├── 04_Water_Demo/                  ← water-domain demonstration
│   ├── 04a_leakage_validation_brief.md
│   ├── 04b_NMBM_sandbox_spec.md
│   └── 04c_hydraulic_incident_replay.md
└── 05_Pilot/                       ← pilot / validation path
    ├── 05a_72h_protocol.md
    └── 05b_data_requirements.md
```

---

## How to Run the System

The governed deployment lives at **https://vvu-gov.space-z.ai**.
To reproduce locally:

```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner
git checkout feat/vvu-gov-deploy
bun install
bun run dev
# → http://localhost:3000
```

Requirements:
- **Node.js 20+** (or Bun runtime)
- **bun** package manager
- Internet access to GitHub (to clone the governed branch)

Verified at last commit on `feat/vvu-gov-deploy`:
- ✅ Next.js 16 compiles
- ✅ Lint: 0 errors, 0 warnings
- ✅ Console errors: 0
- ✅ All routes return 200

---

## How to Run the Sandbox Pipeline

The sandbox pipeline produces a deterministic audit artifact that can be
inspected end-to-end by DWS engineers.

```bash
cd /sandbox
./setup.sh            # provisions the sandbox environment
cd pipeline
./run.sh              # executes the 5-pass validation pipeline
# → /evidence/leak_candidate_audit.json
```

The 5-pass pipeline:
1. **Collect & Normalize** — ingest SCADA + sensor + field reports
2. **Physical Boundary Checks** — reject impossible readings (e.g. negative flow)
3. **MNF Baseline** — compute Minimum Night Flow baseline per DMA (02:00-04:00)
4. **EIS Independence** — score evidence sources for independence
5. **Evidence Log Export** — emit deterministic, auditable JSON

Output: `/evidence/leak_candidate_audit.json` — every claim traces to a
specific observation with 11 provenance fields per record.

---

## Key Engineering Claims

1. **EIS v1.0 prevents evidence inflation.**
   The Evidence Independence Specification distinguishes VALID, MISSING,
   ANOMALOUS, CORRELATED, and INDEPENDENT evidence. A claim that rests on three
   independent sources scores higher than a claim resting on three correlated
   readings of the same underlying signal. The system cannot be fooled by
   restating the same observation in three places.

2. **HBK localizes, it does not pinpoint.**
   HBK Bayesian Localization narrows a candidate leak zone from "the whole DMA"
   to "the segment exhibiting the hydraulic deviation." It is an engineering
   assistance system, not an autonomous leak detector. It is designed to be
   paired with field verification.

3. **Zero Fabrication Mandate.**
   The system never asserts a conclusion it cannot trace back to a specific
   observation. Every claim, every score, every alert carries a provenance
   chain (11 fields per observation). If the evidence is missing, the system
   says `MISSING` — it never substitutes a plausible-sounding inference.

4. **Sparse sensors cannot deliver full observability.**
   See `02b_sparse_sensor_hypothesis.md`. The system explicitly disclaims the
   ability to pinpoint leaks to within meters, to work without field
   verification, or to replace acoustic leak detection.

5. **The evidence chain is auditable.**
   Every conclusion can be drilled down to the raw observation. An engineer
   inspecting a claim can ask "why does the system believe this?" and receive
   a traceable, ordered, time-aligned answer.

---

## What We Ask of DWS

The VVU IVE is presented for **domain validation**, not for procurement. We ask
DWS to evaluate the following:

1. **Domain validation.** Do DWS engineers agree that the HOM, EIS v1.0, and
   HBK claims are scientifically bounded and honestly stated? Specifically,
   does DWS agree that the Sparse Sensor Hypothesis (`02b`) accurately
   describes what sparse SCADA can and cannot reveal?

2. **Governed dataset for the 72-hour protocol.** DWS-provided historical
   SCADA + repair records for a single DMA, covering 24+ months, would enable
   a real-world run of the 72-hour validation protocol (`05a`). Without this,
   the system can only demonstrate on simulation data.

3. **Engineer review of the audit trail.** After a sandbox run, we ask DWS
   engineers to drill down into `/evidence/leak_candidate_audit.json` and
   confirm that the provenance chain is sufficient to defend (or reject) any
   given claim.

---

## Classification Reminder

All data shown in the demonstrations is **SIMULATION DATA — NOT MUNICIPAL
OPERATIONAL DATA**. No DWS or NMBM operational data has been ingested. The
hydraulic incident replay (`04c`) uses synthetic values for illustrative
purposes only. Real-world validation requires the data described in
`05b_data_requirements.md`.

---

## Contact / Handoff

- **Repository:** github.com/divhanimajokweni-ctrl/proofbridge-liner
- **Branch:** `feat/vvu-gov-deploy`
- **Custom domain:** https://vvu-gov.space-z.ai
- **Bundle date:** 2026-08-26

---

*End of README.*
