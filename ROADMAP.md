# Roadmap — VVU Gateway Phase 1+

**Updated:** 2026-06-20  
**Current Phase:** Phase 1 — Live ✅

---

## ✅ Phase 1: ProofBridge Liner Safety Kernel (Completed — June 2026)

All six gates operational in production.

### Gate A — Dashboard & Health Monitoring
- [x] Health endpoint (`/api/health`) returning HTTP 200
- [x] 6 gate metric endpoints (`/api/metrics/gate-[a-f]`)
- [x] Watchdog HeartbeatBus with BroadcastChannel + IndexedDB
- [x] OrchestratorEngine with race-condition-safe recursive `setTimeout`
- [x] Rate limiting (30 req/min per IP)
- [x] 4/4 API integration tests passing

### Gate B — Webhook Infrastructure
- [x] Stitch webhook endpoint (`/api/webhooks/stitch`)
- [x] HMAC-SHA256 signature verification (X-VVU-Signature header)
- [x] Idempotency store with TTL cleanup (in-memory Map, Supabase-ready)
- [x] 12+ event type handlers (payment, ledger, FX, compliance, etc.)
- [x] Payload schema validation with error classification
- [x] Watchdog probe integration for production monitoring

### Gate C — Compliance & Regulatory
- [x] FSCA JS2 automated regulatory reporting
- [x] FICA SAR suspicious activity reporting
- [x] POPIA compliance framework (data subject rights, privacy impact, records of processing)
- [x] Cybercrimes Act 19 of 2020 forensic evidence bundling
- [x] CPA-compliant pool terms and complaints procedure
- [x] PAIA manual published
- [x] FSCA crypto-asset framework analysis
- [x] RMCP v1.0 (Risk Management and Compliance Programme) finalised per FIC Act Section 42
- [x] Entity-wide ML/TF/PF risk assessment completed
- [x] Product/services risk assessment matrix documented
- [x] Client-level risk assessment matrix (PCC 53 aligned) with SDD/NDD/EDD thresholds
- [x] SAR/SUR filing protocol via goAML documented (15-day deadline, no tipping-off)

### Gate D — CircuitBreaker Contract
- [x] `CircuitBreaker.sol` compiled via Foundry (`forge build`)
- [x] Deployed to Polygon Amoy at `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67`
- [x] Oracle address registered: `0x11af8AdDB671F133F500540fC1Dcc0248Ab62DAF`
- [x] Gas-optimized: initialize ~45k, tripCircuit ~28k, validate ~15k
- [x] 14/14 Foundry contract tests passing
- [x] `scripts/deploy.js` with `--target cb` for CircuitBreaker-only deployment
- [x] Safety Kernel v1.0 frozen — no further changes to core tripping logic
- [x] `/api/verify` enforces `circuitOpen()` as hard gate — `TRIPPED` returns HTTP 423
- [x] `/api/verify` calls `updateProof(assetId, deedHash)` to anchor hashes on-chain
- [x] Global middleware enforces Gate D on all routes (fail-closed on trip)
- [x] TEE attestation produces persistent RSA-SHA256 signature (server-side verifiable)

### Gate E — Email & Communications
- [x] Domain `venturevisionubuntu.co.za` verified in Resend
- [x] DKIM, SPF, MX, DMARC records all verified
- [x] Test email sent and confirmed delivered
- [x] `/api/send-email` endpoint with Bearer auth (KERNEL_SECRET)
- [x] Sending from `hello@venturevisionubuntu.co.za`
- [x] Resend SDK with lazy initialization
- [x] DNS managed at Host Africa with BIND zone file

### Gate F — TEE Attestation
- [x] Server-side attestation generation (`generateAttestation()`)
- [x] SHA-256 measurement + ephemeral RSA key fingerprint
- [x] Client-side verification (`verifyAttestation()`)
- [x] Timestamp included in attestation response for freshness checks
- [x] Software-simulated (hardware SGX/SEV-SNP in Phase 5)

---

## 🔜 Phase 2: SAFEGRID & Scaling (Target: Q1 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| SAFEGRID Brain | 🔜 Planning | Bayesian posterior-probability threshold (`τ*`) scoring engine. Featherless.ai latency benchmark approved (P95=157ms). |
| SAFESTAKES | 🔜 Planning | Staking layer for oracle nodes. |
| Parallel Water Economy | 🔜 Planning | Tokenized water rights and usage tracking. |
| Automated Scaling Gates | 🔜 Planning | Auto-scaling circuit breaker infrastructure for high-throughput environments. |
| ProofBridge-Liner Upscale | 🔜 Planning | Multi-chain support, higher TPS. |

**Pre-Phase 2 approvals:**
- Featherless.ai cleared for live reasoning (Board: ✅ P95 157ms ≤ 200ms threshold).
- Haridev888 calibration backtest approved (Board: ✅ 100% recall, 0 violations, monotonic).
- ProofBridge WebWorld verification passed (Board: ✅ 122 checks, 0 violations).

---

## 🔜 Phase 3: Multi-Bank Consortium (Target: Q2 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| Institutional Partner Onboarding | 🔜 Planning | Standard Bank OneHub sandbox pilot (14-day, real property data). Materials prepared. |
| Multi-Bank Consortium Formation | 🔜 Planning | Federated fraud intelligence via multi-party computation. Partners: Standard Bank, Absa, + SA institutions. |
| Federated MPC Infrastructure | 🔜 Planning | Shared fraud intelligence without data sharing. |

---

## 🔜 Phase 4: Advanced Forensic Analytics (Target: Q3 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| Longitudinal Anomaly Detection | 🔜 Planning | Pattern recognition across property portfolios. |
| Predictive Fraud Scoring | 🔜 Planning | ML on hardware-attested evidence chains. |
| Enhanced FSCA JS2 Reporting | 🔜 Planning | Predictive regulatory reporting with confidence intervals. |

---

## 🔜 Phase 5: Hardware TEE & Global Expansion (Target: Q4 2027)

| Component | Status | Detail |
|-----------|--------|--------|
| Hardware TEE Integration | 🔜 Planning | SGX/SEV-SNP hardware attestation replacing software simulation. |
| Global Expansion | 🔜 Planning | UK, Singapore, Dubai property markets. Cross-border evidence handling. |
| Multi-Region Deployment | 🔜 Planning | TEE deployment across geographic regions. |

---

## Key Performance Targets

| Metric | Current (Phase 1) | Target (Phase 2+) |
|--------|-------------------|-------------------|
| Contract gas (tripCircuit) | ~28k | ~25k (optimized) |
| API verify latency (P95) | ~85ms | ~50ms |
| IPFS quorum resolution | ~1.2s | ~800ms |
| Email delivery | ~3s | ~2s |
| Oracle consensus | 1-of-1 (single) | 3-of-5 (threshold) |
| TPS (estimated) | ~500 | ~5,000 |
| Uptime SLA | 99.9% | 99.99% |

---

## Success Metrics

- [x] Phase 1 gates: 6/6 passing
- [x] Test suite: 100% passing (4 API + 14 contract)
- [x] Documentation completeness: all files updated for Phase 1
- [x] Security posture: zero critical issues, no secrets in repo
- [ ] Phase 2 pilot completion with partner sign-off
- [ ] Multi-bank consortium operational
- [ ] Hardware TEE attestation live
- [ ] International market entry

---

## Timeline

```
Phase 1 (May-Jun 2026)  ████████████████████████████  ✅ COMPLETE
Phase 2 (Q1 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
Phase 3 (Q2 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
Phase 4 (Q3 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
Phase 5 (Q4 2027)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  🔜 Planning
```

For questions or adjustments to this roadmap, contact the project lead.

See `PROGRESS_LOG.md` for detailed milestone-by-milestone history.
