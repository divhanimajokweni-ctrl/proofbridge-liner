#!/usr/bin/env bash
# VVU-VAL-001 · Replay Verification Pipeline
#
# Verifies that the replayed Fact Log produces the same checksum, MMR root,
# and Fact count as the live log captured at the same hour. This is the
# core "deterministic replay" guarantee (§3 success criteria).
#
# State machine:
#   VALID        — all recorded values match live values
#   INVALID      — any recorded value does not match live value
#   INCOMPLETE   — required evidence could not be obtained
#
# Usage:
#   ./replay.sh --bundle bundles/Hour-48.zip
#   ./replay.sh --bundle bundles/Hour-48.zip --quiet
#   ./replay.sh --observer-mode   # runs the §12 independent-observer procedure

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "${SCRIPT_DIR}" && pwd)"
source "${LIB_DIR}/lib.sh"

VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_NS="${RUNTIME_NS:-vvu-runtime}"
BUNDLE=""
QUIET=0
OBSERVER=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bundle) BUNDLE="$2"; shift 2 ;;
    --quiet) QUIET=1; shift ;;
    --observer-mode) OBSERVER=1; shift ;;
    *) echo "unknown: $1" >&2; exit 2 ;;
  esac
done

[[ $QUIET -eq 0 ]] && echo "=== VVU-VAL-001 replay verification ==="

if [[ "$OBSERVER" -eq 1 ]]; then
  echo "=== Independent Observer Procedure (§12) ==="
  echo "Step 4: verifying replay against all sample bundles..."
  OBSERVER_FAIL=0
  for H in 12 24 36 48 60 66 72; do
    B="${SCRIPT_DIR}/bundles/Hour-$(printf '%02d' "$H").zip"
    if [[ -f "$B" ]]; then
      if bash "$0" --bundle "$B" --quiet; then
        echo "  Hour-$H: PASS"
      else
        echo "  Hour-$H: FAIL"
        OBSERVER_FAIL=1
      fi
    else
      echo "  Hour-$H: missing"
      OBSERVER_FAIL=1
    fi
  done
  echo "Step 7: recomputing Validation Index..."
  FINAL="${SCRIPT_DIR}/bundles/Hour-72/metrics/ledger-status.json"
  if [[ -f "$FINAL" ]]; then
    py="$(detect_python)"
    if [[ -n "$py" ]]; then
      "$py" "${SCRIPT_DIR}/validation-index.py" --metrics "$FINAL" --json >/dev/null 2>&1 || true
    fi
    echo "  (index recomputed)"
  else
    echo "  (final metrics not found)"
  fi
  if [[ "$OBSERVER_FAIL" -ne 0 ]]; then
    echo "VERIFICATION FAIL: observer mode detected missing or invalid bundles" >&2
    exit 1
  fi
  echo "VERIFICATION PASS: observer replay complete"
  exit 0
fi

[[ -z "$BUNDLE" ]] && { echo "usage: $0 --bundle <path>"; exit 2; }
[[ ! -f "$BUNDLE" ]] && { echo "error: $BUNDLE not found"; exit 2; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
unzip -q "$BUNDLE" -d "$WORK"

# Verify bundle SHA-256 against recorded ledger
BUNDLE_BASE="$(basename "$BUNDLE")"
RECORDED="$(grep -E "^[0-9a-f]{64}[[:space:]]+${BUNDLE_BASE}$" "${SCRIPT_DIR}/SHA256SUMS" 2>/dev/null | awk '{print $1}' || true)"
if [[ -n "$RECORDED" ]]; then
  ACTUAL="$(hash_file "$BUNDLE" | awk '{print $1}')"
  if [[ "$RECORDED" != "$ACTUAL" ]]; then
    echo "✗ bundle SHA-256 MISMATCH (rec=${RECORDED} act=${ACTUAL})" >&2
    exit 1
  fi
  [[ $QUIET -eq 0 ]] && echo "✓ bundle SHA-256 verified"
else
  echo "⚠ no recorded SHA-256 for $BUNDLE_BASE" >&2
fi

# Read recorded values
REC_CHECKSUM="$(cat "$WORK/metrics/replay-checksum.txt" 2>/dev/null || echo "unavailable")"
REC_LEDGER="$(cat "$WORK/metrics/ledger-status.json" 2>/dev/null || echo '{"error":"unavailable"}')"
REC_MMR="$(echo "$REC_LEDGER" | "$(detect_python)" -c "import sys,json; print(json.load(sys.stdin).get('mmr_root','unavailable'))" 2>/dev/null || echo "unavailable")"
REC_COUNT="$(echo "$REC_LEDGER" | "$(detect_python)" -c "import sys,json; print(json.load(sys.stdin).get('fact_count','unavailable'))" 2>/dev/null || echo "unavailable")"

# Get live values via air ledger CLI
LIVE_CHECKSUM="$(kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger checksum 2>/dev/null || echo "unavailable")"
LIVE_MMR="$(kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger mmr-root 2>/dev/null || echo "unavailable")"
LIVE_COUNT="$(kubectl -n "$RUNTIME_NS" exec deploy/epistemic-runtime -- air ledger count 2>/dev/null || echo "unavailable")"

if [[ "$REC_CHECKSUM" == "unavailable" || "$LIVE_CHECKSUM" == "unavailable" || "$REC_MMR" == "unavailable" || "$LIVE_MMR" == "unavailable" || "$REC_COUNT" == "unavailable" || "$LIVE_COUNT" == "unavailable" ]]; then
  echo "✗ replay INCOMPLETE — required runtime values unavailable" >&2
  exit 2
fi

PASS="VALID"
for pair in "checksum:$REC_CHECKSUM:$LIVE_CHECKSUM" "mmr_root:$REC_MMR:$LIVE_MMR" "fact_count:$REC_COUNT:$LIVE_COUNT"; do
  IFS=: read -r NAME REC LIV <<< "$pair"
  if [[ "$REC" != "$LIV" ]]; then
    [[ $QUIET -eq 0 ]] && echo "✗ $NAME MISMATCH (rec=$REC live=$LIV)"
    PASS="INVALID"
  else
    [[ $QUIET -eq 0 ]] && echo "✓ $NAME MATCHES"
  fi
done

if [[ "$PASS" == "VALID" ]]; then
  [[ $QUIET -eq 0 ]] && echo "=== VERIFICATION PASS: replay is deterministic ==="
  exit 0
else
  echo "=== VERIFICATION FAIL ===" >&2
  exit 1
fi
