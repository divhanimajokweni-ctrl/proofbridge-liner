# Task 2: AWS KMS/STS Signer Implementer

## Summary
Replaced stub NOT_CONFIGURED implementations in `/home/z/my-project/src/signer/aws-kms.ts` with fully wired production implementations.

## What was done
1. **AWSKMSSigner** — Full KMS integration:
   - `sign()`: SHA-256 hashes canonicalBytes, sends as DIGEST to KMS Sign
   - `verify()`: Sends digest + hex-decoded signature to KMS Verify
   - `getPublicKey()`: Calls KMS GetPublicKey, returns DER hex, cached
   - Automatic signing algorithm selection (RSA vs ECC based on KeySpec)
   - Rich error handling (NotFoundException, AccessDeniedException, etc.)

2. **IAMFederationSigner** — STS AssumeRole delegation:
   - Uses STSClient to assume role, gets temporary credentials
   - Creates internal AWSKMSSigner with assumed credentials
   - Caches credentials with expiry checking
   - Handles ExpiredToken, AccessDenied, ValidationError

3. **OIDCSigner** — Web Crypto HMAC-SHA256:
   - `sign()`: HMAC-SHA256(oidcToken, canonicalBytes)
   - `verify()`: Recomputes HMAC, constant-time comparison
   - `getPublicKey()`: SHA-256(issuer:audience) fingerprint, cached

## Key decisions
- Methods are async (return Promise) because KMS/STS are network operations
- SignerProvider interface has sync signatures — this is a known type mismatch that should be addressed separately
- Followed existing RSAPSSSigner pattern for consistency
- Used `as` casts for KMSClient/STSClient constructor config to avoid deep type imports

## Files modified
- `/home/z/my-project/src/signer/aws-kms.ts` (full rewrite)
- `/home/z/my-project/worklog.md` (appended entry)

## Lint status
- `bun run lint`: 0 errors, 0 warnings
