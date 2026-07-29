# ADR 0003: Ed25519 with Domain Separation for All Signatures

## Status

Accepted

## Context

The VVU Earth Tech Ledger requires cryptographic signatures that provide:

1. **Non-repudiation** — A validator cannot deny having signed an entry
2. **Forgery resistance** — An attacker cannot forge a signature without the private key
3. **Performance** — Signing must be fast enough for high-throughput append operations
4. **Determinism** — The same input must produce the same signature (for replay verification)
5. **Domain isolation** — Signatures produced under one context cannot be replayed in another

### Requirements

| Requirement | Rationale |
|-------------|-----------|
| 128-bit security level | Standard for production cryptographic systems |
| Deterministic signatures | Required for replay verification |
| Fast signing and verification | Target: > 1,000 appends/second |
| Small key and signature sizes | Minimize storage and network overhead |
| Widely audited implementation | Security confidence |
| Domain separation | Prevent cross-protocol signature replay |

### Candidate Algorithms

| Algorithm | Key Size | Signature Size | Security Level | Deterministic | Speed |
|-----------|----------|---------------|---------------|---------------|-------|
| Ed25519 | 32 bytes (public) | 64 bytes | 128-bit | Yes (RFC 8032) | Very fast |
| ECDSA P-256 | 32 bytes (public) | 64 bytes | 128-bit | No (requires k) | Fast |
| RSA-2048 | 256 bytes (public) | 256 bytes | 112-bit | No | Slow |
| RSA-4096 | 512 bytes (public) | 512 bytes | 140-bit | No | Very slow |
| BLS12-381 | 48 bytes (public) | 96 bytes | 128-bit | Yes | Moderate |

## Decision

We adopt **Ed25519** as the signature algorithm for all cryptographic signatures in the VVU Earth Tech Ledger, combined with **domain separation** for all signing operations.

### Ed25519 Implementation

The implementation uses PyNaCl (which wraps libsodium's vetted Ed25519 implementation):

- **Key generation**: `nacl.signing.SigningKey.generate()`
- **Signing**: `SigningKey.sign(message)`
- **Verification**: `VerifyKey.verify(message, signature)`

### Domain Separation Construction

All signatures are computed over a domain-separated pre-hash:

```
prehash = SHA-256(domain ‖ len(domain)₄ ‖ message)
signature = Ed25519.sign(prehash)
```

Where `len(domain)₄` is the domain length as a 4-byte big-endian unsigned integer.

### Signing Domain

The ledger uses `VVU:REVISION:1:` as the signing domain:

```
signature = Ed25519.sign(domain_hash(VVU:REVISION:1:, revision_hash))
```

### Key Management

- **Key versioning**: Each key pair carries a monotonically increasing version number
- **Key rotation**: New keys can be generated with `rotate_key()`
- **Key revocation**: Keys can be revoked at a specific epoch with `revoke_key()`
- **Key identifiers**: 4-byte identifiers computed as `SHA-256(public_key)[:4]`

## Consequences

### Positive

- **128-bit security level** — Ed25519 provides 128-bit security against forgery
- **Deterministic signatures** — Ed25519 (RFC 8032) produces deterministic signatures, enabling replay verification
- **Fast signing and verification** — Ed25519 is significantly faster than RSA and ECDSA
- **Small key sizes** — 32-byte public keys and 64-byte signatures minimize storage
- **Widely audited** — libsodium is a well-audited, production-grade cryptographic library
- **Domain separation** — Prevents cross-protocol signature replay attacks
- **Key versioning** — Enables key rotation without breaking existing signatures
- **Key revocation** — Compromised keys can be revoked immediately

### Negative

- **Not quantum-resistant** — Ed25519 is vulnerable to quantum computing attacks (Shor's algorithm)
- **Not RSA** — Some enterprise environments prefer RSA for compatibility with existing PKI
- **Pre-hash construction** — The domain-separated pre-hash adds a SHA-256 computation before signing
- **Key ID collision** — The 4-byte key ID has a 32-bit collision space; collisions are possible but not exploitable

### Neutral

- **PyNaCl dependency** — The implementation depends on PyNaCl/libsodium, which is a well-maintained library
- **Domain prefixes are versioned** — The `:1:` suffix allows future protocol versions to use different domains

## Alternatives Considered

### 1. ECDSA P-256

ECDSA with the P-256 curve (also known as secp256r1).

**Rejected because:**
- Non-deterministic signatures (requires a random nonce k)
- Non-deterministic signatures break replay verification
- More complex implementation than Ed25519
- Slower than Ed25519

### 2. RSA-2048/RSA-4096

RSA signature algorithm.

**Rejected because:**
- Large key sizes (256-512 bytes for public keys)
- Large signature sizes (256-512 bytes)
- Slow signing and verification
- Non-deterministic signatures (PKCS#1 v1.5) or complex padding (PSS)
- Lower security level (RSA-2048 provides ~112-bit security)

### 3. BLS12-381

BLS signature scheme on the BLS12-381 curve.

**Rejected because:**
- Larger signature sizes (96 bytes)
- Less widely supported than Ed25519
- More complex implementation
- Not necessary for the current use case (signature aggregation is not required)

### 4. Ed25519 without Domain Separation

Using Ed25519 directly without domain-separated pre-hashing.

**Rejected because:**
- Vulnerable to cross-protocol signature replay
- A signature produced in one context could be replayed in another
- Domain separation is a security best practice

### 5. Ed25519 with Context Strings

Using Ed25519ph (pre-hashed) with context strings as defined in RFC 8032.

**Rejected because:**
- Ed25519ph context strings are limited to 255 bytes
- Our domain separation construction is more flexible and consistent with the hashing module
- The domain-separated pre-hash construction is already used in the hashing module
