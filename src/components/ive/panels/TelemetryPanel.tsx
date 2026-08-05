"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  Gauge,
  Layers,
  Plug,
  Radio,
  ServerCog,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import {
  PanelFrame,
  SectionLabel,
  StatCard,
  StatusPill,
  MonoTable,
} from "../primitives";
import type { ExplicitMissing, HardwareProfile, Telemetry } from "@/lib/ive/types";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const ACCENT = "#3d9bff";

/** Coerce a raw telemetry value into a render-safe string node. */
function coerce(value: unknown): string {
  if (value === null || value === undefined) return "UNDEFINED";
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "UNDEFINED";
  if (typeof value === "boolean") return value ? "true" : "false";
  try {
    return JSON.stringify(value);
  } catch {
    return "UNDEFINED";
  }
}

/** True when a telemetry field carries an explicit missing-value marker. */
function isExplicitMissing(v: unknown): v is ExplicitMissing {
  return (
    typeof v === "string" &&
    [
      "UNDEFINED",
      "MISSING",
      "NOT_EVALUATED",
      "OUT_OF_SCOPE",
      "REQUIRES VALIDATION",
      "PENDING",
    ].includes(v)
  );
}

/** Convert a Record<string, unknown> to MonoTable rows. */
function objectToRows(
  obj: Record<string, unknown> | ExplicitMissing,
  label: string,
): { rows: Record<string, string>[]; cols: { key: string; label: string }[] } {
  const cols = [
    { key: "k", label: "key" },
    { key: "v", label: "value" },
  ];
  if (typeof obj === "string") {
    return {
      rows: [{ k: label, v: obj }],
      cols,
    };
  }
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return { rows: [{ k: label, v: "MISSING" }], cols };
  }
  return {
    rows: entries.map(([k, v]) => ({ k, v: coerce(v) })),
    cols,
  };
}

/** Hardware profile row builder. */
function hardwareRows(hw: HardwareProfile) {
  const cells: { label: string; value: string; missing: boolean }[] = [
    { label: "Reported Device", value: coerce(hw.reportedDevice), missing: isExplicitMissing(hw.reportedDevice) },
    { label: "Backend", value: coerce(hw.backend), missing: isExplicitMissing(hw.backend) },
    { label: "Speedup Ratio", value: coerce(hw.speedupRatio), missing: isExplicitMissing(hw.speedupRatio) },
    { label: "Provider", value: coerce(hw.provider), missing: isExplicitMissing(hw.provider) },
    { label: "PyTorch", value: coerce(hw.pytorch), missing: isExplicitMissing(hw.pytorch) },
    { label: "HIP", value: coerce(hw.hip), missing: isExplicitMissing(hw.hip) },
  ];
  return cells;
}

/* ------------------------------------------------------------------ */
/* sparkline (display-only mesh activity)                              */
/* ------------------------------------------------------------------ */

const SPARK_BARS = 48;

function MeshActivitySparkline({ verified }: { verified: number }) {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: SPARK_BARS }, () => 0.2 + Math.random() * 0.3),
  );
  const verifiedRef = useRef(verified);

  useEffect(() => {
    verifiedRef.current = verified;
  }, [verified]);

  useEffect(() => {
    let mounted = true;
    const id = window.setInterval(() => {
      if (!mounted) return;
      // Display-only oscillator. The verified-node count seeds the
      // baseline amplitude so the visual responds to live mesh state,
      // but it is NOT an engineering measurement.
      const base = Math.min(0.12 + (verifiedRef.current / 380) * 0.55, 0.85);
      const noise = (Math.random() - 0.5) * 0.35;
      const next = Math.max(0.05, Math.min(1, base + noise));
      setBars((prev) => [...prev.slice(1), next]);
    }, 420);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="flex h-16 items-end gap-[2px]">
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            background:
              i === bars.length - 1
                ? "var(--ive-gold)"
                : `rgba(61, 155, 255, ${0.25 + b * 0.55})`,
          }}
          animate={{ height: `${Math.round(b * 100)}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* panel                                                               */
/* ------------------------------------------------------------------ */

export function TelemetryPanel() {
  const telemetry = useIveStore((s) => s.telemetry) as Telemetry;
  const contract = useIveStore((s) => s.contract);
  const sphereVerified = useIveStore((s) => s.sphereVerified);
  const sphereTotal = useIveStore((s) => s.sphereTotal);
  const circuitBreaker = useIveStore((s) => s.circuitBreaker);

  const densityPct = sphereTotal > 0 ? (sphereVerified / sphereTotal) * 100 : 0;
  const hw = contract.hardware_profile;
  const hwCells = hardwareRows(hw);

  const simMeta = objectToRows(telemetry.rawSimulationMeta, "rawSimulationMeta");
  const training = objectToRows(telemetry.rawTrainingMetrics, "rawTrainingMetrics");
  const benchmark = objectToRows(telemetry.rawBenchmarkData, "rawBenchmarkData");

  const cbAccent =
    circuitBreaker === "NORMAL"
      ? "var(--ive-proven)"
      : circuitBreaker === "DEGRADED"
        ? "#CC7722"
        : "var(--ive-blocked)";

  return (
    <PanelFrame
      title="Telemetry"
      tag="TLM"
      accent={ACCENT}
      mission="Live runtime metrics and raw execution data."
      actions={<StatusPill state="LIVE" accent={ACCENT} pulse />}
    >
      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard
          label="Run ID"
          value={<span className="text-[12px]">{coerce(contract.run_id)}</span>}
          hint="frozen result contract"
          accent={ACCENT}
        />
        <StatCard
          label="Mesh Density"
          value={`${densityPct.toFixed(1)}%`}
          hint={`${sphereVerified} / ${sphereTotal} verified`}
          status="ok"
        />
        <StatCard
          label="Circuit Breaker"
          value={circuitBreaker}
          hint="tier 1 safety state"
          accent={cbAccent}
        />
        <StatCard
          label="Speedup Ratio"
          value={coerce(hw.speedupRatio)}
          hint="local emulation context"
          accent="#CC7722"
        />
      </motion.div>

      {/* Live mesh + sparkline */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-5"
        >
          <div className="flex items-center justify-between">
            <SectionLabel>Live Mesh</SectionLabel>
            <StatusPill state="display only" accent="#8b949e" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-sans text-3xl font-extrabold text-foreground">
                {sphereVerified}
                <span className="text-base font-semibold text-muted-foreground">
                  {" "}
                  / {sphereTotal}
                </span>
              </div>
              <div className="ive-mono mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                verified nodes · fibonacci distribution
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Waypoints className="h-5 w-5" style={{ color: ACCENT }} />
              <span className="ive-mono text-[11px] font-semibold" style={{ color: ACCENT }}>
                {densityPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${ACCENT}, var(--ive-gold))`,
              }}
              animate={{ width: `${densityPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="ive-mono mt-2 flex items-center justify-between text-[9px] text-muted-foreground/60">
            <span>TrustSphere.setSphereMetrics()</span>
            <span>density = verified / total</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-5"
        >
          <div className="flex items-center justify-between">
            <SectionLabel>Mesh Activity (display only)</SectionLabel>
            <span className="ive-mono rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-muted-foreground">
              OSC · 420ms
            </span>
          </div>
          <MeshActivitySparkline verified={sphereVerified} />
          <p className="ive-mono mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
            Illustrative oscillator seeded by verified-node count. NOT an engineering
            measurement — does not feed the ledger or trust sphere.
          </p>
        </motion.div>
      </div>

      {/* Zoo API integration */}
      <div className="mt-6">
        <SectionLabel>Zoo API Integration</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-5"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <ZooIntegrationCard
              icon={Plug}
              label="Native API Execution"
              value={telemetry.zooApiIntegration.nativeApiExecution}
            />
            <ZooIntegrationCard
              icon={Layers}
              label="Wrapper Layer"
              value={telemetry.zooApiIntegration.wrapperLayer}
            />
            <ZooIntegrationCard
              icon={ServerCog}
              label="Integration Point"
              value={telemetry.zooApiIntegration.integrationPoint}
              mono
            />
          </div>
          <div className="ive-divider mt-4 h-px w-full" />
          <p className="ive-mono mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
            Native Zoo Engine API execution is{" "}
            <span className="text-[var(--ive-blocked)]">NOT_DEMONSTRATED</span> within the
            frozen submission scope. The pipeline currently relies on the wrapper layer at{" "}
            <span className="text-foreground">pipeline/compute_provider.py</span>.
          </p>
        </motion.div>
      </div>

      {/* Raw telemetry tables */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <RawTelemetryCard
          title="rawSimulationMeta"
          icon={Cpu}
          rows={simMeta.rows}
          cols={simMeta.cols}
        />
        <RawTelemetryCard
          title="rawTrainingMetrics"
          icon={Activity}
          rows={training.rows}
          cols={training.cols}
        />
        <RawTelemetryCard
          title="rawBenchmarkData"
          icon={Gauge}
          rows={benchmark.rows}
          cols={benchmark.cols}
        />
      </div>

      {/* Hardware profile */}
      <div className="mt-6">
        <SectionLabel>Hardware Profile</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="ive-surface rounded-xl border border-white/[0.06] p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hwCells.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {c.label}
                </div>
                <div
                  className="mt-1 ive-mono break-words text-[12px] font-semibold"
                  style={{
                    color: c.missing ? "var(--ive-blocked)" : "var(--foreground)",
                  }}
                >
                  {c.value}
                </div>
              </div>
            ))}
          </div>
          <div className="ive-divider mt-4 h-px w-full" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusPill state="local emulation" accent="#CC7722" pulse />
            <span className="ive-mono text-[10px] text-muted-foreground/70">
              Remote cloud compute: NOT_DEMONSTRATED
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer note */}
      <div className="mt-6">
        <div className="ive-surface flex items-start gap-3 rounded-lg border border-white/[0.06] p-4">
          <Radio className="mt-0.5 h-4 w-4 flex-none text-[var(--ive-pending)]" />
          <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground/70">
            Telemetry is read from the frozen result contract. Missing values remain
            explicit: <span className="text-[var(--ive-blocked)]">UNDEFINED</span>,{" "}
            <span className="text-[var(--ive-blocked)]">MISSING</span>,{" "}
            <span className="text-[var(--ive-blocked)]">NOT_EVALUATED</span>,{" "}
            <span className="text-[var(--ive-blocked)]">REQUIRES VALIDATION</span>. No
            fabricated engineering metrics are emitted.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}

/* ------------------------------------------------------------------ */
/* sub-components                                                      */
/* ------------------------------------------------------------------ */

function RawTelemetryCard({
  title,
  icon: Icon,
  rows,
  cols,
}: {
  title: string;
  icon: typeof Cpu;
  rows: Record<string, string>[];
  cols: { key: string; label: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="ive-surface rounded-xl border border-white/[0.06] p-4"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded border"
          style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: ACCENT }} />
        </span>
        <span className="ive-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/85">
          {title}
        </span>
      </div>
      <div className="max-h-56 overflow-y-auto ive-scroll rounded-lg border border-white/[0.06]">
        <MonoTable rows={rows} cols={cols} />
      </div>
    </motion.div>
  );
}

function ZooIntegrationCard({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Plug;
  label: string;
  value: string;
  mono?: boolean;
}) {
  const missing = isExplicitMissing(value) || value === "NOT_DEMONSTRATED";
  const accent =
    value === "IMPLEMENTED"
      ? "var(--ive-proven)"
      : value === "NOT_DEMONSTRATED"
        ? "var(--ive-blocked)"
        : missing
          ? "var(--ive-blocked)"
          : ACCENT;
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md border"
          style={{ borderColor: `${accent}40`, background: `${accent}10` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        </span>
        <span className="ive-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
          {label}
        </span>
      </div>
      <div
        className={`mt-2 break-words text-[12px] font-semibold ${mono ? "ive-mono" : ""}`}
        style={{ color: missing ? accent : "var(--foreground)" }}
      >
        {value}
      </div>
      <div className="mt-2">
        <StatusPill
          state={
            value === "IMPLEMENTED"
              ? "PRESENT"
              : value === "NOT_DEMONSTRATED"
                ? "BLOCKED"
                : "REQUIRES VALIDATION"
          }
          accent={accent}
        />
      </div>
    </div>
  );
}
