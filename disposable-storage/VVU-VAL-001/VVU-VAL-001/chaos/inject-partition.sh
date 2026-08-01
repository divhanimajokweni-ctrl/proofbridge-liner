#!/usr/bin/env bash
# VVU-VAL-001 · P7 Partition + Recovery Injection
#
# Disconnects the runtime namespace from the rest of the cluster, continues
# producing Facts during the partition, then reconnects at H71 to trigger
# the HLC merge. The merge must produce zero conflicts, zero data loss,
# and an identical MMR root whether computed from live or replayed log.
#
# Usage:
#   ./inject-partition.sh --action partition --ns vvu-runtime
#   ./inject-partition.sh --action reconnect --ns vvu-runtime
#   ./inject-partition.sh --action merge --ns vvu-runtime
#   ./inject-partition.sh --dry-run

set -euo pipefail

ACTION="partition"
NS="vvu-runtime"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --action) ACTION="$2"; shift 2 ;;
    --ns) NS="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then echo "[dry-run] $*"; else echo "[apply] $*"; "$@"; fi
}

echo "=== P7 Partition: action=${ACTION} ns=${NS} ==="

case "$ACTION" in
  partition)
    echo "→ applying deny-all egress NetworkPolicy (cluster partition)"
    run kubectl -n "$NS" apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: p7-partition
spec:
  podSelector: {}
  policyTypes: ["Egress"]
  egress: []
EOF
    echo "→ partition active — isolated Facts should queue in NATS durable queue"
    echo "→ runtime continues processing local telemetry; CB expected DEGRADED"
    ;;

  reconnect)
    echo "→ removing deny-all egress NetworkPolicy (cluster reconnect)"
    run kubectl -n "$NS" delete networkpolicy p7-partition --ignore-not-found
    echo "→ partition lifted — runtime reconnecting to cluster"
    echo "→ CB expected: DEGRADED → RECOVERING"
    ;;

  merge)
    echo "→ triggering HLC merge of partitioned Facts"
    POD=$(kubectl -n "$NS" get pods -l app=runtime -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
    if [[ -n "$POD" ]]; then
      run kubectl -n "$NS" exec "$POD" -- air ledger merge --hlc
      echo "→ merge complete — verifying results..."
      run kubectl -n "$NS" exec "$POD" -- air ledger status --json
    else
      echo "  (no runtime pod found — would run 'air ledger merge --hlc')"
    fi
    echo "→ expected: 0 conflicts observed, 0 data loss observed"
    echo "→ expected: replay identical, MMR identical"
    ;;

  *)
    echo "error: unknown action '$ACTION' (expected: partition, reconnect, merge)" >&2
    exit 2
    ;;
esac

echo "=== P7 ${ACTION} complete ==="
