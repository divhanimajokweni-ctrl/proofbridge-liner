#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────
# ProofBridge-Liner AIR Kernel — Campaign Runner
# Maps 12 evaluation campaigns to executable test commands.
# Run from project root: bash scripts/run-campaigns.sh [campaign#|all]
# ───────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

RESULTS_DIR="$ROOT/test-campaign-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SUMMARY="$RESULTS_DIR/campaign-summary-$TIMESTAMP.md"

pass() { echo -e "  ${GREEN}PASS${NC} $1"; }
fail() { echo -e "  ${RED}FAIL${NC} $1"; }
skip() { echo -e "  ${YELLOW}SKIP${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}═══ Campaign $1: $2 ═══${NC}"; }

run_vitest() {
  local label="$1"; shift
  local outfile="$RESULTS_DIR/${label}.txt"
  if npx vitest run "$@" > "$outfile" 2>&1; then
    pass "$label"
    echo "| $label | PASS |" >> "$SUMMARY"
  else
    fail "$label"
    echo "| $label | FAIL |" >> "$SUMMARY"
  fi
}

run_script() {
  local label="$1"; shift
  local outfile="$RESULTS_DIR/${label}.txt"
  if npx tsx "$@" > "$outfile" 2>&1; then
    pass "$label"
    echo "| $label | PASS |" >> "$SUMMARY"
  else
    fail "$label"
    echo "| $label | FAIL |" >> "$SUMMARY"
  fi
}

run_command() {
  local label="$1"; shift
  local outfile="$RESULTS_DIR/${label}.txt"
  if eval "$@" > "$outfile" 2>&1; then
    pass "$label"
    echo "| $label | PASS |" >> "$SUMMARY"
  else
    fail "$label"
    echo "| $label | FAIL |" >> "$SUMMARY"
  fi
}

cat > "$SUMMARY" <<EOF
# Campaign Execution Summary — $TIMESTAMP

| Campaign | Status |
|----------|--------|
EOF

CAMPAIGN="${1:-all}"

# ─── Campaign 1: Constitutional Governance ─────────────────────
run_campaign_1() {
  header 1 "Constitutional Governance"
  echo "Verifying policy gate, kill-switch, and execution contract enforcement."

  run_vitest "c1-policy-gate" "packages/trust-api/__tests__/enforce-policy-gate.test.ts"
  run_vitest "c1-execution-contract" "packages/trust-api/__tests__/enforce-execution-contract.test.ts"
  run_vitest "c1-kill-switch" "packages/trust-api/__tests__/kill-switch.test.ts"
  run_vitest "c1-agent-registry" "packages/trust-api/__tests__/agent-registry.test.ts"
  run_vitest "c1-founder-brief" "packages/trust-api/__tests__/founder-brief.test.ts"
}

# ─── Campaign 2: Evidence Ledger ──────────────────────────────
run_campaign_2() {
  header 2 "Evidence Ledger"
  echo "Verifying envelope build, hash, sign, store, tamper detection."

  run_vitest "c2-evidence-envelope" "src/lib/evidence/__tests__/evidence-envelope.test.ts"
  run_vitest "c2-gate-integration" "src/lib/evidence/__tests__/gate-integration.test.ts"
  run_script "c2-air-pipeline" "scripts/run-air-pipeline.ts"
}

# ─── Campaign 3: Capability Registry ──────────────────────────
run_campaign_3() {
  header 3 "Capability & Contract Registry"
  echo "Verifying type guards, registry, negotiator, adapter contracts."

  run_vitest "c3-runtime-contracts" "contracts/__tests__/runtime-contracts.test.ts"
  run_vitest "c3-crypto-hash" "packages/trust-crypto/__tests__/hash.test.ts"
}

# ─── Campaign 4: Trust Runtime ────────────────────────────────
run_campaign_4() {
  header 4 "Trust Runtime"
  echo "Verifying event store, reducer, projections, replay, SSE, runtime."

  run_vitest "c4-runtime" "src/lib/trust-runtime/__tests__/runtime.test.ts"
  run_vitest "c4-reducer" "src/lib/trust-runtime/__tests__/reducer.test.ts"
  run_vitest "c4-projections" "src/lib/trust-runtime/__tests__/projection-manager.test.ts"
  run_vitest "c4-event-store" "src/lib/trust-runtime/__tests__/event-store.test.ts"
  run_vitest "c4-verify-replay" "src/lib/trust-runtime/__tests__/verify-replay.test.ts"
  run_vitest "c4-verify-authoritative-sse" "src/lib/trust-runtime/__tests__/verify-authoritative-sse.test.ts"
  run_vitest "c4-verify-projections" "src/lib/trust-runtime/__tests__/verify-projections-authoritative.test.ts"
  run_vitest "c4-verify-colony" "src/lib/trust-runtime/__tests__/verify-colony.test.ts"
  run_vitest "c4-verify-sse-reconnect" "src/lib/trust-runtime/__tests__/verify-sse-reconnect.test.ts"
}

# ─── Campaign 5: Agent Runtime ────────────────────────────────
run_campaign_5() {
  header 5 "Agent Runtime"
  echo "Verifying async event journal, context manager, risk engine."

  run_vitest "c5-event-journal" "packages/trust-runtime/__tests__/event-journal-async.test.ts"
  run_vitest "c5-context-manager" "packages/trust-runtime/__tests__/context-manager-async.test.ts"
  run_vitest "c5-risk-engine" "packages/trust-runtime/__tests__/risk-engine-rules.test.ts"
}

# ─── Campaign 6: Tenant Isolation ─────────────────────────────
run_campaign_6() {
  header 6 "Tenant Isolation"
  echo "Verifying cross-tenant data, secrets, and audit isolation."

  run_vitest "c6-isolation" "src/lib/tenant/__tests__/isolation.test.ts"
}

# ─── Campaign 7: Auth & Identity ──────────────────────────────
run_campaign_7() {
  header 7 "Auth & Identity"
  echo "Verifying Clerk config, Supabase auth, session helpers."

  run_vitest "c7-clerk-auth" "src/lib/session/__tests__/clerk.test.ts"
}

# ─── Campaign 8: Governance ───────────────────────────────────
run_campaign_8() {
  header 8 "Governance"
  echo "Verifying signed registry, compatibility, quorum."
  echo "(Note: these are Jest tests outside vitest config — run separately)"

  run_command "c8-signed-registry" "npx jest tests/governance/signed-registry.test.ts --no-cache"
  run_command "c8-compatibility" "npx jest tests/governance/compatibility.test.ts --no-cache"
  run_command "c8-quorum-registry" "npx jest tests/governance/quorum-registry.test.ts --no-cache"
}

# ─── Campaign 9: Watchdog & Observability ─────────────────────
run_campaign_9() {
  header 9 "Watchdog & Observability"
  echo "Verifying heartbeat schema, fault classification."

  run_vitest "c9-heartbeat-schema" "src/lib/watchdog/__tests__/HeartbeatSchema.test.ts"
}

# ─── Campaign 10: Compliance & SOC2 ───────────────────────────
run_campaign_10() {
  header 10 "Compliance & SOC2"
  echo "Verifying spec validation, behavioral coverage."

  run_command "c10-validate-specs" "npx jest __tests__/validate-specs.test.ts --no-cache"
  run_script "c10-behavioral-coverage" "scripts/behavioral-coverage.ts"
}

# ─── Campaign 11: E2E & Integration ───────────────────────────
run_campaign_11() {
  header 11 "E2E & Integration (Playwright)"
  echo "Verifying full page loads, auth flows, navigation."
  echo "(Requires: npx playwright install chromium && dev server on :3000)"

  run_command "c11-e2e-proofbridge" "npx playwright test e2e/proofbridge.spec.ts --reporter=line"
  run_command "c11-e2e-auth" "npx playwright test e2e/auth.spec.ts --reporter=line"
  run_command "c11-e2e-pools" "npx playwright test e2e/pools.spec.ts --reporter=line"
  run_command "c11-e2e-gateway" "npx playwright test e2e/gateway.spec.ts --reporter=line"
}

# ─── Campaign 12: Operational Stress ──────────────────────────
run_campaign_12() {
  header 12 "Operational Stress"
  echo "Verifying chaos injection, stress queues, pipeline resilience."

  run_script "c12-stress-test-queue" "scripts/stress-test-queue.ts"
  run_script "c12-chaos-burst" "scripts/chaos-burst.js"
}

# ─── Run requested campaigns ──────────────────────────────────
echo -e "${BOLD}${CYAN}ProofBridge-Liner AIR Kernel — Campaign Runner${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Results:   $RESULTS_DIR/"
echo ""

if [ "$CAMPAIGN" = "all" ]; then
  run_campaign_1
  run_campaign_2
  run_campaign_3
  run_campaign_4
  run_campaign_5
  run_campaign_6
  run_campaign_7
  run_campaign_8
  run_campaign_9
  run_campaign_10
  run_campaign_11
  run_campaign_12
else
  case "$CAMPAIGN" in
    1) run_campaign_1 ;;
    2) run_campaign_2 ;;
    3) run_campaign_3 ;;
    4) run_campaign_4 ;;
    5) run_campaign_5 ;;
    6) run_campaign_6 ;;
    7) run_campaign_7 ;;
    8) run_campaign_8 ;;
    9) run_campaign_9 ;;
    10) run_campaign_10 ;;
    11) run_campaign_11 ;;
    12) run_campaign_12 ;;
    *) echo "Unknown campaign: $CAMPAIGN (use 1-12 or 'all')"; exit 1 ;;
  esac
fi

# ─── Summary ──────────────────────────────────────────────────
echo -e "\n${BOLD}${CYAN}═══ SUMMARY ═══${NC}"
PASS_COUNT=$(grep -c "|.*| PASS |" "$SUMMARY" || true)
FAIL_COUNT=$(grep -c "|.*| FAIL |" "$SUMMARY" || true)
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo -e "  ${GREEN}PASS: $PASS_COUNT${NC} / $TOTAL"
echo -e "  ${RED}FAIL: $FAIL_COUNT${NC} / $TOTAL"
echo ""
echo "Full summary: $SUMMARY"
echo "Per-campaign logs: $RESULTS_DIR/"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}Failed campaigns:${NC}"
  grep "|.*| FAIL |" "$SUMMARY"
fi

echo ""
echo "─── To compare observations, share: ───"
echo "  cat $SUMMARY"
echo "  ls $RESULTS_DIR/"
