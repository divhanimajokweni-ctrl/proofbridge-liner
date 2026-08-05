"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Building2,
  Boxes,
  Cpu,
  History,
  CheckCircle2,
  Info,
  ScrollText,
  Tags,
  Lock,
} from "lucide-react";
import { IDENTITY_REGISTRY, STATUS_VOCABULARY, type IdentityEntry } from "@/lib/ive/release";
import { PanelFrame, SectionLabel, StatusPill } from "../primitives";

const ACCENT = "#b23dff";

type RoleKey = IdentityEntry["role"];

interface RoleMeta {
  color: string;
  icon: typeof Building2;
  blurb: string;
}

const ROLE_META: Record<RoleKey, RoleMeta> = {
  Platform: {
    color: "#C9A84C",
    icon: Building2,
    blurb: "The verification environment itself. Owns orchestration, evidence runtime, proof graph, trust sphere, deterministic execution, and artifact generation.",
  },
  "Demonstration Application": {
    color: "#ff4d5f",
    icon: Boxes,
    blurb: "A case study (HBK MK-II Hydro-Gateway) used to demonstrate the IVE workflow. Explicitly NOT the platform.",
  },
  "Independent Component": {
    color: "#3d9bff",
    icon: Cpu,
    blurb: "A separately-scoped component (AIR Runtime, Lindiwe) that plugs into IVE. Never presented as IVE itself.",
  },
  "Verification OS": {
    color: "#3dffb0",
    icon: ShieldCheck,
    blurb: "Trust OS — the operating system inside IVE that hosts the verification runtime. Legitimate reference, preserved.",
  },
  Historical: {
    color: "#8b949e",
    icon: History,
    blurb: "Legacy project names preserved inside historical evidence. Not rewritten; explained through an external index.",
  },
};

/** Color a Status Vocabulary token by its semantics. */
function stateAccent(token: string, group: "Proof Obligation States" | "Evidence / Component States"): string {
  if (token === "PROVEN" || token === "VERIFIED") return "var(--ive-proven)";
  if (token === "DISPROVEN" || token === "SOLVER_ERROR" || token === "MISSING" || token === "BLOCKED")
    return "var(--ive-blocked)";
  if (
    token === "BLOCKED_MISSING_INPUT" ||
    token === "BLOCKED_UNVERIFIED_INPUT" ||
    token === "PRESENT_UNVERIFIED" ||
    token === "NOT_DEMONSTRATED" ||
    token === "UNEVALUATED"
  )
    return "var(--ive-pending)";
  if (token === "REQUIRES VALIDATION" || token === "REQUIRES ENGINEERING DATA") return "var(--ive-gold)";
  if (token === "OUT_OF_SCOPE") return "#8b949e";
  return group === "Proof Obligation States" ? "var(--ive-zk)" : "#8b949e";
}

export function IdentityRegistryPanel() {
  return (
    <PanelFrame
      title="Identity Registry"
      tag="IDR"
      accent={ACCENT}
      mission="Platform vs demo vs independent components vs historical. Legitimate references preserved, not deleted."
    >
      {/* Hero — identity-conflict-handling rule */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-xl border border-white/[0.06] p-5 sm:p-6"
      >
        <div className="ive-grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 90% 10%, rgba(178,61,255,0.10), transparent 55%)",
          }}
        />
        <div className="relative flex items-start gap-4">
          <span
            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border"
            style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}
          >
            <Tags className="h-5 w-5" style={{ color: ACCENT }} />
          </span>
          <div className="min-w-0">
            <div className="ive-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ive-zk)]/80">
              Identity Conflict Handling · Addendum
            </div>
            <p className="ive-mono mt-1.5 text-[11px] leading-relaxed text-foreground/85">
              <span className="font-semibold text-foreground">“Remove every conflicting identity”</span> means correct
              active submission-facing documents, remove obsolete duplicate entrypoints, label independent components
              accurately, and prevent HBK MK-II, AIR, or Epistemic Runtime from being presented as IVE. It does{" "}
              <span className="font-semibold text-foreground">NOT</span> mean deleting legitimate references to AIR,
              Epistemic Runtime, historical project names, or Trust OS as the verification OS inside IVE.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Identity Registry — core */}
      <div className="mt-6">
        <SectionLabel>Identity Registry · {IDENTITY_REGISTRY.length} entries</SectionLabel>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {IDENTITY_REGISTRY.map((entry, i) => {
            const meta = ROLE_META[entry.role];
            const RoleIcon = meta.icon;
            return (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="ive-surface relative flex gap-3 overflow-hidden rounded-lg border border-white/[0.06] p-4"
              >
                {/* Left vertical accent bar — role color */}
                <span
                  className="absolute inset-y-0 left-0 w-1 flex-none"
                  style={{ background: meta.color }}
                  aria-hidden
                />
                <div className="ml-1 flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-sans text-[13.5px] font-bold leading-tight text-foreground">
                        {entry.name}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className="ive-mono inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
                          style={{
                            borderColor: `${meta.color}40`,
                            background: `${meta.color}10`,
                            color: meta.color,
                          }}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {entry.role}
                        </span>
                        <StatusPill state={entry.status} accent={meta.color} />
                      </div>
                    </div>
                    {entry.preserved && (
                      <span
                        className="ive-mono inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
                        style={{
                          borderColor: "rgba(61,255,176,0.35)",
                          background: "rgba(61,255,176,0.10)",
                          color: "var(--ive-proven)",
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Preserved
                      </span>
                    )}
                  </div>
                  <p className="ive-mono text-[10.5px] leading-relaxed text-muted-foreground">{entry.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Role legend */}
      <div className="mt-6">
        <SectionLabel>Role Legend</SectionLabel>
        <div className="ive-surface rounded-lg border border-white/[0.06] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(ROLE_META) as RoleKey[]).map((role) => {
              const meta = ROLE_META[role];
              const Icon = meta.icon;
              return (
                <div key={role} className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded border"
                    style={{ borderColor: `${meta.color}40`, background: `${meta.color}10` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </span>
                  <div className="min-w-0">
                    <div className="ive-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                      {role}
                    </div>
                    <p className="ive-mono mt-0.5 text-[9.5px] leading-relaxed text-muted-foreground/70">
                      {meta.blurb}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Vocabulary */}
      <div className="mt-6">
        <SectionLabel>Status Vocabulary · proof states vs evidence/component states</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {STATUS_VOCABULARY.map((group, gi) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08, duration: 0.3 }}
              className="ive-surface flex flex-col rounded-lg border border-white/[0.06] p-4"
            >
              <div className="ive-mono mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
                <ScrollText
                  className="h-3.5 w-3.5"
                  style={{ color: group.group === "Proof Obligation States" ? "var(--ive-zk)" : "var(--ive-gold)" }}
                />
                {group.group}
              </div>
              <div className="flex flex-col gap-2">
                {group.states.map((s) => {
                  const accent = stateAccent(s.token, group.group);
                  return (
                    <div key={s.token} className="flex flex-col gap-1 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                      <StatusPill state={s.token} accent={accent} />
                      <p className="ive-mono pl-1 text-[9.5px] leading-relaxed text-muted-foreground/70">{s.use}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
        <div
          className="mt-3 flex items-start gap-2.5 rounded-lg border p-3"
          style={{
            borderColor: "rgba(255,77,95,0.25)",
            background: "rgba(255,77,95,0.05)",
          }}
        >
          <Info className="h-4 w-4 flex-none" style={{ color: "var(--ive-blocked)" }} />
          <p className="ive-mono text-[10px] leading-relaxed text-foreground/85">
            Use proof states only for proof obligations. Use evidence/component states separately. Do not report an
            unevaluated proof obligation as <span className="font-semibold text-[var(--ive-proven)]">PROVEN</span>,{" "}
            <span className="font-semibold text-[var(--ive-blocked)]">DISPROVEN</span>, or{" "}
            <span className="font-semibold text-foreground">“safe.”</span>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-6">
        <div className="ive-surface flex items-start gap-2.5 rounded-lg border border-white/[0.06] p-4">
          <Lock className="h-4 w-4 flex-none text-[var(--ive-gold)]/70" />
          <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground">
            Historical artifacts are not rewritten to match current identity. Outdated terminology in historical
            evidence is explained through an external index or run manifest rather than invalidating hashes.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}
