#!/usr/bin/env bash
set -euo pipefail

DOCS_DIR="./app/docs"

if [ ! -d "$DOCS_DIR" ]; then
  echo "Warning: Docs directory not found; skipping guard."
  exit 0
fi

failed=0
while IFS= read -r -d '' file; do
  if ! grep -q "type: system-specification" "$file"; then
    echo "Failure: Missing type declaration in $file"
    failed=$((failed + 1))
  fi
  if ! grep -q "compliance_target: SOC2-SEC-CC.6" "$file"; then
    echo "Failure: Missing compliance_target in $file"
    failed=$((failed + 1))
  fi
  if ! grep -q "classification: RESTRICTED-INTERNAL" "$file"; then
    echo "Failure: Missing classification in $file"
    failed=$((failed + 1))
  fi
done < <(find "$DOCS_DIR" -type f -name "*.md" -print0)

if [ "$failed" -gt 0 ]; then
  echo "Build dropped: $failed asset errors"
  exit 1
fi

echo "Security clearance: All docs validated."
