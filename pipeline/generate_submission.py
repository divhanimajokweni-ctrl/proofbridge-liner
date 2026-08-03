#!/usr/bin/env python3
"""
generate_submission.py — Submission Generator (HBK MK-II Hydro-Gateway)

Ingests results.json, system_info.json, metrics.json, provenance.json.
Generates: HBK_MKII_Submission_Report.md, submission_data.json,
checksums.txt, manifest.json.

PROVENANCE RULE: this script NEVER labels a value "Verified" unless its
provenance status in provenance.json is literally "signed". Anything else
(unverified_placeholder, unspecified) is rendered with an explicit
"⚠ UNVERIFIED" tag and its source note. No exceptions, no rounding up.
"""

import json
import hashlib
import datetime
from pathlib import Path
from typing import Dict, Any


def load_json(path: Path) -> Dict:
    with open(path, "r") as f:
        return json.load(f)


def status_badge(status: str) -> str:
    return {
        "signed": "✅ Verified",
        "unverified_placeholder": "⚠️ UNVERIFIED (placeholder)",
        "unspecified": "⚠️ UNVERIFIED (no provenance recorded)",
    }.get(status, f"⚠️ UNVERIFIED ({status})")


def provenance_row(provenance: Dict[str, Any], key: str, unit: str = "") -> str:
    entry = provenance.get(key)
    if entry is None:
        return f"| `{key}` | N/A | {unit} | ⚠️ NOT FOUND in provenance.json |"
    badge = status_badge(entry["status"])
    source = entry.get("source", "unspecified")
    return f"| `{key}` | {entry['value']} | {unit} | {badge} — {source} |"


REPORT_TEMPLATE = """# HBK MK-II Hydro-Gateway — Submission Report
**Version:** 2.1 (Provenance-Tracked, Dual-Benchmark)
**Date:** {timestamp}
**Competition:** Zoo Makeathon (Aug 5) | AMD Radeon Robotics Hackathon (Aug 6)
**Git Commit:** `{git_commit}` ({git_branch}{dirty_flag})
{pipeline_commit_note}

---

## 1. Executive Summary
Dual-tier compute (AMD Kria K26 edge inference + AMD MI300X training/simulation).
Measured this run: **{speedup}** ROCm speedup, **{accuracy}%** validation accuracy
on **synthetic** sensor data (see Section 4 for what "synthetic" means here).

**Read before citing this report externally:** any field below marked
⚠️ UNVERIFIED is a placeholder value, not a signed engineering input. Ledger
verification (Section 5) proves the record hasn't been tampered with after
generation — it does not certify that unverified values are correct.

---

## 2. Performance Metrics (Measured This Run)
| Metric | Value | Source |
| :--- | :--- | :--- |
| ROCm Speedup | {speedup} | `benchmark_results` in `results.json` |
| Validation Accuracy | {accuracy}% | `training.final_val_acc` in `results.json` |
| Simulation Samples | {samples:,} | `metrics.json` |
| Training Time | {train_time}s | `results.json` |
| Physics Engine | {physics_engine} | `simulation_meta` in `results.json` |

### Environment
| GPU: {gpu_name} | ROCm: {rocm_ver} | PyTorch: {torch_ver}
- OS: {os_ver}

---

## 2b. Dual Benchmark Strategy (AMD Hackathon)

To demonstrate the value of AMD acceleration, the same pipeline should be
run twice — once on CPU (baseline) and once on AMD GPU (accelerated) —
with **identical** workflow, provenance, and ledger guarantees.

| Run | Compute | Purpose | Command |
| :--- | :--- | :--- | :--- |
| **Baseline** | CPU | Correctness + reproducibility | `python3 run_pipeline.py --mode full --no-gpu` |
| **Accelerated** | AMD GPU (ROCm) | Performance gains on AMD hardware | `python3 run_pipeline.py --mode full` |

{baseline_results}

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

{engineering_rows}

---

## 4. What "Synthetic Data" Means Here
Sensor data (pressure, temperature, flow, acoustic signature) used for
training is generated numerically from the config values in Section 3, not
sampled from physical instrumentation on a built unit. Genesis GPU physics
scene was {genesis_used} for this run. This is appropriate for demonstrating
the anomaly-detection approach; it is not evidence of real-world sensor
performance.

---

## 5. Ledger Verification
- Chain integrity: {ledger_status}
- Entries: {ledger_count}
- **Scope of this guarantee:** proves the recorded entries have not been
  altered after the fact. It does **not** validate that any underlying
  number is engineering-correct — see Section 3 for that.

---

## 6. Deliverables
- Code: `run_pipeline.py`, `generate_submission.py`
- Config: `config.yaml` (provenance-tagged engineering values)
- Model: `{model_file}`
- Ledger: `ledger.json` ({ledger_count} entries)
- Provenance manifest: `provenance.json`
- Metrics: `metrics.json`
- Checksums: `checksums.txt` (SHA-256, {checksum_count} files verified)

*Generated {gen_time}*
"""


def main():
    output_dir = Path("outputs")
    required = ["results.json", "system_info.json", "metrics.json", "provenance.json"]
    missing = [f for f in required if not (output_dir / f).exists()]
    if missing:
        print(f"❌ Missing required artifacts: {missing}. Run run_pipeline.py first.")
        return 1

    results = load_json(output_dir / "results.json")
    sys_info = load_json(output_dir / "system_info.json")
    metrics = load_json(output_dir / "metrics.json")
    provenance = load_json(output_dir / "provenance.json")
    ledger = load_json(output_dir / "ledger.json")

    engineering_keys_units = [
        ("kcl.pressure_system.design_pressure_bar", "bar"),
        ("kcl.pressure_system.mop_bar", "bar"),
        ("kcl.pressure_system.temp_min_c", "°C"),
        ("kcl.pressure_system.temp_max_c", "°C"),
        ("kcl.pressure_system.corrosion_allowance_mm", "mm"),
        ("kcl.materials.pipe", "-"),
        ("kcl.materials.flange", "-"),
        ("kcl.materials.base_plate", "-"),
        ("safety.temp_cutoff_c", "°C"),
        ("safety.inference_latency_target_ms", "ms"),
    ]
    engineering_rows = "| Parameter | Value | Unit | Status |\n| :--- | :--- | :--- | :--- |\n"
    engineering_rows += "\n".join(
        provenance_row(provenance, k, u) for k, u in engineering_keys_units
    )

    # Override git info with current HEAD at report generation time
    # (the report should reference the commit that contains it)
    git_info = sys_info.get("git", {})
    try:
        import subprocess
        head_commit = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL
        ).decode().strip()
        head_branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], stderr=subprocess.DEVNULL
        ).decode().strip()
        is_dirty = bool(subprocess.check_output(
            ["git", "status", "--porcelain"], stderr=subprocess.DEVNULL
        ).decode().strip())
        git_info = {
            "commit": head_commit,
            "branch": head_branch,
            "is_dirty": is_dirty,
            "pipeline_run_commit": sys_info.get("git", {}).get("commit", "unknown"),
        }
    except Exception:
        pass  # fall back to system_info.json git data
    speedup_val = metrics.get("speedup")
    speedup_display = f"{speedup_val}x" if speedup_val is not None else "N/A (CPU-only)"
    gpu_info = sys_info["gpu"]
    gpu_name = gpu_info["name"]
    gpu_count = gpu_info["count"]
    gpu_display = f"{gpu_name} ({gpu_count}x)" if gpu_info.get("available") else "CPU-only (no ROCm GPU)"

    # Build pipeline commit note
    pipeline_run_commit = git_info.get("pipeline_run_commit", "")
    if pipeline_run_commit and pipeline_run_commit != git_info.get("commit", ""):
        pipeline_commit_note = f"\n**Pipeline executed at:** `{pipeline_run_commit[:12]}` (report generated from a later commit containing the outputs)"
    else:
        pipeline_commit_note = ""

    # Build baseline results section
    benchmark = results.get("benchmark", {})
    cpu_time = benchmark.get("cpu_time_s")
    gpu_time = benchmark.get("gpu_time_s")
    if gpu_time is not None:
        baseline_results = (
            f"### Current Run Results\n"
            f"| Metric | CPU (Baseline) | AMD GPU (Accelerated) |\n"
            f"| :--- | :--- | :--- |\n"
            f"| Benchmark Time | {cpu_time:.3f}s | {gpu_time:.3f}s |\n"
            f"| Speedup | 1.0x (reference) | {benchmark.get('speedup_factor', 'N/A')}x |"
        )
    else:
        baseline_results = (
            f"### Current Run Results (CPU Baseline Only)\n"
            f"| Metric | Value |\n"
            f"| :--- | :--- |\n"
            f"| CPU Benchmark Time | {cpu_time:.3f}s |\n"
            f"| AMD GPU Benchmark | ⏳ Pending — run on ROCm hardware for accelerated results |"
        )

    report = REPORT_TEMPLATE.format(
        timestamp=datetime.datetime.now().strftime("%B %d, %Y"),
        git_commit=git_info.get("commit", "unknown")[:12],
        git_branch=git_info.get("branch", "unknown"),
        dirty_flag=" [DIRTY]" if git_info.get("is_dirty") else "",
        pipeline_commit_note=pipeline_commit_note,
        speedup=speedup_display,
        accuracy=round(metrics.get("accuracy", 0.0) * 100, 2),
        samples=metrics.get("samples", 0),
        train_time=round(results.get("training", {}).get("train_time_s", 0.0), 2),
        physics_engine="Genesis (GPU)" if metrics.get("used_genesis_physics") else "synthetic (numpy, no physics engine)",
        gpu_name=gpu_display,
        gpu_count=gpu_count,
        rocm_ver=gpu_info.get("rocm_version", "N/A") or "N/A",
        torch_ver=gpu_info.get("torch_version", "N/A"),
        os_ver=f"{sys_info['platform']['system']} {sys_info['platform']['release']}",
        baseline_results=baseline_results,
        engineering_rows=engineering_rows,
        genesis_used="used" if metrics.get("used_genesis_physics") else "NOT used (Genesis unavailable — synthetic fallback)",
        ledger_status="✅ PASS" if metrics.get("ledger_chain_valid") else "❌ FAIL",
        ledger_count=len(ledger),
        model_file="anomaly_model.pt",
        checksum_count=len([f for f in output_dir.iterdir()
                           if f.is_file() and f.name not in ("checksums.txt",)
                           and not f.name.endswith("_tampered.json")]),
        gen_time=datetime.datetime.now().isoformat(),
    )

    (output_dir / "HBK_MKII_Submission_Report.md").write_text(report)

    # submission_data.json — machine-readable, same provenance discipline
    submission_data = {
        "metrics": metrics,
        "engineering_specs": {
            k: {"value": v["value"], "status": v["status"], "source": v.get("source")}
            for k, v in provenance.items()
        },
        "git": git_info,
        "ledger_valid": metrics.get("ledger_chain_valid"),
    }
    with open(output_dir / "submission_data.json", "w") as f:
        json.dump(submission_data, f, indent=2, default=str)

    # manifest first (so its hash is included in checksums)
    artifact_names = [f.name for f in sorted(output_dir.iterdir())
                      if f.is_file() and f.name not in ("checksums.txt", "manifest.json")
                      and not f.name.endswith("_tampered.json")]
    manifest = {"generated": datetime.datetime.now().isoformat(), "files": artifact_names}
    with open(output_dir / "manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

    # checksums — includes fresh manifest.json, excludes tampered demo artifacts
    checksums = {}
    for f in sorted(output_dir.iterdir()):
        if f.is_file() and f.name not in ("checksums.txt",) and not f.name.endswith("_tampered.json"):
            checksums[f.name] = hashlib.sha256(f.read_bytes()).hexdigest()
    (output_dir / "checksums.txt").write_text(
        "\n".join(f"{h}  {name}" for name, h in checksums.items())
    )

    print("✅ Submission artifacts generated:")
    print(f"   - {output_dir / 'HBK_MKII_Submission_Report.md'}")
    print(f"   - {output_dir / 'submission_data.json'}")
    print(f"   - {output_dir / 'checksums.txt'}")
    unverified_count = sum(1 for v in provenance.values() if v["status"] != "signed")
    print(f"   ⚠️  {unverified_count} engineering values are UNVERIFIED in this report.")
    return 0


if __name__ == "__main__":
    exit(main())
