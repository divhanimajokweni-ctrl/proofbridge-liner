# Data Requirements for DWS Validation

**Version:** 0.1 (Proposed)
**Date:** 2026-08-26

---

## Data Needed from DWS

| Category | Fields | Purpose |
|---|---|---|
| Flow | timestamp, meter ID, value (L/s), quality flags | Anomaly detection |
| Pressure | timestamp, sensor ID, value (m), quality flags | Anomaly detection |
| Reservoir level | timestamp, sensor ID, value (m) | Context |
| Pump/Valve status | timestamp, asset ID, state | Operating context |
| DMA inflow | timestamp, bulk meter, value (L/s) | Water balance |
| Minimum night flow | time series (02:00-04:00) | Baseline computation |
| Known leak events | asset ID, failure type, location, verification result | Validation ground truth |
| Contextual | rainfall, temperature, power interruptions | False-positive suppression |

---

## Success Criteria

| Question | Target |
|---|---|
| Does system reduce search area? | Yes — narrows to DMA/segment |
| Distinguish valid/missing/anomalous/correlated/independent? | Yes — EIS v1.0 |
| Can engineer inspect why system believes claim? | Yes — provenance drill-down |
| Can result be reproduced via pipeline? | Yes — deterministic |
| False alert rate | < 1 per 10 pipe-months |
| Lead time | ≥ 48 hours before confirmed onset |
