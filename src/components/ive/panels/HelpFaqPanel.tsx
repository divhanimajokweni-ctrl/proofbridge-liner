"use client";

import { motion } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  FileWarning,
  Globe,
  Workflow,
  ClipboardCheck,
  FileSearch,
  Compass,
  Keyboard,
  ArrowRight,
  BookOpen,
  ShieldQuestion,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import type { WorkspacePanelId } from "@/lib/ive/types";
import { DISPOSITION } from "@/lib/ive/release";
import { PanelFrame, SectionLabel, StatusPill, Kbd } from "../primitives";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface QuickNavItem {
  id: WorkspacePanelId;
  label: string;
  tag: string;
  accent: string;
  hint: string;
  icon: LucideIcon;
}

/** Evaluator-recommended visiting order. */
const QUICK_NAV: QuickNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    tag: "IVE",
    accent: "#C9A84C",
    hint: "Start here — identity, workflow, release status.",
    icon: LayoutDashboard,
  },
  {
    id: "release",
    label: "Release Report",
    tag: "RR",
    accent: "#ff4d5f",
    hint: "The disposition — NO-GO and why.",
    icon: FileWarning,
  },
  {
    id: "trust",
    label: "Trust Sphere",
    tag: "TS",
    accent: "#b23dff",
    hint: "Evidence dimensions.",
    icon: Globe,
  },
  {
    id: "proof",
    label: "Proof Graph",
    tag: "PG",
    accent: "#3dffb0",
    hint: "Engineering DAG.",
    icon: Workflow,
  },
  {
    id: "acceptance",
    label: "Acceptance Checklist",
    tag: "ACC",
    accent: "#3dffb0",
    hint: "Dashboard verification.",
    icon: ClipboardCheck,
  },
  {
    id: "adapter",
    label: "Adapter Attribution",
    tag: "ADP",
    accent: "#3d9bff",
    hint: "Source tracing.",
    icon: FileSearch,
  },
];

interface FaqItem {
  q: string;
  a: string;
}

/** Eight evaluator-oriented questions and answers. */
const FAQ: FaqItem[] = [
  {
    q: "What is IVE?",
    a: "The VVU Integrated Verification Environment. An engineering environment for constructing, evaluating, and tracing engineering evidence. It combines procedural CAD, AI-assisted specification, bounded formal verification, and cryptographically traceable evidence into a single deterministic workflow.",
  },
  {
    q: "What is HBK MK-II?",
    a: "HBK MK-II Hydro-Gateway is the demonstration application — a hydraulic infrastructure research case study. It is NOT the platform. IVE is the platform; HBK MK-II demonstrates one implementation of it.",
  },
  {
    q: "Why is Engineering Release BLOCKED?",
    a: "The release is BLOCKED because required IVE integration evidence is not yet verifiable. Three BLOCKER fixes are needed: (1) the adapter script (ive_result_adapter.py) is not exposed as an inspectable file, (2) the release-gate script (verify_release.py) is not exposed, (3) the frozen contract is not written to ive-output/results.json on disk. This is a packaging/integration gap, not a pipeline rejection or architecture redesign.",
  },
  {
    q: "What does NO-GO mean?",
    a: "NO-GO is the release disposition. It means the submission is not ready for release. The existing pipeline execution is retained and not rejected — only the IVE package's integration evidence is incomplete. The disposition can move to GO WITH REQUIRED FIXES once the three blockers are resolved.",
  },
  {
    q: "How do I navigate the workspace?",
    a: "Use the sidebar (left) to switch between 21 panels grouped by category. Press ⌘K for the command palette, [ and ] for prev/next panel, g+letter to jump to a group, T for the guided tour, M for mission control, H for the stats HUD. Press ? for the full keyboard shortcuts overlay.",
  },
  {
    q: "Why are some values marked UNDEFINED or NOT_EVALUATED?",
    a: "IVE enforces a zero-fabrication rule. Every missing value is explicit: UNDEFINED, MISSING, NOT_EVALUATED, OUT_OF_SCOPE, REQUIRES VALIDATION, or PENDING. No fallback engineering values or fabricated run identifiers are permitted. This is intentional — missing evidence is surfaced, not concealed.",
  },
  {
    q: "Is the pipeline execution rejected?",
    a: "No. The existing pipeline execution (run ive-rocm-local-20260805, 4.249× speedup) is retained as the candidate authoritative run. Historical CPU and ROCm runs are preserved byte-for-byte. The NO-GO disposition is about the IVE integration layer, not the pipeline.",
  },
  {
    q: "What is the difference between proof states and evidence states?",
    a: "Proof states (PROVEN, DISPROVEN, BLOCKED_MISSING_INPUT, etc.) apply only to proof obligations. Evidence/component states (VERIFIED, NOT_DEMONSTRATED, REQUIRES VALIDATION, etc.) apply to artifacts and capabilities. An unevaluated proof obligation is never reported as PROVEN or 'safe.' See the Identity Registry panel for the full vocabulary.",
  },
];

interface GlossaryItem {
  term: string;
  def: string;
}

const GLOSSARY: GlossaryItem[] = [
  { term: "IVE", def: "VVU Integrated Verification Environment — the platform responsible for orchestration, evidence runtime, proof graph, and artifact generation." },
  { term: "HBK MK-II", def: "Hydro-Gateway demonstration application — a hydraulic infrastructure case study. Not the platform." },
  { term: "Trust Sphere", def: "Six-dimensional verification state space (safety, integrity, determinism, auditability, recoverability, availability) plus engineering release." },
  { term: "Proof Graph", def: "Engineering DAG: provenance → geometry → spec → obligations → solver → evidence → ledger → release." },
  { term: "Evidence Runtime", def: "Deterministic timeline of engineering events, each tagged EVIDENCED or NOT EVIDENCED." },
  { term: "Adapter", def: "ive_result_adapter.py — normalizes outputs/ into ive-output/results.json with full source attribution." },
  { term: "Ledger", def: "Append-only event log. Internally consistent and tamper-evident; not externally signed or anchored." },
  { term: "Provenance", def: "Cryptographic chain establishing artifact origin and transformation history." },
  { term: "Checksums", def: "sha256 index covering release artifacts, excluding itself, with deterministic filename ordering." },
  { term: "Zoo Engine", def: "Procedural CAD engine using KCL (KittyCAD Language) for parametric geometry." },
  { term: "ROCm", def: "AMD Radeon Open Compute — the GPU compute context for local Radeon emulation." },
  { term: "Circuit Breaker", def: "Hardware watchdog and safety interlock monitor. Fails to non-actuating state on fault." },
  { term: "Lindiwe", def: "Agent orchestrator for specification assistance and evidence review. Independent component." },
  { term: "NO-GO", def: "Release disposition meaning the submission is not ready for release." },
  { term: "BLOCKED", def: "Release decision withheld pending required engineering evidence." },
  { term: "NOT_EVALUATED", def: "Explicit missing-value marker — not yet assessed, never fabricated." },
  { term: "REQUIRES VALIDATION", def: "Implementation exists but outside the frozen submission scope." },
  { term: "OUT_OF_SCOPE", def: "Outside the frozen submission scope for the current sprint." },
];

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function HelpFaqPanel() {
  const setActivePanel = useIveStore((s) => s.setActivePanel);

  return (
    <PanelFrame
      title="Help & FAQ"
      tag="FAQ"
      accent="#3d9bff"
      mission="Evaluator-oriented questions and answers — what IVE is, why release is BLOCKED, how to navigate."
      actions={
        <StatusPill
          state={`Disposition: ${DISPOSITION}`}
          accent="var(--ive-blocked)"
          pulse
        />
      }
    >
      {/* Intro strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 flex-none items-center justify-center rounded-md border"
            style={{ borderColor: "#3d9bff40", background: "#3d9bff10" }}
          >
            <HelpCircle className="h-4 w-4" style={{ color: "#3d9bff" }} />
          </span>
          <div className="min-w-0">
            <div className="ive-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Evaluator Onboarding Reference
            </div>
            <p className="ive-mono mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Start with Quick Navigation below, then read the FAQ for the most common questions.
              Every claim in this workspace is traceable to repository evidence — no value is
              fabricated. The current release disposition is{" "}
              <span className="text-[var(--ive-blocked)]">{DISPOSITION}</span>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* 1. Quick Navigation */}
      <div className="mt-6">
        <SectionLabel>Quick Navigation · Recommended Order</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_NAV.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => setActivePanel(item.id)}
                aria-label={`Open ${item.label} panel — ${item.hint}`}
                className="ive-surface group flex flex-col gap-2.5 rounded-xl border border-white/[0.06] p-4 text-left transition-all hover:border-white/[0.16] hover:bg-white/[0.03] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ive-gold)]/50"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="ive-mono rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: `${item.accent}40`,
                      background: `${item.accent}10`,
                      color: item.accent,
                    }}
                  >
                    {item.tag}
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: item.accent }} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/60" />
                  </span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">{item.label}</div>
                  <div className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground/70">
                    {item.hint}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. FAQ accordion (native details/summary) */}
      <div className="mt-6">
        <SectionLabel>Frequently Asked Questions</SectionLabel>
        <div className="ive-surface overflow-hidden rounded-xl border border-white/[0.06]">
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <details
                open={i === 0}
                className="group border-b border-white/[0.06] last:border-0 [&::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5 [&::-webkit-details-marker]:hidden">
                  <ChevronDown
                    className="h-4 w-4 flex-none text-muted-foreground/50 transition-transform duration-200 group-open:rotate-180 group-open:text-[var(--ive-gold)]"
                  />
                  <span className="text-[12.5px] font-bold text-foreground">{item.q}</span>
                </summary>
                <div className="px-4 pb-4 pl-11 sm:px-5 sm:pl-12">
                  <p className="ive-mono border-l border-[var(--ive-gold)]/20 pl-3 text-[11px] leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </details>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Glossary */}
      <div className="mt-6">
        <SectionLabel>Glossary · Key Terms</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {GLOSSARY.map((item, i) => (
            <motion.div
              key={item.term}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              className="ive-surface flex flex-col gap-1 rounded-lg border border-white/[0.06] p-3 transition-colors hover:border-white/[0.12]"
            >
              <div className="ive-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--ive-gold)]">
                {item.term}
              </div>
              <div className="ive-mono text-[10px] leading-relaxed text-muted-foreground/80">
                {item.def}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. Contact / Next Steps */}
      <div className="mt-6">
        <SectionLabel>Contact & Next Steps</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="ive-surface relative overflow-hidden rounded-xl border border-white/[0.06] p-5"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(circle at 90% 10%, rgba(61,155,255,0.08), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-md border"
              style={{ borderColor: "#3d9bff40", background: "#3d9bff10" }}
            >
              <Compass className="h-5 w-5" style={{ color: "#3d9bff" }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShieldQuestion className="h-4 w-4 text-[var(--ive-gold)]" />
                <h3 className="font-sans text-base font-bold text-foreground">For Evaluators</h3>
              </div>
              <p className="ive-mono mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Start with the Guided Tour (press <Kbd>T</Kbd>), then review the Release Report for
                the disposition and required fixes. The Acceptance Checklist verifies the dashboard
                is artifact-driven. All engineering claims are traceable to repository evidence.
              </p>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActivePanel("release")}
                  className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--ive-blocked)]/40 hover:bg-[var(--ive-blocked)]/5 hover:text-[var(--ive-blocked)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ive-blocked)]/40"
                >
                  <FileWarning className="h-3 w-3" />
                  Release Report
                </button>
                <button
                  onClick={() => setActivePanel("acceptance")}
                  className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--ive-proven)]/40 hover:bg-[var(--ive-proven)]/5 hover:text-[var(--ive-proven)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ive-proven)]/40"
                >
                  <ClipboardCheck className="h-3 w-3" />
                  Acceptance
                </button>
                <button
                  onClick={() => setActivePanel("identity")}
                  className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--ive-zk)]/40 hover:bg-[var(--ive-zk)]/5 hover:text-[var(--ive-zk)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ive-zk)]/40"
                >
                  <BookOpen className="h-3 w-3" />
                  Identity Registry
                </button>
                <button
                  onClick={() => setActivePanel("adapter")}
                  className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--ive-pending)]/40 hover:bg-[var(--ive-pending)]/5 hover:text-[var(--ive-pending)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ive-pending)]/40"
                >
                  <FileSearch className="h-3 w-3" />
                  Adapter Attribution
                </button>
              </div>

              <div className="ive-divider mt-4 h-px w-full" />

              {/* Keyboard shortcuts ribbon */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="ive-mono flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground/60">
                  <Keyboard className="h-3 w-3" />
                  Shortcuts
                </span>
                <span className="ive-mono flex items-center gap-1 text-[9.5px] text-muted-foreground/70">
                  <Kbd>⌘K</Kbd> palette
                </span>
                <span className="ive-mono flex items-center gap-1 text-[9.5px] text-muted-foreground/70">
                  <Kbd>T</Kbd> tour
                </span>
                <span className="ive-mono flex items-center gap-1 text-[9.5px] text-muted-foreground/70">
                  <Kbd>[</Kbd>
                  <Kbd>]</Kbd> prev/next
                </span>
                <span className="ive-mono flex items-center gap-1 text-[9.5px] text-muted-foreground/70">
                  <Kbd>M</Kbd> mission
                </span>
                <span className="ive-mono flex items-center gap-1 text-[9.5px] text-muted-foreground/70">
                  <Kbd>H</Kbd> stats HUD
                </span>
                <span className="ive-mono flex items-center gap-1 text-[9.5px] text-muted-foreground/70">
                  <Kbd>?</Kbd> all shortcuts
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PanelFrame>
  );
}
