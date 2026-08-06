#!/bin/bash

# Configuration - Use localhost since it's running in the same Repl
ENDPOINT="http://localhost:3000/api/cron/reconcile-gate-f"
LOG_FILE="reconciler.log"

echo "🚀 Gate F Reconciler Watchdog Initialized"
echo "Monitoring drift between Canton and Polygon Amoy..."

while true; do
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Trigger the reconciler endpoint
  RESPONSE=$(curl -s -X GET "$ENDPOINT")
  
  # Log to file for Kilo CLI auditing
  echo "[$TIMESTAMP] $RESPONSE" >> "$LOG_FILE"
  
  # Visual alert if the circuit opens
  if echo "$RESPONSE" | grep -q '"status":"CIRCUIT_OPEN"'; then
    echo "[$TIMESTAMP] ⚠ CRITICAL: Gate F Circuit Tripped! Drift threshold exceeded."
  fi

  sleep 60
done