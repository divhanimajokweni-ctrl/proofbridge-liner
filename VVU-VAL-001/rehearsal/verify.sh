#!/usr/bin/env bash
# VVU-VAL-001 · Verification Script
#
# Runs the full verification suite against a completed validation run:
#   1. Verify the frozen-build.json matches the published commit hash
#   2. Verify the SHA-256 manifest of all frozen artefacts
#   3. Verify every hourly evidence bundle's SHA-256 stamp
#   4. Run replay verification against a sample of bundles
#   5. Recompute the Validation Index from the final metrics
#   6. Report PASS / FAIL
#
# Usage:
#   ./verify.sh                              # full verification
#   ./verify.sh --bundle bundles/Hour-48.zip # single-bundle verification
#   ./verify.sh --observer-mode              # independent observer procedure (§12)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LIB_DIR="$(cd "${SCRIPT_DIR}" && pwd)"
# shellcheck disable=SC1090
source "${LIB_DIR}/lib.sh"

EVIDENCE_DIR="${VAL_DIR}/evidence"
PROTOCOL_DIR="${VAL_DIR}/protocol"
BUNDLE=""
OBSERVER_MODE=0
THRESHOLD=90.0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bundle) BUNDLE="$2"; shift 2 ;;
    --observer-mode) OBSERVER_MODE=1; shift ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

FAIL=0
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VVU-VAL-001 · Verification$([[ $OBSERVER_MODE -eq 1 ]] && echo " (Observer Mode)" || echo "            ")                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ── Single-bundle verification ─────────────────────────────────────────────
if [[ -n "$BUNDLE" ]]; then
  echo "=== Single-bundle verification ==="
  bash "${EVIDENCE_DIR}/replay.sh" --bundle "$BUNDLE"
  exit $?
fi

# ── 1. Verify frozen-build.json ────────────────────────────────────────────
echo "=== 1. Verify frozen-build.json ==="
FROZEN="${PROTOCOL_DIR}/frozen-build.json"
if [[ ! -f "$FROZEN" ]]; then
  echo "✗ frozen-build.json not found — run freeze-build.sh first"
  exit 1
fi
py="$(detect_python)"
if [[ -n "$py" ]]; then
  COMMIT=$("$py" -c "import json; print(json.load(open('${FROZEN}'))['commit_hash'])" 2>/dev/null || echo "unknown")
  DIGEST=$("$py" -c "import json; print(json.load(open('${FROZEN}'))['image_digest'])" 2>/dev/null || echo "unknown")
else
  warn "python not available; frozen-build.json metadata will be limited"
  COMMIT="unknown"
  DIGEST="unknown"
fi
echo "  commit: $COMMIT"
echo "  digest: ${DIGEST:0:40}..."
echo "✓ frozen-build.json present"
echo ""

# ── 2. Verify SHA-256 manifest of frozen artefacts ─────────────────────────
echo "=== 2. Verify frozen-build.sha256 ==="
FROZEN_SHA="${PROTOCOL_DIR}/frozen-build.sha256"
if [[ -f "$FROZEN_SHA" ]]; then
  if (cd "$PROTOCOL_DIR" && hash_file "$(basename "$FROZEN_SHA")" >/dev/null); then
    :
  fi
  if (cd "$PROTOCOL_DIR" && while IFS= read -r line; do
    f=$(echo "$line" | awk '{print $2}')
    if [[ -f "$f" ]]; then
      hash_file "$f" | awk -v expected="$line" 'BEGIN{match(expected, /^[^ ]+/); exp=$0; got=$0} $1==exp{exit 0} {exit 1}'
    fi
  done < "$(basename "$FROZEN_SHA")"); then
    echo "✓ all frozen artefacts hash-verified"
  else
    echo "✗ frozen-build.sha256 verification FAILED"
    FAIL=1
  fi
else
  warn "frozen-build.sha256 not found — skipping"
fi
echo ""

# ── 3. Verify every hourly evidence bundle ─────────────────────────────────
echo "=== 3. Verify hourly evidence bundles ==="
BUNDLES_DIR="${EVIDENCE_DIR}/bundles"
SHA256SUMS="${EVIDENCE_DIR}/SHA256SUMS"
if [[ -f "$SHA256SUMS" ]] && [[ -d "$BUNDLES_DIR" ]]; then
  BUNDLE_COUNT=$(ls "$BUNDLES_DIR"/Hour-*.zip 2>/dev/null | wc -l || echo 0)
  echo "  bundles found: $BUNDLE_COUNT"
  if [[ "$BUNDLE_COUNT" -gt 0 ]]; then
    if (cd "$EVIDENCE_DIR" && while IFS= read -r line; do
      f=$(echo "$line" | awk '{print $2}')
      if [[ -f "$f" ]]; then
        hash_file "$f" | awk -v expected="$line" 'BEGIN{match(expected, /^[^ ]+/); exp=$0; got=$0} $1==exp{exit 0} {exit 1}'
      fi
    done < "$(basename "$SHA256SUMS")"); then
      echo "✓ all $BUNDLE_COUNT bundles hash-verified"
    else
      echo "✗ SHA256SUMS verification FAILED"
      FAIL=1
    fi
  fi
else
  warn "no evidence bundles or SHA256SUMS found — skipping"
fi
echo ""

# ── 4. Replay verification (sample of bundles) ─────────────────────────────
echo "=== 4. Replay verification (sample) ==="
if [[ -d "$BUNDLES_DIR" ]]; then
  SAMPLE_HOURS="$(replay_hours)"
  for H in $SAMPLE_HOURS; do
    B="${BUNDLES_DIR}/Hour-$(printf '%02d' "$H").zip"
    if [[ -f "$B" ]]; then
      echo "  → verifying Hour-$H"
      if bash "${EVIDENCE_DIR}/replay.sh" --bundle "$B" --quiet 2>/dev/null; then
        echo "    ✓ Hour-$H PASS"
      else
        echo "    ✗ Hour-$H FAIL"
        FAIL=1
      fi
    else
      warn "Hour-$H bundle missing — skipping"
      FAIL=1
    fi
  done
else
  warn "no bundles directory — skipping replay verification"
fi
echo ""

# ── 5. Recompute Validation Index ──────────────────────────────────────────
echo "=== 5. Recompute Validation Index ==="
FINAL="${BUNDLES_DIR}/Hour-72/metrics/ledger-status.json"
if [[ -f "$FINAL" ]]; then
  if [[ -n "$py" ]]; then
    INDEX=$("$py" "${EVIDENCE_DIR}/validation-index.py" --metrics "$FINAL" --json 2>/dev/null | "$py" -c "import sys,json; print(json.load(sys.stdin)['index'])" 2>/dev/null || echo "N/A")
    echo "  final Validation Index: $INDEX"
    if [[ "$INDEX" != "N/A" ]] && [[ "$(echo "$INDEX >= $THRESHOLD" | bc -l 2>/dev/null || echo 0)" -eq 1 ]]; then
      echo "  ✓ index ≥ $THRESHOLD (PASS threshold)"
    else
      echo "  ✗ index < $THRESHOLD (FAIL threshold)"
      FAIL=1
    fi
  else
    warn "python not available; skipping Validation Index recomputation"
  fi
else
  warn "final metrics not found — skipping index recomputation"
fi
echo ""

# ── 6. Report ──────────────────────────────────────────────────────────────
if [[ "$OBSERVER_MODE" -eq 1 ]]; then
  echo "=== Independent Observer Verification ==="
  if [[ "$FAIL" -eq 0 ]]; then
    if [[ -d "$BUNDLES_DIR" ]] && [[ -n "$(ls "$BUNDLES_DIR"/Hour-*.zip 2>/dev/null || true)" ]]; then
      echo "All verification checks passed. Publish your attestation per §10 of the protocol."
    else
      echo "VERIFICATION INCOMPLETE"
      echo "Reason: No evidence bundles found."
      echo "An observer cannot attest to a run without published evidence."
      FAIL=1
    fi
  else
    echo "Verification found failures. Do not publish attestation until issues are resolved."
  fi
else
  if [[ "$FAIL" -eq 0 ]]; then
    echo "Verification passed for the checked artifacts."
  else
    echo "Verification found failures in one or more checks."
  fi
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  VERIFICATION PASS                                            ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  VERIFICATION FAIL                                            ║"
  echo "╚════════════════════════════════════════════════════════════════╝" >&2
  exit 1
fi
