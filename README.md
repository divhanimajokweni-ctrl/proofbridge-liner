# VVU · Venture Vision Ubuntu OS

![Status](https://img.shields.io/badge/status-production-green)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![AMD MI300X](https://img.shields.io/badge/AMD-MI300X%20·%20ROCm%207-red)

**ProofBridge-Liner** is the trust layer for Ubuntu Pools — South Africa's community savings circles — and the financial infrastructure that serves them. It answers one question: *How do you prove that a financial system is honest, without asking anyone to trust the people who built it?*

> **New here? Read [`docs/HOW-IT-WORKS.md`](./docs/HOW-IT-WORKS.md)** — a plain-English walkthrough of every component, written to be understood with zero prior context.

---

## Current Status · Session Log

### 2026-07-11 — RC1 Trust Infrastructure: Test Suites + verifyHashChain Fix

**What changed and why.** Added 6 vitest test suites (75 tests, all passing) covering the RC1 trust infrastructure packages (`trust-crypto`, `trust-runtime`, `trust-api`). Fixed a critical bug in `verifyHashChain` that was computing an impossible fixed-point check.

**Achieved this session:**
- Installed vitest as workspace devDependency; updated `vitest.config.ts` for package-level test discovery.
- Fixed `verifyHashChain` in `trust-crypto/src/hash.ts` — now computes rolling hash with optional `expectedChainHash` parameter.
- 6 test suites written:
  - `trust-crypto/__tests__/hash.test.ts` (26 tests) — canonicalHash, chainHash, domainHash, GENESIS_HASH, verifyHashChain, HMAC
  - `trust-runtime/__tests__/risk-engine-rules.test.ts` (16 tests) — rate_limit, calldata_scan, identity_proof, circuit breaker, kill-switch
  - `trust-api/__tests__/kill-switch.test.ts` (8 tests) — activate/deactivate/isActive/listeners
  - `trust-api/__tests__/enforce-policy-gate.test.ts` (7 tests) — allowed/fail/kill-switch/receipt
  - `trust-runtime/__tests__/event-journal-async.test.ts` (8 tests) — in-memory journal, repository persistence
  - `trust-runtime/__tests__/context-manager-async.test.ts` (10 tests) — createContext/suspend/freeze/terminate
- Fixed missing `await` on async calls in `trust-api/src/routes.ts`.
- Merged `compliance-fabric` into `main` (fast-forward: Ubuntu Pools + Mint Envelopes wiring, unreachable src/app/ cleanup).
- Rebased feature branch onto updated `main`; resolved merge conflicts.
- All 3 trust packages build clean (`trust-crypto`, `trust-runtime`, `trust-api`).
- PR: [#28](https://github.com/divhanimajokweni-ctrl/proofbridge-liner/pull/28)

### 2026-07-10 — User authentication switched to Supabase (Clerk removed)

**What changed and why.** The homepage now ships the VVU Trust Runtime layout, and user sign-in was migrated from **Clerk → Supabase Auth**. Clerk was removed because its `pk_live` key is bound to the custom domain `clerk.venturevisionubuntu.co.za`, which has no DNS records — so its sign-in widget never loaded. Supabase needs no extra DNS and was already provisioned in the repo.

**Achieved this session:**
- Trust Runtime UI shipped as the site root (`app/page.tsx`), with the time-travel replay upgrade folded in.
- Removed `@clerk/nextjs`, `ClerkProvider`, `/sign-in`, `/sign-up`.
- Added Supabase auth: `/login` (email + password sign-up/sign-in), `/session/callback` (email-confirm), `/session/signout`, homepage `Sign in` / email + `Sign out` control, and a root `middleware.ts` guard on `/dashboard` + `/safekrypte`.
- Verified locally: protected routes redirect to `/login`; account creation returns HTTP 200; sign-in is correctly gated by Supabase's "Confirm email" setting.
- Fixed the Vercel build break (the `auth/` dir name collided with a broad `auth/` exclude in `.vercelignore`/`.gitignore`; renamed source dirs to `session/`).
- Restored two build-breaking modules from earlier work: `lib/compliance/gemma-judge.ts` and `lib/db/src/schema/gatewayParticipants.ts`.

**Open items / next session:**
1. **Supabase env vars** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are already set in Vercel Production (stored as *Sensitive*, so they read back empty via CLI but are inlined into the prod build). No action needed unless the project ref changes.
2. **Decide the "Confirm email" setting** in Supabase (ON = users click an email link before first login; OFF = instant login). See [`docs/HOW-IT-WORKS.md`](./docs/HOW-IT-WORKS.md).
3. **Rotate the Clerk `sk_live_…` secret** that was pasted in chat during setup.
4. **Deploy** by merging to `compliance-fabric` / running ART OF CHOKE (does a real `vercel deploy --prod` + live health check). Login will work in prod immediately since the env vars are already set.
5. **Pre-existing red CI gates** are unrelated to auth and need repo-owner action: Contract Tests (missing Foundry submodules), Qodana token, Commit Attestation workflow.

PR: [#26](https://github.com/divhanimajokweni-ctrl/proofbridge-liner/pull/26) · Auth test report: [`active/test-report-supabase-auth.md`](./active/test-report-supabase-auth.md)

---

## Table of Contents

- [Current Status · Session Log](#current-status--session-log)
- [The Vision](#the-vision--ubuntu-meta-protocol)
- [The Founder](#the-founder--mihle-iviwe-majokweni)
- [Why This Architecture](#why-this-architecture)
- [Canonical Three-Layer Trust Stack](#canonical-three-layer-trust-stack)
- [System Architecture Visual](#system-architecture-visual)
- [Component Map](#component-map)
- [Engineering Principles](#engineering-principles)
  - [Documentation Law](#documentation-law)
- [Phases & Expansion](#phases--expansion)
- [Ubuntu Pools — The North Star](#ubuntu-pools--the-north-star)
- [Fund & Sponsor](#fund--sponsor)
- [Quick Navigation](#quick-navigation)
- [Detailed Component Reference](#detailed-component-reference)
- [Infrastructure Stack](#infrastructure-stack)
- [Development](#development)
- [Deployment Pipeline](#deployment-pipeline)
- [Contact](#contact)
- [Recommendations](#recommendations)
- [Repository Map](#repository-map)

---

## The Vision · Ubuntu Meta-Protocol

**In plain English:** Every financial system asks you to trust someone — a bank, a regulator, a platform. VVU OS removes that requirement. It replaces trust in people with trust in mathematics.

Venture Vision Ubuntu OS is **not** an operating system kernel. It is the name over a constitutional promise — the **Ubuntu Meta-Protocol** — instantiated as running code across a network of entities that a single founder governs through AI agents standing in for roles no human has filled yet. What makes this more than branding is that the promise is **enforced in software**, not merely stated in a charter.

The Meta-Protocol is this: **no entity may extract value from a vulnerable node.** Every credential SafeLiner issues, every hash SafeKrypte signs, every trip of the CircuitBreaker smart contract on Polygon exists because this axiom had to become a function signature before it could become a business.

VVU OS answers a single question that no existing financial infrastructure has solved: **How do you make trust falsifiable?** Not trust in a brand, not trust in a regulator, but trust that is mathematically verifiable, cryptographically provable, and independently auditable by any party — including those who have no reason to trust each other.

The answer is a **three-layer trust stack** with a Bayesian safety kernel at its application layer, an EVM circuit-breaker enforcing real-time policy on-chain, and a credential layer that turns raw cryptographic signatures into instruments a regulator, a bank, or a stokvel member in Gqeberha can read and verify.

---

## Engineering Principles

The full constitution lives in [`docs/governance/ENGINEERING_CONSTITUTION.md`](docs/governance/ENGINEERING_CONSTITUTION.md).

**Systems Don't Get Second Chances — They Get Runbooks.** Every deployment, every migration, every config change has a documented rollback path before it ships. If it can't be rolled back, it doesn't ship.

**Compliance Is Architecture, Not a Feature.** Governance rules, circuit breakers, kill switches, and trust policies are architectural constraints that shape how code is written from the first commit. The Compliance Gate doesn't care about velocity — it cares about auditability.

**The Build Pipeline Is the Single Source of Truth.** If `scripts/deployment-loop.sh` doesn't pass, the code doesn't ship. No manual overrides. No "works on my machine." The pipeline is the contract between every agent that touches this codebase.

**Agent Code Is Infrastructure Code.** Every agent that touches production systems follows the same traceability chain: Investigation → Plan → Approval → Implementation → Validation. No shortcuts.

**Behavioral Coverage Is Non-Negotiable.** Before any change ships, the system must be verified to behave correctly — not just compile. The five compliance flows (VC issuance, circuit breaker, webhook, SafeKrypte, Ubuntu Pools) are the minimum behavioral coverage bar.

**Documentation Prevents Institutional Amnesia.** Institutional knowledge that isn't written down is institutional knowledge that will be lost. Every architectural decision, every deployment procedure, every compliance rule lives in the repository, not in someone's head.

**Ship Nothing That Can't Be Explained to a Stranger.** If a new engineer cannot pick up the README and understand what this system does and why it exists, the documentation has failed.

### Documentation Law

> "If the system can't explain itself to a stranger, it's not production-ready."

The **Tourist Test**: a new team member (or agent) must be able to pick up the README, follow the onboarding flow, and understand what the system does, why it exists, and how to work on it. If they can't, the documentation has failed.

| Step | Action | Gate |
|------|--------|------|
| 1 | Code change touches a documented surface | Developer identifies affected docs |
| 2 | Relevant documentation updated in same PR | PR review blocks merge if docs missing |
| 3 | README reviewed for accuracy | No stale references, no orphaned links |
| 4 | CHANGELOG updated if user-facing | New entries above "Unreleased" |
| 5 | Post-merge: deployed docs verified | Live docs match merged code |

**Anti-patterns:** "We'll document it later" (later never comes). "The code is the documentation" (code explains *how*, documentation explains *why*). "Everyone knows that" (new agents, future-you — they don't). "It's just a small change" (small changes accumulate).

The repository documents the system, not the biography of its contributors. The institution is the protagonist. The repository provides the architecture, evidence, benchmarks, documentation, and methods for reproducing results.

---

## Why This Architecture

**In plain English:** Most financial software is a single system that does everything. That creates a single point of failure — if the signing layer has a bug, the whole system is compromised. VVU OS splits trust into three independent layers. Each layer does one job and refuses to do any other. This isn't a design preference — it's a security requirement.

### Layer Separation Is Non-Negotiable

| Layer | Responsibility | Must Not |
|-------|---------------|----------|
| **SafeKrypte** | ED25519 key generation, signing | Have opinions about what it signs |
| **SafeLiner** | Structured credentials with issuer/holder/type/timestamp | Reimplement signing |
| **ProofBridge** | Compliance application: gates, prover, circuit breaker | Own the cryptographic primitives |

This discipline prevents the **quality debt** that compounds when each layer absorbs responsibilities that belong to another. A signing primitive does not become a credential system. A credential system does not become a compliance product. A compliance product does not become a marketplace.

### Determinism Over Black Boxes

AI systems are probabilistic. A language model generates a continuation minimising log-likelihood; it does not digress to validate the truth of its own statement. ProofBridge-Liner converts every AI output into a **provable, adjudicatable statement** through a Beta-Binomial posterior belief check calibrated against an industry-specific risk parameter γ, emitting a live SAFE / TRIP verdict together with a deterministic reasoning chain and a cryptographically signed proof trace.

### Real-Time Gating, Not Post-Hoc Audit

The CircuitBreaker smart contract on Polygon Amoy (`0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67`) enforces TRIP verdicts on-chain — transfers halt, and resume only on verified inputs. This is the difference between a compliance system and a checkbox one.

### Four-Tier Entity Structure

The nine entities align to four tiers:

| Tier | Role | Entities |
|------|------|----------|
| **Foundational Infrastructure** | Cryptographic primitives, attestation, compliance kernel | SafeKrypte, SafeLiner, GovernanceAnchor.sol |
| **Product Entities** | User-facing products exercising the trust stack | ProofBridge Liner, Ubuntu Pools, SafeGrid, Ubuntu Studio |
| **Operational Layer** | Internal tooling, monitoring, agent infrastructure | LINDIWE, CircuitBreaker, War Room, Operatus |
| **Communicative Output** | Documentation, pitch artifacts, advisory | ARCHITECTURE.md, FOUNDERS_VIEW.md, pitch materials |

---

## Canonical Three-Layer Trust Stack

**In plain English:** Think of it like a bank vault with three locks. The first lock (SafeKrypte) only signs — it doesn't know what it's signing. The second lock (SafeLiner) puts that signature into a structured credential — a document anyone can read. The third lock (ProofBridge) decides whether that credential meets compliance rules. No single lock controls the vault. All three must agree.

```
                        ┌─────────────────────────────────────┐
                        │         ProofBridge Liner            │
                        │  (Compliance Application — Gates    │
                        │   A through F, Prover Pipeline,     │
                        │   Circuit Breaker, Dashboard)        │
                        │         ▲                           │
                        │         │ consumes                   │
                        │         ▼                           │
                        │         SafeLiner                   │
                        │  (Credential Layer — structured     │
                        │   signed credentials, issuer /      │
                        │   holder / type / timestamp)         │
                        │         ▲                           │
                        │         │ consumes                   │
                        │         ▼                           │
                        │         SafeKrypte                  │
                        │  (Cryptographic Primitive —         │
                        │   ED25519 keypairs, signing,        │
                        │   no opinion about content)          │
                        └─────────────────────────────────────┘
```

**SafeKrypte** generates ED25519 keypairs per identity, stores public keys, and signs content hashes into attestations. It has no opinion about what it is signing or why. It does exactly one thing, does it as a dependency, and never as a product.

**SafeLiner**, built on SafeKrypte, issues structured signed credentials — holder, issuer, credential type, timestamp. It turns a bare cryptographic signature into something a regulator, bank, or stokvel member can read and trust. It consumes SafeKrypte's raw signing capability without reimplementing it.

**ProofBridge Liner** is Gates A through F — health monitoring, webhook infrastructure, compliance & regulatory reporting, CircuitBreaker contract, email communications, and TEE attestation — plus the Bayesian fraud-scoring prover pipeline, IPFS-diverse document fetchers, and threshold-signed circuit breaker. It consumes the trust layer beneath it rather than reimplementing it.

---

## System Architecture Visual

**In plain English:** When someone saves money through Ubuntu Pools, the system checks whether the transaction is safe using a mathematical formula (not a human decision). If it's safe, a receipt is generated and anchored to the blockchain. If it's unsafe, the circuit breaker trips and everything halts. The whole process is automatic, auditable, and produces evidence that can be verified by anyone.

```
                          ┌──────────────────────────────────┐
                          │         👤 USER ACTION           │
                          │  (WhatsApp / Web / API)          │
                          └────────────┬─────────────────────┘
                                       │
                                       ▼
                          ┌──────────────────────────────────┐
                          │      STATE TRANSITION REQUEST     │
                          │  (Ubuntu Pools / ProofBridge)    │
                          └────────────┬─────────────────────┘
                                       │
                                       ▼
                     ┌────────────────────────────────────────┐
                     │      ⚙️  DETERMINISTIC EVALUATION     │
                     │  Beta-Binomial Posterior Belief Check  │
                     │  calibrated against risk parameter γ  │
                     │  ┌─────────────────────────────────┐  │
                     │  │  Prover Pipeline               │  │
                     │  │  Fetcher → Validator → Scorer   │  │
                     │  │  → Submitter → Broadcaster     │  │
                     │  └─────────────────────────────────┘  │
                     │  Output: SAFE / TRIP + proof trace    │
                     └────────────┬──────────────────────────┘
                                  │
                                  ▼
                     ┌────────────────────────────────────────┐
                     │        🛡️  COMPLIANCE FABRIC          │
                     │  ┌─────────────────────────────────┐  │
                     │  │  SafeKrypte (signing)           │  │
                     │  │  SafeLiner (credentials)        │  │
                     │  │  Deterministic canonicalization  │  │
                     │  │  Payload validation              │  │
                     │  │  Compliance tokenization         │  │
                     │  │  Cryptographic signing + verify  │  │
                     │  │  Telemetry verification          │  │
                     │  └─────────────────────────────────┘  │
                     └────────────┬──────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
     ┌────────────────────────┐    ┌────────────────────────┐
     │   📄 TRANSITION        │    │   ⚡ CIRCUIT           │
     │   RECEIPT              │    │   BREAKER              │
     │   (previous state,     │    │   (Polygon Amoy)       │
     │    next state,         │    │   tripCircuit ~28k gas │
     │    transition hash,    │    │   Oracle: 0x11af8A...  │
     │    pipeline hash,      │    │   HTTP 423 on TRIPPED  │
     │    compliance evidence,│    └────────────┬───────────┘
     │    timestamps)         │                 │
     └────────────┬───────────┘                 │
                  │                             │
                  └─────────────┬───────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │   🔐 CRYPTOGRAPHIC EVIDENCE         │
              │   RSA-SHA256 attestation            │
              │   GovernanceAnchor.sol on-chain     │
              │   updateProof(assetId, deedHash)    │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │   📚 IMMUTABLE AUDIT TRAIL          │
              │   IPFS-diverse storage              │
              │   Deterministic replay capability    │
              │   FSCA JS2 / FICA SAR exports        │
              └─────────────────┬───────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │   🌍 UBUNTU POOLS                   │
              │   Real members, real money,         │
              │   real contribution cycles          │
              │   Stitch Money InstantEFT           │
              │   Cryptographically signed records  │
              └─────────────────────────────────────┘


              ┌─────────────────────────────────────┐
              │   💓 EMBEDDED WATCHDOG              │
              │   HeartbeatSchema · HeartbeatBus    │
              │   WatchdogProbes · Orchestrator     │
              │   Operational diagnostics · Fault   │
              │   classification · Incident report  │
              └─────────────────────────────────────┘


              ┌─────────────────────────────────────┐
              │   🧠 LINDIWE · AI AGENT ORCHESTRATOR│
              │   SDD Workflow: Investigate → Plan  │
              │   → Approve → Implement → Validate  │
              │   5-role separation of concerns     │
              │   Behavioral coverage verification  │
              └─────────────────────────────────────┘
```

---

## Component Map

**In plain English:** The system is built in six layers, called "gates." Each gate handles one responsibility — authentication, payments, compliance rules, blockchain enforcement, email, and hardware verification. No gate can interfere with another. This means a bug in email delivery can't compromise payment processing.

### 🔐 Gate A — Infrastructure (Authentication & Identity)
- Supabase integration with cookie remediation
- Redirect loop protection
- UUID-safe RLS operations
- Authentication health monitoring
- Health endpoint (`/api/health`) HTTP 200
- 6 gate metric endpoints (`/api/metrics/gate-[a-f]`)
- Rate limiting (30 req/min per IP)
- Watchdog HeartbeatBus with BroadcastChannel + IndexedDB

### 💳 Gate B — Webhook Infrastructure (Contributions)
- Stitch webhook endpoint (`/api/webhooks/stitch`)
- HMAC-SHA256 signature verification (`X-VVU-Signature` header)
- Idempotency store with TTL cleanup
- 12+ event type handlers (payment, ledger, FX, compliance)
- Payload schema validation with error classification
- Contribution fault taxonomy, ledger integration, reconciliation hooks

### 📋 Gate C — Compliance & Regulatory
- FSCA JS2 automated regulatory reporting
- FICA SAR suspicious activity reporting (goAML protocol)
- POPIA compliance framework (data subject rights, PIA, records of processing)
- Cybercrimes Act 19 of 2020 forensic evidence bundling
- CPA-compliant pool terms and complaints procedure
- PAIA manual published
- FSCA crypto-asset framework analysis
- RMCP v1.0 (Risk Management and Compliance Programme)
- Entity-wide ML/TF/PF risk assessment
- Client-level risk assessment (PCC 53 aligned, SDD/NDD/EDD thresholds)

### ⚡ Gate D — CircuitBreaker Contract
- `CircuitBreaker.sol` compiled via Foundry, deployed to Polygon Amoy
- Gas-optimized: initialize ~45k, tripCircuit ~28k, validate ~15k
- 14/14 Foundry contract tests passing
- `/api/verify` enforces `circuitOpen()` as hard gate — TRIPPED returns HTTP 423
- `/api/verify` calls `updateProof(assetId, deedHash)` to anchor hashes on-chain
- Global middleware enforces Gate D on all routes (fail-closed on trip)

### 📧 Gate E — Email & Communications
- Domain `venturevisionubuntu.co.za` verified in Resend
- DKIM, SPF, MX, DMARC records verified
- `/api/send-email` with Bearer auth (`KERNEL_SECRET`)
- DNS managed at Host Africa with BIND zone file

### 🔏 Gate F — TEE Attestation
- Server-side attestation generation (`generateAttestation()`)
- SHA-256 measurement + ephemeral RSA key fingerprint
- Client-side verification (`verifyAttestation()`)
- Timestamp included for freshness checks
- Software-simulated (hardware SGX/SEV-SNP in Phase 5)

### 🛤️ Prover Pipeline

**In plain English:** The Prover Pipeline is the system's brain. When a transaction arrives, it asks three questions: *Is this a mistake? Is this fraud? Is this a system failure?* Each answer has a different response — retry, escalate, or page an engineer.

- Beta-Binomial posterior probability scoring
- Scenario A/B/C differentiation:
  - **A — Transient mismatch** (network noise, retry)
  - **B — Adversarial mismatch** (active fraud, escalate)
  - **C — Network failure** (infrastructure, page)
- Fetcher → Validator → Scorer → Submitter → Broadcaster chain

### 💓 Embedded Watchdog

**In plain English:** The Watchdog is the system's heartbeat monitor. It watches every component and raises an alarm if anything stops responding — before users notice.

- HeartbeatSchema, HeartbeatBus, WatchdogProbes, OrchestratorEngine
- Operational diagnostics
- Distributed heartbeat monitoring
- Fault classification and incident reporting
- Runtime instrumentation

### 🧠 LINDIWE — AI Agent Orchestrator

**In plain English:** LINDIWE is the AI system that writes and reviews code for VVU. It follows a strict five-step process — investigate, plan, have a human review, implement, then validate — so no code ships without approval.

- 5-role SDD workflow: Investigator → Planner → Mino Reviewer → Implementer → Validator
- Separation of concerns (Validator cannot approve own implementation)
- Behavioral coverage: VC issuance, Circuit Breaker, Webhook, SafeKrypte, Ubuntu Pools — ✅ **5/5 PASS** (2026-07-04)
- HMAC Security Guard: `lib/HmacSecurityGuard.js` — fall-closed SHA-256 inter-process signing with timing-safe comparison
- SafeKrypte Mock: `tests/mocks/SafeKrypteServiceMock.js` — local HTTP mock enabling 5/5 behavioral coverage without production HSM
- Three handoff files: INVESTIGATION.md, PLAN.md, VALIDATION.md

---

## Phases & Expansion

**In plain English:** VVU is built in phases. Phase 1 — the trust foundation — is complete. Each subsequent phase adds capability on top of that foundation. The timeline is conservative: nothing ships until it passes the same behavioral coverage tests that Phase 1 passed.

### ✅ Phase 1: ProofBridge Liner Safety Kernel (Complete — June 2026)
All six gates operational in production. 6/6 gates passing, 4/4 API tests, 14/14 contract tests. Test suite: 100% passing. Zero critical security issues. No secrets in repository.

### 🔜 Phase 2: SafeGrid & Scaling (Target: Q1 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| **SAFEGRID Brain** | 🔜 Planning | Bayesian posterior-probability threshold (τ*) scoring engine. Featherless.ai latency benchmark approved (P95=157ms). |
| **SAFESTAKES** | 🔜 Planning | Staking layer for oracle nodes. |
| **Parallel Water Economy** | 🔜 Planning | Tokenized water rights and usage tracking. |
| **Automated Scaling Gates** | 🔜 Planning | Auto-scaling circuit breaker infrastructure for high-throughput environments. |
| **ProofBridge-Liner Upscale** | 🔜 Planning | Multi-chain support, higher TPS (~500→~5,000). |
| **CRAFT Infrastructure** | 🔜 Deploy Ready | Lean 4 theorem prover ingestion → Milvus vector store → tree-sitter parse pipeline for formal verification. Docker Compose stack (5 services) built. |

**Pre-Phase 2 Approvals:**
- Featherless.ai cleared for live reasoning (Board: ✅ P95 157ms ≤ 200ms threshold)
- Haridev888 calibration backtest approved (Board: ✅ 100% recall, 0 violations, monotonic)
- ProofBridge WebWorld verification (Board: ✅ 122 checks, 0 violations)

### 🔜 Phase 3: Multi-Bank Consortium (Target: Q2 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| **Institutional Partner Onboarding** | 🔜 Planning | Standard Bank OneHub sandbox pilot (14-day, real property data). Materials prepared. |
| **Multi-Bank Consortium Formation** | 🔜 Planning | Federated fraud intelligence via multi-party computation. Partners: Standard Bank, Absa, + SA institutions. |
| **Federated MPC Infrastructure** | 🔜 Planning | Shared fraud intelligence without data sharing. |

### 🔜 Phase 4: Advanced Forensic Analytics (Target: Q3 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| **Longitudinal Anomaly Detection** | 🔜 Planning | Pattern recognition across property portfolios. |
| **Predictive Fraud Scoring** | 🔜 Planning | ML on hardware-attested evidence chains. |
| **Enhanced FSCA JS2 Reporting** | 🔜 Planning | Predictive regulatory reporting with confidence intervals. |

### 🔜 Phase 5: Hardware TEE & Global Expansion (Target: Q4 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| **Hardware TEE Integration** | 🔜 Planning | SGX/SEV-SNP hardware attestation replacing software simulation. |
| **Global Expansion** | 🔜 Planning | UK, Singapore, Dubai property markets. Cross-border evidence handling. |
| **Multi-Region Deployment** | 🔜 Planning | TEE deployment across geographic regions. |

### Key Performance Targets

| Metric | Current (Phase 1) | Target (Phase 2+) |
|--------|-------------------|-------------------|
| Contract gas (tripCircuit) | ~28k | ~25k (optimized) |
| API verify latency (P95) | ~85ms | ~50ms |
| IPFS quorum resolution | ~1.2s | ~800ms |
| Email delivery | ~3s | ~2s |
| Oracle consensus | 1-of-1 (single) | 3-of-5 (threshold) |
| TPS (estimated) | ~500 | ~5,000 |
| Uptime SLA | 99.9% | 99.99% |

### Timeline

```
Phase 1 (May-Jun 2026)  ████████████████████████████  ✅ COMPLETE
Phase 2 (Q1 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
Phase 3 (Q2 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
Phase 4 (Q3 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
Phase 5 (Q4 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
```

---

## Ubuntu Pools — The North Star

**In plain English:** Ubuntu Pools is what all of this is for. It's a community savings circle — like a stokvel — where members contribute money, and the system proves that every contribution is recorded honestly, every payout is verifiable, and no one can quietly take more than they're owed. The "Ubuntu" name comes from the African philosophy: *I am because we are.*

> Ubuntu Pools operating with real members, real money, and real contribution cycles.

The primary objective remains unchanged. Every component in this repository exists to make that event **cryptographically provable**, **operationally observable**, and **independently auditable**.

Ubuntu Pools reframes what SafeKrypte and SafeLiner make possible at civilizational scale rather than merely transactional scale. A stokvel cooperative's trust relationships — historically enforced by community reputation alone — are backed by cryptographically signed participation records.

The eventual Ubuntu Score will be a credit history that exists independent of any single bank's ledger — owned by the individual, provable by mathematics, and portable across institutions.

### What Ubuntu Pools Does Today
- Community savings circles with automated contribution tracking via Stitch Money InstantEFT
- WhatsApp bridge for low-connectivity members
- Cryptographic verification for every transaction (ZK proofs, smart contracts, audit trail)
- SOC 2 aligned, all state transitions cryptographically verifiable
- Real-time dashboard with bento-grid layout (score simulator, pool creator, ant stack, architecture map, LINDIWE chat)

---

## Fund & Sponsor

**In plain English:** VVU is building trust infrastructure for financial systems — starting in South Africa, expanding globally. Funding accelerates hardware integration, institutional partnerships, and the move from prototype to production at scale.

### Gitcoin Grants
Support the development of open-source cryptographic trust infrastructure:
- **Gitcoin Grant Round:** Active — search "ProofBridge Liner" on [gitcoin.co/grants](https://gitcoin.co/grants)
- **Use of Funds:** CircuitBreaker gas optimization, SafeKrypte ED25519 audit, Ubuntu Pools FSCA sandbox pilot

### Direct Sponsorship
Sponsor the repository directly via GitHub Sponsors:

```
https://github.com/sponsors/divhanimajokweni-ctrl
```

### Funding Strategy (Phased)

| Phase | Target | Source | Timeline |
|-------|--------|--------|----------|
| **Bootstrap** | $250K | Standard Bank OneHub pilot + Stitch integration grant + SA Cybercrimes Act forensic grant | Q3 2026 |
| **Seed** | $500K–$1M | Ethereum/Polygon ecosystem grants, SA angel investors, strategic partnerships | 6–12 months |
| **Series A** | $5M–$10M | VC firms (Multicoin, Framework, Coinbase Ventures, SA VCs) | 12–24 months |
| **Growth** | $20M+ | Institutional investment, pension funds, token launch | 24+ months |

### How Funds Are Deployed
- 40% — Engineering: Hardware TEE integration, multi-chain support, scaling
- 25% — Compliance & Legal: FSCA, FICA, POPIA, Cybercrimes Act, international regulatory
- 20% — Operations: GPU compute (AMD MI300X), IPFS infrastructure, monitoring
- 15% — Community & Adoption: Ubuntu Pools member onboarding, outreach

---

## Quick Navigation

| For | Go to |
|----|-------|
| Founder dashboard (10-second status) | [`FOUNDERS_VIEW.md`](./FOUNDERS_VIEW.md) |
| Weekly progress | [`PROGRESS_LOG.md`](./PROGRESS_LOG.md) |
| Daily founder checklist | [`FOUNDERS_VIEW.md#daily-founder-checklist`](./FOUNDERS_VIEW.md#daily-founder-checklist) |
| Daily agent startup checklist | [`FOUNDERS_VIEW.md#daily-agent-checklist`](./FOUNDERS_VIEW.md#daily-agent-checklist) |
| AI agent rules | [`AGENTS.md`](./AGENTS.md) |
| System architecture | [`docs/architecture/`](./docs/architecture/) |
| Research & whitepapers | [`docs/research/`](./docs/research/) |
| Deployment & operations | [`docs/operations/`](./docs/operations/) |
| Past reports & chronicles | [`docs/progress/`](./docs/progress/) |
| Social / outreach drafts | [`docs/social/`](./docs/social/) |
| Governance & company | [`docs/governance/`](./docs/governance/) |
| Legal & compliance | [`docs/legal/`](./docs/legal/) |
| Audit findings | [`docs/audit/`](./docs/audit/) |
| Funding strategy | [`docs/governance/FUNDING_STRATEGY.md`](./docs/governance/FUNDING_STRATEGY.md) |
| Meeting agenda template | [`docs/MEETING_AGENDA.md`](./docs/MEETING_AGENDA.md) |
| Outreach templates | [`docs/OUTREACH_TEMPLATES.md`](./docs/OUTREACH_TEMPLATES.md) |

---

## Detailed Component Reference

**In plain English:** This section is for engineers. It describes what each subsystem does in technical terms.

### 🛤️ ProofBridge

Deterministic execution layer responsible for:
- canonical state transitions
- reproducible evaluation
- evidence generation
- replayability
- cryptographic integrity

### 🛡️ Compliance Fabric

Compliance runtime responsible for:
- deterministic canonicalization
- payload validation
- compliance tokenization
- cryptographic signing
- signature verification
- telemetry verification
- SAFE/TRIP evaluation

**Target properties:**
- deterministic
- independently verifiable
- regulator-friendly
- replayable

### 📄 Transition Receipts

Every accepted state transition produces a canonical receipt describing:
- previous state
- next state
- transition hash
- pipeline hash
- state hash
- compliance evidence
- timestamps
- trace identifiers

Receipts represent the **authoritative historical record**.

### ⚡ Circuit Breaker Layer

Protective runtime responsible for:
- unsafe state interruption
- policy enforcement
- deterministic fail-safe behaviour
- evaluation halting
- infrastructure degradation response

Circuit breaker outputs become part of the **permanent evidence chain**.

---

## Infrastructure Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 · React 18 |
| **Backend** | Next.js API Routes · Supabase |
| **Database** | Supabase PostgreSQL · RLS |
| **Auth** | Supabase Auth Helpers |
| **Smart Contracts** | Solidity · Foundry (Polygon Amoy) |
| **ZK Circuits** | Noir · Barretenberg |
| **IaC** | Terraform |
| **Monitoring** | Datadog · PagerDuty |
| **Cache** | Upstash Redis |
| **GPU Compute** | AMD MI300X · ROCm 7 (inference roundtrip latency verified at boot via `lib/amd-init.ts`; actual TPS depends on deployment topology) |
| **Testing** | Vitest · Playwright · Jest · Autocannon |
| **Deployment** | Vercel |
| **Formal Verification** | Lean 4 · tree-sitter · Milvus (CRAFT infra) |
| **Messaging** | WhatsApp Bridge · OpenClaw Gateway |

**Target deployment characteristics:**
- 🌐 globally distributed
- ⚡ deterministic
- 👁️ observable
- 🔐 cryptographically verifiable

---

## Development

### Prerequisites
- Node.js 20+
- npm 9+
- Supabase account

### Development
```bash
npm run dev
```

### Tests
```bash
npm test
npm run test:e2e
```

### Database
```bash
npx supabase db migrate
```

### AMD Hardware / Inference Verification
At boot, `lib/amd-init.ts` performs two real checks and logs the results:
1. **Local ROCm hardware probe** — shells out to `rocm-smi --json` on bare metal / AMD Developer Cloud instances and parses actual GPU model and VRAM. Only succeeds when running directly on AMD hardware.
2. **Remote inference roundtrip** — sends a real completion request to the configured Fireworks AI endpoint (AMD MI300X-backed) and measures actual latency in milliseconds. This is the check that works in all deployment environments, including Vercel and Docker.

Under `AMD_STRICT=1`, the boot sequence aborts with a non-zero exit if neither check succeeds — preventing unverified claims from shipping silently.

```bash
# Run manually:
npx tsx lib/amd-init.ts

# With strict enforcement:
AMD_STRICT=1 npx tsx lib/amd-init.ts
```

### Docker
```bash
docker build -t proofbridge-liner .
docker run --rm -p 3000:3000 -e AMD_STRICT=0 proofbridge-liner
```

### Build & Deploy
```bash
npm run build
vercel --prod --force
```

---

## Deployment Pipeline

| Stage | Command | Description |
|-------|---------|-------------|
| **Typecheck** | `npm run typecheck` | TypeScript validation |
| **Lint** | `npm run lint` | ESLint checks |
| **Build** | `npm run build` | Production bundle |
| **Test** | `npm test` | Unit tests |
| **E2E** | `npm run test:e2e` | Playwright tests |
| **Deploy** | `vercel --prod` | Vercel production |

---

## Contact

**Mihle "Divhani" Majokweni**  
*Principal · Vaguely Vanity Unkempt LLC (Pty) Ltd*  
📍 Gqeberha, Eastern Cape, South Africa  
📧 **hello@venturevisionubuntu.co.za**  
🔗 **LinkedIn:** [linkedin.com/in/divhanimajokweni](https://linkedin.com/in/divhanimajokweni)  
🐙 **GitHub:** [github.com/divhanimajokweni-ctrl](https://github.com/divhanimajokweni-ctrl)  
🌐 **Website:** [venturevisionubuntu.co.za](https://venturevisionubuntu.co.za)  

### For Investment Inquiries
📧 **hello@venturevisionubuntu.co.za** with subject line: *Investment Inquiry — ProofBridge Liner*  
📄 Pitch deck & institutional deck: [`demo/pitch-deck.md`](./demo/pitch-deck.md)  
📊 Whitepaper: [`demo/whitepaper.md`](./demo/whitepaper.md)  
🎥 Demo script: [`demo/video-demo-script.md`](./demo/video-demo-script.md)  

### For Partnership & Integration Inquiries
📧 **hello@venturevisionubuntu.co.za** with subject line: *Partnership — [Organization Name]*  

### For Regulatory & Compliance Inquiries
📧 **hello@venturevisionubuntu.co.za** with subject line: *Compliance Inquiry — [Regulatory Body]*  

---

## Recommendations

### For Prospective Contributors
1. **Start with the SDD workflow**: Read [`AGENTS.md`](./AGENTS.md) and the three handoff files in [`active/`](./active/) to understand how every change is traced from business intent to deployed code.
2. **Load the skills**: Before writing code, load `vvu-architecture`, `vvu-compliance-gate`, and `vvu-sdd` skills — they encode the architectural decisions and audit findings that prevent quality debt.
3. **Never skip behavioral coverage**: The five flows (VC issuance, Circuit Breaker, Webhook, SafeKrypte key request, Ubuntu Pools contribution) must be verified before any PR merges.

### For Investors
1. **Review the audit trail**: [`docs/audit/proofbridge-findings.md`](./docs/audit/proofbridge-findings.md) documents the 18 audit findings and 5 hard-failure release blockers — transparency is built into the process.
2. **Examine the legal framework**: [`docs/legal/`](./docs/legal/) contains POPIA, FICA, FSCA, CPA, and PAIA compliance documentation — regulatory readiness is not post-hoc.
3. **Demand a live demo**: The behavioral coverage script at `scripts/behavioral-coverage.ts` exercises all five critical flows. Insist on seeing it pass.

### For Regulators & Compliance Officers
1. **Independent verifiability is not aspirational**: Every SafeKrypte attestation, every SafeLiner credential, and every CircuitBreaker trip is independently verifiable using open-source tools — no proprietary black boxes.
2. **Export formats are built in**: FSCA JS2 reports, FICA SAR filings (goAML), and Cybercrimes Act forensic bundles are generated automatically — they are not post-hoc manual exports.

### For Ubuntu Pools Members
1. **Your contribution records are cryptographically signed**: Every contribution you make through the platform produces a verifiable receipt that you can independently verify — no central database is the single source of truth.
2. **The WhatsApp bridge works without internet**: Members can interact via WhatsApp for low-connectivity environments. The bridge is live on port 3456.

---

## Repository Map

```
📁 root (77 entries — everything relevant, nothing more)
│
├── 📄 README.md              ← Entry point (this file)
├── 📄 FOUNDERS_VIEW.md       ← 10-second founder dashboard
├── 📄 PROGRESS_LOG.md        ← Weekly progress log
│
├── 📄 AGENTS.md              ← SDD orchestration manifest (loaded by AI)
├── 📄 CLAUDE.md              ← Lindiwe agent grounding rules
├── 📄 MEMORY.md              ← Working set index
│
├── 📁 app/                   ← Next.js app — pages, API routes, UI
├── 📁 src/                   ← Core logic — middleware, watchdog, compliance
├── 📁 components/            ← Shared React components
├── 📁 public/                ← Static assets (HTML gates, images)
│   └── 📁 vvv/               ← VVV landing pages (proofbridge, index, gate-1)
│
├── 📁 docs/                  ← All documentation
│   ├── 📁 architecture/      ← ADRs, system design
│   ├── 📁 governance/        ← Company structure, shareholder agreements
│   ├── 📁 legal/             ← POPIA, FICA, FSCA, CPA compliance docs
│   ├── 📁 operations/        ← Deployment, runbooks, security
│   ├── 📁 progress/          ← Archived reports, chronicles
│   ├── 📁 research/          ← Whitepapers, papers, analysis
│   └── 📁 social/            ← Outreach drafts, strategy
│
├── 📁 infra/                 ← Docker, cloud-init, droplet scripts
├── 📁 scripts/               ← Build, test, audit utility scripts
├── 📁 config/                ← JSON configs (maturity-gates, manifest, skills-lock)
│
├── 📁 whatsapp-bridge/       ← WhatsApp bot (whatsapp-web.js, port 3456)
├── 📁 openclaw.json          ← Gateway + channel config (port 18789)
├── 📁 mcp/                   ← MCP server config (GCP brain)
│
├── 📁 contracts/             ← Solidity smart contracts (SafetyKernel, TEEVerifier)
├── 📁 circuits/              ← ZK circuit artifacts
├── 📁 proofs/                ← Proof outputs
├── 📁 prover/                ← Prover logic (scorer, fetcher, validator)
│
├── 📁 .kilo/                 ← Kilo CLI config (agents, commands, skills)
├── 📁 .agents/               ← Shared agent skills (SDD, compliance, architecture)
│
├── 📁 supabase/              ← Database migrations, seed files
├── 📁 auth/                  ← Auth-related files
│
├── 📁 archive/               ← Dead/experimental code (kept for reference)
└── 📁 active/                ← SDD workflow files (INVESTIGATION.md, PLAN.md, etc.)
```

---

## Production Capabilities

**Implemented:**
- [x] deterministic canonicalization
- [x] payload hashing
- [x] cryptographic signatures
- [x] telemetry validation
- [x] internal consistency verification
- [x] compliance token generation
- [x] watchdog infrastructure
- [x] Gate A authentication infrastructure
- [x] Gate B registration hooks
- [x] schema v2.1 compatibility
- [x] Bayesian Beta-Binomial safety kernel (γ=20)
- [x] Hardware-attested TEE scoring
- [x] Automated FSCA JS2 / FICA SAR / Cybercrimes Act reporting
- [x] Stripe + Stitch dual-currency billing webhooks
- [x] WhatsApp notification daemon with admin commands
- [x] Multi-channel alerting (Slack Block Kit + Discord Embed)
- [x] Document PiP floating overlay dashboard
- [x] Chaos engineering + weekly reporting automation
- [x] containerized Docker deployment with PM2/Docker Compose

## Production Hardening Remaining

### Compliance
- [x] trust infrastructure (Trust Contexts, Event Journal, Risk Engine — RC1)
- [ ] replay protection
- [ ] key rotation
- [ ] certificate governance
- [ ] versioned compliance envelopes

### Evidence
- [ ] immutable append-only audit chain
- [ ] historical replay verification
- [ ] deterministic replay testing

### Runtime
- [ ] middleware hardening
- [ ] distributed trace continuity
- [ ] state transition verification
- [ ] production telemetry validation

### Operations
- [ ] production monitoring validation
- [ ] regional failover verification
- [ ] infrastructure resilience testing

---

## Mission

ProofBridge-Liner exists to make critical financial and governance state transitions:

- 🔐 **independently verifiable**
- 🛡️ **cryptographically provable**
- 👁️ **operationally observable**
- 🔁 **deterministically reproducible**

---

*Built with ❤️ for the Ubuntu Pools ecosystem — from Gqeberha, for the continent.*  
build-ref: d8c1393
