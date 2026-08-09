"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KEYBOARD_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";
import {
  Home as HomeIcon,
  BookOpen,
  Users,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Zap,
  GitCompare,
  Keyboard,
  Activity,
  Clock,
  CornerDownLeft,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileCode2,
  Sigma,
  Rocket,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────

export type PaletteView = "landing" | "docs" | "ive" | "roles" | "pilot";

/**
 * IVE actions that can be triggered from the command palette. These are
 * dispatched as DOM CustomEvents so the IVEView (when mounted) can react.
 * When IVEView is not yet mounted, the action is stashed as "pending" and
 * consumed by IVEView on mount.
 */
export type IVEAction = "newClaim" | "refresh" | "seed" | "toggleCompare";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (v: PaletteView) => void;
  currentView: PaletteView;
}

// ─── Pending-action bridge (consumed by IVEView on mount) ─────────────

let pendingIVEAction: IVEAction | null = null;

export function setPendingIVEAction(action: IVEAction): void {
  pendingIVEAction = action;
  // Also dispatch a live event in case IVEView is already mounted.
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<IVEAction>("vvu-ive-action", { detail: action }),
    );
  }
}

export function consumePendingIVEAction(): IVEAction | null {
  const a = pendingIVEAction;
  pendingIVEAction = null;
  return a;
}

// ─── Recently-used commands (localStorage-backed) ─────────────────────

const RECENT_KEY = "vvu-recent-cmds";
const MAX_RECENT = 5;

let recentCommands: string[] = [];

function loadRecent(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        recentCommands = parsed.filter((x) => typeof x === "string").slice(0, MAX_RECENT);
      }
    }
  } catch {
    /* ignore */
  }
}

function pushRecent(id: string): void {
  recentCommands = [id, ...recentCommands.filter((c) => c !== id)].slice(0, MAX_RECENT);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentCommands));
    } catch {
      /* ignore */
    }
  }
}

// ─── Command model ────────────────────────────────────────────────────

interface Cmd {
  id: string;
  label: string;
  group: "Navigation" | "IVE Actions" | "Quick Info";
  icon: LucideIcon;
  shortcut?: string;
  keywords?: string;
  run: () => void;
}

// ─── System health snapshot ───────────────────────────────────────────

interface HealthSnapshot {
  totalClaims: number;
  totalEvidence: number;
  avgNInd: number;
  authRate: number;
  breakerEvents: number;
}

// ─── Component ────────────────────────────────────────────────────────

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  currentView,
}: CommandPaletteProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [recentTick, setRecentTick] = useState(0);
  const { toast } = useToast();
  const recentLoadedRef = useRef(false);

  // Load recently-used commands on mount
  useEffect(() => {
    if (recentLoadedRef.current) return;
    recentLoadedRef.current = true;
    loadRecent();
    setRecentTick((t) => t + 1);
  }, []);

  // Global ⌘K / Ctrl+K listener — registered whenever this component mounts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          onOpenChange(!open);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Fetch system health snapshot from /api/claims and compute metrics.
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const list: Array<{
        evidence?: unknown[];
        authorizations?: Array<{ authorized?: boolean }>;
        nIndRecords?: Array<{ nInd?: number }>;
        circuitEvents?: Array<{ triggered?: boolean }>;
      }> = Array.isArray(data.claims) ? data.claims : Array.isArray(data) ? data : [];
      const totalClaims = list.length;
      const totalEvidence = list.reduce((s, c) => s + (c.evidence?.length ?? 0), 0);
      const avgNInd =
        totalClaims > 0
          ? list.reduce((s, c) => s + (c.nIndRecords?.[0]?.nInd ?? 0), 0) / totalClaims
          : 0;
      const authRate =
        totalClaims > 0
          ? (list.filter((c) => c.authorizations?.[0]?.authorized).length / totalClaims) * 100
          : 0;
      const breakerEvents = list.reduce(
        (s, c) => s + (c.circuitEvents?.filter((e) => e.triggered).length ?? 0),
        0,
      );
      setHealth({ totalClaims, totalEvidence, avgNInd, authRate, breakerEvents });
    } catch {
      setHealth(null);
      toast({
        title: "Could not load system health",
        description: "The IVE claims endpoint is unreachable.",
      });
    } finally {
      setHealthLoading(false);
    }
  }, [toast]);

  const openHealth = useCallback(() => {
    setHealthOpen(true);
    void fetchHealth();
  }, [fetchHealth]);

  // Helper to run a command: record recent + close palette + execute.
  const run = useCallback(
    (id: string, fn: () => void) => {
      pushRecent(id);
      setRecentTick((t) => t + 1);
      onOpenChange(false);
      // Defer execution so the palette's exit animation isn't blocked.
      setTimeout(() => fn(), 0);
    },
    [onOpenChange],
  );

  // Build command list (recomputed each render so closures stay fresh).
  const commands: Cmd[] = [
    // Navigation
    {
      id: "nav:home",
      label: "Go to Home",
      group: "Navigation",
      icon: HomeIcon,
      shortcut: "1",
      keywords: "landing start overview",
      run: () => onNavigate("landing"),
    },
    {
      id: "nav:docs",
      label: "Go to Docs",
      group: "Navigation",
      icon: BookOpen,
      shortcut: "2",
      keywords: "documentation theorems eis specification",
      run: () => onNavigate("docs"),
    },
    {
      id: "nav:roles",
      label: "Go to Roles",
      group: "Navigation",
      icon: Users,
      shortcut: "4",
      keywords: "rtcas role matrix authorization",
      run: () => onNavigate("roles"),
    },
    {
      id: "nav:pilot",
      label: "Go to BA-1 Pilot",
      group: "Navigation",
      icon: Rocket,
      shortcut: "5",
      keywords: "pilot ba-1 calibration timeline engagement sow professional services",
      run: () => onNavigate("pilot"),
    },
    {
      id: "nav:ive",
      label: "Go to IVE",
      group: "Navigation",
      icon: LayoutDashboard,
      shortcut: "3",
      keywords: "integrated verification environment dashboard claims",
      run: () => onNavigate("ive"),
    },

    // IVE Actions
    {
      id: "ive:newClaim",
      label: "New Claim",
      group: "IVE Actions",
      icon: Plus,
      shortcut: "N",
      keywords: "create add claim",
      run: () => {
        onNavigate("ive");
        setPendingIVEAction("newClaim");
      },
    },
    {
      id: "ive:refresh",
      label: "Refresh Claims",
      group: "IVE Actions",
      icon: RefreshCw,
      shortcut: "R",
      keywords: "reload sync fetch",
      run: () => {
        onNavigate("ive");
        setPendingIVEAction("refresh");
      },
    },
    {
      id: "ive:seed",
      label: "Seed Demo Data",
      group: "IVE Actions",
      icon: Zap,
      shortcut: "S",
      keywords: "demo sample generate populate",
      run: () => {
        onNavigate("ive");
        setPendingIVEAction("seed");
      },
    },
    {
      id: "ive:toggleCompare",
      label: "Toggle Compare Mode",
      group: "IVE Actions",
      icon: GitCompare,
      keywords: "compare diff side by side claims",
      run: () => {
        onNavigate("ive");
        setPendingIVEAction("toggleCompare");
      },
    },

    // Quick Info
    {
      id: "info:shortcuts",
      label: "Show Keyboard Shortcuts",
      group: "Quick Info",
      icon: Keyboard,
      shortcut: "?",
      keywords: "help keys hotkey",
      run: () => setShortcutsOpen(true),
    },
    {
      id: "info:health",
      label: "Show System Health",
      group: "Quick Info",
      icon: Activity,
      keywords: "metrics status monitor live",
      run: openHealth,
    },
  ];

  // Resolve recently-used commands (in order) — excluding any that no longer exist.
  const recentCmds: Cmd[] =
    recentTick >= 0
      ? recentCommands
          .map((id) => commands.find((c) => c.id === id))
          .filter((c): c is Cmd => Boolean(c))
      : [];

  const byGroup = (g: Cmd["group"]) => commands.filter((c) => c.group === g);

  const renderCmd = (c: Cmd) => {
    const Icon = c.icon;
    return (
      <CommandItem
        key={c.id}
        value={`${c.label} ${c.keywords ?? ""}`}
        onSelect={() => run(c.id, c.run)}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1">{c.label}</span>
        {c.shortcut && <CommandShortcut>{c.shortcut}</CommandShortcut>}
      </CommandItem>
    );
  };

  // Detach "current view" hint for the footer of the palette.
  const viewLabel: Record<PaletteView, string> = {
    landing: "Home",
    docs: "Docs",
    roles: "Roles",
    pilot: "Pilot",
    ive: "IVE",
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Command Palette"
        description="Search commands and actions across the VVU SEARM Platform."
        className="sm:max-w-xl"
      >
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>

          {recentCmds.length > 0 && (
            <CommandGroup heading="Recently Used">
              {recentCmds.map(renderCmd)}
            </CommandGroup>
          )}

          <CommandGroup heading="Navigation">
            {byGroup("Navigation").map(renderCmd)}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="IVE Actions">
            {byGroup("IVE Actions").map(renderCmd)}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Info">
            {byGroup("Quick Info").map(renderCmd)}
          </CommandGroup>
        </CommandList>

        {/* Footer hint row */}
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" />
            <span>to select</span>
            <span aria-hidden>·</span>
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[9px]">esc</kbd>
            <span>to close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="opacity-60">View:</span>
            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
              {viewLabel[currentView]}
            </Badge>
          </div>
        </div>
      </CommandDialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Global and IVE-scoped shortcuts. Shortcuts are disabled while
              typing in form fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Global
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Command palette
                  </span>
                  <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                    ⌘K / Ctrl+K
                  </kbd>
                </div>
                {KEYBOARD_SHORTCUTS.filter((s) => s.group === "Nav").map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                IVE
              </p>
              <div className="space-y-1.5">
                {KEYBOARD_SHORTCUTS.filter((s) => s.group === "IVE").map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShortcutsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Health Dialog */}
      <Dialog
        open={healthOpen}
        onOpenChange={(o) => {
          setHealthOpen(o);
          if (!o) {
            setHealth(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              System Health
            </DialogTitle>
            <DialogDescription>
              Live snapshot of the EIS claims store. Open the IVE for full
              telemetry.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {healthLoading && (
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-md bg-muted/60 animate-pulse"
                  />
                ))}
              </div>
            )}
            {!healthLoading && health && (
              <div className="grid grid-cols-2 gap-2">
                <HealthCard
                  icon={Layers}
                  label="Total Claims"
                  value={String(health.totalClaims)}
                  tone="neutral"
                />
                <HealthCard
                  icon={FileCode2}
                  label="Total Evidence"
                  value={String(health.totalEvidence)}
                  tone="neutral"
                />
                <HealthCard
                  icon={Sigma}
                  label="Avg N_ind"
                  value={
                    health.totalClaims > 0
                      ? health.avgNInd.toFixed(2)
                      : "—"
                  }
                  tone={
                    health.avgNInd >= 2
                      ? "good"
                      : health.avgNInd >= 1
                      ? "warn"
                      : "bad"
                  }
                />
                <HealthCard
                  icon={ShieldCheck}
                  label="Auth Rate"
                  value={
                    health.totalClaims > 0
                      ? `${health.authRate.toFixed(0)}%`
                      : "—"
                  }
                  tone={
                    health.authRate >= 50
                      ? "good"
                      : health.authRate > 0
                      ? "warn"
                      : "bad"
                  }
                />
                <HealthCard
                  icon={AlertTriangle}
                  label="Breaker Events"
                  value={String(health.breakerEvents)}
                  tone={health.breakerEvents > 0 ? "bad" : "good"}
                  className="col-span-2"
                />
              </div>
            )}
            {!healthLoading && !health && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Could not load system health.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHealthOpen(false);
                onNavigate("ive");
              }}
              className="gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Open IVE
            </Button>
            <Button onClick={() => setHealthOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Health card helper ───────────────────────────────────────────────

function HealthCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad" | "neutral";
  className?: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-red-600 dark:text-red-400",
    neutral: "text-foreground",
  } as const;
  const dotClass: Record<typeof tone, string> = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-red-500",
    neutral: "bg-muted-foreground/40",
  } as const;
  return (
    <Card className={className}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/60 shrink-0">
          <Icon className={`h-4 w-4 ${toneClass[tone]}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`}
            />
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
          </div>
          <p className="text-lg font-bold tracking-tight leading-tight mt-0.5">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hint badge (used in the header) ──────────────────────────────────

export function CommandKBadge({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border/70 bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-mono"
      aria-label="Open command palette (Cmd+K / Ctrl+K)"
      title="Open command palette (⌘K / Ctrl+K)"
    >
      <Clock className="h-3 w-3" />
      <span>⌘K</span>
    </button>
  );
}
