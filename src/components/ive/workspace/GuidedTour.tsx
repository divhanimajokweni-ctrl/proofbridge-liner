"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Compass,
} from "lucide-react";
import { useIveStore, TOUR_STEPS, PANEL_MAP } from "@/store/useIveStore";

/**
 * GuidedTour
 * ----------
 * An auto-advancing panel walkthrough with explanatory overlays. Steps the
 * user through the 8 core IVE surfaces with a narrated explanation of each.
 *
 * - Toggle via the header compass button or the `t` keyboard shortcut.
 * - Auto-advances every 12s; pause/resume controls.
 * - Prev/Next manual controls; progress dots.
 * - Esc or Exit dismisses; completion pushes a notification.
 *
 * The tour navigates the active panel via the store so the workspace
 * transitions normally beneath the overlay.
 */
const AUTO_ADVANCE_MS = 12000;

export function GuidedTour() {
  const tourActive = useIveStore((s) => s.tourActive);
  const tourStep = useIveStore((s) => s.tourStep);
  const advanceTour = useIveStore((s) => s.advanceTour);
  const stopTour = useIveStore((s) => s.stopTour);
  const setTourStep = useIveStore((s) => s.setTourStep);
  const [paused, setPaused] = useLocalPause(false);

  const step = TOUR_STEPS[tourStep];
  const panelMeta = step ? PANEL_MAP[step.panel] : null;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance loop.
  useEffect(() => {
    if (!tourActive || paused) return;
    timerRef.current = setInterval(() => advanceTour(), AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tourActive, paused, tourStep, advanceTour]);

  // Esc exits the tour.
  useEffect(() => {
    if (!tourActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stopTour();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        advanceTour();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTourStep(tourStep - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tourActive, tourStep, advanceTour, setTourStep, stopTour, setPaused]);

  return (
    <AnimatePresence>
      {tourActive && step && panelMeta && (
        <>
          {/* Bottom-center overlay card */}
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed bottom-20 left-1/2 z-50 w-full max-w-[560px] -translate-x-1/2 px-4"
          >
            <div
              className="overflow-hidden rounded-xl border border-white/[0.12] shadow-2xl"
              style={{ background: "rgba(12, 12, 20, 0.97)", backdropFilter: "blur(20px)" }}
            >
              {/* Accent top bar */}
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${panelMeta.accent}, transparent)` }} />

              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 pt-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md border"
                    style={{ borderColor: `${panelMeta.accent}50`, background: `${panelMeta.accent}12` }}
                  >
                    <Compass className="h-3.5 w-3.5" style={{ color: panelMeta.accent }} />
                  </span>
                  <div>
                    <div className="ive-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
                      Guided Tour · Stop {tourStep + 1} / {TOUR_STEPS.length}
                    </div>
                    <div className="text-[11px] font-semibold text-foreground/90">
                      {panelMeta.label}
                    </div>
                  </div>
                </div>
                <button
                  onClick={stopTour}
                  className="rounded-md border border-white/10 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Exit tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-3">
                <h3 className="font-sans text-base font-bold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="ive-mono mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {step.detail}
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 pb-2">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTourStep(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === tourStep ? 20 : 6,
                      background: i === tourStep ? panelMeta.accent : "rgba(255,255,255,0.15)",
                    }}
                    aria-label={`Go to stop ${i + 1}`}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTourStep(tourStep - 1)}
                    disabled={tourStep === 0}
                    className="ive-mono inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </button>
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="ive-mono inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    {paused ? "Play" : "Pause"}
                  </button>
                </div>
                <span className="ive-mono hidden text-[8.5px] text-muted-foreground/50 sm:inline">
                  ← / → navigate · space pause · esc exit
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTourStep(0)}
                    className="ive-mono inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" /> Restart
                  </button>
                  <button
                    onClick={advanceTour}
                    className="ive-mono inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-colors"
                    style={{
                      borderColor: `${panelMeta.accent}50`,
                      background: `${panelMeta.accent}15`,
                      color: panelMeta.accent,
                    }}
                  >
                    {tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * TourTrigger — the header compass button. Toggles the tour.
 */
export function TourTrigger() {
  const tourActive = useIveStore((s) => s.tourActive);
  const startTour = useIveStore((s) => s.startTour);
  const stopTour = useIveStore((s) => s.stopTour);

  // `t` keyboard shortcut toggles the tour globally.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        if (tourActive) stopTour();
        else startTour();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tourActive, startTour, stopTour]);

  return (
    <button
      onClick={() => (tourActive ? stopTour() : startTour())}
      className="relative inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      title="Guided tour (T)"
      aria-label="Start guided tour"
    >
      <Compass className={`h-3.5 w-3.5 ${tourActive ? "text-[var(--ive-gold)]" : ""}`} />
      {tourActive && (
        <span
          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--ive-gold)] ive-live-pulse"
          style={{ boxShadow: "0 0 6px rgba(201,168,76,0.6)" }}
        />
      )}
    </button>
  );
}

/** Minimal useState wrapper kept local to avoid touching the store with
 *  transient pause state (which doesn't need global visibility). */
import { useState } from "react";
function useLocalPause(initial: boolean) {
  return useState(initial);
}
