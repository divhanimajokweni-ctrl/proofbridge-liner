#!/bin/bash

# VVU Platform: Production Readiness & Connectivity Diagnostic
# Description: Validates files, environment variables, and network connectivity for Replit/Kilo CLI.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}--- VVU GATEWAY DIAGNOSTIC START ---${NC}"

# 1. Pre-flight File Validation (AGENTS.md requirements)
echo -e "\n${YELLOW}[1/4] Validating Critical Files...${NC}"
FILES=("src/app/api/verify/route.ts" "src/app/api/mint/route.ts" "src/middleware.ts" "AGENTS.md")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists.${NC}"
    else
        echo -e "${RED}✗ CRITICAL: $file is missing!${NC}"
        EXIT_CODE=1
    fi
done

# 2. Environment Variable Existence Check
echo -e "\n${YELLOW}[2/4] Checking Environment Variables...${NC}"
VARS=(
    "CANTON_JSON_API"
    "POLYGON_AMOY_RPC"
    "CIRCUIT_BREAKER_UPDATER_KEY"
    "CIRCUIT_BREAKER_UPDATER_ADDRESS"
    "CIRCUIT_BREAKER_ADDRESS"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
    "FROST_SHARE_1_HEX"
    "FROST_GROUP_KEY"
)

for var in "${VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}✗ $var is NOT set.${NC}"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✓ $var is set.${NC}"
    fi
done

# 3. Network & API Connectivity Checks
echo -e "\n${YELLOW}[3/4] Testing API Connectivity...${NC}"

# Polygon Amoy RPC
BLOCK=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "$POLYGON_AMOY_RPC" | grep -o "result")
if [ "$BLOCK" == "result" ]; then
    echo -e "${GREEN}✓ Polygon Amoy RPC: Connected.${NC}"
else
    echo -e "${RED}✗ Polygon Amoy RPC: Connection Failed.${NC}"
    EXIT_CODE=1
fi

# Circuit Breaker Contract Code Verification
if [ ! -z "$CIRCUIT_BREAKER_ADDRESS" ]; then
    CODE=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["'$CIRCUIT_BREAKER_ADDRESS'", "latest"],"id":1}' "$POLYGON_AMOY_RPC" | grep -oE "0x[0-9a-fA-F]+")
    if [ "$CODE" != "0x" ] && [ ! -z "$CODE" ]; then
        echo -e "${GREEN}✓ CircuitBreaker Contract: Found at $CIRCUIT_BREAKER_ADDRESS.${NC}"
    else
        echo -e "${RED}✗ CircuitBreaker Contract: Not found at $CIRCUIT_BREAKER_ADDRESS (or RPC error).${NC}"
        EXIT_CODE=1
    fi
fi

# Supabase Health
SB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/auth/v1/health")
if [ "$SB_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ Supabase Auth: Reachable.${NC}"
else
    echo -e "${RED}✗ Supabase Auth: Failed with status $SB_STATUS.${NC}"
    EXIT_CODE=1
fi

# Canton API check (Optional, depends on internal visibility)
CANTON_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$CANTON_JSON_API/v1/health" || echo "failed")
if [ "$CANTON_HEALTH" == "200" ]; then
    echo -e "${GREEN}✓ Canton Ledger API: Reachable.${NC}"
else
    echo -e "${YELLOW}! Canton Ledger API: $CANTON_HEALTH (May be internal-only).${NC}"
fi

# 4. Build Validation
echo -e "\n${YELLOW}[4/4] Final Verdict...${NC}"
if [ "$EXIT_CODE" == "1" ]; then
    echo -e "${RED}--- DIAGNOSTIC FAILED ---${NC}"
    echo -e "${RED}Please resolve the errors above before deploying.${NC}"
    exit 1
else
    echo -e "${GREEN}--- ALL SYSTEMS GO ---${NC}"
    echo -e "${GREEN}Environment is primed for 'npm run build' and 'npm run start'.${NC}"
    exit 0
fi