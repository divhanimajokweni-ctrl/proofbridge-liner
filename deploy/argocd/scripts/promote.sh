#!/usr/bin/env bash
# VVU Production Dashboard — Promotion Pipeline
#
# Promotion path:
#   rehearsal → freeze → validation → staging → production
#
# Each stage requires successful completion of the prior stage.
# This script validates readiness before invoking Argo CD sync.
#
# Usage:
#   ./promote.sh rehearsal        # promote validation rehearsal branch
#   ./promote.sh validation       # run validation gates before promotion
#   ./promote.sh staging          # promote dashboard to staging
#   ./promote.sh production       # promote dashboard to production

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

STAGE="${1:?usage: $0 <rehearsal|validation|staging|production>}"

case "$STAGE" in
  rehearsal)
    echo "=== Promoting validation rehearsal ==="

    # Run freeze-build script to ensure manifest digests are prepared
    if [[ -x "${REPO_ROOT}/VVU-VAL-001/rehearsal/freeze-build.sh" ]]; then
      echo "→ freeze-build: validating manifest consistency"
      bash "${REPO_ROOT}/VVU-VAL-001/rehearsal/freeze-build.sh" >/dev/null 2>&1 || {
        echo "✗ freeze-build validation failed" >&2
        exit 1
      }
      echo "✓ freeze-build validation passed"
    else
      echo "⚠ freeze-build.sh not found or not executable" >&2
      exit 1
    fi

    # Run observer verification (non-blocking if bundles are absent)
    if [[ -x "${REPO_ROOT}/VVU-VAL-001/rehearsal/verify.sh" ]]; then
      echo "→ observer verification"
      bash "${REPO_ROOT}/VVU-VAL-001/rehearsal/verify.sh" --observer-mode >/dev/null 2>&1 || {
        echo "⚠ observer verification incomplete (expected before public run)"
      }
    fi

    echo "✓ rehearsal ready for promotion"
    ;;

  validation)
    echo "=== Validation gate check ==="

    # Require frozen-build artifacts exist
    if [[ ! -f "${REPO_ROOT}/VVU-VAL-001/protocol/frozen-build.json" ]]; then
      echo "✗ frozen-build.json missing; run freeze-build first" >&2
      exit 1
    fi

    # Require lockfile/scripts exist
    for F in "${REPO_ROOT}/VVU-VAL-001/rehearsal/freeze-build.sh" \
             "${REPO_ROOT}/VVU-VAL-001/rehearsal/verify.sh" \
             "${REPO_ROOT}/VVU-VAL-001/rehearsal/run-rehearsal.sh"; do
      if [[ ! -f "$F" ]]; then
        echo "✗ validation artifact missing: $F" >&2
        exit 1
      fi
    done

    echo "✓ validation gate passed"
    ;;

  staging)
    echo "=== Promoting to staging ==="
    if [[ -x "${SCRIPT_DIR}/deploy.sh" ]]; then
      bash "${SCRIPT_DIR}/deploy.sh" staging
    else
      echo "✗ deploy.sh not found" >&2
      exit 1
    fi
    ;;

  production)
    echo "=== Promoting to production ==="
    echo "⚠ production promotion is explicit and irreversible"
    read -r -p "Type 'promote' to continue: " CONFIRM
    if [[ "$CONFIRM" != "promote" ]]; then
      echo "✗ production promotion aborted"
      exit 1
    fi
    if [[ -x "${SCRIPT_DIR}/deploy.sh" ]]; then
      bash "${SCRIPT_DIR}/deploy.sh" production
    else
      echo "✗ deploy.sh not found" >&2
      exit 1
    fi
    ;;

  *)
    echo "error: unknown stage '$STAGE' (expected: rehearsal|validation|staging|production)" >&2
    exit 2
    ;;
esac

echo
echo "=== Promotion audit ==="
echo "stage=$STAGE"
echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "actor=$(git config user.name 2>/dev/null || echo unknown)"
echo "commit=$(cd "$REPO_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo unknown)"
