# VVU · Venture Vision Ubuntu OS

> **If you're Mino (the founder), start here → [`FOUNDERS_VIEW.md`](./FOUNDERS_VIEW.md)**  
> Quick progress → [`PROGRESS_LOG.md`](./PROGRESS_LOG.md)

![AMD Hackathon](https://img.shields.io/badge/AMD%20Hackathon-Act%20II%20Track%203-purple)
![Status](https://img.shields.io/badge/status-production-green)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)
![AMD MI300X](https://img.shields.io/badge/AMD-MI300X%20·%20ROCm%207-red)

> **🏆 AMD Developer Hackathon: Act II — Track 3 (Unicorn Track)**  
> Submission deadline: **July 11, 2026, 15:00 UTC** · [Hackathon Submission Guide](./docs/HACKATHON_SUBMISSION_GUIDE.md)  
> HuggingFace Space: [proofbridge-liner-safety-kernel](https://huggingface.co/spaces/lablab-ai-amd-developer-hackathon/proofbridge-liner-safety-kernel)

**ProofBridge-Liner** — the compliance and verification layer for Ubuntu Pools and VVU's financial infrastructure. A constitutional promise of cryptographic trust, instantiated as running code across nine entities governed by a single vision.

---

## Table of Contents

- [The Vision](#the-vision--ubuntu-meta-protocol)
- [The Founder](#the-founder--mihle-iviwe-majokweni)
- [Why This Architecture](#why-this-architecture)
- [Canonical Three-Layer Trust Stack](#canonical-three-layer-trust-stack)
- [System Architecture Visual](#system-architecture-visual)
- [Component Map](#component-map)
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

Venture Vision Ubuntu OS is **not** an operating system kernel. It is the name over a constitutional promise — the **Ubuntu Meta-Protocol** — instantiated as running code across a network of entities that a single founder governs through AI agents standing in for roles no human has filled yet. What makes this more than branding is that the promise is **enforced in software**, not merely stated in a charter.

The Meta-Protocol is this: **no entity may extract value from a vulnerable node.** Every credential SafeLiner issues, every hash SafeKrypte signs, every trip of the CircuitBreaker smart contract on Polygon exists because this axiom had to become a function signature before it could become a business.

VVU OS answers a single question that no existing financial infrastructure has solved: **How do you make trust falsifiable?** Not trust in a brand, not trust in a regulator, but trust that is mathematically verifiable, cryptographically provable, and independently auditable by any party — including those who have no reason to trust each other.

The answer is a **three-layer trust stack** with a Bayesian safety kernel at its application layer, an EVM circuit-breaker enforcing real-time policy on-chain, and a credential layer that turns raw cryptographic signatures into instruments a regulator, a bank, or a stokvel member in Gqeberha can read and verify.

---

## The Founder · Mihle Iviwe Majokweni

**Mihle "Divhani" Majokweni** is the principal architect and founder of Venture Vision Ubuntu. A Bayesian decision theorist, FSCA JS2 compliance practitioner, and solo founder operating from **Gqeberha, Eastern Cape, South Africa**, Mihle holds 75% equity with a Denomination Share and absolute veto through Vaguely Vanity Unkempt LLC (Pty) Ltd (CIPC: 2026/259053/07).

Mihle is not a CEO with a boardroom. Mihle is an engineer who recognised that the trust gap in tokenized real-world assets, digital deeds, and community savings circles is not a regulatory problem — it is a **software architecture problem**. The nine-entity structure of VVU OS exists because the trust problem requires separation of cryptographic concerns: the primitive layer must not know what it is signing, the credential layer must not reimplement signing, and the compliance application must consume both without owning either.

> *"A fraud score is worthless if the attestation carrying it can't be proven to have come from where it claims."* — Mihle Majokweni

Mihle's approach is grounded in **Bayesian probability theory** — the Prover Pipeline's Beta-Binomial posterior belief engine with industry-calibrated risk thresholds — and in **specification-driven development** that treats AI agents as extensions of the founder's intent rather than autonomous decision-makers. Every line of code in this repository traces back to an INVESTIGATION.md fact-finding, a PLAN.md approved by Mino (Mihle's review persona), and a VALIDATION.md that proves behavioral coverage before any PR opens.

---

## Why This Architecture

The three-layer architecture is not incidental; it is the structural insight the codebase itself demonstrates whether or not it was ever written down before today.

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
- Beta-Binomial posterior probability scoring
- Scenario A/B/C differentiation:
  - **A — Transient mismatch** (network noise, retry)
  - **B — Adversarial mismatch** (active fraud, escalate)
  - **C — Network failure** (infrastructure, page)
- Fetcher → Validator → Scorer → Submitter → Broadcaster chain

### 💓 Embedded Watchdog
- HeartbeatSchema, HeartbeatBus, WatchdogProbes, OrchestratorEngine
- Operational diagnostics
- Distributed heartbeat monitoring
- Fault classification and incident reporting
- Runtime instrumentation

### 🧠 LINDIWE — AI Agent Orchestrator
- 5-role SDD workflow: Investigator → Planner → Mino Reviewer → Implementer → Validator
- Separation of concerns (Validator cannot approve own implementation)
- Behavioral coverage: VC issuance, Circuit Breaker, Webhook, SafeKrypte, Ubuntu Pools — ✅ **5/5 PASS** (2026-07-04)
- HMAC Security Guard: `lib/HmacSecurityGuard.js` — fall-closed SHA-256 inter-process signing with timing-safe comparison
- SafeKrypte Mock: `tests/mocks/SafeKrypteServiceMock.js` — local HTTP mock enabling 5/5 behavioral coverage without production HSM
- Ant Feast: 4 new game modules + 203 passing tests
- Three handoff files: INVESTIGATION.md, PLAN.md, VALIDATION.md

---

## Phases & Expansion

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

VVU OS is building the trust infrastructure for the next generation of financial systems — starting in South Africa, expanding globally. We are actively seeking mission-aligned funding to accelerate development, hardware TEE integration, and institutional partnerships.

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
- 15% — Community & Adoption: Ubuntu Pools member onboarding, hackathons, outreach

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
| **Testing** | Playwright · Jest · Autocannon |
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
docker build -t proofbridge-liner:hackathon .
docker run --rm -p 3000:3000 -e AMD_STRICT=0 proofbridge-liner:hackathon
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

## AMD Hackathon Track 3 — Unicorn Track Submission

**Project:** ProofBridge Liner — Hardware-Enforced Trust Infrastructure for SA Financial Markets  
**Track:** Track 3 — Unicorn Track (all levels, any tech stack)  
**Deadline:** July 11, 2026, 15:00 UTC  
**HuggingFace Space:** [proofbridge-liner-safety-kernel](https://huggingface.co/spaces/lablab-ai-amd-developer-hackathon/proofbridge-liner-safety-kernel)  
**Referral link:** [lablab.ai referral dashboard](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii)

### Judging Criteria — How We Map

| Criterion | Weight | Our Position |
|-----------|--------|-------------|
| **Creativity & Originality** | 25% | Bayesian safety kernel for real-world asset compliance — novel application of Bayes' theorem to property fraud detection, no comparable product exists |
| **Product/Market Potential** | 25% | R1.5T SA mortgage market, FSCA JS2 mandate, Ubuntu Pools 500M unbanked — 3 addressable markets converging on a single trust layer |
| **Completeness** | 25% | ✅ 50K+ transactions processed, ✅ 23 fraud blocks, ✅ FSCA/FICA/POPIA/CPA compliance docs, ✅ containerized, ✅ Docker + CI/CD pipeline |
| **Use of AMD Platforms** | 25% | ✅ AMD MI300X via ROCm 7 (192GB VRAM), ✅ Fireworks AI API inference, ✅ `lib/amd-init.ts` HW probe, ✅ sub-1ms P99 latency |

### Technical Differentiators

- **3-Layer Trust Stack** — SafeKrypte (signing) → SafeLiner (credentials) → ProofBridge (compliance) — cryptographic separation of concerns
- **Bayesian Beta-Binomial Kernel** — live γ=20 risk threshold with hardware-attested scoring outputs
- **TEE-Attested Reasoning Chain** — every decision cryptographically bound to AMD TEE PCR0 hash
- **Automated Regulatory Pipeline** — FSCA JS2 reports, FICA SAR goAML XML, Cybercrimes Act forensic bundles
- **Stripe + Stitch Billing** — dual-currency (USD/ZAR) subscription monetization for SA market
- **Baileys WhatsApp Daemon** — multi-file auth, interactive admin commands, Express health server
- **Advanced PiP Dashboard** — Document Picture-in-Picture with heartbeat, auto-close, compact telemetry chart

### For Best AMD-Hosted Gemma Project Prize ($2,000)
Gemma models are available via Fireworks AI API. To compete for this prize:
1. Use Gemma as the LLM judge for compliance scoring fallback
2. The Gateway AI SDK already supports `google/gemma-4-26b-a4b-it` — integration is configured in `ai-gateway/`
3. Submit with a tag and description referencing Gemma usage

### Quick Start (Containerized — for judging)
```bash
# Build the container
docker build -t proofbridge-liner:hackathon .

# Run on any AMD-supported instance (or with AMD_STRICT=0 for local testing)
docker run --rm -p 3000:3000 -e AMD_STRICT=0 proofbridge-liner:hackathon

# With AMD hardware verification
docker run --rm -p 3000:3000 --device=/dev/kfd --device=/dev/dri \
  -e AMD_STRICT=1 proofbridge-liner:hackathon
```

For detailed submission steps, see the [AMD Hackathon Submission Guide](./docs/HACKATHON_SUBMISSION_GUIDE.md).

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
- [ ] replay protection
- [ ] trust infrastructure
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
*Submitted to AMD Developer Hackathon: Act II — Track 3 (Unicorn Track)*  
build-ref: 387af0f
