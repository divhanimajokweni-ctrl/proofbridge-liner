#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROTOCOL="$ROOT/protocol"
python3 - <<'PY'
import hashlib, json, pathlib, re, sys
ROOT = pathlib.Path('VVU-VAL-001')
PROTOCOL = ROOT / 'protocol'

checksum_paths = {
  'gate-a-rehearsal': [
    PROTOCOL / 'gate-a-rehearsal.json',
  ],
  'gate-b-evidence': [
    PROTOCOL / 'gate-b-evidence.json',
  ],
  'gate-c-kubernetes': [
    PROTOCOL / 'gate-c-kubernetes.json',
  ],
  'gate-d-gitops': [
    PROTOCOL / 'gate-d-gitops.json',
  ],
  'gate-e-compliance': [
    PROTOCOL / 'gate-e-compliance.json',
  ],
  'gate-f-readiness': [
    PROTOCOL / 'gate-f-readiness.json',
  ],
  'gate-g-release': [
    PROTOCOL / 'gate-g-release.json',
  ],
}
PY
echo 'PROPAGATION_SCRIPT_CREATED'
