"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  OctagonAlert,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useIveStore, PANEL_MAP } from "@/store/useIveStore";
import type { ActivityNotification } from "@/store/useIveStore";

/**
 * NotificationCenter
 * ------------------
 * A slide-in activity feed (toggled via F8 or the header bell). Shows
 * real-time engineering events sourced from the Zustand notification log:
 * release-gate decisions, trust-dimension changes, runtime events, and
 * historical-preservation notices. Each notification can deep-link to its
 * source panel.
 *
 * The bell in the header shows an unread badge. The center supports
 * mark-all-read, clear, and per-notification panel navigation.
 */

const LEVEL_META: Record<
  ActivityNotification["level"],
  { icon: typeof Info; color: string; label: string }
> = {
  info: { icon: Info, color: "#3d9bff", label: "INFO" },
  warn: { icon: AlertTriangle, color: "#CC7722", label: "WARN" },
  error: { icon: OctagonAlert, color: "var(--ive-blocked)", label: "ERROR" },
  success: { icon: CheckCircle2, color: "var(--ive-proven)", label: "PASS" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationCenter() {
  const open = useIveStore((s) => s.notifCenterOpen);
  const setOpen = useIveStore((s) => s.setNotifCenterOpen);
  const notifications = useIveStore((s) => s.notifications);
  const markAllRead = useIveStore((s) => s.markAllRead);
  const clearNotifications = useIveStore((s) => s.clearNotifications);
  const setActivePanel = useIveStore((s) => s.setActivePanel);

  // Tick every 15s so "timeAgo" labels stay fresh without per-second re-renders.
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(i);
  }, []);

  // Esc closes the center (only when open).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F8") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col border-l border-white/[0.08]"
            style={{ background: "rgba(12, 12, 20, 0.97)", backdropFilter: "blur(20px)" }}
            role="dialog"
            aria-label="Activity notifications"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-5 w-5 text-[var(--ive-gold)]" />
                  {unread > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-black"
                      style={{ background: "var(--ive-blocked)" }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-sans text-sm font-bold tracking-tight text-foreground">
                    Activity Center
                  </h2>
                  <div className="ive-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {unread} unread · {notifications.length} total
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/10 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions bar */}
            <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-5 py-2.5">
              <button
                onClick={markAllRead}
                disabled={unread === 0}
                className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
              <button
                onClick={clearNotifications}
                disabled={notifications.length === 0}
                className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
              <span className="ive-mono ml-auto text-[9px] uppercase tracking-wider text-muted-foreground/50">
                F8 to toggle
              </span>
            </div>

            {/* Feed */}
            <div className="ive-scroll min-h-0 flex-1 overflow-y-auto p-3">
              {notifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30" />
                  <div className="ive-mono text-[11px] text-muted-foreground/60">
                    No notifications.
                  </div>
                  <div className="ive-mono text-[9px] text-muted-foreground/40">
                    Engineering events will appear here.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {notifications.map((n, i) => {
                      const meta = LEVEL_META[n.level];
                      const Icon = meta.icon;
                      const panelMeta = n.panel ? PANEL_MAP[n.panel] : null;
                      return (
                        <motion.div
                          key={n.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: i * 0.03, duration: 0.25 }}
                          className={`group relative overflow-hidden rounded-lg border p-3 transition-colors ${
                            n.read
                              ? "border-white/[0.04] bg-white/[0.01]"
                              : "border-white/[0.08] bg-white/[0.03]"
                          }`}
                          style={
                            !n.read
                              ? { borderLeft: `2px solid ${meta.color}` }
                              : undefined
                          }
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md border"
                              style={{
                                borderColor: `${meta.color}40`,
                                background: `${meta.color}12`,
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="ive-mono text-[8px] font-bold uppercase tracking-wider"
                                  style={{ color: meta.color }}
                                >
                                  {meta.label}
                                </span>
                                <span className="ive-mono text-[9px] text-muted-foreground/60">
                                  {n.source}
                                </span>
                                {!n.read && (
                                  <span
                                    className="ml-auto h-1.5 w-1.5 rounded-full"
                                    style={{ background: meta.color }}
                                  />
                                )}
                              </div>
                              <div className="mt-0.5 text-[12px] font-semibold leading-snug text-foreground">
                                {n.title}
                              </div>
                              <div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                                {n.detail}
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="ive-mono text-[8.5px] text-muted-foreground/50">
                                  {timeAgo(n.timestamp)}
                                </span>
                                {panelMeta && (
                                  <button
                                    onClick={() => {
                                      setActivePanel(n.panel!);
                                      setOpen(false);
                                    }}
                                    className="ive-mono inline-flex items-center gap-0.5 text-[9px] font-medium transition-colors hover:text-foreground"
                                    style={{ color: `${panelMeta.accent}cc` }}
                                  >
                                    {panelMeta.label}
                                    <ChevronRight className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-white/[0.06] px-5 py-2.5">
              <div className="ive-mono text-[8.5px] leading-relaxed text-muted-foreground/50">
                Notifications are sourced from the IVE runtime state. No fabricated events.
                Engineering Release remains BLOCKED.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * NotificationBell — the header trigger. Shows the unread count badge.
 */
export function NotificationBell() {
  const setOpen = useIveStore((s) => s.setNotifCenterOpen);
  const open = useIveStore((s) => s.notifCenterOpen);
  const unread = useIveStore((s) => s.notifications.filter((n) => !n.read).length);

  // F8 toggles globally.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F8") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="relative inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      title="Activity center (F8)"
      aria-label={`Activity center, ${unread} unread`}
    >
      <Bell className="h-3.5 w-3.5" />
      {unread > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold text-black"
          style={{ background: "var(--ive-blocked)", boxShadow: "0 0 6px rgba(255,77,95,0.6)" }}
        >
          {unread}
        </span>
      )}
    </button>
  );
}
