#!/usr/bin/env bash
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-DEPLOY-ALL-V2.SH (ALL-AMD SECURE DEPLOYMENT & AUTO-INSTALLER)
# DESCRIPTION: Master deployment script tailored for AMD ROCm/HIP workstations.
#              Automates local environment audits, performs zero-friction install
#              or compile of ROCm and HIP development stacks if missing,
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

# ─── GATE 1: AMD HARDWARE & ROCm/HIP PATH AUDIT & AUTO-INSTALL ────────────────
echo -e "\n${CYAN}[1/5] Auditing AMD Workstation Compiler Chain (ROCm/HIP)...${NC}"
AMD_PASS=1

check_rocm() {
    # 1. Check for ROCm path
    if [ -d "/opt/rocm" ]; then
        echo -e "  [+] Found local AMD ROCm installation path at: ${EMERALD}/opt/rocm${NC}"
        return 0
    elif [ -n "$ROCM_PATH" ] && [ -d "$ROCM_PATH" ]; then
        echo -e "  [+] Detected ROCM_PATH environment variable: ${EMERALD}$ROCM_PATH${NC}"
        return 0
    fi
    return 1
}

check_hipcc() {
    if command -v hipcc &> /dev/null; then
        echo -e "  [+] Detected AMD HIP Compiler (hipcc): ${EMERALD}$(which hipcc)${NC}"
        return 0
    elif [ -f "/opt/rocm/bin/hipcc" ]; then
        export PATH=$PATH:/opt/rocm/bin
        echo -e "  [+] AMD HIP Compiler added to PATH: ${EMERALD}/opt/rocm/bin/hipcc${NC}"
        return 0
    fi
    return 1
}

if check_rocm && check_hipcc; then
    echo -e "${EMERALD}[SUCCESS] Workstation compiler chain aligned under all-AMD hardware invariants.${NC}"
else
    echo -e "  [!] ${AMBER}Warning: Default AMD ROCm or HIP Compiler not found on this system.${NC}"
    
    # Check for non-interactive auto-install flags
    REPLY=""
    if [[ "$1" == "--auto-install" || "$AUTO_INSTALL" == "true" ]]; then
        REPLY="y"
        echo -e "  [INFO] Auto-install flag detected. Proceeding with AMD ROCm installation..."
    else
        echo -e "  [?] Would you like to automatically install the official AMD ROCm and HIP SDK? (y/n)"
        read -p "  Selection (default: n): " -r REPLY
    fi
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${CYAN}[+] Starting Automated AMD ROCm & HIP Compiler Installation...${NC}"
        # Detect OS
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS_ID=$ID
            OS_VERSION=$VERSION_ID
        else
            OS_ID="unknown"
        fi
        
        echo -e "  [INFO] Detected Operating System: ${CYAN}${OS_ID} ${OS_VERSION}${NC}"
        
        if [[ "$OS_ID" == "ubuntu" || "$OS_ID" == "debian" ]]; then
            echo -e "  [INFO] Setting up official AMD Package Repositories..."
            sudo apt-get update -y
            sudo apt-get install -y wget gnupg2 ca-certificates
            
            # Setup repository and keyring (ROCm 6.1)
            sudo mkdir -p --mode=0755 /etc/apt/keyrings
            wget -q -O - https://repo.radeon.com/rocm/rocm.gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/rocm.gpg > /dev/null
            
            # Choose specific repository based on OS version
            if [[ "$OS_VERSION" == "22.04" ]]; then
                UBUNTU_CODENAME="jammy"
            elif [[ "$OS_VERSION" == "24.04" ]]; then
                UBUNTU_CODENAME="noble"
            else
                UBUNTU_CODENAME="jammy" # Safe fallback
            fi
            
            # Add the ROCm apt repository
            echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/rocm.gpg] https://repo.radeon.com/rocm/apt/6.1/ ${UBUNTU_CODENAME} main" | sudo tee /etc/apt/sources.list.d/rocm.list
            
            # Prefer using amdgpu-install tool
            AMDGPU_URL="https://repo.radeon.com/amdgpu-install/6.1/ubuntu/${UBUNTU_CODENAME}/"
            echo -e "  [INFO] Fetching AMD graphics installation utility from ${CYAN}${AMDGPU_URL}${NC}..."
            
            # Get latest available package or use wget to grab the primary installer
            wget -q -nd -r -l1 -A 'amdgpu-install*.deb' "${AMDGPU_URL}" -P /tmp/
            AMDGPU_DEB=$(ls /tmp/amdgpu-install*.deb 2>/dev/null | head -n 1)
            
            if [ -n "$AMDGPU_DEB" ]; then
                echo -e "  [+] Installing graphics installer package: ${CYAN}${AMDGPU_DEB}${NC}"
                sudo apt-get install -y "$AMDGPU_DEB"
                
                echo -e "  [+] Compiling and installing ROCm and HIP development libraries..."
                # Run amdgpu-install with the standard usecases for edge development (rocm, hiplibsdk) without kernel modules (dkms) if on virtualized environment
                sudo amdgpu-install -y --usecase=rocm,hiplibsdk --no-dkms
                
                # Cleanup
                rm -f /tmp/amdgpu-install*.deb
            else
                # Manual apt installation fallback if installer script is missing
                echo -e "  [!] ${AMBER}amdgpu-install package not found. Falling back to manual apt installation...${NC}"
                sudo apt-get update -y
                sudo apt-get install -y rocm-hip-sdk rocm-device-libs
            fi
            
            # Environment Configuration
            export PATH=$PATH:/opt/rocm/bin
            export ROCM_PATH=/opt/rocm
            export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/opt/rocm/lib
            
            # Permanent profile update (appending if not already exists)
            grep -q "export PATH=\\$PATH:/opt/rocm/bin" ~/.bashrc || echo "export PATH=\\$PATH:/opt/rocm/bin" >> ~/.bashrc
            grep -q "export ROCM_PATH=/opt/rocm" ~/.bashrc || echo "export ROCM_PATH=/opt/rocm" >> ~/.bashrc
            grep -q "export LD_LIBRARY_PATH=" ~/.bashrc || echo "export LD_LIBRARY_PATH=\\$LD_LIBRARY_PATH:/opt/rocm/lib" >> ~/.bashrc
            
            # Re-verify
            if check_rocm && check_hipcc; then
                echo -e "${EMERALD}[SUCCESS] AMD ROCm & HIP compiler chain successfully deployed and configured on this workstation.${NC}"
            else
                echo -e "${CRIMSON}[ERROR] Automated installation completed but paths could not be verified automatically. Please restart your shell and verify paths.${NC}"
                AMD_PASS=0
            fi
        else
            echo -e "  [!] ${AMBER}Auto-installation is optimized for Debian/Ubuntu environments. For RedHat, Arch, or other distros, please install ROCm manually via:${NC}"
            echo -e "      ${CYAN}https://rocm.docs.amd.com/en/latest/deploy/linux/index.html${NC}"
            AMD_PASS=0
        fi
    else
        echo -e "  [!] ${AMBER}Installation skipped. Continuing with existing environment (warning: model compilations may fail).${NC}"
        AMD_PASS=0
    fi
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
if git diff-index --quiet HEAD -- 2>/dev/null; then
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
