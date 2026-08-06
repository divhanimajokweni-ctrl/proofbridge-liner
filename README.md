# 🌉 ProofBridge Liner

### An Integrated Verification Environment (IVE) to Engineer Systems That Can Prove Themselves

🏆 **Zoo API Makeathon 2026 Submission** 🏆

---

## 🎬 Demo Video

*⏱️ 1-Minute Demo – Watch the IVE Boot Sequence → CAD Generation → AI Specification → Proof Evaluation → Trust Sphere → Blocked Release*


https://github.com/user-attachments/assets/7b471e46-a9e6-4975-88d2-feab390c344b



---

## 🔥 The Problem

Modern engineering is broken. Design and verification live in separate, disconnected worlds. Engineers spend weeks building complex CAD models, only to hand them off for months of manual, disconnected verification. There is a complete lack of cryptographically traceable, mathematically bounded proof directly tied to the living CAD model. This siloed workflow slows down hardware development and introduces untracked human error.

## 💡 Our Solution

**ProofBridge Liner** is an Integrated Verification Environment (IVE). It bridges the gap between procedural geometry generation and formal verification.

**The VVU Integrated Verification Environment (IVE) demonstrates a workflow that combines procedural CAD, AI-assisted specification generation, bounded formal verification, and cryptographically traceable engineering evidence.**

We built a cinematic, persistent workspace that allows engineers to:

1. Generate procedural CAD structures in real-time.
2. Apply AI-assisted mathematical specifications.
3. Run bounded formal verifications against the geometry.
4. Output cryptographically traceable evidence that the system meets its constraints.

> 🌊 **The Case Study:** For this Makeathon, we built the **HBK MK-II Hydro-Gateway** as our reference application to prove the pipeline works on a real engineering workflow.

---

## 🛠️ How We Used Zoo APIs

This project was built from scratch and heavily leverages Zoo's flagship APIs to power the core verification loop.

| API | How We Used It |
| --- | --- |
| **Zoo Engine API** | We use the Engine API to dynamically generate, edit, and visualize procedural CAD geometry (HBK MK-II) via KCL directly in the cloud-native browser. Instead of relying on static files, the geometry is tightly coupled to our mathematical verification backend. |
| **Zoo Agent API (Zookeeper)** | We utilize Zookeeper via WebSocket to power our **AI-assisted mathematical specification generation**. It translates natural language engineering intent (*"Design a hydro-gateway with a rectangular base and M12 mounting holes"*) into verifiable KCL constraints and geometry. |
| **File Format API** | We leverage the Modeling WebSocket to seamlessly export the AI-generated KCL geometry as STEP files for secondary inspection and cryptographic archival. |

---

## 🧠 Why It's Different (The Tech)

### 1. Proof-Aware Engineering

Most CAD tools show you what you built. IVE shows you what you've *proven* about what you built. If you change a parameter, the proof re-runs automatically, and the release decision recalculates.

### 2. Chi-Square Gating & Bayesian Inference

Inspired by modern inference pipelines (like DeepVariant), our HBK MK-II case study transforms raw physical signals into calibrated probabilistic inferences. We use **Chi-Square Gating** to reject statistically inconsistent sensor measurements (glitches, pump switching) before they can corrupt the Bayesian state estimate, preventing false leak localizations.

### 3. Cryptographic Traceability

Every proof produces a frozen contract (`results.json`), an append-only cryptographic ledger (`ledger.json`), full provenance (`provenance.json`), and a SHA-256 integrity manifest (`checksums.txt`). No black boxes.

---

## 🚀 Setup & Installation

**Prerequisites:**

* Node.js v18+
* `bun` (recommended), `npm`, or `pnpm`
* A Zoo API Key

**1. Clone the repository:**

```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner

```

**2. Install dependencies:**

```bash
bun install

```

**3. Environment Setup:**
Create a `.env` file in the root directory and add your Zoo API key:

```bash
echo "ZOO_API_KEY=your_zoo_engine_api_key_here" > .env

```

**4. Run the IVE:**

```bash
bun run dev

```

Open `http://localhost:3000` to initiate the boot sequence and load the IVE workspace.

---

## 🚧 Claim Boundaries (The Zero Fabrication Rule)

We strictly adhere to the **Zero Fabrication Rule**. We never fake data, and a trust score must either be mathematically defined or not exist. Missing values are explicitly marked.

**This prototype demonstrates:**

* ✅ AI-assisted specification generation (via Zoo Agent API)
* ✅ Procedural CAD integration (via Zoo Engine API)
* ✅ Proof obligation management & SMT-based verification
* ✅ Evidence provenance & Audit trail generation

**This prototype does NOT demonstrate:**

* ❌ Physical safety certification
* ❌ Regulatory approval or code compliance
* ❌ Manufacturing verification or field validation

---

## 🛑 Verification Status

```text
MATHEMATICAL OBLIGATIONS: PROVEN
INPUT PROVENANCE: UNVERIFIED
PHYSICAL VALIDATION: NOT PERFORMED

ENGINEERING RELEASE: BLOCKED

```

**This is intentional.** ProofBridge Liner refuses to overclaim. Missing physical validation is explicitly surfaced, not hidden. The system successfully proves mathematical obligations but prevents a false "Safe for Deployment" claim, ensuring absolute intellectual honesty in the engineering pipeline.

---

*Made with ❤️ in South Africa 🇿🇦 for the Zoo API Makeathon 2026.*
