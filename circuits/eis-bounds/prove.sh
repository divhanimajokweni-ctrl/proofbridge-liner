#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# EIS-BOUNDS — Full Proving Pipeline
# VRES v1.2 · VVU·SEARM Trust Operating System
# ═══════════════════════════════════════════════════════════════
#
# Pipeline:
#   1. Compile circuit (circom)
#   2. Powers of Tau ceremony (requires pot12_final.ptau)
#   3. Generate proving key (circuit.zkey)
#   4. Export verification key (verification_key.json)
#   5. Compute witness from input.json
#   6. Generate proof
#   7. Verify proof
#
# Prerequisites:
#   - circom installed (via Nix flake or cargo install)
#   - snarkjs installed (npm install -g snarkjs)
#   - pot12_final.ptau in circuits/eis-bounds/ (or specify path)
# ═══════════════════════════════════════════════════════════════

echo "━━━ EIS-BOUNDS Full Proving Pipeline ━━━"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PTAU="${PTAU:-pot12_final.ptau}"
INPUT="${INPUT:-input.json}"

# Step 1: Compile
echo "[1/7] Compiling circuit..."
if [ ! -f build/main.r1cs ]; then
    bash compile.sh
else
    echo "  Circuit already compiled. Use 'bash compile.sh' to recompile."
fi

# Step 2: Powers of Tau
echo "[2/7] Checking Powers of Tau ($PTAU)..."
if [ ! -f "$PTAU" ]; then
    echo "  ERROR: $PTAU not found."
    echo "  Download with: wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_12.ptau -O pot12_final.ptau"
    exit 1
fi
echo "  Powers of Tau found."

# Step 3: Generate zkey (proving key)
echo "[3/7] Generating proving key (circuit.zkey)..."
snarkjs groth16 setup build/main.r1cs "$PTAU" build/circuit.zkey

# Step 4: Export verification key
echo "[4/7] Exporting verification key..."
snarkjs zkey export verificationkey build/circuit.zkey build/verification_key.json

# Step 5: Compute witness
echo "[5/7] Computing witness from $INPUT..."
if [ ! -f "$INPUT" ]; then
    echo "  ERROR: $INPUT not found. Create it with eigenvalue witness data."
    echo '  Example: echo "{\"lambda\": [1000000, 500000, 300000, 200000, 150000, 100000, 50000, 25000]}" > input.json'
    exit 1
fi
node build/main.wasm "$INPUT" build/witness.wtns

# Step 6: Generate proof
echo "[6/7] Generating proof..."
snarkjs groth16 prove build/circuit.zkey build/witness.wtns build/proof.json build/public.json

# Step 7: Verify proof
echo "[7/7] Verifying proof..."
snarkjs groth16 verify build/verification_key.json build/public.json build/proof.json

echo ""
echo "━━━ Pipeline Complete ━━━"
echo "  Proof:      build/proof.json"
echo "  Public:     build/public.json"
echo "  VK:         build/verification_key.json"
echo "  ZKey:       build/circuit.zkey"
