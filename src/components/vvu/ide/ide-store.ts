/**
 * VVU IDE Store
 *
 * Zustand-based state management for the Deterministic Operating Environment.
 * This is the "kernel" of the VS Code-like plugin architecture.
 *
 * Every module is a plugin. The canvas is the authority.
 * Lindiwe operates in dual modality (Terminal + Side Panel).
 * Autonomy is user-controlled via a strict Trust Dial.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Core plugins — the "Extensions" in the Activity Bar */
export type PluginId =
  | 'UBUNTU_POOLS'
  | 'PROOFBRIDGE'
  | 'HBK'
  | 'AIR_COMPUTE'
  | 'LINDIWE'
  | 'EXPLORER'
  | 'WALLET';

/** Canvas tabs — the live environments in the Main Canvas */
export type CanvasTab =
  | 'TRUST_SPHERE_3D'
  | 'TERMINAL'
  | 'CAD_VIEWER'
  | 'SYSTEM_LOG';

/** Lindiwe Autonomy Level — the Trust Dial */
export type AutonomyLevel = 1 | 2 | 3;

export const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  1: 'Observer',
  2: 'Action-Safe',
  3: 'Watchdog',
};

export const AUTONOMY_COLORS: Record<AutonomyLevel, string> = {
  1: '#3b82f6',   // steady blue
  2: '#eab308',   // pulsing yellow
  3: '#ef4444',   // aggressive red
};

export const AUTONOMY_DESCRIPTIONS: Record<AutonomyLevel, string> = {
  1: 'Passive — Lindiwe only speaks when spoken to. Reads telemetry and logs but never interrupts.',
  2: 'Active — Lindiwe monitors and pre-writes fixes. Will not execute until you confirm.',
  3: 'Autonomous — Lindiwe has override authority. Will circuit-break on critical events.',
};

/** Circuit Breaker state */
export type CircuitBreakerState = 'NORMAL' | 'DEGRADED' | 'TRIGGERED';

/** A single tab in the canvas */
export interface OpenTab {
  id: CanvasTab;
  label: string;
  icon: string;
  isLive?: boolean;
  isDirty?: boolean;
}

/** Plugin metadata for the Activity Bar */
export interface PluginMeta {
  id: PluginId;
  label: string;
  icon: string;
  color: string;
  description: string;
  shortcut?: string;
}

/** Command for the Command Palette */
export interface IDECommand {
  id: string;
  label: string;
  plugin: PluginId;
  category: string;
  shortcut?: string;
  action?: () => void;
}

/** Log entry for the terminal */
export interface TerminalEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  source: string;
  message: string;
}

/** Full IDE state */
export interface IDEState {
  // ---- Core Layout ----
  activePlugin: PluginId;
  sidebarOpen: boolean;
  sidebarWidth: number;
  lindiwePanelOpen: boolean;
  lindiwePanelWidth: number;
  commandPaletteOpen: boolean;
  focusMode: boolean;

  // ---- Canvas ----
  openTabs: OpenTab[];
  activeTab: CanvasTab;

  // ---- Lindiwe ----
  autonomyLevel: AutonomyLevel;
  circuitBreaker: CircuitBreakerState;
  lindiweTerminalOpen: boolean;
  terminalEntries: TerminalEntry[];
  lindiweMode: 'operator' | 'advisor';

  // ---- Circuit Breaker ----
  circuitBreakerReason: string | null;
  circuitBreakerTimestamp: string | null;

  // ---- Compute Engine ----
  computeMetrics: {
    activePipelines: number;
    cpuUtilisation: number;
    memoryUsed: number;
    memoryTotal: number;
    trustScore: number;
    eventsProcessed: number;
    uptime: string;
  };

  // ---- Actions ----
  setActivePlugin: (id: PluginId) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  toggleLindiwePanel: () => void;
  setLindiwePanelWidth: (w: number) => void;
  toggleCommandPalette: () => void;
  setFocusMode: (f: boolean) => void;

  addTab: (tab: OpenTab) => void;
  removeTab: (id: CanvasTab) => void;
  setActiveTab: (id: CanvasTab) => void;

  setAutonomyLevel: (level: AutonomyLevel) => void;
  setCircuitBreaker: (state: CircuitBreakerState, reason?: string) => void;
  toggleLindiweTerminal: () => void;
  addTerminalEntry: (entry: Omit<TerminalEntry, 'id' | 'timestamp'>) => void;
  clearTerminalEntries: () => void;
  setLindiweMode: (mode: 'operator' | 'advisor') => void;

  updateComputeMetrics: (metrics: Partial<IDEState['computeMetrics']>) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PLUGINS: PluginMeta[] = [
  {
    id: 'EXPLORER',
    label: 'Explorer',
    icon: 'Files',
    color: '#9ca3af',
    description: 'Project files, workspace structure, and navigation',
    shortcut: '⌘⇧E',
  },
  {
    id: 'UBUNTU_POOLS',
    label: 'Ubuntu Pools',
    icon: 'Globe',
    color: '#3dd6ff',
    description: 'Governance & Community plugin — Stokvels, constitutions, proposals',
    shortcut: '⌘⇧U',
  },
  {
    id: 'PROOFBRIDGE',
    label: 'ProofBridge',
    icon: 'ShieldCheck',
    color: '#3dffb0',
    description: 'Cryptographic receipt & ledger plugin — Verify, sign, anchor',
    shortcut: '⌘⇧P',
  },
  {
    id: 'HBK',
    label: 'HBK',
    icon: 'Droplets',
    color: '#C9A84C',
    description: 'Hydro-Bayesian simulation plugin — MCMC pipeline, node management',
    shortcut: '⌘⇧H',
  },
  {
    id: 'AIR_COMPUTE',
    label: 'AIR / Compute',
    icon: 'Zap',
    color: '#b23dff',
    description: 'Inference and telemetry plugin — GPU stats, model serving',
    shortcut: '⌘⇧A',
  },
  {
    id: 'LINDIWE',
    label: 'Lindiwe',
    icon: 'Bot',
    color: '#a855f7',
    description: 'AI Agent / Copilot plugin — Dual modality (Operator + Advisor)',
    shortcut: '⌘⇧L',
  },
];

export const DEFAULT_TABS: OpenTab[] = [
  {
    id: 'TRUST_SPHERE_3D',
    label: 'Trust Sphere',
    icon: '🌍',
    isLive: true,
  },
  {
    id: 'TERMINAL',
    label: 'output.log',
    icon: '>_',
  },
  {
    id: 'CAD_VIEWER',
    label: 'CAD Visualizer',
    icon: '📐',
  },
];

export const COMMANDS: IDECommand[] = [
  { id: 'hbk-init', label: 'Initialize HBK Simulation (Cape Town)', plugin: 'HBK', category: 'HBK', shortcut: '⌘⇧H I' },
  { id: 'hbk-run', label: 'Run HBK Pipeline', plugin: 'HBK', category: 'HBK', shortcut: '⌘⇧H R' },
  { id: 'hbk-stop', label: 'Stop HBK Simulation', plugin: 'HBK', category: 'HBK' },
  { id: 'pools-propose', label: 'Propose Constitution Amendment', plugin: 'UBUNTU_POOLS', category: 'Pools' },
  { id: 'pools-vote', label: 'Cast Vote on Active Proposal', plugin: 'UBUNTU_POOLS', category: 'Pools' },
  { id: 'pools-stokvel', label: 'Create Stokvel Pool', plugin: 'UBUNTU_POOLS', category: 'Pools' },
  { id: 'proof-verify', label: 'Verify Canvas State', plugin: 'PROOFBRIDGE', category: 'ProofBridge' },
  { id: 'proof-sign', label: 'Sign Current Artifact', plugin: 'PROOFBRIDGE', category: 'ProofBridge' },
  { id: 'proof-anchor', label: 'Anchor Receipt to MMR', plugin: 'PROOFBRIDGE', category: 'ProofBridge' },
  { id: 'air-status', label: 'Check Compute Status', plugin: 'AIR_COMPUTE', category: 'AIR' },
  { id: 'air-deploy', label: 'Deploy Model to Endpoint', plugin: 'AIR_COMPUTE', category: 'AIR' },
  { id: 'lindiwe-ask', label: 'Ask Lindiwe', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-reroute', label: 'Reroute Node', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-autonomy-1', label: 'Set Autonomy: Observer', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-autonomy-2', label: 'Set Autonomy: Action-Safe', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-autonomy-3', label: 'Set Autonomy: Watchdog', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'sphere-focus', label: 'Focus Trust Sphere', plugin: 'EXPLORER', category: 'Canvas' },
  { id: 'terminal-clear', label: 'Clear Terminal', plugin: 'EXPLORER', category: 'Canvas' },
  { id: 'circuit-break', label: 'Emergency Circuit Break', plugin: 'LINDIWE', category: 'System' },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useIDEStore = create<IDEState>((set, get) => ({
  // ---- Core Layout ----
  activePlugin: 'HBK',
  sidebarOpen: true,
  sidebarWidth: 260,
  lindiwePanelOpen: false,
  lindiwePanelWidth: 340,
  commandPaletteOpen: false,
  focusMode: false,

  // ---- Canvas ----
  openTabs: DEFAULT_TABS,
  activeTab: 'TRUST_SPHERE_3D',

  // ---- Lindiwe ----
  autonomyLevel: 2, // Action-Safe is the default
  circuitBreaker: 'NORMAL',
  lindiweTerminalOpen: false,
  terminalEntries: [
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'system',
      message: 'VVU Deterministic Operating Environment initialized.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'lindiwe',
      message: 'Lindiwe AI Agent online. Autonomy: Action-Safe (Level 2).',
    },
    {
      id: 'init-3',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'hbk',
      message: 'HBK plugin loaded. Cape Town simulation standing by.',
    },
  ],
  lindiweMode: 'advisor',

  // ---- Circuit Breaker ----
  circuitBreakerReason: null,
  circuitBreakerTimestamp: null,

  // ---- Compute Engine ----
  computeMetrics: {
    activePipelines: 4,
    cpuUtilisation: 34,
    memoryUsed: 2.7,
    memoryTotal: 8,
    trustScore: 72,
    eventsProcessed: 12847,
    uptime: '14h 32m',
  },

  // ---- Actions ----

  setActivePlugin: (id) => {
    set({ activePlugin: id, sidebarOpen: true });
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarOpen: !s.sidebarOpen }));
  },

  setSidebarWidth: (w) => {
    set({ sidebarWidth: Math.max(200, Math.min(400, w)) });
  },

  toggleLindiwePanel: () => {
    set((s) => ({ lindiwePanelOpen: !s.lindiwePanelOpen }));
  },

  setLindiwePanelWidth: (w) => {
    set({ lindiwePanelWidth: Math.max(280, Math.min(500, w)) });
  },

  toggleCommandPalette: () => {
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen }));
  },

  setFocusMode: (f) => {
    set({ focusMode: f });
  },

  addTab: (tab) => {
    set((s) => {
      if (s.openTabs.find((t) => t.id === tab.id)) return s;
      return { openTabs: [...s.openTabs, tab] };
    });
  },

  removeTab: (id) => {
    set((s) => {
      const newTabs = s.openTabs.filter((t) => t.id !== id);
      const newActive = s.activeTab === id
        ? (newTabs[newTabs.length - 1]?.id ?? 'TRUST_SPHERE_3D')
        : s.activeTab;
      return { openTabs: newTabs, activeTab: newActive as CanvasTab };
    });
  },

  setActiveTab: (id) => {
    set({ activeTab: id });
  },

  setAutonomyLevel: (level) => {
    set((s) => {
      // If setting to Watchdog (3), add a terminal entry
      const newEntries = level === 3
        ? [
            ...s.terminalEntries,
            {
              id: `cb-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'warn' as const,
              source: 'lindiwe',
              message: '⚠ WATCHDOG MODE ACTIVATED. Lindiwe now has override authority. Circuit-breaker is armed.',
            },
          ]
        : s.terminalEntries;
      return { autonomyLevel: level, terminalEntries: newEntries };
    });
  },

  setCircuitBreaker: (state, reason) => {
    set((s) => {
      if (state === 'TRIGGERED') {
        return {
          circuitBreaker: state,
          circuitBreakerReason: reason ?? 'UNKNOWN ANOMALY',
          circuitBreakerTimestamp: new Date().toISOString(),
          terminalEntries: [
            ...s.terminalEntries,
            {
              id: `cb-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'critical' as const,
              source: 'watchdog',
              message: `[CRITICAL] WATCHDOG INITIATED. SESSION CIRCUIT-BROKEN. REASON: ${reason ?? 'UNKNOWN ANOMALY'}. AWAITING OPERATOR OVERRIDE.`,
            },
          ],
        };
      }
      if (state === 'DEGRADED') {
        return {
          circuitBreaker: state,
          circuitBreakerReason: reason ?? null,
          terminalEntries: [
            ...s.terminalEntries,
            {
              id: `cb-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'warn' as const,
              source: 'watchdog',
              message: `[DEGRADED] Performance anomaly detected: ${reason ?? 'unspecified'}. Monitoring.`,
            },
          ],
        };
      }
      // NORMAL
      return {
        circuitBreaker: 'NORMAL',
        circuitBreakerReason: null,
        circuitBreakerTimestamp: null,
        terminalEntries: [
          ...s.terminalEntries,
          {
            id: `cb-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'info' as const,
            source: 'watchdog',
            message: 'Circuit breaker reset. All systems nominal.',
          },
        ],
      };
    });
  },

  toggleLindiweTerminal: () => {
    set((s) => ({ lindiweTerminalOpen: !s.lindiweTerminalOpen }));
  },

  addTerminalEntry: (entry) => {
    set((s) => ({
      terminalEntries: [
        ...s.terminalEntries,
        {
          ...entry,
          id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  },

  clearTerminalEntries: () => {
    set({ terminalEntries: [] });
  },

  setLindiweMode: (mode) => {
    set({ lindiweMode: mode });
  },

  updateComputeMetrics: (metrics) => {
    set((s) => ({
      computeMetrics: { ...s.computeMetrics, ...metrics },
    }));
  },
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectActivePlugin = (s: IDEState) => s.activePlugin;
export const selectActiveTab = (s: IDEState) => s.activeTab;
export const selectAutonomyLevel = (s: IDEState) => s.autonomyLevel;
export const selectCircuitBreaker = (s: IDEState) => s.circuitBreaker;
