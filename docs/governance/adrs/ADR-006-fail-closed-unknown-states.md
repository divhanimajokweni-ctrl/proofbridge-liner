---
id: ADR-006
title: Fail-Closed Unknown States
author: VVU Engineering
 reviewers: Drake (OpenCode), Sentinel (OpenCode)
 approver: Constitutional Council
 implementation_owner: Josh (OpenCode)
 verification_owner: Evidence Office
 status: Accepted
 date: "2026-07-18"
---

# Context

In a trust-critical system, unknown or unexpected states represent potential security threats. Common approaches include:

- **Fail-open**: Allow operations when uncertain (security risk)
- **Fail-closed**: Block operations when uncertain (availability risk)
- **Escalate**: Log and require human intervention (operational cost)

For a platform handling financial settlements and cryptographic proofs, the cost of a security breach far outweighs the cost of a false positive.

# Decision

Adopt **fail-closed** behavior for unknown states: unexpected gate failures, missing evidence, or invalid operator context must result in a trip, halt, or escalation.

**Constitution Reference:** Part 0, CI-010

# Consequences

**Positive:**
- Security-first approach
- Clear failure modes
- Auditable security decisions
- Reduced attack surface
- Compliance with financial regulations

**Negative:**
- Potential availability impact
- Requires comprehensive error handling
- May require human intervention for edge cases
- Higher operational overhead

# Compliance

This decision implements:
- **CI-010** – Unknown states result in fail-closed response
- **SEC-015** – Business rule enforcement in trusted runtime

# Verification

Evidence Office will verify:
- All unknown states result in trip, halt, or escalation
- No fail-open paths exist for security-critical operations
- Error handling covers all edge cases
- Escalation procedures are documented and tested

# Implementation Plan

- Error handling: `packages/trust-runtime/src/` (all modules)
- Gate enforcement: `packages/trust-api/src/enforce-policy-gate.ts`
- Kill switch: `packages/trust-api/src/kill-switch.ts`
