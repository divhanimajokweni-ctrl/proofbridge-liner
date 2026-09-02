#!/bin/bash
# FINAL VERIFIER v0.3 - 19 files
set -e
echo "37cf3a3f077f7ec5b84f318bb4c7518abb2edbfe0b4a6a6f87b56d08630aa40c  VVU_Master_Textbook_v0.3.md" | sha256sum -c -
echo "4fe867e74d5bf14f6886d068fdea1c9b0bbf91ab63954d6c9541c00ab949ff0c  VVU_Guardrail_Doc_v1.md" | sha256sum -c -
echo "8620915e0acbb53265f77e6a9fac429b3bb09920b1a14c2932aec313fd89dade  contracts/VVUIVELedger.sol" | sha256sum -c -
echo "d5ce9dcc0210200cfade56aa82d80fbcc98d31d39ffd19fc5eaa55edc231e57f  vvu-decision-ledger-20260901.sql" | sha256sum -c -
echo "1d43537527d935d77b0f6c9f30eac55d415e6188823b14b1299b5fb960889461  vvu-init-db-20260901.sh" | sha256sum -c -
echo "2e5e0d8b1d703c7674a04f4811dffe79f8a177d9d83cdc2d8d499cdb878a8036  vvu-telemetry-controller-20260901.ts" | sha256sum -c -
echo "d98891675ff3fa15cf13a67dc092e3a47d86d0affe17540561299755b449f6f2  vvu-deploy-all-v3-20260901.sh" | sha256sum -c -
echo "6c0d687901309fa61559695c11c5ae35219478229f275a6f4420dd36e13db737  vvu-ssh-setup-20260901.sh" | sha256sum -c -
echo "379e91be82992688dd3c83da864c7fb41382cccebbc7d03093473faa496754e7  vvu-ble-fsm-20260901.ts" | sha256sum -c -
echo "74ff2890098ea5b874f9b22ddf679c3a3617d0e382118727fd25454e6b917662  zoo_step_verifier.py" | sha256sum -c -
echo "48da8b6da45b6c670ad97b27295c203bb9812569f82f01580b111f9ebcd3e441  vvu-sister-system.py" | sha256sum -c -
echo "b3440e61315cbeae6fbf37c48a212ad90fff847757c0c9af30702fd811f8ccfb  appendix/CIPC_BBBEE_flow.md" | sha256sum -c -
echo "18b4ef87a5c64c02e090c0b2fe40255158c00e1f80b39fa05e5de5d1c911ca16  appendix/MOI_Article5.md" | sha256sum -c -
echo "c27b4f11febd3e2e75767199f6fca9354ddf4e93c1c484a57ae7faf11dbb0826  appendix/SHA_Gate3.md" | sha256sum -c -
echo "8b69d99ebb7e47718ee97bb2cf7ae375e1c861c716ca1260f3e26ba920185b82  appendix/Financial_Scenarios.xlsx" | sha256sum -c -
echo "c0eabd8bd00a6c9790b1a19b0f6fc1667ec60ddf8330101737f8ddd4f69fbbd1  appendix/ESD_Scripts.md" | sha256sum -c -
echo "d6f6697b0ce0721a02d4bf1f640660a89eee30970ab1bda5ff9395b867d5c2cf  Vvu-Hash-Verifier-V3-20260901.sh" | sha256sum -c -
echo "74ff2890098ea5b874f9b22ddf679c3a3617d0e382118727fd25454e6b917662  Zoo-Step-Verifier.py" | sha256sum -c -
echo "d5ce9dcc0210200cfade56aa82d80fbcc98d31d39ffd19fc5eaa55edc231e57f  Vvu-Decision-Ledger-20260901.sql" | sha256sum -c -
echo "✅ Design Freeze Level 1 - 19 files verified - Hash is Proof"
