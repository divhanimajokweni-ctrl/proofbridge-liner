---
id: ADR-001
title: Use Event Sourcing for State Management
author: KiloCode (Eddy)
reviewers: Drake (OpenCode), Sentinel (OpenCode)
approver: Constitutional Council
implementation_owner: Josh (OpenCode)
verification_owner: Evidence Office
status: Accepted
date: "2026-06-01"
---

# Context

VVU Colony requires a state management approach that provides:
- Complete audit trail of all state changes
- Deterministic replay for verification
- Immutable history for trust verification
- Multi-tenant isolation
- Schema evolution without data loss

Traditional CRUD databases do not provide these guarantees. Event Sourcing stores all state changes as an immutable sequence of events, enabling full replay and verification.

# Decision

Adopt Event Sourcing as the primary state management pattern for VVU Colony.

All state changes are captured as immutable events in an append-only event store. Current state is derived by replaying events through pure reducers.

# Consequences

**Positive:**
- Complete audit trail (every state change is an event)
- Deterministic replay (events + pure reducers = identical state)
- Natural fit for trust verification (events are evidence)
- Schema evolution via upcasters
- Multi-tenancy via tenantId isolation

**Negative:**
- Increased complexity vs. CRUD
- Eventual consistency for projections
- Requires discipline in event design
- Snapshot management overhead

# Compliance

This decision is foundational to X₀:
- Events are immutable (X₀ invariant)
- Reducers are pure (X₀ invariant)
- Replay produces identical state (X₀ invariant)
- Hash chain integrity (X₀ invariant)

# Verification

Evidence Office will verify:
- Event append produces correct hash chain
- Replay from events produces identical projection state
- Multi-tenant isolation is maintained
- Schema versioning works correctly

# Implementation Plan

Josh (ENG-002) owns implementation:
- Event store repository (packages/trust-events/)
- Projection manager (packages/trust-projections/)
- Runtime engine (packages/trust-runtime/)
- Test coverage via vitest suites
