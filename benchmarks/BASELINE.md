# VVU Earth Tech Ledger — Baseline Performance Benchmarks

**Date:** 2025-07-14
**Environment:** Python 3.12.13, Ubuntu (sandbox), single-core
**Git HEAD:** 039f81e

## Results

| Benchmark | Iterations | Time (s) | Ops/sec | Notes |
|-----------|-----------|----------|---------|-------|
| MMR Append (1000 leaves) | 1,000 | 0.0032 | 315,433 | Includes hash_payload + append |
| MMR Root Computation | 100 | 0.0007 | 153,596 | Bags all peaks |
| SHA-256 Hashing | 10,000 | 0.0071 | 1,410,853 | Domain-separated hash_payload |
| Canonical Serialization | 10,000 | 0.0485 | 206,111 | Binary encode of dict |
| Ed25519 Signing | 1,000 | 0.0391 | 25,574 | Domain-separated, PyNaCl |
| Ed25519 Verification | 1,000 | 0.0495 | 20,182 | Domain-separated, PyNaCl |
| MMR Inclusion Proof | 50 | 0.0021 | 23,617 | Generation only |
| Ledger Startup | 1 | 0.0306 | — | Cold start, no data |

## Memory

| Metric | Value |
|--------|-------|
| MMR 1000 leaves | 1,994 nodes, 73,808 bytes dict |
| MMR node/leaf ratio | 1.99x (theoretical ~2x) |

## Database Size Growth Estimates

| Entries | Estimated DB Size |
|---------|------------------|
| 1,000 | ~500 KB |
| 10,000 | ~5 MB |
| 100,000 | ~50 MB |
| 1,000,000 | ~500 MB |

## Key Observations

1. **Hashing is fast** — 1.4M ops/sec with domain separation. No bottleneck.
2. **MMR append is efficient** — 315K ops/sec. The O(log n) structure adds minimal overhead.
3. **Serialization is performant** — 206K ops/sec for binary encoding. No concern.
4. **Ed25519 is the expected bottleneck** — 25K sign/sec, 20K verify/sec. This is typical for Ed25519 in Python.
5. **Inclusion proofs** — 23K ops/sec for generation. Acceptable for most use cases.
6. **Startup is fast** — 31ms cold start. Not a concern.

## Performance Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Append throughput | 315K ops/sec | 100K ops/sec | ✅ PASS |
| MMR root | 153K ops/sec | 50K ops/sec | ✅ PASS |
| Ed25519 signing | 25K ops/sec | 10K ops/sec | ✅ PASS |
| Ed25519 verify | 20K ops/sec | 10K ops/sec | ✅ PASS |
| Inclusion proof | 23K ops/sec | 5K ops/sec | ✅ PASS |
| Startup | 31ms | 100ms | ✅ PASS |

## Future Optimization Opportunities

1. **Batch signing** — Sign multiple messages in a single batch to amortize key lookup overhead.
2. **MMR caching** — Cache peak hashes to avoid recomputing root on every append.
3. **SQLite WAL** — Use WAL mode for concurrent read/write during high-throughput scenarios.
4. **C extension** — Move hot paths (MMR, serialization) to C extension if needed.
5. **Async I/O** — Use asyncio for concurrent ledger operations in high-throughput scenarios.
