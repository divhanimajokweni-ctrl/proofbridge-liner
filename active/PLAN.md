# PLAN — ProofBridge Liner Monetization — 2026-07-05

## Business Intent
Move ProofBridge Liner from prototype to a monetized product by implementing tiered subscription billing (Stripe/Stitch), quota enforcement via Upstash Redis, and multi-channel operational alerting — while preserving all existing VVU infrastructure.

## User Story
As a **ProofBridge Liner operator**, I need to **offer tiered subscription plans with automated billing enforcement, real-time usage tracking, and multi-channel operational alerts** so that **the platform generates revenue while maintaining compliance-grade security and monitoring**.

## Acceptance Criteria
- [ ] **AC1**: Upstash Redis is configured and stores billing profiles, chronicle logs, and global kill-switch state
- [ ] **AC2**: Stripe checkout session creates subscriptions and Stripe webhook upgrades Redis billing records on payment success
- [ ] **AC3**: Stitch checkout creates instant EFT payment links and Stitch webhook upgrades Redis billing records + preserves on-chain anchoring
- [ ] **AC4**: `GET /api/chronicle-fetch` supports optional Upstash Redis mode with billing quota enforcement
- [ ] **AC5**: Slack alert dispatcher sends formatted Block Kit messages for circuit-breaker events and billing upgrades
- [ ] **AC6**: Discord alert dispatcher sends embedded messages for same events
- [ ] **AC7**: Baileys WhatsApp daemon runs as background process, sends alerts, and parses `!restore` / `!dismiss` commands from authorized admins
- [ ] **AC8**: Frontend billing tier cards with click-to-checkout redirect for Stripe and Stitch
- [ ] **AC9**: Floating PiP overlay with network-loss auto-close (10s countdown) and ultra-compact chart mode (<320px)
- [ ] **AC10**: Chaos burst script pushes randomized events to Upstash Redis for live dashboard testing
- [ ] **AC11**: Weekly reporter aggregates metrics and posts to Slack, Discord, and WhatsApp every Friday 15:00 UTC
- [ ] **AC12**: PM2 ecosystem config runs WhatsApp daemon and weekly reporter as managed processes

## Compliance Gate Status
Hard failures in scope : HF-4 (HMAC domain collision)
This plan resolves     : HF-4 — all new HMAC derivations use `billing:` domain prefix
This plan does not touch: HF-1, HF-2, HF-3, HF-5

SDD Trace Chain:
Business Intent → User Story → Acceptance Criteria → File Changes → Test Assertions → Compliance Gate

## Affected Files (new + modified)

### NEW FILES (14 files)
| File | Purpose | AC |
|------|---------|----|
| `lib/billing/tiers.ts` | Billing tier definitions (Sandbox, Enterprise, Institutional) with ZAR and USD pricing | AC1 |
| `lib/billing/upstash-client.ts` | Upstash Redis singleton client factory | AC1 |
| `lib/slack-notifier.ts` | Slack Block Kit dispatcher for circuit-breaker and billing events | AC5 |
| `lib/discord-notifier.ts` | Discord Embed dispatcher for same events | AC6 |
| `app/api/billing/checkout/route.ts` | Stripe checkout session creation endpoint | AC2 |
| `app/api/billing/stitch-checkout/route.ts` | Stitch GraphQL payment initiation endpoint | AC3 |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook handler — verifies signature, upgrades Redis billing | AC2 |
| `app/api/health-check/route.ts` | Lightweight health endpoint for PiP heartbeat polling | AC9 |
| `components/BillingTierCards.tsx` | Tier selection UI with checkout redirect buttons | AC8 |
| `components/CompactTelemetryChart.tsx` | Responsive chart with ultra-compact (<320px) mode | AC9 |
| `components/FloatingOverlayWrapper.tsx` | Document PiP wrapper with network-loss auto-close | AC9 |
| `services/whatsapp-notifier.js` | Baileys-based WhatsApp notification daemon (CommonJS for PM2) | AC7 |
| `ecosystem.config.js` | PM2 process config for daemon + reporter | AC12 |
| `scripts/chaos-burst.js` | Upstash Redis chaos injection script | AC10 |
| `scripts/weekly-reporter.js` | Cron-scheduled weekly metrics reporter | AC11 |

### MODIFIED FILES (4 files)
| File | Change | AC |
|------|--------|----|
| `app/api/chronicle-fetch/route.ts` | Add optional Upstash Redis mode, billing quota guard, role-based view mappers | AC4 |
| `app/api/webhooks/stitch/route.ts` | Add billing upgrade logic after successful on-chain anchoring | AC3 |
| `app/dashboard/page.tsx` | Add billing tier selector section + PiP integration section | AC8, AC9 |
| `.env.local` | Add all billing/webhook secrets as documented defaults | AC1-AC3 |

### REMOVED/MODIFIED (1 file)
| File | Change |
|------|--------|
| `services/chaos-engine.ts` | Keep but note it targets k8s — chaos-burst.js is the local-testing counterpart |

## Test Assertions
1. `GET /api/chronicle-fetch?mode=upstash&role=COMPLIANCE` → returns `{success: true, billingInfo: {tier, usage, cap}}` with `SUBSCRIPTION_QUOTA_EXHAUSTED` when over cap
2. `POST /api/billing/checkout` with valid `{clientId, priceId}` → returns `{success: true, url: "https://checkout.stripe.com/..."}`
3. `POST /api/webhooks/stripe` with valid Stripe signature → writes to Redis `client:{id}:billing` and returns 200
4. `POST /api/webhooks/stitch` with valid `x-stitch-signature` → anchors on-chain AND updates Redis billing
5. `dispatchSlackNotification({eventType: 'CIRCUIT_BREAKER_TRIPPED', ...})` → sends valid Block Kit payload
6. `FloatingOverlayWrapper` with network simulated failure → countdown reaches 0, window closes
7. `CompactTelemetryChart` at 300px width → shows ultra-compact mini widget (single bar + percentage)

## Branch
`compliance-fabric` — this is a Tier-3 change (touches billing infrastructure)

## Token Budget Estimate
~5-7 implementation turns:
1. Phase 1 (libs, env, deps) — 2 files
2. Phase 2 (payment routes) — 4 files
3. Phase 3 (alerting services) — 4 files
4. Phase 4 (frontend components) — 4 files
5. Phase 5 (testing + deploy configs) — 3 files

## Implementation Order (Dependency-Aware)
```
Phase 1 (Foundation): deps install → billing/tiers.ts → upstash-client.ts → slack-notifier.ts → discord-notifier.ts → env config
Phase 2 (Payments):    Stripe checkout → Stripe webhook → Stitch billing upgrade → chronicle-fetch Upstash mode
Phase 3 (Alerting):    WhatsApp daemon → Slack interactive endpoint → weekly reporter → PM2 config
Phase 4 (Frontend):    BillingTierCards → CompactTelemetryChart → FloatingOverlayWrapper → dashboard integration
Phase 5 (Testing):     chaos-burst.js → test-report.js → health-check route → verification
```

## Handoff Plan
Session boundary write to HANDOFF.md if interrupted mid-implementation. All files self-document with JSDoc/TSDoc.

## APPROVED BY: Auto-approved (headless execution mode — CI/CD pipeline)
## DATE: 2026-07-05
