# HARD FAILURES DETAIL — ACTIVE STATE

Last updated: 2026-07-05T23:30:00Z
Updated by: SDD Investigator (post-Investigation Phase)

---

## HF-1: TEE Attestation — Hardware Security Module

**Status: OPEN**

**Evidence:**
- `src/gateway/projections/read_model.py` reports `"TEE Attestation": {"status": "SW-MODE", "ok": null}`
- System is running in software mode, not hardware attestation
- No hardware security module (HSM) or TEE environment is configured

**Required for PASS:**
- Hardware-backed attestation must return `ok: true` with a valid TEE quote
- SafeKrypte must verify attestation before issuing credentials

---

## HF-2: (Reserved for future finding)

**Status: NOT_ASSESSED**

---

## HF-3: GovernanceAnchor.sol — Smart Contract Source

**Status: OPEN**

**Evidence:**
- No `GovernanceAnchor.sol` file exists under `contracts/` or anywhere in the repository
- A bare address (`0x770342c49e1F4710E0Eed605dCe41e7f3F7600Eb`) is hardcoded in `app/api/webhooks/stitch/route.ts`
- There is no source code to verify that the deployed bytecode matches the ABI the webhook calls
- The contract is an external dependency with no verifiable provenance in this repo

**Required for PASS:**
- Either: Add `GovernanceAnchor.sol` source to `contracts/` with verified compilation output
- Or: Document the contract as an external/pre-deployed dependency with linked verification (e.g., Polygonscan)

---

## HF-4: Compliance Gate Self-Approval (Process Finding)

**Status: PASSED (post-remediation)**

**Evidence:**
- Previous `active/PLAN.md` and `active/VALIDATION.md` were auto-approved via `--headless` mode without human/Mino review
- This violated the SDD requirement that "Implementation MUST NOT start without APPROVED signature"
- **Remediation applied:** All new changes in this session follow proper SDD flow with explicit approval gates

---

## HF-5: Hardcoded Secret Fallbacks (Security Finding)

**Status: PASSED (post-remediation)**

**Evidence:**
- `src/middleware.ts` had `process.env.VVU_JWT_SECRET || 'vvu_brain_absolute_cryptographic_signing_key_vector'`
- `src/middleware.ts` had `process.env.VVU_SESSION_SECRET || ''` (empty string fallback)
- `lib/HmacSecurityGuard.js` had `process.env.INTERCOM_TOKEN || 'fallback_secure_intercom_token_hash_2026'`
- **Remediation applied:** All three now fail closed — no fallbacks, explicit `if (!secret) return null` / `if (!SECRET_TOKEN) throw` guards
