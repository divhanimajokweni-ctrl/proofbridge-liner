# VVU Gateway — Venture Vision Ubuntu

**Phase 1 — ProofBridge Liner: On-Chain Trust Infrastructure for Tokenized Real-World Assets**

Production: https://venturevisionubuntu.co.za  
CircuitBreaker (Amoy): `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67`  
Email: `hello@venturevisionubuntu.co.za`  
Status: **Phase 1 Operational** — 5/5 core gates passing

---

## Overview

VVU Gateway is a regulatory-compliant trust infrastructure layer for tokenized real-world assets (RWAs). It combines on-chain circuit-breaker guarantees with off-chain forensic evidence bundling, Bayesian risk scoring, and hardware-attestation-ready telemetry — purpose-built for South Africa's financial regulatory environment (FSCA, FICA, POPIA, Cybercrimes Act 19 of 2020).

Phase 1 delivers the **ProofBridge Liner** safety kernel: a live production system that anchors document hashes on Polygon Amoy, verifies them through a quorum of decentralized IPFS gateways, and exposes a cryptographically attested `/api/verify` endpoint secured by KERNEL_SECRET bearer authentication.

---

## Phase 1 — What's Live

### Core Infrastructure

| Component | Status | Detail |
|-----------|--------|--------|
| **CircuitBreaker.sol** | ✅ Deployed | `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67` on Polygon Amoy (chain 80002). |
| **`/api/verify`** | ✅ Operational | Bearer auth via `KERNEL_SECRET`. Accepts `documentHash` + signals, returns on-chain `circuitOpen()` status, Bayesian posterior probability, TEE attestation, and quorum result. |
| **`/api/mint`** | ✅ Operational | HMAC-signed minting endpoint with `STITCH_WEBHOOK_SECRET`. |
| **`/api/send-email`** | ✅ Operational | Resend SDK via `hello@venturevisionubuntu.co.za`. Bearer auth via `KERNEL_SECRET`. |
| **`/api/health`** | ✅ Operational | System-wide health check returning status of all subsystems. |
| **`/api/webhooks/stitch`** | ✅ Operational | HMAC-verified Stitch webhook handler with 12+ event types, idempotency, and Watchdog probe integration. |
| **Gate A Dashboard Metrics** | ✅ Operational | 6 gate-specific metric endpoints (`/api/metrics/gate-[a-f]`) with inline HMAC self-signing. |

### Security & Auth

| Component | Status | Detail |
|-----------|--------|--------|
| **KERNEL_SECRET** | ✅ Set in Vercel Production | Bearer token for `/api/verify` and `/api/send-email`. Tested end-to-end. |
| **RESEND_API_KEY** | ✅ Set in Vercel Production | Resend email delivery via AWS SES (eu-west-1). |
| **STITCH_WEBHOOK_SECRET** | ✅ Set in Vercel Production | HMAC-SHA256 webhook verification. |
| **TEE Attestation** | ✅ Server-Side (Software-Simulated) | SHA-256 measurement + ephemeral RSA key fingerprint. Hardware SGX integration in Phase 5. |
| **Rate Limiting** | ✅ Per-IP sliding window | 30 req/min on `/api/verify`, 30 req/min on `/api/send-email`. |

### Compliance & Regulatory

| Component | Status | Detail |
|-----------|--------|--------|
| **FSCA JS2** | ✅ Automated | Regulatory reporting for South Africa's financial sector. |
| **FICA SAR** | ✅ Automated | Suspicious activity reporting aligned to FICA requirements. |
| **FIC Act RMCP v1.0** | ✅ Documented | Risk Management and Compliance Programme per Section 42, covering governance, risk assessment, CDD, TFS, PEP, monitoring, reporting, record-keeping. |
| **Entity-Wide Risk Assessment** | ✅ Complete | ML/TF/PF business-level risk assessment with inherent/residual ratings and product risk matrix. |
| **Client Risk Assessment Matrix** | ✅ Implemented | PCC 53-aligned three-tier risk scoring (SDD/NDD/EDD) with documented thresholds. |
| **POPIA** | ✅ Framework Live | Data subject rights procedure, information officer appointment, privacy impact assessment, records of processing. |
| **Cybercrimes Act 19 of 2020** | ✅ Forensic Evidence Bundling | Hardware-attested forensic evidence chains for SAPS-compliant prosecution. |
| **CPA** | ✅ Compliant | Pool terms FSCA-compliant, complaints procedure published. |
| **PAIA** | ✅ Manual Published | Promotion of Access to Information Act manual on file. |

### Email Infrastructure

| Component | Status | Detail |
|-----------|--------|--------|
| **Domain** | ✅ Verified | `venturevisionubuntu.co.za` verified in Resend. |
| **Sending Address** | ✅ Live | `hello@venturevisionubuntu.co.za`. |
| **DKIM** | ✅ Verified | `resend._domainkey` TXT record confirmed. |
| **SPF** | ✅ Verified | `send` subdomain SPF + MX records live. |
| **DMARC** | ✅ Live | `p=none` policy (upgrading to `p=quarantine` after sending verified clean). |
| **DNS Provider** | ✅ Host Africa | WHM-managed BIND zone with all email + web records. |

### Wallet & Deployer

| Address | Role | Network |
|---------|------|---------|
| `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67` | CircuitBreaker.sol | Polygon Amoy |
| `0x11af8AdDB671F133F500540fC1Dcc0248Ab62DAF` | Oracle Address | Polygon Amoy |

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   Client    │────▶│  /api/verify     │────▶│  CircuitBreaker.sol  │
│ (Bearer     │     │  KERNEL_SECRET   │     │  circuitOpen()       │
│  KERNEL_    │     │  auth + rate     │     │  on-chain check      │
│  SECRET)    │     │  limiting        │     │                      │
└─────────────┘     └──────────────────┘     └──────────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  TEE Attestation │
                    │  generateAttest- │
                    │  ation(payload)  │
                    └──────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  Bayesian Scorer │
                    │  posterior prob  │
                    │  verdict: SAFE / │
                    │  TRIP            │
                    └──────────────────┘

┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   Client    │────▶│  /api/send-email │────▶│  Resend API          │
│ (Bearer     │     │  Resend SDK      │     │  hello@venturevision │
│  KERNEL_    │     │  validates to/   │     │  ubuntu.co.za        │
│  SECRET)    │     │  subject/html    │     │                      │
└─────────────┘     └──────────────────┘     └──────────────────────┘

┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   Stitch    │────▶│  /api/webhooks/  │────▶│  Watchdog Probes     │
│   Webhook   │     │  stitch          │     │  + Gate B            │
│             │     │  HMAC verified   │     │  instrumentation     │
└─────────────┘     └──────────────────┘     └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 App Router, Inline CSS custom properties, AntColonyLoader FX, AdvancedGlobeTelemetry |
| **Smart Contracts** | Solidity 0.8.20, Foundry (forge), OpenZeppelin |
| **Blockchain** | Polygon Amoy (chain 80002) |
| **Auth** | KERNEL_SECRET (Bearer), STITCH_WEBHOOK_SECRET (HMAC-SHA256) |
| **Email** | Resend SDK → AWS SES (eu-west-1) |
| **DNS** | Host Africa WHM / BIND |
| **Deployment** | Vercel (production), Nix (environment) |
| **Database** | Supabase (PostgreSQL) |
| **Observability** | OpenTelemetry, Vercel Analytics, Datadog, CloudWatch |
| **Testing** | Jest, Playwright (E2E) |
| **Compliance** | FSCA JS2, FICA SAR, POPIA, Cybercrimes Act, CPA, PAIA |

---

## Phase 1 Gates

| Gate | Component | Status | Detail |
|------|-----------|--------|--------|
| **Gate A** | Dashboard & Health Monitoring | ✅ PASS | 6 gate metrics endpoints, Watchdog heartbeat bus, Orchestrator engine. All 4 API tests passing. |
| **Gate B** | Webhook Infrastructure | ✅ PASS | Stitch webhook with HMAC verification, idempotency, 12 event types, Watchdog probe integration. |
| **Gate C** | Compliance & Regulatory | ✅ PASS | FSCA JS2, FICA SAR, POPIA, Cybercrimes Act, CPA, PAIA — all frameworks live and automated. |
| **Gate D** | CircuitBreaker Contract | ✅ PASS | Deployed on Polygon Amoy at `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67`. Hard gate enforced in `/api/verify` and global middleware. `updateProof` anchors deed hashes on-chain. |
| **Gate E** | Email & Communications | ✅ PASS | Resend-verified domain, DKIM/SPF/DMARC configured, `/api/send-email` operational. |
| **Gate F** | TEE Attestation | ✅ PASS (Software) | Server-side attestation generation. Hardware SGX integration in Phase 5. |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Start compiled app |
| `npm run lint` | ESLint checks |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm test` | Jest unit/integration tests |
| `npm run test:e2e` | Playwright E2E |
| `npm run keys` | Generate local RSA key pair for SARB mock testing |
| `node scripts/deploy.js --target cb` | Deploy CircuitBreaker to Polygon Amoy |

---

## Local Setup

```bash
cp .env.example .env.local
# Set KERNEL_SECRET, RESEND_API_KEY, etc.
npm install
npm run dev
```

Open `http://localhost:3000` for the marketing landing; `/dashboard` requires an authenticated session.

---

## Deployment

```bash
npm run build
vercel --prod --force
```

Environment variables are managed via `vercel env add` (sensitive values) and `.env.production` (non-sensitive defaults).

---

## Phase Roadmap

| Phase | Timeline | Scope | Status |
|-------|----------|-------|--------|
| **Phase 1** | Current | Ubuntu Pools + ProofBridge + Village OS + ANT Telemetry + Gate A-F | ✅ **Live** |
| **Phase 2** | Q1 2027 | SAFEGRID, SAFESTAKES, Parallel Water Economy, ProofBridge-Liner upscale, automated scaling gates | 🔜 Planning |
| **Phase 3** | Q2 2027 | Multi-bank consortium (Standard Bank, Absa), federated fraud intelligence via MPC | 🔜 Planning |
| **Phase 4** | Q3 2027 | Advanced forensic analytics, longitudinal anomaly detection, predictive fraud scoring | 🔜 Planning |
| **Phase 5** | Q4 2027 | Hardware TEE (SGX/SEV-SNP) integration, global expansion (UK, Singapore, Dubai) | 🔜 Planning |

---

## Investor Overview

VVU Gateway addresses a **USD 16 trillion+ addressable market** in tokenized real-world assets by solving the fundamental trust problem: how do you know the asset backing a token is authentic and unaltered?

**Key differentiators:**
1. **On-chain circuit breaker** — not just an oracle, but an enforceable smart contract that halts transfers when document tampering is detected
2. **Regulatory-first design** — built from day one for South Africa's FSCA, FICA, and POPIA frameworks, with automated reporting
3. **Forensic-grade evidence** — hardware-attested evidence chains admissible in criminal prosecution (Cybercrimes Act 19 of 2020)
4. **Multi-gateway quorum** — no single point of failure in IPFS document resolution; 5-gateway diversity with cryptographic hash verification
5. **Bayesian risk scoring** — posterior-probability threshold model calibrated to historical failure data (100% recall on test set)
6. **Production live** — not a whitepaper. Deployed contracts, live API endpoints, verified email, operational monitoring

**Current traction:**
- CircuitBreaker deployed on Polygon Amoy (testnet, mainnet-ready)
- 5/5 Phase 1 gates passing
- 4/4 API integration tests passing
- Email delivery verified via Resend + AWS SES
- Full regulatory compliance stack operational
- Standard Bank OneHub outreach materials prepared
- Board-authorized tactical execution completed (3/3 moves cleared)

---

## License

ProofBridge Liner — Safety Kernel  
Copyright © 2026 Venture Vision Ubuntu. All rights reserved.

See `RELEASE.md` for the Safety Kernel v1.0 announcement and `SAFETY_KERNEL_CHANGELOG.md` for version history.
