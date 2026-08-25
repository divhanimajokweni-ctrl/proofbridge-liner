# VVU · Branch Inventory & Archive Plan

**Date:** 2026-08-25
**Repo:** `divhanimajokweni-ctrl/proofbridge-liner`
**Total branches:** 27 (excluding my `feat/vres1-clean-2026-08-25`)
**Purpose:** Document every branch before any archival or deletion. No deletion happens until you review this and confirm.

---

## Summary Table

| # | Branch | Last commit | Date | Files | Status | Recommendation |
|---|---|---|---|---|---|---|
| 1 | `main` | `83dd0d3` | 2026-08-22 | 2129 | **PRODUCTION** | KEEP — production default branch |
| 2 | `feat/vres1-clean-2026-08-25` | `6b6056d` | 2026-08-25 | 138 | **NEW** (this branch) | KEEP — my VRES1 IVE dashboard |
| 3 | `feat/studi-curiosity-first-challenge-mode` | `b27a469` | 2026-08-22 | 234 | Merged into main | ARCHIVE then delete |
| 4 | `feat/constitution-v1-governance` | `b33be72` | 2026-07-18 | 1129 | Feature work | ARCHIVE — governance code |
| 5 | `feat/hbk-mk-ii-digital-twin` | `d3ff3b6` | 2026-07-28 | 1136 | Feature work | ARCHIVE — HBK digital twin |
| 6 | `feat/founding100-campaign` | `b2f57fc` | 2026-07-29 | 759 | Feature work | ARCHIVE — Founding 100 |
| 7 | `feat/founding100-clean` | `300c2e8` | 2026-07-29 | 1142 | Feature work (clean variant) | ARCHIVE — Founding 100 clean |
| 8 | `feat/taas-v2` | `b958f6f` | 2026-07-29 | 1142 | Feature work | ARCHIVE — TaaS commercial |
| 9 | `feat/vres-v1.2-clean` | `85e54f9` | 2026-08-16 | 81 | Prior VRES work | ARCHIVE — prior VRES attempt |
| 10 | `feat/vvu-consolidation-2026-08-18` | `b04d746` | 2026-08-18 | 230 | Consolidation | ARCHIVE |
| 11 | `feat/vvu-sandbox-snapshot-2026-08-18` | `171bdea` | 2026-08-18 | 223 | Sandbox snapshot | ARCHIVE |
| 12 | `feature/core-api-routes-arweave` | `dc474c4` | 2026-08-14 | 1908 | Feature work | ARCHIVE — Arweave routes |
| 13 | `feature/vvu-val-001` | `3b43057` | 2026-08-06 | 2544 | Compliance fabric | ARCHIVE — VVU-VAL-001 |
| 14 | `release/beta-v1.0-real` | `f095635` | 2026-08-18 | 15 | Release tag candidate | ARCHIVE — beta release |
| 15 | `reliability-layer-2026-08-09` | `5d09bc5` | 2026-08-09 | 2172 | Reliability work | ARCHIVE |
| 16 | `task/user-isolated-production-ive` | `49fd361` | 2026-08-09 | 2174 | Production IVE scope | ARCHIVE |
| 17 | `v0/deployment-troubleshooting-b77402da` | `0c22b81` | 2026-08-09 | 2169 | Troubleshooting | ARCHIVE — 404 fix |
| 18 | `v0/divhanimajokweni-1651-5cec4ac8` | `a8c24c4` | 2026-08-16 | 1908 | Auth fix | ARCHIVE — auth routing |
| 19 | `vibe/vvu-trust-chain-v31-c7593b` | `91f1321` | 2026-07-14 | 1012 | Trust chain v31 | ARCHIVE |
| 20 | `gh-pages` | `2aa5075` | 2026-08-22 | 6 | GitHub Pages deploy | ARCHIVE then delete |
| 21 | `amd-rocm-validation` | `858c9fb` | 2026-08-05 | 1840 | ROCm benchmark | ARCHIVE — 4.249x speedup result |
| 22 | `mi300x-rocm-run-20260804` | `d54479d` | 2026-08-05 | 1840 | ROCm MI300X run | ARCHIVE — hardware run |
| 23 | `results/rocm-run-20260804-185101` | `4b09510` | 2026-08-04 | 1840 | ROCm results | ARCHIVE — 1.685x speedup |
| 24 | `results/rocm-run-20260804-232342` | `f0c78be` | 2026-08-04 | 1840 | ROCm results | ARCHIVE |
| 25 | `zoo-submission` | `923aa62` | 2026-08-06 | 2168 | Zoo submission | ARCHIVE — CVE fix |
| 26 | `zoo.dev-amd-ai-dev-submission` | `e65f03d` | 2026-08-06 | 2168 | Zoo AMD submission | ARCHIVE — CVE fix |
| 27 | `dependabot/npm_and_yarn/vvu-mcp-server/fast-uri-3.1.5` | `ee8551a` | 2026-08-01 | 1803 | Dependabot PR | DELETE — merged or stale |
| 28 | `dependabot/npm_and_yarn/vvu-mcp-server/hono-4.13.1` | `c9e4dc4` | 2026-08-09 | 2168 | Dependabot PR | DELETE — merged or stale |
| 29 | `dependabot/npm_and_yarn/vvu-mcp-server/multi-a733d7aecf` | `4ea0fd9` | 2026-08-06 | 2168 | Dependabot PR | DELETE — merged or stale |

---

## Branches by Category

### A. KEEP (2 branches)

- **`main`** — production default branch, 2129 files, last merge 2026-08-22 (Studi Curiosity Mode). Do not delete.
- **`feat/vres1-clean-2026-08-25`** — my VRES1 IVE dashboard (this branch). 138 files. Will become the sole surviving branch per your plan, OR merge into main first.

### B. ARCHIVE then delete (18 branches — real work, preserve history)

These branches contain real feature work, benchmarks, and release candidates. I recommend archiving each as a git bundle BEFORE deletion, so the history is recoverable if you ever need it.

**Feature branches (10):**
- `feat/constitution-v1-governance` — governance PR gate + ADR authority mappings
- `feat/hbk-mk-ii-digital-twin` — HBK digital twin, founding partners, CAD architecture
- `feat/founding100-campaign` — Founding 100 Campaign Framework + VVU-VAL-001
- `feat/founding100-clean` — clean variant of Founding 100
- `feat/taas-v2` — TaaS Commercial Framework + CAD renders + PDF specs
- `feat/vres-v1.2-clean` — prior VRES attempt (scrubbed TFC_AGENT_TOKEN)
- `feat/vvu-consolidation-2026-08-18` — consolidated state, Green-Light Gate RED
- `feat/vvu-sandbox-snapshot-2026-08-18` — sandbox snapshot
- `feat/studi-curiosity-first-challenge-mode` — already merged into main (safe to delete)
- `feature/core-api-routes-arweave` — dual-auth system + Arweave routes
- `feature/vvu-val-001` — compliance fabric, 2544 files (largest branch)

**Release + reliability (3):**
- `release/beta-v1.0-real` — IVE beta v1.0 real bundle
- `reliability-layer-2026-08-09` — production IVE at authenticated /workspace
- `task/user-isolated-production-ive` — production IVE scope + owner boundary

**v0 / vibe branches (3):**
- `v0/deployment-troubleshooting-b77402da` — 404 fix (dual app dir consolidation)
- `v0/divhanimajokweni-1651-5cec4ac8` — auth routing fix
- `vibe/vvu-trust-chain-v31-c7593b` — trust chain v31, gate workflow test

**GitHub Pages (1):**
- `gh-pages` — 6 files, deploy trigger. Safe to archive + delete.

### C. ARCHIVE — hardware/benchmark results (4 branches)

These are ROCm GPU run results — valuable as benchmark evidence. Archive as bundles.

- `amd-rocm-validation` — 4.249x ROCm speedup (final benchmark)
- `mi300x-rocm-run-20260804` — MI300X VF, 10k samples/50 epochs
- `results/rocm-run-20260804-185101` — 1.685x speedup, ledger valid, gfx1100
- `results/rocm-run-20260804-232342` — MI300X VF run

### D. ARCHIVE — zoo submissions (2 branches)

- `zoo-submission` — CVE-2026-69192 ip-address SSRF fix (10.2.0→10.4.0)
- `zoo.dev-amd-ai-dev-submission` — same CVE fix for AMD dev track

### E. DELETE without archiving (3 branches — dependabot PRs)

These are automated dependency-bump PRs. If they've been merged or are stale, safe to delete without archiving (the dependency changes are in the package.json on main if they were merged).

- `dependabot/npm_and_yarn/vvu-mcp-server/fast-uri-3.1.5`
- `dependabot/npm_and_yarn/vvu-mcp-server/hono-4.13.1`
- `dependabot/npm_and_yarn/vvu-mcp-server/multi-a733d7aecf`

---

## Archive Procedure (when you confirm)

For each branch in categories B/C/D, I would:

```bash
# 1. Create a git bundle (recoverable offline archive)
git bundle create "archive/<branch-name>.bundle" "<branch-name>"

# 2. Verify the bundle
git bundle verify "archive/<branch-name>.bundle"

# 3. Delete the remote branch
git push origin --delete "<branch-name>"
```

The bundles would be saved to a local `archive/` folder. If you ever need a branch back:
```bash
git fetch "archive/<branch-name>.bundle" "<branch-name>:<branch-name>"
```

---

## What I will NOT do

- ❌ Delete any branch without your explicit confirmation
- ❌ Force-push or rewrite main
- ❌ Delete `main` or `feat/vres1-clean-2026-08-25`
- ❌ Skip the archive step for branches with real work

---

## Questions for you

1. **Should `feat/vres1-clean-2026-08-25` merge into `main` before cleanup, or remain separate?** If you want only one branch to remain, we need to decide whether that's `main` (with my work merged in) or my branch (renamed to main).

2. **Should I archive the 24 work-bearing branches as git bundles locally, or do you want them pushed to a separate archive repo?** Local bundles are simpler; a separate repo is more discoverable.

3. **Confirm the 3 dependabot branches are safe to delete without archiving?** (They're dependency-bump PRs — the changes, if merged, are already in main's package.json.)

4. **The 4 ROCm benchmark branches contain real hardware results (4.249x speedup, 1.685x speedup).** Are these documented elsewhere? If not, I strongly recommend keeping the bundles even after deleting the remote branches.

---

**Reply with "confirmed" (or specific edits) and I'll execute the archive + delete sequence.** Until then, no branches will be deleted.
