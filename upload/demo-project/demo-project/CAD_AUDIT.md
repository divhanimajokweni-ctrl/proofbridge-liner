# CAD Audit

**Required repository location:** `cad/`  
**Required Hydro-Gateway entrypoint:** `cad/hydroGatewayMain.kcl`  
**Independent second demonstration:** `main.kcl`

## Result

**FAIL FOR SUBMISSION REPOSITORY**

The locally synchronized KCL project validates successfully, but the audited primary GitHub branch does not contain the authoritative root `cad/` directory. Therefore the Zoo API Makeathon repository does not currently expose the CAD source that the submission narrative and CAD manifest describe.

## Local KCL validation evidence

The synchronized CAD project contains and successfully executes:

- `cad/hydroGatewayMain.kcl`
- `cad/skid_base.kcl`
- `cad/pressure_pipe.kcl`
- `cad/pump_module.kcl`
- `cad/edge_control_cabinet.kcl`
- `cad/power_backup_cabinet.kcl`
- `cad/io_cabinet.kcl`
- `cad/service_rack.kcl`
- `cad/meter_pod.kcl`
- `cad/telemetry_mast.kcl`
- `cad/top_beacon.kcl`
- `cad/unit_box.kcl`
- `cad/unit_cylinder.kcl`

All imported part files execute. The pressure-pipe, unit-box, and unit-cylinder sketches are fully constrained. Whole-assembly and pressure-spool snapshots show the expected general-arrangement geometry and true flange-hole subtraction.

## Dependency graph

```text
cad/hydroGatewayMain.kcl
├── skid_base.kcl
│   └── unit_box.kcl
├── pressure_pipe.kcl
├── pump_module.kcl
│   ├── unit_box.kcl
│   └── unit_cylinder.kcl
├── edge_control_cabinet.kcl
│   ├── unit_box.kcl
│   └── unit_cylinder.kcl
├── power_backup_cabinet.kcl
│   ├── unit_box.kcl
│   └── unit_cylinder.kcl
├── io_cabinet.kcl
│   ├── unit_box.kcl
│   └── unit_cylinder.kcl
├── service_rack.kcl
│   └── unit_box.kcl
├── meter_pod.kcl
│   ├── unit_box.kcl
│   └── unit_cylinder.kcl
├── telemetry_mast.kcl
│   ├── unit_box.kcl
│   └── unit_cylinder.kcl
└── top_beacon.kcl
    └── unit_cylinder.kcl
```

## Repository comparison

| Check | Result |
|---|---|
| Root `cad/` directory on `amd-rocm-validation` | FAIL — not present in inspected branch tree |
| `cad/hydroGatewayMain.kcl` accessible to a judge | FAIL |
| CAD manifest can be resolved against GitHub paths | FAIL |
| Independent crawler `main.kcl` preserved in local project | PASS |
| Crawler and Hydro-Gateway merged | NO — correctly separate locally |
| CAD source hashes in pipeline checksums | FAIL |
| STEP export in repository outputs | FAIL |
| STL export in repository outputs | FAIL |
| CAD export script in audited pipeline | NOT FOUND |

## Duplicate and unused geometry

The local Hydro-Gateway assembly intentionally clones reusable primitives and repeated purchased-equipment envelopes. No accidental final union or merged crawler/Hydro-Gateway body was found. The crawler source is a separate demonstration and is not unused if explicitly documented as such.

The release risk is source duplication: root-level attached KCL files and staged `cad/` copies have existed outside the GitHub submission branch. Without one committed authoritative directory and hashes, an evaluator cannot know which CAD source produced any export.

## CAD manifest accuracy

`IVE_CAD_SUBMISSION_MANIFEST.md` accurately describes the synchronized local CAD layout and correctly states that the Hydro-Gateway is a parametric general-arrangement study rather than a fabrication release. It is inaccurate as a description of the audited GitHub primary branch because the listed `cad/` files are absent there.

## Engineering status

- Parametric general-arrangement execution: PASS locally.
- Constraint status: PASS locally.
- Repository availability: FAIL.
- STEP/STL release validation: FAIL.
- Pressure rating: NOT VALIDATED.
- FEA: NOT PERFORMED.
- Physical safety: NOT VALIDATED.
- Engineering Release: BLOCKED.

## Conclusion

The CAD itself is viable as a demonstration, but it is not part of the audited submission branch and cannot currently be independently reproduced by a repository evaluator.
