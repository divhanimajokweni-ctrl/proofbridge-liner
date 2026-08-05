"use client";

import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIveStore } from "@/store/useIveStore";
import { BootSequence } from "./boot/BootSequence";
import { Workspace } from "./workspace/Workspace";

/**
 * IveRoot
 * -------
 * Orchestrates the IVE experience: a cinematic boot sequence first, then
 * the IVE workspace. Interrupt-safe — pressing Escape (or clicking skip)
 * jumps straight to the workspace. Once boot completes, the workspace
 * mounts and becomes the persistent engineering OS surface.
 */
export function IveRoot() {
  const bootComplete = useIveStore((s) => s.bootComplete);
  const bootSkipped = useIveStore((s) => s.bootSkipped);
  const skipBoot = useIveStore((s) => s.skipBoot);

  const showBoot = !bootComplete && !bootSkipped;

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

  return (
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
  );
}
