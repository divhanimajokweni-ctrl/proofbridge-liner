# INVESTIGATION — CI/CD Fix + GCP Integration Review — 2026-07-14

## Task
Pull origin main, fix CI/CD pipeline bottlenecks (npm→pnpm), review the GCP infrastructure briefing against VVU specs, and generate an execution plan.

## Current State

### Git State
- **Branch:** `main` (up to date with `origin/main`)
- **Uncommitted changes:** 19 modified files + 6 untracked files
- **Key modifications already staged locally (NOT pushed):**
  - All 6 workflow files patched: npm→pnpm with Corepack
  - README.md updated with session log
  - DEPLOY_LOG.md updated
  - Various scripts modified/created

### CI/CD Pipeline — Root Cause Confirmed
| Workflow | Original State | Local Fix Applied | Pushed? |
|----------|---------------|-------------------|---------|
| `ci-cd.yml` | `npm install` | `pnpm install --frozen-lockfile` | NO |
| `ci.yml` | `npm install` | `pnpm install --frozen-lockfile` | NO |
| `deploy-vercel.yml` | `npm install` | `pnpm install --frozen-lockfile` | NO |
| `deployment-loop.yml` | `npm ci` | `pnpm install --frozen-lockfile` | NO |
| `validation-gate.yml` | `npm ci` | `pnpm install --frozen-lockfile` | NO |
| `vercel-production.yml` | `npm ci` | `pnpm install --frozen-lockfile` | NO |

**Additional fixes applied locally:**
- `cache: 'npm'` → `cache: 'pnpm'` in all workflows
- Corepack enable step added before every `pnpm install`
- `npm run build` → `pnpm run build` etc.
- `npx jest` → `pnpm exec jest`
- Foundry toolchain setup added to `ci-cd.yml` contract-tests job

### GCP Integration Status (Current)
| Component | Status | Evidence |
|-----------|--------|----------|
| GCP MCP Server | Referenced but MISSING | `openclaw.json` line 92-95 references `mcp/gcp-server.js` which does not exist |
| BigQuery | NOT CONFIGURED | No datasets, no jobs, no API enabled |
| Vertex AI | NOT CONFIGURED | No endpoints, no models deployed |
| GKE | NOT CONFIGURED | No clusters, no node pools |
| Terraform | EXISTS but unrelated | `scripts/main.tf` is for GitHub/Replit secret sync, not GCP |
| `gcloud` CLI | UNKNOWN | Not verified in this session |

### GCP Briefing Review (vs VVU Specs)

The briefing proposes:
1. **Multi-Model Orchestration** (Vertex AI Reasoning Engine) — NOT in VVU specs
2. **Open-Weight Models on GKE** (GLM-5.2, Gemma 2) — NOT in VVU specs
3. **BigQuery Data Agent** — NOT in VVU specs
4. **NATS JetStream → BigQuery pipeline** — VVU uses NATS but no BigQuery sink exists

**Critical Gap:** The briefing assumes GCP infrastructure that does not exist in this repo. The MCP server files referenced in `openclaw.json` are missing. No gcloud authentication is configured. No BigQuery datasets are created.

### Relevant Audit Findings
- HF-1 (Repository Purity): CI/CD must work before any new infrastructure
- HF-3 (Circuit Breaker): Behavioral coverage must pass before deployment

### Hard Failures In Scope
- CI/CD pipeline is broken (100% failure rate on 2,058 runs)
- GCP integrations are phantom (referenced but not implemented)

## Required Branch
`main` for CI/CD fix (Tier-2). GCP integration would be `compliance-fabric` (Tier-3).

## Downstream Dependencies
- All CI/CD workflows depend on the npm→pnpm fix
- Vercel deployment depends on CI passing
- GCP briefing implementation depends on GCP APIs being enabled and authenticated

## Unknowns Before Planning
1. Is `gcloud` CLI installed and authenticated on this machine?
2. Which GCP project should be used? (Briefing mentions `project-cc455a72-1490-4cdf-b0e`)
3. Should GCP integration be implemented now or deferred?
4. Is the GKE cluster cost justified at this stage (Phase 1)?

## Stale Context Risk
- The README claims "Phase 1 complete" but CI/CD is broken — this is a credibility gap
- The briefing's GCP setup assumes infrastructure that doesn't exist
