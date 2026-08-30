#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# inject-kernel-headers.sh — VVU EARTH TECH
# Prepends the dual-license header to all .ts files in src/lib/kernel/
# and src/engine/, src/signer/, src/storage/ — the core runtime modules.
#
# USAGE:
#   chmod +x scripts/inject-kernel-headers.sh
#   ./scripts/inject-kernel-headers.sh
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
echo "║   VVU EARTH TECH — Kernel License Header Injection      ║"
echo "║   From compliance to code. From governance to files.    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

INJECTED=0
SKIPPED=0

# Process kernel directories
for DIR in "src/lib/kernel" "src/engine" "src/signer" "src/storage"; do
  if [ ! -d "$DIR" ]; then
    echo "  ⚠️  Directory '$DIR' not found — skipping"
    continue
  fi

  echo "🔍 Scanning $DIR/ for files missing license headers..."

  while IFS= read -r -d '' file; do
    if grep -q "@license" "$file" 2>/dev/null; then
      SKIPPED=$((SKIPPED + 1))
      echo "  ⏭️  $file — already has license header"
      continue
    fi

    TEMP_FILE=$(mktemp)
    echo "$HEADER" > "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
    cat "$file" >> "$TEMP_FILE"
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
else
  echo "ℹ️  No new headers needed — all files already compliant."
fi
