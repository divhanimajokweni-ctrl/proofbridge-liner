#!/usr/bin/env bash
# VVU-VAL-001 · Hourly Evidence Bundle Generator
#
# Produces an immutable Hour-NN.zip containing logs, metrics, hashes, MMR root,
# fact count, replay checksum, and system health. Each bundle is SHA-256 stamped.
#
# Usage: HOUR=12 bash bundle.sh 12

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLES_DIR="${SCRIPT_DIR}/bundles"
SHA256SUMS="${SCRIPT_DIR}/SHA256SUMS"
RUNTIME_NS="${RUNTIME_NS:-vvu-runtime}"
mkdir -p "$BUNDLES_DIR"; touch "$SHA256SUMS"

HOUR="${1:?usage: bundle.sh <HOUR>}"
HOUR_PAD="$(printf "%02d" "$HOUR")"
BUNDLE="${BUNDLES_DIR}/Hour-${HOUR_PAD}.zip"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

echo "=== building Hour-${HOUR_PAD} evidence bundle ==="
mkdir -p "$WORK"/{logs,metrics}

# 1. Runtime + kernel logs
for D in epistemic-runtime air-kernel nats policy-engine fact-compiler; do
  kubectl -n "$RUNTIME_NS" logs "deploy/$D" --since=1h > "$WORK/logs/$D.log" 2>/dev/null || true
done

# 2. Prometheus metrics
curl -sf "http://prometheus.monitoring:9090/api/v1/query?query=up" > "$WORK/metrics/up.json" 2>/dev/null || true
curl -sf "http://prometheus.monitoring:9090/api/v1/query?query=vvu_facts_accepted_total" > "$WORK/metrics/facts.json" 2>/dev/null || true

# 3. MMR root + Fact count + replay checksum
kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger status --json > "$WORK/metrics/ledger-status.json" 2>/dev/null || \
  echo '{"error":"unavailable"}' > "$WORK/metrics/ledger-status.json"
kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger checksum > "$WORK/metrics/replay-checksum.txt" 2>/dev/null || \
  echo "unavailable" > "$WORK/metrics/replay-checksum.txt"

# 4. Node + pod health
kubectl get nodes -o json > "$WORK/metrics/nodes.json" 2>/dev/null || true
kubectl -n "$RUNTIME_NS" get pods -o json > "$WORK/metrics/pods.json" 2>/dev/null || true
kubectl -n "$RUNTIME_NS" events --since=1h > "$WORK/metrics/events.log" 2>/dev/null || true

# 5. Validation Index
python3 "${SCRIPT_DIR}/validation-index.py" --metrics "$WORK/metrics/ledger-status.json" --json > "$WORK/metrics/validation-index.json" 2>/dev/null || \
  echo '{"error":"unavailable"}' > "$WORK/metrics/validation-index.json"

# 6. Test manifest
cat > "$WORK/test-manifest.json" <<EOF
{
  "validation_event": "VAL-001",
  "hour": ${HOUR},
  "commit_hash": "$(git -C "${SCRIPT_DIR}/../../.." rev-parse HEAD 2>/dev/null || echo unknown)",
  "runtime_namespace": "${RUNTIME_NS}",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# 7. Zip + SHA-256 stamp
( cd "$WORK" && zip -qr "$BUNDLE" . )
SHA=$(sha256sum "$BUNDLE" | awk '{print $1}')
echo "$SHA  Hour-${HOUR_PAD}.zip" >> "$SHA256SUMS"
echo "$SHA" > "${BUNDLE}.sha256"
echo "✓ Hour-${HOUR_PAD}: $BUNDLE (sha256: ${SHA:0:16}...)"
