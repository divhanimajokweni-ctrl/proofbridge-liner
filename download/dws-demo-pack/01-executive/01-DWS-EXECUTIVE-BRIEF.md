# DWS Executive Brief — One Page

**To:** Department of Water and Sanitation — Technical Validation Meeting
**From:** Venture Vision Ubuntu (VVU)
**Date:** 2026-08-26
**Subject:** VVU IVE — Evidence Verification Layer for Infrastructure Observations

---

## The Problem

Municipal water networks lose significant volumes to non-revenue water (NRW) — underground leaks that are difficult to locate with sparse sensor coverage. Existing SCADA systems generate measurements, but the engineering challenge is converting those measurements into **verified, auditable evidence** that supports maintenance decisions.

## What VVU Has Built

VVU IVE is an **evidence and provenance layer** that sits around infrastructure observations. It does not replace SCADA or municipal operational systems. It provides:

1. **Observation ingestion** — flow, pressure, level, pump status, valve status
2. **Evidence correlation** — links related observations across sensors and time
3. **Independence assessment** — evaluates whether corroborating observations are genuinely independent
4. **Provenance tracking** — every observation has a complete chain: sensor → firmware → calibration → timestamp → processing → verification
5. **Audit trail** — decisions are reproducible from stored evidence

## What We Are Asking DWS to Examine

Whether the engineering model VVU has encoded maps correctly onto how DWS and municipalities actually observe, diagnose, and verify infrastructure problems. This is a **domain-validation exercise**, not a product pitch.

## What We Have NOT Done

VVU has **not** operated a municipal water distribution network. We do not represent the current prototype as having been validated against municipal operational data. All water demonstration data is clearly labelled as **SIMULATION / PLACEHOLDER**.

## What We Are Proposing

If DWS provides an appropriately governed historical or test dataset, VVU will run the system against it and measure whether it identifies the patterns DWS engineers already recognise — under a 72-hour validation protocol with explicit success criteria.

## Key Documents in This Pack

| # | Document | Purpose |
|---|---|---|
| 1 | Technical Demonstration Brief (this folder) | 3-page architecture + capabilities |
| 2 | Hydraulic Observability Model (Folder 02) | Technical basis for sparse-sensor anomaly detection |
| 3 | Evidence Independence Specification v1.0 (Folder 02) | How VVU evaluates evidence independence |
| 4 | Component Inventory (Folder 03) | Auditable inventory of what is implemented |
| 5 | Repository Verification (Folder 03) | Proves the software state is real and reproducible |
| 6 | NMBM Data Sandbox Spec (Folder 04) | Proposed water demonstration with explicit data labelling |
| 7 | 72-Hour Validation Protocol (Folder 05) | How a real pilot would be evaluated |

---

**Contact:** Divhani Majokweni · Venture Vision Ubuntu
**Repository:** github.com/divhanimajokweni-ctrl/proofbridge-liner (branch: feat/vres1-scrubbed)
**Live demo:** venturevisionubuntu.co.za
