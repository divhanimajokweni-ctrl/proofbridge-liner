# 🏗️ VVU Gateway OS · ProofBridge-Liner

![Production Ready](https://img.shields.io/badge/status-production-green)
![Version](https://img.shields.io/badge/version-2.2.0-informational)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-proprietary-red)

> **Production-grade deterministic regulatory compliance operating system for the VVU ecosystem.**

VVU Gateway OS is the restricted operational dashboard and the execution/evidence layer that transforms state transitions into cryptographically verifiable receipts, enabling replayability, auditability, and compliance across Ubuntu Pools and future financial infrastructure.

---

## 🎯 Current Status

| Attribute | Value |
|-----------|-------|
| **Phase** | 🔧 Production Hardening |
| **Runtime** | Next.js 14 · Node.js 20 |
| **Architecture** | App Router · Supabase · Terraform |
| **Compliance** | SOC 2 · SAFE/TRIP · Deterministic Replay |
| **Gateway OS** | VVU Gateway OS · 6-entity dashboard · PIN-gate auth |
| **Live** | https://venturevisionubuntu.co.za/gateway |

Core architectural foundations are in place and the project is transitioning from a functional prototype toward a production-grade deterministic runtime.

**Current focus:**
- 🖥️ VVU Gateway OS — operational dashboard live
- 🛡️ Compliance Fabric completion
- 📄 Transition Receipt stability
- ⚡ Circuit Breaker enforcement
- 🔗 Distributed trace continuity
- 🔒 Immutable evidence generation
- 🔁 End-to-end deterministic replay
- 🌍 Ubuntu Pools production readiness

---

## 🧭 North Star

The primary objective remains unchanged:

> Ubuntu Pools operating with real members, real money, and real contribution cycles.

Everything else in the repository exists to make that event **cryptographically provable**, **operationally observable**, and **independently auditable**.

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

### 🖥️ VVU Gateway OS (`/gateway`)
Restricted operational dashboard for the VVU ecosystem. Single-page application with:
- PIN-gate authentication (4-digit entry verified client-side)
- 6-entity portfolio overview (Ubuntu Pools, ProofBridge Liner, SafeKrypte, SafeGrid, Ekasi, Lindiwe AI)
- Live countdown to ProofBridge production release target
- Entity detail views with metrics and event logs
- Governance Architecture view (VCT, Deployment Gates A–H, Shareholder Register)
- Systems Infrastructure view (NATS JetStream, ZK Circuits, Git Protocol, Compliance Gates)
- Live SAST clock, system pulse bar visualization, health ring
- Brand design: crimson/gold/void with Syne, IBM Plex Mono, DM Sans type system

**Built from first principles:** brand tokens extracted from VVU brand identity images. No component library — every pixel is hand-authored as a design constant, producing zero visual inconsistency.

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

### 🔐 IPFS Gateways
Document resolution and storage retrieval infrastructure. 
**Includes:** 
- Protocol Labs, Cloudflare, Pinata, dweb.link, w3s.link.
- 5-gateway IPFS diversity prevents single-point failures.

### 🌐 System API Gateway (`src/gateway/`)
Centralized API entry point for prover services and internal/external request routing.
**Includes:**
- `main.py`: FastAPI entry point.
- Prover services: `fetcher.js`, `scorer.js`, `validator.js`.
- Requirements and configuration.

**Responsibilities:**
- Standardized API interface for internal services.
- Prover service management.
- Request validation and routing.

---

### 💳 Gate A Infrastructure
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
- [x] VVU Gateway OS — operational dashboard deployed to production
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
| **Gateway OS** | VVU Gateway OS (standalone SPA at /gateway) |
| **Backend** | Next.js API Routes · Supabase |
| **Database** | Supabase PostgreSQL · RLS |
| **Auth** | Supabase Auth Helpers · PIN-gate (client-side) |
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

### Gateway OS
Access at `/gateway` on the deployed application. PIN-authenticated single-page operational dashboard for portfolio monitoring, governance, and systems infrastructure views.

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
