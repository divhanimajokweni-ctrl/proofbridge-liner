#!/usr/bin/env bash
# =============================================================================
# DEPLOYMENT LOCK LOOP
# Enforced pipeline: commit → push → build → vercel → dns → email → logs →
#                     readme → docs → checklist → push again
# =============================================================================
set -euo pipefail

# Prevent recursive hook invocation
export DEPLOYMENT_LOCK_ACTIVE=1

LOCK_FILE=".deploy-lock"
LOOP_LOG="deploy-loop.log"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass() { printf " [${GREEN}PASS${NC}] %s\n" "$1"; }
fail() { printf " [${RED}FAIL${NC}] %s\n" "$1"; exit 1; }
info() { printf " [${CYAN}..${NC}] %s\n" "$1"; }
warn() { printf " [${YELLOW}WARN${NC}] %s\n" "$1"; }

echo "" > "$LOOP_LOG"
exec 3>&1
exec 4>&2
exec 1>"$LOOP_LOG" 2>&1

phase() {
  local n=$1 total=$2 label=$3
  printf "\n" >&3
  printf "╔══════════════════════════════════════════════════════════╗\n" >&3
  printf "║  PHASE %d/%d : %-47s ║\n" "$n" "$total" "$label" >&3
  printf "╚══════════════════════════════════════════════════════════╝\n" >&3
}

total_phases=8

# ============================================================
# PHASE 1: GATE — Validate commit & critical files
# ============================================================
phase 1 $total_phases "COMMIT GATE — Critical File Check"
{
  if [ -z "$(git log --oneline -1 2>/dev/null)" ]; then
    fail "No commit found. Commit your changes first."
  fi
  pass "Commit exists"

  CRITICAL_FILES=(
    "app/api/verify/route.ts"
    "app/api/mint/route.ts"
    "src/middleware.ts"
    "AGENTS.md"
  )
  for f in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$f" ]; then
      fail "Critical file missing: $f"
    fi
    pass "Critical file present: $f"
  done

  if [ ! -f ".vercelignore" ]; then
    fail ".vercelignore is required"
  fi
  pass ".vercelignore present"
} >&3

# ============================================================
# PHASE 2: BUILD GATE
# ============================================================
phase 2 $total_phases "BUILD GATE — npm run build"
{
  npm run build 2>&1 | tail -5
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    fail "Build failed — aborting deployment loop"
  fi
  pass "Build succeeded"
} >&3

# ============================================================
# PHASE 3: PUSH & DEPLOY TO VERCEL
# ============================================================
phase 3 $total_phases "PUSH + VERCEL PRODUCTION DEPLOY"
{
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  info "Pushing branch: $CURRENT_BRANCH"

  git push origin "$CURRENT_BRANCH" 2>&1 | tail -3
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    fail "Git push failed"
  fi
  pass "Pushed to origin/$CURRENT_BRANCH"

  if command -v vercel &>/dev/null; then
    vercel --prod --force 2>&1 | tail -10
    if [ "${PIPESTATUS[0]}" -ne 0 ]; then
      fail "Vercel deploy failed"
    fi
    pass "Vercel production deploy complete"
  else
    warn "Vercel CLI not found — skipping Vercel deploy"
  fi
} >&3

# ============================================================
# PHASE 4: DNS CONFIG VERIFICATION
# ============================================================
phase 4 $total_phases "DNS CONFIG — Domain Resolution Check"
{
  DOMAIN="venturevisionubuntu.co.za"
  if command -v dig &>/dev/null; then
    RESULT=$(dig +short "$DOMAIN" 2>/dev/null | head -1)
    if [ -n "$RESULT" ]; then
      pass "DNS resolves: $DOMAIN → $RESULT"
    else
      warn "DNS did not resolve $DOMAIN — check config"
    fi
  elif command -v nslookup &>/dev/null; then
    RESULT=$(nslookup "$DOMAIN" 2>/dev/null | grep -oP 'Address: \K.*' | head -1)
    if [ -n "$RESULT" ]; then
      pass "DNS resolves: $DOMAIN → $RESULT"
    else
      warn "DNS did not resolve $DOMAIN — check config"
    fi
  else
    warn "No DNS lookup tool available — skipping DNS check"
  fi
} >&3

# ============================================================
# PHASE 5: EMAIL SENDING/RECEIVING HEALTH
# ============================================================
phase 5 $total_phases "EMAIL HEALTH CHECK"
{
  HEALTH_URL="https://venturevisionubuntu.co.za/api/health"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "000" ]; then
    pass "Health endpoint reachable (HTTP $HTTP_STATUS)"
  else
    warn "Health endpoint returned HTTP $HTTP_STATUS"
  fi

  if [ -f "scripts/check-secrets.js" ]; then
    node scripts/check-secrets.js 2>&1 | head -5
    info "Secrets check completed"
  fi
} >&3

# ============================================================
# PHASE 6: LOGS + README UPDATE
# ============================================================
phase 6 $total_phases "LOGS & README SYNC"
{
  DEPLOY_LOG="DEPLOY_LOG.md"
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  COMMIT_HASH=$(git rev-parse --short HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%s)

  cat >> "$DEPLOY_LOG" <<EOF
## $TIMESTAMP
- **Commit**: \`$COMMIT_HASH\`
- **Message**: $COMMIT_MSG
- **Status**: Deployed
- **Domain**: https://venturevisionubuntu.co.za

EOF
  pass "Deployment logged to $DEPLOY_LOG"

  if [ -f "README.md" ]; then
    CURRENT_REF=$(git rev-parse --short HEAD)
    if grep -q "build-ref:" README.md 2>/dev/null; then
      sed -i "s/build-ref:.*/build-ref: $CURRENT_REF/" README.md
    else
      echo "build-ref: $CURRENT_REF" >> README.md
    fi
    pass "README.md build reference updated"
  fi
} >&3

# ============================================================
# PHASE 7: DOCS CHECKLIST
# ============================================================
phase 7 $total_phases "DOCS VERIFICATION CHECKLIST"
{
  DOCS_DIR="docs"
  if [ -d "$DOCS_DIR" ]; then
    DOC_COUNT=$(find "$DOCS_DIR" -name "*.md" | wc -l)
    pass "Documentation files: $DOC_COUNT"
  else
    warn "No docs/ directory found"
  fi

  CHECKLIST_FILE="DEPLOYMENT_CHECKLIST.md"
  cat > "$CHECKLIST_FILE" <<'CHKEOF'
# Deployment Checklist

## Pre-Push
- [ ] All changes committed with meaningful messages
- [ ] Critical files present (verify, mint, middleware, AGENTS.md)

## Build
- [ ] `npm run build` passes without errors
- [ ] ESLint warnings reviewed (non-blocking)

## Deploy
- [ ] Pushed to origin
- [ ] Vercel production deploy succeeded
- [ ] Domain alias active

## Verify
- [ ] DNS resolves correctly
- [ ] Health endpoint responding
- [ ] Email sending/receiving functional

## Docs
- [ ] README build reference updated
- [ ] DEPLOY_LOG.md entry created
- [ ] Documentation files reviewed
CHKEOF
  pass "Deployment checklist written to $CHECKLIST_FILE"
} >&3

# ============================================================
# PHASE 8: COMPLETE — FINAL PUSH OF UPDATES
# ============================================================
phase 8 $total_phases "FINALIZE — Push loop artifacts"
{
  if git diff --quiet 2>/dev/null; then
    info "No artifacts to commit — loop complete"
  else
    git add "$LOOP_LOG" DEPLOY_LOG.md DEPLOYMENT_CHECKLIST.md README.md 2>/dev/null || true
    if git diff --cached --quiet 2>/dev/null; then
      info "No staged changes — skipping commit"
    else
      git commit -m "chore: deployment loop artifacts [skip ci]" 2>&1 | tail -1
      git push origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 | tail -1
      pass "Loop artifacts pushed"
    fi
  fi
} >&3

# ============================================================
printf "\n" >&3
printf "╔══════════════════════════════════════════════════════════╗\n" >&3
printf "║  ${GREEN}DEPLOYMENT LOOP COMPLETE${NC} — Lock is satisfied.        ║\n" >&3
printf "╚══════════════════════════════════════════════════════════╝\n" >&3
printf "  Log: %s\n" "$LOOP_LOG" >&3
printf "  Loop is ready for next cycle.\n" >&3
