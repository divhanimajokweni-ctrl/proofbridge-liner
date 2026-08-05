"use client";

import { motion } from "framer-motion";
import { useIveStore, PANELS, PANEL_MAP } from "@/store/useIveStore";
import type { WorkspacePanelId } from "@/lib/ive/types";

/**
 * MiniMap
 * -------
 * A compact visual grid of all 20 IVE workspace panels, grouped by category.
 * Each cell shows the panel tag, label, and a live state indicator. The
 * active panel is highlighted. Clicking a cell navigates to that panel.
 *
 * Used on the Overview panel as a "system map" — a bird's-eye view of the
 * entire engineering operating system at a glance.
 */

const GROUP_ORDER = ["core", "release", "runtime", "case-study", "system"] as const;
const GROUP_LABELS: Record<string, string> = {
  core: "Core",
  release: "Release",
  runtime: "Runtime",
  "case-study": "Case Study",
  system: "System",
};

export function MiniMap() {
  const activePanel = useIveStore((s) => s.activePanel);
  const setActivePanel = useIveStore((s) => s.setActivePanel);
  const trustSphere = useIveStore((s) => s.trustSphere);
  const proofProgress = useIveStore((s) => s.proofProgress);
  const plugins = useIveStore((s) => s.plugins);

  // Derive a per-panel state indicator.
  function panelState(id: WorkspacePanelId): { label: string; color: string } {
    switch (id) {
      case "trust": {
        const proven = [trustSphere.integrity, trustSphere.auditability, trustSphere.availability]
          .filter((d) => d.state === "VERIFIED" || d.state === "LEDGER_PRESENT" || d.state === "PRESENT").length;
        return { label: `${proven}/6`, color: proven >= 4 ? "var(--ive-proven)" : "var(--ive-pending)" };
      }
      case "proof":
        return { label: `${proofProgress}/8`, color: proofProgress === 0 ? "var(--ive-pending)" : proofProgress >= 6 ? "var(--ive-proven)" : "var(--ive-gold)" };
      case "release":
        return { label: "NO-GO", color: "var(--ive-blocked)" };
      case "amd":
        return { label: "4.249×", color: "#CC7722" };
      case "zoo":
        return { label: "WRAPPER", color: "var(--ive-proven)" };
      case "plugins": {
        const running = plugins.filter((p) => p.state === "RUNNING").length;
        return { label: `${running} run`, color: running > 0 ? "var(--ive-proven)" : "var(--ive-pending)" };
      }
      case "watchdog":
        return { label: "NORMAL", color: "var(--ive-proven)" };
      case "lindiwe":
        return { label: "DORMANT", color: "var(--ive-pending)" };
      case "acceptance":
        return { label: "8/8", color: "var(--ive-proven)" };
      case "integrity":
        return { label: "6/7", color: "var(--ive-gold)" };
      default:
        return { label: "READY", color: "var(--ive-pending)" };
    }
  }

  return (
    <div className="ive-surface rounded-xl border border-white/[0.06] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="ive-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
            System Map
          </span>
          <span className="ive-mono text-[9px] text-muted-foreground/40">
            · {PANELS.length} surfaces
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="ive-mono flex items-center gap-1 text-[8px] text-muted-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-proven)]" /> ready
          </span>
          <span className="ive-mono flex items-center gap-1 text-[8px] text-muted-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-pending)]" /> pending
          </span>
          <span className="ive-mono flex items-center gap-1 text-[8px] text-muted-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-blocked)]" /> blocked
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {GROUP_ORDER.map((group) => {
          const groupPanels = PANELS.filter((p) => p.group === group);
          const accent = groupPanels[0]?.accent ?? "#8b949e";
          return (
            <div key={group} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
                <span className="ive-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/50">
                  {GROUP_LABELS[group]}
                </span>
                <span className="h-px flex-1 bg-white/[0.04]" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                {groupPanels.map((p, i) => {
                  const isActive = activePanel === p.id;
                  const state = panelState(p.id);
                  return (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      onClick={() => setActivePanel(p.id)}
                      className={`group relative flex flex-col gap-1 overflow-hidden rounded-md border p-2 text-left transition-all ${
                        isActive
                          ? "border-white/20 bg-white/[0.06]"
                          : "border-white/[0.05] bg-white/[0.01] hover:border-white/12 hover:bg-white/[0.03]"
                      }`}
                      title={p.mission}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-y-0 left-0 w-[2px]"
                          style={{ background: p.accent, boxShadow: `0 0 8px ${p.accent}` }}
                        />
                      )}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="ive-mono text-[8px] font-bold"
                          style={{ color: p.accent }}
                        >
                          {p.tag}
                        </span>
                        <span
                          className="h-1 w-1 rounded-full"
                          style={{ background: state.color, boxShadow: `0 0 4px ${state.color}80` }}
                        />
                      </div>
                      <span className="truncate text-[9.5px] font-medium text-foreground/85">
                        {p.label}
                      </span>
                      <span
                        className="ive-mono text-[8px] font-semibold"
                        style={{ color: state.color }}
                      >
                        {state.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
