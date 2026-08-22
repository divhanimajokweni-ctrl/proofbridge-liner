"use client";
import { useEffect, useRef } from "react";
import { useTheoremStore } from "./theorem-store";
const DEFAULT_INTERVAL_MS = 5e3;
function useTheoremPoller(intervalMs = DEFAULT_INTERVAL_MS) {
  const hydrate = useTheoremStore((s) => s.hydrate);
  const lastErrorRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let timer = null;
    const poll = async () => {
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
          iveClaims: Array.isArray(data.iveClaims) ? data.iveClaims : []
        });
        lastErrorRef.current = null;
      } catch (err) {
        lastErrorRef.current = err instanceof Error ? err.message : "unknown";
      } finally {
        if (!cancelled) scheduleNext();
      }
    };
    const scheduleNext = () => {
      if (cancelled) return;
      timer = setTimeout(poll, intervalMs);
    };
    poll();
    const onVisibility = () => {
      if (!document.hidden && !cancelled) {
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
export {
  useTheoremPoller
};
