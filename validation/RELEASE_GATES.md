# VVU-VAL-001 · Release Gates

These gates are objective criteria for advancing the validation branch from implementation to rehearsal to public event. No gate may be marked `Passed` without evidence.

## Gate A — Rehearsal Integrity

Status: **Passed**

Evidence:
- `bash -n VVU-VAL-001/rehearsal/{lib.sh,freeze-build.sh,run-rehearsal.sh,verify.sh}` exits 0
- `VVU-VAL-001/rehearsal/freeze-build.sh` exits 0 and writes `protocol/frozen-build.json` and `protocol/frozen-build.sha256`
- `VVU-VAL-001/rehearsal/verify.sh --observer-mode` reports `VERIFICATION INCOMPLETE` when no evidence bundles exist instead of false `PASS`
- Git tag `VAL-001` created on current HEAD
- Tracked manifests are not modified in place; pinned copies are written to `VVU-VAL-001/release/`
- Cross-platform `hash_file()` supports `sha256sum` and `shasum -a 256`

## Gate B — Evidence Integrity

Status: **Pending**

Criteria:
- `VVU-VAL-001/evidence/bundle.sh` creates deterministic `Hour-XX.zip` files
- `VVU-VAL-001/evidence/replay.sh` reproduces identical checksums from the same bundle
- `VVU-VAL-001/evidence/validation-index.py` computes a pass/fail result from `ledger-status.json`
- `VVU-VAL-001/evidence/archive.sh` appends hourly SHA-256 entries in deterministic order
- `VVU-VAL-001/rehearsal/verify.sh` recomputes and enforces the Validation Index threshold

Exit conditions: `PASS` or `PASS WITH CONDITIONS`

## Gate C — Kubernetes Readiness

Status: **Pending**

Criteria:
- Liveness/readiness probes defined for all runtime pods
- Resource requests/limits specified for all containers
- PersistentVolumeClaims sized for telemetry retention
- RBAC uses least privilege; no `cluster-admin` bindings without explicit justification
- NetworkPolicies restrict namespace ingress/egress
- Secrets loaded via environment or mounted files; no plaintext tokens in manifests
- Container images pinned by digest in `VVU-VAL-001/release/`
- Rollout strategy configured with maxSurge/maxUnavailable

## Gate D — GitOps / Argo CD

Status: **Pending**

Criteria:
- `deploy/argocd/base/` contains portable, provider-agnostic manifests
- Staging and production overlays differ only in replica count, resources, and ingress host
- Sync wave annotations order namespace before workload before monitoring
- Rollback procedure documented and tested
- Promotion flow staging -> production is reproducible

## Gate E — CI/CD

Status: **Pending**

Criteria:
- `VVU-VAL-001/github/*.yml` workflows execute deterministically
- Artifacts are retained for the validation event duration
- Release workflow associates artifacts with `VAL-*` tags, not software release tags
- Failure behavior is explicit: workflow fails loudly instead of silently passing
- Build steps are reproducible from the same commit

## Gate F — Documentation

Status: **Pending**

Criteria:
- Every implementation option in the docs matches the protocol or is labeled `SIMULATION`
- No `TODO`, `FIXME`, `<REPLACE_ME>`, dummy emails, or placeholder URLs
- Operator runbook and observer guide both produce actionable steps
- Threat model covers evidence tampering, cluster compromise, and insider threats
- Publication checklist lists every required artifact in order

## Gate G — Release Readiness

Status: **Pending**

Requirements:
- No 🔴 release blockers
- All 🟠 findings resolved or explicitly accepted with owner and date
- Risk register completed
- Public validation checklist approved
