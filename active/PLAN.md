# PLAN — RC1 Repository Purity Freeze — 2026-07-07

## Business Intent
ProofBridge-Liner is a single product: deterministic trust infrastructure. The repository must contain only that product. Removing unrelated code, restructuring to a canonical layout, and rebuilding the UI around a single institutional narrative are prerequisites for RC1 release.

## User Story
As a **CTO evaluating ProofBridge-Liner for a regulated enterprise (bank, insurer, government)**, I need the repository and website to communicate a single coherent product with cryptographic trust enforcement at its center, so that I can evaluate fit for purpose without confusion from unrelated VVU ecosystem content.

## Acceptance Criteria
- [ ] **AC1**: All exclusion targets (Ubuntu Studio, Ekasi, Gateway, Ubuntu Games, Ubuntu Pools, SafeGrid, Lindiwe Agent UI, WhatsApp, AI Gateway, Billing, Email, Onboarding, Auth, Arena, Converse, Agent APIs, Contact, Feed, Library, Consent, Chronicle, GitHub, Tools) are removed from `app/` tree
- [ ] **AC2**: All exclusion target root directories (`whatsapp-bridge/`, `ai-gateway/`, `demo/`, `examples/`, `extensions/`, `governance/` duplicate, `GOVERNANCE/` duplicate, `research/`, `services/`, `site/`, `archive/`, `mcp/`, `agent/`, `auth/`) are removed
- [ ] **AC3**: `public/` cleaned — only ProofBridge-Liner assets remain
- [ ] **AC4**: Repository structure matches canonical layout:
        ```
        apps/web/         (Next.js app)
        packages/trust-kernel/
        packages/compliance-fabric/
        packages/safekrypte/
        packages/compute-fabric/
        packages/enterprise-control-plane/
        packages/shared/
        contracts/
        infrastructure/
        validation/
        tests/
        docs/
        README.md
        ```
- [ ] **AC5**: UI rebuilt as single product narrative with pages: Hero → Trust Narrative → Interactive Trust Pipeline → Enterprise Control Plane → Validation Evidence → Technical Architecture → Documentation → FAQ → CTA
- [ ] **AC6**: GlobeTelemetry (`components/ui/globe-telemetry.tsx`) and AntLoader (`components/ui/ant-loader.tsx`) exist as headless props-driven components
- [ ] **AC7**: All dead branches cleaned up (local + remote)
- [ ] **AC8**: `README.md` rewritten — only ProofBridge-Liner content
- [ ] **AC9**: `npm run build` succeeds (0 errors)
- [ ] **AC10**: `npm test` passes
- [ ] **AC11**: Behavioral coverage passes (4 PASS / 1 SKIP minimum)
- [ ] **AC12**: Vercel deploy succeeds

## Compliance Gate Status
Hard failures in scope: HF-1 (Repository Purity), HF-2 (UI Consistency)
This plan resolves HF-1 — removal of all non-ProofBridge-Liner assets
This plan resolves HF-2 — single-product UI narrative
This plan does not touch: existing Gate B/C/D/E/F logic, contract bytecode, SafeKrypte HSM

## Affected Files

### Phase 1 — Remove Exclusion Targets (~100 files)
```
DELETE app/pools/page.tsx
DELETE app/studio/page.tsx
DELETE app/safegrid/page.tsx
DELETE app/ekasi/page.tsx
DELETE app/gateway/page.tsx
DELETE app/gateway/layout.tsx
DELETE app/gateway/panels/
DELETE app/agent/lindiwe/page.tsx
DELETE app/ubuntu-games/  (entire tree)
DELETE app/api/gateway/  (entire tree)
DELETE app/api/arena/route.ts
DELETE app/api/whatsapp/handler/route.ts
DELETE app/api/converse/route.ts
DELETE app/api/agent/  (entire tree)
DELETE app/api/ubuntulibrary/route.ts
DELETE app/api/consent/route.ts
DELETE app/api/feed/route.ts
DELETE app/api/contact/route.ts
DELETE app/api/billing/  (entire tree)
DELETE app/api/email/  (entire tree)
DELETE app/api/send-email/route.ts
DELETE app/api/onboarding/  (entire tree)
DELETE app/api/auth/route.ts
DELETE app/api/tools/customer-360/route.ts
DELETE app/api/chronicle-fetch/route.ts
DELETE app/api/github/token/route.ts
DELETE app/api/webhooks/stitch/route.ts
DELETE app/api/webhooks/stripe/route.ts
DELETE app/api/webhooks/slack-interactivity/route.ts
DELETE app/api/schemas/gateway.ts
DELETE whatsapp-bridge/  (entire tree)
DELETE ai-gateway/  (entire tree)
DELETE agent/
DELETE auth/
DELETE demo/
DELETE examples/
DELETE extensions/
DELETE governance/  (duplicate — keep docs/governance/)
DELETE GOVERNANCE/
DELETE research/  (duplicate — keep docs/research/)
DELETE services/
DELETE site/
DELETE archive/
DELETE mcp/
DELETE public/vvv/  (Ubuntu Pools static pages)
```

### Phase 2 — Restructure to Canonical Layout
```
MOVE app/ → apps/web/
MOVE app/api/ → apps/web/app/api/  (keepers only)
MOVE src/ → packages/  (split into trust-kernel, compliance-fabric, safekrypte, compute-fabric)
MOVE contracts/ → contracts/ (already correct)
MOVE infra/ → infrastructure/
MOVE scripts/validation* → validation/scripts/
MOVE test/ → tests/
MOVE docs/ → docs/ (already correct)
CREATE packages/enterprise-control-plane/
CREATE packages/shared/
```

### Phase 3 — Rebuild UI
```
REWRITE apps/web/app/page.tsx  → Single product narrative homepage
CREATE apps/web/app/layouts/   → Root layout with institutional styling
CREATE apps/web/components/sections/Hero.tsx
CREATE apps/web/components/sections/TrustNarrative.tsx
CREATE apps/web/components/sections/TrustPipeline.tsx
CREATE apps/web/components/sections/EnterpriseControlPlane.tsx
CREATE apps/web/components/sections/ValidationEvidence.tsx
CREATE apps/web/components/sections/TechnicalArchitecture.tsx
CREATE apps/web/components/sections/Documentation.tsx
CREATE apps/web/components/sections/FAQ.tsx
CREATE apps/web/components/sections/CTA.tsx
UPDATE apps/web/app/globals.css  → RC1 color palette, typography
```

### Phase 4 — Add GlobeTelemetry + AntLoader
```
CREATE apps/web/components/ui/globe-telemetry.tsx  (headless, props-driven)
CREATE apps/web/components/ui/ant-loader.tsx  (headless, props-driven)
UPDATE apps/web/app/globals.css  → ant-loader keyframes
```

### Phase 5 — Cleanup
```
DELETE dead local branches: fix/agent-ecosystem-architecture, replit-agent,
       integration/rc1-v2, vvu-osc-production-hardening
DELETE dead remote branches: codex/*, cursor/*, draft/*, trae/*, v0/*,
       vercel/*, help, hackathon-submission, lablab.ai-hackathon,
       supabase-client-errors, fix-deployment, debug-failed-deployment
REWRITE README.md  → ProofBridge-Liner only
REWRITE vercel.json → route to apps/web/
UPDATE package.json → point to apps/web/
```

## Test Assertions
| Flow | Expected Outcome |
|------|-----------------|
| `npm run build` (from root or apps/web) | 0 errors, ProofBridge-Liner only pages |
| `npm test` | All 12 tests pass |
| `curl localhost:3000/api/health` | HTTP 200, JSON `{"status":"healthy"}` |
| `curl localhost:3000/api/verify` | HMAC verification working |
| `curl localhost:3000/ubuntu-games` | 404 (route removed) |
| `curl localhost:3000/studio` | 404 (route removed) |
| `curl localhost:3000/ekasi` | 404 (route removed) |
| `git branch -a` | Only canonical branches remain |
| Behavioral coverage | 4 PASS, 1 SKIP minimum |
| Vercel deploy | READY status |

## Branch
`compliance-fabric` (canonical branch for RC1)

## Token Budget Estimate
~25-35 turns — very large working set due to mass deletions and UI rewrite

## Handoff Plan
Write HANDOFF.md with:
- Phase completed (1-5)
- Any files that could not be removed (with reason)
- Next session: run validation gates and deploy

---
## APPROVED BY: _______________ DATE: _______________
