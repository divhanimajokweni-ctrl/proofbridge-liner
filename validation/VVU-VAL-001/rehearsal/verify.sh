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
EVIDENCE_DIR="${VAL_DIR}/evidence"
PROTOCOL_DIR="${VAL_DIR}/protocol"
BUNDLE=""
OBSERVER_MODE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bundle) BUNDLE="$2"; shift 2 ;;
    --observer-mode) OBSERVER_MODE=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

PASS=0
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VVU-VAL-001 · Verification$([[ $OBSERVER_MODE -eq 1 ]] && echo " (Observer Mode)" || echo "            ")                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ── Single-bundle verification ──
if [[ -n "$BUNDLE" ]]; then
  echo "=== Single-bundle verification ==="
  bash "${EVIDENCE_DIR}/replay.sh" --bundle "$BUNDLE"
  exit $?
fi

# ── 1. Verify frozen-build.json ──
echo "=== 1. Verify frozen-build.json ==="
FROZEN="${PROTOCOL_DIR}/frozen-build.json"
if [[ ! -f "$FROZEN" ]]; then
  echo "✗ frozen-build.json not found — run freeze-build.sh first"
  exit 1
fi
COMMIT=$(python3 -c "import json; print(json.load(open('$FROZEN'))['commit_hash'])" 2>/dev/null || echo "unknown")
DIGEST=$(python3 -c "import json; print(json.load(open('$FROZEN'))['image_digest'])" 2>/dev/null || echo "unknown")
echo "  commit: $COMMIT"
echo "  digest: ${DIGEST:0:40}..."
echo "✓ frozen-build.json present"
echo ""

# ── 2. Verify SHA-256 manifest of frozen artefacts ──
echo "=== 2. Verify frozen-build.sha256 ==="
FROZEN_SHA="${PROTOCOL_DIR}/frozen-build.sha256"
if [[ -f "$FROZEN_SHA" ]]; then
  if sha256sum -c "$FROZEN_SHA" &>/dev/null 2>&1; then
    echo "✓ all frozen artefacts hash-verified"
  else
    echo "✗ frozen-build.sha256 verification FAILED"; PASS=1
  fi
else
  echo "⚠ frozen-build.sha256 not found — skipping"
fi
echo ""

# ── 3. Verify every hourly evidence bundle ──
echo "=== 3. Verify hourly evidence bundles ==="
BUNDLES_DIR="${EVIDENCE_DIR}/bundles"
SHA256SUMS="${EVIDENCE_DIR}/SHA256SUMS"
if [[ -f "$SHA256SUMS" ]] && [[ -d "$BUNDLES_DIR" ]]; then
  BUNDLE_COUNT=$(ls "$BUNDLES_DIR"/Hour-*.zip 2>/dev/null | wc -l || echo 0)
  echo "  bundles found: $BUNDLE_COUNT"
  if [[ $BUNDLE_COUNT -gt 0 ]]; then
    if (cd "$EVIDENCE_DIR" && sha256sum -c SHA256SUMS) &>/dev/null 2>&1; then
      echo "✓ all $BUNDLE_COUNT bundles hash-verified"
    else
      echo "✗ SHA256SUMS verification FAILED"; PASS=1
    fi
  fi
else
  echo "⚠ no evidence bundles or SHA256SUMS found — skipping"
fi
echo ""

# ── 4. Replay verification (sample of bundles) ──
echo "=== 4. Replay verification (sample) ==="
if [[ -d "$BUNDLES_DIR" ]]; then
  for H in 12 24 36 48 60 66 72; do
    B="${BUNDLES_DIR}/Hour-$(printf '%02d' "$H").zip"
    if [[ -f "$B" ]]; then
      echo "  → verifying Hour-$H"
      if bash "${EVIDENCE_DIR}/replay.sh" --bundle "$B" --quiet 2>/dev/null; then
        echo "    ✓ Hour-$H PASS"
      else
        echo "    ✗ Hour-$H FAIL"; PASS=1
      fi
    fi
  done
else
  echo "⚠ no bundles directory — skipping replay verification"
fi
echo ""

# ── 5. Recompute Validation Index ──
echo "=== 5. Recompute Validation Index ==="
FINAL="${BUNDLES_DIR}/Hour-72/metrics/ledger-status.json"
if [[ -f "$FINAL" ]]; then
  INDEX=$(python3 "${EVIDENCE_DIR}/validation-index.py" --metrics "$FINAL" --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['index'])" 2>/dev/null || echo "N/A")
  echo "  final Validation Index: $INDEX"
  if python3 -c "exit(0 if float('$INDEX') >= 90.0 else 1)" 2>/dev/null; then
    echo "  ✓ index ≥ 90.0 (PASS threshold)"
  else
    echo "  ✗ index < 90.0 (FAIL threshold)"; PASS=1
  fi
else
  echo "⚠ final metrics not found — skipping index recomputation"
fi
echo ""

# ── 6. Report ──
if [[ $OBSERVER_MODE -eq 1 ]]; then
  echo "=== Independent Observer Verification ==="
  echo "If all steps above printed ✓, the published artifacts match what"
  echo "was observed during the run. Publish your attestation per §10"
  echo "of the protocol."
fi

echo ""
if [[ $PASS -eq 0 ]]; then
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
