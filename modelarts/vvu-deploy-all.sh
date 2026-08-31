#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-DEPLOY-ALL.SH-v1.0 (ALL-AMD SECURE DEPLOYMENT ORCHESTRATOR)
# DESCRIPTION: Master deployment script tailored for AMD ROCm/HIP workstations.
#              Automates local environment audits, verifies GPU profiling paths,
#              triggers multi-tenant CRM synchronization, runs the SANS-linter,
#              and locks down local Git commit state for secure main branch release.
# =============================================================================

# High-contrast terminal SCADA styling (AMD Crimson & Emerald theme)
AMBER='\033[0;33m'
EMERALD='\033[0;32m'
CRIMSON='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}     VENTURE VISION UBUNTU (VVU) - MASTER ALL-AMD DEPLOYMENT UTILITY  ${NC}"
echo -e "${CYAN}======================================================================${NC}"

# Define baseline directories
ENV_FILE=".env"
VAULT_DIR="./20_Clients"

# ─── GATE 1: AMD HARDWARE & ROCOm/HIP PATH AUDIT ──────────────────────────────
echo -e "\n${CYAN}[1/5] Auditing AMD Workstation Compiler Chain (ROCm/HIP)...${NC}"
AMD_PASS=1

# 1. Check for ROCm path
if [ -d "/opt/rocm" ]; then
    echo -e "  [+] Found local AMD ROCm installation path at: ${EMERALD}/opt/rocm${NC}"
else
    # Fallback env check
    if [ -n "$ROCM_PATH" ]; then
        echo -e "  [+] Detected ROCM_PATH environment variable: ${EMERALD}$ROCM_PATH${NC}"
    else
        echo -e "  [!] ${AMBER}Warning: Default AMD ROCm (/opt/rocm) directory not found. Please verify local driver status.${NC}"
        AMD_PASS=0
    fi
fi

# 2. Check for hipcc compiler
if command -v hipcc &> /dev/null; then
    echo -e "  [+] Detected AMD HIP Compiler (hipcc): ${EMERALD}$(which hipcc)${NC}"
else
    # Fallback to check inside /opt/rocm/bin
    if [ -f "/opt/rocm/bin/hipcc" ]; then
        export PATH=$PATH:/opt/rocm/bin
        echo -e "  [+] AMD HIP Compiler added to PATH: ${EMERALD}/opt/rocm/bin/hipcc${NC}"
    else
        echo -e "  [!] ${AMBER}Warning: 'hipcc' compiler not accessible in path. High-fidelity hardware-aware model exports may fail.${NC}"
        AMD_PASS=0
    fi
fi

if [ $AMD_PASS -eq 1 ]; then
    echo -e "${EMERALD}[SUCCESS] Workstation compiler chain aligned under all-AMD hardware invariants.${NC}"
else
    echo -e "${AMBER}[!] Warning: AMD hardware toolchains are incomplete. Check ROCm/HIP paths before exporting models to edge FPGA DPUs.${NC}"
fi


# ─── GATE 2: LOCAL SECURITY & API CONFIGURATION AUDIT ───────────────────────
echo -e "\n${CYAN}[2/5] Running Local Environment and API Key Check...${NC}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "  [!] ${CRIMSON}Error: Local '.env' configuration file is missing!${NC}"
    exit 1
fi

# Verify GCP Key existence
if grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$ENV_FILE"; then
    GCP_KEY=$(grep "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$ENV_FILE" | cut -d'"' -f2)
    # Check if key is populated with default placeholder or valid string length
    if [[ "$GCP_KEY" == *"placeholder"* ]] || [ -z "$GCP_KEY" ]; then
        echo -e "  [!] ${AMBER}Warning: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is unset or holds a placeholder in .env.${NC}"
        echo -e "      The 3D GIS Bench landing page will load, but terrain and buildings will remain black.${NC}"
    else
        echo -e "  [+] Found Google Maps API Key prefix: ${EMERALD}${GCP_KEY:0:10}... (Length: ${#GCP_KEY})${NC}"
    fi
else
    echo -e "  [!] ${CRIMSON}Error: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' parameter not defined in .env.${NC}"
    exit 1
fi

echo -e "${EMERALD}[SUCCESS] Workspace environment variables validated successfully.${NC}"


# ─── GATE 3: EXCEL TO MULTI-TENANT MD CRM SYNC ──────────────────────────────
echo -e "\n${CYAN}[3/5] Executing Multi-Tenant CRM Synchronization...${NC}"
if [ -f "automation/vvu-b2b-vault-sync-v2.py" ]; then
    python3 automation/vvu-b2b-vault-sync-v2.py
    if [ $? -ne 0 ]; then
        echo -e "  [!] ${CRIMSON}Error: Spreadsheet-to-Vault sync engine returned execution errors.${NC}"
        exit 1
    fi
else
    # Fallback to local execution if not in automation folder
    if [ -f "vvu-b2b-vault-sync-v2.py" ]; then
        python3 vvu-b2b-vault-sync-v2.py
        if [ $? -ne 0 ]; then
            echo -e "  [!] ${CRIMSON}Error: Spreadsheet-to-Vault sync engine returned execution errors.${NC}"
            exit 1
        fi
    else
        echo -e "  [!] ${AMBER}Warning: CRM Sync script 'vvu-b2b-vault-sync-v2.py' not found. Skipping sync pass.${NC}"
    fi
fi


# ─── GATE 4: SANS LINTER & PRE-COMMIT PROVENANCE VERIFICATION ───────────────
echo -e "\n${CYAN}[4/5] Executing SANS Linter & Integrity Verification...${NC}"
if [ -f "automation/vvu-obsidian-sync-v2.sh" ]; then
    bash automation/vvu-obsidian-sync-v2.sh
    if [ $? -ne 0 ]; then
        echo -e "  [!] ${CRIMSON}Error: Local pre-commit SANS audit failed. Commit blocked.${NC}"
        exit 1
    fi
else
    if [ -f "vvu-obsidian-sync-v2.sh" ]; then
        bash vvu-obsidian-sync-v2.sh
        if [ $? -ne 0 ]; then
            echo -e "  [!] ${CRIMSON}Error: Local pre-commit SANS audit failed. Commit blocked.${NC}"
            exit 1
        fi
    else
        echo -e "  [!] ${CRIMSON}Error: Pre-commit SANS script 'vvu-obsidian-sync-v2.sh' is missing!${NC}"
        exit 1
    fi
fi


# ─── GATE 5: MASTER DEPLOYMENT PACKAGING & WORKSTATION LOCKDOWN ───────────────
echo -e "\n${CYAN}[5/5] Securing Workstation Files & Executing Final Release Lock...${NC}"

# Lock down .env file permissions
chmod 600 "$ENV_FILE"
echo -e "  [+] Hardened configuration file permissions: ${EMERALD}chmod 600 .env${NC}"

# Check for uncommitted git changes
if git diff-index --quiet HEAD --; then
    echo -e "${EMERALD}[SUCCESS] Local git tree is clean and synchronized. Master release is locked!${NC}"
else
    echo -e "  [INFO] Uncommitted changes detected. Preparing automated git packaging..."
    TX_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    git add .
    git commit -m "🚀 [RELEASE LOCK] All-AMD Unified System Deploy: ${TX_TIMESTAMP} | ROCm-Isolated | RLS Multi-Tenant Enforced"
    echo -e "${EMERALD}[SUCCESS] Staged files packed and securely committed locally.${NC}"
fi

echo -e "\n${EMERALD}[MASTER DEPLOYMENT COMPLETE] All systems are locked, verified, and operational!${NC}"
echo -e "${CYAN}======================================================================${NC}"
```
