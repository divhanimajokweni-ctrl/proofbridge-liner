# VVU-VAL-001 · Release Gates

These gates are objective criteria for advancing the validation branch from implementation to rehearsal to public event.
Status is derived from `VVU-VAL-001/protocol/gates.json` and `VVU-VAL-001/protocol/gate-*.json` via `VVU-VAL-001/protocol/propagate-evidence.py`.
No gate may be marked `Passed` without evidence.

Run propagation:
```bash
python VVU-VAL-001/protocol/propagate-evidence.py
```

---

## Gate A — Rehearsal Integrity

Status: **Blocked**

Current blocker: missing `rehearsal-report.json` and `lint-report.json` / `test-report.json` inputs required by `propagate-evidence.py`.

Remaining criteria:
- `bash -n VVU-VAL-001/rehearsal/{lib.sh,freeze-build.sh,run-rehearsal.sh,verify.sh}` exits 0
- `VVU-VAL-001/rehearsal/freeze-build.sh` exits 0 and writes `protocol/frozen-build.json` and `protocol/frozen-build.sha256`
- `VVU-VAL-001/rehearsal/verify.sh --observer-mode` reports `VERIFICATION INCOMPLETE` when no evidence bundles exist instead of false `PASS`
- Git tag `VAL-001` created on current HEAD
- Tracked manifests are not modified in place; pinned copies are written to `VVU-VAL-001/release/`
- Cross-platform `hash_file()` supports `sha256sum` and `shasum -a 256`
- Uniform evidence envelope schema defined in `src/lib/validation/envelope.ts`
- Gate envelope artifacts generated under `VVU-VAL-001/protocol/gate-{a,b,c,d,e,f,g}-*.json` with canonical SHA-256 checksums
- Lifecycle engine `src/lib/validation/completion.ts` aggregates all gates into a single `ValidationLifecycle` object

---

## Gate B — Evidence Integrity

Status: **Blocked**

Current blocker: missing `replay-result.json`, `archive-manifest.json`, and `validation-index.json` inputs required by `propagate-evidence.py`.

Criteria:
- `VVU-VAL-001/evidence/bundle.sh` creates deterministic `Hour-XX.zip` files
- `VVU-VAL-001/evidence/replay.sh` reproduces identical checksums from the same bundle
- `VVU-VAL-001/evidence/validation-index.py` computes a pass/fail result from `ledger-status.json`
- `VVU-VAL-001/evidence/archive.sh` appends hourly SHA-256 entries in deterministic order
- `VVU-VAL-001/rehearsal/verify.sh` recomputes and enforces the Validation Index threshold

Exit conditions: `PASS` or `PASS WITH CONDITIONS`

---

## Gate C — Kubernetes Readiness

Status: **Blocked on cluster validation**

Static artifact audit: PASS (`VVU-VAL-001/kubernetes/*.yaml` contain security contexts, NetworkPolicies, PDBs, PriorityClasses, resource requests/limits).
Runtime validation: NOT PASS — requires `kubectl`/k3s/kind cluster to apply manifests and verify pod health.

Criteria:
- Liveness/readiness probes defined for all runtime pods
- Resource requests/limits specified for all containers
- PersistentVolumeClaims sized for telemetry retention
- RBAC uses least privilege; no `cluster-admin` bindings without explicit justification
- NetworkPolicies restrict namespace ingress/egress
- Secrets loaded via environment or mounted files; no plaintext tokens in manifests
- Container images pinned by digest in `VVU-VAL-001/release/`
- Rollout strategy configured with maxSurge/maxUnavailable

---

## Gate D — GitOps / Argo CD

Status: **Blocked**

Current blocker: `.github/workflows/` moved from `VVU-VAL-001/github/`; Argo CD environments and `VVU_VAL_KUBECONFIG` secret not yet provisioned in GitHub.

Criteria:
- `.github/workflows/` contains discoverable GitHub Actions workflows
- `deploy/argocd/base/` contains portable, provider-agnostic manifests
- Staging and production overlays differ only in replica count, resources, and ingress host
- Sync wave annotations order namespace before workload before monitoring
- Rollback procedure documented and tested
- Promotion flow staging -> production is reproducible

---

## Gate E — CI/CD

Status: **Blocked**

Current blocker: GitHub environments (`rehearsal`, `validation`, `release`) not yet created; `VVU_VAL_KUBECONFIG` not yet provisioned.

Criteria:
- `.github/workflows/validation.yml` executes deterministically
- `.github/workflows/rehearsal.yml` executes deterministically
- `.github/workflows/release.yml` associates artifacts with `VAL-*` tags, not software release tags
- Artifacts are retained for the validation event duration
- Failure behavior is explicit: workflow fails loudly instead of silently passing
- Build steps are reproducible from the same commit

Environment bootstrap:
```bash
scripts/setup-github-environments.sh
gh secret set VVU_VAL_KUBECONFIG --env rehearsal --body "$(base64 -w 0 < kubeconfig.yaml)"
gh secret set VVU_VAL_KUBECONFIG --env validation --body "$(base64 -w 0 < kubeconfig.yaml)"
gh secret set VVU_VAL_KUBECONFIG --env release --body "$(base64 -w 0 < kubeconfig.yaml)"
```

---

## Gate F — Documentation

Status: **Blocked**

Current blocker: outreach governance and operator contacts pending.

Criteria:
- Every implementation option in the docs matches the protocol or is labeled `SIMULATION`
- No `TODO`, `FIXME`, `<REPLACE_ME>`, dummy emails, or placeholder URLs
- Operator runbook and observer guide both produce actionable steps
- Threat model covers evidence tampering, cluster compromise, and insider threats
- Publication checklist lists every required artifact in order

---

## Gate G — Release Readiness

Status: **Pending operator inputs**

Current blocker: requires Gate E and Gate F closure plus operator-generated compliance/readiness/release authorization artifacts.

Requirements:
- No 🔴 release blockers
- All 🟠 findings resolved or explicitly accepted with owner and date
- Risk register completed
- Public validation checklist approved
- `VVU-VAL-001/protocol/gate-g-release.json` payload shows `deploymentEligible: true`
