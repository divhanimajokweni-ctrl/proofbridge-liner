

https://github.com/user-attachments/assets/7a2a47bc-bcdb-4b3d-8668-897684fccf39

# 🌉 ProofBridge Liner

**An Integrated Verification Environment (IVE) — Engineering Systems That Prove Themselves**

🏆 **AMD AI DevMaster Hackathon 2026 — Track 3: Physical AI** 🏆

---

## 📸 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROOFBRIDGE LINER — IVE                      │
│                                                                 │
│  Physical Design Intent                                         │
│       ↓                                                         │
│  Agent Planning ────── Zoo Agent API (Zookeeper)               │
│       ↓                                                         │
│  CAD Generation ────── Zoo Engine API                          │
│       ↓                                                         │
│  Formal Specification  (constraints for physical behaviour)     │
│       ↓                                                         │
│  Proof Evaluation ──── SMT-based verification                  │
│       ↓                                                         │
│  Trust Decision ────── release BLOCKED / APPROVED              │
│       ↓                                                         │
│  Cryptographic Evidence ── Zoo File Format API (STEP export)   │
│       ↓                                                         │
│  Evidence Ledger ────── SHA-256 checksummed audit trail        │
└─────────────────────────────────────────────────────────────────┘

Case Study: HBK MK-II Hydro-Gateway
— proving the pipeline on a real physical engineering asset
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner
bun install
cp .env.example .env   # add your Zoo API key
bunx prisma generate   # generate database client
bun run dev
```

Open **http://localhost:3000** to launch the IVE.

### Prerequisites

| Dependency | Version | Notes |
|------------|---------|-------|
| **Bun** | 1.3+ | Package manager & runtime |
| **Node.js** | 22+ | Required by Next.js |
| **Zoo API Key** | — | Get one at [zoo.dev](https://zoo.dev) |

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path (dev) or PostgreSQL URL (prod) |
| `ZOO_API_TOKEN` | Yes | Zoo Engine + Agent API token |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth key |

---

## 🎬 Demo Video

⏱️ **1-Minute Demo** — Agent-driven engineering workflow for physical systems

> The demo video is attached to this README via GitHub's file attachment feature. It demonstrates the complete IVE boot sequence, agent-driven specification generation, CAD rendering of the HBK MK-II Hydro-Gateway, proof evaluation, and trust decision flow.


https://github.com/user-attachments/assets/847b4365-7ae3-4970-9519-64d77800cf75


https://github.com/user-attachments/assets/a96849fb-1696-4cec-8dbe-22941409dc4f



---

## 🔥 The Problem

Modern physical engineering is broken. Design and verification live in disconnected worlds. Engineers spend weeks building CAD models for physical assets (dams, robots, vehicles), only to hand them off for months of manual verification. There is no cryptographically traceable, mathematically bounded proof tied directly to the living CAD model — and no autonomous agent that continuously re-evaluates physical trust as designs evolve.

In safety-critical physical systems — hydro-gateways, robotics, autonomous vehicles — this gap between design and proof is not just inefficient, it is dangerous. A changed parameter (hole spacing, material thickness, pressure rating) can invalidate a previously verified design, and without continuous re-verification, that invalidation goes undetected until catastrophic failure.

The economic cost is equally severe: each verification cycle for a physical asset costs weeks of engineer time and thousands of dollars. For the HBK MK-II Hydro-Gateway alone, a single verification round consumes 2–3 weeks of specialist time. When designs iterate rapidly, this verification debt accumulates to months of delay and millions in cost.

---

## 💡 Our Solution

ProofBridge Liner is an **Integrated Verification Environment (IVE)** that houses an autonomous engineering agent specifically for physical AI systems. This agent translates high-level design intent (e.g., "hydro-gateway with M12 mounting holes and pressure-rated seals") into formal verification artifacts and automatically reassesses engineering trust after every design change — **without human intervention**.

The IVE demonstrates an agent-driven physical-AI workflow:

```
Physical Design Intent
  ↓
Agent Planning (Zoo Agent API)
  ↓
CAD Generation (Zoo Engine API)
  ↓
Formal Specification (constraints for physical behaviour)
  ↓
Proof Evaluation (SMT-based verification of physical properties)
  ↓
Trust Decision (release blocked/approved for physical deployment)
  ↓
Evidence Archive (Zoo File Format API → STEP export + SHA-256 manifest)
```

**Case Study: HBK MK-II Hydro-Gateway** — proving the pipeline on a real physical engineering asset. The Hydro-Gateway is a pressure-rated fluid control assembly used in municipal water infrastructure. It requires precise mounting (M12 bolts), pressure certification (10 bar), and material traceability — making it an ideal demonstration of physical AI verification.

---

## 🛠️ How We Used the Zoo APIs

| API | Use (implemented) |
|-----|-------------------|
| **Zoo Agent API** (Zookeeper) | Natural language → formal verification constraints for physical systems. The agent interprets physical design intent and generates verifiable specifications. |
| **Zoo Engine API** | Procedural CAD generation and real-time visualisation of the HBK MK-II geometry — the digital twin of a physical asset. |
| **Zoo File Format API** | Export generated geometry as STEP files for cryptographic archival and audit trail — essential for physical asset traceability. |

### AMD & ROCm (roadmap)

The environment is pre-configured to leverage **AMD Radeon GPUs via ROCm** for future acceleration of SMT solving and proof re-evaluation — particularly relevant for physical simulation and control. During development, all verification was performed on CPU; GPU optimisation is planned as a post-hackathon enhancement targeting the following acceleration opportunities:

- **SMT solver parallelisation** — distribute proof obligations across GPU stream processors
- **Bayesian inference acceleration** — GPU-accelerated chi-square gating for sensor fusion
- **Monte Carlo physical simulation** — GPU-native sampling for stochastic verification of physical constraints

---

## 🧠 Why It's Different (Physical AI Focus)

### 1. Autonomous Physical Specification Agent

The Zookeeper agent translates natural language physical requirements ("Design a hydro-gateway with M12 holes and a 10-bar pressure rating") directly into verifiable constraints — no manual coding of physical specs. This removes the human bottleneck between physical intent and formal proof.

The agent maintains a specification graph that maps each physical constraint to its source intent, enabling full traceability from natural language requirement to mathematical proof obligation.

### 2. Continuous Proof-Aware Re-evaluation for Physical Assets

Change a physical parameter (e.g., thickness, hole spacing, material) → the agent re-runs the proof automatically → release decision recalculates. The agent monitors the digital twin and re-verifies without human intervention, mimicking a continuous integration system for physical engineering.

This is fundamentally different from traditional verification tools that treat proof as a one-time gate. In ProofBridge, proof is a living process that evolves with the design.

### 3. Chi-Square Gating & Bayesian Inference for Sensor Fusion

Inspired by modern inference pipelines, our HBK MK-II case study transforms raw sensor signals (pressure, flow, temperature) into calibrated probabilistic estimates — rejecting statistically inconsistent measurements before they corrupt the state estimate. This is directly relevant to Physical AI where real-world sensor data is noisy and must be filtered for reliable control.

The inference pipeline:
- **Prior**: Engineering specification bounds (design intent)
- **Likelihood**: Sensor measurement model (with chi-square gating)
- **Posterior**: Updated trust estimate (Bayesian update)
- **Decision**: Release blocked/approved based on posterior confidence

### 4. Cryptographic Traceability for Physical Assets

Every proof produces:

| Artifact | Purpose |
|----------|---------|
| `results.json` | Frozen contract — proof outcomes |
| `ledger.json` | Append-only ledger — immutable event log |
| `provenance.json` | Full provenance — source-to-proof chain |
| `checksums.txt` | SHA-256 integrity manifest |

This ensures that any modification to the physical design is cryptographically auditable — critical for safety-critical physical systems where regulatory compliance requires immutable evidence trails.

---

## 🚧 Claim Boundaries (Zero Fabrication Rule)

This prototype demonstrates:

- ✅ AI-assisted specification generation (Zoo Agent API) for physical systems
- ✅ Procedural CAD integration (Zoo Engine API) — digital twin generation
- ✅ Proof obligation management & SMT-based verification of physical constraints
- ✅ Evidence provenance & audit trail generation
- ✅ Bayesian trust estimation with chi-square sensor gating
- ✅ Cryptographic evidence archival (SHA-256 manifest)

This prototype does **NOT** demonstrate:

- ❌ Physical safety certification (e.g., ISO, ASME)
- ❌ Regulatory approval
- ❌ Manufacturing verification
- ❌ GPU-accelerated proof solving (roadmap item for AMD ROCm)

---

## 🛑 Verification Status

```
MATHEMATICAL OBLIGATIONS: EVALUATED
INPUT PROVENANCE:         UNVERIFIED
PHYSICAL VALIDATION:      NOT PERFORMED

ENGINEERING RELEASE:      BLOCKED
```

This status is derived directly from the proof artifacts generated by the agent. Missing physical validation is explicitly surfaced — no false claims. This aligns with the **Zero Fabrication Rule**: we never fake a trust score.

---

## 🏗️ Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| UI Components | shadcn/ui + Radix primitives + Framer Motion |
| Database | Prisma ORM (SQLite dev / PostgreSQL prod) |
| Auth | Clerk (graceful fallback when unconfigured) |
| CAD Engine | Zoo Engine API |
| AI Agent | Zoo Agent API (Zookeeper) |
| File Export | Zoo File Format API (STEP) |
| Evidence | SHA-256 checksummed JSON artifacts |
| Runtime | Bun |

### Project Structure

```
/proofbridge-liner
├── /src
│   ├── /app              # Next.js App Router (pages + API routes)
│   │   ├── /api/ive      # IVE API endpoints
│   │   └── page.tsx      # IVE root (dynamic boot sequence)
│   ├── /components
│   │   ├── /ive          # IVE shell, boot sequence, workspace
│   │   ├── /hbk          # HBK MK-II Hydro-Gateway panels
│   │   ├── /epistemic    # Fortification & resilience visualisation
│   │   └── /vvu          # VVU workbench shell & landing
│   ├── /lib              # Core libraries (db, trust-runtime, evidence)
│   └── /engine           # Zoo Engine integration & signer
├── /prisma               # Database schema
├── /supabase             # Migrations & config
├── /scripts              # Build, deploy, verification scripts
├── README.md             # This file
├── package.json          # Dependencies
├── .env.example          # Environment template
└── /docs                 # Additional documentation
```

---

## 📁 Submission Package

The project is submitted as a Pull Request to the official AMD repository. The source code lives in `/src`; the demo is hosted online (link above). No static demo assets are committed to the repo.

---

## 👥 Team

**Mihle Iviwe Majokweni**
Founder, Venture Vision Ubuntu
*(solo submission)*

---

## 🏁 Closing Impact

ProofBridge Liner demonstrates how autonomous AI agents can connect physical engineering intent, formal verification, and cryptographic evidence into a single, continuously verifiable workflow for physical AI systems.

It is not a tool that simply draws CAD — it is a **trust-aware engineering partner for the physical world**.

---

*Made with ❤️ in South Africa 🇿🇦 for the AMD AI DevMaster Hackathon 2026 — Track 3: Physical AI*
