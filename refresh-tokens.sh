#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# VVU TOKEN REFRESH SCRIPT
# Run this when tokens expire (GitHub PATs expire after 24h or 7 days)
# ═══════════════════════════════════════════════════════════════════════
#
# INSTRUCTIONS:
#   1. Go to: https://github.com/settings/tokens?type=beta
#   2. Click "Generate new token"
#   3. Select repository: proofbridge-liner
#   4. Permissions: Contents (Read & Write), Metadata (Read)
#   5. Expiration: 7 days (or custom)
#   6. Copy the token (starts with github_pat_)
#   7. Run this script:
#        bash refresh-tokens.sh
#   8. Paste the GitHub token when prompted
#
# For Vercel tokens:
#   1. Go to: https://vercel.com/account/tokens
#   2. Create new token
#   3. The stored Vercel token doesn't expire (it's a long-lived token)
#      Only refresh if it stops working.
# ═══════════════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  VVU Token Refresh                                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── GitHub PAT ──────────────────────────────────────────────────────
echo "━━━ GitHub Personal Access Token ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Current token status:"
CURRENT_GH=$(head -1 ~/.git-credentials 2>/dev/null | sed 's/.*:\(.*\)@.*/\1/' | head -c 20)
if [ -n "$CURRENT_GH" ]; then
  echo "  Stored token: ${CURRENT_GH}..."
  # Test it
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $(cat ~/.git-credentials | sed 's/.*:\(.*\)@.*/\1/' | head -1)" https://api.github.com/user)
  if [ "$RESPONSE" = "200" ]; then
    echo "  Status: ✓ VALID"
  else
    echo "  Status: ⚠ EXPIRED (HTTP $RESPONSE)"
  fi
fi
echo ""
echo "To refresh:"
echo "  1. Visit: https://github.com/settings/tokens?type=beta"
echo "  2. Generate new token (repo: proofbridge-liner, Contents: R/W)"
echo "  3. Run: bash refresh-tokens.sh"
echo "  4. Paste token when prompted"
echo ""
read -p "Enter new GitHub PAT (or press Enter to skip): " GH_TOKEN
if [ -n "$GH_TOKEN" ]; then
  echo "https://divhanimajokweni-ctrl:${GH_TOKEN}@github.com" > ~/.git-credentials
  chmod 600 ~/.git-credentials
  echo "  ✓ GitHub token stored"
  # Test
  RESPONSE=$(curl -s -H "Authorization: Bearer $GH_TOKEN" https://api.github.com/user | grep -o '"login":"[^"]*"')
  echo "  Verified: $RESPONSE"
fi

# ─── Vercel Token ────────────────────────────────────────────────────
echo ""
echo "━━━ Vercel Token ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ -f ~/.vercel-token ]; then
  echo "  Stored token: $(head -c 20 ~/.vercel-token)..."
  echo "  Status: ✓ Stored (Vercel tokens are long-lived)"
fi
echo ""
read -p "Enter new Vercel token (or press Enter to skip): " VERCEL_TOKEN
if [ -n "$VERCEL_TOKEN" ]; then
  echo "$VERCEL_TOKEN" > ~/.vercel-token
  chmod 600 ~/.vercel-token
  echo "  ✓ Vercel token stored"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Tokens refreshed. Run 'bash deploy.sh' to deploy.            ║"
echo "║  VVU · We Serve Trust                                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
