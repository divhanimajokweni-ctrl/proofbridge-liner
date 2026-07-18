---
id: ADR-004
title: Three-Surface Architecture
author: VVU Engineering
 reviewers: Drake (OpenCode), Sentinel (OpenCode)
 approver: Constitutional Council
 implementation_owner: Josh (OpenCode)
 verification_owner: Evidence Office
 status: Accepted
 date: "2026-07-18"
---

# Context

VVU platform serves three distinct audiences with different security requirements, data access patterns, and operational models:

1. **Ubuntu Pools** – Social/governance platform for stokvel members
2. **Trust Runtime** – Settlement and verification for compliance users and machine clients
3. **AIR Kernel Terminal** – Architecture decision support for subscribers

Combining these into a single surface would violate the principle of least privilege, create unnecessary coupling, and make independent evolution impossible.

# Decision

Adopt a **three-surface architecture** where each surface has its own:

- Audience and purpose
- Data ownership and access patterns
- API namespace (`/api/trust/*`, `/api/pools/*`, `/api/air/*`)
- Deployment and scaling characteristics

**Constitution Reference:** Part 1.1, CI-009

# Consequences

**Positive:**
- Clear separation of concerns
- Independent scaling and deployment
- Audience-appropriate security models
- Reduced blast radius for failures
- Clear API governance (CI-009)

**Negative:**
- Increased operational complexity
- Cross-surface communication requirements
- Multiple deployment pipelines
- Documentation overhead

# Compliance

This decision implements:
- **CI-009** – Every API endpoint belongs to exactly one surface
- **Part 1.1** – Three-surface split
- **Part 1.4** – Product-specific API contracts

# Verification

Evidence Office will verify:
- Each API endpoint is registered in exactly one surface namespace
- No shared state between surfaces except through Trust Runtime
- Audience-appropriate access controls per surface
- Independent deployment capability

# Implementation Plan

- Ubuntu Pools: `app/pools/`, `app/api/pools/`
- Trust Runtime: `app/trust-runtime/`, `app/api/trust/`
- AIR Kernel: `air/`, `app/api/air/`
