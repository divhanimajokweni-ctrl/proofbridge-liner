"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavState = {
  state: string;
  frozen: { validation_event?: string; frozen_at?: string; commit_short?: string; image_status?: string } | null;
};

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", always: true },
  { href: "/validation", label: "Validation", show: "showValidation" },
  { href: "/rehearsal", label: "Rehearsal", show: "showRehearsal" },
  { href: "/evidence", label: "Evidence", show: "showEvidence" },
  { href: "/research", label: "Research", always: true },
  { href: "/runtime", label: "Runtime", show: "showRuntime" },
  { href: "/deployments", label: "Deployments", show: "showDeployments" },
  { href: "/administration", label: "Administration", show: "showAdministration" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [navState, setNavState] = useState<NavState | null>(null);

  useEffect(() => {
    fetch("/api/navigation/state")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setNavState)
      .catch(() => setNavState({ state: "REHEARSAL", frozen: null }));
  }, []);

  const stateStr = navState?.state ?? "REHEARSAL";
  const isRehearsal = stateStr === "REHEARSAL";
  const isRunning = stateStr === "RUNNING";
  const isComplete = stateStr === "COMPLETE";
  const isArchived = stateStr === "ARCHIVED";

  const visibility = {
    showRehearsal: isRehearsal || isRunning,
    showValidation: isRunning,
    showEvidence: isComplete || isArchived,
    showRuntime: isRunning || isComplete || isArchived,
    showDeployments: isComplete || isArchived,
    showAdministration: isRunning || isComplete || isArchived,
  } as const;

  const visible = NAV_ITEMS.filter((item) => item.always || visibility[item.show as keyof typeof visibility]);

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
              <div className="text-[10px] text-muted-foreground font-mono">Validation Platform · {stateStr}</div>
            </div>
          </div>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
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
          </nav>
        </div>
      </div>
    </header>
  );
}
