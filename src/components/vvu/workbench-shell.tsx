/** VVU WorkbenchShell — Capability-driven Trust Operating Environment.
 *  Replaces the dashboard with a workspace-first architecture:
 *  - Auto-hide edge docks (left: products, right: telemetry, top: search/commands, bottom: tasks)
 *  - Magnetic proximity detection with glow effects
 *  - Workspace focus mode (active product owns the screen)
 *  - Capability-driven UX ("I want to…" instead of product names)
 *  - Trust-based onboarding with progressive trust journey
 *  - Adaptive rendering (only active workspace mounted)
 *  - Consistent motion language (150ms expand, 120ms collapse, 100ms fade)
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Command as CommandIcon, Search, Bell, Activity, Settings,
  Download, ChevronRight, X, Shield, Eye, Droplets, Zap,
  BrainCircuit, Boxes, ShieldCheck, FileCheck2, Workflow,
  Activity as ActivityIcon, CheckCircle2, Lock, Unlock,
  ArrowRight, Sparkles, BookOpen, Scale, FileText,
} from "lucide-react";
import {
  PRODUCTS, PRODUCT_MAP, type ProductId,
} from "./products";
import TrustSphere from "./trust-sphere";
import { UbuntuPools } from "./ubuntu-pools";
import { ProductStub } from "./product-stub";
import {
  EpistemicRuntimeDashboard, ESSENTIAL_SECTIONS, type SectionId,
} from "./epistemic-runtime-dashboard";
import { VvuCommandPalette } from "./command-palette";
import { SimulationDashboard } from "@/components/simulation/simulation-dashboard";

// ─── Capability Registry ────────────────────────────────────────────────
interface Capability {
  id: string;
  label: string;
  icon: typeof Shield;
  description: string;
  productId: ProductId;
  mission: string;
  trustLevel: number; // 0-3 (0=locked, 1=discover, 2=learned, 3=certified)
  category: string;
}

const CAPABILITIES: Capability[] = [
  { id: "verify", label: "Verify Authenticity", icon: Shield, description: "Verify evidence, documents, and records with cryptographic proof", productId: "proofbridge", mission: "Protect Water Infrastructure", trustLevel: 0, category: "Water Infrastructure" },
  { id: "evidence", label: "Produce Evidence", icon: FileCheck2, description: "Generate verifiable receipts anchored into the MMR", productId: "proofbridge", mission: "Protect Water Infrastructure", trustLevel: 0, category: "Water Infrastructure" },
  { id: "detect", label: "Detect Anomalies", icon: Eye, description: "Real-time infrastructure anomaly detection with confidence scoring", productId: "hbk", mission: "Protect Water Infrastructure", trustLevel: 0, category: "Water Infrastructure" },
  { id: "monitor", label: "Monitor Operations", icon: Activity, description: "Live monitoring of trust network, circuit breaker, and system health", productId: "sphere", mission: "Protect Water Infrastructure", trustLevel: 0, category: "Water Infrastructure" },
  { id: "simulate", label: "Run Simulations", icon: BrainCircuit, description: "72-hour validation loops with HBK digital twin prototypes", productId: "simulation", mission: "Protect Water Infrastructure", trustLevel: 0, category: "Water Infrastructure" },
  { id: "decide", label: "Automate Decisions", icon: Zap, description: "Agentic inference runtime with circuit breaker and hard-failure gates", productId: "air-runtime", mission: "Protect Water Infrastructure", trustLevel: 0, category: "Energy Infrastructure" },
  { id: "govern", label: "Govern Together", icon: Scale, description: "Community savings circles with verifiable contributions and Ubuntu Score", productId: "ubuntu-pools", mission: "Financial Communities", trustLevel: 0, category: "Financial Communities" },
  { id: "explore", label: "Explore Knowledge", icon: BookOpen, description: "DAG control plane with policy DSL, sharded CRDTs, and MMR proofs", productId: "epistemic", mission: "Research", trustLevel: 0, category: "Research" },
];

const MISSIONS = [...new Set(CAPABILITIES.map(c => c.mission))];

// ─── Trust Journey Steps ────────────────────────────────────────────────
interface TrustStep {
  title: string;
  statement: string;
  isQuestion?: boolean;
  correctAnswer?: string;
  explanation: string;
}

const TRUST_JOURNEYS: Record<string, TrustStep[]> = {
  verify: [
    { title: "How Verification Works", statement: "This system generates cryptographic proofs that evidence has not been altered.", explanation: "Verification uses Ed25519 signatures and Merkle Mountain Range proofs to ensure tamper detection." },
    { title: "Probabilistic Results", statement: "This system generates probabilistic results. Human review is still required.", explanation: "No automated system can guarantee absolute certainty. All results should be validated by qualified personnel." },
    { title: "Evidence Can Be Challenged", statement: "Evidence can be challenged and replayed at any time.", explanation: "The replay engine allows any verification to be independently audited." },
    { title: "Understanding Check", statement: "Would this verification output be considered absolute truth?", isQuestion: true, correctAnswer: "No", explanation: "Verification confirms the evidence matches its recorded state, not that the underlying data is absolute truth." },
  ],
  govern: [
    { title: "How Ubuntu Pools Works", statement: "Ubuntu Pools helps groups coordinate contributions, governance, and record-keeping. It does not guarantee returns or eliminate financial risk.", explanation: "The platform is a tool for managing agreed-upon rules, not a financial advisor." },
    { title: "Who Owns the Money?", statement: "Who owns the money while it is in the pool?", isQuestion: true, correctAnswer: "Pool Members", explanation: "Contributions remain the property of pool members according to the pool's governance rules." },
    { title: "Guaranteed Returns?", statement: "Can VVU guarantee returns on contributions?", isQuestion: true, correctAnswer: "No", explanation: "VVU provides verifiable record-keeping, not financial guarantees. Returns depend on the pool's activities." },
    { title: "Dispute Resolution", statement: "Can governance decisions be disputed?", isQuestion: true, correctAnswer: "Yes", explanation: "All governance decisions are recorded on the platform and can be challenged through the dispute process." },
  ],
  detect: [
    { title: "Anomaly Detection", statement: "Anomaly detection identifies statistical deviations from expected patterns. It does not diagnose root causes.", explanation: "The system highlights potential issues for human investigation." },
    { title: "Confidence Levels", statement: "All detections include a confidence score. A 92% confidence anomaly should still be verified by an engineer.", explanation: "Confidence scores reflect statistical likelihood, not certainty." },
    { title: "Understanding Check", statement: "Should an anomaly detection be treated as a confirmed diagnosis?", isQuestion: true, correctAnswer: "No", explanation: "Anomaly detection identifies potential issues. Professional investigation is required for diagnosis." },
  ],
};

// ─── Motion Constants ───────────────────────────────────────────────────
const MOTION = {
  expand: 0.15,   // 150ms
  collapse: 0.12, // 120ms
  fade: 0.10,     // 100ms
  scale: { from: 0.98, to: 1.0 },
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  retractDelay: 300, // ms before dock retracts
  proximity: 24,     // px proximity zone for magnetic interaction
  dockThin: 6,       // px when inactive
};

// ─── Edge Dock Component ────────────────────────────────────────────────
type DockSide = "left" | "right" | "top" | "bottom";

function EdgeDock({
  side, children, label, thin = MOTION.dockThin,
}: {
  side: DockSide; children: React.ReactNode; label: string; thin?: number;
}) {
  const [open, setOpen] = useState(false);
  const [proximity, setProximity] = useState(false);
  const retractTimer = useRef<ReturnType<typeof setTimeout>>();

  const isHorizontal = side === "top" || side === "bottom";
  const isLeft = side === "left";
  const isTop = side === "top";

  const handleMouseEnter = useCallback(() => {
    clearTimeout(retractTimer.current);
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    retractTimer.current = setTimeout(() => {
      setOpen(false);
      setProximity(false);
    }, MOTION.retractDelay);
  }, []);

  const handleProximity = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dist = isHorizontal
      ? (isTop ? e.clientY - rect.bottom : rect.top - e.clientY)
      : (isLeft ? e.clientX - rect.right : rect.left - e.clientX);
    if (dist > 0 && dist < MOTION.proximity) {
      setProximity(true);
    } else if (dist >= MOTION.proximity) {
      setProximity(false);
    }
  }, [isHorizontal, isTop, isLeft]);

  const dockStyle = isHorizontal
    ? { height: open ? "auto" : thin, left: 0, right: 0, [isTop ? "top" : "bottom"]: 0 }
    : { width: open ? (side === "left" ? 220 : 260) : thin, top: 0, bottom: 0, [isLeft ? "left" : "right"]: 0 };

  const glowColor = proximity && !open ? "rgba(201,168,76,0.15)" : "transparent";

  return (
    <div
      className="absolute z-40 flex overflow-hidden"
      style={{
        ...dockStyle,
        transition: `width ${MOTION.expand}s ease-out, height ${MOTION.expand}s ease-out`,
        background: open ? "rgba(12,12,18,0.92)" : "transparent",
        backdropFilter: open ? "blur(20px)" : "none",
        border: open ? (isHorizontal ? `border-${isTop ? "b" : "t"} border-white/[0.06]` : `border-${isLeft ? "r" : "l"} border-white/[0.06]`) : "none",
        boxShadow: open ? "0 0 30px rgba(0,0,0,0.5)" : "none",
      }}
      onMouseMove={handleProximity}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Proximity glow strip */}
      {!open && (
        <div className={`absolute ${isHorizontal ? (isTop ? "bottom-0 h-[2px]" : "top-0 h-[2px]") : (isLeft ? "right-0 w-[2px]" : "left-0 w-[2px]")} transition-opacity duration-100`}
          style={{ background: glowColor, opacity: proximity ? 1 : 0, ...(isHorizontal ? { left: 0, right: 0 } : { top: 0, bottom: 0 }) }} />
      )}
      {/* Magnetic glow */}
      {proximity && !open && (
        <div className={`absolute ${isHorizontal ? (isTop ? "bottom-0" : "top-0") : (isLeft ? "right-0" : "left-0")}`}
          style={{
            ...(isHorizontal ? { left: 0, right: 0, height: MOTION.proximity } : { top: 0, bottom: 0, width: MOTION.proximity }),
            background: `radial-gradient(${isHorizontal ? "ellipse" : "circle"} at center, rgba(201,168,76,0.08) 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
      )}
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: MOTION.scale.from }}
          animate={{ opacity: 1, scale: MOTION.scale.to }}
          transition={{ duration: MOTION.fade, ease: "easeOut" }}
          className={`flex flex-col ${isHorizontal ? "flex-row items-center" : "flex-col"} gap-1 p-3 ${isHorizontal ? "px-4" : ""}`}
        >
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">{label}</div>
          {children}
        </motion.div>
      )}
    </div>
  );
}

// ─── Capability Card ────────────────────────────────────────────────────
function CapabilityCard({ cap, onSelect, onTrust }: { cap: Capability; onSelect: () => void; onTrust: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const Icon = cap.icon;
  const product = PRODUCT_MAP[cap.productId];

  return (
    <motion.button
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onSelect}
      className="group relative flex items-start gap-3 rounded-lg border border-white/[0.06] p-3 text-left transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
      whileTap={{ scale: 0.98 }}
    >
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-white/[0.08]"
        style={{ background: `${product.accent}10`, borderColor: `${product.accent}30` }}>
        <Icon className="h-4 w-4" style={{ color: product.accent }} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-foreground">{cap.label}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground/70 line-clamp-2">{cap.description}</div>
        {hovered && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: MOTION.fade }} className="mt-2 flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-muted-foreground/50">Powered by</span>
            <span className="font-mono text-[9px] font-medium" style={{ color: product.accent }}>{product.label}</span>
          </motion.div>
        )}
      </div>
      {cap.trustLevel > 0 && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border border-white/[0.08]" style={{ background: `${product.accent}15` }}>
          <CheckCircle2 className="h-2.5 w-2.5" style={{ color: product.accent }} />
        </span>
      )}
    </motion.button>
  );
}

// ─── Trust Journey Modal ────────────────────────────────────────────────
function TrustJourneyModal({
  capabilityId, onClose, onComplete,
}: { capabilityId: string; onClose: () => void; onComplete: () => void }) {
  const steps = TRUST_JOURNEYS[capabilityId] || TRUST_JOURNEYS.verify;
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const current = steps[step];

  const handleContinue = useCallback(() => {
    if (current.isQuestion) {
      if (answer !== current.correctAnswer) {
        setWrong(true);
        return;
      }
    }
    setWrong(false);
    setAnswer(null);
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }, [step, steps.length, current, answer, onComplete]);

  const cap = CAPABILITIES.find(c => c.id === capabilityId)!;
  const product = PRODUCT_MAP[cap.productId];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.fade }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={MOTION.spring}
        className="w-full max-w-[520px] rounded-xl border border-white/[0.08] p-6"
        style={{ background: "rgba(15,15,24,0.97)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="mb-5 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? product.accent : "rgba(255,255,255,0.06)" }} />
          ))}
        </div>

        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50">Step {step + 1} of {steps.length}</div>
        <h3 className="mb-4 text-base font-bold" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>{current.title}</h3>

        <p className="mb-4 text-sm leading-relaxed text-foreground/85">{current.statement}</p>

        {current.isQuestion && (
          <div className="mb-4 flex gap-2">
            {["Yes", "No"].map(opt => (
              <button key={opt} onClick={() => { setAnswer(opt); setWrong(false); }}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${answer === opt ? "border-white/20 bg-white/[0.06] text-foreground" : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12]"}`}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {wrong && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            That's not quite right. {current.explanation}
          </motion.div>
        )}

        {current.explanation && !wrong && !current.isQuestion && (
          <div className="mb-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-muted-foreground/80">
            <Sparkles className="mr-1.5 inline h-3 w-3 text-[var(--vvu-gold)]" />{current.explanation}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleContinue}
            disabled={current.isQuestion && !answer}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed">
            {step < steps.length - 1 ? "Continue" : "Complete Understanding"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Trust Passport ─────────────────────────────────────────────────────
function TrustPassport({ completed }: { completed: Set<string> }) {
  return (
    <div className="flex flex-col gap-2">
      {CAPABILITIES.map(cap => {
        const done = completed.has(cap.id);
        const Icon = cap.icon;
        return (
          <div key={cap.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs">
            <Icon className={`h-3.5 w-3.5 ${done ? "text-[var(--vvu-gold)]" : "text-muted-foreground/30"}`} strokeWidth={1.8} />
            <span className={done ? "text-foreground" : "text-muted-foreground/40"}>{cap.label}</span>
            {done ? <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-[var(--vvu-gold)]" /> : <Lock className="ml-auto h-3 w-3 text-muted-foreground/20" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Bottom Context Bar ─────────────────────────────────────────────────
function BottomBar({ activeMeta, verifiedCount, trustDensity, cbState }: {
  activeMeta: ReturnType<typeof PRODUCT_MAP>[ProductId]; verifiedCount: number; trustDensity: number; cbState: string;
}) {
  const CB_COLORS: Record<string, string> = { NORMAL: "#3dffb0", DEGRADED: "#CC7722", "FAIL-CLOSED": "#ff2e5f" };
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/60">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CB_COLORS[cbState] || "#3dffb0", boxShadow: `0 0 6px ${CB_COLORS[cbState] || "#3dffb0"}80`, animation: "vvu-live-pulse 2s ease-in-out infinite" }} />
      <span>CB: <b style={{ color: CB_COLORS[cbState] || "#3dffb0" }}>{cbState}</b></span>
      <span className="text-white/10">·</span>
      <span>Verified: <b style={{ color: "var(--vvu-gold)" }}>{verifiedCount}</b></span>
      <span className="text-white/10">·</span>
      <span>Trust: <b style={{ color: "var(--vvu-gold)" }}>{trustDensity.toFixed(1)}%</b></span>
      <span className="text-white/10">·</span>
      <span>Active: <b style={{ color: activeMeta.accent }}>{activeMeta.label}</b></span>
    </div>
  );
}

// ─── Main Workbench Shell ───────────────────────────────────────────────
export function WorkbenchShell() {
  const [activeProduct, setActiveProduct] = useState<ProductId>("sphere");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [trustDensity, setTrustDensity] = useState(0);
  const [sphereMode, setSphereMode] = useState<"global" | "personal">("global");
  const [epistemicSection, setEpistemicSection] = useState<SectionId>("overview");
  const [cbState] = useState("NORMAL");
  const [focusMode, setFocusMode] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [trustJourney, setTrustJourney] = useState<string | null>(null);
  const [completedJourneys, setCompletedJourneys] = useState<Set<string>>(new Set());
  const [showPassport, setShowPassport] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); return; }
      if (paletteOpen) return;
      const t = e.target as HTMLElement;
      const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.key >= "1" && e.key <= "7") {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < PRODUCTS.length) { e.preventDefault(); setActiveProduct(PRODUCTS[idx].id); setFocusMode(true); }
        return;
      }
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") { if (trustJourney) { setTrustJourney(null); return; } if (showCapabilities) { setShowCapabilities(false); return; } if (focusMode) { setFocusMode(false); return; } if (activeProduct !== "sphere") { setActiveProduct("sphere"); } return; }
      if (e.key === "?") { e.preventDefault(); setShortcutsOpen(o => !o); }
      if (e.key === "f" && !focusMode) { setFocusMode(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen, activeProduct, focusMode, trustJourney, showCapabilities]);

  const handleProductSelect = useCallback((id: ProductId) => { setActiveProduct(id); setFocusMode(true); }, []);
  const handleEpistemicSectionSelect = useCallback((id: SectionId) => { setEpistemicSection(id); setActiveProduct("epistemic"); setFocusMode(true); }, []);
  const handleSphereMetrics = useCallback((m: { verified: number; density: number }) => { setVerifiedCount(m.verified); setTrustDensity(m.density); }, []);
  const handleCapabilitySelect = useCallback((cap: Capability) => {
    if (!completedJourneys.has(cap.id) && TRUST_JOURNEYS[cap.id]) {
      setTrustJourney(cap.id);
    } else {
      setActiveProduct(cap.productId);
      setFocusMode(true);
      setShowCapabilities(false);
    }
  }, [completedJourneys]);
  const handleJourneyComplete = useCallback((capId: string) => {
    setCompletedJourneys(prev => new Set([...prev, capId]));
    setTrustJourney(null);
    const cap = CAPABILITIES.find(c => c.id === capId);
    if (cap) { setActiveProduct(cap.productId); setFocusMode(true); setShowCapabilities(false); }
  }, []);

  const activeMeta = PRODUCT_MAP[activeProduct];

  // Left dock: product cards
  const leftDockContent = (
    <div className="flex flex-col gap-1.5">
      {PRODUCTS.map(p => {
        const Icon = p.icon;
        const isActive = activeProduct === p.id;
        return (
          <button key={p.id} onClick={() => { setActiveProduct(p.id); setFocusMode(true); }}
            className={`group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all ${isActive ? "border-white/[0.1] bg-white/[0.05] text-foreground" : "border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"}`}
            title={`${p.label} (Alt+${p.shortcut})`}>
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md border" style={{ borderColor: isActive ? `${p.accent}50` : "rgba(255,255,255,0.06)", background: isActive ? `${p.accent}12` : "transparent" }}>
              <Icon className="h-3.5 w-3.5" style={{ color: isActive ? p.accent : undefined }} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{p.label}</div>
              <div className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground/60">{p.tagline}</div>
            </div>
            <kbd className="flex-none rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5 font-mono text-[8px] text-muted-foreground/40">{p.shortcut}</kbd>
          </button>
        );
      })}
    </div>
  );

  // Right dock: telemetry
  const rightDockContent = (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Live Telemetry</div>
      {activeMeta.signals.map(sig => (
        <div key={sig.label} className="flex items-center justify-between rounded-md border border-white/[0.04] px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground/70">{sig.label}</span>
          <span className="font-mono text-[10px] font-medium" style={{ color: activeMeta.accent }}>{sig.value}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-white/[0.06] pt-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Trust Passport</div>
        <button onClick={() => setShowPassport(!showPassport)} className="mt-1 flex w-full items-center gap-2 rounded-md border border-white/[0.04] px-2.5 py-2 text-left hover:bg-white/[0.02]">
          <Shield className="h-3.5 w-3.5 text-[var(--vvu-gold)]" />
          <span className="text-[10px] text-muted-foreground">{completedJourneys.size}/{CAPABILITIES.length} certified</span>
          <ChevronRight className={`ml-auto h-3 w-3 text-muted-foreground/40 transition-transform ${showPassport ? "rotate-90" : ""}`} />
        </button>
        {showPassport && <TrustPassport completed={completedJourneys} />}
      </div>
    </div>
  );

  // Top dock: search + commands
  const topDockContent = (
    <div className="flex w-full items-center gap-3">
      <button onClick={() => setPaletteOpen(true)} className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground hover:border-white/[0.15]">
        <Search className="h-3.5 w-3.5" />
        <span>Search commands, capabilities…</span>
        <kbd className="ml-auto rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px]">⌘K</kbd>
      </button>
      <button onClick={() => setShowCapabilities(true)} className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground hover:border-[var(--vvu-gold)]/30 hover:text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-[var(--vvu-gold)]" />
        <span>I want to…</span>
      </button>
      <button onClick={() => setFocusMode(!focusMode)} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${focusMode ? "border-[var(--vvu-gold)]/30 bg-[var(--vvu-gold)]/10 text-[var(--vvu-gold)]" : "border-white/[0.08] text-muted-foreground hover:text-foreground"}`}>
        <Eye className="h-3.5 w-3.5" />Focus
      </button>
      <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground">
        <Bell className="h-3.5 w-3.5" />
      </button>
      <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground">
        <Settings className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  // Bottom dock: tasks
  const bottomDockContent = (
    <div className="flex w-full items-center gap-3">
      <div className="flex items-center gap-2 rounded-md border border-white/[0.04] px-2.5 py-1.5">
        <Activity className="h-3 w-3 text-[var(--vvu-gold)]" />
        <span className="font-mono text-[10px] text-muted-foreground">No active tasks</span>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-white/[0.04] px-2.5 py-1.5">
        <Download className="h-3 w-3 text-muted-foreground/50" />
        <span className="font-mono text-[10px] text-muted-foreground">Exports: 0</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground/40">
        <kbd className="rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5">F</kbd> focus
        <span className="text-white/10">·</span>
        <kbd className="rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5">⌘K</kbd> palette
      </div>
    </div>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)" }}>
      <style dangerouslySetInnerHTML={{ __html: `:root{--vvu-gold:#C9A84C}@keyframes vvu-live-pulse{0%,100%{opacity:1}50%{opacity:.35}}` }} />

      {/* Thin Header */}
      <header className="relative z-50 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2 backdrop-blur-xl" style={{ background: "rgba(12,12,18,0.8)" }}>
        <div className="flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" aria-hidden className="flex-none">
            <circle cx="35" cy="40" r="16" stroke="#8A9A5B" strokeWidth="5" /><circle cx="65" cy="40" r="16" stroke="#CC7722" strokeWidth="5" /><circle cx="50" cy="64" r="16" stroke="#E2E3DB" strokeWidth="5" />
          </svg>
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>Venture Vision <span style={{ color: "var(--vvu-gold)" }}>Ubuntu</span></span>
          <span className="hidden font-mono text-[9px] text-muted-foreground/50 sm:inline">· Trust Operating Environment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowCapabilities(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--vvu-gold)]/20 bg-[var(--vvu-gold)]/5 px-2.5 py-1.5 text-xs text-[var(--vvu-gold)] transition-colors hover:bg-[var(--vvu-gold)]/10">
            <Sparkles className="h-3.5 w-3.5" />I want to…
          </button>
          <button onClick={() => setPaletteOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <CommandIcon className="h-3.5 w-3.5" /><kbd className="hidden rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[9px] lg:inline">⌘K</kbd>
          </button>
          <span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#3dffb0", boxShadow: "0 0 8px rgba(61,255,176,0.5)", animation: "vvu-live-pulse 2s ease-in-out infinite" }} />LIVE
          </span>
        </div>
      </header>

      {/* Workspace */}
      <div className="relative min-h-0 flex-1">
        {/* Edge Docks */}
        {!focusMode && (
          <>
            <EdgeDock side="left" label="Products">{leftDockContent}</EdgeDock>
            <EdgeDock side="right" label="Telemetry">{rightDockContent}</EdgeDock>
            <EdgeDock side="top" label="Commands">{topDockContent}</EdgeDock>
            <EdgeDock side="bottom" label="Tasks">{bottomDockContent}</EdgeDock>
          </>
        )}

        {/* Active Workspace */}
        <main className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeProduct} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-0">
              {activeProduct === "sphere" && (
                <div className="absolute inset-0">
                  <TrustSphere mode={sphereMode} onMetrics={handleSphereMetrics} />
                  <div className="absolute right-4 top-4 z-20 rounded-lg border border-white/[0.06] p-3 font-mono text-[10px] text-muted-foreground backdrop-blur-md sm:right-6 sm:top-6" style={{ background: "rgba(15,15,24,0.65)", minWidth: 180 }}>
                    <div className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.05em] text-foreground">Node State</div>
                    {[["#2a2d3a","Unknown"],["#3d6bff","Identity"],["#3d6bff","Contribution"],["#3dffb0","Receipt"],["#c9a84c","Hash"],["#b23dff","ZK Proof"],["#ff2e5f","Trust"]].map(([c,l])=>(<div key={l} className="my-0.5 flex items-center gap-2"><span className="h-1.5 w-1.5 flex-none rounded-full" style={{background:c}} />{l}</div>))}
                  </div>
                  <div className="absolute bottom-5 left-5 z-20 flex gap-1.5">
                    <button onClick={() => setSphereMode("global")} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all ${sphereMode==="global"?"border-[var(--vvu-gold)]/30 bg-[var(--vvu-gold)]/10 text-[var(--vvu-gold)]":"border-white/[0.08] bg-white/[0.03] text-muted-foreground"}`}>Global</button>
                    <button onClick={() => setSphereMode("personal")} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] transition-all ${sphereMode==="personal"?"border-[var(--vvu-gold)]/30 bg-[var(--vvu-gold)]/10 text-[var(--vvu-gold)]":"border-white/[0.08] bg-white/[0.03] text-muted-foreground"}`}>Personal</button>
                  </div>
                </div>
              )}
              {activeProduct === "epistemic" && (
                <EpistemicRuntimeDashboard activeSection={epistemicSection} onSectionChange={setEpistemicSection} onBackToSphere={() => setActiveProduct("sphere")} />
              )}
              {activeProduct === "ubuntu-pools" && <UbuntuPools />}
              {activeProduct === "simulation" && <SimulationDashboard />}
              {!["sphere", "epistemic", "ubuntu-pools", "simulation"].includes(activeProduct) && (
                <ProductStub product={activeMeta} onBackToSphere={() => setActiveProduct("sphere")} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Focus Mode Overlay */}
        {focusMode && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            {/* Focus mode indicator */}
            <div className="absolute left-4 top-3 z-40 pointer-events-auto flex items-center gap-2">
              <button onClick={() => setFocusMode(false)} className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/40 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur-md hover:text-foreground">
                <X className="h-3 w-3" />Exit Focus
              </button>
              <span className="rounded-md border border-white/[0.06] bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground/60 backdrop-blur-md">
                <span style={{ color: activeMeta.accent }}>{activeMeta.label}</span> · Focus Mode
              </span>
            </div>
            {/* Right telemetry in focus mode */}
            <div className="absolute right-3 top-3 z-40 pointer-events-auto max-w-[200px] rounded-lg border border-white/[0.06] bg-black/40 p-3 backdrop-blur-md">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">Telemetry</div>
              {activeMeta.signals.slice(0, 2).map(sig => (
                <div key={sig.label} className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground/60">{sig.label}</span>
                  <span className="font-mono text-[10px]" style={{ color: activeMeta.accent }}>{sig.value}</span>
                </div>
              ))}
            </div>
            {/* Bottom context bar */}
            <div className="absolute bottom-3 left-3 z-40 pointer-events-auto">
              <div className="rounded-lg border border-white/[0.06] bg-black/40 px-3 py-2 backdrop-blur-md">
                <BottomBar activeMeta={activeMeta} verifiedCount={verifiedCount} trustDensity={trustDensity} cbState={cbState} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Context Bar (non-focus) */}
      {!focusMode && (
        <footer className="relative z-30 flex shrink-0 items-center justify-between border-t border-white/[0.06] px-4 py-2 backdrop-blur-xl" style={{ background: "rgba(12,12,18,0.8)" }}>
          <BottomBar activeMeta={activeMeta} verifiedCount={verifiedCount} trustDensity={trustDensity} cbState={cbState} />
          <div className="hidden items-center gap-1.5 font-mono text-[9px] text-muted-foreground/40 md:flex">
            <kbd className="rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5">F</kbd> focus
            <span className="text-white/10">·</span>
            <kbd className="rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5">⌘K</kbd> palette
            <span className="text-white/10">·</span>
            <kbd className="rounded border border-white/[0.06] bg-white/[0.03] px-1 py-0.5">Esc</kbd> back
          </div>
        </footer>
      )}

      {/* Capabilities Modal ("I want to…") */}
      <AnimatePresence>
        {showCapabilities && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.fade }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowCapabilities(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={MOTION.spring}
              className="w-full max-w-[680px] rounded-xl border border-white/[0.08] p-6"
              style={{ background: "rgba(15,15,24,0.97)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>What would you like to do?</h2>
                  <p className="mt-1 text-xs text-muted-foreground/60">Select a capability to get started. Products are revealed as you progress.</p>
                </div>
                <button onClick={() => setShowCapabilities(false)} className="rounded-md border border-white/[0.08] p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              {MISSIONS.map(mission => (
                <div key={mission} className="mb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 w-4 rounded-full bg-[var(--vvu-gold)]/30" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--vvu-gold)]/60">{mission}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CAPABILITIES.filter(c => c.mission === mission).map(cap => (
                      <CapabilityCard key={cap.id} cap={cap} onSelect={() => handleCapabilitySelect(cap)} onTrust={() => setTrustJourney(cap.id)} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust Journey Modal */}
      <AnimatePresence>
        {trustJourney && (
          <TrustJourneyModal
            capabilityId={trustJourney}
            onClose={() => setTrustJourney(null)}
            onComplete={() => handleJourneyComplete(trustJourney)}
          />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <VvuCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onProductSelect={handleProductSelect} onEpistemicSectionSelect={handleEpistemicSectionSelect} />

      {/* Shortcuts Overlay */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShortcutsOpen(false)}>
          <div className="w-full max-w-[560px] rounded-xl border border-white/[0.08] p-6" style={{ background: "rgba(15,15,24,0.95)" }} onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-geist-sans), Georgia, serif" }}>Keyboard Shortcuts</h2>
              <button onClick={() => setShortcutsOpen(false)} className="rounded-md border border-white/[0.08] px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground">Esc</button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Navigation</div>
                <div className="flex flex-col gap-1.5">
                  {[["⌘K","Command palette"],["F","Toggle focus mode"],["Alt+1-7","Jump to product"],["Esc","Back / Exit focus"],["?","This overlay"]].map(([k,l])=>(<div key={k} className="flex items-center justify-between gap-3"><span className="text-xs text-foreground/85">{l}</span><kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{k}</kbd></div>))}
                </div>
              </div>
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Edge Docks</div>
                <div className="flex flex-col gap-1.5">
                  {[["Hover left edge","Products"],["Hover right edge","Telemetry & Trust Passport"],["Hover top edge","Search & Commands"],["Hover bottom edge","Tasks & Exports"],["300ms delay","Auto-retract"]].map(([k,l])=>(<div key={k} className="flex items-center justify-between gap-3"><span className="text-xs text-foreground/85">{l}</span><span className="text-[10px] text-muted-foreground/50">{k}</span></div>))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
