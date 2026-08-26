# Hydraulic Observability Model (HOM) — Sparse Sensor Hypothesis

**Version:** 0.1 (Draft for DWS Validation)
**Date:** 2026-08-26
**Classification:** Engineering Hypothesis — Not Validated Against Municipal Data

---

## 1. Problem Statement

Municipal water distribution networks are instrumented sparsely. A typical DMA (District Metered Area) may have:
- 1 bulk inflow meter
- 0–5 pressure sensors
- Customer consumption data (intermittent, often billing-cycle lagged)
- No acoustic loggers (or very few)
- No internal flow meters on most pipe segments

The engineering question: **Can sparse hydraulic observations identify anomalous behaviour that narrows the search area for underground leaks?**

## 2. Hypothesis

Sparse observations cannot directly locate a leak. They can:

1. **Detect** that the hydraulic system has deviated from its expected behaviour
2. **Characterise** the deviation (flow increase + pressure decrease = potential loss)
3. **Narrow** the candidate zone (which DMA / pressure zone shows the anomaly)
4. **Trigger** targeted field verification (acoustic, ground inspection, correlator)

The system is an **engineering assistance tool**, not an autonomous leak detector.

## 3. Hydraulic Baseline

A stable DMA under night-flow conditions (02:00–04:00) produces:

```
TIME     FLOW       PRESSURE    DESCRIPTION
02:00    96 L/s     48.6 m      Baseline — minimal consumption
02:30    95 L/s     48.5 m      Stable
03:00    96 L/s     48.6 m      Stable
03:30    95 L/s     48.7 m      Stable
```

This baseline is the reference against which anomalies are detected.

## 4. Anomaly Signatures

| Signature | Flow | Pressure | Interpretation |
|---|---|---|---|
| Flow ↑, Pressure ↓ | Increased | Decreased | Potential leak / unauthorized consumption |
| Flow →, Pressure ↓ | Stable | Decreased | Valve closure / demand-side change |
| Flow ↑, Pressure → | Increased | Stable | Pump change / boundary condition shift |
| Flow ↓, Pressure ↑ | Decreased | Increased | Upstream restriction / valve closure |
| Flow →, Pressure → | Stable | Stable | No anomaly — baseline |

## 5. Evidence Types for Leak Detection

| Evidence Type | Independence | Information Content |
|---|---|---|
| Bulk flow anomaly | Medium — depends on meter accuracy | High — direct measurement of water loss |
| Pressure anomaly | Medium — correlated with flow in same DMA | Medium — indirect indicator |
| Minimum night flow increase | Medium — derived from flow time series | High — established NRW indicator |
| Field observation (ground moisture) | HIGH — independent physical observation | High — direct physical evidence |
| Acoustic signal anomaly | HIGH — independent measurement method | High — direct leak indicator |
| Customer complaint | LOW — may be correlated with field observation | Low — anecdotal unless structured |
| Pump/valve status change | HIGH — independent operational data | Critical for context (rules out operational cause) |

## 6. What HOM Does NOT Claim

- ❌ Does not claim to locate leaks to within meters
- ❌ Does not claim to work without field verification
- ❌ Does not claim to replace acoustic leak detection
- ❌ Does not claim to work on all network topologies
- ❌ Does not claim to detect leaks smaller than the sensor noise floor

## 7. What HOM DOES Claim

- ✅ Sparse observations can identify that a hydraulic system has deviated from baseline
- ✅ The deviation can be characterized (flow up + pressure down = potential loss)
- ✅ The candidate zone can be narrowed to the DMA / pressure zone showing the anomaly
- ✅ Multiple independent evidence types (hydraulic + field + acoustic) increase confidence
- ✅ The evidence chain is auditable — every conclusion traces back to specific observations

## 8. Proposed Validation Against DWS Data

If DWS provides historical SCADA + repair records for a single DMA covering at least 24 months:

1. VVU ingests the SCADA data (flow, pressure, pump/valve status)
2. VVU computes night-flow baselines per DMA
3. VVU runs HBK Mk-II against the time series
4. VVU compares flagged anomalies against the repair register
5. VVU reports: detected events, lead time, false alerts, missed events
6. DWS engineers evaluate whether the flagged anomalies correspond to real operational knowledge

**Data status: PROPOSED INTEGRATION — no DWS data has been provided yet.**
