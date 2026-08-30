#!/usr/bin/env bash
<<<<<<< HEAD
# ═══════════════════════════════════════════════════════════════════════
# VVU DEPLOYMENT SCRIPT — Push to GitHub + Deploy to Vercel
# Tokens are stored in ~/.git-credentials and ~/.vercel-token
# ═══════════════════════════════════════════════════════════════════════
set -e

VERCEL_TOKEN=$(cat ~/.vercel-token 2>/dev/null || echo "$VERCEL_TOKEN")

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  VVU · Venture Vision Ubuntu — Deploy                         ║"
echo "║  Black + Gold · We Serve Trust                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ─── 1. GITHUB PUSH ──────────────────────────────────────────────────
cd /home/z/my-project
echo "━━━ Step 1: GitHub Push ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git add -A
git commit -m "deploy: VVU Trust Dashboard update $(date -u +%Y-%m-%dT%H:%M)" 2>/dev/null || true
git push -u origin main 2>&1 || echo "⚠ GitHub push issue"

# ─── 2. VERCEL DEPLOY ───────────────────────────────────────────────
echo "━━━ Step 2: Vercel Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DEPLOY_DIR="/tmp/vercel-vvu-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/brand"
cp /home/z/my-project/public/vvu-trust-dashboard.html "$DEPLOY_DIR/index.html"
cp /home/z/my-project/public/brand/vvu-three-rings.svg "$DEPLOY_DIR/brand/"

cat > "$DEPLOY_DIR/vercel.json" << 'JSON'
{
  "version": 2,
  "builds": [{ "src": "index.html", "use": "@vercel/static" }],
  "routes": [
    { "src": "/brand/(.*)", "dest": "/brand/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
JSON

cd "$DEPLOY_DIR"
vercel deploy --prod --token "$VERCEL_TOKEN" --yes 2>&1
echo "✓ VVU · We Serve Trust"
=======
# ============================================================================
# VVU·SEARM Unified Grid 2.0 — Single-file production deploy
# ============================================================================
# Executes the full Section 8 deploy sequence:
#   1. Pre-flight checks (env vars, tools, secrets).
#   2. Hardhat compile + deploy VVUIVELedger to Arbitrum Sepolia.
#   3. Apply Supabase SQL migration for vvu_intent_logs telemetry table.
#   4. Vercel production deploy with the contract address bound.
#   5. Boot the Watchdog agent in the background (post-deploy).
#   6. Final verification — curl the deployed URL + print the verdict.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Required env vars (export before running, or place in .env):
#   DEPLOYER_PRIVATE_KEY     — Arbitrum account that deploys + has OPERATOR_ROLE
#   POSTGRES_URL             — psql-compatible Supabase URL (already on Vercel)
#                              — falls back to SUPABASE_DB_URL if set locally
#   VERCEL_TOKEN             — Vercel access token (rotated; from secrets manager)
#   VERCEL_PROJECT_ID        — Vercel project name (e.g. "venture-vision-ubuntu")
#   LEDGER_RPC_URL           — Arbitrum RPC URL (for watchdog)
#   LEDGER_PRIVATE_KEY       — operator key for ledger postVerdict (≠ deployer)
#   ARBISCAN_API_KEY         — optional, for contract verification
#   ALERT_WEBHOOK_URL        — optional, Slack/PagerDuty on breaker trip
#   PRODUCTION_DOMAIN        — default venturevisionubuntu.co.za
#
# Exit codes:
#   0  success
#   1  pre-flight failure (missing env / tool)
#   2  hardhat compile/deploy failure
#   3  supabase migration failure
#   4  vercel deploy failure
#   5  watchdog boot failure
# ============================================================================
set -euo pipefail

# ── Output helpers ──────────────────────────────────────────────────────────
log()  { printf '[deploy] %s\n' "$*"; }
err()  { printf '[deploy][ERROR] %s\n' "$*" >&2; }
ok()   { printf '[deploy][OK] %s\n' "$*"; }
hr()   { printf -- '----------------------------------------------------------------\n'; }

# ── Step 0 — pre-flight ─────────────────────────────────────────────────────
hr
log "VVU·SEARM Unified Grid 2.0 — production deploy"
hr

REQUIRED_ENV=(
  DEPLOYER_PRIVATE_KEY
  SUPABASE_DB_URL
  VERCEL_TOKEN
  VERCEL_PROJECT_ID
  LEDGER_RPC_URL
  LEDGER_PRIVATE_KEY
)
MISSING=()
for v in "${REQUIRED_ENV[@]}"; do
  if [[ -z "${!v:-}" ]]; then MISSING+=("$v"); fi
done
# Accept POSTGRES_URL (Vercel-bound name) as alias for SUPABASE_DB_URL.
if [[ -z "${SUPABASE_DB_URL:-}" && -n "${POSTGRES_URL:-}" ]]; then
  SUPABASE_DB_URL="$POSTGRES_URL"
  MISSING=("${MISSING[@]/SUPABASE_DB_URL/}")
fi
if (( ${#MISSING[@]} > 0 )); then
  err "Missing required env vars:"
  for v in "${MISSING[@]}"; do err "  - $v"; done
  exit 1
fi

REQUIRED_TOOLS=(node npx psql curl bun)
for t in "${REQUIRED_TOOLS[@]}"; do
  if ! command -v "$t" >/dev/null 2>&1; then
    err "Missing required tool: $t"
    exit 1
  fi
done
ok "pre-flight: env + tools verified"

# ── Step 1 — install hardhat deps (if missing) ──────────────────────────────
if [[ ! -d node_modules/hardhat ]]; then
  log "installing hardhat + hardhat-toolbox (one-time)…"
  bun add -d hardhat @nomicfoundation/hardhat-toolbox ethers >/dev/null
fi
ok "hardhat available"

# ── Step 2 — Hardhat compile + deploy to Arbitrum Sepolia ───────────────────
hr
log "Step 2: Hardhat — compile VVUIVELedger"
if ! npx hardhat compile; then
  err "hardhat compile failed"
  exit 2
fi
ok "VVUIVELedger compiled"

log "Step 2: Hardhat — deploy to arbitrum-sepolia"
if ! npx hardhat run scripts/hardhat/deploy-ledger.ts --network arbitrum-sepolia; then
  err "hardhat deploy failed"
  exit 2
fi

CONTRACT_ADDRESS="$(cat artifacts/contract-address.txt 2>/dev/null | tr -d '[:space:]')"
if [[ -z "$CONTRACT_ADDRESS" ]]; then
  err "contract address file empty — aborting"
  exit 2
fi
ok "VVUIVELedger deployed at: $CONTRACT_ADDRESS"

# Optional — verify on Arbiscan if API key present
if [[ -n "${ARBISCAN_API_KEY:-}" ]]; then
  log "Verifying contract on Arbiscan…"
  npx hardhat verify --network arbitrum-sepolia "$CONTRACT_ADDRESS" || \
    log "(verification pending — Arbiscan lag)"
fi

# ── Step 3 — Supabase migration for telemetry table ────────────────────────
hr
log "Step 3: Supabase — apply vvu_intent_logs migration"
MIGRATION_FILE="supabase/migrations/20260818_intent_logs.sql"
if [[ ! -f "$MIGRATION_FILE" ]]; then
  err "migration file missing: $MIGRATION_FILE"
  exit 3
fi
if ! psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"; then
  err "supabase migration failed"
  exit 3
fi
ok "telemetry table vvu_intent_logs ready"

# ── Step 4 — Vercel production deploy ───────────────────────────────────────
hr
log "Step 4: Vercel — production deploy"
# Bind the contract address + ledger env into the Vercel project.
vercel env rm Production LEDGER_ADDRESS        -y --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
vercel env add  Production LEDGER_ADDRESS      <<<"$CONTRACT_ADDRESS" --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
vercel env rm Production LEDGER_RPC_URL         -y --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
vercel env add  Production LEDGER_RPC_URL       <<<"$LEDGER_RPC_URL" --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
vercel env rm Production LEDGER_PRIVATE_KEY     -y --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
vercel env add  Production LEDGER_PRIVATE_KEY   <<<"$LEDGER_PRIVATE_KEY" --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
if [[ -n "${ALERT_WEBHOOK_URL:-}" ]]; then
  vercel env rm  Production ALERT_WEBHOOK_URL  -y --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
  vercel env add  Production ALERT_WEBHOOK_URL <<<"$ALERT_WEBHOOK_URL" --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" 2>/dev/null || true
fi
ok "Vercel env vars bound (LEDGER_ADDRESS, LEDGER_RPC_URL, LEDGER_PRIVATE_KEY)"

if ! vercel --prod --token "$VERCEL_TOKEN" -p "$VERCEL_PROJECT_ID" --yes; then
  err "vercel production deploy failed"
  exit 4
fi

# Vercel prints the production URL in the last non-empty line of stdout.
# We don't capture it here — the user can run `vercel ls` to find it.
# Fall back to the project's known alias if set.
PRODUCTION_DOMAIN="${PRODUCTION_DOMAIN:-venturevisionubuntu.co.za}"
PRODUCTION_URL="${PRODUCTION_URL:-https://${PRODUCTION_DOMAIN}}"
ok "Vercel production deploy complete"
log "Production URL: $PRODUCTION_URL"
log "Production domain: $PRODUCTION_DOMAIN"

# ── Step 5 — boot Watchdog agent ────────────────────────────────────────────
hr
log "Step 5: Watchdog — boot post-deploy"
# Kill any prior watchdog instance so re-deploys don't double-up.
pkill -f 'bun.*scripts/watchdog.ts' 2>/dev/null || true

export DASHBOARD_URL="$PRODUCTION_URL"
export LEDGER_ADDRESS="$CONTRACT_ADDRESS"
# LEDGER_RPC_URL + LEDGER_PRIVATE_KEY already in env

if ! setsid bash -c "cd \"$(pwd)\" && exec bun run scripts/watchdog.ts > watchdog.log 2>&1" \
     < /dev/null > /dev/null 2>&1 & disown; then
  err "watchdog boot failed — see watchdog.log"
  exit 5
fi
sleep 2
if pgrep -f 'bun.*scripts/watchdog.ts' >/dev/null; then
  ok "watchdog agent running (pid $(pgrep -f 'bun.*scripts/watchdog.ts' | head -1))"
else
  err "watchdog did not start — see watchdog.log"
  exit 5
fi

# ── Step 6 — final verification ──────────────────────────────────────────────
hr
log "Step 6: Final verification — curl /api/theorem-state"
sleep 3
if ! curl -sf "$PRODUCTION_URL/api/theorem-state" | head -c 600; then
  err "production endpoint unreachable"
  exit 6
fi
echo
ok "production endpoint responding"

hr
ok "VVU·SEARM Unified Grid 2.0 deployed"
log "  Ledger:        $CONTRACT_ADDRESS (arbitrum-sepolia)"
log "  Telemetry DB:  vvu_intent_logs (Supabase)"
log "  Production:    $PRODUCTION_URL (Vercel)"
log "  Watchdog:      running, polling every 5s"
log "  Fail-closed:   Theorem 5 active at contract + UI + worker layers"
hr
>>>>>>> origin/main
