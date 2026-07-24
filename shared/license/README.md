# Shared License

**License:** Apache 2.0 (shared between open-source and commercial tiers)
**Tier:** Shared — Cross-Tier Infrastructure

## Purpose

The `shared/license` module provides the license validation infrastructure that
bridges the open-source and commercial tiers of the VVU EARTH TECH platform.

### Components

| File | Purpose |
|------|---------|
| `license-schema.ts` | Defines `LicenseTier`, `LicensePayload`, `SignedLicense`, `LicenseValidationResult` types |
| `validator.ts` | `LicenseValidator` class — validates signed licenses using Ed25519 + RFC 8785 |

### License Tiers

| Tier | Modules | Price |
|------|---------|-------|
| `community` | air-kernel, epistemic-runtime, safe-krypte-basic, safe-liner-basic, hbk-adapter | Free (Apache 2.0) |
| `professional` | + tee-attestation, compliance-automation | Paid |
| `enterprise` | + zk-prover-gpu, enterprise-sso | Premium |

### Validation Flow

1. **Canonicalize** the `LicensePayload` using RFC 8785 JCS
2. **Hash** the canonicalized payload with SHA-256
3. **Verify** the Ed25519 signature against the authority public key
4. **Check** schema version, expiration, module authorization, and issuer
5. **Return** a `LicenseValidationResult` with the validated tier and authorized modules

### Key Design Principles

- **Deterministic validation** — uses the AIR Kernel's canonicalization (RFC 8785) and hashing (SHA-256)
- **No secrets embedded** — the authority public key must be provided via configuration
- **Community access is always free** — `communityAccess()` returns a valid result with no license required
- **Commercial modules throw `NOT_IMPLEMENTED` without a valid license**

### Usage

```typescript
import { LicenseValidator, communityAccess } from 'shared/license';

// Without a license — community tier
const result = communityAccess();
console.log(result.authorizedModules); // ['air-kernel', 'epistemic-runtime', ...]

// With a commercial license
const validator = new LicenseValidator(authorityPublicKey);
const result = validator.validate(signedLicense);
if (result.valid && result.authorizedModules.includes('zk-prover-gpu')) {
  // Access granted
}
```
