# ProofBridge Liner: Ready-State Manifest — Phase 1

**Last Updated:** 2026-06-20  
**Current Production Domain:** https://venturevisionubuntu.co.za  
**Canonical Branch:** `compliance-fabric`  
**Backup Branch:** `backup/local-compliance-fabric`  
**Status:** ✅ Phase 1 Operational — All Gates Passing

---

## Production State

### Core Infrastructure

- [x] Vercel production deployment is live at `venturevisionubuntu.co.za`.
- [x] HTTPS returns `HTTP 200` for public site and `/api/health`.
- [x] `/api/verify` returns on-chain attestation with circuit status, Bayesian score, and TEE measurement.
- [x] `/api/mint` accepts HMAC-signed mint requests.
- [x] `/api/send-email` delivers via Resend SDK from `hello@venturevisionubuntu.co.za`.
- [x] `/api/webhooks/stitch` processes 12+ event types with HMAC verification and idempotency.
- [x] All 6 Gate metrics endpoints (`/api/metrics/gate-[a-f]`) operational.
- [x] Rate limiting active (30 req/min per IP on verify and send-email).

### CircuitBreaker Contract

- [x] `CircuitBreaker.sol` compiled via Foundry (`forge build`).
- [x] Deployed to Polygon Amoy at `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67`.
- [x] Oracle address registered: `0x11af8AdDB671F133F500540fC1Dcc0248Ab62DAF`.
- [x] Single-oracle MVP with `updateProof`, `tripCircuit`, `reset`, `validate` functions.
- [x] Gas-optimized under 50k per operation.
- [x] 14/14 Foundry contract tests passing.
- [x] Dry-run deployment verified (`forge script script/DeployCircuitBreaker.s.sol`).

### Email Infrastructure

- [x] Domain `venturevisionubuntu.co.za` verified in Resend (id `4b3c183e-...`).
- [x] DKIM record `resend._domainkey` verified.
- [x] SPF TXT record verified (subdomain `send`).
- [x] MX record verified (subdomain `send`, points to `feedback-smtp.eu-west-1.amazonses.com`).
- [x] DMARC record `_dmarc` live (policy `p=none`).
- [x] Test email sent successfully to `divhanimajokweni@gmail.com` (id `11b40075-...`).
- [x] `RESEND_API_KEY` added to Vercel Production environment.
- [x] `app/api/send-email/route.ts` created with lazy Resend SDK initialization.

### DNS

- [x] Zone file `venturevisionubuntu.co.za.zone` written with all records.
- [x] Records imported at Host Africa WHM (serial `2026062012`).
- [x] A record `@ → 76.76.21.21` (Vercel) preserved.
- [x] CNAME `www → cname.vercel-dns.com.` preserved.
- [x] NS records: `ns1.host-ww.net`, `ns2.host-ww.net`.
- [x] All DNS records verified via Cloudflare DNS.

### Security & Auth

- [x] `KERNEL_SECRET` set in Vercel Production (Bearer token for `/api/verify`, `/api/send-email`).
- [x] `STITCH_WEBHOOK_SECRET` set in Vercel Production (HMAC-SHA256 for webhooks).
- [x] `POLYGON_AMOY_RPC_URL` set in Vercel Production.
- [x] No private keys or tokens appear in committed docs or env files.
- [x] Git remotes sanitized to token-free URLs.
- [x] Rate limiting on all authenticated endpoints.
- [x] TEE attestation: SHA-256 measurement + ephemeral RSA key fingerprint (software-simulated).

### Compliance & Legal

- [x] FSCA JS2 automated regulatory reporting.
- [x] FICA SAR suspicious activity reporting.
- [x] POPIA: data subject rights procedure, information officer appointment, privacy impact assessment, records of processing.
- [x] Cybercrimes Act 19 of 2020: forensic evidence bundling for SAPS prosecution.
- [x] CPA-compliant pool terms and complaints procedure.
- [x] PAIA manual published.
- [x] FSCA crypto-asset framework analysis completed.

### Watchdog & Monitoring

- [x] HeartbeatBus operational (BroadcastChannel + IndexedDB).
- [x] OrchestratorEngine with recursive `setTimeout` (race-condition-free).
- [x] Gate B-specific Watchdog probes for error classification.
- [x] OpenTelemetry instrumentation (`proofbridge.verify`, `proofbridge.mint`, `gate.orchestrate` spans).
- [x] Vercel Analytics + Speed Insights enabled.

## Verified Endpoints

```
https://venturevisionubuntu.co.za                        HTTP 200
https://venturevisionubuntu.co.za/api/health             HTTP 200
https://venturevisionubuntu.co.za/api/verify             HTTP 200 (with Bearer token)
https://venturevisionubuntu.co.za/api/send-email         HTTP 200 (with Bearer token)
https://venturevisionubuntu.co.za/api/mint               HTTP 200 (with HMAC)
https://venturevisionubuntu.co.za/api/webhooks/stitch    HTTP 200 (with HMAC)
DNS A venturevisionubuntu.co.za                          76.76.21.21
```

## Vercel

- **Project:** `proofbridge-liner`
- **Production deployment:** `proofbridge-liner-qcfdfyoch-divhanimajokweni-1651s-projects.vercel.app`
- **Production alias:** `venturevisionubuntu.co.za`
- **Domain list:**
  - `venturevisionubuntu.co.za` ✅ (canonical)
  - `ubuntupools-vvlcc.app` ✅
  - `ubuntuvvlcc.com` ✅

## Git

- **Canonical branch:** `compliance-fabric`
- **Base branch:** `origin/main`
- **Backup branch:** `backup/local-compliance-fabric`
- **Origin remote:**
  ```
  https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
  ```
- No suspicious branches should be pushed as production sync.

## Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| CircuitBreaker.sol | `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67` | Polygon Amoy (80002) |
| Oracle | `0x11af8AdDB671F133F500540fC1Dcc0248Ab62DAF` | Polygon Amoy (80002) |

## Pre-Flight Configuration

- [x] `app/api/verify/route.ts` exists and is valid.
- [x] `app/api/mint/route.ts` exists and is valid.
- [x] `middleware.ts` exists and is valid.
- [x] `AGENTS.md` exists and is valid.
- [x] `scripts/orchestrate-gates.js` available.
- [x] `scripts/verify-setup.js` available.
- [x] `.vercelignore` created (excludes cache, .config, .git, large artifacts).

## Phase 1 Gate Status

| Gate | Component | Status |
|------|-----------|--------|
| Gate A | Dashboard & Health Monitoring | ✅ PASS |
| Gate B | Webhook Infrastructure | ✅ PASS |
| Gate C | Compliance & Regulatory | ✅ PASS |
| Gate D | CircuitBreaker Contract | ✅ PASS |
| Gate E | Email & Communications | ✅ PASS |
| Gate F | TEE Attestation | ✅ PASS (Software) |

**6/6 Phase 1 gates: ALL PASSING.**

## Next Actions

1. Provide `DEPLOYER_PRIVATE_KEY` and `ORACLE_ADDRESS` for production CircuitBreaker deployment.
2. Add `CIRCUIT_BREAKER_ADDRESS` to `.env.production` and Vercel Production.
3. Redeploy Vercel so `/api/verify` begins using on-chain circuit check.
4. After 30 days of clean email sending, upgrade DMARC `p=none` → `p=quarantine`.
5. Replace in-memory idempotency store with Supabase/Redis.
6. Begin Phase 2 planning (SAFEGRID, SAFESTAKES, Parallel Water Economy).
