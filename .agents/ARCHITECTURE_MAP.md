# Architecture Map — VVU Earth Tech

## Directory Tree

```
vvu-earth-tech/
├── .agents/                          # Agent context and prompts
│   ├── SYSTEM_CONTEXT.md             # This project's overview
│   ├── ARCHITECTURE_MAP.md           # This file
│   ├── CODING_STANDARDS.md           # Coding standards
│   ├── SECURITY_RULES.md             # Security rules
│   ├── PRODUCT_VISION.md             # Product vision
│   ├── TASK_QUEUE.md                 # Current task priorities
│   ├── KNOWN_LIMITATIONS.md          # Known limitations
│   ├── RELEASE_STATE.md              # Release state
│   └── PROMPTS/                      # Agent prompts
│       ├── reviewer.md
│       ├── implementer.md
│       ├── security_auditor.md
│       ├── performance_engineer.md
│       └── release_manager.md
├── .github/                          # GitHub configuration
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── commercial/                       # Commercial (licensed) modules
│   ├── feature-gate.ts               # License-tier feature gating
│   ├── tee-attestation/              # TEE attestation (NOT_IMPLEMENTED)
│   ├── zk-prover-gpu/                # ZK prover GPU (NOT_IMPLEMENTED)
│   ├── compliance-automation/        # Compliance automation (NOT_IMPLEMENTED)
│   └── enterprise-sso/              # Enterprise SSO (NOT_IMPLEMENTED)
├── docs/                             # Project documentation
│   └── governance/adrs/              # Architecture Decision Records
│       ├── ADR-001-event-sourcing.md
│       ├── ADR-002-ed25519-signatures.md
│       ├── ADR-003-canonical-json.md
│       ├── ADR-004-production-integrations.md
│       └── ADR-005-runtime-fortification.md
├── open-source/                      # Open-source modules
│   ├── air-kernel/                   # AIR Runtime kernel
│   ├── epistemic-runtime/            # Epistemic Runtime re-export
│   ├── safe-krypte-basic/            # Signer primitives
│   ├── safe-liner-basic/             # DPI proxy placeholder
│   ├── hbk-adapter/                  # HBK adapter
│   └── earth-tech-ui/               # Shared UI components
├── schemas/                          # Generated JSON Schemas (Draft 2020-12)
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
├── scripts/                          # Build, verification, deployment
│   ├── verify-kernel.ts              # 12-assertion kernel verification
│   ├── generate-schema.ts            # Schema emitter
│   ├── push-to-main.sh              # Push to proofbridge-liner
│   ├── state.sh                      # Read-only projection client
│   ├── deploy.sh                     # Deployment script
│   ├── golden-rule-checker.js        # Import boundary enforcement
│   ├── enforce-boundaries.sh         # Boundary enforcement script
│   ├── check-licenses.sh             # License header checker
│   ├── inject-license-headers.sh     # License header injection
│   └── inject-kernel-headers.sh      # Kernel header injection
├── shared/                           # Shared modules
│   ├── license/                      # License schema, validator, signing
│   ├── types/                        # Shared TypeScript types
│   ├── vetps/                        # VETPs schema
│   ├── verifiers/                    # Verifier interfaces
│   ├── protocols/                    # Protocol definitions
│   └── tenant/                       # Multi-tenant identity
├── src/                              # Next.js Dashboard (Frontend)
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── kernel/               # Kernel verification API
│   │   │   ├── policies/             # Policy management API
│   │   │   ├── proofs/               # Proof generation API
│   │   │   ├── metrics/              # Metrics API
│   │   │   ├── resilience/           # Resilience API (Circuit Breaker)
│   │   │   ├── acceptance-engine/    # Acceptance pipeline API
│   │   │   ├── simulation/           # Simulation API
│   │   │   ├── vvu-strategy/         # VVU Strategy API
│   │   │   └── validation-suite/     # Validation suite API
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Main page (VVU Shell)
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── epistemic/                # Epistemic Runtime components (20+)
│   │   ├── vvu/                      # VVU product components
│   │   │   ├── products.ts           # Product definitions
│   │   │   ├── vvu-shell.tsx         # Main shell
│   │   │   ├── trust-sphere.tsx      # Trust Sphere
│   │   │   ├── ubuntu-pools.tsx      # Ubuntu Pools
│   │   │   └── epistemic-runtime-dashboard.tsx
│   │   ├── simulation/               # Simulation dashboard
│   │   └── ui/                       # shadcn/ui components
│   ├── engine/                       # Dependency-injected providers
│   │   ├── clock.ts                  # DeterministicClock / SystemClock
│   │   ├── entropy.ts                # DeterministicEntropy (xorshift128+)
│   │   ├── uuid.ts                   # DeterministicUuid (SHA-256-based)
│   │   ├── signer.ts                 # HmacSigner / Ed25519Signer
│   │   └── storage.ts                # InMemoryWORMStorage
│   ├── hooks/                        # React hooks
│   ├── lib/                          # Core libraries
│   │   ├── kernel/                   # Core deterministic kernel
│   │   │   ├── types.ts              # Four primitives + interfaces
│   │   │   ├── hashing.ts            # SHA-256 engine
│   │   │   ├── canonicalization.ts   # RFC 8785 JCS
│   │   │   ├── mmr.ts                # Merkle Mountain Range
│   │   │   ├── sequencer.ts          # Deterministic sequence numbers
│   │   │   ├── schema-registry.ts    # Schema validation
│   │   │   ├── acceptance-pipeline.ts # Universal write gate
│   │   │   ├── policy-evaluator.ts   # Stack-based IR evaluator
│   │   │   ├── projection.ts         # Projection engine
│   │   │   ├── projection-registry.ts # Lifecycle tracking
│   │   │   ├── redaction.ts          # PII redaction
│   │   │   ├── operational-collector.ts # External observation sources
│   │   │   ├── observation-adapter.ts # Vendor-neutral adapters
│   │   │   ├── typed-observation-sdk.ts # Typed emitter functions
│   │   │   ├── replay.ts             # Deterministic replay engine
│   │   │   └── runtime.ts            # RuntimeKernel orchestrator
│   │   ├── crypto/                   # Crypto utilities
│   │   │   ├── hash.ts               # Hash utilities
│   │   │   ├── merkle.ts             # Merkle tree
│   │   │   └── receipts.ts           # Receipt generation
│   │   ├── evidence/                 # Evidence subsystem
│   │   │   ├── signer.ts             # Evidence signer
│   │   │   ├── envelope.ts           # Evidence envelope
│   │   │   ├── ledger.ts             # Evidence ledger
│   │   │   ├── hashing.ts            # Evidence hashing
│   │   │   ├── gate-envelope.ts      # Gate envelope
│   │   │   └── airEngine.ts          # AIR engine
│   │   ├── trust-runtime/            # Trust Runtime subsystem
│   │   │   ├── reducer.ts            # State reducer
│   │   │   ├── intent-aging.ts       # Intent aging
│   │   │   ├── command-handler.ts    # Command handler
│   │   │   ├── assess-reserve-commit.ts # ARC pattern
│   │   │   ├── bounded-store.ts      # Bounded store
│   │   │   ├── exposure-accumulator.ts # Exposure tracking
│   │   │   ├── gate-pipeline.ts      # Gate pipeline
│   │   │   ├── decay-counter.ts      # Decay counter
│   │   │   ├── risk-score-engine.ts  # Risk scoring
│   │   │   ├── velocity-monitor.ts   # Velocity monitoring
│   │   │   ├── distributed-kill-switch.ts # Kill switch
│   │   │   ├── circuit-breaker.ts    # Circuit breaker
│   │   │   ├── state-drift.ts        # State drift detection
│   │   │   ├── projection-manager.ts # Projection management
│   │   │   ├── sse-transport.ts      # SSE transport
│   │   │   └── event-store.ts        # Event store
│   │   ├── resilience/               # Resilience subsystem
│   │   │   ├── manager.ts            # Resilience manager
│   │   │   ├── circuit-breaker.ts    # Circuit breaker
│   │   │   ├── hlc.ts                # Hybrid Logical Clock
│   │   │   ├── nats-queue.ts         # NATS queue
│   │   │   ├── csb.ts                # CSB
│   │   │   ├── wal-healing.ts        # WAL healing
│   │   │   └── policy-time-travel.ts # Policy time travel
│   │   ├── epd/                      # Epistemic Policy DSL
│   │   │   ├── tokenizer.ts          # Tokenizer
│   │   │   ├── parser.ts             # Parser
│   │   │   ├── ast.ts                # AST types
│   │   │   ├── validator.ts          # Validator
│   │   │   └── samples.ts            # Sample policies
│   │   ├── validation-suite/         # Validation suite
│   │   ├── vvu-strategy/             # VVU Strategy
│   │   ├── dashboard/                # Dashboard data mappings
│   │   ├── db.ts                     # Database client
│   │   └── utils.ts                  # Utility functions
│   ├── signer/                       # Production signer modules
│   │   ├── ed25519.ts                # Ed25519 signer
│   │   ├── ecdsa-p384.ts             # ECDSA P-384 signer
│   │   ├── rsa-pss.ts                # RSA-PSS signer
│   │   └── aws-kms.ts                # AWS KMS / IAM / OIDC
│   ├── storage/                      # Storage drivers
│   │   ├── s3-object-lock.ts         # S3 Object Lock (COMPLIANCE)
│   │   └── index.ts
│   └── __tests__/                    # Test suite
│       └── kernel/
│           └── deterministic-suite.test.ts
├── vvu-earth-ledger/                 # Python Ledger Service (Backend)
│   ├── src/production_ledger/        # Core ledger
│   │   ├── ledger.py                 # Main ledger class
│   │   ├── ed25519.py                # Ed25519 signatures
│   │   ├── mmr.py                    # Merkle Mountain Range
│   │   ├── crypto.py                 # Crypto operations
│   │   ├── hashing.py                # SHA-256 hashing
│   │   ├── serializer.py             # RFC 8785 serialization
│   │   ├── proofs.py                 # Proof generation
│   │   ├── storage.py                # Storage abstraction
│   │   ├── config.py                 # Configuration
│   │   ├── api.py                    # API endpoints
│   │   ├── cli.py                    # CLI interface
│   │   ├── replay.py                 # Replay engine
│   │   ├── snapshots.py              # Snapshot management
│   │   ├── quorum.py                 # Quorum management
│   │   ├── replication.py            # Replication
│   │   ├── replication_protocol.py   # Replication protocol
│   │   ├── migrations.py             # Schema migrations
│   │   ├── envelopes.py              # Envelope handling
│   │   ├── audit.py                  # Audit logging
│   │   ├── metrics.py                # Metrics collection
│   │   ├── validator_registry.py     # Validator registry
│   │   ├── tracing.py                # Distributed tracing
│   │   ├── logging.py                # Logging configuration
│   │   ├── exceptions.py             # Custom exceptions
│   │   ├── constants.py              # Constants
│   │   └── version.py                # Version info
│   ├── tests/                        # Test suite
│   │   ├── unit/                     # Unit tests
│   │   ├── integration/              # Integration tests
│   │   ├── crypto/                   # Crypto tests
│   │   ├── benchmarks/               # Performance benchmarks
│   │   ├── replay/                   # Replay tests
│   │   └── adversarial/              # Adversarial tests
│   ├── configs/                      # Configuration files
│   │   ├── development.toml
│   │   ├── staging.toml
│   │   └── production.toml
│   ├── docs/                         # Ledger documentation
│   ├── scripts/                      # Ledger scripts
│   ├── Dockerfile                    # Container image
│   ├── docker-compose.yml            # Docker Compose
│   ├── Makefile                      # Build targets
│   └── pyproject.toml                # Python project config
├── validation/                       # VVU-VAL-001 validation protocol
│   └── VVU-VAL-001/
│       ├── protocol/                 # Protocol docs
│       ├── evidence/                 # Evidence collection
│       ├── chaos/                    # Chaos engineering
│       ├── scoreboard/              # Scoreboard
│       ├── kubernetes/               # K8s manifests
│       ├── outreach/                 # Outreach templates
│       ├── rehearsal/                # Rehearsal scripts
│       └── docs/                     # Runbooks
├── mini-services/                    # Mini service utilities
│   ├── sim-engine/                   # Simulation engine
│   └── epd-cli/                      # EPD CLI tool
├── prisma/                           # Prisma schema
│   └── schema.prisma
├── EXECUTION_CONTRACT.md             # Authoritative contract
├── package.json                      # Node.js project config
├── vitest.config.ts                  # Test configuration
├── tsconfig.json                     # TypeScript config
├── tsconfig.base.json                # Base TS config
├── tsconfig.oss.json                 # OSS boundary config
├── tsconfig.commercial.json          # Commercial boundary config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── eslint.config.mjs                 # ESLint config
├── postcss.config.mjs                # PostCSS config
├── components.json                   # shadcn/ui config
└── Caddyfile                         # Reverse proxy config
```

## Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                       VVU Shell (page.tsx)                       │
│                    ┌─────────────────┐                           │
│                    │  Product Tabs   │                           │
│                    │ (7 products)    │                           │
│                    └────────┬────────┘                           │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Trust Sphere  │  │ Epistemic RT │  │ Ubuntu Pools │          │
│  │  (Sphere 3D)  │  │  (20+ tabs)  │  │  (Stokvel)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            ▼                                     │
│              ┌─────────────────────────┐                         │
│              │   API Routes (Next.js)   │                         │
│              │  /api/kernel, /api/...   │                         │
│              └────────────┬────────────┘                         │
│                           │                                      │
│              ┌────────────┴────────────┐                         │
│              ▼                         ▼                         │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Runtime Kernel   │    │  Python Ledger   │                   │
│  │  (TypeScript)     │    │  (gRPC/HTTP)     │                   │
│  │  ┌────────────┐  │    │  ┌────────────┐  │                   │
│  │  │Acceptance  │  │    │  │  Ledger     │  │                   │
│  │  │Pipeline    │  │    │  │  Engine     │  │                   │
│  │  └─────┬──────┘  │    │  └─────┬──────┘  │                   │
│  │        ▼         │    │        ▼         │                   │
│  │  ┌────────────┐  │    │  ┌────────────┐  │                   │
│  │  │ MMR + Proofs│  │    │  │ MMR + Proofs│  │                   │
│  │  └─────┬──────┘  │    │  └─────┬──────┘  │                   │
│  │        ▼         │    │        ▼         │                   │
│  │  ┌────────────┐  │    │  ┌────────────┐  │                   │
│  │  │ Signers    │  │    │  │ Ed25519    │  │                   │
│  │  │ (DI)       │  │    │  │ + SHA-256  │  │                   │
│  │  └─────┬──────┘  │    │  └─────┬──────┘  │                   │
│  │        ▼         │    │        ▼         │                   │
│  │  ┌────────────┐  │    │  ┌────────────┐  │                   │
│  │  │ Storage    │  │    │  │ Storage    │  │                   │
│  │  │ (WORM/DI)  │  │    │  │ (SQLite)   │  │                   │
│  │  └────────────┘  │    │  └────────────┘  │                   │
│  └──────────────────┘    └──────────────────┘                   │
│           │                        │                             │
│           └────────────┬───────────┘                             │
│                        ▼                                         │
│              ┌──────────────────┐                                │
│              │  S3 Object Lock  │                                │
│              │  (COMPLIANCE)    │                                │
│              └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Observation → Acceptance Pipeline → Fact → MMR Insert → Proof Generation → WORM Storage
     │              │ 11-step gate       │          │            │               │
     │              ├───────────────────┤│          │            │               │
     │              │1. Schema Validate ││          │            │               │
     │              │2. Policy Evaluate ││          │            │               │
     │              │3. PII Redaction   ││          │            │               │
     │              │4. RFC 8785 Canon  ││          │            │               │
     │              │5. SHA-256 Hash    ││          │            │               │
     │              │6. Fact ID Assign  ││          │            │               │
     │              │7. Sequence Number ││          │            │               │
     │              │8. Ed25519 Sign    ││          │            │               │
     │              │9. MMR Append      ││          │            │               │
     │              │10. Proof Generate ││          │            │               │
     │              │11. WORM Persist   ││          │            │               │
     │              └───────────────────┘│          │            │               │
     │                                   │          │            │               │
     └───────────────────────────────────┴──────────┴────────────┴───────────────┘
                                         │
                                         ▼
                                   Projection Engine
                                   (Mutable read models)
```

## API Surface

### Next.js API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/kernel` | GET | Kernel status and configuration |
| `/api/kernel/verify` | POST | Run 12-assertion kernel verification |
| `/api/policies` | GET | List policies |
| `/api/policies/[id]` | GET | Get specific policy |
| `/api/proofs` | GET | List proofs |
| `/api/metrics` | GET | System metrics |
| `/api/resilience` | GET | Resilience status |
| `/api/resilience/circuit-breaker` | GET | Circuit breaker state |
| `/api/acceptance-engine` | GET | Acceptance pipeline status |
| `/api/simulation` | GET | Simulation status |
| `/api/validation-suite` | GET | Validation suite status |
| `/api/vvu-strategy` | GET | VVU Strategy data |
| `/api/stats` | GET | General statistics |
| `/api/audit` | GET | Audit log |
| `/api/timeline` | GET | Event timeline |
| `/api/shards` | GET | Shard status |
| `/api/merges` | GET | Merge status |
| `/api/merges/simulate` | POST | Simulate merge |
| `/api/search` | GET | Global search |
| `/api/export` | GET | Export data |
| `/api/fortification` | GET | Fortification status |
| `/api/convergence` | GET | Convergence status |
| `/api/shadow-bridge` | GET | Shadow bridge status |
| `/api/trust-runtime` | GET | Trust runtime status |
| `/api/system` | GET | System status |
| `/api/architecture` | GET | Architecture info |
| `/api/migration` | GET | Migration status |
| `/api/contact` | POST | Contact form |

### Python Ledger API (Planned)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/ledger/append` | POST | Append fact to ledger |
| `/v1/ledger/proof/{fact_id}` | GET | Get proof for fact |
| `/v1/ledger/verify/{fact_id}` | GET | Verify fact and proof |
| `/v1/ledger/root` | GET | Get current MMR root |
| `/v1/ledger/snapshot` | GET | Get ledger snapshot |
| `/v1/health` | GET | Health check |

## Database Schema

### Prisma Schema (PostgreSQL / SQLite)

Key models:
- **User**: Authentication and authorization
- **Session**: Session management
- **Account**: OAuth accounts
- **VerificationToken**: Email verification

### Python Ledger Storage

- **Facts**: Append-only fact log with Ed25519 signatures
- **Proofs**: MMR inclusion proofs
- **Snapshots**: Periodic ledger snapshots
- **AuditLog**: Audit trail entries

## Service Boundaries

| Service | Technology | Responsibility |
|---------|-----------|----------------|
| **Dashboard** | Next.js 16 | UI rendering, API gateway, SSR |
| **Ledger** | Python 3.11+ | Fact append, MMR, proofs, signing |
| **Simulation Engine** | Bun/TypeScript | 72h simulation, HBK twin |
| **EPD CLI** | Bun/TypeScript | Policy DSL parsing and validation |
| **Database** | PostgreSQL/SQLite | Persistent storage |
| **Object Storage** | AWS S3 | WORM evidence storage |
| **Key Management** | AWS KMS | Signing key management |

## Deployment Topology

```
                    ┌─────────────────────┐
                    │   CloudFlare / CDN   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Caddy (reverse   │
                    │     proxy, TLS)      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼────────┐ ┌────▼─────┐ ┌───────▼───────┐
    │  Next.js          │ │ Python   │ │  S3 Object    │
    │  Dashboard        │ │ Ledger   │ │  Lock         │
    │  (Port 3000)      │ │ (gRPC)   │ │  (COMPLIANCE) │
    └─────────┬────────┘ └────┬─────┘ └───────────────┘
              │                │
              │         ┌──────▼──────┐
              │         │  PostgreSQL │
              │         │  / SQLite   │
              │         └─────────────┘
              │
    ┌─────────▼────────┐
    │  AWS KMS         │
    │  (Signing Keys)  │
    └──────────────────┘
```
