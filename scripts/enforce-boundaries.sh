#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# enforce-boundaries.sh — VVU EARTH TECH Boundary Enforcement
# Checks that no file in open-source/ or shared/ imports from
# commercial/ — enforces the Golden Rule of horizontal infrastructure.
#
# USAGE:
#   chmod +x scripts/enforce-boundaries.sh
#   ./scripts/enforce-boundaries.sh
#
# PREREQUISITES:
#   - grep available (standard on Linux/macOS)
#   - Project directories open-source/ and shared/ may or may not exist
# ──────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ═══════════════════════════════════════════════════════════════
# DISPLAY HEADER
# ═══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   VVU EARTH TECH — Boundary Enforcement Script          ║"
echo "║   AIR is horizontal infrastructure.                     ║"
echo "║   No open-source code may depend on commercial/.        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════
# IMPORT PATTERNS TO CHECK
# ═══════════════════════════════════════════════════════════════

# Patterns that indicate an import from commercial code
IMPORT_PATTERNS=(
  "from 'commercial/"
  "from \"commercial/"
  "from '@vvu/commercial"
  "from \"@vvu/commercial"
  "require('commercial/"
  "require(\"commercial/"
  "require('@vvu/commercial"
  "require(\"@vvu/commercial"
  "import 'commercial/"
  "import \"commercial/"
  "import '@vvu/commercial"
  "import \"@vvu/commercial"
)

# ═══════════════════════════════════════════════════════════════
# CHECK DIRECTORIES
# ═══════════════════════════════════════════════════════════════

CHECK_DIRS=("open-source" "shared")
VIOLATIONS=0
TOTAL_FILES=0

echo "  ────────────────────────────────────────────────────────"
echo "  🔍 Scanning for commercial imports in open-source & shared"
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

  # Find all source files in this directory
  FILES=$(find "${DIR_PATH}" -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.rs" -o -name "*.go" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    2>/dev/null || true)

  if [ -z "${FILES}" ]; then
    echo "     ℹ️  No source files found in ${DIR}/"
    echo ""
    continue
  fi

  FILE_COUNT=$(echo "${FILES}" | wc -l)
  TOTAL_FILES=$((TOTAL_FILES + FILE_COUNT))
  echo "     Found ${FILE_COUNT} source file(s)"
  echo ""

  DIR_VIOLATIONS=0

  for PATTERN in "${IMPORT_PATTERNS[@]}"; do
    # Use grep to find files containing the pattern
    MATCHING_FILES=$(echo "${FILES}" | while read -r file; do
      if grep -n "${PATTERN}" "${file}" 2>/dev/null; then
        echo "${file}"
      fi
    done || true)

    if [ -n "${MATCHING_FILES}" ]; then
      echo "     ❌ Pattern \"${PATTERN}\" found in:"
      echo "${MATCHING_FILES}" | while read -r line; do
        echo "       • ${line}"
      done
      echo ""
      # Count violations per pattern
      V_COUNT=$(echo "${MATCHING_FILES}" | wc -l)
      DIR_VIOLATIONS=$((DIR_VIOLATIONS + V_COUNT))
    fi
  done

  if [ "${DIR_VIOLATIONS}" -eq 0 ]; then
    echo "     ✅ No commercial imports found in ${DIR}/"
  else
    echo "     ❌ ${DIR_VIOLATIONS} violation(s) found in ${DIR}/"
  fi
  echo ""

  VIOLATIONS=$((VIOLATIONS + DIR_VIOLATIONS))
done

# ═══════════════════════════════════════════════════════════════
# DETAILED GREP SCAN (single-pass for all patterns)
# ═══════════════════════════════════════════════════════════════

echo "  ────────────────────────────────────────────────────────"
echo "  🔍 Detailed scan — showing exact import lines"
echo "  ────────────────────────────────────────────────────────"
echo ""

DETAILED_VIOLATIONS=0

for DIR in "${CHECK_DIRS[@]}"; do
  DIR_PATH="${PROJECT_ROOT}/${DIR}"

  if [ ! -d "${DIR_PATH}" ]; then
    continue
  fi

  # Combined grep for all commercial import patterns
  RESULTS=$(grep -rn \
    -e "from ['\"]commercial/" \
    -e "from ['\"]@vvu/commercial" \
    -e "require(['\"]commercial/" \
    -e "require(['\"]@vvu/commercial" \
    -e "import ['\"]commercial/" \
    -e "import ['\"]@vvu/commercial" \
    "${DIR_PATH}" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.rs" \
    --include="*.go" \
    2>/dev/null || true)

  if [ -n "${RESULTS}" ]; then
    echo "  ❌ Violations in ${DIR}/:"
    echo "${RESULTS}" | while read -r line; do
      echo "    ${line}"
    done
    echo ""
    DETAILED_VIOLATIONS=$((DETAILED_VIOLATIONS + 1))
  fi
done

if [ "${DETAILED_VIOLATIONS}" -eq 0 ]; then
  echo "  ✅ No detailed violations found"
  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# SUMMARY & EXIT
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
if [ "${VIOLATIONS}" -eq 0 ] && [ "${DETAILED_VIOLATIONS}" -eq 0 ]; then
  echo "║   ✅  BOUNDARY ENFORCEMENT PASSED                       ║"
  echo "║                                                         ║"
  echo "║   No open-source/ or shared/ files import               ║"
  echo "║   from commercial/. The Golden Rule is upheld.          ║"
  echo "║                                                         ║"
  echo "║   Files scanned: ${TOTAL_FILES}"
  echo "║   Violations:    0"
else
  TOTAL_VIOL=$((VIOLATIONS + DETAILED_VIOLATIONS))
  echo "║   ❌  BOUNDARY ENFORCEMENT FAILED                       ║"
  echo "║                                                         ║"
  echo "║   Commercial imports detected in open-source            ║"
  echo "║   or shared code. The Golden Rule is violated.          ║"
  echo "║                                                         ║"
  echo "║   Files scanned: ${TOTAL_FILES}"
  echo "║   Violations:    ${TOTAL_VIOL}"
  echo "║                                                         ║"
  echo "║   Remove all commercial imports before merging.         ║"
fi
echo "╚══════════════════════════════════════════════════════════╝"

if [ "${VIOLATIONS}" -eq 0 ] && [ "${DETAILED_VIOLATIONS}" -eq 0 ]; then
  exit 0
else
  exit 1
fi
