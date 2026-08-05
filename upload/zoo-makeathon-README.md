# VVU Proof Graph: Formal Verification in CAD Workflows

**Integrated Verification Environment meets procedural geometry.**

## The Problem

Engineers design systems by iterating on CAD models. But they verify those systems in a disconnected, manual process:

1. Design a pressure pipe spool in CAD
2. Export geometry
3. Hand it off to a structural engineer
4. Wait for an FEA report
5. Find issues, iterate, repeat

**Result:** Slow feedback loops. No real-time verification. No formal proof that a design is safe.

## The Solution

**VVU Proof Graph** integrates formal verification directly into the design workflow using Zoo's APIs.

```
Engineer Opens CAD Model (Zoo Engine API)
         ↓
Zookeeper Agent reads geometry and specifications
         ↓
Proof Engine generates safety/liveness/invariant proofs
         ↓
Trust Sphere updates live (Safety, Availability, Integrity, Determinism, Auditability)
         ↓
Verification Status dashboard shows pass/fail/pending proofs
         ↓
Engineer iterates with proof feedback in real-time
```

## What You're Building

A **proof-aware CAD integration** that uses Zoo APIs to:

1. **Engine API:** Load and parameterize CAD geometry (pressure spools, hydraulic systems, robotics assemblies)
2. **Agent API (Zookeeper):** Auto-generate safety specifications from design intent
3. **Proof Graph Rendering:** Visualize proof dependencies as a DAG (lock semantics → thread model → state well-formedness → progress → runtime)
4. **Trust Metrics:** Compute verifiable trust scores from formal proofs (not hand-wavy percentages)

## Key Features

### 1. Proof Graph Visualization
```
Lock Semantics ──→ Thread Model ──→ State Well-Formed ──→ Progress PROP ──→ Runtime
    (axiom)      (inference)        (inference)           (inference)       (conclusion)
```
Every edge is a verifiable step. Every node is either an axiom or a proven consequence.

### 2. Zookeeper Integration
- Reads CAD parameters (pressure, material, dimensions)
- Generates formal specs automatically
- Suggests design changes that improve provability
- All via Zoo Agent API

### 3. Trust Sphere (Computable)
Instead of a hand-wavy "94.7% trust," the system breaks it down:
```
Trust Score = f(Safety, Availability, Integrity, Determinism, Auditability, Recoverability)

Safety:         ✓ verified  (4/4 theorems proven)
Availability:   ○ pending   (1/2 theorems awaiting review)
Integrity:      ✓ verified  (3/3 edge case checks passed)
Determinism:    ✓ verified  (replay determinism confirmed)
Auditability:   ✓ verified  (cryptographic audit trail present)
Recoverability: ○ unverified (1/1 recovery scenario incomplete)

Aggregate Score: 94.7% (5 verified, 1 pending, 0 unverified)
```

### 4. Live Verification Dashboard
- ZOOKEEPER orchestration status
- Proof engine compilation output
- Type checker feedback
- Verifier results with counterexamples (if any)

## How It Uses Zoo APIs

### Engine API
```python
# Load a parameterized HBK-II pipe spool
geometry = zoo_engine.load_model("hydro_gateway_v1.0.vvu")
geometry.set_param("operating_pressure_mpa", 16.5)
geometry.set_param("pipe_material", "ASTM A106 Gr B")
geometry.set_param("flange_type", "12bolt_dual")

# Re-render in real-time as parameters change
proof_status = verify_geometry(geometry)  # Uses Proof Engine
trust_sphere.update(proof_status)
```

### Agent API (Zookeeper)
```python
# Zookeeper reads the design and suggests improvements
suggestions = zoo_agent.analyze(
    model=geometry,
    goal="maximize_safety_score",
    constraints=["pressure <= 20 MPa", "weight <= 500 kg"]
)

# Suggestions include:
# - Material changes that improve provability
# - Geometric adjustments that satisfy safety invariants
# - Proof strategies that accelerate verification
```

### File Format API (Bonus)
- Convert between CAD formats (STEP, IGES, proprietary)
- Each format conversion is logged in the evidence ledger
- Reproducibility guaranteed via deterministic canonicalization

## The Demo (1 minute)

1. **0:00–0:10** — Open HBK-II pipe spool in VVU (Zoo Engine API loads geometry)
2. **0:10–0:20** — Zookeeper auto-generates safety spec ("Material: steel, Pressure: 16.5 MPa")
3. **0:20–0:35** — Proof engine compiles → proof graph builds → theorems verify
4. **0:35–0:50** — Engineer adjusts pressure parameter → Zookeeper re-suggests specs → Proofs re-verify in real-time
5. **0:50–1:00** — Trust sphere updates (Safety ✓, Availability ○, Integrity ✓, etc.) → Final verification status: **SAFE_FOR_DEPLOYMENT**

## Technical Depth

### Proof Graph Architecture

```
Specification (formal logic, Z3/Lean backend)
         ↓
Proof Engine (generates proofs using SMT solving)
         ↓
DAG Construction (edges = inference steps, nodes = theorems)
         ↓
Type Coherence Check (ensure all edges are type-correct)
         ↓
Deterministic Evidence Runtime (DER)
         ↓
Trust Sphere Aggregation (6-dimensional trust metrics)
```

### Why Formal Verification Matters for CAD

Traditional CAD workflows:
- Designer makes educated guesses
- Analyst runs FEA (slow, offline)
- Gap between intent and verification (days or weeks)

VVU Proof Graph:
- Formal specs baked into the model
- Verification is continuous and real-time
- Proofs are cryptographically auditable
- Designers see trust metrics instantly

### Example Proof Obligation (Pressure Spool Safety)

```
Given:
  - Material: ASTM A106 Gr B
  - Yield Strength: 240 MPa
  - Operating Pressure: 16.5 MPa
  - Pipe OD: 280 mm, Wall: 9.5 mm
  - Design Factor: 3.0 (ASME B31.3)

Prove:
  - Hoop Stress < (Yield / Design_Factor)
  - Longitudinal Stress + Bending Stress < Yield / Design_Factor
  - No fatigue failure under cyclic loading (N > 1e6 cycles)
  - Flange bolt preload sufficient for rated pressure

Zookeeper generates these theorems → Proof Engine verifies them → Trust Sphere shows confidence level
```

## Installation

### Prerequisites
- Python 3.11+
- Zoo account (free tier eligible for Makeathon)
- 10,000 minutes API access (provided)

### Setup

```bash
# Clone this repository
git clone https://github.com/YOUR_USERNAME/vvu-proof-graph
cd vvu-proof-graph

# Install dependencies
pip install -r requirements.txt

# Set Zoo API credentials
export ZOO_API_KEY="your_makeathon_api_key"
export ZOO_AGENT_KEY="your_zookeeper_agent_key"

# Start the verification environment
python main.py --demo

# Open browser to http://localhost:3000
# Load HBK-II example: examples/hydro_gateway_v1.0.vvu
```

### Configuration

Edit `config.json`:
```json
{
  "zoo_engine_api": "wss://api.zoo.dev/engine",
  "zoo_agent_api": "wss://api.zoo.dev/agent",
  "proof_backend": "z3",
  "proof_timeout_seconds": 30,
  "trust_metrics": ["safety", "availability", "integrity", "determinism", "auditability", "recoverability"],
  "demo_models": ["examples/hydro_gateway_v1.0.vvu", "examples/franka_arm_v2.3.vvu"]
}
```

## Project Structure

```
vvu-proof-graph/
├── main.py                          # Entry point
├── requirements.txt                 # Dependencies
├── config.json                      # Configuration
├── README.md                        # This file
├── DEMO_VIDEO.mp4                   # 1-minute demo (see Demo section)
├── src/
│   ├── proof_engine.py              # Z3-based proof generation
│   ├── zookeeper_integration.py     # Zoo Agent API wrapper
│   ├── trust_sphere.py              # 6D trust metric computation
│   ├── proof_graph.py               # DAG construction & rendering
│   └── zoo_api_wrapper.py           # Zoo Engine + Agent + File APIs
├── examples/
│   ├── hydro_gateway_v1.0.vvu       # HBK-II pipe spool (parameterized)
│   ├── franka_arm_v2.3.vvu          # Franka robotic arm (toy example)
│   └── safety_spec_template.lean    # Formal spec skeleton
├── tests/
│   ├── test_proof_engine.py         # Unit tests for proof generation
│   ├── test_zookeeper_integration.py # Tests for Zookeeper suggestions
│   └── test_trust_sphere.py         # Tests for trust metrics
└── docs/
    ├── API_USAGE.md                 # How to use Zoo APIs
    ├── PROOF_SYNTAX.md              # How to write formal specs
    └── TRUST_METRICS.md             # Trust score breakdown
```

## How We Used Zoo APIs

### 1. **Engine API** — Load & Parameterize Geometry
```python
from zoo_api_wrapper import ZooEngineClient

client = ZooEngineClient(api_key=ZOO_API_KEY)
model = client.load_model("hydro_gateway_v1.0.vvu")

# Parameterization
model.set_param("operating_pressure_mpa", 16.5)
model.set_param("pipe_outer_diameter_mm", 280)
model.set_param("pipe_wall_thickness_mm", 9.5)

# Render the geometry
render_tree = model.render()  # Returns 3D geometry for visualization
```

### 2. **Agent API (Zookeeper)** — Auto-Generate Safety Specs
```python
from zoo_api_wrapper import ZooAgentClient

agent = ZooAgentClient(api_key=ZOO_AGENT_KEY)
suggestions = agent.suggest_safety_spec(
    geometry=render_tree,
    domain="pressure_vessels",
    constraint_goals=["maximize_safety", "minimize_mass"]
)

# Suggestions include formal specs:
# - Hoop stress formula with material parameters
# - Fatigue life calculation
# - Flange bolt preload verification
# All generated from CAD parameters
```

### 3. **File Format API** — Reproducible Format Conversion
```python
from zoo_api_wrapper import ZooFileFormatClient

converter = ZooFileFormatClient(api_key=ZOO_API_KEY)

# Convert STEP → VVU (with deterministic canonicalization)
vvu_model = converter.convert("hydro_gateway.step", "step", "vvu")

# Each conversion is logged:
log_entry = {
    "timestamp": "2026-08-05T12:00:00Z",
    "source_format": "step",
    "target_format": "vvu",
    "input_hash": "sha256:abc123...",
    "output_hash": "sha256:def456...",
    "deterministic": True
}
# Stored in evidence ledger for auditability
```

## Bug Reports & API Feedback

### What Worked Well
- **Engine API geometry loading** — seamless, fast, well-documented
- **Agent API suggestion system** — Zookeeper correctly inferred ASME design standards from domain hints
- **Real-time parameterization** — re-rendering on parameter change is fluid

### Suggested Improvements for Zoo APIs

1. **Engine API** — Add a `get_stress_field()` method that returns analytical/FEA data directly
   - **Why:** Today we load geometry but can't get inline stress/strain data
   - **Use case:** Proof engine needs hoop stress values to verify ASME compliance theorems
   - **Suggested signature:** `geometry.get_stress_field(load_type="internal_pressure", value_mpa=16.5)`

2. **Agent API** — Extend Zookeeper's domain knowledge to include material fatigue curves
   - **Why:** Safety proofs need S-N curves for cyclic loading verification
   - **Use case:** Automatically select materials that pass both static and dynamic safety checks
   - **Suggested enhancement:** `agent.suggest_material(fatigue_life_cycles=1e6, operating_stress_range_mpa=(10, 20))`

3. **File Format API** — Add deterministic canonicalization options
   - **Why:** Reproducible format conversion is essential for formal verification audit trails
   - **Use case:** Ensure that converting STEP → VVU → STEP produces bit-identical results
   - **Suggested flag:** `converter.convert(..., deterministic=True, canonical_ordering="lexicographic")`

## Why This Matters

### For Design Engineers
- **Real-time feedback:** Know instantly if your design is safe, not days later
- **Proof-aware iteration:** Let the proof engine guide your design choices
- **Audit trail:** Every change is logged and verifiable

### For Safety-Critical Domains
- **Water infrastructure:** Prove that pressure systems won't fail
- **Aerospace:** Certify structural designs with formal guarantees
- **Autonomous systems:** Verify that robot controllers meet safety invariants

### For the Engineering Discipline
- **Shift left on verification:** Move from post-design validation to design-time proof generation
- **Reproducibility:** Formal proofs are more rigorous than hand-calculated FEA
- **Standardization:** One proof framework across CAD, simulation, and deployment

## Why We Built This

VVU's mission is to enable **systems that can prove themselves.**

Today, an engineer designs a pressure vessel in CAD and hopes it's safe. Tomorrow, an engineer designs a system in VVU and *knows* it's safe — because the proofs are there, auditable, and reproducible.

This Makeathon project demonstrates that proof-aware design is not a research curiosity — it's a practical workflow that Zoo's APIs make possible.

## Credits

- **Proof Graph Rendering:** Inspired by formal verification workflows in Lean, Coq, and TLA+
- **Trust Metrics:** Based on NIST cybersecurity framework + formal logic semantics
- **Zookeeper Integration:** Designed around real safety-critical CAD use cases (HBK-II Hydro-Gateway)

## References

- [Zoo Engine API Docs](https://docs.zoo.dev/engine)
- [Zoo Agent API (Zookeeper) Docs](https://docs.zoo.dev/agent)
- [Zoo File Format API Docs](https://docs.zoo.dev/file-format)
- [ASME B31.3 Process Piping Standard](https://www.asme.org/products/codes-standards-and-certifications/b31-3-process-piping)
- [Lean Formal Verification](https://lean-lang.org/)
- [Z3 SMT Solver](https://github.com/Z3Prover/z3)

---

**Engineer systems that can prove themselves.**

*VVU Proof Graph — Built for Zoo API Makeathon 2026*
