#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Build wheel and source distribution
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

echo "=== Building distribution packages ==="

# Clean previous builds
rm -rf "${PROJECT_DIR}/dist" "${PROJECT_DIR}/build" "*.egg-info"

# Build wheel and source distribution
python -m build

echo ""
echo "=== Build complete ==="
echo ""
echo "Output files:"
ls -la "${PROJECT_DIR}/dist/"
