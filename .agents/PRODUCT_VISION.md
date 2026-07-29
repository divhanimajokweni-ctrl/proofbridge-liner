# Product Vision — VVU Earth Tech

## Mission

**From hope to proof. From trust to verification.**

VVU Earth Tech exists to transform how communities, municipalities, and utilities prove what happened — not through hope, trust, or opinion, but through cryptographic evidence that is deterministic, append-only, and independently verifiable.

We believe that the most vulnerable communities deserve the strongest guarantees. Every contribution to a savings circle, every water treatment reading, every grid frequency measurement should be recorded with the same cryptographic rigor that banks use for transactions — and anyone should be able to verify it without trusting us.

## The 7 Products

### 1. Trust Sphere (TS)

**Status**: ONLINE

A living verification state space. Identity → Contribution → Receipt → Hash → ZK Proof → Trust.

Trust Sphere visualizes the trust network as a Fibonacci sphere, where each node represents a verified entity and the density of connections represents the depth of cryptographic proof. It transforms abstract cryptographic evidence into an intuitive, visual representation of trust.

**Purpose**: Make cryptographic trust visible and intuitive.

### 2. Epistemic Runtime (ER)

**Status**: ONLINE

Invariant-enforced DAG control plane. Policy DSL (.epd), sharded CRDTs, self-repairing merges, MMR ancestry proofs.

The Epistemic Runtime is the deterministic engine at the heart of VVU Earth Tech. It enforces 7 Constitutional Rules, implements an 11-step acceptance pipeline, and guarantees that every observation is processed identically — every time, everywhere. It is the foundation upon which all other products are built.

**Purpose**: Provide deterministic, cryptographically verifiable evidence processing.

### 3. ProofBridge (PB)

**Status**: COMING_ONLINE

Verifiable receipt issuance bridge. Ed25519-signed receipts anchored into the MMR and exposed as ZK-proof artifacts.

ProofBridge is the bridge between the real world and the cryptographic world. When a water treatment plant records a chlorine reading, ProofBridge issues a receipt. When a stokvel member contributes R500, ProofBridge issues a receipt. Every receipt is signed with Ed25519, anchored into the MMR, and can be verified independently — even without trusting VVU Earth Tech.

**Purpose**: Issue verifiable receipts that prove what happened, when, and by whom.

### 4. AIR Runtime (AIR)

**Status**: COMING_ONLINE

The Agentic Inference Runtime kernel. Circuit Breaker state machine, NATS durable queue, HLC merge, Hard-Failure gates.

AIR Runtime is the control plane for autonomous agents. It provides a Circuit Breaker that fails closed (never open), a NATS-based durable queue for fact ingestion, Hybrid Logical Clock (HLC) merge for distributed ordering, and Hard-Failure gates that halt operations when safety constraints are violated.

**Purpose**: Provide safe, deterministic control for autonomous agent operations.

### 5. Ubuntu Pools (UP)

**Status**: ONLINE

A community savings circle — a stokvel — where members contribute money, and the system proves every contribution is recorded honestly, every payout is verifiable, and no one can quietly take more than they're owed. This is what all of this is for.

Ubuntu Pools is the human face of VVU Earth Tech. It takes the most powerful cryptographic technology — Ed25519 signatures, MMR proofs, ZK artifacts — and makes it work for people who save together. Every contribution is receipted. Every payout is verified. Every member can prove the pool is honest.

**Purpose**: Prove that community savings are honest, using cryptographic evidence.

### 6. HBK (Hydro Bayesian Kernel)

**Status**: COMING_ONLINE

Reproducible MCMC derivation logs signed with Ed25519. Brier Score > 0.02 triggers a TRIP verdict (HF-005).

HBK applies Bayesian inference to infrastructure data — water pressure, grid frequency, hospital census — and produces reproducible derivation logs. Every prediction is signed with Ed25519, and if the Brier Score exceeds 0.02, the system triggers a TRIP verdict (Hard Failure 005), halting automated actions until human review.

**Purpose**: Provide reproducible, signed predictions with built-in hallucination detection.

### 7. 72h Simulation (SIM)

**Status**: ONLINE

Full 72-hour VVU-VAL-001 validation loop with HBK digital twin prototype. Real-time Git Actions log. Cape Town water network simulation.

The 72h Simulation is the validation environment where all VVU Earth Tech products are tested together. It runs a full validation protocol (VVU-VAL-001) with a digital twin of Cape Town's water network, chaos engineering, and real-time telemetry. It proves that the system works end-to-end before deployment.

**Purpose**: Validate the entire system end-to-end before production deployment.

## Target Users

### Primary Users

| User | Need | Product |
|------|------|---------|
| **Municipalities** | Prove water treatment compliance | ProofBridge, HBK |
| **Utilities** | Prove grid frequency readings | ProofBridge, AIR Runtime |
| **Community savings circles** | Prove honest contributions | Ubuntu Pools |
| **Developers** | Build on verifiable evidence platform | Epistemic Runtime, AIR Runtime |

### Secondary Users

| User | Need | Product |
|------|------|---------|
| **Regulators** | Audit infrastructure compliance | Trust Sphere, Epistemic Runtime |
| **Auditors** | Verify evidence integrity | Epistemic Runtime, ProofBridge |
| **Enterprise teams** | Prove operational compliance | Compliance Automation, Enterprise SSO |

## The Trust Model

### Zero Trust Architecture

VVU Earth Tech operates on a zero-trust model:

1. **Don't trust the platform**: All evidence is cryptographically signed and can be verified independently
2. **Don't trust the operator**: WORM storage (S3 Object Lock) prevents tampering, even by the platform operator
3. **Don't trust the network**: TLS 1.3 and mTLS ensure communications are private and authenticated
4. **Don't trust the code**: Deterministic replay guarantees that the same inputs always produce the same outputs
5. **Don't trust the data**: MMR proofs guarantee that evidence hasn't been tampered with

### Verification, Not Trust

The system replaces trust with verification:
- **Instead of trusting** that a receipt is genuine, **verify** the Ed25519 signature
- **Instead of trusting** that evidence hasn't been tampered with, **verify** the MMR inclusion proof
- **Instead of trusting** that the system processed data correctly, **verify** the deterministic replay
- **Instead of trusting** that the operator is honest, **verify** the WORM storage guarantees

## The Commercial Model

### Open-Source Core

The core cryptographic engine is open-source under Apache 2.0:
- Epistemic Runtime kernel
- MMR implementation
- SHA-256 hashing
- RFC 8785 canonicalization
- Ed25519 signature verification
- Basic receipt issuance

### Commercial Features

Enterprise features are available under commercial license:
- **TEE Attestation**: Trusted Execution Environment attestation for hardware-level security
- **ZK Prover GPU**: GPU-accelerated zero-knowledge proof generation
- **Compliance Automation**: Automated regulatory compliance reporting
- **Enterprise SSO**: SAML/OIDC integration for enterprise identity management

### 4-Tier License System

| Tier | Price | Scope | Features |
|------|-------|-------|----------|
| **OPEN_SOURCE** | Free | Community | Basic kernel, MMR, proofs, receipts |
| **PRO** | $49/mo | Small teams | + AIR Runtime, Policy DSL, Ubuntu Pools |
| **ENTERPRISE** | Custom | Organizations | + TEE, ZK Prover, Compliance, SSO |
| **GOVERNANCE** | Custom | Municipalities | + Full audit, custom policies, dedicated support |

## The 500m Target

The 500m target represents our goal: 500 million people whose infrastructure, savings, and safety are protected by cryptographic evidence.

This is not a revenue target. It's a human impact target. Every person who can prove their water is safe, their savings are honest, or their grid is stable — that's 500m people whose lives are improved by verification.

**Current Progress**: v0.8 complete, v0.12 refactor in progress. Production deployment is the next major milestone.

## Product Dependencies

```
Trust Sphere ──────┐
                    │
Epistemic Runtime ─┤──▶ ProofBridge ──▶ Ubuntu Pools
                    │         │
AIR Runtime ───────┤         ▼
                    │    HBK ──▶ 72h Simulation
                    │
                    └──▶ Commercial Features
```

The Epistemic Runtime is the foundation. All other products depend on it. ProofBridge is the bridge to the real world. Ubuntu Pools is the human application. HBK adds prediction. The 72h Simulation validates everything.
