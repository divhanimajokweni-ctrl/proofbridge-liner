#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Run ruff, mypy, bandit
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

echo "=== Running linters ==="
echo ""

EXIT_CODE=0

# ---- Ruff ----
echo "[1/3] ruff (linter + formatter check)..."
if python -m ruff check src/ ; then
    echo "  ruff: PASS ✓"
else
    echo "  ruff: FAIL ✗"
    EXIT_CODE=1
fi
echo ""

# ---- Mypy ----
echo "[2/3] mypy (type checker)..."
if python -m mypy src/production_ledger/ ; then
    echo "  mypy: PASS ✓"
else
    echo "  mypy: FAIL ✗"
    EXIT_CODE=1
fi
echo ""

# ---- Bandit ----
echo "[3/3] bandit (security linter)..."
if python -m bandit -r src/production_ledger/ -ll ; then
    echo "  bandit: PASS ✓"
else
    echo "  bandit: FAIL ✗"
    EXIT_CODE=1
fi
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "=== All linters passed ==="
else
    echo "=== Some linters failed ==="
    exit $EXIT_CODE
fi
