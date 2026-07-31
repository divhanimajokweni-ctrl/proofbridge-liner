#!/usr/bin/env bash
# VVU-VAL-001 · P4 Storage Pressure Injection
#
# Fills disk and throttles IO in the runtime namespace to verify graceful
# degradation under storage pressure. The Fact Log must remain append-only
# and the MMR root must remain valid.
#
# Usage:
#   ./inject-storage.sh --fill 90 --iops 500 --ns vvu-runtime
#   ./inject-storage.sh --fill 95 --iops 100 --dry-run

set -euo pipefail

FILL="90"
IOPS="500"
NS="vvu-runtime"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fill) FILL="$2"; shift 2 ;;
    --iops) IOPS="$2"; shift 2 ;;
    --ns) NS="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then echo "[dry-run] $*"; else echo "[apply] $*"; "$@"; fi
}

echo "=== P4 Storage Pressure: fill=${FILL}% iops=${IOPS} ns=${NS} ==="

# 1. Fill disk in the runtime pod's PV
POD=$(kubectl -n "$NS" get pods -l app=runtime -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
if [[ -n "$POD" ]]; then
  echo "→ filling disk in $POD to ${FILL}%"
  FILL_GB=$(( (FILL - 50) * 5 ))  # rough: 50% baseline + (fill-50)*5GB
  if [[ $FILL_GB -gt 0 ]]; then
    run kubectl -n "$NS" exec "$POD" -- fallocate -l "${FILL_GB}G" /var/lib/vvu/fill-test 2>/dev/null || \
      run kubectl -n "$NS" exec "$POD" -- dd if=/dev/zero of=/var/lib/vvu/fill-test bs=1G count="$FILL_GB" 2>/dev/null || \
      echo "  (disk fill not available — skip)"
  fi
else
  echo "  (no runtime pod found — skip fill)"
fi

# 2. Throttle IO via cgroup blkio (if available) or chaos-mesh IOChaos
if kubectl get crd iochaos.chaos-mesh.org &>/dev/null 2>&1; then
  echo "→ using chaos-mesh IOChaos for IO throttling"
  run kubectl -n "$NS" apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: IOChaos
metadata:
  name: p4-iothrottle-$(date +%s)
spec:
  action: latency
  mode: all
  selector:
    namespaces: ["${NS}"]
    labelSelectors:
      app: runtime
  volumePath: "/var/lib/vvu"
  path: "/var/lib/vvu/fact-log/**"
  delay: "100ms"
  percent: 80
  duration: "3600s"
EOF
else
  echo "→ chaos-mesh not found; falling back to cgroup blkio throttle"
  if [[ -n "$POD" ]]; then
    run kubectl -n "$NS" exec "$POD" -- bash -c \
      "echo \"8:0 ${IOPS} ${IOPS}\" > /sys/fs/cgroup/blkio/blkio.throttle.read_bps_device 2>/dev/null || true"
    run kubectl -n "$NS" exec "$POD" -- bash -c \
      "echo \"8:0 ${IOPS} ${IOPS}\" > /sys/fs/cgroup/blkio/blkio.throttle.write_bps_device 2>/dev/null || true"
  fi
fi

echo "=== P4 storage pressure injected ==="
