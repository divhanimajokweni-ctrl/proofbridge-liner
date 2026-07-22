# Epistemic Runtime (ER) v0.8

**From hope to proof. From trust to verification.**

A deterministic evidence runtime that enforces cryptographic integrity, append-only immutability, and bit-identical replay across all observations.

---

## Status

| Check | Result |
|-------|--------|
| 12/12 Kernel Assertions | ✅ ALL PASS |
| 57/57 Vitest Tests | ✅ ALL PASS |
| Deterministic Replay | ✅ VERIFIED (5/5 checks) |
| 7 Constitutional Rules | ✅ COMPLIANT |
| Lint | ✅ ZERO ERRORS |
| Schema Emitter | ✅ 10 schemas emitted |
| S3 Object Lock Driver | ✅ Production-wired |
| AWS KMS Signer | ✅ Production-wired |
| IAM Federation Signer | ✅ Production-wired |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Epistemic Runtime v0.8                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Observation ──▶ AcceptancePipeline ──▶ Fact ──▶ Projection │
│       │               │ 11-step gate │           │          │
│       │               ├──────────────┤           │          │
│       │               │ 1. Schema    │           │          │
│       │               │ 2. Policy    │           │          │
│       │               │ 3. PII Redact│           │          │
│       │               │ 4. RFC 8785  │           │          │
│       │               │ 5. SHA-256   │           │          │
│       │               │ 6. Fact ID   │           │          │
│       │               │ 7. Sequence  │           │          │
│       │               │ 8. Sign      │           │          │
│       │               │ 9. MMR Insert│           │          │
│       │               │10. Proof Gen │           │          │
│       │               │11. WORM Store│           │          │
│       │               └──────────────┘           │          │
│       │                                          │          │
│  ┌────┴──────────────────────────────────────────┴─────┐   │
│  │              RuntimeKernel (Orchestrator)            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐           │   │
│  │  │   MMR    │ │ Sequencer│ │  Schema   │           │   │
│  │  │ Mountain │ │  Determ. │ │ Registry  │           │   │
│  │  │  Range   │ │          │ │           │           │   │
│  │  └──────────┘ └──────────┘ └───────────┘           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐           │   │
│  │  │ Policy   │ │Projection│ │  Replay   │           │   │
│  │  │ Evaluator│ │  Engine  │ │  Engine   │           │   │
│  │  └──────────┘ └──────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────── Providers (DI) ───────────────────┐  │
│  │ Clock │ Entropy │ UUID │ Signer │ Storage            │  │
│  │  Dev: Deterministic  │  Dev: InMemoryWORM            │  │
│  │  Prod: SystemClock   │  Prod: S3 Object Lock         │  │
│  │  Prod: HmacSigner    │  Prod: AWS KMS / IAM / OIDC   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Four Primitives

| Primitive | Purpose | Identity | Storage |
|-----------|---------|----------|---------|
| **Fact** | What happened | `SHA-256(canonicalBytes)` | Append-only (WORM) |
| **Proof** | Why we believe it | `SHA-256(proof:factId:timestamp)` | Append-only (WORM) |
| **Policy** | Whether to accept | Deterministic IR opcodes | Registered, not stored |
| **Projection** | How to consume | `SHA-256(name:version)` | Mutable (NOT WORM) |

---

## Constitutional Rules

1. **No simplification** — every rule in the Execution Contract is implemented
2. **No redesign** — no shortcuts, no "better ideas"
3. **No guessing** — if uncertain, re-read the contract
4. **No `Math.random()` / `Date.now()` / `crypto.randomUUID()`** in the kernel
5. **No `JSON.stringify()`** for hashing — only RFC 8785
6. **No FNV, CRC, or ad-hoc hashing** — only SHA-256
7. **Evidence is append-only** — WORM storage, no delete, no update

---

## Production Integrations

### S3 Object Lock Storage

```typescript
import { S3ObjectLockStorage } from '@/storage';

const storage = new S3ObjectLockStorage({
  bucket: 'epistemic-evidence-lock',
  prefix: 'runtime/v0.8',
  region: 'af-south-1',
  // credentials: optional — uses IAM role if omitted
});

// WORM enforced at infrastructure level via COMPLIANCE Object Lock
// 100-year retention period on facts and proofs
// Projections stored WITHOUT Object Lock (they are mutable)
```

### AWS KMS Signer

```typescript
import { AWSKMSSigner } from '@/signer';

const signer = new AWSKMSSigner({
  keyArn: 'arn:aws:kms:af-south-1:123456789012:key/abcd-efgh',
  region: 'af-south-1',
  // credentials: optional — uses IAM role if omitted
});

// Auto-detects signing algorithm from key type:
// RSA → RSASSA_PKCS1_V1_5_SHA_256
// ECC → ECDSA_SHA_256
```

### IAM Federation Signer

```typescript
import { IAMFederationSigner } from '@/signer';

const signer = new IAMFederationSigner({
  roleArn: 'arn:aws:iam::123456789012:role/EpistemicSigner',
  sessionName: 'epistemic-runtime-prod',
  keyArn: 'arn:aws:kms:af-south-1:123456789012:key/abcd-efgh',
  region: 'af-south-1',
});

// Assumes role via STS, delegates signing to KMS
// Caches credentials, re-assumes on expiry
```

### OIDC Signer

```typescript
import { OIDCSigner } from '@/signer';

const signer = new OIDCSigner({
  issuer: 'https://auth.example.com',
  audience: 'epistemic-runtime',
  oidcToken: '<jwt-from-oidc-provider>',
});

// Deterministic HMAC-SHA256 signature tied to OIDC identity
// Public key fingerprint = SHA-256(issuer:audience)
```

---

## Schema Emitter

Generates portable Draft 2020-12 JSON Schema `.json` files from runtime type definitions:

```bash
npx tsx scripts/generate-schema.ts
# Output: schemas/*.schema.json (10 files)

npx tsx scripts/generate-schema.ts --outdir ./dist/schemas
# Custom output directory
```

| Schema | Description |
|--------|-------------|
| `fact-types.schema.json` | Enumeration of all 12 fact types |
| `fact.schema.json` | Fact primitive (11 required fields) |
| `proof.schema.json` | Proof primitive (8 required fields) |
| `policy-opcode.schema.json` | All 20 policy IR opcodes |
| `policy-rule.schema.json` | PolicyRule definition |
| `projection.schema.json` | Projection primitive |
| `evidence-envelope.schema.json` | Fact + proofs container |
| `kernel-config.schema.json` | Deterministic config for replay |
| `acceptance-result.schema.json` | Pipeline acceptance result |
| `replay-verification.schema.json` | 5-way replay comparison |

---

## Kernel Verification

### 12-Assertion Check

```bash
npx tsx scripts/verify-kernel.ts
```

| # | Assertion | What It Verifies |
|---|-----------|-----------------|
| 01 | Deterministic Replay | Bit-identical output across runs |
| 02 | SHA-256 Determinism | Same input → same hash |
| 03 | RFC 8785 Canonicalization | Key-order independent serialization |
| 04 | Acceptance Pipeline Universal | All writes through the gate |
| 05 | No FNV Hashing | Only SHA-256 for identities |
| 06 | No Non-Deterministic APIs | All providers injected |
| 07 | Evidence Immutability (WORM) | Duplicate append rejected |
| 08 | MMR Proof Verification | Inclusion proof matches root |
| 09 | Schema Validation Active | Invalid observations rejected |
| 10 | Policy Engine Deterministic | Same policy + input → same result |
| 11 | RFC 8785 (not JSON.stringify) | Sorted keys, not native order |
| 12 | Signature Verification | Sign/verify round-trip succeeds |

### Vitest Test Suite

```bash
npx vitest run
```

57 tests across 12 describe blocks covering all kernel components.

### Projection Client (Read-Only)

```bash
./scripts/state.sh list       # List all projections
./scripts/state.sh get <name> # Get projection state
./scripts/state.sh watch <n>  # Poll for changes
./scripts/state.sh root       # Get MMR root
./scripts/state.sh verify     # Kernel verification status
```

---

## Project Structure

```
├── src/
│   ├── lib/kernel/           # Core deterministic kernel
│   │   ├── types.ts          # Four primitives + interfaces
│   │   ├── hashing.ts        # SHA-256 engine (@noble/hashes)
│   │   ├── canonicalization.ts # RFC 8785 JCS
│   │   ├── mmr.ts            # Merkle Mountain Range
│   │   ├── sequencer.ts      # Deterministic sequence numbers
│   │   ├── schema-registry.ts # Schema validation
│   │   ├── acceptance-pipeline.ts # Universal write gate
│   │   ├── policy-evaluator.ts # Stack-based IR evaluator
│   │   ├── projection.ts     # Projection engine
│   │   ├── projection-registry.ts # Lifecycle tracking
│   │   ├── redaction.ts      # PII redaction (before canonicalization)
│   │   ├── operational-collector.ts # External observation sources
│   │   ├── replay.ts         # Deterministic replay engine
│   │   └── runtime.ts        # RuntimeKernel orchestrator
│   ├── engine/               # Dependency-injected providers
│   │   ├── clock.ts          # DeterministicClock / SystemClock
│   │   ├── entropy.ts        # DeterministicEntropy (xorshift128+)
│   │   ├── uuid.ts           # DeterministicUuid (SHA-256-based)
│   │   ├── signer.ts         # HmacSigner / Ed25519Signer
│   │   └── storage.ts        # InMemoryWORMStorage
│   ├── storage/              # Storage drivers
│   │   ├── local-worm.ts     # Dev: in-memory WORM emulator
│   │   └── s3-object-lock.ts # Prod: S3 Object Lock (COMPLIANCE)
│   ├── signer/               # Production signer modules
│   │   ├── ed25519.ts        # Ed25519 (@noble/curves)
│   │   ├── ecdsa-p384.ts     # ECDSA P-384 (@noble/curves)
│   │   ├── rsa-pss.ts        # RSA-PSS-SHA256 (Web Crypto)
│   │   └── aws-kms.ts        # AWS KMS / IAM Federation / OIDC
│   └── __tests__/            # Full deterministic test suite
│       └── kernel/
│           └── deterministic-suite.test.ts
├── scripts/
│   ├── verify-kernel.ts      # 12-assertion verification script
│   ├── generate-schema.ts    # Schema emitter → schemas/*.json
│   └── state.sh              # Read-only projection client
├── schemas/                  # Generated Draft 2020-12 JSON Schemas
│   ├── fact.schema.json
│   ├── proof.schema.json
│   ├── policy-opcode.schema.json
│   ├── policy-rule.schema.json
│   ├── projection.schema.json
│   ├── evidence-envelope.schema.json
│   ├── kernel-config.schema.json
│   ├── acceptance-result.schema.json
│   ├── replay-verification.schema.json
│   └── fact-types.schema.json
├── docs/
│   └── governance/adrs/      # Architecture Decision Records
│       ├── ADR-001-event-sourcing.md
│       ├── ADR-002-ed25519-signatures.md
│       └── ADR-003-canonical-json.md
├── EXECUTION_CONTRACT.md     # Root contract (authoritative)
└── vitest.config.ts          # Test configuration
```

---

## Dependency Injection

All non-deterministic operations are injected through provider interfaces:

```typescript
interface RuntimeProviders {
  clock: ClockProvider;      // DeterministicClock | SystemClock
  entropy: EntropyProvider;  // DeterministicEntropy | SystemEntropy
  uuid: UuidProvider;        // DeterministicUuid | SystemUuid
  signer: SignerProvider;    // HmacSigner | Ed25519 | KMS | IAM | OIDC
  storage: StorageProvider;  // InMemoryWORM | S3ObjectLock
}
```

Development uses deterministic providers. Production swaps them via `RuntimeKernel.createWithProviders()`.

---

## Policy IR Opcodes

20 deterministic opcodes — no `eval()`, no scripting, no dynamic execution:

| Opcode | Stack Effect | Description |
|--------|-------------|-------------|
| `LOAD_FIELD` | +1 | Push nested field from body |
| `LOAD_CONST` | +1 | Push constant value |
| `EQ` | -1 | Equality comparison |
| `NEQ` | -1 | Inequality comparison |
| `LT`, `LTE`, `GT`, `GTE` | -1 | Numeric comparisons |
| `IN_RANGE`, `NOT_IN_RANGE` | -1 | Range checks |
| `CONTAINS`, `NOT_CONTAINS` | -1 | Collection membership |
| `TYPE_IS` | -1 | Type check |
| `AND`, `OR`, `NOT` | -1 | Boolean logic |
| `EVERY`, `SOME` | -(n-1) | Quantifiers |
| `LOOKUP` | 0 | Deterministic table lookup |
| `RESULT` | +1 | Set accept/reject/defer |

Unknown opcodes **terminate evaluation** — never silently ignored.

---

## License

Proprietary. See EXECUTION_CONTRACT.md for governance.
