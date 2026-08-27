# Sparse Sensor Hypothesis

**Version:** 0.1 (Draft for DWS Validation)
**Date:** 2026-08-26
**Classification:** Engineering Hypothesis — Not Validated Against Municipal Data

---

## Core Claim

With sparse sensors, full observability of the network is impossible. Partial observability is possible: detect abnormal hydraulic behaviour relative to baseline.

**Claim:** Sparse observations cannot pinpoint every leak. It can:
1. Identify abnormal hydraulic behaviour
2. Reduce the search area
3. Request targeted field verification

This is an **engineering assistance system**, not an autonomous leak detector.

---

## Example Scenario

3 pressure sensors in a zone. One shows 46.1m vs baseline 48.5m, flow increased 102 to 114 L/s. Alone, this is insufficient evidence. Combined with a field moisture report and an acoustic anomaly, the evidence becomes independently corroborating, and the zone narrows.

---

## What HOM Does NOT Claim

- Does not claim to locate leaks to within meters
- Does not claim to work without field verification
- Does not claim to replace acoustic leak detection
- Does not claim to work on all network topologies
- Does not claim to detect leaks smaller than sensor noise floor

## What HOM DOES Claim

- Sparse observations can identify hydraulic deviation from baseline
- The deviation can be characterized (flow up + pressure down = potential loss)
- The candidate zone can be narrowed to the DMA showing the anomaly
- Multiple independent evidence types increase confidence
- The evidence chain is auditable — every conclusion traces to specific observations

---

## Proposed Validation

If DWS provides historical SCADA + repair records for a single DMA covering 24+ months:

1. VVU ingests SCADA data (flow, pressure, pump/valve status)
2. VVU computes night-flow baselines per DMA
3. VVU runs anomaly detection + EIS v1.0 against the time series
4. VVU compares flagged anomalies against the repair register
5. DWS engineers evaluate whether flagged anomalies match real operational knowledge

**Data status: PROPOSED INTEGRATION — no DWS data has been provided yet.**
