# 72-Hour Validation Protocol + Data Requirements & Success Criteria

**Version:** 0.1 (Proposed)
**Date:** 2026-08-26
**Classification:** Proposed Protocol — Not Yet Executed

---

## Day 1: Ingestion (Hours 0–8)

- Import SCADA pressure + flow as CSV or database export
- Import failure register (confirmed-onset timestamps)
- Import asset metadata (pipe material, diameter, sensor locations)
- Import operating context (pump/valve schedules, planned shutdowns)
- Compute night-flow baselines per DMA

**Pass criterion:** All records imported, no data loss.

## Day 2: Detection + Assessment (Hours 8–24)

- Run anomaly detection + evidence correlation + EIS v1.0 against historical time series
- Compare flagged anomalies against the failure register
- Compute lead time for each matched event: `t_confirmed_onset - t_first_alert`
- Measure precision/recall of candidate zones
- DWS engineers review flagged anomalies — confirm which are true/false

**Pass criterion:** Match/no-match table produced. DWS confirms classification accuracy.

## Day 3: Audit + Reproducibility (Hours 24–72)

- Provenance audit: every flagged event has complete 11-field provenance
- Reproducibility check: same data → same result (deterministic)
- Success criteria review: measured vs target
- Generate validation report with all metrics

**Pass criterion:** 100% reproducible. All 11 provenance fields populated.

---

## Data Requirements (What DWS Provides)

| # | Category | Fields | Format |
|---|---|---|---|
| 1 | SCADA Pressure | timestamp, sensor ID, value (m), quality flags | CSV or DB export |
| 2 | SCADA Flow | timestamp, meter ID, value (L/s), quality flags | CSV or DB export |
| 3 | Failure Register | asset ID, failure type, reported/confirmed/isolation/repair times, coordinates/DMA | CSV or spreadsheet |
| 4 | Asset Metadata | pipe material, diameter, installation year, pressure zone, valve relationships, sensor locations | CSV or GIS |
| 5 | Operating Context | pump states, valve states, PRV settings, planned shutdowns, telemetry changes | Log or CSV |

Minimum: 1 DMA, 24+ months of data.

---

## Success Criteria

| Question | Target | Measurement |
|---|---|---|
| Does system reduce search area? | Yes | Narrows to DMA/segment |
| Does it distinguish valid/missing/anomalous/correlated/independent? | Yes | EIS v1.0 classification |
| Can engineer inspect why system believes claim? | Yes | Provenance drill-down |
| Reproducibility | 100% deterministic | Same input → same output |
| Events detected ≥48h early | ≥ 50% of confirmed failures | Count |
| Median lead time | ≥ 24 hours | Median of t_confirmed - t_alert |
| False alerts | < 1 per 10 pipe-months | Rate |
| Missed failures | Documented with reason | Each explained |
| Independence accuracy | DWS-validated | DWS confirms EIS classification |
| Provenance completeness | 100% of flagged events | All 11 fields |
| Zero Fabrication Rule | No fabricated data | All UNDEFINED preserved |

---

## What Happens If the Model Is Wrong

If the system flags a false positive:
1. Marked as FALSE POSITIVE
2. Reason documented (e.g., missing context data)
3. Operating-context data updated
4. Anomaly re-evaluated
5. If no longer flags → system correctly handles correction

If the system misses a known failure:
1. Added to "missed" list
2. Time series around the failure examined
3. DWS engineers advise whether anomaly was visible in raw data
4. If visible → model sensitivity issue → documented
5. If not visible → sensor coverage issue → documented

**Either outcome is valid. The purpose is to measure, not to prove success.**

---

## Termination Criteria

The protocol terminates when:
- All 3 phases complete, OR
- DWS determines the model does not map to their operational environment, OR
- 72 hours elapsed

---

## Removed for DWS Meeting

The following are NOT part of the DWS story:
- ❌ ANTPAY / subscription pricing
- ❌ Ubuntu Pools / Stokvel
- ❌ Game Room / marketplace
- ❌ Discord / social integrations
- ❌ Premium upsell / 24h free credits

The DWS story is: **evidence-verification layer for infrastructure observations**.
