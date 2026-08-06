# Submission Audit — RC1

**Platform:** VVU Integrated Verification Environment (IVE)  
**Tagline:** Engineer systems that can prove themselves.  
**Demonstration application:** HBK MK-II Hydro-Gateway  
**Audit date:** August 5, 2026

## Result

**FAIL**

The CAD demonstration is executable, and the engineering validation documents appropriately block engineering release. The submission package is not credible as RC1 because the public README describes a different and largely absent repository, the frozen IVE product identity is not consistently applied, unsupported safety and API claims remain, and required demo/media references are unresolved.

## Audited material

- `zoo-makeathon-README.md`
- `HBK_MKII_Submission_Report.md`
- `hbkMkIIArchitectureSpecification.md`
- `HYDRO_GATEWAY_REVIEW.md`
- `HYDRO_GATEWAY_VALIDATION.md`
- `IVE_CAD_SUBMISSION_MANIFEST.md`
- Hydro-Gateway and crawler KCL sources
- `requirements.txt`
- Supplied pipeline/configuration filenames
- Supplied artifact filenames and `checksums.txt`
- Repository and attachment inventory

`run_pipeline.py`, `generate_submission.py`, and `config.yaml` could not be parsed directly by the available audit tooling. Their internal claims therefore remain dependent on execution logs and generated documents rather than source inspection.

## Findings

### SUB-01 — Frozen platform identity is not consistently used

- **Severity:** CRITICAL
- **Status:** OPEN
- **Evidence:** The README title is `VVU Proof Graph: Formal Verification in CAD Workflows`, not `VVU Integrated Verification Environment (IVE)`. The submission report title is `HBK MK-II Hydro-Gateway — Submission Report` and does not identify HBK MK-II as the IVE demonstration application.
- **Impact:** A judge can reasonably conclude that VVU Proof Graph or HBK MK-II is the product, contradicting the frozen identity.
- **Minimal fix:** Apply the frozen platform name and tagline at the top of the README and submission report. Label HBK MK-II explicitly as the demonstration application. No architecture change is required.

### SUB-02 — README describes a repository that is not present

- **Severity:** CRITICAL
- **Status:** OPEN
- **Evidence:** The README instructs the evaluator to run `python main.py --demo` and describes `main.py`, `config.json`, `src/`, `examples/`, `tests/`, `docs/`, `DEMO_VIDEO.mp4`, and a browser application on port 3000. These files and directories are not present in the supplied RC1 inventory. The supplied configuration is named `config.yaml`, not `config.json`.
- **Impact:** The documented installation and demo path cannot be reproduced from the supplied release candidate.
- **Minimal fix:** Make the README describe only files and commands actually present in the release archive, or ensure the documented files are included before packaging. This is release-document alignment, not a feature addition.

### SUB-03 — Unsupported deployment-safety wording remains

- **Severity:** CRITICAL
- **Status:** OPEN
- **Evidence:** The README demo ends with `SAFE_FOR_DEPLOYMENT`. It also states that engineers can know instantly that a design is safe, prove that pressure systems will not fail, certify structural designs, and know the system is safe because proofs exist.
- **Impact:** These claims exceed the supplied evidence and conflict with the validation documents, which explicitly state that pressure, FEA, structural, materials, and physical validation were not performed.
- **Minimal fix:** Replace deployment and physical-safety conclusions with bounded proof-obligation states. Retain `ENGINEERING RELEASE: BLOCKED` wherever physical validation is absent.

### SUB-04 — API wrappers are presented as native or verified Zoo API behavior

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The README presents methods including `load_model`, `set_param`, `render`, `analyze`, `suggest_safety_spec`, and STEP-to-VVU deterministic conversion as working API behavior. It does not consistently identify these calls as proposed VVU wrapper methods. The `.vvu` format and example files are absent from RC1.
- **Impact:** Evaluators cannot distinguish implemented Zoo API calls from conceptual wrapper interfaces and unsupported examples.
- **Minimal fix:** Label every non-native method as a VVU wrapper or pseudocode example and remove claims that cannot be traced to an included implementation or captured API response.

### SUB-05 — Unsupported formal-verification and engineering claims remain

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The README claims automatic fatigue-life proof, flange-bolt preload verification, ASME compliance inference, deterministic conversion guarantees, bit-identical STEP round trips, cryptographically auditable proofs, and formal proofs that designs are safe. The example inputs include material, yield strength, pressure, wall thickness, design factor, and cycle life without provenance in the README.
- **Impact:** The README conflicts with the Zero Fabrication Mandate and with the Hydro-Gateway validation report.
- **Minimal fix:** Mark these examples as unverified illustrative obligations or remove them from the release claims. Do not label them as executed or verified.

### SUB-06 — Trust score is not reproducibly defined

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The README reports `Aggregate Score: 94.7%` for five verified dimensions and one pending dimension without publishing the formula or weighting. Equal weighting would not produce 94.7%.
- **Impact:** The primary trust metric appears arbitrary, contradicting the claim that it is computable rather than hand-wavy.
- **Minimal fix:** Publish the exact calculation already implemented, or report obligation counts and per-dimension states without an aggregate score.

### SUB-07 — Proof graph terminology is inconsistent with the CAD demonstration

- **Severity:** MEDIUM
- **Status:** OPEN
- **Evidence:** The principal proof DAG uses lock semantics, thread model, state well-formedness, progress, and runtime nodes. The demonstration narrative is pressure-spool CAD verification.
- **Impact:** The submission does not establish how the displayed proof graph relates to the HBK MK-II CAD evidence.
- **Minimal fix:** Clearly label the concurrency graph as a separate runtime example or use only the graph actually produced by the submitted demonstration.

### SUB-08 — Submission report is application-first and contains hardware identity conflicts

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The report leads with HBK MK-II rather than IVE. Its executive summary claims AMD Kria K26 edge inference and AMD MI300X training/simulation, while its captured environment identifies `AMD Radeon Graphics`. No Kria execution evidence is supplied.
- **Impact:** The report overstates demonstrated hardware and obscures the frozen platform identity.
- **Minimal fix:** Identify IVE as the platform, HBK MK-II as the application, and distinguish target architecture from hardware actually detected in the run.

### SUB-09 — Ledger language overstates authenticity

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The report says ledger verification proves records were not tampered with after generation. The supplied evidence establishes an internal SHA-256 chain claim but does not demonstrate an independently signed or anchored ledger root.
- **Impact:** Internal consistency is presented as independent authenticity.
- **Minimal fix:** State that the ledger passed internal consistency verification and does not independently prove authorship, authenticity, or engineering correctness.

### SUB-10 — Competition naming is inconsistent

- **Severity:** MEDIUM
- **Status:** OPEN
- **Evidence:** The report says `Zoo Makeathon (Aug 5)` while the README says `Zoo API Makeathon 2026` in its footer. The product is being audited specifically for the Zoo API Makeathon.
- **Impact:** The submission can appear recycled from a different event or release.
- **Minimal fix:** Use one exact competition name throughout the release package.

### SUB-11 — Git state is dirty

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The report records commit `6ae853b3a796` as `main [DIRTY]`.
- **Impact:** The submitted artifacts cannot be reconstructed from the stated commit alone.
- **Minimal fix:** Commit the exact release source or archive the complete dirty diff and hash it as part of the release evidence.

### SUB-12 — Architecture document can be mistaken for the IVE platform architecture

- **Severity:** MEDIUM
- **Status:** OPEN
- **Evidence:** `hbkMkIIArchitectureSpecification.md` is titled `HBK Mk-II Three-Tier Research Platform Architecture Specification` and uses `Research Platform` for Tier 3. It correctly blocks implementation and defines HBK responsibilities, but it is not labeled as the demonstration-application architecture beneath IVE.
- **Impact:** `platform` has two meanings in the same submission: IVE product platform and HBK Tier 3 research platform.
- **Minimal fix:** Add a document-scope label stating that this is the HBK MK-II demonstration-application architecture and not the VVU IVE product identity.

### SUB-13 — Media and demo references are unresolved

- **Severity:** CRITICAL
- **Status:** OPEN
- **Evidence:** The README references `DEMO_VIDEO.mp4`, Proof Graph screenshots, a Trust Sphere, and a browser demo. No video, screenshots, frontend package, or verifiable media link is present in the supplied RC1 inventory.
- **Impact:** The advertised demonstration cannot be evaluated from the release package.
- **Minimal fix:** Include and verify the media files or remove invalid local references and provide the actual submitted media reference.

### SUB-14 — Installation placeholders remain

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** The README includes `https://github.com/YOUR_USERNAME/vvu-proof-graph`, separate `ZOO_AGENT_KEY`, example `.vvu` files, and endpoints/configuration that are not evidenced by the supplied repository.
- **Impact:** The evaluator-facing setup is incomplete and may fail before the project can be assessed.
- **Minimal fix:** Replace placeholders with the actual release repository and only the credentials, endpoints, formats, and commands used by RC1.

### SUB-15 — Requirements do not support the README-described application

- **Severity:** HIGH
- **Status:** OPEN
- **Evidence:** `requirements.txt` contains NumPy, PyTorch, PyYAML, and GitPython, with Genesis commented as optional. It does not list a Z3 binding, Lean integration, Zoo client, WebSocket dependency, proof-graph renderer, or frontend dependencies described by the README.
- **Impact:** A clean environment cannot reproduce the claimed proof-aware CAD application from the declared dependencies.
- **Minimal fix:** Align the README with the dependencies and executables actually included in RC1, and ensure all runtime dependencies used by those included executables are declared.

## Document alignment summary

| Document | IVE-first identity | HBK labeled as application | Engineering release blocked | Unsupported claims absent |
|---|---:|---:|---:|---:|
| `zoo-makeathon-README.md` | FAIL | PARTIAL | FAIL | FAIL |
| `HBK_MKII_Submission_Report.md` | FAIL | FAIL | PARTIAL | FAIL |
| `hbkMkIIArchitectureSpecification.md` | NOT LABELED | APPLICATION DOCUMENT | PASS | PASS |
| `HYDRO_GATEWAY_REVIEW.md` | NOT APPLICABLE | APPLICATION DOCUMENT | PASS | PASS |
| `HYDRO_GATEWAY_VALIDATION.md` | NOT APPLICABLE | APPLICATION DOCUMENT | PASS | PASS |
| `IVE_CAD_SUBMISSION_MANIFEST.md` | PASS | PASS | PASS | PASS |

## Submission conclusion

The engineering caution in the architecture and validation documents is credible. The evaluator-facing README and report are not aligned with those controls and describe unavailable or unsupported implementation behavior. RC1 must not be represented as submission-ready until the critical and high-severity documentation/package contradictions are corrected.
