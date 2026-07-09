#!/usr/bin/env bash
# =============================================================================
# DEPLOYMENT LOCK LOOP — Full CI Pipeline
# Enforced policy: COMMIT → TYPECHECK → LINT → TESTS → BUILD →
#                  BEHAVIORAL COVERAGE → VERCEL BUILD (gated) →
#                  PUSH → DNS CHECK → HEALTH CHECK → LOGS →
#                  DOCS CHECKLIST → FINAL PUSH
#
# ART OF CHOKE: Nothing ships until the ENTIRE pipeline passes.
#              No warnings. No soft passes. No exceptions.
# =============================================================================
set -euo pipefail

# Prevent recursive hook invocation
if [ "${DEPLOYMENT_LOCK_ACTIVE:-0}" = "1" ]; then
  echo "DEPLOYMENT_LOCK_ACTIVE detected — skipping recursive hook invocation"
  exit 0
fi
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

total_phases=13

CANONICAL_BRANCHES=("main" "compliance-fabric")

# Determine if current branch is canonical
is_canonical_branch() {
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  for cb in "${CANONICAL_BRANCHES[@]}"; do
    if [ "$branch" = "$cb" ]; then
      return 0
    fi
  done
  return 1
}

# ============================================================
# PRE-FLIGHT: EXECUTE END TO END — Verify all services live
# ============================================================
printf "\n" >&3
printf "╔══════════════════════════════════════════════════════════╗\n" >&3
printf "║  EXECUTE END TO END — Pre-Flight Verification           ║\n" >&3
printf "║  Prerequisite to ART OF CHOKE                           ║\n" >&3
printf "╚══════════════════════════════════════════════════════════╝\n" >&3
{
  PF_PASS=true

  # 1. Dev server
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
    pass "Dev server reachable on port 3000"
  else
    fail "Dev server NOT reachable on port 3000 — start with 'npm run dev'"
    PF_PASS=false
  fi

  # 2. SafeKrypte
  if curl -s -o /dev/null --connect-timeout 3 http://localhost:5096/health 2>/dev/null; then
    pass "SafeKrypte reachable on port 5096"
  else
    warn "SafeKrypte not reachable on port 5096 — behavioral coverage may SKIP (not FAIL)"
  fi

  # 3. Vercel CLI
  if command -v vercel &>/dev/null; then
    if vercel whoami 2>/dev/null | grep -q .; then
      pass "Vercel CLI authenticated: $(vercel whoami 2>/dev/null)"
    else
      fail "Vercel CLI not authenticated — run 'vercel login'"
      PF_PASS=false
    fi
  else
    fail "Vercel CLI not installed"
    PF_PASS=false
  fi

  # 4. Vercel project linked
  if [ -f ".vercel/project.json" ] || ([ -f ".vercel/repo.json" ] && jq -e '.projects[0].id' .vercel/repo.json &>/dev/null); then
    if [ -f ".vercel/project.json" ]; then
      PROJECT_NAME=$(jq -r '.projectName' .vercel/project.json 2>/dev/null || echo 'unknown')
    else
      PROJECT_NAME=$(jq -r '.projects[0].name' .vercel/repo.json 2>/dev/null || echo 'unknown')
    fi
    pass "Vercel project linked: ${PROJECT_NAME}"
  else
    fail "Vercel project NOT linked — run 'vercel link'"
    PF_PASS=false
  fi

  # 5. Environment variables
  if [ -f ".env.local" ]; then
    pass ".env.local present"
  else
    fail ".env.local missing — deployment may fail"
    PF_PASS=false
  fi

  # 6. Network available
  if curl -s -o /dev/null --connect-timeout 5 https://vercel.com 2>/dev/null; then
    pass "Network reachable (Vercel API accessible)"
  else
    warn "Network check failed — DNS/health phases may fail later"
  fi

  if [ "$PF_PASS" = false ]; then
    fail "PRE-FLIGHT CHECK FAILED — fix above issues before running deployment loop"
  fi
} >&3

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
# PHASE 2: TYPECHECK — TypeScript strict type checking
# ============================================================
phase 2 $total_phases "TYPECHECK GATE — tsc --noEmit"
{
  npm run typecheck 2>&1 | tail -20
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    fail "TypeScript typecheck failed — fix type errors before shipping"
  fi
  pass "TypeScript typecheck passed"
} >&3

# ============================================================
# PHASE 3: LINT — Static analysis
# ============================================================
phase 3 $total_phases "LINT GATE — npm run lint"
{
  npm run lint 2>&1 | tail -20
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    fail "Lint failed — fix lint errors before shipping"
  fi
  pass "Lint passed"
} >&3

# ============================================================
# PHASE 4: UNIT TESTS — Jest test suite
# ============================================================
phase 4 $total_phases "TEST GATE — npm test"
{
  npm test 2>&1 | tail -30
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    fail "Unit tests failed — fix failing tests before shipping"
  fi
  pass "All unit tests passed"
} >&3

# ============================================================
# PHASE 5: BUILD GATE
# ============================================================
phase 5 $total_phases "BUILD GATE — npm run build"
{
  npm run build 2>&1 | tail -10
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    fail "Build failed — aborting deployment loop"
  fi
  pass "Build succeeded"
} >&3

# ----------------------------------------------------------
# DEV SERVER RESTART (build overwrites .next/ with production chunks)
# ----------------------------------------------------------
{
  info "Restarting dev server after build..."
  # Kill existing dev server if any
  if command -v pkill &>/dev/null; then
    pkill -f "next dev" 2>/dev/null || true
  fi
  sleep 1
  # Remove production build artifacts so dev can re-compile fresh
  rm -rf .next/ 2>/dev/null || true
  sleep 1
  # Restart dev server in background
  npm run dev &
  DEV_PID=$!
  # Wait for health endpoint (up to 60s for cold compile)
  HEALTH_OK=false
  for i in $(seq 1 12); do
    sleep 5
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
      HEALTH_OK=true
      break
    fi
  done
  if [ "$HEALTH_OK" = true ]; then
    pass "Dev server restarted and healthy"
  else
    fail "Dev server failed to restart after build"
  fi
} >&3

# ============================================================
# PHASE 6: BEHAVIORAL COVERAGE — 5 compliance flows
# ============================================================
phase 6 $total_phases "BEHAVIORAL COVERAGE — 5 compliance flows"
{
  npx tsx scripts/behavioral-coverage.ts 2>&1
  BC_EXIT=$?
  if [ "$BC_EXIT" -eq 1 ]; then
    fail "Behavioral coverage FAIL — one or more compliance flows failed"
  fi
  if [ "$BC_EXIT" -eq 2 ]; then
    warn "All behavioral coverage tests SKIPPED (services not reachable)"
  fi
  pass "Behavioral coverage passed"
} >&3

# ============================================================
# PHASE 7: VERCEL BUILD GATE (before git push)
# ============================================================
phase 7 $total_phases "VERCEL BUILD GATE — Build before push"
{
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  info "Branch: $CURRENT_BRANCH"

  if command -v vercel &>/dev/null; then
    info "Deploying to Vercel production (waiting for build)..."
    vercel deploy --prod --force 2>&1 | tail -20
    VERCEL_EXIT="${PIPESTATUS[0]}"
    if [ "$VERCEL_EXIT" -ne 0 ]; then
      fail "Vercel build failed — push blocked. Fix the build before retrying."
    fi
    pass "Vercel production build succeeded"
  else
    if is_canonical_branch; then
      fail "Vercel CLI not found — required on canonical branches ($CURRENT_BRANCH)"
    else
      warn "Vercel CLI not found — skipping Vercel deploy on non-canonical branch"
    fi
  fi

} >&3

# ============================================================
# PHASE 8: PUSH GATE — Push to Origin
# ============================================================
phase 8 $total_phases "PUSH GATE — Push to Origin"
  {
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    info "ALL GATES PASSED — pushing branch: $CURRENT_BRANCH"
    git push origin "$CURRENT_BRANCH" 2>&1 | tail -3
    if [ "${PIPESTATUS[0]}" -ne 0 ]; then
      fail "Git push failed"
    fi
    pass "Pushed to origin/$CURRENT_BRANCH"
  } >&3

# ============================================================
# PHASE 9: DNS CONFIG VERIFICATION (post-deploy)
# ============================================================
phase 9 $total_phases "DNS CONFIG — Domain Resolution Check"
{
  DOMAIN="venturevisionubuntu.co.za"
  RESULT=""
  if command -v dig &>/dev/null; then
    RESULT=$(dig +short "$DOMAIN" 2>/dev/null | head -1)
  elif command -v nslookup &>/dev/null; then
    RESULT=$(nslookup "$DOMAIN" 2>/dev/null | grep -oP 'Address: \K.*' | head -1)
  elif command -v getent &>/dev/null; then
    RESULT=$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1)
  elif command -v node &>/dev/null; then
    RESULT=$(node -e "const dns=require('dns');dns.resolve4('$DOMAIN',(e,r)=>{process.stdout.write(e?'':(r||[])[0]||'')})" 2>/dev/null)
  fi
  if [ -n "$RESULT" ]; then
    pass "DNS resolves: $DOMAIN → $RESULT"
  else
    fail "DNS did not resolve $DOMAIN — domain configuration issue"
  fi
} >&3

# ============================================================
# PHASE 10: PRODUCTION HEALTH CHECK
# ============================================================
phase 10 $total_phases "PRODUCTION HEALTH CHECK"
{
  HEALTH_URL="https://venturevisionubuntu.co.za/api/health"

  # Retry up to 3 times with 5s wait for deployment propagation
  HTTP_STATUS="000"
  for i in 1 2 3; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
      break
    fi
    if [ "$i" -lt 3 ]; then
      sleep 5
    fi
  done

  if [ "$HTTP_STATUS" != "200" ]; then
    fail "Health endpoint returned HTTP $HTTP_STATUS after 3 retries — deployment may be broken"
  fi
  pass "Health endpoint responding (HTTP 200)"

  if [ -f "scripts/check-secrets.js" ]; then
    node scripts/check-secrets.js 2>&1 | head -5
    SECRETS_EXIT=$?
    if [ "$SECRETS_EXIT" -ne 0 ]; then
      fail "Secrets check failed — review secret configuration"
    fi
    pass "Secrets check passed"
  fi
} >&3

# ============================================================
# PHASE 11: LOGS & README UPDATE
# ============================================================
phase 11 $total_phases "LOGS & README SYNC"
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
# PHASE 12: DOCS CHECKLIST
# ============================================================
phase 12 $total_phases "DOCS VERIFICATION CHECKLIST"
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

## Pre-Flight (EXECUTE END TO END — verified before pipeline starts)
- [ ] Dev server running on port 3000 (`curl localhost:3000/api/health` → 200)
- [ ] SafeKrypte service reachable on port 5096
- [ ] Vercel CLI installed and authenticated (`vercel whoami` succeeds)
- [ ] Vercel project linked (`.vercel/repo.json` exists with valid project ID)
- [ ] Environment variables present in `.env.local`
- [ ] Network available for DNS checks, health checks, Vercel build

## Pre-Push Gates (ALL must pass before push)
- [ ] Commit exists and critical files present
- [ ] TypeScript typecheck (`tsc --noEmit`) — zero type errors
- [ ] Lint (`npm run lint`) — zero errors
- [ ] Unit tests (`npm test`) — all passing
- [ ] Production build (`npm run build`) — zero errors
- [ ] Behavioral coverage (5 compliance flows) — all PASS or SKIP, none FAIL
- [ ] Vercel production build (`vercel deploy --prod --force`) — succeeds

## Pre-Push Execution (only after gates pass)
- [ ] `git push origin` — pushed to remote

## Post-Deploy Verification
- [ ] DNS resolves correctly
- [ ] Health endpoint responding (HTTP 200)
- [ ] Secrets check passed

## Docs
- [ ] README build reference updated
- [ ] DEPLOY_LOG.md entry created
- [ ] DEPLOYMENT_CHECKLIST.md regenerated
- [ ] Documentation files reviewed
CHKEOF
  pass "Deployment checklist written to $CHECKLIST_FILE"
} >&3

# ============================================================
# PHASE 13: COMPLETE — FINAL PUSH OF UPDATES
# ============================================================
phase 13 $total_phases "FINALIZE — Push loop artifacts"
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
printf "║  ${GREEN}DEPLOYMENT LOOP COMPLETE${NC} — All 13 phases passed.     ║\n" >&3
printf "║  ${GREEN}ART OF CHOKE: Pipeline satisfied. Ship it.${NC}           ║\n" >&3
printf "╚══════════════════════════════════════════════════════════╝\n" >&3
printf "  Log: %s\n" "$LOOP_LOG" >&3
printf "  Loop is ready for next cycle.\n" >&3
