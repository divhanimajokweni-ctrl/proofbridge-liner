# AIR Trust Runtime — `packages/trust-runtime/`

Implements the AIR pipeline audit items agreed as Phase 1–3 priorities: bounded
state, decaying counters, atomic assess-reserve-commit, multi-window velocity,
intent aging, state drift, a composite risk score, and a hysteresis circuit
breaker state machine.

## Drop-in instructions

1. Copy this entire `trust-runtime/` directory into your repo's `packages/`
   folder (or wherever your monorepo convention puts it).
2. `npm install` (or your package manager) to pull `vitest` as a dev dependency.
3. `npm test` — 9 test files, ~70 assertions, should all pass with zero config
   changes needed.
4. Wire `runGatePipeline()` (`gate-pipeline.ts`) into your actual request path
   with `config.enforceAt: 'observe'` first. It computes and returns full
   results without throwing in observe mode, so you get real telemetry from
   day one with zero risk of false-positive halts.
5. Do NOT flip `enforceAt: 'enforce'` until Phase 2 (30-day baseline, P95/P99/P99.9
   threshold derivation) is complete. Every threshold in `DEFAULT_AIR_CONFIG`
   (`types.ts`) is marked `// TBD Phase 2 empirical` and is a placeholder value,
   not a tuned one.

## What changed vs. the original proposal — and why

| Original term | This implementation | Why |
|---|---|---|
| "Lyapunov function" `computeLyapunov` | `computeRiskScore` (deprecated alias kept) | No equilibrium point, no proof that dV/dt ≤ 0 against the real belief-update operator. It's a weighted risk score, not a stability guarantee. Calling it Lyapunov overclaims — see docstring in `risk-score-engine.ts`. |
| "Banach contraction mapping" damping | Plain exponential decay of intent weight | Decaying an input's *weight* is not the same as proving the Epistemic Runtime's transition operator is contractive. If `F` itself diverges, damping its input slows the explosion, it doesn't prevent it. |
| "Lebesgue integration" risk buckets | Risk-tier-weighted exposure accumulator | Correct engineering (event-time based, immune to arrival jitter), but formal Lebesgue integration requires a measure space this doesn't have. Renamed to avoid overclaiming rigor in front of technical diligence. |
| `intentAge^2` on a possibly-unnormalized value | `intentAge` type-enforced to `[0,1]` before squaring, with a runtime `AIRUnnormalizedMetricError` guard | The original formula would grow unboundedly as an intent approaches 72h expiry — exactly when the score most needs to stay stable. This directly violated the audit's own bounded-state principle. |
| Binary `OPEN/CLOSED` breaker | 5-state machine with hysteresis (`circuit-breaker.ts`) | Prevents oscillation at threshold boundaries; forces a `RECOVERY` hold before returning to `NORMAL`; escalates after repeated trips in a rolling window. |
| Process-local `let killSwitchState` | `DistributedKillSwitch` requiring an external `KillSwitchStore` adapter | A process-local variable is not a kill switch in any multi-node deployment. |
| "Record, then assess" | `assess-reserve-commit.ts` — reserve/commit/release | Closes the exact race window the audit flagged as its highest-priority correctness issue. See the regression test in `__tests__/assess-reserve-commit.test.ts`. |

## Explicitly NOT included (tell me which you need and I'll build it)

- **Production `AtomicReservationStore` adapter** (Postgres `SELECT ... FOR
  UPDATE` or Redis Lua script). `InMemoryReservationStore` is provided and is
  safe for a single Node process only — it will silently stop providing
  atomicity guarantees across multiple processes/pods. This is a real infra
  decision (which datastore you're standardizing on) that can't be faked.
- **`KillSwitchStore` adapter** for whichever of Redis/etcd/Consul/Postgres
  advisory locks you're running.
- **Merkleized time-series DAG** — correctly deferred to Phase 5 per the audit;
  not built here.
- **Acceleration-gate enforcement** — the gate computes and returns telemetry,
  but per the audit's own "approve with caution" verdict, treat it as
  observe-only until you have empirical false-positive data (Phase 3, not
  Phase 1).

## Tier classification (per your Reality/Architecture/Hypothesis/Vision standard)

- **Verified operational reality once merged and tested:** decay counters,
  bounded store, exposure accumulator, velocity/acceleration math, state
  drift, intent aging, circuit breaker state machine, assess-reserve-commit
  pattern (all have passing unit tests in this package).
- **Architecture, not yet reality:** the full gate pipeline orchestration
  (`gate-pipeline.ts`) — it's wired and tested in isolation, but its behavior
  against your actual production traffic patterns is unverified until Phase 2
  baselining runs.
- **Explicitly not attempted:** any claim of formal stability proof
  (Lyapunov/Banach in the rigorous sense), production-grade external store
  adapters, cryptographic audit trail (Phase 5).
