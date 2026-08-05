"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileJson,
  Copy,
  Check,
  FileText,
  Hash,
  ShieldCheck,
  BookOpen,
  GitBranch,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill, MonoTable } from "../primitives";
import type { ArtifactFile } from "@/lib/ive/types";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* JSON syntax highlighter                                             */
/* ------------------------------------------------------------------ */

function highlightJson(json: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  // Groups: 1=key (string + colon), 2=string value, 3=number, 4=bool/null,
  //         5=punctuation, 6=whitespace
  const regex =
    /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],])|(\s+)|([^\s{}[\],])/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(json)) !== null) {
    if (m[1]) {
      // split key from trailing colon for distinct styling
      const colonIdx = m[1].length - 1 - (m[1].length - m[1].trimEnd().length);
      const keyStr = m[1].slice(0, colonIdx);
      const colon = m[1].slice(colonIdx);
      tokens.push(
        <span key={key++} style={{ color: "var(--ive-gold)" }}>
          {keyStr}
        </span>,
      );
      tokens.push(
        <span key={key++} style={{ color: "rgba(255,255,255,0.45)" }}>
          {colon}
        </span>,
      );
    } else if (m[2]) {
      tokens.push(
        <span key={key++} style={{ color: "var(--ive-proven)" }}>
          {m[2]}
        </span>,
      );
    } else if (m[3]) {
      tokens.push(
        <span key={key++} style={{ color: "#CC7722" }}>
          {m[3]}
        </span>,
      );
    } else if (m[4]) {
      tokens.push(
        <span key={key++} style={{ color: "var(--ive-zk)" }}>
          {m[4]}
        </span>,
      );
    } else if (m[5]) {
      tokens.push(
        <span key={key++} style={{ color: "rgba(255,255,255,0.5)" }}>
          {m[5]}
        </span>,
      );
    } else if (m[6]) {
      tokens.push(<span key={key++}>{m[6]}</span>);
    } else if (m[7]) {
      tokens.push(
        <span key={key++} style={{ color: "rgba(255,255,255,0.5)" }}>
          {m[7]}
        </span>,
      );
    }
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Artifact status helpers                                             */
/* ------------------------------------------------------------------ */

function statusAccent(status: ArtifactFile["status"]): string {
  if (status === "PRESENT") return "var(--ive-proven)";
  if (status === "MISSING") return "var(--ive-blocked)";
  return "var(--ive-pending)";
}

const SCHEMA_ICONS: Record<string, LucideIcon> = {
  IVEResultContract: FileJson,
  MetricsBundle: Hash,
  "LedgerEntry[]": BookOpen,
  ProvenanceChain: GitBranch,
  "sha256 list": ShieldCheck,
  SubmissionManifest: FileText,
  "YAML config": FileText,
};

/* ------------------------------------------------------------------ */
/* JSON tab definition                                                 */
/* ------------------------------------------------------------------ */

interface JsonTab {
  id: string;
  label: string;
  filename: string;
  schema: string;
  icon: LucideIcon;
  data: unknown;
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function ArtifactsPanel() {
  const artifacts = useIveStore((s) => s.artifacts);
  const contract = useIveStore((s) => s.contract);
  const metricsBundle = useIveStore((s) => s.metricsBundle);
  const ledgerBundle = useIveStore((s) => s.ledgerBundle);
  const provenanceChain = useIveStore((s) => s.provenanceChain);

  const tabs: JsonTab[] = useMemo(
    () => [
      {
        id: "results",
        label: "results.json",
        filename: "ive-output/results.json",
        schema: "IVEResultContract",
        icon: FileJson,
        data: contract,
      },
      {
        id: "metrics",
        label: "metrics.json",
        filename: "ive-output/metrics.json",
        schema: "MetricsBundle",
        icon: Hash,
        data: metricsBundle,
      },
      {
        id: "ledger",
        label: "ledger.json",
        filename: "outputs/ledger.json",
        schema: "LedgerEntry[]",
        icon: BookOpen,
        data: ledgerBundle,
      },
      {
        id: "provenance",
        label: "provenance.json",
        filename: "outputs/provenance.json",
        schema: "ProvenanceChain",
        icon: GitBranch,
        data: provenanceChain,
      },
    ],
    [contract, metricsBundle, ledgerBundle, provenanceChain],
  );

  const [activeTabId, setActiveTabId] = useState<string>("results");
  const [copied, setCopied] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const jsonText = useMemo(
    () => JSON.stringify(activeTab.data, null, 2),
    [activeTab],
  );

  const presentCount = artifacts.filter((a) => a.status === "PRESENT").length;
  const missingCount = artifacts.filter((a) => a.status === "MISSING").length;
  const reqCount = artifacts.filter((a) => a.status === "REQUIRES_VALIDATION").length;

  const artifactRows = artifacts.map((a) => {
    const Icon = SCHEMA_ICONS[a.schema] ?? FileText;
    return {
      name: (
        <span className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-foreground/90">{a.name}</span>
        </span>
      ),
      path: <span className="text-[10px] text-muted-foreground/70">{a.path}</span>,
      schema: <span style={{ color: "var(--ive-gold)" }}>{a.schema}</span>,
      status: <StatusPill state={a.status} accent={statusAccent(a.status)} />,
      desc: <span className="text-[10px] leading-relaxed text-muted-foreground/70">{a.description}</span>,
    };
  });

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(activeTab.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <PanelFrame
      title="Artifacts"
      tag="ART"
      accent="#8b949e"
      mission="Generated evidence package: results, metrics, ledger, provenance, checksums."
      actions={
        <div className="hidden items-center gap-2 sm:flex">
          <StatusPill state={`${presentCount} PRESENT`} accent="var(--ive-proven)" />
          {missingCount > 0 && <StatusPill state={`${missingCount} MISSING`} accent="var(--ive-blocked)" />}
          <StatusPill state={`${reqCount} REQ. VALIDATION`} accent="var(--ive-pending)" />
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Left: artifacts table */}
        <div>
          <SectionLabel>Artifact Manifest · {artifacts.length}</SectionLabel>
          <MonoTable
            cols={[
              { key: "name", label: "Name" },
              { key: "path", label: "Path" },
              { key: "schema", label: "Schema" },
              { key: "status", label: "Status" },
              { key: "desc", label: "Description" },
            ]}
            rows={artifactRows}
          />
          <div className="ive-mono mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ive-proven)" }} />
              PRESENT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ive-blocked)" }} />
              MISSING
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ive-pending)" }} />
              REQUIRES_VALIDATION
            </span>
          </div>
        </div>

        {/* Right: tabbed JSON viewer */}
        <div>
          <SectionLabel>Frozen Contract · JSON View</SectionLabel>
          <div className="ive-surface overflow-hidden rounded-xl border border-white/[0.06]">
            {/* Tab bar */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-black/30 px-2 py-1.5">
              <div className="ive-scroll -mx-1 flex flex-1 gap-1 overflow-x-auto px-1">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = t.id === activeTabId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTabId(t.id)}
                      className={`ive-mono inline-flex flex-none items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] transition-all ${
                        active
                          ? "bg-[var(--ive-gold)]/12 text-[var(--ive-gold)]"
                          : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={copyJson}
                className="ive-mono inline-flex flex-none items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[9.5px] text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Copy ${activeTab.label}`}
              >
                {copied === activeTab.id ? (
                  <>
                    <Check className="h-3 w-3" style={{ color: "var(--ive-proven)" }} />
                    <span style={{ color: "var(--ive-proven)" }}>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* File path bar */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] bg-black/20 px-3 py-1.5">
              <div className="ive-mono flex min-w-0 items-center gap-1.5 text-[9.5px] text-muted-foreground/70">
                <FileJson className="h-3 w-3 flex-none" />
                <span className="truncate">{activeTab.filename}</span>
              </div>
              <span
                className="ive-mono flex-none rounded px-1.5 py-0.5 text-[8.5px]"
                style={{
                  color: "var(--ive-gold)",
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                {activeTab.schema}
              </span>
            </div>

            {/* JSON content */}
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="ive-scroll max-h-[460px] overflow-auto bg-black/40"
            >
              <pre className="ive-mono px-3 py-3 text-[10.5px] leading-relaxed">
                <code className="whitespace-pre">{highlightJson(jsonText)}</code>
              </pre>
            </motion.div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.04] bg-black/20 px-3 py-1.5">
              <span className="ive-mono text-[9px] text-muted-foreground/60">
                {jsonText.length.toLocaleString()} bytes · utf-8 · 2-space indent
              </span>
              <span className="ive-mono text-[9px] text-muted-foreground/50">
                deterministic · frozen
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deterministic note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-5 flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-4"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" style={{ color: "var(--ive-proven)" }} />
        <p className="ive-mono text-[10.5px] leading-relaxed text-muted-foreground/85">
          These artifacts form a deterministic evidence package. Every execution produces the same
          set. Missing artifacts are explicitly marked. No value is fabricated — missing fields
          remain <span style={{ color: "var(--ive-blocked)" }}>MISSING</span> /{" "}
          <span style={{ color: "var(--ive-pending)" }}>REQUIRES VALIDATION</span>.
        </p>
        <TriangleAlert
          className="ml-auto h-4 w-4 flex-none opacity-50"
          style={{ color: "var(--ive-gold)" }}
        />
      </motion.div>
    </PanelFrame>
  );
}
