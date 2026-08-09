"use client";

import { useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useIveStore } from "@/store/useIveStore";
import { BootSequence } from "./boot/BootSequence";
import { Workspace } from "./workspace/Workspace";

const IVE_BOOT_SESSION_KEY = "ive-boot-completed-v1";

function hasCompletedBootThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(IVE_BOOT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markBootCompletedThisSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(IVE_BOOT_SESSION_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

export function IveRoot() {
  const bootComplete = useIveStore((s) => s.bootComplete);
  const bootSkipped = useIveStore((s) => s.bootSkipped);
  const skipBoot = useIveStore((s) => s.skipBoot);
  const completeBoot = useIveStore((s) => s.completeBoot);
  const settings = useIveStore((s) => s.settings);
  const autoSkippedRef = useRef(false);
  const sessionSkipAppliedRef = useRef(false);

  const showBoot = !bootComplete && !bootSkipped;

  // Honor sessionStorage gating: if the user already completed boot this
  // browser session, skip the cinematic automatically once.
  useEffect(() => {
    if (sessionSkipAppliedRef.current) return;
    if (hasCompletedBootThisSession()) {
      sessionSkipAppliedRef.current = true;
      completeBoot();
    }
  }, [completeBoot]);

  // Mark the session once boot completes naturally or is skipped.
  useEffect(() => {
    if ((bootComplete || bootSkipped) && !sessionSkipAppliedRef.current) {
      markBootCompletedThisSession();
    }
  }, [bootComplete, bootSkipped]);

  // Honor autoSkipBoot: skip the boot sequence on mount if the user opted in.
  useEffect(() => {
    if (settings.autoSkipBoot && !bootComplete && !bootSkipped && !autoSkippedRef.current) {
      autoSkippedRef.current = true;
      completeBoot();
    }
  }, [settings.autoSkipBoot, bootComplete, bootSkipped, completeBoot]);

  // Apply accentOverride as a CSS variable on the document root.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (settings.accentOverride && settings.accentOverride !== "gold") {
      root.style.setProperty("--ive-gold", settings.accentOverride);
    } else {
      root.style.setProperty("--ive-gold", "#C9A84C");
    }
  }, [settings.accentOverride]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!bootComplete && !bootSkipped && e.key === "Escape") {
        e.preventDefault();
        skipBoot();
      }
    },
    [bootComplete, bootSkipped, skipBoot],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Derive a transition scale from animationIntensity.
  const transitionScale =
    settings.animationIntensity === "full"
      ? 1
      : settings.animationIntensity === "reduced"
        ? 0.4
        : 0;

  return (
    <MotionConfig
      transition={transitionScale === 0 ? { duration: 0 } : { duration: 0.3 * transitionScale }}
      reducedMotion={settings.animationIntensity === "none" ? "always" : "never"}
    >
      <div
        className="relative flex min-h-screen flex-col overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, #0f0f18, #09090f 75%)",
        }}
      >
        <AnimatePresence mode="wait">
          {showBoot ? (
            <motion.div
              key="boot"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
              className="absolute inset-0"
            >
              <BootSequence />
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }}
              className="absolute inset-0"
            >
              <Workspace />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
