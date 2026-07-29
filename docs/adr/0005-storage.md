# ADR 0005: Hardened SQLite with WAL Mode and Strict PRAGMAs

## Status

Accepted

## Context

The VVU Earth Tech Ledger requires a storage engine that provides:

1. **Data durability** — Committed data must survive power failures and crashes
2. **Concurrent reads** — Readers must not block writers and vice versa
3. **Crash safety** — The database must be recoverable after an unclean shutdown
4. **Integrity** — The database must detect and report corruption
5. **Security** — Deleted data must not be recoverable; dangerous SQL functions must be disabled
6. **Performance** — Write throughput must support > 1,000 appends/second
7. **Simplicity** — The storage engine should be easy to deploy and operate

### Requirements

| Requirement | Rationale |
|-------------|-----------|
| ACID compliance | Ledger entries must be atomic, consistent, isolated, and durable |
| Concurrent read access | Multiple readers must be able to query the ledger simultaneously |
| Crash recovery | The database must be recoverable after a power failure |
| Integrity verification | `PRAGMA integrity_check` must be available |
| Secure deletion | Deleted data must be zero-filled |
| Trusted schema protection | Application-defined SQL functions in triggers/views must be rejected |
| Foreign key enforcement | Referential integrity must be maintained |
| No external dependencies | The storage engine should not require a separate database server |

### Candidate Storage Engines

| Engine | ACID | Concurrent Reads | Crash Safety | External Dependencies |
|--------|------|-----------------|-------------|---------------------|
| SQLite (WAL) | Full | Yes | Full | None |
| PostgreSQL | Full | Yes | Full | PostgreSQL server |
| MySQL | Full | Yes | Full | MySQL server |
| LevelDB | Limited | No | Limited | None |
| RocksDB | Limited | No | Limited | None |

## Decision

We adopt **SQLite with WAL mode and strict PRAGMAs** as the storage engine for the VVU Earth Tech Ledger.

### PRAGMA Configuration

The following PRAGMAs are applied on every connection:

| PRAGMA | Value | Rationale |
|--------|-------|-----------|
| `journal_mode` | WAL | Concurrent readers + single writer; no blocking reads |
| `synchronous` | FULL | Every commit fsyncs to disk; maximum durability |
| `busy_timeout` | 5000 | Wait up to 5 seconds instead of raising immediately on lock |
| `cache_size` | -64000 | 64 MiB absolute cache limit (negative = KiB) |
| `page_size` | 4096 | Standard page size; optimal for most SSDs |
| `secure_delete` | ON | Zero-fill deleted pages on VACUUM |
| `trusted_schema` | OFF | Reject dangerous SQL functions in triggers/views |
| `foreign_keys` | ON | Enforce referential integrity |
| `temp_store` | MEMORY | Temporary tables live in RAM only |
| `locking_mode` | NORMAL | Allow other connections to read/write |

### Key Design Decisions

1. **WAL mode** — Provides concurrent reads without blocking writes. The WAL (Write-Ahead Log) allows readers to access a consistent snapshot while a writer is appending.

2. **synchronous=FULL** — Ensures that every commit is fsynced to disk before returning. This provides maximum durability at the cost of write performance. For a production ledger, durability is more important than write speed.

3. **secure_delete=ON** — Zero-fills deleted pages during VACUUM. This prevents forensic recovery of deleted data, which is important for data retention compliance.

4. **trusted_schema=OFF** — Rejects application-defined SQL functions in triggers and views. This prevents privilege escalation through SQL injection in schema objects.

5. **foreign_keys=ON** — Enforces referential integrity between tables. This ensures that the database schema is consistent.

6. **Integrity check on close** — The `close()` method runs `PRAGMA integrity_check` before closing the connection. If the check fails, a `DatabaseCorruptError` is raised.

### Error Handling

All SQLite errors are wrapped in the project's `DatabaseError` hierarchy:

- `DatabaseError` — Base class for all database errors
- `DBConnectionFailedError` — Connection could not be established
- `DatabaseBusyError` — Database is locked (busy_timeout exceeded)
- `DatabaseCorruptError` — Integrity check failed
- `MigrationFailedError` — Database migration failed

## Consequences

### Positive

- **No external dependencies** — SQLite is embedded in the Python standard library; no separate database server is needed
- **ACID compliance** — Full ACID compliance with WAL mode and `synchronous=FULL`
- **Concurrent reads** — WAL mode allows concurrent readers without blocking
- **Crash safety** — `synchronous=FULL` ensures that committed data is on disk
- **Secure deletion** — Zero-fills deleted pages to prevent forensic recovery
- **Trusted schema protection** — Prevents privilege escalation through SQL injection
- **Integrity verification** — `PRAGMA integrity_check` is available on every close
- **Simple deployment** — Single file database; no server configuration needed
- **Simple backup** — File-level backup using SQLite's backup API

### Negative

- **Single-writer** — SQLite does not support concurrent writes from multiple processes
- **No horizontal scaling** — The database cannot be distributed across multiple nodes
- **Write performance** — `synchronous=FULL` is slower than `NORMAL` or `OFF`
- **Database size limits** — SQLite has a theoretical limit of 281 TB, but practical limits are much lower
- **No built-in replication** — SQLite does not support native replication

### Neutral

- **Single-writer is acceptable** — The ledger is designed for a single-writer, multi-reader pattern
- **No horizontal scaling is acceptable** — The ledger is designed for single-node deployment
- **Write performance is acceptable** — `synchronous=FULL` provides ~1,000 appends/second on modern SSDs

## Alternatives Considered

### 1. PostgreSQL

A production-grade relational database with full ACID compliance, concurrent reads and writes, and built-in replication.

**Rejected because:**
- Requires a separate database server (deployment complexity)
- Not suitable for embedded or edge deployments
- Overkill for a single-writer ledger
- Adds operational overhead (backup, monitoring, tuning)

### 2. MySQL

A popular relational database with similar capabilities to PostgreSQL.

**Rejected because:**
- Same reasons as PostgreSQL
- Less mature WAL implementation than PostgreSQL

### 3. LevelDB / RocksDB

Embedded key-value stores with high write throughput.

**Rejected because:**
- No SQL support (cannot express complex queries)
- No ACID compliance (no transactions)
- No integrity verification
- No built-in crash safety guarantees

### 4. SQLite with synchronous=NORMAL

Using `synchronous=NORMAL` instead of `FULL` for better write performance.

**Rejected because:**
- `synchronous=NORMAL` does not fsync on every commit
- In a power failure, the last few transactions may be lost
- For a production ledger, durability is more important than write speed

### 5. SQLite with journal_mode=DELETE

Using the default journal mode (rollback journal) instead of WAL.

**Rejected because:**
- Readers block writers and vice versa
- No concurrent read access during writes
- WAL mode is strictly superior for read-heavy workloads

### 6. Custom File-Based Storage

A custom binary file format for storing ledger entries.

**Rejected because:**
- No ACID compliance
- No concurrent access
- No integrity verification
- No query support
- Requires implementing all database features from scratch
