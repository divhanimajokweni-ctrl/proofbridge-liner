#!/usr/bin/env bash
set -euo pipefail

# Agent Ecosystem Starter
# Starts the WhatsApp bridge and Next.js dev server together.
# Designed for localhost; adjust for your deployment target.

WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(pwd)}"
export WORKSPACE_ROOT

BRIDGE_PORT="${WHATSAPP_BRIDGE_PORT:-3456}"
NEXT_PORT="${NEXT_PORT:-3000}"
MISTRAL_KEY="${MISTRAL_API_KEY:-}"

if [[ -z "$MISTRAL_KEY" ]]; then
  echo "⚠️  MISTRAL_API_KEY not set. Mistral headless agent will fail on LLM calls."
  echo "   Export it or add to .env.mistral.local"
fi

cd "$WORKSPACE_ROOT"

echo "🔧 Agent Ecosystem Startup"
echo "   Workspace : $WORKSPACE_ROOT"
echo "   Bridge    : http://localhost:$BRIDGE_PORT"
echo "   Next.js   : http://localhost:$NEXT_PORT"

# 1. WhatsApp bridge (background)
if [[ -d "whatsapp-bridge" ]]; then
  echo "📱 Starting WhatsApp bridge..."
  pushd whatsapp-bridge >/dev/null
  node server.js > /tmp/whatsapp-bridge.log 2>&1 &
  BRIDGE_PID=$!
  popd >/dev/null
  echo "   WhatsApp bridge PID: $BRIDGE_PID"
else
  echo "⏭  whatsapp-bridge/ not found — skipping"
fi

# 2. Next.js dev server (foreground in this terminal)
echo "🌐 Starting Next.js..."
npm run dev -- -p "$NEXT_PORT"
