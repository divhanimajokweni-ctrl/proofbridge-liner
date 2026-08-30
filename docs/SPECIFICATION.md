# ProofBridge Liner — Technical Specification

**Version:** 0.2.1
**Status:** Open-Source Release Candidate
**Date:** 2025-07-12
**License:** AGPL-3.0

| Field | Value |
|-------|-------|
| Company | Vaguely Vanity (Pty) Ltd (RF), trading as Venture Vision Ubuntu (VVU) |
| CIPC | 2026/259053/07 |
| Founder | Mihle Majokweni |
| Live URL | https://proofbridge.venturevisionubuntu.co.za |
| Repository | https://github.com/divhanimajokweni-ctrl/proofbridge-liner |

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [EIS (Evidence Independence Specification)](#2-eis-evidence-independence-specification)
3. [STUDI Pipeline Specification](#3-studi-pipeline-specification)
4. [Circuit Breaker Specification](#4-circuit-breaker-specification)
5. [Webhook Infrastructure Specification](#5-webhook-infrastructure-specification)
6. [API Specification](#6-api-specification)
7. [Data Model (Prisma Schema)](#7-data-model-prisma-schema)
8. [Security Model](#8-security-model)
9. [Smart Contracts](#9-smart-contracts)
10. [VVU Ecosystem Integration](#10-vvu-ecosystem-integration)
11. [HBK MK-II Hydro-Gateway Case Study](#11-hbk-mk-ii-hydro-gateway-case-study)
12. [Performance & Scalability](#12-performance--scalability)

---

## 1. System Architecture

### 1.1 Layer Model

ProofBridge Liner implements a 6-layer architecture where each layer has a distinct epistemic role. The system is designed so that *no single layer may masquerade as another*.

```
L5 ─── GOVERNANCE / SAFETY SUBSTRATE
         SafeGrid, guardrails, RBAC, Saga orchestration,
         dormant-deploy pattern, constitutional immunities
              │
L4 ─── WEBHOOK INFRASTRUCTURE
         Kafka transport, HMAC signing, circuit breakers,
         retry budgets, DLQ, immutable event ledger
              │
L3 ─── IVE APPLICATION
         Next.js 16, claim management, authorization,
         UI panels, TanStack Query, Zustand stores
              │
L2 ─── STUDI PIPELINE
         5-Gate model, challenge mode, interest inception,
         governing documents, epistemic objects
              │
L1 ─── EIS CORE
         State lattice, participation ratio (n-Ind),
         heat kernel diffusion, evidence mesh, authorization
              │
L0 ─── MATHEMATICAL SUBSTRATE
         Lattice theory, spectral analysis, diffusion PDEs,
         RBF kernel, Jacobi eigenvalue algorithm
```

### 1.2 Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        L5 — GOVERNANCE / SAFETY                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │ VVU Gov.     │  │ SafeGrid     │  │ Smart Contract Anchors     │   │
│  │ Charter v1.0 │  │ RBAC         │  │ (VVUSovereignRegistry)     │   │
│  │              │  │              │  │ (VVUIVELedger)             │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬────────────────┘   │
└─────────┼─────────────────┼────────────────────────┼────────────────────┘
          │                 │                        │
┌─────────┼─────────────────┼────────────────────────┼────────────────────┐
│         ▼       L4 ─── WEBHOOK INFRASTRUCTURE      ▼                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │ Stitch (Svix)│  │ Paystack     │  │ Kafka Transport Layer      │   │
│  │ HMAC-SHA256  │  │ HMAC-SHA512  │  │ 12 partitions, 3x repl.    │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬────────────────┘   │
│         │                 │                        │                    │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌────────────┴────────────────┐   │
│  │ Memory Fallback│ │ Per-WH CB    │  │ DLQ (30-day retention)     │   │
│  │ (dev mode)    │  │ 10/300s/1    │  │ Manual replay only         │   │
│  └──────────────┘  └──────────────┘  └─────────────────────────────┘   │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────┐
│  L3 ─── IVE APPLICATION  ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    Next.js 16 (plain JS)                     │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │     │
│  │  │ Claims   │  │ Verify   │  │ Authorize│  │ Theorem State│  │     │
│  │  │ Pipeline │  │ Endpoint │  │ Endpoint │  │ Store (poll) │  │     │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │     │
│  │       │              │              │               │          │     │
│  │  ┌────┴──────────────┴──────────────┴───────────────┴──────┐  │     │
│  │  │              SQLite (Prisma ORM)                        │  │     │
│  │  └────────────────────────────────────────────────────────┘  │     │
│  └──────────────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  UI: shadcn/ui + Tailwind CSS 4 + Framer Motion              │     │
│  │  State: Zustand + TanStack Query                              │     │
│  └──────────────────────────────────────────────────────────────┘     │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────┐
│  L2 ─── STUDI PIPELINE  ▼                                           │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ 5-Gate   │  │ Challenge    │  │ Interest      │  │ Evolution    │  │
│  │ Model    │  │ Scanner      │  │ Inception     │  │ Matrix       │  │
│  │          │  │              │  │ State Machine │  │ (Ghost Buf.) │  │
│  └────┬─────┘  └──────────────┘  └───────────────┘  └──────────────┘  │
└──────┼──────────────────────────────────────────────────────────────────┘
       │
┌──────┼──────────────────────────────────────────────────────────────────┐
│  L1 ─── EIS CORE  ▼                                                   │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────────────┐ │
│  │ State      │ │ n-Ind      │ │ Heat     │ │ Authorization           │ │
│  │ Lattice    │ │ (Particip. │ │ Kernel   │ │ A = C ∧ E ∧ I ∧ S ∧ R │ │
│  │            │ │  Ratio)    │ │ Diffusion│ │                        │ │
│  └────────────┘ └────────────┘ └──────────┘ └────────────────────────┘ │
│  ┌────────────┐ ┌────────────┐                                       │
│  │ Evidence   │ │ Circuit    │                                       │
│  │ Mesh       │ │ Breaker    │                                       │
│  └────────────┘ └────────────┘                                       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────┐
│  L0 ─── MATH SUBSTRATE      ▼                                         │
│  Lattice theory · Spectral decomposition · Jacobi eigenvalue algorithm │
│  RBF kernel · Graph Laplacian · Heat equation PDE · M0 doctrine         │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Data Flow — Claim Verification Pipeline

```
                         CLAIM FILED
                              │
                              ▼
                    ┌─────────────────┐
                    │  Evidence Mesh  │◄── you.com, brave,
                    │  (L1)           │    firecrawl, watchdog
                    └────────┬────────┘
                             │
                    embeddings e_i ∈ R^20
                             │
                             ▼
                    ┌─────────────────┐
                    │  N-Ind Compute  │    γ = 1/median(||e_i - e_j||²)
                    │  (L0/L1)        │    G_ij = exp(-γ||e_i - e_j||²)
                    └────────┬────────┘    N_ind = (∑λ_i)² / ∑λ_i²
                             │
                             ▼
                    ┌─────────────────┐
                    │  State Lattice  │    state(c) = ⊔ {state(e) : e ∈ E(c)}
                    │  (L0/L1)        │    capped by claimType rank
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Heat Kernel    │    u_t = -κLu
                    │  (L0/L1)        │    Evidence quality smoothing
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Authorize      │    A = C ∧ E ∧ I ∧ S ∧ R
                    │  (L1)           │
                    └────────┬────────┘
                             │
                      ┌──────┴──────┐
                      │             │
                   PASS          FAIL
                      │             │
                      ▼             ▼
                ┌──────────┐  ┌──────────────┐
                │ Action   │  │ Circuit      │
                │ Authorized│  │ Breaker Trip │
                └────┬─────┘  └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Theorem State│──────► VVUIVELedger.sol
              │ /api/theorem │       (on-chain anchor)
              │ -state       │
              └──────────────┘
```

### 1.4 Component Interaction Patterns

ProofBridge Liner uses three primary interaction patterns:

**Request-Response (API Routes):**
Client → Next.js API Route → EIS Core → Prisma/SQLite → JSON Response

**Event-Driven (Webhooks):**
Claim State Change → Kafka Topic → Delivery Worker → HTTP POST → External System

**Polling (Theorem State):**
Watchdog Agent → `GET /api/theorem-state` → VVUIVELedger.sol `postVerdict()`

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser/UI     │     │  Next.js Server  │     │   SQLite (Prisma)│
│                  │     │                  │     │                  │
│  Zustand Store   │◄───►│  API Routes      │◄───►│  12 Models       │
│  TanStack Query  │     │  EIS Core (L1)   │     │  Relations       │
│  Framer Motion   │     │  STUDI (L2)      │     │  Indexes         │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                         ┌────────┴─────────┐
                         │                  │
                    ┌────▼─────┐    ┌──────▼──────┐
                    │  Kafka   │    │ Hardhat /   │
                    │ Transport│    │ Ethers.js   │
                    └────┬─────┘    └──────┬──────┘
                         │                  │
                    ┌────▼─────┐    ┌──────▼──────┐
                    │ External │    │ Arbitrum /  │
                    │ Endpoints│    │ Polygon     │
                    └──────────┘    └─────────────┘
```

### 1.5 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js / Bun | — |
| Framework | Next.js | 16.1.1 |
| Language | JavaScript (ESM, NO TypeScript) | — |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui (Radix primitives) | — |
| State Management | Zustand | 5.0.6 |
| Server State | TanStack Query | 5.82.0 |
| Animation | Framer Motion | 12.23.2 |
| ORM | Prisma (SQLite) | 6.11.1 |
| Message Broker | KafkaJS | 2.2.4 |
| Smart Contracts | Solidity (Hardhat) | 0.8.20 |
| 3D Visualization | Three.js | 0.160.0 |

---

## 2. EIS (Evidence Independence Specification)

The EIS is the mathematical core of ProofBridge Liner. It provides a formal framework for evaluating whether a claim has sufficient, independent, and current evidence to support authorization of a consequential action.

### 2.1 Mathematical Formalism

An EIS verification instance is a tuple:

```
E = (C, E, W, S, R)
```

Where:

- `C` — Claim: a proposition of type `τ ∈ {mathematical, semantic, empirical, operational}`
- `E = {e_1, ..., e_n}` — Evidence set, each item with source `s_i`, content, embedding `v_i ∈ R^D`, and weight `w_i ∈ [0,1]`
- `W` — Integrity measure: the participation ratio N_ind computed from the evidence source matrix
- `S` — Safety clearance: boolean, required only for safety-critical claims
- `R` — Reviewer signoff: boolean, required only for safety-critical claims

The authorization decision is:

```
A = C ∧ E ∧ I ∧ S ∧ R
```

Where each conjunct evaluates independently:

| Conjunct | Symbol | Condition |
|----------|--------|-----------|
| Claim state meets threshold | C | `state(C) ≥ SUPPORTED` and `state(C) ≠ FALSIFIED` |
| Sufficient evidence exists | E | `|distinct_sources| ≥ 2` OR `|E| ≥ 3` |
| Provenance integrity | I | `N_ind ≥ (integrity_threshold - 0.3)` where threshold = 2 (safety-critical) or 1 (non-critical) |
| Safety clearance | S | `true` (always for non-critical; requires override for safety-critical) |
| Reviewer signoff | R | `true` (always for non-critical; requires explicit signoff for safety-critical) |

### 2.2 EIS Scoring Formula

The composite EIS score for a claim is computed as:

```
EIS(c) = 0.35 · Certainty(c) + 0.35 · Coherence(c) + 0.30 · Decay(c)
```

Where:

- **Certainty(c)** — Fraction of evidence items whose lattice state meets or exceeds the authorization threshold. Measures the proportion of evidence that directly supports the claim at the required confidence level.

```
Certainty(c) = |{e ∈ E(c) : state(e) ≥ SUPPORTED}| / |E(c)|
```

- **Coherence(c)** — The participation ratio N_ind, normalized to [0, 1]. Measures the effective number of independent information sources among the evidence set.

```
Coherence(c) = min(1, N_ind / n)    where n = |E(c)|
```

- **Decay(c)** — Temporal freshness factor derived from the heat kernel. Evidence collected further in the past contributes less to the score.

```
Decay(c) = (1/|E(c)|) · Σ K(t_i)    where K(t) = exp(-λt)
```

### 2.3 EIS Theorem 5 (Fail-Closed)

**Theorem 5 (Theorem 5 — Fail-Closed Invariant):**

```
loss(E)  ⇒  loss(V)  ⇒  loss(A)  ⇒  breaker trips  ⇒  action blocked

evidence    verification  authorization
```

Formally: for any claim `c` with authorization `A(c)`, if the evidence set `E(c)` loses items such that any conjunct of `A = C ∧ E ∧ I ∧ S ∧ R` becomes `false`, the system MUST transition to a state where the intended action is blocked. This is enforced at six layers simultaneously:

1. **Worker layer:** `public/intentWorker.js` — Web Worker running 5-conjunct hazard wall
2. **UI layer:** `evolution-matrix.jsx` — Refuses ghost stage advancement under breaker trip
3. **Server layer:** `computeIveVerdict()` — Returns `INCONCLUSIVE` when any breaker is tripped
4. **Contract layer (IVE):** `VVUIVELedger.sol` — Refuses `iveVerdict=PROVEN` when `breaker=TRIPPED`
5. **Contract layer (Sovereign):** `VVUSovereignRegistry.sol` — Revokes clearance on failed telemetry audit
6. **Deploy layer:** Dormant-deploy gate — Contract ships `paused=true`

### 2.4 State Lattice Formalism

Claim states form a bounded lattice `(S, ≤, ⊔, ⊥, ⊤)`:

```
PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE
FALSIFIED (incomparable — terminal denial)
UNVALIDATED / UNTESTED / STALE (pre-conditions)
```

**State ranks (implementation):**

```
STATE_RANK = {
  PROVEN:      8,
  VERIFIED:    7,
  SUPPORTED:   6,
  OBSERVED:    5,
  INCONCLUSIVE: 4,
  UNVALIDATED: 2,
  UNTESTED:    1,
  STALE:       0,
  FALSIFIED:  -1
}
```

**Lattice join (supremum):**

```
a ⊔ b = a  if STATE_RANK[a] ≥ STATE_RANK[b]  (and neither is FALSIFIED)
a ⊔ b = b  if STATE_RANK[b] > STATE_RANK[a]  (and neither is FALSIFIED)
a ⊔ b = FALSIFIED  if either is FALSIFIED
```

**Claim state computation:**

```
state(c) = ⊔ { state(e) : e ∈ E(c) }  capped by claimType
```

The claim type imposes an upper bound:

```
CLAIM_TYPE_RANK = {
  mathematical: 4  → cap = PROVEN
  semantic:    3  → cap = VERIFIED
  empirical:   2  → cap = SUPPORTED
  operational: 1  → cap = OBSERVED
}
```

This ensures that operational claims cannot reach PROVEN status regardless of evidence quality — the epistemic ceiling is determined by the type of knowledge being asserted.

**State transition diagram:**

```
                        ┌─────────┐
                        │ UNTESTED │
                        └────┬────┘
                             │ evidence added
                             ▼
                     ┌──────────────┐
                ┌───►│  INCONCLUSIVE │◄───┐
                │    └──────┬───────┘    │
                │           │            │
                │     weak evidence    │ evidence weakened
                │           │            │
                │           ▼            │
                │    ┌──────────────┐    │
                │    │   OBSERVED   │    │
                │    └──────┬───────┘    │
                │           │            │
                │     more evidence    │
                │           │            │
                │           ▼            │
                │    ┌──────────────┐    │
                │    │  SUPPORTED   │    │
                │    └──────┬───────┘    │
                │           │            │
                │     strong evidence  │
                │           │            │
                │           ▼            │
           ┌────┴───►│   VERIFIED   │    │
           │        └──────┬───────┘    │
           │               │            │
           │  mathematical/  │            │
           │  semantic only  │            │
           │               ▼            │
           │        ┌──────────────┐    │
           │        │    PROVEN    │    │
           │        └──────────────┘    │
           │                            │
           │    evidence expires        │
           │           │                │
           │           ▼                │
           │        ┌──────────────┐    │
           └────────│     STALE     │────┘
                    └──────────────┘

         ┌──────────────┐
         │  FALSIFIED   │  (terminal, incomparable)
         └──────────────┘
```

### 2.5 Participation Ratio (N-Ind)

The participation ratio measures the effective number of independent information sources in an evidence set using spectral analysis of the evidence source matrix.

**Definition:**

```
N_ind = (∑λ_i)² / ∑λ_i²
```

Where `λ_i` are the eigenvalues of the RBF Gram matrix:

```
G_ij = exp(-γ · ||v_i - v_j||²)
```

- `v_i ∈ R^D` — Embedding vector for evidence item `i` (default `D = 20`)
- `γ` — RBF bandwidth parameter, computed via median heuristic:

```
γ = 1 / median{ ||v_i - v_j||² : i < j }
```

**Properties:**

- `N_ind ∈ [1, n]` where `n = |E(c)|`
- `N_ind = n` if and only if all evidence items come from perfectly independent sources
- `N_ind ≈ 1` if all evidence items are near-identical (correlated sources)

**Implementation:**

The eigenvalue decomposition uses the Jacobi eigenvalue algorithm (cyclic sweeps, tolerance `1e-10`, max 100 sweeps). This is a pure-JavaScript implementation suitable for the small matrices encountered in evidence verification (typically `n < 50`).

**Embedding synthesis** (current implementation):

Embeddings are synthesized deterministically from the evidence source name and a seed value using a FNV-1a hash-based PRNG. Each source maps to a center vector in `R^20`, with per-item jitter of `±0.3`. This ensures reproducibility while providing source-differentiated embeddings.

### 2.6 Heat Kernel — Temporal Decay

The heat kernel models evidence quality degradation over time using the graph heat equation.

**PDE formulation (Theorem 3):**

```
u_t = -κ L u
```

Where:
- `u(t) ∈ R^n` — Evidence quality vector at time `t`
- `L` — Graph Laplacian of the evidence provenance graph
- `κ > 0` — Diffusion coefficient (default `0.25`)

**Temporal decay function:**

```
K(t) = exp(-λt)
```

Where `λ` is the smallest non-zero eigenvalue of `L`, governing the slowest decay mode.

**Numerical integration:**

Forward Euler with adaptive time step:

```
Δt = 0.5 / λ_max    (CFL stability condition)
u^{k+1} = u^k - κ · Δt · L · u^k
```

**Evidence smoothing:**

For a claim with `n` evidence items, a complete graph Laplacian is used:

```
L_ii = n - 1
L_ij = -1    (i ≠ j)
```

The heat kernel diffusion smooths evidence weights, reducing the influence of outlier evidence while preserving the total information mass. The `retention` metric measures L2-norm preservation:

```
retention = ||u(final)||_2 / ||u(0)||_2
```

**Expected behavior (Theorem 3 signature):** At `κ = 0.25`, 128-node cycle graph, Gaussian initial condition, 50 steps: `retention ≈ 0.904`, `finalHighFreqEnergy → 0`.

---

## 3. STUDI Pipeline Specification

STUDI (the cognitive/learning substrate) provides the human-facing verification pipeline through which claims are evaluated against corporate governance gates.

### 3.1 5-Gate Model

The STUDI pipeline enforces a 5-gate progression model that maps directly to venture funding stages:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GATE 1    │    │   GATE 2    │    │   GATE 3    │    │   GATE 4    │    │   GATE 5    │
│ Foundation  │───►│    Seed     │───►│   Growth    │───►│  Pre-IPO    │───►│    IPO      │
│             │    │             │    │             │    │             │    │             │
│  $1.5M ARR  │    │   $8.2M     │    │    $30M     │    │   $60.75M   │    │   $82.7M    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

| Gate | Stage | Target ARR | Evaluation Criteria |
|------|-------|-----------|-------------------|
| 1 | Foundation | $1.5M | Product-market fit validation, initial user traction, basic EIS compliance |
| 2 | Seed | $8.2M | Multi-source evidence pipeline, STUDI governance gates resolved, watcher operational |
| 3 | Growth | $30M | Scale verification, challenge mode operational, on-chain verdict anchoring |
| 4 | Pre-IPO | $60.75M | Full EIS Theorem 5 enforcement, dual-network deployment, sovereign registry |
| 5 | IPO | $82.7M | All governance gates resolved, constitutional immunities encoded, full audit trail |

### 3.2 Gate Evaluation Criteria

Each STUDI gate has a status drawn from the gate status lattice:

```
GO / FILED / RESOLVED     → STUDI verdict: PROVEN     (valve opens)
DRAFT / READY (mixed)     → STUDI verdict: INCONCLUSIVE (valve held)
PENDING / NOT-FILED / BLOCKED → STUDI verdict: UNKNOWN   (valve held)
```

The STUDI verdict is computed by `studiVerdictFromGates()`:

```javascript
function studiVerdictFromGates(gates) {
  const allMet = gates.every(
    g => g.status === "GO" || g.status === "FILED" || g.status === "RESOLVED"
  );
  if (allMet) return "PROVEN";
  const anyBlocked = gates.some(
    g => g.status === "PENDING" || g.status === "NOT-FILED" || g.status === "BLOCKED"
  );
  if (anyBlocked) return "UNKNOWN";
  return "INCONCLUSIVE";
}
```

The STUDI verdict is one of two conjuncts required for the IVE valve to open (the other being the IVE evidence verdict). Both must be `PROVEN` for the valve to release.

### 3.3 Challenge Mode — Productive Disagreement Engine

The challenge scanner (`src/lib/studi/challenge-scanner.js`) implements an automated adversarial review that scans claims and evidence for four categories of epistemic failure:

| Challenge Type | Trigger | Confidence | Detection Method |
|---------------|---------|------------|-----------------|
| **Contradiction** | Certainty language in claim + hedging language in evidence | 0.80–0.90 | Regex-based linguistic analysis |
| **Unsupported Assumption** | Causal connector ("because", "therefore") with unverified premise | 0.70 | Premise extraction + keyword overlap check |
| **Alternative Explanation** | Causal claim without controlled experiment evidence | 0.75 | Causal term detection + evidence weakness analysis |
| **Overconfidence** | Strong certainty language + weak/anecdotal evidence | 0.85 | Numerical projection detection + source quality assessment |

Each challenge produces a structured response with:

```javascript
{
  id: "ch-contradiction-<timestamp>-<random>",
  type: "contradiction" | "unsupported_assumption" | "alternative_explanation" | "overconfidence",
  title: string,
  description: string,
  claim_excerpt: string,
  evidence_excerpt: string | null,
  assessment: string,
  suggested_responses: string[],
  confidence: number  // 0..1
}
```

### 3.4 Interest Inception State Machine

The interest inception module manages the user onboarding flow as a state machine persisted in `localStorage`:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  EMPTY   │────►│ INTEREST     │────►│  PROJECT     │────►│  COMPLETED   │
│  STATE   │     │ SELECTED     │     │  INITIATED   │     │              │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                       │                     │
                       ▼                     ▼
                ┌──────────────┐     ┌──────────────┐
                │ CATEGORY     │     │ BRIDGING     │
                │ CLASSIFIED   │     │ PROMPT       │
                │              │     │ GENERATED    │
                └──────────────┘     └──────────────┘
```

**Supported categories:** investing, politics, education, health, technology, sports, business, law, science, philosophy, current_events, personal_finance, relationships, other, unknown.

Each category generates a domain-specific bridging prompt that transitions the user from casual interest into structured claim verification.

---

## 4. Circuit Breaker Specification

ProofBridge Liner implements **two distinct circuit breaker systems** that must not be conflated. They operate at different layers, have different triggers, and use different persistence mechanisms.

### 4.1 Critical Distinction

```
┌────────────────────────────────┬─────────────────────────────────┐
│   EIS Circuit Breaker          │   Webhook Circuit Breaker       │
│   (Trust Decision Layer)       │   (HTTP Delivery Layer)         │
├────────────────────────────────┼─────────────────────────────────┤
│ Scope: Per-claim              │ Scope: Per-webhook endpoint     │
│ Trigger: Evidence loss,       │ Trigger: 10 terminal delivery   │
│   verification failure,        │   failures (exhausted all 4     │
│   safety violation,            │   attempts)                     │
│   integrity breach,            │                                 │
│   evidence staleness           │                                 │
│ Enforcement: Fail-CLOSED      │ Enforcement: Fail-ISOLATED      │
│   (action blocked)             │   (delivery channel isolated)   │
│ Persistence: CircuitBreaker   │ Persistence:                    │
│   model (Prisma)               │   WebhookCircuitBreakerState    │
│ Recovery: Evidence must be    │ Recovery: Auto-transition after  │
│   re-established and           │   300s cooldown → HALF_OPEN →   │
│   re-verified                  │   1 probe → CLOSED or OPEN      │
│ Theorem: EIS Theorem 5        │ Contract: VVU-IVE Reliability   │
│   (loss ⇒ trip ⇒ block)       │   Contract v1.1                 │
└────────────────────────────────┴─────────────────────────────────┘
```

### 4.2 EIS Circuit Breaker (Trust Decision)

The EIS circuit breaker enforces the fail-closed invariant of Theorem 5.

**Trip conditions:**

| Condition | Check | Reason Code |
|-----------|-------|-------------|
| Evidence lost | `evidenceCount == 0 && previousEvidenceCount > 0` | `evidence_lost` |
| Verification failed | `claimState ∈ {FALSIFIED, STALE, UNTESTED}` | `verification_failed` |
| Safety violation | `safetyCritical && !safetyOk` | `safety_violation` |
| Integrity breach | `N_ind < (integrityThreshold - 0.5)` | `integrity_breach` |
| Evidence stale | `age(evidence) > stalenessMs && evidenceCount > 0` | `stale_evidence` |

**Breaker state query:**

```javascript
function isTripped(events) {
  // Most recent event determines current state
  const sorted = [...events].sort(
    (a, b) => b.trippedAt.getTime() - a.trippedAt.getTime()
  );
  return sorted[0]?.triggered ?? false;
}
```

### 4.3 EIP-712 Signed Alignment Assertions

For on-chain enforcement, alignment assertions can be signed using EIP-712 typed data:

```json
{
  "types": {
    "AlignmentAssertion": [
      { "name": "claimId", "type": "string" },
      { "name": "verdict", "type": "uint8" },
      { "name": "breakerState", "type": "uint8" },
      { "name": "confidence", "type": "uint16" },
      { "name": "timestamp", "type": "uint256" }
    ]
  },
  "primaryType": "AlignmentAssertion",
  "domain": {
    "name": "VVU-IVE-ProofBridge",
    "version": "0.2.1",
    "chainId": 421614,
    "verifyingContract": "0x..."
  }
}
```

The watchdog agent signs these assertions and posts them to `VVUIVELedger.postVerdict()`, which enforces the fail-closed bound at the contract level.

### 4.4 On-Chain Trip via VVUIVELedger.sol

The `VVUIVELedger` contract enforces Theorem 5 at the smart contract layer:

```solidity
// Fail-closed bound (Theorem 5)
// Breaker TRIPPED ⇒ IVE cannot be PROVEN. Force to INCONCLUSIVE.
uint8 safeIveVerdict = _iveVerdict;
if (_breaker == BREAKER_TRIPPED && _iveVerdict == PROVEN) {
    safeIveVerdict = INCONCLUSIVE;
}
```

This means even if a compromised or buggy watchdog agent attempts to post `iveVerdict=PROVEN` while `breaker=TRIPPED`, the contract silently downgrades to `INCONCLUSIVE`. The chain does not trust the operator UI.

---

## 5. Webhook Infrastructure Specification

The webhook subsystem implements the VVU-IVE Reliability Contract v1.1: a Kafka-backed, circuit-breaker-protected event delivery system with at-least-once semantics.

### 5.1 Integration Points

**Stitch (via Svix):**
- HMAC-SHA256 signature verification
- Header: `X-VVU-Signature: sha256=<hex>`
- Staged secret rotation: `X-VVU-Signature-Next: sha256=<hex>`

**Paystack:**
- HMAC-SHA512 signature verification
- Header: `X-Paystack-Signature: <hex>`

### 5.2 Transport Layer

The transport layer is abstracted behind a factory pattern (`src/lib/webhook/transport/factory.js`):

```
WEBHOOK_TRANSPORT = "kafka" (default) | "memory" (fallback/dev)
```

**Kafka Transport:**

```
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA CLUSTER                             │
│                                                             │
│  Topic: vvu-webhook-delivery     (12 partitions, 3x repl.)  │
│  Topic: vvu-webhook-delivery-dlq (12 partitions, 3x repl.)  │
│  Topic: vvu-webhook-audit        (12 partitions, 3x repl.)  │
│                                                             │
│  Consumer Groups:                                           │
│    vvu-webhook-delivery-workers (12 active + 2 standby)     │
│    vvu-admin-audit-workers      (2 pods)                    │
│                                                             │
│  Config:                                                    │
│    min.insync.replicas = 2                                  │
│    acks = all                                               │
│    retention (main) = 7 days                                │
│    retention (DLQ) = 30 days                                │
└─────────────────────────────────────────────────────────────┘
```

**Memory Transport (fallback):**

In-process `Map`-based queue for development and testing. No persistence. Selected via `WEBHOOK_TRANSPORT=memory`.

### 5.3 Delivery Flow

```
  API Route                  Kafka                    Worker
     │                         │                         │
     │  POST /api/v1/webhooks  │                         │
     │  (publish event)        │                         │
     │────────────────────────►│                         │
     │                         │  consume(partition)     │
     │                         │────────────────────────►│
     │                         │                         │
     │                         │              ┌──────────┴──────────┐
     │                         │              │  checkBreaker()     │
     │                         │              │  ┌───────┐          │
     │                         │              │  │CLOSED │→ PROCEED │
     │                         │              │  │ OPEN  │→ SKIP    │
     │                         │              │  │HALF_  │→ 1 PROBE │
     │                         │              │  │ OPEN  │          │
     │                         │              │  └───────┘          │
     │                         │              └──────────┬──────────┘
     │                         │                         │
     │                         │              ┌──────────▼──────────┐
     │                         │              │  chargeRetry()     │
     │                         │              │  (budget check)    │
     │                         │              └──────────┬──────────┘
     │                         │                         │
     │                         │              ┌──────────▼──────────┐
     │                         │              │  deliverOnce()     │
     │                         │              │  POST + HMAC       │
     │                         │              │  30s timeout       │
     │                         │              └──────────┬──────────┘
     │                         │                         │
     │                         │              ┌──────────▼──────────┐
     │                         │              │  classify outcome   │
     │                         │              │  success/retryable/ │
     │                         │              │  non_retryable/     │
     │                         │              │  timeout/conn_fail  │
     │                         │              └──────────┬──────────┘
     │                         │                         │
     │                         │              ┌──────────▼──────────┐
     │                         │              │  recordResult()     │
     │                         │              │  update CB state    │
     │                         │              │  commit offset      │
     │                         │              └──────────┬──────────┘
     │                         │                         │
     │                         │         success │    failure │
     │                         │              │            │
     │                         │              ▼            ▼
     │                         │         DELIVERED     retry? ──► DLQ
     │                         │                                   (terminal)
```

### 5.4 Outbound HMAC Signing

Every outbound delivery is signed using HMAC-SHA256:

```javascript
async function hmacSha256(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
```

**Headers sent:**

```
Content-Type:       application/json
Idempotency-Key:    <delivery_id>
X-VVU-Signature:    sha256=<hex>
X-VVU-Signature-Next: sha256=<hex>   (only if nextSecret is set)
User-Agent:         VVU-IVE-Webhook/1.0 (+https://proofbridge-liner/vvu-ive)
```

### 5.5 Retry Budget Algorithm

The retry budget uses a token bucket to enforce a global retry ratio of 10%:

```
capacity = ceil(GLOBAL_CONCURRENCY × RATIO)  = ceil(100 × 0.1) = 10 tokens
refresh_rate = capacity / REFRESH_INTERVAL_MS = 10 / 60000 ≈ 0.000167 tokens/ms
```

```
┌──────────────────────────────────────────┐
│         RETRY BUDGET (Token Bucket)      │
│                                          │
│  capacity:    10 tokens                  │
│  refresh:     1 token every 6 seconds    │
│  ratio:       retries / total ≤ 0.10    │
│                                          │
│  chargeRetry() → token-- if available    │
│                  → false if exhausted    │
│  recordInitialAttempt() → totalRequests++│
└──────────────────────────────────────────┘
```

### 5.6 Retry Configuration

```
MAX_ATTEMPTS:      4     (1 initial + 3 retries)
BASE_DELAY_MS:     5000  (5 seconds)
BACKOFF_FACTOR:    5     (exponential)
MAX_DELAY_MS:      625000 (625 seconds ≈ 10.4 minutes)
JITTER:            full  (uniform randomization)
ATTEMPT_TIMEOUT:   30000 (30 seconds per attempt)

Delay sequence:  5s → 25s → 125s → 625s  (with full jitter)
```

**Full jitter formula:**

```
delay = floor(random() × min(BASE_DELAY × BACKOFF_FACTOR^retryIndex, MAX_DELAY))
```

**Outcome classification:**

| HTTP Status | Outcome | Retryable? |
|------------|---------|------------|
| 2xx | `success` | No |
| 400, 401, 403, 404, 405, 410, 422 | `non_retryable` | No |
| 408, 425, 429, 500, 502, 503, 504 | `retryable` | Yes |
| Connection failure | `connection_failure` | Yes |
| Timeout (30s) | `timeout` | Yes |

**429 Retry-After handling:** The `Retry-After` header is parsed (both seconds and HTTP-date formats) and used as the delay, capped at `MAX_DELAY_MS`.

### 5.7 Per-Webhook Circuit Breaker

```
State Machine:

  ┌───────────┐  10 terminal failures  ┌───────────┐  300s cooldown  ┌───────────┐
  │  CLOSED   │────────────────────────►│   OPEN    │────────────────►│ HALF_OPEN │
  │           │                        │           │                 │           │
  │ deliver   │◄─── probe success ──────│  SKIP all │──── probe fail ─►│ 1 probe   │
  │ normally  │    (reset counter)      │ events    │                 │ allowed   │
  └───────────┘                        └───────────┘                 └───────────┘
```

| Parameter | Value |
|-----------|-------|
| Scope | Per-webhook (NOT global) |
| Failure threshold | 10 consecutive terminal failures |
| Terminal failure definition | Event that exhausted all 4 delivery attempts |
| OPEN cooldown | 300 seconds (5 minutes) |
| HALF_OPEN probes | Exactly 1 |
| State transitions | All within `db.$transaction()` (atomic) |

**Critical:** Events skipped while CB is OPEN do NOT auto-retry when the breaker closes. They go to the DLQ and require manual replay.

### 5.8 Dead Letter Queue (DLQ)

```
┌──────────────────────────────────────────────────────────┐
│                    DEAD LETTER QUEUE                      │
│                                                          │
│  Retention:     30 days                                  │
│  Replay:        Manual only (POST /api/v1/webhooks/...) │
│  Auto-resume:   DISABLED (AUTO_REPLAY_ON_CB_CLOSE=false)│
│                                                          │
│  Entry reasons:                                          │
│    - exhausted_retries          (all 4 attempts failed) │
│    - circuit_breaker_open_skipped (CB was OPEN)         │
│    - non_retryable_error        (4xx client error)      │
│                                                          │
│  Each entry stores a full payload snapshot so replay     │
│  is possible even if the original WebhookDelivery is     │
│  purged.                                                │
└──────────────────────────────────────────────────────────┘
```

### 5.9 Immutable Event Ledger

Every delivery attempt, circuit breaker state transition, and DLQ event is recorded in the `AuditEvent` model by a separate admin worker consumer group (`vvu-admin-audit-workers`). This provides a redundant audit trail decoupled from the delivery path.

**Audit event types:**

- `delivery_attempted`
- `delivery_succeeded`
- `delivery_failed`
- `delivery_dlq`
- `delivery_skipped`
- `cb_state_change`
- `cb_replayed`

---

## 6. API Specification

All API routes are Next.js Route Handlers (plain JavaScript, no TypeScript). All routes with database access use `export const dynamic = "force-dynamic"` to disable static optimization.

### 6.1 Route Inventory (24 Routes)

#### Claims & Evidence (EIS Core)

| # | Method | Path | Handler | Description |
|---|--------|------|---------|-------------|
| 1 | GET | `/api/claims` | `claims/route.js` | List all claims with evidence, authorizations, circuit events, N-Ind records |
| 2 | POST | `/api/claims` | `claims/route.js` | Create a new claim (title required; defaults: `claimType=empirical`, `safetyCritical=true`) |
| 3 | GET | `/api/claims/[id]` | `claims/[id]/route.js` | Get single claim by ID with full relations |
| 4 | GET | `/api/evidence` | `evidence/route.js` | List evidence for a claim (`?claimId=...`) |
| 5 | POST | `/api/evidence` | `evidence/route.js` | Add evidence to a claim (single source or mesh query) |
| 6 | POST | `/api/verify` | `verify/route.js` | Recompute claim state from evidence lattice |
| 7 | POST | `/api/authorize` | `authorize/route.js` | Run full 5-conjunct authorization evaluation |
| 8 | POST | `/api/n-ind` | `n-ind/route.js` | Compute participation ratio for a claim |
| 9 | GET | `/api/n-ind?claimId=...` | `n-ind/route.js` | Get N-Ind computation history for a claim |
| 10 | POST | `/api/heat-kernel` | `heat-kernel/route.js` | Run heat kernel diffusion (cycle or evidence topology) |

#### Theorem State (System Verdict)

| # | Method | Path | Handler | Description |
|---|--------|------|---------|-------------|
| 11 | GET | `/api/theorem-state` | `theorem-state/route.js` | Get combined STUDI + IVE verdict, breaker state, confidence |
| 12 | PATCH | `/api/theorem-state/claims/[id]/breaker` | `theorem-state/claims/[id]/breaker/route.js` | Manually trip/reset EIS circuit breaker for a claim |
| 13 | POST | `/api/theorem-state/claims/[id]/authorize` | `theorem-state/claims/[id]/authorize/route.js` | Authorize a claim via theorem state pipeline |
| 14 | PATCH | `/api/theorem-state/gates/[slug]` | `theorem-state/gates/[slug]/route.js` | Update a STUDI gate status by slug |

#### STUDI Pipeline

| # | Method | Path | Handler | Description |
|---|--------|------|---------|-------------|
| 15 | POST | `/api/studi/interest` | `studi/interest/route.js` | Submit interest inception state |
| 16 | POST | `/api/studi/challenge` | `studi/challenge/route.js` | Run challenge scanner on a claim |

#### Webhook Management (v1)

| # | Method | Path | Handler | Description |
|---|--------|------|---------|-------------|
| 17 | GET | `/api/v1/webhooks` | `v1/webhooks/route.js` | List all registered webhooks |
| 18 | POST | `/api/v1/webhooks` | `v1/webhooks/route.js` | Register a new webhook endpoint |
| 19 | GET | `/api/v1/webhooks/[id]` | `v1/webhooks/[id]/route.js` | Get webhook details with delivery attempts and CB state |
| 20 | GET | `/api/v1/webhooks/[id]/dlq` | `v1/webhooks/[id]/dlq/route.js` | List DLQ entries for a webhook |
| 21 | POST | `/api/v1/webhooks/[id]/circuit-breaker/reset` | `v1/webhooks/[id]/circuit-breaker/reset/route.js` | Force-reset webhook circuit breaker to CLOSED |
| 22 | POST | `/api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry` | `v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry/route.js` | Manual DLQ replay |
| 23 | GET | `/api/v1/stats/webhooks` | `v1/stats/webhooks/route.js` | Webhook delivery statistics |

#### System

| # | Method | Path | Handler | Description |
|---|--------|------|---------|-------------|
| 24 | GET | `/api/state` | `state/route.js` | System health and configuration state |

### 6.2 Key Request/Response Schemas

**POST /api/claims**

```javascript
// Request
{
  "title": "Hydro-gateway CAD generation produces valid STEP files",  // required
  "description": "The Engine API generates ISO 10303-21 compliant STEP output",
  "claimType": "empirical",      // "mathematical" | "semantic" | "empirical" | "operational"
  "intendedAction": "deploy",     // default: "deploy"
  "safetyCritical": true          // default: true
}

// Response (201)
{
  "claim": {
    "id": "clx...",
    "title": "...",
    "description": "...",
    "claimType": "empirical",
    "state": "UNTESTED",
    "intendedAction": "deploy",
    "safetyCritical": true,
    "createdAt": "2025-07-12T...",
    "updatedAt": "2025-07-12T..."
  }
}
```

**POST /api/authorize**

```javascript
// Request
{
  "claimId": "clx...",          // required
  "safetyOverride": false,      // optional
  "reviewSignedOff": false      // optional
}

// Response (200)
{
  "claimOk": true,              // C: claim state ≥ SUPPORTED
  "evidenceOk": true,           // E: ≥2 sources or ≥3 items
  "integrityOk": true,          // I: N_ind ≥ threshold
  "safetyOk": false,            // S: SafeGrid clearance
  "reviewOk": false,            // R: reviewer signoff
  "authorized": false,          // A = C ∧ E ∧ I ∧ S ∧ R
  "reason": "A = C∧E∧I∧S∧R = false — failed: safety clearance missing",
  "id": "auth_...",
  "claimId": "clx...",
  "claimState": "SUPPORTED",
  "nInd": {
    "nInd": 2.5,
    "numEvidence": 4,
    "numSources": 3,
    "gamma": 1.234,
    "eigenvalues": [3.2, 0.8, 0.1, 0.0]
  },
  "createdAt": "..."
}
```

**GET /api/theorem-state**

```javascript
// Response (200)
{
  "studiVerdict": "PROVEN",        // UNKNOWN | INCONCLUSIVE | PROVEN
  "iveVerdict": "INCONCLUSIVE",   // UNKNOWN | INCONCLUSIVE | PROVEN
  "breaker": "TRIPPED",           // NORMAL | TRIPPED
  "confidence": 0.65,             // authorizedClaims / totalClaims
  "studiGates": [/* ... */],
  "iveClaims": [/* ... */],
  "iveSummary": {
    "totalClaims": 5,
    "authorizedClaims": 3,
    "breaker": "TRIPPED"
  },
  "evidenceBound": "Claim ≤ Evidence ≤ Verification ≤ Authorization ≤ Action",
  "theorem": "EIS Theorem 5 — loss of evidence ⇒ loss of verification ⇒ loss of authorization ⇒ breaker trips ⇒ action blocked",
  "lastUpdatedAt": "2025-07-12T..."
}
```

**POST /api/v1/webhooks**

```javascript
// Request
{
  "name": "ProofBridge Production Callback",  // required
  "url": "https://callback.example.com/webhook",  // required, must be http(s)
  "type": "proofbridge",    // "proofbridge" | "github" | "discord" | "custom"
  "secret": "whsec_...",    // HMAC shared secret
  "enabled": true            // default: true
}

// Response (201)
{
  "id": "wh_...",
  "name": "ProofBridge Production Callback",
  "url": "https://callback.example.com/webhook",
  "type": "proofbridge",
  "secret": "whsec_...",
  "nextSecret": "",
  "enabled": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 6.3 Error Handling Pattern

All routes follow a consistent error handling pattern:

```javascript
// 400 — Bad Request (missing/invalid fields)
return NextResponse.json({ error: "title is required" }, { status: 400 });

// 404 — Not Found
return NextResponse.json({ error: "claim not found" }, { status: 404 });

// 500 — Internal Server Error
return NextResponse.json(
  { error: err instanceof Error ? err.message : "Unknown" },
  { status: 500 }
);
```

### 6.4 Authentication & Authorization Model

The current implementation does not enforce authentication on API routes. The security model relies on:

1. **Network-level isolation:** Caddy reverse proxy with HSTS, X-Content-Type-Options, X-Frame-Options headers
2. **Smart contract role-based access:** `VVUSovereignRegistry.sol` enforces `onlyAuditor` and `onlySovereign` modifiers
3. **HMAC webhook verification:** Outbound payloads are signed; inbound payloads from Stitch/Paystack are verified

RBAC is planned (see Section 8.4) but not yet implemented at the API route level.

### 6.5 Rate Limiting

Rate limiting is not currently deployed at the API route level. The webhook subsystem implements rate limiting through:

- **Retry budget:** Global 10% retry ratio (token bucket)
- **Per-webhook concurrency:** 1 (strict ordering via Kafka partition key = webhook_id)
- **Global concurrency cap:** 100 simultaneous outbound HTTP connections
- **Per-attempt timeout:** 30 seconds

---

## 7. Data Model (Prisma Schema)

### 7.1 Entity-Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│     Claim        │ 1───* │    Evidence      │
│──────────────────│       │──────────────────│
│ id (PK, cuid)    │       │ id (PK, cuid)    │
│ title            │       │ claimId (FK)     │──► Claim
│ description      │       │ source           │
│ claimType        │       │ content          │
│ state            │       │ embedding        │ (JSON number[])
│ intendedAction   │       │ weight           │
│ safetyCritical   │       │ state            │
│ createdAt        │       │ collectedAt      │
│ updatedAt        │       └──────────────────┘
│                  │
│                  │ 1───* │  Authorization   │
│                  │       │──────────────────│
│                  │       │ id (PK, cuid)    │
│                  │       │ claimId (FK)     │──► Claim
│                  │       │ claimOk (C)      │
│                  │       │ evidenceOk (E)   │
│                  │       │ integrityOk (I)  │
│                  │       │ safetyOk (S)     │
│                  │       │ reviewOk (R)     │
│                  │       │ authorized (A)   │
│                  │       │ reason           │
│                  │       │ createdAt        │
│                  │       └──────────────────┘
│                  │
│                  │ 1───* │ CircuitBreaker   │
│                  │       │──────────────────│
│                  │       │ id (PK, cuid)    │
│                  │       │ claimId (FK)     │──► Claim
│                  │       │ triggered        │
│                  │       │ reason           │
│                  │       │ trippedAt        │
│                  │       └──────────────────┘
│                  │
│                  │ 1───* │ NIndComputation  │
│                  │       │──────────────────│
│                  │       │ id (PK, cuid)    │
│                  │       │ claimId (FK)     │──► Claim
│                  │       │ numEvidence      │
│                  │       │ numSources       │
│                  │       │ nInd             │
│                  │       │ gamma            │
│                  │       │ eigenvalues      │ (JSON number[])
│                  │       │ createdAt        │
│                  │       └──────────────────┘
└──────────────────┘

┌──────────────────┐       ┌──────────────────────┐
│     Webhook      │ 1───* │  WebhookDelivery    │
│──────────────────│       │──────────────────────│
│ id (PK, cuid)    │       │ id (PK, cuid)       │
│ name             │       │ webhookId (FK)      │──► Webhook
│ url              │       │ eventId             │
│ type             │       │ payload             │ (JSON)
│ secret           │       │ status              │
│ nextSecret       │       │ statusReason        │
│ enabled          │       │ kafkaPartition      │
│ createdAt        │       │ kafkaOffset         │
│ updatedAt        │       │ createdAt           │
│                  │       │ updatedAt           │
│                  │ 1──0-1│                     │
│                  │       │       WebhookCircuit │
│                  │       │       BreakerState  │
│                  │       │──────────────────────│
│                  │       │ id (PK, cuid)       │
│                  │       │ webhookId (FK, UQ)  │──► Webhook
│                  │       │ state               │ CLOSED|OPEN|HALF_OPEN
│                  │       │ terminalFailureCount│
│                  │       │ openedAt            │
│                  │       │ halfOpenProbeAt     │
│                  │       │ halfOpenProbeResult │
│                  │       │ updatedAt           │
│                  │       └──────────────────────┘
└──────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│  WebhookDelivery    │ 1───* │ WebhookDeliveryAttempt│
│──────────────────────│       │──────────────────────│
│                      │       │ id (PK, cuid)       │
│                      │       │ deliveryId (FK)     │──► WebhookDelivery
│                      │       │ attemptNumber       │ 1..4
│                      │       │ httpStatus          │
│                      │       │ outcome             │ success|retryable|...
│                      │       │ responseBody        │ (truncated 2KB)
│                      │       │ delayMs             │
│                      │       │ startedAt           │
│                      │       │ finishedAt          │
│                      │       └──────────────────────┘
│                      │
│                      │ 0──* │ DeadLetterQueueEntry │
│                      │       │──────────────────────│
│                      │       │ id (PK, cuid)       │
│                      │       │ deliveryId (FK,nullable)│
│                      │       │ webhookId           │
│                      │       │ eventId             │
│                      │       │ reason              │ exhausted_retries|...
│                      │       │ finalHttpStatus     │
│                      │       │ payload             │ (snapshot)
│                      │       │ replayedBy          │
│                      │       │ replayedAt          │
│                      │       │ createdAt           │
│                      │       └──────────────────────┘
└──────────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   StudiGate      │       │   AuditEvent     │
│──────────────────│       │──────────────────│
│ id (PK, cuid)    │       │ id (PK, cuid)    │
│ slug (UQ)        │       │ type              │
│ label            │       │ webhookId         │
│ description      │       │ deliveryId        │
│ status           │       │ attemptId         │
│ note             │       │ details           │ (JSON)
│ order            │       │ createdAt         │
│ updatedAt        │       └──────────────────┘
│ createdAt        │
└──────────────────┘
```

### 7.2 Model Summary

| Model | Purpose | Key Constraints |
|-------|---------|----------------|
| `Claim` | Proposition to be verified | Indexes on `state`, `claimType` |
| `Evidence` | Observation supporting a claim | FK → Claim (CASCADE delete), indexes on `claimId`, `source` |
| `Authorization` | 5-conjunct evaluation record | FK → Claim (CASCADE delete), indexes on `claimId`, `authorized` |
| `CircuitBreaker` | EIS fail-closed event log | FK → Claim (CASCADE delete), indexes on `claimId`, `triggered` |
| `NIndComputation` | Participation ratio record | FK → Claim (CASCADE delete), index on `claimId` |
| `HeatKernelStep` | Diffusion trace (evidence smoothing) | Index on `claimId` |
| `Webhook` | Registered external endpoint | Index on `enabled` |
| `WebhookSecretAudit` | Secret rotation history (hashes only) | Indexes on `webhookId`, `rotatedAt` |
| `WebhookDelivery` | One logical event to deliver | FK → Webhook (CASCADE), indexes on `webhookId`, `status`, `eventId` |
| `WebhookDeliveryAttempt` | One HTTP attempt for a delivery | FK → WebhookDelivery (CASCADE), indexes on `deliveryId`, `outcome` |
| `WebhookCircuitBreakerState` | Per-webhook CB state | FK → Webhook (CASCADE), `webhookId` UNIQUE |
| `DeadLetterQueueEntry` | Failed/undeliverable events | FK → WebhookDelivery (SET NULL), indexes on `webhookId`, `reason`, `deliveryId` |
| `AuditEvent` | Immutable audit trail | Indexes on `type`, `webhookId`, `deliveryId`, `createdAt` |
| `StudiGate` | Corporate governance gate | `slug` UNIQUE, index on `status` |

### 7.3 Database

- **Engine:** SQLite (via Prisma)
- **Connection:** `DATABASE_URL` environment variable
- **Migrations:** `prisma db push --accept-data-loss` (current), `prisma migrate dev` (available)

---

## 8. Security Model

### 8.1 HMAC Verification for Webhooks

**Outbound (VVU → External):**

All outbound webhook deliveries are signed with HMAC-SHA256 using the webhook's shared secret:

```
X-VVU-Signature: sha256=<hex_digest_of_HMAC-SHA256(secret, payload_body)>
```

During secret rotation, both the current and next secret are used:

```
X-VVU-Signature:     sha256=<HMAC(current_secret, payload)>
X-VVU-Signature-Next: sha256=<HMAC(next_secret, payload)>
```

The receiving system validates against either header during the migration window.

**Inbound (External → VVU):**

- **Stitch/Svix:** HMAC-SHA256 via `X-VVU-Signature` header
- **Paystack:** HMAC-SHA512 via `X-Paystack-Signature` header

### 8.2 EIP-712 Signature Verification

On-chain state transitions require EIP-712 typed data signatures. The `VVUIVELedger` contract enforces role-based access through `OPERATOR_ROLE` and `ADMIN_ROLE`:

```
Only the OPERATOR role may call postVerdict().
Only the ADMIN role may call grantOperator() or renounceAdmin().
The ADMIN is the contract deployer by default.
```

### 8.3 Fail-Closed Design Principle

The fail-closed principle is the foundational security invariant. It states:

> **When in doubt, block. When evidence is lost, revoke. When verification fails, deny.**

This is implemented at six layers (see Section 4.2):

```
Layer 1 (Worker):   intentWorker.js — 5-conjunct hazard wall, threshold 0.85
Layer 2 (UI):       evolution-matrix.jsx — ghost stage cap under breaker
Layer 3 (Server):   computeIveVerdict() — INCONCLUSIVE if any breaker tripped
Layer 4 (IVE S.C.):  VVUIVELedger.sol — refuses PROVEN when TRIPPED
Layer 5 (Sov. S.C.): VVUSovereignRegistry.sol — revokes on failed audit
Layer 6 (Deploy):    dormant-deploy — paused=true until activated
```

### 8.4 RBAC Model (Planned)

The VVU Governance Charter v1.0 defines three operational tiers:

| Tier | Name | Access Scope |
|------|------|-------------|
| III | Municipal | System administrators, infrastructure engineers — granular, role-based operational access |
| II | Provincial | Faculty-based operational management — coordinate resources, supervise Tier III |
| I | National | Council of the Company — strategic deployment oversight |

The smart contracts implement a subset:

- `federalAuditor`: Automated Watchdog node — can anchor telemetry only
- `sovereignAuthority`: Federal multi-sig — can mint clearances and activate/deactivate contract
- `OPERATOR_ROLE`: Can post verdicts to IVE Ledger
- `ADMIN_ROLE`: Can manage operator roles and transfer admin

API-level RBAC enforcement is planned but not yet implemented.

---

## 9. Smart Contracts

### 9.1 VVUIVELedger.sol — On-Chain Verdict Anchor

**Purpose:** Anchors the IVE verdict on-chain so external systems can verify the valve's state without trusting the operator UI.

**Storage Layout:**

```
studiVerdict:  UNKNOWN=0, INCONCLUSIVE=1, PROVEN=2
iveVerdict:    same encoding
breaker:       NORMAL=0, TRIPPED=1
confidence:    basis-points 0..10000 (5000 = 50%)
lastUpdatedAt: unix-seconds
```
**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `postVerdict(studi, ive, breaker, confidence)` | OPERATOR | Post current verdict; enforces fail-closed bound |
| `getVerdict()` | Public (view) | Returns full verdict tuple |
| `grantOperator(account)` | ADMIN | Grant OPERATOR_ROLE |
| `renounceAdmin(newAdmin)` | ADMIN | Transfer admin (no zero-address) |

**Fail-Closed Bound:**

```solidity
if (_breaker == BREAKER_TRIPPED && _iveVerdict == PROVEN) {
    safeIveVerdict = INCONCLUSIVE;
}
```

### 9.2 VVUSovereignRegistry.sol — Sovereign Clearance Registry

**Purpose:** Sovereign-grade clearance registry with fail-closed guarantees for the sovereign track.

**Roles:**

- `federalAuditor` (set in constructor = deployer): Automated Watchdog node, can anchor telemetry only
- `sovereignAuthority` (set in constructor): Federal multi-sig, can mint clearances and activate/deactivate

**Struct:**

```solidity
struct NationalSecurityClearance {
    bytes32 clearanceLevel;      // e.g. keccak256("TS/SCI")
    bytes32 executionTraceHash;  // hash of execution trace
    uint256 authorizationTime;   // block.timestamp of issuance
    bool active;                 // false if revoked
}
```

**Fail-Closed Guarantees (Theorem 5 — contract layer):**

1. `issueSovereignSBT` refuses to mint if `executionTraceHash == bytes32(0)` (no telemetry anchored)
2. `issueSovereignSBT` refuses to mint if operative already has active clearance (no double-minting)
3. `anchorSovereignTelemetry` with `passed=false` immediately revokes any active clearance
4. Dormant-deploy: contract ships `paused = true`; no state-changing function is callable until `activate(gitCommitHash)`

**Events:**

```
TelemetryAudited(address operative, bytes32 traceHash, bool passed)
ClearanceMinted(address operative, bytes32 clearanceLevel)
ClearanceRevoked(address operative)
ContractActivated(bytes32 gitCommitHash, uint256 timestamp)
ContractDeactivated(uint256 timestamp)
```

### 9.3 Dormant-Deploy Pattern

All sovereign contracts ship in a dormant state:

```
┌──────────────┐     activate(gitCommitHash)     ┌──────────────┐
│   DORMANT    │─────────────────────────────────►│    LIVE      │
│ paused=true │     (sovereignAuthority only)     │ paused=false │
│              │                                  │              │
│ Reads: OK    │                                  │ Reads: OK    │
│ Writes: REVERT│                                  │ Writes: OK   │
└──────────────┘     deactivate()                └──────────────┘
                         │
                         └─────────────────────────► DORMANT (re-paused)
```

This allows the contract to be deployed to multiple testnets in advance and only "go live" once the AMD MI300x GPU pipeline has verified the latest git sync and posted the activation transaction. The `gitCommitHash` is recorded on-chain for audit.

### 9.4 Dual-Network Deployment

```
┌─────────────────────────────────────────────────┐
│               ARBITRUM SEPOLIA                   │
│              (Chain ID: 421614)                  │
│  ┌─────────────────────────────────────────┐    │
│  │ VVUSovereignRegistry                    │    │
│  │ VVUIVELedger                            │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│               POLYGON AMOY                      │
│              (Chain ID: 80002)                   │
│  ┌─────────────────────────────────────────┐    │
│  │ VVUSovereignRegistry                    │    │
│  │ VVUIVELedger                            │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

Redundant anchoring: the same contract bytecode is deployed to both Arbitrum Sepolia (L2 rollup anchored to Ethereum Sepolia) and Polygon Amoy (testnet anchored to Ethereum Sepolia). Production targets are Arbitrum Mainnet (42161) and Polygon Mainnet (137).

**Solidity version:** 0.8.20 (with optimizer, 200 runs)

---

## 10. VVU Ecosystem Integration

### 10.1 Three-Layer Architecture

ProofBridge Liner is Layer 3 of the VVU ecosystem:

```
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 1 — SafeKrypte                                                │
│ Layer 1 cryptocurrency: asset tokenization, wallet infrastructure,  │
│ on-chain value settlement                                           │
│                                                                      │
│   Tokens ←→ Wallets ←→ Settlement ←→ On-chain ledger               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ credentials, identity proofs
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 2 — SafeLiner                                                │
│ Layer 2 credentials: KYC/AML, credential issuance,                  │
│ verifiable credentials, identity layer                              │
│                                                                      │
│   KYC ←→ Credentials ←→ DIDs ←→ Verifiable Presentations          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ compliance requirements, verification mandates
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LAYER 3 — ProofBridge Liner (this system)                           │
│ Layer 3 compliance: IVE, EIS, STUDI, circuit breakers,             │
│ on-chain verdict anchoring, webhook delivery                        │
│                                                                      │
│   Claims ←→ Evidence ←→ Verification ←→ Authorization ←→ Action   │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Governance Structure

**Dual-Class Share Structure:**

| Class | Voting Power | Holders | Purpose |
|-------|-------------|---------|---------|
| Class A | 20 votes/share | Founder (Mihle Majokweni) | Strategic control, constitutional immunity enforcement |
| Class B | 1 vote/share | Community, employees, external investors | Economic participation, democratic governance |

**Founder Control Invariant:**

```
Founder ownership ≥ 70.67% of voting power

This ensures:
  - The Constitutional Immunities (Article I, §1.3 of the Governance Charter) cannot be amended
  - The Epistemic Core (Article VI) cannot be captured by external interests
  - Slim Shady (adversarial testing) cannot be defunded by shareholder vote
```

**Governance Charter Key Provisions:**

1. **Three Constitutional Immunities:** Epistemic, Judicial, Access — no shareholder vote may override
2. **Five Branches:** Shareholders, Strategic Council, Executive (CEO), Independent Board, Ethics & Access Tribunal
3. **Epistemic Core:** A separate category of institution that governs *claims and evidence*, not people
4. **Two Independent Gates:** Epistemic (IVE) + Constitutional (Governance) — neither can impersonate the other
5. **Constitutional Invariant:** "Governance can decide what VVU should do; governance cannot decide that an invalid proof is valid"
6. **M0 Doctrine-Lint:** Machine-checkable sentinel detecting category errors between truth, authority, and execution

---

## 11. HBK MK-II Hydro-Gateway Case Study

The HBK MK-II Hydro-Gateway demonstrates the IVE verification pipeline applied to a physical AI system — an AI-driven hydro-electric gateway control system.

### 11.1 System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HBK MK-II HYDRO-GATEWAY                         │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Zookeeper   │  │    Engine    │  │ File Format  │               │
│  │  (Agent API) │  │ (Engine API) │  │    (STEP)    │               │
│  │              │  │              │  │              │               │
│  │ - Agent      │  │ - CAD        │  │ - ISO 10303  │               │
│  │   management │  │   generation │  │   -21 export │               │
│  │ - Task       │  │ - Parameter  │  │ - Validation │               │
│  │   orchestration│ │   control   │  │   against    │               │
│  │ - Status     │  │ - Simulation │  │   schema     │               │
│  │   monitoring │  │   runs       │  │              │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                  │                  │                       │
│         └──────────────────┼──────────────────┘                       │
│                            │                                          │
│                   ┌────────▼────────┐                                 │
│                   │  Physical AI    │                                 │
│                   │  Control System │                                 │
│                   │  (Gate Actuator) │                                 │
│                   └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Zoo APIs

**Agent API (Zookeeper):**

Manages AI agents that monitor and control the hydro-gateway. Provides agent lifecycle management, task orchestration, and real-time status monitoring.

**Engine API (CAD Generation):**

Generates CAD models of hydro-gateway components. Parameters control gate dimensions, material properties, and flow characteristics. The Engine API produces design artifacts that are verified through the IVE pipeline.

**File Format API (STEP Export):**

Exports CAD models to ISO 10303-21 (STEP) format for interoperability with downstream manufacturing and simulation systems. Validates output against the STEP application protocol schema.

### 11.3 IVE Verification Pipeline for HBK

The HBK MK-II verification pipeline demonstrates all EIS components working together:

```
1. CLAIM FILED
   "The Engine API generates STEP files that pass ISO 10303-21 schema validation"
   claimType: operational
   safetyCritical: true

2. EVIDENCE COLLECTION (Evidence Mesh)
   - watchdog:  Runtime observation confirms 100/100 STEP exports pass validation
   - firecrawl: Deep-scraped ISO 10303-21 spec confirms schema compliance
   - brave:    Independent verification from CAD interoperability test suite
   - you.com:  Aggregated search results corroborate STEP export reliability

3. N-IND COMPUTATION
   embeddings from 4 distinct sources
   γ = 1/median(||v_i - v_j||²)
 N_ind = (∑λ_i)² / ∑λ_i²  →  expected: ~3.5 (high independence)

4. STATE LATTICE EVALUATION
   state(c) = ⊔ {OBSERVED, OBSERVED, OBSERVED, OBSERVED}
           = OBSERVED  (capped by operational type ceiling)

5. HEAT KERNEL SMOOTHING
   Evidence weights smoothed on complete graph Laplacian
   retention > 0.95  (minimal information loss)

6. AUTHORIZATION
   C: OBSERVED ≥ SUPPORTED? NO  → claimOk = false
   E: 4 items, 4 sources    → evidenceOk = true
   I: N_ind = 3.5 ≥ 1.7    → integrityOk = true
   S: safetyOverride?        → safetyOk = false (pending)
   R: reviewSignedOff?      → reviewOk = false (pending)

   A = false ∧ true ∧ true ∧ false ∧ false = false

   REASON: Claim state OBSERVED < SUPPORTED; safety clearance missing;
           reviewer signoff missing

7. SAFETY-CRITICAL HOLD
   Operational claims are capped at OBSERVED.
   Safety-critical claims require explicit safetyOverride + reviewSignedOff.
   This is the fail-closed design: the gate does not open automatically.
```

---

## 12. Performance & Scalability

### 12.1 Current Benchmarks

| Metric | Value | Notes |
|--------|-------|-------|
| Eigenvalue decomposition (Jacobi) | < 10ms | For n ≤ 50 evidence items, 100 sweeps max |
| Heat kernel diffusion (128 nodes, 50 steps) | < 50ms | Cycle graph, κ=0.25 |
| Claim state re-computation | < 5ms | Lattice join over evidence states |
| Authorization evaluation | < 5ms | 5 boolean conjuncts + N-Ind lookup |
| Theorem state aggregation | < 100ms | Full DB scan of claims + gates + auth + CB |
| SQLite single-row read | < 1ms | Via Prisma, local file database |
| Webhook HMAC-SHA256 signing | < 1ms | Web Crypto API, 20-byte key |

### 12.2 Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| **SQLite single-writer** | No concurrent writes; all DB ops serialize | Sufficient for current single-instance deployment; migrate to PostgreSQL for horizontal scaling |
| **In-process eigenvalue solver** | O(n³) per sweep, max 100 sweeps; not suitable for n > 100 | Acceptable for evidence verification (typical n < 50); integrate LAPACK for larger matrices if needed |
| **Synthesized embeddings** | Current implementation uses deterministic hash-based PRNG rather than real embedding models | Designed for reproducibility during development; production integration with real embedding models (e.g., sentence-transformers) planned |
| **No API authentication** | All routes publicly accessible | Network-level isolation via Caddy; RBAC implementation planned |
| **No API rate limiting** | Vulnerable to abuse | Webhook subsystem has retry budget; API rate limiting planned |
| **Memory transport stateless** | In-memory queue lost on process restart | Only for development; production uses Kafka |
| **Single-instance deployment** | No horizontal scaling | Sufficient for current load; Kubernetes manifests exist for future scaling |
| **Challenge scanner is regex-based** | Limited to linguistic pattern matching, no semantic understanding | Adequate as a first-pass adversarial filter; LLM-based analysis planned for deeper challenge detection |

### 12.3 Scaling Considerations

**Database:**

```
Current:  SQLite (single file, single writer)
Target:   PostgreSQL (concurrent writes, connection pooling, full-text search)

Migration path:
  1. Change Prisma datasource provider: sqlite → postgresql
  2. Update DATABASE_URL to PostgreSQL connection string
  3. Run prisma migrate dev to generate PostgreSQL-specific migrations
  4. Update indexes for PostgreSQL query planner
```

**Message Broker:**

```
Current:  Kafka (12 partitions, 3x replication)
Scale:    Add partitions (up to partition key cardinality = number of webhooks)
          Add consumer instances (up to partition count for parallelism)
          Partition rebalancing is automatic via Kafka consumer group protocol
```

**Compute:**

```
Current:  Single Next.js instance (Node.js/Bun runtime)
Scale:    Kubernetes Deployment (manifests exist in k8s/)
          - vvu-ive-worker-deployment.yaml
          - envoy-deployment.yaml (Envoy sidecar for L7 routing)
          - vvu-ive-worker-netpol.yaml (network policies)
```

**Smart Contracts:**

```
Current:  Arbitrum Sepolia + Polygon Amoy (testnets)
Target:   Arbitrum Mainnet + Polygon Mainnet
          Gas optimization via Hardhat optimizer (200 runs)
          Dual-network redundancy for sovereign anchoring
```

---

## Appendix A: Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite connection string |
| `WEBHOOK_TRANSPORT` | `kafka` | Transport kind: `kafka` or `memory` |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker addresses |
| `DEPLOYER_PRIVATE_KEY` | — | Ethereum private key for contract deployment |
| `ARBISCAN_API_KEY` | — | Arbiscan API key for contract verification |
| `POLYGONSCAN_API_KEY` | — | Polygonscan API key for contract verification |

## Appendix B: Script Reference

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `bun dev` | Next.js dev server on port 3000 |
| Production | `bun start` | Production server (standalone output) |
| Webhook worker | `bun webhook:worker` | Kafka delivery consumer |
| Admin worker | `bun webhook:admin` | Audit/consumer group worker |
| Create topics | `bun webhook:create-topics` | Initialize Kafka topics |
| Rotate secret | `bun webhook:rotate-secret` | HMAC secret rotation |
| Watchdog | `bun watchdog` | Theorem state poller → on-chain anchor |
| Hardhat compile | `bun hardhat:compile` | Compile Solidity contracts |
| DB push | `bun db:push` | Push Prisma schema to SQLite |
| DB generate | `bun db:generate` | Generate Prisma client |

## Appendix C: License

```
ProofBridge Liner — Integrated Verification Environment (IVE)
Copyright (c) 2025 Vaguely Vanity (Pty) Ltd (RF), trading as Venture Vision Ubuntu (VVU)
CIPC: 2026/259053/07
Founder: Mihle Majokweni

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
```

---
*End of Specification.*
