#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# VVU DEPLOYMENT SCRIPT — Push to GitHub + Deploy to Vercel
# Tokens are stored in ~/.git-credentials and ~/.vercel-token
# ═══════════════════════════════════════════════════════════════════════
set -e

VERCEL_TOKEN=$(cat ~/.vercel-token 2>/dev/null || echo "$VERCEL_TOKEN")

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  VVU · Venture Vision Ubuntu — Deploy                         ║"
echo "║  Black + Gold · We Serve Trust                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ─── 1. GITHUB PUSH ──────────────────────────────────────────────────
cd /home/z/my-project
echo "━━━ Step 1: GitHub Push ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git add -A
git commit -m "deploy: VVU Trust Dashboard update $(date -u +%Y-%m-%dT%H:%M)" 2>/dev/null || true
git push -u origin main 2>&1 || echo "⚠ GitHub push issue"

# ─── 2. VERCEL DEPLOY ───────────────────────────────────────────────
echo "━━━ Step 2: Vercel Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DEPLOY_DIR="/tmp/vercel-vvu-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/brand"
cp /home/z/my-project/public/vvu-trust-dashboard.html "$DEPLOY_DIR/index.html"
cp /home/z/my-project/public/brand/vvu-three-rings.svg "$DEPLOY_DIR/brand/"

cat > "$DEPLOY_DIR/vercel.json" << 'JSON'
{
  "version": 2,
  "builds": [{ "src": "index.html", "use": "@vercel/static" }],
  "routes": [
    { "src": "/brand/(.*)", "dest": "/brand/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
JSON

cd "$DEPLOY_DIR"
vercel deploy --prod --token "$VERCEL_TOKEN" --yes 2>&1
echo "✓ VVU · We Serve Trust"
