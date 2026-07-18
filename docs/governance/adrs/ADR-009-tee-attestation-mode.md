---
id: ADR-009
title: TEE Attestation Mode Decision
author: VVU Engineering
 reviewers: Drake (OpenCode), Sentinel (OpenCode)
 approver: Constitutional Council
 implementation_owner: Josh (OpenCode)
 verification_owner: Evidence Office
 status: Accepted
 date: "2026-07-18"
---

# Context

HF-001 requires closure by 2026-07-30: either real TEE integration or explicit downgrade to "software-attested".

**Current State:**
- All three TEE platforms (AMD SEV-SNP, Intel SGX, AWS Nitro) have complete specifications
- Software interfaces are implemented and tested against mock attestations
- No TEE-capable hardware is deployed
- System operates in `TEE_MODE=software-attested`

**Options:**
1. **Deploy TEE hardware** – Requires provisioning AMD SEV-SNP, Intel SGX, or AWS Nitro instances
2. **Explicit downgrade** – Formally downgrade to software-attested mode with documented rationale

# Decision

**Explicit downgrade to software-attested mode** with the following rationale:

1. **Cost**: TEE-capable hardware requires significant infrastructure investment
2. **Complexity**: Multi-platform TEE support adds operational complexity
3. **Risk**: Hardware TEE introduces new attack surfaces and failure modes
4. **Timeline**: Insufficient time before HF-001 deadline (2026-07-30)
5. **Value**: Software attestation provides sufficient security for current use cases

**Constitution Reference:** Part 7, HF-001

# Consequences

**Positive:**
- Clear security posture (software-attested)
- Reduced operational complexity
- Lower infrastructure costs
- Meets HF-001 deadline
- Enables focus on core product features

**Negative:**
- Lower hardware trust guarantee
- May not meet future regulatory requirements
- Requires re-evaluation for high-security use cases
- Technical debt for future TEE integration

# Compliance

This decision implements:
- **HF-001** – Explicit downgrade to software-attested
- **CI-002** – Trust Runtime remains only authority for value/proofs
- **SEC-001** – Zero Trust Runtime maintained

# Verification

Evidence Office will verify:
- `TEE_MODE=software-attested` is the default configuration
- No hardware attestation code paths are active
- Software attestation provides sufficient security guarantees
- Documentation reflects the downgrade decision
- Future TEE integration is planned but not required

# Implementation Plan

1. Update VERIFICATION.md to reflect software-attested mode
2. Document decision in this ADR
3. Update `.env.example` with clear `TEE_MODE=software-attested` default
4. Add warning comments in TEE-related code about software-only mode
5. Plan future TEE integration for high-security use cases

# Future Considerations

- Re-evaluate TEE integration when:
  - Regulatory requirements mandate hardware attestation
  - TEE hardware becomes more accessible
  - Security incidents require hardware-level guarantees
  - High-security use cases emerge (e.g., institutional custody)
