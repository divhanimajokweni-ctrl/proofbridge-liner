# Deployment Guide

## System Requirements

### Minimum Requirements

- **Python**: 3.11 or later
- **OS**: Linux (recommended), macOS, or Windows with WSL
- **CPU**: 2 cores
- **RAM**: 512 MB
- **Disk**: 100 MB for the application + storage for the ledger database

### Recommended Production Requirements

- **Python**: 3.11 or later
- **OS**: Ubuntu 22.04 LTS or later
- **CPU**: 4+ cores
- **RAM**: 2 GB+
- **Disk**: SSD with 10 GB+ for the ledger database (depends on entry volume)
- **Network**: Low-latency connection for multi-node deployments

## Installation

### pip

```bash
# Install from source
git clone https://github.com/vvu-earth/ledger.git
cd ledger
pip install .

# Install with development dependencies
pip install ".[dev]"
```

### Docker

```bash
# Build the Docker image
docker build -t vvu-ledger .

# Run with default configuration
docker run -d \
  --name vvu-ledger \
  -p 50051:50051 \
  -v /path/to/data:/app/data \
  vvu-ledger
```

### docker-compose

```bash
# Start the ledger service
docker-compose up -d

# View logs
docker-compose logs -f ledger
```

## Configuration

### Development

Use the development configuration for local testing:

```bash
ledger --config configs/development.toml
```

The development configuration:
- Uses `./data/ledger.db` as the database path
- Disables TLS
- Sets DEBUG logging
- Uses WAL journal mode

### Staging

Use the staging configuration for pre-production environments:

```bash
ledger --config configs/staging.toml
```

### Production

Use the production configuration for production deployments:

```bash
ledger --config configs/production.toml
```

The production configuration:
- Enables WAL journal mode with FULL synchronous
- Sets INFO logging
- Enables TLS (requires cert/key configuration)
- Uses larger cache sizes

### Custom Configuration

Create a TOML configuration file:

```toml
[database]
db_path = "/var/lib/ledger/ledger.db"
journal_mode = "wal"
synchronous = "full"
busy_timeout = 5000
cache_size = -64000
page_size = 4096

[crypto]
hash_algorithm = "sha256"
key_rotation_enabled = true
key_rotation_interval_days = 90

[network]
host = "0.0.0.0"
port = 50051
tls_enabled = true
cert_path = "/etc/ledger/certs/server.crt"
key_path = "/etc/ledger/certs/server.key"
```

## Database Setup

### SQLite Configuration

The ledger uses SQLite with the following production PRAGMAs:

| PRAGMA | Value | Purpose |
|--------|-------|---------|
| `journal_mode` | `wal` | Concurrent readers + single writer |
| `synchronous` | `full` | Every commit fsyncs to disk |
| `busy_timeout` | `5000` | Wait up to 5s instead of raising |
| `cache_size` | `-64000` | 64 MB cache limit |
| `page_size` | `4096` | 4 KB page size |
| `secure_delete` | `ON` | Zero-fill deleted pages |
| `trusted_schema` | `OFF` | Reject dangerous SQL in triggers/views |
| `foreign_keys` | `ON` | Enforce referential integrity |
| `temp_store` | `MEMORY` | Temporary tables in RAM |
| `locking_mode` | `NORMAL` | Allow concurrent access |

### Database Migration

Migrations are applied automatically on `ledger.open()`:

1. Migration 1: Create core tables (metadata, entries, validators, snapshots, mmr_nodes)
2. Migration 2: Add audit_log table and indexes
3. Migration 3: Add payload and key_version columns

## Key Management

### Key Generation

The ledger automatically generates an Ed25519 signing key on first startup:

```python
from production_ledger.ed25519 import KeyStore

store = KeyStore()
keypair = store.generate_key()  # version 1
```

### Key Rotation

Rotate keys periodically or on compromise:

```python
new_keypair = signer.rotate_key()  # version 2
```

### Key Revocation

Revoke a compromised key:

```python
store.revoke_key(key_id, epoch=42)
```

### Key Storage

Keys are stored in memory and should be persisted to a secure key store (e.g., HashiCorp Vault, AWS KMS) in production. The private key is never exposed outside the `ed25519` module.

## TLS Configuration

### Single-node TLS

```toml
[network]
tls_enabled = true
cert_path = "/etc/ledger/certs/server.crt"
key_path = "/etc/ledger/certs/server.key"
```

### Mutual TLS (mTLS)

```toml
[network]
tls_enabled = true
mtls_enabled = true
cert_path = "/etc/ledger/certs/server.crt"
key_path = "/etc/ledger/certs/server.key"
ca_path = "/etc/ledger/certs/ca.crt"
```

### Certificate Generation

```bash
# Generate a self-signed certificate for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# For production, use a proper CA-signed certificate
```

## Monitoring Setup

### Health Endpoint

The ledger exposes a health check endpoint:

```
GET /health
```

Returns `200 OK` if the ledger is healthy.

### Prometheus Metrics

Enable Prometheus metrics in the configuration:

```toml
[metrics]
expose_prometheus = true
```

Available metrics:

- `ledger_append_duration_seconds` — append operation latency
- `ledger_replay_duration_seconds` — replay operation latency
- `ledger_mmr_size` — current MMR size
- `ledger_storage_size_bytes` — database size
- `ledger_validator_count` — active validator count

### Structured Logging

The ledger outputs structured JSON logs:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "message": "Entry appended",
  "sequence": 42,
  "correlation_id": "abc123"
}
```

## Backup Procedures

### Database Backup

```bash
# SQLite backup (safe for WAL mode)
sqlite3 /var/lib/ledger/ledger.db ".backup /backup/ledger-$(date +%Y%m%d).db"

# Or use the snapshot export feature
ledger snapshot export --output /backup/snapshot-$(date +%Y%m%d).bin
```

### Snapshot Backup

```bash
# Export the latest snapshot
ledger snapshot export --id latest --output /backup/snapshot.bin

# Import a snapshot
ledger snapshot import --input /backup/snapshot.bin
```

### Automated Backup

```bash
# Add to crontab for daily backups
0 2 * * * sqlite3 /var/lib/ledger/ledger.db ".backup /backup/ledger-$(date +\%Y\%m\%d).db"
```

### Disaster Recovery

1. Install the ledger on a new machine.
2. Restore the database from backup.
3. Start the ledger — it will automatically apply any pending migrations.
4. Verify the chain: `ledger verify --full`.
5. Run a replay: `ledger replay`.
