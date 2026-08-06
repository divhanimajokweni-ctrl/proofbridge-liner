#!/usr/bin/env bash
# VVU-VAL-001 · Dress Rehearsal Harness
#
# Runs the complete 72-hour protocol PRIVATELY before the public run.
# In compressed mode (default): 72 simulated hours in ~2 minutes wall-clock.
# In realtime mode (--realtime): true 72-hour run (public run only).
#
# Usage:
#   ./run-rehearsal.sh                  # compressed (72h in ~2min)
#   ./run-rehearsal.sh --phase-only P6  # single phase (fast iteration)
#   ./run-rehearsal.sh --realtime       # true 72h (public run)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${VAL_DIR}/../.." && pwd)"
SCHEDULE="${VAL_DIR}/chaos/schedule.yaml"
REALTIME=0
PHASE_ONLY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phase-only) PHASE_ONLY="$2"; shift 2 ;;
    --realtime) REALTIME=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$REALTIME" -eq 1 ]]; then
  DWELL=3600  # 1 real second = 1 sim minute → true 72-hour run
else
  DWELL=1     # compressed: ~2 minutes wall-clock
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VVU-VAL-001 · Private Dress Rehearsal                         ║"
echo "║  Mode: $([[ $REALTIME -eq 0 ]] && echo "COMPRESSED (72h in ~2min)" || echo "REALTIME (true 72h)")      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Verify frozen build ──
echo "=== Step 1: Verify frozen build ==="
FROZEN="${VAL_DIR}/protocol/frozen-build.json"
if [[ ! -f "$FROZEN" ]]; then
  echo "⚠ frozen-build.json not found — run freeze-build.sh first"
  echo "  for rehearsal, proceeding with current HEAD (unfrozen)"
  COMMIT=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
else
  COMMIT=$(python3 -c "import json; print(json.load(open('$FROZEN'))['commit_hash'])" 2>/dev/null || echo "unknown")
  echo "frozen commit: $COMMIT"
  if [[ "$COMMIT" != "unknown" ]]; then
    git -C "$REPO_ROOT" rev-parse --verify "$COMMIT" &>/dev/null && \
      echo "✓ commit verified in repository" || \
      echo "⚠ commit not found in repository"
  fi
fi
echo ""

# ── Step 2: Ensure k3s cluster ──
echo "=== Step 2: Ensure k3s cluster ==="
if ! command -v kubectl &>/dev/null; then
  echo "kubectl not found — install kubectl first" >&2; exit 2
fi
if ! kubectl get nodes &>/dev/null 2>&1; then
  echo "no cluster reachable — install k3s:"
  echo "  curl -sfL https://get.k3s.io | sh -"
  echo "  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml"
  exit 2
fi
echo "cluster ready: $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}')"
echo ""

# ── Step 3: Deploy the validation stack ──
echo "=== Step 3: Deploy validation stack ==="
kubectl apply -f "${VAL_DIR}/kubernetes/namespace.yaml"
kubectl apply -f "${VAL_DIR}/kubernetes/runtime.yaml"
kubectl apply -f "${VAL_DIR}/kubernetes/monitoring.yaml"
kubectl apply -f "${VAL_DIR}/kubernetes/evidence.yaml"
kubectl apply -f "${VAL_DIR}/kubernetes/streaming.yaml"
kubectl apply -f "${VAL_DIR}/kubernetes/outreach.yaml"
echo "waiting for pods to be ready..."
kubectl -n vvu-runtime wait --for=condition=ready pod -l app=runtime --timeout=120s 2>/dev/null || \
  echo "  (runtime pod not ready within 120s — continuing for rehearsal)"
echo ""

# ── Step 4: Drive the failure-injection schedule ──
PHASES=("P1" "P2" "P3" "P4" "P5" "P6" "P7")
if [[ -n "$PHASE_ONLY" ]]; then
  PHASES=("$PHASE_ONLY")
fi

OVERALL_PASS=0
for P in "${PHASES[@]}"; do
  echo "=== Phase $P ==="
  case "$P" in
    P1) echo "  (nominal — no injection) ;;
    P2) echo "  (telemetry flood — ramping load generator)"
       kubectl -n vvu-runtime set env deploy/telemetry-generator RATE_MULT=100 2>/dev/null || true ;;
    P3) bash "${VAL_DIR}/chaos/inject-network.sh --loss 25 --latency 1000 --dup 5" || true ;;
    P4) bash "${VAL_DIR}/chaos/inject-storage.sh --fill 90 --iops 500" || true ;;
    P5) for T in runtime nats worker api scheduler; do
          POD=$(kubectl -n vvu-runtime get pods -l "app=$T" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
          [[ -n "$POD" ]] && kubectl -n vvu-runtime delete pod "$POD" --grace-period=0 --force 2>/dev/null || true
        done ;;
    P6) bash "${VAL_DIR}/chaos/inject-security.sh" || true ;;
    P7) bash "${VAL_DIR}/chaos/inject-partition.sh --action partition"
        sleep 2
        bash "${VAL_DIR}/chaos/inject-partition.sh --action reconnect"
        bash "${VAL_DIR}/chaos/inject-partition.sh --action merge" ;;
  esac
  sleep "$DWELL"

  # Archive a bundle for this phase's end hour + verify replay
  HOUR=$(case "$P" in P1) echo 12;; P2) echo 24;; P3) echo 36;; P4) echo 48;; P5) echo 60;; P6) echo 66;; P7) echo 72;; esac)
  echo "  → archiving evidence for hour $HOUR"
  HOUR="$HOUR" bash "${VAL_DIR}/evidence/bundle.sh" "$HOUR" 2>/dev/null || \
    echo "  ⚠ evidence bundle for hour $HOUR failed"
  BUNDLE="${VAL_DIR}/evidence/bundles/Hour-$(printf "%02d" "$HOUR").zip"
  [[ -f "$BUNDLE" ]] && bash "${VAL_DIR}/evidence/replay.sh" --bundle "$BUNDLE" 2>/dev/null || \
    echo "  ⚠ replay verification for hour $HOUR did not pass"
  echo ""
done

# ── Step 5: Compute final Validation Index ──
echo "=== Step 5: Final Validation Index ==="
FINAL_METRICS="${VAL_DIR}/evidence/bundles/Hour-72/metrics/ledger-status.json"
if [[ -f "$FINAL_METRICS" ]]; then
  python3 "${VAL_DIR}/evidence/validation-index.py" --metrics "$FINAL_METRICS" || true
else
  echo "  (final metrics not available — rehearsal used stubs)"
fi
echo ""

# ── Step 6: Report ──
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  REHEARSAL COMPLETE                                            ║"
echo "║  Commit: $COMMIT"
echo "║"
echo "║  Next steps if PASS:                                           ║"
echo "║    1. Run freeze-build.sh to freeze the build                  ║"
echo "║    2. Publish the protocol PDF with the frozen commit hash     ║"
echo "║    3. Schedule the public 72-hour run (run-rehearsal.sh --realtime) ║"
echo "╚════════════════════════════════════════════════════════════════╝"
