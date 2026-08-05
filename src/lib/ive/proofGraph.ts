import type {
  ProofGraphEdge,
  ProofGraphNode,
  ProofGraphNodeStatus,
} from "./types";

/**
 * buildProofGraph
 * ---------------
 * Constructs the engineering proof graph for IVE.
 *
 * Sequence (release freeze):
 *   Input Provenance → Geometry → Specification → Proof Obligations
 *   → Solver → Evidence → Ledger → Engineering Release
 *
 * The graph animates as execution progresses; node statuses are derived
 * from actual runtime data where available and marked PENDING / BLOCKED
 * otherwise. No node is ever marked PROVEN without evidence.
 */

export interface ProofGraph {
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
}

const PHI = 1.61803398875;

const STAGE_DEFS: Omit<ProofGraphNode, "status" | "completedAt">[] = [
  {
    id: "provenance",
    label: "Input Provenance",
    semantic: "Signed source geometry + parameter manifest",
  },
  {
    id: "geometry",
    label: "Geometry",
    semantic: "Procedural CAD via Zoo Engine (KCL)",
  },
  {
    id: "specification",
    label: "Specification",
    semantic: "AI-assisted safety / liveness / invariant spec",
  },
  {
    id: "obligations",
    label: "Proof Obligations",
    semantic: "Formal obligations generated from spec",
  },
  {
    id: "solver",
    label: "Solver",
    semantic: "SMT verification (Z3) — bounded",
  },
  {
    id: "evidence",
    label: "Evidence",
    semantic: "Deterministic evidence runtime",
  },
  {
    id: "ledger",
    label: "Ledger",
    semantic: "Append-only cryptographic ledger",
  },
  {
    id: "release",
    label: "Engineering Release",
    semantic: "Release decision — BLOCKED until evidence complete",
  },
];

/** Compute the cinematic cadence for each stage using the golden ratio. */
export function buildBootStages() {
  const base = 760; // ms
  const labels: { id: import("./types").BootStageId; label: string; detail: string }[] = [
    { id: "logo", label: "VVU", detail: "Integrated Verification Environment" },
    { id: "rings", label: "Three Rings", detail: "Initializing trust topology" },
    { id: "sphere", label: "Fibonacci Trust Sphere", detail: "Distributing evidence nodes" },
    { id: "evidence-nodes", label: "Evidence Nodes", detail: "Linking contribution → receipt → hash" },
    { id: "evidence-runtime", label: "Evidence Runtime", detail: "Spinning up deterministic pipeline" },
    { id: "zoo-engine", label: "Zoo Engine", detail: "Procedural CAD runtime" },
    { id: "proof-runtime", label: "Proof Runtime", detail: "SMT solver + obligation graph" },
    { id: "trust-runtime", label: "Trust Runtime", detail: "Aggregating dimension status" },
    { id: "workspace", label: "IVE Workspace", detail: "Engineering OS ready" },
  ];
  return labels.map((l, i) => ({
    ...l,
    durationMs: Math.round(base * Math.pow(PHI, (i % 3) * 0.18)) + i * 40,
  }));
}

/**
 * Build the proof graph with statuses derived from a runtime progress
 * pointer (0..nodes.length). Stages before the pointer are PROVEN only if
 * `evidenced` is true for that index; otherwise they stay ACTIVE.
 */
export function buildProofGraph(progress: number, evidenced: boolean[]): ProofGraph {
  const nodes: ProofGraphNode[] = STAGE_DEFS.map((def, i) => {
    let status: ProofGraphNodeStatus;
    if (i < progress) {
      status = evidenced[i] ? "PROVEN" : "ACTIVE";
    } else if (i === progress) {
      status = "ACTIVE";
    } else if (def.id === "release") {
      status = "BLOCKED";
    } else if (def.id === "provenance") {
      // Provenance is the entry — OUT_OF_SCOPE until geometry is signed.
      status = "OUT_OF_SCOPE";
    } else {
      status = "PENDING";
    }
    return {
      ...def,
      status,
      completedAt:
        status === "PROVEN" && evidenced[i]
          ? new Date(Date.now() - (STAGE_DEFS.length - i) * 1000).toISOString()
          : "PENDING",
    };
  });

  const edges: ProofGraphEdge[] = [];
  for (let i = 0; i < STAGE_DEFS.length - 1; i++) {
    edges.push({ from: STAGE_DEFS[i].id, to: STAGE_DEFS[i + 1].id });
  }
  return { nodes, edges };
}

/** Layout the graph as a vertical cascade with golden-ratio vertical gaps. */
export function layoutProofGraph(nodes: ProofGraphNode[]) {
  const gap = 78;
  return nodes.map((n, i) => ({
    node: n,
    x: 50, // percent
    y: 14 + i * (gap / (nodes.length + 1) + 30),
  }));
}
