# IVE Execution History

**Platform:** VVU Integrated Verification Environment (IVE)  
**Tagline:** Engineer systems that can prove themselves.  
**Demonstration application:** HBK MK-II Hydro-Gateway  
**Release context:** Zoo API Makeathon 2026 and AMD AI DevMaster Hackathon

## Provenance policy

Each execution is an independent validation run. Runs must not be merged, overwritten, or represented as one combined environment. A run is independently verifiable only when its immutable evidence directory or branch commit contains the required metadata and passes checksum and ledger validation.

The execution target, purpose, and completion state below are supplied release facts. Metadata not present in the active workspace is not fabricated.

## Run 01

| Field | Value |
|---|---|
| Run label | Run 01 |
| Run ID | **REQUIRES VALIDATION** |
| Timestamp | **REQUIRES VALIDATION** |
| Execution target | CPU |
| Purpose | Baseline deterministic execution |
| Status | Completed |
| Host | **REQUIRES VALIDATION** |
| Device | **REQUIRES VALIDATION** |
| Software versions | **REQUIRES VALIDATION** |
| Zoo API version | **REQUIRES VALIDATION** |
| Git commit | **REQUIRES VALIDATION** |
| Git branch | **REQUIRES VALIDATION** |
| Input hashes | **REQUIRES VALIDATION** |
| Output hashes | **REQUIRES VALIDATION** |
| Environment variables actually used | **REQUIRES VALIDATION** |
| Evidence branch/directory | **REQUIRES DECISION** |
| Metrics | **REQUIRES VALIDATION** |
| Ledger entries | **REQUIRES VALIDATION** |
| Provenance record | **REQUIRES VALIDATION** |

## Run 02

| Field | Value |
|---|---|
| Run label | Run 02 |
| Run ID | **REQUIRES VALIDATION** |
| Timestamp | **REQUIRES VALIDATION** |
| Execution target | ROCm GPU |
| Purpose | GPU acceleration validation |
| Status | Completed |
| Host | **REQUIRES VALIDATION** |
| Device | **REQUIRES VALIDATION** |
| Software versions | **REQUIRES VALIDATION** |
| Zoo API version | **REQUIRES VALIDATION** |
| Git commit | **REQUIRES VALIDATION** |
| Git branch | **REQUIRES VALIDATION** |
| Input hashes | **REQUIRES VALIDATION** |
| Output hashes | **REQUIRES VALIDATION** |
| Environment variables actually used | **REQUIRES VALIDATION** |
| Evidence branch/directory | **REQUIRES DECISION** |
| Metrics | **REQUIRES VALIDATION** |
| Ledger entries | **REQUIRES VALIDATION** |
| Provenance record | **REQUIRES VALIDATION** |

## Run 03

| Field | Value |
|---|---|
| Run label | Run 03 |
| Run ID | **REQUIRES VALIDATION** |
| Timestamp | **REQUIRES VALIDATION** |
| Execution target | AMD MI300X |
| Purpose | Large-scale accelerator validation and benchmark evidence |
| Status | Completed |
| Host | **REQUIRES VALIDATION** |
| Device | **REQUIRES VALIDATION** |
| Software versions | **REQUIRES VALIDATION** |
| Zoo API version | **REQUIRES VALIDATION** |
| Git commit | **REQUIRES VALIDATION** |
| Git branch | **REQUIRES VALIDATION** |
| Input hashes | **REQUIRES VALIDATION** |
| Output hashes | **REQUIRES VALIDATION** |
| Environment variables actually used | **REQUIRES VALIDATION** |
| Evidence branch/directory | **REQUIRES DECISION** |
| Metrics | **REQUIRES VALIDATION** |
| Ledger entries | **REQUIRES VALIDATION** |
| Provenance record | **REQUIRES VALIDATION** |

Run 03 must not inherit the hardware identity, metrics, timestamps, or hashes of Run 02 or Run 04. MI300X evidence must resolve to its own system-information and benchmark records.

## Run 04

| Field | Value |
|---|---|
| Run label | Run 04 |
| Run ID | **REQUIRES VALIDATION** |
| Timestamp | **REQUIRES VALIDATION** |
| Execution target | ROCm GPU |
| Purpose | Repeatability verification after MI300X validation |
| Status | Completed |
| Host | **REQUIRES VALIDATION** |
| Device | **REQUIRES VALIDATION** |
| Software versions | **REQUIRES VALIDATION** |
| Zoo API version | **REQUIRES VALIDATION** |
| Git commit | **REQUIRES VALIDATION** |
| Git branch | **REQUIRES VALIDATION** |
| Input hashes | **REQUIRES VALIDATION** |
| Output hashes | **REQUIRES VALIDATION** |
| Environment variables actually used | **REQUIRES VALIDATION** |
| Evidence branch/directory | **REQUIRES DECISION** |
| Metrics | **REQUIRES VALIDATION** |
| Ledger entries | **REQUIRES VALIDATION** |
| Provenance record | **REQUIRES VALIDATION** |

## Required release index

The final release must map every run to an immutable location without copying values between runs:

| Run | Required evidence |
|---|---|
| Run 01 | `results.json`, `metrics.json`, `benchmark_results.json`, `system_info.json`, `provenance.json`, run ledger entries, checksums, configuration hash, source commit |
| Run 02 | `results.json`, `metrics.json`, `benchmark_results.json`, `system_info.json`, `provenance.json`, run ledger entries, checksums, configuration hash, source commit |
| Run 03 | `results.json`, `metrics.json`, `benchmark_results.json`, `system_info.json`, `provenance.json`, run ledger entries, checksums, configuration hash, source commit |
| Run 04 | `results.json`, `metrics.json`, `benchmark_results.json`, `system_info.json`, `provenance.json`, run ledger entries, checksums, configuration hash, source commit |

## Frontend compatibility

The canonical dashboard endpoint remains:

```text
/ive-output/results.json
```

That file may summarize the release-selected run, but it must preserve its own `run_id` and must not silently merge metrics or metadata from the other runs. The complete run index remains separate evidence.

## Engineering status

All runs are software and evidence-runtime validation runs. They do not change the Hydro-Gateway engineering status.

**Engineering Release: BLOCKED**
