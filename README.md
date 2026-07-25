# VVU Validation Suite

> **A public, reproducible validation event — not another specification.**
> Pre-registered protocol, published failure schedule, live Mission Control scoreboard, immutable hourly evidence bundles, and a dress-rehearsal requirement. The evidence leads the conversation.

This directory is a Git-ready validation subsystem. It is structured as a production project, versioned independently from software releases. Evidence bundles are NEVER committed to the repository — they are published as GitHub Release assets associated with the frozen Git tag for each validation run.

## Quick Start

```bash
# List all targets
make help

# Run the private dress rehearsal (compressed 72h in ~2min)
make rehearsal

# Freeze the build (git tag + container digest pin)
make freeze

# Run the public 72-hour validation (real-time, requires frozen build)
make validate

# Generate a single hourly evidence bundle
make evidence HOUR=12

# Verify replay determinism
make verify BUNDLE=VVU-VAL-001/evidence/bundles/Hour-12.zip

# Publish the evidence package as a GitHub Release
make release
```

If you have [Taskfile](https://taskfile.dev) installed, `task` works identically:
```bash
task rehearsal
task freeze
task validate
```

## Directory Structure

```
validation/
├── .gitignore                         ← excludes evidence, logs, recordings, secrets
├── Makefile                           ← universal task runner (zero dependencies)
├── Taskfile.yml                       ← modern task runner (optional)
├── README.md                          ← this file
└── VVU-VAL-001/
    ├── protocol/
    │   ├── VVU-VAL-001_Pre_Registration_Protocol.pdf   ← frozen protocol (16 pages, v1.1)
    │   └── protocol.md                                  ← Markdown source
    ├── chaos/
    │   ├── schedule.yaml               ← 6-phase gate-mapped schedule (published before T=0)
    │   ├── inject-network.sh           ← P3: packet loss / latency / dup
    │   ├── inject-storage.sh           ← P4: disk fill / IO throttle
    │   ├── inject-security.sh          ← P6: bad signatures / spoofed / bad ZK / contradictory
    │   └── inject-partition.sh         ← P7: cluster partition + HLC merge
    ├── rehearsal/
    │   ├── run-rehearsal.sh            ← mandatory private dress rehearsal
    │   ├── verify.sh                   ← full verification suite
    │   └── freeze-build.sh             ← git tag + container digest pin
    ├── kubernetes/
    │   ├── namespace.yaml              ← 8 namespaces (provider-agnostic k3s)
    │   ├── runtime.yaml                ← Epistemic Runtime + AIR Kernel + NATS + generator + injector
    │   ├── monitoring.yaml             ← Prometheus + Grafana
    │   ├── evidence.yaml               ← hourly evidence archiver CronJob
    │   ├── streaming.yaml              ← headless streaming service (implementation-agnostic)
    │   └── outreach.yaml               ← Layer 2 outreach engine (killable)
    ├── evidence/
    │   ├── bundle.sh                   ← hourly evidence-bundle archival
    │   ├── validation-index.py         ← published 6-dimension formula
    │   ├── archive.sh                  ← H72 package assembly + GitHub Release
    │   └── replay.sh                   ← replay verification pipeline
    ├── scoreboard/
    │   ├── dashboard.json              ← scoreboard config schema
    │   ├── metrics-schema.json         ← metrics JSON schema
    │   └── overlay-config.json         ← stream overlay config
    ├── outreach/
    │   ├── milestones.yaml             ← milestone event registry
    │   ├── recipients.yaml             ← recipient registry (no addresses in code)
    │   ├── stages.yaml                 ← staged-release enforcement
    │   └── templates/                  ← scaffold templates (no pre-written copy)
    ├── github/
    │   ├── validation.yml              ← Layer 1: hourly collect + archive + milestone
    │   ├── rehearsal.yml               ← private rehearsal workflow
    │   └── release.yml                 ← H72 evidence package + GitHub Release
    └── docs/
        ├── observer-guide.md           ← independent observer instructions
        ├── operator-runbook.md         ← on-call operator constraints + log format
        ├── threat-model.md             ← validated vs NOT validated
        └── publication-checklist.md    ← every item to complete before T=0
```

## Validation Events vs Software Releases

Validation events are versioned **independently** from software releases:

```
Validation Events:     VAL-001, VAL-002, VAL-003, ...
Software Releases:     v1.0.0, v1.1.0, v2.0.0, ...
```

This separation lets you compare multiple validation runs against different software versions without conflating the validation protocol with the product release history.

## Evidence Bundles — NOT Committed

Evidence bundles, recordings, logs, and secrets are **never committed** to the repository. The `.gitignore` excludes them. Instead:

- The repository holds source code, manifests, protocols, and workflows.
- Evidence bundles are published as **GitHub Release assets** (or immutable object storage) associated with the frozen Git tag for that validation run.

```
Git Tag: VAL-001
├── Source Code (in repo)
├── Protocol PDF (in repo)
├── Kubernetes Manifests (in repo)
└── Release Assets (NOT in repo — published as Release assets)
    ├── VVU-72H-VALIDATION.zip
    ├── SHA256SUMS
    ├── FinalReport.pdf
    ├── ReplayDataset.tar.zst
    └── 72-hour-recording.mp4
```

## Image Pinning (Tag + Digest)

At freeze time, `freeze-build.sh` performs **both**:

1. **Tags** the container image: `vvu/epistemic-runtime:VAL-001`
2. **Records the digest**: `sha256:abc123...`
3. **Patches the k8s manifests** to pin by digest: `image: vvu/epistemic-runtime@sha256:abc123...`
4. **Records both** in `frozen-build.json` for the release notes

This is belt-and-braces: the tag is human-readable; the digest is cryptographically airtight and cannot be moved.

## The 6-Phase Gate-Mapped Schedule

| Phase | Hours | Gate | Injected |
|-------|-------|------|----------|
| P1 Nominal | 0–12 | Baseline | Normal traffic |
| P2 Flood | 12–24 | Acceptance Capacity | 10× → 100× rate |
| P3 Network Chaos | 24–36 | HLC Ordering | Packet loss / latency / dup |
| P4 Storage Pressure | 36–48 | Append-Only Integrity | Disk fill / IO throttle |
| P5 Node Failure | 48–60 | Recovery | Random pod kills |
| P6 Security | 60–66 | HF-001/002/005 | Bad sigs / bad ZK / contradictory / spoofed |
| P7 Partition + Recovery | 66–72 | LVL-17 (72h Blackout) | Disconnect → reconnect → HLC merge |

## The Validation Index (Published Formula)

```
Index = Σ ( weightᵢ × dimensionᵢ )    weights sum to 1.0; each dimension 0–100
```

| Dimension | Weight | Measurement |
|-----------|--------|-------------|
| Replay Determinism | 0.20 | 100 if live == replay else 0 |
| Evidence Integrity | 0.20 | 100 × verified / total bundles |
| TEE Attestation | 0.15 | 100 × (1 − accepted_bad / spoofed) |
| Policy Conformance | 0.15 | max(0, 100 − 4 × unhandled) |
| Merge Correctness | 0.15 | 100 if 0 conflicts else scaled |
| Availability | 0.15 | 100 × (1 − fail_closed_s / elapsed_s) |

PASS requires: zero Critical failures AND final index ≥ 90.0. See §7.1 (weight rationale) and §7.2 (threshold rationale) in the protocol PDF.

## How to Run

### 1. Private dress rehearsal
```bash
make rehearsal                    # compressed (72h in ~2min)
# or single phase for fast iteration:
bash VVU-VAL-001/rehearsal/run-rehearsal.sh --phase-only P6
```
Repeat until clean pass. Then freeze.

### 2. Freeze the build
```bash
make freeze
# → creates git tag VAL-001
# → builds container image, records tag + digest
# → patches k8s manifests to pin digest
# → writes protocol/frozen-build.json
```

### 3. Public run (after rehearsal passes + freeze)
```bash
make validate                     # true 72-hour real-time run
```

### 4. Publish evidence
```bash
make release                      # assembles + publishes GitHub Release
```

## See Also

- **`VVU-VAL-001/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf`** — the frozen protocol (16 pages, v1.1 reviewer-revised)
- **`VVU-VAL-001/docs/`** — observer guide, operator runbook, threat model, publication checklist
- **`VVU-VAL-001/chaos/schedule.yaml`** — the gate-mapped failure schedule
- **`VVU-VAL-001/evidence/validation-index.py`** — the published Validation Index formula
