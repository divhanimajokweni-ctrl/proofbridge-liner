# INVESTIGATION — ProofBridge Liner Monetization — 2026-07-05

## Task
Review the comprehensive product monetization blueprint (Upstash Redis billing engine, Baileys WhatsApp daemon, Stripe/Stitch payment integration, multi-channel alerting, PiP dashboard) against the existing codebase and generate a phased implementation strategy that moves from planning to a live monetized product.

## Current State (as-read from filesystem)

### Branch: `compliance-fabric` ✓ (Tier-3 correct)

### Existing API Routes
| Route | What It Does | Blueprint Overlap |
|-------|-------------|-------------------|
| `app/api/chronicle-fetch/route.ts` | File-based chronicle reader (`/opt/vvu/data/chronicle_chain.log` or local `data/` fallback, with mock feed). No Upstash Redis. No billing tier logic. No role-based view mappers. | HIGH — blueprint replaces entirely with Upstash Redis + billing guard + role mappers |
| `app/api/webhooks/stitch/route.ts` | Stitch webhook already exists. HMAC-validated, anchors decisions to `GovernanceAnchor.sol` on Polygon Amoy (`0x770342c49e1F4710E0Eed605dCe41e7f3F7600Eb`). No billing upgrade logic. | HIGH — blueprint adds billing upgrade to this, but must preserve existing on-chain anchoring |
| `app/api/health/route.ts` | Returns `{status: "healthy", systems: {gateway, poolsEngine, proofbridgeLiner, stitchAdapter}}`. | LOW — health-check exists; blueprint uses `/api/health-check` for PiP heartbeat |
| `app/api/whatsapp/handler/` | WhatsApp handler exists but unclear scope without reading deeper. | MEDIUM — separate from Baileys daemon blueprint |
| No Stripe routes exist | — | HIGH — blueprint requires Stripe checkout + webhook routes |

### Existing Services
| File | What It Does |
|------|-------------|
| `services/chaos-engine.ts` | Kubernetes-targeted chaos injector (deletes pods, adds netem latency). Not usable without k8s. |
| `services/injector.ts` | Exec kubectl commands for chaos modes. |

### Existing WhatsApp Bridge
- `whatsapp-bridge/` directory is a **separate** Node.js app (`package.json`, `server.js`) using `whatsapp-web.js` (not Baileys).
- Blueprint uses `@whiskeysockets/baileys` — different tech stack.
- `@whiskeysockets/baileys` IS already in root `package.json` as dependency (v7.0.0-rc13).

### Existing Dashboard (`app/dashboard/page.tsx`)
- **Design**: Cyan/gold/black VVU theme with project status cards (SafeKrypte, SafeLiner, Operatus, Lindiwe, Ubuntu Pools, ProofBridge Liner, SafeGrid, Ekasi).
- **Live metrics**: WebSocket connection to `ws://localhost:3001` for CPU/memory/load data, with mock fallback.
- **Components used**: `DashboardWidget`, `MetricCard`, `SystemStatusBar`, `AntonyQueueEngine`, `TokenManagementPanel`.
- **NO** billing tier selector, NO kill switch, NO PiP, NO role-based view mapper.
- Blueprint dashboard is a completely different compliance-monitor theme (slate/teal/rose colors, log pipeline view).

### Existing Components (`components/`)
- 14 components: `AntonyQueueEngine`, `DashboardWidget`, `Disclaimer`, `EntityLanding`, `KernelConsole`, `KernelConsoleV2`, `MetricCard`, `ProcessTable`, `ProjectGrid`, `Sidebar`, `SiteFooter`, `SiteHeader`, `SystemStatusBar`, `VelocityChart`.
- **NONE** of the blueprint's new components exist: `FloatingOverlayWrapper`, `BillingTierCards`, `CompactTelemetryChart`.

### Existing Lib (`lib/`)
- `HmacSecurityGuard.js` — HMAC security helpers exist but may need domain separation (HF-4 concern).
- No `slack-notifier.ts`, no `discord-notifier.ts`, no Upstash Redis client wrapper.

### Existing Scripts (`scripts/`)
- 67 scripts including `verify-setup.js`, `orchestrate-gates.js`, `behavioral-coverage.ts`, `chaos/` dir.
- No `chaos-burst.js`, no `weekly-reporter.js`, no `test-report.js`.

### Dependencies Status (package.json)
| Dependency | Installed? | Needed For |
|-----------|-----------|------------|
| `@whiskeysockets/baileys` | ✅ v7.0.0-rc13 | WhatsApp notification daemon |
| `pino` | ✅ v9.14.0 | Baileys logger |
| `ethers` | ✅ v6.13.2 | On-chain anchoring |
| `express` | ✅ v4.19.2 | Standalone health daemon |
| `dotenv` | ✅ v16.4.5 | Environment loading |
| `@upstash/redis` | ❌ NOT installed | Billing state store, telemetry pipeline |
| `stripe` | ❌ NOT installed | Payment checkout, webhook verification |
| `node-cron` | ❌ NOT installed | Weekly reporter scheduler |
| `recharts` | ✅ v3.9.1 | Charts (already available) |
| `lucide-react` | ✅ v1.23.0 | Icons (already available) |

### Environment Configuration
- `.env.example` — has RPC URLs, private key, contract address, kernel secret. No billing secrets.
- `.env.local` — has DATABASE_URL, Supabase config, JWT secrets. No Stripe/Stitch/Upstash secrets.
- No `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET` defined anywhere.

### Dockerfile
- Multi-stage build (deps → builder → runner) for Next.js standalone.
- Entrypoint runs AMD init check then `node server.js`.
- No WhatsApp daemon container, no PM2 configuration.
- No `ecosystem.config.js` exists.

## Relevant Audit Findings (from vvu-compliance-gate)
- HF-1 TEE Attestation: Not in scope for billing infrastructure
- HF-2 ZK On-Chain Verification: Not in scope
- HF-3 GovernanceAnchor Deployment: The existing Stitch webhook already anchors to a deployed contract address (`0x770342c49e1F4710E0Eed605dCe41e7f3F7600Eb`) — verify if this address is registered in the deployment registry
- HF-4 HMAC Domain Collision: **IN SCOPE** — if we add HMAC key derivation for billing webhooks, we must use domain-separated keys (`billing:` prefix vs `webhook:` vs `vct:`)
- HF-5 Beta-Binomial Calibration: Not in scope

## Hard Failures In Scope
HF-4: The Stitch webhook already uses HMAC-SHA256 for verification. If we add Stripe webhook (which uses its own signature scheme via `stripe.webhooks.constructEvent`), no HMAC collision risk there. But if we add any custom HMAC key derivation for billing, must use `billing:` domain prefix.

## Downstream Dependencies
- Billing data model change will affect: `app/api/chronicle-fetch/`, `app/api/webhooks/stitch/`, new `app/api/webhooks/stripe/`, new `app/api/billing/`, dashboard, notifier libs.
- WhatsApp daemon is standalone but shares env vars with the main app.
- Chaos script writes to Upstash Redis which feeds the dashboard.

## Unknowns Before Planning
1. Does the Stitch webhook secret key exist in production? The existing route references `STITCH_WEBHOOK_SECRET`.
2. What is the actual Stitch client ID/client secret — are these configured in production env?
3. Is the existing Baileys auth_store_whatsapp directory initialized anywhere?
4. Does the existing dashboard need to stay as-is, or should the blueprint's compliance monitor be a new route?

## Stale Context Risk
Low — all reads are fresh from disk this session.

## Integration Strategy Decision
Based on codebase investigation, the approach will be:
1. **Preserve** all existing routes. Add new routes/files alongside.
2. **Add** Upstash Redis as a complementary data layer — chronicle-fetch will support both file-based and Upstash modes.
3. **Extend** existing Stitch webhook with billing upgrade, preserving on-chain anchoring.
4. **Build** billing features as composable libs in `lib/billing/`.
5. **Create** new dashboard components without breaking the existing VVU Operational Deck.
6. **Deploy** WhatsApp daemon as a PM2-managed process alongside the Next.js app.
