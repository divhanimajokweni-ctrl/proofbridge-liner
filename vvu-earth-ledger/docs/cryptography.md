# Cryptographic Specification

## Overview

The VVU Earth Tech Ledger uses three cryptographic primitives:

1. **Domain-separated SHA-256** — all hashing operations
2. **Ed25519** — digital signatures via PyNaCl/libsodium
3. **MMR hashing** — leaf/branch/bagging construction for the Merkle Mountain Range

All cryptographic operations are designed to be deterministic and replay-verifiable.

## Domain-Separated SHA-256 Hashing

### Construction

Every hash in the system is computed using domain-separated SHA-256:

```
domain_hash(domain, data) = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ data)
```

The `len(domain)` component prevents length-extension attacks between domains with common prefixes.

### Domains

| Domain Prefix | Constant | Purpose |
|--------------|----------|---------|
| `VVU:PAYLOAD:1:` | `DOMAIN_PAYLOAD` | Hashing raw payload data |
| `VVU:ENVELOPE:1:` | `DOMAIN_ENVELOPE` | Hashing envelope pre-images |
| `VVU:REVISION:1:` | `DOMAIN_REVISION` | Hashing revision data (payload + envelope) |
| `VVU:MMR:INT:1:` | `DOMAIN_MMR_INTERNAL` | MMR leaf and branch hashing |
| `VVU:MMR:BAG:1:` | `DOMAIN_MMR_BAGGING` | MMR peak bagging (root computation) |
| `VVU:SNAP:1:` | `DOMAIN_SNAPSHOT` | Snapshot integrity hashing |
| `VVU:REPLAY:1:` | `DOMAIN_REPLAY` | Replay verification hashing |
| `VVU:PROOF:1:` | `DOMAIN_PROOF` | Proof integrity hashing |
| `VVU:KEYROT:1:` | `DOMAIN_KEY_ROTATION` | Key rotation hashing |

### Properties

- **Cross-domain independence**: Hashes computed under different domains are cryptographically independent, even for identical data.
- **Empty domain rejection**: An empty domain prefix raises `DomainViolationError`.
- **Output size**: All hashes are 32 bytes (SHA-256 digest).

## Ed25519 Signing

### Key Management

Keys are managed by the `KeyStore` class with:

- **Key versioning**: Each key pair has a monotonically increasing version number.
- **Key identifiers**: 4-byte identifiers derived from `SHA-256(public_key)[:4]`.
- **Key rotation**: New keys are generated with incremented version numbers; old keys remain available for verification.
- **Key revocation**: Keys can be revoked at a specific epoch; revoked keys are refused for signing and verification.

### Signing Construction

All signatures are computed over a domain-separated pre-hash:

```
prehash = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)
signature = Ed25519.sign(prehash)
```

This construction ensures that:

1. A signature produced under one domain cannot be replayed in another.
2. The Ed25519 signing operation always operates on a 32-byte pre-hash.
3. The domain separation is consistent with the hashing module.

### Verification

Verification mirrors the signing construction:

```
prehash = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)
valid = Ed25519.verify(prehash, signature, public_key)
```

### Key Rotation

Key rotation is the primary mechanism for updating signing keys:

1. A new key pair is generated with an incremented version number.
2. The new key automatically becomes the active signing key.
3. Old keys remain in the store for verification of historical signatures.
4. Old keys can be revoked (but not deleted) to prevent future use.

### Key Revocation

Revocation marks a key as inactive at a specific epoch:

- Revoked keys raise `KeyExpiredError` when used for signing.
- Revoked keys raise `KeyExpiredError` when used for verification.
- Double revocation raises `SignatureError`.

## MMR Hashing

### Leaf Hash

MMR leaf nodes are hashed with a type prefix to distinguish them from branch nodes:

```
leaf_hash = SHA-256(DOMAIN_MMR_INTERNAL ‖ len(DOMAIN_MMR_INTERNAL)₄ ‖ 0x00 ‖ data)
```

The `0x00` prefix byte (`LEAF_HASH_PREFIX`) ensures that leaf hashes are distinct from branch hashes even if the data is the same.

### Branch Hash

MMR internal (branch) nodes are hashed with a different type prefix:

```
branch_hash = SHA-256(DOMAIN_MMR_INTERNAL ‖ len(DOMAIN_MMR_INTERNAL)₄ ‖ 0x01 ‖ left ‖ right)
```

The `0x01` prefix byte (`BRANCH_HASH_PREFIX`) distinguishes branch hashes from leaf hashes.

### Bagging (Root Computation)

The MMR root is computed by bagging the mountain peaks:

1. **No peaks**: Return `domain_hash(DOMAIN_MMR_BAGGING, b"")`.
2. **Single peak**: Return the peak hash directly.
3. **Multiple peaks**: Iteratively hash from right to left:

```
acc = peaks[-1]
for peak in peaks[-2::-1]:
    acc = SHA-256(DOMAIN_MMR_BAGGING ‖ len(DOMAIN_MMR_BAGGING)₄ ‖ peak ‖ acc)
```

## Security Considerations

### Domain Separation

Domain separation prevents the following attacks:

- **Hash substitution**: A hash computed in one context cannot be substituted in another.
- **Signature replay**: A signature produced under one domain cannot be replayed in another.
- **Cross-protocol attacks**: Even if two protocols use the same data, their hashes are independent.

### Key Security

- **Private key protection**: The 32-byte private key is never exposed outside the `ed25519` module.
- **Key versioning**: Each key has a unique version number, enabling signature attribution.
- **Revocation**: Compromised keys can be revoked to prevent future use.

### MMR Integrity

- **Type prefixes**: Leaf and branch hashes use different prefix bytes, preventing second pre-image attacks.
- **Peak bagging**: The root computation is deterministic and replay-verifiable.
- **Proof verification**: Inclusion and consistency proofs are verified against the current root.

### Cryptographic Backend

All cryptographic operations delegate to PyNaCl, which wraps libsodium's vetted Ed25519 implementation. SHA-256 is provided by Python's standard `hashlib` module.
