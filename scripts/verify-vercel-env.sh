#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-VERIFY-VERCEL-ENV.SH (PRODUCTION ENV VAR VERIFICATION)
# DESCRIPTION: Verifies that DATABASE_URL and DIRECT_URL are set to REAL
#              Vercel Postgres connection strings in the Production
#              environment — not the placeholder values the sandbox
#              wrote to local .env.
#
# WHY THIS MATTERS:
#   A "READY" build only proves `next build` compiled. It does NOT prove
#   Prisma can connect at runtime. If DATABASE_URL is empty or still a
#   placeholder, every DB-touching API route (/api/evidence/*, /api/
#   facilitator) will 500 on the first real request despite the build
#   succeeding.
#
# PREREQUISITE: Run `vercel login` first to authenticate.
# =============================================================================

set -uo pipefail

CYAN='\033[0;36m'
AMBER='\033[0;33m'
EMERALD='\033[0;32m'
ROSE='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_pass() { echo -e "  ${EMERALD}✓${NC} $1"; PASS=$((PASS + 1)); }
check_fail() { echo -e "  ${ROSE}✗${NC} $1"; FAIL=$((FAIL + 1)); }
check_warn() { echo -e "  ${AMBER}!${NC} $1"; WARN=$((WARN + 1)); }

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}     VVU VERCEL ENV VERIFICATION — PRODUCTION READINESS     ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# ─── Step 0: Verify Vercel authentication ────────────────────────────────────
echo -e "\n${CYAN}[0/5] Verifying Vercel authentication...${NC}"
if ! command -v vercel &>/dev/null; then
  echo -e "  ${ROSE}[!]${NC} Vercel CLI not installed. Run: npm install -g vercel"
  exit 1
fi
if ! vercel whoami &>/dev/null; then
  echo -e "  ${ROSE}[!]${NC} Not authenticated with Vercel."
  echo -e "  ${AMBER}→${NC} Run: vercel login"
  exit 1
fi
WHOAMI=$(vercel whoami 2>/dev/null | grep -v "^Vercel CLI" | grep -v "NOTE:" | grep -v "https://" | head -1)
check_pass "Authenticated as: ${WHOAMI}"

# ─── Step 1: Verify project is linked ────────────────────────────────────────
echo -e "\n${CYAN}[1/5] Verifying project link...${NC}"
if [ ! -f ".vercel/project.json" ]; then
  echo -e "  ${AMBER}→${NC} Project not linked locally. Running 'vercel link'..."
  vercel link --yes 2>&1 | tail -3
fi
if [ -f ".vercel/project.json" ]; then
  PROJECT_NAME=$(python3 -c "import json; print(json.load(open('.vercel/project.json')).get('name','unknown'))" 2>/dev/null || echo "unknown")
  check_pass "Project linked: ${PROJECT_NAME}"
else
  check_fail "Project link failed"
  exit 1
fi

# ─── Step 2: List Production env vars ────────────────────────────────────────
echo -e "\n${CYAN}[2/5] Listing Production environment variables...${NC}"
ENV_LISTING=$(vercel env ls production 2>&1)
echo "$ENV_LISTING" | head -20

# ─── Step 3: Check DATABASE_URL ───────────────────────────────────────────────
echo -e "\n${CYAN}[3/5] Checking DATABASE_URL...${NC}"
if echo "$ENV_LISTING" | grep -q "^DATABASE_URL"; then
  check_pass "DATABASE_URL exists in Production env"
  # Pull to a temp file to inspect the value (Vercel masks it in `ls` but `pull` decrypts)
  TMP_ENV=$(mktemp)
  vercel env pull "$TMP_ENV" --environment=production 2>/dev/null
  if [ -f "$TMP_ENV" ]; then
    DB_URL=$(grep "^DATABASE_URL=" "$TMP_ENV" | head -1 | cut -d'=' -f2-)
    if echo "$DB_URL" | grep -q "placeholder"; then
      check_fail "DATABASE_URL is still a PLACEHOLDER: ${DB_URL:0:50}..."
      echo -e "     ${AMBER}Fix:${NC} vercel env rm DATABASE_URL production"
      echo -e "            vercel env add DATABASE_URL production"
      echo -e "            (paste real Vercel Postgres pooled connection string)"
    elif echo "$DB_URL" | grep -q "^file:"; then
      check_fail "DATABASE_URL is SQLite (file:): ${DB_URL:0:50}..."
      echo -e "     ${AMBER}Fix:${NC} Schema is now PostgreSQL — update DATABASE_URL to"
      echo -e "            postgresql://... (Vercel Postgres pooled connection string)"
    elif echo "$DB_URL" | grep -q "^postgresql://"; then
      check_pass "DATABASE_URL is a real PostgreSQL connection string"
      # Check it's the pooled endpoint (port 6543 or ?pgbouncer=true)
      if echo "$DB_URL" | grep -qE ":6543|pgbouncer=true"; then
        check_pass "DATABASE_URL uses pooled endpoint (port 6543 or pgbouncer=true)"
      else
        check_warn "DATABASE_URL may not be pooled (expected :6543 or ?pgbouncer=true)"
        echo -e "     Vercel Postgres pooled URL format:"
        echo -e "     postgresql://<user>:<pwd>@<host>:6543/<db>?pgbouncer=true"
      fi
    else
      check_warn "DATABASE_URL format unrecognized: ${DB_URL:0:50}..."
    fi
  fi
  rm -f "$TMP_ENV"
else
  check_fail "DATABASE_URL is NOT set in Production env"
  echo -e "     ${AMBER}Fix:${NC} vercel env add DATABASE_URL production"
  echo -e "            (paste Vercel Postgres pooled connection string)"
fi

# ─── Step 4: Check DIRECT_URL ────────────────────────────────────────────────
echo -e "\n${CYAN}[4/5] Checking DIRECT_URL...${NC}"
if echo "$ENV_LISTING" | grep -q "^DIRECT_URL"; then
  check_pass "DIRECT_URL exists in Production env"
  TMP_ENV=$(mktemp)
  vercel env pull "$TMP_ENV" --environment=production 2>/dev/null
  if [ -f "$TMP_ENV" ]; then
    DIRECT_URL=$(grep "^DIRECT_URL=" "$TMP_ENV" | head -1 | cut -d'=' -f2-)
    if echo "$DIRECT_URL" | grep -q "placeholder"; then
      check_fail "DIRECT_URL is still a PLACEHOLDER: ${DIRECT_URL:0:50}..."
      echo -e "     ${AMBER}Fix:${NC} vercel env rm DIRECT_URL production"
      echo -e "            vercel env add DIRECT_URL production"
      echo -e "            (paste real Vercel Postgres DIRECT connection string)"
    elif echo "$DIRECT_URL" | grep -q "^postgresql://"; then
      check_pass "DIRECT_URL is a real PostgreSQL connection string"
      # Check it's the direct (non-pooled) endpoint (port 5432, no pgbouncer)
      if echo "$DIRECT_URL" | grep -qE ":5432" && ! echo "$DIRECT_URL" | grep -q "pgbouncer"; then
        check_pass "DIRECT_URL uses direct endpoint (port 5432, no pgbouncer) — safe for migrations"
      else
        check_warn "DIRECT_URL may be pooled — migrations could fail"
        echo -e "     Vercel Postgres direct URL format:"
        echo -e "     postgresql://<user>:<pwd>@<host>:5432/<db>"
      fi
    else
      check_warn "DIRECT_URL format unrecognized: ${DIRECT_URL:0:50}..."
    fi
  fi
  rm -f "$TMP_ENV"
else
  check_fail "DIRECT_URL is NOT set in Production env"
  echo -e "     ${AMBER}Fix:${NC} vercel env add DIRECT_URL production"
  echo -e "            (paste Vercel Postgres DIRECT connection string — port 5432, no pooler)"
  echo -e "            This is required for 'prisma migrate deploy' to work."
fi

# ─── Step 5: Smoke test DB-touching API routes ──────────────────────────────
echo -e "\n${CYAN}[5/5] Smoke-testing DB-touching API routes...${NC}"
DOMAIN="proofbridge.venturevisionubuntu.co.za"
for route in "/api/evidence" "/api/evidence/audit" "/api/evidence/compute" "/api/facilitator"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}${route}" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    check_pass "${route} → ${STATUS} (DB connection working)"
  elif [ "$STATUS" = "500" ]; then
    check_fail "${route} → 500 (DB connection FAILED — env var issue)"
  elif [ "$STATUS" = "000" ]; then
    check_warn "${route} → unreachable (network — retry later)"
  else
    check_warn "${route} → ${STATUS} (unexpected — investigate)"
  fi
done

# ─── Summary ─────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}======================================================================${NC}"
echo -e "  ${EMERALD}Passed:${NC}  ${PASS}"
echo -e "  ${AMBER}Warnings:${NC} ${WARN}"
echo -e "  ${ROSE}Failed:${NC}  ${FAIL}"
echo -e "${CYAN}======================================================================${NC}"

if [ $FAIL -gt 0 ]; then
  echo -e "${ROSE}[ACTION REQUIRED]${NC} ${FAIL} check(s) failed. Fix the env vars above, then redeploy:"
  echo -e "  ${AMBER}vercel --prod${NC}"
  exit $FAIL
elif [ $WARN -gt 0 ]; then
  echo -e "${AMBER}[REVIEW]${NC} ${WARN} warning(s). Investigate before relying on DB."
  exit 0
else
  echo -e "${EMERALD}[GREEN]${NC} All checks passed. Production DB is reachable."
  exit 0
fi
