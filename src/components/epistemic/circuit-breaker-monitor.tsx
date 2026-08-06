"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Zap, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  Clock, Shield, Activity, RefreshCw, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SparkLine, MetricGauge, DonutChart } from "./chart-primitives";
import { StatusPill, Hash, SectionHeader, GradientBorderCard, StatCard, containerVariants, cardVariants } from "./primitives";

/* ─── Types ─── */
type CBState = "NORMAL" | "DEGRADED" | "FAIL-CLOSED";

interface CBEvent {
  time: string;
  from: CBState;
  to: CBState;
  trigger: string;
  hash: string;
}

/* ─── Mock data ─── */
function genSparkline(base: number, variance: number, length = 30): number[] {
  let seed = base * 13 + 47;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  return Array.from({ length }, () => Math.max(0, Math.round((base + (rand() - 0.5) * 2 * variance) * 10) / 10));
}

const MOCK_EVENTS: CBEvent[] = [
  { time: "14:32:01", from: "NORMAL", to: "DEGRADED", trigger: "error_rate=18% (>15%)", hash: "sha256:a4f3e2c1d0" },
  { time: "14:32:15", from: "DEGRADED", to: "NORMAL", trigger: "error_rate=8% (<15%)", hash: "sha256:b7d6c5a4e3" },
  { time: "14:33:01", from: "NORMAL", to: "DEGRADED", trigger: "error_rate=22% (>15%)", hash: "sha256:c9f8e7d6b5" },
  { time: "14:33:45", from: "DEGRADED", to: "FAIL-CLOSED", trigger: "error_rate=45% (>40%)", hash: "sha256:d1a2f3e4c5" },
  { time: "14:34:30", from: "FAIL-CLOSED", to: "DEGRADED", trigger: "timeout=30s elapsed", hash: "sha256:e6f7a8b9c0" },
  { time: "14:35:00", from: "DEGRADED", to: "NORMAL", trigger: "error_rate=3% (<15%)", hash: "sha256:f2d3e4a5b6" },
];

const STATE_COLORS: Record<CBState, string> = {
  NORMAL: "var(--verified)",
  DEGRADED: "var(--repairing)",
  "FAIL-CLOSED": "var(--violating)",
};

const STATE_ICONS: Record<CBState, typeof CheckCircle2> = {
  NORMAL: CheckCircle2,
  DEGRADED: AlertTriangle,
  "FAIL-CLOSED": XCircle,
};

/* ─── Animation variants ─── */
const cv: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemV: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

/* ─── Circular State Diagram ─── */
function CircularStateDiagram({ currentState }: { currentState: CBState }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 100;
  const statePositions: Record<CBState, { x: number; y: number }> = {
    NORMAL: { x: cx, y: cy - outerR - 10 },
    DEGRADED: { x: cx - outerR - 10, y: cy + outerR - 30 },
    "FAIL-CLOSED": { x: cx + outerR + 10, y: cy + outerR - 30 },
  };

  const states: CBState[] = ["NORMAL", "DEGRADED", "FAIL-CLOSED"];
  const thresholds = [
    { from: "NORMAL", to: "DEGRADED", label: "15%", description: "Error rate > 15%" },
    { from: "DEGRADED", to: "FAIL-CLOSED", label: "40%", description: "Error rate > 40%" },
    { from: "FAIL-CLOSED", to: "DEGRADED", label: "30s", description: "Recovery timeout" },
    { from: "DEGRADED", to: "NORMAL", label: "<15%", description: "Error rate recovered" },
  ];

  return (
    <motion.div variants={itemV} initial="hidden" animate="visible">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible" role="img" aria-label="Circuit breaker state machine">
        {/* Background rings */}
        <circle cx={cx} cy={cy} r={outerR + 30} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.05} />
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.08} />
        <circle cx={cx} cy={cy} r={outerR - 30} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.05} />

        {/* Transition arcs with threshold labels */}
        {thresholds.map((t, i) => {
          const fromPos = statePositions[t.from];
          const toPos = statePositions[t.to];
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          const isActiveTransition = (t.from === currentState && MOCK_EVENTS[MOCK_EVENTS.length - 1]?.to === t.to) ||
            (currentState === "DEGRADED" && t.from === "DEGRADED");
          const color = STATE_COLORS[t.from];

          return (
            <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: isActiveTransition ? 0.8 : 0.3 }} transition={{ duration: 0.3 }}>
              {/* Curved path */}
              <motion.path
                d={`M ${fromPos.x} ${fromPos.y} Q ${midX + (i % 2 ? 20 : -20)} ${midY - 20} ${toPos.x} ${toPos.y}`}
                fill="none"
                stroke={color}
                strokeWidth={isActiveTransition ? 2 : 1}
                strokeDasharray={isActiveTransition ? "none" : "4 2"}
                animate={isActiveTransition ? { strokeDashoffset: [0, -6] } : {}}
                transition={isActiveTransition ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              />
              {/* Threshold label */}
              <rect x={midX - 12} y={midY - 10} width={24} height={14} rx={3}
                fill={isActiveTransition ? color : "currentColor"} opacity={isActiveTransition ? 0.2 : 0.04} />
              <text x={midX} y={midY - 3} textAnchor="middle" fill={isActiveTransition ? color : "currentColor"}
                fontSize={7} fontWeight={isActiveTransition ? 700 : 400} opacity={isActiveTransition ? 1 : 0.4}>
                {t.label}
              </text>
            </motion.g>
          );
        })}

        {/* State circles */}
        {states.map((state) => {
          const pos = statePositions[state];
          const color = STATE_COLORS[state];
          const isActive = state === currentState;
          const Icon = STATE_ICONS[state];

          return (
            <motion.g key={state} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              {/* Active pulse ring */}
              {isActive && (
                <motion.circle
                  cx={pos.x} cy={pos.y} r={28}
                  fill="none" stroke={color} strokeWidth={2}
                  animate={{ r: [28, 34, 28], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              {/* State circle background */}
              <circle cx={pos.x} cy={pos.y} r={24} fill={color} opacity={0.15} />
              <circle cx={pos.x} cy={pos.y} r={22} fill="currentColor" opacity={0.04}
                stroke={color} strokeWidth={isActive ? 2.5 : 1} />
              {/* State label */}
              <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill={color}
                fontSize={isActive ? 9 : 8} fontWeight={isActive ? 700 : 500}>
                {state}
              </text>
              {/* Status text */}
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill="currentColor"
                fontSize={6} opacity={0.4}>
                {isActive ? "CURRENT" : "idle"}
              </text>
            </motion.g>
          );
        })}

        {/* Center label */}
        <motion.text x={cx} y={cy} textAnchor="middle" fill={STATE_COLORS[currentState]}
          fontSize={14} fontWeight={700}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}>
          ●
        </motion.text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={STATE_COLORS[currentState]}
          fontSize={8} fontWeight={600} opacity={0.8}>
          {currentState}
        </text>
      </svg>
    </motion.div>
  );
}

/* ─── Live Error Rate Graph ─── */
function ErrorRateGraph({ currentState }: { currentState: CBState }) {
  const data = useMemo(() => {
    const base = currentState === "NORMAL" ? 5 : currentState === "DEGRADED" ? 18 : 45;
    return genSparkline(base, base * 0.5, 30);
  }, [currentState]);

  const color = STATE_COLORS[currentState];

  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-foreground">Error Rate (live)</div>
        <Badge className={`${currentState === "NORMAL" ? "bg-verified/10 text-verified border-verified/20" : currentState === "DEGRADED" ? "bg-repairing/10 text-repairing border-repairing/20" : "bg-violating/10 text-violating border-violating/20"} text-[9px] font-bold`}>
          {currentState === "NORMAL" ? "3.2%" : currentState === "DEGRADED" ? "18.4%" : "45.1%"} avg
        </Badge>
      </div>
      <SparkLine data={data} width={320} height={50} color={color} fill />
      {/* Threshold markers */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-0.5 bg-verified/40" />
          <span>15% threshold (→ DEGRADED)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-0.5 bg-violating/40" />
          <span>40% threshold (→ FAIL-CLOSED)</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Recovery Countdown ─── */
function RecoveryCountdown({ currentState }: { currentState: CBState }) {
  const [seconds, setSeconds] = useState(currentState === "FAIL-CLOSED" ? 30 : currentState === "DEGRADED" ? 12 : 0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const color = STATE_COLORS[currentState];
  const maxSeconds = currentState === "FAIL-CLOSED" ? 30 : currentState === "DEGRADED" ? 15 : 0;
  const pct = maxSeconds > 0 ? ((maxSeconds - seconds) / maxSeconds) * 100 : 100;

  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="text-xs font-semibold text-foreground">Recovery Countdown</div>
      <div className="flex items-center gap-3">
        <MetricGauge value={Math.round(pct)} max={100} label="Progress" color={color} size={60} />
        <div className="space-y-1">
          <div className="font-mono text-lg font-bold" style={{ color }}>
            {seconds}s
          </div>
          <div className="text-[9px] text-muted-foreground">
            {currentState === "FAIL-CLOSED" ? "Automatic half-open after 30s" :
             currentState === "DEGRADED" ? "Monitoring for stability" :
             "No recovery pending"}
          </div>
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
    </motion.div>
  );
}

/* ─── Recent Events Log ─── */
function EventsLog() {
  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="text-xs font-semibold text-foreground">Recent Transition Events</div>
      <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
        {MOCK_EVENTS.map((event, i) => {
          const fromColor = STATE_COLORS[event.from];
          const toColor = STATE_COLORS[event.to];
          return (
            <motion.div
              key={i}
              className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/10 p-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: `${toColor}15` }}>
                <ArrowRight className="h-3 w-3" style={{ color: toColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono font-semibold" style={{ color: fromColor }}>{event.from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono font-semibold" style={{ color: toColor }}>{event.to}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{event.trigger}</div>
                <Hash value={event.hash} length={12} />
              </div>
              <div className="text-[9px] text-muted-foreground font-mono">{event.time}</div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── HTTP Status Counter ─── */
function HTTPStatusCounter({ currentState }: { currentState: CBState }) {
  const data = useMemo(() => [
    { label: "200", value: currentState === "FAIL-CLOSED" ? 0 : currentState === "DEGRADED" ? 850 : 1247, color: "var(--verified)" },
    { label: "503", value: currentState === "FAIL-CLOSED" ? 320 : currentState === "DEGRADED" ? 45 : 0, color: "var(--violating)" },
    { label: "429", value: currentState === "DEGRADED" ? 18 : 0, color: "var(--quarantined)" },
  ], [currentState]);

  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="text-xs font-semibold text-foreground">HTTP Status Codes</div>
      <div className="flex items-center gap-4">
        <DonutChart data={data} size={80} thickness={14} showLabels />
        <div className="space-y-1.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs font-mono" style={{ color: d.color }}>{d.value}</span>
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      {currentState === "FAIL-CLOSED" && (
        <motion.div
          className="rounded-md border border-violating/30 bg-violating/10 p-2 text-xs text-violating font-semibold"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ALL REQUESTS REJECTED — HTTP 503
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── Throughput Indicator ─── */
function ThroughputIndicator({ currentState }: { currentState: CBState }) {
  const throughput = currentState === "NORMAL" ? 100 : currentState === "DEGRADED" ? 65 : 0;
  const color = STATE_COLORS[currentState];
  const label = currentState === "NORMAL" ? "100% throughput" : currentState === "DEGRADED" ? "65% reduced" : "0% blocked";

  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="text-xs font-semibold text-foreground">Throughput</div>
      <div className="flex items-center gap-3">
        <MetricGauge value={throughput} max={100} label="%" color={color} size={80} />
        <div className="space-y-1">
          <div className="font-mono text-sm font-bold" style={{ color }}>{label}</div>
          <div className="text-[9px] text-muted-foreground">
            {currentState === "NORMAL" ? "All requests served" :
             currentState === "DEGRADED" ? "Reduced capacity, retry-eligible" :
             "Zero throughput — fail-closed"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── State Transition Controls (Visual only) ─── */
function StateSimulationControls({ currentState, onStateChange }: { currentState: CBState; onStateChange: (s: CBState) => void }) {
  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="text-xs font-semibold text-foreground">State Simulation</div>
      <div className="flex gap-2">
        {(["NORMAL", "DEGRADED", "FAIL-CLOSED"] as CBState[]).map((state) => {
          const color = STATE_COLORS[state];
          const isActive = state === currentState;
          return (
            <motion.button
              key={state}
              onClick={() => onStateChange(state)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive ? "border-current bg-opacity-15" : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { borderColor: color, backgroundColor: `${color}15`, color } : {}}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && <motion.div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
              {state}
            </motion.button>
          );
        })}
      </div>
      <div className="text-[9px] text-muted-foreground">Click to simulate circuit breaker state transitions</div>
    </motion.div>
  );
}

/* ─── Attack Timeline ─── */
function AttackTimeline({ currentState }: { currentState: CBState }) {
  const errors = useMemo(() => {
    const base = currentState === "NORMAL" ? 2 : currentState === "DEGRADED" ? 8 : 15;
    return genSparkline(base, 5, 20);
  }, [currentState]);

  const color = STATE_COLORS[currentState];

  return (
    <motion.div className="space-y-2" variants={itemV} initial="hidden" animate="visible">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-foreground">Attack Timeline</div>
        <Badge className={`${currentState === "NORMAL" ? "bg-verified/10 text-verified border-verified/20" : currentState === "DEGRADED" ? "bg-repairing/10 text-repairing border-repairing/20" : "bg-violating/10 text-violating border-violating/20"} text-[8px]`}>
          {currentState === "NORMAL" ? "LOW THREAT" : currentState === "DEGRADED" ? "ELEVATED" : "CRITICAL"}
        </Badge>
      </div>
      <SparkLine data={errors} width={280} height={40} color={color} fill />
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
        <Activity className="h-3 w-3" style={{ color }} />
        <span>Error pattern analysis over last 20 intervals</span>
      </div>
    </motion.div>
  );
}

/* ─── Main Section ─── */
export function CircuitBreakerMonitorSection() {
  const [currentState, setCurrentState] = useState<CBState>("NORMAL");

  const color = STATE_COLORS[currentState];
  const isFailClosed = currentState === "FAIL-CLOSED";

  return (
    <motion.div
      className="space-y-6"
      variants={cv}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={Zap}
          title="Circuit Breaker Monitor"
          subtitle="Fail-closed state machine: NORMAL → DEGRADED → FAIL-CLOSED with threshold gates and recovery countdown"
          iconClass="border-violating/30 bg-violating/10 text-violating"
        />
        <StatusPill
          status={currentState === "NORMAL" ? "verified" : currentState === "DEGRADED" ? "repairing" : "violating"}
          label={currentState}
        />
      </div>

      {/* Fail-closed banner */}
      <AnimatePresence>
        {isFailClosed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border-2 border-violating bg-violating/10 p-3"
          >
            <motion.div
              className="flex items-center gap-2 text-violating font-semibold text-sm"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <XCircle className="h-5 w-5" />
              FAIL-CLOSED MODE ACTIVE — ALL REQUESTS REJECTED (HTTP 503)
            </motion.div>
            <div className="text-xs text-violating/80 mt-1">
              Circuit breaker has tripped. Zero request throughput. Automatic half-open transition after 30s cooldown.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State diagram + stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Large circular state diagram */}
        <GradientBorderCard gradientFrom={color}>
          <div className="p-4 flex flex-col items-center">
            <CircularStateDiagram currentState={currentState} />
          </div>
        </GradientBorderCard>

        {/* Right column: metrics */}
        <div className="space-y-4">
          {/* State simulation controls */}
          <StateSimulationControls currentState={currentState} onStateChange={setCurrentState} />

          {/* Throughput indicator */}
          <GradientBorderCard gradientFrom={color}>
            <div className="p-4">
              <ThroughputIndicator currentState={currentState} />
            </div>
          </GradientBorderCard>

          {/* Recovery countdown */}
          <GradientBorderCard gradientFrom={currentState !== "NORMAL" ? color : undefined}>
            <div className="p-4">
              <RecoveryCountdown currentState={currentState} />
            </div>
          </GradientBorderCard>
        </div>
      </div>

      {/* Error rate graph + HTTP counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GradientBorderCard>
          <div className="p-4">
            <ErrorRateGraph currentState={currentState} />
          </div>
        </GradientBorderCard>

        <GradientBorderCard>
          <div className="p-4">
            <HTTPStatusCounter currentState={currentState} />
          </div>
        </GradientBorderCard>
      </div>

      {/* Attack timeline */}
      <GradientBorderCard>
        <div className="p-4">
          <AttackTimeline currentState={currentState} />
        </div>
      </GradientBorderCard>

      {/* Events log */}
      <GradientBorderCard>
        <div className="p-4">
          <EventsLog />
        </div>
      </GradientBorderCard>

      {/* Architecture note */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-violating" />
          <span>
            Fail-closed architecture: under adversarial conditions, the circuit breaker transitions to FAIL-CLOSED
            state, rejecting all requests with HTTP 503. This ensures zero request leakage and zero data corruption.
            Recovery requires explicit cooldown period (30s) before half-open probe requests are allowed.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
