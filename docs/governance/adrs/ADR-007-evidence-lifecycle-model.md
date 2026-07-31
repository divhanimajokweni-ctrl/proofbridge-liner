---
id: ADR-007
title: Evidence Lifecycle Model
author: VVU Engineering
 reviewers: Drake (OpenCode), Sentinel (OpenCode)
 approver: Constitutional Council
 implementation_owner: Josh (OpenCode)
 verification_owner: Evidence Office
 status: Accepted
 date: "2026-07-18"
---

# Context

Evidence records in a trust-critical system must be:

- Immutable (cannot be altered after creation)
- Fully auditable (complete history of changes)
- Verifiable (cryptographic proof of integrity)
- Compliant with data retention regulations

Traditional mutable status columns violate these requirements by allowing silent modification of historical records.

# Decision

Adopt an **Evidence Lifecycle Model** where:

1. Evidence records are immutable (no status column)
2. Status is derived from an append-only event log
3. Evidence follows a defined lifecycle: Created → Referenced → Expired → Deletion Proof Generated → Archive Recorded
4. Proof-of-Deletion certificates are stored indefinitely

**Constitution Reference:** Part 3, CI-003, CI-004

# Consequences

**Positive:**
- Complete audit trail
- Cryptographic integrity verification
- Compliance with data retention regulations
- Natural fit for event sourcing
- Deterministic replay for verification

**Negative:**
- Increased storage requirements
- Complex query patterns for current state
- Requires event log management
- Proof-of-Deletion certificate management

# Compliance

This decision implements:
- **CI-003** – Evidence records are immutable
- **CI-004** – Mutable state derived from events
- **CI-008** – Every material decision is auditable
- **Part 3** – Evidence Lifecycle Model

# Verification

Evidence Office will verify:
- No status columns exist in evidence_records table
- All state changes are captured as events
- Evidence lifecycle follows defined stages
- Proof-of-Deletion certificates are generated and stored
- Audit trail is complete and verifiable

# Implementation Plan

- Event journal: `packages/trust-runtime/src/event-journal.ts`
- Event store: `src/lib/trust-runtime/event-store.ts`
- Evidence records: `packages/trust-types/`
- Proof-of-Deletion: `packages/trust-crypto/src/receipts.ts`
