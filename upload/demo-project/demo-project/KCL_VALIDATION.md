# KCL Validation — RC1

**Product:** VVU Integrated Verification Environment (IVE)  
**Demonstration application:** HBK MK-II Hydro-Gateway  
**Audit date:** August 5, 2026  
**Validated assembly:** `cad/hydroGatewayMain.kcl`

## Result

**PASS**

The targeted Hydro-Gateway KCL assembly and all staged Hydro-Gateway part files execute successfully. All sketches found by the constraint checker are fully constrained. No unresolved KCL import or geometry-generation error was reproduced.

This PASS applies to KCL execution and general-arrangement geometry only. It is not a pressure-rating, structural, fabrication, FEA, ingress-protection, or engineering-release approval.

## Validation performed

| Check | Result | Evidence |
|---|---|---|
| Hydro-Gateway assembly execution | PASS | `cad/hydroGatewayMain.kcl` executed successfully. |
| Skid base execution | PASS | `cad/skid_base.kcl` executed successfully. |
| Pressure spool execution | PASS | `cad/pressure_pipe.kcl` executed successfully. |
| Pump module execution | PASS | `cad/pump_module.kcl` executed successfully. |
| Edge-control cabinet execution | PASS | `cad/edge_control_cabinet.kcl` executed successfully. |
| Power-backup cabinet execution | PASS | `cad/power_backup_cabinet.kcl` executed successfully. |
| I/O cabinet execution | PASS | `cad/io_cabinet.kcl` executed successfully. |
| Service rack execution | PASS | `cad/service_rack.kcl` executed successfully. |
| Meter pod execution | PASS | `cad/meter_pod.kcl` executed successfully. |
| Telemetry mast execution | PASS | `cad/telemetry_mast.kcl` executed successfully. |
| Top beacon execution | PASS | `cad/top_beacon.kcl` executed successfully. |
| Pressure-pipe constraints | PASS | Four sketches reported fully constrained; no free or conflicting constraints. |
| Unit-box constraints | PASS | One sketch reported fully constrained. |
| Unit-cylinder constraints | PASS | One sketch reported fully constrained. |
| Non-sketch part files | PASS | Constraint checker reported zero sketches and successful execution. |
| Pressure-spool visual review | PASS | Hollow bore, two end flanges, and bolt-hole cuts are visible. No standalone cutter solids were identified. |
| Whole-assembly visual review | PASS | Skid, pressure spool, pump, three cabinets, two racks, two meter pods, mast, and beacon are present. |
| Project lint | PASS | No unfixed lint remained after the staged CAD files were added. |
| Project formatting | PASS | KCL formatting completed successfully. |

## Issues

### KCL-01 — Default release entrypoint does not open the Hydro-Gateway

- **Severity:** HIGH
- **Status:** OPEN
- **Finding:** The repository root `main.kcl` is the differential-drive crawler assembly. The Hydro-Gateway demonstration application is located at `cad/hydroGatewayMain.kcl`.
- **Impact:** An evaluator or automated KCL workflow that executes the conventional root `main.kcl` will see the crawler rather than the HBK MK-II Hydro-Gateway.
- **Minimal fix:** Package the Hydro-Gateway as its own KCL project with its assembly entrypoint named `main.kcl`, or provide an explicit release command and project path that targets `cad/hydroGatewayMain.kcl`. Do not overwrite or merge the crawler geometry silently.

### KCL-02 — Duplicate CAD source candidates exist outside the staged `cad/` directory

- **Severity:** MEDIUM
- **Status:** OPEN
- **Finding:** The supplied attachment set contains root-level Hydro-Gateway KCL files while the synchronized project contains staged copies under `cad/`.
- **Impact:** Reviewers may compile a different source set from the one validated in this report.
- **Minimal fix:** Select one authoritative CAD directory for the release archive and remove or clearly label duplicate copies.

### KCL-03 — Project configuration could not be independently inspected

- **Severity:** MEDIUM
- **Status:** OPEN
- **Finding:** `project.toml` is present but could not be parsed by the available audit tooling.
- **Impact:** The configured default entrypoint, unit settings, and project-specific execution options could not be confirmed independently.
- **Minimal fix:** Confirm that the release `project.toml` points to the intended Hydro-Gateway entrypoint and archive its hash with the CAD evidence.

### KCL-04 — STEP and STL deliverables are not present in the audited evidence set

- **Severity:** MEDIUM
- **Status:** OPEN
- **Finding:** KCL source executes, but no STEP or STL output was supplied for direct release verification.
- **Impact:** Export success and exported-geometry integrity are not demonstrated by RC1.
- **Minimal fix:** Export the validated Hydro-Gateway entrypoint, verify each exported file opens, and add its size and SHA-256 hash to the release manifest.

### KCL-05 — Engineering parameters remain unverified

- **Severity:** NOT A KCL FAILURE / ENGINEERING BLOCKER
- **Status:** OPEN
- **Finding:** Pressure rating, material specifications, allowable stresses, bolt and gasket data, loads, support conditions, lifting data, waterproofing, and manufacturing tolerances remain unverified or undefined.
- **Impact:** The successful KCL generation cannot support physical-safety, pressure-rating, production-readiness, or engineering-certification claims.
- **Minimal fix:** Preserve the existing `REQUIRES ENGINEERING DATA` and engineering-release-blocked wording in all release documents.

## CAD release conclusion

The Hydro-Gateway KCL is executable and constraint-valid as a parametric general-arrangement demonstration. The default-entrypoint ambiguity, duplicate source candidates, unverified project configuration, and absent exported CAD artifacts must be resolved at packaging level before submission.
