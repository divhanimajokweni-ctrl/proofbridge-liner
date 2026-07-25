# VVU-VAL-001 · Rehearsal Ready Status

Generated after attempting `freeze-build.sh` and `run-rehearsal.sh` in the current host environment.

## Execution Environment

- OS: Windows 10/11 (Git Bash / MSYS2)
- Working directory: `C:\Users\s217665446\Downloads\proofbridge-liner`
- Git Bash path: `/c/Users/s217665446/Downloads/proofbridge-liner`
- Python: `python` available (`python3` missing)
- Container runtime: none detected
- Kubernetes CLI: `kubectl` not installed
- k3s: not installed

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Repository structure | ✅ COMPLETE | `VVU-VAL-001/` subtree present with 39 files |
| Kubernetes manifests | ✅ COMPLETE | 7 manifests in `VVU-VAL-001/kubernetes/` |
| Chaos schedules | ✅ COMPLETE | `schedule.yaml` + 4 inject scripts |
| Rehearsal scripts | ⚠️ PARTIAL | freeze-build.sh has Git Bash path translation issue on Windows |
| Evidence scripts | ✅ COMPLETE | bundle, archive, replay, validation-index.py present |
| GitHub workflows | ✅ COMPLETE | 3 workflows in `.github/workflows/` |
| Scoreboard configs | ✅ COMPLETE | dashboard.json, metrics-schema.json, overlay-config.json |
| Outreach scaffolds | ✅ COMPLETE | milestones, recipients, stages + 6 templates |
| Documentation | ✅ COMPLETE | 4 docs + protocol.md |
| frozen-build.json | ✅ PRESENT | Manually generated at `VVU-VAL-001/protocol/frozen-build.json` |
| validation-index.py | ✅ WORKS | `python VVU-VAL-001/evidence/validation-index.py --help` exits 0 |
| bootstrap-host.sh | ✅ PRESENT | `validation/bootstrap/bootstrap-host.sh` |
| ENVIRONMENT_REQUIREMENTS.md | ✅ PRESENT | `validation/ENVIRONMENT_REQUIREMENTS.md` |

## Script Execution Results

### freeze-build.sh

Attempted command:
```bash
bash VVU-VAL-001/rehearsal/freeze-build.sh
```

Exit code: `128`

Failure reason:
```
fatal: cannot change to '/c/Users/s217665446/Downloads/proofbridge-liner': No such file or directory
```

Root cause:
- Git Bash path `/c/Users/...` does not map correctly to Windows filesystem for `git -C` in this environment.
- `REPO_ROOT` derivation via `cd "${VAL_DIR}/.." && pwd` returns `/c/Users/...` form, which Git cannot resolve.

Workaround applied:
- `frozen-build.json` was generated manually with correct commit hash and metadata.
- Re-run `freeze-build.sh` only after fixing `REPO_ROOT` detection for Git Bash on Windows.

### run-rehearsal.sh

Attempted command:
```bash
bash VVU-VAL-001/rehearsal/run-rehearsal.sh
```

Exit code: `2`

Blockers (in order):
1. `kubectl not found` — no Kubernetes CLI installed
2. No reachable Kubernetes cluster — k3s/kind/minikube not provisioned
3. No container runtime — Docker/Podman not available

These are expected blockers per `ENVIRONMENT_REQUIREMENTS.md`.

## Remaining Host Prerequisites

To execute the full 72-hour rehearsal:

1. Install `kubectl` (>=1.29)
2. Provision a Kubernetes cluster:
   - Preferred: k3s
   - Alternative: kind (requires Docker), minikube, or Podman
3. Install Docker Engine or Podman if using kind/Podman
4. Ensure `python3` is available (create symlink `python3 -> python` if needed)
5. Fix `freeze-build.sh` REPO_ROOT path for Git Bash on Windows, or run from WSL/Linux
6. Re-run `freeze-build.sh` to generate tagged commit and image digest
7. Re-run `run-rehearsal.sh` to execute compressed 72h validation

## Quick Start After Provisioning

```bash
# 1. Bootstrap host
bash validation/bootstrap/bootstrap-host.sh

# 2. Freeze build
bash VVU-VAL-001/rehearsal/freeze-build.sh

# 3. Run rehearsal (compressed mode: ~2 minutes)
bash VVU-VAL-001/rehearsal/run-rehearsal.sh

# 4. Verify
bash VVU-VAL-001/rehearsal/verify.sh --observer-mode
```

## Summary

- Repository code: **complete**
- Scripts/manifests/workflows: **complete**
- Executable rehearsal in this environment: **blocked by missing k3s/kubectl/Docker**
- Frozen build metadata: **present** (manual, pending `freeze-build.sh` fix)
- Next action: provision cluster stack per `ENVIRONMENT_REQUIREMENTS.md` and re-run
