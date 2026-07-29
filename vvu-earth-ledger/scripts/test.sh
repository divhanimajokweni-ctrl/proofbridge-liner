#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Run all tests with coverage
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "${PROJECT_DIR}"

# Ensure the virtual environment is active
if [ -z "${VIRTUAL_ENV:-}" ]; then
    if [ -f "${PROJECT_DIR}/.venv/bin/activate" ]; then
        source "${PROJECT_DIR}/.venv/bin/activate"
    fi
fi

echo "=== Running tests with coverage ==="

python -m pytest \
    --tb=short \
    --verbose \
    --cov=production_ledger \
    --cov-report=term-missing \
    --cov-report=html:htmlcov \
    --cov-fail-under=80 \
    "$@"

echo ""
echo "=== Tests complete ==="
