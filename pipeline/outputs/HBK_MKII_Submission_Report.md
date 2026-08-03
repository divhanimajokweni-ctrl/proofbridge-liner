# HBK MK-II Hydro-Gateway — Submission Report
**Version:** 2.0 (Provenance-Tracked)
**Date:** August 03, 2026
**Competition:** Zoo Makeathon (Aug 5) | AMD Radeon Robotics Hackathon (Aug 6)
**Git Commit:** `c71452f8785f` (main)

---

## 1. Executive Summary
Dual-tier compute (AMD Kria K26 edge inference + AMD MI300X training/simulation).
Measured this run: **N/A (CPU-only)** ROCm speedup, **99.2%** validation accuracy
on **synthetic** sensor data (see Section 4 for what "synthetic" means here).

**Read before citing this report externally:** any field below marked
⚠️ UNVERIFIED is a placeholder value, not a signed engineering input. Ledger
verification (Section 5) proves the record hasn't been tampered with after
generation — it does not certify that unverified values are correct.

---

## 2. Performance Metrics (Measured This Run)
| Metric | Value | Source |
| :--- | :--- | :--- |
| ROCm Speedup | N/A (CPU-only) | `benchmark_results` in `results.json` |
| Validation Accuracy | 99.2% | `training.final_val_acc` in `results.json` |
| Simulation Samples | 10,000 | `metrics.json` |
| Training Time | 13.84s | `results.json` |
| Physics Engine | synthetic (numpy, no physics engine) | `simulation_meta` in `results.json` |

### Environment
| GPU: CPU-only (no ROCm GPU) | ROCm: N/A | PyTorch: 2.13.0+cpu
- OS: Linux 5.10.134-013.8.3.kangaroo.al8.x86_64

---

## 3. Engineering Specifications — Provenance-Tagged

**None of the values in this section have been certified by process,
materials, or controls & safety engineering as of report generation,
unless explicitly marked ✅ Verified below.**

| Parameter | Value | Unit | Status |
| :--- | :--- | :--- | :--- |
| `kcl.pressure_system.design_pressure_bar` | 25.0 | bar | ⚠️ UNVERIFIED (placeholder) — engineering estimate — not signed off, see HYDRO_GATEWAY_VALIDATION.md Section 1 |
| `kcl.pressure_system.mop_bar` | 37.5 | bar | ⚠️ UNVERIFIED (placeholder) — engineering estimate — not signed off |
| `kcl.pressure_system.temp_min_c` | -20.0 | °C | ⚠️ UNVERIFIED (placeholder) — unspecified |
| `kcl.pressure_system.temp_max_c` | 65.0 | °C | ⚠️ UNVERIFIED (placeholder) — unspecified |
| `kcl.pressure_system.corrosion_allowance_mm` | 10.0 | mm | ⚠️ UNVERIFIED (placeholder) — unspecified |
| `kcl.materials.pipe` | SANS 35S (STS2) | - | ⚠️ UNVERIFIED (placeholder) — not signed off by materials engineering |
| `kcl.materials.flange` | SANS 1123 Table 1600, PN25 | - | ⚠️ UNVERIFIED (placeholder) — unspecified |
| `kcl.materials.base_plate` | 5052-H32 Aluminum | - | ⚠️ UNVERIFIED (placeholder) — unspecified |
| `safety.temp_cutoff_c` | 85.0 | °C | ⚠️ UNVERIFIED (placeholder) — not confirmed by Controls & Safety — see action item 7 in validation report |
| `safety.inference_latency_target_ms` | 2.1 | ms | ⚠️ UNVERIFIED (placeholder) — unspecified |

---

## 4. What "Synthetic Data" Means Here
Sensor data (pressure, temperature, flow, acoustic signature) used for
training is generated numerically from the config values in Section 3, not
sampled from physical instrumentation on a built unit. Genesis GPU physics
scene was NOT used (Genesis unavailable — synthetic fallback) for this run. This is appropriate for demonstrating
the anomaly-detection approach; it is not evidence of real-world sensor
performance.

---

## 5. Ledger Verification
- Chain integrity: ✅ PASS
- Entries: 6
- **Scope of this guarantee:** proves the recorded entries have not been
  altered after the fact. It does **not** validate that any underlying
  number is engineering-correct — see Section 3 for that.

---

## 6. Deliverables
- Code: `run_pipeline.py`, `generate_submission.py`
- Model: `anomaly_model.pt`
- Ledger: `ledger.json` (6 entries)
- Provenance manifest: `provenance.json`
- Metrics: `metrics.json`

*Generated 2026-08-03T19:49:28.710533*
