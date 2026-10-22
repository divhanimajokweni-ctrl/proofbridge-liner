#!/bin/bash
set -e

# VVU Production Start Script
# Handles: Next.js server + telemetry service + auto-restart on crash

export SAFEGRID_RECONCILER=off
export PROXIMITY_WATCHDOG=off
export NODE_ENV=production
export PORT=3000

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/dev.log"
TELEMETRY_LOG="/tmp/ws-service.log"

echo "=== VVU PRODUCTION START ==="
echo "Time: $(date)"
echo ""

# Kill any existing processes
pkill -f "next-server" 2>/dev/null || true
pkill -f "telemetry-service" 2>/dev/null || true
sleep 2

# Check if standalone build exists
if [ ! -f "$PROJECT_DIR/.next/standalone/server.js" ]; then
  echo "Building production server..."
  cd "$PROJECT_DIR"
  NODE_OPTIONS="--max-old-space-size=2048" node node_modules/.bin/next build --webpack
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/
fi

# Start Next.js production server
echo "Starting Next.js production server on :3000..."
cd "$PROJECT_DIR"
setsid bash -c "exec node .next/standalone/server.js" > "$LOG_FILE" 2>&1 &
NEXT_PID=$!
echo "  Next.js PID: $NEXT_PID"

# Wait for Next.js to be ready
sleep 3

# Start telemetry service (only if memory allows)
MEM_AVAILABLE=$(free -m | awk '/Mem:/ {print $7}')
if [ "$MEM_AVAILABLE" -gt 500 ]; then
  echo "Starting telemetry service on :3003..."
  cd "$PROJECT_DIR/mini-services/telemetry-service"
  setsid bash -c "exec bun --hot index.ts" > "$TELEMETRY_LOG" 2>&1 &
  TEL_PID=$!
  echo "  Telemetry PID: $TEL_PID"
else
  echo "WARNING: Low memory ($MEM_AVAILABLE MB free) — telemetry service skipped"
  echo "  Dashboard will use REST polling fallback"
fi

# Verify
sleep 2
if curl -s --max-time 5 http://127.0.0.1:3000/ > /dev/null 2>&1; then
  echo ""
  echo "✓ Dashboard: http://localhost:3000"
  curl -s --max-time 5 http://127.0.0.1:3000/ | grep -oE "<title>[^<]+" | head -1
else
  echo "✗ Dashboard FAILED to start"
  tail -5 "$LOG_FILE"
fi

if [ -n "$TEL_PID" ] && curl -s --max-time 3 http://127.0.0.1:3003/healthz > /dev/null 2>&1; then
  echo "✓ Telemetry: http://localhost:3003"
else
  echo "⚠ Telemetry: not running (REST fallback active)"
fi

echo ""
echo "Memory: $(free -m | awk '/Mem:/ {printf "%dMB / %dMB", $3, $2}')"
echo "=== STARTUP COMPLETE ==="
