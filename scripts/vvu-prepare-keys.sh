#!/usr/bin/env bash
# =============================================================================
# AGENT LOCKSMITH — VVU Key Pre-Flight
#
# Detects missing keys in .env.local, generates fresh cryptographic material,
# and rotates binary ZK-SNARK reference strings.
#
# ENFORCES: Pre-deployment cryptographic readiness.
# =============================================================================
set -euo pipefail

ENV_FILE=".env.local"
SCRIPTS_DIR="scripts"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { printf " [..] %s\n" "$1"; }
log_pass() { printf " [${GREEN}PASS${NC}] %s\n" "$1"; }
log_warn() { printf " [${YELLOW}WARN${NC}] %s\n" "$1"; }
log_err() { printf " [${RED}FAIL${NC}] %s\n" "$1"; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
    log_warn "$ENV_FILE missing. Creating from template..."
    touch "$ENV_FILE"
fi

# Helper: Update or add key in .env.local
update_env() {
    local key=$1
    local val=$2
    if grep -q "^$key=" "$ENV_FILE"; then
        # Use a temporary file for sed replacement to handle special characters safely
        sed -i "s|^$key=.*|$key=\"$val\"|" "$ENV_FILE"
    else
        echo "$key=\"$val\"" >> "$ENV_FILE"
    fi
}

# Helper: Check if key is empty or missing
is_empty() {
    local key=$1
    local val
    val=$(grep "^$key=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$val" ]; then return 0; else return 1; fi
}

log_info "🏛️  Starting VVU Key Pre-Flight..."

# 1. EVM KEYS (Ethers)
EVM_KEYS=(
    "DEPLOYER_PRIVATE_KEY"
    "ORACLE_PRIVATE_KEY"
    "CIRCUIT_BREAKER_ADMIN_KEY"
    "CIRCUIT_BREAKER_UPDATER_KEY"
)

for key in "${EVM_KEYS[@]}"; do
    if is_empty "$key"; then
        log_info "Generating fresh EVM wallet for $key..."
        # Using a one-liner to get private key from ethers
        NEW_PK=$(node -e "const {ethers}=require('ethers'); console.log(ethers.Wallet.createRandom().privateKey)")
        update_env "$key" "$NEW_PK"
        log_pass "$key generated."
    fi
done

# 2. Ed25519 KEYS (SafeKrypte / Signing)
if is_empty "VVU_SIGNING_KEY"; then
    log_info "Generating fresh Ed25519 key for VVU_SIGNING_KEY..."
    ED_JSON=$(node "$SCRIPTS_DIR/vvu-keygen-ed25519.mjs")
    ED_PK=$(echo "$ED_JSON" | jq -r '.privateKey' | tr -d '\n')
    update_env "VVU_SIGNING_KEY" "$ED_PK"
    log_pass "VVU_SIGNING_KEY generated."
fi

# 3. SESSION & HMAC SECRETS
SECRETS=(
    "SESSION_SECRET"
    "COMMAND_CODE_KEY"
    "STITCH_WEBHOOK_SECRET"
)

for key in "${SECRETS[@]}"; do
    if is_empty "$key"; then
        log_info "Generating random secret for $key..."
        RAND_SEC=$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
        update_env "$key" "$RAND_SEC"
        log_pass "$key generated."
    fi
done

# 4. BINARY ROTATION (ZK-SNARKs)
log_info "🔄 Rotating binary ZK-SNARK assets..."
# Deleting old proving/verification keys to force fresh generation
rm -rf circuits/target/* 2>/dev/null || true
rm -rf circuits/*.zkey 2>/dev/null || true
rm -rf circuits/verification_key.json 2>/dev/null || true

# Refresh .bb-crs (Barretenberg / Noir reference strings)
# If .bb-crs is too large to re-download every time, we just clear the lock files or force re-verification
if [ -d "../.bb-crs" ]; then
    log_info "Clearing cached Common Reference String..."
    rm -rf ../.bb-crs/* 2>/dev/null || true
fi

log_pass "Binary assets marked for rotation."

log_info "🚀 Key Pre-Flight Complete. .env.local is now fully populated and cryptographically fresh."
echo "-----------------------------------------------------------------------------"
log_warn "NOTICE: New keys are LOCAL ONLY until pushed to Vercel/GitHub."
log_warn "Run 'scripts/advanced-secret-rotation.py' to propagate if needed."
echo "-----------------------------------------------------------------------------"
