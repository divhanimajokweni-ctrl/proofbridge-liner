#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# inject-license-headers.sh — VVU EARTH TECH
# Prepends the dual-license header to all .ts files in open-source/ and shared/
# that are missing the @license annotation.
#
# USAGE:
#   chmod +x scripts/inject-license-headers.sh
#   ./scripts/inject-license-headers.sh
#
# SAFETY: Only prepends to files that lack the @license header.
#         Files with existing headers are skipped.
# ──────────────────────────────────────────────────────────────

set -euo pipefail

HEADER='/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */'

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   VVU EARTH TECH — License Header Injection             ║"
echo "║   From compliance to code. From governance to files.    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

INJECTED=0
SKIPPED=0

# Process open-source/ and shared/ directories
for DIR in "open-source" "shared"; do
  if [ ! -d "$DIR" ]; then
    echo "  ⚠️  Directory '$DIR' not found — skipping"
    continue
  fi

  echo "🔍 Scanning $DIR/ for files missing license headers..."

  # Find all .ts files
  while IFS= read -r -d '' file; do
    # Check if file already has @license header
    if grep -q "@license" "$file" 2>/dev/null; then
      SKIPPED=$((SKIPPED + 1))
      echo "  ⏭️  $file — already has license header"
      continue
    fi

    # Create temp file with header + original content
    TEMP_FILE=$(mktemp)
    echo "$HEADER" > "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
    cat "$file" >> "$TEMP_FILE"

    # Replace original with temp file
    mv "$TEMP_FILE" "$file"
    INJECTED=$((INJECTED + 1))
    echo "  ✅ $file — license header injected"
  done < <(find "$DIR" -name "*.ts" -print0)
done

echo ""
echo "────────────────────────────────────────────────────────────"
echo ""
echo "📊 Summary:"
echo "  • Injected: $INJECTED files"
echo "  • Skipped:  $SKIPPED files (already had headers)"
echo ""

if [ $INJECTED -gt 0 ]; then
  echo "✅ License headers injected successfully"
  echo "   Run 'scripts/check-licenses.sh' to verify."
else
  echo "ℹ️  No new headers needed — all files already compliant."
fi
