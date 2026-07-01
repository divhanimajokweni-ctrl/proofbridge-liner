# INVESTIGATION — VVU OS POST-JULY-15 DELIVERABLES — 2026-07-01

## Task
Assess current codebase state against the 9 post-July-15 deliverables roadmap (Phase 1-3 + Cross-Phase) and identify gaps requiring implementation before the 2026-07-31 SafeKrypte Lite deadline.

## Current State

### 1. SafeKrypte Lite (Critical Path — deadline 2026-07-31)
- **server/safekrypte-lite.ts** — Node.js/TypeScript implementation exists, port 5096:
  - POST /commons/v1/sign — accepts content_hash, creator_id → returns signed_attestation, timestamp, vvu_key_id, lite_tier: true
  - GET /commons/v1/verify/:id — verifies attestation against public key
  - GET /.well-known/safekrypte-lite-pubkey.pem — public key distribution
  - GET /commons/v1/stats — free tier tracking (0/1000)
- Key material: ED25519 key pair generated in-memory on startup (not persisted)
- No event emission to Ubuntu Data Bus
- No Prometheus/Grafana monitoring
- No key rotation script
- Implementation is TypeScript/Node.js, roadmap spec says Python/Go — mismatch
- No deployment to Vercel or external infra (runs only on localhost:5096)

### 2. SafeLiner Lite
- **server/safeline-lite.ts** — Node.js/TypeScript implementation exists, port 5097:
  - POST /commons/v1/issue — credential issuance with QR payload
  - GET /commons/v1/credential/:id — retrieve credential
  - GET /commons/v1/credential/:id/qr — QR code JSON
  - GET /commons/v1/stats — free tier tracking (0/1000)
- No UbuntuLearn/UbuntuDJ integration
- No event emission to Ubuntu Data Bus

### 3. Lindiwe Agent Kernel (deadline 2026-08-15)
- **src/lib/kernel/** directory contains: agent.ts, index.ts, config.ts, tools.ts, memory.ts, context.ts, logger.ts, types.ts
- **app/api/agent/converse/route.ts** — Mistral-powered agent converse endpoint with thread management
- **app/api/converse/route.ts** — UnifiedConversationStore-based simpler endpoint
- WhatsApp transport: **app/api/whatsapp/handler/route.ts** exists
- No Baileys integration confirmed
- SYSTEM_PROMPT is hardcoded Claude-specific (not model-agnostic)
- Anthropic SDK types imported but not actually used in converse route (uses Mistral)
- No Prometheus/Grafana agent monitoring

### 4. War Room Appliance CLI (deadline 2026-08-31)
- **scripts/vvu-cli.sh** — v1.0.0 implemented with 4 commands:
  - vvu install — installs OpenClaw, creates data directories
  - vvu deploy — starts SafeKrypte Lite, SafeLiner Lite, Operatus, OpenClaw
  - vvu doctor — checks service health
  - vvu status — fetches live dashboard summary from services
- **openclaw.json** — gateway config exists with WhatsApp/Slack/GoogleChat channels, MCP servers, plugins
- **app/gateway/panels/DashboardView.tsx** — dashboard panel exists in gateway UI
- Gateway not currently running (no :18789 listener)

### 5. SafeGames Commons Phase 1 (deadline 2026-09-30)
- No UbuntuDJ, UbuntuLearn, or Ubuntu Studio code found
- No creator onboarding flow
- No monetization flows
- Not yet started

### 6. NATS JetStream Migration (Phase 2 — 2027-03-31)
- No NATS JetStream implementation found
- Current event bus pattern uses in-memory or API-based patterns

### 7. Multi-Region NATS (Phase 3 — 2028-06-30)
- Not started — Phase 3 scope

### 8. Ubuntu Data Bus Namespace Registry
- No namespace registry file found
- No owner assigned
- No living document exists

### 9. Pitch Deck Audit
- No audit file found
- Marketing team not assigned

## Current Branch
- **main** (deployment branch) — canonical work should be on compliance-fabric

## Relevant Audit Findings
- HF-1: Secret exposure in verify/mint routes — not in scope
- HF-2: Overclaim remediation (model-agnostic claims removed from code comments)
- HF-3: Circuit breaker incomplete — not in scope
- HF-4: Webhook HMAC validation — not in scope  
- HF-5: ED25519 key rotation not implemented — IN SCOPE for SafeKrypte Lite

## Downstream Dependencies
- UbuntuDJ/UbuntuLearn depend on SafeKrypte Lite API + SafeLiner Lite API
- SafeLiner Lite depends on SafeKrypte Lite for signing attestations
- War Room dashboard depends on Read Model Projections from both Lite services
- OpenClaw gateway depends on Lite services being reachable on localhost

## Unknowns Before Planning
1. Should SafeKrypte Lite be rewritten in Python/Go or remain TypeScript/Node.js?
2. Is there an existing Ubuntu Data Bus implementation or is it purely a spec?
3. Is MISTRAL_API_KEY configured in the production environment?
4. What is the Vercel production URL to test against?
5. Is the venturevisionubuntu.co.za domain DNS resolved or still at Host Africa?

## Stale Context Risk
- Session started fresh — all assessments based on current disk state
- No cached context from prior sessions
