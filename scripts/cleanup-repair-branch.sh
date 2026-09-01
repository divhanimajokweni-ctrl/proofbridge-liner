#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-CLEANUP-REPAIR-BRANCH.SH
# DESCRIPTION: The repair/deployment-readiness-20260830 branch has served its
#              purpose — main already has the CI workflow + Postgres schema
#              fix deployed to production. This script either:
#                (a) merges the branch into main (if there are unmerged
#                    commits), or
#                (b) deletes the branch locally + remotely (if main is
#                    already up to date — the common case).
#
# This eliminates the stray preview deployments cluttering the Vercel
# deployments list.
# =============================================================================

set -euo pipefail

CYAN='\033[0;36m'
AMBER='\033[0;33m'
EMERALD='\033[0;32m'
ROSE='\033[0;31m'
NC='\033[0m'

BRANCH="repair/deployment-readiness-20260830"

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}     VVU REPAIR BRANCH CLEANUP — ${BRANCH}     ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# ─── Step 1: Fetch latest from origin ────────────────────────────────────────
echo -e "\n${CYAN}[1/4] Fetching latest from origin...${NC}"
git fetch origin 2>&1 | tail -5
check_pass() { echo -e "  ${EMERALD}✓${NC} $1"; }
check_fail() { echo -e "  ${ROSE}✗${NC} $1"; }

# ─── Step 2: Check if branch exists on origin ────────────────────────────────
echo -e "\n${CYAN}[2/4] Checking if branch exists on origin...${NC}"
if ! git ls-remote --exit-code --heads origin "$BRANCH" &>/dev/null; then
  echo -e "  ${AMBER}[!]${NC} Branch '${BRANCH}' does not exist on origin."
  echo -e "  ${AMBER}   ${NC}It may have already been deleted, or never pushed."
  # Check locally
  if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
    echo -e "  ${AMBER}→${NC} Deleting local branch (origin no longer has it)..."
    git checkout main 2>&1 | tail -1
    git branch -D "$BRANCH" 2>&1 | tail -1
    check_pass "Local branch deleted"
  else
    check_pass "No cleanup needed — branch doesn't exist locally or remotely"
  fi
  exit 0
fi
check_pass "Branch exists on origin"

# ─── Step 3: Check for unmerged commits ──────────────────────────────────────
echo -e "\n${CYAN}[3/4] Checking for unmerged commits...${NC}"
UNMERGED=$(git log "main..origin/${BRANCH}" --oneline 2>/dev/null | wc -l)
if [ "$UNMERGED" -gt 0 ]; then
  echo -e "  ${AMBER}!${NC} ${UNMERGED} unmerged commit(s) on ${BRANCH}:"
  git log "main..origin/${BRANCH}" --oneline 2>&1 | head -10
  echo ""
  echo -e "  ${AMBER}→${NC} These commits are NOT on main. Options:"
  echo -e "     [1] Merge into main (fast-forward or merge commit)"
  echo -e "     [2] Cherry-pick specific commits"
  echo -e "     [3] Abort + inspect manually"
  echo -e ""
  read -r -p "  Choose [1/2/3]: " CHOICE
  case "$CHOICE" in
    1)
      git checkout main
      git pull origin main
      git merge "origin/${BRANCH}" --no-ff -m "merge: ${BRANCH} → main (post-deployment-readiness repair)"
      check_pass "Merged ${BRANCH} into main"
      git push origin main
      check_pass "Pushed main to origin"
      ;;
    2)
      echo -e "  ${AMBER}→${NC} Enter commit hashes to cherry-pick (space-separated):"
      read -r HASHES
      git checkout main
      git pull origin main
      for h in $HASHES; do
        git cherry-pick "$h"
        check_pass "Cherry-picked ${h}"
      done
      git push origin main
      check_pass "Pushed main to origin"
      ;;
    3)
      echo -e "  ${AMBER}[i]${NC} Aborted. Inspect manually: git log main..origin/${BRANCH}"
      exit 0
      ;;
  esac
else
  check_pass "All commits on ${BRANCH} are already in main (no merge needed)"
fi

# ─── Step 4: Delete the branch (local + remote) ─────────────────────────────
echo -e "\n${CYAN}[4/4] Deleting branch...${NC}"
# Delete local
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  if [ "$(git branch --show-current)" = "$BRANCH" ]; then
    git checkout main 2>&1 | tail -1
  fi
  git branch -D "$BRANCH" 2>&1 | tail -1
  check_pass "Local branch deleted"
else
  echo -e "  ${AMBER}[i]${NC} No local branch to delete"
fi

# Delete remote
echo -e "  ${AMBER}→${NC} Deleting remote branch..."
git push origin --delete "$BRANCH" 2>&1 | tail -3
check_pass "Remote branch deleted"

echo -e "\n${EMERALD}[DONE]${NC} Branch '${BRANCH}' has been cleaned up."
echo -e "${AMBER}→${NC} Vercel will stop creating stray preview deployments from it."
echo -e "${CYAN}======================================================================${NC}"
