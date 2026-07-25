#!/usr/bin/env bash
set -euo pipefail

TEST_RECORD="VVU-VAL-001/release/deployment-record.json"
if [ ! -f "$TEST_RECORD" ]; then
  echo "ERROR: $TEST_RECORD not found — cannot test recovery without existing record" >&2
  exit 1
fi

cp "$TEST_RECORD" "${TEST_RECORD}.pretest.bak"

if jq -e '.deploymentId // .deployment_id // empty' "$TEST_RECORD" >/dev/null 2>&1; then
  EXISTING_ID=$(jq -r '.deploymentId // .deployment_id // empty' "$TEST_RECORD")
  if [ -n "$EXISTING_ID" ] && [ "$EXISTING_ID" != "null" ]; then
    jq '.status = "deploying"' "${TEST_RECORD}.pretest.bak" > "$TEST_RECORD"
  else
    jq '.status = "deploying" | .deploymentId = "test-recovery-placeholder"' "${TEST_RECORD}.pretest.bak" > "$TEST_RECORD"
  fi
else
  jq '.status = "deploying" | .deploymentId = "test-recovery-placeholder"' "${TEST_RECORD}.pretest.bak" > "$TEST_RECORD"
fi

echo "=== Simulated stuck state ==="
cat "$TEST_RECORD"

echo "=== Running diagnosis ==="
./scripts/diagnose-stuck-deployment.sh || true

echo "=== Running recovery ==="
if jq -r '.deploymentId // .deployment_id // empty' "$TEST_RECORD" | grep -q "test-recovery-placeholder"; then
  echo "Skipping actual recovery: test deployment ID placeholder cannot be verified remotely."
else
  ./scripts/recover-stuck-deployment.sh || true
fi

echo "=== Post-recovery record ==="
cat "$TEST_RECORD"

echo "=== Restoring original record ==="
mv "${TEST_RECORD}.pretest.bak" "$TEST_RECORD"
echo "Restored."
