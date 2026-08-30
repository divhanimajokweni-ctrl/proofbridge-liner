// @ts-nocheck
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

  /* ---- notification / activity center ---- */
  notifications: ActivityNotification[];
  notifCenterOpen: boolean;
  setNotifCenterOpen: (open: boolean) => void;
  pushNotification: (n: Omit<ActivityNotification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  unreadCount: () => number;

  /* ---- recently visited panels (for header quick-switch) ---- */
  recentPanels: WorkspacePanelId[];

  /* ---- guided tour ---- */
  tourActive: boolean;
  tourStep: number;
  startTour: () => void;
  stopTour: () => void;
  advanceTour: () => void;
  setTourStep: (step: number) => void;

  /* ---- mission control floating widget + stats HUD ---- */
  missionControlOpen: boolean;
  setMissionControlOpen: (open: boolean) => void;
  statsHudOpen: boolean;
  setStatsHudOpen: (open: boolean) => void;

  /* ---- user settings (persisted to localStorage) ---- */
  settings: IVESettings;
  updateSettings: (patch: Partial<IVESettings>) => void;
}

export interface IVESettings {
  /** Skip the boot sequence automatically on subsequent visits. */
  autoSkipBoot: boolean;
  /** Animation intensity: "full" | "reduced" | "none". */
  animationIntensity: "full" | "reduced" | "none";
  /** Default-open widgets on workspace mount. */
  defaultOpenMissionControl: boolean;
  defaultOpenStatsHud: boolean;
  /** Accent color override (hex) or "gold" for the default #C9A84C. */
  accentOverride: string | "gold";
  /** Show the boot sound-wave visualization. */
  showBootSoundWave: boolean;
}

const SETTINGS_KEY = "ive-settings-v1";
const DEFAULT_SETTINGS: IVESettings = {
  autoSkipBoot: false,
  animationIntensity: "full",
  defaultOpenMissionControl: false,
  defaultOpenStatsHud: false,
  accentOverride: "gold",
  showBootSoundWave: true,
};

function loadSettings(): IVESettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: IVESettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export interface ActivityNotification {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  source: string;
  title: string;
  detail: string;
  panel?: WorkspacePanelId;
  read: boolean;
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
  setActivePanel: (panel) =>
    set((s) => {
      const recent = [panel, ...s.recentPanels.filter((p) => p !== panel)].slice(0, 6);
      return { activePanel: panel, recentPanels: recent };
    }),

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
    const { proofProgress, pushNotification } = get();
    const next = Math.min(proofProgress + 1, 8);
    const nodeLabels = [
      "Input Provenance", "Geometry", "Specification", "Proof Obligations",
      "Solver", "Evidence", "Ledger", "Engineering Release",
    ];
    set({
      proofProgress: next,
      proofGraph: buildProofGraph(next, [
        true, true, true, false, false, false, false, false,
      ]),
    });
    // Live event: notify the activity center of the stage transition.
    const label = nodeLabels[next - 1] ?? `stage ${next}`;
    const isRelease = next === 8;
    pushNotification({
      level: isRelease ? "error" : next >= 6 ? "success" : "info",
      source: "Proof Graph",
      title: isRelease ? "Engineering Release: BLOCKED" : `Proof stage advanced: ${label}`,
      detail: isRelease
        ? "Terminal node reached. Release remains BLOCKED — solver not linked, obligations NOT_EVALUATED."
        : `Stage ${next}/8 (${label}) advanced. Status derived from runtime evidence.`,
      panel: "proof",
    });
  },
  resetProof: () => {
    const { pushNotification } = get();
    set({
      proofProgress: 0,
      proofGraph: buildProofGraph(0, [false, false, false, false, false, false, false, false]),
    });
    pushNotification({
      level: "warn",
      source: "Proof Graph",
      title: "Proof graph reset",
      detail: "All stages returned to PENDING. No evidence discarded — runtime state only.",
      panel: "proof",
    });
  },

  /* ---- evidence runtime ---- */
  evidenceTimeline: EVIDENCE_TIMELINE,
  evidenceCursor: 0,
  advanceEvidence: () => {
    const { evidenceCursor, evidenceTimeline, pushNotification } = get();
    const next = Math.min(evidenceCursor + 1, evidenceTimeline.length);
    set({ evidenceCursor: next });
    const ev = evidenceTimeline[next - 1];
    if (ev) {
      pushNotification({
        level: ev.level,
        source: "Evidence Runtime",
        title: `${ev.stage}: ${ev.message.split("—")[0]?.trim() ?? ev.message}`,
        detail: `${ev.timestamp} · ${ev.evidenced ? "EVIDENCED" : "NOT EVIDENCED — timeline reflects intended sequence"}`,
        panel: "evidence",
      });
    }
  },
  resetEvidence: () => {
    const { pushNotification } = get();
    set({ evidenceCursor: 0 });
    pushNotification({
      level: "warn",
      source: "Evidence Runtime",
      title: "Evidence timeline reset",
      detail: "Cursor returned to start. Timeline events preserved — no evidence discarded.",
      panel: "evidence",
    });
  },

  /* ---- plugin registry ---- */
  plugins: PLUGINS,
  setPluginState: (id, state) => {
    const { plugins, pushNotification } = get();
    const plugin = plugins.find((p) => p.id === id);
    set((s) => ({
      plugins: s.plugins.map((p) => (p.id === id ? { ...p, state } : p)),
    }));
    if (plugin) {
      pushNotification({
        level: state === "RUNNING" ? "success" : state === "NOT_INSTALLED" ? "error" : "info",
        source: "Plugin Registry",
        title: `${plugin.label}: ${state}`,
        detail: `Lifecycle transition. Plugin is ${plugin.native ? "native" : "wrapper-layer"}. ${plugin.description.slice(0, 80)}`,
        panel: "plugins",
      });
    }
  },

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

  /* ---- notification / activity center ---- */
  notifications: [
    {
      id: "seed-01",
      timestamp: new Date(Date.now() - 42000).toISOString(),
      level: "error",
      source: "Release Gate",
      title: "Engineering Release: BLOCKED",
      detail:
        "Three BLOCKER required fixes prevent submission. Adapter script and verify_release.py not exposed; ive-output/results.json not on disk.",
      panel: "release",
      read: false,
    },
    {
      id: "seed-02",
      timestamp: new Date(Date.now() - 180000).toISOString(),
      level: "warn",
      source: "Trust Sphere",
      title: "Determinism NOT_EVALUATED",
      detail:
        "Execution seeds (NumPy, PyTorch, DataLoader) pending verification. Dimension remains unevaluated.",
      panel: "trust",
      read: false,
    },
    {
      id: "seed-03",
      timestamp: new Date(Date.now() - 360000).toISOString(),
      level: "success",
      source: "AMD Runtime",
      title: "Local Radeon emulation pass retained",
      detail:
        "Run ive-rocm-local-20260805 retained as candidate authoritative run. 4.249× speedup against CPU baseline.",
      panel: "amd",
      read: false,
    },
    {
      id: "seed-04",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: "info",
      source: "Zoo Runtime",
      title: "Native API execution NOT_DEMONSTRATED",
      detail:
        "Wrapper layer implemented at pipeline/compute_provider.py. Native Zoo Engine API calls not found in execution trace.",
      panel: "zoo",
      read: true,
    },
    {
      id: "seed-05",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: "info",
      source: "Identity Registry",
      title: "Historical run preserved",
      detail:
        "CPU baseline (ive-cpu-baseline-20260801) retained byte-for-byte. Not harmonized — terminology reflects time of execution.",
      panel: "identity",
      read: true,
    },
  ],
  notifCenterOpen: false,
  setNotifCenterOpen: (open) => set({ notifCenterOpen: open }),
  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...s.notifications,
      ].slice(0, 50),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  /* ---- recently visited panels ---- */
  recentPanels: ["overview" as WorkspacePanelId],

  /* ---- guided tour ---- */
  tourActive: false,
  tourStep: 0,
  startTour: () => set({ tourActive: true, tourStep: 0, activePanel: "overview" }),
  stopTour: () => set({ tourActive: false }),
  advanceTour: () => {
    const { tourStep, pushNotification } = get();
    const next = tourStep + 1;
    const steps = TOUR_STEPS;
    if (next >= steps.length) {
      set({ tourActive: false });
      pushNotification({
        level: "success",
        source: "Guided Tour",
        title: "Tour complete",
        detail: "Walked all 8 tour stops. Explore freely — press Esc or click Exit to dismiss.",
        panel: "overview",
      });
    } else {
      set({ tourStep: next, activePanel: steps[next].panel });
    }
  },
  setTourStep: (step) => {
    const steps = TOUR_STEPS;
    const clamped = Math.max(0, Math.min(step, steps.length - 1));
    set({ tourStep: clamped, activePanel: steps[clamped].panel });
  },

  /* ---- mission control floating widget + stats HUD ---- */
  missionControlOpen: false,
  setMissionControlOpen: (open) => set({ missionControlOpen: open }),
  statsHudOpen: false,
  setStatsHudOpen: (open) => set({ statsHudOpen: open }),

  /* ---- user settings (persisted to localStorage) ---- */
  settings: loadSettings(),
  updateSettings: (patch) =>
    set((s) => {
      const next = { ...s.settings, ...patch };
      saveSettings(next);
      return { settings: next };
    }),
}));

/** Guided tour stops — each navigates to a panel and shows an explanation. */
export const TOUR_STEPS: { panel: WorkspacePanelId; title: string; detail: string }[] = [
  {
    panel: "overview",
    title: "Welcome to IVE",
    detail:
      "The VVU Integrated Verification Environment. Engineer systems that can prove themselves. This tour walks the core workflow in 8 stops.",
  },
  {
    panel: "trust",
    title: "Trust Sphere",
    detail:
      "A Fibonacci verification state space with 380 living nodes. The frozen dimensions below show evidence status — Safety is OUT_OF_SCOPE, Integrity VERIFIED, Determinism NOT_EVALUATED. No aggregate percentage. Engineering Release: BLOCKED.",
  },
  {
    panel: "proof",
    title: "Proof Graph",
    detail:
      "The engineering DAG: Input Provenance → Geometry → Specification → Proof Obligations → Solver → Evidence → Ledger → Engineering Release. Click Advance to walk the graph. The terminal node stays BLOCKED until evidence exists.",
  },
  {
    panel: "evidence",
    title: "Evidence Runtime",
    detail:
      "A deterministic timeline of engineering events. Every event is tagged EVIDENCED or NOT EVIDENCED. The runtime never fabricates evidence — missing inputs surface explicitly.",
  },
  {
    panel: "release",
    title: "Release Report",
    detail:
      "The release-readiness report ends in exactly one disposition. Currently NO-GO with 3 BLOCKER required fixes — the adapter script, the release-gate script, and on-disk results.json are not yet exposed for inspection.",
  },
  {
    panel: "amd",
    title: "AMD Runtime",
    detail:
      "Local Radeon emulation context on branch mi300x-rocm-run-20260804. 4.249× speedup against the CPU baseline. Remote cloud compute is NotImplemented. Seed determinism NOT_EVALUATED.",
  },
  {
    panel: "hbk",
    title: "HBK MK-II Hydro-Gateway",
    detail:
      "The demonstration application — NOT the platform. A hydraulic infrastructure case study showing how IVE maps geometry limits and tracks execution traces. Hydraulic actuation authority is UNDEFINED; the baseline fails to non-actuating.",
  },
  {
    panel: "acceptance",
    title: "Acceptance Checklist",
    detail:
      "8/8 dashboard acceptance checks pass: build, startup, contract-load, missing-state handling, no-hardcoded values, no-raw-reads, no-cert-wording, artifact-driven. A screenshot alone does not prove the dashboard is artifact-driven.",
  },
];

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
  { id: "settings", label: "Settings", tag: "SET", accent: "#8b949e", mission: "User preferences — boot auto-skip, animation intensity, widget defaults, accent override.", group: "system" },
  { id: "help", label: "Help & FAQ", tag: "FAQ", accent: "#3d9bff", mission: "Evaluator-oriented questions and answers — what IVE is, why release is BLOCKED, how to navigate.", group: "system" },
];

export const PANEL_MAP: Record<WorkspacePanelId, PanelMeta> = PANELS.reduce(
  (acc, p) => { acc[p.id] = p; return acc; },
  {} as Record<WorkspacePanelId, PanelMeta>,
);
