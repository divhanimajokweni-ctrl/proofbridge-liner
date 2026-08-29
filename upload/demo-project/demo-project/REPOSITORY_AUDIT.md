# Repository Audit

**Audit target:** `amd-rocm-validation`  
**Historical comparisons:** `mi300x-rocm-run-20260804`, `results/rocm-run-20260804-232342`, `results/rocm-run-20260804-185101`  
**Audit date:** August 5, 2026  
**Method:** Direct repository and generated-artifact inspection; branch names were not accepted as proof of execution environment.

## Result

**FAIL**

The repository contains a substantial TypeScript evidence runtime and a Python HBK anomaly-detection pipeline, but the primary submission branch is not presented as the frozen VVU Integrated Verification Environment product. The committed pipeline does not satisfy the IVE frontend result contract, does not implement deterministic seeding, recreates rather than appends its ledger, and does not contain the authoritative `cad/` submission directory.

## Repository evidence

The primary branch contains a large multi-product repository with directories including `src/`, `public/`, `_app_legacy/`, `active/`, `pipeline/`, `prover/`, `products/proofbridge/`, `evidence/`, and numerous architecture and infrastructure documents. The root README identifies the repository as `proofbridge-liner` and describes `Epistemic Runtime (ER) — Autonomous Infrastructure Runtime & Trust Gateway`, not VVU Integrated Verification Environment.

The pipeline directory contains:

- `compute_provider.py`
- `config.yaml`
- `generate_submission.py`
- `requirements.txt`
- `run_pipeline.py`
- `outputs/`

## Build and execution findings

| Check | Result | Repository evidence |
|---|---|---|
| Python pipeline source exists | PASS | `pipeline/run_pipeline.py` and declared Python dependencies are present. |
| Generated pipeline outputs exist | PASS | Results, metrics, system information, ledger, provenance, model, manifest, checksums, report, and submission data are committed. |
| Fresh pipeline execution during this audit | REQUIRES VALIDATION | Remote repository inspection cannot execute the code. |
| TypeScript application build | REQUIRES VALIDATION | A large application source tree is present, but no clean checkout/build log was produced by this audit. |
| Root README matches frozen product | FAIL | Root README describes Epistemic Runtime, not VVU IVE. |
| Frontend result contract | FAIL | Committed `results.json` contains only `simulation_meta`, `training`, and `benchmark`. |
| Deterministic pipeline controls | FAIL | No seed option or random-state initialization exists in `run_pipeline.py`. |
| Append-only multi-run ledger | FAIL | Every invocation creates `SHA256Ledger()` with an empty list and overwrites `outputs/ledger.json`. |
| Canonical run ID | FAIL | Generated results, metrics, ledger, provenance, and system information contain no common `run_id`. |
| Authoritative CAD directory on primary branch | FAIL | No root `cad/` directory is present in the primary branch tree. |

## Execution history derived from artifacts

### Latest inspected run

The latest directly evidenced run starts at `2026-08-05T03:03:43.675869+00:00` in `pipeline/outputs/system_info.json`. Its ledger starts at `2026-08-05T03:03:43.809293+00:00`, training completes before the benchmark ledger entry at `2026-08-05T03:04:32.534786+00:00`, and its manifest is generated at `2026-08-05T03:05:38.010136`.

Environment:

- GPU: `AMD Radeon Graphics`
- ROCm: `6.2.41133-dd7f95766`
- PyTorch: `2.5.1+rocm6.2`
- Git commit recorded by execution: `6ae853b3a7962c041e8e0777ff52f105fb9aee10`
- Git branch recorded by execution: `main`

Metrics:

- Samples: 100,000
- Accuracy: 0.9997527689873418
- Benchmark speedup: 4.249
- Genesis physics: false

### Earlier inspected run

The branch named `mi300x-rocm-run-20260804` contains a run beginning at `2026-08-05T00:58:22.141848+00:00`. Its recorded device is also `AMD Radeon Graphics`, not MI300X. The branch name therefore does not prove an MI300X execution.

Metrics:

- Samples: 100,000
- Accuracy: 0.9998516613924051
- Benchmark speedup: 3.132
- Genesis physics: false

### Earlier historical run

The branch `results/rocm-run-20260804-232342` contains a ledger beginning at `2026-08-04T23:17:20.047192+00:00` and a training-result entry at `2026-08-04T23:20:25.841184+00:00`. Its exact compute-device classification must be taken from that branch's `system_info.json`; the branch name alone is not accepted.

### Oldest listed historical branch

The branch `results/rocm-run-20260804-185101` contains its own outputs, checksums, ledger, metrics, results, and system information. Exact ordering relative to other runs requires its artifact timestamps; the audit does not infer ordering solely from the branch name.

## Critical inconsistencies

1. **Product identity mismatch:** the root README is for Epistemic Runtime, not VVU IVE.
2. **Pipeline/application disconnect:** the Python pipeline produces anomaly-training artifacts, not the required proof-obligation dashboard schema.
3. **No deterministic seed:** NumPy, PyTorch, DataLoader shuffling, dropout, model initialization, and dataset splits are uncontrolled.
4. **No run ID:** artifacts cannot be joined safely across branches or directories.
5. **No append-only aggregate ledger:** each run starts a new six-entry ledger and overwrites the current output file.
6. **No `benchmark_results.json`:** benchmark data are nested in `results.json`, contrary to the required deliverable list.
7. **No CAD in the primary branch:** the local validated CAD project is not the audited GitHub submission branch.
8. **Unimplemented cloud provider:** `AMDCloudProvider` raises `NotImplementedError` for submission, status, result retrieval, and cancellation.
9. **Tampered result fixture in output folder:** `results_tampered.json` is committed next to release artifacts, though excluded from the manifest and checksum generation.
10. **Root branch versus execution branch mismatch:** committed outputs in `amd-rocm-validation` record execution on `main` at commit `6ae853b3a796...`.

## Prohibited wording search

The inspected generated report does not use the exact phrases `SAFE_FOR_DEPLOYMENT`, `System safe`, `Engineering certified`, `Physically validated`, or `FEA verified`. However it claims that ledger verification proves the record has not been altered after generation, which exceeds what the implemented verification function establishes.

## Conclusion

The repository demonstrates real code and multiple committed execution artifacts, but the submission branch does not currently form one coherent VVU IVE release candidate.
