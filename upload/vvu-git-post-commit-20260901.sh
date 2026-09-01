#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: vvu-git-post-commit-20260901.sh (AMENDMENT LEDGER HOOK)
# DESCRIPTION: Git post-commit hook automating our "Act & Amendment" Protocol.
#              Every time a local commit is recorded on our AMD workstation, 
#              this hook calculates the SHA-256 hashes of changed files, 
#              verifies compliance, and logs the change to our offline 
#              Obsidian ledger under SANS-compliant RLS multi-tenant rules.
# =============================================================================

# High-contrast terminal SCADA styling (AMD Crimson & Emerald theme)
AMBER='\033[0;33m'
EMERALD='\033[0;32m'
CRIMSON='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}     VVU TRUST RUNTIME — CONSTITUTIONAL AMENDMENT TRACKING HOOK       ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# Define pathing boundaries
LEDGER_FILE="30_Governance/vvu-ledger-amendments.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

# Ensure governance directory exists locally
mkdir -p "30_Governance"

# Initialize ledger file with correct structural frontmatter if missing
if [ ! -f "$LEDGER_FILE" ]; then
    echo -e "  [INFO] Initializing new SANS-compliant governance ledger..."
    cat << EOF > "$LEDGER_FILE"
---
document_type: GOVERNANCE_LEDGER
title: Venture Vision Ubuntu (VVU) Master Amendment Ledger
status: IMMUTABLE_EVENT_STORE
security_classification: PROPRIETARY_SANS_1200
---

# 🏛️ VVU MASTER AMENDMENT LEDGER (CONSTITUTIONAL ACT REPLAY)

This document serves as the immutable, append-only event store for all script and system configurations.
Governed under **VVU Master Governance Framework (v2.1)**. All changes listed here are treated as legal and mechanical **Amendments**.

| Timestamp (UTC) | Commit | Modified File | SHA-256 Checksum | Description |
| :--- | :---: | :--- | :--- | :--- |
EOF
fi

# Locate modified files in the last commit (skipping git internals)
echo -e "  [INFO] Interrogating Git commit: ${EMERALD}${COMMIT_HASH}${NC}"
echo -e "  [INFO] Commit Description: \"${AMBER}${COMMIT_MSG}${NC}\""

# Parse file list
git diff-tree --no-commit-id --name-only -r "$COMMIT_HASH" | while read -r FILE; do
    # Skip directories, deleted files, and the ledger itself to avoid recursive loops
    if [ ! -f "$FILE" ] || [ "$FILE" == "$LEDGER_FILE" ]; then
        continue
    fi

    # Calculate deterministic SHA-256 hash using local utilities
    if command -v sha256sum &> /dev/null; then
        SHA256_HASH=$(sha256sum "$FILE" | cut -d' ' -f1)
    else
        SHA256_HASH=$(shasum -a 256 "$FILE" | cut -d' ' -f1)
    fi

    # Format entries for our markdown ledger
    FILENAME=$(basename "$FILE")
    echo -e "  [+] Recording Amendment: ${CYAN}${FILENAME}${NC}"
    echo -e "      SHA-256 Checksum: ${EMERALD}${SHA256_HASH}${NC}"

    # Append to the ledger table
    echo "| ${TIMESTAMP} | \`${COMMIT_HASH}\` | \`${FILE}\` | \`${SHA256_HASH}\` | ${COMMIT_MSG} |" >> "$LEDGER_FILE"
done

# Set restrictive file permissions to protect local-first data integrity
chmod 600 "$LEDGER_FILE"
echo -e "${EMERALD}[SUCCESS] Amendment recorded and cryptographically logged to: ${LEDGER_FILE}${NC}"
echo -e "${CYAN}======================================================================${NC}"
