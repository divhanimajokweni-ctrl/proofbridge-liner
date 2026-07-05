# PROOFBRIDGE AUDIT FINDINGS — ACTIVE STATE

Last updated: 2026-07-05T23:30:00Z
Updated by: SDD Investigator

## Summary

| Finding | Severity | Status | Remediation |
|---------|----------|--------|-------------|
| HF-1: TEE Attestation | Critical | OPEN | Requires hardware-backed TEE environment |
| HF-3: GovernanceAnchor.sol | High | OPEN | Contract source missing from repo |
| HF-4: Compliance Gate Self-Approval | Medium | PASSED | Process fixed — SDD flow enforced |
| HF-5: Hardcoded Secret Fallbacks | Critical | PASSED | Fail-closed guards applied |

## Open Items

1. **HF-1 (TEE Attestation):** 18 audit findings reference hardware attestation requirements. System runs in SW-MODE only. Blocking for production deployment.
2. **HF-3 (GovernanceAnchor.sol):** No source contract in repo. Address `0x770342c49e1F4710E0Eed605dCe41e7f3F7600Eb` hardcoded in stitch webhook. Must either add source or document external dependency.

## Resolved Items

1. **HF-5 (Hardcoded Secrets):** Three instances of hardcoded credential fallbacks removed from `src/middleware.ts` and `lib/HmacSecurityGuard.js`. All paths now fail closed.
2. **HF-4 (Self-Approval):** SDD process compliance restored. All future plans go through proper Mino review gate.
