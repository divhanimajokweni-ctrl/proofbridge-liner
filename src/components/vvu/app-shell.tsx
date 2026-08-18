"use client";

/**
 * AppShell — top-level layout for the VVU dashboard.
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │ [logo] VVU · IVE/STUDI  breadcrumb  [switcher] [live]│  header
 *   ├─────────┬───────────────────────────────────────────┤
 *   │ sidebar │ breadcrumb · page title                   │  sub-header
 *   │  nav    ├───────────────────────────────────────────┤
 *   │         │                                            │
 *   │         │  main content                              │
 *   │         │                                            │
 *   ├─────────┴───────────────────────────────────────────┤
 *   │ footer: theorem strip + status line                  │  footer
 *   └─────────────────────────────────────────────────────┘
 */

import { useWorkspace } from "@/lib/workspace";
import { VvuLogo } from "./logo";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarNav } from "./sidebar-nav";
import { Activity, Bell, Search } from "lucide-react";

interface AppShellProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  pageTitle: string;
  pageAbbr: string;
  breadcrumb: string[];
  children: React.ReactNode;
  /** Optional content for the right side of the sub-header strip (e.g. status pills) */
  statusStrip?: React.ReactNode;
}

export function AppShell({
  activeSection,
  onSectionChange,
  pageTitle,
  pageAbbr,
  breadcrumb,
  children,
  statusStrip,
}: AppShellProps) {
  const { meta, workspace } = useWorkspace();
  const accentColor =
    workspace === "studi" ? "var(--vvu-studi)" : "var(--vvu-ive)";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ─── Top header ─── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <VvuLogo size={32} />
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold tracking-tight">VVU</span>
                <span
                  className="rounded px-1 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `var(${meta.accentVar})`,
                    color: "oklch(0.145 0 0)",
                  }}
                >
                  {meta.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  · {meta.tagline}
                </span>
              </div>
            </div>
          </div>

          {/* Spacer + top status / switcher */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-background/50 px-2 py-1 text-xs md:flex">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                aria-label="Search"
              />
            </div>
            <span
              className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 md:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px 0 currentColor" }} />
              LIVE
            </span>
            <button
              className="relative rounded-md border border-border bg-background/50 p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-background">
                3
              </span>
            </button>
            <WorkspaceSwitcher />
          </div>
        </div>
      </header>

      {/* ─── Body: sidebar + main ─── */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar/60 md:block">
          <div className="max-h-[calc(100vh-3.5rem-2rem)] overflow-y-auto scrollbar-thin">
            <SidebarNav
              activeSection={activeSection}
              onSectionChange={onSectionChange}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Sub-header: breadcrumb + page title + status strip */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card/40 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span
                className="rounded px-1 py-0.5 font-bold tracking-wider"
                style={{
                  backgroundColor: `color-mix(in oklab, ${accentColor} 22%, transparent)`,
                  color: accentColor,
                }}
              >
                {meta.name}
              </span>
              {breadcrumb.map((seg, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground/40">/</span>
                  <span
                    className={
                      i === breadcrumb.length - 1
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {seg}
                  </span>
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-md border border-border bg-background/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {pageAbbr}
              </span>
              {statusStrip}
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-[1400px] px-4 py-4">{children}</div>
          </main>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card/50">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Activity className="h-2.5 w-2.5 text-emerald-400" />
            {meta.full}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>EIS Theorem 5: fail-closed</span>
          <span className="text-muted-foreground/40">·</span>
          <span>Reliability Contract v1.1 · locked Aug 18</span>
          <span className="text-muted-foreground/40">·</span>
          <span>Launch: Sept 15</span>
          <span className="ml-auto flex items-center gap-2">
            <span>BOOTSTRAP: OK</span>
            <span className="text-muted-foreground/40">·</span>
            <span
              className="rounded px-1.5 py-0.5 font-bold tracking-wider"
              style={{
                backgroundColor: `color-mix(in oklab, ${accentColor} 22%, transparent)`,
                color: accentColor,
              }}
            >
              {meta.name}
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}
