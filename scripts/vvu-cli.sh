#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0.0"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE="$(cd "$SCRIPTS_DIR/.." && pwd)"
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
SAFEKRIPTE_LITE_PORT="${SAFEKRIPTE_LITE_PORT:-5096}"
SAFELINER_LITE_PORT="${SAFELINER_LITE_PORT:-5097}"
OPERATUS_PORT="${OPERATUS_PORT:-4096}"
OPENCLAW_PORT="${OPENCLAW_PORT:-18789}"
PID_DIR="/tmp/vvu-pids"
MAX_RETRIES=3

cleanup() {
  echo ""
  echo "► cleaning up child processes..."
  for pidfile in "$PID_DIR"/*.pid; do
    [ -f "$pidfile" ] && kill "$(cat "$pidfile")" 2>/dev/null && rm -f "$pidfile"
  done
  exit 0
}
trap cleanup SIGINT SIGTERM SIGHUP

mkdir -p "$PID_DIR"

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

    start_daemon() {
      local name=$1 cmd=$2 pidfile="$PID_DIR/$3.pid" url=$4
      local retry=0
      echo "  [..] $name..."
      eval "$cmd" &
      local pid=$!
      echo "$pid" > "$pidfile"
      while [ $retry -lt $MAX_RETRIES ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
          echo "  [OK] $name (PID $pid)"
          return 0
        fi
        sleep 1
        retry=$((retry + 1))
      done
      echo "  [WARN] $name — health check timeout after ${MAX_RETRIES}s"
    }

    start_daemon "SafeKrypte Lite" "npx tsx \"$WORKSPACE/server/safekrypte-lite.ts\"" "safekrypte" "http://127.0.0.1:$SAFEKRIPTE_LITE_PORT/health"
    start_daemon "SafeLiner Lite" "npx tsx \"$WORKSPACE/server/safeline-lite.ts\"" "safeline" "http://127.0.0.1:$SAFELINER_LITE_PORT/health"
    start_daemon "VVU Operatus" "npx tsx \"$WORKSPACE/server/vvu-operatus-server.ts\"" "operatus" "http://127.0.0.1:$OPERATUS_PORT/health"
    start_daemon "OpenClaw Gateway" "npx openclaw gateway run --force" "openclaw" "http://127.0.0.1:$OPENCLAW_PORT/health"

    echo ""
    echo "  All services started. Check health:"
    echo "    vvu doctor"
    ;;

  stop)
    print_banner
    echo "► stopping all VVU OS services..."
    cleanup
    ;;

  doctor)
    print_banner
    echo "► running system health diagnostics..."

    FAIL_COUNT=0
    check_service() {
      local name=$1 url=$2
      if curl -sf --max-time 3 "$url" > /dev/null 2>&1; then
        echo "  [PASS] $name ($url)"
      else
        echo "  [FAIL] $name ($url) — not responding"
        FAIL_COUNT=$((FAIL_COUNT + 1))
      fi
    }

    check_service "SafeKrypte Lite" "http://127.0.0.1:$SAFEKRIPTE_LITE_PORT/health"
    check_service "SafeLiner Lite" "http://127.0.0.1:$SAFELINER_LITE_PORT/health"
    check_service "VVU Operatus" "http://127.0.0.1:$OPERATUS_PORT/health"
    check_service "OpenClaw Gateway" "http://127.0.0.1:$OPENCLAW_PORT/health"

    echo ""
    check_file() {
      local label=$1 file=$2
      if [ -f "$file" ]; then
        echo "  [PASS] $label"
      else
        echo "  [FAIL] $label — missing: $file"
        FAIL_COUNT=$((FAIL_COUNT + 1))
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

    echo ""
    if [ "$FAIL_COUNT" -gt 0 ]; then
      echo "  Result: $FAIL_COUNT failure(s) detected"
      return 1
    fi
    echo "  Result: all checks passed"
    ;;

  logs)
    print_banner
    SERVICE="${2:-}"
    LOGFILE="${3:-}"
    case "$SERVICE" in
      safekrypte|sk)
        LOGPATH="${LOGFILE:-/tmp/vvu-safekrypte-lite.log}"
        echo "► tailing SafeKrypte Lite logs..."
        if [ -f "$LOGPATH" ]; then tail -f "$LOGPATH"; else echo "  No log at $LOGPATH (services run in foreground)"; fi
        ;;
      safeliner|sl)
        LOGPATH="${LOGFILE:-/tmp/vvu-safeline-lite.log}"
        echo "► tailing SafeLiner Lite logs..."
        if [ -f "$LOGPATH" ]; then tail -f "$LOGPATH"; else echo "  No log at $LOGPATH (services run in foreground)"; fi
        ;;
      operatus|op)
        LOGPATH="${LOGFILE:-/tmp/vvu-operatus.log}"
        echo "► tailing VVU Operatus logs..."
        if [ -f "$LOGPATH" ]; then tail -f "$LOGPATH"; else echo "  No log at $LOGPATH (services run in foreground)"; fi
        ;;
      openclaw|gw)
        LOGPATH="${LOGFILE:-/tmp/vvu-openclaw.log}"
        echo "► tailing OpenClaw gateway logs..."
        if [ -f "$LOGPATH" ]; then tail -f "$LOGPATH"; else echo "  No log at $LOGPATH (services run in foreground)"; fi
        ;;
      "")
        echo "  Usage: vvu logs <service> [logfile]"
        echo "  Services: safekrypte (sk), safeliner (sl), operatus (op), openclaw (gw)"
        ;;
      *)
        echo "  Unknown service: $SERVICE"
        echo "  Available: safekrypte, safeliner, operatus, openclaw"
        ;;
    esac
    ;;

  status)
    print_banner
    echo "► fetching live dashboard summary..."

    json_val() {
      local json=$1 key=$2
      echo "$json" | sed -n 's/.*"'"$key"'"\s*:\s*"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/p'
    }

    echo "  SafeKrypte Lite:"
    sk_stats=$(curl -sf --max-time 3 "http://127.0.0.1:$SAFEKRIPTE_LITE_PORT/commons/v1/stats" 2>/dev/null || echo '{"ok":false}')
    sk_ok=$(json_val "$sk_stats" "ok")
    if [ "$sk_ok" = "true" ]; then
      sk_tier=$(json_val "$sk_stats" "tier")
      sk_used=$(json_val "$sk_stats" "totalCreators")
      sk_max=$(json_val "$sk_stats" "tierMax")
      echo "    Tier: $sk_tier ($sk_used/$sk_max creators)"
    else
      echo "    Offline"
    fi

    echo "  SafeLiner Lite:"
    sl_stats=$(curl -sf --max-time 3 "http://127.0.0.1:$SAFELINER_LITE_PORT/commons/v1/stats" 2>/dev/null || echo '{"ok":false}')
    sl_ok=$(json_val "$sl_stats" "ok")
    if [ "$sl_ok" = "true" ]; then
      sl_tier=$(json_val "$sl_stats" "tier")
      sl_used=$(json_val "$sl_stats" "totalCredentials")
      sl_max=$(json_val "$sl_stats" "tierMax")
      echo "    Tier: $sl_tier ($sl_used/$sl_max credentials)"
    else
      echo "    Offline"
    fi

    echo "  VVU Operatus:"
    op_stats=$(curl -sf --max-time 3 "http://127.0.0.1:$OPERATUS_PORT/status" 2>/dev/null || echo '{"success":false}')
    op_ok=$(json_val "$op_stats" "success")
    if [ "$op_ok" = "true" ]; then
      echo "    Kernel online"
    else
      echo "    Offline"
    fi
    ;;

  *)
    echo "VVU War Room CLI v$VERSION"
    echo ""
    echo "Usage: vvu <command>"
    echo ""
    echo "Commands:"
    echo "  install   Deploy VVU OS components and prepare data directories"
    echo "  deploy    Start all VVU OS services with health check retry"
    echo "  stop      Stop all running VVU OS services"
    echo "  doctor    Run system health diagnostics on all services and critical files"
    echo "  logs      Tail service logs (safekrypte/safeliner/operatus/openclaw)"
    echo "  status    Fetch live dashboard summary from all running services"
    exit 1
    ;;
esac
