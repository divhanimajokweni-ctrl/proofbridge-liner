# Known Limitations — VVU Earth Tech

## Overview

This document catalogs known limitations of the VVU Earth Tech platform. Each limitation includes a description, impact assessment, and planned remediation.

---

## Critical Limitations

### 1. Python Ledger Not Yet Production-Deployed

**Status**: The Python ledger service (`vvu-earth-ledger/`) is implemented and tested but has not been deployed to production.

**Impact**: The TypeScript kernel (`src/lib/kernel/`) is the production runtime. The Python ledger is a parallel implementation intended for the v0.12 architecture where it will serve as the backend service.

**Remediation**: Complete v0.12 refactor steps 2-8 (gRPC bridge, TLS, replication, PostgreSQL, wiring).

**ETA**: v0.12 release

---

### 2. gRPC/TLS Not Yet Implemented

**Status**: The Python ledger service communicates over plaintext HTTP. There is no gRPC or TLS implementation.

**Impact**: The ledger service cannot be securely deployed in production. All communications are unencrypted and unauthenticated.

**Remediation**: Implement gRPC with TLS 1.3 and mTLS authentication.

**ETA**: v0.12 release

---

### 3. Replication Not Yet Tested at Scale

**Status**: The replication protocol (`replication.py`, `replication_protocol.py`) is implemented but has not been tested with multiple nodes or under load.

**Impact**: The ledger cannot be deployed in a multi-node configuration. Single-node deployment only.

**Remediation**: Multi-node replication testing with chaos engineering (partition, network, storage failures).

**ETA**: v0.12 release + 30 days

---

## High Impact Limitations

### 4. No Formal Security Audit

**Status**: The codebase has not undergone a formal third-party security audit. Internal threat modeling and adversarial testing have been performed.

**Impact**: Security vulnerabilities may exist that have not been discovered by internal review. The cryptographic implementation (Ed25519, MMR, SHA-256) should be audited by a professional cryptography firm.

**Remediation**: Engage a third-party security audit firm. Budget allocation pending.

**ETA**: Post v0.12 release

---

### 5. No CSRF Protection

**Status**: The Next.js dashboard API routes do not implement CSRF protection tokens.

**Impact**: State-changing API endpoints are vulnerable to Cross-Site Request Forgery attacks. This is acceptable for same-origin API calls but should be hardened for cross-origin scenarios.

**Remediation**: Implement CSRF tokens for all state-changing API endpoints.

**ETA**: v0.12 release

---

### 6. No Rate Limiting

**Status**: API endpoints do not currently enforce rate limits.

**Impact**: The system is vulnerable to denial-of-service attacks. An attacker could overwhelm the ledger service with requests.

**Remediation**: Implement IP-based and user-based rate limiting on all API endpoints.

**ETA**: v0.12 release

---

### 7. Benchmarking Not Yet Done

**Status**: No performance benchmarks have been run on the MMR, acceptance pipeline, or gRPC bridge.

**Impact**: Performance characteristics are unknown. The system may not meet latency or throughput requirements for production deployment.

**Remediation**: Run comprehensive benchmarks on MMR operations, acceptance pipeline, and gRPC bridge.

**ETA**: v0.12 release + 14 days

---

## Medium Impact Limitations

### 8. Docker Not Available in Current Environment

**Status**: The current development environment does not support Docker.

**Impact**: Container security scanning and image hardening are not possible. Local development cannot use the full stack (Next.js + Python ledger + PostgreSQL).

**Remediation**: Set up Docker-in-Docker or use a cloud-based development environment.

**ETA**: v0.12 release

---

### 9. SQLite Storage in Development

**Status**: The development database uses SQLite, which does not support row-level security, encryption at rest, or concurrent writes.

**Impact**: Development behavior may differ from production (PostgreSQL). Migration issues may not be discovered until deployment.

**Remediation**: Add PostgreSQL support for development environment.

**ETA**: v0.12 release

---

### 10. Commercial Modules Not Implemented

**Status**: TEE Attestation, ZK Prover GPU, Compliance Automation, and Enterprise SSO modules throw `NOT_IMPLEMENTED` errors.

**Impact**: Enterprise features are not available. The commercial tier cannot be activated.

**Remediation**: Implement commercial modules as part of enterprise tier development.

**ETA**: Post v0.12 release (enterprise tier)

---

### 11. No Ed25519 Master Key Pair

**Status**: The Ed25519 master signing key pair has not been generated.

**Impact**: License signing cannot be performed. The license validation framework is in place but cannot be activated.

**Remediation**: Generate master key pair in a secure environment (HSM). Store private key in AWS Secrets Manager. Distribute public key with the application.

**ETA**: Pre-production

---

### 12. Golden Rule Checker False Positives

**Status**: The Golden Rule Checker reports 4 false positive violations in open-source files due to "VVU EARTH TECH" appearing in company attribution comments.

**Impact**: CI pipeline would report false failures. The checker needs to exempt attribution comments.

**Remediation**: Update the Golden Rule Checker to exempt company attribution comments.

**ETA**: v0.12 release

---

## Low Impact Limitations

### 13. No Formal API Documentation

**Status**: API endpoints are documented in code comments and the architecture map, but there is no formal OpenAPI/Swagger specification.

**Impact**: External developers cannot easily discover and test API endpoints.

**Remediation**: Generate OpenAPI specification from API route definitions.

**ETA**: Post v0.12 release

---

### 14. No Multi-Tenancy Support

**Status**: The system supports a single tenant. Multi-tenant isolation is not implemented.

**Impact**: Each deployment serves a single organization. Multi-tenant SaaS deployment is not possible.

**Remediation**: Implement tenant isolation in the database and API layer.

**ETA**: Post v0.12 release (enterprise tier)

---

### 15. No Mobile Application

**Status**: The dashboard is a web application only. There is no native mobile application.

**Impact**: Mobile users must use the web browser. No offline support or push notifications.

**Remediation**: Consider React Native or PWA for mobile support.

**ETA**: TBD

---

### 16. No Internationalization

**Status**: The dashboard is in English only. No i18n support is implemented.

**Impact**: The system cannot be used by non-English speakers without translation.

**Remediation**: Implement next-intl for internationalization.

**ETA**: Post v0.12 release

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | Remediation planned for v0.12 |
| High | 4 | Remediation planned for v0.12 |
| Medium | 5 | Remediation planned post-v0.12 |
| Low | 4 | Remediation planned post-v0.12 |
