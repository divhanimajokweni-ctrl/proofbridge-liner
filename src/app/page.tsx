"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreeRingsLogo } from "@/components/vvu/three-rings-logo";
import { ThemeToggle } from "@/components/vvu/theme-toggle";
import { StateBadge } from "@/components/ive/state-badge";
import { StateLattice } from "@/components/ive/state-lattice";
import { AuthorizationPanel } from "@/components/ive/authorization-panel";
import { EvidenceMeshPanel } from "@/components/ive/evidence-mesh-panel";
import { ParticipationRatioPanel } from "@/components/ive/participation-ratio-panel";
import { HeatKernelPanel } from "@/components/ive/heat-kernel-panel";
import { CircuitBreakerPanel } from "@/components/ive/circuit-breaker-panel";
import { P0IntegrityGauge } from "@/components/ive/p0-integrity-gauge";
import { TrustAssuranceReport } from "@/components/ive/trust-assurance-report";
import { EvidenceWeightChart } from "@/components/ive/evidence-weight-chart";
import { EvidenceDetailModal } from "@/components/ive/evidence-detail-modal";
import { ClaimAuditTrail } from "@/components/ive/claim-audit-trail";
import { SystemHealthMonitor } from "@/components/ive/system-health-monitor";
import { EvidenceTopology } from "@/components/ive/evidence-topology";
import { RolesView } from "@/components/vvu/roles-view";
import { PilotView } from "@/components/vvu/pilot-view";
import { GlossaryTerm } from "@/components/vvu/glossary-term";
import { GlossaryIndexDialog } from "@/components/vvu/glossary-index-dialog";
import { InteractiveTheoremProofs } from "@/components/vvu/theorem-proofs";
import { EvidenceSimulator } from "@/components/ive/evidence-simulator";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { UserMenu } from "@/components/auth/user-menu";
import {
  CommandPalette,
  CommandKBadge,
  consumePendingIVEAction,
  type PaletteView,
  type IVEAction,
} from "@/components/vvu/command-palette";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";
import {
  Shield, BookOpen, LayoutDashboard, ArrowRight, ArrowLeft,
  CheckCircle2, Lock, Activity, GitGraph, FileCode2,
  Scale, Building2, Globe2, Cpu, Zap, Sigma,
  ChevronRight, ExternalLink, Sparkles, Beaker,
  Calculator, Network, Eye, ShieldCheck, AlertTriangle,
  FileText, Layers, GraduationCap, Plus, Keyboard, Trash2,
  Search, X, ChevronDown, ChevronUp, BarChart3, Hash, Percent, CircuitBoard, PieChart,
  Users, GitCompare, Info, Rocket, Calendar,
  Library, FlaskConical, BookMarked, Dices,
  CornerDownRight
} from "lucide-react";
import type {
  ClaimWithRelations,
  AuthorizationResult,
  ParticipationRatioResult,
  EvidenceItem,
  CircuitBreakerRecord,
  VerificationState,
  ClaimType,
} from "@/lib/eis";

type View = "landing" | "docs" | "ive" | "roles" | "pilot";

// ─── Framer Motion Wrappers ───────────────────────────────────────────

function FadeInSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────

function AnimatedCounter({ value, duration = 1400 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display}</>;
}

function StaggerChild({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────

function VVUHeader({
  view,
  onNavigate,
  onOpenPalette,
  onOpenGlossary,
}: {
  view: View;
  onNavigate: (v: View) => void;
  onOpenPalette: () => void;
  onOpenGlossary: () => void;
}) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <ThreeRingsLogo size={32} />
          <span className="font-semibold text-base tracking-tight">VVU</span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground font-mono">
            SEARM Platform
          </span>
        </button>
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          {(["landing", "docs", "roles", "pilot", "ive"] as const).map((v) => {
            const labels: Record<View, string> = { landing: "Home", docs: "Docs", roles: "Roles", pilot: "Pilot", ive: "IVE" };
            const icons: Record<View, typeof Shield> = {
              landing: Sparkles,
              docs: BookOpen,
              roles: Users,
              pilot: Rocket,
              ive: LayoutDashboard,
            };
            const Icon = icons[v];
            return (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                onClick={() => onNavigate(v)}
                className="gap-1.5 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                {labels[v]}
              </Button>
            );
          })}
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGlossary}
            className="gap-1.5 text-xs"
            title="Open glossary (G)"
          >
            <Library className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Glossary</span>
          </Button>
          <CommandKBadge onClick={onOpenPalette} />
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          {session?.user ? (
            <UserMenu />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("ive")}
              className="gap-1.5 text-xs"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────

function VVUFooter() {
  return (
    <footer className="relative border-t bg-muted/30">
      {/* Subtle gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ThreeRingsLogo size={22} />
            <span className="text-sm font-semibold">VVU</span>
            <span className="text-xs text-muted-foreground/60">
              — Structural Evidence Accounting &amp; Redundancy Management
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
            <span className="font-mono">© 2025 VVU Inc.</span>
            <span aria-hidden>·</span>
            <span>Three Rings™</span>
            <span aria-hidden>·</span>
            <span>SEARM™</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground/40 font-mono">
          <span className="uppercase tracking-wider mr-1">Aligned:</span>
          <span className="rounded-sm border border-border/40 px-1.5 py-0.5 animate-pulse-once">EU AI Act</span>
          <span className="rounded-sm border border-border/40 px-1.5 py-0.5 animate-pulse-once" style={{ animationDelay: "0.1s" }}>NIST AI RMF</span>
          <span className="rounded-sm border border-border/40 px-1.5 py-0.5 animate-pulse-once" style={{ animationDelay: "0.2s" }}>SEC Compliance</span>
          <span className="rounded-sm border border-border/40 px-1.5 py-0.5 animate-pulse-once" style={{ animationDelay: "0.3s" }}>SOC 2 Type II</span>
          <span className="rounded-sm border border-border/40 px-1.5 py-0.5 animate-pulse-once" style={{ animationDelay: "0.4s" }}>ISO 27001</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing View ──────────────────────────────────────────────────────

function LandingView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b animate-border-glow">
        {/* Grid pattern overlay — lighter in dark mode */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-purple-500/[0.02] to-amber-500/5" />
        {/* Gradient Orbs */}
        <motion.div
          className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[80px]"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-10 -right-10 w-[300px] h-[300px] rounded-full bg-amber-500/15 dark:bg-amber-500/8 blur-[60px]"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[200px] h-[200px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[40px]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            className="flex flex-col items-center text-center gap-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="animate-float">
              <div className="animate-pulse-soft">
                <ThreeRingsLogo size={120} animated />
              </div>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Venture Vision Ubuntu
              </h1>
              <p className="mt-2 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Structural Evidence Accounting & Redundancy Management
              </p>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              VVU delivers mathematically rigorous structural evidence accounting for enterprise security.
              Our <GlossaryTerm term="SEARM">SEARM</GlossaryTerm> platform provides <GlossaryTerm term="Fail-closed">fail-closed</GlossaryTerm> authorization grounded in <GlossaryTerm term="Spectral Diversification">spectral diversification</GlossaryTerm>,
              <GlossaryTerm term="Participation Ratio">participation-ratio</GlossaryTerm> integrity metrics, and <GlossaryTerm term="Heat Kernel">heat-kernel diffusion</GlossaryTerm> guarantees — the
              <strong className="text-foreground"> Three Rings</strong> of verifiable trust.
            </p>
            {/* Animated Evidence Pipeline */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-2">
              {[
                { label: "Claim", icon: FileText, color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300" },
                { label: "Evidence", icon: GitGraph, color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300" },
                { label: "Verify", icon: ShieldCheck, color: "border-amber-500/40 text-amber-700 dark:text-amber-300" },
                { label: "Authorize", icon: Lock, color: "border-amber-500/40 text-amber-700 dark:text-amber-300" },
                { label: "Action", icon: Zap, color: "border-zinc-500/40 text-zinc-700 dark:text-zinc-300" },
              ].map(({ label, icon: PipelineIcon, color }, i) => (
                <Fragment key={label}>
                  <motion.div
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 bg-background/50 ${color}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + i * 0.15 }}
                  >
                    <PipelineIcon className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{label}</span>
                  </motion.div>
                  {i < 4 && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.3, delay: 0.9 + i * 0.15 }}
                    >
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    </motion.div>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => onNavigate("docs")}
                className="gap-2 text-base px-8 hover:shadow-lg transition-shadow"
              >
                Enter Workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate("ive")}
                className="gap-2 text-base border-foreground/20 hover:border-foreground/40 hover:shadow-md transition-shadow"
              >
                <LayoutDashboard className="h-4 w-4" />
                Launch IVE Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Epistemic Pivot */}
      <FadeInSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">The <GlossaryTerm term="Epistemic Pivot">Epistemic Pivot</GlossaryTerm></Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              From Oracle to SEARM
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The industry is pivoting from &ldquo;AI as oracle&rdquo; to &ldquo;AI as evidence system.&rdquo;
              VVU leads this shift by providing the mathematical infrastructure that makes
              evidence-based authorization <em>auditable</em>, <em>redundant</em>, and <em>fail-closed</em>.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: GitGraph,
                title: "Evidence is a Graph",
                desc: "Claims don't float in isolation. They sit in a provenance graph where every node carries verification state, and every edge carries semantic weight. VVU structures this graph formally.",
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Shield,
                title: "Authorization is Fail-Closed",
                desc: "When evidence is lost or stale, authorization is revoked — not degraded. The circuit breaker enforces loss of E → loss of V → loss of A, with mathematical guarantees.",
                color: "text-amber-600",
                bg: "bg-amber-500/10",
              },
              {
                icon: Calculator,
                title: "Independence is Spectral",
                desc: "Multiple sources ≠ independent sources. VVU uses participation-ratio (N_ind) from the eigenvalue spectrum of the evidence similarity matrix to distinguish truly independent corroboration from correlated duplication.",
                color: "text-gray-600",
                bg: "bg-gray-500/10",
              },
            ].map(({ icon: Icon, title, desc, color, bg }, index) => (
              <StaggerChild key={title} index={index}>
                <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                  <Card className="p-6 hover:shadow-md transition-all border-t-2 border-t-emerald-500/20">
                    <div className={`rounded-lg ${bg} w-10 h-10 flex items-center justify-center mb-4`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </Card>
                </motion.div>
              </StaggerChild>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* Three Rings Explained */}
      <FadeInSection>
        <section className="bg-muted/30 border-y relative">
          {/* Animated border glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-pulse" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent animate-pulse" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                The Three Rings
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                VVU's three pillars of verifiable trust, each ring a mathematical guarantee.
              </p>
            </div>
            {/* Decorative orbit element */}
            <div className="relative flex justify-center mb-8">
              <div className="relative w-0 h-0">
                <div className="absolute animate-orbit">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(5,150,105,0.5)]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-border/20">
              {[
                {
                  ring: 1,
                  color: "#059669",
                  bgClass: "bg-emerald-500/10",
                  borderClass: "border-emerald-500/30",
                  title: "Structural Accounting",
                  symbol: "N_ind, provenance graph",
                  desc: "The evidence graph is a first-class mathematical object. Every node carries verification state; every edge carries provenance metadata. The participation ratio N_ind = (∑λᵢ)²/∑λᵢ² counts truly independent evidence sources from the eigenvalue spectrum.",
                  theorem: "Theorem 2 (Spectral Diversification)",
                },
                {
                  ring: 2,
                  color: "#D97706",
                  bgClass: "bg-amber-500/10",
                  borderClass: "border-amber-500/30",
                  title: "Evidence Redundancy",
                  symbol: "E(c) = ∪ Eᵢ, multiple sources",
                  desc: "Claims are validated through a multi-source evidence mesh (you.com, brave, firecrawl, watchdog). Redundancy is measured not by source count but by spectral participation — correlated sources contribute a single effective degree of freedom.",
                  theorem: "Theorem 4 (Evidence Mesh Synthesis)",
                },
                {
                  ring: 3,
                  color: "#6B7280",
                  bgClass: "bg-gray-500/10",
                  borderClass: "border-gray-500/30",
                  title: "Mathematical Fidelity",
                  symbol: "A = C & E & I & S & R",
                  desc: "Authorization is a conjunction of five independent checks, each with a formal verification basis. The circuit breaker enforces fail-closed semantics: when evidence degrades, authorization is revoked with mathematical certainty, not heuristic fallback.",
                  theorem: "Theorem 1, 5 (Fail-Closed Authorization)",
                },
              ].map(({ ring, color, bgClass, title, symbol, desc, theorem }, index) => (
                <StaggerChild key={ring} index={index}>
                  <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                    <Card className="p-7 relative overflow-hidden hover:shadow-md transition-all md:rounded-none border-y-0 md:border-y-0 md:border-x-0" style={{ borderTop: `2px solid ${color}33` }}>
                      <div
                        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
                        style={{ backgroundColor: color, transform: "translate(30%, -30%)" }}
                      />
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`rounded-full ${bgClass} w-10 h-10 flex items-center justify-center font-mono text-lg font-bold`} style={{ color }}>
                          {ring}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">{title}</h3>
                          <p className="text-[11px] font-mono text-muted-foreground">{symbol}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                      <Badge variant="outline" className="text-[9px] font-mono">{theorem}</Badge>
                    </Card>
                  </motion.div>
                </StaggerChild>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Products */}
      <FadeInSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
            <p className="mt-3 text-muted-foreground">
              Enterprise-grade evidence infrastructure, from platform to pilot.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: "SEARM Platform",
                desc: "The core Structural Evidence Accounting & Redundancy Management platform. Full IVE dashboard, evidence mesh, authorization engine, and circuit breaker. Deploy on-premises or cloud.",
                features: ["IVE Dashboard", "Evidence Mesh (4-source)", "Authorization Engine", "Circuit Breaker", "N_ind Computation", "Heat Kernel Diffusion"],
              },
              {
                icon: Beaker,
                title: "BA-1 Calibration Pilot",
                desc: "A structured 90-day pilot program to calibrate VVU's evidence thresholds against your organization's risk profile. Includes SafeGrid and SafeStacks integration.",
                features: ["Threshold Calibration", "Risk Profiling", "SafeGrid Integration", "SafeStacks Clearance", "90-day Timeline", "Dedicated Support"],
              },
              {
                icon: FileText,
                title: "Trust Assurance Report",
                desc: "Quarterly attestations documenting evidence coverage, authorization rates, circuit breaker events, and N_ind distributions. Audit-ready for regulators.",
                features: ["Quarterly Cadence", "Evidence Coverage Metrics", "Authorization Audit Trail", "Regulator-ready Format", "SOC 2 Evidence", "EU AI Act Compliance"],
              },
            ].map(({ icon: Icon, title, desc, features }, index) => (
              <StaggerChild key={title} index={index}>
                <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                  <Card className="p-6 flex flex-col hover:shadow-md transition-all border-t-2 border-t-amber-500/20">
                    <div className="rounded-lg bg-muted/50 w-10 h-10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{desc}</p>
                    <div className="space-y-1.5">
                      {features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </StaggerChild>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* Licensing */}
      <FadeInSection>
        <section className="bg-muted/30 border-y">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Licensing & Programs</h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Flexible engagement models from self-serve to white-glove.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Building2,
                  title: "Enterprise License",
                  desc: "Full SEARM platform with unlimited claims, dedicated support, custom threshold calibration, and SLA-backed circuit breaker guarantees.",
                  highlight: "Unlimited claims, SLA-backed",
                },
                {
                  icon: GraduationCap,
                  title: "Professional Services",
                  desc: "Integration engineering, evidence mesh customization, regulatory alignment workshops, and bespoke authorization policy development.",
                  highlight: "Custom integration, regulatory alignment",
                },
                {
                  icon: Eye,
                  title: "Lighthouse Program",
                  desc: "Early-access program for qualifying organizations. Deploy SEARM in a monitored environment with VVU engineering oversight and shared learnings.",
                  highlight: "Early access, engineering oversight",
                },
              ].map(({ icon: Icon, title, desc, highlight }, index) => (
                <StaggerChild key={title} index={index}>
                  <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                    <Card className="p-6 hover:shadow-md transition-all border-t-2 border-t-gray-500/20">
                      <div className="rounded-lg bg-muted/50 w-10 h-10 flex items-center justify-center mb-4">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">{title}</h3>
                      <Badge variant="secondary" className="text-[9px] mb-3">{highlight}</Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </Card>
                  </motion.div>
                </StaggerChild>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Regulatory Compliance */}
      <FadeInSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Regulatory Alignment</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Built for compliance from the ground up. VVU's mathematical guarantees map directly to regulatory requirements.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Globe2,
                name: "EU AI Act",
                items: ["Article 9: Risk management", "Article 14: Human oversight", "Article 15: Accuracy metrics", "Annex IV: Technical documentation"],
              },
              {
                icon: Scale,
                name: "NIST AI RMF",
                items: ["MAP 1.1: Context", "MEASURE 2.3: Trustworthiness", "MANAGE 1.1: Risk treatment", "GOVERN 1.3: Accountability"],
              },
              {
                icon: Building2,
                name: "SEC Compliance",
                items: ["Rule 17a-4: Record retention", "SOX 404: Internal controls", "Model risk management", "Audit trail requirements"],
              },
              {
                icon: ShieldCheck,
                name: "SOC 2, Type II",
                items: ["CC6.1: Logical access", "CC7.1: Detection & monitoring", "CC9.1: Risk mitigation", "Evidence preservation"],
              },
            ].map(({ icon: Icon, name, items }, index) => (
              <StaggerChild key={name} index={index}>
                <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                  <Card className="p-5 hover:shadow-md transition-all border-t-2 border-t-emerald-500/15">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">{name}</h3>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </StaggerChild>
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* Metrics */}
      <FadeInSection>
        <section className="bg-muted/30 border-y">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                By the Numbers
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                The mathematical foundations that make SEARM auditable, redundant, and fail-closed.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { value: 5, label: "Theorems", sub: "Formal guarantees", accent: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
                { value: 4, label: "Evidence Sources", sub: "Independent mesh", accent: "bg-amber-500/10", ring: "ring-amber-500/20" },
                { value: 9, label: "Verification States", sub: "Full lattice", accent: "bg-purple-500/10", ring: "ring-purple-500/20" },
                { value: 0, label: "Auth when Falsified", sub: "Fail-closed", accent: "bg-rose-500/10", ring: "ring-rose-500/20" },
              ].map(({ value, label, sub, accent, ring }, index) => (
                <StaggerChild key={label} index={index}>
                  <div className={`shimmer-overlay text-center rounded-xl ${accent} p-8 ring-1 ${ring}`}>
                    <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tighter">
                      <AnimatedCounter value={value} />
                    </div>
                    <div className="text-sm font-semibold mt-2">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                    <div className="mt-3 flex justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${ring.replace('ring-', 'bg-').replace('/20', '/40')}`} />
                    </div>
                  </div>
                </StaggerChild>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* CTA */}
      <FadeInSection>
        <section className="relative overflow-hidden border-2 border-emerald-500/20 animate-gradient-border">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-purple-500/5 to-amber-500/10 animate-gradient-shift" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
            <div className="text-center">
              <div className="inline-block animate-pulse-soft">
                <ThreeRingsLogo size={64} animated />
              </div>
              <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight">
                Ready to verify your evidence?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Enter the workspace to explore documentation, or launch the IVE dashboard
                to see structural evidence accounting in action.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => onNavigate("docs")} className="gap-2 px-8 hover:shadow-lg transition-shadow">
                  Enter Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate("ive")} className="gap-2 border-foreground/20 hover:border-foreground/40 hover:shadow-md transition-shadow">
                  <LayoutDashboard className="h-4 w-4" />
                  Launch IVE
                </Button>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
}

// ─── Docs View ─────────────────────────────────────────────────────────

const DOC_SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "eis", label: "EIS Specification", icon: FileCode2 },
  { id: "api", label: "API Reference", icon: Cpu },
  { id: "theorems", label: "Theorems", icon: Sigma },
  { id: "authorization", label: "Authorization", icon: Lock },
  { id: "evidence-mesh", label: "Evidence Mesh", icon: Network },
  { id: "calibration", label: "Calibration", icon: Activity },
  { id: "regulatory", label: "Regulatory", icon: Scale },
  { id: "glossary", label: "Glossary", icon: BookOpen },
] as const;

type DocSectionId = (typeof DOC_SECTIONS)[number]["id"];

const DOC_TOC_HEADINGS: Record<string, Array<{ id: string; label: string }>> = {
  overview: [
    { id: "architecture", label: "Architecture" },
    { id: "core-components", label: "Core Components" },
  ],
  eis: [
    { id: "verification-state-lattice", label: "Verification State Lattice" },
    { id: "claim-type-caps", label: "Claim Type Caps" },
    { id: "key-types", label: "Key Types" },
  ],
  api: [
    { id: "api-endpoints", label: "API Endpoints" },
  ],
  theorems: [
    { id: "theorem-1", label: "Theorem 1: Fail-Closed" },
    { id: "theorem-2", label: "Theorem 2: Spectral" },
    { id: "theorem-3", label: "Theorem 3: Heat Kernel" },
    { id: "theorem-4", label: "Theorem 4: Lattice" },
    { id: "theorem-5", label: "Theorem 5: Circuit Breaker" },
  ],
  authorization: [
    { id: "conjuncts", label: "Five Conjuncts" },
  ],
  "evidence-mesh": [
    { id: "mesh-sources", label: "Mesh Sources" },
  ],
  calibration: [
    { id: "tunable-params", label: "Tunable Parameters" },
  ],
  regulatory: [
    { id: "eu-ai-act", label: "EU AI Act" },
    { id: "nist-ai-rmf", label: "NIST AI RMF" },
    { id: "sec-sox", label: "SEC & SOX" },
  ],
  glossary: [
    { id: "terms", label: "Terms" },
  ],
};

function DocsToC({ sectionId }: { sectionId: string }) {
  const headings = DOC_TOC_HEADINGS[sectionId] ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observers: IntersectionObserver[] = [];

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(id);
          }
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [headings, sectionId]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-14">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
        Contents
      </p>
      <ul className="space-y-1 border-l border-border/40">
        {headings.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <button
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                className={`block w-full text-left pl-3 py-0.5 text-[11px] transition-colors border-l-2 -ml-px ${
                  isActive
                    ? "border-l-emerald-500 text-foreground font-semibold"
                    : "border-l-transparent text-muted-foreground hover:text-foreground hover:border-l-border"
                }`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DocsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [activeSection, setActiveSection] = useState<DocSectionId>("overview");

  const sectionGroups = [
    { label: "Reference", ids: ["overview", "eis", "api"] as DocSectionId[] },
    { label: "Formal", ids: ["theorems", "authorization", "evidence-mesh"] as DocSectionId[] },
    { label: "Operations", ids: ["calibration", "regulatory", "glossary"] as DocSectionId[] },
  ];

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 border-r bg-gradient-to-b from-muted/30 via-muted/15 to-muted/5">
        <div className="sticky top-14 p-4 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <ThreeRingsLogo size={20} />
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
              Documentation
            </p>
          </div>
          {sectionGroups.map((group, gIdx) => (
            <div
              key={group.label}
              className={`mb-3 ${gIdx > 0 ? "mt-4 pt-4 border-t border-border/40" : ""}`}
            >
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60 mb-1.5 px-2.5">
                {group.label}
              </p>
              {group.ids.map((id) => {
                const section = DOC_SECTIONS.find((s) => s.id === id);
                if (!section) return null;
                const Icon = section.icon;
                const isActive = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-1.5 text-xs transition-all relative ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold border-l-[3px] border-l-emerald-500 shadow-sm shadow-emerald-500/10"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border-l-[3px] border-l-transparent"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-500" : ""}`} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          ))}
          <Separator className="my-4" />
          <Button
            size="sm"
            className="w-full gap-2 text-xs font-semibold shadow-sm"
            onClick={() => onNavigate("ive")}
          >
            <Cpu className="h-3.5 w-3.5" />
            Launch IVE
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
              {/* Mobile section selector */}
              <div className="md:hidden mb-6">
                <div className="flex flex-wrap gap-1.5">
                  {DOC_SECTIONS.map(({ id, label }) => (
                    <Badge
                      key={id}
                      variant={activeSection === id ? "default" : "outline"}
                      className="cursor-pointer text-[10px]"
                      onClick={() => setActiveSection(id)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {activeSection === "overview" && <DocsOverview onNavigate={onNavigate} />}
              {activeSection === "eis" && <DocsEIS />}
              {activeSection === "api" && <DocsAPI />}
              {activeSection === "theorems" && <DocsTheorems />}
              {activeSection === "authorization" && <DocsAuthorization />}
              {activeSection === "evidence-mesh" && <DocsEvidenceMesh />}
              {activeSection === "calibration" && <DocsCalibration />}
              {activeSection === "regulatory" && <DocsRegulatory />}
              {activeSection === "glossary" && <DocsGlossary />}

              {/* Launch IVE CTA */}
              <div className="mt-12 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-amber-500/5 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-base font-semibold">Launch IVE Dashboard</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                      The Integrated Verification Environment provides live claim management, 
                      multi-source evidence ingestion, real-time authorization evaluation, 
                      spectral independence metrics, and heat kernel diffusion traces.
                    </p>
                  </div>
                  <Button
                    onClick={() => onNavigate("ive")}
                    className="gap-2 shadow-sm shrink-0"
                  >
                    <Cpu className="h-4 w-4" />
                    Launch IVE
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents sidebar */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="px-4 pt-8">
              <DocsToC sectionId={activeSection} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="max-w-none text-sm leading-relaxed text-muted-foreground scroll-mt-20">
      <h1 className="text-2xl font-bold tracking-tight mb-6 pb-3 border-b-2 border-emerald-500/30 text-foreground scroll-mt-20">{title}</h1>
      <div className="space-y-1 text-sm leading-relaxed [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:scroll-mt-20 [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:scroll-mt-20 [&>p]:leading-relaxed">
        {children}
      </div>
    </article>
  );
}

// ─── Code Block Helper ────────────────────────────────────────────────

function CodeBlock({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-lg border border-l-4 border-l-emerald-500/40 bg-muted/20 p-4 font-mono text-xs ${className ?? ""}`}
    >
      {label && (
        <span className="absolute top-2 right-2 rounded border border-border/60 bg-background/80 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

function DocsOverview({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <DocSection title="VVU — Overview">
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Venture Vision Ubuntu (VVU) delivers the <strong>SEARM Platform</strong> —
        Structural Evidence Accounting & Redundancy Management — for enterprises that
        require mathematically rigorous, fail-closed authorization for security-critical decisions.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        VVU is not an AI oracle. It is an <em>evidence infrastructure</em>: a system that
        structures, verifies, and authorizes claims through a formally defined evidence graph,
        spectral independence metrics, and a five-conjunct authorization formula with
        circuit-breaker guarantees.
      </p>

      <h2 id="architecture" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Architecture</h2>

      {/* Architecture Diagram Pipeline */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-[480px]">
          {[
            { label: "Claim", color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400", icon: FileCode2 },
            { label: "Evidence", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400", icon: Network },
            { label: "Verification", color: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400", icon: ShieldCheck },
            { label: "Authorization", color: "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400", icon: Lock },
            { label: "Action", color: "bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400", icon: Zap },
          ].map(({ label, color, icon: Icon }, idx, arr) => (
            <div key={label} className="flex items-center">
              <div className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-4 py-3 min-w-[80px] ${color}`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="flex items-center px-1.5 text-muted-foreground/50">
                  <div className="w-3 h-px bg-muted-foreground/30" />
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Each layer depends on the one below. Loss propagates upward through the circuit breaker.
        </p>
      </div>

      <h2 id="core-components" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Core Components</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          { title: "EIS (Evidence Independence Specification)", desc: "The mathematical engine. Types, lattice operations, participation ratio, heat kernel, authorization, circuit breaker." },
          { title: "IVE (Integrated Verification Environment)", desc: "The dashboard. Claim management, evidence ingestion, authorization panels, N_ind visualization, heat kernel traces." },
          { title: "Evidence Mesh", desc: "4-source synthesis: you.com, brave, firecrawl, watchdog. Each source contributes to the provenance graph with independent embeddings." },
          { title: "Authorization Engine", desc: "A = C & E & I & S & R. Five conjuncts, each independently verifiable. Fail-closed: any conjunct failure blocks authorization." },
        ].map(({ title, desc }) => (
          <Card key={title} className="p-4">
            <h3 className="text-sm font-semibold mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold">Try the IVE Dashboard</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          See the full verification environment in action with live claim management,
          evidence mesh, authorization, and mathematical panels.
        </p>
        <Button size="sm" onClick={() => onNavigate("ive")} className="gap-1.5 shadow-sm">
          <Cpu className="h-3.5 w-3.5" />
          Launch IVE Dashboard
        </Button>
      </div>
    </DocSection>
  );
}

function DocsEIS() {
  return (
    <DocSection title="Evidence Independence Specification (EIS)">
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        The EIS is VVU's mathematical core. It defines the type system, lattice operations,
        spectral independence metrics, heat kernel diffusion, authorization logic, and
        circuit breaker semantics.
      </p>

      <h2 id="verification-state-lattice" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Verification State Lattice</h2>
      <CodeBlock label="LATTICE" className="leading-relaxed mb-4">
        <p>PROVEN ≥ VERIFIED ≥ SUPPORTED ≥ OBSERVED ≥ INCONCLUSIVE ≥ UNVALIDATED ≥ UNTESTED ≥ STALE</p>
        <p className="mt-2">FALSIFIED — incomparable, terminal denial</p>
      </CodeBlock>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        The lattice is <em>partial</em>: FALSIFIED is incomparable with all positive states.
        Once a claim reaches FALSIFIED, all authorization is revoked permanently (until
        reverification restores the evidence bound).
      </p>

      <h2 id="claim-type-caps" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Claim Type Caps</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Claim types impose <em>upper bounds</em> on achievable verification states:
      </p>
      <CodeBlock label="CAPS" className="mb-4 space-y-1">
        <p>mathematical → cap = PROVEN</p>
        <p>semantic → cap = VERIFIED</p>
        <p>empirical → cap = SUPPORTED</p>
        <p>operational → cap = OBSERVED</p>
      </CodeBlock>

      <h2 id="key-types" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Key Types</h2>
      <CodeBlock label="TYPES" className="leading-loose mb-4">
        <p>VerificationState = &quot;PROVEN&quot; | &quot;VERIFIED&quot; | &quot;SUPPORTED&quot; | ... | &quot;FALSIFIED&quot;</p>
        <p>ClaimType = &quot;mathematical&quot; | &quot;semantic&quot; | &quot;empirical&quot; | &quot;operational&quot;</p>
        <p>EvidenceSource = &quot;you.com&quot; | &quot;brave&quot; | &quot;firecrawl&quot; | &quot;watchdog&quot;</p>
        <p>AuthorizationResult = {`{ authorized, claimOk, evidenceOk, integrityOk, safetyOk, reviewOk, reason }`}</p>
        <p>ParticipationRatioResult = {`{ nInd, numEvidence, numSources, gamma, eigenvalues }`}</p>
      </CodeBlock>
    </DocSection>
  );
}

function DocsAPI() {
  return (
    <DocSection title="API Reference">
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        All VVU API routes are RESTful, return JSON, and follow standard HTTP status codes.
      </p>
      <h2 id="api-endpoints" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">API Endpoints</h2>
      {[
        { method: "GET", path: "/api/claims", desc: "List all claims with relations (evidence, authorizations, circuit events, N_ind records)." },
        { method: "POST", path: "/api/claims", desc: "Create a new claim. Body: { title, description, claimType, intendedAction, safetyCritical }." },
        { method: "GET", path: "/api/claims/:id", desc: "Get a single claim with all relations." },
        { method: "PATCH", path: "/api/claims/:id", desc: "Update claim fields." },
        { method: "DELETE", path: "/api/claims/:id", desc: "Delete a claim and cascade all-destroy all relations." },
        { method: "POST", path: "/api/evidence", desc: "Ingest evidence. Body: { claimId, source, content, weight? } or { claimId, fullMesh: true }." },
        { method: "GET", path: "/api/evidence?claimId=...", desc: "List evidence for a claim." },
        { method: "POST", path: "/api/verify", desc: "Run IVE verification pass on a claim. Recomputes claim state from evidence." },
        { method: "POST", path: "/api/authorize", desc: "Evaluate authorization A = C & E & I & S & R for a claim." },
        { method: "POST", path: "/api/n-ind", desc: "Compute participation ratio N_ind for a claim's evidence." },
        { method: "GET", path: "/api/n-ind?claimId=...", desc: "List N_ind computation records." },
        { method: "POST", path: "/api/heat-kernel", desc: "Run heat kernel diffusion. Body: { topology, kappa, steps, n?, claimId? }." },
        { method: "GET", path: "/api/state", desc: "Get full IVE system state with summary metrics." },
        { method: "POST", path: "/api/seed", desc: "Idempotent seed with 3 demo claims." },
      ].map(({ method, path, desc }) => (
        <div key={`${method}-${path}`} className="flex gap-3 mb-3">
          <Badge variant={method === "GET" ? "secondary" : "default"} className="font-mono text-[10px] shrink-0 mt-0.5">
            {method}
          </Badge>
          <div>
            <code className="text-xs font-mono">{path}</code>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </DocSection>
  );
}

function DocsTheorems() {
  const [expandedTheorem, setExpandedTheorem] = useState<number | null>(null);
  const theoremColors = [
    "border-emerald-500/40",
    "border-emerald-500/30",
    "border-amber-500/40",
    "border-amber-500/30",
    "border-gray-500/40",
  ];
  const emblemColors = [
    "bg-emerald-500 text-white",
    "bg-emerald-600 text-white",
    "bg-amber-500 text-white",
    "bg-amber-600 text-white",
    "bg-gray-500 text-white",
  ];

  const theorems = [
    {
      num: 1,
      title: "Fail-Closed Authorization",
      summary: "Authorization is binary and fail-closed.",
      statement: "A = C & E & I & S & R. If any conjunct is false, A = FALSE and all authorization is revoked.",
      implication: "Authorization cannot &ldquo;degrade gracefully.&rdquo; It is binary and fail-closed.",
    },
    {
      num: 2,
      title: "Spectral Diversification (Participation Ratio)",
      summary: "N_ind correctly counts independent evidence sources.",
      statement: "N_ind = (∑λᵢ)² / ∑λᵢ² is monotonic in the true latent source count m. N_ind ≤ m always, with equality when sources are orthogonal.",
      implication: "N_ind correctly counts independent sources even when observed sources are correlated.",
    },
    {
      num: 3,
      title: "Heat Kernel Smoothing",
      summary: "Diffusion preserves structural evidence while smoothing noise.",
      statement: "The heat kernel e^{-tL} on the evidence graph Laplacian L = D − A decays monotonically and suppresses high-frequency modes, preserving the low-frequency (structural) signal.",
      implication: "Diffusion on the evidence graph smooths noisy observations while preserving structural evidence.",
    },
    {
      num: 4,
      title: "Lattice Consistency",
      summary: "Claim-type caps ensure no claim exceeds its type's strength.",
      statement: "The verification state lattice is a partial order with FALSIFIED as an incomparable element. Claim-type caps preserve lattice consistency: state(c) ≤ cap(type(c)).",
      implication: "No claim can claim a verification state stronger than its type permits. Mathematical claims can reach PROVEN; operational claims cap at OBSERVED.",
    },
    {
      num: 5,
      title: "Circuit Breaker Guarantee",
      summary: "Authorization revoked when evidence is compromised.",
      statement: "When the circuit breaker trips (evidence lost, verification failed, safety violation, stale evidence, or integrity breach), all authorization is revoked: loss of E → loss of V → loss of A.",
      implication: "The system cannot authorize when evidence is compromised. Recovery requires reverification.",
    },
  ];

  return (
    <DocSection title="Theorems">
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        VVU&apos;s guarantees are grounded in five formal theorems. Each theorem is referenced
        throughout the IVE dashboard and documentation. Click to expand.
      </p>
      {theorems.map(({ num, title, summary, statement, implication }) => {
        const isExpanded = expandedTheorem === num;
        return (
          <Card
            key={num}
            id={`theorem-${num}`}
            className={`p-5 mb-4 border-l-4 ${theoremColors[num - 1]} hover:shadow-sm transition-shadow cursor-pointer`}
            onClick={() => setExpandedTheorem(isExpanded ? null : num)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono shrink-0 ${emblemColors[num - 1]}`}>
                {num}
              </div>
              <h3 className="text-sm font-semibold flex-1">{title}</h3>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </div>
            {!isExpanded && (
              <p className="text-xs text-muted-foreground mt-2 ml-11">{summary}</p>
            )}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3">
                    <div className="rounded-md bg-muted/30 p-3 font-mono text-xs leading-relaxed mb-3 border border-muted/50">
                      {statement}
                    </div>
                    <div className="border-l-4 border-amber-500 bg-amber-500/5 pl-3 py-2 pr-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Implication:</strong> {implication}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      {/* Interactive Proof Sketches — deeper dive */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-emerald-500" />
          <h3 className="text-base font-semibold tracking-tight">Interactive Proof Sketches</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Step-by-step derivations for each theorem. Click any theorem to expand its proof.
        </p>
        <InteractiveTheoremProofs />
      </div>
    </DocSection>
  );
}

function DocsAuthorization() {
  return (
    <DocSection title="Authorization">
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Authorization in VVU is a five-conjunct formula with fail-closed semantics.
      </p>
      <h2 id="conjuncts" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Five Conjuncts</h2>
      <div
        className="rounded-lg border bg-muted/20 p-4 mb-6 flex items-center justify-center gap-2 flex-wrap"
        title="A = C ∧ E ∧ I ∧ S ∧ R"
      >
        <span className="font-mono text-lg font-bold">A =</span>
        {["C", "E", "I", "S", "R"].map((sym, i) => (
          <span key={sym} className="flex items-center gap-2">
            <span className="inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 font-mono text-base font-bold text-emerald-700 dark:text-emerald-300">
              {sym}
            </span>
            {i < 4 && <span className="text-base text-muted-foreground/70 font-mono" aria-hidden>&middot;</span>}
          </span>
        ))}
      </div>
      {[
        { sym: "C", name: "Claim", desc: "The claim's verification state is at or above AUTH_THRESHOLD (SUPPORTED by default)." },
        { sym: "E", name: "Evidence", desc: "At least 2 distinct sources or at least 3 evidence items are present." },
        { sym: "I", name: "Integrity", desc: "N_ind ≥ 2 for safety-critical claims, or N_ind ≥ 1 otherwise." },
        { sym: "S", name: "Safety", desc: "SafeGrid / SafeStacks clearance is confirmed. Only required for safety-critical claims." },
        { sym: "R", name: "Review", desc: "Second-reviewer signoff is present. Only required for safety-critical claims." },
      ].map(({ sym, name, desc }) => (
        <div key={sym} className="flex gap-3 mb-3 items-start">
          <div className="rounded-md bg-muted/50 p-2 font-mono text-sm font-bold shrink-0 w-8 text-center">
            {sym}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
      <div className="mt-6 border-l-4 border-amber-500 bg-amber-500/5 pl-4 py-3 pr-4">
        <p className="text-xs text-amber-800 dark:text-amber-200 font-mono leading-relaxed">
          ⚠ S and R are only evaluated for safety-critical claims. For non-safety claims, they are
          treated as vacuously true (no safety clearance or review required).
        </p>
      </div>
    </DocSection>
  );
}

function DocsEvidenceMesh() {
  return (
    <DocSection title="Evidence Mesh">
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        The Evidence Mesh synthesizes evidence from four independent source types into a
        unified provenance graph.
      </p>
      <h2 id="mesh-sources" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Mesh Sources</h2>
      <CodeBlock label="FORMULA" className="mb-6">
        E(c) = E_you.com ∪ E_brave ∪ E_firecrawl ∪ E_watchdog
      </CodeBlock>
      {[
        { source: "you.com", desc: "AI-powered search with semantic understanding. Provides structured answers and citations.", icon: "🔍" },
        { source: "brave", desc: "Privacy-preserving web search. Provides diverse web results with minimal query fingerprint.", icon: "🌐" },
        { source: "firecrawl", desc: "Web scraping and content extraction. Provides full-text content from authoritative pages.", icon: "📄" },
        { source: "watchdog", desc: "Operational monitoring. Provides real-time metrics, alerts, and system health observations.", icon: "📊" },
      ].map(({ source, desc }) => (
        <Card key={source} className="p-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-xs font-mono font-semibold">{source}</code>
          </div>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </Card>
      ))}
      <div className="mt-6 border-l-4 border-amber-500 bg-amber-500/5 pl-4 py-3 pr-4">
        <p className="text-xs text-amber-800 dark:text-amber-200 font-mono leading-relaxed">
          ⚠ Multiple sources ≠ independent. The participation ratio N_ind (Theorem 2) is required
          to distinguish true independent corroboration from correlated duplication. A mesh with
          4 sources from a single latent cause will report N_ind ≈ 1, not 4.
        </p>
      </div>
    </DocSection>
  );
}

function DocsCalibration() {
  return (
    <DocSection title="Calibration">
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        VVU's evidence thresholds are calibrated to the organization's risk profile through
        the BA-1 Calibration Pilot.
      </p>
      <h2 id="tunable-params" className="text-lg font-semibold mt-6 mb-3 pl-3 border-l-2 border-emerald-500">Tunable Parameters</h2>
      <div className="space-y-3 mb-6">
        {[
          { param: "AUTH_THRESHOLD", default: "SUPPORTED", desc: "Minimum verification state for authorization. Lower = more permissive; higher = more conservative." },
          { param: "N_IND_SAFETY_THRESHOLD", default: "2", desc: "Minimum participation ratio for safety-critical claims. Requires truly independent evidence from ≥2 latent sources." },
          { param: "N_IND_GENERAL_THRESHOLD", default: "1", desc: "Minimum participation ratio for non-safety claims." },
          { param: "STALE_WINDOW_MS", default: "86400000 (24h)", desc: "Time after which evidence transitions to STALE. Circuit breaker may trip." },
          { param: "HEAT_KERNEL_KAPPA", default: "0.25", desc: "Diffusion rate for heat kernel smoothing. Higher = faster smoothing, more noise suppression." },
        ].map(({ param, default: def, desc }) => (
          <div key={param} className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs font-mono font-semibold">{param}</code>
              <Badge variant="outline" className="text-[9px] font-mono">default: {def}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </DocSection>
  );
}

function DocsRegulatory() {
  return (
    <DocSection title="Regulatory Alignment">
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        VVU's mathematical guarantees provide direct evidence for regulatory compliance.
      </p>
      <h2 id="eu-ai-act" className="text-lg font-semibold mt-6 mb-3 pl-3 border-l-2 border-emerald-500">EU AI Act</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        VVU addresses Article 9 (risk management), Article 14 (human oversight),
        Article 15 (accuracy metrics), and Annex IV (technical documentation) by providing
        mathematically grounded evidence for each claim's verification state, authorization
        decision, and circuit breaker status.
      </p>
      <h2 id="nist-ai-rmf" className="text-lg font-semibold mt-6 mb-3 pl-3 border-l-2 border-emerald-500">NIST AI Risk Management Framework</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        The SEARM platform directly supports MAP 1.1 (contextual risk identification),
        MEASURE 2.3 (trustworthiness measurement via N_ind and verification states),
        MANAGE 1.1 (risk treatment via circuit breaker), and GOVERN 1.3 (accountability
        via authorization audit trail).
      </p>
      <h2 id="sec-sox" className="text-lg font-semibold mt-6 mb-3 pl-3 border-l-2 border-emerald-500">SEC &amp; SOX</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        The authorization audit trail (every A = TRUE/FALSE decision with reason and
        timestamp) satisfies SEC Rule 17a-4 record retention and SOX 404 internal
        controls requirements.
      </p>
    </DocSection>
  );
}

function DocsGlossary() {
  const terms: Array<{ term: string; def: string }> = [
    { term: "SEARM", def: "Structural Evidence Accounting & Redundancy Management. VVU's core methodology." },
    { term: "EIS", def: "Evidence Independence Specification. The mathematical engine defining types, lattice, participation ratio, heat kernel, authorization, and circuit breaker." },
    { term: "IVE", def: "Integrated Verification Environment. The dashboard for claim management and verification." },
    { term: "N_ind", def: "Participation ratio. N_ind = (∑λᵢ)² / ∑λᵢ². Counts truly independent evidence sources from the eigenvalue spectrum." },
    { term: "AUTH_THRESHOLD", def: "Minimum verification state required for authorization. Default: SUPPORTED." },
    { term: "Circuit Breaker", def: "Fail-closed mechanism that revokes authorization when evidence is compromised." },
    { term: "Evidence Mesh", def: "Multi-source evidence synthesis: E(c) = E_you.com ∪ E_brave ∪ E_firecrawl ∪ E_watchdog." },
    { term: "Heat Kernel", def: "Diffusion operator e^{-tL} on the evidence graph Laplacian. Smooths noisy observations while preserving structure." },
    { term: "FALSIFIED", def: "Terminal denial state. Incomparable in the lattice. All authorization revoked." },
    { term: "Fail-Closed", def: "When evidence is lost or degraded, authorization is revoked (not degraded). Loss of E → loss of V → loss of A." },
    { term: "Participation Ratio", def: "Spectral metric of effective independent source count. Monotonic in true source count m." },
    { term: "Provenance Graph", def: "Directed graph where nodes are claims/evidence and edges are verification/derivation relationships." },
  ];
  return (
    <DocSection title="Glossary">
      <h2 id="terms" className="text-lg font-semibold mt-8 mb-3 pl-3 border-l-2 border-emerald-500">Terms</h2>
      <div className="space-y-3">
        {terms.map(({ term, def }) => (
          <div key={term} className="flex gap-3">
            <code className="text-xs font-mono font-semibold shrink-0 min-w-[140px]">{term}</code>
            <p className="text-xs text-muted-foreground">{def}</p>
          </div>
        ))}
      </div>
    </DocSection>
  );
}

// ─── IVE View ──────────────────────────────────────────────────────────

function IVEView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { data: session, status: sessionStatus } = useSession();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [claims, setClaims] = useState<ClaimWithRelations[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [computingNInd, setComputingNInd] = useState(false);

  // New Claim modal state
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [newClaimTitle, setNewClaimTitle] = useState("");
  const [newClaimDesc, setNewClaimDesc] = useState("");
  const [newClaimType, setNewClaimType] = useState<string>("empirical");
  const [newClaimAction, setNewClaimAction] = useState("");
  const [newClaimSafety, setNewClaimSafety] = useState(false);
  const [creating, setCreating] = useState(false);

  // Shortcuts help dialog
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Evidence detail modal state
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [evidenceDetailOpen, setEvidenceDetailOpen] = useState(false);

  // Claim deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sidebar search/filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ClaimType | "all">("all");
  const [filterState, setFilterState] = useState<VerificationState | "all">("all");

  // Claim comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const { toast } = useToast();

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) ?? null;

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/claims");
      if (res.ok) {
        const data = await res.json();
        const claimList = Array.isArray(data.claims) ? data.claims : Array.isArray(data) ? data : [];
        setClaims(claimList);
        if (claimList.length > 0 && !selectedClaimId) {
          setSelectedClaimId(claimList[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedClaimId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Keyboard shortcuts (IVE-specific; navigation shortcuts handled globally in Home)
  useKeyboardShortcuts({
    onNewClaim: () => setNewClaimOpen(true),
    onRefresh: () => fetchClaims(),
    onSeed: () => handleSeed(),
    onIngest: () => selectedClaimId && handleIngest(),
    onAuthorize: () => selectedClaimId && handleAuthorize(false, false),
    enabled: true,
  });

  // ─── Command palette bridge ────────────────────────────────────────
  // On mount, consume any pending IVE action that was set by the command
  // palette before IVEView mounted. Also listen for live "vvu-ive-action"
  // events (dispatched when IVE is already mounted and the user picks a
  // command from the palette).
  useEffect(() => {
    const handleAction = (action: IVEAction) => {
      switch (action) {
        case "newClaim":
          setNewClaimOpen(true);
          break;
        case "refresh":
          void fetchClaims();
          toast({ title: "Claims refreshed" });
          break;
        case "seed":
          void handleSeed();
          break;
        case "toggleCompare":
          setCompareMode((prev) => {
            const next = !prev;
            if (!next) {
              setCompareIds([]);
              setCompareDialogOpen(false);
            }
            toast({
              title: next ? "Compare mode on" : "Compare mode off",
              description: next
                ? "Select 2–3 claims from the sidebar."
                : undefined,
            });
            return next;
          });
          break;
      }
    };

    // Consume any pending action set before this view mounted.
    const pending = consumePendingIVEAction();
    if (pending) {
      // Defer one tick so the view has rendered before mutating state.
      setTimeout(() => handleAction(pending), 0);
    }

    const onLiveEvent = (e: Event) => {
      const detail = (e as CustomEvent<IVEAction>).detail;
      if (detail) handleAction(detail);
    };
    window.addEventListener("vvu-ive-action", onLiveEvent as EventListener);
    return () => {
      window.removeEventListener("vvu-ive-action", onLiveEvent as EventListener);
    };
  }, [fetchClaims]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      await fetchClaims();
      toast({ title: "Demo data seeded", description: "3 claims created" });
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateClaim = async () => {
    if (!newClaimTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newClaimTitle.trim(),
          description: newClaimDesc.trim(),
          claimType: newClaimType,
          intendedAction: newClaimAction.trim() || "evaluate",
          safetyCritical: newClaimSafety,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Claim created: ${newClaimTitle.trim()}` });
        setNewClaimOpen(false);
        setNewClaimTitle("");
        setNewClaimDesc("");
        setNewClaimType("empirical");
        setNewClaimAction("");
        setNewClaimSafety(false);
        await fetchClaims();
        if (data.claim?.id) {
          setSelectedClaimId(data.claim.id);
        }
      }
    } finally {
      setCreating(false);
    }
  };

  const handleIngest = async () => {
    if (!selectedClaimId) return;
    setIngesting(true);
    try {
      await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: selectedClaimId, fullMesh: true }),
      });
      await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: selectedClaimId }),
      });
      await fetchClaims();
      toast({ title: "Evidence ingested from 4 sources" });
    } finally {
      setIngesting(false);
    }
  };

  const handleAuthorize = async (safetyOverride: boolean, reviewSignedOff: boolean) => {
    if (!selectedClaimId) return;
    setAuthorizing(true);
    try {
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: selectedClaimId,
          safetyOverride,
          reviewSignedOff,
        }),
      });
      await fetchClaims();
      if (res.ok) {
        const data = await res.json();
        const authVal = data.authorized ? "TRUE" : "FALSE";
        toast({ title: `Authorization: A = ${authVal}` });
      }
    } finally {
      setAuthorizing(false);
    }
  };

  const handleComputeNInd = async () => {
    if (!selectedClaimId) return;
    setComputingNInd(true);
    try {
      const res = await fetch("/api/n-ind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: selectedClaimId }),
      });
      await fetchClaims();
      if (res.ok) {
        const data = await res.json();
        const nInd = data.nInd ?? data.result?.nInd;
        const sources = data.numSources ?? data.result?.numSources ?? "?";
        if (nInd !== undefined) {
          toast({ title: `N_ind = ${typeof nInd === "number" ? nInd.toFixed(2) : nInd} (${sources} sources)` });
        }
      }
    } finally {
      setComputingNInd(false);
    }
  };

  const handleDeleteClaim = async () => {
    if (!selectedClaimId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/claims/${selectedClaimId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Claim deleted" });
        setSelectedClaimId(null);
        await fetchClaims();
        setDeleteConfirmOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleEvidenceClick = (evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    setEvidenceDetailOpen(true);
  };

  // Build authorization result from selected claim
  const authResult: AuthorizationResult | null = selectedClaim?.authorizations?.[0]
    ? {
        authorized: selectedClaim.authorizations[0].authorized,
        claimOk: selectedClaim.authorizations[0].claimOk,
        evidenceOk: selectedClaim.authorizations[0].evidenceOk,
        integrityOk: selectedClaim.authorizations[0].integrityOk,
        safetyOk: selectedClaim.authorizations[0].safetyOk,
        reviewOk: selectedClaim.authorizations[0].reviewOk,
        reason: selectedClaim.authorizations[0].reason,
      }
    : null;

  const nIndResult: ParticipationRatioResult | null = selectedClaim?.nIndRecords?.[0]
    ? {
        nInd: selectedClaim.nIndRecords[0].nInd,
        numEvidence: selectedClaim.nIndRecords[0].numEvidence,
        numSources: selectedClaim.nIndRecords[0].numSources,
        gamma: selectedClaim.nIndRecords[0].gamma,
        eigenvalues: selectedClaim.nIndRecords[0].eigenvalues,
      }
    : null;

  const evidenceItems: EvidenceItem[] = selectedClaim?.evidence ?? [];
  const circuitEvents: CircuitBreakerRecord[] = selectedClaim?.circuitEvents ?? [];
  const claimState: VerificationState = selectedClaim?.state ?? "UNTESTED";
  const safetyCritical = selectedClaim?.safetyCritical ?? false;

  // Filtered claims for sidebar
  const filteredClaims = claims.filter((c) => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== "all" && c.claimType !== filterType) return false;
    if (filterState !== "all" && c.state !== filterState) return false;
    return true;
  });

  // Comparison: claims selected for side-by-side comparison
  const compareClaims = compareIds
    .map((id) => claims.find((c) => c.id === id))
    .filter((c): c is ClaimWithRelations => c !== undefined);

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maximum 3 claims",
          description: "Remove one claim before adding another to the comparison.",
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleCompareMode = () => {
    setCompareMode((prev) => {
      const next = !prev;
      if (!next) {
        setCompareIds([]);
        setCompareDialogOpen(false);
      }
      return next;
    });
  };

  // Auto-open the dialog when 2+ claims are selected and compareMode is on
  useEffect(() => {
    if (compareMode && compareIds.length >= 2) {
      setCompareDialogOpen(true);
    } else if (compareIds.length < 2) {
      setCompareDialogOpen(false);
    }
  }, [compareMode, compareIds.length]);

  // IVE Stats computed from all claims
  const totalClaims = claims.length;
  const avgNInd = totalClaims > 0
    ? claims.reduce((sum, c) => sum + (c.nIndRecords[0]?.nInd ?? 0), 0) / totalClaims
    : 0;
  const authRate = totalClaims > 0
    ? (claims.filter((c) => c.authorizations[0]?.authorized).length / totalClaims) * 100
    : 0;
  const evidenceCoverage = totalClaims > 0
    ? (claims.filter((c) => c.evidence.length >= 1).length / totalClaims) * 100
    : 0;
  const totalCircuitEvents = claims.reduce((sum, c) => sum + c.circuitEvents.filter((e) => e.triggered).length, 0);

  // Auth gate: show sign-in/sign-up if not authenticated
  if (sessionStatus === "loading") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-6 p-8">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
          <h2 className="text-2xl font-bold mb-2">IVE Requires Authentication</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in to access the Integrated Verification Environment.
            Your claims and evidence are private to your account.
          </p>
          <div className="flex flex-col items-center gap-4">
            {authMode === "signin" ? (
              <>
                <SignInForm />
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Create one
                  </button>
                </p>
              </>
            ) : (
              <>
                <SignUpForm />
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signin")}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* IVE Toolbar */}
      <div className="border-b bg-muted/20 px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => onNavigate("docs")} className="gap-1 text-xs h-8">
            <ArrowLeft className="h-3 w-3" />
            Docs
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-mono text-muted-foreground">
            IVE — Integrated Verification Environment
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
          <Button variant="ghost" size="sm" onClick={() => setShortcutsOpen(true)} className="gap-1 text-xs h-8 w-8 p-0">
            <Keyboard className="h-3.5 w-3.5" />
          </Button>
          <Dialog open={newClaimOpen} onOpenChange={setNewClaimOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 text-xs h-8">
                <Plus className="h-3 w-3" />
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Claim</DialogTitle>
                <DialogDescription>Add a new claim to the verification environment.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="claim-title">Title *</Label>
                  <Input
                    id="claim-title"
                    value={newClaimTitle}
                    onChange={(e) => setNewClaimTitle(e.target.value)}
                    placeholder="e.g., Model accuracy meets threshold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="claim-desc">Description</Label>
                  <Textarea
                    id="claim-desc"
                    value={newClaimDesc}
                    onChange={(e) => setNewClaimDesc(e.target.value)}
                    placeholder="Describe the claim in detail..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="claim-type">Claim Type</Label>
                  <Select value={newClaimType} onValueChange={setNewClaimType}>
                    <SelectTrigger id="claim-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematical">Mathematical</SelectItem>
                      <SelectItem value="semantic">Semantic</SelectItem>
                      <SelectItem value="empirical">Empirical</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="claim-action">Intended Action</Label>
                  <Input
                    id="claim-action"
                    value={newClaimAction}
                    onChange={(e) => setNewClaimAction(e.target.value)}
                    placeholder="e.g., deploy, evaluate, approve"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="claim-safety"
                    checked={newClaimSafety}
                    onCheckedChange={(checked) => setNewClaimSafety(checked === true)}
                  />
                  <Label htmlFor="claim-safety" className="text-sm">
                    Safety Critical
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewClaimOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClaim}
                  disabled={creating || !newClaimTitle.trim()}
                  className="gap-1"
                >
                  {creating ? "Creating..." : "Create Claim"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {claims.length === 0 && (
            <Button size="sm" onClick={handleSeed} disabled={seeding} className="gap-1 text-xs h-8">
              <Zap className="h-3 w-3" />
              {seeding ? "Seeding..." : "Seed Demo Data"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchClaims} className="gap-1 text-xs h-8">
            <Activity className="h-3 w-3" />
            Refresh
          </Button>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={toggleCompareMode}
            className="gap-1 text-xs h-8"
            title="Toggle compare mode (select up to 3 claims)"
          >
            <GitCompare className="h-3 w-3" />
            Compare
            {compareMode && compareIds.length > 0 && (
              <Badge variant="secondary" className="ml-0.5 px-1 py-0 text-[9px] h-3.5 min-w-3.5 flex items-center justify-center">
                {compareIds.length}
              </Badge>
            )}
          </Button>
          {compareMode && compareIds.length >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCompareDialogOpen(true)}
              className="gap-1 text-xs h-8"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
          )}
          {selectedClaimId && (
            <>
              <Separator orientation="vertical" className="h-5 mx-1 bg-red-500/30" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="gap-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">Danger zone</p>
                  <p className="text-[11px]">Permanently delete the selected claim and cascade-destroy all related evidence, authorizations, and circuit-breaker events. This cannot be undone.</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Claims Sidebar */}
        <aside className="w-64 shrink-0 border-r overflow-y-auto bg-muted/10 dark:bg-muted/20">
          <div className="p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Claims ({filteredClaims.length}{filteredClaims.length !== claims.length ? ` / ${claims.length}` : ""})
            </p>
            {compareMode && (
              <div className="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <GitCompare className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Compare Mode
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-mono px-1 text-emerald-600 border-emerald-500/40">
                    {compareIds.length}/3
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">
                  {compareIds.length < 2
                    ? `Select ${2 - compareIds.length} more claim${2 - compareIds.length === 1 ? "" : "s"} to compare.`
                    : "Tap a checkbox to add or remove from comparison."}
                </p>
              </div>
            )}
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims..."
                className="h-7 text-xs pl-7 pr-7"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                >
                  <X className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {/* Type Filter Buttons */}
            <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-1">Type</p>
            <div className="flex flex-wrap gap-1 mb-2">
              <button
                onClick={() => setFilterType("all")}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border transition-colors ${
                  filterType === "all" ? "bg-foreground/10 border-foreground/30" : "bg-transparent border-border hover:bg-muted/50"
                }`}
              >
                all
              </button>
              {(["mathematical", "semantic", "empirical", "operational"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(filterType === t ? "all" : t)}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border transition-colors ${
                    filterType === t ? "bg-foreground/10 border-foreground/30" : "bg-transparent border-border hover:bg-muted/50"
                  }`}
                >
                  {t.slice(0, 4)}
                </button>
              ))}
            </div>
            {/* State Filter Buttons */}
            <p className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-1">State</p>
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => setFilterState("all")}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border transition-colors ${
                  filterState === "all" ? "bg-foreground/10 border-foreground/30" : "bg-transparent border-border hover:bg-muted/50"
                }`}
              >
                all
              </button>
              {(["PROVEN", "VERIFIED", "SUPPORTED", "OBSERVED", "INCONCLUSIVE", "UNVALIDATED", "UNTESTED", "STALE", "FALSIFIED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterState(filterState === s ? "all" : s)}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border transition-colors ${
                    filterState === s ? "bg-foreground/10 border-foreground/30" : "bg-transparent border-border hover:bg-muted/50"
                  }`}
                >
                  {s.slice(0, 3)}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-md bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : claims.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <Shield className="h-10 w-10 text-emerald-500/60" />
                <p className="text-sm font-medium">No claims yet</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Create your first claim or seed demo data to explore the IVE.
                </p>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs mt-2"
                  onClick={() => setNewClaimOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Your First Claim
                </Button>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No claims match filters.
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredClaims.map((claim) => {
                  const isSelectedForCompare = compareIds.includes(claim.id);
                  const isMainSelected = selectedClaimId === claim.id;
                  return (
                    <div key={claim.id} className="relative">
                      <button
                        onClick={() => setSelectedClaimId(claim.id)}
                        className={`w-full text-left rounded-md border p-3 transition-all duration-150 ${
                          isMainSelected
                            ? "border-foreground/30 bg-emerald-500/8 dark:bg-emerald-500/15 border-l-[3px] border-l-emerald-500 shadow-sm"
                            : compareMode && isSelectedForCompare
                            ? "border-emerald-500/50 bg-emerald-500/5 border-l-[3px] border-l-emerald-500/70 shadow-sm shadow-emerald-500/10"
                            : "border-border hover:bg-muted/50 hover:border-muted-foreground/20 hover:scale-[1.02] hover:shadow-sm"
                        } ${compareMode ? "pr-9" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-semibold line-clamp-2 break-words leading-tight cursor-default">{claim.title}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              {claim.title}
                            </TooltipContent>
                          </Tooltip>
                          <div className="flex items-center gap-1 shrink-0">
                            <StateBadge state={claim.state} size="sm" />
                            {isMainSelected && (
                              <ChevronRight className="h-3 w-3 text-emerald-500" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Badge variant="outline" className="text-[8px] font-mono px-1">
                            {claim.claimType}
                          </Badge>
                          {claim.safetyCritical && (
                            <Badge variant="outline" className="text-[8px] px-1 text-amber-600 border-amber-500/30">
                              safety
                            </Badge>
                          )}
                          {compareMode && isSelectedForCompare && (
                            <Badge variant="outline" className="text-[8px] px-1 text-emerald-600 border-emerald-500/40 font-mono ml-auto">
                              in compare
                            </Badge>
                          )}
                        </div>
                      </button>
                      {compareMode && (
                        <div
                          className="absolute top-2 right-2 z-10 flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelectedForCompare}
                            onCheckedChange={() => toggleCompareId(claim.id)}
                            className="h-4 w-4 bg-background shadow-sm data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            aria-label={`Toggle comparison for ${claim.title}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main IVE Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedClaim ? (
            <div className="space-y-4">
              {/* IVE Stats Bar */}
              <div className="flex flex-wrap items-stretch gap-3 pb-4 border-b border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 px-3 py-1.5 h-full cursor-default transition-transform duration-150 hover:scale-[1.03]">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold leading-none">{totalClaims}</span>
                        <span className="text-[10px] text-muted-foreground">Claims</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    Total number of claims in the system across all verification states.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 px-3 py-1.5 h-full cursor-default transition-transform duration-150 hover:scale-[1.03]">
                      <BarChart3 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold leading-none">{avgNInd.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">Avg <GlossaryTerm term="N_ind">N_ind</GlossaryTerm></span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px]">
                    Average spectral diversification (N_ind) — counts truly independent evidence sources via participation ratio of kernel eigenvalues.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 px-3 py-1.5 h-full cursor-default transition-transform duration-150 hover:scale-[1.03]">
                      <Percent className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold leading-none">{authRate.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground"><GlossaryTerm term="CEISR">Auth Rate</GlossaryTerm></span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px]">
                    {authRate === 0
                      ? "No claims have been authorized yet. Authorization requires A = C · E · I · S · R — all five conjuncts must pass. Verify a claim or seed demo data to see authorization in action."
                      : "Percentage of claims where authorization A = C · E · I · S · R evaluated to TRUE."}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-gradient-to-br from-amber-500/8 to-amber-500/3 px-3 py-1.5 h-full cursor-default transition-transform duration-150 hover:scale-[1.03]">
                      <PieChart className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold leading-none">{evidenceCoverage.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Evidence Cov.</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px]">
                    Evidence coverage — fraction of claims with at least one evidence item collected from any source.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-gradient-to-br from-red-500/8 to-red-500/3 px-3 py-1.5 h-full cursor-default transition-transform duration-150 hover:scale-[1.03]">
                      <CircuitBoard className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold leading-none">{totalCircuitEvents}</span>
                        <span className="text-[10px] text-muted-foreground"><GlossaryTerm term="Circuit Breaker">CB Events</GlossaryTerm></span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px]">
                    {totalCircuitEvents === 0
                      ? "No circuit breaker events triggered. This is healthy — breaker trips indicate evidence loss or verification failures."
                      : `${totalCircuitEvents} circuit breaker event(s) triggered. Review affected claims for evidence integrity issues.`}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Claim Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{selectedClaim.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">{selectedClaim.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StateBadge state={claimState} size="lg" />
                    <Badge variant="outline" className="text-[10px] font-mono">{selectedClaim.claimType}</Badge>
                    {safetyCritical && (
                      <Badge variant="outline" className="text-[10px] font-mono text-amber-600 border-amber-500/30">
                        Safety(−)
                      </Badge>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {selectedClaim.intendedAction}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Panels Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* Row 1: State Lattice — full width */}
                <div className="lg:col-span-2">
                  <StateLattice currentState={claimState} />
                </div>
                {/* Row 2: P0 Gauge + Authorization side by side */}
                <P0IntegrityGauge
                  nInd={nIndResult?.nInd ?? null}
                  evidenceCount={evidenceItems.length}
                  sourceCount={nIndResult?.numSources ?? 0}
                  threshold={safetyCritical ? 2 : 1}
                  safetyCritical={safetyCritical}
                  breakerTripped={circuitEvents.some((e) => e.triggered)}
                />
                <AuthorizationPanel
                  auth={authResult}
                  safetyCritical={safetyCritical}
                  onAuthorize={safetyCritical ? handleAuthorize : undefined}
                  loading={authorizing}
                />
                {/* Row 3: Evidence Mesh + Evidence Topology */}
                <EvidenceMeshPanel
                  evidence={evidenceItems}
                  onIngest={handleIngest}
                  loading={ingesting}
                  onEvidenceClick={handleEvidenceClick}
                />
                <EvidenceTopology evidence={evidenceItems} claimState={claimState} />
                {/* Row 4: Evidence Weight Chart + Participation Ratio */}
                <EvidenceWeightChart evidence={evidenceItems} />
                <ParticipationRatioPanel
                  result={nIndResult}
                  threshold={safetyCritical ? 2 : 1}
                  loading={computingNInd}
                  onRecompute={handleComputeNInd}
                />
                {/* Row 5: Circuit Breaker + Audit Trail */}
                <CircuitBreakerPanel events={circuitEvents} safetyCritical={safetyCritical} />
                <Card className="p-4">
                  <ClaimAuditTrail claim={selectedClaim} />
                </Card>
                {/* Row 6: Heat Kernel — full width */}
                <div className="lg:col-span-2">
                  <HeatKernelPanel claimId={selectedClaimId ?? undefined} topology="cycle" />
                </div>
                {/* Row 6: Trust Assurance Report — full width */}
                <div className="lg:col-span-2">
                  <TrustAssuranceReport
                    claimTitle={selectedClaim.title}
                    claimState={claimState}
                    claimType={selectedClaim.claimType}
                    safetyCritical={safetyCritical}
                    nInd={nIndResult?.nInd ?? null}
                    numSources={nIndResult?.numSources ?? 0}
                    evidenceCount={evidenceItems.length}
                    authorized={authResult?.authorized ?? null}
                    breakerTripped={circuitEvents.some((e) => e.triggered)}
                    intendedAction={selectedClaim.intendedAction}
                  />
                </div>
                {/* Row 7: Evidence Source Simulator — interactive — full width */}
                <div className="lg:col-span-2">
                  <EvidenceSimulator />
                </div>
                {/* Row 8: System Health — full width */}
                <div className="lg:col-span-2">
                  <SystemHealthMonitor
                    claimsCount={claims.length}
                    totalEvidence={claims.reduce((sum, c) => sum + c.evidence.length, 0)}
                    avgNInd={claims.length > 0 ? claims.reduce((sum, c) => sum + (c.nIndRecords[0]?.nInd ?? 0), 0) / claims.length : null}
                    authRate={claims.length > 0 ? claims.filter(c => c.authorizations[0]?.authorized).length / claims.length : 0}
                    breakerEvents={claims.reduce((sum, c) => sum + c.circuitEvents.filter(e => e.triggered).length, 0)}
                  />
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {/* Stats bar skeleton */}
              <div className="flex flex-wrap gap-3 pb-4 border-b border-border/50">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-md" />
                ))}
              </div>
              {/* Claim header skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-px w-full" />
              {/* State lattice skeleton */}
              <Skeleton className="h-12 w-full" />
              {/* Panels grid skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full gap-5 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ThreeRingsLogo size={64} animated />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {claims.length === 0
                    ? "No Claims Yet"
                    : "Select a Claim"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {claims.length === 0
                    ? "Seed demo data to populate the verification environment with sample claims and evidence."
                    : "Choose a claim from the sidebar to view its verification environment, evidence mesh, and authorization status."}
                </p>
              </div>
              {claims.length === 0 && (
                <Button onClick={handleSeed} disabled={seeding} className="gap-2">
                  <Zap className="h-4 w-4" />
                  {seeding ? "Seeding..." : "Seed Demo Data"}
                </Button>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* Evidence Detail Modal */}
      <EvidenceDetailModal
        evidence={selectedEvidence}
        open={evidenceDetailOpen}
        onOpenChange={setEvidenceDetailOpen}
      />

      {/* Delete Claim Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete Claim
            </DialogTitle>
            <DialogDescription>
              This will permanently delete this claim and all associated evidence, authorizations, and circuit breaker events. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClaim}
              disabled={deleting}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting..." : "Delete Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Press these keys anywhere in the IVE to trigger actions.
              Shortcuts are disabled while typing in form fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {["IVE", "Nav"].map((group) => (
              <div key={group}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  {group}
                </p>
                <div className="space-y-1.5">
                  {KEYBOARD_SHORTCUTS.filter((s) => s.group === group).map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShortcutsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Comparison Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={(open) => { if (!open) setCompareDialogOpen(false); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-emerald-600" />
              Claim Comparison
              <Badge variant="outline" className="ml-1 text-[10px] font-mono">
                {compareClaims.length} claim{compareClaims.length === 1 ? "" : "s"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected claims. Differences are highlighted in amber.
              Authorization outcomes are color-coded green (true) / red (false).
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-1 px-1">
            {compareClaims.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <GitCompare className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Select at least 2 claims in the sidebar to view a comparison.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Header row: claim titles */}
                <div
                  className="grid gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/40"
                  style={{
                    gridTemplateColumns: `130px repeat(${compareClaims.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 flex items-center">
                    Field
                  </div>
                  {compareClaims.map((claim, idx) => (
                    <div
                      key={claim.id}
                      className="rounded-md border border-border/60 bg-muted/30 p-2"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-muted-foreground/60">#{idx + 1}</span>
                        <button
                          onClick={() => toggleCompareId(claim.id)}
                          className="ml-auto text-[9px] text-muted-foreground hover:text-red-600 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold line-clamp-2 leading-tight">{claim.title}</p>
                    </div>
                  ))}
                </div>

                {/* Comparison rows */}
                {([
                  {
                    label: "State",
                    raw: (c: ClaimWithRelations) => c.state,
                    render: (c: ClaimWithRelations) => <StateBadge state={c.state} size="sm" />,
                    equal: (a: VerificationState, b: VerificationState) => a === b,
                  },
                  {
                    label: "Type",
                    raw: (c: ClaimWithRelations) => c.claimType,
                    render: (c: ClaimWithRelations) => (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {c.claimType}
                      </Badge>
                    ),
                    equal: (a: ClaimType, b: ClaimType) => a === b,
                  },
                  {
                    label: "N_ind",
                    raw: (c: ClaimWithRelations) => c.nIndRecords[0]?.nInd ?? null,
                    render: (c: ClaimWithRelations) => {
                      const n = c.nIndRecords[0]?.nInd;
                      return (
                        <span className="text-xs font-mono">
                          {n !== undefined ? n.toFixed(2) : "—"}
                        </span>
                      );
                    },
                    equal: (a: number | null, b: number | null) => {
                      if (a === null && b === null) return true;
                      if (a === null || b === null) return false;
                      return Math.abs(a - b) < 0.005;
                    },
                  },
                  {
                    label: "Evidence",
                    raw: (c: ClaimWithRelations) => c.evidence.length,
                    render: (c: ClaimWithRelations) => (
                      <span className="text-xs font-mono">{c.evidence.length}</span>
                    ),
                    equal: (a: number, b: number) => a === b,
                  },
                  {
                    label: "Authorized",
                    raw: (c: ClaimWithRelations) => c.authorizations[0]?.authorized ?? null,
                    render: (c: ClaimWithRelations) => {
                      const auth = c.authorizations[0]?.authorized;
                      if (auth === undefined) {
                        return (
                          <span className="text-[10px] font-mono text-muted-foreground">no record</span>
                        );
                      }
                      return (
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-mono font-semibold ${
                            auth
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                              : "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40"
                          }`}
                        >
                          {auth ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          )}
                          {auth ? "TRUE" : "FALSE"}
                        </span>
                      );
                    },
                    equal: (a: boolean | null, b: boolean | null) => a === b,
                  },
                  {
                    label: "Safety Critical",
                    raw: (c: ClaimWithRelations) => c.safetyCritical,
                    render: (c: ClaimWithRelations) => (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                          c.safetyCritical
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {c.safetyCritical ? "yes" : "no"}
                      </span>
                    ),
                    equal: (a: boolean, b: boolean) => a === b,
                  },
                ] as const).map((row) => {
                  const values = compareClaims.map(row.raw);
                  const allEqual = values.every((v, i) =>
                    i === 0 ? true : row.equal(v as never, values[0] as never)
                  );
                  return (
                    <div
                      key={row.label}
                      className="grid gap-2 py-1.5 border-b border-border/20"
                      style={{
                        gridTemplateColumns: `130px repeat(${compareClaims.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        {!allEqual && (
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
                            title="Values differ across selected claims"
                          />
                        )}
                        {row.label}
                      </div>
                      {compareClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className={`rounded-md p-2 flex items-center ${
                            !allEqual
                              ? "bg-amber-500/5 border border-amber-500/20"
                              : "bg-transparent"
                          }`}
                        >
                          {row.render(claim)}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Summary footer */}
                <div className="mt-3 rounded-md border border-border/40 bg-muted/20 p-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-mono font-semibold uppercase tracking-wider">Summary:</span>{" "}
                    {compareClaims.length} claims compared. Rows marked with{" "}
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />{" "}
                    indicate fields where values differ across selected claims.
                    {" "}
                    {compareClaims.filter((c) => c.authorizations[0]?.authorized).length} of{" "}
                    {compareClaims.length} are authorized.{" "}
                    {compareClaims.filter((c) => c.safetyCritical).length} of{" "}
                    {compareClaims.length} are safety-critical.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCompareIds([]);
                setCompareDialogOpen(false);
              }}
              className="gap-1 text-xs"
              disabled={compareIds.length === 0}
            >
              <X className="h-3 w-3" />
              Clear selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareDialogOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCompareMode(false);
                setCompareIds([]);
                setCompareDialogOpen(false);
              }}
              className="gap-1 text-xs"
            >
              <GitCompare className="h-3 w-3" />
              Exit Compare Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  // Global navigation shortcuts (work on all views)
  useKeyboardShortcuts({
    onNavigateHome: () => setView("landing"),
    onNavigateDocs: () => setView("docs"),
    onNavigateIve: () => setView("ive"),
    onNavigateRoles: () => setView("roles"),
    onNavigatePilot: () => setView("pilot"),
    enabled: true,
  });

  // 'G' opens the glossary; ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
        e.preventDefault();
        setGlossaryOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // The command palette also registers its own ⌘K / Ctrl+K listener, but
  // we expose a stable callback for the header badge.
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <VVUHeader
        view={view}
        onNavigate={setView}
        onOpenPalette={openPalette}
        onOpenGlossary={() => setGlossaryOpen(true)}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {view === "landing" && <LandingView onNavigate={setView} />}
          {view === "docs" && <DocsView onNavigate={setView} />}
          {view === "ive" && <IVEView onNavigate={setView} />}
          {view === "roles" && <RolesView onNavigate={setView} />}
          {view === "pilot" && <PilotView onNavigate={setView} />}
        </motion.div>
      </AnimatePresence>
      <VVUFooter />

      {/* Global Command Palette — works on every view */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={(v: PaletteView) => setView(v)}
        currentView={view as PaletteView}
      />

      {/* Global Glossary Dialog — works on every view */}
      <GlossaryIndexDialog open={glossaryOpen} onOpenChange={setGlossaryOpen} />
    </div>
  );
}
