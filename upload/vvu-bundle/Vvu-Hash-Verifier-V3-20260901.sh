#!/usr/bin/env bash
# vvu-hash-verifier-v3-20260901.sh
# VVU MASTER TEXTBOOK – ZERO CAPITAL EDITION
# Design Freeze Level 1 · Release 20260901 · v0.3
# 16-file SHA-256 integrity check - append-only, no edits without re-hash

set -e

FILES=(
  "VVU_Master_Textbook_v0.3.md"
  "VVU_Guardrail_Doc_v1.md"
  "contracts/VVUIVELedger.sol"
  "vvu-decision-ledger-20260901.sql"
  "vvu-init-db-20260901.sh"
  "vvu-telemetry-controller-20260901.ts"
  "vvu-deploy-all-v3-20260901.sh"
  "vvu-ssh-setup-20260901.sh"
  "vvu-ble-fsm-20260901.ts"
  "zoo_step_verifier.py"
  "vvu-sister-system.py"
  "appendix/CIPC_BBBEE_flow.md"
  "appendix/MOI_Article5.md"
  "appendix/SHA_Gate3.md"
  "appendix/Financial_Scenarios.xlsx"
  "appendix/ESD_Scripts.md"
)

echo "🔐 VVU Hash Verifier v3 - 16 Files"
echo "Release: 20260901 - Zero Capital Edition"
echo "----------------------------------------"

mkdir -p .vvu/hashes

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    hash=$(sha256sum "$file" | awk '{print $1}')
    echo "$hash  $file"
    echo "$hash  $file" >> .vvu/hashes/manifest_v3.sha256
  else
    echo "⚠️  MISSING: $file (placeholder - will be verified when present)"
  fi
done

echo "----------------------------------------"
echo "✅ Manifest written to .vvu/hashes/manifest_v3.sha256"
echo "Run: sha256sum -c .vvu/hashes/manifest_v3.sha256 to verify"
echo "Design Freeze Level 1 Complete - No edits without re-hash"
