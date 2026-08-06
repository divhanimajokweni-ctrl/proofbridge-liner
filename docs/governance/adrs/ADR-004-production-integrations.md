---
id: ADR-004
title: Production Storage and Signing Integrations
author: Epistemic Runtime Team
reviewers: Architecture Review Board
approver: Constitutional Council
implementation_owner: Runtime Team
verification_owner: Evidence Office
status: Accepted
date: "2025-07-22"
---

# Context

The Epistemic Runtime v0.8 kernel achieves deterministic replay and 12/12 assertion verification using development providers (in-memory WORM, HMAC signing). Production deployments require:

1. **Immutable evidence storage** — S3 Object Lock in COMPLIANCE mode
2. **Cryptographic signing** — AWS KMS with IAM role assumption
3. **Identity-based signing** — IAM Federation and OIDC token-based signing
4. **Portable schema artifacts** — JSON Schema files emitted during build

# Decision

Implement four production integration modules:

## 1. S3ObjectLockStorage (`src/storage/s3-object-lock.ts`)

- Uses `@aws-sdk/client-s3` for all operations
- Facts and proofs stored with Object Lock COMPLIANCE mode (100-year retention)
- Projections stored WITHOUT Object Lock (mutable by design)
- Key layout: `{prefix}/facts/{id}.json`, `{prefix}/proofs/{factId}/{proofId}.json`, `{prefix}/projections/{id}.json`
- Pagination support for `ListObjectsV2` with `ContinuationToken`
- Batch reads via `Promise.allSettled` for resilience
- `NoSuchKey` → null (not an error); `AccessDenied` → throw with IAM guidance
- `healthCheck()` method via `HeadBucket`

## 2. AWSKMSSigner (`src/signer/aws-kms.ts`)

- Uses `@aws-sdk/client-kms` for Sign, Verify, GetPublicKey
- MessageType = 'DIGEST' (client-side SHA-256 hashing)
- Auto-detects signing algorithm from key type:
  - RSA keys → `RSASSA_PKCS1_V1_5_SHA_256`
  - ECC keys → `ECDSA_SHA_256`
- Public key cached after first `GetPublicKey` call (DER hex)
- Error handling: NotFoundException, AccessDeniedException, DisabledException, KMSInvalidStateException

## 3. IAMFederationSigner (`src/signer/aws-kms.ts`)

- Uses `@aws-sdk/client-sts` for `AssumeRole`
- Delegates actual signing to `AWSKMSSigner` with assumed credentials
- Credential caching with expiry checking
- Re-assumes on `ExpiredToken` error
- Clear error messages for trust policy misconfigurations

## 4. OIDCSigner (`src/signer/aws-kms.ts`)

- HMAC-SHA256(oidcToken, canonicalBytes) for deterministic signatures
- Public key fingerprint = SHA-256(issuer:audience)
- Constant-time comparison for verification
- Does NOT call external OIDC provider at runtime — token is injected via constructor

## 5. Schema Emitter (`scripts/generate-schema.ts`)

- Traverses runtime type definitions and outputs Draft 2020-12 JSON Schema `.json` files
- 10 schemas covering all kernel types
- Run during build process: `npx tsx scripts/generate-schema.ts`
- Custom output directory via `--outdir` flag

# Consequences

**Positive:**
- Production-ready WORM storage with infrastructure-level enforcement
- No static credentials — IAM roles and OIDC tokens for signing
- Deterministic signing via KMS (same key + same input → same signature)
- Portable schema artifacts for cross-platform validation
- Health check support for operational monitoring

**Negative:**
- AWS SDK bundle size increase (~2MB for S3 + KMS + STS clients)
- KMS Sign API is async — synchronous `sign()` interface blocks on the call
- S3 Object Lock requires bucket pre-configuration (cannot be added to existing bucket)
- OIDCSigner HMAC is not equivalent to KMS-backed signing — different security properties

# Compliance

This decision supports the Execution Contract:
- WORM storage at infrastructure level (COMPLIANCE mode cannot be overridden)
- No static credentials (Rule: injected providers only)
- Deterministic signatures (KMS produces deterministic output for RSA keys)
- Schema portability (Draft 2020-12 schemas are platform-independent)

# Verification

Evidence Office will verify:
- S3 PutObject with Object Lock COMPLIANCE succeeds
- Duplicate fact append to S3 is rejected by WORM enforcement
- KMS Sign/Verify round-trip succeeds
- IAM Federation assumes role and signs successfully
- Schema emitter produces valid Draft 2020-12 JSON Schema files
- 12/12 kernel assertions still pass with production providers

# Implementation Plan

- `src/storage/s3-object-lock.ts` — S3 Object Lock driver
- `src/signer/aws-kms.ts` — AWS KMS, IAM Federation, OIDC signers
- `scripts/generate-schema.ts` — Schema emitter
- Dependencies: `@aws-sdk/client-s3`, `@aws-sdk/client-kms`, `@aws-sdk/client-sts`
