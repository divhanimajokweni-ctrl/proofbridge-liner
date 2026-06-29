# Agent Ecosystem Architecture

## Current Map

**What exists and what each part does:**

| Layer | Component | Purpose |
|---|---|---|
| Policy | `AGENTS.md` | Pre-flight file checks, branch/deployment/rollback policy, run command protocol |
| Policy | `scripts/secret-scan-precommit.js` | Blocks commits containing known secret patterns |
| Policy | `scripts/check-secrets.js` | Scans staged files for vendor-specific tokens |
| Policy | `.config/kilo/kilo.jsonc` | Bash allowlist (broad), directory allowlist, read-all policy |
| Capability | `.agents/skills/agent-ecosystem-architect` | Phased architecture mapping, role matrix, MCP wiring, safety gates |
| Capability | `.agents/skills/ultrathink-plan-revving` | Deep planning pressure-test before high-blast-radius edits |
| Capability | `.agents/skills/ubuntu-pools-ux-review` | UX audit for Ubuntu Pools routes/components |
| Capability | `.local/secondary_skills/` (45+) | Operational skills: ai-recruiter, legal-contract, invoice-generator, etc. |
| Capability | `scripts/orchestrate-gates.js` | Gate A–E verification + build runner |
| Capability | `scripts/verify-setup.js` | Pre-flight file/ts/eslint/middleware checks |
| Capability | `scripts/observability.py` | OTel/vendor integrations (runtime-only, excluded from Vercel) |
| Capability | `middleware.ts` | Global Gate D CircuitBreaker check on Polygon Amoy |
| Capability | `app/api/verify/route.ts` | Bayesian + TEE + on-chain CircuitBreaker attestation (requires Bearer `KERNEL_SECRET`) |
| Capability | `app/api/mint/route.ts` | HMAC-verified Stitch webhook minting |
| Capability | `app/api/health|consent|send-email|webhooks/stitch|metrics/gate-*` | Supporting API surfaces |
| Capability | Foundry/Hardhat contracts | `CircuitBreaker.sol/v2`, `BayesianScorer.sol`, `TEEVerifier.sol`, `SafetyKernel.sol`, `AssetRegistry.sol` |
| Workflow | `.github/workflows/ci*.yml` | Build, test, Foundry contracts, npm audit, Vercel deploy |
| Workflow | `.github/workflows/attestation.yml` | Commit attestation gate (`ATTESTATION:` block required) |
| Workflow | `.github/workflows/qodana*.yml` | JetBrains code inspection |
| MCP | `.vscode/mcp.json` | `chrome-devtools` (npx); `daytona-mcp` (Windows-only path, broken on Linux) |
| Stack | Next.js 14 + ethers v6 + Supabase + Resend + three.js + Playwright + Jest | Web/blockchain/render/test framework |

**Government model:** Six-gate operational model (Gate A: infra health, B: replay protection, C: Bayesian safety, D: evidence/CircuitBreaker, E: FROST threshold signer, F: Polygon Amoy settlement).

## Implementation Status

| Component | Status | Notes |
|---|---|---|
| Agent dispatcher (`scripts/agent-dispatcher.mjs`) | ✅ Implemented | Routes intents to Mistral, simulation, parked skills |
| Mistral headless runner (`scripts/mistral-headless-runner.js`) | ✅ Implemented | Requires `MISTRAL_API_KEY` |
| WhatsApp bridge (`whatsapp-bridge/server.js`) | ✅ Implemented | Requires local Chrome; QR printed at startup |
| WhatsApp handler route (`app/api/whatsapp/handler/route.ts`) | ✅ Implemented | Forwards intents to `agent-dispatcher.mjs` |
| Monte Carlo simulation (`artifacts/monte_carlo_simulation.py`) | ✅ Implemented | Python script + npm runner |
| Agent startup script (`scripts/start-agent-ecosystem.sh`) | ✅ Implemented | Starts bridge + Next.js together |
| customer-360 skill | ⏸️ Parked | Intercom token required; stub returns parked notice |
| .gitignore hardening | ✅ Implemented | `.wwebjs_auth/`, `whatsapp-bridge/.env` added |
| .env.example update | ✅ Implemented | `INTERCOM_TOKEN` placeholder added |
| Secret rotation | ❌ Pending | GitHub token, Vercel OIDC, private keys still exposed |
| MCP cleanup | ❌ Pending | `daytona-mcp` Windows path still in `.vscode/mcp.json` |
| Deploy human approval gate | ❌ Pending | Not yet wired into deploy scripts |

## Gaps

1. **Secret exposure remains.** `.config/gh/hosts.yml` tracks a live `ghp_` token; `.env.vercel` contains Vercel agent token + OIDC JWT; `ORACLE_PRIVATE_KEY` and `VERIFIER_PRIVATE_KEY` are hardcoded server-side in `verify/route.ts:82` and `webhooks/stitch/route.ts:58`. Rotation is still pending.
2. **MCP config still contains broken entry.** `daytona-mcp` references a Windows absolute path in `.vscode/mcp.json` and fails on Linux CI.
3. **`.env.production.local` and `.env.vercel` secrets not migrated.** Should move to Vercel dashboard secrets and delete workspace copies.
4. **No MCP server strategy for file/web search.** Only `chrome-devtools` works; no GitHub, filesystem, or search MCP wired into the runtime. Docker is available but unused.
5. **Metrics routes have weak fallback.** `app/api/metrics/gate-a/route.ts` and `gate-c/route.ts` fall back to `'dev-secret'` when env is unset — HMAC bypass risk if config drifts. Should fail-closed.
6. **No worktree strategy.** Only one worktree (root repo) exists despite many remote feature branches.
7. **No explicit human approval gate for deployments.** `vercel --prod --force` is documented in `AGENTS.md` but not enforced by code or `deployment-guardian` runtime check.
8. **Path alias mismatch.** `tsconfig.json` paths `@/*` → `src/*` but many files live in flat `lib/` (excluded from tsconfig). Type/runtime resolution may fail.

## Proposed Agents or Skills

| Role | Status | Trigger | Allowed tools | Forbidden actions | Output | Verification |
|---|---|---|---|---|---|---|
| **llmAgent** | ✅ Implemented | General text tasks, summarisation, audit, plan | `scripts/mistral-headless-runner.js` via `agent-dispatcher.mjs` | Write to files, deploy, mutate state | JSON `{ agent, intent, output, usage }` | Mistral API response contains content; exit 0 |
| **simulationAgent** | ✅ Implemented | "monte carlo", "simulate", "locali" | `artifacts/monte_carlo_simulation.py` | Arbitrary Python execution outside script | CSV `artifacts/simulation_results.csv` + stdout | Script exits 0; CSV written |
| **deployGuardian** | ✅ Implemented | "deploy", "production", "vercel" | `scripts/verify-setup.js`, `scripts/orchestrate-gates.js` | Push/merge, mutate remote env | Multi-line gate summary | All critical files exist; `npm run build` exits 0 |
| **customer360Agent** | ⏸️ Parked | "customer 360", "intercom" | `scripts/customer-360.js` (stub) | None until `INTERCOM_TOKEN` set | Ticket explaining parked status | N/A until Intercom token configured |
| **verify-runner** | 🔜 Next | Before any deploy | `bash` (node, forge, cast, vercel) | Mutate files, on-chain writes | `orchestrate-gates.log` | Gate log contains PASS/FAIL/DEGRADED for all gates A–F |
| **secret-sentinel** | 🔜 Next | `.env*` changes, pre-commit | Read-only glob/grep | Block pushes if secrets detected | Exit 1 + JSON report | Both `secret-scan-precommit.js` and `check-secrets.js` exit 0 |
| **contract-integrity** | 🔜 Next | `contracts/**/*.sol` changes | `bash` (forge build, test, fmt) | Deploy contracts, send txs | Build artifacts + test JSON | `forge build && forge test` pass |
| **gate-analyst** | 🔜 Next | Metrics inspection, monitoring | `bash` (gh api, vercel logs) | Mutate contracts or routes | JSON snapshot with HMAC | Baseline comparison; alert on DEGRADED |
| **ux-compliance-reviewer** | 🔜 Next | `app/proofbridge/`, `app/pools/` changes | Read-only glob/react | Edit React, publish | Markdown review | Reviewed against `ubuntu-pools-ux-review` rubric |

## Tool and MCP Wiring

**Current MCP (fragile):**
- `chrome-devtools` → `npx -y chrome-devtools-mcp@latest --slim --headless` (Node available ✓)
- `daytona-mcp` → Windows absolute path only; **must be removed or guarded for Linux CI**

**Proposed safe MCP additions (Docker available ✓):**
1. **GitHub MCP** (read-only scope): `docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server` — route through a narrow-scoped PAT created in a personal repo context, injected via Vercel env or local `.env.local` (not tracked).
2. **Filesystem / search MCP** (to replace broad shell grep): Use ripgrep-backed MCP scoped to workspace only.
3. **No MCP should be wired until:** (a) credentials are injected via Vercel secret injection, not plaintext workspace files; (b) local Docker daemon is confirmed; (c) `.vscode/mcp.json` is not tracked in git (verify with `git ls-files .vscode/mcp.json`).

**Bash allowlist audit (from `.config/kilo/kilo.jsonc`):**
- Broad wildcards (`node *`, `npm *`, `gh *`, `vercel *`, `forge *`, `cast *`, `rm *`) are allowed.
- No explicit deny list; implicit deny applies to anything not listed.
- **Recommend:** Narrow `vercel *` to `vercel build*`, `vercel inspect*`, `vercel logs*`; remove `vercel alias`, `vercel rm`, `vercel domains` unless explicitly required. Same for `gh *` — scope to `gh api`, `gh pr`, `gh run` and block `gh secret delete`, `gh secret set`.

**Env var policy:**
- All secrets must be injected via Vercel dashboard or local Vercel CLI (`vercel env add`) — never in tracked workspace files.
- Required env vars for production: `KERNEL_SECRET`, `STITCH_WEBHOOK_SECRET`, `ORACLE_PRIVATE_KEY`, `VERIFIER_PRIVATE_KEY`, `CIRCUIT_BREAKER_ADDRESS`, `POLYGON_AMOY_RPC_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.
- In `.env.production.local` (79 lines) and `.env.vercel`: move each key to Vercel secrets; delete workspace copies after migration.

## Safety Gates

| Gate | Where | Condition | Action if triggered |
|---|---|---|---|
| **Human approval for deploy** | Before any `vercel --prod --force` | `deploy-readiness.json` produced by `deployment-guardian` agent; user reviews and types `approve deploy` | Proceed to deployment |
| **Commit attestation** | `.github/workflows/attestation.yml` on every push/PR | `ATTESTATION:` block in commit message with valid `review_token: sha256:<8hex>` matching `REVIEW_TOKEN` secret | CI fails; no merge |
| **CircuitBreaker (Gate D)** | `middleware.ts` + `verify/route.ts:69-77` | `circuitOpen()` returns false on-chain | Return HTTP 423; halt attestation; alert via observability |
| **Bayesian trip** | `verify/route.ts:110-119` | Posterior `< threshold` | Return HTTP 423; no attestation issued |
| **HMAC rejection** | `mint/route.ts:46-52`, metrics routes | Timing-safe HMAC mismatch | Return HTTP 401; reject mint/replay |
| **Pre-flight file check** | `verify-setup.js` + CI | Missing `app/api/verify/route.ts`, `app/api/mint/route.ts`, `middleware.ts`, `AGENTS.md` | Block build and deploy |
| **Rate limit** | `verify/route.ts:8-19` | `> 30 req/min/IP` | Return HTTP 429 |

**Explicit human approval required before:**
- Any `vercel --prod --force` deployment
- Any contract write function call (`updateProof`, `circuitBreaker.open/close`)
- Deleting or rotating `ORACLE_PRIVATE_KEY`, `VERIFIER_PRIVATE_KEY`, `KERNEL_SECRET`
- Pushing to `compliance-fabric` or `main`

## Verification

**Build and test:**
- `npm run build` — must exit 0 before deploy (Next.js 14 + TypeScript strict + ESLint)
- `npm run typecheck` (`tsc --noEmit`) — must exit 0
- `jest` — unit tests for API routes and lib utilities
- `playwright test` — e2e smoke for `/api/health` and critical flows
- `forge build && forge test` — Solidity contract compilation and tests

**Pre-flight:**
- `node scripts/verify-setup.js` — checks critical files, middleware export, tsconfig, eslint config, deps
- `node scripts/orchestrate-gates.js` — runs Gate A–F checks; writes structured log

**On-chain verification (Gate D/E/F):**
- `CircuitBreaker.circuitOpen()` read via ethers JsonRpcProvider in middleware before every request
- Circuit state is the single source of truth; middleware fails open on RPC error (prevents self-inflicted outage, documented tradeoff)

**Attestation (commit attestation.yml in CI):**
- Every push/PR must include `ATTESTATION:` block in commit message with `branch_verified:`, `pre_flight: PASSED`, `session_owner:`, `review_token: sha256:<8hex>` matching repo `REVIEW_TOKEN` secret
- Confirm integrity with `git log --format="%s" -n 20` after commit

**Observability:**
- `scripts/observability.py` configures OTel exporters to Langfuse, Phoenix, MLflow, PromptLayer
- Runtime-only file; excluded from Vercel build via `.vercelignore`
- Gate metrics consumed by `gate-analyst` role via read-only `gh api` / `vercel logs`

## Next Actions

1. **Rotate exposed credentials.** Rotate GitHub token in `.config/gh/hosts.yml`; move `TFC_AGENT_TOKEN_2` and `VERCEL_OIDC_TOKEN` from `.env.vercel` to Vercel dashboard secrets. Add `.config/gh/` and `.env.vercel` to `.gitignore`.
2. **Migrate `.env.vercel` and `.env.production.local` secrets to Vercel dashboard.** Delete workspace copies after migration.
3. **Fix metrics route fallback.** Change `process.env.STITCH_WEBHOOK_SECRET || 'dev-secret'` in `app/api/metrics/gate-a/route.ts` and `gate-c/route.ts` to fail-closed (return HTTP 500) if env is unset.
4. **Remove broken `daytona-mcp` from `.vscode/mcp.json`.** Windows-only path causes noise on Linux CI.
5. **Add worktree strategy.** When working on `compliance-fabric`, use `git worktree add ../proofbridge-compliance compliance-fabric` to isolate contract merges.
6. **Migrate `ORACLE_PRIVATE_KEY` and `VERIFIER_PRIVATE_KEY` to HSM/SafeKrypte TEE** (per AGENTS.md roadmap). Until then, require dual human approval for any manual key rotation.
7. **Add handoff protocol.** Define a `HANDOFF.md` template: `context`, `state`, `next steps`, `risk flags`, `secrets (redacted)`. Require it at the end of any multi-turn agent task.
8. **Verify path alias resolution.** Audit `lib/` files importing from `@/`; either move files under `src/` or add `lib/` to `tsconfig.json` include array.
9. **One-shot integration check.** Run `npm run typecheck && npm run lint && node scripts/verify-setup.js && node scripts/orchestrate-gates.js` and confirm all gates pass before next deployment.
10. **Connect WhatsApp bridge locally.** Run `scripts/start-agent-ecosystem.sh` on a machine with Chrome/Chromium installed; scan the printed QR code with WhatsApp → Linked Devices. Bridge forwards intents to `agent-dispatcher.mjs`.
