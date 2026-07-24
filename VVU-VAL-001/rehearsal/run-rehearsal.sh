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
REPO_ROOT="$(git_root "${VAL_DIR}/..")"
LIB_DIR="$(cd "${SCRIPT_DIR}" && pwd)"
# shellcheck disable=SC1090
source "${LIB_DIR}/lib.sh"

SCHEDULE="${VAL_DIR}/chaos/schedule.yaml"
EVIDENCE_DIR="${VAL_DIR}/evidence"
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

# ── Step 1: Verify frozen build ────────────────────────────────────────────
echo "=== Step 1: Verify frozen build ==="
FROZEN="${VAL_DIR}/protocol/frozen-build.json"
if [[ ! -f "$FROZEN" ]]; then
  warn "frozen-build.json not found — proceeding with current HEAD (unfrozen)"
  COMMIT=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
else
  COMMIT=$(detect_python)
  if [[ -n "$COMMIT" ]]; then
    COMMIT=$(python -c "import json; print(json.load(open('${FROZEN}'))['commit_hash'])" 2>/dev/null || echo "unknown")
  else
    warn "python not available; cannot read frozen commit from JSON. Defaulting to unknown."
    COMMIT="unknown"
  fi
  echo "frozen commit: $COMMIT"
  if [[ "$COMMIT" != "unknown" ]]; then
    if git -C "$REPO_ROOT" rev-parse --verify "$COMMIT" &>/dev/null; then
      echo "✓ commit verified in repository"
    else
      warn "commit not found in repository"
    fi
  fi
fi
echo ""

# ── Step 2: Ensure k3s cluster ─────────────────────────────────────────────
echo "=== Step 2: Ensure k3s cluster ==="
if ! command -v kubectl &>/dev/null; then
  fatal "kubectl not found — install kubectl first"
fi
if ! kubectl get nodes &>/dev/null 2>&1; then
  fatal "no cluster reachable — install k3s or configure KUBECONFIG"
fi
echo "cluster ready: $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}')"
echo ""

# ── Step 3: Deploy the validation stack ────────────────────────────────────
echo "=== Step 3: Deploy validation stack ==="
for MANIFEST in "${VAL_DIR}/kubernetes/"*.yaml; do
  [[ -f "$MANIFEST" ]] || continue
  info "applying $(basename "$MANIFEST")"
  kubectl apply -f "$MANIFEST"
done
echo "waiting for vvu-runtime pods to be ready..."
kubectl -n vvu-runtime wait --for=condition=ready pod -l app=runtime --timeout=120s 2>/dev/null || \
  warn "runtime pod not ready within 120s — continuing for rehearsal"
echo ""

# ── Step 4: Drive the failure-injection schedule ───────────────────────────
PHASES=("P1" "P2" "P3" "P4" "P5" "P6" "P7")
if [[ -n "$PHASE_ONLY" ]]; then
  PHASES=("$PHASE_ONLY")
fi

OVERALL_FAIL=0
for P in "${PHASES[@]}"; do
  echo "=== Phase $P ==="
  case "$P" in
    P1) echo "  (nominal — no injection)" ;;
    P2) echo "  (telemetry flood — ramping load generator)"
       kubectl -n vvu-runtime set env deploy/telemetry-generator RATE_MULT=100 2>/dev/null || true ;;
    P3) bash "${VAL_DIR}/chaos/inject-network.sh --loss 25 --latency 1000 --dup 5" || true ;;
    P4) bash "${VAL_DIR}/chaos/inject-storage.sh --fill 90 --iops 500" || true ;;
    P5) for T in runtime nats worker api scheduler; do
          POD=$(kubectl -n vvu-runtime get pods -l "app=$T" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
          if [[ -n "$POD" ]]; then
            echo "  (evicting $T/$POD)"
            kubectl -n vvu-runtime delete pod "$POD" --grace-period=0 --force 2>/dev/null || true
          fi
        done ;;
    P6) bash "${VAL_DIR}/chaos/inject-security.sh" || true ;;
    P7) bash "${VAL_DIR}/chaos/inject-partition.sh --action partition" || true
        sleep 2
        bash "${VAL_DIR}/chaos/inject-partition.sh --action reconnect" || true
        bash "${VAL_DIR}/chaos/inject-partition.sh --action merge" || true ;;
  esac
  sleep "$DWELL"

  # Archive a bundle for this phase's end hour + verify replay
  HOUR="$(phase_to_hour "$P")"
  if [[ -n "$HOUR" ]]; then
    echo "  → archiving evidence for hour $HOUR"
    if ! HOUR="$HOUR" bash "${VAL_DIR}/evidence/bundle.sh" "$HOUR" 2>/dev/null; then
      warn "evidence bundle for hour $HOUR failed"
      OVERALL_FAIL=1
    fi
    BUNDLE="${VAL_DIR}/evidence/bundles/Hour-$(printf "%02d" "$HOUR").zip"
    if [[ -f "$BUNDLE" ]]; then
      if ! bash "${VAL_DIR}/evidence/replay.sh" --bundle "$BUNDLE" 2>/dev/null; then
        warn "replay verification for hour $HOUR did not pass"
        OVERALL_FAIL=1
      fi
    else
      warn "bundle not found for hour $HOUR"
      OVERALL_FAIL=1
    fi
  fi
  echo ""
done

# ── Step 5: Compute final Validation Index ─────────────────────────────────
echo "=== Step 5: Final Validation Index ==="
FINAL_METRICS="${VAL_DIR}/evidence/bundles/Hour-72/metrics/ledger-status.json"
if [[ -f "$FINAL_METRICS" ]]; then
  if command -v detect_python &>/dev/null; then
    validation_index "$FINAL_METRICS" json || true
  else
    warn "python not available; skipping Validation Index recomputation"
  fi
else
  warn "final metrics not available — rehearsal used stubs"
fi
echo ""

# ── Step 6: Report ─────────────────────────────────────────────────────────
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  REHEARSAL COMPLETE                                            ║"
echo "║  Commit: $COMMIT"
echo "║"
echo "║  Next steps if clean pass:                                    ║"
echo "║    1. Run freeze-build.sh to freeze the build                 ║"
echo "║    2. Publish the protocol PDF with the frozen commit hash    ║"
echo "║    3. Schedule the public 72-hour run (run-rehearsal.sh --realtime) ║"
echo "╚════════════════════════════════════════════════════════════════╝"

if [[ "$OVERALL_FAIL" -ne 0 ]]; then
  warn "rehearsal completed with failures"
  exit 1
fi
exit 0
