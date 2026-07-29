# Protocol Specification

## Ledger Protocol

### Append

The append operation adds a new entry to the ledger:

1. Increment the sequence number.
2. Get the parent hash (previous envelope hash or genesis hash for the first entry).
3. Build the envelope (see Entry Format below).
4. Verify quorum if validator signatures are provided.
5. Append the envelope hash to the MMR.
6. Store the entry in the database.
7. Return the envelope.

### Verify

The verify operation checks the integrity of the entry chain:

1. For each entry from `from_sequence` to `to_sequence`:
   - Check parent chain: `entry.parent_hash == previous.envelope_hash`
   - Verify the envelope's hashes (payload, envelope, revision)
   - Verify the Ed25519 signature
2. Return `True` if all checks pass.

### Replay

The replay operation reconstructs and verifies the entire ledger from genesis:

1. **Sequence continuity** — entries are in consecutive order
2. **Parent chain** — each entry's parent hash matches the previous envelope hash
3. **Payload hash** — `hash_payload(payload) == entry.payload_hash`
4. **Envelope hash** — reconstructed pre-image matches
5. **Revision hash** — `hash_revision(payload_hash + envelope_hash) == entry.revision_hash`
6. **MMR consistency** — rebuilt MMR root matches stored root
7. **Validator history** — signing keys exist in the validator registry
8. **Quorum** — sufficient validator signatures (if applicable)
9. **Signature validity** — 64-byte Ed25519 signature
10. **Schema version** — database schema is consistent

## Entry Format

### Envelope Structure

Each ledger entry is wrapped in an `Envelope` containing:

| Field | Type | Description |
|-------|------|-------------|
| `sequence` | `int` | Monotonically increasing sequence number |
| `parent_hash` | `bytes (32)` | Hash of previous entry's envelope (or `GENESIS_HASH`) |
| `payload` | `bytes` | The actual data bytes |
| `payload_hash` | `bytes (32)` | `hash_payload(payload)` |
| `envelope_hash` | `bytes (32)` | `hash_envelope(pre_image)` |
| `revision_hash` | `bytes (32)` | `hash_revision(payload_hash + envelope_hash)` |
| `signature` | `Signature` | Ed25519 signature over `revision_hash` |
| `key_id` | `bytes (4)` | Key identifier of the signing key |
| `key_version` | `int` | Version number of the signing key |
| `timestamp` | `float` | POSIX epoch seconds |

### Hash Chain

The hash chain is computed as:

```
payload_hash  = hash_payload(payload)
pre_image     = canonical_encode({sequence, parent_hash, payload_hash, timestamp})
envelope_hash = hash_envelope(pre_image)
revision_hash = hash_revision(payload_hash + envelope_hash)
```

The envelope pre-image is the canonical encoding of a dict with keys:
- `sequence` (int)
- `parent_hash` (bytes)
- `payload_hash` (bytes)
- `timestamp` (bytes — 8-byte big-endian IEEE 754 double)

### Genesis Hash

The first entry's `parent_hash` is set to `GENESIS_HASH` (`b"\x00" * 32`), a 32-byte all-zero sentinel value.

## MMR Protocol

### Append

When an entry is appended to the MMR:

1. The `envelope_hash` is hashed with `hash_mmr_leaf()` to produce the leaf node.
2. The leaf is placed at the next available position.
3. Parent nodes are computed as needed (when leaves form complete subtrees).
4. The MMR root is recomputed by bagging the peaks.

### Inclusion Proof

An inclusion proof for a leaf at position `p` contains:

1. The leaf position and hash.
2. Sibling hashes from the leaf to the corresponding peak.
3. All peak (position, hash) pairs.
4. The MMR size at proof time.

Verification:

1. Recompute the hash from leaf to peak using sibling hashes.
2. Verify the computed hash matches the corresponding peak.
3. Verify the bagged root matches the expected root.

### Consistency Proof

A consistency proof between an earlier MMR size `m` and a later size `n` contains:

1. Earlier peak (position, hash) pairs.
2. Later peak (position, hash) pairs.
3. Additional hashes needed to connect earlier peaks to later peaks.

Verification:

1. Verify `earlier_root` from earlier peaks via bagging.
2. Verify `later_root` from later peaks via bagging.
3. Verify that earlier peaks are consistent with later peaks using the proof hashes.

## Validator Protocol

### Registration

A validator is registered with:

- `key_id` — 4-byte key identifier
- `public_key` — 32-byte Ed25519 public key
- `weight` — consensus weight (1–1000)
- `sequence` — registration sequence number

Constraints:

- Maximum 256 active validators
- Duplicate `key_id` is rejected
- Weight must be between 1 and `MAX_WEIGHT`

### Revocation

A validator is revoked at a specific sequence number:

- `key_id` — the validator to revoke
- `sequence` — the revocation sequence number

After revocation:

- The validator's signature is no longer accepted for new entries.
- The validator's weight is removed from the total weight.

### Quorum

Quorum is achieved when:

1. The signed weight is ≥ `ceil(threshold_pct × total_weight)` (default 67%).
2. At least `min_quorum` validators have signed (default 2).

## Snapshot Protocol

### Create

A snapshot captures the complete ledger state at a given sequence:

1. Collect all entries up to the sequence.
2. Serialize the MMR state.
3. Encode the snapshot payload using the canonical serializer.
4. Compute the integrity hash: `hash_snapshot(data)`.
5. Store the snapshot in the database.

### Verify

Snapshot verification:

1. Load the snapshot from the database.
2. Recompute `hash_snapshot(data)`.
3. Compare against the stored hash.

### Restore

Snapshot restoration:

1. Load the snapshot from the database.
2. Verify the integrity hash.
3. Deserialize the payload using the canonical serializer.
4. Return the deserialized state.

### Export / Import

Snapshots can be exported to and imported from files:

- **File format**: `VVUSNAP\x01` (8 bytes) + data length (4 bytes, big-endian) + data
- **Integrity**: The integrity hash is verified on import.
