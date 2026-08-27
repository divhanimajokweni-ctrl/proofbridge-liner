# 72-Hour Validation Protocol

**Version:** 0.1 (Proposed)
**Date:** 2026-08-26
**Classification:** Proposed Protocol — Not Yet Executed

---

## 1. Objective

Validate whether VVU IVE can ingest real DWS/municipal SCADA data, detect hydraulic anomalies that correspond to known historical failure events, and produce auditable evidence packages with complete provenance.

## 2. Preconditions

| Requirement | Who Provides |
|---|---|
| Historical SCADA data (≥ 24 months, single DMA) | DWS / Municipality |
| Failure register (same period, same DMA) | DWS / Municipality |
| Asset metadata (pipe material, diameter, sensor locations) | DWS / Municipality |
| Operating context (pump/valve schedules, planned shutdowns) | DWS / Municipality |
| Data sharing agreement (permitted use, retention, de-identification) | Both parties |

## 3. Protocol Phases

### Phase A — Data Ingestion (Hours 0–8)

| Step | Action | Pass Criterion |
|---|---|---|
| A1 | Import SCADA pressure + flow as CSV or database export | All records imported, no data loss |
| A2 | Import failure register | All events imported with confirmed-onset timestamps |
| A3 | Import asset metadata + operating context | Asset topology mapped |
| A4 | Compute night-flow baselines per DMA | Baseline established for each sensor |

### Phase B — Anomaly Detection (Hours 8–24)

| Step | Action | Pass Criterion |
|---|---|---|
| B1 | Run HBK Mk-II against historical time series | Kernel completes without error |
| B2 | Flag all anomalies (flow + pressure deviations) | Anomaly list generated |
| B3 | Compare flagged anomalies against failure register | Match / no-match table produced |
| B4 | Compute lead time for each matched event | `t_confirmed_onset - t_first_alert` ≥ 0 |

### Phase C — Evidence Assessment (Hours 24–48)

| Step | Action | Pass Criterion |
|---|---|---|
| C1 | For each flagged anomaly, run EIS v1.0 | Independence score computed |
| C2 | Generate evidence packages (11-field provenance per observation) | All fields populated |
| C3 | Verify evidence reproducibility (same data → same result) | Deterministic |
| C4 | Check for false positives (anomalies with no corresponding failure) | Count logged |

### Phase D — Reporting (Hours 48–72)

| Step | Action | Pass Criterion |
|---|---|---|
| D1 | Generate validation report | All metrics computed |
| D2 | DWS engineers review flagged anomalies | DWS confirms which are true / false |
| D3 | Adjust model based on DWS feedback | Iterative correction |
| D4 | Final report: detected, lead time, false alerts, missed, independence scores | Complete |

## 4. Success Criteria

| Metric | Target | Measurement |
|---|---|---|
| Events detected at least 48h early | ≥ 50% of confirmed failures | `(detected_48h / total_confirmed) × 100` |
| Median lead time | ≥ 24 hours | Median of `t_confirmed - t_alert` |
| False alerts | < 1 per 10 pipe-months | `(false_alerts / total_pipe_months)` |
| Missed failures | Documented with reason | Each missed event explained |
| Evidence reproducibility | 100% deterministic | Same input → same output |
| Independence assessment accuracy | DWS-validated | DWS confirms EIS classification is correct |
| Provenance completeness | 100% of flagged events | All 11 fields populated |
| Zero Fabrication Rule | No fabricated data | All UNDEFINED values preserved |

## 5. What the Report Will Contain

```
Dataset:
- utility: [DWS / named municipality]
- DMA: [scope]
- period: [dates]
- sensor coverage: [percentage]

Failures:
- confirmed bursts: N
- eligible bursts: N (excluding those excluded for documented reasons)
- excluded bursts: N with reasons

HBK Mk-II:
- alerts at least 48 hours early: X/N
- median lead time: Y hours
- 25th-percentile lead time: Z hours
- false alerts: W per pipe-month
- missed failures: N

EIS v1.0:
- independence scores per event
- DWS-validated classification accuracy

Integrity:
- raw-data hash: ...
- failure-register hash: ...
- model commit: ...
- environment digest: ...
- feature cutoff test: PASS
- independent recomputation: PASS
```

## 6. What Happens If the Model Is Wrong

If HBK Mk-II flags an anomaly that DWS engineers identify as a false positive (e.g., a planned shutdown that wasn't in the context data):

1. The anomaly is marked as FALSE POSITIVE
2. The reason is documented (missing context data)
3. The operating-context data is updated
4. The anomaly is re-evaluated
5. If it no longer flags → the system correctly handles context correction

If HBK Mk-II misses a known failure:

1. The failure is added to the "missed" list
2. The time series around the missed failure is examined
3. DWS engineers advise whether the anomaly was visible in the raw data
4. If visible → model sensitivity issue → documented for model improvement
5. If not visible → sensor coverage issue → documented for sensor deployment recommendation

## 7. Termination Criteria

The protocol terminates when:
- All 4 phases are complete, OR
- DWS determines the model does not map correctly to their operational environment, OR
- 72 hours elapsed (whichever comes first)

**Either outcome is valid.** The purpose is to measure, not to prove success.
