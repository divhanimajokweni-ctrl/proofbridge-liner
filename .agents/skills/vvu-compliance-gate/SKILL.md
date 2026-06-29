---
name: vvu-compliance-gate
description: "What Would The Compliance Gate Say. Load before any Tier-3 change touching ProofBridge Liner, SafeKrypte, Ubuntu Data Bus, GovernanceAnchor.sol, ED25519 VCT governance, CircuitBreaker, or HMAC webhooks. Encodes the 18 audit findings and 5 hard-failure release blockers from the ProofBridge compliance-fabric v2 audit. Functions as Lindiwe's behavioral quality reviewer — analogous to a QA engineer opening the product and walking real flows before a PR merges. Do not skip for changes that look small. The 30-commit main-branch incident started with a change that looked small."
---

## VVU COMPLIANCE GATE — FULL RULE SET

### HARD FAILURES (HF-1 through HF-5 — RELEASE BLOCKERS — MERGE DENIED UNTIL RESOLVED)

HF-1  TEE ATTESTATION
  Finding     : TEE is a JavaScript config flag, not real hardware attestation
  Gate        : No production deployment until hardware TEE is verified and attested
  Verify      : grep -r "teeMode\|attestation\|SW-MODE" src/ → must show hardware path
  Resolution  : Replace config flag with actual TEE SDK call + attestation receipt
  Status      : OPEN

HF-2  ZK PROOF ON-CHAIN VERIFICATION
  Finding     : ZK proofs are asserted as valid, not verified by on-chain verifier contract
  Gate        : GovernanceAnchor.sol must call a deployed ZK verifier contract per credential
  Verify      : Read GovernanceAnchor.sol → confirm verifyProof() call with contract address
  Resolution  : Deploy ZK verifier contract, wire GovernanceAnchor.sol to call it
  Status      : OPEN

HF-3  GOVERNANCEANCHOR.SOL DEPLOYMENT
  Finding     : GovernanceAnchor.sol has no deployed address on Polygon Amoy
  Gate        : Contract must be deployed and address registered in config before any VC is issued
  Verify      : Check deployment registry for GovernanceAnchor — must have 0x address
  Resolution  : Deploy, record address in compliance-fabric config, verify with etherscan
  Status      : OPEN

HF-4  HMAC HASH DOMAIN COLLISION
  Finding     : Webhook HMAC and VCT HMAC share the same key namespace — collision risk
  Gate        : Domain-separated HMAC keys required before any new webhook endpoint is added
  Verify      : Check HMAC key derivation — must include domain prefix ("webhook:" vs "vct:")
  Resolution  : Add domain prefix to all HMAC key derivation functions; rotate existing keys
  Status      : OPEN

HF-5  BETA-BINOMIAL CALIBRATION
  Finding     : Bayesian prior calibrated on n=47 historical Deeds Registry failure cases
  Gate        : Minimum n=200 cases required for prior to be considered calibrated for prod
  Verify      : Count entries in calibration dataset → must be ≥200
  Resolution  : Collect additional cases or document explicit uncertainty bounds in output
  Status      : OPEN

### BRANCH GATE
Rule    : Tier-3 changes must be on compliance-fabric branch
Check   : git branch --show-current → must return "compliance-fabric"
Incident: 30+ commits pushed to main on prior session — this gate exists because of that
On fail : BLOCK. Do not force-push main. Create compliance-fabric if absent, cherry-pick.

### BEHAVIORAL COVERAGE GATE
Each flow must be exercised in a real environment before PR, not only unit-tested:
  □ VC issuance : credential issued → GovernanceAnchor anchored → independently verifiable
  □ Halt        : trigger → throughput measured to drop → audit log entry confirmed
  □ Webhook     : event in → HMAC validated with domain-separated key → NATS event confirmed
  □ SafeKrypte  : key request → threshold count satisfied → escrow state updated in DB
  □ Ubuntu Pools: contribution → Stitch InstantEFT webhook → on-chain receipt hash confirmed

### VALIDATION OUTPUT FORMAT
Generate active/VALIDATION.md with exactly this structure:

# VVU VALIDATION — [ISO-DATE]
## Component: [affected component name]
## PR Branch: [must be compliance-fabric for Tier-3]
## Plan Reference: active/PLAN.md approved [DATE]

### Hard Failure Status
- HF-1 TEE:          [OPEN | RESOLVED — evidence: file:line]
- HF-2 ZK:           [OPEN | RESOLVED — evidence: contract:function]
- HF-3 Anchor:       [OPEN | RESOLVED — evidence: 0x address + block]
- HF-4 HMAC:         [OPEN | RESOLVED — evidence: key derivation diff]
- HF-5 Calibration:  [OPEN | RESOLVED — evidence: dataset count=N]

### Gates
- Branch gate:             [PASS | BLOCK — current: X, required: compliance-fabric]
- Behavioral coverage:     [PASS | PARTIAL — missing: list flows not tested]
- Trace chain:             [COMPLETE | INCOMPLETE — missing link: X→Y]

## RESULT: [PASS | BLOCK]
## BLOCK REASON: [specific finding with file and line reference — never vague]
