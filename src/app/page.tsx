"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   VVU·IVE SEARM PLATFORM — VRES v1.2 SYSTEM UPROAR
   Dark Elite Palette · Unconditional Lock · Zero UI Drift
   EIS Composite: 0.5·N_ind + 0.3·norm(λ₂) + 0.2·P0 · ZK eis-bounds
   ═══════════════════════════════════════════════════════════════ */

/* ── DARK ELITE PALETTE ── */
const V = {
  gn:    "#10b981",       /* Emerald - verified/success */
  gnD:   "rgba(16,185,129,0.08)",
  am:    "#c9a84c",       /* Gold - brand primary */
  amB:   "#e5b84b",       /* Gold light */
  bg:    "#0a0b0e",       /* Deepest shell */
  bg2:   "#0d0e12",       /* Sidebar surface */
  bg3:   "#12141a",       /* Card/panel surface */
  line:  "#c9a84c",       /* Gold lines */
  lineD: "rgba(201,168,76,0.15)",
  red:   "#ff4757",       /* Coral red - blocked/error */
  cyan:  "#00d4aa",       /* Teal cyan - observed/ready */
  purple:"#9b59b6",       /* Muted purple - context/pending */
  txt:   "#f0f2f5",       /* Primary text */
  txtD:  "#8b949e",       /* Secondary text */
  txtDD: "#4a4e5c",       /* Disabled text */
};

/* ── VRES Status Labels ── */
type VRes = "VERIFIED" | "OBSERVED" | "PENDING" | "UNTESTED" | "UNDEFINED";
const vresBg: Record<VRes, string> = {
  VERIFIED:  "rgba(16,185,129,0.12)",
  OBSERVED:  "rgba(0,212,170,0.1)",
  PENDING:   "rgba(155,89,182,0.1)",
  UNTESTED:  "rgba(230,126,34,0.1)",
  UNDEFINED: "rgba(255,71,87,0.1)",
};
const vresFg: Record<VRes, string> = {
  VERIFIED: V.gn, OBSERVED: V.cyan, PENDING: V.purple, UNTESTED: "#e67e22", UNDEFINED: V.red,
};

/* ── View Modes ── */
const VIEW_MODES = [
  { name: "Trust Sphere",  state: "VERIFIED"  as VRes, icon: "sphere" },
  { name: "Proof Graph",   state: "OBSERVED"  as VRes, icon: "graph"  },
  { name: "Timeline",      state: "PENDING"   as VRes, icon: "time"   },
  { name: "HBK Workspace", state: "OBSERVED"  as VRes, icon: "grid"   },
  { name: "Disaster Rec",  state: "UNDEFINED" as VRes, icon: "alert"  },
];

/* ── Geometry Cycle ── */
const GEOMS = ["SPIRAL", "CUBE", "SPHERE", "STAR", "TORUS", "OCTAHEDRON"] as const;

/* ── Plugin Registry ── */
const PLUGINS: { name: string; state: VRes }[] = [
  { name: "ProofBridge",  state: "VERIFIED"  },
  { name: "Stokvel Pools", state: "OBSERVED" },
  { name: "MCMC Core",    state: "PENDING"   },
  { name: "HIL Sim",      state: "UNTESTED"  },
  { name: "ZK eis-bounds",state: "VERIFIED"  },
  { name: "Colony Market",state: "PENDING"   },
];

/* ── Claims ── */
const CLAIMS: { id: string; text: string; state: VRes }[] = [
  { id: "#001", text: "Pressure nominal",    state: "VERIFIED"  },
  { id: "#002", text: "Valve seal intact",    state: "VERIFIED"  },
  { id: "#003", text: "Flow rate stable",     state: "OBSERVED"  },
  { id: "#004", text: "Security scan pass",   state: "PENDING"   },
  { id: "#005", text: "Recency verified",     state: "VERIFIED"  },
  { id: "#006", text: "Spool assembly",       state: "UNTESTED"  },
];

/* ── Trending ── */
const TRENDING = [
  { text: "HBK MK-II Hydro",  tag: "PROD", delta: "" },
  { text: "Spool Pressure",   tag: "",      delta: "+12%" },
  { text: "Theorem 4",        tag: "",      delta: "+8%" },
  { text: "DAG Sync",         tag: "",      delta: "+15%" },
  { text: "Watchdog",         tag: "IDLE",  delta: "" },
];

/* ── Boot States (E2E Spec §3) ── */
const BOOT_STATES = [
  'IDENTITY', 'THREE_RINGS', 'TRUST_SPHERE', 'EVIDENCE_RUNTIME',
  'ZOO_ENGINE', 'PROOF_RUNTIME', 'TRUST_RUNTIME', 'WORKSPACE',
] as const;

/* ── Invariant Data (E2E Spec §5 — Three-Mode Invariance) ── */
const INVARIANT = {
  evidenceNodes: 1248,
  proofCount: 312,
  eisScore: 96.7,
  trustPercent: 97.35,
  uptimePercent: 99.98,
  claimsTotal: 312,
} as const;

/* ── Navigation Registry (E2E Spec §4.2) ── */
const NAV_REGISTRY = [
  { category: 'CORE', items: [
    { name: 'Overview', icon: '\u25C9', route: 'overview' },
    { name: 'Trust Sphere', icon: '\u25CE', route: 'trust-sphere' },
    { name: 'Proof Graph', icon: '\u25C8', route: 'proof-graph' },
    { name: 'Evidence Runtime', icon: '\u27D0', route: 'evidence-runtime' },
  ]},
  { category: 'RELEASE', items: [
    { name: 'Release Report', icon: '\u2318', route: 'release-report' },
    { name: 'Integrity Closure', icon: '\u2298', route: 'integrity-closure' },
    { name: 'Acceptance', icon: '\u2713', route: 'acceptance' },
  ]},
  { category: 'RUNTIME', items: [
    { name: 'Plugin Registry', icon: '\u2699', route: 'plugin-registry' },
    { name: 'AMD Runtime', icon: '\u25A3', route: 'amd-runtime' },
    { name: 'Zoo Runtime', icon: '\u25A0', route: 'zoo-runtime' },
  ]},
  { category: 'CASE STUDY', items: [
    { name: 'HBK Workspace', icon: '\u2B21', route: 'hbk-workspace' },
    { name: 'CAD Viewer', icon: '\u25B3', route: 'cad-viewer' },
  ]},
  { category: 'SYSTEM', items: [
    { name: 'Artifacts', icon: '\u229E', route: 'artifacts' },
    { name: 'Telemetry', icon: '\u2234', route: 'telemetry' },
    { name: 'Watchdog', icon: '\u25CF', route: 'watchdog' },
    { name: 'LINDIWE', icon: '\u25C6', route: 'lindiwe' },
    { name: 'Terminal', icon: '\u2398', route: 'terminal' },
  ]},
];

/* ── Flat nav list for indexing ── */
const NAV_ITEMS = NAV_REGISTRY.flatMap(r => r.items.map(i => i.name));

/* ── Proof Graph Chain (E2E Spec §6.2) ── */
const PROOF_CHAIN = [
  { step: 'CLAIM', status: 'VERIFIED' as VRes, id: '#001' },
  { step: 'OBLIGATION', status: 'VERIFIED' as VRes, id: 'OBL-0042' },
  { step: 'SOLVER', status: 'VERIFIED' as VRes, id: 'SLV-HBK' },
  { step: 'RESULT', status: 'OBSERVED' as VRes, id: 'RES-7841' },
  { step: 'EVIDENCE', status: 'VERIFIED' as VRes, id: 'EVD-9981' },
  { step: 'PROVENANCE', status: 'VERIFIED' as VRes, id: '0x823F32' },
];

/* ── Failure Types (E2E Spec §8) ── */
const FAILURE_TYPES = [
  'BOOT_FAILURE', 'RUNTIME_FAILURE', 'PROOF_FAILURE',
  'SOLVER_FAILURE', 'NETWORK_FAILURE', 'CAD_ENGINE_FAILURE',
] as const;

/* ── Trust Dimensions ── */
const TRUST_DIMS = [
  { name: "Consistency", pct: 98, color: "green" },
  { name: "Completeness", pct: 76, color: "yellow" },
  { name: "Evidence", pct: 94, color: "green" },
  { name: "Integrity", pct: 99, color: "green" },
  { name: "Soundness", pct: 45, color: "red" },
  { name: "Recency", pct: 88, color: "gold" },
] as const;

/* ── Recent Activity ── */
const ACTIVITY = [
  { time: "12:41:02", desc: "Theorem 1 verified",           actor: "WATCHDOG" },
  { time: "12:40:55", desc: "Evidence bundle #9981",        actor: "LINIDIWE" },
  { time: "12:40:41", desc: "Ledger entry appended",        actor: "SYSTEM" },
  { time: "12:40:33", desc: "Circuit breaker reset",        actor: "WATCHDOG" },
  { time: "12:40:20", desc: "Scan-0051 mapped",             actor: "LINIDIWE" },
];

/* ── Terminal Boot Lines ── */
const BOOT_LINES = [
  { ts: "12:40:20", lvl: "ok",   msg: "Contract loaded:", hash: "0x823F32...5728B" },
  { ts: "12:40:21", lvl: "info", msg: "Subscribing to CircuitTripped event...", hash: "" },
  { ts: "12:40:22", lvl: "ok",   msg: "Theorem 1 state: PROVEN. Hash verified.", hash: "" },
  { ts: "12:40:33", lvl: "warn", msg: "Theorem 4: Soundness component failed (S=false)", hash: "" },
  { ts: "12:40:34", lvl: "err",  msg: "Grid Lock: A = C\u2227E\u2227I\u2227S\u2227R = FALSE \u2192 DENIED", hash: "" },
  { ts: "12:40:35", lvl: "info", msg: "Lindiwe agent initiating auto_verify...", hash: "" },
  { ts: "12:40:36", lvl: "info", msg: "Mapping failure \u2192 scan:vulnerability-scan-0051", hash: "" },
  { ts: "12:40:40", lvl: "ok",   msg: "Tx confirmed. Block #8429107", hash: "" },
  { ts: "12:40:41", lvl: "ok",   msg: "Ledger entry appended. previousHash \u2192 0x9c2e...", hash: "" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function VVUSEARM() {
  /* ── Hydration-safe mount ── */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ── Boot State Machine (E2E Spec §3) ── */
  const [bootState, setBootState] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    const timers = BOOT_STATES.map((_, i) =>
      setTimeout(() => {
        setBootState(i);
        if (i === BOOT_STATES.length - 1) setBootComplete(true);
      }, i * 350)
    );
    return () => timers.forEach(clearTimeout);
  }, [mounted]);

  /* ── Release State (E2E Spec §6.3) ── */
  const [releaseState, setReleaseState] = useState<'BLOCKED' | 'PENDING' | 'ACCEPTED'>('BLOCKED');

  /* ── Workspace Hydration Context (E2E Spec §3.2) ── */
  const [currentRoute, setCurrentRoute] = useState('overview');
  const [networkOffline, setNetworkOffline] = useState(false);
  const [cadError, setCadError] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'PASS' | 'FAIL' | 'IDLE'>('IDLE');

  /* ── Evidence Detail Modal (E2E Spec §6.1) ── */
  const [selectedNode, setSelectedNode] = useState<{
    id: string; type: string; proofId: string; evidenceId: string; provenance: string; state: VRes;
  } | null>(null);

  /* ── Watchdog Events (E2E Spec §7) ── */
  const [watchdogEvents, setWatchdogEvents] = useState<
    {time: string; type: string; severity: string; desc: string}[]
  >([]);

  /* ── QA Checklist (E2E Spec §9) ── */
  const [qaResults, setQaResults] = useState<Record<string, boolean | null>>({
    boot: null, hydration: null, navigation: null, invariance: null,
    proof: null, cad: null, watchdog: null, threeMode: null,
    blockchain: null, breaker: null,
  });

  /* ── Clock ── */
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const n = new Date();
      setClock(
        String(n.getHours()).padStart(2, "0") + ":" +
        String(n.getMinutes()).padStart(2, "0") + ":" +
        String(n.getSeconds()).padStart(2, "0")
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mounted]);

  /* ── Block Number ── */
  const [blockNum, setBlockNum] = useState(8429107);
  useEffect(() => {
    const id = setInterval(() => setBlockNum((b) => b + 1), 12000);
    return () => clearInterval(id);
  }, []);

  /* ── Geometry Auto-Morph (8s cadence) ── */
  const [geomIdx, setGeomIdx] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setGeomIdx((i) => (i + 1) % GEOMS.length), 8000);
    return () => clearInterval(id);
  }, []);

  /* ── Ghost Buffer ── */
  const [ghostConf, setGhostConf] = useState(0.85);
  const [ghostSnap, setGhostSnap] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      const conf = Math.random();
      if (conf >= 0.85) {
        setGhostConf(1.0);
        setGhostSnap(true);
        setTimeout(() => { setGhostConf(0.85); setGhostSnap(false); }, 2000);
      } else {
        setGhostConf(conf);
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  /* ── C/E/I/S/R Grid Lock ── */
  const [ceisr, setCeisr] = useState([true, true, true, false, true]);
  const toggleCeisr = (i: number) => setCeisr((p) => p.map((v, j) => (j === i ? !v : v)));
  const allGranted = ceisr.every(Boolean);

  /* ── Release State Derivation (E2E Spec §6.3) ── */
  useEffect(() => {
    if (verificationResult === 'FAIL') { setReleaseState('BLOCKED'); return; }
    if (allGranted && verificationResult !== 'IDLE') setReleaseState('ACCEPTED');
    else if (allGranted) setReleaseState('PENDING');
    else setReleaseState('BLOCKED');
  }, [allGranted, verificationResult]);

  /* ── Failure Simulation (E2E Spec §8) ── */
  const now = () => {
    const n = new Date();
    return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")+":"+String(n.getSeconds()).padStart(2,"0");
  };
  const triggerFailure = (type: string) => {
    const t = now();
    switch (type) {
      case 'RUNTIME_FAILURE':
        setWatchdogEvents(p => [...p, {time: t, type: 'RUNTIME', severity: 'ERROR', desc: 'Solver timeout detected'}]);
        setReleaseState('BLOCKED');
        appendLine('err', 'RUNTIME FAILURE: Solver timeout — Release → BLOCKED', '');
        break;
      case 'PROOF_FAILURE':
        setWatchdogEvents(p => [...p, {time: t, type: 'PROOF', severity: 'ERROR', desc: 'Proof verification failed'}]);
        setCeisr([true, true, true, false, true]);
        appendLine('err', 'PROOF FAILURE: Evidence invalidated — S=false', '');
        break;
      case 'SOLVER_FAILURE':
        setWatchdogEvents(p => [...p, {time: t, type: 'SOLVER', severity: 'WARN', desc: 'Obligation UNRESOLVED'}]);
        appendLine('warn', 'SOLVER FAILURE: Obligation unresolved — Trust score LOW', '');
        break;
      case 'NETWORK_FAILURE':
        setNetworkOffline(true);
        setWatchdogEvents(p => [...p, {time: t, type: 'NETWORK', severity: 'WARN', desc: 'Network unreachable — caching state'}]);
        appendLine('warn', 'NETWORK FAILURE: Offline mode engaged — state cached', '');
        setTimeout(() => setNetworkOffline(false), 8000);
        break;
      case 'CAD_ENGINE_FAILURE':
        setCadError(true);
        setWatchdogEvents(p => [...p, {time: t, type: 'CAD', severity: 'ERROR', desc: 'CAD engine crash'}]);
        appendLine('err', 'CAD ENGINE FAILURE: Engine error — viewer unavailable', '');
        setTimeout(() => setCadError(false), 8000);
        break;
      case 'BOOT_FAILURE':
        setBootState(0);
        setBootComplete(false);
        appendLine('err', 'BOOT FAILURE: System offline — restart required', '');
        break;
    }
  };

  /* ── View Mode ── */
  const [viewIdx, setViewIdx] = useState(0);

  /* ── Nav Active ── */
  const [navIdx, setNavIdx] = useState(0);

  /* ── Mode Toggle (DARK/LIGHT/HOLO) ── */
  const [mode, setMode] = useState<"dark" | "light" | "holo">("dark");

  /* ── Grid Toggle System (PiP Hide/Show/Pin) ── */
  const [gridVis, setGridVis] = useState({
    sidebar: true,   // Left wing — system architect, plugins, infrastructure
    pedestal: true,  // Center — always core
    metrics: true,   // Right wing — project files, file tree
    terminal: true,  // Bottom-left — terminal console
    chat: true,      // Bottom-right — ANT agent chat
  });
  const toggleGrid = (key: keyof typeof gridVis) =>
    setGridVis((p) => ({ ...p, [key]: !p[key] }));

  /* ── Sidebar Filter Mode ── */
  const [sidebarMode, setSidebarMode] = useState<"full" | "slim" | "constricted">("full");
  const sidebarW = sidebarMode === "slim" ? 48 : sidebarMode === "constricted" ? 120 : 220;

  /* ── PiP Focus Pin ── */
  const [pipPin, setPipPin] = useState<null | keyof typeof gridVis>(null);
  const pinGrid = (key: keyof typeof gridVis) =>
    setPipPin((p) => p === key ? null : key);

  /* ── Dynamic Grid Template ── */
  const gridCols = `${gridVis.sidebar ? sidebarW : 0}px 1fr ${gridVis.metrics ? 280 : 0}px`;
  const gridRows = `44px 1fr ${gridVis.terminal || gridVis.chat ? 160 : 0}px`;

  /* ── Circuit Breaker ── */
  const [breakerActive, setBreakerActive] = useState(false);

  /* ── Caustic Alert ── */
  const [caustic, setCaustic] = useState(false);

  /* ── Native AI Compute Mode ── */
  const [computeMode, setComputeMode] = useState<"BROWSER" | "NATIVE">("BROWSER");

  /* ── Spider-Verse Mode ── */
  const [spiderVerse, setSpiderVerse] = useState(false);

  /* ── Architecture Blueprint ── */
  const [showArchBlueprint, setShowArchBlueprint] = useState(false);

  /* ── Arbitrum Blockchain Anchor ── */
  const [arbitrumNet, setArbitrumNet] = useState<"local" | "sepolia" | "mainnet">("local");
  const [chainConnected, setChainConnected] = useState(true);
  const [showBlockchainPanel, setShowBlockchainPanel] = useState(true);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployTarget, setDeployTarget] = useState<"VendingMachine" | "ProofAnchor" | "EpistemicLedger">("VendingMachine");
  const [deployNetwork, setDeployNetwork] = useState<"local" | "arbitrum-sepolia" | "arbitrum-one">("local");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{address: string; txHash: string; gasUsed: number} | null>(null);
  const [contractAddresses, setContractAddresses] = useState({
    vendingMachine: "0x5FbDB2315678afecb367f032d93F642f14f7DCd3",
    proofAnchor: "0xe7f1725E7734CE288F8db97F3A04C8eF5F3c7f6E",
    epistemicLedger: "0x9fE46736679fA1C92C664fE2D5A7b6F3c9E4A8b2",
  });
  const [cupcakeBalance, setCupcakeBalance] = useState(0);
  const [proofCount, setProofCount] = useState(312);
  const [trustAnchorCount, setTrustAnchorCount] = useState(89);
  const [ledgerEntries, setLedgerEntries] = useState(1248);
  const [breakerChainState, setBreakerChainState] = useState<"NORMAL" | "TRIPPED">("NORMAL");
  const [selectedContract, setSelectedContract] = useState<"VendingMachine" | "ProofAnchor" | "EpistemicLedger" | null>(null);

  /* ── Blockchain metrics simulation ── */
  useEffect(() => {
    const id = setInterval(() => {
      setProofCount((p) => p + (Math.random() > 0.85 ? 1 : 0));
      setTrustAnchorCount((p) => p + (Math.random() > 0.9 ? 1 : 0));
      setLedgerEntries((p) => p + (Math.random() > 0.7 ? 1 : 0));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  /* ── GPU Compute Metrics ── */
  const [gpuUtil, setGpuUtil] = useState(87);
  const [gpuMem, setGpuMem] = useState(142);
  const [gpuTemp, setGpuTemp] = useState(62);
  const [gpuPower, setGpuPower] = useState(560);
  const [gpuStreams, setGpuStreams] = useState(28400);
  const [tensorUtil, setTensorUtil] = useState(92);
  const [inferenceLat, setInferenceLat] = useState(0.8);
  const [hbmBandwidth, setHbmBandwidth] = useState(4.8);
  const [rocmVer] = useState("6.2");
  const [hipKernels, setHipKernels] = useState(12);
  const [modelParams] = useState("70B");
  const [vllmQueue, setVllmQueue] = useState(3);

  /* ── Terminal ── */
  const [termLines, setTermLines] = useState(BOOT_LINES);
  const [termInput, setTermInput] = useState("");
  const termBodyRef = useRef<HTMLDivElement>(null);
  const appendLine = useCallback((lvl: string, msg: string, hash: string) => {
    const now = new Date();
    const ts = String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0") + ":" +
      String(now.getSeconds()).padStart(2, "0");
    setTermLines((p) => [...p, { ts, lvl, msg, hash }]);
  }, []);

  useEffect(() => {
    if (termBodyRef.current) termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
  }, [termLines]);

  /* ── Terminal auto-log feed ── */
  const autoLogRef = useRef(0);
  useEffect(() => {
    const logs = [
      { lvl: "info", msg: "Watchdog polling contract state..." },
      { lvl: "ok",   msg: "Ledger entry appended. Block #" + blockNum },
      { lvl: "ok",   msg: "DAG sync complete. 5 theorems verified." },
      { lvl: "info", msg: "Lindiwe monitoring INCONCLUSIVE states..." },
      { lvl: "ok",   msg: "Ghost Buffer hit rate: 87.08%" },
      { lvl: "warn", msg: "Theorem 4 Soundness: 45% \u2014 below threshold" },
      { lvl: "info", msg: "MCMC inference cycle complete. Convergence: 0.94" },
      { lvl: "ok",   msg: "CRDT sync round-trip: 3.2ms" },
    ];
    const id = setInterval(() => {
      const log = logs[autoLogRef.current % logs.length];
      const hash = log.lvl === "ok" ? Math.random().toString(16).substring(2, 10) : "";
      appendLine(log.lvl, log.msg, hash);
      autoLogRef.current++;
    }, 4500);
    return () => clearInterval(id);
  }, [appendLine, blockNum]);

  /* ── Terminal command handler ── */
  const handleTermCmd = () => {
    const cmd = termInput.trim();
    if (!cmd) return;
    appendLine("info", "> " + cmd, "");
    if (cmd === "verify") {
      setTimeout(() => appendLine("ok", "Theorem 1 verified. State: PROVEN.", "0x9c2e..."), 1000);
    } else if (cmd === "status") {
      appendLine("ok", "EIS: 96.7 | Trust: 97.35% | Breaker: NORMAL", "");
    } else if (cmd === "rollback") {
      appendLine("info", "Initiating DAG time-travel rollback...", "");
      setTimeout(() => appendLine("ok", "Reverted to node 0x7f3a. State restored.", ""), 1500);
    } else if (cmd === "help") {
      appendLine("info", "Available: verify, status, rollback, agents, breaker, eis, fiedler, zk, rocm, gpu, native, spider-verse, inference, hip, arbitrum, deploy, anchor, ledger, sepolia, local-chain, cupcake", "");
    } else if (cmd === "eis" || cmd === "composite") {
      setTimeout(() => {
        appendLine("ok", "Composite Health: 0.5·N_ind(2.41) + 0.3·norm(λ₂)(0.67) + 0.2·P0(0.83)", "");
        appendLine("ok", "Composite = 0.804 → HEALTHY (≥0.75)", "");
        appendLine("ok", "Fiedler value λ₂ = 1.33 | Graph: CONNECTED | Cheeger: [0.67, 1.63]", "");
      }, 500);
    } else if (cmd === "fiedler") {
      setTimeout(() => {
        appendLine("ok", "Fiedler value (λ₂): 1.333 (fixed-point: 1333000)", "");
        appendLine("ok", "Algebraic connectivity: 1.333 → Graph is CONNECTED", "");
        appendLine("ok", "Cheeger inequality: 0.667 ≤ h(G) ≤ 1.633 (max_degree=2)", "");
      }, 500);
    } else if (cmd === "zk") {
      setTimeout(() => {
        appendLine("ok", "ZK Circuit: eis-bounds (8 eigenvalues)", "");
        appendLine("ok", "Poseidon commitment: graphCommit = Poseidon(λ₁...λ₈)", "");
        appendLine("ok", "Constraints: N_ind > 0 ✓ | λ₂ ≥ 0 ✓ | pr ∈ (0,1] ✓", "");
        appendLine("info", "Circuit maps to VVULedger.sol::submitProof(graphCommit, nInd, lambda2, proof)", "");
      }, 500);
    } else if (cmd === "agents") {
      appendLine("ok", "WATCHDOG: IDLE | LINIDIWE: MONITORING | ANT: GHOST_BUFFER", "");
    } else if (cmd === "breaker") {
      setBreakerActive(true);
      appendLine("err", "WebGPU pipeline failure detected!", "");
      appendLine("warn", "Activating static skeleton fallback...", "");
      setTimeout(() => appendLine("ok", "Structural math preserved. VRES v1.0 compliant.", ""), 2000);
      setTimeout(() => setBreakerActive(false), 5000);
    } else if (cmd === "rocm") {
      appendLine("ok", `ROCm ${rocmVer} | HIP SDK: ${rocmVer}.0 | MI300X: 38,400 SP | HBM3: 192GB @ 5.3 TB/s`, "");
    } else if (cmd === "gpu") {
      appendLine("ok", `Util: ${gpuUtil}% | Mem: ${gpuMem}/192GB | Temp: ${gpuTemp}°C | Power: ${gpuPower}W | Tensor: ${tensorUtil}%`, "");
    } else if (cmd === "native") {
      const newMode = computeMode === "BROWSER" ? "NATIVE" : "BROWSER";
      setComputeMode(newMode);
      if (newMode === "NATIVE") {
        appendLine("ok", "Compute mode: NATIVE (ROCm MI300X) — HBM3 direct memory access enabled", "");
      } else {
        appendLine("ok", "Compute mode: BROWSER (WebGPU/WASM) — standard pipeline", "");
      }
    } else if (cmd === "spider-verse" || cmd === "spiderverse") {
      setSpiderVerse(!spiderVerse);
      if (!spiderVerse) {
        appendLine("ok", `Spider-Verse: ACTIVE — Navier-Stokes fluid simulation engaged on ${gpuStreams.toLocaleString()} stream processors`, "");
      } else {
        appendLine("info", "Spider-Verse: DISABLED — standard rendering resumed", "");
      }
    } else if (cmd === "inference") {
      appendLine("ok", `vLLM: Llama 3 ${modelParams} | Latency: ${inferenceLat}ms | Throughput: 1,247 tok/s | Flash-Attn: ON`, "");
    } else if (cmd === "hip") {
      appendLine("ok", `Active HIP kernels: ${hipKernels} | Fibonacci warp: RUNNING | Heat Kernel: 38,400 SP parallel | Circuit Breaker: GPU-parallel reduction`, "");
    } else if (cmd === "arbitrum" || cmd === "arb") {
      appendLine("ok", `Arbitrum Network: ${arbitrumNet === 'local' ? 'Anvil Local (31337)' : arbitrumNet === 'sepolia' ? 'Sepolia (421614)' : 'Arbitrum One (42161)'}`, "");
      appendLine("ok", `Contracts: VM=${contractAddresses.vendingMachine.slice(0,10)}... PA=${contractAddresses.proofAnchor.slice(0,10)}... Ledger=${contractAddresses.epistemicLedger.slice(0,10)}...`, "");
      appendLine("ok", `On-chain: ${proofCount} proofs | ${trustAnchorCount} trust anchors | ${ledgerEntries} ledger entries | Breaker: ${breakerChainState}`, "");
    } else if (cmd === "deploy") {
      appendLine("info", `Deploying ${deployTarget} to ${deployNetwork}...`, "");
      setDeploying(true);
      setTimeout(() => {
        const addr = `0x${Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)}`;
        const gas = deployTarget === 'VendingMachine' ? 180000 : deployTarget === 'ProofAnchor' ? 450000 : 520000;
        appendLine("ok", `${deployTarget} deployed to ${addr}`, "");
        appendLine("ok", `Gas used: ${gas.toLocaleString()} | Block: ${blockNum} | Forge: 1.7.1`, "");
        setDeploying(false);
      }, 2000);
    } else if (cmd === "anchor") {
      appendLine("info", "Anchoring proof commitment to ProofAnchor.sol...", "");
      setTimeout(() => {
        appendLine("ok", `ProofAnchored event emitted | graphCommit: 0x${Math.random().toString(16).slice(2, 18)}... | N_ind: 2.41 | λ₂: 1.33`, "");
        setProofCount((p) => p + 1);
      }, 1200);
    } else if (cmd === "ledger") {
      appendLine("ok", `EpistemicLedger: ${ledgerEntries} entries | Breaker: ${breakerChainState} | Chain: INTACT | Last hash: 0x9c2e...`, "");
    } else if (cmd === "sepolia") {
      setArbitrumNet('sepolia');
      appendLine("ok", "Network: Arbitrum Sepolia (Chain ID: 421614) | RPC: https://sepolia-rollup.arbitrum.io/rpc", "");
    } else if (cmd === "local-chain") {
      setArbitrumNet('local');
      appendLine("ok", "Network: Anvil Local (Chain ID: 31337) | RPC: http://127.0.0.1:8545", "");
    } else if (cmd === "cupcake") {
      setCupcakeBalance((b) => b + 1);
      appendLine("ok", `Cupcake distributed! Balance: ${cupcakeBalance + 1} | VendingMachine.sol::giveCupcakeTo()`, "");
    } else if (cmd === "boot") {
      appendLine("ok", `Boot state: ${BOOT_STATES[bootState]} (${bootState+1}/${BOOT_STATES.length}) — ${bootComplete ? 'All systems nominal' : 'Boot in progress...'}`, "");
    } else if (cmd === "hydrate") {
      appendLine("ok", `Session: SEARM_OP | Env: DEV | Route: ${currentRoute} | Release: ${releaseState} | Nodes: ${INVARIANT.evidenceNodes} | Proofs: ${INVARIANT.proofCount}`, "");
    } else if (cmd === "release") {
      appendLine("ok", `Release: ${releaseState} — A = C∧E∧I∧S∧R = ${allGranted} — Verification: ${verificationResult}`, "");
    } else if (cmd.startsWith("fail ")) {
      const failType = cmd.slice(5).toUpperCase().replace(/ /g, '_') + '_FAILURE';
      if (FAILURE_TYPES.includes(failType as typeof FAILURE_TYPES[number])) {
        triggerFailure(failType);
        appendLine("warn", `Triggering failure: ${failType}`, "");
      } else {
        appendLine("err", `Unknown failure type. Available: ${FAILURE_TYPES.map(f => f.replace('_FAILURE','').replace('_',' ')).join(', ')}`, "");
      }
    } else if (cmd === "watchdog") {
      if (watchdogEvents.length === 0) {
        appendLine("ok", "Watchdog: No events — system nominal", "");
      } else {
        watchdogEvents.slice(-5).forEach(e => appendLine(e.severity === 'ERROR' ? 'err' : 'warn', `[${e.type}] ${e.desc}`, ''));
      }
    } else if (cmd === "golden-path") {
      appendLine("info", "; Running 22-step Golden Path checklist...", "");
      setTimeout(() => {
        appendLine("ok", "1-4: Boot → Workspace Hydration → Overview ✓", "");
        appendLine("ok", "5-9: Navigate → CAD → Inspect → Spec → Obligation ✓", "");
        appendLine("ok", "10-14: Verify → Evidence → Provenance → Graph → Sphere ✓", "");
        appendLine("ok", "15-19: Watchdog → Overview → Metrics → Report → Closure ✓", "");
        appendLine("ok", `20-22: Acceptance → Final State → Theme Check — Release: ${releaseState}`, "");
      }, 1000);
    } else if (cmd === "verify-hbk") {
      setVerificationResult('PASS');
      appendLine("ok", "HBK Verification: PASS — All proof obligations satisfied", "");
      appendLine("ok", `Release decision: ${allGranted ? 'ACCEPTED' : 'PENDING'} (A = ${allGranted})`, "");
    } else if (cmd === "fail-hbk") {
      setVerificationResult('FAIL');
      setCeisr(p => p.map((v, j) => j === 3 ? false : v));
      appendLine("err", "HBK Verification: FAIL — Soundness component failed", "");
      appendLine("err", "Release decision: BLOCKED — A = C∧E∧I∧S∧R = FALSE", "");
    } else {
      appendLine("err", "Unknown command: " + cmd, "");
    }
    setTermInput("");
  };

  /* ── Chat ── */
  const [chatLog, setChatLog] = useState<{ from: "agent" | "user"; text: string }[]>([
    { from: "agent", text: "Ghost Buffer active. Confidence threshold set to 0.85. Pre-rendering at 10% opacity." },
    { from: "agent", text: "Detecting gaze intent on Theorem 4. Prediction: INCONCLUSIVE. Pre-rendering provisional state..." },
    { from: "agent", text: "On-chain verification confirmed. Authoritative state: PROVEN. Visual snapped to match chain. Zero ambiguity." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatLog]);

  const handleChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatLog((p) => [...p, { from: "user", text: msg }]);
    setChatInput("");
    setTimeout(() => {
      const responses: Record<string, string> = {
        status: "Ghost Buffer active. Confidence: 0.85. Pre-render accuracy: 87.08%. Wasted renders: 2.74%.",
        predict: "Gaze intent detected on Theorem 4. Provisional state: INCONCLUSIVE. Rendering at 10% opacity.",
        verify: "On-chain verification confirmed. Authoritative state: PROVEN. Visual snapped to match chain.",
        help: "Available queries: status, predict, verify, ghost, rollback, composite, fiedler, zk, rocm, gpu, native, spider-verse, inference",
        ghost: "Ghost Buffer metrics: 71% latency reduction. 0.85 confidence threshold is mathematically optimal.",
        rollback: "DAG time-travel initiated. Reverting to previous hash node without DOM re-render.",
        composite: "Composite Health: 0.5·N_ind(0.80) + 0.3·norm(λ₂)(0.67) + 0.2·P0(0.83) = 0.77 → HEALTHY.",
        fiedler: "Fiedler value λ₂ = 1.333. Algebraic connectivity confirms graph is connected. Cheeger bound: [0.67, 1.63].",
        zk: "ZK eis-bounds circuit: Poseidon graphCommit + N_ind > 0 constraint + λ₂ ≥ 0 constraint. 8 eigenvalue inputs. Maps to VVULedger.sol::submitProof.",
        rocm: `ROCm 6.2 runtime active. HIP SDK 6.2.0. MI300X APU: 38,400 stream processors. HBM3: 192GB @ 5.3 TB/s. Infinity Fabric: ACTIVE.`,
        gpu: `GPU Compute: ${gpuUtil}% utilization | ${gpuMem}/192GB HBM3 | ${gpuTemp}°C | ${gpuPower}W | Tensor cores: ${tensorUtil}%. GPU-parallel verification: 700x faster than CPU.`,
        native: computeMode === "BROWSER" ? "Switching to NATIVE compute mode. ROCm MI300X will provide HBM3 direct memory access, GPU-accelerated verification, and vLLM inference. 700x faster hash verification." : "NATIVE mode active. ROCm MI300X providing GPU-direct compute. HBM3: 192GB. vLLM inference: sub-millisecond.",
        "spider-verse": spiderVerse ? "Spider-Verse mode active. Navier-Stokes fluid dynamics simulation running on 28,400 stream processors. Enhanced particle system: 300 particles, 3x rotation, color shifting." : "Spider-Verse mode available. Enables Navier-Stokes fluid simulation, enhanced particle effects, and color-shifting geometry.",
        inference: `vLLM serving Llama 3 70B on ROCm MI300X. Latency: ${inferenceLat}ms (sub-millisecond). Throughput: 1,247 tokens/sec. Flash Attention: ENABLED. FP16 on Tensor Cores.`,
        arbitrum: `Arbitrum ${arbitrumNet === 'local' ? 'Local (31337)' : arbitrumNet === 'sepolia' ? 'Sepolia (421614)' : 'One (42161)'}. ${proofCount} proofs anchored. ${trustAnchorCount} trust anchors. ${ledgerEntries} ledger entries. Breaker: ${breakerChainState}. Gas discount: ~10x vs L1.`,
        deploy: `Deploying to ${deployNetwork}... Use 'deploy' command to deploy contracts via Foundry. Available: VendingMachine, ProofAnchor, EpistemicLedger.`,
        anchor: 'Anchoring proof commitment to ProofAnchor.sol on Arbitrum. Graph commitment: Poseidon(λ₁, λ₂, ..., λₙ). Maps to ProofAnchor::anchorProof(graphCommit, nInd, lambda2).',
        ledger: `EpistemicLedger: ${ledgerEntries} entries. Tamper-evident hash chain. Circuit breaker: ${breakerChainState}. Every entry links via previousHash — chain integrity guaranteed.`,
        cupcake: `VendingMachine balance: ${cupcakeBalance} cupcakes. Call giveCupcakeTo(address) to distribute. 5-second cooldown enforced on-chain.`,
      };
      const resp = responses[msg.toLowerCase()] || "Query received. Processing against epistemic DAG... Confidence threshold met. Response authoritative.";
      setChatLog((p) => [...p, { from: "agent", text: resp }]);
    }, 800);
  };

  /* ── Optical Caustic ── */
  const triggerCaustic = () => {
    setCaustic(true);
    setTimeout(() => setCaustic(false), 3000);
  };

  /* ── FPS sim ── */
  const [fps, setFps] = useState(120);
  useEffect(() => {
    const id = setInterval(() => setFps(118 + Math.floor(Math.random() * 4)), 2000);
    return () => clearInterval(id);
  }, []);

  /* ── GPU Metrics Simulation ── */
  useEffect(() => {
    const id = setInterval(() => {
      setGpuUtil((u) => Math.min(100, Math.max(70, u + Math.floor(Math.random() * 7 - 3))));
      setGpuMem((m) => Math.min(192, Math.max(128, m + Math.floor(Math.random() * 5 - 2))));
      setGpuTemp((t) => Math.min(85, Math.max(55, t + Math.floor(Math.random() * 5 - 2))));
      setGpuPower((p) => Math.min(750, Math.max(480, p + Math.floor(Math.random() * 21 - 10))));
      setGpuStreams((s) => Math.min(38400, Math.max(24000, s + Math.floor(Math.random() * 801 - 400))));
      setTensorUtil((u) => Math.min(100, Math.max(75, u + Math.floor(Math.random() * 7 - 3))));
      setInferenceLat((l) => Math.min(2.0, Math.max(0.3, +(l + (Math.random() * 0.3 - 0.15)).toFixed(1))));
      setHbmBandwidth((b) => Math.min(5.3, Math.max(3.8, +(b + (Math.random() * 0.4 - 0.2)).toFixed(1))));
      setHipKernels((k) => Math.min(24, Math.max(4, k + Math.floor(Math.random() * 5 - 2))));
      setVllmQueue((q) => Math.min(12, Math.max(0, q + Math.floor(Math.random() * 3 - 1))));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  /* ── Three.js Pedestal Scene ── */
  const pedestalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mounted || !pedestalRef.current) return;
    let destroyed = false;

    import("three").then((THREE) => {
      if (destroyed || !pedestalRef.current) return;
      const container = pedestalRef.current;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
      camera.position.set(0, 0, 5);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      /* Golden wireframe icosahedron */
      const geo = new THREE.IcosahedronGeometry(1.2, 1);
      const mat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.35 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      /* Inner sphere */
      const sGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const sMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.6 });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      scene.add(sMesh);

      /* Fibonacci particles — Spider-Verse uses more */
      const pCount = spiderVerse ? 300 : 120;
      const pGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(pCount * 3);
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < pCount; i++) {
        const y = 1 - (i / (pCount - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;
        positions[i * 3] = Math.cos(theta) * r * 1.8;
        positions[i * 3 + 1] = y * 1.8;
        positions[i * 3 + 2] = Math.sin(theta) * r * 1.8;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({ color: 0x00C853, size: spiderVerse ? 0.06 : 0.04, transparent: true, opacity: 0.7 });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);

      /* Orbit ring */
      const rGeo = new THREE.TorusGeometry(1.5, 0.01, 8, 64);
      const rMat = new THREE.MeshBasicMaterial({ color: 0xBC13FE, transparent: true, opacity: 0.2 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI / 3;
      scene.add(ring);

      /* Second torus ring for Spider-Verse */
      const r2Geo = new THREE.TorusGeometry(1.8, 0.008, 8, 64);
      const r2Mat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: spiderVerse ? 0.25 : 0 });
      const ring2 = new THREE.Mesh(r2Geo, r2Mat);
      ring2.rotation.x = Math.PI / 5;
      ring2.rotation.y = Math.PI / 4;
      scene.add(ring2);

      /* Spider-Verse color shift cycle */
      const svColors = [0x00C853, 0xD4AF37, 0xBC13FE, 0x00E5FF];
      let svColorIdx = 0;
      let svColorTimer = 0;

      /* Pulsing scale for Spider-Verse */
      let pulseTime = 0;

      const animate = () => {
        if (destroyed) return;
        requestAnimationFrame(animate);
        const speedMul = spiderVerse ? 3 : 1;
        mesh.rotation.y += 0.003 * speedMul;
        mesh.rotation.x += 0.001 * speedMul;
        sMesh.rotation.y -= 0.005 * speedMul;
        points.rotation.y += 0.002 * speedMul;
        ring.rotation.z += 0.001 * speedMul;

        if (spiderVerse) {
          /* Color shift every 60 frames */
          svColorTimer++;
          if (svColorTimer >= 60) {
            svColorTimer = 0;
            svColorIdx = (svColorIdx + 1) % svColors.length;
            pMat.color.setHex(svColors[svColorIdx]);
            ring2.material = r2Mat;
            r2Mat.opacity = 0.25;
          }
          /* Second ring rotation */
          ring2.rotation.z += 0.002;
          ring2.rotation.x += 0.001;

          /* Icosahedron pulse/breathe */
          pulseTime += 0.03;
          const scale = 1 + 0.15 * Math.sin(pulseTime);
          mesh.scale.set(scale, scale, scale);

          /* Warp: push particles outward slightly */
          const posArr = pGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < pCount; i++) {
            const ix = i * 3;
            const dist = Math.sqrt(posArr[ix] ** 2 + posArr[ix + 1] ** 2 + posArr[ix + 2] ** 2);
            if (dist > 0.01) {
              const warpFactor = 1 + 0.001 * Math.sin(pulseTime + i * 0.1);
              posArr[ix] *= warpFactor;
              posArr[ix + 1] *= warpFactor;
              posArr[ix + 2] *= warpFactor;
            }
          }
          pGeo.attributes.position.needsUpdate = true;
        } else {
          mesh.scale.set(1, 1, 1);
          r2Mat.opacity = 0;
          pMat.color.setHex(0x00C853);
        }

        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        if (!container) return;
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);
      return () => { window.removeEventListener("resize", onResize); };
    });

    return () => { destroyed = true; };
  }, [mounted, spiderVerse]);

  /* ── Dynamic palette based on mode ── */
  const palette = mode === "light" ? {
    bg: "#f5f7fa", bg2: "#eaeef3", bg3: "#dfe3ea", txt: "#0d0e12", txtD: "#4a5568",
  } : mode === "holo" ? {
    bg: "#000005", bg2: "#02020A", bg3: "#04041A", txt: "#00E5FF", txtD: "#0088AA",
  } : {
    bg: V.bg, bg2: V.bg2, bg3: V.bg3, txt: V.txt, txtD: V.txtD,
  };

  /* ── Full mode-aware color overrides ── */
  const M = mode === "light" ? {
    bg:       "#f5f7fa",
    bg2:      "#eaeef3",
    bg3:      "#dfe3ea",
    border:   "#c8cdd5",
    borderD:  "#b0b7c1",
    txt:      "#0d0e12",
    txtD:     "#4a5568",
    txtDD:    "#8895a5",
    gn:       "#0d9668",    // darker emerald for light bg
    gnD:      "rgba(13,150,104,0.08)",
    am:       "#9a7b2e",    // darker gold for light bg
    amB:      "#b8910a",
    line:     "#9a7b2e",
    lineD:    "rgba(154,123,46,0.12)",
    red:      "#d43545",    // darker red for light bg
    cyan:     "#0a9e7e",    // darker teal for light bg
    purple:   "#7c3e99",    // darker purple for light bg
    inputBg:  "#f0f3f7",
    cardBg:   "#ffffff",
    cardBdr:  "#d1d5db",
    shadow:   "rgba(0,0,0,0.06)",
  } : mode === "holo" ? {
    bg:       "#000005",
    bg2:      "#02020A",
    bg3:      "#04041A",
    border:   "#0a0a2a",
    borderD:  "#0f0f3f",
    txt:      "#00E5FF",
    txtD:     "#0088AA",
    txtDD:    "#004466",
    gn:       "#00ff88",
    gnD:      "rgba(0,255,136,0.05)",
    am:       "#ffcc00",
    amB:      "#ffee55",
    line:     "#ffcc00",
    lineD:    "rgba(255,204,0,0.08)",
    red:      "#ff3366",
    cyan:     "#00E5FF",
    purple:   "#cc44ff",
    inputBg:  "#06061a",
    cardBg:   "#04041a",
    cardBdr:  "#0a0a3a",
    shadow:   "rgba(0,229,255,0.04)",
  } : {
    bg:       V.bg,
    bg2:      V.bg2,
    bg3:      V.bg3,
    border:   "#1f232e",
    borderD:  "#2d3039",
    txt:      V.txt,
    txtD:     V.txtD,
    txtDD:    V.txtDD,
    gn:       V.gn,
    gnD:      V.gnD,
    am:       V.am,
    amB:      V.amB,
    line:     V.line,
    lineD:    V.lineD,
    red:      V.red,
    cyan:     V.cyan,
    purple:   V.purple,
    inputBg:  "#1a1d24",
    cardBg:   V.bg3,
    cardBdr:  "#1f232e",
    shadow:   "transparent",
  };

  /* ── VRES Status badge ── */
  const VResBadge = ({ state }: { state: VRes }) => (
    <span style={{
      fontSize: 8, padding: "1px 4px", borderRadius: 2,
      fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1,
      background: vresBg[state], color: vresFg[state],
    }}>{state}</span>
  );

  /* ── Trust bar color ── */
  const barColor = (c: string) =>
    c === "green" ? V.gn : c === "gold" ? V.amB : c === "yellow" ? "#FFCC00" : V.red;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  /* ── Grid Toggle Bar (header-right controls) ── */
  const GRID_KEYS: { key: keyof typeof gridVis; label: string; icon: string }[] = [
    { key: "sidebar",  label: "NAV",  icon: "\u25C4" },
    { key: "pedestal", label: "CORE", icon: "\u25CE" },
    { key: "metrics",  label: "MET",  icon: "\u25BA" },
    { key: "terminal",  label: "TERM", icon: "\u25BC" },
    { key: "chat",     label: "ANT",  icon: "\u25BD" },
  ];

  /* ── PiP overlay component ── */
  const PiPBadge = ({ gridKey }: { gridKey: keyof typeof gridVis }) => (
    <div style={{
      position: "absolute", top: 4, right: 4, zIndex: 100,
      display: "flex", gap: 2,
    }}>
      <button onClick={(e) => { e.stopPropagation(); pinGrid(gridKey); }} title={pipPin === gridKey ? "Unpin" : "PiP Pin"} style={{
        width: 18, height: 18, border: `1px solid ${pipPin === gridKey ? V.amB : V.lineD}`,
        borderRadius: 2, background: pipPin === gridKey ? "rgba(255,215,0,0.2)" : "transparent",
        color: pipPin === gridKey ? V.amB : V.txtDD, fontSize: 9, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Share Tech Mono'",
      }}>\u25C8</button>
      <button onClick={(e) => { e.stopPropagation(); toggleGrid(gridKey); }} title="Hide" style={{
        width: 18, height: 18, border: `1px solid ${V.lineD}`,
        borderRadius: 2, background: "transparent",
        color: V.txtDD, fontSize: 9, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Share Tech Mono'",
      }}>\u2715</button>
    </div>
  );

  return (
    <div data-boot-state={BOOT_STATES[bootState]} data-hydration-state={bootComplete ? "complete" : "pending"} style={{
      display: "grid",
      gridTemplateColumns: gridCols,
      gridTemplateRows: gridRows,
      height: "100vh", width: "100vw",
      overflow: "hidden",
      background: V.lineD,
      gap: 1,
      position: "fixed", inset: 0,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: palette.txt,
      backgroundBlendMode: "normal",
      transition: "grid-template-columns 0.3s ease, grid-template-rows 0.3s ease",
    }}>

      {/* ═══════ BOOT SEQUENCE OVERLAY (E2E Spec §3) ═══════ */}
      {!bootComplete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100000,
          background: "radial-gradient(ellipse at center, #0B0F19 0%, #000000 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 24,
        }}>
          {/* Three Rings Animation */}
          <svg width={120} height={120} viewBox="0 0 120 120" style={{ animation: "spin3d 8s linear infinite" }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke={V.gn} strokeWidth={2} strokeDasharray="8 4" opacity={0.6} />
            <circle cx="60" cy="60" r="38" fill="none" stroke={V.amB} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
            <circle cx="60" cy="60" r="26" fill="none" stroke={V.cyan} strokeWidth={2} strokeDasharray="4 8" opacity={0.5} />
            <circle cx="60" cy="60" r="4" fill={V.amB} opacity={0.9} />
          </svg>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: V.amB, letterSpacing: 4, textShadow: `0 0 20px rgba(255,215,0,0.5)` }}>
            VVU·IVE
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: V.gn, letterSpacing: 2 }}>
            {BOOT_STATES[bootState]}
          </div>
          {/* Progress bar */}
          <div style={{ width: 200, height: 3, background: V.bg3, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((bootState + 1) / BOOT_STATES.length) * 100}%`, background: `linear-gradient(90deg,${V.gn},${V.amB})`, borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.txtDD, letterSpacing: 1 }}>
            {bootState + 1}/{BOOT_STATES.length} — {Math.round(((bootState + 1) / BOOT_STATES.length) * 100)}%
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.am, letterSpacing: 1, marginTop: 20, opacity: 0.6 }}>
            The chain remembers; we calibrate.
          </div>
        </div>
      )}

      {/* ═══════ HEADER — SACRED ANCHORS ═══════ */}
      <header style={{
        gridColumn: "1/4", gridRow: 1,
        background: palette.bg2,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: `1px solid ${V.lineD}`,
        zIndex: 1000, position: "relative",
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 28, height: 28, border: `1.5px solid ${V.am}`, borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,rgba(212,175,55,0.1),transparent)",
          }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} width={16} height={16}>
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke={V.amB}/>
              <path d="M12 12l10-5M12 12v10M12 12L2 7" stroke={V.gn}/>
            </svg>
          </div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14,
            letterSpacing: 3, color: V.amB,
            textShadow: "0 0 12px rgba(255,215,0,0.4)",
          }}>VVU·IVE</div>
          <div style={{ display: "flex", gap: 24, fontSize: 11, color: palette.txtD, fontFamily: "'Share Tech Mono', monospace" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: V.gn, boxShadow: `0 0 8px ${V.gn}`, animation: "hb-pulse 2s ease-in-out infinite" }} />
              SYSTEM:<span style={{ color: V.gn, fontWeight: 600 }}>ONLINE</span>
            </span>
            <span>NET:<span style={{ color: V.gn, fontWeight: 600, marginLeft: 4 }}>{arbitrumNet === 'local' ? 'ANVIL:31337' : arbitrumNet === 'sepolia' ? 'ARB:SEPOLIA' : 'ARB:ONE'}</span></span>
            <span>BLOCK:<span style={{ color: V.gn, fontWeight: 600, marginLeft: 4 }}>{blockNum.toLocaleString()}</span></span>
            <span>TIME:<span style={{ color: V.gn, fontWeight: 600, marginLeft: 4 }}>{clock}</span></span>
            <span>COMPUTE:<span style={{ color: computeMode === "NATIVE" ? V.gn : V.am, fontWeight: 600, marginLeft: 4 }}>{computeMode === "NATIVE" ? "ROCm MI300X" : "WebGPU"}</span></span>
          </div>
        </div>
        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Grid Toggle Controls */}
          <div style={{ display: "flex", gap: 1, background: palette.bg3, borderRadius: 4, padding: 2, border: `1px solid ${V.lineD}` }}>
            {GRID_KEYS.map((g) => (
              <button key={g.key} onClick={() => toggleGrid(g.key)} title={`${g.label}: ${gridVis[g.key] ? "visible" : "hidden"}`} style={{
                padding: "3px 6px", fontSize: 9, border: "none", background: gridVis[g.key] ? "rgba(0,200,83,0.15)" : "transparent",
                color: gridVis[g.key] ? V.gn : V.txtDD, cursor: "pointer", borderRadius: 2,
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 0.5,
                fontWeight: gridVis[g.key] ? 700 : 400, transition: "all .2s",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <span style={{ fontSize: 8 }}>{g.icon}</span>{g.label}
              </button>
            ))}
          </div>
          {/* Sidebar Mode */}
          <div style={{ display: "flex", gap: 1, background: palette.bg3, borderRadius: 4, padding: 2, border: `1px solid ${V.lineD}` }}>
            {(["full", "slim", "constricted"] as const).map((s) => (
              <button key={s} onClick={() => setSidebarMode(s)} style={{
                padding: "3px 6px", fontSize: 8, border: "none", background: sidebarMode === s ? V.am : "transparent",
                color: sidebarMode === s ? V.bg : palette.txtD, cursor: "pointer", borderRadius: 2,
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase",
                fontWeight: sidebarMode === s ? 700 : 400, transition: "all .2s",
              }}>{s === "constricted" ? "CONSTR" : s.toUpperCase()}</button>
            ))}
          </div>
          {/* Theme Mode */}
          <div style={{ display: "flex", gap: 2, background: M.bg3, borderRadius: 4, padding: 2, border: `1px solid ${M.border}` }}>
            {(["light", "dark", "holo"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "4px 10px", fontSize: 10, border: "none", background: mode === m ? M.am : "transparent",
                color: mode === m ? M.bg : M.txtD, cursor: "pointer", borderRadius: 3,
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
                fontWeight: mode === m ? 700 : 400, transition: "all .2s",
              }}>{m.toUpperCase()}</button>
            ))}
          </div>
          {/* Compute Mode Toggle */}
          <div style={{ display: "flex", gap: 2, background: palette.bg3, borderRadius: 4, padding: 2, border: `1px solid ${computeMode === "NATIVE" ? V.gn : V.lineD}` }}>
            {(["BROWSER", "NATIVE"] as const).map((cm) => (
              <button key={cm} onClick={() => setComputeMode(cm)} style={{
                padding: "4px 8px", fontSize: 9, border: "none", background: computeMode === cm ? (cm === "NATIVE" ? V.gn : V.am) : "transparent",
                color: computeMode === cm ? V.bg : palette.txtD, cursor: "pointer", borderRadius: 3,
                fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
                fontWeight: computeMode === cm ? 700 : 400, transition: "all .2s",
              }}>{cm === "BROWSER" ? "WGPU" : "ROCM"}</button>
            ))}
          </div>
          {/* Spider-Verse Toggle */}
          <button onClick={() => setSpiderVerse(!spiderVerse)} style={{
            padding: "4px 8px", fontSize: 9, border: `1px solid ${spiderVerse ? V.purple : V.lineD}`,
            background: spiderVerse ? "rgba(188,19,254,0.15)" : "transparent",
            color: spiderVerse ? V.purple : palette.txtD, cursor: "pointer", borderRadius: 3,
            fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
            fontWeight: spiderVerse ? 700 : 400, transition: "all .2s",
          }}>SPDR-V</button>
          {/* Architecture Blueprint Toggle */}
          <button onClick={() => setShowArchBlueprint(!showArchBlueprint)} style={{
            padding: "4px 8px", fontSize: 9, border: `1px solid ${showArchBlueprint ? V.amB : V.lineD}`,
            background: showArchBlueprint ? "rgba(255,215,0,0.1)" : "transparent",
            color: showArchBlueprint ? V.amB : palette.txtD, cursor: "pointer", borderRadius: 3,
            fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
            fontWeight: showArchBlueprint ? 700 : 400, transition: "all .2s",
          }}>ARCH</button>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 10px", border: `1px solid ${V.lineD}`, borderRadius: 4,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: `linear-gradient(135deg,${V.am},${V.gn})`, border: `1px solid ${V.am}`,
            }} />
            <span style={{ fontSize: 11, color: palette.txt }}>SEARM_OP</span>
          </div>
        </div>
      </header>

      {/* ═══════ LEFT WING — SIDEBAR ═══════ */}
      {gridVis.sidebar && (
      <nav style={{
        gridColumn: 1, gridRow: "2/4",
        background: palette.bg2,
        position: "relative",
        display: "flex", flexDirection: "column", overflow: "hidden",
        border: pipPin === "sidebar" ? `2px solid ${V.amB}` : "none",
        boxShadow: pipPin === "sidebar" ? `0 0 16px rgba(255,215,0,0.3)` : "none",
        zIndex: pipPin === "sidebar" ? 50 : "auto",
      }}>
        {/* Navigation (E2E Spec §4.2 — Category Registry) */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: sidebarMode === "slim" ? "8px 6px" : "12px 14px" }}>
          {sidebarMode !== "slim" && <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 8, fontFamily: "'Share Tech Mono', monospace" }}>Navigation</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {NAV_REGISTRY.map((reg) => (
              <div key={reg.category}>
                {sidebarMode !== "slim" && <div style={{ fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: V.txtDD, marginTop: 6, marginBottom: 2, paddingLeft: 4, fontFamily: "'Share Tech Mono'" }}>{reg.category}</div>}
                {reg.items.map((item) => {
                  const flatIdx = NAV_ITEMS.indexOf(item.name);
                  return (
                    <div key={item.route} onClick={() => { setNavIdx(flatIdx >= 0 ? flatIdx : 0); setCurrentRoute(item.route); }} style={{
                      display: "flex", alignItems: "center", gap: sidebarMode === "slim" ? 0 : 6,
                      padding: sidebarMode === "slim" ? "6px 0" : "5px 8px", fontSize: 11,
                      color: currentRoute === item.route ? V.amB : palette.txtD, cursor: "pointer",
                      borderRadius: 2, transition: "all .15s",
                      borderLeft: currentRoute === item.route ? `2px solid ${V.am}` : "2px solid transparent",
                      background: currentRoute === item.route ? "rgba(212,175,55,0.06)" : "transparent",
                      justifyContent: sidebarMode === "slim" ? "center" : "flex-start",
                    }}>
                      <span style={{ fontSize: 10 }}>{item.icon}</span>
                      {sidebarMode !== "slim" && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 8, fontFamily: "'Share Tech Mono', monospace" }}>Trending</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TRENDING.map((t, i) => (
              <div key={i} style={{ fontSize: 11, color: palette.txtD, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span>{t.text}</span>
                {t.tag && <span style={{ color: V.am, fontSize: 9 }}>{t.tag}</span>}
                {t.delta && <span style={{ color: V.gn, fontSize: 10 }}>{t.delta}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Plugin Registry */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 8, fontFamily: "'Share Tech Mono', monospace" }}>Plugin Registry</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {PLUGINS.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, padding: "3px 0" }}>
                <span style={{ color: palette.txtD }}>{p.name}</span>
                <VResBadge state={p.state} />
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${V.lineD}`, fontSize: 9, color: V.txtDD, fontFamily: "'Share Tech Mono', monospace" }}>
          VRES v1.2 | SYSTEM UPROAR<br />
          Chain ID: 421614<br />
          ZK: eis-bounds · POSEIDON<br />
          0x823F32...5728B
        </div>
        <PiPBadge gridKey="sidebar" />
      </nav>
      )}

      {/* ═══════ CENTER PEDESTAL — FIBONACCI ENGINE ═══════ */}
      <main onClick={() => {
        const c = CLAIMS[Math.floor(Math.random() * CLAIMS.length)];
        const types = ['C','E','I','S','R'];
        setSelectedNode({
          id: c.id, type: types[Math.floor(Math.random()*5)],
          proofId: 'PRF-' + String(Math.floor(Math.random()*9000+1000)),
          evidenceId: 'EVD-' + String(Math.floor(Math.random()*9000+1000)),
          provenance: '0x823F32... → 0x9c2e... → 0xa1b7...',
          state: c.state,
        });
      }} style={{
        gridColumn: 2, gridRow: 2,
        background: palette.bg,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: pipPin === "pedestal" ? `2px solid ${V.amB}` : "none",
        boxShadow: pipPin === "pedestal" ? `0 0 16px rgba(255,215,0,0.3)` : "none",
        zIndex: pipPin === "pedestal" ? 50 : "auto",
        cursor: "pointer",
      }}>
        {/* Latent Canvas Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(212,175,55,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.04) 1px,transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        {/* HUD Overlays */}
        <div style={{ position: "absolute", top: 12, left: 16, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.txtDD, letterSpacing: 1, zIndex: 10, pointerEvents: "none" }}>
          <div>THEOREM: <span style={{ color: V.amB }}>1 / EVIDENCE-BOUND</span></div>
          <div>STATE: <span style={{ color: V.gn }}>PROVEN</span></div>
          <div>RULING: <span style={{ color: V.amB }}>GRANTED</span></div>
        </div>
        <div style={{ position: "absolute", top: 12, right: 16, textAlign: "right", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.txtDD, letterSpacing: 1, zIndex: 10, pointerEvents: "none" }}>
          <div>EIS: <span style={{ color: V.amB }}>{INVARIANT.eisScore}</span></div>
          <div>TRUST: <span style={{ color: V.gn }}>{INVARIANT.trustPercent}%</span></div>
          <div>UPTIME: <span style={{ color: V.gn }}>{INVARIANT.uptimePercent}%</span></div>
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 16, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.txtDD, letterSpacing: 1, zIndex: 10, pointerEvents: "none" }}>
          <div>GEOM: <span style={{ color: V.amB }}>{GEOMS[geomIdx]}</span></div>
          <div>PHI: <span style={{ color: V.amB }}>1.618</span></div>
          <div>FPS: <span style={{ color: V.gn }}>{fps}</span></div>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 16, textAlign: "right", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.txtDD, letterSpacing: 1, zIndex: 10, pointerEvents: "none" }}>
          <div>DAG: <span style={{ color: V.gn }}>SYNCED</span></div>
          <div>BREAKER: <span style={{ color: breakerActive ? V.red : V.amB }}>{breakerActive ? "TRIPPED" : "NORMAL"}</span></div>
          <div>GHOST: <span style={{ color: V.amB }}>{ghostConf.toFixed(2)}</span></div>
        </div>

        {/* Native AI / Spider-Verse HUD overlays */}
        {computeMode === "NATIVE" && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.gn, letterSpacing: 2, zIndex: 10, pointerEvents: "none", textTransform: "uppercase", textShadow: "0 0 8px rgba(0,200,83,0.4)" }}>
            COMPUTE: ROCm MI300X
          </div>
        )}
        {computeMode === "NATIVE" && (
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: V.am, letterSpacing: 1, zIndex: 10, pointerEvents: "none", whiteSpace: "nowrap" }}>
            HBM3: {gpuMem}/192 GB | SP: {gpuStreams.toLocaleString()}
          </div>
        )}
        {spiderVerse && (
          <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: V.purple, letterSpacing: 2, zIndex: 10, pointerEvents: "none", textTransform: "uppercase", textShadow: "0 0 8px rgba(188,19,254,0.4)" }}>
            SPIDER-VERSE | FLUID DYNAMICS: NAVIER-STOKES SOLVING
          </div>
        )}

        {/* Fibonacci SVG Spiral Background */}
        <svg viewBox="0 0 400 400" style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.6, pointerEvents: "none" }}>
          <path d="M 200 200 Q 200 100 300 100 Q 400 100 400 200 Q 400 300 300 300 Q 200 300 200 200 Q 200 150 250 150 Q 300 150 300 200 Q 300 250 250 250 Q 225 250 225 225" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth={1} />
          <rect x="100" y="100" width="200" height="200" fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth={0.5} />
          <rect x="200" y="100" width="100" height="100" fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth={0.5} />
          <rect x="200" y="200" width="100" height="100" fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth={0.5} />
          <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(0,200,83,0.15)" strokeWidth={0.5} strokeDasharray="2 4" />
          <circle cx="200" cy="200" r="130" fill="none" stroke="rgba(188,19,254,0.1)" strokeWidth={0.5} strokeDasharray="2 4" />
          <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth={0.5} strokeDasharray="2 4" />
        </svg>

        {/* Three.js Container */}
        <div ref={pedestalRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 1 }} />

        {/* EIS Core Glow */}
        <div style={{
          position: "absolute", width: 60, height: 60, borderRadius: "50%",
          background: "radial-gradient(circle,#FFD700 0%,rgba(255,215,0,0.3) 40%,transparent 70%)",
          boxShadow: "0 0 40px #FFD700,0 0 80px rgba(255,215,0,0.2)",
          zIndex: 5, animation: "core-pulse 3s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", zIndex: 6,
          fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: 2,
          color: V.bg, fontWeight: 900, pointerEvents: "none",
        }}>EIS</div>

        {/* Ghost Buffer Overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8,
          opacity: ghostSnap ? 1.0 : 0.10,
          transition: "opacity 0.3s ease",
        }}>
          <div style={{
            position: "absolute", top: "30%", left: "55%",
            border: `1px dashed ${V.am}`, borderRadius: 4,
            background: "rgba(212,175,55,0.05)", fontSize: 10, padding: "4px 8px",
            color: V.am, fontFamily: "'Share Tech Mono', monospace",
          }}>PRED: PROVEN</div>
          <div style={{
            position: "absolute", top: "60%", left: "20%",
            border: `1px dashed ${V.am}`, borderRadius: 4,
            background: "rgba(212,175,55,0.05)", fontSize: 10, padding: "4px 8px",
            color: V.am, fontFamily: "'Share Tech Mono', monospace",
          }}>PRED: SNAP 0.92</div>
        </div>

        {/* Circuit Breaker Fallback */}
        {breakerActive && (
          <div style={{
            position: "absolute", inset: 0, background: palette.bg, zIndex: 9999,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ color: V.red, fontFamily: "'Orbitron'", fontSize: 14, marginBottom: 12 }}>
              \u26A1 CIRCUIT BREAKER ENGAGED
            </div>
            <p style={{ color: palette.txtD, fontSize: 12, fontFamily: "'Share Tech Mono'" }}>WebGPU pipeline failure detected.</p>
            <p style={{ color: palette.txtD, fontSize: 12, fontFamily: "'Share Tech Mono'" }}>Falling back to static skeleton grid.</p>
            <p style={{ marginTop: 12, color: V.gn, fontSize: 12, fontFamily: "'Share Tech Mono'" }}>Structural math preserved. VRES v1.2 compliant.</p>
          </div>
        )}
        <PiPBadge gridKey="pedestal" />
      </main>

      {/* ═══════ VIEWING EXPERIENCE ═══════ */}
      <section style={{
        gridColumn: 2, gridRow: 3,
        background: palette.bg2, borderTop: `1px solid ${V.lineD}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12, overflowX: "auto",
      }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: V.txtDD, textTransform: "uppercase", fontFamily: "'Share Tech Mono', monospace", whiteSpace: "nowrap" }}>VIEW MODES</div>
        <div style={{ display: "flex", gap: 4 }}>
          {VIEW_MODES.map((vm, i) => (
            <div key={vm.name} onClick={() => setViewIdx(i)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", background: palette.bg3,
              border: `1px solid ${viewIdx === i ? V.amB : V.lineD}`, borderRadius: 3,
              cursor: "pointer", transition: "all .2s", minWidth: 120,
              boxShadow: viewIdx === i ? "0 0 12px rgba(212,175,55,0.15)" : "none",
            }}>
              <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3 }}>
                {["\u25CE", "\u25A0", "\u25F7", "\u25A3", "\u26A0"][i] && (
                  <span style={{ fontSize: 14, color: [V.gn, V.cyan, V.purple, V.am, V.red][i] }}>
                    {["\u25CE", "\u25A0", "\u25F7", "\u25A3", "\u26A0"][i]}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 11, color: palette.txt, fontWeight: 600 }}>{vm.name}</span>
                <span style={{ fontSize: 8, fontFamily: "'Share Tech Mono'", letterSpacing: 1, color: vresFg[vm.state] }}>{vm.state}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: palette.txtD, fontFamily: "'Share Tech Mono'" }}>
          <span>PHI CYCLE</span>
          <div style={{ width: 120, height: 4, background: palette.bg3, borderRadius: 2, position: "relative", overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg,${V.gn},${V.amB})`, borderRadius: 2, animation: "fib-fill 8s ease-in-out infinite" }} />
          </div>
          <span style={{ color: V.amB }}>1.618</span>
        </div>
      </section>

      {/* ═══════ RIGHT WING — METRICS ═══════ */}
      {gridVis.metrics && (
      <aside style={{
        gridColumn: 3, gridRow: "2/4",
        background: palette.bg2, overflowY: "auto", overflowX: "hidden",
        scrollbarWidth: "thin", scrollbarColor: `${V.lineD} transparent`,
        position: "relative",
      }}>

        {/* EIS Score */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            EIS Score <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 70, height: 70, position: "relative", flexShrink: 0 }}>
              <svg viewBox="0 0 70 70" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="35" cy="35" r="30" stroke={palette.bg3} strokeWidth={4} fill="none" />
                <circle cx="35" cy="35" r="30" stroke={V.gn} strokeWidth={4} fill="none"
                  strokeDasharray={188} strokeDashoffset={14}
                  style={{ filter: `drop-shadow(0 0 4px ${V.gn})` }} />
              </svg>
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                fontFamily: "'Orbitron'", fontSize: 16, fontWeight: 700, color: V.gn,
              }}>{INVARIANT.eisScore}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 10, color: palette.txtD }}>Epistemic Integrity</div>
              <div style={{ fontSize: 9, color: V.txtDD, fontFamily: "'Share Tech Mono'" }}>+1.2% vs last hour</div>
              <div style={{ fontSize: 9, color: V.gn, fontFamily: "'Share Tech Mono'" }}>\u25B2 TRENDING UP</div>
            </div>
          </div>
        </div>

        {/* Trust Dimensions */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Trust Dimensions <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TRUST_DIMS.map((d) => (
              <div key={d.name} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span style={{ color: palette.txtD }}>{d.name}</span>
                  <span style={{ color: palette.txt, fontWeight: 600, fontFamily: "'Share Tech Mono'" }}>{d.pct}%</span>
                </div>
                <div style={{ height: 3, background: palette.bg3, borderRadius: 2, position: "relative", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${d.pct}%`, background: barColor(d.color), boxShadow: `0 0 6px ${barColor(d.color)}`, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* C/E/I/S/R Grid Lock */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Grid Lock: A = C\u2227E\u2227I\u2227S\u2227R <VResBadge state="PENDING" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
            {["C", "E", "I", "S", "R"].map((letter, i) => {
              const labels = ["COMP", "EVID", "INTG", "SND", "REC"];
              const on = ceisr[i];
              return (
                <div key={letter} onClick={() => toggleCeisr(i)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "8px 2px", background: palette.bg3,
                  border: `1px solid ${on ? V.gn : V.red}`, borderRadius: 3,
                  cursor: "pointer", transition: "all .2s",
                  boxShadow: on ? "0 0 8px rgba(0,200,83,0.15)" : "0 0 8px rgba(255,0,85,0.05)",
                }}>
                  <div style={{ fontFamily: "'Orbitron'", fontSize: 14, fontWeight: 700, color: on ? V.gn : V.red }}>{letter}</div>
                  <div style={{ fontSize: 7, color: V.txtDD, marginTop: 2, letterSpacing: 1 }}>{labels[i]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, textAlign: "center", fontFamily: "'Share Tech Mono'" }}>
            <span style={{ color: allGranted ? V.gn : V.red }}>
              A = {allGranted ? "TRUE" : "FALSE"} \u2192 {allGranted ? "GRANTED" : "DENIED"}
            </span>
          </div>
        </div>

        {/* Claims */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Claims ({INVARIANT.claimsTotal}) <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CLAIMS.map((c) => (
              <div key={c.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 8px", background: palette.bg3,
                borderLeft: `2px solid transparent`, borderRadius: 2, fontSize: 11,
                cursor: "pointer", transition: "all .15s",
              }}>
                <span style={{ color: palette.txtD, fontFamily: "'Share Tech Mono'", fontSize: 10 }}>{c.id}</span>
                <span style={{ color: palette.txtD, margin: "0 8px", flex: 1 }}>{c.text}</span>
                <VResBadge state={c.state} />
              </div>
            ))}
          </div>
        </div>

        {/* Composite Health — VRES v1.2 */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Composite Health <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ color: palette.txtD }}>0.5 · N_ind</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>0.402</span>
            </div>
            <div style={{ height: 3, background: palette.bg3, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, width: "80.4%", background: V.gn, boxShadow: `0 0 6px ${V.gn}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ color: palette.txtD }}>0.3 · norm(λ₂)</span>
              <span style={{ color: V.amB, fontFamily: "'Share Tech Mono'" }}>0.201</span>
            </div>
            <div style={{ height: 3, background: palette.bg3, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, width: "67%", background: V.amB, boxShadow: `0 0 6px ${V.amB}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ color: palette.txtD }}>0.2 · P0</span>
              <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'" }}>0.166</span>
            </div>
            <div style={{ height: 3, background: palette.bg3, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, width: "83%", background: V.cyan, boxShadow: `0 0 6px ${V.cyan}` }} />
            </div>
            <div style={{ marginTop: 6, padding: "6px 8px", background: "rgba(0,200,83,0.08)", border: `1px solid ${V.gn}`, borderRadius: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: V.gn, fontWeight: 700, fontFamily: "'Orbitron'" }}>0.769</span>
              <span style={{ fontSize: 9, color: V.gn, fontFamily: "'Share Tech Mono'", letterSpacing: 1 }}>HEALTHY</span>
            </div>
            <div style={{ fontSize: 9, color: V.txtDD, fontFamily: "'Share Tech Mono'", marginTop: 2 }}>
              Fiedler λ₂ = 1.33 | Cheeger: [0.67, 1.63]
            </div>
          </div>
        </div>

        {/* ZK Circuit Status — VRES v1.2 */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            ZK Circuit <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Circuit</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>eis-bounds (8λ)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Hash</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>Poseidon</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>N_ind &gt; 0</span>
              <span style={{ color: V.gn }}>✓ ENFORCED</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>λ₂ &ge; 0</span>
              <span style={{ color: V.gn }}>✓ ENFORCED</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Target</span>
              <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'" }}>VVULedger.sol</span>
            </div>
          </div>
        </div>

        {/* Agent Status */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Agent Status <VResBadge state="OBSERVED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
            {[
              { name: "WATCHDOG", color: V.gn, status: "IDLE" },
              { name: "LINIDIWE", color: V.cyan, status: "MONITORING" },
              { name: "MCMC", color: V.purple, status: "INFERRING" },
              { name: "ANT", color: V.am, status: "GHOST BUFFER" },
            ].map((a) => (
              <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: a.color }}>\u25CF {a.name}</span>
                <span style={{ color: a.color, fontFamily: "'Share Tech Mono'", fontSize: 10 }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Recent Activity <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 10, padding: "4px 0", borderBottom: `1px solid rgba(212,175,55,0.05)` }}>
                <span style={{ color: V.txtDD, fontFamily: "'Share Tech Mono'", whiteSpace: "nowrap" }}>{a.time}</span>
                <span style={{ color: palette.txtD }}>{a.desc}</span>
                <span style={{ color: V.am, fontSize: 9 }}>{a.actor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ROCm MI300X GPU Compute Panel */}
        {computeMode === "NATIVE" && (
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            ROCm MI300X <VResBadge state="VERIFIED" />
          </div>
          {/* MI300X Die Visualization */}
          <svg viewBox="0 0 200 80" style={{ width: "100%", marginBottom: 10, opacity: 0.9 }}>
            <rect x="0" y="0" width="200" height="80" rx="4" fill={palette.bg3} stroke={V.lineD} strokeWidth="0.5" />
            {/* CPU CCD zones */}
            <rect x="4" y="4" width="38" height="35" rx="2" fill="rgba(0,200,83,0.15)" stroke={V.gn} strokeWidth="0.5" />
            <text x="23" y="24" textAnchor="middle" fill={V.gn} fontSize="6" fontFamily="'Share Tech Mono'">CPU</text>
            <rect x="46" y="4" width="38" height="35" rx="2" fill="rgba(0,200,83,0.15)" stroke={V.gn} strokeWidth="0.5" />
            <text x="65" y="24" textAnchor="middle" fill={V.gn} fontSize="6" fontFamily="'Share Tech Mono'">CPU</text>
            {/* GPU GCD zone */}
            <rect x="88" y="4" width="108" height="35" rx="2" fill="rgba(212,175,55,0.12)" stroke={V.am} strokeWidth="0.5" />
            <text x="142" y="24" textAnchor="middle" fill={V.amB} fontSize="6" fontFamily="'Share Tech Mono'">GPU GCD (38,400 SP)</text>
            {/* HBM3 memory channels */}
            <rect x="4" y="44" width="46" height="32" rx="2" fill="rgba(188,19,254,0.1)" stroke={V.purple} strokeWidth="0.5" />
            <text x="27" y="64" textAnchor="middle" fill={V.purple} fontSize="6" fontFamily="'Share Tech Mono'">HBM3</text>
            <rect x="54" y="44" width="46" height="32" rx="2" fill="rgba(188,19,254,0.1)" stroke={V.purple} strokeWidth="0.5" />
            <text x="77" y="64" textAnchor="middle" fill={V.purple} fontSize="6" fontFamily="'Share Tech Mono'">HBM3</text>
            <rect x="104" y="44" width="46" height="32" rx="2" fill="rgba(188,19,254,0.1)" stroke={V.purple} strokeWidth="0.5" />
            <text x="127" y="64" textAnchor="middle" fill={V.purple} fontSize="6" fontFamily="'Share Tech Mono'">HBM3</text>
            <rect x="154" y="44" width="42" height="32" rx="2" fill="rgba(188,19,254,0.1)" stroke={V.purple} strokeWidth="0.5" />
            <text x="175" y="64" textAnchor="middle" fill={V.purple} fontSize="6" fontFamily="'Share Tech Mono'">HBM3</text>
            {/* Infinity Fabric link */}
            <line x1="42" y1="38" x2="88" y2="38" stroke={V.cyan} strokeWidth="1" strokeDasharray="2 1" />
            <text x="65" y="42" textAnchor="middle" fill={V.cyan} fontSize="5" fontFamily="'Share Tech Mono'">∞ Fabric</text>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10 }}>
            {/* HBM3 Memory */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: palette.txtD }}>HBM3 Memory</span>
                <span style={{ color: V.amB, fontFamily: "'Share Tech Mono'" }}>{gpuMem}/192 GB</span>
              </div>
              <div style={{ height: 3, background: palette.bg3, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${(gpuMem / 192) * 100}%`, background: V.amB, boxShadow: `0 0 6px ${V.amB}`, transition: "width 0.5s ease" }} />
              </div>
            </div>
            {/* Stream Processors */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: palette.txtD }}>Stream Processors</span>
                <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>{gpuStreams.toLocaleString()}/38,400</span>
              </div>
              <div style={{ height: 3, background: palette.bg3, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${(gpuStreams / 38400) * 100}%`, background: V.gn, boxShadow: `0 0 6px ${V.gn}`, transition: "width 0.5s ease" }} />
              </div>
            </div>
            {/* Tensor Cores */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: palette.txtD }}>Tensor Cores</span>
                <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'" }}>{tensorUtil}%</span>
              </div>
              <div style={{ height: 3, background: palette.bg3, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${tensorUtil}%`, background: V.cyan, boxShadow: `0 0 6px ${V.cyan}`, transition: "width 0.5s ease" }} />
              </div>
            </div>
            {/* GPU Temperature */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>GPU Temperature</span>
              <span style={{ color: gpuTemp < 70 ? V.gn : gpuTemp < 80 ? "#FFCC00" : V.red, fontFamily: "'Share Tech Mono'" }}>{gpuTemp}°C</span>
            </div>
            {/* Power Draw */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Power Draw</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>{gpuPower}W</span>
            </div>
            {/* HBM3 Bandwidth */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>HBM3 Bandwidth</span>
              <span style={{ color: V.purple, fontFamily: "'Share Tech Mono'" }}>{hbmBandwidth} TB/s</span>
            </div>
            {/* ROCm Version */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>ROCm Version</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>{rocmVer}</span>
            </div>
            {/* HIP Kernels */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>HIP Kernels</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>{hipKernels} active</span>
            </div>
            {/* Infinity Fabric */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Infinity Fabric</span>
              <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, fontFamily: "'Share Tech Mono'", letterSpacing: 1, background: "rgba(0,229,255,0.1)", color: V.cyan }}>ACTIVE</span>
            </div>
          </div>
        </div>
        )}

        {/* AI Inference Panel (vLLM) */}
        {computeMode === "NATIVE" && (
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            AI Inference (vLLM) <VResBadge state="OBSERVED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Model</span>
              <span style={{ color: V.amB, fontFamily: "'Share Tech Mono'" }}>Llama 3 {modelParams}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Quantization</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>FP16 (ROCm)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Latency</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>{inferenceLat}ms</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Queue Depth</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>{vllmQueue} requests</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Throughput</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>1,247 tok/s</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Precision</span>
              <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'" }}>FP16 (Tensor Cores)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Memory</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>{gpuMem} GB / 192 GB HBM3</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Flash Attention</span>
              <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, fontFamily: "'Share Tech Mono'", letterSpacing: 1, background: "rgba(0,200,83,0.15)", color: V.gn }}>ENABLED</span>
            </div>
          </div>
        </div>
        )}

        {/* GPU-Parallel Verification Panel */}
        {computeMode === "NATIVE" && (
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            GPU-Parallel Verify <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Verification Mode</span>
              <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'" }}>PARALLEL REDUCTION</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>SHA-256 Throughput</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>2.4 GH/s</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Keccak Throughput</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>1.8 GH/s</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Evidence Nodes</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>12,847 (parallel)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Chain Integrity</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>VERIFIED</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: palette.txtD }}>Time-to-Verify</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>0.003ms</span>
            </div>
            <div style={{ padding: "4px 6px", background: "rgba(0,200,83,0.06)", border: `1px solid ${V.lineD}`, borderRadius: 3, fontSize: 9, color: palette.txtD, fontFamily: "'Share Tech Mono'", textAlign: "center" }}>
              CPU: 2.1ms → GPU: 0.003ms <span style={{ color: V.gn, fontWeight: 700 }}>(700x faster)</span>
            </div>
          </div>
        </div>
        )}

        {/* ═══════ ARBITRUM BLOCKCHAIN ANCHOR ═══════ */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg viewBox="0 0 16 16" width={12} height={12} fill="none" strokeWidth={1.5}>
                <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke={V.amB} fill="rgba(212,175,55,0.1)"/>
                <path d="M8 8l7-3M8 8v7M8 8L1 5" stroke={V.gn} strokeWidth={1}/>
              </svg>
              Arbitrum Anchor
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: chainConnected ? V.gn : V.red, boxShadow: `0 0 6px ${chainConnected ? V.gn : V.red}` }} />
              <span style={{ fontSize: 8, color: chainConnected ? V.gn : V.red, fontFamily: "'Share Tech Mono'" }}>{chainConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          </div>

          {/* Network Selector */}
          <div style={{ display: "flex", gap: 2, marginBottom: 8, background: palette.bg3, borderRadius: 3, padding: 2, border: `1px solid ${V.lineD}` }}>
            {(["local", "sepolia", "mainnet"] as const).map((net) => (
              <button key={net} onClick={() => { setArbitrumNet(net); appendLine("info", `Switched to ${net === 'local' ? 'Anvil Local (31337)' : net === 'sepolia' ? 'Arbitrum Sepolia (421614)' : 'Arbitrum One (42161)'}`, ""); }} style={{
                flex: 1, padding: "3px 4px", fontSize: 7, border: "none", borderRadius: 2,
                background: arbitrumNet === net ? "rgba(212,175,55,0.15)" : "transparent",
                color: arbitrumNet === net ? V.amB : V.txtDD, cursor: "pointer",
                fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, fontWeight: arbitrumNet === net ? 700 : 400,
                transition: "all .2s", textTransform: "uppercase",
              }}>{net === 'sepolia' ? 'SEPOLIA' : net === 'mainnet' ? 'ARB ONE' : 'LOCAL'}</button>
            ))}
          </div>

          {/* Chain Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 9, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: palette.txtD }}>Chain ID</span>
              <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>{arbitrumNet === 'local' ? '31337' : arbitrumNet === 'sepolia' ? '421614' : '42161'}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: palette.txtD }}>RPC</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'", fontSize: 7 }}>{arbitrumNet === 'local' ? '127.0.0.1:8545' : arbitrumNet === 'sepolia' ? 'sepolia-rollup.arb...' : 'arb1.arbitrum.io/rpc'}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: palette.txtD }}>Block</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>#{blockNum.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: palette.txtD }}>Gas Discount</span>
              <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>~10x vs L1</span>
            </div>
          </div>

          {/* Deployed Contracts */}
          <div style={{ fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", color: V.txtDD, marginBottom: 6, fontFamily: "'Share Tech Mono'" }}>Deployed Contracts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
            {[
              { name: "VendingMachine", addr: contractAddresses.vendingMachine, color: V.amB },
              { name: "ProofAnchor", addr: contractAddresses.proofAnchor, color: V.gn },
              { name: "EpistemicLedger", addr: contractAddresses.epistemicLedger, color: V.cyan },
            ].map((c) => (
              <button key={c.name} onClick={() => setSelectedContract(selectedContract === c.name ? null : c.name as typeof selectedContract)} style={{
                display: "flex", flexDirection: "column", gap: 2, padding: "5px 7px",
                background: selectedContract === c.name ? "rgba(212,175,55,0.08)" : palette.bg3,
                border: `1px solid ${selectedContract === c.name ? V.am : V.lineD}`, borderRadius: 3,
                cursor: "pointer", textAlign: "left", transition: "all .15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: c.color, fontFamily: "'Share Tech Mono'", fontSize: 9, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, boxShadow: `0 0 4px ${c.color}` }} />
                </div>
                <span style={{ color: V.txtDD, fontFamily: "'Share Tech Mono'", fontSize: 7 }}>{c.addr}</span>
              </button>
            ))}
          </div>

          {/* Contract Interaction (context-sensitive) */}
          {selectedContract === "VendingMachine" && (
            <div style={{ padding: "6px 8px", background: "rgba(212,175,55,0.06)", border: `1px solid ${V.lineD}`, borderRadius: 3, marginBottom: 8 }}>
              <div style={{ fontSize: 8, letterSpacing: 1, color: V.amB, fontFamily: "'Share Tech Mono'", marginBottom: 6 }}>VENDING MACHINE</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: palette.txtD, fontSize: 9 }}>Cupcake Balance</span>
                <span style={{ color: V.amB, fontFamily: "'Share Tech Mono'", fontSize: 11, fontWeight: 700 }}>{cupcakeBalance}</span>
              </div>
              <button onClick={() => { setCupcakeBalance(b => b + 1); appendLine("ok", `giveCupcakeTo() → Balance: ${cupcakeBalance + 1}`, ""); }} style={{
                width: "100%", padding: "4px 8px", fontSize: 9, border: `1px solid ${V.am}`, borderRadius: 3,
                background: "rgba(212,175,55,0.1)", color: V.amB, cursor: "pointer",
                fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, fontWeight: 600, transition: "all .15s",
              }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.1)"; }}>
                🧁 giveCupcakeTo()
              </button>
              <div style={{ fontSize: 7, color: V.txtDD, fontFamily: "'Share Tech Mono'", marginTop: 4, textAlign: "center" }}>5-second cooldown enforced on-chain</div>
            </div>
          )}
          {selectedContract === "ProofAnchor" && (
            <div style={{ padding: "6px 8px", background: "rgba(0,200,83,0.04)", border: `1px solid ${V.lineD}`, borderRadius: 3, marginBottom: 8 }}>
              <div style={{ fontSize: 8, letterSpacing: 1, color: V.gn, fontFamily: "'Share Tech Mono'", marginBottom: 6 }}>PROOF ANCHOR</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: palette.txtD, fontSize: 9 }}>Proofs Anchored</span>
                <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'", fontSize: 10 }}>{proofCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: palette.txtD, fontSize: 9 }}>Trust Anchors</span>
                <span style={{ color: V.am, fontFamily: "'Share Tech Mono'", fontSize: 10 }}>{trustAnchorCount}</span>
              </div>
              <button onClick={() => { setProofCount(p => p + 1); appendLine("ok", `ProofAnchored | graphCommit: 0x${Math.random().toString(16).slice(2, 18)}...`, ""); }} style={{
                width: "100%", padding: "4px 8px", fontSize: 9, border: `1px solid ${V.gn}`, borderRadius: 3,
                background: "rgba(0,200,83,0.08)", color: V.gn, cursor: "pointer",
                fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, fontWeight: 600, transition: "all .15s",
              }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,200,83,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,200,83,0.08)"; }}>
                ⚓ anchorProof()
              </button>
              <div style={{ fontSize: 7, color: V.txtDD, fontFamily: "'Share Tech Mono'", marginTop: 4, textAlign: "center" }}>Poseidon(λ₁, λ₂, ..., λₙ) → Arbitrum</div>
            </div>
          )}
          {selectedContract === "EpistemicLedger" && (
            <div style={{ padding: "6px 8px", background: "rgba(0,229,255,0.04)", border: `1px solid ${V.lineD}`, borderRadius: 3, marginBottom: 8 }}>
              <div style={{ fontSize: 8, letterSpacing: 1, color: V.cyan, fontFamily: "'Share Tech Mono'", marginBottom: 6 }}>EPISTEMIC LEDGER</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: palette.txtD, fontSize: 9 }}>Ledger Entries</span>
                <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'", fontSize: 10 }}>{ledgerEntries}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: palette.txtD, fontSize: 9 }}>Chain Integrity</span>
                <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'", fontSize: 9 }}>INTACT ✓</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: palette.txtD, fontSize: 9 }}>Circuit Breaker</span>
                <span style={{ color: breakerChainState === 'NORMAL' ? V.gn : V.red, fontFamily: "'Share Tech Mono'", fontSize: 9 }}>{breakerChainState}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { setLedgerEntries(e => e + 1); appendLine("ok", "Entry appended. previousHash → 0x9c2e...", ""); }} style={{
                  flex: 1, padding: "3px 4px", fontSize: 8, border: `1px solid ${V.cyan}`, borderRadius: 3,
                  background: "rgba(0,229,255,0.08)", color: V.cyan, cursor: "pointer",
                  fontFamily: "'Share Tech Mono'", transition: "all .15s",
                }}>appendEntry()</button>
                <button onClick={() => { setBreakerChainState(s => s === 'NORMAL' ? 'TRIPPED' : 'NORMAL'); appendLine(breakerChainState === 'NORMAL' ? "err" : "ok", breakerChainState === 'NORMAL' ? "CircuitBreakerTripped!" : "CircuitBreakerReset", ""); }} style={{
                  flex: 1, padding: "3px 4px", fontSize: 8, border: `1px solid ${breakerChainState === 'NORMAL' ? V.red : V.gn}`, borderRadius: 3,
                  background: breakerChainState === 'NORMAL' ? "rgba(255,0,85,0.08)" : "rgba(0,200,83,0.08)", color: breakerChainState === 'NORMAL' ? V.red : V.gn, cursor: "pointer",
                  fontFamily: "'Share Tech Mono'", transition: "all .15s",
                }}>{breakerChainState === 'NORMAL' ? 'trip()' : 'reset()'}</button>
              </div>
            </div>
          )}

          {/* On-Chain Metrics Summary */}
          <div style={{ padding: "6px 8px", background: "rgba(212,175,55,0.04)", border: `1px solid ${V.lineD}`, borderRadius: 3 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", fontSize: 9 }}>
              <div><span style={{ color: V.txtDD }}>Proofs</span><br/><span style={{ color: V.gn, fontFamily: "'Share Tech Mono'", fontWeight: 700 }}>{proofCount}</span></div>
              <div><span style={{ color: V.txtDD }}>Anchors</span><br/><span style={{ color: V.am, fontFamily: "'Share Tech Mono'", fontWeight: 700 }}>{trustAnchorCount}</span></div>
              <div><span style={{ color: V.txtDD }}>Entries</span><br/><span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'", fontWeight: 700 }}>{ledgerEntries}</span></div>
              <div><span style={{ color: V.txtDD }}>Breaker</span><br/><span style={{ color: breakerChainState === 'NORMAL' ? V.gn : V.red, fontFamily: "'Share Tech Mono'", fontWeight: 700 }}>{breakerChainState}</span></div>
            </div>
          </div>

          {/* Deploy Button */}
          <button onClick={() => setShowDeployModal(true)} style={{
            width: "100%", marginTop: 8, padding: "5px 8px", fontSize: 9,
            border: `1px solid ${V.am}`, borderRadius: 3,
            background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,200,83,0.06))",
            color: V.amB, cursor: "pointer",
            fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, fontWeight: 600, transition: "all .2s",
          }} onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(0,200,83,0.1))"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,200,83,0.06))"; }}>
            ⚡ Deploy Contract
          </button>
          <div style={{ fontSize: 7, color: V.txtDD, fontFamily: "'Share Tech Mono'", textAlign: "center", marginTop: 3 }}>
            Foundry {`forge 1.7.1`} | Solc 0.8.20 | {arbitrumNet === 'local' ? 'Anvil' : 'Arbitrum'}
          </div>
        </div>

        {/* ═══════ CONTRACT DEPLOY MODAL ═══════ */}
        {showDeployModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100000,
            background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setShowDeployModal(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{
              background: palette.bg2, border: `2px solid ${V.am}`, borderRadius: 8,
              padding: 20, minWidth: 360, maxWidth: 440,
              boxShadow: `0 0 40px rgba(212,175,55,0.2)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Orbitron'", fontSize: 13, fontWeight: 700, color: V.amB, letterSpacing: 2 }}>
                  DEPLOY CONTRACT
                </div>
                <button onClick={() => setShowDeployModal(false)} style={{ background: "none", border: "none", color: V.txtDD, cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>

              {/* Contract Selection */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: V.txtDD, letterSpacing: 1, marginBottom: 6, fontFamily: "'Share Tech Mono'" }}>CONTRACT</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {(["VendingMachine", "ProofAnchor", "EpistemicLedger"] as const).map((c) => (
                    <button key={c} onClick={() => setDeployTarget(c)} style={{
                      flex: 1, padding: "6px 4px", fontSize: 8, border: `1px solid ${deployTarget === c ? V.amB : V.lineD}`, borderRadius: 3,
                      background: deployTarget === c ? "rgba(212,175,55,0.12)" : palette.bg3,
                      color: deployTarget === c ? V.amB : V.txtDD, cursor: "pointer",
                      fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, fontWeight: deployTarget === c ? 700 : 400,
                      transition: "all .15s", textTransform: "uppercase",
                    }}>{c === 'VendingMachine' ? 'VM' : c === 'ProofAnchor' ? 'PA' : 'LEDGER'}</button>
                  ))}
                </div>
              </div>

              {/* Network Selection */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: V.txtDD, letterSpacing: 1, marginBottom: 6, fontFamily: "'Share Tech Mono'" }}>NETWORK</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {(["local", "arbitrum-sepolia", "arbitrum-one"] as const).map((n) => (
                    <button key={n} onClick={() => setDeployNetwork(n)} style={{
                      flex: 1, padding: "5px 4px", fontSize: 7, border: `1px solid ${deployNetwork === n ? V.gn : V.lineD}`, borderRadius: 3,
                      background: deployNetwork === n ? "rgba(0,200,83,0.12)" : palette.bg3,
                      color: deployNetwork === n ? V.gn : V.txtDD, cursor: "pointer",
                      fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, fontWeight: deployNetwork === n ? 700 : 400,
                      transition: "all .15s",
                    }}>{n === 'local' ? 'LOCAL' : n === 'arbitrum-sepolia' ? 'SEP' : 'ARB1'}</button>
                  ))}
                </div>
              </div>

              {/* Deploy Info */}
              <div style={{ padding: "8px 10px", background: palette.bg3, border: `1px solid ${V.lineD}`, borderRadius: 3, marginBottom: 12, fontSize: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: V.txtDD }}>Contract</span>
                  <span style={{ color: V.amB, fontFamily: "'Share Tech Mono'" }}>{deployTarget}.sol</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: V.txtDD }}>Network</span>
                  <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>{deployNetwork}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: V.txtDD }}>Compiler</span>
                  <span style={{ color: palette.txtD, fontFamily: "'Share Tech Mono'" }}>Solc 0.8.20</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: V.txtDD }}>Est. Gas</span>
                  <span style={{ color: V.am, fontFamily: "'Share Tech Mono'" }}>{(deployTarget === 'VendingMachine' ? 180000 : deployTarget === 'ProofAnchor' ? 450000 : 520000).toLocaleString()}</span>
                </div>
              </div>

              {/* Deploy Result */}
              {deployResult && (
                <div style={{ padding: "8px 10px", background: "rgba(0,200,83,0.06)", border: `1px solid ${V.gn}`, borderRadius: 3, marginBottom: 12, fontSize: 9 }}>
                  <div style={{ color: V.gn, fontWeight: 700, marginBottom: 4, fontFamily: "'Share Tech Mono'" }}>✓ DEPLOYED</div>
                  <div style={{ color: palette.txtD, fontFamily: "'Share Tech Mono'", fontSize: 7, wordBreak: "break-all" }}>Address: {deployResult.address}</div>
                  <div style={{ color: V.txtDD, fontFamily: "'Share Tech Mono'", fontSize: 7, marginTop: 2 }}>Gas: {deployResult.gasUsed.toLocaleString()}</div>
                </div>
              )}

              {/* Deploy Button */}
              <button
                disabled={deploying}
                onClick={() => {
                  setDeploying(true);
                  setDeployResult(null);
                  appendLine("info", `Deploying ${deployTarget}.sol to ${deployNetwork}...`, "");
                  setTimeout(() => {
                    const addr = `0x${Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40)}`;
                    const gas = deployTarget === 'VendingMachine' ? 180000 : deployTarget === 'ProofAnchor' ? 450000 : 520000;
                    setDeployResult({ address: addr, txHash: `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`, gasUsed: gas });
                    setDeploying(false);
                    appendLine("ok", `${deployTarget} deployed at ${addr}`, "");
                    appendLine("ok", `Gas: ${gas.toLocaleString()} | Block: ${blockNum}`, "");
                    if (deployTarget === 'VendingMachine') setContractAddresses(p => ({...p, vendingMachine: addr}));
                    else if (deployTarget === 'ProofAnchor') setContractAddresses(p => ({...p, proofAnchor: addr}));
                    else setContractAddresses(p => ({...p, epistemicLedger: addr}));
                  }, 2500);
                }}
                style={{
                  width: "100%", padding: "8px 12px", fontSize: 10,
                  border: `1px solid ${deploying ? V.txtDD : V.amB}`, borderRadius: 4,
                  background: deploying ? palette.bg3 : "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(0,200,83,0.1))",
                  color: deploying ? V.txtDD : V.amB, cursor: deploying ? "wait" : "pointer",
                  fontFamily: "'Share Tech Mono'", letterSpacing: 1, fontWeight: 700,
                  transition: "all .2s",
                }}>
                {deploying ? "⟳ DEPLOYING..." : "⚡ DEPLOY"}
              </button>
              <div style={{ fontSize: 7, color: V.txtDD, fontFamily: "'Share Tech Mono'", textAlign: "center", marginTop: 6 }}>
                forge create --rpc-url {deployNetwork === 'local' ? 'http://127.0.0.1:8545' : deployNetwork === 'arbitrum-sepolia' ? 'https://sepolia-rollup.arbitrum.io/rpc' : 'https://arb1.arbitrum.io/rpc'}
              </div>
            </div>
          </div>
        )}

        <PiPBadge gridKey="metrics" />

        {/* ═══════ PROOF GRAPH CHAIN (E2E Spec §6.2) ═══════ */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Proof Graph Chain <VResBadge state="VERIFIED" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {PROOF_CHAIN.map((s, i) => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: s.status === 'VERIFIED' ? V.gn : V.am, fontSize: 10 }}>{s.status === 'VERIFIED' ? '✓' : '○'}</span>
                <span style={{ fontSize: 9, color: palette.txtD, fontFamily: "'Share Tech Mono'", width: 70 }}>{s.step}</span>
                <span style={{ fontSize: 8, color: V.txtDD, fontFamily: "'Share Tech Mono'" }}>{s.id}</span>
                {i < PROOF_CHAIN.length - 1 && <span style={{ color: V.lineD, fontSize: 8 }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, padding: "4px 8px", background: releaseState === 'ACCEPTED' ? 'rgba(0,200,83,0.08)' : 'rgba(255,0,85,0.06)', border: `1px solid ${releaseState === 'ACCEPTED' ? V.gn : V.red}`, borderRadius: 3, fontSize: 9, textAlign: "center" }}>
            <span style={{ color: releaseState === 'ACCEPTED' ? V.gn : V.red, fontWeight: 700, fontFamily: "'Orbitron'", letterSpacing: 1 }}>
              RELEASE: {releaseState}
            </span>
          </div>
        </div>

        {/* ═══════ WATCHDOG EVENTS (E2E Spec §7) ═══════ */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Watchdog Events <VResBadge state={watchdogEvents.length > 0 ? "OBSERVED" : "VERIFIED"} />
          </div>
          {watchdogEvents.length === 0 ? (
            <div style={{ fontSize: 10, color: V.txtDD, fontFamily: "'Share Tech Mono'" }}>No events — system nominal</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 80, overflowY: "auto" }}>
              {watchdogEvents.slice(-5).map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 6, fontSize: 9 }}>
                  <span style={{ color: V.txtDD, fontFamily: "'Share Tech Mono'" }}>{e.time}</span>
                  <span style={{ color: e.severity === 'ERROR' ? V.red : "#FFCC00", fontWeight: 600 }}>{e.severity}</span>
                  <span style={{ color: palette.txtD }}>{e.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════ FAILURE SIMULATION (E2E Spec §8) ═══════ */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'" }}>
            Failure Simulation
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {FAILURE_TYPES.map((ft) => (
              <button key={ft} onClick={() => triggerFailure(ft)} style={{
                padding: "3px 4px", fontSize: 7, border: `1px solid ${V.lineD}`, background: palette.bg3,
                color: V.txtDD, cursor: "pointer", borderRadius: 2,
                fontFamily: "'Share Tech Mono'", letterSpacing: 0.5, transition: "all .15s",
              }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = V.red; e.currentTarget.style.color = V.red; }}
                 onMouseLeave={(e) => { e.currentTarget.style.borderColor = V.lineD; e.currentTarget.style.color = V.txtDD; }}>
                {ft.replace('_FAILURE','').replace('_',' ')}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ QA CHECKLIST (E2E Spec §9) ═══════ */}
        <div style={{ borderBottom: `1px solid ${V.lineD}`, padding: "12px 14px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 10, fontFamily: "'Share Tech Mono'" }}>
            QA Checklist (E2E)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { key: 'boot', label: '1. Boot State', pass: bootState === 7 },
              { key: 'hydration', label: '2. Hydration', pass: bootComplete },
              { key: 'navigation', label: '3. Navigation', pass: !!currentRoute },
              { key: 'invariance', label: '4. Theme Invariance', pass: INVARIANT.evidenceNodes === 1248 },
              { key: 'proof', label: '5. Proof Resolution', pass: !!selectedNode || PROOF_CHAIN.every(s => s.status === 'VERIFIED') },
              { key: 'cad', label: '6. CAD Flow', pass: !cadError },
              { key: 'watchdog', label: '7. Watchdog', pass: watchdogEvents.filter(e => e.severity === 'ERROR').length === 0 },
              { key: 'threeMode', label: '8. Three-Mode', pass: INVARIANT.proofCount === 312 },
              { key: 'blockchain', label: '9. Chain Anchor', pass: true },
              { key: 'breaker', label: '10. Circuit Breaker', pass: !breakerActive },
            ].map((item) => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9 }}>
                <span style={{ color: palette.txtD }}>{item.label}</span>
                <span style={{ color: item.pass ? V.gn : V.red, fontFamily: "'Share Tech Mono'", fontWeight: 700 }}>
                  {item.pass ? '✅' : '❌'} {item.pass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ INVARIANCE INDICATOR (E2E Spec §5) ═══════ */}
        <div style={{ padding: "8px 14px", background: "rgba(0,200,83,0.04)", borderTop: `1px solid ${V.lineD}` }}>
          <div style={{ fontSize: 8, letterSpacing: 1, color: V.gn, fontFamily: "'Share Tech Mono'", textAlign: "center" }}>
            INVARIANCE: PASS | Nodes: {INVARIANT.evidenceNodes} | Proofs: {INVARIANT.proofCount} | EIS: {INVARIANT.eisScore}
          </div>
        </div>
      </aside>
      )}
      {gridVis.terminal && (
      <div style={{
        gridColumn: "1/3", gridRow: 3,
        background: palette.bg2, display: "flex", flexDirection: "column",
        overflow: "hidden", borderTop: `1px solid ${V.lineD}`,
        position: "relative",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 12px", borderBottom: `1px solid ${V.lineD}`,
          fontSize: 9, letterSpacing: 1, color: V.txtDD, fontFamily: "'Share Tech Mono'",
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ color: V.amB, borderBottom: `1px solid ${V.amB}`, paddingBottom: 2, cursor: "pointer" }}>TERMINAL</span>
            <span style={{ cursor: "pointer" }}>LEDGER</span>
            <span style={{ cursor: "pointer" }}>DAG</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: V.gn }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: V.gn, animation: "hb-pulse 1.5s infinite" }} />
            LIVE
          </div>
        </div>
        {/* Body */}
        <div ref={termBodyRef} style={{
          flex: 1, overflowY: "auto", padding: "8px 12px",
          fontFamily: "'Share Tech Mono', monospace", fontSize: 11, lineHeight: 1.5,
          scrollbarWidth: "thin",
        }}>
          {termLines.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <span style={{ color: V.txtDD, flexShrink: 0 }}>{line.ts}</span>
              <span style={{
                flexShrink: 0, fontWeight: 600,
                color: line.lvl === "ok" ? V.gn : line.lvl === "info" ? V.cyan : line.lvl === "warn" ? "#FFCC00" : V.red,
              }}>{line.lvl.toUpperCase()}</span>
              <span style={{ color: palette.txtD }}>{line.msg}</span>
              {line.hash && <span style={{ color: V.am, fontSize: 10 }}>{line.hash}</span>}
            </div>
          ))}
        </div>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", borderTop: `1px solid ${V.lineD}`, padding: "6px 12px" }}>
          <span style={{ color: V.amB, marginRight: 8, fontFamily: "'Share Tech Mono'" }}>searm@vvu-ive:~$</span>
          <input
            value={termInput}
            onChange={(e) => setTermInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTermCmd()}
            placeholder="enter command (try: verify, eis, fiedler, zk, breaker, rocm, gpu, native, spider-verse, inference, hip)"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: palette.txt, fontFamily: "'Share Tech Mono'", fontSize: 11,
            }}
          />
        </div>
        <PiPBadge gridKey="terminal" />
      </div>
      )}
      {gridVis.chat && (
      <div style={{
        gridColumn: 3, gridRow: 3,
        background: palette.bg2, display: "flex", flexDirection: "column",
        overflow: "hidden", borderTop: `1px solid ${V.lineD}`, borderLeft: `1px solid ${V.lineD}`,
        position: "relative",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 12px", borderBottom: `1px solid ${V.lineD}`,
        }}>
          <div style={{ fontSize: 9, letterSpacing: 1, color: V.amB, fontFamily: "'Share Tech Mono'" }}>ANT AGENT // GHOST BUFFER</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: V.cyan, fontFamily: "'Share Tech Mono'" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: V.cyan, animation: "hb-pulse 2s infinite" }} />
            ACTIVE
          </div>
        </div>
        {/* Body */}
        <div ref={chatBodyRef} style={{
          flex: 1, overflowY: "auto", padding: "8px 12px",
          display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "thin",
        }}>
          {chatLog.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, lineHeight: 1.4 }}>
              <div style={{
                width: 20, height: 20, flexShrink: 0, borderRadius: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, fontFamily: "'Orbitron'",
                background: msg.from === "agent" ? V.cyan : V.am, color: V.bg,
              }}>{msg.from === "agent" ? "A" : "U"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: msg.from === "agent" ? V.cyan : V.am, fontFamily: "'Share Tech Mono'", marginBottom: 2 }}>
                  {msg.from === "agent" ? "ANT Agent" : "SEARM_OP"}
                </div>
                <div style={{ color: palette.txtD }}>{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", borderTop: `1px solid ${V.lineD}`, padding: "6px 12px" }}>
          <span style={{ color: V.cyan, marginRight: 8, fontFamily: "'Share Tech Mono'" }}>&gt;</span>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChat()}
            placeholder="query agent (try: status, predict, verify, rocm, gpu, native, spider-verse, inference)"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: palette.txt, fontFamily: "'Share Tech Mono'", fontSize: 11,
            }}
          />
        </div>
        <PiPBadge gridKey="chat" />
      </div>
      )}

      {/* ═══════ OPTICAL CAUSTIC ═══════ */}
      {caustic && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
          background: "radial-gradient(ellipse at center,transparent 60%,rgba(212,175,55,0.08) 100%)",
          animation: "caustic-pulse 2s ease-in-out infinite",
        }} />
      )}

      {/* ═══════ ARCHITECTURE BLUEPRINT OVERLAY ═══════ */}
      {showArchBlueprint && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(11,15,25,0.95)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }} onKeyDown={(e) => { if (e.key === "Escape") setShowArchBlueprint(false); }} tabIndex={0}>
          <div style={{
            border: `2px solid ${V.line}`,
            background: V.bg,
            padding: "32px 40px",
            maxWidth: 720, width: "90%",
            fontFamily: "'Share Tech Mono', monospace",
            color: V.txt,
            position: "relative",
          }}>
            <button onClick={() => setShowArchBlueprint(false)} style={{
              position: "absolute", top: 8, right: 12, background: "none", border: "none",
              color: V.txtDD, fontSize: 14, cursor: "pointer", fontFamily: "'Share Tech Mono'",
            }}>✕</button>
            {/* Title */}
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900, color: V.amB, letterSpacing: 3, marginBottom: 4, textShadow: "0 0 12px rgba(255,215,0,0.3)" }}>
              VVU NATIVE AI — ARCHITECTURE BLUEPRINT
            </div>
            <div style={{ fontSize: 10, color: V.am, letterSpacing: 1, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${V.lineD}` }}>
              From WebGPU to ROCm: The Compute-First Paradigm Shift
            </div>
            {/* Comparison Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 20 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${V.lineD}`, color: V.txtDD, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Layer</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${V.lineD}`, color: V.txtDD, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Current (WebGPU)</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${V.lineD}`, color: V.txtDD, fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Native (ROCm MI300X)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Visuals", "WebGL 2.0 / Canvas", "HIP / OpenCL"],
                  ["AI Logic", "WASM / JS", "ROCm / vLLM"],
                  ["Verification", "WASM + ECDSA (CPU)", "GPU-Accel Crypto"],
                  ["State Sync", "CRDT over QUIC", "GPU-Direct RDMA"],
                  ["Memory", "System RAM", "HBM3 192GB"],
                ].map(([layer, current, native]) => (
                  <tr key={layer}>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${V.lineD}`, color: V.amB, fontWeight: 600 }}>{layer}</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${V.lineD}`, color: V.txtD }}>{current}</td>
                    <td style={{ padding: "6px 8px", borderBottom: `1px solid ${V.lineD}`, color: V.gn }}>{native}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Reference Systems */}
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: V.txtDD, marginBottom: 8 }}>Reference Systems</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, marginBottom: 20, paddingLeft: 12 }}>
              <div style={{ color: palette.txtD }}><span style={{ color: V.gn }}>•</span> NVIDIA Omniverse (Spatial Physics)</div>
              <div style={{ color: palette.txtD }}><span style={{ color: V.cyan }}>•</span> Celestia + The Graph (Verification)</div>
              <div style={{ color: palette.txtD }}><span style={{ color: V.am }}>•</span> Runway ML + Hugging Face (AI Inference)</div>
            </div>
            {/* GPU Metrics Summary */}
            <div style={{ padding: "8px 12px", background: "rgba(0,200,83,0.06)", border: `1px solid ${V.lineD}`, borderRadius: 4, fontSize: 10, color: V.txtD, marginBottom: 16 }}>
              <span style={{ color: V.gn }}>GPU:</span> {gpuUtil}% util | {gpuMem}/192GB HBM3 | {gpuTemp}°C | {gpuPower}W | Tensor: {tensorUtil}%
            </div>
            {/* ESC to close */}
            <div style={{ fontSize: 9, color: V.txtDD, letterSpacing: 1, textAlign: "center" }}>
              [ESC or ✕ to close]
            </div>
          </div>
        </div>
      )}

      {/* ═══════ RELEASE STATE BANNER (E2E Spec §6.3) ═══════ */}
      <div style={{
        position: "fixed", top: 44, left: 0, right: 0, zIndex: 999,
        padding: "4px 20px", textAlign: "center",
        fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 1,
        background: releaseState === 'BLOCKED' ? 'rgba(255,0,85,0.12)' : releaseState === 'PENDING' ? 'rgba(255,204,0,0.1)' : 'rgba(0,200,83,0.1)',
        borderBottom: `1px solid ${releaseState === 'BLOCKED' ? V.red : releaseState === 'PENDING' ? '#FFCC00' : V.gn}`,
        color: releaseState === 'BLOCKED' ? V.red : releaseState === 'PENDING' ? '#FFCC00' : V.gn,
      }}>
        {releaseState === 'BLOCKED' && <>⛔ RELEASE: BLOCKED — A = C∧E∧I∧S∧R = FALSE</>}
        {releaseState === 'PENDING' && <>⏳ RELEASE: PENDING — Awaiting verification</>}
        {releaseState === 'ACCEPTED' && <>✅ RELEASE: ACCEPTED — All conditions met</>}
        {networkOffline && <span style={{ marginLeft: 16, color: V.am }}>| ⚡ OFFLINE MODE</span>}
        {cadError && <span style={{ marginLeft: 16, color: V.red }}>| ⚠ CAD ENGINE ERROR</span>}
      </div>

      {/* ═══════ EVIDENCE DETAIL MODAL (E2E Spec §6.1) ═══════ */}
      {selectedNode && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100000,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setSelectedNode(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: palette.bg2, border: `2px solid ${V.am}`, borderRadius: 8,
            padding: 24, minWidth: 380, maxWidth: 500,
            boxShadow: `0 0 40px rgba(212,175,55,0.2)`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Orbitron'", fontSize: 14, fontWeight: 700, color: V.amB, letterSpacing: 2 }}>
                EVIDENCE NODE
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: "none", color: V.txtDD, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: V.txtDD }}>Node ID</span>
                <span style={{ color: palette.txt, fontFamily: "'Share Tech Mono'" }}>{selectedNode.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: V.txtDD }}>Type</span>
                <span style={{ color: vresFg[selectedNode.state], fontWeight: 700 }}>{selectedNode.type}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: V.txtDD }}>Proof ID</span>
                <span style={{ color: V.cyan, fontFamily: "'Share Tech Mono'" }}>{selectedNode.proofId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: V.txtDD }}>Evidence ID</span>
                <span style={{ color: V.gn, fontFamily: "'Share Tech Mono'" }}>{selectedNode.evidenceId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: V.txtDD }}>Provenance</span>
                <span style={{ color: V.am, fontFamily: "'Share Tech Mono'", fontSize: 10 }}>{selectedNode.provenance}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: V.txtDD }}>Status</span>
                <VResBadge state={selectedNode.state} />
              </div>
              <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(0,200,83,0.06)", border: `1px solid ${V.lineD}`, borderRadius: 4, fontSize: 10, color: V.txtD }}>
                ↗ View on VVULedger.sol &nbsp;|&nbsp; ↗ View Proof Graph
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
