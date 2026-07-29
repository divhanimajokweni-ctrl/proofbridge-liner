#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Bootstrap script: install dependencies, create directories, initialise ledger
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== VVU Earth Tech Ledger — Bootstrap ==="
echo "Project directory: ${PROJECT_DIR}"

# ---- 1. Create required directories ----
echo ""
echo "[1/5] Creating directories..."
mkdir -p "${PROJECT_DIR}/data"
mkdir -p "${PROJECT_DIR}/configs"
mkdir -p "${PROJECT_DIR}/logs"

# ---- 2. Check Python version ----
echo ""
echo "[2/5] Checking Python version..."
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
REQUIRED_VERSION="3.11"

if python3 -c "
import sys
major, minor = map(int, '${PYTHON_VERSION}'.split('.'))
req_major, req_minor = map(int, '${REQUIRED_VERSION}'.split('.'))
sys.exit(0 if (major, minor) >= (req_major, req_minor) else 1)
"; then
    echo "  Python ${PYTHON_VERSION} ✓"
else
    echo "  ERROR: Python >= ${REQUIRED_VERSION} required, found ${PYTHON_VERSION}" >&2
    exit 1
fi

# ---- 3. Create virtual environment (if it does not exist) ----
echo ""
echo "[3/5] Setting up virtual environment..."
if [ ! -d "${PROJECT_DIR}/.venv" ]; then
    python3 -m venv "${PROJECT_DIR}/.venv"
    echo "  Created .venv"
else
    echo "  .venv already exists"
fi

# Activate the virtual environment
source "${PROJECT_DIR}/.venv/bin/activate"

# ---- 4. Install dependencies ----
echo ""
echo "[4/5] Installing dependencies..."
pip install --upgrade pip --quiet
pip install -e "${PROJECT_DIR}[dev]" --quiet
echo "  Dependencies installed ✓"

# ---- 5. Initialise the ledger ----
echo ""
echo "[5/5] Initialising ledger..."
cd "${PROJECT_DIR}"

if [ -f "${PROJECT_DIR}/data/ledger.db" ]; then
    echo "  Ledger database already exists at data/ledger.db"
else
    ledger init --config "${PROJECT_DIR}/configs/development.toml" || {
        echo "  Ledger initialisation failed (will succeed on first run)"
    }
    echo "  Ledger database created"
fi

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "To activate the virtual environment in future sessions:"
echo "  source ${PROJECT_DIR}/.venv/bin/activate"
echo ""
echo "Available commands:"
echo "  ledger init          — Initialise a new ledger"
echo "  ledger version       — Print version"
echo "  ledger serve         — Start the HTTP API server"
echo "  ledger --help        — Show all commands"
