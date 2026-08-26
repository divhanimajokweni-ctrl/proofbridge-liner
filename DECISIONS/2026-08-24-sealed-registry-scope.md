# DECISIONS/2026-08-24-sealed-registry-scope.md

**Title:** SealedRegistry Release Boundary Scope Decision
**Owner:** Divhani Majokweni
**Date:** 2026-08-24
**Status:** LOCKED — immutable from 2026-08-24 EOD (Africa/Johannesburg)

---

## DECISION

**SealedRegistry is NOT within the Sept 15 mainnet release boundary.**
**SealedRegistry is a Phase 2 roadmap item, gated behind the VRES1 Sepolia demonstration.**

The "cryptographic governance artifacts" claim in the VRES1 announcement
preamble (Section 6) refers to the zipenc AES-256 folder-encryption pipeline
and the governance artifact *minting workflow* (which is operational in the
IVE dashboard), NOT to the SealedRegistry canonical-serialization primitive.
The SealedRegistry primitive is Phase 2.

---

## RATIONALE

Three reasons, in priority order:

### 1. The honest scope of the VRES1 demonstration is local-anvil only.

The VRES1 demonstration was executed on a local Foundry Anvil node (chain ID
31337). The fraud transaction hash, FraudAttempt event, and L0 provenance
hash are captured in `/download/VRES1_LOCAL_ANVIL_DEMONSTRATION_RECORD.md`.

The Sepolia demonstration — the public-facing proof — could not be executed
because the sandbox does not contain `SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`,
or any Vercel auth token (verified: `vercel whoami` → "Logged out."). That
boundary is owned by the on-call engineer with credentials.

Per the strategic memo's framework (Provable, Auditable, Honest,
Conservative), it would be dishonest to ship SealedRegistry — a primitive
that depends on canonical serialization correctness — without first proving
the simpler CorruptorTarget → Watchdog loop closes on a public testnet.

### 2. Soak test would expose canonicalization variance.

The strategic memo is explicit: the soak test (50K clean transactions, Aug
26 – Sep 6) would expose any canonicalization variance in SealedRegistry
if it were in the Phase 1 boundary. Rather than risk a soak-test failure on
a primitive whose collision-resistance we cannot honestly prove, we defer
the primitive to Phase 2 and proceed with a simpler, deterministic ledger
for Phase 1.

### 3. SealedRegistry claims "cryptographic collision resistance"; this is not provable for our declared domain.

Per the strategic memo's "Three Key Shifts":

> ❌ "This guarantees zero cryptographic collisions"
> ✅ "For our declared domain (null/bool/str/int/list/dict), this produces
>    deterministic encoding"

The second claim is provable. The first is not. SealedRegistry currently
claims the first. We refuse to ship a primitive that makes claims we cannot
defend under third-party audit (Sep 15–22).

---

## IMPLICATIONS

### For Phase 1 (Sept 15 mainnet):

- **Remove SealedRegistry from Gate 4 acceptance criteria.**
- Gate 4 closure proceeds on simpler criteria: ledger reproducibility, no
  SealedRegistry canonicalization involved.
- The soak test (Aug 26 – Sep 6) runs against the simpler ledger.
- Mainnet launch proceeds without cryptographic governance primitive.

### For Phase 2 (Nov – Dec):

- Schedule SealedRegistry design review for Nov 1.
- Implement canonicalization (`sort_keys=True`), schema restriction (no
  floats, no NaN, no bytes, no sets), independent verifier (separate process
  from the registry).
- Gate Phase 2 on determinism + replay idempotency, NOT on cryptographic
  collision resistance.
- The independent verifier is a separate codebase that takes only the
  ledger as input and recomputes digests. Gate closure is automated:
  `verifier_output == expected_digests`.

### For VRES1 (announcement preamble):

- Section 6 of the VRES1 preamble already documents the bridge state
  machine, circuit breaker, and audit ledger. The "cryptographic
  governance" phrasing in the preamble refers to the **zipenc AES-256
  pipeline** and the **governance artifact minting workflow** (both
  operational in the IVE dashboard), NOT to SealedRegistry.
- The preamble's Section 4 (VRES1 explicitly excludes) is correct as
  written. SealedRegistry joins that exclusion list as a Phase 2 item.
- No public retraction needed — the preamble did not claim SealedRegistry.

---

## EVIDENCE

- Local anvil demonstration record:
  `/download/VRES1_LOCAL_ANVIL_DEMONSTRATION_RECORD.md`
- Sandbox credential inventory:
  - `vercel` CLI: installed via `npx vercel`, but `vercel whoami` → "Logged out."
  - `SEPOLIA_RPC`: not present in environment
  - `DEPLOYER_PRIVATE_KEY`: not present in environment
  - `.env`: contains only `DATABASE_URL` (local SQLite)
  - `.env.production`: does not exist in this sandbox
- Strategic memo framework: "Provable, Auditable, Honest, Conservative"
- VRES1 announcement preamble: `/download/VRES1_ANNOUNCEMENT_PREAMBLE.md`
- Code review findings (2026-08-24): SealedRegistry claims collision
  resistance; not provable for declared domain.

---

## KEY PHRASE (use this when briefing team or auditors)

> "We are not claiming to prove the absence of cryptographic collisions
> across all possible domains. We are proving that, for our declared value
> schema (null/bool/str/int/list/dict with string keys), release
> configuration (schema v1.0, domain 'vvu-watchdog'), and tested corpus
> (50K transactions, Aug 26 – Sep 6), equivalent values canonicalize
> identically, distinct records remain distinguishable, and independent
> verification reproduces all results."

For VRES1 / Phase 1 specifically:

> "VRES1 ships the CorruptorTarget contract, the Watchdog event listener
> specification, and the on-anvil demonstration that the FraudAttempt event
> fires when the documented exploit path is exercised. SealedRegistry is
> a Phase 2 roadmap item, gated behind the empirical Sepolia
> demonstration."

---

## TIMELINE (POST-DECISION)

| Date       | Task                                              | Owner              | Gate                              |
|------------|---------------------------------------------------|--------------------|-----------------------------------|
| 2026-08-24 | Lock this scope decision (immutable)              | Divhani            | This document                     |
| 2026-08-25 | On-call engineer runs Sepolia demonstration      | On-call engineer  | Public tx hash + Arbiscan link    |
| 2026-08-26 | Soak test begins (no SealedRegistry in path)     | CI/CD              | Unattended 50K-tx run             |
| 2026-09-06 | Gate 4 closure (simpler criteria)                | Automation         | `verifier_output == ledger`       |
| 2026-09-15 | Mainnet launch                                    | Ops                | Proceed with signed ledger        |
| 2026-11-01 | Phase 2 design review — SealedRegistry redesign  | Architecture      | Full Phase II architecture        |

---

## SIGNATURE

```
DECISION: SealedRegistry = Phase 2 roadmap item (NOT in Sept 15 boundary)
OWNER:    Divhani Majokweni
DATE:    2026-08-24
STATUS:  LOCKED — immutable from 2026-08-24 EOD (Africa/Johannesburg)
NEXT:    On-call engineer runs Sepolia demonstration (2026-08-25)
```

---

**This document is the single source of truth for SealedRegistry scope.**
Phone-call changes after 2026-08-24 EOD are not accepted. To change scope,
write a new decision document with a new date, citing this one.
