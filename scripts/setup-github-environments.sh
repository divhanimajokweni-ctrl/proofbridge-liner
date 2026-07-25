#!/usr/bin/env bash
set -euo pipefail

REPO="ORG/REPO"
ENVS=("rehearsal" "validation" "release")

for env in "${ENVS[@]}"; do
  gh api --method PUT "repos/${REPO}/environments/${env}" \
    -f "wait_timer=0" \
    -F "deployment_branch_policy=null" \
    > /dev/null
  echo "Environment created/updated: $env"
done

echo "Confirm at: https://github.com/${REPO}/settings/environments"
