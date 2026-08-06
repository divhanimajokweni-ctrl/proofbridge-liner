"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  FileCode2,
  TriangleAlert,
  ShieldX,
  Layers3,
  Building2,
  Server,
  Microscope,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, MonoTable } from "../primitives";
import type { ReactNode } from "react";
import type { CadPart, HBK_ARCHITECTURE } from "@/lib/ive/cad";

type HbkTier = (typeof HBK_ARCHITECTURE)["tiers"][number];

/* ------------------------------------------------------------------ */
/* KCL code rendering                                                  */
/* ------------------------------------------------------------------ */

const KCL_KEYWORDS = new Set([
  "import",
  "from",
  "as",
  "sketch",
  "on",
  "circle",
  "line",
  "extrude",
  "revolve",
  "translate",
  "rotate",
  "scale",
  "appearance",
  "coincident",
  "diameter",
  "start",
  "center",
  "axis",
  "angle",
  "length",
  "symmetric",
  "global",
  "color",
  "metalness",
  "roughness",
  "let",
  "fn",
  "return",
  "var",
]);

function tokenizeKclLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Order matters: comment → string → number → identifier → operator/punct
  const regex =
    /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:mm|deg)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_"//]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(line)) !== null) {
    if (m[1]) {
      nodes.push(
        <span key={key++} className="italic" style={{ color: "rgba(255,255,255,0.32)" }}>
          {m[1]}
        </span>,
      );
    } else if (m[2]) {
      nodes.push(
        <span key={key++} style={{ color: "var(--ive-proven)" }}>
          {m[2]}
        </span>,
      );
    } else if (m[3]) {
      nodes.push(
        <span key={key++} style={{ color: "var(--ive-gold)" }}>
          {m[3]}
        </span>,
      );
    } else if (m[4]) {
      if (KCL_KEYWORDS.has(m[4])) {
        nodes.push(
          <span key={key++} className="font-semibold" style={{ color: "#b23dff" }}>
            {m[4]}
          </span>,
        );
      } else {
        nodes.push(
          <span key={key++} style={{ color: "rgba(255,255,255,0.85)" }}>
            {m[4]}
          </span>,
        );
      }
    } else if (m[5]) {
      nodes.push(<span key={key++}>{m[5]}</span>);
    } else if (m[6]) {
      nodes.push(
        <span key={key++} style={{ color: "rgba(255,255,255,0.45)" }}>
          {m[6]}
        </span>,
      );
    }
  }
  return nodes;
}

function KclBlock({ kcl }: { kcl: string }) {
  const lines = kcl.split("\n");
  return (
    <div className="ive-scroll overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40">
      <pre className="ive-mono min-w-full py-3 text-[11px] leading-relaxed">
        <code className="block">
          {lines.map((line, i) => (
            <div key={i} className="flex hover:bg-white/[0.02]">
              <span className="ive-mono w-10 shrink-0 select-none pr-3 text-right text-[9.5px] text-muted-foreground/35">
                {i + 1}
              </span>
              <span className="whitespace-pre pr-4">{tokenizeKclLine(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tier card                                                           */
/* ------------------------------------------------------------------ */

const TIER_ICONS: Record<string, LucideIcon> = {
  "tier-1": Microscope,
  "tier-2": Building2,
  "tier-3": Server,
};

function TierCard({ tier, index }: { tier: HbkTier; index: number }) {
  const Icon = TIER_ICONS[tier.id] ?? Layers3;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="ive-surface rounded-lg border border-white/[0.06] p-3.5"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
          style={{ borderColor: "var(--ive-gold)40", background: "var(--ive-gold)10" }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--ive-gold)" }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-bold text-foreground">{tier.name}</div>
          <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground/80">
            {tier.mission}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="ive-mono mb-1.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
          Owns
        </div>
        <ul className="flex flex-col gap-1">
          {tier.owns.map((o) => (
            <li
              key={o}
              className="ive-mono flex items-start gap-1.5 text-[10px] leading-relaxed text-foreground/75"
            >
              <span className="mt-1 h-1 w-1 flex-none rounded-full bg-[var(--ive-proven)]/70" />
              {o}
            </li>
          ))}
        </ul>
      </div>

      {tier.requiresEngineeringData.length > 0 && (
        <div className="mt-3">
          <div className="ive-mono mb-1.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.16em] text-[var(--ive-blocked)]/80">
            <CircleAlert className="h-3 w-3" />
            Requires Engineering Data
          </div>
          <ul className="flex flex-col gap-1.5">
            {tier.requiresEngineeringData.map((r) => (
              <li
                key={r}
                className="flex items-center justify-between gap-2 rounded border border-[var(--ive-blocked)]/20 bg-[var(--ive-blocked)]/[0.04] px-2 py-1"
              >
                <span className="ive-mono text-[9.5px] leading-tight text-foreground/80">{r}</span>
                <span
                  className="ive-mono shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                  style={{
                    color: "var(--ive-blocked)",
                    background: "rgba(255,77,95,0.1)",
                    border: "1px solid rgba(255,77,95,0.25)",
                  }}
                >
                  REQUIRES ENG. DATA
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function HbkWorkspacePanel() {
  const hbk = useIveStore((s) => s.hbk);
  const { cadParts, architecture, activePartId, setActivePartId } = hbk;
  const activePart: CadPart | undefined = cadParts.find((p) => p.id === activePartId) ?? cadParts[0];

  const paramRows = activePart.parameters.map((p) => ({
    param: p.label,
    value: p.value,
    unit: p.unit || "—",
  }));

  return (
    <PanelFrame
      title="HBK Workspace"
      tag="HBK"
      accent="#ff4d5f"
      mission="HBK MK-II Hydro-Gateway demonstration case study."
      actions={<StatusPill state="Case Study · NOT the platform" accent="var(--ive-blocked)" pulse />}
    >
      {/* Identity banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border border-[var(--ive-blocked)]/20 p-4 sm:p-5"
      >
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-25" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 90% 30%, rgba(255,77,95,0.10), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-md border"
              style={{
                borderColor: "rgba(255,77,95,0.3)",
                background: "rgba(255,77,95,0.08)",
              }}
            >
              <Boxes className="h-5 w-5" style={{ color: "var(--ive-blocked)" }} />
            </span>
            <div>
              <div className="ive-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--ive-blocked)]/80">
                Demonstration Application
              </div>
              <h3 className="mt-0.5 font-sans text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                HBK MK-II Hydro-Gateway — Demonstration Application{" "}
                <span className="text-[var(--ive-blocked)]">(NOT the platform)</span>
              </h3>
              <p className="ive-mono mt-1 max-w-[560px] text-[10.5px] leading-relaxed text-muted-foreground">
                Transportable hydraulic instrumentation skid. Stationary during operation, no onboard
                propulsion modeled. IVE is the platform; HBK MK-II demonstrates one implementation.
              </p>
            </div>
          </div>
          <div className="flex flex-none flex-col gap-1.5">
            <StatusPill state="3-tier architecture" accent="var(--ive-gold)" />
            <StatusPill state="CAD frozen · KCL 2.0" accent="#8b949e" />
          </div>
        </div>
      </motion.div>

      {/* Main grid: parts list | part detail | architecture */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        {/* Left: CAD parts list */}
        <div>
          <SectionLabel>CAD Parts · {cadParts.length}</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {cadParts.map((p, i) => {
              const active = p.id === activePartId;
              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActivePartId(p.id)}
                  className={`group flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                    active
                      ? "border-[var(--ive-blocked)]/40 bg-[var(--ive-blocked)]/[0.06]"
                      : "border-white/[0.06] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-md border"
                    style={{
                      borderColor: active
                        ? "rgba(255,77,95,0.4)"
                        : "rgba(201,168,76,0.25)",
                      background: active ? "rgba(255,77,95,0.1)" : "rgba(201,168,76,0.06)",
                    }}
                  >
                    <FileCode2
                      className="h-3.5 w-3.5"
                      style={{ color: active ? "var(--ive-blocked)" : "var(--ive-gold)" }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold text-foreground">
                      {p.name}
                    </div>
                    <div className="ive-mono truncate text-[9px] text-muted-foreground/60">
                      {p.file}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Center: active part detail */}
        <div className="flex flex-col gap-4">
          {activePart && (
            <>
              <motion.div
                key={activePart.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="ive-surface rounded-xl border border-white/[0.06] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="ive-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ive-gold)]/80">
                      Active Part · {activePart.id}
                    </div>
                    <h3 className="mt-1 font-sans text-lg font-bold tracking-tight text-foreground">
                      {activePart.name}
                    </h3>
                    <div className="ive-mono mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <FileCode2 className="h-3 w-3" />
                      {activePart.file}
                    </div>
                  </div>
                  <StatusPill state="KCL 2.0 · parametric" accent="var(--ive-gold)" />
                </div>
                <p className="ive-mono mt-3 text-[10.5px] leading-relaxed text-muted-foreground/85">
                  {activePart.description}
                </p>
              </motion.div>

              <div>
                <SectionLabel>Parameters</SectionLabel>
                <MonoTable
                  cols={[
                    { key: "param", label: "Parameter" },
                    { key: "value", label: "Value" },
                    { key: "unit", label: "Unit", className: "text-right" },
                  ]}
                  rows={paramRows.map((r) => ({
                    ...r,
                    value:
                      r.value === "REQUIRES ENGINEERING DATA" ? (
                        <span style={{ color: "var(--ive-blocked)" }}>{r.value}</span>
                      ) : (
                        <span style={{ color: "var(--ive-gold)" }}>{r.value}</span>
                      ),
                  }))}
                />
              </div>

              <div>
                <SectionLabel>KCL Source · {activePart.file}</SectionLabel>
                <KclBlock kcl={activePart.kcl} />
              </div>
            </>
          )}
        </div>

        {/* Right: architecture tiers */}
        <div>
          <SectionLabel>HBK MK-II Architecture · 3 Tiers</SectionLabel>
          <div className="flex flex-col gap-3">
            {architecture.tiers.map((tier, i) => (
              <TierCard key={tier.id} tier={tier} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Architecture rules */}
      <div className="mt-6">
        <SectionLabel>Architecture Rules</SectionLabel>
        <div className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {architecture.rules.map((rule, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.015] p-2.5"
              >
                <span
                  className="ive-mono mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded text-[9px] font-bold"
                  style={{
                    color: "var(--ive-gold)",
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.25)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ive-mono text-[10px] leading-relaxed text-foreground/80">
                  {rule}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--ive-blocked)]/25 bg-[var(--ive-blocked)]/[0.04] p-4"
      >
        <ShieldX
          className="mt-0.5 h-4 w-4 flex-none"
          style={{ color: "var(--ive-blocked)" }}
        />
        <div>
          <div className="ive-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--ive-blocked)]/90">
            Safety Boundary
          </div>
          <p className="ive-mono mt-1 text-[10.5px] leading-relaxed text-muted-foreground/85">
            Hydraulic actuation authority <span className="text-[var(--ive-blocked)]">UNDEFINED</span>.
            Baseline architecture is observation-first and fails to a non-actuating state. No
            certification language applies to this demonstration case study.
          </p>
        </div>
        <TriangleAlert
          className="ml-auto h-4 w-4 flex-none opacity-60"
          style={{ color: "var(--ive-blocked)" }}
        />
      </motion.div>
    </PanelFrame>
  );
}
