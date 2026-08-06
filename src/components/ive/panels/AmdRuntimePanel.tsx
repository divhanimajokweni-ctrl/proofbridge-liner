"use client";

import { motion } from "framer-motion";
import {
  Cpu,
  Gauge,
  MemoryStick,
  Timer,
  Zap,
  Activity,
  AlertTriangle,
  Terminal,
  ServerCog,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, StatCard, MonoTable } from "../primitives";

/** Speedup ratio used for the benchmark visualization. Drawn from the frozen
 *  contract; never fabricated here. */
const CPU_BASELINE = 1.0;
const MAX_BAR_SCALE = 5.0; // visual ceiling so 4.249× sits clearly above 1.0×

export function AmdRuntimePanel() {
  const hardwareProfile = useIveStore((s) => s.hardwareProfile);
  const contract = useIveStore((s) => s.contract);

  const speedup =
    typeof hardwareProfile.speedupRatio === "number"
      ? hardwareProfile.speedupRatio
      : null;
  const rocmBarWidth = speedup
    ? `${Math.min((speedup / MAX_BAR_SCALE) * 100, 100)}%`
    : "0%";
  const cpuBarWidth = `${(CPU_BASELINE / MAX_BAR_SCALE) * 100}%`;

  const benchmarkMeta = contract.telemetry.rawBenchmarkData as Record<string, unknown>;
  const iterations =
    typeof benchmarkMeta.iterations === "number" ? benchmarkMeta.iterations : "UNDEFINED";

  return (
    <PanelFrame
      title="AMD Runtime"
      tag="AMD"
      accent="#CC7722"
      mission="ROCm / HIP / PyTorch GPU acceleration status. Local Radeon emulation context."
      actions={
        <StatusPill
          state="ACTIVATED"
          accent="var(--ive-gold)"
          pulse
        />
      }
    >
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Provider"
          value={hardwareProfile.provider}
          hint="HIP backend (emulated)"
          accent="#CC7722"
        />
        <StatCard
          label="Reported Device"
          value={<span className="text-[13px] leading-tight">{hardwareProfile.reportedDevice}</span>}
          hint="local emulation context"
          accent="#CC7722"
        />
        <StatCard
          label="Speedup Ratio"
          value={speedup ? `${speedup.toFixed(3)}×` : "UNDEFINED"}
          hint="vs CPU baseline 1.0×"
          status="ok"
        />
        <StatCard
          label="Provider Status"
          value="ACTIVATED"
          hint="local Radeon emulation active"
          accent="var(--ive-gold)"
        />
      </div>

      {/* Stack detail */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          {/* Backend stack */}
          <div>
            <SectionLabel>HIP / ROCm / PyTorch Stack</SectionLabel>
            <div className="ive-surface grid grid-cols-1 gap-3 rounded-xl border border-white/[0.06] p-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-[#CC7722]/40 bg-[#CC7722]/10">
                  <Cpu className="h-4 w-4 text-[#CC7722]" />
                </span>
                <div className="min-w-0">
                  <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    HIP Backend
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold text-foreground">
                    {hardwareProfile.hip}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-[#CC7722]/40 bg-[#CC7722]/10">
                  <ServerCog className="h-4 w-4 text-[#CC7722]" />
                </span>
                <div className="min-w-0">
                  <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    PyTorch
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold text-foreground">
                    {hardwareProfile.pytorch}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md border border-[#CC7722]/40 bg-[#CC7722]/10">
                  <Activity className="h-4 w-4 text-[#CC7722]" />
                </span>
                <div className="min-w-0">
                  <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    Backend
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold text-foreground">
                    {hardwareProfile.backend}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark visualization */}
          <div>
            <SectionLabel>Benchmark · CPU Baseline vs ROCm</SectionLabel>
            <div className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                {/* CPU baseline */}
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        CPU Baseline · AMD Ryzen 9 7950X
                      </span>
                    </div>
                    <span className="ive-mono text-[12px] font-bold tabular-nums text-muted-foreground">
                      {CPU_BASELINE.toFixed(3)}×
                    </span>
                  </div>
                  <div className="h-5 w-full overflow-hidden rounded-md bg-white/[0.04]">
                    <motion.div
                      className="flex h-full items-center justify-end rounded-md bg-white/20 px-2"
                      initial={{ width: 0 }}
                      animate={{ width: cpuBarWidth }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <span className="ive-mono text-[8.5px] font-semibold text-muted-foreground">
                        REF
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* ROCm */}
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-[#CC7722]" />
                      <span className="ive-mono text-[10px] uppercase tracking-wider text-[#CC7722]">
                        ROCm (emulated) · Local Radeon
                      </span>
                    </div>
                    <span className="ive-mono text-[14px] font-bold tabular-nums text-[#CC7722]">
                      {speedup ? `${speedup.toFixed(3)}×` : "UNDEFINED"}
                    </span>
                  </div>
                  <div className="h-7 w-full overflow-hidden rounded-md bg-white/[0.04]">
                    <motion.div
                      className="flex h-full items-center justify-end rounded-md px-2"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(204,119,34,0.35), rgba(204,119,34,0.85))",
                        boxShadow: "0 0 16px rgba(204,119,34,0.35)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: rocmBarWidth }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                    >
                      <span className="ive-mono text-[9px] font-bold text-black/70">
                        ROCm
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="ive-divider mt-4 h-px w-full" />
              <div className="ive-mono mt-3 grid grid-cols-2 gap-3 text-[9.5px] text-muted-foreground/70 sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground/50">iterations: </span>
                  <span className="tabular-nums text-foreground/85">
                    {typeof iterations === "number" ? iterations.toLocaleString() : iterations}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground/50">scale: </span>
                  <span className="text-foreground/85">0 → {MAX_BAR_SCALE.toFixed(1)}×</span>
                </div>
                <div>
                  <span className="text-muted-foreground/50">remote cloud compute: </span>
                  <span className="text-[var(--ive-blocked)]">NotImplemented</span>
                </div>
              </div>
            </div>
          </div>

          {/* system_info style card */}
          <div>
            <SectionLabel>system_info · Run Trace</SectionLabel>
            <div className="ive-surface overflow-hidden rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <Terminal className="h-3.5 w-3.5 text-[#CC7722]" />
                <span className="ive-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  amdruntime · system_info()
                </span>
              </div>
              <div className="p-4">
                <div className="ive-mono grid grid-cols-1 gap-x-6 gap-y-1.5 text-[10.5px] sm:grid-cols-2">
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">device</span>
                    <span className="text-right text-foreground/85">{hardwareProfile.reportedDevice}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">backend</span>
                    <span className="text-right text-foreground/85">{hardwareProfile.backend}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">provider</span>
                    <span className="text-right text-foreground/85">{hardwareProfile.provider}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">hip</span>
                    <span className="text-right text-foreground/85">{hardwareProfile.hip}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">pytorch</span>
                    <span className="text-right text-foreground/85">{hardwareProfile.pytorch}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">speedup</span>
                    <span className="text-right tabular-nums text-[#CC7722]">
                      {speedup ? `${speedup.toFixed(3)}×` : "UNDEFINED"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">iterations</span>
                    <span className="text-right tabular-nums text-foreground/85">
                      {typeof iterations === "number" ? iterations.toLocaleString() : iterations}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5">
                    <span className="text-muted-foreground/60">seed_determinism</span>
                    <span className="text-right text-[var(--ive-pending)]">NOT_EVALUATED</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.04] pt-3">
                  <MemoryStick className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="ive-mono text-[10px] text-muted-foreground/70">
                    memory: <span className="text-[var(--ive-blocked)]">REQUIRES VALIDATION</span>
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <Timer className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="ive-mono text-[10px] text-muted-foreground/70">
                    execution_time: <span className="text-[var(--ive-blocked)]">REQUIRES VALIDATION</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Important note */}
          <div>
            <SectionLabel>Emulation Context</SectionLabel>
            <div className="ive-surface flex items-start gap-3 rounded-xl border border-[#CC7722]/25 bg-[#CC7722]/[0.05] p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[#CC7722]" />
              <div className="min-w-0">
                <div className="ive-mono text-[10px] font-semibold uppercase tracking-wider text-[#CC7722]">
                  Local Radeon Emulation
                </div>
                <p className="ive-mono mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  Local Radeon emulation context detected on branch{" "}
                  <span className="text-foreground">mi300x-rocm-run-20260804</span>.
                  Remote cloud compute modules evaluated to{" "}
                  <span className="text-[var(--ive-blocked)]">NotImplemented</span>. Seed
                  determinism <span className="text-[var(--ive-pending)]">NOT_EVALUATED</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Memory & execution time */}
          <div>
            <SectionLabel>Unmeasured Metrics</SectionLabel>
            <div className="ive-surface flex flex-col gap-2.5 rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Memory
                  </span>
                </div>
                <StatusPill state="REQUIRES VALIDATION" accent="var(--ive-blocked)" />
              </div>
              <div className="h-px w-full bg-white/[0.06]" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Execution Time
                  </span>
                </div>
                <StatusPill state="REQUIRES VALIDATION" accent="var(--ive-blocked)" />
              </div>
              <div className="h-px w-full bg-white/[0.06]" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="ive-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Seed Determinism
                  </span>
                </div>
                <StatusPill state="NOT_EVALUATED" accent="var(--ive-pending)" />
              </div>
            </div>
            <p className="ive-mono mt-2 text-[9.5px] leading-relaxed text-muted-foreground/60">
              No memory or wall-clock figures are emitted. Fabricated telemetry
              values are explicitly refused by the runtime.
            </p>
          </div>

          {/* Trace table */}
          <div>
            <SectionLabel>Hardware Profile</SectionLabel>
            <MonoTable
              cols={[
                { key: "field", label: "Field" },
                { key: "value", label: "Value" },
              ]}
              rows={[
                { field: "provider", value: hardwareProfile.provider },
                { field: "device", value: hardwareProfile.reportedDevice },
                { field: "backend", value: hardwareProfile.backend },
                { field: "hip", value: hardwareProfile.hip },
                { field: "pytorch", value: hardwareProfile.pytorch },
                {
                  field: "speedup",
                  value: (
                    <span className="tabular-nums text-[#CC7722]">
                      {speedup ? `${speedup.toFixed(3)}×` : "UNDEFINED"}
                    </span>
                  ),
                },
                {
                  field: "memory",
                  value: <span className="text-[var(--ive-blocked)]">REQUIRES VALIDATION</span>,
                },
                {
                  field: "exec_time",
                  value: <span className="text-[var(--ive-blocked)]">REQUIRES VALIDATION</span>,
                },
                {
                  field: "remote_cloud",
                  value: <span className="text-[var(--ive-blocked)]">NotImplemented</span>,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
