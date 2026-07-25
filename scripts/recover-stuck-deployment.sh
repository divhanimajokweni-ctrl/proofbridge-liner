#!/usr/bin/env bash
set -euo pipefail

RECORD="VVU-VAL-001/release/deployment-record.json"
BACKUP="${RECORD}.$(date -u +%Y%m%dT%H%M%SZ).bak"

if [ ! -f "$RECORD" ]; then
  echo "ERROR: $RECORD not found" >&2
  exit 1
fi

DEPLOYMENT_ID=$(jq -r '.deploymentId // .deployment_id // empty' "$RECORD")

if [ -z "$DEPLOYMENT_ID" ] || [ "$DEPLOYMENT_ID" = "null" ]; then
  echo "ERROR: no deployment ID — refusing to auto-reset without cross-check target" >&2
  exit 1
fi

REMOTE_STATE=$(vercel inspect "$DEPLOYMENT_ID" --json 2>/dev/null | jq -r '.readyState // "UNKNOWN"')
echo "Remote (Vercel) state: $REMOTE_STATE"

case "$REMOTE_STATE" in
  READY|ERROR|CANCELED)
    cp "$RECORD" "$BACKUP"
    echo "Backed up current record to $BACKUP"

    NEW_STATUS=$([ "$REMOTE_STATE" = "READY" ] && echo "deployed" || echo "failed")
    jq --arg s "$NEW_STATUS" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '.status = $s | .recoveredAt = $ts | .recoveryReason = "manual-reset-post-crosscheck"' \
      "$BACKUP" > "$RECORD"

    echo "Reset $RECORD status: deploying -> $NEW_STATUS"
    ;;
  BUILDING|QUEUED|INITIALIZING)
    echo "Vercel reports deployment is genuinely still in progress ($REMOTE_STATE)."
    echo "Do NOT reset — this is not a stuck state, it's an active one. Wait or investigate build logs:"
    echo "  vercel logs $DEPLOYMENT_ID"
    exit 1
    ;;
  *)
    echo "Unrecognized remote state: $REMOTE_STATE — manual investigation required, refusing auto-reset" >&2
    exit 1
    ;;
esac
