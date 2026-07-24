# Safe Krypte Basic

**License:** Apache 2.0
**Tier:** Open Source — Cryptographic Signer Primitives

## Purpose

Safe Krypte Basic provides the open-source signer primitives for the Epistemic
Runtime. These modules implement the `SignerProvider` interface from the AIR
Kernel and can be injected into `RuntimeKernel.createWithProviders()`.

### Available Signers

| Signer | Algorithm | Key Generation | Notes |
|--------|-----------|---------------|-------|
| `Ed25519SignerModule` | Ed25519 | `generateKeyPair()` (sync) | Fast, deterministic, synchronous |
| `ECDSAP384Signer` | ECDSA P-384 | `generateKeyPair()` (sync) | NIST curve, deterministic, synchronous |
| `RSAPSSSigner` | RSA-PSS-SHA256 | `generateKeyPair()` (async) | Requires `init()` before signing; async `signAsync()` available |

### Usage

```typescript
import { Ed25519SignerModule } from 'safe-krypte-basic';

const signer = new Ed25519SignerModule(privateKeyHex);
const signature = signer.sign(canonicalBytes);
const valid = signer.verify(canonicalBytes, signature, publicKeyHex);
```

### What's NOT Here

The following signer modules are available but not part of the open-source
Safe Krypte Basic package:
- `AWSKMSSigner` — cloud-managed AWS KMS signing
- `IAMFederationSigner` — AWS IAM role-based federation
- `OIDCSigner` — OIDC token-based signing

These are available in the internal `src/signer/aws-kms.ts` or through
the commercial `enterprise-sso` module.
