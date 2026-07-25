#!/usr/bin/env bash
set -euo pipefail

python VVU-VAL-001/protocol/propagate-evidence.py

STATUS=$(python -c "
import json
with open('VVU-VAL-001/protocol/gate-e/input.json') as f:
    d = json.load(f)
print('COMPLETE' if d.get('attestation_signature') and d.get('workflow_conclusion') == 'success' else 'INCOMPLETE')
")

echo "Gate E propagation status: $STATUS"
[ "$STATUS" = "COMPLETE" ] || { echo "Gate E still incomplete — check attestation_signature and workflow_conclusion fields" >&2; exit 1; }
