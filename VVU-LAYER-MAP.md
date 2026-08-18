# VVU Layer Map — Evidence Discipline Applied to VVU Itself

**Version:** 1.0.0
**Status:** LIVING DOCUMENT — updated whenever a layer transitions between classes.
**Established:** 2026-08-18

---

## Classification Key

| Class | Meaning |
|-------|---------|
| ✅ **Deployed** | Actually implemented and verified in the workspace today |
| ◇ **Metaphor** | Curriculum / conceptual mapping; not a literal implementation |
| 🔬 **Research** | Roadmap item; not deployed; may require hardware or research not yet provisioned |

---

## L0 — Mathematical Substrate

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| Zero as observed state (`0 ≠ undefined ≠ missing ≠ unknown`) | ✅ Deployed | Enforced in `contracts/VVUSovereignRegistry.sol`: `paused=true` is a measured initial state, not absence; `activationCommitHash == bytes32(0)` is the observed dormant marker, distinguished from "not yet checked." |
| `require(executionTraceHash != bytes32(0))` — "no telemetry anchored" | ✅ Deployed | `contracts/VVUSovereignRegistry.sol`, `issueSovereignSBT`. Missing evidence ≠ evidence of zero: a fresh operative has `bytes32(0)` for `executionTraceHash` and the contract refuses to mint on it. |
| Mathematics as relationships between states | ◇ Metaphor | Encoded in `VVU-ARCHITECTURE.md` §L0 as the M0 doctrine. Curriculum layer, not a deployed runtime. |
| Universal standards (meter defined by speed of light analog) | 🔬 Research | Conceptual mapping only; no physical-constant anchoring implemented. |

---

## L1 — Biological / Cognitive Substrate

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| STUDI curriculum components (Evolution Matrix, Valve Cockpit, Sidebar Nav, Workspace Switcher) | ✅ Deployed | `src/components/vvu/`: `evolution-matrix.tsx`, `valve-cockpit.tsx`, `sidebar-nav.tsx`, `workspace-switcher.tsx`, `app-shell.tsx`, `logo.tsx`, `evolution-matrix-page.tsx`. |
| STUDI gates (M0 → M8 DAG) | ✅ Deployed (data) | `scripts/seed-studi-gates.ts` seeds the module DAG into the system. |
| Neuron / Spike / Synaptic adaptation mappings | ◇ Metaphor | Documented in `VVU-ARCHITECTURE.md` §L1 as a conceptual bridge. Not a literal SNN runtime. |
| Surrogate gradients for human training | ◇ Metaphor / 🔬 Research | Explicitly corrected in `VVU-ARCHITECTURE.md` §L1: surrogate-gradient math is a **computational model for designing and evaluating learning processes**, not literal backprop through brains. No runtime implementation. |
| Energy efficiency of biological cognition | ◇ Metaphor | Conceptual framing only. |

---

## L2 — Computational Substrate

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| AMD MI300x / Radeon GPU pipeline | ✅ Deployed (workflow) | `.github/workflows/gpu-pipeline-activation.yml` — self-hosted runner with `linux, amd-gpu, mi300x` labels; runs GPU smoke test (PyTorch ROCm 6.2) → refuses to proceed if no GPU. |
| Auto-deploy watcher (dev sync → pipeline dispatch) | ✅ Deployed | `scripts/auto-deploy-watcher.ts` — fs.watch on `src/`, `contracts/`, `public/`; 5s debounce → hardhat compile → hardhat test → next build → `repository_dispatch` to GitHub. Locally verified end-to-end in DRY_RUN mode. |
| GPU benchmark retrieval (matmul fp16 → Supabase) | ✅ Deployed (workflow step) | Step 5 of `gpu-pipeline-activation.yml`. Benchmarks 1024/4096/8192 fp16 matmuls; refuses to activate on failure. |
| Edge / cloud distributed computation | 🔬 Research | No edge runtime deployed. Cloud = Vercel only. |

---

## L3 — Communication Substrate

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| Caddy reverse proxy on `venturevisionubuntu.co.za` | ✅ Deployed (config) | `Caddyfile` — TLS auto-provisioning, security headers (HSTS, X-Content-Type-Options, X-Frame-Options), routes `/webhook/*` → `localhost:4000`, `/api/theorem-state` with cache-bust. |
| Kafka-backed webhook worker | ✅ Deployed | `scripts/webhook-worker.ts` + `scripts/create-topics.ts` + `scripts/rotate-webhook-secret.ts` + `scripts/admin-worker.ts`. |
| Photonic backbone (LEGEND) | 🔬 Research | No photonic hardware deployed. LEGEND exists as a conceptual layer name in `VVU-ARCHITECTURE.md` §L3. |
| Silicon photonics | 🔬 Research | Not deployed. |
| BTO electro-optic switching | 🔬 Research | Not deployed. Explicitly corrected in `VVU-ARCHITECTURE.md` §L3: photons ≠ infinite bandwidth / zero heat. |
| Photons ≠ zero heat / infinite bandwidth (correction) | ✅ Deployed (correction) | The correction itself is encoded in `VVU-ARCHITECTURE.md` §L3 — applies VVU's evidence discipline to its own architecture. |

---

## L4 — Epistemic / Verification Substrate

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| `VVUIVELedger` — on-chain verdict anchoring (Theorem 5 fail-closed bound) | ✅ Deployed | `contracts/VVUIVELedger.sol` — refuses to record `iveVerdict = PROVEN` when `breaker = TRIPPED`. Compiled, 8 typechain typings. |
| `VVUSovereignRegistry` — sovereign clearance registry | ✅ Deployed | `contracts/VVUSovereignRegistry.sol` — patched with dormant-deploy pattern; refuses mint without telemetry anchor; revokes on failed audit; refuses double-mint. 22/22 tests pass. |
| Intent Worker (Epistemic Hazard Wall) | ✅ Deployed | `public/intentWorker.js` — Web Worker running 5-conjunct (C/E/I/S/R) hazard wall, threshold 0.85, breaker-trip fail-closed. |
| Evolution Matrix (Ghost Buffer + Intent Worker binding) | ✅ Deployed | `src/components/vvu/evolution-matrix.tsx` — off-screen InstancedMesh pre-renders predicted stage; telemetry feeds worker every 200ms; refuses `ghostTarget > 2` under breaker trip. |
| E2E fail-closed test | ✅ Deployed | `tests/e2e/vvu-fail-closed.spec.ts` — Reset → All GO → matrix morphs to Miles (`data-stage=3`) → trip breaker → drops to `data-stage=2` + `data-breaker=TRIPPED`. Passing. |
| Plugin Registry UI | ✅ Deployed | `src/components/ive-workspace/plugin-registry.tsx` — lists plugins as verifiable modules with identity, version, inputs, outputs, permissions. |
| IVE Claim Injector (bulk action selectors) | ✅ Deployed | `src/components/ive-workspace/ive-claim-injector.tsx` — `data-test="all-go"`, `data-test="reset-all"` selectors for E2E. |
| Mathematical Parallax (peer review as multi-observer verification) | ◇ Metaphor / 🔬 Research | Conceptually encoded in `VVU-ARCHITECTURE.md` §L4. Not yet wired to a peer-review runtime that calculates "evidentiary resolution" from multiple observers. |
| Evidence Independence Specification (EIS) | 🔬 Research | Referenced by name; no spec file in workspace yet. |
| ProofBridge / AIR / HBK | 🔬 Research | Named in the architecture; not deployed. |

---

## L5 — Governance / Safety Substrate

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| Dormant-deploy pattern (paused = true on construction) | ✅ Deployed | `contracts/VVUSovereignRegistry.sol` — `bool public paused = true`; `whenNotPaused` modifier on `anchorSovereignTelemetry` + `issueSovereignSBT`. 10 tests covering the dormant pattern; 22/22 total pass. |
| `activate(bytes32 gitCommitHash)` — single "go live" button | ✅ Deployed | `contracts/VVUSovereignRegistry.sol` — sovereign-only; refuses zero hash; refuses if already live; records the git SHA on-chain as `activationCommitHash`. |
| `deactivate()` — emergency rollback | ✅ Deployed | `contracts/VVUSovereignRegistry.sol` — sovereign-only; re-pauses; preserves on-chain telemetry. |
| Pre-tool-call guardrails (recursive delete / system wipe blocking) | 🔬 Research | Named in `VVU-ARCHITECTURE.md` §L5. Not implemented as a pre-tool-call hook layer. |
| Saga pattern with orchestration | 🔬 Research | Named in `VVU-ARCHITECTURE.md` §L5. Compensating-action pattern not yet wired into the deploy chain. (The dormant-deploy pattern is a single-step rollback; not a full Saga.) |
| Transactional outbox | ◇ Metaphor / 🔬 Research | `scripts/webhook-worker.ts` uses Kafka topics for durable event delivery, which is adjacent to but not identical with a transactional outbox pattern. |
| Rate limiting | 🔬 Research | Not deployed. |
| Fail-closed bound at SIX layers | ✅ Deployed | (1) Worker `public/intentWorker.js`, (2) UI `evolution-matrix.tsx`, (3) Server `computeIveVerdict`, (4) `VVUIVELedger` contract, (5) `VVUSovereignRegistry` mint/anchor gates, (6) Dormant-deploy gate. |

---

## Integration Layer (VVU as the integration, not an application)

| Concept | Class | Artifact / Note |
|---------|-------|-----------------|
| Recursive operating pattern: Observe → Compute → Verify → Commit → Record → Learn | ✅ Deployed (encoded) | `VVU-ARCHITECTURE.md` §3. |
| Session-level loop: Work → Verify → Artifact → Souvenir → Continue | ✅ Deployed (encoded) | `VVU-SESSION-PROTOCOL.md`. |
| Evidence discipline applied to VVU itself | ✅ Deployed (this file) | You are reading it. |
| Auto-deploy chain (no lifting a finger) | ✅ Deployed | `scripts/auto-deploy-watcher.ts` + `.github/workflows/gpu-pipeline-activation.yml` + `deploy.sh`. |
| Production target `venturevisionubuntu.co.za` | ✅ Deployed (config) | `Caddyfile` + `deploy.sh` (`PRODUCTION_DOMAIN` env). Operator must still point DNS A/AAAA. |

---

## Summary by Class

| Class | Count | Notes |
|-------|-------|-------|
| ✅ Deployed | ~24 items | Actually implemented and verified. |
| ◇ Metaphor | ~6 items | Curriculum / conceptual mapping. Honesty preserved. |
| 🔬 Research | ~10 items | Roadmap. Not deployed. May require hardware or research. |

The ratio is healthy. The architecture is honest. VVU's evidence discipline now applies to VVU itself.

---

## Transition Log

When a layer moves between classes, record it here:

| Date | Item | From | To | Evidence |
|------|------|------|-----|----------|
| 2026-08-18 | Initial classification | — | ✅ / ◇ / 🔬 | This file. |

---

*This file is the living reference. Every future VVU runner updates it when a layer transitions. Every transition is recorded in `worklog.md` with the worklog Task ID that produced it.*
