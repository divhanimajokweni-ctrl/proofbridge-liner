#!/usr/bin/env bash
# VVU-VAL-001 · Hourly Evidence Bundle Generator
#
# Produces an immutable Hour-NN.zip containing logs, metrics, hashes, MMR root,
# fact count, replay checksum, and provenance metadata. Each bundle is SHA-256 stamped.
#
# Invariants:
#   - files are sorted before archiving
#   - timestamps are normalized where possible
#   - state is recorded as VALID or INCOMPLETE
#   - missing runtime artifacts fail closed instead of silently stubbing
#
# Usage: HOUR=12 bash bundle.sh 12

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "${SCRIPT_DIR}" && pwd)"
source "${LIB_DIR}/lib.sh"

VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUNDLES_DIR="${SCRIPT_DIR}/bundles"
SHA256SUMS="${SCRIPT_DIR}/SHA256SUMS"
RUNTIME_NS="${RUNTIME_NS:-vvu-runtime}"

mkdir -p "$BUNDLES_DIR"
touch "$SHA256SUMS"

HOUR="${1:?usage: bundle.sh <HOUR>}"
HOUR_PAD="$(printf "%02d" "$HOUR")"
BUNDLE="${BUNDLES_DIR}/Hour-${HOUR_PAD}.zip"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "=== building Hour-${HOUR_PAD} evidence bundle ==="
mkdir -p "$WORK"/{logs,metrics}
py="$(detect_python)"

# Provenance metadata — makes every bundle self-describing
cat > "$WORK/provenance.json" <<EOF
{
  "protocol": "VVU-VAL-001",
  "protocol_version": "1.1",
  "validation_event": "VAL-001",
  "bundle_hour": ${HOUR},
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit_hash": "$(git_root "$VAL_DIR/..")",
  "generator": "bundle.sh",
  "bundle_id": "Hour-${HOUR_PAD}"
}
EOF

# Deterministic archive ordering: sort inputs before capture.
# Runtime dependency: epistemic-runtime pod must expose `air ledger <cmd>`.
# Failure policy: missing data is recorded as INCOMPLETE, not silently substituted.

# 1. Runtime + kernel logs
LOG_OK=0
for D in epistemic-runtime air-kernel nats policy-engine fact-compiler; do
  if kubectl -n "$RUNTIME_NS" logs "deploy/$D" --since=1h > "$WORK/logs/$D.log" 2>/dev/null; then
    LOG_OK=$((LOG_OK + 1))
  else
    echo "unavailable" > "$WORK/logs/$D.log"
  fi
done

# 2. Prometheus metrics
METRICS_OK=0
for QUERY in up vvu_facts_accepted_total; do
  if curl -sf "http://prometheus.monitoring:9090/api/v1/query?query=$QUERY" > "$WORK/metrics/${QUERY}.json" 2>/dev/null; then
    METRICS_OK=$((METRICS_OK + 1))
  else
    echo '{"status":"unavailable"}' > "$WORK/metrics/${QUERY}.json"
  fi
done

# 3. MMR root + Fact count + replay checksum via air ledger CLI
LEDGER_OK=0
if kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger status --json > "$WORK/metrics/ledger-status.json" 2>/dev/null; then
  LEDGER_OK=$((LEDGER_OK + 1))
else
  echo '{"error":"unavailable"}' > "$WORK/metrics/ledger-status.json"
fi
if kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger checksum > "$WORK/metrics/replay-checksum.txt" 2>/dev/null; then
  LEDGER_OK=$((LEDGER_OK + 1))
else
  echo "unavailable" > "$WORK/metrics/replay-checksum.txt"
fi

# 4. Node + pod health
kubectl get nodes -o json > "$WORK/metrics/nodes.json" 2>/dev/null || true
kubectl -n "$RUNTIME_NS" get pods -o json > "$WORK/metrics/pods.json" 2>/dev/null || true
kubectl -n "$RUNTIME_NS" events --since=1h > "$WORK/metrics/events.log" 2>/dev/null || true

# 5. Validation Index (requires python)
if [[ -n "$py" ]]; then
  "$py" "${SCRIPT_DIR}/validation-index.py" --metrics "$WORK/metrics/ledger-status.json" --json > "$WORK/metrics/validation-index.json" 2>/dev/null || \
    echo '{"error":"unavailable"}' > "$WORK/metrics/validation-index.json"
else
  echo '{"error":"python_unavailable"}' > "$WORK/metrics/validation-index.json"
fi

# 6. Bundle state: VALID only if all expected artifacts captured
BUNDLE_STATE="INCOMPLETE"
if [[ "$LOG_OK" -eq 5 ]] && [[ "$METRICS_OK" -eq 2 ]] && [[ "$LEDGER_OK" -eq 2 ]]; then
  BUNDLE_STATE="VALID"
fi
echo "$BUNDLE_STATE" > "$WORK/state.txt"

# 7. Deterministic archive
# Normalize mtimes where supported; sort file list before zipping.
if find "$WORK" -type f -exec touch -t 202601010000 {} + 2>/dev/null; then
  NORMALIZED_MTIME=1
else
  NORMALIZED_MTIME=0
fi

( cd "$WORK" && find . -type f | sort | zip -q -X -@ "$BUNDLE" ) 2>/dev/null || \
  ( cd "$WORK" && find . -type f | sort | zip -q -X "$BUNDLE" -@ )

# 8. SHA-256 stamp (append-only)
if [[ -f "$BUNDLE" ]]; then
  SHA=$(hash_file "$BUNDLE" | awk '{print $1}')
  # guard against duplicate bundle lines
  if ! grep -qxF "$SHA  Hour-${HOUR_PAD}.zip" "$SHA256SUMS"; then
    echo "$SHA  Hour-${HOUR_PAD}.zip" >> "$SHA256SUMS"
  fi
  echo "$SHA" > "${BUNDLE}.sha256"
  echo "✓ Hour-${HOUR_PAD}: $BUNDLE (sha256: ${SHA:0:16}...) state=$BUNDLE_STATE mtime_normalized=$NORMALIZED_MTIME"
else
  echo "✗ Hour-${HOUR_PAD}: bundle creation failed" >&2
  exit 1
fi
