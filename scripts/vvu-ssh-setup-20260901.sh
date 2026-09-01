#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE:  vvu-ssh-setup-20260901.sh
# PURPOSE: Automate generation + configuration of secure, non-expiring
#          ED25519 SSH deploy keys for DevOps agents. Eliminates manual
#          PAT generation — zero-token git push/pull for CI/CD.
#
# SANS 1200 compliant · ED25519 (quantum-resistant) · No passphrase (automation)
# =============================================================================
set -euo pipefail

# ─── Colors ────────────────────────────────────────────────────────────
AMBER='\033[0;33m'
EMERALD='\033[0;32m'
CRIMSON='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  VVU SSH DEPLOY KEY SETUP · vvu-ssh-setup-20260901.sh${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# ─── Paths ─────────────────────────────────────────────────────────────
SSH_DIR="${HOME}/.ssh"
KEY_NAME="vvu_deploy_key"
KEY_PATH="${SSH_DIR}/${KEY_NAME}"
CONFIG_PATH="${SSH_DIR}/config"
HOST_ALIAS="github.com-vvu"
COMMENT="vvu-devops-agent-$(date -u +%Y%m%d)"

# ─── GATE 1: Verify ssh-keygen is available ───────────────────────────
echo -e "\n${CYAN}[1/5] Checking for ssh-keygen…${NC}"
if ! command -v ssh-keygen &>/dev/null; then
    echo -e "  ${CRIMSON}✗ ssh-keygen not found. Install openssh-client first.${NC}"
    exit 1
fi
echo -e "  ${EMERALD}✓ ssh-keygen found: $(which ssh-keygen)${NC}"

# ─── GATE 2: Create ~/.ssh with hardened permissions ──────────────────
echo -e "\n${CYAN}[2/5] Creating SSH directory with hardened permissions…${NC}"
mkdir -p "${SSH_DIR}"
chmod 700 "${SSH_DIR}"
echo -e "  ${EMERALD}✓ ${SSH_DIR} (chmod 700)${NC}"

# ─── GATE 3: Generate ED25519 key pair (no passphrase) ───────────────
if [ -f "${KEY_PATH}" ]; then
    echo -e "\n${AMBER}[3/5] Key already exists at ${KEY_PATH} — skipping generation.${NC}"
    echo -e "  ${AMBER}  (Delete it first if you want to regenerate.)${NC}"
else
    echo -e "\n${CYAN}[3/5] Generating ED25519 key pair (no passphrase for automation)…${NC}"
    ssh-keygen -t ed25519 -C "${COMMENT}" -f "${KEY_PATH}" -N "" -q
    echo -e "  ${EMERALD}✓ Private key: ${KEY_PATH} (chmod 600)${NC}"
    echo -e "  ${EMERALD}✓ Public key:  ${KEY_PATH}.pub (chmod 644)${NC}"
fi

# Harden permissions regardless of whether we just generated or found existing
chmod 600 "${KEY_PATH}"
chmod 644 "${KEY_PATH}.pub"

# ─── GATE 4: Configure SSH client with dedicated host alias ──────────
echo -e "\n${CYAN}[4/5] Configuring SSH client (host alias: ${HOST_ALIAS})…${NC}"
touch "${CONFIG_PATH}"
chmod 600 "${CONFIG_PATH}"

# Remove any existing block for this host alias (idempotent)
if grep -q "^Host ${HOST_ALIAS}$" "${CONFIG_PATH}" 2>/dev/null; then
    echo -e "  ${AMBER}  Existing ${HOST_ALIAS} block found — replacing.${NC}"
    # Delete from "Host github.com-vvu" to next "Host " or EOF
    sed -i "/^Host ${HOST_ALIAS}\$/,/^Host /{ /^Host ${HOST_ALIAS}\$/d; /^Host /!d; }" "${CONFIG_PATH}" 2>/dev/null || true
fi

# Append the new host block
cat >> "${CONFIG_PATH}" <<SSHCFG

# ── VVU DevOps Agent (auto-generated $(date -u +%Y-%m-%dT%H:%M:%SZ)) ──
Host ${HOST_ALIAS}
    HostName github.com
    User git
    IdentityFile ${KEY_PATH}
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
SSHCFG

echo -e "  ${EMERALD}✓ SSH config updated: ${CONFIG_PATH}${NC}"
echo -e "  ${EMERALD}✓ Host alias: ${HOST_ALIAS} → github.com (git@)${NC}"

# ─── GATE 5: Add github.com to known_hosts (auto-accept) ─────────────
echo -e "\n${CYAN}[5/5] Adding github.com to known_hosts…${NC}"
KNOWN_HOSTS="${SSH_DIR}/known_hosts"
touch "${KNOWN_HOSTS}"
chmod 644 "${KNOWN_HOSTS}"
if ssh-keyscan -t ed25519,rsa github.com >> "${KNOWN_HOSTS}" 2>/dev/null; then
    echo -e "  ${EMERALD}✓ github.com host keys added to ${KNOWN_HOSTS}${NC}"
else
    echo -e "  ${AMBER}  ⚠ ssh-keyscan failed (offline?). Host keys will be accepted on first connect.${NC}"
fi

# ─── Display the public key (for the user to add to GitHub) ───────────
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  NEXT STEPS — ADD PUBLIC KEY TO GITHUB${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${AMBER}1. Copy the public key below:${NC}"
echo ""
echo -e "${EMERALD}───── PUBLIC KEY ─────${NC}"
cat "${KEY_PATH}.pub"
echo -e "${EMERALD}───── END PUBLIC KEY ─────${NC}"
echo ""
echo -e "${AMBER}2. Go to your GitHub repo:${NC}"
echo -e "   https://github.com/divhanimajokweni-ctrl/proofbridge-liner/settings/keys/new"
echo ""
echo -e "${AMBER}3. Fill in:${NC}"
echo -e "   • Title: vvu-devops-agent-deploy-key"
echo -e "   • Key: paste the public key above"
echo -e "   • ${CRIMSON}⚠ Check \"Allow write access\"${NC} (needed for git push)"
echo ""
echo -e "${AMBER}4. Test the connection:${NC}"
echo -e "   ssh -T git@${HOST_ALIAS}"
echo -e "   Expected: \"Hi divhanimajokweni-ctrl! You've successfully authenticated…\""
echo ""
echo -e "${AMBER}5. Switch your repo remote to use the SSH host alias:${NC}"
echo -e "   cd /home/z/my-project  (or your local clone)"
echo -e "   git remote set-url origin git@${HOST_ALIAS}:divhanimajokweni-ctrl/proofbridge-liner.git"
echo -e "   git push origin main"
echo ""
echo -e "${EMERALD}✓ SSH setup complete. Zero-token git operations ready.${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
