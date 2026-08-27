# Hydraulic Observability Model (HOM) — Sparse Sensor Hypothesis

**Version:** 0.1 (Draft for DWS Validation)
**Date:** 2026-08-26
**Classification:** Engineering Hypothesis — Not Validated Against Municipal Data

---

## Core Claim

With sparse sensors, you **cannot** locate every leak precisely. You **can**:
1. Identify abnormal behaviour
2. Reduce the search area
3. Request targeted field verification

This is an **engineering assistance system**, not an autonomous leak detector.

---

## Measurements to Discuss

### Hydraulic Measurements
- Flow rate (L/s)
- Pressure (m)
- Reservoir/tank level
- Pump status (ON/OFF)
- Valve status (OPEN/CLOSED)
- Minimum night flow (L/s, 02:00–04:00)
- DMA inflow (bulk meter)
- Pressure transients
- Flow/pressure time series

### Consumption
- Customer/zone consumption (billing cycle lagged)
- Authorized consumption vs system input

### Context Measurements
- Rainfall
- Temperature
- Ground conditions
- Construction activity
- Power interruptions
- Pump schedules
- Valve operations

---

## Derived Indicators

### Water Balance

```
NRW = System Input − Authorized Consumption
```

### DMA Loss

```
Loss ≈ Inflow − Authorized Consumption
```

**Note:** Water balance tells you unexplained water exists. It does **not** tell you where the underground leak is. That is where the evidence layer becomes useful.

---

## Hydraulic Baseline

A stable DMA under night-flow conditions produces:

| TIME | FLOW | PRESSURE | STATUS |
|---|---|---|---|
| 00:00 | 102 L/s | 48.2 m | NOMINAL |
| 01:00 | 98 L/s | 48.5 m | NOMINAL |
| 02:00 | 97 L/s | 48.4 m | NOMINAL |
| 03:00 | 96 L/s | 48.6 m | NOMINAL |

This baseline is the reference against which anomalies are detected.

---

## Anomaly Signatures

| Signature | Flow | Pressure | Interpretation |
|---|---|---|---|
| Flow ↑, Pressure ↓ | Increased | Decreased | Potential leak / unauthorized consumption |
| Flow →, Pressure ↓ | Stable | Decreased | Valve closure / demand-side change |
| Flow ↑, Pressure → | Increased | Stable | Pump change / boundary condition shift |
| Flow ↓, Pressure ↑ | Decreased | Increased | Upstream restriction |
| Flow →, Pressure → | Stable | Stable | No anomaly — baseline |

---

## What HOM Does NOT Claim

- ❌ Does not claim to locate leaks to within meters
- ❌ Does not claim to work without field verification
- ❌ Does not claim to replace acoustic leak detection
- ❌ Does not claim to work on all network topologies
- ❌ Does not claim to detect leaks smaller than sensor noise floor

## What HOM DOES Claim

- ✅ Sparse observations can identify hydraulic deviation from baseline
- ✅ The deviation can be characterized (flow up + pressure down = potential loss)
- ✅ The candidate zone can be narrowed to the DMA showing the anomaly
- ✅ Multiple independent evidence types increase confidence
- ✅ The evidence chain is auditable — every conclusion traces to specific observations

---

## Proposed Validation

If DWS provides historical SCADA + repair records for a single DMA covering 24+ months:

1. VVU ingests SCADA data (flow, pressure, pump/valve status)
2. VVU computes night-flow baselines per DMA
3. VVU runs anomaly detection + EIS v1.0 against the time series
4. VVU compares flagged anomalies against the repair register
5. DWS engineers evaluate whether flagged anomalies match real operational knowledge

**Data status: PROPOSED INTEGRATION — no DWS data has been provided yet.**
