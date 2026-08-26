# Field Evidence Demonstration Record

**Date:** 2026-08-26
**Classification:** REAL photographs — NOT water-infrastructure specific

---

## What the Field Photos Show

Four photographs taken at an active South African construction/demolition site, captured informally on a phone camera and shared via WhatsApp. They are not lab data. They are not synthetic test vectors. They are the exact class of sparse, noisy, uncalibrated, real-world evidence that the VVU IVE platform was built to ingest and keep honest.

### Photo FE-01
Demolition rubble pile — unsorted material awaiting classification.

### Photo FE-02
Excavated trench with caution tape — spatial edge case for GIS overlay.

### Photo FE-03
Same trench, alternate angle — evidence-chain consistency check.

### Photo FE-04
Stylized shadow on pavement — photographic provenance / capture-epoch test.

---

## How These Photos Demonstrate the Evidence Workflow

1. **Physical event** → phone camera captures (sensor = phone, firmware = camera app, calibration = uncalibrated)
2. **Transport** → WhatsApp (lossy, compressed, metadata-stripped)
3. **Ingestion** → substrate-agnostic router classifies as "light-change event"
4. **Evidence** → ProofBridge hashes the observation, creates MMR leaf
5. **Provenance** → 11-field spine applied (most fields UNDEFINED — Zero Fabrication Rule)
6. **Governance** → IVE marks as CONJECTURE until re-captured with calibrated sensor + attestation

---

## Physical Rig (If Brought to DWS)

If a small hydraulic rig is brought to the meeting:

```
Reservoir
  ↓
Pump
  ↓
Flow sensor
  ↓
Pressure sensor
  ↓
T-piece
  ├── Leak valve (closed = baseline)
  └── Drain
```

1. Run with leak **closed** → baseline flow/pressure
2. **Open** the leak valve → physical event
3. Sensor observes change → ingestion → anomaly → evidence record → decision

This proves understanding of the physical workflow: physical event → sensor observation → ingestion → anomaly → evidence record → decision.

---

## What This Proves to DWS

The field photos and the physical rig demonstrate that VVU understands:
- Real-world observations are sparse, noisy, and uncalibrated
- Not all observations are equal (quality flags, independence)
- Evidence must be tracked from capture to verification
- Missing data must be flagged, not fabricated
- The system sits around the operational environment, it does not replace it
