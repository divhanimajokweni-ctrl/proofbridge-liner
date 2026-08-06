"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  GitMerge,
  Eye,
  AlertTriangle,
  Inbox,
  CheckCheck,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── Types ─── */

type NotificationKind = "merge" | "shadow" | "violation";

interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  at: Date;
  severity: "info" | "warning" | "critical";
  read: boolean;
}

/* ─── Kind metadata ─── */

const KIND_META: Record<
  NotificationKind,
  { icon: typeof GitMerge; accent: string; label: string }
> = {
  merge: {
    icon: GitMerge,
    accent: "text-verified",
    label: "Merge",
  },
  shadow: {
    icon: Eye,
    accent: "text-repairing",
    label: "Shadow",
  },
  violation: {
    icon: AlertTriangle,
    accent: "text-violating",
    label: "Violation",
  },
};

/* ─── Severity dot color ─── */

function severityColor(severity: Notification["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-violating";
    case "warning":
      return "bg-repairing";
    case "info":
      return "bg-verified";
  }
}

/* ─── Relative time ─── */

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ─── Deduplicate helper ─── */

function activityKey(item: { kind: string; title: string; at: string | Date }): string {
  return `${item.kind}:${item.title}:${typeof item.at === "string" ? item.at : item.at.toISOString()}`;
}

/* ─── Infer severity from activity item ─── */

function inferSeverity(item: {
  kind: string;
  title: string;
  detail: string;
}): Notification["severity"] {
  const t = item.title.toLowerCase();
  const d = (item.detail ?? "").toLowerCase();
  if (
    item.kind === "violation" ||
    item.kind === "breach" ||
    t.includes("breach") ||
    t.includes("violation") ||
    t.includes("rejected") ||
    d.includes("critical")
  ) {
    return "critical";
  }
  if (
    t.includes("rejected") ||
    t.includes("divergence") ||
    t.includes("takeover") ||
    d.includes("high")
  ) {
    return "warning";
  }
  return "info";
}

/* ─── Component ─── */

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shaking, setShaking] = useState(false);
  const prevActivityKeysRef = useRef<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* Fetch activity from /api/stats and detect new items */
  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const data = await res.json();
      const activity: { kind: string; at: string; title: string; detail: string }[] =
        data.activity ?? [];

      // Determine new items by comparing keys
      const currentKeys = new Set(activity.map(activityKey));
      const newItems = activity.filter(
        (item) => !prevActivityKeysRef.current.has(activityKey(item)),
      );

      if (newItems.length > 0 && prevActivityKeysRef.current.size > 0) {
        // New events detected — add as notifications and trigger shake
        const newNotifications: Notification[] = newItems.map((item, idx) => ({
          id: `notif-${activityKey(item)}-${Date.now()}-${idx}`,
          kind: (item.kind === "violation" || item.kind === "breach"
            ? "violation"
            : item.kind) as NotificationKind,
          title: item.title,
          detail: item.detail ?? "",
          at: new Date(item.at),
          severity: inferSeverity(item),
          read: false,
        }));

        setNotifications((prev) => {
          // Merge: new ones first, keep existing (capped at 10)
          const merged = [...newNotifications, ...prev].slice(0, 10);
          return merged;
        });

        // Shake animation
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      } else if (prevActivityKeysRef.current.size === 0) {
        // First load — populate as read
        const initial: Notification[] = activity.slice(0, 10).map((item, idx) => ({
          id: `notif-${activityKey(item)}-${idx}`,
          kind: (item.kind === "violation" || item.kind === "breach"
            ? "violation"
            : item.kind) as NotificationKind,
          title: item.title,
          detail: item.detail ?? "",
          at: new Date(item.at),
          severity: inferSeverity(item),
          read: true, // initial load is read
        }));
        setNotifications(initial);
      }

      prevActivityKeysRef.current = currentKeys;
    } catch {
      /* ignore fetch errors */
    }
  }, []);

  /* Auto-refresh poll every 15 seconds */
  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 15_000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  /* Actions */
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={bellRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
          open
            ? "border-verified/40 bg-verified/10 text-verified"
            : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-verified/40",
        )}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <motion.span
          animate={
            shaking
              ? {
                  rotate: [0, -14, 14, -10, 10, -4, 4, 0],
                }
              : { rotate: 0 }
          }
          transition={
            shaking
              ? { duration: 0.6, ease: "easeInOut" }
              : { duration: 0.15 }
          }
          className="inline-flex"
        >
          <Bell className="h-3.5 w-3.5" />
        </motion.span>
        <span className="hidden sm:inline">Alerts</span>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violating px-1 text-[9px] font-bold text-violating-foreground leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute right-0 top-full mt-2 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden"
            role="menu"
            aria-label="Notification panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-verified/30 bg-verified/10">
                  <Bell className="h-3 w-3 text-verified" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-violating/15 px-1.5 py-0.5 text-[9px] font-bold text-violating">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notification list */}
            <ScrollArea className="max-h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/30 mb-3">
                    <Inbox className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    activity feed is quiet
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <AnimatePresence initial={false}>
                    {notifications.map((notif) => {
                      const meta = KIND_META[notif.kind];
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          layout
                        >
                          <button
                            type="button"
                            onClick={() => markRead(notif.id)}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
                              notif.read
                                ? "opacity-50 hover:opacity-70"
                                : "hover:bg-muted/30",
                            )}
                            role="menuitem"
                          >
                            {/* Type icon */}
                            <div
                              className={cn(
                                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                                notif.kind === "merge" &&
                                  "border-verified/30 bg-verified/10",
                                notif.kind === "shadow" &&
                                  "border-repairing/30 bg-repairing/10",
                                notif.kind === "violation" &&
                                  "border-violating/30 bg-violating/10",
                              )}
                            >
                              <Icon
                                className={cn("h-3.5 w-3.5", meta.accent)}
                              />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-xs font-medium truncate",
                                    notif.read
                                      ? "text-muted-foreground"
                                      : "text-foreground",
                                  )}
                                >
                                  {notif.title}
                                </span>
                                {/* Severity dot */}
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                    severityColor(notif.severity),
                                  )}
                                  title={notif.severity}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground/70 truncate font-mono">
                                  {notif.detail}
                                </span>
                              </div>
                              <span className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 inline-block">
                                {relativeTime(notif.at)}
                              </span>
                            </div>

                            {/* Unread indicator */}
                            {!notif.read && (
                              <span className="mt-2 h-2 w-2 rounded-full bg-verified shrink-0" />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-verified transition-colors font-mono"
              >
                <ExternalLink className="h-3 w-3" />
                View all activity
              </a>
              <span className="text-[9px] text-muted-foreground/40 font-mono">
                auto-refresh 15s
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
