# Artifact Audit

**Primary artifact set:** `amd-rocm-validation/pipeline/outputs/`  
**Comparison branches:** `mi300x-rocm-run-20260804`, `results/rocm-run-20260804-232342`, `results/rocm-run-20260804-185101`

## Result

**FAIL**

The primary output set is internally cross-referenced at a basic level, but it does not satisfy the IVE schema, deterministic-run, multi-run provenance, append-only-ledger, or complete checksum requirements.

## Producer map

| Artifact | Producer | Generation step |
|---|---|---|
| `results.json` | `run_pipeline.py` | After simulation, training, and benchmark |
| `metrics.json` | `run_pipeline.py` | Summary of accuracy, speedup, samples, ledger flag, Genesis flag |
| `system_info.json` | `run_pipeline.py` | Before simulation |
| `provenance.json` | `run_pipeline.py` | Config traversal |
| `ledger.json` | `run_pipeline.py` | Six-entry in-memory chain saved at run completion |
| `anomaly_model.pt` | `Trainer.train` | Rewritten whenever validation loss improves |
| `HBK_MKII_Submission_Report.md` | `generate_submission.py` | After reading generated JSON |
| `submission_data.json` | `generate_submission.py` | Report-package step |
| `manifest.json` | `generate_submission.py` | Before checksum generation |
| `checksums.txt` | `generate_submission.py` | Final package hashing step |

## Required artifact status

| Required artifact | Status |
|---|---|
| `results.json` | PRESENT, schema FAIL |
| `metrics.json` | PRESENT |
| `ledger.json` | PRESENT, semantics FAIL |
| `provenance.json` | PRESENT, incomplete |
| `submission_data.json` | PRESENT |
| `checksums.txt` | PRESENT, incomplete scope |
| `config.yaml` | PRESENT outside output manifest |
| `benchmark_results.json` | MISSING |
| `system_info.json` | PRESENT |
| PDF reports | MISSING |
| STEP export | MISSING |
| STL export | MISSING |
| KCL source hashes | MISSING |

## Frontend contract

Required:

```json
{
  "run_id": "...",
  "obligations": [],
  "telemetry": {},
  "trustSphere": {},
  "provenance_status": "...",
  "ledger_status": "..."
}
```

Committed `results.json` instead contains:

```text
simulation_meta
training
benchmark
```

Every required top-level field is missing. `/ive-output/results.json` cannot populate the declared IVE Zustand store from this artifact.

## Cross-file consistency

For the latest run, `metrics.json` agrees with `results.json`:

- Accuracy: `0.9997527689873418`
- Speedup: `4.249`
- Samples: `100000`
- Genesis used: `false`

`system_info.json` records `AMD Radeon Graphics`, ROCm `6.2.41133-dd7f95766`, PyTorch `2.5.1+rocm6.2`, and timestamp `2026-08-05T03:03:43.675869+00:00`.

The report accurately repeats the latest run's numeric metrics, but its executive summary claims MI300X training/simulation and Kria K26 inference, which are not supported by the latest `system_info.json`.

## Run chronology

| Relative order | Evidence timestamp | Branch/location | Device status |
|---:|---|---|---|
| Earliest listed candidate | REQUIRES VALIDATION from its artifact fields | `results/rocm-run-20260804-185101` | REQUIRES VALIDATION |
| Earlier confirmed | `2026-08-04T23:17:20.047192+00:00` ledger start | `results/rocm-run-20260804-232342` | Must be taken from that branch's `system_info.json` |
| Later confirmed | `2026-08-05T00:58:22.141848+00:00` | `mi300x-rocm-run-20260804` | AMD Radeon Graphics; branch name does not prove MI300X |
| Latest confirmed | `2026-08-05T03:03:43.675869+00:00` | primary branch outputs | AMD Radeon Graphics |

## Ledger findings

### Per-run structure

Each ledger has six entries:

1. config
2. system_info
3. simulation_meta
4. training_results
5. benchmark_results
6. verification

### Verification defect

`SHA256Ledger.verify()` checks only that each stored `chain_hash` from index 1 onward equals SHA-256 of the previous stored chain hash plus the current stored data hash. It does not:

- Recompute each `data_hash` from an external artifact.
- Validate the first entry's chain hash.
- Bind ledger entries to output file hashes.
- Authenticate the ledger root.
- Verify the final `verification` entry, because verification is calculated before that entry is appended.

The report statement that ledger verification proves records were not altered after generation is therefore unsupported.

### Append-only defect

The runtime creates a new empty ledger on every execution and overwrites `outputs/ledger.json`. Historical branches preserve separate snapshots, but the software does not implement an append-only multi-run ledger.

## Determinism findings

`run_pipeline.py` uses NumPy random generation, NumPy permutations, PyTorch random model initialization, dropout, shuffled DataLoaders, and backend operations without setting a seed. No `--seed` option exists. Committed runs show stable performance, but exact deterministic execution is not implemented.

## Provenance findings

`collect_provenance` records only dictionaries containing both `value` and `status`. The `kcl.geometry` configuration places `status: signed` on the geometry container rather than on individual `value` nodes. Consequently, no signed geometry values appear in `provenance.json`; it contains only ten unverified placeholders.

No run-level provenance fields exist for:

- Run ID.
- Environment variables actually used.
- Zoo API version.
- Source input hashes.
- Output hashes.
- CAD export hashes.

## Manifest and checksum findings

The manifest lists eight payload files. `checksums.txt` covers those eight plus `manifest.json`, producing nine hashes. `results_tampered.json` is intentionally excluded but remains in the same output directory.

The checksum envelope excludes:

- `config.yaml`
- Pipeline source
- Dependency lock or requirements
- Root README and architecture documents
- KCL source
- STEP/STL exports
- PDF reports
- Demo media
- `checksums.txt` itself, as expected for a terminal checksum file

## Authoritative versus obsolete versions

The primary branch output set is the most recent by embedded timestamps. It should not be merged field-by-field with earlier branches. Historical branches are independent run snapshots. None has a run ID, so branch and commit identity are currently required to distinguish them.

## Conclusion

Artifacts demonstrate multiple real executions, but the evidence package is not an IVE-compatible, deterministic, append-only, provenance-complete release package.
