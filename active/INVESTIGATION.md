# INVESTIGATION — CURRENT STATE — 2026-07-03

## Task
Review last session's execution and continue implementation. Reconcile planned work (ProofBridge-Liner bento-grid + CRAFT infra + Ubuntu Pools dark theme) with actual committed state (Village Nexus + CRAFT infra + Pools bento-grid).

---

## Current Codebase State

### Branch
- **Current:** `main` (merged from `compliance-fabric`)
- **Required for Tier-3:** `compliance-fabric`
- **Status:** Working tree has uncommitted modifications and untracked files

### Committed Changes (HEAD: `c671533`)

| File | Status | Description |
|------|--------|-------------|
| `app/proofbridge/page.tsx` | ✅ COMMITTED | Village Nexus — 590-line page with Dock/Feed/Social/Treasury panels + Arena mode (editor, graph, output). Not the planned bento-grid with Monaco/Sprinto/Tactic Explorer — reimagined as Village OS with ConfidencePip gutter indicators. Builds. |
| `app/pools/page.tsx` | ✅ COMMITTED | Dark bento-grid with 5-panel layout (Queue, Score, Creator, Architecture, LINDIWE chat). Matches plan. |
| `app/ubuntu-games/` routes | ✅ COMMITTED | New routes added by the Village OS commit |
| `src/components/ArenaTicker`, `GameHUD`, `VillageFeed`, `TreasuryPanel`, `SocialMesh` | ✅ COMMITTED | Village OS components |
| `src/engine/NexusIntegrator` | ✅ COMMITTED | Feed/nexus integration engine |

### Uncommitted Changes (Working Tree)

**Modified files:**
| File | Change |
|------|--------|
| `app/pools/page.tsx` | Further CSS refinements (559 lines, additional variant of bento-grid) |
| `README.md` | Major expansion — production hardening documentation |
| `openclaw.json` | Added `device-pair` plugin with `publicUrl` |
| `active/INVESTIGATION.md` | Outdated — references old state |
| `active/PLAN.md` | Outdated — proofbridge implementation diverged |
| `active/VALIDATION.md` | **Inaccurate** — describes features not present in committed code |
| `active/HANDOFF.md` | Stale handoff |
| `.replit` | Configuration update |
| `supabase/.temp/cli-latest` | Temp file update |

**Deleted files (staged):**
| File | Notes |
|------|-------|
| `app/docs/api-reference/page.tsx` | Removed |
| `app/docs/architecture/page.tsx` | Removed |
| `app/docs/compliance/fscajs2/page.tsx` | Removed |
| `app/docs/cryptography/page.tsx` | Removed |

**New (untracked) files:**
| File | Description |
|------|-------------|
| `infra/docker-compose.craft.yml` | 7-service CRAFT stack (etcd, MinIO, Milvus, Lean LSP, CRAFT ingest, IPFS pool, Lindiwe governance) |
| `infra/Dockerfile.craft-ingest` | Python ETL worker for tree-sitter-lean parsing + embedding |
| `infra/docker-compose.nexus.yml` | Village Nexus Docker Compose (core + vault + stream + proxy) |
| `scripts/craft/ingest.py` | 319-line Python pipeline: parse → embed → Milvus upsert |
| `scripts/craft/setup-milvus.py` | 120-line Milvus collection schema setup |
| `scripts/craft/nightly-vector-sync.py` | 376-line IPFS federation worker |
| `scripts/craft/requirements.txt` | Python dependencies |
| `scripts/safeliner.go` | 305-line Go LSP DPI proxy (CircuitBreaker for Lean 4) |
| `scripts/safeliner_verify.py` | 274-line Python red-team penetration test suite |
| `app/api/proof/commit/route.ts` | 128-line API route for proof signing pipeline |
| `openclaw-qr.png` | Device-pair QR code |

### Stash (stash@{0})
- Security hardening: HMAC secret moved inside route handlers (fail-closed)
- `.env.example` — INTERCOM_TOKEN added
- `.replit` — port 3456 added
- `.vscode/mcp.json` — daytona-mcp removed

---

## Build Verification

```
npm run build → ✅ PASS (zero errors)
```

All routes compile successfully including the new Village Nexus and existing CRAFT infrastructure.

## Behavioral Coverage

```
npx tsx scripts/behavioral-coverage.ts
  ✅ VC Issuance: PASS — HMAC gate active
  ✅ Circuit Breaker: PASS — toggle acknowledged
  ✅ Stitch Webhook HMAC: PASS — validation gate active
  ❌ SafeKrypte Key Escrow: FAIL — timeout (service not running on :5096)
  ✅ Ubuntu Pools Contribution: PASS — contribution pipeline confirmed
```

**Result:** 4/5 PASS, 1/5 FAIL (expected — SafeKrypte service not running in dev)

---

## Discrepancies Between Plan and Reality

| PLAN.md Specification | Actual Implementation | Gap |
|-----------------------|----------------------|-----|
| `app/proofbridge/page.tsx` — bento-grid 4-panel (Monaco editor + ConfidencePip + Tactic State Explorer + Sprinto log + AI Case Management) | Village Nexus — Dock/Feed/Social/Treasury + Arena mode (Editor with gutter + Graph + Output log) | Materially different UI. Functionally equivalent (editor with gutter indicators, output log, grid layout) but different design paradigm (Village OS vs. professional compliance tool) |
| `app/pools/page.tsx` — dark bento-grid | Dark bento-grid with same features ✅ | No gap |
| CRAFT infrastructure files | All created but uncommitted | Need to commit |
| Branch: `compliance-fabric` | Currently on `main` | Needs branch switch |

---

## Stale Context Risk
- INVESTIGATION.md, PLAN.md, VALIDATION.md, HANDOFF.md all need updating to reflect current reality
- HEAD commit c671533 changed the proofbridge page implementation
- Working tree has 11+ untracked files that were part of the implementation scope

## Required Branch
`compliance-fabric` (Tier-3 default). Current: `main` — needs switch.
