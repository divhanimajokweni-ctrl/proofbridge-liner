# 🌉 ProofBridge Liner

**An Integrated Verification Environment (IVE) to engineer systems that can prove themselves.**

*Built for the 2026 #ZooAPIMakeathon*

---

## 🎬 Demo Video
*(Drag and drop your `intro_202608060055.mp4` file right here in the GitHub editor to upload it!)*
[Placeholder: Video URL will appear here]

---

## 🛑 The Problem

Modern engineering design and formal system verification live in isolated silos. Engineers build complex CAD models, but verifying that these physical geometries meet strict mathematical, safety, and physical specifications usually requires disconnected, manual workflows. There is a lack of cryptographically traceable, mathematically bounded proof directly tied to the living CAD model, which slows down critical hardware development and introduces untracked human error.

## 💡 Our Solution

**ProofBridge Liner** is an Integrated Verification Environment (IVE). It bridges the gap between procedural geometry generation and formal verification. 

We built a cinematic, persistent workspace that allows engineers to:
1. Generate procedural CAD structures.
2. Apply AI-assisted mathematical specifications.
3. Run bounded formal verifications against the geometry.
4. Output cryptographically traceable evidence that the system meets its constraints.

For this Makeathon, we built the **HBK MK-II Hydro-Gateway** as our demonstration case study to prove the pipeline works in real-time.

## 🛠️ How We Used Zoo APIs

This project heavily leverages **Zoo's Engine API**. 

Instead of relying on static file imports or heavy local rendering, ProofBridge Liner uses the Engine API to dynamically generate, edit, and visualize the procedural CAD geometry (the HBK MK-II Hydro-Gateway) directly in the cloud-native browser environment. The Engine API allows our IVE to tightly couple the physical geometry parameters with our AI-assisted specification and verification backend, creating a seamless loop between "what it looks like" and "what we can mathematically prove about it."

## ⚙️ Setup and Installation

**Prerequisites:**
- Node.js (v18+)
- npm or pnpm or bun
- SQLite

**1. Clone the repository:**
```bash
git clone [https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git](https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git)
cd proofbridge-liner
2. Install dependencies:

Bash
npm install
3. Environment Setup:
Create a .env file in the root directory and add your Zoo API keys and database configuration:

Code snippet
ZOO_API_KEY=your_zoo_engine_api_key_here
DATABASE_URL=file:./db/custom.db
4. Run the Development Server:

Bash
npm run dev
The IVE will be live at http://localhost:3000.
(Note: We use Next.js 16 with Turbopack for near-instant client navigation).

📜 License
[AGPL License] - See LICENSE file for details.
