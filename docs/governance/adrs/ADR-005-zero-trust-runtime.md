---
id: ADR-005
title: Zero Trust Runtime
author: VVU Engineering
 reviewers: Drake (OpenCode), Sentinel (OpenCode)
 approver: Constitutional Council
 implementation_owner: Josh (OpenCode)
 verification_owner: Evidence Office
 status: Accepted
 date: "2026-07-18"
---

# Context

Traditional security models rely on network location or prior authentication to establish trust. This approach is insufficient for a platform handling financial settlements and cryptographic proofs, where:

- Compromised internal services must not be trusted
- Authentication alone does not imply authorization
- Every request must be independently verified

# Decision

Adopt a **Zero Trust Runtime** where no request is trusted by network location or prior auth. Every operation is independently authorized per request.

**Constitution Reference:** Part 2, SEC-001, SEC-002, CI-006

# Consequences

**Positive:**
- Defense in depth
- Reduced lateral movement risk
- Clear authorization boundaries
- Auditable security decisions
- Compliance with financial regulations

**Negative:**
- Increased latency per request
- Complex authorization logic
- Requires comprehensive policy engine
- Higher operational overhead

# Compliance

This decision implements:
- **SEC-001** – Zero Trust Runtime
- **SEC-002** – Frontend holds no security authority
- **CI-006** – Identity never implies authorization

# Verification

Evidence Office will verify:
- Every API request passes through authorization middleware
- No request is trusted based on network location
- Authorization is evaluated per request/operation/resource
- Frontend cannot bypass security controls

# Implementation Plan

- Authorization middleware: `packages/trust-api/src/middleware.ts`
- Policy engine: `packages/trust-runtime/src/risk-engine.ts`
- Request validation: `packages/trust-api/src/enforce-policy-gate.ts`
