# Agent Ecosystem Architecture

## Current Map

### Agents
- **Kilo SDD Pipeline**: 7 agents (`orchestrator`, `investigator`, `planner`, `mino-reviewer`, `implementer`, `validator`, `headless`) defined in `.kilo/agent/*.md`. Operate in code-generation domain only.
- **OpenClaw Chat Layer**: 4 agents (`main`, `orchestrator`, `lindiwe`, `headless`) defined in `openclaw.json`. Operate in WhatsApp/Slack/Google Chat domain only.
- **Legacy Kilocode**: 4 agents (`immortal-engine`, `vvu-backend`, `vvu-frontend`, `vvu-review`) in `.kilocode/agents/*.json`. Legacy configuration, partially superseded by `.kilo/`.

### Skills
- 24 skills in `.agents/skills/` covering SDD, compliance, architecture, UI/UX, Supabase, browser automation, AI inference, document processing, and more.
- Key operational skills: `vvu-sdd`, `vvu-compliance-gate`, `vvu-architecture`, `execute-end-to-end`, `ultrathink-plan-revving`.

### MCP Servers
- **Kilo**: `vvu`, `firecrawl` (in `kilo.json`)
- **Kilo Extended**: `openclaw-gateway`, `safekrypte-lite`, `safeline-lite`, `vvu-operatus`, `firecrawl` (in `.kilo/kilo.jsonc`)
- **OpenClaw**: `gcp`, `terraform`, `fetch`, `workspace` (in `openclaw.json`)
- **Standalone**: `vvu-mcp-server/index.js` (16 tools, stdio transport)

### Tools & Capabilities
- **Code/Database**: drizzle-orm, Next.js 14, React 18, Supabase, Zod, ethers, three.js
- **Infrastructure**: Vercel deploy, Docker Compose, droplet scripts, forge (ZK circuits)
- **Compliance**: SafeKrypte (ED25519), SafeLiner (credentials), CircuitBreaker (Gate D), GovernanceAnchor (Gate F)
- **AI**: Anthropic, Mistral, Fireworks, OpenAI, NVIDIA NIM, Fireworks AI/Gemma
- **Communication**: WhatsApp (Baileys), Slack, Google Chat, Resend (email)

### Deployment
- **Primary**: Vercel production (`venturevisionubuntu.co.za`) on `compliance-fabric` branch
- **Lock**: 13-phase pre-push hook (`scripts/deployment-loop.sh`) enforces typecheck, lint, tests, build, behavioral coverage, Vercel build, DNS, health check
- **Secondary**: Docker Compose (nexus, craft, ROCm), droplet

### Secrets
- Managed via `.env*` files (gitignored where appropriate)
- Pre-commit secret scan via `scripts/secret-scan-precommit.js`
- Vercel pulls env via `.env.vercel.pulled`
- No tokens in remote URLs; SSH/gh auth required

---

## Gaps

| Gap | Severity | Evidence |
|-----|----------|----------|
| **Dual ecosystem drift** | High | Kilo agents and OpenClaw agents both claim `orchestrator`/`lindiwe`/`headless` identities with different scopes; risk of cross-boundary tool calls |
| **Legacy `.kilocode/` config** | Medium | 4 agents with outdated models (`gpt-4-turbo`, `claude-3-5-sonnet-20241022`) and duplicate `.kilo/` config; unclear which is authoritative |
| **No durable event store** | Critical | `InMemoryEventStore` in `src/lib/trust-runtime/event-store.ts` loses all state on restart; no multi-tenancy, no OCC, no governance hashes |
| **No outbox worker** | High | Events produced by runtime have no guaranteed delivery mechanism to SSE/WebSocket consumers |
| **Missing MCP server files** | Medium | `openclaw.json` references `/home/runner/workspace/mcp/{gcp,fetch,workspace}-server.js` but `mcp/` directory does not exist |
| **Property-based tests absent** | Medium | Only deterministic unit tests exist for event store; no concurrent append, hash chain, or tenant isolation tests |
| **Hard failures unresolved** | Critical | 5 hard failures (HF-1 through HF-5) block ProofBridge mainnet merge |
| **No clear skill routing** | Low | 24 skills loaded globally; no explicit routing rules for when each activates |

---

## Proposed Agents or Skills

| Agent/Skill | Purpose | Trigger | Allowed Tools | Forbidden |
|-------------|---------|---------|---------------|-----------|
| **orchestrator** (Kilo) | SDD pipeline lead; code-generation orchestration | `/orchestrate`, Tier-2/3 tasks | bash/edit/read/glob/grep within policy | OpenClaw chat tools; writing outside `src/`, `server/`, `scripts/`, `.kilo/` without ask |
| **investigator** (Kilo) | Facts-only codebase investigation | `/investigate`, Tier-2/3 tasks | read/glob/grep | Any write except `active/INVESTIGATION.md` |
| **planner** (Kilo) | PLAN.md generation with SDD trace chain | `/plan`, after INVESTIGATION.md exists | read/glob/grep | Any write except `active/PLAN.md` |
| **mino-reviewer** (Kilo) | Human-in-the-loop plan approval | `/review`, `PLAN.md` status=PENDING_APPROVAL | read `active/*.md`; edit `active/PLAN.md` only | bash; all other edits |
| **implementer** (Kilo) | Execute approved PLAN.md exactly | `/implement`, after APPROVED | edit `src/**`, `server/**`, `scripts/**`, `app/**`, `test/**`, `contracts/**` | `active/*.md`; scope expansion |
| **validator** (Kilo) | Behavioral QA + compliance gate | `/validate`, after implementation | bash/read/glob/grep; write `active/VALIDATION.md` | Any other write |
| **lindiwe** (Kilo) | WhatsApp intelligence layer | Read-only; triggered by OpenClaw routing | read `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `active/*.md`, `docs/**/*.md` | ALL writes; code/deploy; Kilo edit/write/task |
| **headless** (Kilo) | CI/CD autonomous runner | `--headless` flag | All bash/edit/read | Interactive prompts |
| **orchestrator** (OpenClaw) | Channel event router | OpenClaw gateway events | OpenClaw MCP tools (`gcloud_exec`, `fetch_url`, etc.) | Kilo edit/write/task; code generation |
| **lindiwe** (OpenClaw) | WhatsApp persona | WhatsApp/Slack/Google Chat messages | OpenClaw channel reply tools | Kilo edit/write/task; code generation |
| **headless** (OpenClaw) | Batch channel tasks | Non-interactive channel jobs | OpenClaw MCP tools | Interactive prompts |
| **runtime-engineer** (proposed) | Trust Runtime durability | `/implement` for event-store plan | edit `lib/db/**`, `src/lib/trust-runtime/**`, `src/runtime/**` | `contracts/**`, `app/**` |
| **compliance-guardian** (proposed) | Hard-failure remediation | `/validate` + HF-1..HF-5 gates | read/glob/grep; write `active/COMPLIANCE.md` | Code changes; deploy |

---

## Tool and MCP Wiring

### MCP Server Topology

```
Kilo Domain (Code Generation)
├── vvu (local) → vvu-mcp-server/index.js (16 tools)
├── firecrawl (local) → firecrawl-mcp@latest
└── [proposed] postgres (local) → drizzle-orm via lib/db/src/index.ts

OpenClaw Domain (Chat Channels)
├── gcp (local) → mcp/gcp-server.js
├── terraform (local) → mcp/gcp-server.js (TERRAFORM_MODE=1)
├── fetch (local) → mcp/fetch-server.js
└── workspace (local) → mcp/workspace-server.js

Shared Runtime Servers (HTTP, not MCP)
├── VVU Operatus :4096 → server/vvu-operatus-server.ts
├── SafeKrypte Lite :5096 → server/safekrypte-lite.ts
└── SafeLiner Lite :5097 → server/safeline-lite.ts
```

### Cross-Domain Routing Rules
1. **Kilo → OpenClaw**: Forbidden. Kilo agents must not call `send_message`/`reply`.
2. **OpenClaw → Kilo**: Forbidden. OpenClaw agents must not call `edit`/`write`/`task` with code-writing agents.
3. **Shared files**: `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `openclaw.json` readable by both; writable only by Kilo agents (except `openclaw.json` agent definitions, managed by OpenClaw deploy).
4. **Shared runtime**: Operatus/SafeKrypte/SafeLiner HTTP servers are shared infrastructure; both domains may call them.

### Missing MCP Dependencies
- `mcp/gcp-server.js`, `mcp/fetch-server.js`, `mcp/workspace-server.js` are referenced in `openclaw.json` but do not exist in the workspace. Must be restored from `divhanimajokweni-ctrl/vvu-ecosystem` sidecar repo or reimplemented.

---

## Safety Gates

| Gate | Trigger | Condition | Action |
|------|---------|-----------|--------|
| **Mino Reviewer** | `active/PLAN.md` status=PENDING_APPROVAL | Interactive mode | Pause; require human APPROVED signature |
| **Headless Override** | `--headless` flag | CI/CD | Auto-approve PLAN.md; no pause |
| **Pre-Push Lock** | `git push` to `main` or `compliance-fabric` | 13-phase pipeline | Block push if any gate fails |
| **Typecheck Gate** | Phase 2 of deployment loop | `tsc --noEmit` | Hard fail on any type error |
| **Lint Gate** | Phase 3 | `npm run lint` | Hard fail on any error |
| **Test Gate** | Phase 4 | `npm test` | Hard fail on any failure |
| **Build Gate** | Phase 5 | `npm run build` | Hard fail on build error |
| **Behavioral Coverage** | Phase 6 | `npx tsx scripts/behavioral-coverage.ts` | Hard fail if any flow FAILs |
| **Vercel Build Gate** | Phase 7 | `vercel deploy --prod --force` | Block push if Vercel build fails |
| **Health Check** | Phase 10 | `curl /api/health` | Hard fail if non-200 |
| **Secrets Scan** | Phase 10 + pre-commit | `scripts/secret-scan-precommit.js` | Hard fail on secret exposure |
| **Branch Gate** | All phases | Target branch must be `compliance-fabric` or feature branch | Block if pushing to `main` directly |

---

## Verification

### Build & Test
- `npm run typecheck` → zero errors
- `npm run lint` → zero errors
- `npm test` → all passing
- `npm run build` → succeeds, 25 pages
- `npx tsx scripts/behavioral-coverage.ts` → 3 PASS, 2 SKIP (no FAIL)

### Compliance Artifacts
- `active/INVESTIGATION.md` — current facts snapshot
- `active/PLAN.md` — Mino-approved spec with SDD trace chain
- `active/VALIDATION.md` — PASS/BLOCK output before PR
- `active/HANDOFF.md` — session context preservation

### Runtime Verification
- `/api/health` → `{"status":"healthy"}` (HTTP 200)
- Gate A–F status via `/api/admin/gates`
- Circuit breaker trip via `/api/admin/circuit-breaker`
- SafeKrypte health via `:5096/health`
- SafeLiner health via `:5097/health`

### Deployment Verification
- DNS: `venturevisionubuntu.co.za` resolves
- Vercel: `vercel deploy --prod --force` completes with Ready status
- Logs: `DEPLOY_LOG.md` updated
- Docs: `DEPLOYMENT_CHECKLIST.md` regenerated

---

## Next Actions

### Immediate (Current Session)
1. **Complete Durable Event Store implementation** per `active/PLAN.md`:
   - `lib/db/src/schema/trust-runtime.ts`
   - `lib/db/src/repositories/event-store.repository.ts`
   - `src/lib/trust-runtime/types.ts` governance fields
   - `src/lib/trust-runtime/command-handler.ts` OCC retry
   - `src/runtime/outbox-worker.ts`
   - `tests/property/event-store.property.test.ts`

### Short-Term (This Week)
2. **Restore missing MCP servers**: Reimplement or restore `mcp/gcp-server.js`, `mcp/fetch-server.js`, `mcp/workspace-server.js` from sidecar repo.
3. **Consolidate `.kilo/` and `.kilocode/`**: Remove legacy `.kilocode/` or migrate its agents to `.kilo/agent/*.md` format.
4. **Resolve 5 hard failures**:
   - HF-1: Enable TEE hardware attestation (AMD SEV-SNP / Intel SGX)
   - HF-2: Integrate ZK proof verification on-chain
   - HF-3: Deploy `GovernanceAnchor.sol` and set address
   - HF-4: Fix HMAC domain collision in webhook validation
   - HF-5: Increase Beta-Binomial sample size to n≥200

### Medium-Term (This Month)
5. **Property-based test suite**: Expand `tests/property/` with tenant isolation, snapshot corruption, outbox recovery, and concurrent stream tests.
6. **Formal verification**: Introduce TLA+ or Alloy models for OCC correctness and state machine invariants.
7. **Observability integration**: Connect Trust Runtime metrics to OpenTelemetry (`scripts/observability.py`).
8. **Chaos engineering**: Add network partition, crash recovery, and PITR tests for event store.

### Long-Term (This Quarter)
9. **KMS/HSM integration**: Move envelope encryption keys from software to HSM-backed KMS.
10. **Projection versioning**: Support schema evolution in event store with versioned reducers.
11. **Multi-region deployment**: Extend Vercel + Supabase to multi-region with read replicas.
12. **Agent marketplace**: Publish VVU-specific skills to `.agents/skills/` for reuse across projects.
