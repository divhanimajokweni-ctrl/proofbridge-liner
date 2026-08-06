"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Brain,
  ClipboardCheck,
  FileSearch,
  Flag,
  MessagesSquare,
  Microscope,
  PencilRuler,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import {
  PanelFrame,
  SectionLabel,
  StatCard,
  StatusPill,
} from "../primitives";

const ACCENT = "#b23dff";

type AgentState = "DORMANT" | "LISTENING" | "ANALYZING" | "PROPOSING" | "REVIEWING";

const STATE_STEPS: { id: AgentState; blurb: string }[] = [
  { id: "DORMANT", blurb: "No active session. Awaiting invocation." },
  { id: "LISTENING", blurb: "Ingesting specification inputs + CAD context." },
  { id: "ANALYZING", blurb: "Cross-referencing obligations and missing inputs." },
  { id: "PROPOSING", blurb: "Drafting spec / design changes for review." },
  { id: "REVIEWING", blurb: "Cross-checking proposed changes against evidence." },
];

interface Capability {
  id: string;
  label: string;
  status: "NOT_DEMONSTRATED" | "REQUIRES VALIDATION";
  detail: string;
  icon: typeof Bot;
}

const CAPABILITIES: Capability[] = [
  {
    id: "read-cad",
    label: "Read CAD parameters (pressure, material, dimensions)",
    status: "NOT_DEMONSTRATED",
    detail: "Geometry parameter extraction from KCL not exercised.",
    icon: PencilRuler,
  },
  {
    id: "auto-spec",
    label: "Auto-generate safety specifications",
    status: "REQUIRES VALIDATION",
    detail: "Specification synthesis pipeline pending validation.",
    icon: ClipboardCheck,
  },
  {
    id: "suggest-design",
    label: "Suggest design changes that improve provability",
    status: "REQUIRES VALIDATION",
    detail: "Provability-aware suggestion model not validated.",
    icon: Sparkles,
  },
  {
    id: "review-evidence",
    label: "Review evidence packages",
    status: "REQUIRES VALIDATION",
    detail: "Evidence-package review path awaiting validation.",
    icon: FileSearch,
  },
  {
    id: "flag-missing",
    label: "Flag missing engineering inputs",
    status: "REQUIRES VALIDATION",
    detail: "Missing-input detection rule set pending validation.",
    icon: Flag,
  },
];

function capabilityAccent(status: Capability["status"]): string {
  return status === "NOT_DEMONSTRATED" ? "var(--ive-blocked)" : "#CC7722";
}

/** Illustrative conversation turns — NOT live. */
interface Turn {
  speaker: "engineer" | "lindiwe";
  text: string;
}

const ILLUSTRATIVE_TURNS: Turn[] = [
  {
    speaker: "engineer",
    text: "Can we proceed to the solver stage with the current obligations?",
  },
  {
    speaker: "lindiwe",
    text: "I notice hydraulic actuation authority is UNDEFINED. Recommend resolving before proceeding to solver stage. The watchdog is armed; release is BLOCKED.",
  },
];

export function LindiwePanel() {
  // Lindiwe's state is always DORMANT within the frozen submission scope.
  // The stepper renders the full lifecycle but only DORMANT is active.
  const currentState: AgentState = "DORMANT";
  const activeIdx = STATE_STEPS.findIndex((s) => s.id === currentState);

  return (
    <PanelFrame
      title="Lindiwe — Agent Orchestrator"
      tag="LIN"
      accent={ACCENT}
      mission="Agent orchestrator — specification assistance and evidence review."
      actions={
        <div className="flex items-center gap-2">
          <StatusPill state="ILLUSTRATIVE" accent="#8b949e" />
          <StatusPill state={`STATE: ${currentState}`} accent={ACCENT} pulse />
        </div>
      }
    >
      {/* Identity hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-xl border border-white/[0.06] p-5 sm:p-6"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(178,61,255,0.12), transparent 55%)",
          }}
        />
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative flex items-start gap-4">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex h-14 w-14 flex-none items-center justify-center rounded-xl border"
            style={{ borderColor: `${ACCENT}50`, background: `${ACCENT}12` }}
          >
            <Bot className="h-7 w-7" style={{ color: ACCENT }} />
            <span
              className="absolute -right-1 -top-1 flex h-3 w-3"
              style={{ color: ACCENT }}
            >
              <span className="ive-pulse-ring absolute inline-flex h-full w-full rounded-full border" style={{ borderColor: ACCENT }} />
              <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: ACCENT }} />
            </span>
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="ive-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Agent Orchestrator · Architectural Component
            </div>
            <h3 className="mt-0.5 font-sans text-xl font-bold text-foreground">
              Lindiwe
            </h3>
            <p className="ive-mono mt-1.5 max-w-[640px] text-[11px] leading-relaxed text-muted-foreground">
              Specification assistance, evidence-package review, and provability-aware
              design suggestions. Within the frozen submission scope Lindiwe is{" "}
              <span className="text-[var(--ive-blocked)]">DORMANT</span> — capabilities
              are <span className="text-[#CC7722]">REQUIRES VALIDATION</span>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Agent State"
          value={currentState}
          hint="dormant · not invoked"
          accent={ACCENT}
        />
        <StatCard
          label="Native Zoo Agent API"
          value="NOT_DEMONSTRATED"
          hint="Zookeeper execution path"
          status="error"
        />
        <StatCard
          label="Capabilities"
          value="0 / 5"
          hint="demonstrated within scope"
          status="warn"
        />
        <StatCard
          label="Specification Assistance"
          value="REQUIRES VALIDATION"
          hint="synthesis pipeline pending"
          status="warn"
        />
      </div>

      {/* State stepper */}
      <div className="mt-6">
        <SectionLabel>Agent Lifecycle · DORMANT → LISTENING → ANALYZING → PROPOSING → REVIEWING</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
            {STATE_STEPS.map((step, i) => {
              const isActive = i === activeIdx;
              const isFuture = i > activeIdx;
              const accent = isActive ? ACCENT : isFuture ? "#8b949e" : "#CC7722";
              return (
                <div
                  key={step.id}
                  className="flex flex-1 items-center gap-2 lg:flex-col lg:items-stretch"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    className="flex-1 rounded-lg border p-3"
                    style={{
                      borderColor: isActive ? `${ACCENT}50` : "rgba(255,255,255,0.06)",
                      background: isActive ? `${ACCENT}10` : "rgba(255,255,255,0.015)",
                    }}
                  >
                    <div className="flex items-center gap-2 lg:flex-col lg:items-start">
                      <span
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-md border text-[10px] font-bold"
                        style={{
                          borderColor: `${accent}50`,
                          background: `${accent}12`,
                          color: accent,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground">
                          {step.id}
                        </div>
                        <div className="ive-mono text-[9px] leading-snug text-muted-foreground/70">
                          {step.blurb}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <StatusPill
                        state={isActive ? "ACTIVE" : isFuture ? "ARMED" : "TRAVERSED"}
                        accent={accent}
                        pulse={isActive}
                      />
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
          <p className="ive-mono mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
            Only <span style={{ color: ACCENT }}>DORMANT</span> is realized within the
            frozen submission scope. Subsequent states describe the intended lifecycle,
            not executed behaviour.
          </p>
        </motion.div>
      </div>

      {/* Capabilities + illustrative conversation */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Capabilities */}
        <div>
          <SectionLabel>Capabilities</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              const accent = capabilityAccent(cap.status);
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="ive-surface flex items-start gap-3 rounded-lg border border-white/[0.06] p-3.5"
                >
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-md border"
                    style={{ borderColor: `${accent}40`, background: `${accent}10` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-foreground">
                        {cap.label}
                      </span>
                      <StatusPill state={cap.status} accent={accent} />
                    </div>
                    <p className="ive-mono mt-1.5 text-[10px] leading-relaxed text-muted-foreground/70">
                      {cap.detail}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Illustrative conversation */}
        <div>
          <SectionLabel>Illustrative Conversation · NOT LIVE</SectionLabel>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="ive-surface rounded-xl border border-white/[0.06] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessagesSquare className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                <span className="ive-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  transcript.mock
                </span>
              </div>
              <span className="ive-mono rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-muted-foreground/70">
                ILLUSTRATIVE
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {ILLUSTRATIVE_TURNS.map((turn, i) => {
                const isLindiwe = turn.speaker === "lindiwe";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.15 }}
                    className="flex gap-2.5"
                  >
                    <span
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
                      style={{
                        borderColor: isLindiwe ? `${ACCENT}40` : "rgba(255,255,255,0.1)",
                        background: isLindiwe ? `${ACCENT}12` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {isLindiwe ? (
                        <Bot className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                      ) : (
                        <Microscope className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="ive-mono text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: isLindiwe ? ACCENT : "rgba(255,255,255,0.55)" }}
                      >
                        {isLindiwe ? "Lindiwe" : "Engineer"}
                      </div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/90">
                        {turn.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="ive-divider mt-4 h-px w-full" />
            <p className="ive-mono mt-3 text-[9.5px] leading-relaxed text-muted-foreground/60">
              This transcript is a mock. No model is invoked. The exchange demonstrates
              the intended review posture, not executed behaviour.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Capability map */}
      <div className="mt-6">
        <SectionLabel>Capability Map</SectionLabel>
        <div className="ive-surface grid gap-3 rounded-xl border border-white/[0.06] p-4 sm:grid-cols-3">
          {[
            { icon: Brain, label: "Reasoning", detail: "REQUIRES VALIDATION — model backend not linked.", accent: ACCENT },
            { icon: ShieldQuestion, label: "Safety Posture", detail: "Non-actuating. Cannot command Tier 1.", accent: "var(--ive-blocked)" },
            { icon: ClipboardCheck, label: "Audit Surface", detail: "Every proposal logged to ledger.", accent: "var(--ive-gold)" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md border"
                    style={{ borderColor: `${c.accent}40`, background: `${c.accent}10` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: c.accent }} />
                  </span>
                  <span className="ive-mono text-[9.5px] font-semibold uppercase tracking-wider text-foreground/85">
                    {c.label}
                  </span>
                </div>
                <p className="ive-mono mt-2 text-[10px] leading-relaxed text-muted-foreground/70">
                  {c.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architectural note */}
      <div className="mt-6">
        <div className="ive-surface flex items-start gap-3 rounded-lg border border-white/[0.06] p-4">
          <Bot className="mt-0.5 h-4 w-4 flex-none" style={{ color: ACCENT }} />
          <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground/70">
            Lindiwe is an architectural component. Native Zoo Agent API (Zookeeper)
            execution is <span className="text-[var(--ive-blocked)]">NOT_DEMONSTRATED</span>.
            All capabilities are <span className="text-[#CC7722]">REQUIRES VALIDATION</span>{" "}
            within the frozen submission scope. Lindiwe cannot override Tier 1 safety
            enforcement or accelerate Engineering Release.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}
