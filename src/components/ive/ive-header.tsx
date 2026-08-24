"use client";

import { HoloSigil } from "./holo-sigil";
import { gateOverallScore } from "@/lib/ive/data";

export function IveHeader({
  activeTab,
  onTab,
}: {
  activeTab: string;
  onTab: (id: string) => void;
}) {
  const score = gateOverallScore();
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 ive-glass">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HoloSigil size={48} />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.2em] ive-text-gold">
                  VVU · IVE
                </span>
                <span className="rounded-full border ive-border-gold px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ive-text-gold">
                  v2.0 · HBK Mk-II
                </span>
              </div>
              <h1 className="font-mono text-sm font-semibold text-foreground md:text-base">
                Immersive Virtual Environment · Hydro-Bayesian Kernel
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Watchdog Maturity
              </span>
              <div className="relative h-2 w-28 overflow-hidden rounded-full bg-secondary">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-chart-3 to-chart-1"
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="font-mono text-xs font-semibold ive-text-gold">
                {score}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                AIR · live
              </span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <nav
          className="ive-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto pb-1"
          aria-label="IVE platform views"
        >
          {[
            { id: "overview", label: "Command Center", icon: "LayoutDashboard" },
            { id: "hbk", label: "HBK Mk-II Kernel", icon: "Atom" },
            { id: "facilitator", label: "Facilitator Agent", icon: "Bot" },
            { id: "integration", label: "Agnostic Integration", icon: "Layers" },
            { id: "air", label: "AIR Runtime", icon: "Activity" },
            { id: "crypto", label: "Cryptographic & Governance", icon: "Lock" },
            { id: "sandbox", label: "Accretion Sandbox", icon: "Orbit" },
          ].map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={
                  "group relative whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-all " +
                  (active
                    ? "ive-text-gold bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60")
                }
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-[oklch(0.82_0.16_75)] to-transparent" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
