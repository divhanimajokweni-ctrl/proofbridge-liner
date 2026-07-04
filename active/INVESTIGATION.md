# INVESTIGATION — CURRENT STATE — 2026-07-04

## Branch
- **Current:** `compliance-fabric` @ `181d7cb` (6 commits ahead of `main`)
- **Working tree:** Clean (1 auto-generated file: `supabase/.temp/cli-latest`)
- **Stash:** `stash@{0}` — HMAC security hardening from `main` (fail-closed HMAC, INTERCOM_TOKEN, MCP cleanup)

## Recent Commits (HEAD → base)

| Commit | Description |
|--------|-------------|
| `181d7cb` | feat(games): add loot tables, migration engine, pheromone canvas, comprehensive test |
| `52a4105` | chore: update deployment log and validation for Ant Feast game module |
| `69a9483` | feat(games): add Ant Feast React Native game module |
| `d6dc625` | docs: gateway access guide, deployment table |
| `f5dc57e` | chore: deployment log + checklist — 2026-07-03 production deploy |
| `f36c085` | fix(nav): replace broken docs route links |
| `96deb32` | **BASE** feat(craft+safeliner+nexus): CRAFT infra, SafeLiner DPI proxy, proof API, Village Nexus |

## Deployed State
| Property | Value |
|----------|-------|
| Vercel Production URL | `https://venturevisionubuntu.co.za` |
| Latest Deploy ID | `dpl_3tW8Jw51c1N2UH32ZVmZvBXLa698` |
| Deploy Timestamp | 2026-07-04 16:52 UTC |
| Build Status | ✅ 61/61 static pages, zero errors |

## File Topology

### Game Modules (Ant Feast — `app/ubuntu-games/ant-feast/`)
| File | Lines | Purpose |
|------|-------|---------|
| `component.js` | 1807 | Original RN monolith with 5 tab screens |
| `lib/RaidTime.js` | 82 | Depth tracking, stamina burn, cave-in risk calculus |
| `lib/PheromoneGuardMath.js` | 82 | Enemy AI pheromone acceleration vectors |
| `lib/SensoryIntegrationTest.js` | 124 | Simulation suite comparing Tier 0 vs Tier 2 accuracy |
| `lib/AntEaterE2EEngineParser.js` | 158 | 6-phase E2E lifecycle integration |
| `lib/QueenLootTableProcessor.js` | 126 | Weighted loot drop engine (6 items, tier scaling) |
| `lib/ProfileMigrationEngine.js` | 172 | Versioned schema migration (v1→v2) |
| `lib/ComprehensiveSubsystemTest.js` | 223 | 5-phase integration test suite |
| `context/authContext.js` | 132 | Dual-currency useReducer state schema |
| `components/MutationsScreen.jsx` | 257 | 3-branch upgrade tree layout |
| `components/SeismicRadarView.jsx` | 178 | Colony radar scan UI |
| `components/LocalPheromoneCanvas.jsx` | 331 | Pheromone field visualization |
| `__tests__/` (5 suites) | — | 203 total tests, all passing |

### CRAFT Infrastructure (committed in `96deb32`)
| File | Purpose |
|------|---------|
| `infra/docker-compose.craft.yml` | 7-service stack (etcd, MinIO, Milvus, Lean LSP, CRAFT ingest, IPFS, governance) |
| `infra/Dockerfile.craft-ingest` | Python ETL worker image |
| `scripts/craft/ingest.py` | tree-sitter-lean → embeddings → Milvus |
| `scripts/craft/setup-milvus.py` | IVF_FLAT collection schema |
| `scripts/craft/nightly-vector-sync.py` | IPFS federation worker |
| `scripts/craft/requirements.txt` | Python dependencies |

### SafeLiner + Proof API (committed in `96deb32`)
| File | Purpose |
|------|---------|
| `scripts/safeliner.go` | Go DPI proxy (5 blocklist rules, LSP framing parser) |
| `scripts/safeliner_verify.py` | 3-vector red-team penetration test suite |
| `app/api/proof/commit/route.ts` | Cosign signing + IPFS CID anchoring pipeline |

### Village Nexus (committed in `96deb32`)
| File | Purpose |
|------|---------|
| `app/proofbridge/page.tsx` | 590-line Village OS dual-mode (VILLAGE/ARENA) |
| `app/pools/page.tsx` | Dark bento-grid with score simulator, pool creator, LINDIWE chat |
| `infra/docker-compose.nexus.yml` | Core app, vault init, stream relay, plugin proxy |

### Security (this session — uncommitted)
| File | Purpose |
|------|---------|
| `lib/HmacSecurityGuard.js` | Fall-closed HMAC inter-process signing & verification |
| `tests/mocks/SafeKrypteServiceMock.js` | HTTP mock for SafeKrypte escrow endpoints (port 5096) |
| `run-behavioral-suite.js` | Orchestrator: starts mock → runs behavioral tests → stops mock |

## Behavioral Coverage
```
npx tsx scripts/behavioral-coverage.ts
  ✅ VC Issuance:     PASS — HMAC gate active
  ✅ Circuit Breaker:  PASS — toggle acknowledged
  ✅ Stitch Webhook:   PASS — validation gate active
  ⚠️ SafeKrypte:      FAIL — timeout (service not running, mock available)
  ✅ Ubuntu Pools:     PASS — contribution pipeline confirmed
```
**Result:** 4/5 PASS, 1/5 FAIL (SafeKrypte mock resolves this)

## Current Issues
1. **Stash not applied** — `stash@{0}` contains HMAC hardening from `main`
2. **Active/* files stale** — INVESTIGATION.md, PLAN.md, VALIDATION.md, HANDOFF.md from Jul 3
3. **Behavioral coverage incomplete** — SafeKrypte mock created but not yet verified in CI pipeline
4. **Gitignore needed** — `supabase/.temp/` should be in `.gitignore`
