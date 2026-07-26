#!/usr/bin/env bash
set -euo pipefail
HOUR="${1:-0}"
mkdir -p "VVU-VAL-001/evidence/bundles/Hour-$(printf '%02d' "$HOUR")"
cat > "VVU-VAL-001/evidence/bundles/Hour-$(printf '%02d' "$HOUR")/metrics/ledger-status.json" <<EOS
{"hour":$HOUR,"status":"bundled","tm":$(date +%s)}
EOS
