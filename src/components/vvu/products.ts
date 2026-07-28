import {
  Boxes, ShieldCheck, FileCheck2, Workflow, Droplets, BrainCircuit, Activity,
  type LucideIcon,
} from "lucide-react";

export type ProductId = "sphere" | "epistemic" | "proofbridge" | "air-runtime" | "ubuntu-pools" | "hbk" | "simulation";

export interface ProductMeta {
  id: ProductId;
  label: string;
  tag: string;
  icon: LucideIcon;
  mission: string;
  tagline: string;
  accent: string;
  shortcut: number;
  signals: { label: string; value: string; hint: string }[];
  status: "ONLINE" | "COMING_ONLINE";
  /** If true, this product has a full custom page (not a stub) */
  fullPage?: boolean;
}

export const PRODUCTS: ProductMeta[] = [
  {
    id: "sphere",
    label: "Trust Sphere",
    tag: "TS",
    icon: Boxes,
    mission: "A living verification state space. Identity → Contribution → Receipt → Hash → ZK Proof → Trust.",
    tagline: "Verification state space · Fibonacci sphere",
    accent: "#C9A84C",
    shortcut: 1,
    signals: [
      { label: "Verified Nodes", value: "—", hint: "Live count from sphere render" },
      { label: "Trust Density", value: "—", hint: "% nodes past ZK-proof state" },
      { label: "Circuit Breaker", value: "NORMAL", hint: "Global CB state" },
    ],
    status: "ONLINE",
  },
  {
    id: "epistemic",
    label: "Epistemic Runtime",
    tag: "ER",
    icon: ShieldCheck,
    mission: "Invariant-enforced DAG control plane. Policy DSL (.epd), sharded CRDTs, self-repairing merges, MMR ancestry proofs.",
    tagline: "DAG · CRDT · ZK-merge · v0.8",
    accent: "#b23dff",
    shortcut: 2,
    signals: [
      { label: "Policies", value: "4", hint: "Active .epd policies" },
      { label: "Shards", value: "12", hint: "Invariant-aware shards" },
      { label: "Resilience", value: "5/5", hint: "72-hour matrix layers" },
    ],
    status: "ONLINE",
  },
  {
    id: "proofbridge",
    label: "ProofBridge",
    tag: "PB",
    icon: FileCheck2,
    mission: "Verifiable receipt issuance bridge. Ed25519-signed receipts anchored into the MMR and exposed as ZK-proof artifacts.",
    tagline: "Receipt → Hash → ZK Proof",
    accent: "#3dffb0",
    shortcut: 3,
    signals: [
      { label: "Receipts Issued", value: "—", hint: "Pending telemetry" },
      { label: "MMR Anchors", value: "—", hint: "Pending telemetry" },
      { label: "ZK Artifacts", value: "—", hint: "Pending telemetry" },
    ],
    status: "COMING_ONLINE",
  },
  {
    id: "air-runtime",
    label: "AIR Runtime",
    tag: "AIR",
    icon: Workflow,
    mission: "The Agentic Inference Runtime kernel. Circuit Breaker state machine, NATS durable queue, HLC merge, Hard-Failure gates.",
    tagline: "Circuit Breaker · NATS · HLC merge",
    accent: "#CC7722",
    shortcut: 4,
    signals: [
      { label: "Circuit Breaker", value: "NORMAL", hint: "Fail-closed state machine" },
      { label: "NATS Queue", value: "0", hint: "Facts buffered for merge" },
      { label: "HLC Merge", value: "Ready", hint: "Hybrid Logical Clock armed" },
    ],
    status: "COMING_ONLINE",
  },
  {
    id: "ubuntu-pools",
    label: "Ubuntu Pools",
    tag: "UP",
    icon: Droplets,
    mission: "A community savings circle — a stokvel — where members contribute money, and the system proves every contribution is recorded honestly, every payout is verifiable, and no one can quietly take more than they're owed. This is what all of this is for.",
    tagline: "Stokvel · Stitch · ProofBridge · Ubuntu Score",
    accent: "#3D5A47",
    shortcut: 5,
    signals: [
      { label: "Active Pools", value: "8", hint: "Live savings circles" },
      { label: "Total Vaulted", value: "R 127K", hint: "Collective savings" },
      { label: "Ubuntu Score", value: "842", hint: "Avg network velocity" },
    ],
    status: "ONLINE",
    fullPage: true,
  },
  {
    id: "hbk",
    label: "HBK Mk-II",
    tag: "HBK",
    icon: BrainCircuit,
    mission: "Hydro-Bayesian Kernel Mk-II. AMD Ryzen AI portable architecture with acoustic sensor isolation, MCMC derivation, Brier Score monitoring, and Founding 100 partners campaign.",
    tagline: "Digital Twin · Founding 100 · 72h Validation",
    accent: "#ff2e5f",
    shortcut: 6,
    signals: [
      { label: "CAD Modules", value: "6/6", hint: "All HBK modules operational" },
      { label: "Brier Score", value: "0.013", hint: "HF-005 threshold 0.02" },
      { label: "Partners", value: "1/100", hint: "Founding 100 campaign" },
    ],
    status: "ONLINE",
    fullPage: true,
  },
  {
    id: "simulation",
    label: "72h Simulation",
    tag: "SIM",
    icon: Activity,
    mission: "Full 72-hour VVU-VAL-001 validation loop with HBK digital twin prototype. Real-time Git Actions log. Cape Town water network simulation. Production simulation — explicitly honest, practical, production-grade.",
    tagline: "HBK Twin · Git Actions · Real-Time Metrics",
    accent: "#10b981",
    shortcut: 7,
    signals: [
      { label: "Sim Engine", value: "OFFLINE", hint: "WebSocket connection status" },
      { label: "Current Phase", value: "P1", hint: "7-phase validation lifecycle" },
      { label: "Validation Index", value: "—", hint: "PASS ≥ 90.0" },
    ],
    status: "ONLINE",
    fullPage: true,
  },
];

export const PRODUCT_MAP: Record<ProductId, ProductMeta> = PRODUCTS.reduce(
  (acc, p) => { acc[p.id] = p; return acc; }, {} as Record<ProductId, ProductMeta>,
);

export const EPISTEMIC_ESSENTIAL_SECTIONS = [
  "overview", "resilience", "circuitbreaker", "trust",
  "kernel", "proofs", "merges", "playbooks",
] as const;
