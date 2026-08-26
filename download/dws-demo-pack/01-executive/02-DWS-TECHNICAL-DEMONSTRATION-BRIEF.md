# DWS Technical Demonstration Brief — 3 Pages

**Date:** 2026-08-26
**Audience:** DWS technical engineers and validators
**Classification:** SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA

---

## Page 1 — System Architecture & Water-Loss Use Case

### 1.1 What VVU IVE Is

VVU IVE (Immersive Virtual Environment) is a software platform that implements an **evidence verification layer** for infrastructure observations. It is built on Next.js 16 with TypeScript, Prisma ORM, and a World → Room → Activity → Interaction architecture.

The platform has 6 Rooms (Build, Study, Finance, Game, Data, Vault) containing 21 Activities. For DWS, the relevant rooms are:

- **Data Room** — observation ingestion, AIR runtime, evidence pipeline, field evidence
- **Vault Room** — cryptographic governance, evidence packaging, audit trail
- **Build Room** — HBK Mk-II kernel (Bayesian inference), drone simulator (physical-system simulation capability)

### 1.2 The Water-Loss Use Case

The engineering problem VVU addresses:

```
Municipal water network
  ↓
Sparse observations (flow, pressure, level, pump/valve status)
  ↓
Anomaly detection (hydraulic deviation from baseline)
  ↓
Evidence correlation (link related observations across sensors + time)
  ↓
Independence assessment (are corroborating observations genuinely independent?)
  ↓
Candidate location inference (narrow the search area)
  ↓
Field verification (human confirms or rejects)
  ↓
Auditable evidence record (complete provenance chain)
```

This is **not** an autonomous leak detector. It is an **engineering assistance system** that helps operators narrow the search area and produces auditable evidence for maintenance decisions.

### 1.3 Data Status — Strict Labelling

Every dataset in this demonstration is labelled:

| Label | Meaning |
|---|---|
| **REAL / OBSERVED** | Actual field measurement — NONE in this pack |
| **SYNTHETIC** | Generated to simulate realistic sensor behaviour |
| **SIMULATION** | Modelled hydraulic scenario for demonstration |
| **PLACEHOLDER** | Structural placeholder — no real measurement |
| **PROPOSED INTEGRATION** | Describes what real data would look like |

**No data in this pack is represented as municipal operational data.**

---

## Page 2 — Evidence & Provenance Architecture

### 2.1 Evidence Chain

Every observation in VVU IVE carries a complete provenance chain:

```
Claim
 └── Observation
      ├── Sensor ID
      ├── Firmware version
      ├── Calibration epoch
      ├── Timestamp (UTC, timezone-aware)
      ├── Location (coordinates or DMA)
      └── Environmental context
           ├── Processing pipeline version
           ├── Corroborating evidence links
           └── Verification result
```

The 11-field provenance spine (from the VRES1 specification):

| Field | Purpose |
|---|---|
| event_id | Unique identifier |
| sensor_id | Which sensor produced the observation |
| sensor_timestamp | When the sensor recorded it |
| capture_epoch | Calibration epoch of the sensor |
| frame_sequence | Sequential frame number |
| optical_sequence | Signal sequence (for acoustic/optical) |
| receiver_timestamp | When the system received it |
| router_timestamp | When the system routed it |
| proof_leaf | Cryptographic hash of the observation |
| attestation_reference | Signed attestation (if attested) |
| calibration_epoch | Last calibration date |

### 2.2 Evidence Independence Specification (EIS v1.0)

VVU does not simply count "N sensors agree, therefore confidence = N%." Instead, EIS v1.0 evaluates whether observations are **genuinely independent**:

- Two pressure sensors on the same pipe segment are **correlated**, not independent
- A flow anomaly + a field observation of ground moisture + an acoustic signal are **independent** evidence types
- EIS computes an independence score that weights evidence by its information content, not just its count

### 2.3 HBK Mk-II Kernel

The Hydro-Bayesian Kernel Mk-II replaces traditional MCMC with supervised random Fourier basis functions:

- 85–96% computation-time reduction vs MCMC
- Scales nearly linearly with exposure count
- Designed for sparse, noisy, asynchronous field evidence
- Combines iterative Bayesian learning with partially-known mechanistic priors (mass conservation, structural load tolerances)

For water-loss: HBK ingests sparse hydraulic observations and produces a probability distribution over candidate leak zones, not a single deterministic answer.

---

## Page 3 — Proposed DWS Validation

### 3.1 What We Are Proposing

A **72-hour validation protocol** where VVU IVE is run against a DWS-provided historical or test dataset from a single DMA or distribution zone.

### 3.2 What DWS Would Provide

1. SCADA pressure readings (timestamp, sensor ID, value, quality flags)
2. SCADA flow readings (timestamp, meter ID, value, quality flags)
3. Failure register (asset ID, failure type, reported/confirmed/isolation/repair times, coordinates)
4. Asset metadata (pipe material, diameter, installation year, pressure zone)
5. Operating context (pump/valve states, planned shutdowns, telemetry changes)

### 3.3 What VVU Would Demonstrate

- Ingest the dataset through the observation pipeline
- Run HBK Mk-II against the historical data
- Identify whether the system flags anomalies that correspond to known failures
- Produce evidence packages with complete provenance for each flagged event
- Measure: percentage of bursts alerted at least 48 hours early, median lead time, false alerts per pipe-month, missed bursts

### 3.4 Success Criteria

| Criterion | Target |
|---|---|
| Evidence reproducibility | Same data → same results (deterministic) |
| Independence assessment | EIS correctly identifies correlated vs independent evidence |
| Provenance completeness | All flagged events have complete 11-field provenance |
| Leak detection lead time | ≥ 48 hours before confirmed onset (target) |
| False alert rate | < 1 per 10 pipe-months (target) |
| Evidence retained independently of settlement | ✅ (per VRES1 spec) |

### 3.5 What We Are NOT Claiming

- ❌ We have NOT operated a municipal water network
- ❌ We have NOT validated against real DWS data (no data has been provided)
- ❌ We are NOT claiming autonomous leak detection
- ❌ We are NOT claiming the current prototype is deployment-ready

### 3.6 Honest Position

> "I haven't operated a municipal water network myself. My practical experience is on the systems-engineering and software side. I built IVE to address an evidence and verification problem, and I'm here to test whether the engineering assumptions we've encoded correspond to how DWS and municipalities actually observe, diagnose and verify infrastructure problems."

---

## DWS Engineer Q&A Preparation

| Question | Answer Direction |
|---|---|
| Where does the data come from? | Sensor/SCADA/API/file ingestion → 11-field provenance spine |
| What if sensors disagree? | EIS v1.0 evaluates independence, not just count |
| What if a sensor fails? | Missing data marked UNDEFINED — Zero Fabrication Rule |
| How do you locate a leak? | Candidate-zone inference → field verification (human confirms) |
| How quickly does it react? | Event-driven; streaming ingestion (latency depends on SCADA polling) |
| Can it work offline? | Edge runtime architecture — store-and-forward with provenance |
| Can an engineer inspect the evidence? | Yes — provenance drill-down to sensor + calibration + timestamp |
| Can we reproduce a result? | Yes — immutable evidence record, deterministic processing |
| What data do you need from us? | Section 3.2 above (5 categories) |
| Is the current data real? | No — all SIMULATION / PLACEHOLDER, clearly labelled |
| Has this been validated in a municipality? | No — this meeting is part of that validation |
| What happens when the model is wrong? | System returns REJECT / UNCERTAIN state — human verification required |
| Can it integrate with existing systems? | API/adapter architecture — REST/gRPC ingestion, JSON/CSV import |
| What is the deployment boundary? | IVE sits around operational systems, does not replace them |
