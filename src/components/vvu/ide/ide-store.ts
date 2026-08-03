/**
 * VVU IDE Store — Zookeeper Runtime Architecture
 *
 * Zookeeper is the native orchestration runtime. Everything else is a
 * capability that plugs into it. Lindiwe is a specialist agent, not
 * the orchestrator. Watchdog is a separate specialist.
 *
 * Plugin Lifecycle:
 *   Not Installed → Installed → Dormant → Activated → Running → Idle → Dormant
 *
 * Adapter Interface (every integration conforms):
 *   initialize() → discover() → authenticate() → execute() → observe() → shutdown()
 *
 * Core Runtime Services (always running):
 *   Scheduler, Event Bus, Cryptographic Ledger,
 *   Provenance Engine, Plugin Manager, Policy Engine
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Plugin Lifecycle
// ---------------------------------------------------------------------------

export type PluginLifecycle =
  | 'not_installed'
  | 'installed'
  | 'dormant'
  | 'activated'
  | 'running'
  | 'idle';

export const LIFECYCLE_ORDER: PluginLifecycle[] = [
  'not_installed',
  'installed',
  'dormant',
  'activated',
  'running',
  'idle',
];

export const LIFECYCLE_COLORS: Record<PluginLifecycle, string> = {
  not_installed: '#4b5563',
  installed: '#6b7280',
  dormant: '#8b5cf6',
  activated: '#3b82f6',
  running: '#3dffb0',
  idle: '#eab308',
};

export const LIFECYCLE_LABELS: Record<PluginLifecycle, string> = {
  not_installed: 'Not Installed',
  installed: 'Installed',
  dormant: 'Dormant',
  activated: 'Activated',
  running: 'Running',
  idle: 'Idle',
};

// ---------------------------------------------------------------------------
// Adapter Lifecycle Methods
// ---------------------------------------------------------------------------

export type AdapterMethod = 'initialize' | 'discover' | 'authenticate' | 'execute' | 'observe' | 'shutdown';

export const ADAPTER_METHODS: AdapterMethod[] = [
  'initialize',
  'discover',
  'authenticate',
  'execute',
  'observe',
  'shutdown',
];

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/** Activity Bar plugins — the "Extensions" */
export type PluginId =
  | 'ZOOKEEPER'
  | 'EXPLORER'
  | 'UBUNTU_POOLS'
  | 'PROOFBRIDGE'
  | 'HBK'
  | 'AIR_COMPUTE'
  | 'LINDIWE'
  | 'WATCHDOG'
  | 'WALLET';

/** Canvas tabs — the live environments in the Main Canvas */
export type CanvasTab =
  | 'TRUST_SPHERE_3D'
  | 'TERMINAL'
  | 'CAD_VIEWER'
  | 'SYSTEM_BOOT'
  | 'SYSTEM_LOG';

/** Lindiwe Autonomy Level — the Trust Dial */
export type AutonomyLevel = 1 | 2 | 3;

export const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  1: 'Observer',
  2: 'Action-Safe',
  3: 'Watchdog',
};

export const AUTONOMY_COLORS: Record<AutonomyLevel, string> = {
  1: '#3b82f6',
  2: '#eab308',
  3: '#ef4444',
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
  /** Whether this is a core runtime service (always running) */
  isCore?: boolean;
  /** Whether this is a specialist agent under Zookeeper */
  isSpecialist?: boolean;
}

/** A registered adapter (AMD, Zoom, GitHub, etc.) */
export interface Adapter {
  id: string;
  label: string;
  icon: string;
  color: string;
  category: 'native' | 'vendor' | 'user';
  lifecycle: PluginLifecycle;
  /** Which adapter methods have been called */
  completedMethods: AdapterMethod[];
  /** Last activity timestamp */
  lastActivity: string | null;
  /** Whether this adapter is installed */
  installed: boolean;
  /** Vendor or source */
  vendor?: string;
  /** Description */
  description: string;
}

/** Core Runtime Service status */
export interface CoreService {
  id: string;
  label: string;
  status: 'running' | 'idle' | 'error';
  uptime: string;
  eventsProcessed: number;
  lastEvent: string | null;
}

/** Command for the Command Palette */
export interface IDECommand {
  id: string;
  label: string;
  plugin: PluginId;
  category: string;
  shortcut?: string;
}

/** Log entry for the terminal */
export interface TerminalEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  source: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PLUGINS: PluginMeta[] = [
  {
    id: 'ZOOKEEPER',
    label: 'Zookeeper',
    icon: 'Hexagon',
    color: '#3dffb0',
    description: 'Orchestration runtime — Scheduler, Event Bus, Ledger, Provenance, Policy',
    shortcut: '⌘⇧Z',
    isCore: true,
  },
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
    description: 'Specialist agent — behavioural analysis, anomaly detection, recommendations',
    shortcut: '⌘⇧L',
    isSpecialist: true,
  },
  {
    id: 'WATCHDOG',
    label: 'Watchdog',
    icon: 'ShieldAlert',
    color: '#ef4444',
    description: 'Specialist agent — compliance, provenance, safety, circuit-breaking',
    shortcut: '⌘⇧W',
    isSpecialist: true,
  },
];

export const DEFAULT_ADAPTERS: Adapter[] = [
  {
    id: 'amd-compute',
    label: 'AMD Compute',
    icon: 'Cpu',
    color: '#ed1c24',
    category: 'vendor',
    lifecycle: 'dormant',
    completedMethods: ['initialize', 'discover'],
    lastActivity: null,
    installed: true,
    vendor: 'AMD',
    description: 'ROCm GPU compute — MI250, MI300 accelerators',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'GitBranch',
    color: '#f0f6fc',
    category: 'vendor',
    lifecycle: 'dormant',
    completedMethods: ['initialize'],
    lastActivity: null,
    installed: true,
    vendor: 'GitHub',
    description: 'Repository integration — PRs, issues, CI/CD',
  },
  {
    id: 'zoom',
    label: 'Zoom',
    icon: 'Video',
    color: '#2d8cff',
    category: 'vendor',
    lifecycle: 'not_installed',
    completedMethods: [],
    lastActivity: null,
    installed: false,
    vendor: 'Zoom',
    description: 'Meeting automation — scheduling, recording, transcription',
  },
  {
    id: 'figma',
    label: 'Figma',
    icon: 'Palette',
    color: '#f24e1e',
    category: 'vendor',
    lifecycle: 'not_installed',
    completedMethods: [],
    lastActivity: null,
    installed: false,
    vendor: 'Figma',
    description: 'Design integration — component libraries, design tokens',
  },
  {
    id: 'cad',
    label: 'CAD Adapter',
    icon: 'PenTool',
    color: '#3dffb0',
    category: 'native',
    lifecycle: 'dormant',
    completedMethods: ['initialize', 'discover'],
    lastActivity: null,
    installed: true,
    description: 'Infrastructure topology — network graphs, pipeline DAGs',
  },
  {
    id: 'matlab',
    label: 'MATLAB',
    icon: 'Braces',
    color: '#e1670a',
    category: 'vendor',
    lifecycle: 'not_installed',
    completedMethods: [],
    lastActivity: null,
    installed: false,
    vendor: 'MathWorks',
    description: 'Scientific computing — simulation, data analysis',
  },
  {
    id: 'ros2',
    label: 'ROS2',
    icon: 'Rss',
    color: '#2d8cff',
    category: 'vendor',
    lifecycle: 'not_installed',
    completedMethods: [],
    lastActivity: null,
    installed: false,
    vendor: 'Open Robotics',
    description: 'Robotics middleware — sensor data, control systems',
  },
  {
    id: 'plc',
    label: 'PLC Adapter',
    icon: 'Radio',
    color: '#eab308',
    category: 'native',
    lifecycle: 'dormant',
    completedMethods: ['initialize'],
    lastActivity: null,
    installed: true,
    description: 'Programmable Logic Controllers — SCADA, ICS',
  },
];

export const CORE_SERVICES: CoreService[] = [
  { id: 'scheduler', label: 'Scheduler', status: 'running', uptime: '14h 32m', eventsProcessed: 4821, lastEvent: null },
  { id: 'event-bus', label: 'Event Bus', status: 'running', uptime: '14h 32m', eventsProcessed: 12847, lastEvent: null },
  { id: 'ledger', label: 'Cryptographic Ledger', status: 'running', uptime: '14h 32m', eventsProcessed: 3942, lastEvent: null },
  { id: 'provenance', label: 'Provenance Engine', status: 'running', uptime: '14h 32m', eventsProcessed: 2156, lastEvent: null },
  { id: 'plugin-manager', label: 'Plugin Manager', status: 'running', uptime: '14h 32m', eventsProcessed: 487, lastEvent: null },
  { id: 'policy-engine', label: 'Policy Engine', status: 'running', uptime: '14h 32m', eventsProcessed: 1834, lastEvent: null },
];

export const DEFAULT_TABS: OpenTab[] = [
  { id: 'TRUST_SPHERE_3D', label: 'Trust Sphere', icon: '🌍', isLive: true },
  { id: 'TERMINAL', label: 'output.log', icon: '>_' },
  { id: 'CAD_VIEWER', label: 'CAD Visualizer', icon: '📐' },
  { id: 'SYSTEM_BOOT', label: 'System Boot', icon: '⚙' },
];

export const COMMANDS: IDECommand[] = [
  // Zookeeper
  { id: 'zk-status', label: 'Zookeeper: Show Runtime Status', plugin: 'ZOOKEEPER', category: 'Zookeeper', shortcut: '⌘⇧Z S' },
  { id: 'zk-plugin-list', label: 'Zookeeper: List All Plugins', plugin: 'ZOOKEEPER', category: 'Zookeeper', shortcut: '⌘⇧Z L' },
  { id: 'zk-plugin-install', label: 'Zookeeper: Install Plugin…', plugin: 'ZOOKEEPER', category: 'Zookeeper' },
  { id: 'zk-plugin-activate', label: 'Zookeeper: Activate Dormant Plugin…', plugin: 'ZOOKEEPER', category: 'Zookeeper' },
  { id: 'zk-plugin-shutdown', label: 'Zookeeper: Shutdown Running Plugin…', plugin: 'ZOOKEEPER', category: 'Zookeeper' },
  { id: 'zk-circuit-break', label: 'Zookeeper: Emergency Circuit Break', plugin: 'ZOOKEEPER', category: 'Zookeeper' },
  { id: 'zk-replay', label: 'Zookeeper: Replay Event Log', plugin: 'ZOOKEEPER', category: 'Zookeeper' },
  { id: 'zk-audit', label: 'Zookeeper: Audit Provenance', plugin: 'ZOOKEEPER', category: 'Zookeeper' },
  // HBK
  { id: 'hbk-init', label: 'Initialize HBK Simulation (Cape Town)', plugin: 'HBK', category: 'HBK', shortcut: '⌘⇧H I' },
  { id: 'hbk-run', label: 'Run HBK Pipeline', plugin: 'HBK', category: 'HBK', shortcut: '⌘⇧H R' },
  { id: 'hbk-stop', label: 'Stop HBK Simulation', plugin: 'HBK', category: 'HBK' },
  // Ubuntu Pools
  { id: 'pools-propose', label: 'Propose Constitution Amendment', plugin: 'UBUNTU_POOLS', category: 'Pools' },
  { id: 'pools-vote', label: 'Cast Vote on Active Proposal', plugin: 'UBUNTU_POOLS', category: 'Pools' },
  { id: 'pools-stokvel', label: 'Create Stokvel Pool', plugin: 'UBUNTU_POOLS', category: 'Pools' },
  // ProofBridge
  { id: 'proof-verify', label: 'Verify Canvas State', plugin: 'PROOFBRIDGE', category: 'ProofBridge' },
  { id: 'proof-sign', label: 'Sign Current Artifact', plugin: 'PROOFBRIDGE', category: 'ProofBridge' },
  { id: 'proof-anchor', label: 'Anchor Receipt to MMR', plugin: 'PROOFBRIDGE', category: 'ProofBridge' },
  // AIR
  { id: 'air-status', label: 'Check Compute Status', plugin: 'AIR_COMPUTE', category: 'AIR' },
  { id: 'air-deploy', label: 'Deploy Model to Endpoint', plugin: 'AIR_COMPUTE', category: 'AIR' },
  // Lindiwe (specialist)
  { id: 'lindiwe-ask', label: 'Ask Lindiwe (Specialist)', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-reroute', label: 'Reroute Node', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-autonomy-1', label: 'Set Autonomy: Observer', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-autonomy-2', label: 'Set Autonomy: Action-Safe', plugin: 'LINDIWE', category: 'Lindiwe' },
  { id: 'lindiwe-autonomy-3', label: 'Set Autonomy: Watchdog', plugin: 'LINDIWE', category: 'Lindiwe' },
  // Watchdog (specialist)
  { id: 'watchdog-status', label: 'Watchdog: Show Compliance Status', plugin: 'WATCHDOG', category: 'Watchdog' },
  { id: 'watchdog-provenance', label: 'Watchdog: Audit Provenance Chain', plugin: 'WATCHDOG', category: 'Watchdog' },
  { id: 'watchdog-circuit-break', label: 'Watchdog: Emergency Circuit Break', plugin: 'WATCHDOG', category: 'Watchdog' },
  // Canvas
  { id: 'sphere-focus', label: 'Focus Trust Sphere', plugin: 'EXPLORER', category: 'Canvas' },
  { id: 'terminal-clear', label: 'Clear Terminal', plugin: 'EXPLORER', category: 'Canvas' },
  { id: 'system-boot', label: 'Show System Boot', plugin: 'ZOOKEEPER', category: 'Canvas' },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

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

  // ---- Zookeeper Runtime ----
  zookeeperOnline: boolean;
  coreServices: CoreService[];
  adapters: Adapter[];
  bootSequenceComplete: boolean;

  // ---- Lindiwe (specialist agent) ----
  autonomyLevel: AutonomyLevel;
  circuitBreaker: CircuitBreakerState;
  lindiweTerminalOpen: boolean;
  terminalEntries: TerminalEntry[];
  lindiweMode: 'operator' | 'advisor';

  // ---- Watchdog (specialist agent) ----
  watchdogActive: boolean;
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

  // Zookeeper
  setAdapterLifecycle: (id: string, lifecycle: PluginLifecycle) => void;
  installAdapter: (id: string) => void;
  activateAdapter: (id: string) => void;
  shutdownAdapter: (id: string) => void;
  advanceAdapterMethod: (id: string, method: AdapterMethod) => void;

  // Lindiwe
  setAutonomyLevel: (level: AutonomyLevel) => void;
  setCircuitBreaker: (state: CircuitBreakerState, reason?: string) => void;
  toggleLindiweTerminal: () => void;
  addTerminalEntry: (entry: Omit<TerminalEntry, 'id' | 'timestamp'>) => void;
  clearTerminalEntries: () => void;
  setLindiweMode: (mode: 'operator' | 'advisor') => void;

  // Watchdog
  setWatchdogActive: (active: boolean) => void;

  // Compute
  updateComputeMetrics: (metrics: Partial<IDEState['computeMetrics']>) => void;
}

export const useIDEStore = create<IDEState>((set, get) => ({
  // ---- Core Layout ----
  activePlugin: 'ZOOKEEPER',
  sidebarOpen: true,
  sidebarWidth: 260,
  lindiwePanelOpen: false,
  lindiwePanelWidth: 340,
  commandPaletteOpen: false,
  focusMode: false,

  // ---- Canvas ----
  openTabs: DEFAULT_TABS,
  activeTab: 'TRUST_SPHERE_3D',

  // ---- Zookeeper Runtime ----
  zookeeperOnline: true,
  coreServices: CORE_SERVICES,
  adapters: DEFAULT_ADAPTERS,
  bootSequenceComplete: true,

  // ---- Lindiwe (specialist agent) ----
  autonomyLevel: 2,
  circuitBreaker: 'NORMAL',
  lindiweTerminalOpen: false,
  terminalEntries: [
    {
      id: 'boot-1',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'zookeeper',
      message: 'Zookeeper Runtime initialized. Core services online.',
    },
    {
      id: 'boot-2',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'scheduler',
      message: 'Scheduler: online. Event Bus: online. Ledger: online.',
    },
    {
      id: 'boot-3',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'provenance',
      message: 'Provenance Engine: online. Policy Engine: online. Plugin Manager: online.',
    },
    {
      id: 'boot-4',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'plugin-manager',
      message: '6 adapters registered. 3 dormant. 3 not installed. 0 running.',
    },
    {
      id: 'boot-5',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'lindiwe',
      message: 'Lindiwe specialist agent online. Autonomy: Action-Safe (Level 2).',
    },
    {
      id: 'boot-6',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'watchdog',
      message: 'Watchdog specialist agent online. Monitoring compliance, provenance, safety.',
    },
  ],
  lindiweMode: 'advisor',

  // ---- Watchdog (specialist agent) ----
  watchdogActive: true,
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

  // ---- Zookeeper Actions ----

  setAdapterLifecycle: (id, lifecycle) => {
    set((s) => ({
      adapters: s.adapters.map((a) =>
        a.id === id ? { ...a, lifecycle } : a
      ),
    }));
  },

  installAdapter: (id) => {
    set((s) => ({
      adapters: s.adapters.map((a) =>
        a.id === id ? { ...a, installed: true, lifecycle: 'installed' as PluginLifecycle } : a
      ),
      terminalEntries: [
        ...s.terminalEntries,
        {
          id: `ad-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info' as const,
          source: 'plugin-manager',
          message: `> vvu plugin install ${id} — Adapter installed. Lifecycle: installed.`,
        },
      ],
    }));
  },

  activateAdapter: (id) => {
    set((s) => {
      const adapter = s.adapters.find((a) => a.id === id);
      if (!adapter) return s;
      return {
        adapters: s.adapters.map((a) =>
          a.id === id
            ? {
                ...a,
                lifecycle: 'activated' as PluginLifecycle,
                completedMethods: ['initialize', 'discover', 'authenticate'] as AdapterMethod[],
                lastActivity: new Date().toISOString(),
              }
            : a
        ),
        terminalEntries: [
          ...s.terminalEntries,
          {
            id: `ad-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'info' as const,
            source: 'plugin-manager',
            message: `> vvu plugin activate ${id} — Adapter activated. Lifecycle: activated. initialize() → discover() → authenticate() complete.`,
          },
        ],
      };
    });
  },

  shutdownAdapter: (id) => {
    set((s) => ({
      adapters: s.adapters.map((a) =>
        a.id === id
          ? {
              ...a,
              lifecycle: 'dormant' as PluginLifecycle,
              completedMethods: ['initialize'] as AdapterMethod[],
              lastActivity: new Date().toISOString(),
            }
          : a
      ),
      terminalEntries: [
        ...s.terminalEntries,
        {
          id: `ad-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info' as const,
          source: 'plugin-manager',
          message: `> vvu plugin shutdown ${id} — Adapter returned to dormant. shutdown() complete.`,
        },
      ],
    }));
  },

  advanceAdapterMethod: (id, method) => {
    set((s) => ({
      adapters: s.adapters.map((a) =>
        a.id === id
          ? {
              ...a,
              completedMethods: a.completedMethods.includes(method)
                ? a.completedMethods
                : [...a.completedMethods, method],
              lastActivity: new Date().toISOString(),
            }
          : a
      ),
    }));
  },

  // ---- Lindiwe Actions ----

  setAutonomyLevel: (level) => {
    set((s) => {
      const newEntries = level === 3
        ? [
            ...s.terminalEntries,
            {
              id: `cb-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'warn' as const,
              source: 'lindiwe',
              message: '⚠ Lindiwe Watchdog Mode activated. Specialist agent now has override authority.',
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
          watchdogActive: true,
          terminalEntries: [
            ...s.terminalEntries,
            {
              id: `cb-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'critical' as const,
              source: 'watchdog',
              message: `[CRITICAL] CIRCUIT BREAK. REASON: ${reason ?? 'UNKNOWN ANOMALY'}. AWAITING OPERATOR OVERRIDE.`,
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
              message: `[DEGRADED] Anomaly detected: ${reason ?? 'unspecified'}. Monitoring.`,
            },
          ],
        };
      }
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

  // ---- Watchdog Actions ----

  setWatchdogActive: (active) => {
    set((s) => ({
      watchdogActive: active,
      terminalEntries: [
        ...s.terminalEntries,
        {
          id: `wd-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info' as const,
          source: 'watchdog',
          message: active
            ? 'Watchdog specialist agent activated. Monitoring compliance, provenance, safety.'
            : 'Watchdog specialist agent deactivated.',
        },
      ],
    }));
  },

  // ---- Compute Actions ----

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

/** Count adapters by lifecycle state */
export const selectAdapterCounts = (s: IDEState) => {
  const counts: Record<PluginLifecycle, number> = {
    not_installed: 0,
    installed: 0,
    dormant: 0,
    activated: 0,
    running: 0,
    idle: 0,
  };
  s.adapters.forEach((a) => { counts[a.lifecycle]++; });
  return counts;
};
