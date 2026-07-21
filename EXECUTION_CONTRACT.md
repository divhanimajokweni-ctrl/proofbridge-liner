# EXECUTION CONTRACT — Epistemic Runtime (ER)

**Version:** 0.8 Baseline  
**Status:** RATIFIED  
**Authority:** This document overrides all code, comments, filenames, prior commits, and documentation.  
**Last Verified:** 2026-03-04 — 12/12 assertions pass with real verification

---

## Purpose

You are implementing a deterministic evidence runtime named Epistemic Runtime (ER).

Assume:

- There is no existing implementation
- Existing files may be incomplete or incorrect
- Previous commits are not authoritative
- Documentation may be inconsistent
- Comments are not evidence
- Filenames do not imply correctness

**The only authority is this contract.**

If code contradicts this contract, the contract wins.

---

## Mission

Build a deterministic evidence runtime.

The runtime converts observations into immutable evidence through **one and only one** ingestion pipeline.

Everything else is a projection.

Nothing bypasses the pipeline.

---

## Primary Invariant

Every accepted observation must follow **exactly** this lifecycle:

```
Observation
    ↓
Acceptance Pipeline
    ↓
PII Redaction (before canonicalization)
    ↓
Canonicalization (RFC 8785)
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
Immutable Fact Log (WORM)
    ↓
Projection Engine
    ↓
CLI / API / Dashboard
```

No alternative paths may exist.  
No shortcuts.  
No direct database writes.  
No projection writes back to facts.  
No mutable state inside the kernel.

---

## Definition of Done

The implementation is complete **only** when every invariant in this contract is satisfied.

- Passing tests alone is insufficient.
- Compilation alone is insufficient.
- Manual inspection alone is insufficient.

---

## Design Philosophy

| Principle | Meaning |
|-----------|---------|
| Deterministic | Same inputs → same outputs, always |
| Replayable | Rebuild entire state from fact log |
| Cryptographically verifiable | Every fact carries proof of inclusion |
| Vendor-neutral | No cloud lock-in, no proprietary formats |
| Hermetic | No ambient state leaks into the kernel |
| Append-only | Evidence never changes; corrections are new facts |

---

## Architectural Rules

### Rule 1: Exactly One Ingestion Path

Everything enters through `AcceptancePipeline.submit()`.

Never bypass it.

The `Fact` constructor must not be accessible outside the pipeline. Storage must only accept facts from the pipeline.

### Rule 2: Facts Are Immutable

Facts never change. Corrections are new facts.

No `update`, `delete`, or mutation methods may exist on any `Fact` or `EvidenceStore` interface.

### Rule 3: State Never Exists

State is always projected.

```
State(t) = Projection(Facts ≤ t)
```

Never persist projections as authoritative state. Projections may be cached for performance, but the cache is never a source of truth.

### Rule 4: Every Output Must Be Reproducible

Running replay twice on identical facts must produce identical:

- bytes
- hashes
- signatures
- MMR roots
- projections

Bit-for-bit.

### Rule 5: No Nondeterminism Inside Kernel Code

Forbidden:

| API | Reason |
|-----|--------|
| `Date.now()` | Wall-clock time is nondeterministic |
| `Math.random()` | Unpredictable output |
| `crypto.randomUUID()` | Non-reproducible identifiers |
| `for...in` over objects | Iteration order not guaranteed |
| Locale-sensitive formatting | Varies by runtime |
| Floating timestamps | Different each run |
| Machine identity | Different across nodes |
| Filesystem ordering | OS-dependent |

Inject instead:

| Provider | Purpose |
|----------|---------|
| Clock | Deterministic timestamps |
| UUID Provider | Deterministic identifiers |
| Entropy Provider | Seeded PRNG |
| Signer | Pluggable signing |

### Rule 6: Canonicalization

Canonical JSON **MUST** implement RFC 8785.

`JSON.stringify()` is forbidden for canonical identity generation.

Fact IDs derive only from canonical bytes.

### Rule 7: Identity

Fact identity equals:

```
SHA256(RFC8785(canonical observation))
```

Nothing else.

### Rule 8: Sequencing

Facts receive `logicalSequence` from the `DeterministicSequencer`.

Sequence generation must be deterministic: same clock → same sequence → same timestamps.

### Rule 9: Signing

Only injected signers. No embedded keys. No hardcoded secrets.

Supported algorithms:

| Algorithm | Status | Module |
|-----------|--------|--------|
| Ed25519 | **REQUIRED** | `src/signer/ed25519.ts` |
| RSA-PSS-SHA256 | **REQUIRED** | `src/signer/rsa-pss.ts` |
| ECDSA P-384 | **REQUIRED** | `src/signer/ecdsa-p384.ts` |
| AWS KMS | **STUB** | `src/signer/aws-kms.ts` |
| IAM Federation | **STUB** | `src/signer/aws-kms.ts` |
| OIDC | **STUB** | `src/signer/aws-kms.ts` |

### Rule 10: Storage

| Environment | Driver | Module |
|-------------|--------|--------|
| Development | Local WORM emulator | `src/storage/local-worm.ts` |
| Production | Immutable storage (S3 Object Lock or equivalent) | `src/storage/s3-object-lock.ts` |

Never overwrite evidence.

### Rule 11: Projection Rules

Projection functions:

```
Facts → Pure Function → View
```

Never:

```
View → Fact
```

### Rule 12: Operational State

Operational state is not authoritative. External systems produce observations. Those observations enter `AcceptancePipeline`. Only then may `OperationalSnapshotFact` exist.

### Rule 13: Policy Engine

Policies execute compiled IR. Never execute arbitrary JavaScript.

Supported opcodes:

| Opcode | Operands | Description |
|--------|----------|-------------|
| `LOAD_FIELD` | field: string | Push field value from fact body |
| `LOAD_CONST` | value: unknown | Push constant value |
| `EQ` | — | Structural equality |
| `NEQ` | — | Structural inequality |
| `LT` | — | Less than |
| `LTE` | — | Less than or equal |
| `GT` | — | Greater than |
| `GTE` | — | Greater than or equal |
| `IN_RANGE` | lo: number, hi: number | Value within range |
| `NOT_IN_RANGE` | lo: number, hi: number | Value outside range |
| `CONTAINS` | — | Array contains item |
| `NOT_CONTAINS` | — | Array does not contain item |
| `TYPE_IS` | typeName: string | Type check |
| `AND` | — | Logical AND |
| `OR` | — | Logical OR |
| `NOT` | — | Logical NOT |
| `EVERY` | count: number | All of N conditions true |
| `SOME` | count: number | At least one of N conditions true |
| `LOOKUP` | table: string, key: string | Deterministic table lookup |
| `RESULT` | policy: PolicyResult | Set evaluation result |

**Unknown opcode must terminate evaluation.** The evaluator's switch statement must have a `default: throw` clause.

### Rule 14: Replay

Replay is the highest verification authority.

Replay rebuilds everything from the Fact Log.

Replay success requires:

| Check | Condition |
|-------|-----------|
| Fact IDs identical | `factIds[run1] === factIds[run2]` |
| Canonical bytes identical | `canonicalBytes[run1] === canonicalBytes[run2]` |
| Signatures identical | `signatures[run1] === signatures[run2]` |
| MMR roots identical | `mmrRoot[run1] === mmrRoot[run2]` |
| Projections identical | `stateHash[run1] === stateHash[run2]` |

### Rule 15: Security — PII Redaction

PII must be removed **before** canonicalization.

Pipeline order:

```
Observation
    ↓
PII Redaction
    ↓
Canonicalization
    ↓
Hashing
    ↓
Signing
    ↓
Append
```

Never hash raw regulated PII.

---

## Required Interfaces

Implement dependency injection for:

| Interface | Module | Status |
|-----------|--------|--------|
| Clock | `src/engine/clock.ts` | ✅ |
| UUID Provider | `src/engine/uuid.ts` | ✅ |
| Signer | `src/engine/signer.ts` | ✅ |
| Entropy Provider | `src/engine/entropy.ts` | ✅ |
| Evidence Store | `src/engine/storage.ts` | ✅ |
| Projection Engine | `src/lib/kernel/projection.ts` | ✅ |
| Policy Engine | `src/lib/kernel/policy-evaluator.ts` | ✅ |
| MMR | `src/lib/kernel/mmr.ts` | ✅ |
| Canonicalizer | `src/lib/kernel/canonicalization.ts` | ✅ |
| Replay Engine | `src/lib/kernel/replay.ts` | ✅ |
| Acceptance Pipeline | `src/lib/kernel/acceptance-pipeline.ts` | ✅ |

---

## Required Verification

Implementation is not complete until all succeed:

| # | Check | Verification Method |
|---|-------|-------------------|
| 1 | RFC 8785 deterministic encoding | Canonicalize `{b:2,a:1}` and `{a:1,b:2}` → identical output |
| 2 | SHA-256 deterministic hashing | Hash same input twice → identical output |
| 3 | Ed25519 signing | Sign + verify round-trip succeeds |
| 4 | Replay byte identity | Canonical bytes identical across two runs |
| 5 | Replay signature identity | Signatures identical across two runs |
| 6 | Replay MMR identity | MMR roots identical across two runs |
| 7 | Projection identity | State hashes identical across two runs |
| 8 | WORM mutation rejection | Duplicate append throws WORM violation |
| 9 | Policy determinism | Same policy + same input → same result twice |
| 10 | Schema validation | Strict schema rejects invalid observations |
| 11 | PII redaction | Redaction occurs before canonicalization in pipeline |
| 12 | No nondeterministic APIs | All providers injected, no Date.now/Math.random in kernel |

**Run:** `npx tsx scripts/verify-kernel.ts`  
**Target:** 12/12 pass

---

## Kernel File Map

```
src/lib/kernel/
├── types.ts                 — Core types: Fact, Proof, Policy, Projection, Providers
├── hashing.ts               — SHA-256 engine (Rule: only SHA-256)
├── canonicalization.ts      — RFC 8785 JCS (Rule: no JSON.stringify)
├── mmr.ts                   — Merkle Mountain Range
├── sequencer.ts             — DeterministicSequencer with injected ClockProvider
├── schema-registry.ts       — Schema validation (rejects unknown types)
├── acceptance-pipeline.ts   — Universal write gate (12-step pipeline)
├── policy-evaluator.ts      — Stack-based IR with AND/OR/NOT/EVERY/SOME/LOOKUP
├── projection.ts            — ProjectionEngine with immutable state
├── replay.ts                — DeterministicReplay
├── runtime.ts               — RuntimeKernel orchestrator + verifyKernel()
├── redaction.ts             — PII redaction BEFORE canonicalization
└── index.ts                 — Barrel export

src/engine/
├── clock.ts                 — DeterministicClock / SystemClock
├── entropy.ts               — DeterministicEntropy (xorshift128+)
├── uuid.ts                  — DeterministicUuid (SHA-256 of namespace:counter)
├── signer.ts                — HmacSigner / Ed25519Signer
├── storage.ts               — InMemoryWORMStorage
└── index.ts

src/storage/
├── local-worm.ts            — LocalWORMEmulator with integrity verification
├── s3-object-lock.ts        — S3 Object Lock driver (stub)
└── index.ts

src/signer/
├── ed25519.ts               — Ed25519SignerModule (@noble/curves)
├── rsa-pss.ts               — RSAPSSSigner (Web Crypto API)
├── ecdsa-p384.ts            — ECDSAP384Signer (@noble/curves)
├── aws-kms.ts               — AWS KMS / IAM / OIDC (stubs)
└── index.ts

scripts/
└── verify-kernel.ts         — 12-assertion verification harness

schemas/
└── evidence-envelope.schema.json  — Draft 2020-12 JSON Schema
```

---

## Pipeline Lifecycle (Contract Specification)

The `AcceptancePipeline.submit()` method enforces this exact sequence:

| Step | Operation | Contract Reference |
|------|-----------|-------------------|
| 1 | Schema validation | Reject unregistered types, validate against JSON Schema |
| 2 | Policy evaluation | Execute compiled IR; reject if policy returns `reject` |
| 3 | PII redaction | Redact PII fields BEFORE canonicalization (Rule 15) |
| 4 | Canonicalization (RFC 8785) | On the REDACTED body (Rule 6) |
| 5 | SHA-256 hashing | Hash canonical bytes (Rule 7) |
| 6 | Fact ID computation | `SHA256(RFC8785(canonical observation))` (Rule 7) |
| 7 | Logical sequencing | `DeterministicSequencer.next()` (Rule 8) |
| 8 | Digital signature | Via injected `SignerProvider` (Rule 9) |
| 9 | Fact construction | Immutable fact object |
| 10 | MMR append | Insert into Merkle Mountain Range |
| 11 | Proof generation | Inclusion proof from MMR |
| 12 | WORM storage | Append to immutable fact log (Rule 10) |

---

## Forbidden

Do not:

- Mutate facts
- Update fact IDs
- Overwrite evidence
- Bypass `AcceptancePipeline`
- Use random numbers in kernel execution
- Use current time directly in kernel execution
- Rely on object iteration order
- Trust existing implementation without verification
- Use `JSON.stringify()` for canonical identity
- Use FNV, CRC, or ad-hoc hashing
- Execute arbitrary JavaScript in policy evaluation
- Hash raw regulated PII fields
- Silently ignore unknown policy opcodes
- Persist projections as authoritative state

---

## Working Method

For every task:

1. Read this contract.
2. Compare implementation against contract.
3. Repair only the smallest required surface.
4. Preserve determinism.
5. Execute verification: `npx tsx scripts/verify-kernel.ts`
6. Produce evidence.

Never guess.  
Never invent architecture.  
Never silently change interfaces.

---

## Deliverables

The repository must contain:

| # | Deliverable | Module | Status |
|---|-------------|--------|--------|
| 1 | Acceptance Pipeline | `src/lib/kernel/acceptance-pipeline.ts` | ✅ |
| 2 | Canonicalizer (RFC 8785) | `src/lib/kernel/canonicalization.ts` | ✅ |
| 3 | MMR Engine | `src/lib/kernel/mmr.ts` | ✅ |
| 4 | Replay Engine | `src/lib/kernel/replay.ts` | ✅ |
| 5 | Policy Engine | `src/lib/kernel/policy-evaluator.ts` | ✅ |
| 6 | Projection Engine | `src/lib/kernel/projection.ts` | ✅ |
| 7 | WORM Emulator | `src/storage/local-worm.ts` | ✅ |
| 8 | S3 Object Lock Driver | `src/storage/s3-object-lock.ts` | ⚠️ Stub |
| 9 | KMS Signer Provider | `src/signer/aws-kms.ts` | ⚠️ Stub |
| 10 | Ed25519 Signer | `src/signer/ed25519.ts` | ✅ |
| 11 | RSA-PSS-SHA256 Signer | `src/signer/rsa-pss.ts` | ✅ |
| 12 | ECDSA P-384 Signer | `src/signer/ecdsa-p384.ts` | ✅ |
| 13 | Schema Registry | `src/lib/kernel/schema-registry.ts` | ✅ |
| 14 | PII Redaction Engine | `src/lib/kernel/redaction.ts` | ✅ |
| 15 | JSON Schema (Draft 2020-12) | `schemas/evidence-envelope.schema.json` | ✅ |
| 16 | Verification Harness | `scripts/verify-kernel.ts` | ✅ |
| 17 | Runtime Providers | `src/engine/` | ✅ |
| 18 | Operational Collector | — | ❌ Not yet |
| 19 | state.sh Projection Client | — | ❌ Not yet |
| 20 | Full Deterministic Test Suite | — | ❌ Not yet |

---

## Final Acceptance Criteria

The implementation is accepted **only** if an independent engineer, with no prior knowledge of Epistemic Runtime and no verbal guidance, can:

1. Build the repository from a clean checkout.
2. Understand the architecture solely from the code and this contract.
3. Run the verification suite: `npx tsx scripts/verify-kernel.ts`
4. Achieve 12/12 deterministic replay.
5. Confirm all cryptographic invariants.
6. Produce identical outputs across repeated executions.

If any step requires undocumented assumptions or human clarification, the implementation is **incomplete**.

---

## Known Gaps (Honest Assessment)

| Gap | Severity | Notes |
|-----|----------|-------|
| RFC 8785 number serialization edge cases | Medium | `n.toString()` diverges from spec for `1e-7` and `1e20` |
| RFC 8785 supplementary character handling | Medium | Surrogate pair encoding may differ from spec for code points > 0xFFFF |
| S3 Object Lock driver is a stub | High | All methods are `console.log` — needs AWS SDK integration |
| KMS/IAM/OIDC signers are stubs | High | Return deterministic SHA-256, not real signatures |
| Operational Collector | High | No implementation exists |
| state.sh Projection Client | Medium | No implementation exists |
| Full test suite | High | Zero `.test.ts` files — verification relies on script only |
| HmacSigner is default in RuntimeKernel | Medium | Production should use Ed25519; HMAC provides no non-repudiation |
| No vector clock | Low | Single-writer assumption; distributed ordering not supported |

---

**epistemic://runtime · v0.8 · 2026**

*From hope to proof. From trust to verification.*
