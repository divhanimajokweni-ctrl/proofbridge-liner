# EXECUTION CONTRACT — EPISTEMIC RUNTIME (ER)

**Version:** 0.8 Baseline  
**Authority:** This document is the root contract. All specifications, ADRs, and implementation guides derive from it.

---

## Purpose

You are implementing a completely new software system named **Epistemic Runtime (ER)**.

Assume:

* there is no existing implementation
* existing files may be incomplete or incorrect
* previous commits are not authoritative
* documentation may be inconsistent
* comments are not evidence
* filenames do not imply correctness

The only authority is this contract.

If code contradicts this contract, **the contract wins**.

---

# Mission

Build a deterministic evidence runtime.

The runtime converts observations into immutable evidence through one and only one ingestion pipeline.

Everything else is a projection.

Nothing bypasses the pipeline.

---

# Primary Invariant

Every accepted observation must follow exactly this lifecycle.

```
Observation
    ↓
Acceptance Pipeline
    ↓
Canonicalization (RFC8785)
    ↓
SHA-256
    ↓
Fact ID
    ↓
Logical Sequencing
    ↓
Digital Signature
    ↓
MMR Append
    ↓
Immutable Fact Log
    ↓
Projection Engine
    ↓
CLI / API / Dashboard
```

No alternative paths may exist.

No shortcuts.

No direct database writes.

No projection writes.

No mutable state inside the kernel.

---

# Definition of Done

The implementation is complete only when every invariant in this contract is satisfied.

Passing tests alone is insufficient.

Compilation alone is insufficient.

Manual inspection alone is insufficient.

---

# Design Philosophy

The runtime is deterministic.

The runtime is replayable.

The runtime is cryptographically verifiable.

The runtime is vendor-neutral.

The runtime is hermetic.

The runtime is append-only.

---

# Architectural Rules

## Rule 1 — Single Ingestion Path

Exactly one ingestion path.

Everything enters through AcceptancePipeline.

Never bypass it.

## Rule 2 — Fact Immutability

Facts are immutable.

Facts never change.

Corrections are new facts.

## Rule 3 — State is Always Projected

State never exists.

State is always projected.

```
State(t) = Projection(Facts ≤ t)
```

Never persist projections.

## Rule 4 — Bit-for-Bit Reproducibility

Every output must be reproducible.

Running replay twice on identical facts must produce identical:

* bytes
* hashes
* signatures
* MMR roots
* projections

Bit-for-bit.

## Rule 5 — No Nondeterminism in Kernel

Forbidden:

* `Date.now()`
* `Math.random()`
* UUID libraries
* unordered iteration
* locale-sensitive formatting
* floating timestamps
* machine identity
* filesystem ordering

Inject:

* Clock
* UUID Provider
* Entropy Provider
* Signer

## Rule 6 — Evidence is Append-Only

Never overwrite evidence.

Never mutate facts.

Never update fact IDs.

WORM storage is mandatory.

## Rule 7 — PII Redaction Before Canonicalization

PII must be removed before canonicalization.

Pipeline order:

```
Observation → PII Redaction → Canonicalization → Hashing → Signing → Append
```

Never hash raw regulated PII.

---

# Canonicalization

Canonical JSON MUST implement RFC8785.

`JSON.stringify()` is forbidden for canonical identity generation.

Fact IDs derive only from canonical bytes.

---

# Identity

Fact identity equals:

```
SHA256( RFC8785(canonical observation) )
```

Nothing else.

---

# Sequencing

Facts receive:

* `logicalSequence`
* `vectorClock`

Sequence generation must be deterministic.

---

# Signing

Only injected signers.

Supported algorithms:

* Ed25519
* RSA-PSS-SHA256
* ECDSA P-384

No embedded keys.

No hardcoded secrets.

---

# Storage

Development: Local WORM emulator.

Production: Immutable storage.

Examples:

* AWS S3 Object Lock (COMPLIANCE mode)
* Equivalent compliant WORM backend

Never overwrite evidence.

---

# Projection Rules

Projection functions:

```
Facts → Pure Function → View
```

Never:

```
View → Fact
```

---

# Operational State

Operational state is **not** authoritative.

External systems produce observations.

Examples: Git, Kubernetes, GitHub, CI, Filesystem.

Those observations enter AcceptancePipeline.

Only then may OperationalSnapshotFact exist.

`state.sh` is a projection client.

It never writes.

---

# Policy Engine

Policies execute compiled IR.

Never execute arbitrary JavaScript.

Supported opcodes only:

* AND, OR, NOT, EQ
* LOOKUP, CONTAINS
* EVERY, SOME
* GT, LT, GTE, LTE
* HAS_KEY, TYPE_OF

Unknown opcode must terminate evaluation.

---

# Replay

Replay is the highest verification authority.

Replay rebuilds everything from the Fact Log.

Replay success requires:

* identical bytes
* identical hashes
* identical signatures
* identical MMR root
* identical projections

---

# Security

PII must be removed before canonicalization.

Never hash raw regulated PII.

All signing operations must use injected providers only.

Key material must never be embedded in source code.

---

# Forbidden

Do not:

* mutate facts
* update fact IDs
* overwrite evidence
* bypass AcceptancePipeline
* use random numbers in kernel code
* use current time directly in kernel code
* rely on object iteration order
* trust existing implementation
* use `JSON.stringify()` for canonical identity
* use FNV, CRC, or ad-hoc hashing for identity
* execute arbitrary code in policy evaluation
* persist projected state

---

# Required Interfaces

Implement dependency injection for:

| Interface | Purpose |
|-----------|---------|
| `Clock` | Deterministic time source |
| `UUID Provider` | Deterministic identity generation |
| `Signer` | Digital signature operations |
| `Entropy Provider` | Deterministic randomness |
| `Evidence Store` | WORM evidence persistence |
| `Projection Registry` | View function registration |
| `Policy Engine` | IR-based policy evaluation |
| `MMR` | Merkle Mountain Range |
| `Canonicalizer` | RFC8785 encoding |
| `Replay Engine` | Deterministic replay |
| `Acceptance Pipeline` | Single ingestion path |
| `Operational Collector` | External observation collection |

---

# Required Verification

Implementation is not complete until all succeed:

| # | Verification | Description |
|---|-------------|-------------|
| 1 | ✓ RFC8785 deterministic encoding | Canonical bytes are byte-identical across runs |
| 2 | ✓ SHA256 deterministic hashing | Same input → same hash, always |
| 3 | ✓ Ed25519 signing | Real Ed25519 sign/verify cycle |
| 4 | ✓ Replay byte identity | Canonical bytes identical on replay |
| 5 | ✓ Replay signature identity | Signatures identical on replay |
| 6 | ✓ Replay MMR identity | MMR root identical on replay |
| 7 | ✓ Projection identity | Projections identical on replay |
| 8 | ✓ WORM mutation rejection | Overwrite throws, not silent |
| 9 | ✓ Policy determinism | Same policy + same input → same result |
| 10 | ✓ Schema validation | Invalid observations rejected |
| 11 | ✓ PII redaction | Regulated fields stripped before hashing |
| 12 | ✓ Hermetic replay | No external dependencies during replay |

---

# Deliverables

The repository must contain:

| # | Deliverable | Path |
|---|-------------|------|
| 1 | Acceptance Pipeline | `src/lib/kernel/acceptance-pipeline.ts` |
| 2 | Canonicalizer (RFC8785) | `src/lib/kernel/canonicalization.ts` |
| 3 | MMR Engine | `src/lib/kernel/mmr.ts` |
| 4 | Replay Engine | `src/lib/kernel/replay.ts` |
| 5 | Policy Engine | `src/lib/kernel/policy-evaluator.ts` |
| 6 | Projection Engine | `src/lib/kernel/projection.ts` |
| 7 | WORM Emulator | `src/storage/local-worm.ts` |
| 8 | S3 Object Lock Driver | `src/storage/s3-object-lock.ts` |
| 9 | KMS Signer Provider | `src/signer/aws-kms.ts` |
| 10 | Projection Registry | `src/lib/kernel/projection-registry.ts` |
| 11 | Operational Collector | `src/lib/kernel/operational-collector.ts` |
| 12 | state.sh Projection Client | `scripts/state.sh` |
| 13 | Verification Harness | `scripts/verify-kernel.ts` |
| 14 | Full Deterministic Test Suite | `src/__tests__/kernel/` |
| 15 | Evidence Envelope System | `src/lib/evidence/` |
| 16 | Trust Runtime (CQRS) | `src/lib/trust-runtime/` |
| 17 | Governance ADRs | `docs/governance/adrs/` |

---

# Working Method

For every task:

1. Read this contract.
2. Compare implementation against contract.
3. Repair only the smallest required surface.
4. Preserve determinism.
5. Execute tests.
6. Produce evidence.

Never guess.

Never invent architecture.

Never silently change interfaces.

---

# Final Acceptance Criteria

The implementation is accepted only if an independent engineer, with no prior knowledge of Epistemic Runtime and no verbal guidance, can:

1. Build the repository from a clean checkout.
2. Understand the architecture solely from the code and this contract.
3. Run the verification suite.
4. Achieve deterministic replay.
5. Confirm all cryptographic invariants.
6. Produce identical outputs across repeated executions.

If any step requires undocumented assumptions or human clarification, the implementation is incomplete.
