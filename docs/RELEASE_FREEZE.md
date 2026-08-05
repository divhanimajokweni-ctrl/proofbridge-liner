# IVE RC1 Release Freeze

**Date:** August 5, 2026
**Status:** FREEZE — RC1 build clean, runtime verified.

## Frozen identity

- **Platform:** VVU Integrated Verification Environment (IVE)
- **Tagline:** Engineer systems that can prove themselves.
- **Demonstration application:** HBK MK-II Hydro-Gateway
- HBK MK-II is not the platform.

## Frozen result contract

`/ive-output/results.json` (served by `GET /api/ive`) exposes:

```json
{
  "run_id": "...",
  "hardware_profile": { ... },
  "obligations": [ ... ],
  "telemetry": { ... },
  "trustSphere": { ... },
  "provenance_status": "...",
  "ledger_status": "..."
}
```

Missing values must remain explicit (`UNDEFINED`, `MISSING`, `NOT_EVALUATED`, `OUT_OF_SCOPE`, `REQUIRES VALIDATION`, `PENDING`). No fallback engineering values or fabricated run identifiers are permitted.

## Frozen proof states

- `PROVEN`
- `DISPROVEN`
- `BLOCKED_MISSING_INPUT`
- `BLOCKED_UNVERIFIED_INPUT`
- `OUT_OF_SCOPE`
- `SOLVER_ERROR`

Forbidden unless independently supported:

- `SAFE_FOR_DEPLOYMENT`
- `System safe`
- `Engineering certified`
- `FEA verified`
- `Physically validated`

## Frozen Trust Sphere dimensions

- Safety — OUT_OF_SCOPE
- Integrity — VERIFIED
- Determinism — NOT_EVALUATED
- Auditability — LEDGER_PRESENT
- Recoverability — NOT_EVALUATED
- Availability — PRESENT
- Engineering Release — BLOCKED

No unexplained aggregate percentage is allowed.

## Frozen CAD boundaries

- `cad/hydroGatewayMain.kcl` and `main.kcl` remain independent demonstrations.
- The Hydro-Gateway remains a parametric engineering study.
- The crawler and Hydro-Gateway must not be merged.
- No CAD redesign is authorized during release harmonization.

## Frozen evidence requirements

Each execution must retain its own:

- `run_id`
- timestamp
- execution target
- environment
- metrics
- input/output hashes
- ledger entries
- provenance

The ledger must be append-only. Previous runs must not be overwritten or collapsed.

## Release gate

Before the authoritative final run, the repository must pass:

- identity and terminology audit
- result-contract validation
- dashboard-to-artifact mapping validation
- no-fabrication wording scan
- CAD presence and import validation
- Zoo API native-versus-wrapper audit
- artifact schema and checksum validation
- clean build and smoke test
- absence of credentials and placeholder assets

RC1 passes: clean build, clean lint, runtime verified, no console errors, identity aligned, zero fabrication.
