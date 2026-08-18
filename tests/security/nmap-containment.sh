#!/usr/bin/env bash
# VVU-IVE Slim Shady Adversarial Validation — Network Containment
# ----------------------------------------------------------------------------
# Implements Section 13 of the VVU-IVE Reliability Contract v1.1.
#
# Run this from inside a vvu-ive-worker pod to verify the network
# containment boundary. Slim Shady's job is to find cracks; this script
# proves the cracks aren't there.
#
# Usage:
#   kubectl exec -it deploy/vvu-ive-webhook-worker -n vvu-ive -- \
#     bash tests/security/nmap-containment.sh
#
# Expected result: ALL tests pass (filtered/blocked where required, open
# where required). Any deviation is a Slim Shady finding.

set -u

PASS=0
FAIL=0
TOTAL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))
  if echo "$actual" | grep -qiE "$expected"; then
    echo "  [PASS] $name"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $name — expected '$expected', got '$actual'"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "VVU-IVE Slim Shady Containment Validation"
echo "============================================"
echo ""

echo "Test 1: Direct Internet is DROPPED (state attack prevention)"
RESULT=$(nmap -Pn -p 443 1.1.1.1 2>/dev/null | grep -E "^443" || echo "nmap failed")
check "1.1.1.1:443 dropped" "filtered|closed" "$RESULT"

echo ""
echo "Test 2: Cloud Metadata SSRF is DROPPED (identity attack prevention)"
RESULT=$(nmap -Pn -p 80 169.254.169.254 2>/dev/null | grep -E "^80" || echo "nmap failed")
check "169.254.169.254:80 dropped" "filtered|closed" "$RESULT"

echo ""
echo "Test 3: Infrastructure Egress is OPEN (operational continuity)"
RESULT=$(nmap -Pn -p 10001 envoy-egress.vvu-ive.svc.cluster.local 2>/dev/null | grep -E "^10001" || echo "nmap failed")
check "envoy-egress:10001 open" "open" "$RESULT"

RESULT=$(nmap -Pn -p 5432 postgres.vvu-ive.svc.cluster.local 2>/dev/null | grep -E "^5432" || echo "nmap failed")
check "postgres:5432 open" "open" "$RESULT"

RESULT=$(nmap -Pn -p 9092 kafka.vvu-ive.svc.cluster.local 2>/dev/null | grep -E "^9092" || echo "nmap failed")
check "kafka:9092 open" "open" "$RESULT"

echo ""
echo "Test 4: Lateral Movement is DROPPED (containment)"
POD_IPS=$(getent hosts vvu-ive-webhook-worker.vvu-ive.svc.cluster.local | awk '{print $1}' || true)
if [ -n "$POD_IPS" ]; then
  for ip in $POD_IPS; do
    RESULT=$(nmap -Pn -p 22,80,443,8080 "$ip" 2>/dev/null | tail -n +5 | head -4 || echo "nmap failed")
    check "lateral $ip blocked" "filtered|closed" "$RESULT"
  done
else
  echo "  [SKIP] Cannot resolve worker pod IPs for lateral test"
fi

echo ""
echo "Test 5: Envoy SSRF defense (curl through proxy)"
RESULT=$(curl -x http://envoy-egress:10001 -s -o /dev/null -w "%{http_code}" --max-time 5 http://169.254.169.254/latest/meta-data/ 2>/dev/null || echo "000")
check "metadata SSRF via Envoy returns 403" "403" "$RESULT"

echo ""
echo "============================================"
echo "Summary: $PASS/$TOTAL passed, $FAIL failed"
echo "============================================"
if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: SLIM_SHADY_FINDING — investigate failures"
  exit 1
else
  echo "STATUS: CONTAINMENT_VERIFIED"
  exit 0
fi
