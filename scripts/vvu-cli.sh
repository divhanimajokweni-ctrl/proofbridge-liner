#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0.0"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE="$(cd "$SCRIPTS_DIR/.." && pwd)"
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
SAFEKRIPTE_LITE_PORT="${SAFEKRIPTE_LITE_PORT:-5096}"
SAFELINER_LITE_PORT="${SAFELINER_LITE_PORT:-5097}"
OPERATUS_PORT="${OPERATUS_PORT:-4096}"

print_banner() {
  echo "VVU War Room CLI v$VERSION"
  echo "------------------------"
}

COMMAND="${1:-}"

case "$COMMAND" in
  install)
    print_banner
    echo "► installing VVU OS components..."
    mkdir -p "$WORKSPACE/data/wa_auth" "$WORKSPACE/data"
    echo "  [OK] data directories created"

    if [ ! -f "$OPENCLAW_CONFIG" ] && [ -f "$WORKSPACE/openclaw.json" ]; then
      mkdir -p "$(dirname "$OPENCLAW_CONFIG")"
      cp "$WORKSPACE/openclaw.json" "$OPENCLAW_CONFIG"
      echo "  [OK] openclaw config synced"
    fi

    echo ""
    echo "  To start all services:"
    echo "    vvu deploy"
    ;;

  deploy)
    print_banner
    echo "► configuring and starting services..."

    echo "  [..] SafeKrypte Lite on port $SAFEKRIPTE_LITE_PORT..."
    (npx tsx "$WORKSPACE/server/safekrypte-lite.ts" &)
    echo "  [OK] SafeKrypte Lite starting"

    echo "  [..] SafeLiner Lite on port $SAFELINER_LITE_PORT..."
    (npx tsx "$WORKSPACE/server/safeline-lite.ts" &)
    echo "  [OK] SafeLiner Lite starting"

    echo "  [..] VVU Operatus on port $OPERATUS_PORT..."
    (npx tsx "$WORKSPACE/server/vvu-operatus-server.ts" &)
    echo "  [OK] VVU Operatus starting"

    echo "  [..] OpenClaw gateway..."
    (npx openclaw gateway run --force &)
    echo "  [OK] OpenClaw gateway starting"

    echo ""
    echo "  Services starting in background. Check health:"
    echo "    vvu doctor"
    ;;

  doctor)
    print_banner
    echo "► running system health diagnostics..."

    check_service() {
      local name=$1 url=$2
      if curl -sf "$url" > /dev/null 2>&1; then
        echo "  [PASS] $name ($url)"
      else
        echo "  [FAIL] $name ($url) — not responding"
      fi
    }

    check_service "SafeKrypte Lite" "http://127.0.0.1:$SAFEKRIPTE_LITE_PORT/health"
    check_service "SafeLiner Lite" "http://127.0.0.1:$SAFELINER_LITE_PORT/health"
    check_service "VVU Operatus" "http://127.0.0.1:$OPERATUS_PORT/health"
    check_service "OpenClaw Gateway" "http://127.0.0.1:18789/health"

    echo ""
    check_file() {
      local label=$1 file=$2
      if [ -f "$file" ]; then
        echo "  [PASS] $label"
      else
        echo "  [FAIL] $label — missing: $file"
      fi
    }

    check_file "Lindiwe Agent Kernel" "$WORKSPACE/src/agent.ts"
    check_file "SafeKrypte Operator" "$WORKSPACE/src/lib/kernel/operators/safekrypte.ts"
    check_file "SafeLiner Operator" "$WORKSPACE/src/lib/kernel/operators/safeline.ts"
    check_file "VVU Operatus Runtime" "$WORKSPACE/src/lib/kernel/vvu-operatus.ts"

    echo ""
    echo "► key rotation check..."
    if [ -n "${KEY_ROTATION_MS:-}" ]; then
      echo "  [INFO] KEY_ROTATION_MS=$KEY_ROTATION_MS (rotation enabled)"
    else
      echo "  [INFO] KEY_ROTATION_MS not set (manual rotation only)"
    fi
    ;;

  logs)
    print_banner
    echo "► fetching live dashboard summary..."

    get_status() {
      local name=$1 url=$2
      local result
      result=$(curl -sf "$url" 2>/dev/null) || result='{"ok":false}'
      echo "$result"
    }

    echo "  SafeKrypte Lite:"
    get_status "SafeKrypte Lite" "http://127.0.0.1:$SAFEKRIPTE_LITE_PORT/commons/v1/stats" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('ok'):
    print(f'    Tier: {d[\"data\"][\"tier\"]} ({d[\"data\"][\"totalCreators\"]}/{d[\"data\"][\"tierMax\"]} creators)')
    print(f'    Attestations: {d[\"data\"][\"totalAttestations\"]}')
else:
    print('    Offline')
" 2>/dev/null || echo "    Offline"

    echo "  SafeLiner Lite:"
    get_status "SafeLiner Lite" "http://127.0.0.1:$SAFELINER_LITE_PORT/commons/v1/stats" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('ok'):
    print(f'    Tier: {d[\"data\"][\"tier\"]} ({d[\"data\"][\"totalCredentials\"]}/{d[\"data\"][\"tierMax\"]} credentials)')
    print(f'    Issuer: {d[\"data\"][\"issuer\"]}')
else:
    print('    Offline')
" 2>/dev/null || echo "    Offline"

    echo "  VVU Operatus:"
    get_status "Operatus" "http://127.0.0.1:$OPERATUS_PORT/status" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('success'):
    s = d['data']
    for op in s.get('operators', []):
        print(f'    {op[\"name\"]}: {op[\"state\"]}')
else:
    print('    Offline')
" 2>/dev/null || echo "    Offline"
    ;;

  *)
    echo "VVU War Room CLI v$VERSION"
    echo ""
    echo "Usage: vvu <command>"
    echo ""
    echo "Commands:"
    echo "  install   Deploy VVU OS components and prepare data directories"
    echo "  deploy    Start all VVU OS services (SafeKrypte Lite, SafeLiner Lite, Operatus, OpenClaw)"
    echo "  doctor    Run system health diagnostics on all services and critical files"
    echo "  logs      Tail service logs (safekrypte/safeliner/operatus/openclaw)"
    echo "  status    Fetch live dashboard summary from all running services"
    exit 1
    ;;
esac
