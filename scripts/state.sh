#!/usr/bin/env bash
# state.sh — Epistemic Runtime Projection Client
# READ-ONLY. This client NEVER writes to the kernel.
#
# Usage:
#   ./state.sh list              — List all projections
#   ./state.sh get <name>        — Get a specific projection's state
#   ./state.sh watch <name>      — Poll a projection for changes
#   ./state.sh root              — Get the current MMR root
#   ./state.sh verify            — Get kernel verification status
#   ./state.sh help              — Show help

set -euo pipefail

BASE_URL="${ER_BASE_URL:-http://localhost:3000}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

query_kernel() {
  local endpoint="${1:-/api/kernel}"
  local method="${2:-GET}"
  local data="${3:-}"

  if [ "$method" = "POST" ]; then
    if [ -n "$data" ]; then
      curl -sS -X POST "${BASE_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "$data"
    else
      curl -sS -X POST "${BASE_URL}${endpoint}" \
        -H "Content-Type: application/json"
    fi
  else
    curl -sS "${BASE_URL}${endpoint}"
  fi
}

# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

cmd_list() {
  # List all registered projections
  local response
  response=$(query_kernel "/api/kernel" "GET")

  # Extract projections array and format as JSON
  echo "$response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    projections = data.get("projections", [])
    output = {
        "count": len(projections),
        "projections": [
            {
                "name": p.get("name"),
                "version": p.get("version"),
                "stateHash": p.get("stateHash"),
                "factRoot": p.get("factRoot"),
                "deprecated": p.get("deprecated", False)
            }
            for p in projections
        ]
    }
    print(json.dumps(output, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}, indent=2))
    sys.exit(1)
' 2>/dev/null || echo '{"error": "Failed to parse kernel response"}'
}

cmd_get() {
  local name="${1:-}"
  if [ -z "$name" ]; then
    echo '{"error": "Usage: state.sh get <projection-name>"}' >&2
    return 1
  fi

  local response
  response=$(query_kernel "/api/kernel" "GET")

  # Extract the specific projection by name
  echo "$response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    projections = data.get("projections", [])
    target = None
    for p in projections:
        if p.get("name") == sys.argv[1]:
            target = p
            break
    if target is None:
        print(json.dumps({"error": "Projection not found", "name": sys.argv[1]}, indent=2))
        sys.exit(1)
    print(json.dumps(target, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}, indent=2))
    sys.exit(1)
' "$name" 2>/dev/null || echo "{\"error\": \"Projection not found: $name\"}"
}

cmd_watch() {
  local name="${1:-}"
  if [ -z "$name" ]; then
    echo '{"error": "Usage: state.sh watch <projection-name>"}' >&2
    return 1
  fi

  local interval="${ER_WATCH_INTERVAL:-5}"
  local last_hash=""

  echo "{\"watch\": \"${name}\", \"interval\": ${interval}, \"status\": \"polling\"}"

  while true; do
    local response
    response=$(query_kernel "/api/kernel" "GET" 2>/dev/null) || true

    local current_hash
    current_hash=$(echo "$response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    projections = data.get("projections", [])
    for p in projections:
        if p.get("name") == sys.argv[1]:
            print(p.get("stateHash", ""))
            break
    else:
        print("")
except:
    print("")
' "$name" 2>/dev/null) || current_hash=""

    if [ -n "$current_hash" ] && [ "$current_hash" != "$last_hash" ]; then
      last_hash="$current_hash"
      local ts
      ts=$(python3 -c "import time; print(int(time.time()))" 2>/dev/null || echo "0")
      echo "{\"projection\": \"${name}\", \"stateHash\": \"${current_hash}\", \"changed\": true, \"ts\": ${ts}}"
    fi

    sleep "$interval"
  done
}

cmd_root() {
  local response
  response=$(query_kernel "/api/kernel" "GET")

  echo "$response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    runtime = data.get("runtime", {})
    output = {
        "mmrRoot": runtime.get("mmrRoot", "unknown"),
        "currentSequence": runtime.get("currentSequence", 0),
        "factCount": runtime.get("factCount", 0),
        "projectionCount": runtime.get("projectionCount", 0)
    }
    print(json.dumps(output, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}, indent=2))
' 2>/dev/null || echo '{"error": "Failed to parse kernel response"}'
}

cmd_verify() {
  local response
  response=$(query_kernel "/api/kernel" "GET")

  echo "$response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
    verification = data.get("verification", {})
    assertions = verification.get("assertions", [])
    output = {
        "status": data.get("status", "unknown"),
        "passed": verification.get("passed", 0),
        "total": verification.get("total", 0),
        "assertions": [
            {
                "name": a.get("name"),
                "passed": a.get("passed"),
                "message": a.get("message")
            }
            for a in assertions
        ]
    }
    print(json.dumps(output, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}, indent=2))
' 2>/dev/null || echo '{"error": "Failed to parse kernel response"}'
}

cmd_help() {
  cat <<'EOF'
state.sh — Epistemic Runtime Projection Client
READ-ONLY. This client NEVER writes to the kernel.

Usage:
  state.sh list              List all registered projections
  state.sh get <name>        Get a specific projection's state
  state.sh watch <name>      Poll a projection for changes
  state.sh root              Get the current MMR root and runtime info
  state.sh verify            Get kernel verification status
  state.sh help              Show this help message

Environment:
  ER_BASE_URL         Kernel API base URL (default: http://localhost:3000)
  ER_WATCH_INTERVAL   Polling interval in seconds for watch (default: 5)
EOF
}

# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------

case "${1:-help}" in
  list)   cmd_list ;;
  get)    cmd_get "${2:-}" ;;
  watch)  cmd_watch "${2:-}" ;;
  root)   cmd_root ;;
  verify) cmd_verify ;;
  help|*) cmd_help ;;
esac
