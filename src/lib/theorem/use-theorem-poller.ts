"use client";

/**
 * useTheoremPoller — lightweight watchdog that pulls /api/theorem-state
 * every `intervalMs` and hydrates the global theorem store.
 *
 * Mount this ONCE at the dashboard root (in src/app/page.tsx) so the
 * poller runs regardless of which view the user is on. The Evolution
 * Matrix, hero backdrops, and any future status surface all read from
 * the store — never from the network directly.
 *
 * On error, the poller keeps the last-known-good state and retries on
 * the next tick (no UI churn). The poller auto-stops when the document
 * is hidden (Page Visibility API) to save bandwidth, and resumes on
 * focus.
 *
 * NOTE: Zustand is already in package.json. The store is decoupled from
 * React's render cycle so subscribers only re-render when their slice
 * actually changes — the 5s poll cadence won't thrash the dashboard.
 */

import { useEffect, useRef } from "react";
import { useTheoremStore } from "./theorem-store";

const DEFAULT_INTERVAL_MS = 5_000;

export function useTheoremPoller(intervalMs: number = DEFAULT_INTERVAL_MS) {
  const hydrate = useTheoremStore((s) => s.hydrate);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      // Skip when tab hidden — save requests.
      if (typeof document !== "undefined" && document.hidden) {
        scheduleNext();
        return;
      }
      try {
        const res = await fetch("/api/theorem-state", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`theorem-state: HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        hydrate({
          studiVerdict: data.studiVerdict,
          iveVerdict: data.iveVerdict,
          breaker: data.breaker,
          confidence: data.confidence,
          iveClaims: Array.isArray(data.iveClaims) ? data.iveClaims : [],
        });
        lastErrorRef.current = null;
      } catch (err) {
        // Don't clear the store on transient failure — keep the last good state.
        lastErrorRef.current = err instanceof Error ? err.message : "unknown";
        // Swallow — the next tick will retry.
      } finally {
        if (!cancelled) scheduleNext();
      }
    };

    const scheduleNext = () => {
      if (cancelled) return;
      timer = setTimeout(poll, intervalMs);
    };

    // Kick immediately on mount (and on visibility regain).
    poll();

    const onVisibility = () => {
      if (!document.hidden && !cancelled) {
        // Resumed — poll now and let the loop continue.
        if (timer) clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hydrate, intervalMs]);
}
