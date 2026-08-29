#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# VVU DEPLOYMENT SCRIPT
# Deploys the branded Trust Dashboard to Vercel + pushes to GitHub
# ═══════════════════════════════════════════════════════════════════════
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  VVU · Venture Vision Ubuntu — Deployment Script            ║"
echo "║  Black + Gold · We Serve Trust                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. GITHUB PUSH ──────────────────────────────────────────────────
echo "━━━ Step 1: GitHub Push ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Repository: github.com/divhanimajokweni-ctrl/proofbridge-liner"
echo "Branch: main"
echo ""

# Check if gh CLI is available
if command -v gh &>/dev/null; then
    echo "GitHub CLI found. Authenticating..."
    gh auth login --web
    git push -u origin main
    echo "✓ Pushed to GitHub"
else
    echo "GitHub CLI not found. Using git with credentials..."
    echo ""
    echo "To push manually:"
    echo "  1. Create a Personal Access Token at: https://github.com/settings/tokens"
    echo "  2. Run: git push -u origin main"
    echo "  3. Enter your GitHub username and paste the token as password"
    echo ""
    # Try push anyway
    git push -u origin main || echo "⚠ Push failed — credentials needed. See instructions above."
fi

echo ""

# ─── 2. VERCEL DEPLOY ───────────────────────────────────────────────
echo "━━━ Step 2: Vercel Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prepare deployment folder
DEPLOY_DIR="/tmp/vercel-vvu-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/brand"

# Copy the branded dashboard as index.html
cp public/vvu-trust-dashboard.html "$DEPLOY_DIR/index.html"
cp public/brand/vvu-three-rings.svg "$DEPLOY_DIR/brand/"
cp public/brand/vvu-three-rings-logo.png "$DEPLOY_DIR/brand/" 2>/dev/null || true

# Create vercel.json
cat > "$DEPLOY_DIR/vercel.json" << 'JSON'
{
  "version": 2,
  "builds": [
    { "src": "index.html", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/brand/(.*)", "dest": "/brand/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
JSON

cd "$DEPLOY_DIR"

# Login and deploy
echo "Deploying to Vercel..."
echo ""
echo "If not logged in, run: vercel login"
echo "Then run: vercel --prod"
echo ""

vercel --prod --yes 2>&1 || {
    echo ""
    echo "⚠ Vercel login required. Run:"
    echo "  vercel login"
    echo "  vercel --prod"
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT COMPLETE                                         ║"
echo "║  VVU · Venture Vision Ubuntu · We Serve Trust                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
