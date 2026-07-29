# VVU Earth Tech Ledger — System Architecture

## 1. Overview

The VVU Earth Tech Ledger is a **deterministic, cryptographically verifiable production ledger** designed for environments where data integrity, auditability, and replay verification are non-negotiable. Every entry appended to the ledger is:

1. **Cryptographically signed** using Ed25519 with domain-separated hashing
2. **Hash-chained** into an append-only sequence linked by envelope hashes
3. **Merkle-indexed** via a Merkle Mountain Range (MMR) for efficient inclusion and consistency proofs
4. **Replay-verifiable** — the entire ledger can be reconstructed from genesis and every integrity property checked independently

The ledger is designed for **deterministic replay**: given the same sequence of entries, any verifier can independently reconstruct the identical state and verify all hashes, signatures, and proofs.

## 2. Component Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[CLI<br/>cli.py]
        API[REST API<br/>api.py]
    end

    subgraph "Ledger Core"
        LEDGER[Ledger Engine<br/>ledger.py]
        ENV[Envelope Builder<br/>envelopes.py]
        PROOF[Proof Engine<br/>proofs.py]
        REPLAY[Replay Engine<br/>replay.py]
    end

    subgraph "Cryptographic Layer"
        SIGNER[Ed25519 Signer<br/>ed25519.py]
        KEYSTORE[Key Store<br/>ed25519.py]
        HASHING[Domain Hashing<br/>hashing.py]
        CRYPTO[Crypto Engine<br/>crypto.py]
        SERIALIZER[Canonical Serializer<br/>serializer.py]
    end

    subgraph "Consensus Layer"
        VREG[Validator Registry<br/>validator_registry.py]
        QUORUM[Quorum Verifier<br/>quorum.py]
    end

    subgraph "Storage Layer"
        STORAGE[Ledger Storage<br/>storage.py]
        MIGRATIONS[Migration Manager<br/>migrations.py]
        SNAPSHOTS[Snapshot Manager<br/>snapshots.py]
        DB[(SQLite WAL<br/>Hardened)]
    end

    subgraph "MMR Layer"
        MMR[Merkle Mountain Range<br/>mmr.py]
    end

    subgraph "Observability"
        AUDIT[Audit Logger<br/>audit.py]
        LOGGING[Structured Logger<br/>logging.py]
        TRACING[Distributed Tracer<br/>tracing.py]
        METRICS[Metrics Collector<br/>metrics.py]
    end

    subgraph "Replication"
        REPMGR[Replication Manager<br/>replication.py]
        REPPROTO[Replication Protocol<br/>replication_protocol.py]
    end

    CLI --> LEDGER
    API --> LEDGER
    LEDGER --> ENV
    LEDGER --> MMR
    LEDGER --> VREG
    LEDGER --> QUORUM
    LEDGER --> STORAGE
    LEDGER --> SNAPSHOTS
    LEDGER --> PROOF
    ENV --> SIGNER
    ENV --> HASHING
    ENV --> SERIALIZER
    SIGNER --> KEYSTORE
    CRYPTO --> SIGNER
    CRYPTO --> HASHING
    MMR --> HASHING
    PROOF --> MMR
    REPLAY --> STORAGE
    REPLAY --> MMR
    REPLAY --> VREG
    STORAGE --> DB
    MIGRATIONS --> STORAGE
    SNAPSHOTS --> STORAGE
    SNAPSHOTS --> SERIALIZER
    REPMGR --> LEDGER
    REPPROTO --> REPMGR
    LEDGER --> AUDIT
    LEDGER --> METRICS
```

## 3. Domain Separation — The Eight Domains

The system is partitioned into eight cryptographic domains, each with a unique prefix. Domain separation ensures that hashes and signatures computed under one domain are cryptographically independent from those computed under any other domain, even if the underlying data is identical.

| Domain | Prefix | Purpose |
|--------|--------|---------|
| **Payload** | `VVU:PAYLOAD:1:` | Hashing raw payload data |
| **Envelope** | `VVU:ENVELOPE:1:` | Hashing envelope pre-images |
| **Revision** | `VVU:REVISION:1:` | Hashing payload+envelope composite; signing domain |
| **MMR Internal** | `VVU:MMR:INT:1:` | MMR leaf and branch node hashing |
| **MMR Bagging** | `VVU:MMR:BAG:1:` | MMR peak bagging (root computation) |
| **Snapshot** | `VVU:SNAP:1:` | Snapshot integrity hashing |
| **Replay** | `VVU:REPLAY:1:` | Replay verification context |
| **Proof** | `VVU:PROOF:1:` | Proof integrity hashing |

Additionally, `VVU:KEYROT:1:` is used for key rotation operations.

The domain hash construction is:

```
domain_hash(domain, data) = SHA-256(domain ‖ len(domain)₄ ‖ data)
```

Where `len(domain)₄` is the domain length as a 4-byte big-endian unsigned integer.

## 4. Data Flow

### 4.1 Append Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant L as Ledger
    participant EB as EnvelopeBuilder
    participant S as Ed25519Signer
    participant M as MMR
    participant DB as Storage

    C->>L: append(payload, signatures?)
    L->>L: Increment sequence
    L->>L: Get parent_hash (last envelope_hash or GENESIS_HASH)
    L->>EB: build(sequence, parent_hash, payload)
    EB->>EB: hash_payload(payload) → payload_hash
    EB->>EB: canonical_encode({seq, parent_hash, payload_hash, timestamp}) → pre_image
    EB->>EB: hash_envelope(pre_image) → envelope_hash
    EB->>EB: hash_revision(payload_hash + envelope_hash) → revision_hash
    EB->>S: sign(DOMAIN_REVISION, revision_hash)
    S-->>EB: Signature
    EB-->>L: Envelope
    L->>L: Verify quorum (if signatures provided)
    L->>M: append(envelope_hash)
    M->>M: Update peaks, compute new root
    L->>DB: INSERT INTO entries (...)
    L->>L: Update in-memory state
    L-->>C: Envelope
```

### 4.2 Verification Flow

```mermaid
sequenceDiagram
    participant V as Verifier
    participant R as ReplayEngine
    participant DB as Storage
    participant M as MMR

    V->>R: replay(from_sequence, to_sequence)
    R->>DB: Load entries in sequence order
    loop For each entry
        R->>R: Verify sequence continuity
        R->>R: Verify parent chain
        R->>R: Verify payload hash
        R->>R: Verify envelope hash
        R->>R: Verify revision hash
        R->>R: Verify signature (64-byte structural check)
    end
    R->>M: Rebuild MMR from entries
    R->>R: Compare rebuilt root vs stored root
    R->>R: Verify validator history
    R->>R: Verify schema versions
    R-->>V: ReplayResult
```

### 4.3 Proof Generation Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant PE as ProofEngine
    participant L as Ledger
    participant M as MMR

    C->>PE: generate_inclusion_proof(sequence)
    PE->>L: get_entry(sequence)
    L-->>PE: Envelope
    PE->>L: get_proof(sequence)
    L->>M: inclusion_proof(leaf_pos)
    M-->>L: MMRProof
    L-->>PE: MMRProof
    PE->>L: get_mmr_root()
    L-->>PE: root
    PE-->>C: InclusionProof
```

## 5. Trust Boundaries

```mermaid
graph LR
    subgraph "Trusted Zone"
        CORE[Ledger Core<br/>Signing, MMR, Hashing]
        DB[(SQLite DB)]
        KEYS[Key Store<br/>Private Keys]
    end

    subgraph "Semi-Trusted Zone"
        API[REST API]
        CLI[CLI Interface]
        REPLICATION[Replication Protocol]
    end

    subgraph "Untrusted Zone"
        CLIENT[External Clients]
        NETWORK[Network]
        PEERS[Peer Nodes]
    end

    CLIENT -->|HTTP/JSON| API
    CLIENT -->|Process| CLI
    PEERS -->|Sync Protocol| REPLICATION
    API -->|Validated calls| CORE
    CLI -->|Validated calls| CORE
    REPLICATION -->|Parsed entries| CORE
    CORE -->|Encrypted at rest| DB
    CORE -->|Never exposed| KEYS
```

### Trust Boundary Rules

1. **Private keys never leave the Trusted Zone** — the `KeyPair.signing_key` field is never exposed outside the `ed25519` module.
2. **All external inputs are validated** — the API and CLI validate all inputs before passing them to the core.
3. **Replication entries are parsed but not directly applied** — the `handle_sync_response` method currently returns 0 because the hash chain must be preserved through the normal append path.
4. **Database is accessed only through `LedgerStorage`** — no raw SQL is executed outside the storage layer.

## 6. Module Decomposition

### 6.1 Core Modules

| Module | Responsibility |
|--------|---------------|
| `serializer` | Deterministic canonical binary encoding/decoding with version header `VVU\x01` |
| `hashing` | Domain-separated SHA-256 hashing with protocol-specific convenience functions |
| `ed25519` | Ed25519 signing, verification, key management, rotation, and revocation |
| `mmr` | Merkle Mountain Range — append-only tree with inclusion and consistency proofs |
| `storage` | Hardened SQLite storage engine with production PRAGMAs |
| `config` | Frozen dataclass-based configuration system with TOML support |
| `constants` | Protocol constants, domain separation prefixes, and limits |
| `exceptions` | Complete exception hierarchy with machine-readable codes |

### 6.2 Application Modules

| Module | Responsibility |
|--------|---------------|
| `envelopes` | Envelope construction — hash chain computation and signing |
| `ledger` | Central coordinator — ties storage, signing, MMR, and validators together |
| `replay` | Replay engine — reconstructs and verifies the ledger from genesis |
| `proofs` | Proof engine — generates and verifies inclusion, consistency, and receipt proofs |
| `validator_registry` | Validator lifecycle — registration, revocation, key rotation, historical lookup |
| `quorum` | Quorum verification — checks if validator signatures achieve threshold |
| `snapshots` | Point-in-time state capture with integrity verification |
| `migrations` | Versioned database schema evolution |
| `api` | REST API layer (HTTP/JSON) |
| `cli` | Command-line interface |

### 6.3 Infrastructure Modules

| Module | Responsibility |
|--------|---------------|
| `logging` | Structured JSON logging with correlation IDs |
| `tracing` | Distributed tracing with span creation and OpenTelemetry output |
| `metrics` | Observability metrics (Prometheus exposition format) |
| `audit` | Audit logging for compliance |
| `replication` | Multi-node replication state management |
| `replication_protocol` | Replication wire protocol handler |
| `version` | Version information |

## 7. Configuration Architecture

All configuration is managed through frozen dataclasses with validation in `__post_init__`:

```mermaid
graph TD
    LC[LedgerConfig]
    LC --> DB[DatabaseConfig]
    LC --> CR[CryptoConfig]
    LC --> RC[ReplayConfig]
    LC --> VC[ValidatorConfig]
    LC --> LOG[LoggingConfig]
    LC --> MET[MetricsConfig]
    LC --> NET[NetworkConfig]
    LC --> SER[SerializerConfig]

    DB --> |journal_mode=wal| DB1
    DB --> |synchronous=full| DB2
    DB --> |busy_timeout=5000| DB3
    DB --> |secure_delete=ON| DB4
    DB --> |trusted_schema=OFF| DB5
    DB --> |foreign_keys=ON| DB6

    CR --> |hash_algorithm=sha256| CR1
    CR --> |key_rotation_interval=90d| CR2

    RC --> |verify_sequence| RC1
    RC --> |verify_mmr| RC2
    RC --> |verify_validator_history| RC3

    NET --> |port=50051| NET1
    NET --> |tls_enabled| NET2
    NET --> |mtls_enabled| NET3
```

Configuration can be loaded from:

1. **Default** — `LedgerConfig.default()` with production-safe values
2. **TOML** — `LedgerConfig.from_toml(path)` for environment-specific overrides

## 8. Error Handling Strategy

All exceptions inherit from `LedgerError` and carry:

- **Machine-readable code** — e.g., `HASH_DOMAIN_VIOLATION`, `DATABASE_NOT_OPEN`
- **Optional detail dict** — structured context for programmatic inspection
- **Proper hierarchy** — callers can catch at the appropriate granularity

```mermaid
graph TD
    LE[LedgerError]
    LE --> SE[SerializationError]
    LE --> HE[HashError]
    LE --> CE[CryptoError]
    LE --> ME[MMRError]
    LE --> STE[StorageError]
    LE --> RE[ReplayError]
    LE --> VE[ValidatorError]
    LE --> EE[EnvelopeError]
    LE --> CFG[ConfigError]

    SE --> DE[DepthExceededError]
    SE --> SXE[SizeExceededError]
    SE --> ITE[InvalidTypeError]

    HE --> DVE[DomainViolationError]
    HE --> HME[HashMismatchError]

    CE --> SIG[SignatureError]
    SIG --> ISE[InvalidSignatureError]
    SIG --> KNFE[KeyNotFoundError]
    SIG --> KEE[KeyExpiredError]

    ME --> IIE[InvalidIndexError]
    ME --> IPE[InvalidProofError]
    ME --> RME[RootMismatchError]

    STE --> DBE[DatabaseError]
    DBE --> DCFE[DBConnectionFailedError]
    DBE --> DBBE[DatabaseBusyError]
    DBE --> DCE[DatabaseCorruptError]
    DBE --> MFE[MigrationFailedError]
```

## 9. Database Schema

### 9.1 Tables

**metadata** — Key-value store for schema version and other metadata:

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PRIMARY KEY | Metadata key |
| value | TEXT NOT NULL | Metadata value |

**entries** — The append-only ledger:

| Column | Type | Description |
|--------|------|-------------|
| sequence | INTEGER PRIMARY KEY | Monotonically increasing sequence number |
| parent_hash | BLOB | 32-byte parent envelope hash |
| payload_hash | BLOB | 32-byte SHA-256 payload hash |
| envelope_hash | BLOB | 32-byte SHA-256 envelope hash |
| revision_hash | BLOB | 32-byte SHA-256 revision hash |
| mmr_position | INTEGER | MMR leaf position |
| created_at | REAL NOT NULL | POSIX timestamp |
| signature_key_id | BLOB | 4-byte signing key identifier |
| signature | BLOB | 64-byte Ed25519 signature |
| payload | BLOB | Raw payload data (added in v3) |
| key_version | INTEGER | Signing key version (added in v3) |

**validators** — Validator registry:

| Column | Type | Description |
|--------|------|-------------|
| key_id | BLOB PRIMARY KEY | 4-byte key identifier |
| public_key | BLOB NOT NULL | 32-byte Ed25519 public key |
| weight | INTEGER NOT NULL | Consensus weight |
| registration_sequence | INTEGER | Sequence when registered |
| revocation_sequence | INTEGER | Sequence when revoked (NULL if active) |
| key_version | INTEGER | Key version number |
| created_at | REAL NOT NULL | Registration timestamp |
| expires_at | REAL | Optional expiry timestamp |

**snapshots** — Point-in-time state captures:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| sequence | INTEGER NOT NULL | Ledger sequence at snapshot time |
| mmr_root | BLOB NOT NULL | MMR root hash |
| data | BLOB NOT NULL | Canonical-encoded snapshot data |
| created_at | REAL NOT NULL | Creation timestamp |
| hash | BLOB NOT NULL | Domain-separated integrity hash |

**mmr_nodes** — MMR node storage:

| Column | Type | Description |
|--------|------|-------------|
| position | INTEGER PRIMARY KEY | Node position in the MMR |
| hash | BLOB NOT NULL | 32-byte hash |

**audit_log** — Audit trail:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| sequence | INTEGER | Associated sequence number |
| event_type | TEXT NOT NULL | Event category |
| actor | TEXT | Triggering entity |
| target | TEXT | Event target |
| detail | TEXT | Additional context (JSON) |
| timestamp | REAL NOT NULL | Event timestamp |
| correlation_id | TEXT | Correlation ID |

### 9.2 Indexes

- `idx_entries_sequence` on `entries(sequence)`
- `idx_entries_payload_hash` on `entries(payload_hash)`
- `idx_validators_key_id` on `validators(key_id)`
- `idx_audit_log_sequence` on `audit_log(sequence)`

## 10. Hash Chain Construction

The hash chain is the fundamental integrity mechanism of the ledger:

```
payload_hash  = domain_hash(VVU:PAYLOAD:1:, payload)
pre_image     = canonical_encode({sequence, parent_hash, payload_hash, timestamp})
envelope_hash = domain_hash(VVU:ENVELOPE:1:, pre_image)
revision_hash = domain_hash(VVU:REVISION:1:, payload_hash + envelope_hash)
signature     = Ed25519.sign(domain_hash(VVU:REVISION:1:, revision_hash))
```

The timestamp is encoded as an 8-byte big-endian IEEE 754 double before being placed in the canonical encoding dict as bytes, since the canonical serializer does not support floats.

## 11. MMR Architecture

The Merkle Mountain Range is an append-only data structure that provides:

- **O(log n) inclusion proofs** — prove a specific entry exists
- **O(log n) consistency proofs** — prove the MMR at an earlier state is a prefix
- **O(1) root updates** — append-only with efficient recomputation

### Peak Discovery

Peaks are discovered by decomposing the leaf count into powers of 2:

```
size = 13 → 8 + 4 + 1 → peaks at heights 3, 2, 0
```

### Bagging Order

The root is computed by iteratively hashing peak pairs from right to left:

```
acc = peaks[-1]
for peak in peaks[-2::-1]:
    acc = domain_hash(VVU:MMR:BAG:1:, peak + acc)
```

### Node Hashing

- **Leaf nodes**: `domain_hash(VVU:MMR:INT:1:, 0x00 + leaf_hash)`
- **Branch nodes**: `domain_hash(VVU:MMR:INT:1:, 0x01 + left + right)`

## 12. Validator and Quorum System

### Validator Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Registered: register()
    Registered --> Active: registration_sequence <= current
    Active --> Revoked: revoke(key_id, sequence)
    Active --> Rotated: rotate_key(old_key_id, new_public_key)
    Rotated --> Active: New key registered with same weight
    Revoked --> [*]
```

### Quorum Verification

The quorum verifier checks whether a set of signatures achieves the required threshold:

- **Default threshold**: 2/3 of total validator weight (`ceil(0.67 * total_weight)`)
- **Minimum quorum**: 2 validators (configurable)
- **Duplicate rejection**: each validator's signature is counted only once

## 13. Observability Stack

```mermaid
graph LR
    subgraph "Collection"
        AUDIT[Audit Logger<br/>audit.py]
        LOG[Structured Logger<br/>logging.py]
        TRACE[Distributed Tracer<br/>tracing.py]
        MET[Metrics Collector<br/>metrics.py]
    end

    subgraph "Export"
        JSON[JSON Lines<br/>stderr/file]
        PROM[Prometheus<br/>/metrics endpoint]
        OTEL[OpenTelemetry<br/>format_otel()]
    end

    AUDIT -->|export_trail()| JSON
    LOG -->|JSON lines| JSON
    TRACE -->|format_otel()| OTEL
    MET -->|format_prometheus()| PROM
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `ledger_appends_total` | Counter | Total number of entries appended |
| `ledger_sequence` | Gauge | Current sequence number |
| `ledger_mmr_size` | Gauge | Current MMR leaf count |
| `ledger_validator_count` | Gauge | Number of active validators |
| `ledger_total_weight` | Gauge | Total validator weight |
| `append_duration_seconds` | Histogram | Time to append an entry |
| `verify_duration_seconds` | Histogram | Time to verify the chain |
| `replay_duration_ms` | Histogram | Time to replay the ledger |

## 14. Replication Architecture

The replication system is designed for eventual multi-node deployment:

```mermaid
graph LR
    subgraph "Node A"
        LA[Ledger A]
        RA[ReplicationManager A]
        RPA[ReplicationProtocol A]
    end

    subgraph "Node B"
        LB[Ledger B]
        RB[ReplicationManager B]
        RPB[ReplicationProtocol B]
    end

    RA -->|SyncRequest| RPB
    RPB -->|SyncResponse| RA
    RPA -->|SyncRequest| RB
    RB -->|SyncResponse| RPA
```

The current implementation provides the **interface only** — no network transport is implemented yet. The protocol is designed to be transport-agnostic (usable over HTTP, gRPC, WebSocket, etc.).

## 15. Security Properties

| Property | Mechanism |
|----------|-----------|
| **Integrity** | Hash chain (parent → envelope), MMR root, domain-separated hashing |
| **Authenticity** | Ed25519 signatures with domain separation |
| **Non-repudiation** | Signatures are deterministic and verifiable |
| **Confidentiality** | Private keys never leave the Trusted Zone |
| **Replay resistance** | Domain separation prevents cross-protocol signature replay |
| **Tamper evidence** | MMR root changes if any entry is modified |
| **Auditability** | Complete audit trail with correlation IDs |
| **Crash safety** | SQLite WAL mode with `synchronous=FULL` |
