#!/usr/bin/env bash
set -euo pipefail

RECORD="VVU-VAL-001/release/deployment-record.json"
if [ ! -f "$RECORD" ]; then
  echo "ERROR: $RECORD not found" >&2
  exit 1
fi

STATUS=$(jq -r '.status' "$RECORD")
STARTED=$(jq -r '.startedAt // .started_at // empty' "$RECORD")
DEPLOYMENT_ID=$(jq -r '.deploymentId // .deployment_id // empty' "$RECORD")

echo "Local record status: $STATUS"
echo "Started at: ${STARTED:-unknown}"
echo "Deployment ID: ${DEPLOYMENT_ID:-none}"

if [ "$STATUS" = "deploying" ]; then
  echo "Cross-checking against Vercel actual state..."
  if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "null" ]; then
    vercel inspect "$DEPLOYMENT_ID" --json 2>/dev/null | jq '{readyState, createdAt}' \
      || echo "WARNING: could not reach Vercel API for cross-check — do not blind-reset"
  else
    echo "WARNING: no deployment ID in record — cannot cross-check, manual investigation required"
  fi
fi
