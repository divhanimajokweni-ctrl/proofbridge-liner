# Architecture Overview

## System Overview

The VVU Earth Tech Ledger is a **deterministic, cryptographically verifiable production ledger** designed for environments where data integrity, auditability, and replay verification are critical. The system guarantees that every entry appended to the ledger is:

1. **Cryptographically signed** using Ed25519 with domain-separated hashing
2. **Hash-chained** into an append-only sequence linked by envelope hashes
3. **Merkle-indexed** via a Merkle Mountain Range (MMR) for efficient inclusion and consistency proofs
4. **Replay-verifiable** — the entire ledger can be reconstructed from genesis and every integrity property checked independently

The ledger is designed for **deterministic replay**: given the same sequence of entries, any verifier can independently reconstruct the identical state and verify all hashes, signatures, and proofs.

## Module Decomposition

### Core Modules

| Module | Responsibility |
|--------|---------------|
| `serializer` | Deterministic canonical binary encoding/decoding with version header |
| `hashing` | Domain-separated SHA-256 hashing with protocol-specific convenience functions |
| `ed25519` | Ed25519 signing, verification, key management, rotation, and revocation |
| `mmr` | Merkle Mountain Range — append-only tree with inclusion and consistency proofs |
| `storage` | Hardened SQLite storage engine with production PRAGMAs |
| `config` | Frozen dataclass-based configuration system with TOML support |
| `constants` | Protocol constants, domain separation prefixes, and limits |
| `exceptions` | Complete exception hierarchy with machine-readable codes |

### Application Modules

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
| `api` | gRPC/REST API layer |
| `cli` | Command-line interface |

### Infrastructure Modules

| Module | Responsibility |
|--------|---------------|
| `logging` | Structured JSON logging with correlation IDs |
| `tracing` | Distributed tracing support |
| `metrics` | Observability metrics (Prometheus, OpenTelemetry) |
| `audit` | Audit logging for compliance |
| `replication` | Multi-node replication protocol |
| `replication_protocol` | Replication wire protocol |
| `version` | Version information |

## Data Flow

### Append Flow

```
┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────┐
│ Client   │───▶│ Ledger       │───▶│ Envelope     │───▶│ MMR     │
│ payload  │    │ .append()    │    │ Builder      │    │ .append │
└─────────┘    └──────────────┘    └──────────────┘    └─────────┘
                      │                    │                    │
                      │              ┌─────┴─────┐        ┌────┴────┐
                      │              │ hash      │        │ root    │
                      │              │ chain     │        │ hash    │
                      │              └─────┬─────┘        └────┬────┘
                      │                    │                    │
                      ▼                    ▼                    ▼
                ┌──────────┐        ┌──────────┐        ┌──────────┐
                │ Storage  │        │ Signer   │        │ Storage  │
                │ INSERT   │        │ Ed25519  │        │ MMR save │
                └──────────┘        └──────────┘        └──────────┘
```

The append flow proceeds as follows:

1. **Payload intake** — The raw `bytes` payload is received.
2. **Hash chain construction** — `hash_payload(payload)` → `hash_envelope(pre_image)` → `hash_revision(payload_hash + envelope_hash)`.
3. **Signing** — The `revision_hash` is signed with Ed25519 under `DOMAIN_REVISION`.
4. **MMR update** — The `envelope_hash` is appended to the MMR.
5. **Storage** — The complete entry is persisted to SQLite.

### Verification Flow

```
┌─────────┐    ┌──────────────┐    ┌──────────────┐
│ Entry    │───▶│ Verify       │───▶│ Verify       │
│ from DB  │    │ hash chain   │    │ signature    │
└─────────┘    └──────────────┘    └──────────────┘
                      │                    │
                      ▼                    ▼
                ┌──────────┐        ┌──────────┐
                │ Verify   │        │ Verify   │
                │ parent   │        │ MMR      │
                │ link     │        │ proof    │
                └──────────┘        └──────────┘
```

## Security Model

### Domain Separation

Every hash and signature in the system uses domain separation to prevent cross-protocol replay attacks. The construction is:

```
domain_hash(domain, data) = SHA-256(domain ‖ len(domain)₄ ‖ data)
```

This ensures that hashes computed under one domain (e.g., `VVU:PAYLOAD:1:`) are cryptographically independent from hashes computed under another domain (e.g., `VVU:ENVELOPE:1:`), even if the payload data is identical.

### Ed25519 Signing

All signatures are computed over a domain-separated pre-hash:

```
prehash = SHA-256(domain ‖ len(domain)₄ ‖ message)
signature = Ed25519.sign(prehash)
```

This prevents cross-domain signature replay — a signature produced under `DOMAIN_PAYLOAD` cannot be replayed under `DOMAIN_ENVELOPE`.

### MMR Proofs

The Merkle Mountain Range provides:

- **Inclusion proofs** — prove that a specific entry exists in the ledger at a given position
- **Consistency proofs** — prove that the MMR at an earlier state is a prefix of the current MMR
- **Bagging** — the root is computed by iteratively hashing peak pairs from right to left

### Quorum Verification

For multi-validator deployments, the quorum system requires:

- **Minimum quorum** of 2 validators (configurable)
- **2/3 threshold** of total validator weight (configurable)
- **Duplicate rejection** — each validator's signature is counted only once

## Configuration Architecture

All configuration is managed through frozen dataclasses with validation in `__post_init__`:

```
LedgerConfig
├── DatabaseConfig    — SQLite PRAGMAs, path, journal mode
├── CryptoConfig      — hash algorithm, key rotation settings
├── ReplayConfig      — which checks to perform during replay
├── ValidatorConfig   — pool size, quorum thresholds
├── LoggingConfig     — structured logging, severity
├── MetricsConfig     — observability endpoints
├── NetworkConfig     — gRPC host, port, TLS
└── SerializerConfig  — depth limits, size limits
```

Configuration can be loaded from:

1. **Default** — `LedgerConfig.default()` with production-safe values
2. **TOML** — `LedgerConfig.from_toml(path)` for environment-specific overrides

## Error Handling Strategy

All exceptions inherit from `LedgerError` and carry:

- **Machine-readable code** — e.g., `HASH_DOMAIN_VIOLATION`, `DATABASE_NOT_OPEN`
- **Optional detail dict** — structured context for programmatic inspection
- **Proper hierarchy** — callers can catch at the appropriate granularity

The hierarchy is:

```
LedgerError
├── SerializationError → DepthExceededError, SizeExceededError, InvalidTypeError
├── HashError → DomainViolationError, HashMismatchError
├── CryptoError → SignatureError → InvalidSignatureError, KeyNotFoundError, KeyExpiredError
├── MMRError → InvalidIndexError, InvalidProofError, RootMismatchError
├── StorageError → DatabaseError → DBConnectionFailedError, DatabaseBusyError, ...
├── ReplayError → SequenceViolationError, ParentChainBrokenError, ...
├── ValidatorError → DuplicateValidatorError, ...
└── ConfigError → InvalidValueError, MissingConfigFieldError
```
