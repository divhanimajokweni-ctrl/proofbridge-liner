# Final Release Checklist — RC1

**Platform:** VVU Integrated Verification Environment (IVE)  
**Tagline:** Engineer systems that can prove themselves.  
**Demonstration application:** HBK MK-II Hydro-Gateway  
**Audit date:** August 5, 2026

## Repository

□ Clean build  
**Status:** NOT SATISFIED — Hydro-Gateway KCL executes, but the README-described application cannot be built from the supplied inventory and the Python source could not be independently inspected.

□ No broken imports  
**Status:** NOT SATISFIED — Hydro-Gateway KCL imports pass, but the documented `main.py`, `src/`, example `.vvu` models, frontend, and demo files are absent. The default root `main.kcl` opens the crawler rather than the Hydro-Gateway.

□ Build reproducible  
**Status:** NOT SATISFIED — operational repeat execution was previously demonstrated, but RC1 does not provide an independently auditable same-run schema/hash comparison, unique clean source state, or reproducibility record.

## Documentation

□ README correct  
**Status:** NOT SATISFIED — product identity, commands, repository structure, API methods, formats, safety claims, and media references do not match the supplied RC1 package.

□ Architecture aligned  
**Status:** NOT SATISFIED — the HBK architecture is internally cautious but is not labeled as demonstration-application architecture beneath IVE, and `Research Platform` creates naming ambiguity.

□ Validation aligned  
**Status:** NOT SATISFIED — the engineering validation documents correctly block release, but the README and submission report make stronger safety and implementation claims.

□ IVE identity consistent  
**Status:** NOT SATISFIED — the README leads with VVU Proof Graph and the report leads with HBK MK-II.

## Engineering

□ Proof obligation terminology only  
**Status:** NOT SATISFIED — `SAFE_FOR_DEPLOYMENT` and broad physical-safety/certification language remain in the README.

□ No unsupported engineering claims  
**Status:** NOT SATISFIED — pressure safety, fatigue, flange preload, code compliance, structural certification, deterministic conversion, and non-failure claims are unsupported by the supplied evidence.

□ Engineering Release BLOCKED where appropriate  
**Status:** NOT SATISFIED — architecture, CAD validation, and manifest documents block release, but the evaluator-facing README contradicts them.

## Evidence

☒ results.json  
**Status:** PRESENT — content and canonical status not independently verified; duplicate result candidates also exist.

☒ metrics.json  
**Status:** PRESENT — content not independently parsed.

☒ provenance.json  
**Status:** PRESENT — completeness not independently parsed.

☒ ledger.json  
**Status:** PRESENT — chain not independently recomputed.

☒ checksums.txt  
**Status:** PRESENT — nine hashes listed; source/configuration/CAD coverage is incomplete.

☒ config.yaml  
**Status:** PRESENT — content could not be independently parsed by the audit tooling.

## Media

□ Screenshots present  
**Status:** NOT SATISFIED — no release screenshots are present in the supplied RC1 inventory.

□ Demo references valid  
**Status:** NOT SATISFIED — `DEMO_VIDEO.mp4`, browser demo, Proof Graph view, and Trust Sphere media are referenced but not supplied or verified.

## Packaging

□ Submission manifest complete  
**Status:** NOT SATISFIED — the JSON manifest could not be parsed, and the checksum envelope excludes source, configuration, README, architecture, validation, and CAD files.

□ Release archive reproducible  
**Status:** NOT SATISFIED — two competing ZIP archives, duplicate CAD candidates, multiple results files, a tampered result fixture, and a dirty Git state prevent unique RC1 reconstruction.

## RELEASE DECISION

NO-GO

## Blockers by severity

### CRITICAL

1. Frozen IVE product identity is inconsistent across the README and submission report.
2. README installation, project structure, executable, frontend, examples, tests, documentation tree, and demo media do not exist in the supplied RC1 inventory.
3. Unsupported `SAFE_FOR_DEPLOYMENT` and physical-safety/certification claims remain in the evaluator-facing README.
4. Multiple result candidates include `results.json`, `results-1.json`, and `results_tampered.json`; the canonical release result is not uniquely isolated.
5. Release source, configuration, CAD, README, architecture, and validation documents are outside the supplied checksum envelope.
6. Required demo video/screenshots and valid demo references are absent.

### HIGH

1. Non-native or unverified API wrapper methods and `.vvu` conversion behavior are presented as implemented API functionality.
2. The report claims MI300X and Kria K26 execution without matching captured hardware evidence.
3. The report records a dirty Git state, preventing reconstruction from the stated commit.
4. Ledger wording overstates internal hash consistency as independent immutability/authenticity.
5. Trust score calculation is not defined and does not follow from the displayed counts.
6. `requirements.txt` does not support the application described in the README.
7. Duplicate ZIP archives prevent unique identification of RC1.
8. JSON schema, shared run ID, provenance completeness, ledger entry count, manifest completeness, and orphan-record checks could not be independently verified.
9. The conventional root `main.kcl` does not open the Hydro-Gateway demonstration application.

### MEDIUM

1. Competition naming is inconsistent.
2. The HBK architecture document is not labeled as demonstration-application architecture under IVE.
3. The principal proof DAG uses concurrency terminology unrelated to the demonstrated CAD proof obligations.
4. STEP and STL release artifacts were not supplied for verification.
5. Duplicate root-level and staged CAD source candidates create source-of-truth ambiguity.
6. Frontend evidence paths are not demonstrated against a final deployed folder layout.
7. `project.toml` and generated manifest settings could not be independently inspected.

RC1 must remain blocked until every CRITICAL blocker and the release-impacting HIGH blockers are closed and the completed package is re-audited.
