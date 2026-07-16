#!/usr/bin/env bash
# =============================================================================
# AIR Multi-Pass Compiler Pipeline Runner
# Chains all 5 passes sequentially with proper piping and exit code propagation.
#
# Usage: bash air/run-pipeline.sh
# Exit:  0 if all rules PASS, 1 if any rule BLOCKED
# =============================================================================
set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIPELINE_DIR="$SCRIPT_DIR/pipeline"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

pass() { printf " ${GREEN}PASS${NC} %s\n" "$1"; }
fail() { printf " ${RED}FAIL${NC} %s\n" "$1"; }
info() { printf " ${CYAN}..${NC} %s\n" "$1"; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AIR MULTI-PASS COMPILER PIPELINE                      ║"
echo "║  Collect → Normalize → Infer → Govern → Codegen         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── Pass 1: Collect ──────────────────────────────────────────────────────────
info "Pass 1: Collecting artifacts..."
COLLECT_OUTPUT=$(node "$PIPELINE_DIR/1_collect.js" 2>/dev/null)
if [ $? -ne 0 ]; then
  fail "Pass 1 (Collect) failed"
  exit 1
fi
pass "Pass 1: Artifacts collected"

# ─── Pass 2: Normalize ────────────────────────────────────────────────────────
info "Pass 2: Normalizing to Evidence IR..."
echo "$COLLECT_OUTPUT" | node "$PIPELINE_DIR/2_normalize.js" 2>/dev/null
if [ $? -ne 0 ]; then
  fail "Pass 2 (Normalize) failed"
  exit 1
fi
pass "Pass 2: Evidence IR normalized and appended to store"

# ─── Pass 3: Infer ────────────────────────────────────────────────────────────
info "Pass 3: Computing inferences..."
INFER_OUTPUT=$(node "$PIPELINE_DIR/3_infer.js" 2>/dev/null)
if [ $? -ne 0 ]; then
  fail "Pass 3 (Infer) failed"
  exit 1
fi
pass "Pass 3: Inference IR computed"

# ─── Pass 4: Govern ───────────────────────────────────────────────────────────
info "Pass 4: Evaluating governance rules..."
GOVERN_OUTPUT=$(echo "$INFER_OUTPUT" | node "$PIPELINE_DIR/4_govern.js" 2>/dev/null)
if [ $? -ne 0 ]; then
  fail "Pass 4 (Govern) failed"
  exit 1
fi
pass "Pass 4: Governance decisions made"

# ─── Pass 5: Codegen ──────────────────────────────────────────────────────────
info "Pass 5: Generating Knowledge Graph and ADRs..."
CODEGEN_INPUT=$(echo "{\"inferences\": $INFER_OUTPUT, \"decisions\": $GOVERN_OUTPUT}")
echo "$CODEGEN_INPUT" | node "$PIPELINE_DIR/5_codegen.js" 2>/dev/null
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  pass "Pass 5: All rules PASSED — release gate open"
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  AIR PIPELINE COMPLETE — ALL GATES CLEAR               ║"
  echo "╚══════════════════════════════════════════════════════════╝"
else
  fail "Pass 5: One or more rules BLOCKED — release gate closed"
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  AIR PIPELINE COMPLETE — RELEASE BLOCKED               ║"
  echo "╚══════════════════════════════════════════════════════════╝"
fi

exit $EXIT_CODE
