#!/usr/bin/env bash
set -euo pipefail

REPO="$(git remote get-url origin | sed -E 's#https://github.com/([^/]+/[^/]+)(\.git)?#\1#')"

if [ -z "$REPO" ] || [ "$REPO" = "origin" ]; then
  echo "ERROR: could not derive owner/repo from git remote" >&2
  exit 1
fi

for env in rehearsal validation release; do
  echo "--- $env ---"
  gh api "repos/${REPO}/environments/${env}" -q '.name' 2>/dev/null || echo "MISSING: $env"
done

for env in validation release; do
  echo "--- secrets in $env ---"
  if gh api "repos/${REPO}/environments/${env}/secrets" -q '.secrets[].name' 2>/dev/null | grep -q VVU_VAL_KUBECONFIG; then
    echo "VVU_VAL_KUBECONFIG present"
  else
    echo "MISSING: VVU_VAL_KUBECONFIG in $env"
  fi
done
