"use client";

import { create } from "zustand";
import type {
  ArtifactFile,
  BootStage,
  EvidenceEvent,
  ExplorerNode,
  HardwareProfile,
  IVEResultContract,
  LedgerEntry,
  PluginMeta,
  PluginState,
  ProofGraph,
  ProofObligation,
  Telemetry,
  TrustSphere,
  WorkspacePanelId,
} from "@/lib/ive/types";
import { buildFrozenContract, buildLedger, buildMetricsBundle, buildProvenanceChain } from "@/lib/ive/contract";
import { buildBootStages, buildProofGraph } from "@/lib/ive/proofGraph";
import { ARTIFACTS, EVIDENCE_TIMELINE, LEDGER, PLUGINS } from "@/lib/ive/evidence";
import { CAD_PARTS, HBK_ARCHITECTURE } from "@/lib/ive/cad";

/**
 * useIveStore — canonical Zustand store.
 *
 * Single source of truth for the entire IVE workspace:
 *   boot state, active panel, trust sphere, proof graph, evidence runtime,
 *   plugin registry, AMD runtime, Zoo runtime, telemetry, circuit breaker,
 *   HBK workspace, artifacts.
 *
 * No state is duplicated. All panels read from this store.
 */

type CircuitBreakerState = "NORMAL" | "DEGRADED" | "FAIL_CLOSED";

export interface IveState {
  /* ---- boot ---- */
  bootStageIndex: number;
  bootStages: BootStage[];
  bootComplete: boolean;
  bootSkipped: boolean;
  advanceBoot: () => void;
  skipBoot: () => void;
  completeBoot: () => void;

  /* ---- workspace ---- */
  activePanel: WorkspacePanelId;
  setActivePanel: (panel: WorkspacePanelId) => void;

  /* ---- frozen contract ---- */
  contract: IVEResultContract;
  metricsBundle: ReturnType<typeof buildMetricsBundle>;
  provenanceChain: ReturnType<typeof buildProvenanceChain>;
  ledgerBundle: ReturnType<typeof buildLedger>;

  /* ---- trust sphere ---- */
  trustSphere: TrustSphere;
  setTrustSphere: (ts: TrustSphere) => void;
  /** Live verified-node count from the canvas sphere (display only). */
  sphereVerified: number;
  sphereTotal: number;
  setSphereMetrics: (verified: number, total: number) => void;

  /* ---- proof graph ---- */
  proofGraph: ProofGraph;
  proofProgress: number;
  advanceProof: () => void;
  resetProof: () => void;

  /* ---- evidence runtime ---- */
  evidenceTimeline: EvidenceEvent[];
  evidenceCursor: number;
  advanceEvidence: () => void;
  resetEvidence: () => void;

  /* ---- plugin registry ---- */
  plugins: PluginMeta[];
  setPluginState: (id: PluginMeta["id"], state: PluginState) => void;

  /* ---- AMD runtime ---- */
  hardwareProfile: HardwareProfile;

  /* ---- Zoo runtime ---- */
  zooStatus: Telemetry["zooApiIntegration"];

  /* ---- telemetry / circuit breaker ---- */
  circuitBreaker: CircuitBreakerState;
  telemetry: Telemetry;
  setTelemetry: (t: Telemetry) => void;

  /* ---- HBK workspace ---- */
  hbk: {
    cadParts: typeof CAD_PARTS;
    architecture: typeof HBK_ARCHITECTURE;
    activePartId: string;
    setActivePartId: (id: string) => void;
  };

  /* ---- artifacts ---- */
  artifacts: ArtifactFile[];

  /* ---- explorer ---- */
  explorerTree: ExplorerNode[];

  /* ---- ledger (frozen, preserved) ---- */
  ledgerEntries: LedgerEntry[];

  /* ---- obligations ---- */
  obligations: ProofObligation[];
}

const BOOT_STAGES = buildBootStages();
const CONTRACT = buildFrozenContract();

export const useIveStore = create<IveState>((set, get) => ({
  /* ---- boot ---- */
  bootStageIndex: 0,
  bootStages: BOOT_STAGES,
  bootComplete: false,
  bootSkipped: false,
  advanceBoot: () => {
    const { bootStageIndex, bootStages } = get();
    const next = bootStageIndex + 1;
    if (next >= bootStages.length) {
      set({ bootStageIndex: bootStages.length - 1, bootComplete: true });
    } else {
      set({ bootStageIndex: next });
    }
  },
  skipBoot: () => set({ bootSkipped: true, bootComplete: true, bootStageIndex: BOOT_STAGES.length - 1 }),
  completeBoot: () => set({ bootComplete: true, bootStageIndex: BOOT_STAGES.length - 1 }),

  /* ---- workspace ---- */
  activePanel: "overview",
  setActivePanel: (panel) => set({ activePanel: panel }),

  /* ---- frozen contract ---- */
  contract: CONTRACT,
  metricsBundle: buildMetricsBundle(),
  provenanceChain: buildProvenanceChain(),
  ledgerBundle: buildLedger(),

  /* ---- trust sphere ---- */
  trustSphere: CONTRACT.trustSphere,
  setTrustSphere: (ts) => set({ trustSphere: ts }),
  sphereVerified: 0,
  sphereTotal: 380,
  setSphereMetrics: (verified, total) => set({ sphereVerified: verified, sphereTotal: total }),

  /* ---- proof graph ---- */
  proofGraph: buildProofGraph(0, [false, false, false, false, false, false, false, false]),
  proofProgress: 0,
  advanceProof: () => {
    const { proofProgress } = get();
    const next = Math.min(proofProgress + 1, 8);
    set({
      proofProgress: next,
      proofGraph: buildProofGraph(next, [
        true, true, true, false, false, false, false, false,
      ]),
    });
  },
  resetProof: () =>
    set({
      proofProgress: 0,
      proofGraph: buildProofGraph(0, [false, false, false, false, false, false, false, false]),
    }),

  /* ---- evidence runtime ---- */
  evidenceTimeline: EVIDENCE_TIMELINE,
  evidenceCursor: 0,
  advanceEvidence: () => {
    const { evidenceCursor, evidenceTimeline } = get();
    set({ evidenceCursor: Math.min(evidenceCursor + 1, evidenceTimeline.length) });
  },
  resetEvidence: () => set({ evidenceCursor: 0 }),

  /* ---- plugin registry ---- */
  plugins: PLUGINS,
  setPluginState: (id, state) =>
    set((s) => ({
      plugins: s.plugins.map((p) => (p.id === id ? { ...p, state } : p)),
    })),

  /* ---- AMD runtime ---- */
  hardwareProfile: CONTRACT.hardware_profile,

  /* ---- Zoo runtime ---- */
  zooStatus: CONTRACT.telemetry.zooApiIntegration,

  /* ---- telemetry / circuit breaker ---- */
  circuitBreaker: "NORMAL",
  telemetry: CONTRACT.telemetry,
  setTelemetry: (t) => set({ telemetry: t }),

  /* ---- HBK workspace ---- */
  hbk: {
    cadParts: CAD_PARTS,
    architecture: HBK_ARCHITECTURE,
    activePartId: CAD_PARTS[0].id,
    setActivePartId: (id) => set((s) => ({ hbk: { ...s.hbk, activePartId: id } })),
  },

  /* ---- artifacts ---- */
  artifacts: ARTIFACTS,

  /* ---- explorer ---- */
  explorerTree: [
    {
      name: "proofbridge-liner",
      path: "/",
      kind: "dir",
      children: [
        { name: "README.md", path: "/README.md", kind: "file", meta: "IVE platform identity" },
        { name: "RELEASE_FREEZE.md", path: "/RELEASE_FREEZE.md", kind: "file", meta: "frozen contract" },
        { name: "IMPLEMENTATION_REPORT.md", path: "/IMPLEMENTATION_REPORT.md", kind: "file", meta: "release report" },
        {
          name: "cad",
          path: "/cad",
          kind: "dir",
          children: [
            { name: "hydroGatewayMain.kcl", path: "/cad/hydroGatewayMain.kcl", kind: "file", meta: "assembly" },
            { name: "pressure_pipe.kcl", path: "/cad/pressure_pipe.kcl", kind: "file", meta: "DN260 spool" },
            { name: "skid_base.kcl", path: "/cad/skid_base.kcl", kind: "file", meta: "platform" },
            { name: "pump_module.kcl", path: "/cad/pump_module.kcl", kind: "file", meta: "hydraulic" },
          ],
        },
        {
          name: "outputs",
          path: "/outputs",
          kind: "dir",
          children: [
            { name: "results.json", path: "/outputs/results.json", kind: "file", meta: "raw metrics" },
            { name: "provenance.json", path: "/outputs/provenance.json", kind: "file", meta: "chain" },
            { name: "ledger.json", path: "/outputs/ledger.json", kind: "file", meta: "append-only" },
          ],
        },
        {
          name: "ive-output",
          path: "/ive-output",
          kind: "dir",
          children: [
            { name: "results.json", path: "/ive-output/results.json", kind: "file", meta: "frozen contract" },
            { name: "checksums.txt", path: "/ive-output/checksums.txt", kind: "file", meta: "sha256" },
          ],
        },
        {
          name: "runs",
          path: "/runs",
          kind: "dir",
          children: [
            { name: "cpu", path: "/runs/cpu", kind: "dir", meta: "Ryzen baseline" },
            { name: "rocm", path: "/runs/rocm", kind: "dir", meta: "ROCm translation" },
            { name: "amd-validation", path: "/runs/amd-validation", kind: "dir", meta: "local Radeon" },
          ],
        },
        {
          name: "docs",
          path: "/docs",
          kind: "dir",
          children: [
            { name: "architecture.md", path: "/docs/architecture.md", kind: "file" },
            { name: "evidence-model.md", path: "/docs/evidence-model.md", kind: "file" },
          ],
        },
      ],
    },
  ],

  /* ---- ledger (frozen, preserved) ---- */
  ledgerEntries: LEDGER,

  /* ---- obligations ---- */
  obligations: CONTRACT.obligations,
}));

/* Panel catalog (used by sidebar + command palette). */
export interface PanelMeta {
  id: WorkspacePanelId;
  label: string;
  tag: string;
  accent: string;
  mission: string;
  group: "core" | "runtime" | "case-study" | "system" | "release";
}

export const PANELS: PanelMeta[] = [
  { id: "overview", label: "Overview", tag: "IVE", accent: "#C9A84C", mission: "Engineering OS landing — identity, workflow, release status.", group: "core" },
  { id: "trust", label: "Trust Sphere", tag: "TS", accent: "#b23dff", mission: "Fibonacci verification state space. Six dimensions + release. No aggregate percentage.", group: "core" },
  { id: "proof", label: "Proof Graph", tag: "PG", accent: "#3dffb0", mission: "Engineering DAG: provenance → geometry → spec → obligations → solver → evidence → ledger → release.", group: "core" },
  { id: "evidence", label: "Evidence Runtime", tag: "ER", accent: "#3d9bff", mission: "Deterministic evidence timeline. Never fabricates evidence.", group: "core" },
  { id: "release", label: "Release Report", tag: "RR", accent: "#ff4d5f", mission: "Release-readiness report ending in exactly one disposition. Required-fixes table with severity and blocking.", group: "release" },
  { id: "adapter", label: "Adapter Attribution", tag: "ADP", accent: "#3d9bff", mission: "Source attribution for every normalized contract field. No inference from filenames or branch names.", group: "release" },
  { id: "integrity", label: "Integrity Closure", tag: "INT", accent: "#C9A84C", mission: "Checksum index spec, ledger-root boundary, covered-artifact registry.", group: "release" },
  { id: "acceptance", label: "Acceptance", tag: "ACC", accent: "#3dffb0", mission: "Dashboard acceptance checklist — build, startup, contract-load, no-hardcoded, no-raw-reads, no-cert-wording.", group: "release" },
  { id: "identity", label: "Identity Registry", tag: "IDR", accent: "#b23dff", mission: "Platform vs demo vs independent components vs historical. Legitimate references preserved, not deleted.", group: "release" },
  { id: "plugins", label: "Plugin Registry", tag: "PR", accent: "#C9A84C", mission: "Plugin lifecycle: NOT_INSTALLED → INSTALLED → DORMANT → ACTIVATED → RUNNING → IDLE.", group: "runtime" },
  { id: "amd", label: "AMD Runtime", tag: "AMD", accent: "#CC7722", mission: "ROCm / HIP / PyTorch GPU acceleration status. Local Radeon emulation context.", group: "runtime" },
  { id: "zoo", label: "Zoo Runtime", tag: "ZOO", accent: "#3dffb0", mission: "Native Zoo APIs vs project wrappers. Clearly labelled, never conflated.", group: "runtime" },
  { id: "hbk", label: "HBK Workspace", tag: "HBK", accent: "#ff4d5f", mission: "HBK MK-II Hydro-Gateway demonstration case study.", group: "case-study" },
  { id: "cad", label: "CAD Viewer", tag: "CAD", accent: "#C9A84C", mission: "Procedural KCL geometry inspection for the Hydro-Gateway.", group: "case-study" },
  { id: "artifacts", label: "Artifacts", tag: "ART", accent: "#8b949e", mission: "Generated evidence package: results, metrics, ledger, provenance, checksums.", group: "system" },
  { id: "explorer", label: "Explorer", tag: "FS", accent: "#8b949e", mission: "Repository file tree — proofbridge-liner layout.", group: "system" },
  { id: "telemetry", label: "Telemetry", tag: "TLM", accent: "#3d9bff", mission: "Live runtime metrics and raw execution data.", group: "system" },
  { id: "terminal", label: "Terminal", tag: "TTY", accent: "#3dffb0", mission: "Engineering command terminal — deterministic, read-only replay.", group: "system" },
  { id: "watchdog", label: "Watchdog", tag: "WDG", accent: "#ff4d5f", mission: "Hardware watchdog + safety interlock monitor. Fails to non-actuating state.", group: "system" },
  { id: "lindiwe", label: "Lindiwe", tag: "LIN", accent: "#b23dff", mission: "Agent orchestrator — specification assistance and evidence review.", group: "system" },
];

export const PANEL_MAP: Record<WorkspacePanelId, PanelMeta> = PANELS.reduce(
  (acc, p) => { acc[p.id] = p; return acc; },
  {} as Record<WorkspacePanelId, PanelMeta>,
);
