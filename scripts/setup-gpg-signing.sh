#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-SETUP-GPG-SIGNING.SH
# DESCRIPTION: Sets up GPG commit signing for supply-chain integrity on the
#              public proofbridge-liner repository.
#
# WHY: githubCommitVerification: "unverified" on every commit means anyone
#      could push commits with your email address. GPG signing proves each
#      commit came from you (or someone with your private key). GitHub shows
#      a "Verified" badge on signed commits.
# =============================================================================

set -euo pipefail

CYAN='\033[0;36m'
AMBER='\033[0;33m'
EMERALD='\033[0;32m'
ROSE='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}     VVU GPG COMMIT SIGNING SETUP     ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# ─── Step 1: Check if GPG is installed ──────────────────────────────────────
echo -e "\n${CYAN}[1/6] Verifying GPG is installed...${NC}"
if ! command -v gpg &>/dev/null; then
  echo -e "  ${ROSE}[!]${NC} GPG not installed."
  echo -e "  ${AMBER}→${NC} Install with: brew install gnupg (macOS) | apt install gnupg (Linux)"
  exit 1
fi
GPG_VERSION=$(gpg --version | head -1)
echo -e "  ${EMERALD}✓${NC} ${GPG_VERSION}"

# ─── Step 2: Check for existing GPG keys ─────────────────────────────────────
echo -e "\n${CYAN}[2/6] Checking for existing GPG keys...${NC}"
EXISTING_KEYS=$(gpg --list-secret-keys --keyid-format=long 2>/dev/null | grep sec | head -5)
if [ -n "$EXISTING_KEYS" ]; then
  echo -e "  ${EMERALD}✓${NC} Existing GPG keys found:"
  echo "$EXISTING_KEYS" | sed 's/^/    /'
  echo ""
  echo -e "  ${AMBER}?${NC} Use an existing key? (y/N)"
  read -r USE_EXISTING
  if [[ "$USE_EXISTING" =~ ^[Yy]$ ]]; then
    KEY_ID=$(echo "$EXISTING_KEYS" | head -1 | grep -oE '[A-F0-9]{40}' | tail -c 17)
    if [ -z "$KEY_ID" ]; then
      KEY_ID=$(echo "$EXISTING_KEYS" | head -1 | awk '{print $2}' | cut -d'/' -f2)
    fi
    echo -e "  ${EMERALD}✓${NC} Using key: ${KEY_ID}"
  else
    KEY_ID=""
  fi
else
  echo -e "  ${AMBER}[i]${NC} No existing GPG keys found."
  KEY_ID=""
fi

# ─── Step 3: Generate new GPG key (if needed) ───────────────────────────────
if [ -z "$KEY_ID" ]; then
  echo -e "\n${CYAN}[3/6] Generating new GPG key...${NC}"
  echo -e "  ${AMBER}→${NC} You'll be prompted for:"
  echo -e "     - Real name: Mihle Iviwe Majokweni"
  echo -e "     - Email: hello@venturevisionubuntu.co.za (use the GitHub-verified email)"
  echo -e "     - Passphrase: choose a strong one (you'll enter it on every commit unless you cache it)"
  echo ""
  echo -e "  ${AMBER}?${NC} Generate new GPG key now? (y/N)"
  read -r GEN_KEY
  if [[ ! "$GEN_KEY" =~ ^[Yy]$ ]]; then
    echo -e "  ${AMBER}[i]${NC} Skipped. To generate manually later:"
    echo -e "     gpg --full-generate-key"
    echo -e "     (Choose: RSA and RSA, 4096 bits, no expiry)"
    exit 0
  fi

  gpg --full-generate-key
  KEY_ID=$(gpg --list-secret-keys --keyid-format=long 2>/dev/null | grep sec | head -1 | awk '{print $2}' | cut -d'/' -f2)
  if [ -z "$KEY_ID" ]; then
    echo -e "  ${ROSE}[!]${NC} Failed to extract key ID. Run: gpg --list-secret-keys --keyid-format=long"
    exit 1
  fi
  echo -e "  ${EMERALD}✓${NC} New GPG key generated: ${KEY_ID}"
else
  echo -e "\n${CYAN}[3/6] Skipping key generation (using existing key)...${NC}"
fi

# ─── Step 4: Configure git to use the key ────────────────────────────────────
echo -e "\n${CYAN}[4/6] Configuring git to sign commits with ${KEY_ID}...${NC}"
git config --global user.signingkey "$KEY_ID"
git config --global commit.gpgsign true
git config --global gpg.program gpg
echo -e "  ${EMERALD}✓${NC} git config --global user.signingkey ${KEY_ID}"
echo -e "  ${EMERALD}✓${NC} git config --global commit.gpgsign true"

# ─── Step 5: Export public key for GitHub ────────────────────────────────────
echo -e "\n${CYAN}[5/6] Exporting public key for GitHub...${NC}"
PUBKEY_FILE="gpg-public-key-${KEY_ID}.txt"
gpg --armor --export "$KEY_ID" > "$PUBKEY_FILE"
echo -e "  ${EMERALD}✓${NC} Public key exported to: ${PUBKEY_FILE}"
echo ""
echo -e "  ${AMBER}→${NC} Add this key to GitHub:"
echo -e "     1. Go to: https://github.com/settings/gpg/new"
echo -e "     2. Open ${PUBKEY_FILE} and copy its entire contents"
echo -e "     3. Paste into the 'Key' field on GitHub"
echo -e "     4. Click 'Add GPG key'"
echo ""
echo -e "  ${AMBER}?${NC} Open GitHub GPG settings in browser now? (y/N)"
read -r OPEN_BROWSER
if [[ "$OPEN_BROWSER" =~ ^[Yy]$ ]]; then
  if command -v xdg-open &>/dev/null; then xdg-open "https://github.com/settings/gpg/new"
  elif command -v open &>/dev/null; then open "https://github.com/settings/gpg/new"
  else echo -e "  ${AMBER}→${NC} Open manually: https://github.com/settings/gpg/new"
  fi
fi

# ─── Step 6: Optional — cache passphrase ────────────────────────────────────
echo -e "\n${CYAN}[6/6] Optional: cache GPG passphrase...${NC}"
echo -e "  ${AMBER}?${NC} Configure GPG agent to cache passphrase for 1 hour? (y/N)"
echo -e "     (Recommended — avoids entering passphrase on every commit)"
read -r CACHE_PASS
if [[ "$CACHE_PASS" =~ ^[Yy]$ ]]; then
  mkdir -p ~/.gnupg
  cat > ~/.gnupg/gpg-agent.conf <<'EOF'
default-cache-ttl 3600
max-cache-ttl 86400
allow-preset-passphrase
EOF
  echo -e "  ${EMERALD}✓${NC} GPG agent configured (1h cache)"
  echo -e "  ${AMBER}→${NC} Restart gpg-agent: gpgconf --kill gpg-agent && gpgconf --launch gpg-agent"
fi

echo -e "\n${EMERALD}[DONE]${NC} GPG signing is configured."
echo -e "${CYAN}======================================================================${NC}"
echo -e "${AMBER}Next steps:${NC}"
echo -e "  1. Add the public key to GitHub (step 5 above)"
echo -e "  2. Test with: echo 'test' | gpg --clearsign"
echo -e "  3. Make a commit — it should show 'Verified' on GitHub:"
echo -e "     git commit -S -m 'test: signed commit'"
echo -e "     git push origin main"
echo -e "${CYAN}======================================================================${NC}"
