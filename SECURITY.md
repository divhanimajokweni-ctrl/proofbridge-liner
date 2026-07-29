# Security Policy — VVU Earth Tech

## Supported Versions

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 0.12.x  | :white_check_mark: | Active development |
| 0.8.x   | :white_check_mark: | Maintenance |
| < 0.8   | :x:                | End of life |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in VVU Earth Tech, please report it responsibly.

**Do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

- **Email**: security@vvu-earthtech.com
- **PGP Key**: Available upon request

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability and its potential impact
2. **Steps to reproduce** the issue (if applicable)
3. **Affected versions** and components
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| 24 hours | Acknowledge receipt of the report |
| 72 hours | Initial assessment and severity classification |
| 7 days | Detailed analysis and remediation plan |
| 30 days | Fix developed and tested (critical vulnerabilities) |
| 90 days | Fix developed and tested (non-critical vulnerabilities) |

## Security Update Policy

- Security patches are released as patch version increments (e.g., 0.12.1)
- Critical vulnerabilities trigger immediate hotfix releases
- Security advisories are published on GitHub Security Advisories
- Affected users are notified via GitHub Dependabot alerts
- Changelog entries are marked with `[SECURITY]` prefix

## Known Security Limitations

### Cryptographic Implementation

1. **Ed25519 Domain Separation**: The current implementation uses Ed25519 signatures for both receipt signing and MMR proofs. Domain separation strings are applied to prevent cross-context signature reuse, but this has not been formally audited.

2. **Key Management**: The master Ed25519 signing key must be stored in a Hardware Security Module (HSM) or AWS KMS in production. The current implementation supports AWS KMS, IAM Federation, and OIDC signers, but the master key pair generation ceremony has not been performed.

3. **No Forward Secrecy**: The current ledger design does not provide forward secrecy for stored facts. Once a signing key is compromised, all previously signed facts can be forged. This is mitigated by the append-only nature of the ledger (merkle proofs reveal tampering), but the signatures themselves are not forward-secure.

### Network Security

4. **gRPC/TLS Not Yet Implemented**: The Python ledger service communicates over plaintext HTTP. TLS 1.3 termination and mTLS authentication are planned but not yet implemented.

5. **No Rate Limiting**: API endpoints do not currently enforce rate limits. This could allow denial-of-service attacks against the ledger service.

6. **No CSRF Protection**: The Next.js dashboard API routes do not implement CSRF protection tokens. This is acceptable for same-origin API calls but should be hardened for cross-origin scenarios.

### Data Security

7. **SQLite Storage**: The development database uses SQLite, which does not support row-level security or encryption at rest. Production deployments must use PostgreSQL with encryption at rest.

8. **No PII Encryption at Rest**: While PII redaction is implemented in the acceptance pipeline (before canonicalization and hashing), the raw observation data may contain PII in transit. End-to-end encryption of observation payloads is planned.

9. **S3 Object Lock**: The WORM storage implementation relies on AWS S3 Object Lock with COMPLIANCE retention mode. This provides strong immutability guarantees, but the 100-year retention period may be subject to AWS account-level constraints.

### Operational Security

10. **No Formal Security Audit**: The codebase has not undergone a formal third-party security audit. Internal threat modeling and adversarial testing have been performed, but professional audit is pending.

11. **Docker Not Available in Current Environment**: Container security scanning and image hardening are not yet possible in the current development environment.

12. **No Secret Scanning in CI**: Automated secret scanning (e.g., GitLeaks, TruffleHog) is not yet integrated into the CI pipeline.

## Cryptographic Implementation Notes

### Ed25519 Signatures

- Implementation: `@noble/ed25519` (TypeScript) and `PyNaCl` (Python)
- Domain separation: Each signature context includes a domain string to prevent cross-context reuse
- Key rotation: Master keys should be rotated annually. Sub-keys for specific products may be rotated more frequently.
- Verification: All signatures are verified on read, not just on write

### SHA-256 Hashing

- Implementation: `@noble/hashes/sha256` (TypeScript) and `hashlib.sha256` (Python)
- Canonicalization: RFC 8785 (JSON Canonicalization Scheme) is used before hashing
- No FNV, CRC, or ad-hoc hashing is used anywhere in the codebase (Constitutional Rule #5)

### MMR (Merkle Mountain Range)

- Implementation: Custom append-only Merkle tree with bagging
- Proof verification: Inclusion proofs are verified against the current root
- Root rotation: Root updates are themselves recorded as facts in the ledger

## Responsible Disclosure

We follow responsible disclosure practices:

1. **We will not** take legal action against researchers who responsibly disclose vulnerabilities
2. **We will** credit researchers in our security advisories (unless anonymity is requested)
3. **We ask** that researchers allow us 90 days to address vulnerabilities before public disclosure
4. **We will** keep researchers informed of our progress throughout the remediation process

## Security Contact

- **Primary**: security@vvu-earthtech.com
- **PGP Fingerprint**: Available upon request
- **Response Team**: @vvu-earth-tech/crypto and @vvu-earth-tech/infra
