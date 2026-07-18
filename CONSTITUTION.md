# VVU – Constitution v1.0.0

*Effective upon approval and version tagging. Subsequent revisions SHALL be versioned and preserve a complete amendment history.*

---

## Preamble

This Constitution establishes the immutable principles, architectural boundaries, security requirements, commercial foundations, and governance processes for the VVU platform (ProofBridge Liner, Ubuntu Pools, Trust Runtime, AIR Kernel Terminal).

It supersedes all previous architectural documents and serves as the authoritative baseline for engineering, compliance, commercial, and strategic decisions.

Any deviation from or change to this Constitution must follow the **Amendment Process** defined in Part 9.

---

## Part 0 – Constitutional Invariants (CI‑001‑010)

These invariants are **non‑negotiable** and shall be enforced by both process and, where feasible, automated checks.

| ID | Invariant |
|----|-----------|
| **CI‑001** | Ubuntu Pools **never** performs settlement logic. |
| **CI‑002** | The Trust Runtime is the **only** authority permitted to move value, sign proofs, or verify attestations. |
| **CI‑003** | Evidence records are **immutable**; status is always a **projection** over an append‑only event log. |
| **CI‑004** | All mutable state is derived from events – no mutable status columns in core tables. |
| **CI‑005** | AIR Kernel Terminal **never** depends on settlement infrastructure; it is a pure SaaS product with no ZAR rail dependency. |
| **CI‑006** | Identity (authentication) never implies authorization – every operation is independently authorized per request. |
| **CI‑007** | Policy (human‑readable rules) precedes implementation; code must trace back to a documented policy decision. |
| **CI‑008** | Every material decision must be auditable – the full reasoning chain (evidence, gates, parameters, operator) must be reconstructible. |
| **CI‑009** | Every API endpoint belongs to exactly one product surface and one product’s API namespace. |
| **CI‑010** | Unknown states (unexpected gate failures, missing evidence, invalid operator context) must result in a **fail‑closed** response (trip, halt, or escalate). |

---

## Part 1 – Architecture

### 1.1 The Three Surfaces

| Surface | Audience | Owns | Delegates to |
|---------|----------|------|--------------|
| **Ubuntu Pools Dashboard** | Stokvel members, admins | Social, governance, contribution claims | Trust Runtime for all settlement (CI‑001) |
| **VVU Trust Runtime Dashboard** | Compliance users, escrow counterparties, machine clients | KernelState, ZK proofs, attestations, value movement (CI‑002) | – |
| **AIR Kernel Terminal** | Subscribers/orgs evaluating architecture decisions | Constitutional rules, capability registry, knowledge graph | – (CI‑005) |

**Enforcement:** No feature may belong to more than one surface. (CI‑009)

### 1.2 Six Bounded Contexts

```
Application Surfaces
         │
         ▼
  Trust Runtime Kernel   ← the only thing that touches value/proofs (CI‑002)
  (Gateway, Policy Engine, Decision Engine, Evidence Engine, Settlement Engine)
         │
         ▼
    Shared Platform       ← used by all three surfaces; owned by none
  (Identity, Events, Telemetry, Cryptography, Storage Interfaces, Config)
         │
         ▼
    Infrastructure        ← swappable (PostgreSQL, Object Storage, etc.)
         │
         ▼
    Governance            ← describes the system (ADRs, RFCs, knowledge graph)
```

**Authority:** ADR‑004 (three‑surface split), ADR‑001 (event sourcing), ADR‑008 (two‑graph separation).

### 1.3 Core Data Model (Locked)

- `evidence_records` – immutable; no status column.
- `evidence_events` – append‑only; event types: `created | referenced | expired | deletion_proof_generated | archived`.
- `decisions` – immutable outcome, threshold, parameter version, operator context.
- `pools`, `pool_members`, `pool_contributions` – claims only; settlement truth held in Trust Runtime.
- `subscriptions` – product tier, billing cycle, external reference.

**Authority:** ADR‑003, ADR‑006 (no status columns).

### 1.4 API Contracts (Product‑Specific)

| Product | Namespace | Endpoints |
|---------|-----------|-----------|
| **Trust Runtime** | `/api/trust/*` | `POST /attest`, `GET /verify/:id`, `POST /decide`, `GET /kernel-state/:id`, `POST /settle` |
| **Ubuntu Pools** | `/api/pools/*` | `POST /pools`, `POST /:id/join`, `POST /:id/contribute` (→ calls `trust/settle`), `GET /:id/ledger`, `POST /:id/governance/vote` |
| **AIR Kernel** | `/api/air/*` | `GET /capabilities`, `POST /rules/validate`, `GET /graph/query`, `POST /rules` (Team+ only) |

**Authority:** ADR‑007.  
**Gap:** SEC‑013 enforcement (contract‑drift detection) – to be implemented post‑gate (see Part 9).

---

## Part 2 – Security Specification (SEC‑001‑015)

These are **normative** requirements.

| ID | Requirement |
|----|-------------|
| **SEC‑001** | Zero Trust Runtime – no request trusted by network location or prior auth. |
| **SEC‑002** | Identity & Session – frontend holds no security authority; authorization lives exclusively in Trust Runtime. |
| **SEC‑003** | Request Validation – receive → canonicalise → validate → authorise → execute. |
| **SEC‑004** | Canonicalisation – normalise (Unicode, URL, path encoding) before validation. |
| **SEC‑005** | Runtime Authorisation – evaluated per request/operation/resource. |
| **SEC‑006** | Outbound Network Policy – no arbitrary outbound connections; destinations from approved registry. |
| **SEC‑007** | Transaction Invariants – state mutations preserve defined invariants; violation halts execution. |
| **SEC‑008** | Event Integrity – append‑only events are the system of record; mutable state is a projection. |
| **SEC‑009** | Idempotency – every externally initiated mutation is idempotent. |
| **SEC‑010** | Sensitive Data – protected per classification; no single algorithm prescribed. |
| **SEC‑011** | Observability – security events produce structured telemetry (actor, resource, decision, timestamp, correlation ID). |
| **SEC‑012** | Secrets – never in source control; rotate, expire, externally managed. |
| **SEC‑013** | API Governance – public APIs originate from an approved contract; build fails on undocumented/deprecated/unauthorised endpoint drift. |
| **SEC‑014** | Trust Boundaries – explicit boundary chain: Internet → Application → Trust Runtime → Settlement → Cryptographic Services → Infrastructure. |
| **SEC‑015** | Business Rule Enforcement – business rules execute in the trusted runtime only; clients never determine workflow progression. |

**Verification status:** See Part 8 (Operational Verification).

---

## Part 3 – Evidence Lifecycle Model

```
Evidence Created
      ↓
Evidence Referenced
      ↓
Evidence Expired
      ↓
Deletion Proof Generated
      ↓
Archive Recorded
```

- Evidence records are immutable (CI‑003).  
- Status is derived from event history (CI‑004).  
- Upon expiry, a **Proof‑of‑Deletion** certificate (signed by Trust Runtime) is stored indefinitely, linking to all decisions that used the evidence – ensuring auditability (CI‑008).

**Authority:** ADR‑003, ADR‑008.

---

## Part 4 – Operational Model (Two Graphs)

| | Operational Decision Graph | Architecture Knowledge Graph |
|---|---------------------------|------------------------------|
| Purpose | Runtime execution | Engineering governance |
| Lives in | Trust Runtime Kernel | Governance layer |
| Storage | Optimised for latency | Optimised for documentation/search |
| Consumers | Kernel, Audit, Runtime | Developers, AIR, Compliance |
| Lifecycle | Grows with every decision | Grows with every ADR/RFC |

**They are separate** and must not be merged. (ADR‑004)

---

## Part 5 – Commercial Model

### 5.1 Market Grounding (EVID‑001 to EVID‑003)

| Claim | Reference |
|-------|-----------|
| R50 billion annual stokvel market | Ipsos South Africa, *National Stokvel Survey 2024* (EVID‑001) |
| 800,000+ active stokvels | Moneyweb, *Stokvel sector in numbers*, January 2025 (EVID‑002) |
| 11 million members, R1,214 avg monthly contribution | IOL Business, *SA stokvels: R50bn industry*, 2025 (EVID‑003) |

### 5.2 Ubuntu Pools Pricing

- **Admin fee:** R15/member/month (≈1.2% of avg contribution) – billed to pool.  
- **No fee on savings.**  
- **Settlement pass‑through:** Stitch InstantEFT cost at cost, itemised.

### 5.3 Trust Runtime Pricing

- **Attestation:** R25 per (≤500/mo); R15 above 500/mo.  
- **Escrow:** 35 bps (3‑of‑5), 50 bps (5‑of‑7).  
- Usage‑metered, invoiced monthly.

### 5.4 AIR Kernel Terminal Pricing

| Tier | Price (monthly) | Included |
|------|----------------|----------|
| Observer | Free | Read‑only graph browsing |
| Team | R2,500 (~$140) per org | Full rule authoring, CI/CD gate, single‑org graph |
| Enterprise | Starting R25,000 (~$1,400) | Custom rule modules, multi‑org federation, SLA |

**Authority:** ADR‑009 (commercial model), ADR‑010 (rollout order).

### 5.5 Rollout Order

1. AIR Kernel Terminal – pure SaaS, no ZAR dependency (fastest to revenue).  
2. Ubuntu Pools – gated on Stitch production‑hardening.  
3. Trust Runtime – metered billing, parallel after HF‑001 closes.

---

## Part 6 – Governance Hierarchy

```
Constitution (this document)
        │
        ▼
MASTER_SPEC.md – thin specification (references Constitution)
        │
        ▼
ADR/ – architectural decisions (numbered, rationale)
        │
        ▼
RFC/ – proposals for interface‑affecting changes (opened when needed)
        │
        ▼
EXECUTION_PLAN.md – gated rollout (Part 9 expanded)
        │
        ▼
VERIFICATION.md – continuously updated verification status (EVID references)
```

**Authority:** This Constitution is the root; all lower documents must align with it.

---

## Part 7 – Verification (Operational Reality)

Verification is **point‑in‑time** but shall be maintained in `VERIFICATION.md` with EVID references. As of v1.0.0:

| Item | Status | Evidence (EVID) |
|------|--------|-----------------|
| Repository topology matches spec | ✅ | EVID‑010 (verified 2026‑07‑18) |
| Test suite: 334/334 passing | ✅ | EVID‑011 (commit e92284d, `turbo run build && vitest run`) |
| GovernanceAnchor.sol present, fail‑closed | ✅ | EVID‑012 (code review + deploy script self‑check) |
| ZK proof → on‑chain verification wired | ✅ | EVID‑013 (route calls `isAnchoredValid()`) |
| `threshold.circom` structurally sound | ✅ | EVID‑014 (code review, no division) |
| Bayesian thresholds: calibration scripts exist | ✅ | EVID‑015 (scripts present; run not independently verified) |
| TEE attestation (HF‑001) | ✅ Closed | EVID‑016 – Explicit downgrade to software-attested (ADR-009) |
| Stale doc references (`MEMORY.md`) | ✅ Fixed | EVID‑017 – References updated |
| SEC‑013 (contract‑drift detection) | ❌ Gap | EVID‑018 – no build‑time tooling yet |

**HF‑001 closed** – Explicit downgrade to software-attested mode (ADR-009).  
**SEC‑013 gap** to be closed post‑gate (Gate 1).

---

## Part 8 – Execution Plan (Gated)

### Gate 0 – Now → July 30 (Ship‑only)
- **Only objective:** Close HF‑001.  
- ✅ Freeze all new specs, ADRs, RFCs, code restructuring.  
- ✅ Apply the three cheap corrections (immutable evidence already; split graph documentation; remove stale doc references).  
- No new packages, no repo restructuring.

### Gate 1 – Weeks 1–4 Post‑Gate
- ✅ Adopt **four‑question PR gate**:  
  1. Which section of this Constitution does it implement?  
  2. Which ADR does it satisfy?  
  3. Which RFC defines the interface?  
  4. Which test proves compliance?  
- ✅ Write `MASTER_SPEC.md` thin.  
- ✅ Write **5–8 real ADRs** for decisions already made.  
- Close SEC‑013 gap – add build‑time contract‑drift check.  
- Rename `app/` → `apps/web/` (cosmetic).

### Gate 2 – Weeks 4–12 (Trigger‑based)
- Compliance docs → only when FSCA CASP registration starts.  
- Investor docs → only for actual scheduled conversations.  
- RFC library → only when a second engineer or external partner exists.

### Knowledge Graph Evolution (Post‑Gate 0, long‑term)
- Weeks 1–2: Design & learning.  
- Week 3: Node extraction.  
- Week 4: Link wiring + query API.  
- Week 5: Shadow migration & cutover.  
- Week 6: Compliance verification & scale testing.

---

## Part 9 – Amendment Process

Any change to any normative section (Parts 0–8) requires:

1. **ADR** – documenting the problem, rationale, and impact.  
2. **RFC** – if the change affects external interfaces (API, data model, or security guarantees).  
3. **Review** – by at least two technical leads (or one lead + one external reviewer).  
4. **Approval** – by the project’s governance body (currently the founder; future, a technical steering committee).  

Changes to commercial model (Part 5) also require a market‑data update and a documented business case.

**No direct modification** of constitutional sections is permitted outside this process. Amendments are tracked by incrementing the version number (e.g., v1.0.1, v1.1.0, v2.0.0) and preserving a complete history of amendments in `CHANGELOG.md`.

---

## Part 10 – Future Automation

While not required for v1.0.0, the intent is to evolve the verification and enforcement of this Constitution into automated tooling:

- CI checks against Constitutional Invariants.  
- PR gate enforces ADR/RFC/Test references.  
- Automated verification of operational claims (test counts, coverage, etc.).  
- Automated generation of EVID references from CI runs.

This will transition governance from documentation to evidence‑based enforcement.

---

## Sign‑off & Version

| Version | Date | Author | Approver | Changes |
|---------|------|--------|----------|---------|
| v1.0.0  | 2026‑07‑18 | VVU Engineering | Founder | Initial constitution |

**This Constitution is authoritative upon approval and version tagging. All subsequent work must conform to its provisions unless amended through the process defined in Part 9.**

---

**End of Constitution.**