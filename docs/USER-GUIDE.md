# ProofBridge Liner — User Guide

**Integrated Verification Environment for Physical AI Systems**

Version 0.2.1 | License: AGPL-3.0

---

| |
|---|
| **Company** | Vaguely Vanity (Pty) Ltd (RF), trading as Venture Vision Ubuntu |
| **CIPC** | 2026/259053/07 |
| **Founder** | Mihle Majokweni |
| **Live URL** | [proofbridge.venturevisionubuntu.co.za](https://proofbridge.venturevisionubuntu.co.za) |
| **Repository** | [github.com/divhanimajokweni-ctrl/proofbridge-liner](https://github.com/divhanimajokweni-ctrl/proofbridge-liner) |

---

## Table of Contents

1. [Introduction & Overview](#1-introduction--overview)
2. [Getting Started](#2-getting-started)
3. [The IVE Workspace](#3-the-ive-workspace)
4. [The STUDI Workspace](#4-the-studi-workspace)
5. [EIS Mathematical Framework](#5-eis-mathematical-framework)
6. [Webhook Infrastructure](#6-webhook-infrastructure)
7. [HBK MK-II Case Study](#7-hbk-mk-ii-case-study)
8. [Configuration & Customization](#8-configuration--customization)
9. [API Reference](#9-api-reference)
10. [Troubleshooting](#10-troubleshooting)
11. [Contributing](#11-contributing)

---

## 1. Introduction & Overview

### What ProofBridge Liner Does

ProofBridge Liner is an open-source **Integrated Verification Environment (IVE)** for physical AI systems. It provides a mathematically rigorous framework for verifying engineering claims about real-world systems — from pressure-rated valves to autonomous vehicles — using evidence-driven state machines, temporal decay functions, and independence measures.

The system answers a single question: **"Should this engineering claim be authorized for execution?"**

It does this by:

- Accepting claims about physical systems (e.g., "This valve assembly withstands 10 bar")
- Collecting evidence from multiple independent sources
- Scoring that evidence using the Evidence Independence Specification (EIS)
- Tracking claims through a state lattice until they meet the authorization threshold
- Tripping a circuit breaker if verification integrity is compromised
- Notifying external systems via a reliable webhook infrastructure

ProofBridge Liner is **Layer 3** of the VVU ecosystem:

```
Layer 1: SafeKrypte        — Cryptographic primitives
Layer 2: SafeLiner         — Credentials and identity
Layer 3: ProofBridge Liner — Compliance and verification  (this project)
```

### Who It Is For

| Audience | How They Use ProofBridge Liner |
|---|---|
| **Researchers** | Explore the EIS mathematical framework, test hypotheses with the participation ratio and heat kernel, publish verified claims |
| **Engineers** | Submit claims about physical systems, attach test data as evidence, track verification state through the lattice |
| **Governance Teams** | Monitor the STUDI 5-gate roadmap, review authorization decisions, ensure regulatory compliance before release |
| **System Operators** | Manage webhooks, monitor circuit breakers, replay failed deliveries from the DLQ |

### IVE vs STUDI Workspaces

ProofBridge Liner provides two distinct workspaces:

**IVE (Integrated Verification Environment)** is the engineering workspace. Use it when you need to:

- Submit and verify engineering claims
- Attach evidence and compute EIS scores
- Track claim state through the verification lattice
- Evaluate authorization (A = C ∧ E ∧ I ∧ S ∧ R)
- Monitor circuit breaker status

**STUDI (Strategic Underwriting)** is the commercial workspace. Use it when you need to:

- Track the 5-gate roadmap from Foundation to IPO
- Run adversarial challenges against claims
- Manage interest inception and commercial viability
- Review governing documents and corporate compliance
- Edit gate statuses and financial projections

Both workspaces share the same underlying data. A claim verified in the IVE workspace becomes the input to STUDI's commercial underwriting process.

---

## 2. Getting Started

### Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| **Bun** | v1.0+ | Primary runtime. Install from [bun.sh](https://bun.sh/) |
| **Node.js** | 18+ | Required by Next.js. Bun satisfies this natively |
| **Git** | Any recent version | For cloning the repository |
| **Docker** (optional) | 20+ | Only needed if running Kafka locally |

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation Steps

**Step 1 — Clone the repository**

```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner
```

**Step 2 — Install dependencies**

```bash
bun install
```

This installs Next.js 16, Prisma, Tailwind CSS 4, shadcn/ui, Zustand, Framer Motion, and all other dependencies.

**Step 3 — Configure environment variables**

Create a `.env.local` file in the project root:

```bash
cat > .env.local << 'EOF'
# Database (SQLite for development)
DATABASE_URL="file:./db/dev.db"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Webhook transport ("memory" for dev without Kafka, "kafka" for production)
WEBHOOK_TRANSPORT="memory"
EOF
```

See [Section 8](#8-configuration--customization) for the full environment variable reference.

**Step 4 — Set up the database**

```bash
# Generate the Prisma client
bun run db:generate

# Push the schema to SQLite (creates the database file)
bun run db:push
```

This creates `prisma/db/dev.db` (or the path specified in `DATABASE_URL`) with all required tables.

**Step 5 — (Optional) Seed sample data**

```bash
curl -X POST http://localhost:3000/api/seed
```

This populates the database with sample claims, evidence, and STUDI gates for exploration.

**Step 6 — Start the development server**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The server runs with hot module replacement (HMR) on port 3000. Logs are written to both stdout and `dev.log`.

### Production Build & Deploy

**Step 1 — Build the application**

```bash
bun run build
```

This produces a standalone Next.js server in `.next/standalone/` with static assets copied in.

**Step 2 — Start the production server**

```bash
bun run start
```

The server starts on port 3000 in production mode. Logs are written to `server.log`.

**Step 3 — Deploy with Caddy (recommended)**

A `Caddyfile` is included in the repository. Adjust the domain and root path, then:

```bash
caddy run
```

**Step 4 — Deploy with Kubernetes**

Kubernetes manifests are in the `k8s/` directory:

```bash
kubectl apply -f k8s/
```

See `k8s/deploy.sh` for the full deployment script.

**Step 5 — Start background workers (production)**

If using the webhook subsystem with Kafka:

```bash
# Terminal 1: Webhook delivery workers
bun run webhook:worker

# Terminal 2: Admin/audit workers
bun run webhook:admin

# Terminal 3: Watchdog process
bun run watchdog:prod
```

### Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with HMR on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database (destroys all data) |
| `bun run webhook:worker` | Start webhook delivery worker |
| `bun run webhook:admin` | Start webhook admin worker |
| `bun run webhook:create-topics` | Create Kafka topics (idempotent) |
| `bun run webhook:rotate-secret` | Rotate a webhook's HMAC secret |
| `bun run watchdog` | Start the watchdog process (dev mode) |
| `bun run watchdog:prod` | Start the watchdog process (production) |

---

## 3. The IVE Workspace

The IVE workspace is the core verification environment. It is the place where engineering claims are submitted, evidence is attached, EIS scores are computed, and authorization decisions are made.

### 3.1 Creating and Submitting Claims

A **claim** is a proposition about a physical system that requires verification. Examples:

- "The HBK MK-II valve assembly withstands 10 bar operating pressure"
- "The M12 mounting bolts maintain torque under vibration"
- "The fluid seal material is rated for continuous 80°C operation"

**To create a claim via the API:**

```bash
curl -X POST http://localhost:3000/api/claims \
  -H "Content-Type: application/json" \
  -d '{
    "title": "HBK MK-II withstands 10 bar pressure",
    "description": "The pressure-rated fluid control assembly maintains structural integrity at 10 bar operating pressure per ISO 5208.",
    "claimType": "empirical",
    "intendedAction": "deploy",
    "safetyCritical": true
  }'
```

**Claim fields explained:**

| Field | Type | Default | Description |
|---|---|---|---|
| `title` | string | required | Short name for the claim |
| `description` | string | required | Full description of the claim |
| `claimType` | string | `"empirical"` | One of: `mathematical`, `semantic`, `empirical`, `operational` |
| `intendedAction` | string | `"deploy"` | Action to authorize if claim is verified |
| `safetyCritical` | boolean | `true` | Whether the circuit breaker is armed for this claim |

**Claim type caps** — each claim type has a maximum achievable state:

| Claim Type | Rank | Maximum State |
|---|---|---|
| `mathematical` | 4 | PROVEN (rank 8) |
| `semantic` | 3 | VERIFIED (rank 7) |
| `empirical` | 2 | SUPPORTED (rank 6) |
| `operational` | 1 | OBSERVED (rank 5) |

An operational claim can never reach PROVEN, no matter how much evidence is attached. This is by design — the lattice enforces epistemic humility.

**To list claims:**

```bash
curl http://localhost:3000/api/claims
```

**To get a specific claim:**

```bash
curl http://localhost:3000/api/claims/<claim_id>
```

### 3.2 Evidence Management

Evidence is the raw material that drives verification. Each evidence item is attached to a claim and contributes to its state through the lattice aggregation.

**Supported evidence sources:**

- `you.com` — Web search via You.com API
- `brave` — Web search via Brave Search API
- `firecrawl` — Web scraping via Firecrawl
- `watchdog` — Automated monitoring/watchdog system

**To attach evidence to a claim:**

```bash
curl -X POST http://localhost:3000/api/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "<claim_id>",
    "source": "watchdog",
    "content": "Hydrostatic test passed at 10.2 bar for 30 minutes. No leakage detected. Test report TR-2026-0842.",
    "embedding": [0.1, 0.3, -0.2, 0.5, ...],
    "weight": 1.0,
    "state": "SUPPORTED"
  }'
```

**Evidence fields explained:**

| Field | Type | Description |
|---|---|---|
| `claimId` | string | The claim this evidence supports |
| `source` | string | Provenance source (`you.com`, `brave`, `firecrawl`, `watchdog`) |
| `content` | string | Free-text evidence description |
| `embedding` | number[] | JSON-serialized R^D vector (default D=20) for provenance tracking |
| `weight` | float | Confidence in [0, 1]. Modulates weight in n-Ind computation |
| `state` | string | Lattice state this evidence item contributes |

**Linking evidence:** Evidence is automatically linked to claims via the `claimId` foreign key. When you attach evidence, the system:

1. Stores the evidence in the database
2. Recomputes the claim's aggregate state using lattice supremum
3. Recomputes the participation ratio (n-Ind) using the evidence embeddings
4. Re-evaluates the authorization decision
5. Checks the circuit breaker conditions

### 3.3 State Lattice

Claims progress through a partially-ordered set of verification states. This is not a simple linear pipeline — it is a **lattice**, meaning states can be aggregated using a supremum (least upper bound) operation.

**Full state hierarchy:**

```
PROVEN (rank 8)       ◄── cap: mathematical claims
  │
VERIFIED (rank 7)     ◄── cap: semantic claims
  │
SUPPORTED (rank 6)    ◄── cap: empirical claims
  │
OBSERVED (rank 5)     ◄── cap: operational claims
  │
INCONCLUSIVE (rank 4)
  │
UNVALIDATED (rank 2)
  │
UNTESTED (rank 1)     ◄── initial state
  │
STALE (rank 0)

FALSIFIED (rank -1)   ◄── terminal denial (incomparable)
```

**Key behaviors:**

- **New claims** start at `UNTESTED`.
- **Supremum aggregation:** When multiple evidence items support a claim, the aggregate state is the highest (maximum rank) state among them. For example, if one piece of evidence is `OBSERVED` and another is `SUPPORTED`, the aggregate is `SUPPORTED`.
- **Type caps:** A claim can never exceed the cap set by its `claimType`. An `operational` claim caps at `OBSERVED` even if all evidence is `PROVEN`.
- **FALSIFIED is incomparable:** If any evidence item is `FALSIFIED`, the aggregate becomes `FALSIFIED`. This is a terminal denial state.
- **Authorization threshold:** A claim must reach at least `SUPPORTED` to be eligible for authorization.

**How to verify a claim (trigger recomputation):**

```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "<claim_id>"
  }'
```

This endpoint triggers the full EIS pipeline: evidence aggregation, state lattice computation, n-Ind calculation, heat kernel diffusion, and circuit breaker evaluation.

### 3.4 Authorization Panel

The authorization panel implements the **Evidence-Bound Principle (Theorem 1)**:

```
A = C ∧ E ∧ I ∧ S ∧ R
```

All five conjuncts must be `true` for authorization to pass:

| Conjunct | Symbol | What It Checks |
|---|---|---|
| **Claim OK** | C | Claim state is at least `SUPPORTED` and not `FALSIFIED` |
| **Evidence OK** | E | At least 1 evidence item exists, with ≥2 distinct sources or ≥3 total items |
| **Integrity OK** | I | n-Ind ≥ integrity threshold (safety-critical: 1.7, non-critical: 0.7) |
| **Safety OK** | S | SafeGrid/SafeStacks clearance (always `true` for non-safety-critical claims) |
| **Review OK** | R | Second-reviewer signoff (always `true` for non-safety-critical claims) |

**To authorize a claim:**

```bash
curl -X POST http://localhost:3000/api/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "<claim_id>",
    "safetyOverride": true,
    "reviewSignedOff": true
  }'
```

The response includes a breakdown of each conjunct and the overall authorization decision:

```json
{
  "claimOk": true,
  "evidenceOk": true,
  "integrityOk": true,
  "safetyOk": true,
  "reviewOk": true,
  "authorized": true,
  "reason": "A = C∧E∧I∧S∧R = true — all conjuncts satisfied"
}
```

### 3.5 Circuit Breaker

The circuit breaker implements the **Fail-Closed Principle (Theorem 5)**. It is a hard stop that halts all downstream operations when verification integrity is compromised.

**The circuit breaker trips when any of these conditions are met:**

| Condition | Reason Code | Description |
|---|---|---|
| All evidence removed | `evidence_lost` | Evidence count dropped to 0 |
| Claim state collapsed | `verification_failed` | State fell to `FALSIFIED`, `STALE`, or `UNTESTED` |
| Safety clearance lost | `safety_violation` | Safety-critical claim lost SafeGrid/SafeStacks clearance |
| Integrity breach | `integrity_breach` | n-Ind dropped significantly below threshold |
| Evidence too old | `stale_evidence` | Evidence exceeded staleness window without refresh |

**Important distinction:** There are two separate circuit breaker systems in ProofBridge Liner:

1. **EIS Circuit Breaker** (`src/lib/eis/circuit-breaker.js`) — Trust-decision fail-closed. Trips on evidence loss, verification failure, or safety violation per Theorem 5.
2. **Webhook Circuit Breaker** (`src/lib/webhook/circuit-breaker.js`) — HTTP delivery channel fail-isolated. Trips after 10 terminal delivery failures to a specific webhook endpoint.

These are different layers with different triggers. Do not conflate them.

**To check circuit breaker status for a claim:**

```bash
curl http://localhost:3000/api/theorem-state/claims/<claim_id>/breaker
```

### 3.6 Evidence Mesh Panel

The Evidence Mesh panel provides a visual overview of all evidence attached to a claim. It shows:

- Evidence items grouped by source
- Individual evidence state and weight
- Aggregated claim state
- Source diversity (critical for n-Ind)

The mesh works by connecting evidence items into a graph structure where nodes are evidence items and edges represent provenance relationships. This graph feeds into both the heat kernel diffusion and the participation ratio computation.

### 3.7 Heat Kernel Panel

The Heat Kernel panel visualizes **temporal decay** of evidence quality using graph Laplacian diffusion.

**The mathematical model:**

```
du/dt = -κ · L · u
```

Where:
- `L` = graph Laplacian (cycle graph or complete graph of evidence nodes)
- `u` = evidence quality vector
- `κ` = diffusion rate (default 0.25)
- `dt` = 0.5 / λ_max (CFL-stable time step)

The implementation uses Jacobi eigenvalue decomposition (pure JavaScript, no external libraries) and tracks:

- **L2 norm retention** — how much total evidence quality remains after diffusion
- **High-frequency energy decay** — how quickly noise/aliasing dissipates
- **Node values per step** — the quality of each evidence item over time

**To compute heat kernel diffusion via the API:**

```bash
curl -X POST http://localhost:3000/api/heat-kernel \
  -H "Content-Type: application/json" \
  -d '{
    "numNodes": 5,
    "kappa": 0.25,
    "steps": 100
  }'
```

In practice, you can also call `smoothEvidenceWeights()` from the EIS library to apply heat kernel diffusion directly to a set of evidence weights.

### 3.8 Participation Ratio Panel (n-Ind)

The Participation Ratio panel displays the **effective number of independent evidence sources**. This is a critical metric — it tells you whether your evidence is truly independent or whether multiple sources are just repeating the same information.

**The formula:**

```
n-Ind = (∑λ_i)² / ∑λ_i²
```

Where λ_i are the eigenvalues of the RBF kernel Gram matrix built from evidence embeddings.

**Interpretation:**

| n-Ind Value | Meaning |
|---|---|
| `n` (equal to evidence count) | All sources are perfectly independent |
| `1` | All sources carry the same information (no independence) |
| Between 1 and n | Partial independence — some redundancy exists |

**How it works in practice:**

1. Compute pairwise squared distances between evidence embeddings
2. Apply median heuristic: `γ = 1 / median(d²)`
3. Build RBF Gram matrix: `G[i][j] = exp(-γ · ‖x_i - x_j‖²)`
4. Compute eigenvalues of G via Jacobi iteration
5. Calculate n-Ind from the eigenvalue distribution

**To compute n-Ind via the API:**

```bash
curl -X POST http://localhost:3000/api/n-ind \
  -H "Content-Type: application/json" \
  -d '{
    "embeddings": [
      [0.1, 0.3, -0.2, 0.5, 0.0, ...],
      [0.8, -0.1, 0.4, 0.2, 0.7, ...],
      [-0.3, 0.6, 0.1, -0.4, 0.9, ...]
    ]
  }'
```

Response:

```json
{
  "nInd": 2.87,
  "numEvidence": 3,
  "numSources": 3,
  "gamma": 0.42,
  "eigenvalues": [2.87, 0.13, 0.0]
}
```

---

## 4. The STUDI Workspace

STUDI (Strategic Underwriting) provides the commercial governance layer on top of the IVE. While the IVE handles engineering verification, STUDI answers: **"Is this verified claim ready for market?"**

### 4.1 5-Gate Strategic Underwriting

STUDI implements a 5-gate model where each gate represents a maturity milestone with increasing verification rigor and financial targets.

```
Gate 1        Gate 2        Gate 3        Gate 4        Gate 5
FOUNDATION     SEED         GROWTH       PRE-IPO        IPO
$1.5M ARR     $8.2M        $30M         $60.75M       $82.7M
   │             │             │             │             │
   ▼             ▼             ▼             ▼             ▼
┬─────┴─────┐  ┬─────┴─────┐  ┬─────┴─────┐  ┬─────┴─────┐  ┬─────┴─────┐
│ Core   │───│Market │───│Scale  │───│Audit  │───│Public │
│ IVE   └───└─Valid└───└─Proof└───└─Ready└───└─Trust└───┘
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

| Gate | Name | Target ARR | Focus |
|---|---|---|---|
| 1 | Foundation | $1.5M | Core IVE, EIS framework, initial claim verification |
| 2 | Seed | $8.2M | Market validation, expanded evidence sources, STUDI challenge mode |
| 3 | Growth | $30M | Scalable proof infrastructure, multi-tenant verification |
| 4 | Pre-IPO | $60.75M | Independent audit readiness, regulatory compliance |
| 5 | IPO | $82.7M | Public trust infrastructure, on-chain anchoring |

### 4.2 Gate Roadmap

The Gate Roadmap component shows the live status of each gate. Each gate has two parallel tracks:

- **Track A** — Legal/Governance requirements
- **Track B** — Commercial/Technical requirements

Both tracks must pass their exit review before a gate is considered resolved.

**Gate statuses in the STUDI system:**

| Status | Meaning |
|---|---|
| `PENDING` | Not yet started |
| `NOT-FILED` | Required filing has not been submitted |
| `BLOCKED` | Blocked by a dependency |
| `DRAFT` | In preparation |
| `READY` | Prepared, awaiting review |
| `GO` | Approved |
| `FILED` | Filed with relevant authority |
| `RESOLVED` | Fully resolved and complete |

The STUDI verdict is computed from all gate statuses:

- All gates `GO`/`FILED`/`RESOLVED` → STUDI verdict `PROVEN`
- Mixed `DRAFT`/`READY` → STUDI verdict `INCONCLUSIVE`
- Any `PENDING`/`NOT-FILED`/`BLOCKED` → STUDI verdict `UNKNOWN`

**To read or update a gate:**

```bash
# Read gate status
curl http://localhost:3000/api/theorem-state/gates/<slug>

# Update gate status
curl -X PUT http://localhost:3000/api/theorem-state/gates/<slug> \
  -H "Content-Type: application/json" \
  -d '{
    "status": "GO",
    "note": "Charter approved by directors 2026-08-15"
  }'
```

### 4.3 Challenge Mode

Challenge mode is a **productive disagreement engine**. It allows you to submit adversarial challenges against claims to test their robustness.

**To submit a challenge:**

```bash
curl -X POST http://localhost:3000/api/studi/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "<claim_id>",
    "challenge": "The 10-bar rating assumes ambient temperature. What happens at -20°C when seal material stiffens?",
    "severity": "high"
  }'
```

Challenges force the verification team to address weaknesses before commercial release. The system tracks challenge outcomes and incorporates them into the overall verification state.

### 4.4 Interest Inception Modal

The Interest Inception modal tracks **commercial viability** per gate. It records:

- Investor/stakeholder interest signals
- Commercial engagement metrics
- Market validation indicators
- Revenue traction data

**To record interest inception data:**

```bash
curl -X POST http://localhost:3000/api/studi/interest \
  -H "Content-Type: application/json" \
  -d '{
    "gateSlug": "foundation",
    "interestType": "investor_outreach",
    "value": 3,
    "note": "3 VCs expressed interest after demo"
  }'
```

### 4.5 Governing Documents

The Governing Documents panel provides access to:

- Corporate governance charter
- VVU Session Protocol
- Terms of Service
- Share structure documentation

These documents are accessible from the STUDI workspace sidebar and are required reading for governance team members.

### 4.6 Gate Editor

The Gate Editor allows authorized users to modify gate statuses, update financial projections, and add notes. Changes are audit-logged and reflected in real time across all connected clients.

To update a gate via the API, use the `/api/theorem-state/gates/<slug>` endpoint described in [Section 4.2](#42-gate-roadmap).

---

## 5. EIS Mathematical Framework

The **Evidence Independence Specification (EIS)** is the mathematical backbone of ProofBridge Liner. All implementations are in **plain JavaScript** with zero external numeric dependencies.

### 5.1 EIS Scoring Formula

```
EIS(c, e) = 0.35 · Certainty(c, e) + 0.35 · Coherence(c, e) + 0.30 · Decay(c, e)
```

| Component | Weight | What It Measures |
|---|---|---|
| **Certainty** | 0.35 | Aggregate confidence from evidence quality and source reliability |
| **Coherence** | 0.35 | Logical consistency across all evidence for a claim |
| **Decay** | 0.30 | Temporal freshness via heat kernel diffusion |

The EIS score produces a value in [0, 1]. Higher is better.

### 5.2 How Scoring Works in Practice

When you call `POST /api/verify` for a claim, the system:

1. **Gathers evidence** — All evidence items attached to the claim are loaded from the database.
2. **Computes Certainty** — Aggregates evidence quality scores (the `weight` field) and source reliability.
3. **Computes Coherence** — Evaluates logical consistency across evidence. Evidence that contradicts other evidence reduces coherence.
4. **Computes Decay** — Runs heat kernel diffusion on the evidence graph to model temporal freshness. Older evidence contributes less.
5. **Aggregates** — Combines the three components using the 0.35/0.35/0.30 weights.
6. **Updates claim state** — The claim's lattice state is recomputed using supremum aggregation of all evidence states, capped by the claim type.
7. **Records n-Ind** — The participation ratio is computed and stored for audit.
8. **Evaluates circuit breaker** — Checks all five trip conditions.

### 5.3 Evidence Independence Specification Theorem

The central theorem of the EIS framework states:

> **Theorem 1 (Evidence-Bound Principle):** Authorization is the conjunction of five conditions: A = C ∧ E ∧ I ∧ S ∧ R. No single condition is sufficient; all must hold simultaneously.

**Supporting theorems:**

| Theorem | Name | Implementation |
|---|---|---|
| Theorem 1 | Evidence-Bound Principle | `src/lib/eis/authorization.js` |
| Theorem 2 | Participation Ratio Recovery | `src/lib/eis/participation-ratio.js` |
| Theorem 3 | Heat Kernel Diffusion | `src/lib/eis/heat-kernel.js` |
| Theorem 4 | System Closure | `src/lib/eis/state-lattice.js` |
| Theorem 5 | Fail-Closed Circuit Breaker | `src/lib/eis/circuit-breaker.js` |

**Theorem 2 (Participation Ratio):** The effective number of independent evidence sources is recovered by spectral analysis of the RBF kernel Gram matrix: n-Ind = (∑λ_i)² / ∑λ_i².

**Theorem 3 (Heat Kernel):** Evidence diffusion on the provenance graph is correctly modeled by the heat equation du/dt = -κLu, where L is the graph Laplacian. This provides the theoretical basis for temporal decay scoring.

**Theorem 4 (System Closure):** The state lattice ensures no verification layer can be bypassed. All feedback flows through the IVE. The partial ordering prevents both over-claiming (type caps) and under-claiming (supremum aggregation).

**Theorem 5 (Fail-Closed):** Loss of evidence integrity (E) implies loss of verification (V) implies loss of authorization (A) implies the circuit breaker trips. The system is fail-closed by construction.

---

## 6. Webhook Infrastructure

The webhook subsystem is the **Execution/Reliability Layer** of ProofBridge Liner. Its non-negotiable design principle:

> **A failed webhook must NEVER block a Verification Worker.**

The flow is: VVU-IVE verifies a claim → persists to database → publishes delivery event → webhook workers deliver to external endpoint. If delivery fails at the last step, all previous steps still succeed.

### 6.1 Creating Webhooks

**To register a webhook endpoint:**

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ProofBridge Production Callback",
    "url": "https://proofbridge.example.com/hooks/vvu-ive",
    "type": "proofbridge",
    "secret": "your-hmac-secret-here"
  }'
```

| Field | Description |
|---|---|
| `name` | Human-readable label |
| `url` | Full HTTPS endpoint URL |
| `type` | One of: `proofbridge`, `github`, `discord`, `custom` |
| `secret` | Shared secret for HMAC-SHA256 payload signing |

The response includes the webhook ID and a generated secret. Save the secret — you will need it to verify incoming webhooks.

**To list webhooks:**

```bash
curl http://localhost:3000/api/v1/webhooks
```

### 6.2 Delivery Tracking

Each webhook delivery is tracked end-to-end:

1. A `WebhookDelivery` record is created with status `PENDING`.
2. The delivery is published to Kafka (partitioned by `webhookId` for ordering).
3. A webhook worker picks it up and attempts HTTP delivery.
4. Each attempt is recorded as a `WebhookDeliveryAttempt` with HTTP status, outcome, and timing.
5. On success, the delivery status becomes `DELIVERED`.
6. On failure after all retries, the delivery moves to the Dead Letter Queue.

**To get webhook details including delivery stats:**

```bash
curl http://localhost:3000/api/v1/webhooks/<webhook_id>
```

**To get delivery statistics:**

```bash
curl http://localhost:3000/api/v1/stats/webhooks
```

### 6.3 Circuit Breaker for Webhooks

This is the **webhook delivery** circuit breaker (distinct from the EIS trust-decision circuit breaker in [Section 3.5](#35-circuit-breaker)).

**Configuration (locked per v1.1 contract):**

| Parameter | Value | Description |
|---|---|---|
| Scope | Per-webhook | Each endpoint has its own breaker |
| Failure threshold | 10 terminal failures | Events that exhausted all 4 retry attempts |
| OPEN duration | 300 seconds (5 min) | Cooldown before attempting a probe |
| Half-open probes | Exactly 1 | Only one probe allowed during HALF_OPEN |

**State transitions:**

```
CLOSED ──(trip: 10 terminal failures)──▶ OPEN ──(300s cooldown)──▶ HALF_OPEN
  ▲                                                    |
  ▲(probe success)                               (probe failure)
  ▴                                                    |
  ◀──────────────────────────────┴───────────────────────────────┘
```

**To force-reset a tripped circuit breaker:**

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/<webhook_id>/circuit-breaker/reset
```

This resets the breaker to `CLOSED` but does **NOT** auto-replay skipped DLQ entries.

### 6.4 Dead Letter Queue (DLQ)

Failed deliveries go to the Dead Letter Queue. Events enter the DLQ when:

- All 4 retry attempts are exhausted (`exhausted_retries`)
- The circuit breaker is OPEN and the event was skipped (`circuit_breaker_open_skipped`)
- A non-retryable error occurred (`non_retryable_error`)

DLQ entries are retained for **30 days**. They are **never** automatically replayed. An operator must explicitly replay each one.

**To list DLQ entries:**

```bash
# All DLQ entries for a webhook
curl http://localhost:3000/api/v1/webhooks/<webhook_id>/dlq

# Only unreplayed entries
curl 'http://localhost:3000/api/v1/webhooks/<webhook_id>/dlq?unreplayed=true'

# Paginated
curl 'http://localhost:3000/api/v1/webhooks/<webhook_id>/dlq?limit=20&offset=0'
```

**To manually replay a failed delivery:**

```bash
curl -X POST \
  http://localhost:3000/api/v1/webhooks/<webhook_id>/delivery-attempts/<delivery_id>/retry \
  -H "X-Operator-Id: your.name@proofbridge.io"
```

Returns `202 Accepted`. The worker picks up the replay and runs the full pipeline (circuit breaker check → retry → DLQ if still failing).

### 6.5 HMAC-SHA256 Verification

Outbound webhook payloads are signed using HMAC-SHA256. The signature is sent in the `X-VVU-Signature` header.

**To verify an incoming webhook on your server:**

```javascript
import { createHmac } from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return expected === signature;
}
```

For **Stitch/Svix** compatibility, the system follows the Svix webhook signing specification with the `X-VVU-Signature` header format.

For **Paystack** integration, the system also supports HMAC-SHA512 signature verification for inbound webhooks.

**To rotate a webhook secret:**

```bash
bun run webhook:rotate-secret
```

Secret rotation uses a staged approach: both the old and new secrets validate inbound signatures during the transition period. Once all clients have migrated, promote the new secret and clear the old one.

### 6.6 Setting Up Kafka (Optional)

For production deployments, webhooks use Kafka for message transport. For local development, set `WEBHOOK_TRANSPORT=memory` to use an in-memory transport without Kafka.

**Start local Kafka:**

```bash
docker compose -f docker/docker-compose.kafka.yml up -d
```

**Create Kafka topics (idempotent — safe to re-run):**

```bash
KAFKA_BROKERS=localhost:9092 bun run webhook:create-topics
```

Expected output:

```
vvu-webhook-delivery             created
vvu-webhook-delivery-dlq         created
vvu-webhook-audit                created
```

**Start workers:**

```bash
bun run webhook:worker    # Delivery workers
bun run webhook:admin     # Admin/audit workers
```

---

## 7. HBK MK-II Case Study

The **HBK MK-II** is the primary case study integrated into ProofBridge Liner. It demonstrates the full IVE pipeline on a real engineering component.

### Component Specification

| Property | Value |
|---|---|
| **Assembly Type** | Pressure-rated fluid control valve |
| **Mounting Standard** | M12 |
| **Rated Pressure** | 10 bar |
| **Verification Domain** | Physical AI / Industrial Control |
| **Safety Classification** | Safety-critical |

### How the IVE Verifies the HBK MK-II

**Step 1 — Claims are submitted**

Typical claims for the HBK MK-II assembly:

| Claim | Type | Cap |
|---|---|---|
| "The valve body withstands 10 bar operating pressure" | `empirical` | SUPPORTED |
| "The M12 mounting pattern resists vibration loosening" | `empirical` | SUPPORTED |
| "The fluid seal maintains integrity at rated pressure" | `operational` | OBSERVED |
| "The material composition meets ASTM B16 grade" | `semantic` | VERIFIED |

**Step 2 — Evidence is attached**

Evidence comes from multiple independent sources:

- `watchdog` — Continuous pressure monitoring logs
- `firecrawl` — Manufacturer's test certificates from the web
- `you.com` — Published engineering standards and compliance data
- `brave` — Third-party test lab reports

Each piece of evidence includes a provenance embedding (a 20-dimensional vector) that encodes its source characteristics. This embedding is used by the n-Ind computation to measure independence.

**Step 3 — EIS scoring evaluates each claim**

The EIS formula computes:

- **Certainty (0.35)** — How reliable is the evidence? Test reports from accredited labs score higher than informal observations.
- **Coherence (0.35)** — Do all evidence items agree? If one source says the valve passed at 12 bar and another says it failed at 8 bar, coherence drops.
- **Decay (0.30)** — How fresh is the evidence? A test from last week scores higher than a test from two years ago, modeled by the heat kernel.

**Step 4 — The State Lattice tracks verification progress**

As evidence accumulates:

1. Initial state: `UNTESTED`
2. First watchdog observation: `UNTESTED` → `OBSERVED` (via supremum)
3. Test certificate added: `OBSERVED` → `SUPPORTED` (via supremum)
4. Third-party lab confirms: `SUPPORTED` maintained (already at type cap for `empirical`)

**Step 5 — The Circuit Breaker provides safety guarantees**

If the watchdog detects a pressure drop below 9 bar (suggesting seal degradation):

1. New evidence is recorded with a concerning observation
2. n-Ind may drop if the new evidence correlates too highly with existing evidence
3. If evidence becomes stale (exceeds the staleness window), the breaker trips with reason `stale_evidence`
4. All downstream operations (deployment, release) are halted
5. The operator must investigate, add fresh evidence, and explicitly reset the breaker

**Step 6 — STUDI gates track commercial readiness**

The HBK MK-II's verified claims feed into the STUDI 5-gate roadmap. At Gate 1 (Foundation), the IVE is proving core capability. By Gate 3 (Growth), the verified component could be offered as a multi-tenant verification service.

---

## 8. Configuration & Customization

### 8.1 Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./db/custom.db` | Prisma datasource URL (SQLite for dev, PostgreSQL for prod) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL of the application |
| `WEBHOOK_TRANSPORT` | `kafka` | Transport mode: `kafka` for prod, `memory` for dev/tests |
| `KAFKA_BROKERS` | `localhost:9092` | Comma-separated Kafka broker addresses |
| `KAFKA_CLIENT_ID` | `vvu-ive-webhook` | Client ID for KafkaJS |
| `KAFKA_SASL_MECHANISM` | _(none)_ | SASL mechanism: `plain`, `scram-sha-256`, `scram-sha-512` |
| `KAFKA_SASL_USERNAME` | _(none)_ | SASL username (production MSK) |
| `KAFKA_SASL_PASSWORD` | _(none)_ | SASL password (production MSK) |
| `KAFKA_SSL` | `false` | Set to `true` for production MSK with TLS |

### 8.2 Prisma Schema Overview

The database schema (`prisma/schema.prisma`) defines the following models:

| Model | Purpose |
|---|---|
| `Claim` | Verification claims with type, state, and safety flags |
| `Evidence` | Evidence items attached to claims, with source, embedding, and weight |
| `Authorization` | Records of A = C ∧ E ∧ I ∧ S ∧ R evaluations |
| `CircuitBreaker` | EIS fail-closed event log (Theorem 5) |
| `NIndComputation` | Participation ratio records per claim |
| `HeatKernelStep` | Diffusion trace records for evidence smoothing |
| `Webhook` | Registered external webhook endpoints |
| `WebhookDelivery` | Individual delivery events with status tracking |
| `WebhookDeliveryAttempt` | HTTP attempt records per delivery |
| `WebhookCircuitBreakerState` | Per-webhook delivery circuit breaker state |
| `DeadLetterQueueEntry` | Failed/skipped deliveries awaiting manual replay |
| `WebhookSecretAudit` | Append-only secret rotation history (SHA-256 hashes only) |
| `AuditEvent` | Admin/audit worker event trail |
| `StudiGate` | STUDI 5-gate governance milestones |

**Switching from SQLite (dev) to PostgreSQL (production):**

In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then set `DATABASE_URL=postgresql://user:password@host:5432/vvu_ive` and run:

```bash
bun run db:push
```

### 8.3 Adding Custom Verification Plugins

The IVE workspace includes a **Plugin Registry** (`src/components/ive-workspace/plugin-registry.jsx`) that supports custom verification plugins.

To add a new plugin:

1. Create a new file in `src/lib/eis/` (e.g., `my-custom-check.js`)
2. Implement the plugin interface:

```javascript
// src/lib/eis/my-custom-check.js

export function customVerify(claim, evidence) {
  // Your custom verification logic here
  // Return { passed: boolean, score: number, reason: string }
  return {
    passed: true,
    score: 0.85,
    reason: "Custom check passed: all dimensions within tolerance"
  };
}
```

3. Register the plugin in the plugin registry component
4. The plugin's results will appear in the IVE workspace alongside built-in panels

**Guidelines for EIS plugins:**

- Keep mathematical implementations dependency-free. No numpy, no numeric libraries — pure JavaScript only.
- Follow the existing naming conventions in `src/lib/eis/`
- Export functions using named exports (no default exports)
- If your plugin needs database access, add a corresponding Prisma model and run `bun run db:push`

---

## 9. API Reference

ProofBridge Liner exposes **24 API routes** across four groups. This section provides a brief overview. For the full reference with request/response schemas, see the [README](../README.md).

### 9.1 Core IVE Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/claims` | List all verification claims |
| `POST` | `/api/claims` | Create a new claim |
| `GET` | `/api/claims/[id]` | Get a specific claim |
| `PUT` | `/api/claims/[id]` | Update a claim |
| `DELETE` | `/api/claims/[id]` | Delete a claim |
| `POST` | `/api/verify` | Submit evidence and trigger EIS verification |
| `POST` | `/api/authorize` | Authorize a verified claim for execution |
| `GET/POST` | `/api/evidence` | Manage evidence attached to claims |
| `GET` | `/api/state` | Get current system state summary |
| `POST` | `/api/seed` | Seed database with sample data |
| `GET` | `/api` | API health check and metadata |

### 9.2 EIS Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/heat-kernel` | Compute heat kernel diffusion for evidence decay |
| `POST` | `/api/n-ind` | Compute participation ratio (n-Ind) for evidence independence |
| `GET` | `/api/theorem-state` | Get global theorem/claim state overview |
| `GET` | `/api/theorem-state/claims/[id]/breaker` | Get circuit breaker status for a claim |
| `POST` | `/api/theorem-state/claims/[id]/authorize` | Authorize a claim through the constitutional gate |
| `GET/PUT` | `/api/theorem-state/gates/[slug]` | Read or update a STUDI gate by slug |

### 9.3 STUDI Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/studi/challenge` | Submit an adversarial challenge against a claim |
| `POST` | `/api/studi/interest` | Track or record interest inception data |

### 9.4 Webhook Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/webhooks` | List all webhook endpoints |
| `POST` | `/api/v1/webhooks` | Register a new webhook endpoint |
| `GET` | `/api/v1/webhooks/[id]` | Get webhook details, CB state, and delivery stats |
| `PATCH` | `/api/v1/webhooks/[id]` | Soft-enable or disable a webhook |
| `DELETE` | `/api/v1/webhooks/[id]` | Delete a webhook endpoint |
| `GET` | `/api/v1/stats/webhooks` | Webhook delivery statistics and metrics |
| `POST` | `/api/v1/webhooks/[id]/circuit-breaker/reset` | Force-reset a tripped circuit breaker |
| `GET` | `/api/v1/webhooks/[id]/dlq` | View dead letter queue for a webhook |
| `POST` | `/api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry` | Manually retry a failed delivery |

---

## 10. Troubleshooting

### Common Issues and Solutions

**Problem: `bun install` fails with peer dependency warnings**

```bash
# Bun handles peer dependencies differently from npm.
# These warnings are typically non-blocking.
# If installation actually fails, try:
bun install --no-save
```

**Problem: `bun run db:push` fails with "Database file not found"**

```bash
# Ensure the directory for the SQLite file exists
mkdir -p prisma/db
bun run db:push
```

**Problem: API returns 404 for all routes**

```bash
# Verify the dev server is running
curl http://localhost:3000/api
# Should return JSON with API metadata

# If not, check for build errors in dev.log
```

**Problem: Prisma client is outdated after schema changes**

```bash
# Regenerate the Prisma client after any schema change
bun run db:generate
bun run db:push
```

**Problem: Evidence embeddings cause n-Ind to return 0**

This happens when all evidence embeddings are identical (zero variance). The RBF Gram matrix becomes singular.

```bash
# Ensure evidence embeddings have variance
echo "Embedding dimension should be ~20"
echo "Number of embeddings should be < 1000"
echo "No NaN or Infinity values in embeddings"
```

**Problem: Kafka connection refused in production**

```bash
# Verify Kafka is accessible
nc -zv $KAFKA_BROKERS

# For local dev without Kafka, use memory transport
# Set in .env.local:
# WEBHOOK_TRANSPORT=memory
```

### Circuit Breaker Recovery

**EIS Circuit Breaker (Theorem 5):**

The EIS circuit breaker trips when verification integrity is lost. To recover:

1. Identify the trip reason by checking the `CircuitBreaker` table or calling:
   ```bash
   curl http://localhost:3000/api/theorem-state/claims/<claim_id>/breaker
   ```
2. Address the root cause:
   - `evidence_lost` → Re-attach evidence to the claim
   - `verification_failed` → Fix the claim state (re-verify)
   - `safety_violation` → Restore safety clearance
   - `stale_evidence` → Add fresh evidence within the staleness window
   - `integrity_breach` → Add independent evidence to raise n-Ind
3. Re-run verification:
   ```bash
   curl -X POST http://localhost:3000/api/verify \
     -H "Content-Type: application/json" \
     -d '{"claimId": "<claim_id>"}'
   ```

**Webhook Circuit Breaker:**

1. Check the breaker state:
   ```bash
   curl http://localhost:3000/api/v1/webhooks/<webhook_id>
   ```
2. Fix the underlying endpoint issue (DNS, TLS, server error)
3. Force-reset the breaker:
   ```bash
   curl -X POST http://localhost:3000/api/v1/webhooks/<webhook_id>/circuit-breaker/reset
   ```
4. Manually replay DLQ entries (the breaker reset does NOT auto-replay):
   ```bash
   curl 'http://localhost:3000/api/v1/webhooks/<webhook_id>/dlq?unreplayed=true'
   # For each entry, replay it:
   curl -X POST http://localhost:3000/api/v1/webhooks/<webhook_id>/delivery-attempts/<delivery_id>/retry
   ```

### Database Reset

**To completely reset the database (destroys all data):**

```bash
bun run db:reset
```

This drops all tables, re-runs migrations, and re-applies the seed script if configured.

**To reset only the data but keep the schema:**

```bash
# Delete the SQLite file and re-push
rm -f prisma/db/dev.db
bun run db:push
```

**For PostgreSQL (production):**

```bash
# WARNING: This destroys all data
bun run db:reset
```

---

## 11. Contributing

Contributions to ProofBridge Liner are welcome. This project has strict architectural constraints that must be respected.

### How to Contribute

1. **Fork** the repository
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make your changes** following the guidelines below
4. **Run the linter:**
   ```bash
   bun run lint
   ```
5. **Test locally:**
   ```bash
   bun run dev
   ```
6. **Commit** with conventional commit messages:
   ```bash
   git commit -m "feat: add custom evidence source adapter"
   git commit -m "fix: correct n-Ind computation for single evidence"
   git commit -m "docs: update API reference for v0.3"
   ```
7. **Push** and open a pull request against the `main` branch

### TypeScript Prohibition

**This project uses plain JavaScript only. Do not introduce TypeScript. Ever.**

This is a deliberate architectural decision, not an oversight. All files use `.js` or `.jsx` extensions. There are no `tsconfig.json`, no `.d.ts` files, and no TypeScript compilation steps.

If you are submitting a pull request and any file contains TypeScript syntax (type annotations, interfaces, enums, `as` casts, etc.), the PR will be rejected.

### Code Style

- **Language:** Plain JavaScript (ES2024). No TypeScript.
- **Modules:** ESM (`import`/`export`). The project uses `"type": "module"` in `package.json`.
- **File extensions:** `.js` for logic, `.jsx` for React components.
- **Styling:** Tailwind CSS 4 with shadcn/ui components. Do not write custom CSS unless absolutely necessary.
- **Linting:** ESLint is configured. Run `bun run lint` before committing.

### Pull Request Process

1. Ensure all linting passes: `bun run lint`
2. Ensure the dev server starts: `bun run dev`
3. If you modified `prisma/schema.prisma`, run:
   ```bash
   bun run db:push
   bun run db:generate
   ```
4. If you added API routes, follow the existing pattern:
   - Validate input with Zod
   - Return JSON responses
   - Use proper HTTP status codes (200, 201, 400, 404, 500)
5. If you added EIS mathematical functions:
   - Keep them dependency-free (no numpy, no numeric libraries)
   - Use pure JavaScript only
   - Add to the barrel export in `src/lib/eis/index.js`
6. Write a clear PR description explaining the change and its motivation

### Additional Guidelines

- **API routes:** Follow the existing pattern in `src/app/api/`. Validate input with Zod, return JSON, use proper HTTP status codes.
- **EIS functions:** Keep mathematical implementations dependency-free. No external numeric libraries — pure JavaScript.
- **Components:** Use shadcn/ui primitives from `src/components/ui/`. Compose them into feature components in `src/components/ive/`, `src/components/studi/`, or `src/components/vvu/`.
- **State management:** Use Zustand for client state and TanStack Query for server state. Follow the existing patterns in `src/lib/theorem/` and `src/hooks/`.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

```
Copyright (c) 2026 Vaguely Vanity (Pty) Ltd (RF), trading as Venture Vision Ubuntu

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.
```

---

*ProofBridge Liner — where engineering claims meet mathematical proof.*
