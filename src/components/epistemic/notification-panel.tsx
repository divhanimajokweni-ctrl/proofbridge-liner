"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Cpu,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill, SeverityBadge, fmtTimestamp } from "./primitives";

/* ─── Types ─── */

type NotificationGroup = "violation" | "merge" | "shadow";

interface NotificationItem {
  id: string;
  group: NotificationGroup;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "applied" | "rejected" | "pending" | "healthy" | "repairing" | "violating" | "idle";
  at: string;
  read: boolean;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Group metadata ─── */

const GROUP_META: Record<NotificationGroup, { icon: typeof Bell; accent: string; borderAccent: string; label: string }> = {
  violation: {
    icon: AlertTriangle,
    accent: "text-violating",
    borderAccent: "border-l-violating",
    label: "Violations",
  },
  merge: {
    icon: CheckCircle2,
    accent: "text-verified",
    borderAccent: "border-l-verified",
    label: "Merges",
  },
  shadow: {
    icon: Cpu,
    accent: "text-repairing",
    borderAccent: "border-l-repairing",
    label: "Shadow Events",
  },
};

/* ─── Severity→border-color class ─── */

function severityBorder(severity: NotificationItem["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-l-violating";
    case "high":
      return "border-l-repairing";
    case "medium":
      return "border-l-quarantined";
    case "low":
      return "border-l-muted-foreground";
  }
}

/* ─── Infer severity from activity ─── */

function inferSeverity(item: { kind: string; title: string; detail: string }): NotificationItem["severity"] {
  const t = (item.title ?? "").toLowerCase();
  const d = (item.detail ?? "").toLowerCase();
  if (t.includes("breach") || t.includes("violation") || t.includes("rejected") || d.includes("critical")) {
    return "critical";
  }
  if (t.includes("rejected") || t.includes("divergence") || t.includes("takeover") || d.includes("high")) {
    return "high";
  }
  if (d.includes("medium") || t.includes("drift")) {
    return "medium";
  }
  return "low";
}

/* ─── Infer status from activity ─── */

function inferStatus(item: { kind: string; title: string; detail: string }): NotificationItem["status"] {
  const t = (item.title ?? "").toLowerCase();
  if (item.kind === "violation" || t.includes("breach")) return "violating";
  if (t.includes("applied")) return "applied";
  if (t.includes("rejected")) return "rejected";
  if (t.includes("pending")) return "pending";
  if (t.includes("repairing") || t.includes("repair")) return "repairing";
  if (item.kind === "shadow") return "idle";
  return "healthy";
}

/* ─── Component ─── */

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationGroup | "all">("all");
  const prevKeysRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* Fetch data from APIs */
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, metricsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/metrics"),
      ]);

      if (!statsRes.ok) return;
      const stats = await statsRes.json();
      const metrics = metricsRes.ok ? await metricsRes.json() : null;

      const activity: { kind: string; at: string; title: string; detail: string }[] =
        stats.activity ?? [];

      /* Build current key set for dedup */
      const currentKeys = new Set(activity.map((a) => `${a.kind}:${a.title}:${a.at}`));

      /* Map activity to notification items */
      const items: NotificationItem[] = activity.map((item, idx) => ({
        id: `np-${item.kind}:${item.title}:${idx}`,
        group: (item.kind === "violation" || item.kind === "breach"
          ? "violation"
          : item.kind === "merge"
            ? "merge"
            : "shadow") as NotificationGroup,
        title: item.title,
        detail: item.detail ?? "",
        severity: inferSeverity(item),
        status: inferStatus(item),
        at: item.at,
        read: prevKeysRef.current.size > 0
          ? prevKeysRef.current.has(`${item.kind}:${item.title}:${item.at}`)
          : true,
      }));

      /* Also add synthetic notifications from metrics severity breakdown */
      if (metrics?.severityBreakdown) {
        const sb = metrics.severityBreakdown as { critical: number; high: number; medium: number; low: number };
        if (sb.critical > 0) {
          items.unshift({
            id: "np-metrics-critical",
            group: "violation",
            title: `${sb.critical} critical violations detected`,
            detail: "Requires immediate attention",
            severity: "critical",
            status: "violating",
            at: new Date(Date.now() - 30_000).toISOString(),
            read: prevKeysRef.current.has("np-metrics-critical"),
          });
        }
        if (sb.high > 0) {
          items.unshift({
            id: "np-metrics-high",
            group: "violation",
            title: `${sb.high} high-severity violations active`,
            detail: "Review and resolve promptly",
            severity: "high",
            status: "repairing",
            at: new Date(Date.now() - 60_000).toISOString(),
            read: prevKeysRef.current.has("np-metrics-high"),
          });
        }
      }

      /* Add merge summary from stats */
      if (stats.mergeHealth) {
        const mh = stats.mergeHealth as { applied: number; rejected: number; successRate: number };
        if (mh.rejected > 0) {
          items.unshift({
            id: "np-merge-rejected",
            group: "merge",
            title: `${mh.rejected} merge(s) rejected`,
            detail: `Success rate: ${mh.successRate}%`,
            severity: "high",
            status: "rejected",
            at: new Date(Date.now() - 120_000).toISOString(),
            read: prevKeysRef.current.has("np-merge-rejected"),
          });
        }
      }

      /* Add shadow drift from stats */
      if (stats.drift?.total > 0) {
        items.unshift({
          id: "np-shadow-drift",
          group: "shadow",
          title: `${stats.drift.total} shadow drift event(s)`,
          detail: "Divergence detected in shadow bridge",
          severity: "medium",
          status: "idle",
          at: new Date(Date.now() - 180_000).toISOString(),
          read: prevKeysRef.current.has("np-shadow-drift"),
        });
      }

      setNotifications(items.slice(0, 20));
      prevKeysRef.current = currentKeys;
    } catch {
      /* ignore fetch errors */
    }
  }, []);

  /* Auto-refresh every 30 seconds */
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  /* Mark read */
  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /* Filtered notifications */
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.group === filter);

  /* Group counts */
  const violationCount = notifications.filter((n) => n.group === "violation").length;
  const mergeCount = notifications.filter((n) => n.group === "merge").length;
  const shadowCount = notifications.filter((n) => n.group === "shadow").length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-in panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[380px] flex flex-col border-l border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl"
            role="dialog"
            aria-label="Notification Center"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-verified/30 bg-verified/10">
                  <Bell className="h-3.5 w-3.5 text-verified" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Notification Center</h2>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {unreadCount > 0 ? `${unreadCount} unread` : "all caught up"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border/40 shrink-0">
              {(
                [
                  { key: "all" as const, label: "All", count: notifications.length },
                  { key: "violation" as const, label: "Violations", count: violationCount },
                  { key: "merge" as const, label: "Merges", count: mergeCount },
                  { key: "shadow" as const, label: "Shadow", count: shadowCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    filter === tab.key
                      ? "bg-verified/10 text-verified border border-verified/30"
                      : "text-muted-foreground hover:text-foreground border border-transparent",
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "inline-flex items-center justify-center h-4 min-w-4 rounded-full px-1 text-[9px] font-bold leading-none",
                      filter === tab.key ? "bg-verified/20 text-verified" : "bg-muted/50 text-muted-foreground",
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions row */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 shrink-0">
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Mark all as read"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear all"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
                <span className="ml-auto text-[9px] text-muted-foreground/50 font-mono">
                  <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                  auto 30s
                </span>
              </div>
            )}

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/30 mb-3">
                    <Shield className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    {filter !== "all" ? `no ${filter} events` : "system is quiet"}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  <AnimatePresence initial={false}>
                    {filtered.map((notif) => {
                      const meta = GROUP_META[notif.group];
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          layout
                        >
                          <button
                            type="button"
                            onClick={() => markRead(notif.id)}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors border-l-2",
                              !notif.read ? "bg-muted/20 hover:bg-muted/30" : "opacity-50 hover:opacity-70",
                              severityBorder(notif.severity),
                            )}
                          >
                            {/* Type icon */}
                            <div
                              className={cn(
                                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                                notif.group === "violation" && "border-violating/30 bg-violating/10",
                                notif.group === "merge" && "border-verified/30 bg-verified/10",
                                notif.group === "shadow" && "border-repairing/30 bg-repairing/10",
                              )}
                            >
                              <Icon className={cn("h-3.5 w-3.5", meta.accent)} />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "text-xs font-medium truncate",
                                    notif.read ? "text-muted-foreground" : "text-foreground",
                                  )}
                                >
                                  {notif.title}
                                </span>
                                <SeverityBadge severity={notif.severity} />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground/70 truncate font-mono">
                                  {notif.detail}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[9px] text-muted-foreground/50 font-mono">
                                  {fmtTimestamp(notif.at)}
                                </span>
                                <StatusPill status={notif.status} className="scale-90 origin-left" />
                              </div>
                            </div>

                            {/* Unread dot */}
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
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between shrink-0">
              <span className="text-[9px] text-muted-foreground/50 font-mono">
                epistemic://notifications
              </span>
              <span className="text-[9px] text-muted-foreground/40 font-mono">
                F8 to toggle
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
