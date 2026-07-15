---
id: ADR-002
title: Use Ed25519 for Cryptographic Signatures
author: KiloCode (Ed)
reviewers: Drake (OpenCode), Sentinel (OpenCode)
approver: Constitutional Council
implementation_owner: Josh (OpenCode)
verification_owner: Evidence Office
status: Accepted
date: "2026-06-01"
---

# Context

VVU Colony requires cryptographic signatures for:
- Event integrity verification
- Non-repudiation of evidence
- Trust score attestation
- Deployment artifact signing

The signature algorithm must be:
- Secure (resistant to forgery)
- Performant (signing on every event append)
- Standardized (widely supported, auditable)
- Compatible with RFC 8785 canonical JSON

# Decision

Use Ed25519 (via tweetnacl) for all cryptographic signatures in VVU Colony.

Ed25519 provides 128-bit security, fast signing/verification, and deterministic signatures (critical for canonical JSON).

# Consequences

**Positive:**
- 128-bit security level
- Fast signing (~8,700 ops/sec) and verification (~2,800 ops/sec)
- Deterministic signatures (same input = same signature)
- Small key sizes (32-byte public, 64-byte private)
- Widely audited and standardized

**Negative:**
- Not RSA (some enterprise environments prefer RSA)
- Key escrow requires additional implementation (SafeKrypte)
- Hardware security module integration may require adapters

# Compliance

This decision directly supports X₀:
- Cryptographic primitives are immutable (X₀ invariant)
- Signature verification during replay (X₀ invariant)
- Hash chain integrity depends on signature integrity

# Verification

Evidence Office will verify:
- Signature generation produces deterministic output
- Signature verification correctly rejects forged signatures
- Key generation follows secure random processes
- Envelope encryption round-trip preserves signatures

# Implementation Plan

Josh (ENG-002) owns implementation:
- Signature module (packages/trust-crypto/)
- Integration with event store
- Integration with SafeKrypte key management
- Test coverage via hash.test.ts (26 tests)
