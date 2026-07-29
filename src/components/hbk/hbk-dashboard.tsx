"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, ClipboardList, Activity, Calendar, GitBranch,
  ChevronRight, ChevronDown, ArrowDown, ArrowRight,
  Thermometer, Zap, HardDrive,
  Shield, CheckCircle2, AlertTriangle, XCircle, Clock, Play,
  Pause, RotateCcw, GitCommit, GitMerge, Rocket, TestTube,
  FlaskConical, Box, Eye, Droplets, Battery, Radio,
  Monitor, Server, CircuitBoard, MemoryStick,
  Building2, GraduationCap, Landmark,
  Globe, Wrench,
  Target, Handshake, Star,
  Network, Lock, Route, FileCheck2, FileText,
  Users, CircleDot, Sparkles, Crown, Briefcase,
  Scale, Medal, BookOpen, Lightbulb, Gem,
  ShieldAlert, Layers, Flame, Plug,
  Key, DollarSign, BarChart3, ShieldCheck, FileWarning,
  ArrowUpRight, TrendingUp, AlertCircle, Wallet,
} from "lucide-react";
import {
  Card, CardHeader, CardContent, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  HBK_CAD_MODULES, OWNERSHIP_STRUCTURE, CONSORTIUM_PARTNERS,
  CONSORTIUM_ARCHITECTURE, IP_OWNERSHIP, ROADMAP_PHASES,
  SPONSORSHIP_PACKAGES, RESOURCE_REGISTER, PROGRAMME_TIMELINE,
  VALIDATION_PHASES, HBK_TABS,
  BATTERY_SPEC, WIRING_RAILS, THERMAL_THRESHOLDS,
  THERMAL_CONTAINMENT, PHASE2_BOM,
  HYDRO_GATEWAY_ASSEMBLY, TAAS_REVENUE_SPLIT, VERIFICATION_GATES,
  TAAS_SLA_METRICS, TAAS_FINANCING, INFRASTRUCTURE_RIGHTS,
  ZERO_FAB_PARAMETERS, TRIPARTY_KEYS, ASSET_RECOVERY_PROVISIONS,
  TAAS_CORE_PILLARS,
  type HbkTabId, type CADModule, type GitAction,
  type ResourceItem, type ValidationPhase,
  type OwnershipEntry, type ConsortiumPartner,
  type ConsortiumArchitecture, type IPCategory, type RoadmapPhase,
  type BatterySpecification, type WiringRail,
  type ThermalThreshold, type ThermalContainmentLayer,
  type BOMItem, type HydroGatewayComponent, type RevenueSplit,
  type VerificationGate, type SLAMetric, type FinancingTerm,
  type InfrastructureRight, type ZeroFabParameter,
  type TripartyKey, type AssetRecoveryProvision, type TaasPillar,
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

const partnerStatusColor = (s: string) => {
  switch (s) {
    case "active_outreach": return "#F59E0B";
    case "negotiating": return "#3B82F6";
    case "agreement_draft": return "#8B5CF6";
    case "executed": return "#10b981";
    default: return "#6B7280";
  }
};

const partnerStatusLabel = (s: string) => {
  switch (s) {
    case "active_outreach": return "Active Outreach";
    case "negotiating": return "Negotiating";
    case "agreement_draft": return "Agreement Draft";
    case "executed": return "Executed";
    default: return s;
  }
};

const partnerIcon = (iconName: string) => {
  switch (iconName) {
    case "GraduationCap": return <GraduationCap className="h-5 w-5" />;
    case "Landmark": return <Landmark className="h-5 w-5" />;
    case "Building2": return <Building2 className="h-5 w-5" />;
    case "Cpu": return <Cpu className="h-5 w-5" />;
    default: return <Users className="h-5 w-5" />;
  }
};

const tabIcon = (iconName: string) => {
  switch (iconName) {
    case "Network": return <Network className="h-3.5 w-3.5" />;
    case "Shield": return <Shield className="h-3.5 w-3.5" />;
    case "FileCheck2": return <FileCheck2 className="h-3.5 w-3.5" />;
    case "Lock": return <Lock className="h-3.5 w-3.5" />;
    case "Route": return <Route className="h-3.5 w-3.5" />;
    case "Cpu": return <Cpu className="h-3.5 w-3.5" />;
    case "ClipboardList": return <ClipboardList className="h-3.5 w-3.5" />;
    case "Activity": return <Activity className="h-3.5 w-3.5" />;
    case "Calendar": return <Calendar className="h-3.5 w-3.5" />;
    case "GitBranch": return <GitBranch className="h-3.5 w-3.5" />;
    case "Zap": return <Zap className="h-3.5 w-3.5" />;
    default: return <Cpu className="h-3.5 w-3.5" />;
  }
};

const ipIcon = (iconName: string) => {
  switch (iconName) {
    case "Shield": return <Shield className="h-5 w-5" />;
    case "FileCheck2": return <FileCheck2 className="h-5 w-5" />;
    default: return <FileText className="h-5 w-5" />;
  }
};

const roadmapIcon = (iconName: string) => {
  switch (iconName) {
    case "FlaskConical": return <FlaskConical className="h-5 w-5" />;
    case "Wrench": return <Wrench className="h-5 w-5" />;
    case "Rocket": return <Rocket className="h-5 w-5" />;
    default: return <Target className="h-5 w-5" />;
  }
};

const roadmapStatusColor = (s: string) => {
  switch (s) {
    case "active": return "#10b981";
    case "upcoming": return "#3B82F6";
    case "future": return "#C9A84C";
    default: return "#6B7280";
  }
};

// ════════════════════════════════════════════════════════════════════════
// SIMULATED GIT ACTIONS GENERATOR
// ════════════════════════════════════════════════════════════════════════

function generateGitActions(count: number): GitAction[] {
  const actions: GitAction["action"][] = ["commit", "push", "merge", "deploy", "test", "validate"];
  const branches = ["main", "hbk/mk-ii", "hbk/bayesian-engine", "hbk/sensor-cal", "hbk/cad-layout", "hbk/consortium"];
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
    "feat: VVU 100% ownership model embedded in metadata",
    "fix: analog isolation clearance zone expanded",
    "test: Kria SoM edge-compute integration",
    "validate: Brier Score ≤ 0.02 threshold check",
    "feat: consortium architecture hierarchy definition",
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
  const [activeTab, setActiveTab] = useState<HbkTabId>("consortium");
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
      case "consortium": return <ConsortiumTab />;
      case "ownership": return <OwnershipTab />;
      case "contracts": return <ContractsTab />;
      case "ip": return <IPBoundariesTab />;
      case "roadmap": return <RoadmapTab />;
      case "power-thermal": return <PowerThermalTab />;
      case "twin": return <DigitalTwinTab selectedModule={selectedModule} setSelectedModule={setSelectedModule} hoveredModule={hoveredModule} setHoveredModule={setHoveredModule} />;
      case "taas": return <TaasTab />;
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: "#C9A84C40", background: "#C9A84C10" }}>
            <Cpu className="h-4 w-4" style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>HBK Mk-II Research Consortium</h2>
            <p className="font-mono text-[9px] text-muted-foreground/70">VVU 100% Ownership · Contract-Based Partnerships · Multi-Institution Programme</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] sm:inline-flex" style={{ borderColor: "#10b98140", background: "#10b98110", color: "#10b981" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" style={{ animation: "vvu-live-pulse 2s ease-in-out infinite" }} />
            LIVE
          </span>
          <span className="rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold" style={{ borderColor: "#C9A84C60", background: "#C9A84C15", color: "#C9A84C" }}>
            VVU 100%
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
              className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-[10.5px] transition-all ${isActive ? "border-[#C9A84C] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              title={tab.description}
            >
              {isActive && <motion.span layoutId="hbk-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#C9A84C" }} />}
              <span style={{ color: isActive ? "#C9A84C" : undefined }}>{tab.label}</span>
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
// CONSORTIUM ARCHITECTURE TAB
// ════════════════════════════════════════════════════════════════════════

function ConsortiumTab() {
  const arch = CONSORTIUM_ARCHITECTURE;

  return (
    <div className="space-y-6">
      {/* Pitch Statement */}
      <motion.div
        className="rounded-xl border border-[#C9A84C]/20 p-5"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(15,15,24,0.6))" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/30" style={{ background: "#C9A84C15" }}>
            <Crown className="h-6 w-6" style={{ color: "#C9A84C" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>
              {arch.programme}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {arch.pitchStatement}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 font-mono text-[9px] text-[#C9A84C]">VVU Coordinator</span>
              <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 font-mono text-[9px] text-[#3B82F6]">Contract-Based</span>
              <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 font-mono text-[9px] text-[#10b981]">No Equity Dilution</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Narrative Shift */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Narrative Shift</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400/60" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-red-400/60">Old Narrative</span>
            </div>
            <p className="text-sm text-muted-foreground">&ldquo;{arch.narrativeShift.old}&rdquo;</p>
          </div>
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "#10b981" }} />
              <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#10b981" }}>New Narrative</span>
            </div>
            <p className="text-sm text-foreground">&ldquo;{arch.narrativeShift.new}&rdquo;</p>
          </div>
        </div>
      </motion.div>

      {/* Consortium Hierarchy */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">Consortium Architecture</h3>
        <div className="relative space-y-0">
          {/* VVU — Coordinator Level */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-[#C9A84C]/50" style={{ background: "#C9A84C20" }}>
              <Crown className="h-7 w-7" style={{ color: "#C9A84C" }} />
            </div>
            <div className="flex-1 rounded-lg border border-[#C9A84C]/30 p-3" style={{ background: "#C9A84C08" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: "#C9A84C" }}>VVU</span>
                <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-2 py-0.5 font-mono text-[8px]" style={{ color: "#C9A84C" }}>Coordinator</span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">{arch.hierarchy[0]?.description}</p>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center py-1">
            <ArrowDown className="h-5 w-5 text-[#C9A84C]/40" />
          </div>

          {/* HBK Research Consortium — Programme Level */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#3B82F6]/50" style={{ background: "#3B82F620" }}>
              <Network className="h-6 w-6" style={{ color: "#3B82F6" }} />
            </div>
            <div className="flex-1 rounded-lg border border-[#3B82F6]/30 p-3" style={{ background: "#3B82F608" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: "#3B82F6" }}>HBK Research Consortium</span>
                <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-0.5 font-mono text-[8px]" style={{ color: "#3B82F6" }}>Programme</span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">{arch.hierarchy[1]?.description}</p>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center py-1">
            <ArrowDown className="h-5 w-5 text-[#3B82F6]/40" />
          </div>

          {/* Partner Types — Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {arch.hierarchy.slice(2).map((level) => {
              const partner = CONSORTIUM_PARTNERS.find(p => p.tier === level.level);
              const color = partner?.color || "#6B7280";
              const icon = partner ? partnerIcon(partner.icon) : <Users className="h-5 w-5" />;
              return (
                <motion.div
                  key={level.level}
                  className="rounded-lg border p-3 text-center"
                  style={{ borderColor: `${color}30`, background: `${color}08` }}
                  whileHover={{ borderColor: `${color}60` }}
                >
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}15`, color }}>
                    {icon}
                  </div>
                  <div className="text-xs font-bold" style={{ color }}>{level.entity}</div>
                  <p className="mt-1 font-mono text-[8px] text-muted-foreground/70">{level.description}</p>
                  {partner && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${partnerStatusColor(partner.status)}30`, background: `${partnerStatusColor(partner.status)}10`, color: partnerStatusColor(partner.status) }}>
                      <span className="h-1 w-1 rounded-full" style={{ background: partnerStatusColor(partner.status) }} />
                      {partnerStatusLabel(partner.status)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Key Principles */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Key Principles</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: <Shield className="h-4 w-4" />, title: "VVU 100% Ownership", desc: "All core technology remains VVU property. No equity transfer through any agreement.", color: "#C9A84C" },
            { icon: <FileCheck2 className="h-4 w-4" />, title: "Contract-Based Access", desc: "Partners access the programme through specific contracts — not equity stakes.", color: "#3B82F6" },
            { icon: <Scale className="h-4 w-4" />, title: "Co-authorship ≠ Ownership", desc: "Joint research outputs are shared. Platform ownership stays with VVU.", color: "#10b981" },
          ].map((p) => (
            <div key={p.title} className="rounded-lg border p-4 text-center" style={{ borderColor: `${p.color}20`, background: `${p.color}05` }}>
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${p.color}15`, color: p.color }}>{p.icon}</div>
              <div className="text-xs font-bold" style={{ color: p.color }}>{p.title}</div>
              <p className="mt-1 font-mono text-[9px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// VVU 100% OWNERSHIP TAB
// ════════════════════════════════════════════════════════════════════════

function OwnershipTab() {
  return (
    <div className="space-y-6">
      {/* VVU 100% Badge — Visually dominant */}
      <motion.div
        className="flex flex-col items-center justify-center rounded-xl border border-[#C9A84C]/20 p-8 sm:p-12"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(15,15,24,0.7))" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Large circular badge */}
        <motion.div
          className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full border-4"
          style={{ borderColor: "#C9A84C", background: "radial-gradient(circle, #C9A84C25 0%, #C9A84C08 70%, transparent 100%)" }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid #C9A84C40" }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#C9A84C80" }}>Owner</div>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: "#C9A84C", fontFamily: "var(--font-geist-sans)" }}>VVU</div>
            <div className="font-mono text-xl sm:text-2xl font-bold" style={{ color: "#C9A84C" }}>100%</div>
          </div>
        </motion.div>

        <h3 className="mt-6 text-xl font-bold tracking-tight text-center" style={{ fontFamily: "var(--font-geist-sans)" }}>
          Venture Vision Ubuntu — Sole Owner
        </h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-lg">
          The capitalisation table stays clean. All core technology, platform IP, and manufacturing rights remain solely owned by VVU. No equity transfer through any partnership agreement.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 font-mono text-[9px]" style={{ color: "#C9A84C" }}>Clean Cap Table</span>
          <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 font-mono text-[9px]" style={{ color: "#10b981" }}>No Equity Dilution</span>
          <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 font-mono text-[9px]" style={{ color: "#3B82F6" }}>Contract-Based Only</span>
        </div>
      </motion.div>

      {/* Ownership Details */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Ownership Structure</h3>
        {OWNERSHIP_STRUCTURE.map((entry) => (
          <div key={entry.holder} className="rounded-lg border border-[#C9A84C]/20 p-4" style={{ background: "#C9A84C08" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: entry.color }} />
                <span className="font-mono text-xs font-bold" style={{ color: entry.color }}>{entry.holder}</span>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color: entry.color }}>{entry.pct}%</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${entry.color}, ${entry.color}80)` }}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 font-mono text-[9px] text-muted-foreground">{entry.description}</p>
          </div>
        ))}
      </motion.div>

      {/* Why 100% Matters */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Why 100% Ownership Matters</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: <Gem className="h-4 w-4" />, title: "Negotiate from Strength", desc: "When you own 100%, you negotiate partnerships from a position of strength — not desperation.", color: "#C9A84C" },
            { icon: <Shield className="h-4 w-4" />, title: "Protect Core IP", desc: "All hardware architecture, software, and manufacturing rights stay under VVU control.", color: "#10b981" },
            { icon: <Lightbulb className="h-4 w-4" />, title: "Decide Later", desc: "You can always decide to raise equity later — from a validated position with published results.", color: "#3B82F6" },
            { icon: <Scale className="h-4 w-4" />, title: "Clean Legal Framework", desc: "Contract-based partnerships are simpler, faster, and don't require complex shareholder agreements.", color: "#8B5CF6" },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border p-4" style={{ borderColor: `${item.color}20`, background: `${item.color}05` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${item.color}15`, color: item.color }}>{item.icon}</div>
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.title}</span>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CONTRACT-BASED PARTNERSHIPS TAB
// ════════════════════════════════════════════════════════════════════════

function ContractsTab() {
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="rounded-xl border border-[#3B82F6]/20 p-5"
        style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(15,15,24,0.6))" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#3B82F6]/30" style={{ background: "#3B82F615" }}>
            <FileCheck2 className="h-6 w-6" style={{ color: "#3B82F6" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>
              Partnership Through Contracts, Not Equity
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each partner type engages through a specific agreement that defines their benefits, obligations, and targets — without any equity transfer.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Partner Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CONSORTIUM_PARTNERS.map((partner) => {
          const isExpanded = expandedPartner === partner.id;
          const statusCol = partnerStatusColor(partner.status);
          return (
            <motion.div
              key={partner.id}
              className="rounded-xl border p-5 cursor-pointer transition-all"
              style={{ borderColor: `${partner.color}30`, background: "rgba(15,15,24,0.6)" }}
              onClick={() => setExpandedPartner(isExpanded ? null : partner.id)}
              whileHover={{ borderColor: `${partner.color}60` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${partner.color}15`, color: partner.color }}>
                    {partnerIcon(partner.icon)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: partner.color }}>{partner.name}</h4>
                    <span className="font-mono text-[9px] text-muted-foreground">{partner.agreementLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${statusCol}30`, background: `${statusCol}10`, color: statusCol }}>
                    <span className="h-1 w-1 rounded-full" style={{ background: statusCol }} />
                    {partnerStatusLabel(partner.status)}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Agreement type badge */}
              <div className="rounded-lg border p-2 mb-3" style={{ borderColor: `${partner.color}20`, background: `${partner.color}05` }}>
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" style={{ color: partner.color }} />
                  <span className="font-mono text-[9px] font-bold" style={{ color: partner.color }}>Agreement: {partner.agreementLabel}</span>
                </div>
              </div>

              {/* Targets */}
              <div className="mb-3">
                <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-1">Target Institutions</div>
                <div className="flex flex-wrap gap-1.5">
                  {partner.targets.map((t) => (
                    <span key={t} className="rounded-md border border-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-foreground/80" style={{ background: "rgba(15,15,24,0.4)" }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Rationale */}
              <div className="rounded-lg border border-white/[0.04] p-2" style={{ background: "rgba(10,10,18,0.4)" }}>
                <p className="font-mono text-[9px] text-muted-foreground">{partner.rationale}</p>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
                      {/* Benefits */}
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-wider mb-2" style={{ color: "#10b981" }}>Benefits</div>
                        <div className="space-y-1.5">
                          {partner.benefits.map((b) => (
                            <div key={b} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 flex-none" style={{ color: "#10b981" }} />
                              <span className="font-mono text-[9px] text-foreground">{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Obligations */}
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-wider mb-2" style={{ color: "#3B82F6" }}>Obligations</div>
                        <div className="space-y-1.5">
                          {partner.obligations.map((o) => (
                            <div key={o} className="flex items-center gap-2">
                              <ClipboardList className="h-3 w-3 flex-none" style={{ color: "#3B82F6" }} />
                              <span className="font-mono text-[9px] text-foreground">{o}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Agreement Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Partner Type</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Agreement</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Equity?</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {CONSORTIUM_PARTNERS.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2 font-mono text-[10px]" style={{ color: p.color }}>{p.name}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-foreground">{p.agreementLabel}</td>
                  <td className="px-3 py-2 font-mono text-[10px] font-bold" style={{ color: "#10b981" }}>None</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px]" style={{ borderColor: `${partnerStatusColor(p.status)}30`, background: `${partnerStatusColor(p.status)}10`, color: partnerStatusColor(p.status) }}>
                      {partnerStatusLabel(p.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// IP BOUNDARIES TAB
// ════════════════════════════════════════════════════════════════════════

function IPBoundariesTab() {
  return (
    <div className="space-y-6">
      {/* Statement Banner */}
      <motion.div
        className="rounded-xl border border-[#C9A84C]/20 p-5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(15,15,24,0.6))" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full border-2 border-[#C9A84C]/40" style={{ background: "#C9A84C15" }}>
          <Scale className="h-7 w-7" style={{ color: "#C9A84C" }} />
        </div>
        <h3 className="mt-4 text-lg font-bold" style={{ fontFamily: "var(--font-geist-sans)", color: "#C9A84C" }}>
          Co-authorship ≠ ownership transfer
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          Joint research outputs can be co-authored without transferring ownership of the VVU platform. Clear IP boundaries protect core technology while enabling collaborative research.
        </p>
      </motion.div>

      {/* IP Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {IP_OWNERSHIP.map((cat) => (
          <motion.div
            key={cat.id}
            className="rounded-xl border p-5"
            style={{ borderColor: `${cat.color}30`, background: "rgba(15,15,24,0.6)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: `${cat.color}40`, background: `${cat.color}15`, color: cat.color }}>
                {ipIcon(cat.icon)}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${cat.color}30`, background: `${cat.color}10`, color: cat.color }}>
                    {cat.owner === "vvu" ? "VVU Sole Owner" : "Joint Outputs"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mb-4 font-mono text-[9px] text-muted-foreground">{cat.description}</p>

            {/* Items */}
            <div className="space-y-2">
              {cat.items.map((item) => (
                <motion.div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.04] p-2.5"
                  style={{ background: `${cat.color}05` }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {cat.owner === "vvu" ? (
                    <Lock className="h-3.5 w-3.5 flex-none" style={{ color: "#C9A84C" }} />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5 flex-none" style={{ color: "#3B82F6" }} />
                  )}
                  <span className="font-mono text-[9px] text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Boundary Enforcement */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Boundary Enforcement</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Shield className="h-4 w-4" />, title: "Platform Protection", desc: "VVU core tech cannot be transferred through any agreement", color: "#C9A84C" },
            { icon: <FileCheck2 className="h-4 w-4" />, title: "Research Access", desc: "Partners get research access through contracts, not ownership", color: "#3B82F6" },
            { icon: <Lock className="h-4 w-4" />, title: "IP Clauses", desc: "Every agreement includes explicit IP boundary clauses", color: "#10b981" },
            { icon: <Scale className="h-4 w-4" />, title: "Legal Framework", desc: "SA IP law + contract law provide enforcement mechanisms", color: "#8B5CF6" },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border p-4" style={{ borderColor: `${item.color}20`, background: `${item.color}05` }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg mb-2" style={{ background: `${item.color}15`, color: item.color }}>{item.icon}</div>
              <div className="text-xs font-bold" style={{ color: item.color }}>{item.title}</div>
              <p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// THREE-PHASE ROADMAP TAB
// ════════════════════════════════════════════════════════════════════════

function RoadmapTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="rounded-xl border border-[#C9A84C]/20 p-5"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(15,15,24,0.6))" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/30" style={{ background: "#C9A84C15" }}>
            <Route className="h-6 w-6" style={{ color: "#C9A84C" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>
              Three-Phase Strategic Roadmap
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Research Enablement → Industrial Validation → Commercialisation Decision — each phase builds on validated outcomes.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Phase Timeline */}
      <div className="relative space-y-0">
        {/* Connecting line */}
        <div className="absolute left-6 top-8 bottom-8 w-px bg-white/[0.06] hidden sm:block" />

        {ROADMAP_PHASES.map((phase, idx) => {
          const phaseColor = roadmapStatusColor(phase.status);
          return (
            <motion.div
              key={phase.id}
              className="relative mb-6 last:mb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
            >
              {/* Timeline dot */}
              <div className="hidden sm:flex absolute left-4 top-6 h-8 w-8 items-center justify-center rounded-full border-2" style={{ borderColor: phase.color, background: phase.status === "active" ? phase.color : "transparent" }}>
                {roadmapIcon(phase.icon)}
              </div>
              <div className="sm:ml-16">
                <div className="rounded-xl border p-5" style={{ borderColor: `${phase.color}30`, background: "rgba(15,15,24,0.6)" }}>
                  {/* Phase header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${phase.color}15`, color: phase.color }}>
                        {roadmapIcon(phase.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.phase}: {phase.title}</span>
                        </div>
                        <span className="font-mono text-[9px] text-muted-foreground">{phase.duration}</span>
                      </div>
                    </div>
                    <span className="rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold" style={{ borderColor: `${phaseColor}40`, background: `${phaseColor}10`, color: phaseColor }}>
                      {phase.status}
                    </span>
                  </div>

                  <p className="mb-4 font-mono text-[9px] text-muted-foreground">{phase.subtitle}</p>

                  {/* Deliverables */}
                  <div className="mb-4">
                    <div className="font-mono text-[8px] uppercase tracking-wider mb-2" style={{ color: phase.color }}>Deliverables</div>
                    <div className="space-y-1.5">
                      {phase.deliverables.map((d) => (
                        <div key={d} className="flex items-center gap-2 rounded-md border border-white/[0.04] p-2" style={{ background: `${phase.color}05` }}>
                          <Target className="h-3 w-3 flex-none" style={{ color: phase.color }} />
                          <span className="font-mono text-[9px] text-foreground">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcomes */}
                  <div className="mb-3">
                    <div className="font-mono text-[8px] uppercase tracking-wider mb-2" style={{ color: "#10b981" }}>Expected Outcomes</div>
                    <div className="space-y-1.5">
                      {phase.outcomes.map((o) => (
                        <div key={o} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 flex-none" style={{ color: "#10b981" }} />
                          <span className="font-mono text-[9px] text-foreground">{o}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Partners */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {phase.partners.map((p) => (
                      <span key={p} className="rounded-md border border-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-muted-foreground" style={{ background: "rgba(15,15,24,0.4)" }}>{p}</span>
                    ))}
                  </div>

                  {/* Key Decision Callout */}
                  {phase.keyDecision && (
                    <motion.div
                      className="rounded-lg border-2 border-[#C9A84C]/40 p-4 mt-2"
                      style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(15,15,24,0.4))" }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Medal className="h-4 w-4" style={{ color: "#C9A84C" }} />
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>Key Decision</span>
                      </div>
                      <p className="font-mono text-[9px] text-foreground leading-relaxed">{phase.keyDecision}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progression Principle */}
      <motion.div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "rgba(15,15,24,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Progression Principle</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { phase: "Phase 1", principle: "Validate before you invest", desc: "Publish results, secure grants, prove the technology works under real conditions.", color: "#10b981" },
            { phase: "Phase 2", principle: "Optimize from evidence", desc: "Use validated data to optimize hardware, certify reliability, and formalize partnerships.", color: "#3B82F6" },
            { phase: "Phase 3", principle: "Decide from strength", desc: "Negotiate from a validated position — not from a concept. Equity decisions only after proof.", color: "#C9A84C" },
          ].map((item) => (
            <div key={item.phase} className="rounded-lg border p-4 text-center" style={{ borderColor: `${item.color}20`, background: `${item.color}05` }}>
              <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: item.color }}>{item.phase}</div>
              <div className="text-sm font-bold" style={{ color: item.color }}>{item.principle}</div>
              <p className="mt-2 font-mono text-[9px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// POWER & THERMAL TAB — Phase 2 Architecture
// ════════════════════════════════════════════════════════════════════════

function PowerThermalTab() {
  const [expandedRail, setExpandedRail] = useState<string | null>(null);

  const bomStatusColor = (s: string) => {
    switch (s) {
      case "specified": return "#F59E0B";
      case "sourced": return "#3B82F6";
      case "ordered": return "#8B5CF6";
      case "received": return "#10b981";
      default: return "#6B7280";
    }
  };

  const bomCategoryColor = (c: string) => {
    switch (c) {
      case "battery": return "#E67300";
      case "thermal": return "#EF4444";
      case "wiring": return "#3366CC";
      default: return "#6B7280";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        className="rounded-xl border border-[#C9A84C]/20 p-5"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(15,15,24,0.6))" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/30" style={{ background: "#C9A84C15" }}>
            <Zap className="h-6 w-6" style={{ color: "#C9A84C" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans)" }}>
              Phase 2: Power & Thermal Architecture
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              8S4P LiFePO₄ battery system, Star Ground wiring protocol, Epistemic thermal governance, and containment architecture for the HBK Mk-II.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#E67300]/30 bg-[#E67300]/10 px-3 py-1 font-mono text-[9px] text-[#E67300]">8S4P 25.6V</span>
              <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 font-mono text-[9px] text-[#10b981]">Star Ground P0–P3</span>
              <span className="rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1 font-mono text-[9px] text-[#EF4444]">4-Zone Thermal</span>
              <span className="rounded-full border border-[#3366CC]/30 bg-[#3366CC]/10 px-3 py-1 font-mono text-[9px] text-[#3366CC]">Aerogel Isolation</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 1. POWER ARCHITECTURE CARD ──────────────────────────────────── */}
      <Card className="border-white/[0.06] bg-[rgba(15,15,24,0.6)] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E67300]/30" style={{ background: "#E6730015" }}>
              <Battery className="h-5 w-5" style={{ color: "#E67300" }} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold" style={{ color: "#E67300" }}>Power Architecture</CardTitle>
              <CardDescription className="font-mono text-[9px]">8S4P LiFePO₄ Battery System · 614Wh Field Power</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Voltage", value: "25.6V", sub: "Nominal", color: "#E67300" },
              { label: "Capacity", value: "20Ah", sub: "8S4P Config", color: "#10b981" },
              { label: "Energy", value: "614Wh", sub: "Total Pack", color: "#3B82F6" },
              { label: "Cells", value: "32", sub: "IFR-32700", color: "#8B5CF6" },
              { label: "Weight", value: "~5.2kg", sub: "w/ Potting", color: "#C9A84C" },
            ].map(stat => (
              <motion.div
                key={stat.label}
                className="rounded-lg border p-3 text-center"
                style={{ borderColor: `${stat.color}20`, background: `${stat.color}05` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/60">{stat.label}</div>
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="font-mono text-[8px] text-muted-foreground/50">{stat.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Battery Spec Details */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Chemistry & Configuration */}
            <div className="rounded-lg border border-[#E67300]/20 p-4" style={{ background: "#E6730008" }}>
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="h-4 w-4" style={{ color: "#E67300" }} />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#E67300" }}>Cell Chemistry</span>
              </div>
              <div className="space-y-2">
                {[
                  ["Chemistry", BATTERY_SPEC.chemistry],
                  ["Format", BATTERY_SPEC.format],
                  ["Configuration", BATTERY_SPEC.configuration],
                  ["Cell Model", BATTERY_SPEC.cellModel],
                  ["BMS", BATTERY_SPEC.bms],
                  ["BMS Model", BATTERY_SPEC.bmsModel],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-muted-foreground">{k}</span>
                    <span className="font-mono text-[9px] text-foreground font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ruggedization & Shift */}
            <div className="space-y-3">
              <div className="rounded-lg border border-[#C9A84C]/20 p-4" style={{ background: "#C9A84C08" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" style={{ color: "#C9A84C" }} />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>Ruggedization</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-muted-foreground">Overhead</span>
                    <span className="font-mono text-[9px] text-foreground font-bold">{BATTERY_SPEC.ruggedizationOverhead}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-muted-foreground">Potting</span>
                    <span className="font-mono text-[9px] text-foreground font-bold">{BATTERY_SPEC.pottingMaterial}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#10b981]/20 p-4" style={{ background: "#10b98108" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" style={{ color: "#10b981" }} />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>Shift Duration</span>
                </div>
                <div className="text-sm font-bold" style={{ color: "#10b981" }}>{BATTERY_SPEC.shiftDuration}</div>
              </div>
            </div>
          </div>

          {/* Thermal Advantage Callout */}
          <motion.div
            className="rounded-lg border-2 border-[#10b981]/30 p-4"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(15,15,24,0.4))" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4" style={{ color: "#10b981" }} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>8S Thermal Advantage</span>
            </div>
            <p className="font-mono text-[9px] text-foreground leading-relaxed">{BATTERY_SPEC.thermalAdvantage}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[8px] text-muted-foreground/60">I²R Reduction vs 4S</span>
                  <span className="font-mono text-[9px] font-bold" style={{ color: "#10b981" }}>~75%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #10b981, #C9A84C)" }}
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* ── 2. STAR GROUND WIRING PROTOCOL CARD ─────────────────────────── */}
      <Card className="border-white/[0.06] bg-[rgba(15,15,24,0.6)] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3366CC]/30" style={{ background: "#3366CC15" }}>
              <Plug className="h-5 w-5" style={{ color: "#3366CC" }} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold" style={{ color: "#3366CC" }}>Star Ground Wiring Protocol</CardTitle>
              <CardDescription className="font-mono text-[9px]">P0–P3 Isolated Rails · Physically Separated Signal Integrity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wiring Rails Schematic */}
          <div className="space-y-2">
            {WIRING_RAILS.map((rail, idx) => {
              const isExpanded = expandedRail === rail.id;
              return (
                <motion.div
                  key={rail.id}
                  className="rounded-lg border cursor-pointer transition-all"
                  style={{ borderColor: `${rail.color}30`, background: `${rail.color}05` }}
                  onClick={() => setExpandedRail(isExpanded ? null : rail.id)}
                  whileHover={{ borderColor: `${rail.color}60` }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  {/* Rail Header */}
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Color-coded rail indicator */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: `${rail.color}50`, background: `${rail.color}15` }}>
                        <span className="font-mono text-[9px] font-black" style={{ color: rail.color }}>{rail.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: rail.color }}>{rail.name}</span>
                          <span className="rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${rail.color}40`, background: `${rail.color}10`, color: rail.color }}>
                            {rail.isolationClass}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-mono text-[9px] text-muted-foreground">{rail.gauge}</span>
                          <span className="font-mono text-[9px] text-muted-foreground/50">·</span>
                          <span className="font-mono text-[9px] text-muted-foreground">{rail.voltage.split(" (")[0]}</span>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>

                    {/* Visual rail line */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: rail.color }} />
                      <div className="h-1 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${rail.color}, ${rail.color}40)` }} />
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: rail.color }} />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t px-3 py-3 space-y-2" style={{ borderColor: `${rail.color}20` }}>
                          <div className="rounded-md border border-white/[0.04] p-2.5" style={{ background: "rgba(10,10,18,0.5)" }}>
                            <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-1">Purpose</div>
                            <p className="font-mono text-[9px] text-foreground">{rail.purpose}</p>
                          </div>
                          <div className="rounded-md border border-white/[0.04] p-2.5" style={{ background: "rgba(10,10,18,0.5)" }}>
                            <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-1">Route</div>
                            <p className="font-mono text-[9px] text-foreground">{rail.route}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-white/[0.04] p-2" style={{ background: "rgba(10,10,18,0.5)" }}>
                              <div className="font-mono text-[8px] text-muted-foreground/50">Gauge</div>
                              <div className="font-mono text-[9px] text-foreground font-bold">{rail.gauge}</div>
                            </div>
                            <div className="rounded-md border border-white/[0.04] p-2" style={{ background: "rgba(10,10,18,0.5)" }}>
                              <div className="font-mono text-[8px] text-muted-foreground/50">Isolation</div>
                              <div className="font-mono text-[9px] font-bold" style={{ color: rail.color }}>{rail.isolationClass}</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Key Principle */}
          <motion.div
            className="rounded-lg border-2 border-[#3366CC]/30 p-4"
            style={{ background: "linear-gradient(135deg, rgba(51,102,204,0.08), rgba(15,15,24,0.4))" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" style={{ color: "#3366CC" }} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#3366CC" }}>Signal Integrity Principle</span>
            </div>
            <p className="font-mono text-[9px] text-foreground leading-relaxed">
              Physically separated signal integrity — P3 (Signal Rail) never crosses P0 (Main Power Rail). 
              Star ground topology ensures BMS switching noise never contaminates analog sensor data paths.
            </p>
            {/* Schematic representation */}
            <div className="mt-3 grid grid-cols-4 gap-1">
              {WIRING_RAILS.map(r => (
                <div key={r.id} className="flex items-center justify-center gap-1 rounded-md border py-1.5" style={{ borderColor: `${r.color}30`, background: `${r.color}08` }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} />
                  <span className="font-mono text-[8px] font-bold" style={{ color: r.color }}>{r.id}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* ── 3. EPISTEMIC THERMAL GOVERNANCE CARD ─────────────────────────── */}
      <Card className="border-white/[0.06] bg-[rgba(15,15,24,0.6)] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#EF4444]/30" style={{ background: "#EF444415" }}>
              <Thermometer className="h-5 w-5" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold" style={{ color: "#EF4444" }}>Epistemic Thermal Governance</CardTitle>
              <CardDescription className="font-mono text-[9px]">Deterministic Response · Append-Only Evidence · Rule 4 + Rule 7</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Thermal Gauge — Visual Temperature Bar */}
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "rgba(10,10,18,0.5)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Thermal Threshold Gauge</span>
              <span className="font-mono text-[9px] text-muted-foreground/50">20°C → 85°C</span>
            </div>
            {/* Gradient bar */}
            <div className="relative h-8 w-full rounded-lg overflow-hidden" style={{ background: "linear-gradient(90deg, #10b981 0%, #10b981 53%, #F59E0B 53%, #F59E0B 61%, #EF4444 61%, #EF4444 69%, #DC2626 69%, #DC2626 100%)" }}>
              {/* Temperature markers */}
              {THERMAL_THRESHOLDS.map(t => (
                <div
                  key={t.level}
                  className="absolute top-0 h-full flex flex-col items-center justify-center"
                  style={{ left: `${((t.tempC - 20) / 65) * 100}%` }}
                >
                  <div className="h-full w-px bg-white/30" />
                </div>
              ))}
              {/* Labels */}
              <div className="absolute inset-0 flex items-center">
                {THERMAL_THRESHOLDS.map(t => (
                  <div
                    key={t.level}
                    className="flex-1 text-center"
                  >
                    <span className="font-mono text-[8px] font-bold text-white drop-shadow-md">{t.tempC}°C</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Level labels below bar */}
            <div className="mt-2 flex">
              {THERMAL_THRESHOLDS.map(t => (
                <div key={t.level} className="flex-1 text-center">
                  <span className="font-mono text-[8px] font-bold" style={{ color: t.color }}>{t.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Threshold Detail Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {THERMAL_THRESHOLDS.map((threshold, idx) => {
              const thresholdIcon = (() => {
                switch (threshold.icon) {
                  case "CheckCircle2": return <CheckCircle2 className="h-4 w-4" />;
                  case "AlertTriangle": return <AlertTriangle className="h-4 w-4" />;
                  case "XCircle": return <XCircle className="h-4 w-4" />;
                  case "ShieldAlert": return <ShieldAlert className="h-4 w-4" />;
                  default: return <Thermometer className="h-4 w-4" />;
                }
              })();

              return (
                <motion.div
                  key={threshold.level}
                  className="rounded-lg border p-4"
                  style={{ borderColor: `${threshold.color}30`, background: `${threshold.color}05` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${threshold.color}15`, color: threshold.color }}>
                        {thresholdIcon}
                      </div>
                      <div>
                        <span className="text-xs font-bold" style={{ color: threshold.color }}>{threshold.level}</span>
                        <div className="font-mono text-[9px] text-muted-foreground">&lt;{threshold.tempC}°C</div>
                      </div>
                    </div>
                    <div className="h-3 w-3 rounded-full" style={{ background: threshold.color, boxShadow: `0 0 8px ${threshold.color}60` }} />
                  </div>

                  {/* Action */}
                  <div className="rounded-md border border-white/[0.04] p-2.5 mb-2" style={{ background: "rgba(10,10,18,0.5)" }}>
                    <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-1">Action</div>
                    <p className="font-mono text-[9px] text-foreground leading-relaxed">{threshold.action}</p>
                  </div>

                  {/* Runtime Log */}
                  <div className="rounded-md border border-white/[0.04] p-2.5 mb-2" style={{ background: "rgba(10,10,18,0.5)" }}>
                    <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-1">Runtime Log</div>
                    <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">{threshold.runtimeLog}</p>
                  </div>

                  {/* ER Rule */}
                  <div className="rounded-md border p-2.5" style={{ borderColor: `${threshold.color}20`, background: `${threshold.color}05` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Scale className="h-3 w-3" style={{ color: threshold.color }} />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider" style={{ color: threshold.color }}>ER Rule</span>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">{threshold.erRule}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Wake-on-Acoustic Callout */}
          <motion.div
            className="rounded-lg border-2 border-[#EF4444]/30 p-4"
            style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,15,24,0.4))" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CircuitBoard className="h-4 w-4" style={{ color: "#EF4444" }} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#EF4444" }}>Wake-on-Acoustic — Deterministic Hardware Interrupt</span>
            </div>
            <p className="font-mono text-[9px] text-foreground leading-relaxed">
              At 75°C (CRITICAL), the APU enters low-power state. The analog sensor interface acts as a deterministic hardware interrupt — 
              if acoustic energy exceeds threshold, the system wakes for a single inference cycle, logs the result as immutable Fact, 
              and returns to sleep. Engineers have mathematically reproducible proof of why the system was offline.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 px-2 py-0.5 font-mono text-[8px]" style={{ color: "#EF4444" }}>Rule 4: No Non-Determinism</span>
              <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-2 py-0.5 font-mono text-[8px]" style={{ color: "#C9A84C" }}>Rule 7: Append-Only Evidence</span>
              <span className="rounded-full border border-[#3366CC]/30 bg-[#3366CC]/10 px-2 py-0.5 font-mono text-[8px]" style={{ color: "#3366CC" }}>SHA-256 Canonical</span>
              <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 font-mono text-[8px]" style={{ color: "#10b981" }}>WORM Storage</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* ── 4. THERMAL CONTAINMENT ARCHITECTURE CARD ─────────────────────── */}
      <Card className="border-white/[0.06] bg-[rgba(15,15,24,0.6)] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A84C]/30" style={{ background: "#C9A84C15" }}>
              <Layers className="h-5 w-5" style={{ color: "#C9A84C" }} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold" style={{ color: "#C9A84C" }}>Thermal Containment Architecture</CardTitle>
              <CardDescription className="font-mono text-[9px]">4-Layer Thermal Path · Aerogel Isolation · Passive Conduction</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Thermal Path Visualization */}
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "rgba(10,10,18,0.5)" }}>
            <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-3">Thermal Conduction Path</div>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[
                { label: "Ryzen Die", color: "#EF4444", sub: "Heat Source" },
                { label: "TIM PCM", color: "#F59E0B", sub: "5-7 W/m·K" },
                { label: "Cu Block", color: "#CC9900", sub: "Heat Spreader" },
                { label: "Mainboard", color: "#C0C0C0", sub: "6061-T6" },
                { label: "Gap Pads", color: "#F59E0B", sub: "3-5 W/m·K" },
                { label: "Enclosure", color: "#10b981", sub: "IP67 Shell" },
                { label: "Ambient", color: "#3B82F6", sub: "Eastern Cape" },
              ].map((step, idx, arr) => (
                <div key={step.label} className="flex items-center shrink-0">
                  <div className="rounded-md border px-3 py-2 text-center" style={{ borderColor: `${step.color}30`, background: `${step.color}08`, minWidth: 80 }}>
                    <div className="font-mono text-[8px] font-bold" style={{ color: step.color }}>{step.label}</div>
                    <div className="font-mono text-[7px] text-muted-foreground/50">{step.sub}</div>
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 mx-1 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Containment Layers */}
          <div className="space-y-3">
            {THERMAL_CONTAINMENT.map((layer, idx) => (
              <motion.div
                key={layer.id}
                className="rounded-lg border p-4"
                style={{ borderColor: `${layer.color}30`, background: `${layer.color}05` }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: `${layer.color}40`, background: `${layer.color}15`, color: layer.color }}>
                    <span className="font-mono text-[9px] font-bold">{layer.id.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: layer.color }}>{layer.name}</span>
                      <span className="rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${layer.color}40`, background: `${layer.color}10`, color: layer.color }}>
                        {layer.conductivity}
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground leading-relaxed">{layer.purpose}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[8px] text-muted-foreground/50">From:</span>
                        <span className="font-mono text-[9px] text-foreground">{layer.fromComponent}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[8px] text-muted-foreground/50">To:</span>
                        <span className="font-mono text-[9px] text-foreground">{layer.toComponent}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Aerogel Isolation Highlight */}
          <motion.div
            className="rounded-lg border-2 border-[#3366CC]/30 p-4"
            style={{ background: "linear-gradient(135deg, rgba(51,102,204,0.08), rgba(15,15,24,0.4))" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4" style={{ color: "#3366CC" }} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#3366CC" }}>Aerogel Thermal Barrier — AMD Zone / Battery Zone Isolation</span>
            </div>
            <p className="font-mono text-[9px] text-foreground leading-relaxed">
              Pyrogel XTE Aerogel (0.015 W/m·K) shields the LiFePO₄ battery pack from AMD Ryzen APU radiant heat.
              This ultra-low conductivity barrier reclaims ~10mm of internal volume while maintaining thermal isolation
              between the compute zone and battery zone.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1.5 text-center">
                <div className="font-mono text-[8px] text-[#EF4444]">AMD Zone</div>
                <div className="font-mono text-[9px] font-bold text-[#EF4444]">~58°C</div>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                <div className="h-1 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, #EF4444, #3366CC, #10b981)" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
              </div>
              <div className="rounded-md border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1.5 text-center">
                <div className="font-mono text-[8px] text-[#10b981]">Battery Zone</div>
                <div className="font-mono text-[9px] font-bold text-[#10b981]">~28°C</div>
              </div>
              <div className="rounded-md border border-[#3366CC]/30 bg-[#3366CC]/10 px-3 py-1.5 text-center">
                <div className="font-mono text-[8px] text-[#3366CC]">Aerogel</div>
                <div className="font-mono text-[9px] font-bold text-[#3366CC]">0.015 W/m·K</div>
              </div>
            </div>
          </motion.div>

          {/* BOM Summary */}
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "rgba(10,10,18,0.5)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" style={{ color: "#C9A84C" }} />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>Phase 2 BOM — {PHASE2_BOM.length} Items</span>
              </div>
              <div className="flex items-center gap-2">
                {["battery", "thermal", "wiring"].map(cat => {
                  const count = PHASE2_BOM.filter(b => b.category === cat).length;
                  return (
                    <span key={cat} className="rounded-full border px-2 py-0.5 font-mono text-[8px]" style={{ borderColor: `${bomCategoryColor(cat)}30`, background: `${bomCategoryColor(cat)}10`, color: bomCategoryColor(cat) }}>
                      {cat}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {PHASE2_BOM.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border border-white/[0.04] p-2.5"
                  style={{ background: `${bomCategoryColor(item.category)}03` }}
                >
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: bomStatusColor(item.status) }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-foreground font-bold truncate">{item.component}</span>
                      <span className="rounded-full border px-1.5 py-0.5 font-mono text-[7px] shrink-0" style={{ borderColor: `${bomCategoryColor(item.category)}30`, background: `${bomCategoryColor(item.category)}10`, color: bomCategoryColor(item.category) }}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[8px] text-muted-foreground/60 truncate">{item.specification}</span>
                      <span className="font-mono text-[8px] text-muted-foreground/40">·</span>
                      <span className="font-mono text-[8px] text-muted-foreground/60 shrink-0">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="rounded-full border px-2 py-0.5 font-mono text-[8px] shrink-0" style={{ borderColor: `${bomStatusColor(item.status)}30`, background: `${bomStatusColor(item.status)}10`, color: bomStatusColor(item.status) }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAAS TAB — Terminal-as-a-Service Commercial Framework
// ════════════════════════════════════════════════════════════════════════

function TaasTab() {
  const [taasSection, setTaasSection] = useState<string>("overview");

  const taasSections = [
    { id: "overview", label: "Overview", icon: <Briefcase className="h-3.5 w-3.5" /> },
    { id: "hydro-gateway", label: "Hydro-Gateway", icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: "revenue", label: "Revenue Split", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: "verification", label: "VR1–VR5 Gates", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { id: "sla", label: "SLA Metrics", icon: <Target className="h-3.5 w-3.5" /> },
    { id: "financing", label: "Financing", icon: <Wallet className="h-3.5 w-3.5" /> },
    { id: "zero-fab", label: "Zero Fab", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { id: "triparty", label: "Three Keys", icon: <Key className="h-3.5 w-3.5" /> },
    { id: "recovery", label: "Asset Recovery", icon: <FileWarning className="h-3.5 w-3.5" /> },
    { id: "cad-images", label: "CAD Renders", icon: <Eye className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-1.5">
        {taasSections.map(s => (
          <button
            key={s.id}
            onClick={() => setTaasSection(s.id)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[9px] transition-all ${
              taasSection === s.id
                ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]"
                : "border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {taasSection === "overview" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Core Pillars */}
          <div className="grid gap-3 sm:grid-cols-3">
            {TAAS_CORE_PILLARS.map(pillar => (
              <div key={pillar.id} className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${pillar.color}20`, border: `1px solid ${pillar.color}40` }}>
                    {pillar.icon === "Shield" ? <Shield className="h-4 w-4" style={{ color: pillar.color }} /> :
                     pillar.icon === "Lock" ? <Lock className="h-4 w-4" style={{ color: pillar.color }} /> :
                     <Key className="h-4 w-4" style={{ color: pillar.color }} />}
                  </div>
                  <span className="font-mono text-[10px] font-bold" style={{ color: pillar.color }}>{pillar.pillar}</span>
                </div>
                <p className="font-mono text-[9px] leading-relaxed text-muted-foreground">{pillar.description}</p>
              </div>
            ))}
          </div>

          {/* Value Proposition */}
          <div className="rounded-xl border border-[#C9A84C]/20 p-4" style={{ background: "rgba(201,168,76,0.05)" }}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4" style={{ color: "#C9A84C" }} />
              <span className="font-mono text-[10px] font-bold text-[#C9A84C]">TaaS Value Proposition</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 mt-0.5 text-[#10b981]" />
                  <div>
                    <p className="font-mono text-[9px] font-bold text-foreground">CapEx → OpEx Pivot</p>
                    <p className="font-mono text-[9px] text-muted-foreground">Municipalities subscribe to outcomes, not equipment. No capital expenditure for hardware procurement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-[#3B82F6]" />
                  <div>
                    <p className="font-mono text-[9px] font-bold text-foreground">Balance Sheet De-Risking</p>
                    <p className="font-mono text-[9px] text-muted-foreground">Terminal hardware remains VVU property. No asset depreciation or maintenance liability on municipal books.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-[#C9A84C]" />
                  <div>
                    <p className="font-mono text-[9px] font-bold text-foreground">100% Equity Retention</p>
                    <p className="font-mono text-[9px] text-muted-foreground">VVU retains all technology, IP, and data. Partnerships through contracts, not ownership dilution.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 mt-0.5 text-[#8B5CF6]" />
                  <div>
                    <p className="font-mono text-[9px] font-bold text-foreground">Sole Data Sovereignty</p>
                    <p className="font-mono text-[9px] text-muted-foreground">All data collected by VVU Terminals belongs to VVU. Municipal partners receive operational reports, never raw data.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Rights */}
          <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4" style={{ color: "#3B82F6" }} />
              <span className="font-mono text-[10px] font-bold text-[#3B82F6]">InfrastructureRight Abstraction</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {INFRASTRUCTURE_RIGHTS.map(ir => (
                <div key={ir.id} className="rounded-lg border border-white/[0.06] p-3" style={{ background: `${ir.color}08`, borderColor: `${ir.color}30` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {ir.icon === "Droplets" ? <Droplets className="h-3.5 w-3.5" style={{ color: ir.color }} /> :
                     ir.icon === "Zap" ? <Zap className="h-3.5 w-3.5" style={{ color: ir.color }} /> :
                     ir.icon === "Cpu" ? <Cpu className="h-3.5 w-3.5" style={{ color: ir.color }} /> :
                     <HardDrive className="h-3.5 w-3.5" style={{ color: ir.color }} />}
                    <span className="font-mono text-[9px] font-bold" style={{ color: ir.color }}>{ir.right}</span>
                  </div>
                  <p className="font-mono text-[8px] leading-relaxed text-muted-foreground">{ir.description}</p>
                  <p className="font-mono text-[8px] mt-1" style={{ color: ir.color }}>{ir.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hydro-Gateway Assembly Section */}
      {taasSection === "hydro-gateway" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">Hydro-Gateway Assembly — 11 Integrated HBK Mk-II Components</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HYDRO_GATEWAY_ASSEMBLY.map(comp => (
              <div key={comp.id} className="rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(15,15,24,0.6)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] font-bold text-foreground">{comp.name}</span>
                  <span className="rounded-full border px-1.5 py-0.5 font-mono text-[7px]" style={{
                    borderColor: comp.category === "structural" ? "#6B728040" : comp.category === "metering" ? "#3B82F640" : comp.category === "control" ? "#10b98140" : comp.category === "power" ? "#F59E0B40" : comp.category === "telemetry" ? "#8B5CF640" : "#C9A84C40",
                    color: comp.category === "structural" ? "#6B7280" : comp.category === "metering" ? "#3B82F6" : comp.category === "control" ? "#10b981" : comp.category === "power" ? "#F59E0B" : comp.category === "telemetry" ? "#8B5CF6" : "#C9A84C",
                  }}>
                    {comp.category}
                  </span>
                </div>
                <p className="font-mono text-[8px] text-muted-foreground mb-2">{comp.function}</p>
                <div className="flex items-center gap-3 font-mono text-[8px]">
                  <span className="text-muted-foreground">X: <span className="text-foreground">{comp.position.x}</span></span>
                  <span className="text-muted-foreground">Y: <span className="text-foreground">{comp.position.y}</span></span>
                  <span className="text-muted-foreground">Z: <span className="text-foreground">{comp.position.z}</span></span>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: comp.status === "specification" ? "#F59E0B" : comp.status === "sourced" ? "#3B82F6" : comp.status === "installed" ? "#10b981" : "#6B7280" }} />
                  <span className="font-mono text-[7px] text-muted-foreground">{comp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Revenue Split Section */}
      {taasSection === "revenue" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">60 / 30 / 10 Revenue Split</span>
          </div>
          <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="flex h-10 w-full overflow-hidden rounded-lg">
              {TAAS_REVENUE_SPLIT.map(rs => (
                <div key={rs.category} className="flex items-center justify-center font-mono text-[9px] font-bold text-white" style={{ width: `${rs.percentage}%`, background: rs.color }}>
                  {rs.percentage}%
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {TAAS_REVENUE_SPLIT.map(rs => (
                <div key={rs.category} className="rounded-lg border p-3" style={{ borderColor: `${rs.color}30`, background: `${rs.color}08` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-3 w-3 rounded-sm" style={{ background: rs.color }} />
                    <span className="font-mono text-[9px] font-bold" style={{ color: rs.color }}>{rs.category}</span>
                    <span className="font-mono text-[9px] font-bold text-foreground">{rs.percentage}%</span>
                  </div>
                  <p className="font-mono text-[8px] text-muted-foreground">{rs.allocation}</p>
                  <p className="font-mono text-[8px] mt-1 text-muted-foreground/70">{rs.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Verification Gates Section */}
      {taasSection === "verification" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">VR1–VR5 Verification Gates</span>
          </div>
          <div className="space-y-2">
            {VERIFICATION_GATES.map((gate, idx) => (
              <div key={gate.id} className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[9px] font-bold" style={{
                    background: gate.status === "locked" ? "#F59E0B10" : gate.status === "passed" ? "#10b98110" : "#3B82F610",
                    borderColor: gate.status === "locked" ? "#F59E0B40" : gate.status === "passed" ? "#10b98140" : "#3B82F640",
                    color: gate.status === "locked" ? "#F59E0B" : gate.status === "passed" ? "#10b981" : "#3B82F6",
                  }}>
                    {gate.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-foreground">{gate.name}</span>
                      <span className="rounded-full border px-1.5 py-0.5 font-mono text-[7px]" style={{
                        borderColor: gate.status === "locked" ? "#F59E0B40" : gate.status === "passed" ? "#10b98140" : "#3B82F640",
                        color: gate.status === "locked" ? "#F59E0B" : gate.status === "passed" ? "#10b981" : "#3B82F6",
                      }}>
                        {gate.status}
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground mb-1">{gate.description}</p>
                    <div className="grid gap-1 sm:grid-cols-2">
                      <div className="font-mono text-[8px]">
                        <span className="text-muted-foreground">Method: </span>
                        <span className="text-foreground">{gate.method}</span>
                      </div>
                      <div className="font-mono text-[8px]">
                        <span className="text-muted-foreground">Criteria: </span>
                        <span className="text-foreground">{gate.criteria}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[8px] mt-1">
                      <span className="text-muted-foreground">Authority: </span>
                      <span className="text-[#C9A84C]">{gate.authority}</span>
                    </div>
                  </div>
                  {idx < VERIFICATION_GATES.length - 1 && (
                    <div className="hidden sm:flex items-center">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SLA Metrics Section */}
      {taasSection === "sla" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">TaaS SLA Metrics</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {TAAS_SLA_METRICS.map(metric => (
              <div key={metric.id} className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
                <div className="mb-3">
                  <span className="font-mono text-[10px] font-bold text-foreground">{metric.name}</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg border border-[#C9A84C]/20 p-2" style={{ background: "#C9A84C08" }}>
                    <span className="font-mono text-[8px] text-muted-foreground">Target</span>
                    <p className="font-mono text-[9px] font-bold text-[#C9A84C]">{metric.target}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-mono text-[8px] text-muted-foreground">Baseline</span>
                      <p className="font-mono text-[9px] text-foreground">{metric.baseline}</p>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-muted-foreground">Improvement</span>
                      <p className="font-mono text-[9px] font-bold text-[#10b981]">{metric.improvement}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-[8px] text-muted-foreground">Method</span>
                    <p className="font-mono text-[8px] text-foreground/80">{metric.method}</p>
                  </div>
                </div>
                <p className="font-mono text-[8px] mt-2 leading-relaxed text-muted-foreground/70">{metric.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Financing Section */}
      {taasSection === "financing" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">Vendor Financing — Tranche Structure</span>
          </div>
          <div className="rounded-xl border border-[#C9A84C]/20 p-4" style={{ background: "rgba(201,168,76,0.05)" }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#C9A84C]">Tranche 1 Budget Lock</span>
                <p className="font-mono text-[9px] text-muted-foreground">R812,490 — Conditioned on VR1–VR3 passage and SRS 32-parameter baseline verification</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-[#C9A84C]">R812,490</span>
                <p className="font-mono text-[8px] text-muted-foreground">Tranche 1 Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Item</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Amount</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Tranche</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Condition</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TAAS_FINANCING.map(fin => (
                    <tr key={fin.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="p-2 font-mono text-[9px] text-foreground">{fin.item}</td>
                      <td className="p-2 font-mono text-[9px] font-bold text-[#C9A84C]">{fin.amount}</td>
                      <td className="p-2 font-mono text-[9px] text-muted-foreground">{fin.tranche}</td>
                      <td className="p-2 font-mono text-[8px] text-muted-foreground">{fin.condition}</td>
                      <td className="p-2">
                        <span className="rounded-full border px-1.5 py-0.5 font-mono text-[7px]" style={{
                          borderColor: fin.status === "locked" ? "#F59E0B40" : fin.status === "released" ? "#10b98140" : "#6B728040",
                          color: fin.status === "locked" ? "#F59E0B" : fin.status === "released" ? "#10b981" : "#6B7280",
                        }}>
                          {fin.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Zero Fabrication Mandate Section */}
      {taasSection === "zero-fab" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4" style={{ color: "#EF4444" }} />
            <span className="font-mono text-[10px] font-bold text-[#EF4444]">Zero Fabrication Mandate — 32 SRS Parameters</span>
          </div>
          <div className="rounded-xl border border-[#EF4444]/20 p-3" style={{ background: "rgba(239,68,68,0.05)" }}>
            <p className="font-mono text-[9px] text-muted-foreground">No manufacturing begins until all 32 SRS parameters are empirically verified. Each parameter is locked to a specific VR verification gate.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {["Geometry", "Material", "Assembly", "Functional", "Field"].map(cat => {
              const params = ZERO_FAB_PARAMETERS.filter(p => p.category === cat);
              return (
                <div key={cat} className="rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(15,15,24,0.6)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] font-bold text-foreground">{cat}</span>
                    <span className="font-mono text-[9px] font-bold text-[#C9A84C]">{params.length}</span>
                  </div>
                  <div className="space-y-1">
                    {params.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: p.verified ? "#10b981" : "#EF4444" }} />
                        <span className="font-mono text-[7px] text-muted-foreground truncate">{p.parameter}</span>
                        <span className="font-mono text-[7px] text-muted-foreground/50 ml-auto">{p.verificationGate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">#</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Parameter</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Category</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Target</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Gate</th>
                    <th className="p-2 text-left font-mono text-[8px] text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ZERO_FAB_PARAMETERS.map(p => (
                    <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="p-2 font-mono text-[8px] text-muted-foreground">{p.id.replace("zfp-", "")}</td>
                      <td className="p-2 font-mono text-[9px] text-foreground">{p.parameter}</td>
                      <td className="p-2 font-mono text-[8px] text-muted-foreground">{p.category}</td>
                      <td className="p-2 font-mono text-[9px] text-foreground">{p.target}</td>
                      <td className="p-2 font-mono text-[9px] font-bold text-[#C9A84C]">{p.verificationGate}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ background: p.verified ? "#10b981" : "#EF4444" }} />
                          <span className="font-mono text-[7px]" style={{ color: p.verified ? "#10b981" : "#EF4444" }}>{p.verified ? "VERIFIED" : "PENDING"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Triparty Keys Section */}
      {taasSection === "triparty" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">Triparty SRS Delegation Addendum — &quot;Three Keys&quot;</span>
          </div>
          <div className="rounded-xl border border-[#C9A84C]/20 p-3" style={{ background: "rgba(201,168,76,0.05)" }}>
            <p className="font-mono text-[9px] text-muted-foreground">No SRS modification or Terminal commissioning can proceed without all three keys. This is a cryptographic, not procedural, requirement.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {TRIPARTY_KEYS.map(tk => (
              <div key={tk.id} className="rounded-xl border p-4" style={{ background: "rgba(15,15,24,0.6)", borderColor: `${tk.color}30` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border" style={{ background: `${tk.color}15`, borderColor: `${tk.color}40` }}>
                    <Key className="h-5 w-5" style={{ color: tk.color }} />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold" style={{ color: tk.color }}>{tk.party}</span>
                    <p className="font-mono text-[8px] text-muted-foreground">{tk.role}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.06] p-2 mb-2" style={{ background: `${tk.color}08` }}>
                  <span className="font-mono text-[8px] text-muted-foreground">Key Type</span>
                  <p className="font-mono text-[9px] font-bold" style={{ color: tk.color }}>{tk.keyType}</p>
                </div>
                <p className="font-mono text-[8px] leading-relaxed text-muted-foreground">{tk.description}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
            <div className="flex items-center justify-center gap-2 py-4">
              {TRIPARTY_KEYS.map((tk, idx) => (
                <div key={tk.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center border" style={{ background: `${tk.color}15`, borderColor: `${tk.color}40` }}>
                      <Key className="h-4 w-4" style={{ color: tk.color }} />
                    </div>
                    <span className="font-mono text-[8px] font-bold" style={{ color: tk.color }}>{tk.party}</span>
                  </div>
                  {idx < TRIPARTY_KEYS.length - 1 && (
                    <div className="flex items-center gap-1 px-2">
                      <div className="h-px w-6" style={{ background: "#C9A84C40" }} />
                      <span className="font-mono text-[7px] text-[#C9A84C]">+</span>
                      <div className="h-px w-6" style={{ background: "#C9A84C40" }} />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-1 px-2">
                <div className="h-px w-6" style={{ background: "#C9A84C40" }} />
                <span className="font-mono text-[7px] text-[#C9A84C]">&rarr;</span>
                <div className="h-px w-6" style={{ background: "#C9A84C40" }} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-[#C9A84C]/40" style={{ background: "#C9A84C15" }}>
                  <ShieldCheck className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <span className="font-mono text-[8px] font-bold text-[#C9A84C]">SRS Unlock</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Asset Recovery Section */}
      {taasSection === "recovery" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileWarning className="h-4 w-4" style={{ color: "#EF4444" }} />
            <span className="font-mono text-[10px] font-bold text-[#EF4444]">Default &amp; Asset Recovery Provisions</span>
          </div>
          <div className="space-y-2">
            {ASSET_RECOVERY_PROVISIONS.map(arp => (
              <div key={arp.id} className="rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(15,15,24,0.6)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] font-bold text-foreground">{arp.provision}</span>
                  <span className="rounded-full border px-1.5 py-0.5 font-mono text-[7px]" style={{ borderColor: "#C9A84C40", color: "#C9A84C" }}>
                    {arp.party}
                  </span>
                </div>
                <div className="grid gap-1 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-[8px] text-muted-foreground">Trigger: </span>
                    <span className="font-mono text-[8px] text-foreground">{arp.trigger}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[8px] text-muted-foreground">Action: </span>
                    <span className="font-mono text-[8px] text-foreground">{arp.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CAD Renders Section */}
      {taasSection === "cad-images" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4" style={{ color: "#C9A84C" }} />
            <span className="font-mono text-[10px] font-bold text-[#C9A84C]">HBK Mk-II CAD Technical Renders</span>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
              <div className="p-3 border-b border-white/[0.06]">
                <span className="font-mono text-[9px] font-bold text-foreground">Isometric Blueprint — Engineering Layout</span>
                <p className="font-mono text-[8px] text-muted-foreground">Power Management Unit (bottom-left) + Analog Sensor Interface PCB (top-left) with 15.0mm EMI/RFI isolation gap</p>
              </div>
              <div className="p-2">
                <img src="/hbk/images/hbk-blueprint-isometric.png" alt="HBK Mk-II Isometric Blueprint" className="w-full rounded-lg" />
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
              <div className="p-3 border-b border-white/[0.06]">
                <span className="font-mono text-[9px] font-bold text-foreground">Vector Line Art Schematic — Hydro-Bayesian Assembly</span>
                <p className="font-mono text-[8px] text-muted-foreground">PMU at X:20 Y:20, Sensor PCB at X:20 Y:180, 15mm EMI/RFI Clear Air Zone</p>
              </div>
              <div className="p-2">
                <img src="/hbk/images/hbk-schematic-lineart.png" alt="HBK Mk-II Line Art Schematic" className="w-full rounded-lg" />
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,24,0.6)" }}>
              <div className="p-3 border-b border-white/[0.06]">
                <span className="font-mono text-[9px] font-bold text-foreground">Top-Down Product Rendering — 500x400mm Electronics Tray</span>
                <p className="font-mono text-[8px] text-muted-foreground">3.0mm CNC 6061-T6 aluminum tray, Power BMS (potted, copper coils) + 4-Channel Acoustic Sensor PCB (gold traces), 15mm gap</p>
              </div>
              <div className="p-2">
                <img src="/hbk/images/hbk-topdown-photoreal.png" alt="HBK Mk-II Top-Down Rendering" className="w-full rounded-lg" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DIGITAL TWIN TAB — 3D CAD Layout + Module Status + Ownership
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
              <line x1={20 * scale} y1={180 * scale} x2={160 * scale} y2={120 * scale} stroke="#C9A84C" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
              <text x={80 * scale} y={155 * scale} fill="#C9A84C" fontSize={7} opacity={0.5} fontFamily="monospace">isolation zone</text>
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

      {/* RIGHT: Ownership + Selected Module Details */}
      <div className="space-y-4">
        {/* VVU Ownership Badge */}
        <div className="rounded-xl border border-[#C9A84C]/20 p-4" style={{ background: "rgba(15,15,24,0.6)" }}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Ownership</h3>
          {OWNERSHIP_STRUCTURE.map((entry) => (
            <div key={entry.holder}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" style={{ color: entry.color }} />
                  <span className="font-mono text-[10px] font-bold" style={{ color: entry.color }}>{entry.holder}</span>
                </div>
                <span className="font-mono text-[10px] text-foreground">{entry.pct}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: entry.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${entry.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="mt-0.5 font-mono text-[8px] text-muted-foreground/60">{entry.description}</p>
            </div>
          ))}
          <div className="mt-3 rounded-lg border border-[#C9A84C]/20 p-2 text-center" style={{ background: "#C9A84C08" }}>
            <span className="font-mono text-[9px] font-bold" style={{ color: "#C9A84C" }}>VVU 100% — Clean Capitalisation Table</span>
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
              {[
                ["Status", selected.status, statusColor(selected.status)],
                ["Dimensions", `${selected.length}×${selected.width}×${selected.height} mm`, undefined],
                ["Position (X,Y,Z)", `(${selected.position.x}, ${selected.position.y}, ${selected.position.z})`, undefined],
                ["Temperature", `${selected.tempC}°C`, undefined],
                ["Load", `${selected.loadPct}%`, undefined],
                ["FreeCAD Name", selected.name, undefined],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-muted-foreground">{label as string}</span>
                  <span className="font-mono text-[9px]" style={{ color: color as string || "var(--tw-prose-body)", fontWeight: color ? "bold" : "normal" }}>{value as string}</span>
                </div>
              ))}
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

          {PROGRAMME_TIMELINE.map((phase) => (
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
            { label: "Consortium Formation", target: "4+ partners signed", metric: "Agreement status", color: "#C9A84C" },
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
            className={`rounded-full border px-3 py-1 font-mono text-[9px] transition-all ${actionFilter === f ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"}`}
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
