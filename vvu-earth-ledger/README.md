# VVU Earth Tech Ledger

A **deterministic, cryptographically verifiable production ledger** designed for environments where data integrity, auditability, and replay verification are critical.

## Features

- **Domain-separated SHA-256 hashing** — every hash uses a protocol-specific prefix to prevent cross-context attacks
- **Ed25519 signing** — all entries are signed with domain-separated signatures via PyNaCl/libsodium
- **Hash-chained entries** — each entry links to the previous entry via a cryptographic hash chain
- **Merkle Mountain Range (MMR)** — efficient inclusion and consistency proofs for the entire ledger
- **Replay verification** — the entire ledger can be reconstructed from genesis and independently verified
- **Key management** — key versioning, rotation, and revocation with epoch-based revocation
- **Validator quorum** — multi-validator consensus with configurable thresholds
- **Snapshot system** — point-in-time state capture with integrity verification
- **Hardened SQLite storage** — production-grade PRAGMAs for data integrity and crash safety
- **Immutable configuration** — frozen dataclasses with validation and TOML support

## Quick Start

```python
from production_ledger.config import LedgerConfig
from production_ledger.ledger import Ledger

# Create a ledger with default configuration
config = LedgerConfig.default()
ledger = Ledger(config)
ledger.open()

# Append an entry
envelope = ledger.append(b"hello world")
print(f"Sequence: {envelope.sequence}")
print(f"Payload hash: {envelope.payload_hash.hex()}")

# Verify the chain
assert ledger.verify_chain()

# Create a snapshot
snapshot = ledger.create_snapshot()

# Close the ledger
ledger.close()
```

## Installation

### From Source

```bash
git clone https://github.com/vvu-earth/ledger.git
cd ledger
pip install .
```

### With Development Dependencies

```bash
pip install ".[dev]"
```

### With Docker

```bash
docker build -t vvu-ledger .
docker run -d -p 50051:50051 -v /path/to/data:/app/data vvu-ledger
```

## Usage

### CLI Commands

```bash
# Start the ledger server
ledger serve --config configs/production.toml

# Append an entry
ledger append --data "hello world"

# Verify the chain
ledger verify --full

# Run a replay
ledger replay

# Create a snapshot
ledger snapshot create

# Export a snapshot
ledger snapshot export --output snapshot.bin

# Import a snapshot
ledger snapshot import --input snapshot.bin

# Generate an inclusion proof
ledger proof --sequence 42

# Rotate the signing key
ledger key rotate
```

### Python API

```python
from production_ledger.config import LedgerConfig, DatabaseConfig
from production_ledger.ledger import Ledger
from production_ledger.hashing import hash_payload

# Custom configuration
config = LedgerConfig(
    database=DatabaseConfig(db_path="/var/lib/ledger/ledger.db"),
)

# Open the ledger
ledger = Ledger(config)
ledger.open()

# Append entries
for i in range(100):
    payload = f"entry {i}".encode()
    envelope = ledger.append(payload)

# Verify the chain
if ledger.verify_chain():
    print("Chain is valid!")

# Get an entry
entry = ledger.get_entry(0)
print(f"Entry 0: {entry.payload}")

# Generate an inclusion proof
proof = ledger.get_proof(0)
if ledger.verify_proof(0, proof):
    print("Proof is valid!")

# Get MMR root
root = ledger.get_mmr_root()
print(f"MMR root: {root.hex()}")

# Close the ledger
ledger.close()
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                     Ledger                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Envelope  │  │   MMR    │  │     Storage      │  │
│  │ Builder   │  │ ( proofs)│  │   (SQLite+WAL)   │  │
│  └─────┬────┘  └─────┬────┘  └────────┬─────────┘  │
│        │             │                │              │
│  ┌─────┴────┐  ┌────┴─────┐  ┌───────┴────────┐  │
│  │ Hashing  │  │  Signer  │  │   Validator     │  │
│  │ (SHA256) │  │ (Ed25519)│  │   Registry      │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │Serializer│  │  Replay  │  │   Snapshots      │  │
│  │(canonical)│  │  Engine  │  │                  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for the full architecture documentation.

## Configuration

### Default Configuration

```python
from production_ledger.config import LedgerConfig

config = LedgerConfig.default()
```

### From TOML

```toml
[database]
db_path = "/var/lib/ledger/ledger.db"
journal_mode = "wal"
synchronous = "full"

[crypto]
hash_algorithm = "sha256"
key_rotation_enabled = true

[network]
port = 50051
tls_enabled = false
```

```python
config = LedgerConfig.from_toml("configs/production.toml")
```

See [docs/deployment.md](docs/deployment.md) for the full deployment guide.

## Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test Suites

```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# Cryptographic tests
pytest tests/crypto/

# Replay tests
pytest tests/replay/

# Adversarial tests
pytest tests/adversarial/

# Performance benchmarks
pytest tests/benchmarks/
```

### Run with Coverage

```bash
pytest --cov=production_ledger --cov-report=html
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -am 'Add new feature'`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Submit a pull request.

### Development Setup

```bash
# Install with dev dependencies
pip install ".[dev]"

# Run linter
ruff check src/

# Run type checker
mypy src/

# Run tests
pytest
```

## License

Proprietary — VVU Earth Tech. All rights reserved.
