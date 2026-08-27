# VVU IVE — Technical Demonstration Brief (3 Pages)

**Date:** 2026-08-26
**Audience:** DWS technical engineers and validators
**Classification:** SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA

---

## PAGE 1 — What DWS Is Asked to Examine

### What VVU IVE Is

VVU IVE (Immersive Virtual Environment) is an **evidence-verification layer** for infrastructure observations. It sits around existing SCADA and operational systems — it does not replace them.

### The Problem

Municipal water networks lose significant volumes to non-revenue water (NRW). Underground leaks are difficult to locate with sparse sensor coverage. SCADA systems generate measurements, but converting those measurements into verified, auditable evidence that supports maintenance decisions is an engineering challenge.

### What VVU IVE Is NOT

- ❌ NOT a municipal SCADA replacement
- ❌ NOT an autonomous leak detector
- ❌ NOT a product pitch — this is a domain-validation exercise

### The Engineering Chain

```
Municipal water network
  → sparse observations (flow, pressure, level, pump/valve status)
  → anomaly detection (hydraulic deviation from baseline)
  → evidence correlation (link related observations across sensors + time)
  → independence assessment (are corroborating observations genuinely independent?)
  → candidate location inference (narrow the search area)
  → field verification (human confirms or rejects)
  → auditable evidence record (complete provenance chain)
```

### Data Status

All data in this demonstration is labelled:

| Label | Meaning |
|---|---|
| REAL / OBSERVED | Actual field measurement — NONE in this pack |
| SYNTHETIC | Generated to simulate realistic sensor behaviour |
| SIMULATION | Modelled hydraulic scenario for demonstration |
| PLACEHOLDER | Structural placeholder — no real measurement |
| PROPOSED INTEGRATION | Describes what real data would look like |

**No data in this pack is represented as municipal operational data.**

---

## PAGE 2 — What VVU Has Working Today

### Architecture

VVU IVE uses a **World → Room → Activity → Interaction** architecture. The existing dashboard visual language is preserved. When an Activity is entered, it owns the full working viewport — it is not a small dashboard card.

### Repository State (Verified)

| Check | Result |
|---|---|
| Lint | ✅ 0 errors, 0 warnings |
| Console errors | ✅ 0 |
| Dev server | ✅ All routes 200 |
| Git push | ✅ Branch `feat/vres1-scrubbed` on GitHub |
| Reproducible build | ✅ `git clone` → `bun install` → `bun run dev` |
| Sandbox pipeline | ✅ `setup.sh` + `run.sh` generates `/evidence` |

### Current Capabilities

1. **Observation ingestion** — file/API/sensor input pathway with quality flags
2. **Time alignment** — UTC, timezone-aware timestamps
3. **Quality check** — rejects IMPOSSIBLE_PHYSICS, flags MISSING data
4. **Anomaly detection** — flow deviation + pressure drop vs baseline
5. **Evidence correlation** — links related observations across sensors and time
6. **EIS v1.0 scoring** — independence assessment (prevents evidence inflation)
7. **Provenance chain** — 11-field provenance spine per observation
8. **Audit trail** — SHA-256 hashed JSON receipt with applied configuration

### EIS v1.0 — Evidence Independence Scoring

The system does NOT count "5 sensors agree = 100% confidence." It asks: are those 5 observations genuinely independent, or are they correlated measurements of the same event?

- 5 pressure sensors on the same DMA = 1 correlated hydraulic event
- 1 flow anomaly + 1 field observation + 1 acoustic signal = 3 independent evidence types

Scoring: PRIMARY (0.3) + CORRELATED (0.2) + INDEPENDENT (0.4) = 0.9 confidence → VERIFIED_CANDIDATE

### Drone Simulator — Physical System Proof

A complete Three.js 3D drone flight simulator demonstrates that VVU can build interactive physical-system simulations with real physics (rigid body 6DoF, F=ma, thrust vector rotation, gravity, drag, wind). The same interaction model applies to hydraulic incident replay.

---

## PAGE 3 — Proposed DWS Validation

### What We Are Proposing

A **72-hour validation protocol** where VVU IVE is run against a DWS-provided historical or test dataset from a single DMA.

### What DWS Would Provide

1. SCADA pressure readings (timestamp, sensor ID, value, quality flags)
2. SCADA flow readings (timestamp, meter ID, value, quality flags)
3. Failure register (asset ID, failure type, confirmed onset, isolation/repair times, coordinates)
4. Asset metadata (pipe material, diameter, installation year, pressure zone)
5. Operating context (pump/valve states, planned shutdowns, telemetry changes)

### What VVU Would Demonstrate

- Ingest the dataset through the observation pipeline
- Run anomaly detection + evidence correlation + EIS v1.0 against the historical data
- Compare flagged anomalies against the failure register
- Generate evidence packages with complete 11-field provenance for each flagged event
- Measure: detected events, lead time, false alerts, missed events, independence scores

### Success Criteria

| Criterion | Target |
|---|---|
| Does system reduce search area? | Yes — narrows to DMA/segment |
| Does it distinguish valid/missing/anomalous/correlated/independent? | Yes — EIS v1.0 |
| Can engineer inspect why system believes claim? | Yes — provenance drill-down |
| Reproducibility | Same data → same result (deterministic) |
| False alert rate | < 1 per 10 pipe-months (target) |
| Lead time | ≥ 48 hours before confirmed onset (target) |

### What We Are NOT Claiming

- ❌ We have NOT operated a municipal water network
- ❌ We have NOT validated against real DWS data
- ❌ We are NOT claiming autonomous leak detection
- ❌ We are NOT claiming deployment readiness

### Honest Position

> "I haven't operated a municipal water network myself. My practical experience is on the systems-engineering and software side. I built IVE to address an evidence and verification problem, and I'm here to test whether the engineering assumptions we've encoded correspond to how DWS and municipalities actually observe, diagnose, and verify infrastructure problems. I want the people who operate these systems to tell me where the model is wrong, and then test the corrected implementation against appropriate data."
