# Evidence Independence Specification (EIS) v1.0

**Version:** 1.0
**Date:** 2026-08-26
**Status:** Draft for DWS Validation
**Classification:** Engineering Specification

---

## Purpose

EIS v1.0 defines how VVU IVE evaluates whether observations that appear to corroborate each other are **genuinely independent** — or are merely correlated measurements of the same underlying phenomenon.

This matters because counting correlated observations as independent evidence inflates confidence. A system that says "5 sensors agree, therefore 100% confidence" when all 5 sensors are on the same DMA is not producing evidence — it is producing echo.

---

## Evidence States

| State | Meaning | Example |
|---|---|---|
| Valid observation | Sensor reading within physical range, quality VALID | Flow 111 L/s with VALID flag |
| Missing observation | No data for 17+ minutes | Sensor offline — flagged UNDEFINED, never guessed |
| Anomalous observation | Impossible physics (e.g., 999m pressure spike) | Filtered by quality gate |
| Correlated observation | Same DMA, same time window, same measurement type | 2 pressure sensors on same DMA reacting to same event |
| Independently corroborating | Different measurement principle, different location | Flow anomaly + field ground moisture + acoustic signal |
| Insufficient evidence | Not enough observations to assess | Only 1 sensor with no field evidence |

---

## Independence Scoring

For a set of N observations supporting a claim:

```
Score = (has_primary × 0.3) + (has_correlated × 0.2) + (has_independent × 0.4)

If has_primary AND has_pump_context → REJECTED (false positive)
If score ≥ 0.8 → VERIFIED_CANDIDATE
Else → INSUFFICIENT_EVIDENCE
```

### Key Rule: Correlated observations cap out

Multiple correlated sensors add **small** confidence (proves event happened), but they do NOT scale linearly. 1 flow anomaly + 5 correlated pressure drops ≠ 6 independent proofs. It equals 1 primary + 1 correlated event.

### Key Rule: Independent corroboration is the gold standard

1 flow anomaly + 1 acoustic signal from the field = **higher confidence** than 1 flow anomaly + 10 pressure sensors on the same DMA. Different measurement principles provide genuinely new information.

---

## Example Scenario

### Bad (Evidence Inflation — What EIS Prevents)

| # | Observation | Type | Location | Time |
|---|---|---|---|---|
| 1 | Flow increase at DMA inlet | Flow | DMA-7 inlet | 04:00 |
| 2 | Pressure decrease sensor P-14 | Pressure | DMA-7 | 04:01 |
| 3 | Pressure decrease sensor P-15 | Pressure | DMA-7 | 04:02 |
| 4 | Pressure decrease sensor P-16 | Pressure | DMA-7 | 04:03 |
| 5 | Pressure decrease sensor P-17 | Pressure | DMA-7 | 04:04 |

**Without EIS:** "5 sensors agree → 100% confidence → VERIFIED"
**With EIS:** All 5 are in the same DMA, within 4 minutes, same measurement type → 1 PRIMARY + 1 CORRELATED → score = 0.5 → INSUFFICIENT EVIDENCE. Requires independent corroboration.

### Good (Independent Evidence — What EIS Rewards)

| # | Observation | Type | Location | Time |
|---|---|---|---|---|
| 1 | Flow increase at DMA inlet | Flow | DMA-7 inlet | 04:00 |
| 2 | Pressure decrease | Pressure | DMA-7 | 04:05 |
| 3 | Field report: ground moisture | Field | Segment S-142 | 06:30 |
| 4 | Acoustic signal anomaly | Acoustic | Segment S-142 | 08:00 |
| 5 | No pump/valve status changes | Context | DMA-7 | 04:00–08:00 |

**With EIS:** 1 PRIMARY (0.3) + 1 CORRELATED (0.2) + 1 INDEPENDENT (0.4) + 1 CONTEXT → score = 0.9 → VERIFIED CANDIDATE.

---

## DMA Calibration

Different DMAs have different noise profiles. An industrial zone with factories has massive legitimate flow swings (high noise). A residential cul-de-sac has tight, predictable patterns (low noise). A hardcoded 10% threshold causes false positives in the former and missed leaks in the latter.

EIS v1.0 accepts **dynamic calibration**:

| Parameter | Default | Range | Purpose |
|---|---|---|---|
| flowDeviationThreshold | 10% | 1–50% | Minimum flow deviation to flag anomaly |
| pressureDropThreshold | 5% | 1–30% | Minimum pressure drop to correlate |
| correlationTimeWindowMs | 60 min | 1–1440 min | Max time gap for correlation |

These parameters are **serialized into the audit receipt** so the result is mathematically reproducible — a municipal investigator can verify exactly why the system made its decision.

---

## Zero Fabrication Rule

Missing data is never guessed. It is flagged as UNDEFINED.

If a sensor is offline, EIS does not interpolate a value and treat it as evidence. The observation count drops, and the independence score is recomputed from remaining observations.

**The system may not manufacture evidence.**

---

## DWS Validation Question

> "Given a set of SCADA observations + field reports + acoustic data for a known historical leak event, does EIS v1.0 correctly classify the observations as independent vs correlated?"

This is a testable, binary question. Either EIS produces the correct independence assessment or it doesn't — and if it doesn't, DWS engineers can tell us why.
