# Security Rules — VVU Earth Tech

## Overview

This document defines the security rules and requirements for all code in the VVU Earth Tech project. These rules are mandatory and non-negotiable.

---

## 1. No Secrets in Code

**Rule**: Never commit secrets, API keys, passwords, private keys, or tokens to the repository.

**Requirements**:
- All secrets must be stored in environment variables or secret management systems (AWS Secrets Manager, AWS KMS)
- `.env` files must be listed in `.gitignore` and never committed
- Use `.env.example` files with placeholder values for documentation
- Private keys must be generated in secure environments and stored in HSMs or KMS
- If a secret is accidentally committed, rotate it immediately and remove from git history

**Enforcement**:
- `.gitignore` blocks `.env`, `.env.local`, `.env.*.local`
- CI pipeline should include secret scanning (GitLeaks, TruffleHog)
- Code review must check for secrets before merge

---

## 2. Ed25519 Domain Separation

**Rule**: All Ed25519 signature operations must use domain separation strings to prevent cross-context signature reuse.

**Requirements**:
- Each signature context must include a unique domain string
- Domain strings must be prefixed with the application name: `vvu-earth-tech:receipt:`, `vvu-earth-tech:mmr:`, etc.
- Signatures for receipts must not be valid for MMR proofs and vice versa
- Domain strings must be documented in the code and ADRs

**Example** (TypeScript):
```typescript
const RECEIPT_DOMAIN = "vvu-earth-tech:receipt:v1";
const signature = await signer.sign(`${RECEIPT_DOMAIN}:${canonicalData}`);
```

**Example** (Python):
```python
RECEIPT_DOMAIN = "vvu-earth-tech:receipt:v1"
signature = signing_key.sign(f"{RECEIPT_DOMAIN}:{canonical_data}".encode())
```

---

## 3. Input Validation

**Rule**: All external inputs must be validated before processing.

**Requirements**:
- API endpoints must validate request bodies using Zod schemas (TypeScript) or Pydantic models (Python)
- URL parameters must be validated and sanitized
- File uploads must be validated for type, size, and content
- Never trust client-side data — always validate on the server
- Schema validation must be the first step in the acceptance pipeline

**Enforcement**:
- `src/lib/kernel/schema-registry.ts` validates all observations
- `vvu-earth-ledger/src/production_ledger/validator_registry.py` validates all ledger inputs
- API routes must use validation middleware

---

## 4. SQL Injection Prevention

**Rule**: All database queries must use parameterized statements.

**Requirements**:
- Never use string concatenation or interpolation in SQL queries
- Use Prisma's query builder (TypeScript) or parameterized queries (Python)
- Use `sqlite3` parameterized queries in the Python ledger
- Never pass user input directly into SQL

**Example** (Safe):
```typescript
// Prisma — parameterized by default
const user = await prisma.user.findUnique({ where: { id: validatedId } });
```

```python
# Python — parameterized
cursor.execute("SELECT * FROM facts WHERE fact_id = ?", (fact_id,))
```

**Example** (Unsafe — NEVER DO THIS):
```python
# UNSAFE — SQL injection
cursor.execute(f"SELECT * FROM facts WHERE fact_id = '{fact_id}'")
```

---

## 5. XSS Prevention

**Rule**: All user-generated content must be sanitized before rendering.

**Requirements**:
- React's JSX automatically escapes values (default XSS protection)
- Never use `dangerouslySetInnerHTML` with user content
- Use `DOMPurify` or similar if HTML rendering is required
- Validate and sanitize all text content before rendering
- Use Content Security Policy (CSP) headers

**Enforcement**:
- ESLint rule: `react/no-danger` (recommended)
- CSP headers in `next.config.ts`
- Review all uses of `dangerouslySetInnerHTML` in code review

---

## 6. CSRF Protection

**Rule**: State-changing API endpoints must be protected against Cross-Site Request Forgery.

**Requirements**:
- Use Next.js built-in CSRF protection for same-origin requests
- Implement CSRF tokens for cross-origin form submissions
- Use `SameSite=Strict` or `SameSite=Lax` cookie attributes
- Validate `Origin` and `Referer` headers on state-changing requests
- Use custom headers for AJAX requests (X-Requested-With)

**Note**: Current implementation does not have CSRF protection. This is a known limitation documented in `KNOWN_LIMITATIONS.md`.

---

## 7. Rate Limiting

**Rule**: API endpoints must enforce rate limits to prevent abuse.

**Requirements**:
- Implement rate limiting on all public API endpoints
- Use IP-based rate limiting for anonymous requests
- Use user-based rate limiting for authenticated requests
- Rate limits should be configurable per endpoint
- Return `429 Too Many Requests` with `Retry-After` header

**Recommended limits**:
| Endpoint | Anonymous | Authenticated |
|----------|-----------|---------------|
| `/api/kernel/verify` | 10/min | 60/min |
| `/api/policies` | 30/min | 120/min |
| `/api/proofs` | 30/min | 120/min |
| `/api/metrics` | 10/min | 60/min |
| `/api/contact` | 3/min | 3/min |

**Note**: Rate limiting is not yet implemented. This is a known limitation.

---

## 8. TLS 1.3 Requirements

**Rule**: All production communications must use TLS 1.3 or higher.

**Requirements**:
- All client-server communication must use HTTPS
- All server-server communication must use TLS 1.3
- gRPC connections must use TLS with mTLS for service-to-service
- Reject TLS versions below 1.3 in production
- Use strong cipher suites: `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`
- Use HSTS headers with `max-age=31536000; includeSubDomains; preload`

**Note**: TLS is not yet implemented for the Python ledger. This is a known limitation.

---

## 9. Key Rotation Schedule

**Rule**: Cryptographic signing keys must be rotated on a defined schedule.

**Rotation Schedule**:
| Key Type | Rotation Period | Procedure |
|----------|----------------|-----------|
| Master Ed25519 key | Annually | Generate new key pair, sign new key with old key, update validators |
| Sub-keys (per product) | Quarterly | Re-sign with master key, update product configuration |
| Session keys | 24 hours | Automatic rotation via session management |
| API keys | 90 days | User-initiated rotation via dashboard |
| TLS certificates | 90 days | Automatic via Let's Encrypt / ACME |
| AWS KMS keys | Annually | KMS automatic key rotation |

**Key Rotation Procedure**:
1. Generate new key pair in HSM/KMS
2. Sign new public key with old private key (key transition proof)
3. Update all validators to accept both old and new keys during transition period
4. After transition period, remove old key from acceptance list
5. Archive old key material (never delete)

---

## 10. Secure Dependency Management

**Rule**: All dependencies must be vetted and kept up-to-date.

**Requirements**:
- Use Dependabot for automated dependency updates (weekly)
- Review all dependency updates for security advisories
- Pin exact versions in production (no ranges)
- Use `npm audit` and `pip audit` in CI
- Never install packages from untrusted sources
- Review dependency licenses for compatibility with Apache 2.0

**Approved Cryptographic Libraries**:
| Library | Language | Purpose |
|---------|----------|---------|
| `@noble/ed25519` | TypeScript | Ed25519 signatures |
| `@noble/curves` | TypeScript | Elliptic curve operations |
| `@noble/hashes` | TypeScript | SHA-256 hashing |
| `PyNaCl` | Python | Ed25519 signatures |
| `hashlib` | Python | SHA-256 hashing (stdlib) |

**Banned Cryptographic Libraries**:
- Any library that uses non-standard hash algorithms
- Any library that implements custom crypto (not reviewed by experts)
- `crypto-js` (use `@noble/hashes` instead)
- Any MD5, SHA-1, or FNV library

---

## Hard Failure Codes

These security rules are enforced by the Hard Failure (HF) code system:

| Code | Rule | Trigger |
|------|------|---------|
| HF-001 | License verification | Unsigned or expired license |
| HF-002 | Cryptographic integrity | Hash/signature mismatch |
| HF-009 | mTLS authentication | Missing or invalid client certificate |
| HF-010 | Rate limiting | Request rate exceeds threshold |
| HF-011 | Audit trail | Missing audit log entry |

When a Hard Failure is triggered, the operation is immediately halted and the event is logged. No silent failures are permitted.
