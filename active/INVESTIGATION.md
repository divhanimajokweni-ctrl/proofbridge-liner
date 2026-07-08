# INVESTIGATION — RC1 Repository Purity Freeze — 2026-07-07

## Task
Implement RC1 Directive 001: strip all non-ProofBridge-Liner content from the repository, restructure to canonical mono-repo layout, and rebuild the UI as a single-product institutional narrative with GlobeTelemetry and AntLoader.

## Current State (as-read from filesystem)

### Branch: `compliance-fabric` ✓

### Repository Topology
- 130 root-level entries (including gitignored)
- 23 `app/` page.tsx files (12 are exclusion targets)
- 48 `app/api/` route.ts files (31 are exclusion targets)
- 28 `src/app/` files (3 are exclusion targets)
- 14 `app/components/` files
- 20+ `components/` root-level React components
- 6 local branches, 39 remote branches (most are dead)
- 26 `public/` assets (many are Ubuntu Pools pages)

### Explicit Exclusion Inventory

| Category | Paths | Files Count |
|----------|-------|-------------|
| Ubuntu Studio | `app/studio/page.tsx` | 1 page + deps |
| Ubuntu Games | `app/ubuntu-games/*` | 7 page files + ant-feast components |
| Ubuntu Pools | `app/pools/page.tsx`, `public/vvv/pools-*.html`, `app/api/webhooks/stitch/route.ts` (borderline) | 8+ files |
| Ekasi | `app/ekasi/page.tsx` | 1 page |
| Gateway | `app/gateway/`, `app/api/gateway/*` | 5 files |
| SafeGrid | `app/safegrid/page.tsx` | 1 page |
| Lindiwe Agent UI | `app/agent/lindiwe/page.tsx` | 1 page |
| WhatsApp | `app/api/whatsapp/handler/route.ts`, `whatsapp-bridge/` | 2 files + entire bridge |
| AI Gateway | `ai-gateway/` | Entire directory |
| Billing | `app/api/billing/*`, `app/api/webhooks/stripe/route.ts` | 3 files |
| Email | `app/api/email/*`, `app/api/send-email/route.ts` | 6 files |
| Onboarding | `app/api/onboarding/*`, `app/register/page.tsx` | 3 files |
| Remaining API | `app/api/auth/`, `app/api/arena/`, `app/api/converse/`, `app/api/agent/`, `app/api/contact/`, `app/api/feed/`, `app/api/ubuntulibrary/`, `app/api/consent/`, `app/api/chronicle-fetch/`, `app/api/github/`, `app/api/tools/` | 12 files |
| Root dirs | `whatsapp-bridge/`, `ai-gateway/`, `agent/`, `auth/`, `demo/`, `examples/`, `extensions/`, `governance/` (dupe), `GOVERNANCE/` (dupe), `research/`, `services/`, `site/`, `archive/`, `mcp/`, `logs/` | 15 directories |
| Apps dir | `ai-gateway/` (also under `apps/`), `apps/` may need cleanup | |

### Core Infrastructure (KEEP)

| Category | Paths |
|----------|-------|
| Trust Kernel | `src/lib/kernel/`, `src/lib/security/`, `src/lib/tee/`, `src/lib/watchdog/` |
| Compliance Fabric | `src/lib/contracts/`, `compliance/`, `src/app/api/audit/`, `src/app/api/replay/` |
| SafeKrypte | `circuits/`, `prover/`, `src/lib/tee/` |
| Compute Fabric | `src/engine/`, `src/gateway/` (core router, not product gateway) |
| Enterprise Control Plane | `app/page.tsx` (needs rewrite), `app/dashboard/` (partially) |
| Contracts | `contracts/` (CircuitBreakerV2.sol, GovernanceAnchor.sol, etc.) |
| Health/Metrics | `app/api/health/`, `app/api/metrics/*`, `app/api/operatus/*` |
| Security | `app/api/security/*` |
| Admin | `app/api/admin/*` |
| Webhooks (core) | `src/app/api/webhooks/route.ts` (Gate B) |
| Proof | `app/api/proof/`, `app/api/verify/`, `app/api/mint/` |

### $src/app vs app/ Duality
Two Next.js App Router hierarchies exist: `app/` and `src/app/`. The canonical routes appear to be in `app/` (the production build compiles from `app/`). `src/app/` contains additional routes that overlap (health, webhooks). This duality must be resolved during restructuring.

### UI Current State
- Hero section contains VVU Trust OS branding mixed with Ubuntu Studio references
- Multiple product tiles (Ubuntu Pools, Ubuntu Games, Ekasi, Studio, Gateway)
- Dashboard mixes ProofBridge metrics with Ubuntu Pools content
- No GlobeTelemetry or AntLoader components exist yet
- Current styling uses gradients, glowing effects, card-based layouts

### Verification Gates Status (from prior work)
- `tsc --noEmit`: 0 errors ✓
- `npm test`: 12/12 pass ✓
- `npm run build`: 0 errors, 67 pages ✓
- Behavioral coverage: 4 PASS, 1 SKIP ✓
- Vercel deploy: READY ✓

## Relevant Audit Findings
- HF-1: Repository scope dilution — multiple products in one repo (NEW finding from RC1 Directive)
- HF-2: UI coherence — homepage does not communicate single product narrative (NEW)
- HF-3: Route sprawl — 48 API routes, many serving non-core products

## Hard Failures In Scope
- HF-1 (Repository Purity): Non-ProofBridge-Liner content exists in the repo
- HF-2 (UI Consistency): Homepage and product pages mix unrelated products

## Current Branch
`compliance-fabric` (HEAD: 107f222)

## Required Branch
`compliance-fabric` (this is Tier-3 compliance work)

## Downstream Dependencies
- `src/app/api/webhooks/route.ts` — Gate B webhook handler
- `app/api/metrics/*` — Telemetry pipelines
- `app/api/operatus/*` — Operatus engine
- `contracts/CircuitBreakerV2.sol` — Circuit breaker
- `src/middleware.ts` — Request middleware

## Unknowns Before Planning
1. **Stitch webhook**: Is `app/api/webhooks/stitch/route.ts` core Gate B infrastructure or Ubuntu Pools billing? Current assessment: it's a webhook endpoint that handles Stitch payments — Ubuntu Pools specific → REMOVE.
2. **`src/app/` vs `app/`**: Which is canonical? The build compiles from `app/` (Next.js app router root). `src/app/` appears to be a secondary/legacy hierarchy. KEEP what's unique in `src/app/`.
3. **`supabase/` directory**: Contains migrations. Keep as infrastructure.
4. **`lib/` root directory**: Contains `HmacSecurityGuard.js`, `rate-limiter.ts`, `amd-init.ts` — core shared libraries. KEEP.
5. **`server/`**: Node.js server code — need to check if core or experimental.
6. **`components/` root dir**: Separate from `app/components/` — contains `BillingTierCards.tsx`, `FloatingOverlayWrapper.tsx`, `GovernanceService.ts`. Need to audit.

## Stale Context Risk
- INVESTIGATION.md was written for different task — completely replaced
- README.md references Phase 1-6 work, Ubuntu Pools prominently
- Multiple dead branches (39 remote) increase mental overhead
- `archive/` directory contains old code that shouldn't influence decisions
