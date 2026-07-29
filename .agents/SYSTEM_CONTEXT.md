# System Context — VVU Earth Tech

## Project Overview

**VVU Earth Tech** is a cryptographic evidence platform that transforms trust from hope into proof. The system provides a deterministic, append-only ledger with Ed25519-signed receipts, Merkle Mountain Range (MMR) proofs, and zero-knowledge proof artifacts for municipalities, utilities, and developers.

**Mission**: From hope to proof. From trust to verification.

## Dual-Stack Architecture

The project consists of two primary subsystems:

### 1. Next.js Dashboard (Frontend)
- **Framework**: Next.js 16 + React 19 + TypeScript
- **UI**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **State**: Zustand + React Query (TanStack)
- **Testing**: Vitest
- **Port**: 3000
- **Location**: `/src/` (root level)

### 2. Python Ledger Service (Backend)
- **Language**: Python 3.11+
- **Framework**: Custom (no web framework — gRPC planned)
- **Crypto**: PyNaCl (Ed25519), hashlib (SHA-256)
- **Testing**: pytest + hypothesis
- **Linting**: Ruff + MyPy (strict)
- **Location**: `/vvu-earth-ledger/`

## The 7 Product Tabs

The dashboard presents 7 product tabs, each representing a distinct VVU Earth Tech product:

| # | Product | Tag | Status | Description |
|---|---------|-----|--------|-------------|
| 1 | **Trust Sphere** | TS | ONLINE | Living verification state space. Identity → Contribution → Receipt → Hash → ZK Proof → Trust. Fibonacci sphere visualization. |
| 2 | **Epistemic Runtime** | ER | ONLINE | Invariant-enforced DAG control plane. Policy DSL (.epd), sharded CRDTs, self-repairing merges, MMR ancestry proofs. |
| 3 | **ProofBridge** | PB | COMING_ONLINE | Verifiable receipt issuance bridge. Ed25519-signed receipts anchored into the MMR and exposed as ZK-proof artifacts. |
| 4 | **AIR Runtime** | AIR | COMING_ONLINE | Agentic Inference Runtime kernel. Circuit Breaker state machine, NATS durable queue, HLC merge, Hard-Failure gates. |
| 5 | **Ubuntu Pools** | UP | ONLINE | Community savings circles (stokvel) where members contribute and the system proves every contribution is recorded honestly. |
| 6 | **HBK** | HBK | COMING_ONLINE | Hydro Bayesian Kernel. Reproducible MCMC derivation logs signed with Ed25519. Brier Score > 0.02 triggers TRIP verdict. |
| 7 | **72h Simulation** | SIM | ONLINE | Full 72-hour VVU-VAL-001 validation loop with HBK digital twin prototype. Real-time Git Actions log. |

## Organizational Structure

The codebase is organized into three tiers:

### Open-Source (`/open-source/`)
- **air-kernel/**: Agentic Inference Runtime kernel re-export
- **epistemic-runtime/**: Epistemic Runtime re-export
- **safe-krypte-basic/**: Signer primitives (Ed25519, HMAC)
- **safe-liner-basic/**: DPI proxy placeholder
- **hbk-adapter/**: Hydro-Bayesian Kernel adapter
- **earth-tech-ui/**: Shared UI components (noise suppression, spatial network, 500m target tracker)

### Commercial (`/commercial/`)
- **tee-attestation/**: Trusted Execution Environment attestation (NOT_IMPLEMENTED)
- **zk-prover-gpu/**: GPU-accelerated zero-knowledge prover (NOT_IMPLEMENTED)
- **compliance-automation/**: Automated compliance reporting (NOT_IMPLEMENTED)
- **enterprise-sso/**: Enterprise SSO integration (NOT_IMPLEMENTED)
- **feature-gate.ts**: License-tier feature gating

### Shared (`/shared/`)
- **license/**: License schema, validator, and signing framework
- **types/**: Shared TypeScript type definitions
- **vetps/**: VETPs (Verifiable Evidence Token Protocols) schema
- **verifiers/**: Verifier interfaces
- **protocols/**: Protocol definitions
- **tenant/**: Multi-tenant identity

## Cryptographic License Framework

The project uses a 4-tier license system enforced at the code level:

| Tier | Scope | Features |
|------|-------|----------|
| **OPEN_SOURCE** | Community | Basic kernel, MMR, proofs, receipts |
| **PRO** | Small teams | + AIR Runtime, Policy DSL, Ubuntu Pools |
| **ENTERPRISE** | Organizations | + TEE, ZK Prover, Compliance Automation, SSO |
| **GOVERNANCE** | Municipalities | + Full audit, custom policies, dedicated support |

License validation uses Ed25519 digital signatures. The feature gate decorator enforces tier-based access at runtime. The golden-rule-checker enforces import boundaries at build time.

## Current State

- **v0.8**: Complete — 12/12 kernel assertions pass, 57/57 Vitest tests pass, all production integrations wired
- **v0.12 Refactor**: In progress — reorganizing from single-stack to dual-stack architecture
- **Kernel**: Deterministic replay verified, RFC 8785 canonicalization, SHA-256 hashing, MMR proofs
- **Signers**: Ed25519, ECDSA P-384, RSA-PSS, AWS KMS, IAM Federation, OIDC
- **Storage**: InMemoryWORM (dev), S3 Object Lock with COMPLIANCE retention (prod)
- **Dashboard**: 20+ section tabs rendering correctly, zero lint errors

## Key Files

| File | Purpose |
|------|---------|
| `EXECUTION_CONTRACT.md` | Authoritative contract — the source of truth for all kernel behavior |
| `src/lib/kernel/` | Core deterministic kernel (TypeScript) |
| `src/engine/` | Dependency-injected providers (clock, entropy, UUID, signer, storage) |
| `src/signer/` | Production signer modules |
| `src/storage/` | Storage drivers |
| `src/components/vvu/products.ts` | Product definitions and metadata |
| `vvu-earth-ledger/src/production_ledger/` | Python ledger service |
| `shared/license/` | License schema and validator |
| `scripts/` | Build, verification, and deployment scripts |
| `docs/governance/adrs/` | Architecture Decision Records |

## Constitutional Rules

These are inviolable rules that govern all development:

1. **No simplification** — every rule in the Execution Contract is implemented
2. **No redesign** — no shortcuts, no "better ideas"
3. **No guessing** — if uncertain, re-read the contract
4. **No `Math.random()` / `Date.now()` / `crypto.randomUUID()`** in the kernel
5. **No `JSON.stringify()`** for hashing — only RFC 8785
6. **No FNV, CRC, or ad-hoc hashing** — only SHA-256
7. **Evidence is append-only** — WORM storage, no delete, no update
