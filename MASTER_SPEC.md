# VVU Platform – Master Specification

*Version: 1.0.0 | Effective: 2026-07-18 | Authority: Constitution v1.0.0*

---

## Purpose

This document is the **thin specification** for the VVU platform. It references the authoritative Constitution and provides implementation pointers. All normative requirements originate from the Constitution; this document adds no new constraints.

---

## 1. Constitutional Authority

The **VVU Constitution v1.0.0** (`CONSTITUTION.md`) is the root of all governance. All engineering, compliance, commercial, and strategic decisions must conform to its provisions unless amended through the process defined in Part 9.

**Constitution Reference:** [CONSTITUTION.md](./CONSTITUTION.md)

---

## 2. Product Surfaces

| Surface | Implementation | Constitution Reference |
|---------|---------------|----------------------|
| **Ubuntu Pools Dashboard** | `app/pools/` | Part 1.1, CI-001 |
| **VVU Trust Runtime Dashboard** | `app/trust-runtime/` | Part 1.1, CI-002 |
| **AIR Kernel Terminal** | `air/` | Part 1.1, CI-005 |

**Enforcement:** Each API endpoint belongs to exactly one surface (CI-009). See [Part 1.4 – API Contracts](./CONSTITUTION.md#14-api-contracts-product-specific) for namespace definitions.

---

## 3. Bounded Contexts

| Context | Implementation | Constitution Reference |
|---------|---------------|----------------------|
| **Trust Runtime Kernel** | `packages/trust-runtime/`, `src/lib/trust-runtime/` | Part 1.2, CI-002 |
| **Shared Platform** | `packages/trust-types/`, `packages/trust-crypto/`, `packages/trust-events/` | Part 1.2 |
| **Infrastructure** | `supabase/`, `contracts/`, `config/` | Part 1.2 |
| **Governance** | `docs/governance/`, `air/adr/` | Part 1.2, Part 4 |

---

## 4. Core Data Model

| Entity | Location | Constitution Reference |
|--------|----------|----------------------|
| **Evidence Records** | `packages/trust-runtime/src/event-journal.ts` | Part 1.3, CI-003, CI-004 |
| **Evidence Events** | `src/lib/trust-runtime/event-store.ts` | Part 1.3, CI-003 |
| **Decisions** | `packages/trust-runtime/src/risk-engine.ts` | Part 1.3 |
| **Pool Entities** | `app/api/pools/` | Part 1.3, CI-001 |

---

## 5. Security Requirements

All security requirements are **normative** and defined in Part 2 of the Constitution. Implementation must satisfy:

- **SEC-001 to SEC-015** – See [Part 2 – Security Specification](./CONSTITUTION.md#part-2--security-specification-sec-001-015)
- **Zero Trust Runtime** – No request trusted by network location (SEC-001)
- **Fail-Closed** – Unknown states result in trip, halt, or escalate (CI-010)

---

## 6. Evidence Lifecycle

Evidence follows the immutable lifecycle defined in Part 3:

```
Created → Referenced → Expired → Deletion Proof Generated → Archive Recorded
```

**Implementation:** `packages/trust-runtime/src/event-journal.ts`, `src/lib/trust-runtime/event-store.ts`

**Authority:** ADR-003 (event sourcing), ADR-006 (no status columns)

---

## 7. Commercial Model

| Product | Pricing | Constitution Reference |
|---------|---------|----------------------|
| **Ubuntu Pools** | R15/member/month admin fee | Part 5.2 |
| **Trust Runtime** | R25/attestation, 35-50 bps escrow | Part 5.3 |
| **AIR Kernel** | Free / R2,500 / R25,000 tiers | Part 5.4 |

**Market Evidence:** EVID-001 to EVID-003 (Part 5.1)

---

## 8. Rollout Order

1. **AIR Kernel Terminal** – Pure SaaS, no ZAR dependency (Part 5.5)
2. **Ubuntu Pools** – Gated on Stitch production-hardening
3. **Trust Runtime** – Metered billing, parallel after HF-001 closes

---

## 9. Governance Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| **Constitution** | `CONSTITUTION.md` | Root authority |
| **MASTER_SPEC.md** | This file | Thin specification (references Constitution) |
| **ADRs** | `docs/governance/adrs/`, `air/adr/` | Architectural decisions |
| **RFCs** | `docs/governance/rfcs/` | Interface-affecting proposals |
| **VERIFICATION.md** | `VERIFICATION.md` | Operational verification status |
| **CHANGELOG.md** | `CHANGELOG.md` | Amendment history |

---

## 10. Verification Status

See [VERIFICATION.md](./VERIFICATION.md) for point-in-time operational verification with EVID references.

---

## 11. Amendment Process

Any change to normative sections requires:

1. **ADR** – documenting problem, rationale, and impact
2. **RFC** – if affecting external interfaces
3. **Review** – by at least two technical leads
4. **Approval** – by governance body

See [Part 9 – Amendment Process](./CONSTITUTION.md#part-9--amendment-process) for full details.

---

## 12. Implementation Pointers

| Component | Primary Files | Tests |
|-----------|--------------|-------|
| Trust Runtime Kernel | `packages/trust-runtime/src/` | `packages/trust-runtime/__tests__/` |
| Extended Runtime | `src/lib/trust-runtime/` | `src/lib/trust-runtime/__tests__/` |
| Trust API | `packages/trust-api/src/` | `packages/trust-api/__tests__/` |
| Trust Crypto | `packages/trust-crypto/src/` | `packages/trust-crypto/__tests__/` |
| AIR Pipeline | `air/pipeline/` | `air/run-pipeline.sh` |
| Ubuntu Pools | `app/pools/`, `app/api/pools/` | – |
| Smart Contracts | `contracts/` | `contracts/__tests__/`, `test/` |

---

**This MASTER_SPEC.md is authoritative upon approval. It adds no normative content beyond referencing the Constitution.**

---

*Version: 1.0.0 | Approved: 2026-07-18 | Authority: Constitution v1.0.0*