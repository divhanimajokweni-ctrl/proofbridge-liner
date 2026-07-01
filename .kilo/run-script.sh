#!/usr/bin/env bash
# Kilo Run Script — VVU Operatus Headless Server
# Starts the standalone VVU Operatus server with SafeLiner + SafeKrypte.
# Usage: invoked by Kilo Agent Manager "Run" button, or directly:
#   bash .kilo/run-script.sh

set -euo pipefail

PORT="${PORT:-4096}"
HOST="${HOST:-127.0.0.1}"

echo "[vvu-operatus] Starting headless server on ${HOST}:${PORT}..."

# Use tsx (ts-node alternative) if available, fallback to npx tsx
if command -v tsx &>/dev/null; then
  TS_RUNNER="tsx"
elif command -v npx &>/dev/null; then
  TS_RUNNER="npx tsx"
else
  echo "[vvu-operatus] ERROR: tsx not found. Install with: npm install -g tsx"
  exit 1
fi

PORT="${PORT}" HOST="${HOST}" exec "${TS_RUNNER}" server/vvu-operatus-server.ts
