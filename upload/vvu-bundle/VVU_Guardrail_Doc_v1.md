# VVU Guardrail Doc – Agentic Marketing & Physical Verification
**Version:** 1.0 | **Release:** 20260901 | **Status:** ACTIVE | **Owner:** CMO
**Signed:** Founder, CFO, JSE Sponsor Observer
**Alignment:** POPIA, Companies Act s15(7), Five-Conjunct Theorem

## 1. OBJECTIVES - What is Good?
- Primary: Optimize for COMPARISON, not checkout, until Decision Ledger proves checkout ROAS > comparison ROAS for 14 consecutive days
- Secondary: 100% Proof of Work - every agent action must have SHA-256 + tx hash + Z3 result
- Anti-Objective: Never optimize for vanity - impressions, clicks, followers, dashboard theatre

## 2. CONSTRAINTS - Hard Lines Agents CANNOT Break
- Budget: Max shift 15% per day per agent, Max 30% per week. Ceiling R50k/mo until Gate 3B certified. Contingency 10% untouched.
- Data: Agents may NOT touch PII. POPIA Section 19 - only anonymized telemetry, PIM attributes, hashed CIPC data. No raw ID numbers on-chain, only hashes.
- Audience: Forbidden - Competitor staff, existing customers for prospecting, <18yrs, mine procurement blacklist
- Brand Safety: No claims of "100% safe", "certified", "guaranteed". Use M0 Doctrine: "Hash satisfies constraint, Z3 TRUE, verify at tx"
- Physical: APU temp >85°C OR hydraulic invariant breach = immediate FAIL_CLOSED, stop all marketing claims until STEADY_STATE_LOCKED 72h

## 3. GUARDRAILS - Behavior Under Uncertainty
- Escalate to human if: CPA spike >20%, 3 failed TOTP verifications, hash mismatch, Z3 returns FALSE, churn >40%
- Auto-proceed if: Bid change <15%, comparison Q&A confidence >0.85, telemetry within invariant, five_conjunct_pass TRUE
- Creative Approval: Human must approve all externally facing copy. Agent generates, human publishes via Glass Box Wrapper.
- Kill Switch: Founder can revoke any agent scoped identity via `vvu-ssh-setup` + on-chain `revokeAgent()` in <60s. Log revocation to decision_ledger.

## 4. IDENTITY - Who is Who?
- Each agent = separate ED25519 key, separate wallet, separate RLS role
- No shared credentials - per VentureBeat Pulse 70% of incidents are shared creds
- Agent list: spotter_agent, librarian_agent, closer_agent, qualifier_agent, farmer_agent
- Authorized wallets tracked in `agent_identities` and `VVUIVELedger.authorizedAgents`

## 5. PROOF OF WORK - Receipts
- Every action -> decision_ledger -> SHA-256 -> VVUIVELedger.sol via zoo_step_verifier.py
- Daily Check: `vvu-hash-verifier-v3-20260901.sh` must pass 16-file integrity
- Customer Verification Flow: Send tx hash, not PDF. Customer calls `verifyEvidence(fileHash)` on-chain.

## 6. DECISION AUTHORITY
- Humans: Define objectives, constraints, kill switches, comparison questions, MQL in dollars
- Agents: Execute within constraints, produce receipts, fail-closed on anomaly
- Quote: "Humans have to be the conductor and AI is the orchestra" - Jamie Domenici, Klaviyo CMO
