# Artifact Consistency Audit — RC1

**Platform:** VVU Integrated Verification Environment (IVE)  
**Demonstration application:** HBK MK-II Hydro-Gateway  
**Audit date:** August 5, 2026

## Result

**FAIL — NOT INDEPENDENTLY VERIFIABLE**

The supplied filenames and checksum inventory are internally plausible, but the JSON artifacts and model binary could not be parsed directly by the available audit tooling. Hash values were supplied, but their correspondence to the attached bytes could not be independently recomputed in this audit. Multiple result candidates and duplicate archives create source-of-truth ambiguity.

## Supplied evidence inventory

The attachment set includes:

- `results.json`
- `results-1.json`
- `results_tampered.json`
- `metrics.json`
- `ledger.json`
- `provenance.json`
- `manifest.json`
- `submission_data.json`
- `system_info.json`
- `anomaly_model.pt`
- `checksums.txt`
- `config.yaml`
- `HBK_MKII_Submission_Report.md`

The JSON and PyTorch artifacts were not directly parseable by the available audit tooling. The audit therefore relies on the report, filename inventory, checksums file, execution evidence previously supplied, and documented relationships.

## Checksum inventory

`checksums.txt` contains nine SHA-256 entries:

| Artifact | SHA-256 present |
|---|---:|
| `HBK_MKII_Submission_Report.md` | YES |
| `anomaly_model.pt` | YES |
| `ledger.json` | YES |
| `manifest.json` | YES |
| `metrics.json` | YES |
| `provenance.json` | YES |
| `results.json` | YES |
| `submission_data.json` | YES |
| `system_info.json` | YES |

This matches the submission report statement that nine files are covered. It does not establish that the supplied bytes match the listed hashes; that step remains unverified in this audit environment.

## Cross-reference checks

| Relationship | Result | Finding |
|---|---|---|
| Report says nine files are checksummed | NOMINAL MATCH | Nine entries are present in `checksums.txt`. |
| Report says ledger has six entries | REQUIRES VALIDATION | `ledger.json` could not be parsed. |
| Report says speedup is 3.132x | REQUIRES VALIDATION | `results.json` and `metrics.json` could not be parsed. |
| Report says accuracy is 99.99% | REQUIRES VALIDATION | Source fields could not be inspected. |
| Report says 100,000 samples | REQUIRES VALIDATION | Source metrics could not be inspected. |
| Report says Genesis was unavailable | REQUIRES VALIDATION | `simulation_meta` could not be inspected; execution logs previously indicated synthetic fallback. |
| Report says engineering fields are unverified | PARTIAL SUPPORT | The report lists ten unverified fields, but full provenance coverage could not be inspected. |
| Manifest includes every checksummed artifact | REQUIRES VALIDATION | `manifest.json` could not be parsed. |
| All artifacts share one run ID | REQUIRES VALIDATION | Run IDs and schemas could not be inspected. |
| No duplicate IDs or orphaned records | REQUIRES VALIDATION | JSON contents were unavailable. |
| Checksums correspond to attached bytes | REQUIRES VALIDATION | Hash recomputation was unavailable. |

## Findings

### ART-01 — Multiple result files create an ambiguous canonical record

- **Severity:** CRITICAL
- **Status:** OPEN
- **Finding:** `results.json`, `results-1.json`, and `results_tampered.json` are all present in the supplied attachment set. Only `results.json` appears in `checksums.txt`.
- **Impact:** An evaluator, frontend, or packaging script may load the wrong result file. The explicitly tampered artifact must not be mistaken for release evidence.
- **Minimal fix:** Keep one canonical `results.json` in the release evidence directory. Move test/tamper fixtures outside the release package or label and isolate them unambiguously.

### ART-02 — Duplicate release archives are present

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** `tutorial-project (2).zip` and `tutorial-project (2) (1).zip` are both supplied.
- **Impact:** There is no verified indication of which archive is RC1. Different archives may contain different source or artifacts.
- **Minimal fix:** Publish one release archive with a versioned filename and one recorded SHA-256 hash.

### ART-03 — Release source and configuration are outside the checksum envelope

- **Severity:** CRITICAL
- **Status:** OPEN
- **Finding:** `checksums.txt` does not cover `config.yaml`, `run_pipeline.py`, `generate_submission.py`, `requirements.txt`, the README, architecture/validation documents, or any CAD source.
- **Impact:** The generated results cannot be cryptographically tied to the source, configuration, CAD, and evaluator-facing documentation that produced or explains them.
- **Minimal fix:** Include all release payload files in a final non-self-referential manifest/checksum envelope. `checksums.txt` itself may remain the final envelope output.

### ART-04 — Current report records a dirty source tree

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** The report records Git commit `6ae853b3a796` with state `main [DIRTY]`.
- **Impact:** The commit does not uniquely identify the source that generated the artifacts.
- **Minimal fix:** Commit the exact RC1 state or include the complete diff as a hashed release artifact.

### ART-05 — Hardware identity conflicts with the report architecture claim

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** The report executive summary claims AMD MI300X training/simulation and Kria K26 edge inference, while the environment section identifies `AMD Radeon Graphics`. No Kria execution artifact is identified.
- **Impact:** The artifact package does not demonstrate the hardware stated in the headline architecture.
- **Minimal fix:** Distinguish target architecture from the actual hardware captured in `system_info.json` and report only executed hardware as measured evidence.

### ART-06 — Ledger validity is asserted through report metadata

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** The report records `Chain integrity: PASS`, but independent recomputation of ledger entries and artifact hashes was unavailable. No independently signed or anchored ledger root is identified.
- **Impact:** Present internal consistency, independent authenticity, and engineering correctness are conflated.
- **Minimal fix:** Preserve the narrower statement that the package reports internal chain verification. Do not state that this independently proves post-generation immutability.

### ART-07 — Full provenance coverage is not demonstrated

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** The report lists ten unverified engineering values. `provenance.json` could not be inspected to confirm whether signed, measured, synthetic, derived, and missing values are all represented.
- **Impact:** The strict provenance policy cannot be independently confirmed from RC1.
- **Minimal fix:** Run a schema check that reports the count of every provenance class and confirms that every report value resolves to one provenance record.

### ART-08 — Schema and run-ID consistency cannot be confirmed

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** `results.json`, `metrics.json`, `system_info.json`, `ledger.json`, `provenance.json`, `submission_data.json`, and `manifest.json` could not be parsed.
- **Impact:** Duplicate run IDs, missing IDs, mismatched schemas, orphaned ledger entries, and mixed-run packaging remain possible.
- **Minimal fix:** Produce one machine-readable validation result confirming schema versions, one common run ID, expected filenames, and zero orphaned records.

### ART-09 — The report timestamp is singular but package timestamps are unavailable

- **Severity:** MEDIUM
- **Status:** OPEN
- **Finding:** The report contains one generation timestamp, `2026-08-05T00:59:11.139203`. Manifest timestamps could not be inspected.
- **Impact:** Mixed-run or stale-artifact contamination cannot be excluded from timestamps alone.
- **Minimal fix:** Confirm all deterministic payload files reference the same run ID and that expected-variable timestamps are explicitly classified.

### ART-10 — The frontend evidence-chain paths require packaging alignment

- **Severity:** MEDIUM
- **Status:** OPEN
- **Finding:** The proposed frontend fetches `/ive-output/results.json`, but the evidence-chain array has also been shown using bare filenames. RC1 does not demonstrate the final deployed directory structure.
- **Impact:** The dashboard can load results while failing to resolve ledger, provenance, or checksum evidence.
- **Minimal fix:** Use one documented base path for every evidence file and verify the deployed paths before release.

## Consistency conclusion

The evidence filenames and report relationships are plausible but not independently closed. RC1 lacks a uniquely identified archive, one canonical result set, complete source/configuration/CAD checksum coverage, and a parseable cross-artifact validation record. Artifact consistency remains a release blocker.
