"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Compass, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { useIveStore } from "@/store/useIveStore";

/**
 * WelcomeHint
 * -----------
 * A dismissible first-run banner that appears once on the user's first
 * visit (tracked via localStorage). Points them to the Guided Tour (T)
 * and Settings panel. Once dismissed (or after the user starts the tour
 * / opens settings), it never shows again.
 *
 * Positioned at the top-center of the workspace, below the header.
 */
const WELCOME_KEY = "ive-welcome-dismissed-v1";

export function WelcomeHint() {
  const [show, setShow] = useState(false);
  const startTour = useIveStore((s) => s.startTour);
  const setActivePanel = useIveStore((s) => s.setActivePanel);
  const tourActive = useIveStore((s) => s.tourActive);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(WELCOME_KEY);
      if (!dismissed) {
        // Small delay so it appears after the workspace transition.
        const t = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Dismiss the hint and persist the dismissal.
  const dismiss = useCallback(() => {
    setShow(false);
    try {
      window.localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-hide when the tour is active (derived, no effect needed).
  const visible = show && !tourActive;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="fixed left-1/2 top-20 z-30 w-full max-w-[480px] -translate-x-1/2 px-4"
          role="region"
          aria-label="Welcome hint"
        >
          <div
            className="overflow-hidden rounded-xl border border-[var(--ive-gold)]/20 shadow-2xl"
            style={{ background: "rgba(15, 15, 24, 0.96)", backdropFilter: "blur(16px)" }}
          >
            {/* Accent top bar */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, var(--ive-gold), transparent)" }} />

            <div className="flex items-start gap-3 p-4">
              <span
                className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md border"
                style={{ borderColor: "var(--ive-gold)40", background: "var(--ive-gold)10" }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "var(--ive-gold)" }} />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="font-sans text-sm font-bold tracking-tight text-foreground">
                  Welcome to IVE
                </h3>
                <p className="ive-mono mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  The Integrated Verification Environment — engineer systems that can prove
                  themselves. Take the 8-stop tour or adjust your preferences.
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { startTour(); dismiss(); }}
                    className="ive-mono inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-colors"
                    style={{
                      borderColor: "var(--ive-gold)50",
                      background: "var(--ive-gold)15",
                      color: "var(--ive-gold)",
                    }}
                  >
                    <Compass className="h-3 w-3" />
                    Start tour
                    <kbd className="ml-0.5 rounded border border-[var(--ive-gold)]/20 bg-[var(--ive-gold)]/10 px-1 py-0.5 text-[8px]">T</kbd>
                  </button>
                  <button
                    onClick={() => { setActivePanel("settings"); dismiss(); }}
                    className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <SettingsIcon className="h-3 w-3" />
                    Settings
                  </button>
                  <button
                    onClick={dismiss}
                    className="ive-mono ml-auto inline-flex items-center gap-1 text-[9px] text-muted-foreground/50 transition-colors hover:text-foreground"
                  >
                    Dismiss
                    <ChevronRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={dismiss}
                className="rounded border border-white/10 p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Dismiss welcome hint"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
