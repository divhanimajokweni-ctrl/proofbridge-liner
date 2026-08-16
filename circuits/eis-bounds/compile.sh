#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# EIS-BOUNDS — Circuit Compilation Script
# VRES v1.2 · VVU·SEARM Trust Operating System
# ═══════════════════════════════════════════════════════════════

echo "━━━ EIS-BOUNDS Circuit Compiler ━━━"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Step 1: Compile the circuit
echo "[1/3] Compiling main.circom → R1CS + WASM + SYM..."
circom main.circom --r1cs --wasm --sym -o build

# Step 2: Print constraint info
echo "[2/3] R1CS constraint info:"
snarkjs r1cs info build/main.r1cs

# Step 3: Print circuit info
echo "[3/3] Circuit compiled successfully."
echo ""
echo "Outputs:"
echo "  build/main.r1cs    — Rank-1 Constraint System"
echo "  build/main.wasm    — Witness generator (WASM)"
echo "  build/main.sym     — Symbol file (debug)"
echo ""
echo "Next: Run prove.sh to generate proving/verification keys and create a proof."
