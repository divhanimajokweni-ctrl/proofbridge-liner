# ADR 0001: Event-Sourced Append-Only Ledger with Cryptographic Integrity

## Status

Accepted

## Context

The VVU Earth Tech Ledger requires a data storage model that provides:

1. **Complete audit trail** — Every state change must be recorded and immutable
2. **Deterministic replay** — The entire ledger state must be reconstructable from genesis
3. **Tamper evidence** — Any modification to historical data must be detectable
4. **Cryptographic verification** — Independent parties must be able to verify integrity
5. **Append-only semantics** — Data must never be deleted or modified in place

Traditional CRUD databases do not provide these guarantees. Event sourcing stores all state changes as an immutable sequence of events, enabling full replay and verification. However, event sourcing alone is insufficient — it must be combined with cryptographic integrity mechanisms (hash chains, digital signatures, Merkle proofs) to provide tamper evidence and non-repudiation.

The ledger must support:

- High-throughput append operations (target: > 1,000 appends/second)
- Efficient inclusion proofs (target: O(log n) proof size)
- Full replay verification (target: < 5 minutes for 1M entries)
- Multi-validator quorum verification
- Point-in-time snapshots for recovery

## Decision

We adopt an **event-sourced append-only ledger** with the following architectural properties:

1. **Append-only entry storage** — Each entry is stored as an immutable record with a monotonically increasing sequence number. Entries are never modified or deleted.

2. **Hash chain** — Each entry is linked to its predecessor via a `parent_hash` field that contains the previous entry's `envelope_hash`. The first entry has `parent_hash = GENESIS_HASH` (32 zero bytes).

3. **Three-layer hash construction**:
   - `payload_hash = domain_hash(VVU:PAYLOAD:1:, payload)` — integrity of the raw data
   - `envelope_hash = domain_hash(VVU:ENVELOPE:1:, pre_image)` — integrity of the metadata
   - `revision_hash = domain_hash(VVU:REVISION:1:, payload_hash + envelope_hash)` — composite integrity (signed)

4. **Ed25519 signatures** — Each entry is signed with an Ed25519 key over the `revision_hash` with domain `VVU:REVISION:1:`.

5. **Merkle Mountain Range** — Entry `envelope_hash` values are indexed in an MMR for efficient inclusion and consistency proofs.

6. **Deterministic canonical serialization** — All hashes are computed over a deterministic binary encoding (sorted dictionary keys, minimal integer encoding, version header `VVU\x01`).

7. **Hardened SQLite storage** — The ledger is persisted in a SQLite database with WAL mode, `synchronous=FULL`, `secure_delete=ON`, and `trusted_schema=OFF`.

## Consequences

### Positive

- **Complete audit trail** — Every entry is immutable and traceable
- **Tamper evidence** — Any modification breaks the hash chain and MMR root
- **Deterministic replay** — The entire ledger can be reconstructed from genesis
- **Non-repudiation** — Ed25519 signatures provide cryptographic proof of authorship
- **Efficient proofs** — MMR provides O(log n) inclusion and consistency proofs
- **Domain separation** — Prevents cross-protocol replay attacks
- **Crash safety** — SQLite WAL mode with `synchronous=FULL` ensures durability

### Negative

- **Storage growth** — The append-only model means the database grows indefinitely
- **No deletion** — Entries cannot be removed (by design), which may conflict with data retention regulations
- **Single-writer** — SQLite does not support concurrent writes from multiple processes
- **Replay cost** — Full replay verification is O(n) in the number of entries
- **Complexity** — The hash chain, MMR, and domain separation add implementation complexity

### Neutral

- **Append-only is a feature** — The inability to modify or delete entries is a deliberate security property, not a limitation
- **Single-writer is acceptable** — The ledger is designed for a single-writer, multi-reader pattern

## Alternatives Considered

### 1. Traditional CRUD Database

A standard relational database with update and delete operations.

**Rejected because:**
- No audit trail (updates overwrite previous values)
- No tamper evidence (any row can be modified)
- No deterministic replay (state is not reconstructable from events)
- No cryptographic integrity (no hash chain or signatures)

### 2. Blockchain (Distributed Ledger)

A distributed blockchain with consensus (e.g., Proof of Stake, PBFT).

**Rejected because:**
- Overkill for single-organization deployments
- Higher latency and complexity
- Requires multiple nodes for consensus
- Not suitable for environments where a single writer is acceptable

### 3. Append-Only Log (without MMR)

A simple append-only log with hash chaining but no Merkle tree.

**Rejected because:**
- No efficient inclusion proofs (must scan the entire log)
- No consistency proofs (cannot prove that one state is a prefix of another)
- Verification is O(n) for all operations

### 4. Merkle Tree (instead of MMR)

A traditional Merkle tree with fixed size.

**Rejected because:**
- Not append-only (must rebuild the tree for each new entry)
- Imbalanced for growing datasets
- MMR is more efficient for append-only workloads

### 5. Event Sourcing with CQRS

A full event sourcing framework with Command Query Responsibility Segregation.

**Rejected because:**
- Adds unnecessary complexity for a single-writer ledger
- Projections are not needed (the ledger is the source of truth)
- The focus should be on integrity, not query optimization
