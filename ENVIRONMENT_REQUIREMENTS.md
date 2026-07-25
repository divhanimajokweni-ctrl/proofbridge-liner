# VVU-VAL-001 · Environment & CI/CD Contract

## 1. Host Prerequisites

| Software       | Minimum version | Verification command                  |
|----------------|-----------------|---------------------------------------|
| bash           | 5.1             | `bash --version`                      |
| python3        | 3.11            | `python3 --version`                   |
| jq             | 1.6             | `jq --version`                        |
| yq             | 4.35            | `yq --version`                        |
| curl           | 7.68            | `curl --version \| head -n1`          |
| openssl        | 3.0             | `openssl version`                     |
| git            | 2.40            | `git --version`                       |
| make           | 4.3             | `make --version \| head -n1`          |
| kubectl        | 1.29            | `kubectl version --client`            |
| k3s            | 1.29            | `k3s --version`                       |
| docker         | 24.0            | `docker version` / `podman version`   |
| helm           | 3.14            | `helm version --short`                |
| task           | 3.36            | `task --version`                      |

Notes:
- `python` on Windows may point at Python 3.11+; the evidence scripts also call `python3`. If it points elsewhere, create a `python3 -> python` symlink/alias before running the propagation engine.
- Windows hosts must use Git Bash / MSYS2 with POSIX tooling; `dos2unix` the scripts if they fail with CRLF errors.

## 2. Automated bootstrap

Run: `validation/bootstrap/bootstrap-host.sh` or `validation/bootstrap/bootstrap-host.sh --check`

## 3. GitHub Environments

Define these environments in the repository settings before merging/activating workflows:

| Environment | Purpose | Required secrets |
|-------------|---------|------------------|
| `rehearsal` | Dress rehearsal runs | `VVU_VAL_KUBECONFIG` |
| `validation` | Hour automation + evidence collection | `VVU_VAL_KUBECONFIG` |
| `release`    | Release assembly + GitHub Release publish | `VVU_VAL_KUBECONFIG` |

Bootstrap script:
```bash
scripts/setup-github-environments.sh
```

## 4. GitHub Secrets

| Variable | Required | Purpose | Source | Format |
|----------|----------|---------|--------|--------|
| `VVU_VAL_KUBECONFIG` | Yes | Cluster access for validation deployment | Manual: base64-encoded kubeconfig YAML | base64 binary string |
| `VVU_VAL_COMMIT_HASH` | Derived | Evidence binding to source commit | `${{ github.sha }}` | 40-char hex SHA-1 |
| `VVU_VAL_START_EPOCH` | Derived | Validation timestamp anchor | workflow run start | Unix epoch integer |

Provisioning:
```bash
gh secret set VVU_VAL_KUBECONFIG --env validation --body "$(base64 -w 0 < kubeconfig.yaml)"
gh secret set VVU_VAL_KUBECONFIG --env release --body "$(base64 -w 0 < kubeconfig.yaml)"
```

## 5. Verification

```bash
scripts/verify-workflow-execution.sh
```

This triggers the workflow, watches the run, and saves `evidence/run-<id>.log` as an evidence artifact.

## 6. Workflow Files

After 2026-07-25 remediation, workflow files are located at repository root:

`.github/workflows/validation.yml`
`.github/workflows/rehearsal.yml`
`.github/workflows/release.yml`
