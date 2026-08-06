# VVU Integrated Verification Environment (IVE)

> **Engineer systems that can prove themselves.**

The VVU Integrated Verification Environment (IVE) is an engineering environment for constructing, evaluating, and tracing engineering evidence. It combines procedural CAD, AI-assisted specification generation, bounded formal verification, and cryptographically traceable evidence into a single deterministic workflow.

Rather than asking engineers to trust software outputs, IVE produces deterministic evidence packages that can be independently reproduced and audited.

---

## Demonstration Application

The primary demonstration application included in this repository is:

> **HBK MK-II Hydro-Gateway**

HBK MK-II is a hydraulic infrastructure research case study used to demonstrate the IVE workflow.

It is **not** the platform itself.

IVE is the platform.

HBK MK-II demonstrates one implementation of that platform.

---

# Core Workflow

```
Engineering Inputs
        │
        ▼
 Procedural CAD
 (Zoo Engine · KCL)
        │
        ▼
 AI-assisted Specification
 (Zookeeper / Lindiwe)
        │
        ▼
 Proof Obligation Generation
        │
        ▼
 SMT Verification
 (Z3 · bounded)
        │
        ▼
 Evidence Runtime
        │
        ▼
 Ledger + Provenance
 (cryptographic)
        │
        ▼
 Engineering Release Decision
```

---

# Repository Layout

```
proofbridge-liner/

README.md

source/

  src/
    app/                        # Next.js 16 App Router entry
      page.tsx                  # IVE root route (boot → workspace)
      layout.tsx                # metadata + fonts
      globals.css               # cinematic engineering-OS theme
      api/
        ive/                    # frozen result contract endpoint
        ive/artifacts/          # evidence-package manifest endpoint

    store/
      useIveStore.ts            # canonical Zustand store (single source of truth)

    lib/
      ive/
        types.ts                # frozen contract types (release freeze)
        contract.ts             # buildFrozenContract (zero fabrication)
        proofGraph.ts           # engineering DAG builder
        evidence.ts             # evidence timeline + plugins + artifacts
        cad.ts                  # HBK MK-II KCL registry + architecture

    components/
      ive/
        IveRoot.tsx             # boot → workspace orchestrator
        VVULogo.tsx             # recovered VVU mark (three rings)
        primitives.tsx          # PanelFrame, StatCard, StatusPill, MonoTable
        boot/
          BootSequence.tsx      # cinematic launch sequence
        workspace/
          Workspace.tsx         # shell (header + sidebar + stage)
          StatusBar.tsx         # sticky footer taskbar
          CommandPalette.tsx    # ⌘K panel navigation
          PanelRouter.tsx       # lazy-loaded panel registry
        trust/
          TrustSphere.tsx       # recovered Fibonacci canvas sphere
        panels/                 # 15 engineering surfaces
          OverviewPanel.tsx
          TrustSpherePanel.tsx
          ProofGraphPanel.tsx
          EvidenceRuntimePanel.tsx
          PluginRegistryPanel.tsx
          AmdRuntimePanel.tsx
          ZooRuntimePanel.tsx
          HbkWorkspacePanel.tsx
          CadViewerPanel.tsx
          ArtifactsPanel.tsx
          ExplorerPanel.tsx
          TelemetryPanel.tsx
          TerminalPanel.tsx
          WatchdogPanel.tsx
          LindiwePanel.tsx

docs/                           # architecture, evidence model, release freeze
IMPLEMENTATION_REPORT.md        # modified files, decisions, blockers
RELEASE_FREEZE.md               # frozen contract + proof states

cad/                            # HBK MK-II KCL geometry (case study)
outputs/                        # raw pipeline emission (source of truth)
ive-output/                     # normalized frontend ingestion point
runs/                           # historical validation vault (CPU, ROCm)
```

---

# Primary Components

## Integrated Verification Environment

Responsible for:

- project orchestration
- evidence runtime
- proof graph
- trust sphere
- deterministic execution
- artifact generation

## HBK MK-II

Demonstrates:

- hydraulic infrastructure
- procedural CAD workflow
- engineering evidence generation
- bounded mathematical verification
- provenance tracking

---

# Evidence Model

IVE distinguishes between:

- **Mathematical proof** — valid only under declared assumptions.
- **Engineering evidence** — deterministic, reproducible packages.
- **Physical validation** — OUT_OF_SCOPE for the current sprint.

Proof results are valid only under their declared assumptions.

IVE intentionally blocks engineering release when required evidence is missing.

---

# Trust Sphere

The Trust Sphere reports evidence status rather than arbitrary confidence scores. No unexplained aggregate percentage is allowed.

Dimensions:

- **Safety** — OUT_OF_SCOPE (FEA excluded from current sprint)
- **Integrity** — VERIFIED (workspace checksum index present)
- **Determinism** — NOT_EVALUATED (seeds pending verification)
- **Auditability** — LEDGER_PRESENT (append-only, single run initialized)
- **Recoverability** — NOT_EVALUATED
- **Availability** — PRESENT (local Radeon emulation profile)
- **Engineering Release** — BLOCKED

---

# Generated Artifacts

Every execution produces:

```
results.json          # frozen result contract
metrics.json          # derived engineering metrics
ledger.json           # append-only cryptographic ledger
provenance.json       # provenance chain
checksums.txt         # SHA-256 workspace integrity index
submission_data.json  # packaging manifest
config.yaml           # runtime configuration
```

These artifacts form a deterministic evidence package. Missing artifacts are explicitly marked `REQUIRES VALIDATION`.

---

# AMD Radeon / ROCm

This repository records a local Radeon emulation pass on branch `mi300x-rocm-run-20260804`:

- **Provider:** ROCm (emulated)
- **Speedup:** 4.249× against CPU baseline (AMD Ryzen 9 7950X)
- **Iterations:** 100,000 synthetic samples
- **Seed determinism:** NOT_EVALUATED (NumPy, PyTorch, DataLoader seeds pending verification)
- **Remote cloud compute:** NotImplemented

GPU acceleration reduces verification latency while preserving deterministic replay and reproducible evidence generation.

---

# Engineering Position

IVE does **not** claim:

- physical certification
- engineering approval
- code compliance
- deployment authorization

Instead it demonstrates:

- bounded formal proof
- deterministic execution
- reproducible evidence
- cryptographic provenance

---

# Verification Summary & Repository Status

This repository operates as a reproducible engineering workspace containing both historical execution evidence and a frozen submission baseline. Components that were not validated within the frozen submission scope are explicitly identified as **REQUIRES VALIDATION** rather than represented as operational.

The release decision therefore remains:

```text
ENGINEERING RELEASE: BLOCKED
```

This state is intentional. It indicates that the repository will not elevate an engineering release beyond the evidence presently available. Missing verification, unavailable integrations, or unevaluated engineering inputs are surfaced explicitly rather than concealed.

Every engineering claim in this repository is intended to be traceable to repository evidence, historical execution artifacts, or clearly identified architectural documentation.

---

# Running

```bash
bun run dev      # start the dev server on port 3000
bun run lint     # check code quality
```

Open the application via the Preview Panel. The boot sequence plays once, then transitions into the IVE workspace. Press **Esc** to skip the boot, **⌘K** for the command palette.

---

# Philosophy

Traditional engineering asks people to trust results.

IVE asks systems to prove them.
