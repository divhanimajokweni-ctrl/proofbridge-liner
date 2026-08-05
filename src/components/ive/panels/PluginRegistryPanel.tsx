"use client";

import { motion } from "framer-motion";
import {
  Puzzle,
  Cpu,
  Boxes,
  Code2,
  Wrench,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, StatCard, MonoTable } from "../primitives";
import type { PluginMeta, PluginState } from "@/lib/ive/types";

const LIFECYCLE: PluginState[] = [
  "NOT_INSTALLED",
  "INSTALLED",
  "DORMANT",
  "ACTIVATED",
  "RUNNING",
  "IDLE",
];

const STATE_ACCENT: Record<PluginState, string> = {
  NOT_INSTALLED: "#8b949e",
  INSTALLED: "var(--ive-pending)",
  DORMANT: "#b23dff",
  ACTIVATED: "var(--ive-gold)",
  RUNNING: "var(--ive-proven)",
  IDLE: "#CC7722",
};

const PLUGIN_ICON: Record<PluginMeta["id"], LucideIcon> = {
  amd: Cpu,
  zoo: Boxes,
  github: Code2,
  cad: Puzzle,
  figma: Wrench,
  ros2: Puzzle,
  matlab: Wrench,
  plc: Wrench,
};

function countByState(plugins: PluginMeta[], state: PluginState): number {
  return plugins.filter((p) => p.state === state).length;
}

export function PluginRegistryPanel() {
  const plugins = useIveStore((s) => s.plugins);
  const setPluginState = useIveStore((s) => s.setPluginState);

  const running = countByState(plugins, "RUNNING");
  const activated = countByState(plugins, "ACTIVATED");
  const installed = countByState(plugins, "INSTALLED");
  const notInstalled = countByState(plugins, "NOT_INSTALLED");
  const nativeCount = plugins.filter((p) => p.native).length;
  const wrapperCount = plugins.length - nativeCount;

  return (
    <PanelFrame
      title="Plugin Registry"
      tag="PR"
      accent="#C9A84C"
      mission="Plugin lifecycle: NOT_INSTALLED → INSTALLED → DORMANT → ACTIVATED → RUNNING → IDLE."
    >
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Running"
          value={running}
          hint="actively serving requests"
          status="ok"
        />
        <StatCard
          label="Activated"
          value={activated}
          hint="ready but not actively running"
          accent="var(--ive-gold)"
        />
        <StatCard
          label="Installed"
          value={installed}
          hint="present, awaiting activation"
          status="pending"
        />
        <StatCard
          label="Not Installed"
          value={notInstalled}
          hint="no integration present"
          status="error"
        />
      </div>

      {/* Native vs wrapper legend */}
      <div className="mt-6">
        <SectionLabel>Integration Type Legend</SectionLabel>
        <div className="ive-surface grid grid-cols-1 gap-3 rounded-lg border border-white/[0.06] p-3.5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
              style={{
                borderColor: `${STATE_ACCENT.RUNNING}40`,
                background: `${STATE_ACCENT.RUNNING}10`,
              }}
            >
              <Cpu className="h-3.5 w-3.5" style={{ color: STATE_ACCENT.RUNNING }} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="ive-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ive-proven)]">
                  Native
                </span>
                <span className="ive-mono text-[9px] text-muted-foreground/60">
                  {nativeCount} plugin{nativeCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground">
                Real SDK / vendor integration. Backed by the actual runtime library
                (e.g. ROCm HIP / PyTorch ROCm).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
              style={{
                borderColor: `${STATE_ACCENT.ACTIVATED}40`,
                background: `${STATE_ACCENT.ACTIVATED}10`,
              }}
            >
              <Wrench className="h-3.5 w-3.5" style={{ color: STATE_ACCENT.ACTIVATED }} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="ive-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--ive-gold)]">
                  Wrapper
                </span>
                <span className="ive-mono text-[9px] text-muted-foreground/60">
                  {wrapperCount} plugin{wrapperCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground">
                Project-authored adapter. Wraps an external surface; not the
                upstream SDK. Integration point declared per plugin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle stepper reference */}
      <div className="mt-6">
        <SectionLabel>Lifecycle State Machine</SectionLabel>
        <div className="ive-surface overflow-x-auto rounded-lg border border-white/[0.06] p-3.5">
          <div className="flex min-w-[640px] items-center gap-1">
            {LIFECYCLE.map((s, i) => {
              const accent = STATE_ACCENT[s];
              const isLast = i === LIFECYCLE.length - 1;
              return (
                <div key={s} className="flex flex-1 items-center gap-1">
                  <div
                    className="flex flex-col items-center gap-1.5 rounded-md border px-2 py-2"
                    style={{
                      borderColor: `${accent}30`,
                      background: `${accent}08`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: accent }}
                    />
                    <span
                      className="ive-mono text-[8.5px] font-semibold uppercase tracking-wider"
                      style={{ color: accent }}
                    >
                      {s}
                    </span>
                  </div>
                  {!isLast && (
                    <span className="ive-mono text-[10px] text-muted-foreground/40">→</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="ive-mono mt-2.5 text-[9.5px] leading-relaxed text-muted-foreground/60">
            Click any state below a plugin to advance that plugin into the chosen
            state. Lifecycle transitions are advisory and do not fabricate runtime
            integration.
          </p>
        </div>
      </div>

      {/* Plugin cards grid */}
      <div className="mt-6">
        <SectionLabel>Registered Plugins · {plugins.length}</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {plugins.map((p, i) => {
            const Icon = PLUGIN_ICON[p.id] ?? Puzzle;
            const accent = p.accent;
            const currentStateIdx = LIFECYCLE.indexOf(p.state);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="ive-surface flex flex-col rounded-xl border border-white/[0.06] p-4"
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-md border"
                    style={{
                      borderColor: `${accent}40`,
                      background: `${accent}10`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className="ive-mono rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          borderColor: `${accent}40`,
                          background: `${accent}10`,
                          color: accent,
                        }}
                      >
                        {p.tag}
                      </span>
                      <h3 className="font-sans text-sm font-bold text-foreground">
                        {p.label}
                      </h3>
                      <span
                        className="ive-mono rounded px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider"
                        style={{
                          color: p.native
                            ? "var(--ive-proven)"
                            : "var(--ive-gold)",
                          background: p.native
                            ? "rgba(61,255,176,0.10)"
                            : "rgba(201,168,76,0.10)",
                        }}
                      >
                        {p.native ? "NATIVE" : "WRAPPER"}
                      </span>
                    </div>
                    <div className="ive-mono mt-1 flex items-center gap-2 text-[9.5px] text-muted-foreground/70">
                      <span>version:</span>
                      <span
                        className={
                          p.version === "UNDEFINED" || p.version === "REQUIRES VALIDATION"
                            ? "text-[var(--ive-blocked)]"
                            : "text-foreground/80"
                        }
                      >
                        {p.version}
                      </span>
                    </div>
                  </div>
                  <StatusPill
                    state={p.state}
                    accent={STATE_ACCENT[p.state]}
                    pulse={p.state === "RUNNING"}
                  />
                </div>

                {/* Description */}
                <p className="ive-mono mt-3 text-[10px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>

                {/* Interactive lifecycle stepper for this plugin */}
                <div className="mt-3">
                  <div className="ive-mono mb-1.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
                    <CircleDot className="h-3 w-3" />
                    Lifecycle
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {LIFECYCLE.map((s, idx) => {
                      const sAccent = STATE_ACCENT[s];
                      const isCurrent = s === p.state;
                      const isReached = idx <= currentStateIdx;
                      return (
                        <button
                          key={s}
                          onClick={() => setPluginState(p.id, s)}
                          title={`Set ${p.label} → ${s}`}
                          className="ive-mono flex flex-none items-center gap-1 rounded border px-1.5 py-1 text-[8px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.04]"
                          style={{
                            borderColor: isCurrent
                              ? sAccent
                              : isReached
                                ? `${sAccent}40`
                                : "rgba(255,255,255,0.06)",
                            background: isCurrent
                              ? `${sAccent}20`
                              : isReached
                                ? `${sAccent}08`
                                : "transparent",
                            color: isCurrent
                              ? sAccent
                              : isReached
                                ? `${sAccent}aa`
                                : "rgba(255,255,255,0.35)",
                          }}
                        >
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{ background: isCurrent ? sAccent : "currentColor" }}
                          />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lifecycle distribution table */}
      <div className="mt-6">
        <SectionLabel>Lifecycle Distribution</SectionLabel>
        <MonoTable
          cols={[
            { key: "state", label: "State" },
            { key: "count", label: "Count", className: "text-right" },
            { key: "plugins", label: "Plugins" },
          ]}
          rows={LIFECYCLE.map((s) => ({
            state: (
              <span
                className="ive-mono font-semibold uppercase tracking-wider"
                style={{ color: STATE_ACCENT[s] }}
              >
                {s}
              </span>
            ),
            count: (
              <span className="ive-mono tabular-nums">{countByState(plugins, s)}</span>
            ),
            plugins: plugins
              .filter((p) => p.state === s)
              .map((p) => p.tag)
              .join(" · ") || "—",
          }))}
        />
      </div>
    </PanelFrame>
  );
}
