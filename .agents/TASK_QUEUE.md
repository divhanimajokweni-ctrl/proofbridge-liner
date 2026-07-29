# Task Queue — VVU Earth Tech

## Current Priorities

Tasks are ordered by priority. Each task includes a status, priority level, and responsible team.

---

## P0: Critical (In Progress)

### v0.12 Refactor — 8 Steps

| Step | Task | Status | Priority | Team |
|------|------|--------|----------|------|
| 1 | Extract Python ledger service from TypeScript monorepo | ✅ COMPLETE | P0 | @vvu-earth-tech/ledger |
| 2 | Implement gRPC/HTTP bridge between Next.js and Python ledger | 🔄 IN PROGRESS | P0 | @vvu-earth-tech/ledger |
| 3 | Add TLS 1.3 + mTLS to ledger service | ⬜ PENDING | P0 | @vvu-earth-tech/infra |
| 4 | Implement replication protocol for multi-node ledger | ⬜ PENDING | P0 | @vvu-earth-tech/ledger |
| 5 | Add PostgreSQL storage backend (replace SQLite for production) | ⬜ PENDING | P0 | @vvu-earth-tech/ledger |
| 6 | Implement snapshot and replay for Python ledger | ⬜ PENDING | P0 | @vvu-earth-tech/ledger |
| 7 | Wire Next.js dashboard to Python ledger via gRPC | ⬜ PENDING | P0 | @vvu-earth-tech/frontend |
| 8 | End-to-end integration test: dashboard → gRPC → Python ledger → S3 | ⬜ PENDING | P0 | @vvu-earth-tech/core |

---

## P1: High Priority

### CI Pipeline

| Task | Status | Priority | Team |
|------|--------|----------|------|
| Set up GitHub Actions CI workflow | ⬜ PENDING | P1 | @vvu-earth-tech/infra |
| Add lint + type check step (ESLint + MyPy) | ⬜ PENDING | P1 | @vvu-earth-tech/infra |
| Add test step (Vitest + pytest) | ⬜ PENDING | P1 | @vvu-earth-tech/infra |
| Add build step (Next.js + Python wheel) | ⬜ PENDING | P1 | @vvu-earth-tech/infra |
| Add security scanning (GitLeaks, Bandit, npm audit) | ⬜ PENDING | P1 | @vvu-earth-tech/infra |
| Add Dependabot configuration | ✅ COMPLETE | P1 | @vvu-earth-tech/infra |
| Add branch protection rules | ⬜ PENDING | P1 | @vvu-earth-tech/infra |

### Documentation

| Task | Status | Priority | Team |
|------|--------|----------|------|
| Write API documentation (OpenAPI spec) | ⬜ PENDING | P1 | @vvu-earth-tech/docs |
| Write deployment guide | ⬜ PENDING | P1 | @vvu-earth-tech/docs |
| Write operator runbook | ⬜ PENDING | P1 | @vvu-earth-tech/docs |
| Write integration guide for developers | ⬜ PENDING | P1 | @vvu-earth-tech/docs |
| Update README with v0.12 architecture | ⬜ PENDING | P1 | @vvu-earth-tech/docs |

---

## P2: Medium Priority

### Deployment Assets

| Task | Status | Priority | Team |
|------|--------|----------|------|
| Create Docker Compose for full stack | ⬜ PENDING | P2 | @vvu-earth-tech/infra |
| Create Kubernetes manifests (Helm chart) | ⬜ PENDING | P2 | @vvu-earth-tech/infra |
| Create Terraform modules for AWS infrastructure | ⬜ PENDING | P2 | @vvu-earth-tech/infra |
| Set up ArgoCD for GitOps deployment | ⬜ PENDING | P2 | @vvu-earth-tech/infra |
| Create monitoring stack (Prometheus + Grafana) | ⬜ PENDING | P2 | @vvu-earth-tech/infra |

### Security Hardening

| Task | Status | Priority | Team |
|------|--------|----------|------|
| Implement CSRF protection for API routes | ⬜ PENDING | P2 | @vvu-earth-tech/frontend |
| Implement rate limiting for API endpoints | ⬜ PENDING | P2 | @vvu-earth-tech/infra |
| Add Content Security Policy headers | ⬜ PENDING | P2 | @vvu-earth-tech/frontend |
| Implement secret scanning in CI | ⬜ PENDING | P2 | @vvu-earth-tech/infra |
| Generate Ed25519 master key pair (secure environment) | ⬜ PENDING | P2 | @vvu-earth-tech/crypto |
| Fix Golden Rule Checker false positives | ⬜ PENDING | P2 | @vvu-earth-tech/core |

---

## P3: Lower Priority

### Benchmarking

| Task | Status | Priority | Team |
|------|--------|----------|------|
| Benchmark MMR performance (append, proof, verify) | ⬜ PENDING | P3 | @vvu-earth-tech/ledger |
| Benchmark acceptance pipeline throughput | ⬜ PENDING | P3 | @vvu-earth-tech/ledger |
| Benchmark gRPC bridge latency | ⬜ PENDING | P3 | @vvu-earth-tech/infra |
| Load test with 10K concurrent connections | ⬜ PENDING | P3 | @vvu-earth-tech/infra |
| Profile memory usage under load | ⬜ PENDING | P3 | @vvu-earth-tech/ledger |

### Commercial Features

| Task | Status | Priority | Team |
|------|--------|----------|------|
| Implement TEE Attestation module | ⬜ PENDING | P3 | @vvu-earth-tech/crypto |
| Implement ZK Prover GPU module | ⬜ PENDING | P3 | @vvu-earth-tech/crypto |
| Implement Compliance Automation module | ⬜ PENDING | P3 | @vvu-earth-tech/core |
| Implement Enterprise SSO module | ⬜ PENDING | P3 | @vvu-earth-tech/infra |

---

## Completed

| Task | Status | Date |
|------|--------|------|
| v0.8 kernel — 12/12 assertions pass | ✅ COMPLETE | 2024-Q4 |
| 57/57 Vitest tests pass | ✅ COMPLETE | 2024-Q4 |
| S3 Object Lock driver | ✅ COMPLETE | 2024-Q4 |
| AWS KMS / IAM / OIDC signers | ✅ COMPLETE | 2024-Q4 |
| Schema emitter (10 schemas) | ✅ COMPLETE | 2024-Q4 |
| VVU organizational structure | ✅ COMPLETE | 2024-Q4 |
| License framework (4-tier) | ✅ COMPLETE | 2024-Q4 |
| Feature gate decorator | ✅ COMPLETE | 2024-Q4 |
| Golden Rule Checker | ✅ COMPLETE | 2024-Q4 |
| Boundary enforcement scripts | ✅ COMPLETE | 2024-Q4 |
| Repository hygiene files | ✅ COMPLETE | 2025-Q1 |
| .agents/ directory | ✅ COMPLETE | 2025-Q1 |
| GitHub configuration | ✅ COMPLETE | 2025-Q1 |
