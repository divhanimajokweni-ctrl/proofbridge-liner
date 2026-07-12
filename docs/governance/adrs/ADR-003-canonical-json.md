---
id: ADR-003
title: Use RFC 8785 Canonical JSON
author: KiloCode (Ed)
reviewers: Drake (OpenCode), Sentinel (OpenCode)
approver: Constitutional Council
implementation_owner: Josh (OpenCode)
verification_owner: Evidence Office
status: Accepted
date: 2026-06-01
---

# Context

VVU Colony requires deterministic serialization for:
- Cryptographic signature verification (same bytes = same signature)
- Hash chain integrity (same payload = same hash)
- Cross-platform compatibility (Node.js, browsers, future services)
- Audit trail reproducibility

JSON serialization is inherently non-deterministic:
- Key ordering is implementation-defined
- Whitespace is flexible
- Unicode normalization varies

Without canonicalization, two agents serializing the same data may produce different bytes, breaking signature and hash verification.

# Decision

Use RFC 8785 (JSON Canonicalization Scheme - JCS) for all canonical JSON serialization in VVU Colony.

RFC 8785 specifies:
- Sorted object keys (lexicographic order)
- No extra whitespace
- UTF-8 byte ordering
- Deterministic number formatting

# Consequences

**Positive:**
- Deterministic serialization across platforms
- Enables signature and hash verification
- Standardized (RFC, not ad-hoc)
- Simple to implement and verify
- Cross-platform compatibility

**Negative:**
- Slightly slower than JSON.stringify
- Requires custom serializer (not native)
- Must be applied consistently everywhere

# Compliance

This decision is foundational to X₀:
- Hash chain requires deterministic hashing (X₀ invariant)
- Signature verification requires deterministic serialization (X₀ invariant)
- Replay determinism requires canonical state representation

# Verification

Evidence Office will verify:
- Canonical serialization produces deterministic output
- Same object serialized twice produces identical bytes
- Hash of canonical output is deterministic
- Signature of canonical output is deterministic

# Implementation Plan

Josh (ENG-002) owns implementation:
- Canonical JSON module (packages/trust-crypto/)
- Integration with event store (hash computation)
- Integration with signature module
- Test coverage for determinism guarantees
