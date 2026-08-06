import type {
  ArtifactFile,
  EvidenceEvent,
  LedgerEntry,
  PluginMeta,
} from "./types";

/**
 * Evidence timeline for the HBK MK-II demonstration run.
 *
 * Every event is tagged `evidenced: false` unless it is backed by an actual
 * runtime artifact. The demo timeline below shows the intended sequence;
 * the runtime marks evidenced=true only when the corresponding artifact is
 * present. No event is ever fabricated as "proven".
 */
export const EVIDENCE_TIMELINE: EvidenceEvent[] = [
  {
    id: "ev-01",
    timestamp: "09:14:03",
    stage: "Geometry",
    message: "Geometry Loaded — hydroGatewayMain.kcl parsed",
    level: "info",
    evidenced: false,
  },
  {
    id: "ev-02",
    timestamp: "09:14:04",
    stage: "Specification",
    message: "Specification Generated — safety / liveness / invariant",
    level: "info",
    evidenced: false,
  },
  {
    id: "ev-03",
    timestamp: "09:14:05",
    stage: "Proof Obligations",
    message: "Proof Obligations Created — 0 evaluated",
    level: "info",
    evidenced: false,
  },
  {
    id: "ev-04",
    timestamp: "09:14:06",
    stage: "Solver",
    message: "Solver Started — Z3 SMT bounded verification",
    level: "info",
    evidenced: false,
  },
  {
    id: "ev-05",
    timestamp: "09:14:07",
    stage: "Solver",
    message: "Obligation Proven — 0 / 0 (no obligations linked)",
    level: "warn",
    evidenced: false,
  },
  {
    id: "ev-06",
    timestamp: "09:14:08",
    stage: "Solver",
    message: "Counterexample Found — BLOCKED_MISSING_INPUT",
    level: "error",
    evidenced: false,
  },
  {
    id: "ev-07",
    timestamp: "09:14:09",
    stage: "Ledger",
    message: "Ledger Written — append-only, single run initialized",
    level: "success",
    evidenced: false,
  },
  {
    id: "ev-08",
    timestamp: "09:14:10",
    stage: "Provenance",
    message: "Provenance Written — AUTHENTICATED_BASE_ONLY",
    level: "success",
    evidenced: false,
  },
  {
    id: "ev-09",
    timestamp: "09:14:10",
    stage: "Checksums",
    message: "Checksums Generated — ive-output/checksums.txt",
    level: "success",
    evidenced: false,
  },
  {
    id: "ev-10",
    timestamp: "09:14:11",
    stage: "Release",
    message: "Engineering Release BLOCKED — missing engineering evidence",
    level: "error",
    evidenced: false,
  },
];

/** Plugin registry — lifecycle states reflect actual integration status. */
export const PLUGINS: PluginMeta[] = [
  {
    id: "amd",
    label: "AMD ROCm",
    tag: "AMD",
    accent: "#CC7722",
    state: "ACTIVATED",
    version: "ROCm 6.x (local emulation)",
    description:
      "HIP / PyTorch ROCm backend for GPU-accelerated deterministic replay. Local Radeon emulation context detected; remote cloud compute NOT_DEMONSTRATED.",
    native: true,
  },
  {
    id: "zoo",
    label: "Zoo Engine",
    tag: "ZOO",
    accent: "#3dffb0",
    state: "RUNNING",
    version: "KCL 2.0",
    description:
      "Procedural CAD via KCL. Native Zoo Engine API execution NOT_DEMONSTRATED; wrapper layer implemented in pipeline/compute_provider.py.",
    native: false,
  },
  {
    id: "github",
    label: "GitHub",
    tag: "GH",
    accent: "#8b949e",
    state: "INSTALLED",
    version: "REQUIRES VALIDATION",
    description: "Source-control provenance adapter. Awaiting external repository integration.",
    native: false,
  },
  {
    id: "cad",
    label: "CAD",
    tag: "CAD",
    accent: "#C9A84C",
    state: "RUNNING",
    version: "KCL 2.0",
    description: "Procedural geometry loader for HBK MK-II Hydro-Gateway case study.",
    native: false,
  },
  {
    id: "figma",
    label: "Figma",
    tag: "FIG",
    accent: "#b23dff",
    state: "NOT_INSTALLED",
    version: "UNDEFINED",
    description: "Design-spec import adapter. Not part of frozen submission scope.",
    native: false,
  },
  {
    id: "ros2",
    label: "ROS 2",
    tag: "ROS",
    accent: "#3d9bff",
    state: "DORMANT",
    version: "REQUIRES VALIDATION",
    description: "Robotics middleware bridge. Dormant — HBK MK-II is stationary hydraulic instrumentation.",
    native: false,
  },
  {
    id: "matlab",
    label: "MATLAB",
    tag: "MLB",
    accent: "#ff8c42",
    state: "NOT_INSTALLED",
    version: "UNDEFINED",
    description: "Numerical computing adapter. Not part of frozen submission scope.",
    native: false,
  },
  {
    id: "plc",
    label: "PLC",
    tag: "PLC",
    accent: "#5a8a5a",
    state: "DORMANT",
    version: "REQUIRES VALIDATION",
    description: "Programmable logic controller bridge. Dormant — hydraulic actuation authority UNDEFINED.",
    native: false,
  },
];

/** Generated artifact manifest for IVE. */
export const ARTIFACTS: ArtifactFile[] = [
  {
    name: "results.json",
    path: "ive-output/results.json",
    description: "Frozen result contract — trustSphere, obligations, telemetry.",
    schema: "IVEResultContract",
    status: "PRESENT",
  },
  {
    name: "metrics.json",
    path: "ive-output/metrics.json",
    description: "Derived engineering metrics from the verification run.",
    schema: "MetricsBundle",
    status: "REQUIRES_VALIDATION",
  },
  {
    name: "ledger.json",
    path: "outputs/ledger.json",
    description: "Append-only cryptographic ledger — single run initialized.",
    schema: "LedgerEntry[]",
    status: "PRESENT",
  },
  {
    name: "provenance.json",
    path: "outputs/provenance.json",
    description: "Provenance chain — AUTHENTICATED_BASE_ONLY.",
    schema: "ProvenanceChain",
    status: "PRESENT",
  },
  {
    name: "checksums.txt",
    path: "ive-output/checksums.txt",
    description: "SHA-256 integrity index across the workspace.",
    schema: "sha256 list",
    status: "PRESENT",
  },
  {
    name: "submission_data.json",
    path: "submission_data.json",
    description: "Packaging manifest with git commit + branch.",
    schema: "SubmissionManifest",
    status: "REQUIRES_VALIDATION",
  },
  {
    name: "config.yaml",
    path: "config.yaml",
    description: "Runtime configuration — provider, seeds, iteration counts.",
    schema: "YAML config",
    status: "REQUIRES_VALIDATION",
  },
];

/** Ledger entries — historical run registry (preserved, not overwritten). */
export const LEDGER: LedgerEntry[] = [
  {
    runId: "ive-cpu-baseline-20260801",
    timestamp: "2026-08-01T04:12:00Z",
    target: "CPU baseline — AMD Ryzen 9 7950X",
    environment: "PyTorch 2.3 CPU-only",
    inputHash: "REQUIRES VALIDATION",
    outputHash: "REQUIRES VALIDATION",
    status: "ANCHORED",
  },
  {
    runId: "ive-rocm-local-20260805",
    timestamp: "2026-08-05T03:03:43Z",
    target: "Local Radeon emulation — ROCm context",
    environment: "PyTorch ROCm (emulated)",
    inputHash: "REQUIRES VALIDATION",
    outputHash: "REQUIRES VALIDATION",
    status: "ANCHORED",
  },
  {
    runId: "ive-final-authoritative",
    timestamp: "PENDING",
    target: "Authoritative final run",
    environment: "REQUIRES VALIDATION",
    inputHash: "MISSING",
    outputHash: "MISSING",
    status: "PENDING",
  },
];
