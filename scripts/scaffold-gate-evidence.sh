#!/usr/bin/env bash
set -euo pipefail

BASE="VVU-VAL-001/protocol"
mkdir -p "$BASE/gate-e" "$BASE/gate-f" "$BASE/gate-g"

python3 - "$BASE" <<'PY'
import json, pathlib, sys
base = pathlib.Path(sys.argv[1])

gate_e = {
  "gate": "E",
  "name": "CI/CD / Bootstrap",
  "operator": "",
  "timestamp_utc": "",
  "workflow_run_id": "",
  "workflow_run_url": "",
  "workflow_conclusion": "",
  "environments_verified": ["rehearsal", "validation", "release"],
  "secrets_provisioned": ["VVU_VAL_KUBECONFIG"],
  "evidence_log_path": "evidence/run-<RUN_ID>.log",
  "evidence_log_sha256": "",
  "attestation_signature": "",
  "notes": ""
}

gate_f = {
  "gate": "F",
  "name": "",
  "operator": "",
  "timestamp_utc": "",
  "evidence_refs": [],
  "attestation_signature": "",
  "notes": "SCOPE UNDEFINED — populate gate name/criteria before use"
}

gate_g = {
  "gate": "G",
  "name": "",
  "operator": "",
  "timestamp_utc": "",
  "evidence_refs": [],
  "attestation_signature": "",
  "notes": "SCOPE UNDEFINED — populate gate name/criteria before use"
}

for name, obj in [("gate-e/input.json", gate_e), ("gate-f/input.json", gate_f), ("gate-g/input.json", gate_g)]:
  path = base / name
  path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
  print(f"Wrote {path}")
PY

chmod +x scripts/scaffold-gate-evidence.sh 2>/dev/null || true
echo "Scaffolded: $BASE/{gate-e,gate-f,gate-g}/input.json"
