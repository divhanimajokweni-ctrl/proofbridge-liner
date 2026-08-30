# IVE CAD Submission Manifest

## Purpose

This manifest inventories the HBK MK-II Hydro-Gateway CAD source files staged for the IVE submission. The CAD is parametric KCL source, not a fabrication release package.

## CAD entrypoints

- `cad/hydroGatewayMain.kcl` — Hydro-Gateway multi-part assembly entrypoint.
- `main.kcl` — existing HBK Mk-II differential-drive crawler chassis entrypoint.

## Hydro-Gateway part files

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

## Existing crawler files

- `partEnclosure.kcl`
- `partDriveWheel.kcl`
- `main.kcl`
- `crawlerDesignReview.md`

The crawler and Hydro-Gateway are separate CAD examples. They are not fused into one manufactured body.

## IVE result-loading contract

The web application can load the generated proof result package with:

```js
const resultsResponse = await fetch('/ive-output/results.json');
if (!resultsResponse.ok) {
  throw new Error(`Unable to load IVE results: ${resultsResponse.status}`);
}

const results = await resultsResponse.json();

useIVEStore.setState({
  proofObligations: Array.isArray(results.obligations)
    ? results.obligations
    : [],
  evidenceChain: [
    'provenance.json',
    'ledger.json',
    'checksums.txt',
  ],
  telemetry: results.telemetry ?? null,
  trustSphere: results.trustSphere ?? null,
  runId: results.run_id ?? results.runId ?? null,
  provenanceStatus: results.provenance_status ?? 'UNDEFINED',
  ledgerStatus: results.ledger_status ?? 'UNDEFINED',
});
```

## Required results schema

`results.json` should expose, at minimum:

```json
{
  "run_id": "REQUIRES_VALIDATION",
  "obligations": [],
  "telemetry": null,
  "trustSphere": null,
  "provenance_status": "UNDEFINED",
  "ledger_status": "UNDEFINED"
}
```

Do not label the result `SAFE_FOR_DEPLOYMENT` merely because a mathematical obligation is proven. Use proof states such as `PROVEN`, `DISPROVEN`, `BLOCKED_MISSING_INPUT`, `BLOCKED_UNVERIFIED_INPUT`, `OUT_OF_SCOPE`, or `SOLVER_ERROR`.

## Export procedure

For each assembly or part entrypoint:

1. Execute and validate the KCL source.
2. Run sketch constraint checks on edited sketches.
3. Render a whole-model overview and targeted feature views.
4. Export STEP for assembly interchange.
5. Export STL for mesh-based demonstration or printing workflows.
6. Hash each exported file and include the hashes in the evidence package.
7. Record the KCL source hash, export timestamp, engine version, and export options.

## Engineering status

The Hydro-Gateway geometry is a parametric general-arrangement model. The following remain `REQUIRES ENGINEERING DATA` unless separately supplied:

- Pressure design basis and MAWP.
- Structural wall thickness and reinforcement.
- Materials and allowable stresses.
- Gasket, bolt, flange, and joint design.
- Loads, supports, lifting, anchoring, wind, seismic, and transport cases.
- Waterproofing, ingress protection, cable glands, and thermal design.
- Manufacturing drawings and tolerances.
- FEA or physical validation.

The CAD files must therefore be presented as design-study evidence, not as a manufacturing release or safety certification.
