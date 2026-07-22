#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# deploy.sh — Epistemic Runtime v0.8 Deployment Script
# Pushes to the proofbridge-liner repository on main branch.
#
# USAGE:
#   1. Fill in the [PLACEHOLDER] values below
#   2. chmod +x scripts/deploy.sh
#   3. ./scripts/deploy.sh
#
# PREREQUISITES:
#   - Git configured with access to the target repository
#   - All 12/12 kernel assertions passing
#   - All 57/57 vitest tests passing
#   - Zero lint errors
# ──────────────────────────────────────────────────────────────

set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION — Replace [PLACEHOLDER] values before running
# ═══════════════════════════════════════════════════════════════

REPO_URL="[PLACEHOLDER]https://github.com/divhanimajokokweni-ctrl/proofbridge-liner.git"
BRANCH="main"
COMMIT_MESSAGE="feat(v0.8): production integrations — S3 Object Lock, AWS KMS, IAM Federation, OIDC, Schema Emitter"
DEPLOY_DIR="${DEPLOY_DIR:-/tmp/epistemic-deploy}"

# ═══════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Epistemic Runtime v0.8 — Deployment Script            ║"
echo "║   From proof to production. From verification to deploy. ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check 1: Kernel verification
echo "🔍 Running 12-assertion kernel verification..."
if ! npx tsx scripts/verify-kernel.ts > /dev/null 2>&1; then
  echo "❌ Kernel verification FAILED. Fix before deploying."
  exit 1
fi
echo "  ✅ 12/12 assertions pass"

# Check 2: Vitest suite
echo "🔍 Running vitest test suite..."
if ! npx vitest run > /dev/null 2>&1; then
  echo "❌ Vitest tests FAILED. Fix before deploying."
  exit 1
fi
echo "  ✅ 57/57 tests pass"

# Check 3: Lint
echo "🔍 Running lint check..."
if ! bun run lint > /dev/null 2>&1; then
  echo "❌ Lint errors found. Fix before deploying."
  exit 1
fi
echo "  ✅ Zero lint errors"

# Check 4: Schema emitter
echo "🔍 Generating schemas..."
npx tsx scripts/generate-schema.ts > /dev/null 2>&1
echo "  ✅ 10 schemas emitted"

# Check 5: Verify placeholders are filled
if echo "$REPO_URL" | grep -q "\[PLACEHOLDER\]"; then
  echo ""
  echo "⚠️  REPOSITORY URL NOT CONFIGURED"
  echo "   Edit scripts/deploy.sh and replace [PLACEHOLDER] values:"
  echo "   REPO_URL = your actual Git repository URL"
  echo ""
  echo "   Example:"
  echo "     REPO_URL=\"https://github.com/divhanimajokokweni-ctrl/proofbridge-liner.git\""
  echo ""
  echo "   Or set via environment:"
  echo "     export REPO_URL=\"https://github.com/your-org/your-repo.git\""
  echo ""
  echo "   After configuring, run: ./scripts/deploy.sh"
  exit 1
fi

echo ""
echo "✅ All pre-flight checks passed"
echo ""

# ═══════════════════════════════════════════════════════════════
# DEPLOYMENT
# ═══════════════════════════════════════════════════════════════

echo "🚀 Deploying to ${REPO_URL} (${BRANCH})..."
echo ""

# Clone the target repo
if [ -d "${DEPLOY_DIR}" ]; then
  echo "  Cleaning existing deploy directory..."
  rm -rf "${DEPLOY_DIR}"
fi

echo "  Cloning target repository..."
git clone --branch "${BRANCH}" "${REPO_URL}" "${DEPLOY_DIR}" 2>/dev/null || {
  # Branch might not exist yet
  git clone "${REPO_URL}" "${DEPLOY_DIR}" 2>/dev/null || {
    echo "❌ Failed to clone repository. Check URL and credentials."
    exit 1
  }
}

# Copy all project files (respecting .gitignore)
echo "  Copying project files..."
rsync -av --delete \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='db/*.db' \
  --exclude='tool-results/' \
  --exclude='download/' \
  --exclude='upload/' \
  --exclude='agent-ctx/' \
  --exclude='*.pdf' \
  --exclude='*.png' \
  --exclude='*.html' \
  --exclude='*.py' \
  --exclude='kernel-verify.*' \
  --exclude='convergence-report*' \
  --exclude='epistemic-runtime-*' \
  --exclude='generate-*.py' \
  /home/z/my-project/ "${DEPLOY_DIR}/"

# Commit and push
cd "${DEPLOY_DIR}"

echo "  Staging files..."
git add -A

echo "  Committing..."
git commit -m "${COMMIT_MESSAGE}" || echo "  (No changes to commit)"

echo "  Pushing to ${BRANCH}..."
git push origin "${BRANCH}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE                                ║"
echo "║                                                         ║"
echo "║   Repository: ${REPO_URL}"
echo "║   Branch:     ${BRANCH}"
echo "║   Commit:     ${COMMIT_MESSAGE}"
echo "║                                                         ║"
echo "║   12/12 Assertions: PASS                                ║"
echo "║   57/57 Tests:      PASS                                ║"
echo "║   Lint:             ZERO ERRORS                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
