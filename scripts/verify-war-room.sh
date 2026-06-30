#!/usr/bin/env bash
set -euo pipefail

# VVU War Room — Health Verification Script
# Validates gateway, plugin files, and critical paths.

GATEWAY_PORT="${GATEWAY_PORT:-18789}"
BASE_URL="http://127.0.0.1:$GATEWAY_PORT"
PLUGIN_DIR=".obsidian/plugins/vvu-war-room"
DAILY_DIR="daily"
COMPLIANCE_DIR="compliance"
CRITICAL_FILES=(
  "app/api/verify/route.ts"
  "app/api/mint/route.ts"
  "src/middleware.ts"
  "AGENTS.md"
)

PASS=0
FAIL=0

check() {
  local label="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo "  [PASS] $label"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $label"
    FAIL=$((FAIL + 1))
  fi
}

echo "=============================================="
echo " VVU War Room — Verification Suite"
echo "=============================================="
echo ""

echo "--- Gateway Health ---"
check "Gateway /health" curl -sf "$BASE_URL/health"
check "Gateway Control UI" curl -sf "$BASE_URL/" -o /dev/null

echo ""
echo "--- Plugin Files ---"
check "Plugin manifest" test -f "$PLUGIN_DIR/manifest.json"
check "Plugin main.js" test -f "$PLUGIN_DIR/main.js"
check "Plugin data.json" test -f "$PLUGIN_DIR/data.json"
check "Plugin source" test -f "$PLUGIN_DIR/src/main.ts"

echo ""
echo "--- Obsidian Config ---"
check "community-plugins.json" test -f ".obsidian/community-plugins.json"
check "app.json" test -f ".obsidian/app.json"

echo ""
echo "--- Vault Folders ---"
check "daily/ folder" test -d "$DAILY_DIR"
check "compliance/ folder" test -d "$COMPLIANCE_DIR"

echo ""
echo "--- Critical Files (AGENTS.md pre-flight) ---"
for f in "${CRITICAL_FILES[@]}"; do
  check "$f" test -f "$f"
done

echo ""
echo "--- Auth Token ---"
TOKEN=$(grep -o '"token"[[:space:]]*:[[:space:]]*"[^"]*"' openclaw.json 2>/dev/null | cut -d'"' -f4 || echo "")
if [ -n "$TOKEN" ]; then
  echo "  [PASS] Auth token found in config"
  PASS=$((PASS + 1))
else
  echo "  [FAIL] Auth token missing"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=============================================="
echo " Results: $PASS passed, $FAIL failed"
echo "=============================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
