# Water Infrastructure Evidence & Leakage Validation Brief

**Date:** 2026-08-26
**Classification:** SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA
**Priority:** MOST IMPORTANT DOCUMENT FOR DWS MEETING

---

## The Chain

```
Municipal water network
  → sparse observations
  → anomaly detection
  → evidence correlation
  → independent evidence assessment
  → location/claim
  → verification
  → maintenance decision
  → auditable evidence record
```

---

## Hydraulic Incident Replay — What You Will Demo Live

### BASELINE — Stable Profile

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

**System:** Flow increased while pressure decreased vs baseline.

### ADD FIELD EVIDENCE

Technician reports persistent ground moisture at segment S-142.

### ADD ACOUSTIC

Acoustic observation detects abnormal signal at segment S-142.

### CORRELATE

```
FLOW ANOMALY
 ├── Pressure anomaly
 ├── Field observation
 └── Acoustic observation
        ↓
  Evidence correlation
        ↓
  Candidate leak zone
        ↓
  Field verification
        ↓
  VERIFIED / REJECTED
```

### ASSESS INDEPENDENCE

EIS v1.0 calculation: 3 independent sources (flow, field, acoustic) vs 1 correlated source (pressure — same DMA as flow).

Score: 0.3 (PRIMARY) + 0.2 (CORRELATED) + 0.4 (INDEPENDENT) = **0.9 → VERIFIED_CANDIDATE**

### GENERATE CLAIM

"Potential underground leakage event — Zone S-142, DMA-7"

### VERIFY

Simulated field confirmation: technician dispatched, leak confirmed at pipe joint.

### AUDIT — Complete Provenance Trail

```
Claim
 ├── Observation
 │    ├── Sensor + Firmware + Calibration epoch
 │    ├── Timestamp + Location + Environmental context
 ├── Processing
 ├── Corroborating evidence
 └── Verification result
```

### DATA LABEL

Every input in the demo is labelled: **SIMULATION — NOT MUNICIPAL OPERATIONAL DATA**

---

## How to Run the Demo

### Option 1: Interactive HTML (browser)

Open: `http://localhost:3000/vvu-dws-hydraulic-incident.html`

Press the 10 buttons in sequence:
1. BASELINE
2. INTRODUCE ANOMALY
3. ADD FIELD EVIDENCE
4. ADD ACOUSTIC EVIDENCE
5. CHECK OPERATIONAL CONTEXT
6. CORRELATE
7. ASSESS INDEPENDENCE
8. GENERATE CLAIM
9. VERIFY
10. AUDIT

### Option 2: Sandbox Pipeline (terminal)

```bash
cd /sandbox
./setup.sh
cd pipeline
./run.sh
```

The terminal output shows EIS v1.0 logic executing:
- Flow anomaly detected
- Pressure drop correlated
- Pump schedules checked (no correlation)
- Acoustic field report aligned
- Evidence compiled → audit trail saved to /evidence/

### Option 3: EIS Workspace (React)

Open: Data Room → Evidence Analysis activity

- DMA Calibration Panel: adjust thresholds live
- Watch verdict change in real time
- Export Audit Receipt (SHA-256 hashed JSON)

---

## What DWS Engineers Should Challenge

1. **Is the anomaly signature correct?** Does flow-up + pressure-down actually indicate a leak in your experience?
2. **Is the independence classification correct?** Would you classify a pressure sensor on the same DMA as correlated, not independent?
3. **Is the calibration range appropriate?** Should the flow threshold be 5% for residential, 15% for industrial?
4. **What would you add?** What evidence type is missing that DWS engineers rely on?
5. **What would you remove?** Is any evidence type in the demo not actually used in practice?

---

## Practical Experience Statement

> "I haven't operated a municipal water network myself. My practical experience is on the systems-engineering and software side. I built IVE to address an evidence and verification problem, and I'm here to test whether the assumptions we've encoded correspond to how DWS and municipalities actually observe, diagnose, and verify infrastructure problems. Correct where the model is wrong."
