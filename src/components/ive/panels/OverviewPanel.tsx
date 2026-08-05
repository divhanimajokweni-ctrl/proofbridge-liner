"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  ShieldCheck,
  FileCheck2,
  Workflow,
  Cpu,
  BookOpen,
  OctagonAlert,
  ArrowRight,
  Activity,
  Layers,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { VVULogo } from "../VVULogo";
import { PanelFrame, SectionLabel, StatCard, StatusPill } from "../primitives";
import { MiniMap } from "../MiniMap";

const WORKFLOW = [
  { icon: Boxes, label: "Procedural CAD", detail: "Zoo Engine · KCL", accent: "#3dffb0" },
  { icon: FileCheck2, label: "AI-assisted Specification", detail: "Zookeeper", accent: "#3d9bff" },
  { icon: Layers, label: "Proof Obligation Generation", detail: "Formal", accent: "#b23dff" },
  { icon: Cpu, label: "SMT Verification", detail: "Z3 · bounded", accent: "#C9A84C" },
  { icon: ShieldCheck, label: "Evidence Runtime", detail: "Deterministic", accent: "#3dffb0" },
  { icon: BookOpen, label: "Ledger + Provenance", detail: "Cryptographic", accent: "#C9A84C" },
  { icon: OctagonAlert, label: "Engineering Release Decision", detail: "BLOCKED", accent: "#ff4d5f" },
];

export function OverviewPanel() {
  const contract = useIveStore((s) => s.contract);
  const trustSphere = useIveStore((s) => s.trustSphere);

  const provenDims = [
    trustSphere.integrity,
    trustSphere.auditability,
    trustSphere.availability,
  ].filter(
    (d) => d.state === "VERIFIED" || d.state === "LEDGER_PRESENT" || d.state === "PRESENT",
  ).length;

  return (
    <PanelFrame
      title="Integrated Verification Environment"
      tag="IVE"
      accent="#C9A84C"
      mission="Engineer systems that can prove themselves. Bounded formal verification with cryptographically traceable evidence."
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] p-6 sm:p-8">
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 20%, rgba(201,168,76,0.10), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <VVULogo size={80} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="ive-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ive-gold)]/80">
              VVU · Integrated Verification Environment
            </div>
            <h1 className="mt-1.5 font-sans text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Engineer systems that{" "}
              <span className="text-[var(--ive-gold)]">can prove themselves.</span>
            </h1>
            <p className="ive-mono mt-2 max-w-[560px] text-[11px] leading-relaxed text-muted-foreground">
              IVE combines procedural CAD, AI-assisted specification generation, bounded formal
              verification, and cryptographically traceable evidence into a single deterministic
              workflow. Rather than asking engineers to trust software outputs, IVE produces
              evidence packages that can be independently reproduced and audited.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <StatusPill state="Engineering Release: BLOCKED" accent="var(--ive-blocked)" pulse />
            <StatusPill state="RC1 · Freeze Defined" accent="var(--ive-gold)" />
          </div>
        </div>
      </div>

      {/* Identity distinction */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="ive-surface rounded-xl border border-white/[0.06] p-5">
          <div className="ive-mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ive-gold)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-gold)]" />
            The Platform
          </div>
          <h3 className="font-sans text-lg font-bold text-foreground">VVU IVE</h3>
          <p className="ive-mono mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            The Integrated Verification Environment is the platform. It is responsible for project
            orchestration, evidence runtime, proof graph, trust sphere, deterministic execution,
            and artifact generation.
          </p>
        </div>
        <div className="ive-surface rounded-xl border border-white/[0.06] p-5">
          <div className="ive-mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ive-blocked)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-blocked)]" />
            The Demonstration Application
          </div>
          <h3 className="font-sans text-lg font-bold text-foreground">HBK MK-II Hydro-Gateway</h3>
          <p className="ive-mono mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            HBK MK-II is a hydraulic infrastructure research case study used to demonstrate the IVE
            workflow. It is <span className="text-foreground">not</span> the platform. IVE is the
            platform; HBK MK-II demonstrates one implementation of it.
          </p>
        </div>
      </div>

      {/* Core workflow */}
      <div className="mt-6">
        <SectionLabel>Core Workflow</SectionLabel>
        <div className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
            {WORKFLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-1 items-center gap-2 lg:flex-col">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.35 }}
                    className="flex flex-1 items-center gap-3 rounded-lg border border-white/[0.06] p-3 lg:flex-col lg:items-start lg:gap-2"
                  >
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-md border"
                      style={{ borderColor: `${step.accent}40`, background: `${step.accent}10` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: step.accent }} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-foreground">{step.label}</div>
                      <div className="ive-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        {step.detail}
                      </div>
                    </div>
                  </motion.div>
                  {i < WORKFLOW.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 flex-none text-muted-foreground/30 lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Trust Dimensions"
          value={`${provenDims}/6`}
          hint="verified dimensions"
          status="ok"
        />
        <StatCard
          label="Obligations"
          value="0 / 0"
          hint="evaluated · solver not linked"
          status="pending"
        />
        <StatCard
          label="Hardware"
          value="ROCm"
          hint="local Radeon emulation · 4.249× speedup"
          accent="#CC7722"
        />
        <StatCard
          label="Run ID"
          value={<span className="text-[13px]">ive-20260805</span>}
          hint="local radeon emulation pass"
          accent="#3d9bff"
        />
      </div>

      {/* System Map — visual grid of all 20 panels */}
      <div className="mt-6">
        <SectionLabel>System Map · All Surfaces</SectionLabel>
        <MiniMap />
      </div>

      {/* Evidence model */}
      <div className="mt-6">
        <SectionLabel>Evidence Model</SectionLabel>
        <div className="ive-surface rounded-xl border border-white/[0.06] p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Mathematical Proof", detail: "Valid only under declared assumptions.", accent: "var(--ive-proven)" },
              { label: "Engineering Evidence", detail: "Deterministic, reproducible packages.", accent: "var(--ive-gold)" },
              { label: "Physical Validation", detail: "OUT_OF_SCOPE for current sprint.", accent: "var(--ive-blocked)" },
            ].map((e) => (
              <div key={e.label} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.accent }} />
                  <span className="ive-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: e.accent }}>
                    {e.label}
                  </span>
                </div>
                <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground">{e.detail}</p>
              </div>
            ))}
          </div>
          <div className="ive-divider mt-4 h-px w-full" />
          <p className="ive-mono mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
            IVE intentionally blocks engineering release when required evidence is missing. Missing
            verification, unavailable integrations, or unevaluated engineering inputs are surfaced
            explicitly rather than concealed.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}
