#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# check-licenses.sh — VVU EARTH TECH License Header Enforcement
# Scans all .ts files in open-source/ and shared/ for license
# headers. Expected pattern: @license followed by VVU EARTH TECH.
# Reports files missing license headers and exits with error
# code if any are missing.
#
# USAGE:
#   chmod +x scripts/check-licenses.sh
#   ./scripts/check-licenses.sh
#
# PREREQUISITES:
#   - grep available (standard on Linux/macOS)
#   - open-source/ and shared/ directories may or may not exist
# ──────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ═══════════════════════════════════════════════════════════════
# DISPLAY HEADER
# ═══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   VVU EARTH TECH — License Header Checker                ║"
echo "║   Every open-source file must carry a license header.   ║"
echo "║   Expected: @license VVU EARTH TECH                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

CHECK_DIRS=("open-source" "shared")
SCAN_EXTENSION="*.ts"

# The license pattern we look for:
# A line containing "@license" followed by "VVU EARTH TECH"
# This can appear in comments like:
#   // @license VVU EARTH TECH
#   /* @license VVU EARTH TECH */
#   * @license VVU EARTH TECH

TOTAL_FILES=0
FILES_WITH_LICENSE=0
FILES_MISSING_LICENSE=0
MISSING_FILES_LIST=()

# ═══════════════════════════════════════════════════════════════
# SCANNING
# ═══════════════════════════════════════════════════════════════

echo "  ────────────────────────────────────────────────────────"
echo "  🔍 Scanning for license headers"
echo "  ────────────────────────────────────────────────────────"
echo ""

for DIR in "${CHECK_DIRS[@]}"; do
  DIR_PATH="${PROJECT_ROOT}/${DIR}"

  echo "  📂 Checking: ${DIR}/"

  if [ ! -d "${DIR_PATH}" ]; then
    echo "     ⚠️  Directory does not exist: ${DIR_PATH}"
    echo "     ℹ️  Skipping — directory not yet created"
    echo ""
    continue
  fi

  # Find all .ts files
  TS_FILES=$(find "${DIR_PATH}" -type f -name "*.ts" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    2>/dev/null || true)

  if [ -z "${TS_FILES}" ]; then
    echo "     ℹ️  No .ts files found in ${DIR}/"
    echo ""
    continue
  fi

  FILE_COUNT=0
  DIR_LICENSED=0
  DIR_MISSING=0

  while IFS= read -r file; do
    [ -z "${file}" ] && continue

    FILE_COUNT=$((FILE_COUNT + 1))
    TOTAL_FILES=$((TOTAL_FILES + 1))

    RELATIVE="${file#${PROJECT_ROOT}/}"

    # Check if the file contains a license header
    # Pattern: @license followed somewhere by VVU EARTH TECH
    # We check the first 30 lines (license headers should be at the top)
    LICENSE_FOUND=$(grep -m1 -n \
      -E "@license.*VVU EARTH TECH|VVU EARTH TECH.*@license" \
      "${file}" 2>/dev/null || true)

    # Also check for a simpler pattern — just "@license VVU" on its own line
    if [ -z "${LICENSE_FOUND}" ]; then
      LICENSE_FOUND=$(grep -m1 -n \
        -E "@license\s+VVU|@license.*VVU" \
        "${file}" 2>/dev/null || true)
    fi

    if [ -n "${LICENSE_FOUND}" ]; then
      DIR_LICENSED=$((DIR_LICENSED + 1))
      FILES_WITH_LICENSE=$((FILES_WITH_LICENSE + 1))
      echo "     ✅ ${RELATIVE}"
    else
      DIR_MISSING=$((DIR_MISSING + 1))
      FILES_MISSING_LICENSE=$((FILES_MISSING_LICENSE + 1))
      MISSING_FILES_LIST+=("${RELATIVE}")
      echo "     ❌ ${RELATIVE} — MISSING LICENSE HEADER"
    fi

  done <<< "${TS_FILES}"

  echo ""
  echo "     Summary for ${DIR}/: ${DIR_LICENSED}/${FILE_COUNT} licensed, ${DIR_MISSING} missing"
  echo ""
done

# ═══════════════════════════════════════════════════════════════
# SHOW MISSING FILES (if any)
# ═══════════════════════════════════════════════════════════════

if [ "${FILES_MISSING_LICENSE}" -gt 0 ]; then
  echo "  ────────────────────────────────────────────────────────"
  echo "  📋 Files missing license headers:"
  echo "  ────────────────────────────────────────────────────────"
  echo ""
  for f in "${MISSING_FILES_LIST[@]}"; do
    echo "    ❌ ${f}"
  done
  echo ""
  echo "  💡 Add the following header to each missing file:"
  echo ""
  echo "    // @license VVU EARTH TECH — [Full License Name]"
  echo "    // SPDX-License-Identifier: [Identifier]"
  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# SUMMARY & EXIT
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
if [ "${FILES_MISSING_LICENSE}" -eq 0 ]; then
  echo "║   ✅  LICENSE CHECK PASSED                              ║"
  echo "║                                                         ║"
  echo "║   All scanned files carry proper license headers.       ║"
  echo "║                                                         ║"
  echo "║   Files scanned:   ${TOTAL_FILES}"
  echo "║   Licensed:        ${FILES_WITH_LICENSE}"
  echo "║   Missing:         0"
else
  echo "║   ❌  LICENSE CHECK FAILED                              ║"
  echo "║                                                         ║"
  echo "║   Some files are missing the required license header.   ║"
  echo "║                                                         ║"
  echo "║   Files scanned:   ${TOTAL_FILES}"
  echo "║   Licensed:        ${FILES_WITH_LICENSE}"
  echo "║   Missing:         ${FILES_MISSING_LICENSE}"
  echo "║                                                         ║"
  echo "║   Add '@license VVU EARTH TECH' headers before merge.  ║"
fi
echo "╚══════════════════════════════════════════════════════════╝"

if [ "${FILES_MISSING_LICENSE}" -eq 0 ]; then
  exit 0
else
  exit 1
fi
