#!/usr/bin/env bash
set -euo pipefail

# VVU War Room — Gateway startup
# Run this on the machine that hosts the OpenClaw gateway.

OPENCLAW="npx openclaw"
CONFIG_SRC="openclaw.json"
CONFIG_DST="$HOME/.openclaw/openclaw.json"
GATEWAY_PORT="${GATEWAY_PORT:-18789}"

echo "==> VVU War Room Gateway Startup"
echo ""

# 1. Sync config if it exists
if [ -f "$CONFIG_SRC" ]; then
  mkdir -p "$(dirname "$CONFIG_DST")"
  cp "$CONFIG_SRC" "$CONFIG_DST"
  echo "[OK] Config synced: $CONFIG_SRC -> $CONFIG_DST"
else
  echo "[WARN] No $CONFIG_SRC found — using existing config"
fi

# 2. Start the gateway
echo "[..] Starting OpenClaw gateway on port $GATEWAY_PORT..."
$OPENCLAW gateway run --force &
GATEWAY_PID=$!

# 3. Wait for health check
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:$GATEWAY_PORT/health > /dev/null 2>&1; then
    echo "[OK] Gateway is LIVE (PID $GATEWAY_PID)"
    echo "     Local:  http://127.0.0.1:$GATEWAY_PORT"
    echo "     Health: http://127.0.0.1:$GATEWAY_PORT/health"
    echo ""
    echo "To expose via Tailscale:"
    echo "  tailscale serve --bg $GATEWAY_PORT"
    exit 0
  fi
  sleep 1
done

echo "[FAIL] Gateway did not respond within 15 seconds"
exit 1
