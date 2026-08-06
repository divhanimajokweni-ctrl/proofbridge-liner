#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# VVU OS — Start Script
# Boots the full operational system: Next.js server + OpenClaw gateway
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            VVU OS — System Boot Sequence                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── Phase 1: Build ────────────────────────────────────────────────────────
echo "► [PHASE 1] Building Next.js application..."
npm run build 2>&1 | tail -3
echo "   ✓ Build complete"
echo ""

# ─── Phase 2: Start OpenClaw Gateway (background) ──────────────────────────
echo "► [PHASE 2] Starting War Room Gateway (OpenClaw)..."
if command -v openclaw &>/dev/null; then
  openclaw gateway &
  GATEWAY_PID=$!
  echo "   ✓ Gateway PID: $GATEWAY_PID"
else
  echo "   ⚠ openclaw not found in PATH — gateway must be started manually"
fi
echo ""

# ─── Phase 3: Start Next.js Dev Server (background) ────────────────────────
echo "► [PHASE 3] Starting VVU OS API Server (Next.js)..."
PORT=${PORT:-3000}
npx next dev -p "$PORT" &
SERVER_PID=$!
echo "   ✓ Server PID: $SERVER_PID (port $PORT)"
echo ""

# ─── Phase 4: Verify ────────────────────────────────────────────────────────
echo "► [PHASE 4] Verifying system health..."
sleep 3

# Check server
if curl -sf "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; then
  echo "   ✓ API health: OK"
else
  echo "   ⚠ API health: waiting..."
fi

# Check operatus
if curl -sf "http://127.0.0.1:$PORT/api/operatus" > /dev/null 2>&1; then
  echo "   ✓ Operatus: RUNNING"
  curl -s "http://127.0.0.1:$PORT/api/operatus" | python3 -c "
import sys, json
d = json.load(sys.stdin)
k = d.get('data', {}).get('kernel', {})
print(f'   ✓ Kernel: {k.get(\"totalProcessesSpawned\", 0)} processes, {k.get(\"memoryUsed\", 0)}MB used')
ops = d.get('data', {}).get('operators', [])
for op in ops:
    print(f'   ✓ {op[\"name\"]}: {op[\"state\"]} (PID {op[\"pid\"]})')
"
else
  echo "   ⚠ Operatus: not yet available"
fi
echo ""

# ─── Phase 5: Ready ─────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            VVU OS — System Operational                        ║"
echo "║                                                              ║"
echo "║   API: http://127.0.0.1:$PORT/api/operatus                     "
echo "║   Gateway: http://127.0.0.1:18789 (if OpenClaw running)       "
echo "║   Health: http://127.0.0.1:$PORT/api/health                    "
echo "║                                                              ║"
echo "║   Commands:                                                   ║"
echo "║     curl http://127.0.0.1:$PORT/api/operatus          # status  "
echo "║     curl -X POST .../api/operatus/tick                # tick    "
echo "║     curl -X POST .../api/operatus/panic?reboot=true   # reboot  "
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Wait for either process to exit
trap "kill $SERVER_PID ${GATEWAY_PID:-} 2>/dev/null; exit 0" INT TERM
wait
