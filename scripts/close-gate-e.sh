#!/usr/bin/env bash
set -euo pipefail

REPO="$(git remote get-url origin | sed -E 's#https://github.com/([^/]+/[^/]+)(\.git)?#\1#')"
RUN_ID="${1:?Usage: close-gate-e.sh <RUN_ID>}"
INPUT="VVU-VAL-001/protocol/gate-e/input.json"
LOG="evidence/run-${RUN_ID}.log"

if [ ! -f "$LOG" ]; then
  echo "ERROR: $LOG not found — run verify-workflow-execution.sh first" >&2
  exit 1
fi

CONCLUSION=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion -q '.conclusion')
URL=$(gh run view "$RUN_ID" --repo "$REPO" --json url -q '.url')
SHA=$(sha256sum "$LOG" | awk '{print $1}')
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

python - "$INPUT" "$RUN_ID" "$URL" "$CONCLUSION" "$SHA" "$TS" <<'PY'
import json, sys
path, run_id, url, conclusion, sha, ts = sys.argv[1:7]
with open(path) as f:
    d = json.load(f)
d.update({
    "timestamp_utc": ts,
    "workflow_run_id": run_id,
    "workflow_run_url": url,
    "workflow_conclusion": conclusion,
    "evidence_log_sha256": sha,
})
with open(path, "w") as f:
    json.dump(d, f, indent=2)
PY

echo "Gate E input populated. Remaining manual fields: operator, attestation_signature."
echo "Edit $INPUT to fill those, then run:"
echo "  python VVU-VAL-001/protocol/propagate-evidence.py"
