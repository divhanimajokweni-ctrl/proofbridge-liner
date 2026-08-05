# HBK MK-II Hydro-Gateway — Submission Report
**Version:** 2.1 (Provenance-Tracked, Dual-Benchmark)
**Date:** August 05, 2026
**Competition:** Zoo Makeathon (Aug 5) | AMD Radeon Robotics Hackathon (Aug 6)
**Git Commit:** `6ae853b3a796` (main [DIRTY])


---

## 1. Executive Summary
Dual-tier compute (AMD Kria K26 edge inference + AMD MI300X training/simulation).
Measured this run: **4.249x** ROCm speedup, **99.98%** validation accuracy
on **synthetic** sensor data (see Section 4 for what "synthetic" means here).

**Read before citing this report externally:** any field below marked
⚠️ UNVERIFIED is a placeholder value, not a signed engineering input. Ledger
verification (Section 5) proves the record hasn't been tampered with after
generation — it does not certify that unverified values are correct.

---

## 2. Performance Metrics (Measured This Run)
| Metric | Value | Source |
| :--- | :--- | :--- |
| ROCm Speedup | 4.249x | `benchmark_results` in `results.json` |
| Validation Accuracy | 99.98% | `training.final_val_acc` in `results.json` |
| Simulation Samples | 100,000 | `metrics.json` |
| Training Time | 45.65s | `results.json` |
| Physics Engine | synthetic (numpy, no physics engine) | `simulation_meta` in `results.json` |

### Environment
| GPU: AMD Radeon Graphics (1x) | ROCm: 6.2.41133-dd7f95766 | PyTorch: 2.5.1+rocm6.2
- OS: Linux 6.8.0-79-generic

---

## 2b. Dual Benchmark Strategy (AMD Hackathon)

To demonstrate the value of AMD acceleration, the same pipeline should be
run twice — once on CPU (baseline) and once on AMD GPU (accelerated) —
with **identical** workflow, provenance, and ledger guarantees.

| Run | Compute | Purpose | Command |
| :--- | :--- | :--- | :--- |
| **Baseline** | CPU | Correctness + reproducibility | `python3 run_pipeline.py --mode full --no-gpu` |
| **Accelerated** | AMD GPU (ROCm) | Performance gains on AMD hardware | `python3 run_pipeline.py --mode full` |

### Current Run Results
| Metric | CPU (Baseline) | AMD GPU (Accelerated) |
| :--- | :--- | :--- |
| Benchmark Time | 1.027s | 0.242s |
| Speedup | 1.0x (reference) | 4.249x |

**What makes this compelling for judges:**
1. Identical workflow (`run_pipeline.py`).
2. Identical provenance and ledger guarantees.
3. Identical output format (`results.json`, `ledger.json`, `checksums.txt`).
4. The only variable is the compute backend (CPU → AMD).
5. Measured performance improvement (speedup factor) when AMD GPU is available.

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
- Config: `config.yaml` (provenance-tagged engineering values)
- Model: `anomaly_model.pt`
- Ledger: `ledger.json` (6 entries)
- Provenance manifest: `provenance.json`
- Metrics: `metrics.json`
- Checksums: `checksums.txt` (SHA-256, 9 files verified)

*Generated 2026-08-05T03:05:38.009688*
