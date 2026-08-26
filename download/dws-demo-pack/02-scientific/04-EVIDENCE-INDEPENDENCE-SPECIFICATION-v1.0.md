# Evidence Independence Specification (EIS) v1.0

**Version:** 1.0
**Date:** 2026-08-26
**Status:** Draft for DWS Validation
**Classification:** Engineering Specification

---

## 1. Purpose

EIS v1.0 defines how VVU IVE evaluates whether observations that appear to corroborate each other are **genuinely independent** — or are merely correlated measurements of the same underlying phenomenon.

This matters because counting correlated observations as independent evidence inflates confidence. A system that says "5 sensors agree, therefore 100% confidence" when all 5 sensors are on the same pipe segment is not producing evidence — it is producing echo.

## 2. Independence Taxonomy

| Category | Definition | Example (Water) |
|---|---|---|
| **Independent** | Different physical principles, different locations, no shared cause | Flow anomaly + field ground-moisture observation + acoustic signal |
| **Correlated** | Same physical principle, same location, shared cause | Two pressure sensors on the same DMA boundary |
| **Derived** | Computed from another observation | Night-flow minimum derived from the same flow time series |
| **Contextual** | Does not confirm the event but rules out alternative causes | Pump/valve status change (rules out operational cause for pressure drop) |

## 3. Independence Score

For a set of N observations supporting a claim, EIS computes:

```
I_total = Σ(i=1 to N) w_i × ind_i

where:
  w_i = information weight of observation i (0.0 to 1.0)
  ind_i = independence factor of observation i (0.0 to 1.0)

  I_total is clamped to [0.0, 1.0]
```

The independence factor `ind_i` is determined by:
- Different measurement type than other observations? → +0.3
- Different physical location? → +0.3
- Different time window (not within the same reporting cycle)? → +0.2
- Not derived from another observation in the set? → +0.2

## 4. Example: Underground Leak Detection

### Scenario A: Correlated (Low Independence)

| # | Observation | Type | Location | Time |
|---|---|---|---|---|
| 1 | Flow increase at DMA inlet | Flow | DMA-7 inlet | 04:00 |
| 2 | Pressure decrease at sensor P-14 | Pressure | DMA-7, same zone | 04:01 |
| 3 | Pressure decrease at sensor P-15 | Pressure | DMA-7, same zone | 04:02 |

All three are in the same DMA, within a 2-minute window, and are hydraulic measurements of the same underlying event.

**I_total ≈ 0.45** — correlated evidence, not independent. The system should report "anomaly detected, confidence: LOW, requires independent corroboration."

### Scenario B: Independent (High Independence)

| # | Observation | Type | Location | Time |
|---|---|---|---|---|
| 1 | Flow increase at DMA inlet | Flow | DMA-7 inlet | 04:00 |
| 2 | Field report: persistent ground moisture | Field | Segment S-142 | 06:30 |
| 3 | Acoustic signal anomaly | Acoustic | Segment S-142 | 08:00 |
| 4 | No pump/valve status changes | Operational | DMA-7 | 04:00–08:00 |

Four observations, three different measurement types, two different locations, different time windows, one contextual observation (no operational cause).

**I_total ≈ 0.85** — independent evidence, high confidence. The system can report "potential underground leak at segment S-142, confidence: HIGH, recommend field verification."

## 5. Bad Data Handling (EIS Quality Assessment)

| Data Issue | EIS Response |
|---|---|
| Sensor reading outside physical range | Flag as INVALID — excluded from evidence |
| Missing data for 17+ minutes | Flag as MISSING — cannot be used as evidence |
| Sensor calibration expired | Flag as STALE — reduced weight (w_i × 0.5) |
| Single anomalous spike (1 sample) | Flag as TRANSIENT — requires persistence to become evidence |
| Sensor disagrees with all others | Flag as OUTLIER — requires investigation, not auto-rejected |

## 6. Zero Fabrication Rule

**Missing data is never guessed. It is flagged as UNDEFINED.**

If a sensor is offline, EIS does not interpolate a value and treat it as evidence. The observation count drops by one, and the independence score is recomputed from the remaining observations.

This is the constitutional principle from the VRES specification: **the system may not manufacture evidence.**

## 7. Evidence States

| State | Meaning | Color |
|---|---|---|
| VERIFIED | Multiple independent observations confirm the claim | 🟢 Green |
| CORRELATED | Observations agree but are not independent | 🟡 Amber |
| INSUFFICIENT | Not enough observations to assess | 🔵 Blue |
| MISSING | Required data is absent | ⚪ White |
| REJECTED | Observations contradict the claim | 🔴 Red |
| CONJECTURE | Claim made without supporting observations | 🟣 Purple |

## 8. What EIS Does NOT Do

- ❌ Does not assign a probability of leak (that is HBK Mk-II's role)
- ❌ Does not decide whether to dispatch a repair team (that is a human decision)
- ❌ Does not replace hydraulic engineering judgment
- ❌ Does not automatically reject correlated evidence (it labels it correctly)

## 9. DWS Validation Question

> "Given a set of SCADA observations + field reports + acoustic data for a known historical leak event, does EIS v1.0 correctly classify the observations as independent vs correlated?"

This is a testable, binary question. Either EIS produces the correct independence assessment or it doesn't — and if it doesn't, DWS engineers can tell us why.
