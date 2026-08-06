"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Play, Pause, Square, RotateCcw, Gauge, GitBranch, Droplets,
  Activity, Shield, Clock, AlertTriangle, CheckCircle2, XCircle,
  Zap, Database, Cpu, HardDrive, Wifi, Eye, FileText, Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ════════════════════════════════════════════════════════════════════════
// TYPES — matching simulation engine
// ════════════════════════════════════════════════════════════════════════

interface SimMetrics {
  elapsed_s: number;
  elapsed_min: number;
  phase_id: string;
  circuit_breaker: "NORMAL" | "DEGRADED" | "RECOVERING" | "FAIL-CLOSED";
  air_state: "NORMAL" | "WARNING" | "TRIPPED" | "RECOVERY" | "ESCALATED";
  facts_accepted: number;
  facts_queued: number;
  facts_merged: number;
  facts_rejected: number;
  policy_violations: number;
  policy_violations_handled: number;
  cpu_pct: number;
  ram_pct: number;
  queue_depth: number;
  latency_p99_ms: number;
  proof_count: number;
  tee_status: "ATTESTED" | "QUARANTINED";
  replay_status: "VERIFIED" | "DIVERGENT" | "PENDING";
  mmr_root: string;
  validation_index: number;
  risk_score: number;
  risk_score_smoothed: number;
  spoofed_payloads_injected: number;
  spoofed_payloads_quarantined: number;
  merge_count: number;
  merge_conflicts_observed: number;
  evidence_bundles_total: number;
  evidence_bundles_verified: number;
  fail_closed_s: number;
}

interface HBKTelemetry {
  sensor_id: string;
  pipe_id: string;
  zone: string;
  pressure_psi: number;
  flow_rate_lpm: number;
  acoustic_db: number;
  temperature_c: number;
  leak_probability: number;
  event_type: "normal" | "leak_detected" | "pressure_spike" | "flow_anomaly" | "maintenance";
  hash: string;
}

interface GitActionLogEntry {
  id: string;
  workflow: string;
  event: string;
  status: "pending" | "running" | "success" | "failure" | "cancelled";
  commit_hash: string;
  branch: string;
  duration_ms: number;
  log_output: string;
  phase: string;
  actor: string;
}

interface SimMilestone {
  id: string;
  name: string;
  hour: number;
  triggered: boolean;
  actions: string[];
}

interface SimPhaseInfo {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  gate: string;
  objective: string;
  severity: string;
  color: string;
}

interface SimTickData {
  hour: number;
  phase: string;
  metrics: SimMetrics;
  hbkTelemetry: HBKTelemetry[];
  gitActions: GitActionLogEntry[];
  milestones: SimMilestone[];
  running: boolean;
  speedMultiplier: number;
}

// ════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════

const PHASES: SimPhaseInfo[] = [
  { id: "P1", name: "Nominal Load", startHour: 0, endHour: 12, gate: "Baseline", objective: "Establish baseline under normal telemetry", severity: "Critical", color: "#10b981" },
  { id: "P2", name: "Telemetry Flood", startHour: 12, endHour: 24, gate: "Acceptance Capacity", objective: "Verify pipeline absorbs 100× flood", severity: "Major", color: "#f97316" },
  { id: "P3", name: "Network Chaos", startHour: 24, endHour: 36, gate: "HLC Ordering", objective: "Verify deterministic replay under packet loss", severity: "Critical", color: "#ef4444" },
  { id: "P4", name: "Storage Pressure", startHour: 36, endHour: 48, gate: "Append-Only Integrity", objective: "Verify graceful degradation under disk fill", severity: "Critical", color: "#eab308" },
  { id: "P5", name: "Node Failure", startHour: 48, endHour: 60, gate: "Recovery", objective: "Verify pods restart and no Fact loss", severity: "Major", color: "#8b5cf6" },
  { id: "P6", name: "Security Injection", startHour: 60, endHour: 66, gate: "HF-001/002/005", objective: "Verify spoofed/malformed payloads rejected", severity: "Critical", color: "#06b6d4" },
  { id: "P7", name: "Partition + Recovery", startHour: 66, endHour: 72, gate: "LVL-17 (72h Blackout)", objective: "Verify deterministic HLC merge after partition", severity: "Critical", color: "#14b8a6" },
];

const CB_COLORS: Record<string, string> = { NORMAL: "#3dffb0", DEGRADED: "#CC7722", RECOVERING: "#f97316", FAIL_CLOSED: "#ff2e5f" };
const AIR_COLORS: Record<string, string> = { NORMAL: "#3dffb0", WARNING: "#eab308", TRIPPED: "#ff2e5f", RECOVERY: "#f97316", ESCALATED: "#ff2e5f" };
const GIT_STATUS_COLORS: Record<string, string> = { success: "#10b981", failure: "#ef4444", running: "#f97316", pending: "#6b7280", cancelled: "#8b5cf6" };

// ════════════════════════════════════════════════════════════════════════
// SIMULATION DASHBOARD
// ════════════════════════════════════════════════════════════════════════

export function SimulationDashboard() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [simData, setSimData] = useState<SimTickData | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simPaused, setSimPaused] = useState(false);
  const [speed, setSpeed] = useState(60);
  const [activeTab, setActiveTab] = useState<"overview" | "hbk" | "git" | "metrics">("overview");
  const [metricsHistory, setMetricsHistory] = useState<{ cpu: number[]; ram: number[]; queue: number[]; latency: number[]; risk: number[]; vi: number[] }>({ cpu: [], ram: [], queue: [], latency: [], risk: [], vi: [] });

  useEffect(() => {
    const socket = io("/?XTransformPort=3003", { transports: ["websocket"], reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 2000 });
    socket.on("connect", () => { setConnected(true); setSocketError(null); });
    socket.on("disconnect", () => { setConnected(false); });
    socket.on("connect_error", (err: Error) => { setConnected(false); setSocketError(err.message); });
    socket.on("sim:state", (data: any) => { setSimData(data); setSimRunning(data.running); });
    socket.on("sim:tick", (data: SimTickData) => {
      setSimData(data);
      setMetricsHistory(prev => {
        const h = { ...prev, cpu: [...prev.cpu, data.metrics.cpu_pct], ram: [...prev.ram, data.metrics.ram_pct], queue: [...prev.queue, data.metrics.queue_depth], latency: [...prev.latency, data.metrics.latency_p99_ms], risk: [...prev.risk, data.metrics.risk_score], vi: [...prev.vi, data.metrics.validation_index] };
        for (const k of Object.keys(h) as (keyof typeof h)[]) { if (h[k].length > 60) h[k] = h[k].slice(-60); }
        return h;
      });
    });
    socket.on("sim:started", () => { setSimRunning(true); setSimPaused(false); });
    socket.on("sim:paused", (d: { paused: boolean }) => { setSimPaused(d.paused); });
    socket.on("sim:stopped", () => { setSimRunning(false); setSimPaused(false); });
    socket.on("sim:reset", () => { setSimRunning(false); setSimPaused(false); setSimData(null); });
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  const startSim = useCallback(() => { socketRef.current?.emit("sim:start", { speedMultiplier: speed }); }, [speed]);
  const pauseSim = useCallback(() => { socketRef.current?.emit("sim:pause"); }, []);
  const stopSim = useCallback(() => { socketRef.current?.emit("sim:stop"); }, []);
  const resetSim = useCallback(() => { socketRef.current?.emit("sim:reset"); }, []);
  const changeSpeed = useCallback((newSpeed: number) => { setSpeed(newSpeed); socketRef.current?.emit("sim:speed", { speedMultiplier: newSpeed }); }, []);

  const metrics = simData?.metrics;
  const hour = simData?.hour ?? 0;
  const phase = simData?.phase ?? "P1";
  const currentPhaseInfo = PHASES.find(p => p.id === phase) ?? PHASES[0];
  const hbkData = simData?.hbkTelemetry ?? [];
  const gitData = simData?.gitActions ?? [];
  const milestones = simData?.milestones ?? [];
  const phaseProgress = currentPhaseInfo ? ((hour - currentPhaseInfo.startHour) / (currentPhaseInfo.endHour - currentPhaseInfo.startHour)) * 100 : 0;
  const overallProgress = (hour / 72) * 100;

  // Show full fallback UI when socket is not available and never connected
  if (!connected && socketError && !simData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600/10 mx-auto">
            <Wifi className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Simulation Engine Offline</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The 72-hour simulation engine is not currently running. The simulation dashboard requires a live connection to the engine service.
          </p>
          {socketError && (
            <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">
              Connection error: {socketError}
            </p>
          )}
          <div className="mt-4 rounded-lg border border-amber-900/30 bg-amber-950/20 p-4 text-left">
            <h4 className="text-sm font-semibold text-amber-400">To start the simulation engine:</h4>
            <code className="mt-2 block font-mono text-xs text-muted-foreground">
              cd mini-services/sim-engine && bun run dev
            </code>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <span className="font-mono text-[10px]">SIM ENGINE OFFLINE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* SIMULATION CONTROLLER BAR */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 backdrop-blur-xl" style={{ background: "rgba(15,15,24,0.7)" }}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} style={{ boxShadow: connected ? "0 0 6px rgba(52,211,153,0.5)" : "none" }} />
          <span className="font-mono text-[10px] text-muted-foreground">{connected ? "SIM ENGINE LIVE" : "SIM ENGINE OFFLINE"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!simRunning ? (
            <button onClick={startSim} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20">
              <Play className="h-3 w-3" />Start 72h Loop
            </button>
          ) : (
            <>
              <button onClick={pauseSim} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${simPaused ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"}`}>
                {simPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}{simPaused ? "Resume" : "Pause"}
              </button>
              <button onClick={stopSim} className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20">
                <Square className="h-3 w-3" />Stop
              </button>
            </>
          )}
          <button onClick={resetSim} className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" />Reset
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Gauge className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[10px] text-muted-foreground">Speed:</span>
          {[{ label: "1x", value: 1 }, { label: "60x", value: 60 }, { label: "360x", value: 360 }, { label: "3600x", value: 3600 }].map(s => (
            <button key={s.value} onClick={() => changeSpeed(s.value)} className={`rounded border px-2 py-1 font-mono text-[10px] transition-all ${speed === s.value ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:text-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" style={{ color: currentPhaseInfo.color }} />
            <span className="font-mono text-sm font-bold" style={{ color: currentPhaseInfo.color }}>H{hour.toString().padStart(2,"0")}:00</span>
            <span className="font-mono text-[10px] text-muted-foreground">/ H72</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: currentPhaseInfo.color }}>{currentPhaseInfo.id}</span>
            <span className="text-xs font-medium" style={{ color: currentPhaseInfo.color }}>{currentPhaseInfo.name}</span>
          </div>
          {metrics && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: CB_COLORS[metrics.circuit_breaker]||"#6b7280", boxShadow: `0 0 4px ${CB_COLORS[metrics.circuit_breaker]||"#6b7280"}80` }} />
                <span className="font-mono text-[10px] text-muted-foreground">CB:</span>
                <span className="font-mono text-[10px] font-medium" style={{ color: CB_COLORS[metrics.circuit_breaker] }}>{metrics.circuit_breaker}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" style={{ color: AIR_COLORS[metrics.air_state] }} />
                <span className="font-mono text-[10px] text-muted-foreground">AIR:</span>
                <span className="font-mono text-[10px] font-medium" style={{ color: AIR_COLORS[metrics.air_state] }}>{metrics.air_state}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="px-4 pt-1 pb-2">
        <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="absolute inset-0 rounded-full" style={{ width: `${overallProgress}%`, background: `linear-gradient(90deg, ${PHASES.map(p=>p.color).join(",")})`, transition: "width 0.3s" }} />
          {PHASES.map(p => <div key={p.id} className="absolute top-0 h-full w-[2px]" style={{ left: `${(p.startHour/72)*100}%`, background: `${p.color}60` }} />)}
        </div>
        <div className="flex justify-between mt-1 font-mono text-[9px] text-muted-foreground/60">
          {PHASES.map(p => <span key={p.id} style={{ color: phase===p.id ? p.color : undefined }}>{p.id}</span>)}
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex gap-1 px-4 pb-2">
        {([["overview","Overview",Activity],["hbk","HBK Digital Twin",Droplets],["git","Git Actions Log",GitBranch],["metrics","Real-Time Metrics",Cpu]] as const).map(([id,label,Icon])=>(
          <button key={id} onClick={()=>setActiveTab(id as any)} className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${activeTab===id?"border-white/10 bg-white/[0.05] text-foreground":"border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"}`}>
            <Icon className="h-3 w-3" />{label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth:"thin" }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.15 }}>
            {/* OVERVIEW TAB */}
            {activeTab==="overview" && (
              <div className="space-y-4">
                {metrics && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {([
                      ["Validation Index", metrics.validation_index.toFixed(1), Eye, metrics.validation_index>=90?"#10b981":"#ef4444", "/ 100"],
                      ["Facts Accepted", metrics.facts_accepted.toLocaleString(), CheckCircle2, "#3dffb0", ""],
                      ["Facts Rejected", metrics.facts_rejected.toLocaleString(), XCircle, metrics.facts_rejected>0?"#ef4444":"#6b7280", ""],
                      ["Queue Depth", metrics.queue_depth.toLocaleString(), Database, metrics.queue_depth>10000?"#ef4444":"#3dffb0", ""],
                      ["Risk Score", metrics.risk_score_smoothed.toFixed(3), AlertTriangle, AIR_COLORS[metrics.air_state], "[0,1]"],
                      ["Proofs", metrics.proof_count.toLocaleString(), Shield, "#c9a84c", ""],
                      ["TEE Status", metrics.tee_status, Cpu, metrics.tee_status==="ATTESTED"?"#3dffb0":"#ef4444", ""],
                      ["Replay", metrics.replay_status, FileText, metrics.replay_status==="VERIFIED"?"#3dffb0":"#ef4444", ""],
                      ["Spoofed Quarantined", `${metrics.spoofed_payloads_quarantined}/${metrics.spoofed_payloads_injected}`, Shield, metrics.spoofed_payloads_injected>0&&metrics.spoofed_payloads_quarantined===metrics.spoofed_payloads_injected?"#3dffb0":"#ef4444", ""],
                      ["Merge Conflicts", metrics.merge_conflicts_observed.toString(), GitBranch, metrics.merge_conflicts_observed===0?"#3dffb0":"#ef4444", "observed"],
                      ["Evidence Bundles", `${metrics.evidence_bundles_verified}/${metrics.evidence_bundles_total}`, HardDrive, metrics.evidence_bundles_verified===metrics.evidence_bundles_total?"#3dffb0":"#ef4444", "verified"],
                      ["Fail-Closed Dur.", `${metrics.fail_closed_s.toFixed(0)}s`, Zap, metrics.fail_closed_s>0?"#ef4444":"#6b7280", ""],
                    ] as [string,string,any,string,string][]).map(([label,value,Icon,color,suffix])=>(
                      <div key={label} className="rounded-lg border border-white/[0.06] p-3 backdrop-blur-sm" style={{ background:"rgba(15,15,24,0.6)" }}>
                        <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3 w-3" style={{ color }} strokeWidth={1.8} /><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">{label}</span></div>
                        <div className="font-mono text-lg font-bold" style={{ color }}>{value}{suffix&&<span className="text-[10px] text-muted-foreground/50 ml-1">{suffix}</span>}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Phase Timeline */}
                <div className="rounded-lg border border-white/[0.06] p-4 backdrop-blur-sm" style={{ background:"rgba(15,15,24,0.6)" }}>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Phase Timeline</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                    {PHASES.map(p=>{
                      const isActive=phase===p.id; const isComplete=hour>=p.endHour;
                      return (
                        <div key={p.id} className={`rounded-md border p-2.5 transition-all ${isActive?"border-white/10 bg-white/[0.05]":isComplete?"border-white/[0.04] bg-white/[0.02]":"border-white/[0.03]"}`}>
                          <div className="flex items-center gap-1.5 mb-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background:isActive||isComplete?p.color:"#6b728040" }} /><span className="font-mono text-[10px] font-medium" style={{ color:isActive||isComplete?p.color:"#6b7280" }}>{p.id}</span></div>
                          <div className="text-xs font-medium truncate" style={{ color:isActive||isComplete?p.color:"#6b7280" }}>{p.name}</div>
                          <div className="font-mono text-[9px] text-muted-foreground/60 mt-0.5">H{p.startHour}–H{p.endHour}</div>
                          {isActive && <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width:`${Math.min(100,phaseProgress)}%`, background:p.color, transition:"width 0.3s" }} /></div>}
                          {isComplete && <div className="mt-1 font-mono text-[9px] text-emerald-400">✓ PASS</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Milestones */}
                <div className="rounded-lg border border-white/[0.06] p-4 backdrop-blur-sm" style={{ background:"rgba(15,15,24,0.6)" }}>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Milestone Tracker</h3>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {milestones.map(m=>(
                      <div key={m.id} className={`flex items-center gap-2 rounded-md border px-2.5 py-2 ${m.triggered?"border-emerald-500/20 bg-emerald-500/5":"border-white/[0.04]"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${m.triggered?"bg-emerald-400":"bg-white/[0.06]"}`} />
                        <span className="font-mono text-[10px] font-medium" style={{ color:m.triggered?"#10b981":"#6b7280" }}>{m.id}</span>
                        <span className="text-xs truncate" style={{ color:m.triggered?"#e5e7eb":"#6b7280" }}>{m.name}</span>
                        <span className="font-mono text-[9px] text-muted-foreground/50 ml-auto">H{m.hour}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* HBK DIGITAL TWIN TAB */}
            {activeTab==="hbk" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/[0.06] p-4 backdrop-blur-sm" style={{ background:"rgba(15,15,24,0.6)" }}>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">HBK Digital Twin — Cape Town Water Network</h3>
                  <div className="text-xs text-muted-foreground mb-3">Real-time telemetry simulation from 6 municipal zones. SHA-256 hashed. Streamed to Epistemic Runtime.</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {(["CBD-Central","Atlantic-Seaboard","Southern-Suburbs","Northern-Suburbs","Khayelitsha","Mitchells-Plain"]).map(zone=>{
                      const zoneData=hbkData.filter(t=>t.zone===zone);
                      const hasLeak=zoneData.some(t=>t.event_type==="leak_detected");
                      const avgP=zoneData.length?zoneData.reduce((a,t)=>a+t.pressure_psi,0)/zoneData.length:0;
                      const avgF=zoneData.length?zoneData.reduce((a,t)=>a+t.flow_rate_lpm,0)/zoneData.length:0;
                      const avgA=zoneData.length?zoneData.reduce((a,t)=>a+t.acoustic_db,0)/zoneData.length:0;
                      return (
                        <div key={zone} className={`rounded-md border p-3 ${hasLeak?"border-red-500/30 bg-red-500/5":"border-white/[0.06] bg-white/[0.02]"}`}>
                          <div className="flex items-center gap-1.5 mb-2"><Droplets className="h-3 w-3" style={{ color:hasLeak?"#ef4444":"#14b8a6" }} /><span className="text-xs font-medium truncate" style={{ color:hasLeak?"#ef4444":"#14b8a6" }}>{zone}</span></div>
                          <div className="grid grid-cols-1 gap-1 font-mono text-[10px]">
                            <div className="flex justify-between"><span className="text-muted-foreground/60">Sensors</span><span className="text-foreground/80">{zoneData.length}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground/60">Pressure</span><span style={{ color:avgP>80?"#ef4444":"#e5e7eb" }}>{avgP.toFixed(1)} psi</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground/60">Flow</span><span className="text-foreground/80">{avgF.toFixed(1)} lpm</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground/60">Acoustic</span><span style={{ color:avgA>50?"#ef4444":"#e5e7eb" }}>{avgA.toFixed(1)} dB</span></div>
                          </div>
                          {hasLeak && <div className="mt-1.5 text-[10px] font-medium text-red-400">⚠ LEAK DETECTED</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.06] p-4 backdrop-blur-sm max-h-[400px] overflow-y-auto" style={{ background:"rgba(15,15,24,0.6)", scrollbarWidth:"thin" }}>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Live Sensor Readings ({hbkData.length} active)</h3>
                  <table className="w-full text-[10px] font-mono">
                    <thead><tr className="text-muted-foreground/60"><th className="pb-1.5 text-left">Sensor</th><th className="pb-1.5 text-left">Zone</th><th className="pb-1.5 text-right">Pressure</th><th className="pb-1.5 text-right">Flow</th><th className="pb-1.5 text-right">Acoustic</th><th className="pb-1.5 text-right">Leak Prob</th><th className="pb-1.5 text-left">Event</th><th className="pb-1.5 text-left">Hash</th></tr></thead>
                    <tbody>
                      {hbkData.slice(0,30).map(t=>(
                        <tr key={t.sensor_id} className={`${t.event_type==="leak_detected"?"text-red-400":t.event_type==="pressure_spike"?"text-orange-400":"text-foreground/70"}`}>
                          <td className="py-0.5">{t.sensor_id}</td><td className="py-0.5 truncate max-w-[80px]">{t.zone}</td><td className="py-0.5 text-right">{t.pressure_psi.toFixed(1)}</td><td className="py-0.5 text-right">{t.flow_rate_lpm.toFixed(1)}</td><td className="py-0.5 text-right">{t.acoustic_db.toFixed(1)}</td><td className="py-0.5 text-right">{t.leak_probability.toFixed(4)}</td><td className="py-0.5">{t.event_type}</td><td className="py-0.5 truncate max-w-[60px] text-muted-foreground/40">{t.hash.slice(0,18)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* GIT ACTIONS LOG TAB */}
            {activeTab==="git" && (
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto" style={{ scrollbarWidth:"thin" }}>
                <div className="rounded-lg border border-white/[0.06] p-3 backdrop-blur-sm" style={{ background:"rgba(15,15,24,0.6)" }}>
                  <div className="flex items-center gap-2 mb-3"><GitBranch className="h-3.5 w-3.5 text-muted-foreground" /><h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">GitHub Actions — VVU-VAL-001 Workflows</h3><span className="font-mono text-[9px] text-muted-foreground/50 ml-auto">{gitData.length} runs tracked</span></div>
                </div>
                {gitData.slice(-50).reverse().map(entry=>(
                  <div key={entry.id} className={`rounded-lg border p-3 backdrop-blur-sm ${entry.status==="failure"?"border-red-500/20":entry.status==="success"?"border-emerald-500/15":"border-white/[0.06]"}`} style={{ background:"rgba(15,15,24,0.6)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background:GIT_STATUS_COLORS[entry.status] }} />
                      <span className="font-mono text-xs font-medium" style={{ color:GIT_STATUS_COLORS[entry.status] }}>{entry.status==="success"?"✓":entry.status==="failure"?"✗":entry.status==="cancelled"?"⏸":"⟳"} {entry.workflow}</span>
                      <span className="font-mono text-[10px] text-muted-foreground/60">[{entry.event}]</span>
                      <span className="font-mono text-[10px] text-muted-foreground/50">{entry.branch}</span>
                      <span className="font-mono text-[9px] text-muted-foreground/40 ml-auto">{entry.phase} · {entry.duration_ms/1000}s</span>
                    </div>
                    <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/80 whitespace-pre-wrap max-h-[120px] overflow-y-auto rounded-md bg-black/20 p-2" style={{ scrollbarWidth:"thin" }}>{entry.log_output}</div>
                  </div>
                ))}
                {gitData.length===0 && <div className="text-center py-8 text-muted-foreground/50 font-mono text-xs">No Git Actions yet. Start the simulation to generate workflow runs.</div>}
              </div>
            )}
            {/* METRICS TAB */}
            {activeTab==="metrics" && metrics && (
              <div className="space-y-4">
                {(["CPU","RAM","Queue Depth","Latency p99","Risk Score","Validation Index"]).map((label,i)=>{
                  const key=(["cpu","ram","queue","latency","risk","vi"] as const)[i];
                  const data=metricsHistory[key];
                  const max=key==="cpu"||key==="ram"?100:key==="latency"?2000:key==="queue"?50000:key==="vi"?100:1;
                  const colors=["#10b981","#f97316","#06b6d4","#8b5cf6","#ef4444","#c9a84c"];
                  return (
                    <div key={label} className="rounded-lg border border-white/[0.06] p-3 backdrop-blur-sm" style={{ background:"rgba(15,15,24,0.6)" }}>
                      <div className="flex items-center justify-between mb-2"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span><span className="font-mono text-sm font-bold" style={{ color:colors[i] }}>{data.length?data[data.length-1].toFixed(key==="risk"?3:1):"—"}</span></div>
                      <div className="relative h-8 w-full overflow-hidden rounded bg-white/[0.03]">
                        {data.length>1 && <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${data.length} 8`}><polyline fill="none" stroke={colors[i]} strokeWidth={0.5} points={data.map((v,j)=>`${j},${8-(v/max)*8}`).join(" ")} /></svg>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
