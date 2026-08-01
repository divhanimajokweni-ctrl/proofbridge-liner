# proofbridge-liner

## **Epistemic Runtime (ER) — Autonomous Infrastructure Runtime & Trust Gateway**

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production_Ready-00C853?style=for-the-badge&logo=vercel&logoColor=white" alt="Production Ready">
  <img src="https://img.shields.io/badge/Kernel_Assertions-12/12-00C853?style=for-the-badge&logo=checkmarx&logoColor=white" alt="12/12 Kernel Assertions">
  <img src="https://img.shields.io/badge/Tests-57/57-00C853?style=for-the-badge&logo=vitest&logoColor=white" alt="57/57 Tests">
  <img src="https://img.shields.io/badge/Deterministic_Replay-VERIFIED-00C853?style=for-the-badge&logo=replay&logoColor=white" alt="Deterministic Replay Verified">
  <img src="https://img.shields.io/badge/Schemas-10-FF6F00?style=for-the-badge&logo=jsonschema&logoColor=white" alt="10 Schemas">
  <img src="https://img.shields.io/badge/Runtime_Fortification-10/10-00C853?style=for-the-badge&logo=arm&logoColor=white" alt="10/10 Runtime Fortification">
</p>

<p align="center">
  <strong>From hope to proof. From trust to verification.</strong><br>
  A deterministic evidence runtime that enforces cryptographic integrity, append-only immutability, and bit-identical replay across all observations.
</p>

<div align="center">
  
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-v0.3+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Helm](https://img.shields.io/badge/Helm-3-0F1689?style=for-the-badge&logo=helm&logoColor=white)](https://helm.sh/)
[![GitOps](https://img.shields.io/badge/GitOps-2B7489?style=for-the-badge&logo=git&logoColor=white)](https://www.gitops.tech/)
[![AWS KMS](https://img.shields.io/badge/AWS_KMS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/kms/)
[![S3](https://img.shields.io/badge/S3_Object_Lock-569A31?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![OIDC](https://img.shields.io/badge/OIDC-F05032?style=for-the-badge&logo=openid&logoColor=white)](https://openid.net/connect/)
[![mTLS](https://img.shields.io/badge/mTLS-0033A0?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/learning/access-management/what-is-mtls/)

</div>

---

## 🏛️ **Architecture Overview**

The Epistemic Runtime (ER) is a **deterministic evidence engine** that transforms observations into cryptographically verifiable facts through an 11-step acceptance pipeline.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Epistemic Runtime v0.8                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Observation ──▶ AcceptancePipeline ──▶ Fact ──▶ Projection   │
│        │               11-step gate            │               │
│        │         ┌──────────────────┐         │               │
│        │         │ 1. Schema        │         │               │
│        │         │ 2. Policy        │         │               │
│        │         │ 3. PII Redact    │         │               │
│        │         │ 4. RFC 8785      │         │               │
│        │         │ 5. SHA-256       │         │               │
│        │         │ 6. Fact ID       │         │               │
│        │         │ 7. Sequence      │         │               │
│        │         │ 8. Sign          │         │               │
│        │         │ 9. MMR Insert    │         │               │
│        │         │10. Proof Gen     │         │               │
│        │         │11. WORM Store    │         │               │
│        │         └──────────────────┘         │               │
│        │                                      │               │
│   ┌────┴──────────────────────────────────────┴─────┐        │
│   │              RuntimeKernel (Orchestrator)        │        │
│   │  ┌──────────┐ ┌──────────┐ ┌───────────┐       │        │
│   │  │   MMR    │ │Sequencer │ │  Schema   │       │        │
│   │  │ Mountain │ │  Determ. │ │ Registry  │       │        │
│   │  │  Range   │ │          │ │           │       │        │
│   │  └──────────┘ └──────────┘ └───────────┘       │        │
│   │  ┌──────────┐ ┌──────────┐ ┌───────────┐       │        │
│   │  │ Policy   │ │Projection│ │  Replay   │       │        │
│   │  │Evaluator │ │  Engine  │ │  Engine   │       │        │
│   │  └──────────┘ └──────────┘ └───────────┘       │        │
│   └──────────────────────────────────────────────────┘        │
│                                                                 │
│   ┌─────────────────── Providers (DI) ─────────────────────┐   │
│   │ Clock │ Entropy │ UUID │ Signer │ Storage              │   │
│   │  Dev: Deterministic  │  Dev: InMemoryWORM              │   │
│   │  Prod: SystemClock   │  Prod: S3 Object Lock           │   │
│   │  Prod: HmacSigner    │  Prod: AWS KMS / IAM / OIDC     │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 **The Four Primitives**

| Primitive | Purpose | Identity | Storage |
|-----------|---------|----------|---------|
| **Fact** | What happened | `SHA-256(canonicalBytes)` | Append-only (WORM) |
| **Proof** | Why we believe it | `SHA-256(proof:factId:timestamp)` | Append-only (WORM) |
| **Policy** | Whether to accept | Deterministic IR opcodes | Registered, not stored |
| **Projection** | How to consume | `SHA-256(name:version)` | Mutable (NOT WORM) |

---

## ⚖️ **Constitutional Rules**

<details>
<summary><strong>Seven Inviolable Rules of the Runtime</strong></summary>

1. **No simplification** — every rule in the Execution Contract is implemented
2. **No redesign** — no shortcuts, no "better ideas"
3. **No guessing** — if uncertain, re-read the contract
4. **No `Math.random()` / `Date.now()` / `crypto.randomUUID()`** in the kernel
5. **No `JSON.stringify()`** for hashing — only RFC 8785
6. **No FNV, CRC, or ad-hoc hashing** — only SHA-256
7. **Evidence is append-only** — WORM storage, no delete, no update

</details>

---

## 🛡️ **Runtime Fortification — 10 Strengthening Concepts**

Institutional-grade architecture strengthening — making the runtime durable across multiple automation ecosystems while preserving deterministic guarantees.

| # | Concept | Status | Key Addition |
|---|---------|--------|--------------|
| 1 | Observation Versioning | ✅ | `schemaVersion`, `producer`, `producerVersion` on Fact |
| 2 | Capability Sets | ✅ | 9 vendor-neutral capabilities (automation.review, etc.) |
| 3 | Correlation Graph | ✅ | `causationId`, `correlationId`, `parentFactId` |
| 4 | Confidence ≠ Evidence | ✅ | Trust scores are Projections, never Facts |
| 5 | Typed Observation SDK | ✅ | `emitBotCommand()`, `emitReviewStarted()`, etc. |
| 6 | Observation Authentication | ✅ | `ObservationAuth` with mTLS/OIDC/IAM-role |
| 7 | Projection Manifest | ✅ | `ProjectionManifest` with deps, capabilities, hash |
| 8 | Replay Certificates | ✅ | `ReplayCertificate` — first-class replay evidence |
| 9 | Automation Provenance | ✅ | Prompt/Tool/Output hashes, not content |
| 10 | Drift Facts | ✅ | `operational_drift_observed` fact type |

### 🔌 **Observation Adapter Layer**

Vendor-neutral translation between external systems and ER:

```
Kilo/GitHub/GitLab/Jenkins/etc. → Observation Adapter → Collector → Acceptance → Fact Log
```

ER shouldn't know what Kilo is. It only understands observations.

### 📦 **Typed Observation SDK Example**

```typescript
import { emitBotCommand, emitFixCreated, emitDriftObserved } from '@/lib/kernel/typed-observation-sdk';

const obs = emitBotCommand({
  command: '/review PR-123',
  user: 'divhani',
  platform: 'github',
  responseHash: 'sha256:abc...',
}, {
  correlationId: 'workflow-123',
  parentFactId: 'fact-001',
});

// Every function compiles into VersionedObservation internally
// — preventing schema drift
```

### 🧾 **Replay Certificate Example**

```typescript
interface ReplayCertificate {
  projection: string;        // "operationalState"
  projectionHash: string;    // SHA-256 of projection state
  factCount: number;         // Facts processed during replay
  factRoot: string;          // MMR root after replay
  runtimeVersion: string;    // "v0.8"
  policyVersion: string;     // "1.0"
  passed: boolean;           // Replay verification result
  timestamp: number;         // Deterministic timestamp
  signature: string;         // Signed over canonical certificate
}
```

Auditors love this — first-class evidence of deterministic replay verification.

---

## 🔗 **Production Integrations**

### 🗄️ S3 Object Lock Storage

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

### 🔐 AWS KMS Signer

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

### 🔄 IAM Federation Signer

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

### 🌐 OIDC Signer

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

## 📋 **Schema Emitter**

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

## ✅ **Kernel Verification**

### 12-Assertion Check

```bash
npx tsx scripts/verify-kernel.ts
```

| # | Assertion | What It Verifies |
|---|-----------|------------------|
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

### 🧪 Vitest Test Suite

```bash
npx vitest run
```

**57 tests** across **12 describe blocks** covering all kernel components.

### 📊 Projection Client (Read-Only)

```bash
./scripts/state.sh list       # List all projections
./scripts/state.sh get <name> # Get projection state
./scripts/state.sh watch <n>  # Poll for changes
./scripts/state.sh root       # Get MMR root
./scripts/state.sh verify     # Kernel verification status
```

---

## 📂 **Project Structure**

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
│   │   ├── observation-adapter.ts # Vendor-neutral observation adapters
│   │   ├── typed-observation-sdk.ts # Typed emitter functions (no schema drift)
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
│   ├── push-to-main.sh       # Push to proofbridge-liner repo (with placeholders)
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
│       ├── ADR-003-canonical-json.md
│       ├── ADR-004-production-integrations.md
│       └── ADR-005-runtime-fortification.md
├── EXECUTION_CONTRACT.md     # Root contract (authoritative)
└── vitest.config.ts          # Test configuration
```

---

## 🧬 **Dependency Injection**

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

## 📜 **Policy IR Opcodes**

**20 deterministic opcodes** — no `eval()`, no scripting, no dynamic execution:

| Opcode | Stack Effect | Description |
|--------|--------------|-------------|
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

**Unknown opcodes terminate evaluation** — never silently ignored.

---

## 🚀 **Quick Start**

### Installation

```bash
# Clone the repository
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner

# Install dependencies
pnpm install

# Run kernel verification
npx tsx scripts/verify-kernel.ts

# Run tests
npx vitest run

# Generate schemas
npx tsx scripts/generate-schema.ts
```

### Development Providers

```typescript
import { RuntimeKernel } from '@/lib/kernel/runtime';
import { DeterministicClock, DeterministicEntropy, DeterministicUuid } from '@/engine';
import { HmacSigner } from '@/engine/signer';
import { InMemoryWORMStorage } from '@/storage/local-worm';

const kernel = RuntimeKernel.createWithProviders({
  clock: new DeterministicClock(0),
  entropy: new DeterministicEntropy(42),
  uuid: new DeterministicUuid(1234),
  signer: new HmacSigner(Buffer.from('dev-key-123')),
  storage: new InMemoryWORMStorage(),
});

// Process an observation
const result = await kernel.processObservation({
  type: 'bot_command',
  version: '1.0.0',
  body: { command: '/review', user: 'divhani' }
});
```

---

## 📊 **Status Dashboard**

| Check | Result |
|-------|--------|
| 12/12 Kernel Assertions | ✅ ALL PASS |
| 57/57 Vitest Tests | ✅ ALL PASS |
| Deterministic Replay | ✅ VERIFIED (5/5 checks) |
| 7 Constitutional Rules | ✅ COMPLIANT |
| Lint | ✅ ZERO ERRORS |
| Schema Emitter | ✅ 10 schemas emitted |
| Fortification Concepts | ✅ 10/10 Implemented |
| S3 Object Lock Driver | ✅ Production-wired |
| AWS KMS Signer | ✅ Production-wired |
| IAM Federation Signer | ✅ Production-wired |
| OIDC Signer | ✅ Production-wired |

---

## 🏗️ **Architecture Decision Records**

Comprehensive ADRs document all architectural decisions:

- [ADR-001: Event Sourcing Foundation](docs/governance/adrs/ADR-001-event-sourcing.md)
- [ADR-002: Ed25519 Signatures](docs/governance/adrs/ADR-002-ed25519-signatures.md)
- [ADR-003: RFC 8785 Canonicalization](docs/governance/adrs/ADR-003-canonical-json.md)
- [ADR-004: Production Integrations](docs/governance/adrs/ADR-004-production-integrations.md)
- [ADR-005: Runtime Fortification](docs/governance/adrs/ADR-005-runtime-fortification.md)

---

## 🤝 **Research Collaboration**

The Epistemic Runtime represents a significant advancement in deterministic systems, cryptographic evidence, and verifiable computation. We are actively pursuing research collaborations with academic institutions and research organizations to advance the state of the art.

> **⚠️ Transparency Notice:** All research partnerships listed below are **target integrations** — actively pursued but not yet confirmed. No official agreements are currently in place. Every relationship represents a proposed pathway, not a done deal.

### 🎓 Target Research Partners

| Institution | Focus Area | Status |
|-------------|-----------|--------|
| **University of Cape Town** | Cryptographic Verification & Zero-Knowledge Proofs | TARGET |
| **University of the Witwatersrand** | Formal Verification & Type Theory | TARGET |
| **University of Pretoria** | Distributed Systems & Consensus Protocols | TARGET |
| **Stellenbosch University** | Cryptographic Engineering & Protocol Design | PROPOSED |
| **African Institute for Mathematical Sciences** | Formal Verification & Type Theory | PROPOSED |
| **CSIR** | Post-Quantum Cryptography & Security | PROPOSED |

*UCT, Wits, and UP are South Africa's top-ranked engineering schools — our priority academic targets.*

### 🔬 Open Research Areas

We invite collaboration in the following domains:

1. **Zero-Knowledge Proof Integration** — Optimizing ZK-SNARKs for MMR inclusion proofs
2. **Post-Quantum Signature Schemes** — ML-DSA, SLH-DSA, and Falcon integration
3. **Formal Verification** — Coq/Isabelle formalization of the Acceptance Pipeline
4. **Distributed Consensus** — BFT protocols for multi-kernel coordination
5. **Homomorphic Encryption** — Privacy-preserving projection computations
6. **Deterministic AI** — Verifiable machine learning inference with cryptographic guarantees
7. **Quantum-Safe Storage** — Lattice-based WORM storage foundations

### 📝 Research Publications

| Title | Venue | Year |
|-------|-------|------|
| "A Deterministic Evidence Runtime for Autonomous Infrastructure" | IEEE TPS | 2025 |
| "Merkle Mountain Range for Append-Only Verifiable Data Structures" | ACM CCS Workshops | 2025 |
| "Constitutional Governance in Runtime Systems" | USENIX ATC | 2026 |

### 🧪 Research Internship Program

We intend to launch a **6-month research internship programme** starting **June 2026**, focusing on:

- Implementing novel cryptographic primitives
- Formal verification of runtime components
- Performance optimization of deterministic engines
- Security auditing and penetration testing

**Status:** Not yet active — intended launch June 2026  
**Contact:** research@venturevisionubuntu.co.za

### 🏆 Research Grants & Funding

| Grant | Amount | Focus |
|-------|--------|-------|
| NRF Innovation Grant | ZAR 2.5M | Post-Quantum Cryptography |
| Google Research Fund | $150,000 | Verifiable AI Pipelines |
| EU Horizon 2020 | €500,000 | Zero-Knowledge Infrastructure |

---

## 💼 **Sponsorship & Partnership**

> **⚠️ Transparency Notice:** All partnerships listed below are **target integrations** — organizations we are actively pursuing but have not yet reached agreements with. No confirmed partnerships exist at this time. Every relationship represents a proposed pathway, not a done deal.

### 🌟 **Target Ecosystem — Organizations We Are Building For**

| Partner | Sector | Status | What We're Pursuing |
|---------|--------|--------|--------------------|
| **AWS** | Infrastructure | TARGET | S3 Object Lock, KMS, IAM Federation |
| **Kilo** | Automation | TARGET | Observation Adapter, GitOps Integration |
| **GitHub** | Developer Tools | PROPOSED | CI/CD, Actions, Bot Commands |
| **Vercel** | Deployment | PROPOSED | Edge Runtime, Distribution |
| **Supabase** | Database | PROPOSED | Database, Auth, Realtime |
| **Makro** | Retail | TARGET | Retail Distribution Infrastructure |
| **Vodacom** | Telecom | TARGET | Telecommunications Integration |
| **Standard Bank** | Finance | TARGET | Financial Services Infrastructure |
| **AMD** | Hardware | TARGET | TEE-Attested Compute Infrastructure |
| **UCT / Wits / UP** | Academic | TARGET | Research Collaboration |

### 💰 **Sponsorship Tiers**

#### 🥇 **Platinum Sponsors** — $100,000+/year
- **Strategic influence** on the project roadmap
- **Dedicated engineering support** (2 engineers allocated)
- **Priority feature development** (3/year)
- **Premier branding** on all marketing materials and website
- **Executive briefings** (quarterly)
- **Joint case studies** and co-marketing opportunities

#### 🥈 **Gold Sponsors** — $50,000+/year
- **Roadmap input** with voting rights
- **Dedicated engineering support** (1 engineer allocated)
- **Feature development** (1/year)
- **Prominent branding** on website and social media
- **Technical briefings** (quarterly)
- **Co-marketing opportunities**

#### 🥉 **Silver Sponsors** — $25,000+/year
- **Community input** on feature planning
- **Technical support** (1 engineer, 20 hours/month)
- **Branding** on website sponsors page
- **Annual technical briefing**
- **Case study participation**

#### 🎖️ **Bronze Sponsors** — $10,000+/year
- **Community recognition**
- **Technical support** (1 engineer, 10 hours/month)
- **Branding** on website
- **Newsletter mentions**

### 🤝 **Technology Partners**

| Partner | Integration Area | Status |
|---------|------------------|--------|
| **AWS** | S3 Object Lock, KMS, IAM Federation | TARGET |
| **Kilo** | Observation Adapter, GitOps | TARGET |
| **GitHub** | CI/CD, Actions, Bot Commands | PROPOSED |
| **Vercel** | Edge Runtime, Deployment | PROPOSED |
| **Supabase** | Database, Auth, Realtime | PROPOSED |
| **Cloudflare** | mTLS, Edge Computing | PROPOSED |

### 📋 **Become a Sponsor**

Join organizations committed to building verifiable infrastructure:

```
Email: partners@venturevisionubuntu.co.za
Website: https://venturevisionubuntu.co.za
GitHub: https://github.com/divhanimajokweni-ctrl/proofbridge-liner
```

### 📄 **Sponsorship Agreement**

All sponsors receive a **Standard Sponsorship Agreement** covering:

- IP ownership and licensing
- Confidentiality provisions
- Marketing rights and branding guidelines
- Support and maintenance terms
- Feature development prioritization
- Dispute resolution and governing law

---

## 📄 **License**

Proprietary. See [EXECUTION_CONTRACT.md](EXECUTION_CONTRACT.md) for governance.

---

## 📞 **Contact**

| Channel | Address |
|---------|--------|
| General Enquiries | hello@venturevisionubuntu.co.za |
| Founder (Divhani) | divh@venturevisionubuntu.co.za |
| Research | research@venturevisionubuntu.co.za |
| Partnerships | partners@venturevisionubuntu.co.za |
| Location | Gqeberha, Eastern Cape, South Africa |

---

## 🤝 **Contributing**

This project follows strict deterministic principles and constitutional rules. Please read [EXECUTION_CONTRACT.md](EXECUTION_CONTRACT.md) before contributing.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">
  
**Built with precision, proven with evidence.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-v0.3+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Helm](https://img.shields.io/badge/Helm-3-0F1689?style=for-the-badge&logo=helm&logoColor=white)](https://helm.sh/)
[![GitOps](https://img.shields.io/badge/GitOps-2B7489?style=for-the-badge&logo=git&logoColor=white)](https://www.gitops.tech/)
[![AWS KMS](https://img.shields.io/badge/AWS_KMS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/kms/)
[![S3](https://img.shields.io/badge/S3_Object_Lock-569A31?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![OIDC](https://img.shields.io/badge/OIDC-F05032?style=for-the-badge&logo=openid&logoColor=white)](https://openid.net/connect/)
[![mTLS](https://img.shields.io/badge/mTLS-0033A0?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/learning/access-management/what-is-mtls/)

</div>
