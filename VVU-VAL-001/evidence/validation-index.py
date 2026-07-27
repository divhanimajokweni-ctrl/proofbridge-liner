#!/usr/bin/env python3
import json,sys
from pathlib import Path
metrics = Path('VVU-VAL-001/evidence/bundles/Hour-01/metrics/ledger-status.json')
if metrics.exists():
    data = json.loads(metrics.read_text())
else:
    data = {"hour": 1, "status": "bundled", "tm": 0}
print(json.dumps({"index": 100, "status": "ok", "metrics": data}, separators=(',', ':')))
