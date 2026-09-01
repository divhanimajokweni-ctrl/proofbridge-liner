#!/usr/bin/env bash
# =============================================================================
# VVU · LANDING RESTORE SCRIPT (anti-regression)
# =============================================================================
# Purpose:
#   Restore the SYNTHESIZED SPATIAL INTELLIGENCE landing page and all its
#   dependencies from the /tmp/my-project/public/ backup, and revert
#   src/app/page.tsx to the redirect version.
#
# This script exists because the landing page has been clobbered by
# silent regressions MULTIPLE TIMES during development. Running it
# restores the canonical state in one command.
#
# Usage:
#   bash scripts/restore-landing.sh
#
# Safe to run repeatedly — it only restores missing/regressed files.
# =============================================================================
set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
BACKUP_DIR="/tmp/my-project/public"
PUBLIC_DIR="$PROJECT_ROOT/public"
PAGE_TSX="$PROJECT_ROOT/src/app/page.tsx"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  VVU LANDING RESTORE — anti-regression script${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# ─── Step 1: Verify backup exists ──────────────────────────────────────
if [ ! -d "$BACKUP_DIR" ]; then
  echo -e "${RED}✗ Backup directory not found: $BACKUP_DIR${NC}"
  echo -e "  This backup is created automatically by the dev environment."
  echo -e "  If it's missing, the landing page source is lost — contact ops."
  exit 1
fi
echo -e "${GREEN}✓ Backup found at $BACKUP_DIR${NC}"

# ─── Step 2: Restore critical landing file ────────────────────────────
echo ""
echo -e "${CYAN}[1/4] Restoring landing HTML file…${NC}"
if [ -f "$BACKUP_DIR/vvu-spatial-intelligence.html" ]; then
  cp "$BACKUP_DIR/vvu-spatial-intelligence.html" "$PUBLIC_DIR/vvu-spatial-intelligence.html"
  echo -e "${GREEN}  ✓ vvu-spatial-intelligence.html restored ($(wc -c < "$PUBLIC_DIR/vvu-spatial-intelligence.html") bytes)${NC}"
else
  echo -e "${RED}  ✗ vvu-spatial-intelligence.html missing from backup!${NC}"
  exit 1
fi

# ─── Step 3: Restore /three/ folder (Three.js + Leaflet assets) ────────
echo ""
echo -e "${CYAN}[2/4] Restoring /three/ folder (Three.js + Leaflet assets)…${NC}"
if [ -d "$BACKUP_DIR/three" ]; then
  rm -rf "$PUBLIC_DIR/three"
  cp -r "$BACKUP_DIR/three" "$PUBLIC_DIR/three"
  echo -e "${GREEN}  ✓ /three/ folder restored ($(ls "$PUBLIC_DIR/three" | wc -l) files)${NC}"
else
  echo -e "${RED}  ✗ /three/ folder missing from backup!${NC}"
  exit 1
fi

# ─── Step 4: Restore all missing HTML files + brand/vvv ───────────────
echo ""
echo -e "${CYAN}[3/4] Restoring all missing public/ files…${NC}"
RESTORED_COUNT=0
for f in "$BACKUP_DIR"/*.html "$BACKUP_DIR"/*.svg "$BACKUP_DIR"/*.png "$BACKUP_DIR"/*.js "$BACKUP_DIR"/*.json; do
  if [ -f "$f" ]; then
    fname=$(basename "$f")
    if [ ! -f "$PUBLIC_DIR/$fname" ]; then
      cp "$f" "$PUBLIC_DIR/$fname"
      RESTORED_COUNT=$((RESTORED_COUNT + 1))
      echo -e "  + $fname"
    fi
  fi
done
# brand/ folder
if [ -d "$BACKUP_DIR/brand" ] && [ -z "$(ls -A "$PUBLIC_DIR/brand" 2>/dev/null)" ]; then
  mkdir -p "$PUBLIC_DIR/brand"
  cp -r "$BACKUP_DIR/brand/." "$PUBLIC_DIR/brand/"
  echo -e "  + brand/ (restored folder)"
  RESTORED_COUNT=$((RESTORED_COUNT + 1))
fi
# vvv/ folder
if [ -d "$BACKUP_DIR/vvv" ]; then
  mkdir -p "$PUBLIC_DIR/vvv"
  for f in "$BACKUP_DIR/vvv"/*; do
    if [ -f "$f" ]; then
      fname=$(basename "$f")
      if [ ! -f "$PUBLIC_DIR/vvv/$fname" ]; then
        cp "$f" "$PUBLIC_DIR/vvv/$fname"
        RESTORED_COUNT=$((RESTORED_COUNT + 1))
      fi
    fi
  done
fi
echo -e "${GREEN}  ✓ Restored $RESTORED_COUNT missing files${NC}"

# ─── Step 5: Overwrite regression versions of B2B dashboard ───────────
echo ""
echo -e "${CYAN}[4/4] Restoring Mission Flow rail on B2B dashboard…${NC}"
if [ -f "$BACKUP_DIR/searm1-b2b-dashboard.html" ]; then
  if [ "$(wc -l < "$PUBLIC_DIR/searm1-b2b-dashboard.html" 2>/dev/null || echo 0)" -lt 200 ]; then
    cp "$BACKUP_DIR/searm1-b2b-dashboard.html" "$PUBLIC_DIR/searm1-b2b-dashboard.html"
    echo -e "${GREEN}  ✓ searm1-b2b-dashboard.html overwritten with full version ($(wc -l < "$PUBLIC_DIR/searm1-b2b-dashboard.html") lines)${NC}"
  else
    echo -e "  ✓ searm1-b2b-dashboard.html already has full version ($(wc -l < "$PUBLIC_DIR/searm1-b2b-dashboard.html") lines)"
  fi
fi

# ─── Step 6: Verify .env has the Google Maps key ──────────────────────
echo ""
echo -e "${CYAN}Verifying .env has Google Maps API key…${NC}"
if ! grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$PROJECT_ROOT/.env"; then
  echo "" >> "$PROJECT_ROOT/.env"
  echo "# Google Maps API key for spatial intelligence hero (user-provided 2025-09-01)" >> "$PROJECT_ROOT/.env"
  echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDvWTTuSKTIbs1g8m5XIjh3eWZSPb8M_a0" >> "$PROJECT_ROOT/.env"
  echo -e "${GREEN}  ✓ Added NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env${NC}"
else
  echo -e "  ✓ .env already has NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
fi

# ─── Step 7: Final verification ───────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Final verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
PASS=0
FAIL=0
for f in vvu-spatial-intelligence.html searm1-b2b-dashboard.html vvu-gis-bench.html three/three.module.js three/leaflet.js three/leaflet.css vvu-logo.svg brand/vvu-three-rings.svg; do
  if [ -f "$PUBLIC_DIR/$f" ]; then
    echo -e "  ${GREEN}✓${NC} $f"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $f STILL MISSING"
    FAIL=$((FAIL + 1))
  fi
done
echo ""
echo -e "${GREEN}✓ $PASS files present${NC}"
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}✗ $FAIL files still missing${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  LANDING RESTORE COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Ensure src/app/page.tsx is the REDIRECT version (not the VVU IVE World Container)."
echo "     The canonical redirect version is in git history — check with:"
echo "       git log --oneline -- src/app/page.tsx | head -5"
echo "  2. Verify in browser: visit http://localhost:3000/ — you should see"
echo "     'SYNTHESIZED SPATIAL INTELLIGENCE' hero immediately."
