"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Users, ClipboardList, Activity, Calendar, GitBranch,
  ChevronRight, ArrowLeft, Thermometer, Zap, HardDrive, Wifi,
  Shield, CheckCircle2, AlertTriangle, XCircle, Clock, Play,
  Pause, RotateCcw, GitCommit, GitMerge, Rocket, TestTube,
  FlaskConical, Box, Eye, Droplets, Battery, Radio,
  Monitor, Server, CircuitBoard, MemoryStick, ChevronDown,
  ExternalLink, Mail, Phone, Building2, GraduationCap,
  Globe, Wrench, Shirt, Coffee, Printer, Truck, Home,
  Heart, Target, TrendingUp, Award, Handshake, Star,
} from "lucide-react";
import {
  HBK_CAD_MODULES, EQUITY_SPLIT, SPONSORSHIP_PACKAGES,
  RESOURCE_REGISTER, PROGRAMME_TIMELINE, VALIDATION_PHASES,
  HBK_TABS, type HbkTabId, type CADModule, type GitAction,
  type ResourceItem, type ValidationPhase,
} from "@/lib/hbk/types";

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════

const statusColor = (s: string) => {
  switch (s) {
    case "OPERATIONAL": return "#10b981";
    case "STANDBY": return "#F59E0B";
    case "DIAGNOSTIC": return "#3B82F6";
    case "OFFLINE": return "#EF4444";
    default: return "#6B7280";
  }
};

const gitActionIcon = (a: string) => {
  switch (a) {
    case "commit": return <GitCommit className="h-3.5 w-3.5" />;
    case "push": return <GitBranch className="h-3.5 w-3.5" />;
    case "merge": return <GitMerge className="h-3.5 w-3.5" />;
    case "deploy": return <Rocket className="h-3.5 w-3.5" />;
    case "test": return <TestTube className="h-3.5 w-3.5" />;
    case "validate": return <FlaskConical className="h-3.5 w-3.5" />;
    default: return <GitCommit className="h-3.5 w-3.5" />;
  }
};

const gitActionColor = (a: string) => {
  switch (a) {
    case "commit": return "#10b981";
    case "push": return "#3B82F6";
    case "merge": return "#8B5CF6";
    case "deploy": return "#F59E0B";
    case "test": return "#EC4899";
    case "validate": return "#C9A84C";
    default: return "#6B7280";
  }
};

const resourceStatusColor = (s: string) => {
  switch (s) {
    case "secured": return "#10b981";
    case "in_progress": return "#3B82F6";
    case "open": return "#F59E0B";
    case "urgent": return "#EF4444";
    default: return "#6B7280";
  }
};

const validationStatusIcon = (s: string) => {
  switch (s) {
    case "complete": return <CheckCircle2 className="h-4 w-4" style={{ color: "#10b981" }} />;
    case "active": return <Activity className="h-4 w-4" style={{ color: "#3B82F6" }} />;
    case "pending": return <Clock className="h-4 w-4" style={{ color: "#6B7280" }} />;
    case "failed": return <XCircle className="h-4 w-4" style={{ color: "#EF4444" }} />;
    default: return null;
  }
};

// ════════════════════════════════════════════════════════════════════════
// SIMULATED GIT ACTIONS GENERATOR
// ════════════════════════════════════════════════════════════════════════

function generateGitActions(count: number): GitAction[] {
  const actions: GitAction["action"][] = ["commit", "push", "merge", "deploy", "test", "validate"];
  const branches = ["main", "hbk/mk-ii", "hbk/bayesian-engine", "hbk/sensor-cal", "hbk/cad-layout", "hbk/partners"];
  const messages = [
    "feat: add AMD Ryzen AI compute module bounding box",
    "fix: sensor isolation distance verified at X=20, Y=180",
    "refactor: BMS power distribution routing updated",
    "feat: NVMe storage bay vibration dampening mounts",
    "chore: IP67 transit shell envelope clearance check",
    "test: Bayesian inference engine MCMC convergence",
    "feat: Comms routing node Cellular/GNSS integration",
    "validate: 72h validation phase V3 metrics passing",
    "deploy: HBK Mk-II chassis layout to FreeCAD workspace",
    "merge: hbk/sensor-cal → main (acoustic filtering verified)",
    "feat: equity split 70/20/5 embedded in metadata",
    "fix: analog isolation clearance zone expanded",
    "test: Kria SoM edge-compute integration",
    "validate: Brier Score ≤ 0.02 threshold check",
    "feat: Founding Partners campaign framework",
    "chore: resource register initial data migration",
  ];
  const authors = ["eng-lead", "cad-operator", "bayesian-eng", "sensor-tech", "field-ops", "devops"];
  const result: GitAction[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const hash = Math.random().toString(16).slice(2, 9);
    result.push({
      id: `ga-${i}`,
      timestamp: new Date(now - (count - i) * 180000 + Math.random() * 60000).toISOString(),
      action,
      branch: branches[Math.floor(Math.random() * branches.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      author: authors[Math.floor(Math.random() * authors.length)],
      status: Math.random() > 0.08 ? "success" : Math.random() > 0.5 ? "running" : "failed",
      hash,
    });
  }
  return result;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════

export function HbkDashboard() {
  const [activeTab, setActiveTab] = useState<HbkTabId>("twin");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [gitActions] = useState<GitAction[]>(() => generateGitActions(24));
  const [simRunning, setSimRunning] = useState(false);
  const [simElapsed, setSimElapsed] = useState(0);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulation timer
  useEffect(() => {
    if (simRunning) {
      simIntervalRef.current = setInterval(() => {
        setSimElapsed(prev => prev + 1);
      }, 1000);
    } else if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
    }
    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, [simRunning]);

  const simHours = Math.floor(simElapsed / 3600);
  const simMins = Math.floor((simElapsed % 3600) / 60);
  const simSecs = simElapsed % 60;

  // ── TAB RENDERING ──────────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {
      case "twin": return <DigitalTwinTab selectedModule={selectedModule} setSelectedModule={setSelectedModule} hoveredModule={hoveredModule} setHoveredModule={setHoveredModule} />;
      case "partners": return <PartnersTab />;
      case "resources": return <ResourcesTab />;
      case "simulation": return <SimulationTab simRunning={simRunning} setSimRunning={setSimRunning} simElapsed={simElapsed} setSimElapsed={setSimElapsed} simHours={simHours} simMins={simMins} simSecs={simSecs} />;
      case "timeline": return <TimelineTab />;
      case "gitlog": return <GitLogTab gitActions={gitActions} />;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* TOP BAR */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-2.5 sm:px-6" style={{ background: "rgba(15,15,24,0.5)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: "#ff2e5f40", background: "#ff2e5f10" }}>
            <Cpu className="h-4 w-4" style={{ color: "#ff2e5f" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>HBK Mk-II Digital Twin</h2>
            <p className="font-mono text-[9px] text-muted-foreground/70">Hydro-Bayesian Kernel · AMD Ryzen AI · IP67 Transit Shell</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] sm:inline-flex" style={{ borderColor: "#10b98140", background: "#10b98110", color: "#10b981" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" style={{ animation: "vvu-live-pulse 2s ease-in-out infinite" }} />
            LIVE
          </span>
          <span className="rounded-full border px-2 py-1 font-mono text-[9px]" style={{ borderColor: "#C9A84C40", background: "#C9A84C10", color: "#C9A84C" }}>
            70/20/5
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/[0.06] px-3 sm:px-5" style={{ background: "rgba(15,15,24,0.3)" }}>
        {HBK_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-[10.5px] transition-all ${isActive ? "border-[#ff2e5f] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              title={tab.description}
            >
              {isActive && <motion.span layoutId="hbk-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#ff2e5f" }} />}
              <span style={{ color: isActive ? "#ff2e5f" : undefined }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div className="min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DIGITAL TWIN TAB — 3D CAD Layout + Module Status + Equity Split
// ════════════════════════════════════════════════════════════════════════

function DigitalTwinTab({
  selectedModule,
  setSelectedModule,
  hoveredModule,
  setHoveredModule,
}: {
  selectedModule: string | null;
  setSelectedModule: (id: string | null) => void;
  hoveredModule: string | null;
  setHoveredModule: (id: string | null) => void;
}) {
  const modules = HBK_CAD_MODULES.filter(m => m.id !== "base-plate");
  const basePlate = HBK_CAD_MODULES[0];
  const selected = selectedModule ? HBK_CAD_MODULES.find(m => m.id === selectedModule) : null;

  // Scale: 1mm = 0.8px for the layout
  const scale = 0.8;
  const canvasW = 460 * scale;
  const canvasH = 360 * scale;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* LEFT: CAD Layout */}
      <div className="space-y-4">
        {/* 3D Layout Canvas */}
        <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">HBK Mk-II CAD Layout</h3>
            <span className="font-mono text-[9px] text-muted-foreground">460×360×180mm IP67 Shell</span>
          </div>
          <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, background: "rgba(20,20,30,0.8)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Grid overlay */}
            <svg className="absolute inset-0" width={canvasW} height={canvasH} style={{ opacity: 0.08 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`vl-${i}`} x1={(i + 1) * canvasW / 11} y1={0} x2={(i + 1) * canvasW / 11} y2={canvasH} stroke="white" strokeWidth={0.5} />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`hl-${i}`} x1={0} y1={(i + 1) * canvasH / 9} x2={canvasW} y2={(i + 1) * canvasH / 9} stroke="white" strokeWidth={0.5} />
              ))}
            </svg>

            {/* Module blocks */}
            {modules.map((mod) => {
              const x = mod.position.x * scale;
              const y = mod.position.y * scale;
              const w = mod.length * scale;
              const h = mod.width * scale;
              const isHovered = hoveredModule === mod.id;
              const isSelected = selectedModule === mod.id;
              return (
                <motion.div
                  key={mod.id}
                  className="absolute cursor-pointer"
                  style={{ left: x, top: y, width: w, height: h }}
                  onMouseEnter={() => setHoveredModule(mod.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  onClick={() => setSelectedModule(isSelected ? null : mod.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="flex h-full w-full items-center justify-center rounded-sm border transition-all"
                    style={{
                      background: `${mod.color}${isHovered ? "40" : "20"}`,
                      borderColor: isSelected ? mod.color : `${mod.color}60`,
                      borderWidth: isSelected ? 2 : 1,
                      boxShadow: isSelected ? `0 0 12px ${mod.color}40` : "none",
                    }}
                  >
                    <div className="text-center">
                      <div className="font-mono text-[8px] font-bold" style={{ color: mod.color }}>{mod.label.split(" ")[0]}</div>
                      <div className="font-mono text-[7px] text-muted-foreground/60">{mod.length}×{mod.width}</div>
                    </div>
                  </div>
                  {/* Status indicator */}
                  <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-black/50" style={{ background: statusColor(mod.status) }} />
                </motion.div>
              );
            })}

            {/* Coordinate labels */}
            <div className="absolute bottom-1 left-1 font-mono text-[7px] text-muted-foreground/40">X=0</div>
            <div className="absolute bottom-1 right-1 font-mono text-[7px] text-muted-foreground/40">X=460</div>
            <div className="absolute left-1 top-1 font-mono text-[7px] text-muted-foreground/40">Y=0</div>
            <div className="absolute bottom-6 left-1 font-mono text-[7px] text-muted-foreground/40">Y=360</div>

            {/* Isolation zone indicator */}
            <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
              <line x1={20 * scale} y1={180 * scale} x2={160 * scale} y2={120 * scale} stroke="#ff2e5f" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
              <text x={80 * scale} y={155 * scale} fill="#ff2e5f" fontSize={7} opacity={0.5} fontFamily="monospace">isolation zone</text>
            </svg>
          </div>
        </div>

        {/* Module Status Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <motion.div
              key={mod.id}
              className={`rounded-lg border p-3 transition-all cursor-pointer ${selectedModule === mod.id ? "ring-1" : ""}`}
              style={{
                borderColor: `${mod.color}30`,
                background: "rgba(15,15,24,0.6)",
                ringColor: mod.color,
              }}
              onClick={() => setSelectedModule(selectedModule === mod.id ? null : mod.id)}
              whileHover={{ borderColor: `${mod.color}60` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: statusColor(mod.status) }} />
                  <span className="font-mono text-[9px] font-bold" style={{ color: mod.color }}>{mod.name.replace(/_/g, " ")}</span>
                </div>
                <span className="font-mono text-[8px] text-muted-foreground/50">{mod.status}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-3 w-3 text-muted-foreground/50" />
                  <span className="font-mono text-[9px] text-muted-foreground">{mod.tempC}°C</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-muted-foreground/50" />
                  <span className="font-mono text-[9px] text-muted-foreground">{mod.loadPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Box className="h-3 w-3 text-muted-foreground/50" />
                  <span className="font-mono text-[9px] text-muted-foreground">{mod.length}×{mod.width}×{mod.height}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-muted-foreground/50" />
                  <span className="font-mono text-[9px] text-muted-foreground">({mod.position.x},{mod.position.y})</span>
                </div>
              </div>
              {/* Load bar */}
              <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full transition-all" style={{ width: `${mod.loadPct}%`, background: mod.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT: Equity Split + Selected Module Details */}
      <div className="space-y-4">
        {/* Equity Split */}
        <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Equity Split</h3>
          <div className="space-y-3">
            {EQUITY_SPLIT.map((slice) => (
              <div key={slice.holder}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold" style={{ color: slice.color }}>{slice.holder}</span>
                  <span className="font-mono text-[10px] text-foreground">{slice.pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: slice.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${slice.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-0.5 font-mono text-[8px] text-muted-foreground/60">{slice.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Module Details */}
        {selected ? (
          <motion.div
            className="rounded-xl border p-4"
            style={{ borderColor: `${selected.color}30`, background: "rgba(15,15,24,0.6)" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: selected.color }}>{selected.label}</h3>
            <p className="mb-3 font-mono text-[9px] text-muted-foreground">{selected.description}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Status</span>
                <span className="font-mono text-[9px] font-bold" style={{ color: statusColor(selected.status) }}>{selected.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Dimensions</span>
                <span className="font-mono text-[9px] text-foreground">{selected.length}×{selected.width}×{selected.height} mm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Position (X,Y,Z)</span>
                <span className="font-mono text-[9px] text-foreground">({selected.position.x}, {selected.position.y}, {selected.position.z})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Temperature</span>
                <span className="font-mono text-[9px] text-foreground">{selected.tempC}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Load</span>
                <span className="font-mono text-[9px] text-foreground">{selected.loadPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">FreeCAD Name</span>
                <span className="font-mono text-[9px] text-foreground">{selected.name}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] p-4 text-center" style={{ background: "rgba(15,15,24,0.6)" }}>
            <Eye className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 font-mono text-[9px] text-muted-foreground/50">Click a module to inspect</p>
          </div>
        )}

        {/* Enclosure Spec */}
        <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">Enclosure Spec</h3>
          <div className="space-y-1.5">
            {[
              ["Shell", "IP67 Ruggedized Transit"],
              ["Outer Dim", "500×400×180 mm"],
              ["Working Vol", "460×360×3 mm (base)"],
              ["Material", "6061-T6 Anodized Al"],
              ["Fasteners", "316 Stainless Steel"],
              ["Compute", "AMD Ryzen AI APU"],
              ["Edge", "Kria SoM"],
              ["Isolation", "Analog→Digital Clearance"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">{k}</span>
                <span className="font-mono text-[9px] text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FOUNDING PARTNERS TAB
// ════════════════════════════════════════════════════════════════════════

function PartnersTab() {
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="rounded-xl border border-[#C9A84C]/20 p-5" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(15,15,24,0.6))" }}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C9A84C]/30" style={{ background: "#C9A84C15" }}>
            <Handshake className="h-6 w-6" style={{ color: "#C9A84C" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>The Founding 100 Campaign</h3>
            <p className="mt-1 text-sm italic text-muted-foreground/80">
              &ldquo;We are not requesting unrestricted funding. We are inviting your organization to sponsor one operational resource that enables the HBK Applied Research Programme to continue building South African technology for water infrastructure.&rdquo;
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 font-mono text-[9px] text-[#C9A84C]">100 Founding Partners</span>
              <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 font-mono text-[9px] text-[#10b981]">In-Kind Contributions</span>
              <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 font-mono text-[9px] text-[#3B82F6]">12–18 Month Programme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Psychology */}
      <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: "rgba(15,15,24,0.6)" }}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Campaign Psychology</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-red-400/60">Old Approach</div>
            <p className="text-xs text-muted-foreground">&ldquo;Will you sponsor us?&rdquo; — Asking for help</p>
          </div>
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-3">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#10b981]/60">New Approach</div>
            <p className="text-xs text-foreground">&ldquo;Will you become one of the first 100 organizations helping establish South Africa&apos;s HBK Applied Research Programme?&rdquo; — Inviting participation</p>
          </div>
        </div>
      </div>

      {/* Sponsorship Catalogue */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Sponsorship Catalogue</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPONSORSHIP_PACKAGES.map((pkg) => {
            const isExpanded = expandedPackage === pkg.id;
            return (
              <motion.div
                key={pkg.id}
                className="rounded-xl border p-4 cursor-pointer transition-all"
                style={{ borderColor: `${pkg.color}30`, background: "rgba(15,15,24,0.6)" }}
                onClick={() => setExpandedPackage(isExpanded ? null : pkg.id)}
                whileHover={{ borderColor: `${pkg.color}60` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{pkg.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: pkg.color }}>{pkg.name}</h4>
                      <span className="font-mono text-[9px] text-muted-foreground">{pkg.estimatedValue}</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
                <p className="mt-2 font-mono text-[9px] text-muted-foreground/70">{pkg.impact}</p>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                        {pkg.items.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-foreground">{item.name}</span>
                            <span className="font-mono text-[9px] text-muted-foreground">{item.qty}</span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-white/[0.06]">
                          <span className="font-mono text-[8px] text-muted-foreground/50">Typical: {pkg.items[0]?.typicalProvider}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Partner Categories */}
      <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: "rgba(15,15,24,0.6)" }}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Partner Categories</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Consortium */}
          <div className="rounded-lg border border-[#3B82F6]/20 bg-[#3B82F6]/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4" style={{ color: "#3B82F6" }} />
              <span className="text-xs font-bold" style={{ color: "#3B82F6" }}>Consortium Members</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mb-2">Formal agreements</p>
            {[
              { name: "UCT, Wits", type: "Research Collaboration" },
              { name: "WRC, NRF, DSTI", type: "Grant Agreement" },
              { name: "AMD, sensor mfg", type: "Technology Partnership" },
              { name: "NMBM", type: "Pilot Agreement" },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between py-0.5">
                <span className="font-mono text-[9px] text-foreground">{p.name}</span>
                <span className="font-mono text-[8px] text-muted-foreground/50">{p.type}</span>
              </div>
            ))}
          </div>

          {/* Friends of VVU */}
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4" style={{ color: "#10b981" }} />
              <span className="text-xs font-bold" style={{ color: "#10b981" }}>Friends of VVU</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mb-2">Informal support, no lengthy agreements</p>
            {[
              "Small businesses", "Restaurants & cafés", "Community organizations",
              "Printing companies", "Taxi companies", "Hardware stores",
            ].map(name => (
              <div key={name} className="py-0.5">
                <span className="font-mono text-[9px] text-foreground">{name}</span>
              </div>
            ))}
          </div>

          {/* Community Partner */}
          <div className="rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4" style={{ color: "#C9A84C" }} />
              <span className="text-xs font-bold" style={{ color: "#C9A84C" }}>Community Partner</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground mb-2">Operational support</p>
            {[
              { icon: <Coffee className="h-3 w-3" />, name: "Catering" },
              { icon: <Shirt className="h-3 w-3" />, name: "Uniforms" },
              { icon: <Printer className="h-3 w-3" />, name: "Printing" },
              { icon: <Truck className="h-3 w-3" />, name: "Transport" },
              { icon: <Home className="h-3 w-3" />, name: "Accommodation" },
              { icon: <Globe className="h-3 w-3" />, name: "Marketing" },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-1.5 py-0.5">
                <span className="text-muted-foreground/50">{item.icon}</span>
                <span className="font-mono text-[9px] text-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Language */}
      <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: "rgba(15,15,24,0.6)" }}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Impact Language Framework</h3>
        <div className="space-y-2">
          {[
            { need: "We require office space.", impact: "A contribution of temporary workspace will directly accelerate engineering development, field validation, and student collaboration during the foundational phase of the HBK Applied Research Programme." },
            { need: "We need laptops.", impact: "Sponsoring a workstation enables our engineering team to develop and validate the HBK Mk-II platform, advancing South Africa's hydraulic intelligence capabilities." },
            { need: "We require mobile data.", impact: "A data contribution allows our field teams to transmit critical acoustic and pressure evidence in real-time, accelerating validation of Bayesian leak detection algorithms." },
            { need: "We need branded shirts.", impact: "Supporting field uniforms establishes a professional research presence during municipal site visits, building trust with partners and communities." },
          ].map((item) => (
            <div key={item.need} className="rounded-lg border border-white/[0.04] p-3">
              <div className="font-mono text-[9px] text-red-400/60 line-through">{item.need}</div>
              <div className="mt-1 font-mono text-[9px] text-[#10b981]">{item.impact}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// RESOURCES TAB
// ════════════════════════════════════════════════════════════════════════

function ResourcesTab() {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const resources = RESOURCE_REGISTER;
  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [filterCategory, filterStatus]);

  const totalNeeded = resources.reduce((a, r) => a + r.qtyNeeded, 0);
  const totalCommitted = resources.reduce((a, r) => a + r.qtyCommitted, 0);
  const urgentCount = resources.filter(r => r.status === "urgent").length;
  const securedCount = resources.filter(r => r.status === "secured").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Resources", value: resources.length, icon: <ClipboardList className="h-4 w-4" />, color: "#C9A84C" },
          { label: "Committed", value: totalCommitted, icon: <CheckCircle2 className="h-4 w-4" />, color: "#10b981" },
          { label: "Urgent Gaps", value: urgentCount, icon: <AlertTriangle className="h-4 w-4" />, color: "#EF4444" },
          { label: "Secured", value: securedCount, icon: <Shield className="h-4 w-4" />, color: "#3B82F6" },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{card.label}</span>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div className="mt-2 text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Overall Progress</span>
          <span className="font-mono text-[9px] text-foreground">{totalCommitted}/{totalNeeded} items committed</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full transition-all" style={{ width: `${totalNeeded > 0 ? (totalCommitted / totalNeeded) * 100 : 0}%`, background: "linear-gradient(90deg, #10b981, #C9A84C)" }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-foreground"
        >
          <option value="all">All Categories</option>
          <option value="operations">Operations</option>
          <option value="engineering">Engineering</option>
          <option value="connectivity">Connectivity</option>
          <option value="field-ops">Field Ops</option>
          <option value="workshop">Workshop</option>
          <option value="branding">Branding</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-foreground"
        >
          <option value="all">All Status</option>
          <option value="urgent">Urgent</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="secured">Secured</option>
        </select>
      </div>

      {/* Resource Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Resource", "Needed", "Committed", "Gap", "Partner Type", "Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const gap = r.qtyNeeded - r.qtyCommitted;
                return (
                  <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-foreground">{r.resource}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{r.qtyNeeded} {r.unit}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-foreground">{r.qtyCommitted}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px]" style={{ color: gap > 0 ? "#EF4444" : "#10b981" }}>{gap}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{r.partnerType}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px]" style={{ borderColor: `${resourceStatusColor(r.status)}30`, background: `${resourceStatusColor(r.status)}10`, color: resourceStatusColor(r.status) }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: resourceStatusColor(r.status) }} />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// 72h VALIDATION SIMULATION TAB
// ════════════════════════════════════════════════════════════════════════

function SimulationTab({
  simRunning,
  setSimRunning,
  simElapsed,
  setSimElapsed,
  simHours,
  simMins,
  simSecs,
}: {
  simRunning: boolean;
  setSimRunning: (v: boolean) => void;
  simElapsed: number;
  setSimElapsed: (v: number) => void;
  simHours: number;
  simMins: number;
  simSecs: number;
}) {
  const [liveMetrics, setLiveMetrics] = useState({
    cpu: 45, ram: 62, queue: 0, latency: 12, facts: 0, proofs: 0, brier: 0.015,
  });

  // Simulate live metrics
  useEffect(() => {
    if (!simRunning) return;
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        cpu: Math.min(95, Math.max(20, prev.cpu + (Math.random() - 0.5) * 8)),
        ram: Math.min(90, Math.max(40, prev.ram + (Math.random() - 0.5) * 5)),
        queue: Math.max(0, Math.floor(prev.queue + (Math.random() - 0.4) * 3)),
        latency: Math.max(5, Math.min(200, prev.latency + (Math.random() - 0.5) * 20)),
        facts: prev.facts + Math.floor(Math.random() * 3),
        proofs: prev.proofs + (Math.random() > 0.7 ? 1 : 0),
        brier: Math.max(0.001, Math.min(0.05, prev.brier + (Math.random() - 0.5) * 0.003)),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [simRunning]);

  const currentPhase = VALIDATION_PHASES.find(p => p.status === "active") || VALIDATION_PHASES[2];
  const progressPct = Math.min(100, (simElapsed / (72 * 3600)) * 100);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: "rgba(15,15,24,0.6)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-geist-sans)" }}>72-Hour Validation Loop</h3>
            <p className="font-mono text-[9px] text-muted-foreground">VVU-VAL-001 · HBK Mk-II Digital Twin Prototype</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimRunning(!simRunning)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[10px] transition-all"
              style={{
                borderColor: simRunning ? "#EF444440" : "#10b98140",
                background: simRunning ? "#EF444410" : "#10b98110",
                color: simRunning ? "#EF4444" : "#10b981",
              }}
            >
              {simRunning ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Start</>}
            </button>
            <button
              onClick={() => { setSimRunning(false); setSimElapsed(0); setLiveMetrics({ cpu: 45, ram: 62, queue: 0, latency: 12, facts: 0, proofs: 0, brier: 0.015 }); }}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="mt-4 flex items-center gap-4">
          <div className="font-mono text-3xl font-bold tabular-nums" style={{ color: simRunning ? "#10b981" : "#6B7280" }}>
            {String(simHours).padStart(2, "0")}:{String(simMins).padStart(2, "0")}:{String(simSecs).padStart(2, "0")}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] text-muted-foreground">Progress</span>
              <span className="font-mono text-[9px] text-foreground">{progressPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #10b981, #C9A84C, #ff2e5f)" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[9px] text-muted-foreground">Current Phase</span>
            <div className="font-mono text-[10px] font-bold" style={{ color: "#3B82F6" }}>{currentPhase.name}</div>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      {simRunning && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "CPU", value: `${liveMetrics.cpu.toFixed(0)}%`, icon: <Cpu className="h-3.5 w-3.5" />, color: liveMetrics.cpu > 80 ? "#EF4444" : "#10b981" },
            { label: "RAM", value: `${liveMetrics.ram.toFixed(0)}%`, icon: <MemoryStick className="h-3.5 w-3.5" />, color: liveMetrics.ram > 85 ? "#EF4444" : "#3B82F6" },
            { label: "Queue Depth", value: `${liveMetrics.queue}`, icon: <Activity className="h-3.5 w-3.5" />, color: liveMetrics.queue > 10 ? "#F59E0B" : "#10b981" },
            { label: "P99 Latency", value: `${liveMetrics.latency.toFixed(0)}ms`, icon: <Clock className="h-3.5 w-3.5" />, color: liveMetrics.latency > 100 ? "#EF4444" : "#10b981" },
            { label: "Facts Accepted", value: `${liveMetrics.facts}`, icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "#C9A84C" },
            { label: "Proofs Generated", value: `${liveMetrics.proofs}`, icon: <Shield className="h-3.5 w-3.5" />, color: "#8B5CF6" },
            { label: "Brier Score", value: liveMetrics.brier.toFixed(4), icon: <FlaskConical className="h-3.5 w-3.5" />, color: liveMetrics.brier > 0.02 ? "#EF4444" : "#10b981" },
            { label: "Circuit Breaker", value: "NORMAL", icon: <Zap className="h-3.5 w-3.5" />, color: "#10b981" },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "rgba(15,15,24,0.6)" }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">{m.label}</span>
                <span style={{ color: m.color }}>{m.icon}</span>
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Phases */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Validation Phases</h3>
        {VALIDATION_PHASES.map((phase) => (
          <motion.div
            key={phase.id}
            className="rounded-xl border p-4"
            style={{
              borderColor: phase.status === "active" ? "#3B82F630" : phase.status === "complete" ? "#10b98120" : "rgba(255,255,255,0.06)",
              background: phase.status === "active" ? "rgba(59,130,246,0.05)" : "rgba(15,15,24,0.6)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {validationStatusIcon(phase.status)}
                <div>
                  <h4 className="text-xs font-bold text-foreground">{phase.name}</h4>
                  <span className="font-mono text-[9px] text-muted-foreground">{phase.duration}</span>
                </div>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: phase.status === "complete" ? "#10b981" : phase.status === "active" ? "#3B82F6" : "#6B7280" }}>
                {phase.status}
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] text-muted-foreground">{phase.description}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {phase.metrics.map(m => (
                <div key={m.label} className="rounded-md border border-white/[0.04] p-2">
                  <div className="font-mono text-[8px] text-muted-foreground/60">{m.label}</div>
                  <div className="font-mono text-[10px] font-bold" style={{ color: m.status === "pass" ? "#10b981" : m.status === "fail" ? "#EF4444" : "#F59E0B" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PROGRAMME TIMELINE TAB
// ════════════════════════════════════════════════════════════════════════

function TimelineTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: "rgba(15,15,24,0.6)" }}>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">Programme Timeline</h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.06]" />

          {PROGRAMME_TIMELINE.map((phase, idx) => (
            <div key={phase.id} className="relative mb-8 last:mb-0">
              {/* Dot */}
              <div className="absolute left-4 top-1 h-4 w-4 rounded-full border-2" style={{ borderColor: phase.color, background: phase.status === "active" ? phase.color : "transparent" }}>
                {phase.status === "active" && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: phase.color }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              <div className="ml-14">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.phase}</span>
                  <span className="rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${phase.color}30`, background: `${phase.color}10`, color: phase.color }}>
                    {phase.status}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">{phase.months}</span>
                <p className="mt-1 text-xs text-muted-foreground">{phase.description}</p>

                {/* Milestones */}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {phase.milestones.map((ms, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-white/[0.04] p-2">
                      {phase.status === "complete" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 flex-none" style={{ color: "#10b981" }} />
                      ) : phase.status === "active" && i === 0 ? (
                        <Activity className="h-3.5 w-3.5 flex-none" style={{ color: phase.color }} />
                      ) : (
                        <Clock className="h-3.5 w-3.5 flex-none text-muted-foreground/40" />
                      )}
                      <span className="font-mono text-[9px] text-foreground">{ms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Metrics */}
      <div className="rounded-xl border border-white/[0.06] p-5" style={{ background: "rgba(15,15,24,0.6)" }}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Success Metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Founding 100 Partners", target: "100 within 12 months", metric: "Signed response forms", color: "#C9A84C" },
            { label: "Resources Secured", target: "All priority resources", metric: "Resource register", color: "#10b981" },
            { label: "Programme Visibility", target: "50+ mentions", metric: "Media, social media", color: "#3B82F6" },
            { label: "Grant Funding", target: "2+ grants secured", metric: "Grant agreements", color: "#8B5CF6" },
            { label: "Research Outputs", target: "2+ papers submitted", metric: "Publications", color: "#EC4899" },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-white/[0.04] p-3 text-center">
              <div className="h-1.5 w-8 mx-auto rounded-full mb-2" style={{ background: m.color }} />
              <div className="font-mono text-[9px] font-bold" style={{ color: m.color }}>{m.label}</div>
              <div className="mt-1 font-mono text-[8px] text-muted-foreground">{m.target}</div>
              <div className="mt-0.5 font-mono text-[7px] text-muted-foreground/50">{m.metric}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// GIT ACTIONS LOG TAB
// ════════════════════════════════════════════════════════════════════════

function GitLogTab({ gitActions }: { gitActions: GitAction[] }) {
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (actionFilter === "all") return gitActions;
    return gitActions.filter(g => g.action === actionFilter);
  }, [gitActions, actionFilter]);

  const successCount = gitActions.filter(g => g.status === "success").length;
  const runningCount = gitActions.filter(g => g.status === "running").length;
  const failedCount = gitActions.filter(g => g.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Successful", value: successCount, color: "#10b981", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Running", value: runningCount, color: "#3B82F6", icon: <Activity className="h-4 w-4" /> },
          { label: "Failed", value: failedCount, color: "#EF4444", icon: <XCircle className="h-4 w-4" /> },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{card.label}</span>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div className="mt-2 text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {["all", "commit", "push", "merge", "deploy", "test", "validate"].map(f => (
          <button
            key={f}
            onClick={() => setActionFilter(f)}
            className={`rounded-full border px-3 py-1 font-mono text-[9px] transition-all ${actionFilter === f ? "border-[#ff2e5f]/30 bg-[#ff2e5f]/10 text-[#ff2e5f]" : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Action Log */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
        <div className="max-h-[500px] overflow-y-auto">
          {filtered.map((action, idx) => (
            <div key={action.id} className={`flex items-start gap-3 border-b border-white/[0.03] p-3 transition-colors hover:bg-white/[0.02] ${idx === 0 ? "border-l-2" : ""}`} style={idx === 0 ? { borderLeftColor: gitActionColor(action.action) } : {}}>
              <div className="flex-none mt-0.5" style={{ color: gitActionColor(action.action) }}>
                {gitActionIcon(action.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold" style={{ color: gitActionColor(action.action) }}>{action.action}</span>
                  <span className="font-mono text-[9px] text-muted-foreground/50">{action.hash.slice(0, 7)}</span>
                  <span className="rounded-full border border-white/[0.06] px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground/60">{action.branch}</span>
                  <span className="ml-auto flex-none">
                    {action.status === "success" ? <CheckCircle2 className="h-3 w-3" style={{ color: "#10b981" }} /> :
                     action.status === "running" ? <Activity className="h-3 w-3" style={{ color: "#3B82F6" }} /> :
                     <XCircle className="h-3 w-3" style={{ color: "#EF4444" }} />}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[9px] text-foreground/80">{action.message}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-[8px] text-muted-foreground/40">{action.author}</span>
                  <span className="font-mono text-[8px] text-muted-foreground/30">{new Date(action.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HbkDashboard;
