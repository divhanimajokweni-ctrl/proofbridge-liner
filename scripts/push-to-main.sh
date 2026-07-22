#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# push-to-main.sh — Epistemic Runtime Push-to-Main Script
# Pushes local changes to the proofbridge-liner repository main branch.
#
# USAGE:
#   1. Fill in the [YOUR_...] placeholder values below
#   2. chmod +x scripts/push-to-main.sh
#   3. ./scripts/push-to-main.sh
#   4. (Optional) Use --pr flag to create a Pull Request via GitHub CLI
#
# PREREQUISITES:
#   - Git configured with access to the target repository
#   - GitHub CLI (gh) installed for PR creation (optional)
#   - Proper credentials (token or SSH key) for the remote repo
# ──────────────────────────────────────────────────────────────

set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION — Replace [YOUR_...] placeholder values before running
# ═══════════════════════════════════════════════════════════════

# GitHub credentials — Replace these with your actual values
# Option A: HTTPS with username/token (recommended for automation)
# Option B: SSH key (recommended for interactive use)
GITHUB_USERNAME="[YOUR_GITHUB_USERNAME]"
GITHUB_TOKEN_OR_PASSWORD="[YOUR_GITHUB_TOKEN_OR_PASSWORD]"

# Target repository
REPO_OWNER="divhanimajokweni-ctrl"
REPO_NAME="proofbridge-liner"
BRANCH="main"

# Build the remote URL based on credentials
# HTTPS format: https://USERNAME:TOKEN@github.com/OWNER/REPO.git
# SSH format:   git@github.com:OWNER/REPO.git
# — After filling placeholders, uncomment ONE of the following lines:

# REMOTE_URL="https://${GITHUB_USERNAME}:${GITHUB_TOKEN_OR_PASSWORD}@github.com/${REPO_OWNER}/${REPO_NAME}.git"  # Option A: HTTPS
# REMOTE_URL="git@github.com:${REPO_OWNER}/${REPO_NAME}.git"                                                       # Option B: SSH

# Remote name for git (convention: 'origin' or a custom name)
REMOTE_NAME="proofbridge"

# Commit message — customize per deployment
COMMIT_MESSAGE="${COMMIT_MESSAGE:-feat: push epistemic-runtime updates to proofbridge-liner main}"

# PR configuration (used when --pr flag is passed)
PR_TITLE="[YOUR_PR_TITLE]"
PR_BODY="[YOUR_PR_BODY]"
PR_BASE_BRANCH="main"
PR_HEAD_BRANCH="main"

# ═══════════════════════════════════════════════════════════════
# ARGUMENT PARSING
# ═══════════════════════════════════════════════════════════════

CREATE_PR=false
FORCE_PUSH=false

for arg in "$@"; do
  case "$arg" in
    --pr)
      CREATE_PR=true
      shift
      ;;
    --force)
      FORCE_PUSH=true
      shift
      ;;
    --msg=*)
      COMMIT_MESSAGE="${arg#--msg=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# ═══════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Epistemic Runtime — Push-to-Main Script               ║"
echo "║   From proof to production. From verification to deploy. ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check 1: Verify git is installed
echo "🔍 Checking git installation..."
if ! command -v git &> /dev/null; then
  echo "❌ Git is NOT installed. Install git before running this script."
  exit 1
fi
echo "  ✅ Git is available"

# Check 2: Verify we're inside a git repository
echo "🔍 Checking git repository..."
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
  echo "❌ Not inside a git repository. Run this from the project root."
  exit 1
fi
echo "  ✅ Inside git repository"

# Check 3: Verify REMOTE_URL is configured (placeholders filled)
if [ -z "${REMOTE_URL:-}" ]; then
  echo ""
  echo "⚠️  REMOTE URL NOT CONFIGURED"
  echo "   Edit scripts/push-to-main.sh and fill in placeholder values:"
  echo ""
  echo "   Required placeholders:"
  echo "     GITHUB_USERNAME     = your GitHub username"
  echo "     GITHUB_TOKEN_OR_PASSWORD = your GitHub personal access token"
  echo ""
  echo "   Then uncomment ONE of the REMOTE_URL lines:"
  echo "     Option A (HTTPS): https://USERNAME:TOKEN@github.com/divhanimajokweni-ctrl/proofbridge-liner.git"
  echo "     Option B (SSH):   git@github.com:divhanimajokweni-ctrl/proofbridge-liner.git"
  echo ""
  echo "   Or set via environment:"
  echo "     export REMOTE_URL=\"https://YOUR_USER:YOUR_TOKEN@github.com/divhanimajokweni-ctrl/proofbridge-liner.git\""
  echo ""
  echo "   After configuring, run: ./scripts/push-to-main.sh"
  exit 1
fi

# Check 4: Verify no unresolved merge conflicts
echo "🔍 Checking for merge conflicts..."
if git diff --name-only --diff-filter=U &> /dev/null | grep -q .; then
  echo "❌ Unresolved merge conflicts detected. Resolve them before pushing."
  exit 1
fi
echo "  ✅ No merge conflicts"

# Check 5: If --pr flag is set, verify GitHub CLI is installed
if [ "$CREATE_PR" = true ]; then
  echo "🔍 Checking GitHub CLI (gh)..."
  if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is NOT installed. Install it to use --pr flag."
    echo "   Install: https://cli.github.com/"
    exit 1
  fi
  echo "  ✅ GitHub CLI is available"

  # Verify PR placeholders are filled
  if echo "$PR_TITLE" | grep -q "\[YOUR_"; then
    echo "⚠️  PR_TITLE placeholder not filled. Edit the script or set via environment:"
    echo "   export PR_TITLE=\"Your PR title\""
    exit 1
  fi
  if echo "$PR_BODY" | grep -q "\[YOUR_"; then
    echo "⚠️  PR_BODY placeholder not filled. Edit the script or set via environment:"
    echo "   export PR_BODY=\"Your PR description\""
    exit 1
  fi
fi

echo ""
echo "✅ All pre-flight checks passed"
echo ""

# ═══════════════════════════════════════════════════════════════
# REMOTE SETUP — Configure the target repository as a git remote
# ═══════════════════════════════════════════════════════════════

echo "🛰️  Setting up git remote..."

# Remove existing remote if it exists (to update URL)
if git remote get-url "${REMOTE_NAME}" &> /dev/null; then
  echo "  Updating existing remote '${REMOTE_NAME}'..."
  git remote set-url "${REMOTE_NAME}" "${REMOTE_URL}"
else
  echo "  Adding remote '${REMOTE_NAME}'..."
  git remote add "${REMOTE_NAME}" "${REMOTE_URL}"
fi

echo "  ✅ Remote '${REMOTE_NAME}' configured → ${REPO_OWNER}/${REPO_NAME}"
echo ""

# ═══════════════════════════════════════════════════════════════
# STAGE & COMMIT — Add all changes and create a commit
# ═══════════════════════════════════════════════════════════════

echo "📦 Staging all changes..."

# Stage all modified, new, and deleted files
git add -A

# Show what will be committed (for transparency)
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
  echo "  ℹ️  No changes to stage — working tree is clean"
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║   ℹ️  NO CHANGES TO PUSH                                ║"
  echo "║                                                         ║"
  echo "║   Working tree is clean. Nothing to commit or push.     ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  exit 0
fi

echo "  Staged files:"
echo "$STAGED_FILES" | while read -r file; do
  echo "    • $file"
done
echo ""

echo "📝 Committing..."
git commit -m "${COMMIT_MESSAGE}"

# Capture the commit hash for reference
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "  ✅ Committed as ${COMMIT_HASH}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PUSH — Push the commit to the main branch on the remote
# ═══════════════════════════════════════════════════════════════

echo "🚀 Pushing to ${REMOTE_NAME}/${BRANCH}..."

if [ "$FORCE_PUSH" = true ]; then
  echo "  ⚠️  Force push enabled — this will overwrite remote history!"
  git push --force "${REMOTE_NAME}" "${BRANCH}"
else
  # Normal push — fails if remote has diverged
  git push "${REMOTE_NAME}" "${BRANCH}"
fi

echo "  ✅ Push successful"
echo ""

# ═══════════════════════════════════════════════════════════════
# PR CREATION — Optionally create a Pull Request via GitHub CLI
# ═══════════════════════════════════════════════════════════════

if [ "$CREATE_PR" = true ]; then
  echo "🔀 Creating Pull Request via GitHub CLI..."

  # Create the PR using gh cli
  # — Replace [YOUR_...] placeholders in PR_TITLE and PR_BODY before using this
  gh pr create \
    --repo "${REPO_OWNER}/${REPO_NAME}" \
    --title "${PR_TITLE}" \
    --body "${PR_BODY}" \
    --base "${PR_BASE_BRANCH}" \
    --head "${PR_HEAD_BRANCH}"

  echo "  ✅ Pull Request created"
  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅ PUSH COMPLETE                                      ║"
echo "║                                                         ║"
echo "║   Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "║   Branch:     ${BRANCH}"
echo "║   Remote:     ${REMOTE_NAME}"
echo "║   Commit:     ${COMMIT_HASH}"
echo "║   Message:    ${COMMIT_MESSAGE}"
if [ "$CREATE_PR" = true ]; then
echo "║   PR:         Created via GitHub CLI"
fi
echo "║                                                         ║"
echo "║   View at: https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${BRANCH}"
echo "╚══════════════════════════════════════════════════════════╝"
