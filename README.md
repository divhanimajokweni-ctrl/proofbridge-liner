Here's the **complete, submission‑ready README** that incorporates all the technical enhancements (DeepVariant analogy, chi‑square gating, VRES compliance) and aligns with the final release plan. It replaces the earlier placeholder description.

---

# 🌉 ProofBridge Liner

**An Integrated Verification Environment (IVE) to engineer systems that can prove themselves.**

*Built for the 2026 #ZooAPIMakeathon*

---

## 🎬 Demo Video

*(Link to your video)*

---

## 🛑 The Problem

Modern engineering design and formal system verification live in isolated silos. Engineers build complex CAD models, but verifying that these physical geometries meet strict mathematical, safety, and physical specifications usually requires disconnected, manual workflows. There is a lack of cryptographically traceable, mathematically bounded proof directly tied to the living CAD model, which slows down critical hardware development and introduces untracked human error.

---

## 💡 Our Solution

**ProofBridge Liner** is an Integrated Verification Environment (IVE). It bridges the gap between procedural geometry generation and formal verification.

We built a cinematic, persistent workspace that allows engineers to:

1. **Generate** procedural CAD structures (using the Zoo Engine API).
2. **Apply** AI‑assisted mathematical specifications (via Zookeeper).
3. **Run** bounded formal verifications (using SMT solvers) against the geometry.
4. **Output** cryptographically traceable evidence that the system meets its constraints.

For this Makeathon, we built the **HBK MK‑II Hydro‑Gateway** as our demonstration case study to prove the pipeline works in real‑time.

---

## 🛠️ How We Used Zoo APIs

This project heavily leverages **Zoo's Engine API**.

Instead of relying on static file imports or heavy local rendering, ProofBridge Liner uses the Engine API to dynamically generate, edit, and visualize the procedural CAD geometry (the HBK MK‑II Hydro‑Gateway) directly in the cloud‑native browser environment. The Engine API allows our IVE to tightly couple the physical geometry parameters with our AI‑assisted specification and verification backend, creating a seamless loop between *“what it looks like”* and *“what we can mathematically prove about it.”*

We also used the **Zookeeper WebSocket** to generate the KCL code for the hydro‑gateway from natural language prompts, and the **Modeling WebSocket** to export the resulting STEP geometry.

---

## ⚙️ Setup and Installation

**Prerequisites:**
- Node.js (v18+)
- npm / pnpm / bun
- SQLite (optional, for persistence)

**1. Clone the repository:**
```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner
```

**2. Install dependencies:**
```bash
bun install   # or npm install
```

**3. Environment Setup:**
Create a `.env` file in the root directory and add your Zoo API key:
```
ZOO_API_KEY=your_zoo_engine_api_key_here
DATABASE_URL=file:./db/custom.db   # optional
```

**4. Run the Development Server:**
```bash
bun run dev
```
The IVE will be live at [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Architecture Overview

The IVE follows a modern inference pipeline, analogous to high‑performance genomics pipelines (e.g., DeepVariant):

| DeepVariant                          | HBK Mk‑II Hydro‑Gateway                |
|--------------------------------------|----------------------------------------|
| Raw sequencing signal                | Raw acoustic‑pressure waveform         |
| Candidate variant generation         | Candidate hydraulic anomaly generation |
| Structured tensor/image representation | Multi‑scale hydraulic feature tensor   |
| Learned inference model              | Hydro‑Bayesian Kernel                  |
| Calibrated posterior probabilities   | Leak‑location posterior distribution   |
| Variant confidence score             | Leak confidence / search‑radius estimate|

The HBK Mk‑II pipeline is:

```
Sensor (pressure/flow/acoustic)
   ↓
Signal Conditioning (amplification, filtering, anti‑aliasing)
   ↓
Noise Removal (wavelet denoising, adaptive filtering)
   ↓
Feature Extraction (time‑domain, frequency‑domain, wavelet‑domain)
   ↓
Hydraulic State Representation (multi‑scale feature tensor)
   ↓
Hydro‑Bayesian Kernel (probabilistic inference engine)
   ↓
Posterior Leak Distribution (leak location ± uncertainty)
   ↓
Decision Layer (TRIP threshold: Brier Score < 0.02)
```

To prevent corrupted measurements from contaminating the state estimate, we implement **chi‑square innovation gating**:

1. Compute innovation: `r = z - H·x̂`
2. Compute innovation covariance: `S = H·P·Hᵀ + R`
3. Compute Normalised Innovation Squared: `χ² = rᵀ·S⁻¹·r`
4. If `χ² > χ²_threshold(DOF, α)`, the measurement is **rejected** before the Bayesian update.

This ensures that pump switching, valve operations, sensor glitches, or communication errors do not cause false leak localisations.

---

## 📁 Repository Layout

```
proofbridge-liner/
├── README.md
├── LICENSE                      # AGPL-3.0-or-later
├── COMMERCIAL-LICENSE.md        # ZAR pricing (7 tiers)
├── CONTRIBUTING.md              # CLA reference
├── pricing.json                 # Machine‑readable ZAR pricing
├── src/
│   ├── app/                     # Next.js 16 App Router
│   │   ├── page.tsx             # IVE root route
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── ive/             # Frozen result contract endpoint
│   │       └── ive/artifacts/   # Evidence‑package manifest endpoint
│   ├── store/
│   │   └── useIveStore.ts       # Canonical Zustand store (single source of truth)
│   ├── lib/
│   │   └── ive/
│   │       ├── types.ts         # Frozen contract types
│   │       ├── contract.ts      # buildFrozenContract (zero fabrication)
│   │       ├── proofGraph.ts    # Engineering DAG builder
│   │       ├── evidence.ts      # Evidence timeline + plugins + artifacts
│   │       └── cad.ts           # HBK Mk‑II KCL registry + architecture
│   └── components/
│       └── ive/
│           ├── IveRoot.tsx      # Boot → workspace orchestrator
│           ├── VVULogo.tsx
│           ├── primitives.tsx   # PanelFrame, StatCard, StatusPill, MonoTable
│           ├── boot/
│           │   └── BootSequence.tsx
│           ├── workspace/
│           │   ├── Workspace.tsx
│           │   ├── StatusBar.tsx
│           │   ├── CommandPalette.tsx
│           │   └── PanelRouter.tsx
│           ├── trust/
│           │   └── TrustSphere.tsx
│           └── panels/          # 15 engineering surfaces
│               ├── OverviewPanel.tsx
│               ├── TrustSpherePanel.tsx
│               ├── ProofGraphPanel.tsx
│               ├── EvidenceRuntimePanel.tsx
│               ├── PluginRegistryPanel.tsx
│               ├── AmdRuntimePanel.tsx
│               ├── ZooRuntimePanel.tsx
│               ├── HbkWorkspacePanel.tsx
│               ├── CadViewerPanel.tsx
│               ├── ArtifactsPanel.tsx
│               ├── ExplorerPanel.tsx
│               ├── TelemetryPanel.tsx
│               ├── TerminalPanel.tsx
│               ├── WatchdogPanel.tsx
│               └── LindiwePanel.tsx
├── docs/                        # Architecture, evidence model, release freeze
├── cad/                         # HBK Mk‑II KCL geometry (case study)
├── outputs/                     # Raw pipeline emission (source of truth)
├── ive-output/                  # Normalised frontend ingestion point
└── runs/                        # Historical validation vault (CPU, ROCm)
```

---

## 🔐 Evidence Model

IVE distinguishes between:

- **Mathematical proof** — valid only under declared assumptions.
- **Engineering evidence** — deterministic, reproducible packages.
- **Physical validation** — explicitly `OUT_OF_SCOPE` for the current sprint.

Every execution produces the following artifacts, forming a cryptographically verifiable evidence chain:

```
results.json          # Frozen result contract
metrics.json          # Derived engineering metrics
ledger.json           # Append‑only cryptographic ledger
provenance.json       # Provenance chain
checksums.txt         # SHA‑256 workspace integrity index
submission_data.json  # Packaging manifest
config.yaml           # Runtime configuration
```

Missing artifacts are explicitly marked `REQUIRES VALIDATION` — never fabricated.

---

## 📊 Trust Sphere

The Trust Sphere reports evidence status rather than arbitrary confidence scores. No unexplained aggregate percentage is allowed.

| Dimension | Status | Detail |
|-----------|--------|--------|
| **Safety** | `OUT_OF_SCOPE` | FEA excluded from current sprint |
| **Integrity** | `VERIFIED` | Workspace checksum index present |
| **Determinism** | `NOT_EVALUATED` | Seeds pending verification |
| **Auditability** | `LEDGER_PRESENT` | Append‑only, single run initialised |
| **Recoverability** | `NOT_EVALUATED` | — |
| **Availability** | `PRESENT` | Local Radeon emulation profile |
| **Engineering Release** | `BLOCKED` | Missing physical validation |

---

## 🎮 Running the IVE

```bash
bun run dev      # start the dev server on port 3000
bun run lint     # check code quality
```

Open the application via the Preview Panel. The boot sequence plays once, then transitions into the IVE workspace. Press **Esc** to skip the boot, **⌘K** for the command palette.

---

## 🧪 Verification Status

This repository operates as a reproducible engineering workspace. Components that were not validated within the frozen submission scope are explicitly identified as `REQUIRES VALIDATION` rather than represented as operational.

**Release decision:**
```
ENGINEERING RELEASE: BLOCKED
```

This state is intentional. It indicates that the repository will not elevate an engineering release beyond the evidence presently available. Missing verification, unavailable integrations, or unevaluated engineering inputs are surfaced explicitly rather than concealed.

Every engineering claim in this repository is intended to be traceable to repository evidence, historical execution artifacts, or clearly identified architectural documentation.

---

## 📜 License & Commercial Terms

This project is **dual‑licensed**:

| Track | License | Use Case |
|-------|---------|----------|
| **Open‑Source** | AGPL‑3.0‑or‑later | Community, non‑commercial, academic |
| **Commercial** | VVU Commercial License (ZAR pricing) | Enterprise, municipal, government, proprietary integration |

Full details:
- `LICENSE` – AGPL‑3.0‑or‑later text
- `COMMERCIAL-LICENSE.md` – Commercial terms, 7‑tier pricing in ZAR
- `CONTRIBUTING.md` – Contributor License Agreement

---

## 🇿🇦 Proudly South African

- **B‑BBEE Level 1**
- **Preferential Procurement Policy Framework Act compliant**
- **All pricing in South African Rand (ZAR), incl. VAT**
- **Data sovereignty**: all data remains within South African borders (government/municipal topologies)

---

## 📬 Contact

File	Purpose	Email
README.md	General inquiries, questions about the project	divh@venturevisionubuntu.co.za
COMMERCIAL-LICENSE.md	Licensing, commercial inquiries, support	divh@venturevisionubuntu.co.za
LICENSE	Legal contact for AGPL compliance	divh@venturevisionubuntu.co.za
CONTRIBUTING.md	Contributor License Agreement questions	divh@venturevisionubuntu.co.za
pricing.json	Licensing contact field	divh@venturevisionubuntu.co.za
The old addresses (hello@venturevisionubuntu.co.za and licensing@vvu.org) have been removed.

Example snippet from the updated README (end of file):
📬 Contact
For general inquiries, licensing, support, or commercial questions:

Email: divh@venturevisionubuntu.co.za

Please specify your reason for contact in the subject line (e.g., “General Inquiry”, “Licensing”, “Support”, “Contributor Agreement”).



---

**Engineer systems that can prove themselves.** 🚀
