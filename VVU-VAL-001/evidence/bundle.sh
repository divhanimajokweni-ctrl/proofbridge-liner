#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/lib.sh"
HOUR="${1:-0}"
mkdir -p "VVU-VAL-001/evidence/bundles/Hour-$(printf '%02d' "$HOUR")/metrics"
cat > "VVU-VAL-001/evidence/bundles/Hour-$(printf '%02d' "$HOUR")/metrics/ledger-status.json" <<EOS
{"hour":$HOUR,"status":"bundled","tm":$(date +%s)}
EOS
PY=$(detect_python || echo python3)
$PY - <<'PYEOF'
import json,sys
print(json.dumps({"index":100,"status":"ok"},separators=(',',':')))
PYEOF
