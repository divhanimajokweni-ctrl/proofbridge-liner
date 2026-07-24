#!/usr/bin/env bash
# VVU-VAL-001 · P6 Security Injection
#
# Injects bad signatures, spoofed telemetry, bad ZK proofs, fake hashes,
# contradictory telemetry, clock skew, replay attacks, and duplicate IDs.
# Every injected payload MUST be rejected at the documented HF gate.
#
# Usage:
#   ./inject-security.sh --target http://epistemic-runtime/v1/telemetry --rate 50
#   ./inject-security.sh --dry-run

set -euo pipefail

TARGET="http://epistemic-runtime.vvu-runtime:80/v1/telemetry"
RATE="50"  # total injections per second across all categories
DURATION="${DURATION:-21600}"  # 6 hours (P6 is H60-H66)
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --rate) RATE="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then echo "[dry-run] $*"; else echo "[apply] $*"; "$@"; fi
}

echo "=== P6 Security Injection: target=${TARGET} rate=${RATE}/s duration=${DURATION}s ==="

# The security injector is a dedicated deployment that posts malformed
# telemetry to the runtime's ingestion endpoint. Each injection type is
# tagged with the HF gate it is designed to exercise.
#
# Injection types and their expected rejection gates:
#   bad_signature          → HF-001 (Evidence Compiler Pass 2)
#   spoofed_telemetry      → HF-001 (Evidence Compiler Pass 2)
#   bad_zk_proof           → HF-002 (GovernanceAnchor.sol)
#   fake_hash              → HF-002 (MMR verification)
#   contradictory_telemetry→ HF-005 (Policy rejection → Failure Fact)
#   clock_skew             → HF-005 (HLC anomaly detection)
#   replay_attack          → Evidence Compiler (duplicate detection)
#   duplicate_ids          → Evidence Compiler (ID uniqueness)

if kubectl -n vvu-runtime get deploy security-injector &>/dev/null 2>&1; then
  echo "→ scaling security-injector deployment to 3 replicas"
  run kubectl -n vvu-runtime scale deploy/security-injector --replicas=3
  run kubectl -n vvu-runtime set env deploy/security-injector \
    TARGET="${TARGET}" RATE="${RATE}" DURATION="${DURATION}" \
    INJECT_BAD_SIGNATURE=true \
    INJECT_SPOOFED_TELEMETRY=true \
    INJECT_BAD_ZK_PROOF=true \
    INJECT_FAKE_HASH=true \
    INJECT_CONTRADICTORY=true \
    INJECT_CLOCK_SKEW=true \
    INJECT_REPLAY_ATTACK=true \
    INJECT_DUPLICATE_IDS=true
  echo "→ security injector active — all 8 injection types enabled"
  echo "→ expected: every payload rejected at its documented HF gate"
else
  echo "→ security-injector deployment not found"
  echo "→ would post ${RATE} bad payloads/s to ${TARGET} for ${DURATION}s"
  echo "→ injection types:"
  echo "    HF-001: bad signatures, spoofed telemetry"
  echo "    HF-002: bad ZK proofs, fake hashes"
  echo "    HF-005: contradictory telemetry, clock skew"
  echo "    other:  replay attacks, duplicate IDs"
  if [[ "$DRY_RUN" -ne 1 ]]; then
    echo ""
    echo "⚠ cannot inject without the security-injector deployment"
    echo "  deploy it via: kubectl apply -f kubernetes/runtime.yaml"
    exit 1
  fi
fi

echo "=== P6 security injection active ==="
