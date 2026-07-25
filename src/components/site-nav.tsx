"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Lifecycle = {
  state: string;
  currentHour?: number | null;
  currentPhase?: string | null;
  validationIndex?: number | null;
  runtimeHealthy?: boolean | null;
  evidenceReady?: boolean | null;
  deploymentReady?: boolean | null;
  productionPublished?: boolean | null;
};

const ROLE_ITEMS: Record<string, { label: string; href: string; show: (lifecycle: Lifecycle) => boolean }[]> = {
  observer: [
    { label: "Overview", href: "/overview", show: () => true },
    { label: "Evidence", href: "/evidence", show: (lc) => (lc.evidenceReady === true || lc.state === "COMPLETE" || lc.state === "ARCHIVED") },
    { label: "Research", href: "/research", show: () => true },
  ],
  validation_observer: [
    { label: "Overview", href: "/overview", show: () => true },
    { label: "Validation", href: "/validation", show: (lc) => lc.state === "RUNNING" || lc.state === "VERIFYING" },
    { label: "Evidence", href: "/evidence", show: (lc) => (lc.evidenceReady === true || lc.state === "COMPLETE" || lc.state === "ARCHIVED") },
    { label: "Research", href: "/research", show: () => true },
  ],
  operator: [
    { label: "Overview", href: "/overview", show: () => true },
    { label: "Validation", href: "/validation", show: (lc) => lc.state === "RUNNING" || lc.state === "VERIFYING" },
    { label: "Runtime", href: "/runtime", show: () => true },
    { label: "Deployments", href: "/deployments", show: () => true },
    { label: "Administration", href: "/administration", show: () => true },
  ],
  administrator: [
    { label: "Overview", href: "/overview", show: () => true },
    { label: "Validation", href: "/validation", show: () => true },
    { label: "Evidence", href: "/evidence", show: () => true },
    { label: "Research", href: "/research", show: () => true },
    { label: "Runtime", href: "/runtime", show: () => true },
    { label: "Deployments", href: "/deployments", show: () => true },
    { label: "Administration", href: "/administration", show: () => true },
  ],
};

export function SiteNav() {
  const pathname = usePathname();
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [role, setRole] = useState<string>("observer");

  useEffect(() => {
    fetch("/api/app-state")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setLifecycle)
      .catch(() => setLifecycle({ state: "REHEARSAL" }));
  }, []);

  const baseLifecycle = lifecycle ?? { state: "REHEARSAL" } as Lifecycle;
  const navItems = ROLE_ITEMS[role] ?? ROLE_ITEMS.observer;
  const visible = navItems.filter((item) => item.show(baseLifecycle));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex items-center gap-3 h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center">
              <span className="text-verified font-bold text-xs">VVU</span>
            </div>
            <div className="leading-none">
              <div className="text-sm font-semibold tracking-tight">Venture Vision Ubuntu</div>
              <div className="text-[10px] text-muted-foreground font-mono">Validation Platform · {baseLifecycle.state}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              {visible.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "inline-flex shrink-0 items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-all " +
                      (isActive
                        ? "bg-verified/10 text-verified border border-verified/30 shadow-sm shadow-verified/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent")
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <select
              aria-label="Access role"
              className="h-7 rounded-md border border-border/60 bg-muted/40 px-2 text-[10px] text-muted-foreground"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="observer">Public Observer</option>
              <option value="validation_observer">Validation Observer</option>
              <option value="operator">Operator</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
