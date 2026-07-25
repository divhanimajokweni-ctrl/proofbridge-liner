#!/usr/bin/env bash
set -euo pipefail

REPO="$(git remote get-url origin | sed -E 's#https://github.com/([^/]+/[^/]+)(\.git)?#\1#')"

if [ -z "$REPO" ] || [ "$REPO" = "origin" ]; then
  echo "ERROR: cannot detect repo from origin remote" >&2
  exit 1
fi

echo "Using repo: $REPO"

# 1. Create environments
for env in rehearsal validation release; do
  echo "--- creating environment: $env ---"
  gh api \
    -X PUT \
    "/repos/${REPO}/environments/${env}" \
    -f wait_timer=0 \
    -f reviewers=[] >/dev/null || true
done

# 2. Provision VVU_VAL_KUBECONFIG in validation and release
if [ ! -f "VVU-VAL-001/k8s/kubeconfig.yaml" ]; then
  echo "WARNING: VVU-VAL-001/k8s/kubeconfig.yaml not found — create it before provisioning"
  echo "Expected: base64-encoded kubeconfig for the validation cluster"
  exit 1
fi

for env in validation release; do
  echo "--- provisioning VVU_VAL_KUBECONFIG in $env ---"
  gh secret set VVU_VAL_KUBECONFIG \
    --env "$env" \
    --repo "$REPO" \
    --body "$(base64 -w0 < VVU-VAL-001/k8s/kubeconfig.yaml)" >/dev/null || {
      echo "WARNING: set secret failed for $env — verify gh auth and path" >&2
    }
done

# 3. Verify
for env in rehearsal validation release; do
  echo "--- verify $env ---"
  gh api "/repos/${REPO}/environments/${env}" -q '.name' 2>/dev/null || echo "MISSING: $env"
done

for env in validation release; do
  echo "--- secrets in $env ---"
  gh api "/repos/${REPO}/environments/${env}/secrets" -q '.secrets[].name' 2>/dev/null \
    | grep -q VVU_VAL_KUBECONFIG && echo "VVU_VAL_KUBECONFIG present" || echo "MISSING: VVU_VAL_KUBECONFIG in $env"
done
