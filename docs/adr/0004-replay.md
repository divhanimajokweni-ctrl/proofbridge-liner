# ADR 0004: Deterministic Replay with Full Validator History Verification

## Status

Accepted

## Context

The VVU Earth Tech Ledger requires a verification mechanism that can independently confirm the integrity of the entire ledger. The replay engine must:

1. **Reconstruct the ledger from genesis** — Start from the first entry and verify every subsequent entry
2. **Check all integrity properties** — Hash chain, MMR, signatures, validator history, quorum
3. **Produce a deterministic result** — The same input must produce the same output
4. **Detect any tampering** — Any modification to the ledger must be detected
5. **Support partial replay** — Verify a subset of entries (from a given starting sequence)
6. **Verify validator history** — Ensure that all signing keys were active at the time of signing

### Requirements

| Requirement | Rationale |
|-------------|-----------|
| Deterministic | Required for independent verification |
| Complete | All integrity properties must be checked |
| Tamper-evident | Any modification must be detected |
| Partial | Support verification of specific sequence ranges |
| Validator-aware | Verify that signing keys were active |
| Configurable | Allow enabling/disabling individual checks |
| Progress reporting | Provide progress callbacks for long-running replays |

### Design Considerations

1. **Where to start?** — The replay engine must start from genesis (or a given starting sequence) to verify the parent chain. If starting from a non-zero sequence, the previous entry must be loaded to verify the parent hash.

2. **What to verify?** — The replay engine must verify: sequence continuity, parent chain, payload hash, envelope hash, revision hash, signature, MMR root, validator history, quorum, and schema version.

3. **How to handle failures?** — The replay engine should not stop at the first failure. Instead, it should collect all violations and report them at the end. This allows for comprehensive analysis of the ledger's integrity.

4. **Validator history** — The replay engine must verify that each signing key was active at the time of signing. This requires loading the validator registry and checking registration and revocation sequences.

5. **MMR verification** — The replay engine must rebuild the MMR from entries and compare the root with the stored root. This ensures that no entries have been added, removed, or modified.

## Decision

We implement a **deterministic replay engine** with full validator history verification.

### Replay Engine Architecture

The replay engine performs the following checks for each entry:

1. **Sequence continuity** — `entry.sequence == expected_sequence`
2. **Parent chain** — `entry.parent_hash == previous.envelope_hash` (or `GENESIS_HASH` for the first entry)
3. **Payload hash** — `hash_payload(entry.payload) == entry.payload_hash`
4. **Envelope hash** — `hash_envelope(pre_image) == entry.envelope_hash`
5. **Revision hash** — `hash_revision(payload_hash + envelope_hash) == entry.revision_hash`
6. **Signature** — Structural check (64-byte signature); full verification if public key is available
7. **MMR root** — Rebuild MMR from entries and compare with stored root
8. **Validator history** — All signing keys were active at the time of signing
9. **Quorum** — If quorum verification is enabled, check that quorum was achieved
10. **Schema version** — Database schema version is at least 1

### Validator History Verification

The validator history verification checks that:

- Each signing key exists in the `validators` table
- The validator was registered at or before the entry's sequence number
- The validator was not revoked at or before the entry's sequence number

### Violation Reporting

Each violation is reported as a `ReplayViolation`:

```python
@dataclass(frozen=True)
class ReplayViolation:
    sequence: int
    check: str
    expected: str
    actual: str
    severity: str  # "error" or "warning"
```

### Configurable Checks

The replay engine's behavior is controlled by `ReplayConfig`, which allows enabling or disabling individual checks:

```python
@dataclass(frozen=True)
class ReplayConfig:
    verify_sequence: bool = True
    verify_parent_chain: bool = True
    verify_payload_hash: bool = True
    verify_envelope_hash: bool = True
    verify_revision_hash: bool = True
    verify_mmr: bool = True
    verify_validator_history: bool = True
    verify_quorum: bool = True
    verify_snapshots: bool = True
    verify_proofs: bool = True
    verify_schema_versions: bool = True
    max_replay_entries: int = 1_000_000
```

## Consequences

### Positive

- **Complete verification** — All integrity properties are checked
- **Deterministic** — The same input produces the same output
- **Tamper-evident** — Any modification is detected
- **Validator-aware** — Ensures that signing keys were active
- **Configurable** — Individual checks can be enabled or disabled
- **Comprehensive reporting** — All violations are collected and reported
- **Progress reporting** — Supports progress callbacks for long-running replays

### Negative

- **O(n) replay cost** — Full replay requires scanning all entries
- **Memory usage** — All entries are loaded into memory for MMR rebuild
- **No incremental verification** — The replay engine does not support incremental verification
- **Validator history dependency** — The replay engine depends on the validator registry being correct

### Neutral

- **Partial replay is supported** — The `from_sequence` and `to_sequence` parameters allow verifying a subset of entries
- **Severity levels** — Violations are classified as "error" or "warning", allowing for nuanced analysis

## Alternatives Considered

### 1. Incremental Verification

Verify only the last N entries instead of the entire ledger.

**Rejected because:**
- Does not detect historical tampering
- Does not provide full integrity guarantees
- Cannot be used for independent audit

### 2. Spot-Check Verification

Verify a random subset of entries instead of the entire ledger.

**Rejected because:**
- Does not provide complete integrity guarantees
- May miss targeted tampering
- Not suitable for audit compliance

### 3. Checkpoint-Based Verification

Verify only from the last verified checkpoint.

**Rejected because:**
- Requires trust in the checkpoint
- Does not provide full integrity from genesis
- More complex to implement

### 4. No Validator History Verification

Skip validator history verification during replay.

**Rejected because:**
- A validator could sign entries before being registered or after being revoked
- This would undermine the quorum system's integrity
- Without validator history verification, the replay engine cannot detect quorum attacks

### 5. Streaming Replay

Implement the replay engine as a streaming processor that processes entries one at a time.

**Rejected because:**
- MMR verification requires all entries to be loaded (for root computation)
- Streaming replay would be more complex to implement
- The current design (load all entries, then verify) is simpler and sufficient for the expected scale
