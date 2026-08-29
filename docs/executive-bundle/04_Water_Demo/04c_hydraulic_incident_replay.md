# Hydraulic Incident Replay Script

**Date:** 2026-08-26
**Classification:** SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA

---

## Replay Sequence (10 Steps)

### BASELINE
| TIME | FLOW | PRESSURE |
|---|---|---|
| 00:00 | 102 L/s | 48.2 m |
| 01:00 | 98 L/s | 48.5 m |
| 02:00 | 97 L/s | 48.4 m |
| 03:00 | 96 L/s | 48.6 m |

### INTRODUCE ANOMALY
| TIME | FLOW | PRESSURE |
|---|---|---|
| 04:00 | 111 L/s | 46.1 m |
| 05:00 | 114 L/s | 45.7 m |
| 06:00 | 116 L/s | 45.4 m |

**System:** Flow up + Pressure down vs baseline → anomaly detected

### ADD FIELD
Ground moisture report at segment X

### ADD ACOUSTIC
Abnormal acoustic signal at segment X

### CORRELATE
Candidate leak zone narrowed

### EIS
3 independent sources vs 1 correlated
Score: 0.3 + 0.2 + 0.5 = 1.0 → VERIFIED_CANDIDATE

### GENERATE CLAIM
"Potential underground leakage Zone X"

### VERIFY
Simulated field confirm/reject

### AUDIT
Provenance chain drill-down (11 fields per observation)

---

## Data Label
Every input: **SIMULATION — NOT MUNICIPAL OPERATIONAL DATA**

## Physical Rig (if available)
Reservoir → Pump → Flow sensor → Pressure sensor → Leak valve → Drain
