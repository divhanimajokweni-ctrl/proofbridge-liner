#!/usr/bin/env bash
set -euo pipefail

REPO="ORG/REPO"
WORKFLOW="validation.yml"

echo "Triggering workflow..."
gh workflow run "$WORKFLOW" --repo "$REPO"

sleep 5
RUN_ID=$(gh run list --repo "$REPO" --workflow="$WORKFLOW" --limit 1 --json databaseId -q '.[0].databaseId')

echo "Watching run $RUN_ID..."
gh run watch "$RUN_ID" --repo "$REPO" --exit-status

echo "Fetching logs for evidence review..."
gh run view "$RUN_ID" --repo "$REPO" --log > "evidence/run-${RUN_ID}.log"
echo "Evidence saved: evidence/run-${RUN_ID}.log"
