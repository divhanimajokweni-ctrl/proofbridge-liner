"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Heart,
  Lock,
  Power,
  ShieldCheck,
  ShieldX,
  Timer,
  Waves,
  Cpu,
  CircuitBoard,
  RotateCcw,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import {
  PanelFrame,
  SectionLabel,
  StatCard,
  StatusPill,
} from "../primitives";

const ACCENT = "#ff4d5f";

type WatchdogState = "NORMAL" | "DEGRADED" | "FAIL_CLOSED";

interface Interlock {
  id: string;
  label: string;
  status: string;
  detail: string;
  icon: typeof Waves;
}

const INTERLOCKS: Interlock[] = [
  {
    id: "hydraulic-authority",
    label: "Hydraulic actuation authority",
    status: "UNDEFINED",
    detail: "Fails to non-actuating state. Authority path unresolved.",
    icon: Waves,
  },
  {
    id: "secure-boot",
    label: "Secure boot",
    status: "REQUIRES VALIDATION",
    detail: "Boot chain measurement not anchored.",
    icon: Lock,
  },
  {
    id: "firmware-integrity",
    label: "Firmware integrity",
    status: "REQUIRES VALIDATION",
    detail: "Signed firmware manifest not validated against device.",
    icon: CircuitBoard,
  },
  {
    id: "independent-safety",
    label: "Independent safety circuits",
    status: "REQUIRES VALIDATION",
    detail: "Independence from Tier 2 not demonstrated.",
    icon: ShieldCheck,
  },
  {
    id: "fault-detection",
    label: "Fault detection / isolation",
    status: "REQUIRES VALIDATION",
    detail: "Fault taxonomy and isolation paths pending.",
    icon: AlertTriangle,
  },
  {
    id: "recovery-after-reset",
    label: "Recovery after reset",
    status: "NOT_EVALUATED",
    detail: "Reset recovery scenarios not exercised.",
    icon: RotateCcw,
  },
];

const STATE_RING: Record<
  WatchdogState,
  { color: string; label: string; radius: number; blurb: string }
> = {
  NORMAL: {
    color: "var(--ive-proven)",
    label: "NORMAL",
    radius: 64,
    blurb: "Tier 1 nominal. Watchdog servicing heartbeats.",
  },
  DEGRADED: {
    color: "#CC7722",
    label: "DEGRADED",
    radius: 44,
    blurb: "Tier 1 degraded. Servicing impaired, fail-safe armed.",
  },
  FAIL_CLOSED: {
    color: "var(--ive-blocked)",
    label: "FAIL_CLOSED",
    radius: 24,
    blurb: "Tier 1 fail-closed. All actuation authority removed.",
  },
};

function statusAccent(status: string): string {
  if (status === "UNDEFINED" || status === "NOT_EVALUATED") return "var(--ive-blocked)";
  if (status === "REQUIRES VALIDATION") return "#CC7722";
  return "var(--ive-proven)";
}

export function WatchdogPanel() {
  const circuitBreaker = useIveStore((s) => s.circuitBreaker) as WatchdogState;
  const stateOrder: WatchdogState[] = ["NORMAL", "DEGRADED", "FAIL_CLOSED"];
  const activeIdx = stateOrder.indexOf(circuitBreaker);

  return (
    <PanelFrame
      title="Hardware Watchdog"
      tag="WDG"
      accent={ACCENT}
      mission="Hardware watchdog + safety interlock monitor. Fails to non-actuating state."
      actions={
        <StatusPill state={`STATE: ${circuitBreaker}`} accent={STATE_RING[circuitBreaker].color} pulse />
      }
    >
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border p-4 sm:p-5"
        style={{
          borderColor: `${ACCENT}40`,
          background: `linear-gradient(180deg, ${ACCENT}10, transparent)`,
        }}
      >
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex items-start gap-3">
          <span
            className="flex h-9 w-9 flex-none items-center justify-center rounded-md border"
            style={{ borderColor: `${ACCENT}50`, background: `${ACCENT}15` }}
          >
            <ShieldX className="h-4 w-4" style={{ color: ACCENT }} />
          </span>
          <div className="min-w-0">
            <div
              className="ive-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: ACCENT }}
            >
              Tier 1 Fail-Safe Banner
            </div>
            <p className="mt-1 text-[13px] font-semibold leading-snug text-foreground">
              Tier 1 fails to a non-actuating state. Hydraulic actuation authority is{" "}
              <span className="text-[var(--ive-blocked)]">UNDEFINED</span> until resolved.
            </p>
            <p className="ive-mono mt-1.5 text-[10px] leading-relaxed text-muted-foreground/80">
              Safety enforcement occurs inside Tier 1 and cannot be bypassed by Tier 2.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Watchdog State"
          value={circuitBreaker}
          hint="tier 1 fail-safe state"
          accent={STATE_RING[circuitBreaker].color}
        />
        <StatCard
          label="Watchdog Uptime"
          value="REQUIRES VALIDATION"
          hint="heartbeat continuity not anchored"
          status="warn"
        />
        <StatCard
          label="Last Heartbeat"
          value="REQUIRES VALIDATION"
          hint="no telemetry link established"
          status="warn"
        />
        <StatCard
          label="Actuation Authority"
          value="UNDEFINED"
          hint="fails to non-actuating"
          status="error"
        />
      </div>

      {/* State machine + concentric rings */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        {/* Concentric rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="ive-surface relative flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] p-6"
        >
          <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-30" />
          <svg
            viewBox="0 0 160 160"
            className="relative h-[200px] w-[200px]"
            aria-label={`Watchdog state: ${circuitBreaker}`}
          >
            {/* ring backgrounds (NORMAL outer, DEGRADED middle, FAIL_CLOSED inner) */}
            {stateOrder.map((s) => {
              const meta = STATE_RING[s];
              const isActive = s === circuitBreaker;
              return (
                <circle
                  key={s}
                  cx="80"
                  cy="80"
                  r={meta.radius}
                  fill={isActive ? `${meta.color}` : "transparent"}
                  fillOpacity={isActive ? 0.18 : 0}
                  stroke={meta.color}
                  strokeOpacity={isActive ? 0.95 : 0.25}
                  strokeWidth={isActive ? 2.4 : 1.2}
                  strokeDasharray={isActive ? "0" : "3 4"}
                />
              );
            })}
            {/* active-state pulse */}
            <motion.circle
              cx="80"
              cy="80"
              r={STATE_RING[circuitBreaker].radius}
              fill="none"
              stroke={STATE_RING[circuitBreaker].color}
              strokeWidth={1}
              animate={{ strokeOpacity: [0.6, 0, 0.6], r: [STATE_RING[circuitBreaker].radius, STATE_RING[circuitBreaker].radius + 6, STATE_RING[circuitBreaker].radius] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* center label */}
            <text
              x="80"
              y="76"
              textAnchor="middle"
              className="ive-mono"
              style={{ fill: STATE_RING[circuitBreaker].color, fontSize: 9, fontWeight: 700, letterSpacing: 1.2 }}
            >
              TIER 1
            </text>
            <text
              x="80"
              y="90"
              textAnchor="middle"
              className="ive-mono"
              style={{ fill: "#fff", fontSize: 10, fontWeight: 700 }}
            >
              {circuitBreaker}
            </text>
            <text
              x="80"
              y="103"
              textAnchor="middle"
              className="ive-mono"
              style={{ fill: "rgba(255,255,255,0.45)", fontSize: 6.5, letterSpacing: 0.8 }}
            >
              NON-ACTUATING
            </text>
          </svg>
        </motion.div>

        {/* State stepper */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-5"
        >
          <SectionLabel>State Machine · NORMAL → DEGRADED → FAIL_CLOSED</SectionLabel>
          <div className="flex flex-col gap-3">
            {stateOrder.map((s, i) => {
              const meta = STATE_RING[s];
              const isActive = s === circuitBreaker;
              const isPast = activeIdx > i;
              return (
                <div
                  key={s}
                  className="rounded-lg border p-3 transition-colors"
                  style={{
                    borderColor: isActive ? `${meta.color}50` : "rgba(255,255,255,0.06)",
                    background: isActive ? `${meta.color}10` : "rgba(255,255,255,0.015)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-bold"
                        style={{
                          borderColor: `${meta.color}50`,
                          background: `${meta.color}12`,
                          color: meta.color,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-[12px] font-semibold text-foreground">
                          {meta.label}
                        </div>
                        <div className="ive-mono text-[9.5px] text-muted-foreground/70">
                          {meta.blurb}
                        </div>
                      </div>
                    </div>
                    <StatusPill
                      state={isActive ? "ACTIVE" : isPast ? "TRAVERSED" : "ARMED"}
                      accent={isActive ? meta.color : "#8b949e"}
                      pulse={isActive}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="ive-mono mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
            Transitions are irreversible under fault. The terminal state{" "}
            <span className="text-[var(--ive-blocked)]">FAIL_CLOSED</span> removes all
            hydraulic actuation authority. Tier 2 cannot re-arm Tier 1.
          </p>
        </motion.div>
      </div>

      {/* Safety interlocks */}
      <div className="mt-6">
        <SectionLabel>Safety Interlocks</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTERLOCKS.map((il, i) => {
            const Icon = il.icon;
            const accent = statusAccent(il.status);
            return (
              <motion.div
                key={il.id}
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
                      {il.label}
                    </span>
                    <StatusPill state={il.status} accent={accent} />
                  </div>
                  <p className="ive-mono mt-1.5 text-[10px] leading-relaxed text-muted-foreground/70">
                    {il.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tier separation note */}
      <div className="mt-6">
        <SectionLabel>Tier Separation</SectionLabel>
        <div className="ive-surface grid gap-4 rounded-xl border border-white/[0.06] p-5 sm:grid-cols-3">
          {[
            {
              icon: Power,
              tier: "TIER 1",
              title: "Safety Enforcement",
              detail: "Hardware watchdog, interlocks, actuation authority. Cannot be bypassed.",
              accent: ACCENT,
            },
            {
              icon: Cpu,
              tier: "TIER 2",
              title: "Application Logic",
              detail: "IVE runtime, solver, ledger. May request actuation; cannot command it.",
              accent: "var(--ive-pending)",
            },
            {
              icon: Heart,
              tier: "HEARTBEAT",
              title: "Liveness Channel",
              detail: "REQUIRES VALIDATION — independent channel not anchored.",
              accent: "#CC7722",
            },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.tier}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md border"
                    style={{ borderColor: `${t.accent}40`, background: `${t.accent}10` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: t.accent }} />
                  </span>
                  <span
                    className="ive-mono text-[9px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: t.accent }}
                  >
                    {t.tier}
                  </span>
                </div>
                <div className="mt-2 text-[12px] font-semibold text-foreground">
                  {t.title}
                </div>
                <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground/70">
                  {t.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6">
        <div className="ive-surface flex items-start gap-3 rounded-lg border border-white/[0.06] p-4">
          <Timer className="mt-0.5 h-4 w-4 flex-none" style={{ color: ACCENT }} />
          <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground/70">
            The watchdog is a hardware invariant, not a software feature. Missing values
            are explicit: <span className="text-[var(--ive-blocked)]">UNDEFINED</span>,{" "}
            <span className="text-[#CC7722]">REQUIRES VALIDATION</span>,{" "}
            <span className="text-[var(--ive-blocked)]">NOT_EVALUATED</span>. Engineering
            Release remains BLOCKED while any interlock is unresolved.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}
