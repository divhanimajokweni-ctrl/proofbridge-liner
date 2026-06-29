# VVU · Venture Vision Ubuntu

> **If you're Mino (the founder), start here → [`FOUNDERS_VIEW.md`](./FOUNDERS_VIEW.md)**  
> Quick progress → [`PROGRESS_LOG.md`](./PROGRESS_LOG.md)

![Status](https://img.shields.io/badge/status-production-green)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)

**ProofBridge-Liner** — the compliance and verification layer for Ubuntu Pools and VVU's financial infrastructure.

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

---

## What This Project Does

- **Ubuntu Pools** — community savings circles with automated contribution tracking
- **ProofBridge** — cryptographic verification for every transaction (ZK proofs, smart contracts, audit trail)
- **WhatsApp bridge** — members interact via WhatsApp
- **Compliance OS** — SOC 2 aligned, all state transitions cryptographically verifiable

---

## Current Status

| Attribute | Value |
|-----------|-------|
| **Phase** | Production Hardening |
| **Runtime** | Next.js 14 · Node.js 20 |
| **Main branch** | `compliance-fabric` |
| **Next release** | 2026-07-30 |
| **DNS** | venturevisionubuntu.co.za (Vercel + Resend) |
| **Email** | hello@venturevisionubuntu.co.za (Resend) |
- 🔒 Immutable evidence generation
- 🔁 End-to-end deterministic replay
- 🌍 Ubuntu Pools production readiness

---

## 🧭 North Star

The primary objective remains unchanged:

> Ubuntu Pools operating with real members, real money, and real contribution cycles.

Everything else in the repository exists to make that event **cryptographically provable**, **operationally observable**, and **independently auditable**.

---

## 🗺️ Repository Map

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

## 🏛️ Core Architecture

```text
                 👤 User Action
                      │
                      ▼
             📥 State Transition Request
                      │
                      ▼
              ⚙️ Deterministic Evaluation
                      │
                      ▼
               🛡️ Compliance Fabric
                      │
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
     📄 Transition Receipt      ⚡ Circuit Breaker
          │                        │
          └───────────┬────────────┘
                      │
                      ▼
             🔐 Cryptographic Evidence
                      │
                      ▼
              📚 Immutable Audit Trail
                      │
                      ▼
                 🌍 Ubuntu Pools
```

---

## 🧩 Major Components

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

### 💓 Embedded Watchdog
Operational observability subsystem.

**Includes:**
- HeartbeatSchema
- HeartbeatBus
- WatchdogProbes
- OrchestratorEngine

**Responsibilities:**
- operational diagnostics
- distributed heartbeat monitoring
- fault classification
- incident reporting
- runtime instrumentation

### 🔐 Gate A Infrastructure
Identity and authentication infrastructure.

**Includes:**
- Supabase integration
- cookie remediation
- redirect loop protection
- UUID-safe RLS operations
- authentication health monitoring

### 💳 Gate B Infrastructure
Pre-registered contribution rail integration.

**Foundation includes:**
- webhook contracts
- contribution fault taxonomy
- ledger integration points
- reconciliation hooks
- idempotency support

**Future integrations:**
- payment providers
- FX oracle
- settlement verification
- contribution lifecycle management

---

## ✅ Production Capabilities

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

---

## 🚧 Production Hardening Remaining

Before production release:

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

## 🏗️ Infrastructure Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 · React 18 |
| **Backend** | Next.js API Routes · Supabase |
| **Database** | Supabase PostgreSQL · RLS |
| **Auth** | Supabase Auth Helpers |
| **IaC** | Terraform |
| **Monitoring** | Datadog · PagerDuty |
| **Cache** | Upstash Redis |
| **Testing** | Playwright · Jest · Autocannon |
| **Deployment** | Vercel |

**Target deployment characteristics:**
- 🌐 globally distributed
- ⚡ deterministic
- 👁️ observable
- 🔐 cryptographically verifiable

---

## 🚀 Development

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

### Build & Deploy
```bash
npm run build
vercel --prod --force
```

---

## 📋 Deployment Pipeline

| Stage | Command | Description |
|-------|---------|-------------|
| **Typecheck** | `npm run typecheck` | TypeScript validation |
| **Lint** | `npm run lint` | ESLint checks |
| **Build** | `npm run build` | Production bundle |
| **Test** | `npm test` | Unit tests |
| **E2E** | `npm run test:e2e` | Playwright tests |
| **Deploy** | `vercel --prod` | Vercel production |

---

## 🎯 Mission

ProofBridge-Liner exists to make critical financial and governance state transitions:

- 🔐 **independently verifiable**
- 🛡️ **cryptographically provable**
- 👁️ **operationally observable**
- 🔁 **deterministically reproducible**

---

## 📞 Contact

For inquiries related to production readiness, compliance integration, or partnership discussions, please reach out through the VVU ecosystem channels.

---

*Built with ❤️ for the Ubuntu Pools ecosystem*
