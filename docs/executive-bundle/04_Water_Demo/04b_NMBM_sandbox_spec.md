# NMBM Data Sandbox Specification

**Version:** 0.1 (Proposed)
**Date:** 2026-08-26
**Classification:** SIMULATION / PLACEHOLDER DATA — NOT MUNICIPAL OPERATIONAL DATA

---

## 1. Purpose

This specification defines the proposed municipal water-data demonstration for the Nelson Mandela Bay Municipality (NMBM) context. It is a **specification**, not a dataset. No real NMBM data is present in this pack.

## 2. Data Categories Required

| Category | Fields | Status |
|---|---|---|
| **Water — SCADA Pressure** | timestamp, sensor ID, value (m), quality flags | PROPOSED INTEGRATION |
| **Water — SCADA Flow** | timestamp, meter ID, value (L/s), quality flags | PROPOSED INTEGRATION |
| **Water — Acoustic** | timestamp, logger ID, waveform/features, sample rate, calibration | PROPOSED INTEGRATION |
| **Water — Failure Register** | asset ID, failure type, reported/confirmed/isolation/repair times, coordinates/DMA | PROPOSED INTEGRATION |
| **Water — Asset Metadata** | pipe material, diameter, installation year, pressure zone, valve relationships, sensor locations | PROPOSED INTEGRATION |
| **Water — Operating Context** | pump states, valve states, PRV settings, planned shutdowns, telemetry changes | PROPOSED INTEGRATION |
| **Electricity — SCADA** | timestamp, feeder ID, kW, kV, power quality | PROPOSED INTEGRATION |
| **Housing — Asset Register** | asset ID, type, location, age, condition rating | PROPOSED INTEGRATION |
| **Budget — Allocation** | department, programme, budget vs actual, financial year | PROPOSED INTEGRATION |

## 3. Simulated Demonstration Data (NOT REAL)

For demonstration purposes only, VVU will generate **synthetic hydraulic time series** that simulate:

- A DMA with 1 bulk inflow meter + 3 pressure sensors
- Night-flow baseline (02:00–04:00): ~96 L/s, 48.6 m pressure
- A simulated leak event at hour 4: flow increases to 114 L/s, pressure drops to 45.7 m
- A field observation (simulated): ground moisture report at segment S-142
- An acoustic observation (simulated): anomalous signal at segment S-142

**Every synthetic data point will be labelled: SIMULATION — NOT MUNICIPAL OPERATIONAL DATA.**

## 4. Example Leakage Evidence Pathway

```
[01] SCADA flow anomaly detected at 04:00
  ↓
[02] SCADA pressure anomaly detected at 04:01 (same DMA)
  ↓ — EIS classifies: CORRELATED (same DMA, same measurement window)
[03] Night-flow minimum increases by 15% over 3 nights
  ↓ — EIS classifies: DERIVED (from same flow time series)
[04] Field technician reports ground moisture at segment S-142
  ↓ — EIS classifies: INDEPENDENT (different observation type, different location)
[05] Acoustic logger detects anomalous signal at S-142
  ↓ — EIS classifies: INDEPENDENT (different measurement principle)
[06] No pump/valve status changes in the DMA during the anomaly window
  ↓ — EIS classifies: CONTEXTUAL (rules out operational cause)
  ↓
[07] Evidence correlation: 2 hydraulic + 1 field + 1 acoustic + 1 contextual = 5 observations
  ↓
[08] EIS independence score: 0.85 (HIGH)
  ↓
[09] Claim generated: "Potential underground leakage at segment S-142, DMA-7"
  ↓
[10] Field verification: technician dispatched, leak confirmed
  ↓
[11] Evidence package generated with complete 11-field provenance for each observation
  ↓
[12] Audit trail: every observation, processing step, and decision is stored and reproducible
```

## 5. Data Provenance Status Table

| Data Item | Status | Source | Label Required |
|---|---|---|---|
| DMA-7 flow time series | SIMULATION | VVU-generated | "SIMULATION — NOT MUNICIPAL OPERATIONAL DATA" |
| DMA-7 pressure time series | SIMULATION | VVU-generated | "SIMULATION — NOT MUNICIPAL OPERATIONAL DATA" |
| Night-flow minimum | DERIVED | Computed from simulated flow | "DERIVED FROM SIMULATION DATA" |
| Field observation (ground moisture) | SIMULATION | VVU-generated | "SIMULATION — NOT REAL FIELD REPORT" |
| Acoustic signal | SIMULATION | VVU-generated | "SIMULATION — NOT REAL ACOUSTIC DATA" |
| Pump/valve status log | SIMULATION | VVU-generated | "SIMULATION — NOT OPERATIONAL DATA" |
| Asset metadata (pipe material, diameter) | PLACEHOLDER | Hypothetical | "PLACEHOLDER — NOT REAL ASSET DATA" |
| Failure register | PLACEHOLDER | Hypothetical | "PLACEHOLDER — NOT REAL FAILURE RECORD" |

## 6. What Would Change With Real DWS Data

If DWS provides real historical data:

1. **SIMULATION labels are removed** — replaced with REAL / OBSERVED
2. The ingestion pipeline processes real SCADA exports (CSV / database)
3. HBK Mk-II runs against real time series
4. EIS evaluates real observation independence
5. Flagged anomalies are compared against the real failure register
6. Every result carries the real sensor IDs, timestamps, and calibration epochs

**Until real data is provided, no result in this demonstration represents municipal validation.**
