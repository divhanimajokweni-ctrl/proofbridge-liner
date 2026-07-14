#!/bin/bash
# VVU Trust Chain v3.1 - GitHub Secrets Configuration
# Run this script from a machine with GitHub CLI authenticated
# OR manually configure these secrets in GitHub UI

echo "Configuring GitHub Secrets for VVU Trust Chain v3.1..."
echo ""

# Note: GitHub CLI does not support setting secrets via API for security reasons
# These commands are for documentation. Configure manually at:
# https://github.com/divhanimajokweni-ctrl/proofbridge-liner/settings/secrets/actions

echo "=== MANIFEST_SIGNING_KEY ==="
cat .vvu/keys/manifest-signing-key.pem
echo ""

echo "=== MANIFEST_PUBLIC_KEY ==="
cat .vvu/keys/manifest-public-key.pem
echo ""

echo "=== EVIDENCE_SIGNING_KEY ==="
cat .vvu/keys/evidence-signing-key.pem
echo ""

echo ""
echo "To configure manually:"
echo "1. Go to: https://github.com/divhanimajokweni-ctrl/proofbridge-liner/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add each secret with the corresponding value above"
echo ""
echo "Required Secrets:"
echo "  - MANIFEST_SIGNING_KEY (private key for manifest signing)"
echo "  - MANIFEST_PUBLIC_KEY (public key for manifest verification)"
echo "  - EVIDENCE_SIGNING_KEY (private key for evidence signing)"
echo ""
echo "Optional Variable:"
echo "  - PROD_HEALTH_URL (default: https://venturevisionubuntu.co.za/api/health)"
