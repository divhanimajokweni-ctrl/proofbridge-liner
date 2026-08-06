#!/usr/bin/env bash
# VVU-VAL-001 · P3 Network Chaos Injection
#
# Injects packet loss, latency, and packet duplication into the runtime
# namespace. Uses chaos-mesh NetworkChaos CRDs if available; falls back
# to a pumba sidecar or tc (traffic control) inside the pods.
#
# Usage:
#   ./inject-network.sh --loss 25 --latency 1000 --dup 5 --ns vvu-runtime
#   ./inject-network.sh --loss 40 --latency 2000 --dup 8 --dry-run

set -euo pipefail

LOSS="25"
LATENCY="1000"
DUP="3"
NS="vvu-runtime"
DRY_RUN=0
DURATION="${DURATION:-3600s}"  # 1 hour default

while [[ $# -gt 0 ]]; do
  case "$1" in
    --loss) LOSS="$2"; shift 2 ;;
    --latency) LATENCY="$2"; shift 2 ;;
    --dup) DUP="$2"; shift 2 ;;
    --ns) NS="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then echo "[dry-run] $*"; else echo "[apply] $*"; "$@"; fi
}

echo "=== P3 Network Chaos: loss=${LOSS}% latency=${LATENCY}ms dup=${DUP}% ns=${NS} ==="

# Try chaos-mesh first
if kubectl get crd networkchaos.chaos-mesh.org &>/dev/null 2>&1; then
  echo "→ using chaos-mesh NetworkChaos"
  run kubectl -n "$NS" apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: p3-netchaos-$(date +%s)
spec:
  action: loss
  mode: all
  selector:
    namespaces: ["${NS}"]
    labelSelectors:
      app: runtime
  loss:
    loss: "${LOSS}"
    correlation: "50"
  delay:
    latency: "${LATENCY}ms"
    correlation: "50"
  duplicate:
    duplicate: "${DUP}"
    correlation: "20"
  duration: "${DURATION}"
  scheduler:
    cron: "@every ${DURATION}"
EOF
else
  echo "→ chaos-mesh not found; falling back to tc (traffic control) inside pods"
  PODS=$(kubectl -n "$NS" get pods -l app=runtime -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || true)
  for POD in $PODS; do
    echo "  → injecting tc rules into $POD"
    run kubectl -n "$NS" exec "$POD" -- bash -c \
      "tc qdisc add dev eth0 root netem delay ${LATENCY}ms loss ${LOSS}% duplicate ${DUP}%" 2>/dev/null || \
      echo "  (tc not available in $POD — skip)"
  done
fi

echo "=== P3 network chaos injected ==="
