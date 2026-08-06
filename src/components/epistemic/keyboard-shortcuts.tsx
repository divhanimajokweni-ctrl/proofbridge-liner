"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, ArrowLeft, ArrowRight, Search, Pin } from "lucide-react";

/* ─── Section list (mirrors SECTIONS in page.tsx) ─── */
const SECTION_SHORTCUTS = [
  { key: "1", label: "Overview" },
  { key: "2", label: "Policy DSL" },
  { key: "3", label: "Templates" },
  { key: "4", label: "DAG Topology" },
  { key: "5", label: "Merge Repair" },
  { key: "6", label: "Shadow Bridge" },
  { key: "7", label: "MMR Proofs" },
  { key: "8", label: "ZK Circuit" },
  { key: "9", label: "Invariant Miner" },
] as const;

/* ─── Shortcut category definitions ─── */
interface ShortcutDef {
  keys: string[];
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const NAVIGATION_SHORTCUTS: ShortcutDef[] = [
  { keys: ["1", "–", "9"], description: "Jump to section by index", icon: Keyboard },
  { keys: ["←"], description: "Previous section", icon: ArrowLeft },
  { keys: ["→"], description: "Next section", icon: ArrowRight },
  { keys: ["⌘", "K"], description: "Global search", icon: Search },
];

const ACTION_SHORTCUTS: ShortcutDef[] = [
  { keys: ["?"], description: "Show this help" },
  { keys: ["P"], description: "Pin/unpin current section", icon: Pin },
  { keys: ["Esc"], description: "Close panel/dialog" },
];

/* ─── Kbd element ─── */
function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={
        "inline-flex items-center justify-center rounded border border-border/60 bg-muted/40 " +
        "px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground min-w-[22px] " +
        className
      }
    >
      {children}
    </kbd>
  );
}

/* ─── Shortcut row ─── */
function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
  const Icon = shortcut.icon;
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="flex items-center gap-2 text-xs text-foreground/80">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        {shortcut.description}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[9px] text-muted-foreground/40">{key === "–" ? "–" : "+"}</span>}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </span>
    </div>
  );
}

/* ─── Section shortcut row ─── */
function SectionShortcutRow({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-foreground/70 truncate">{label}</span>
      <Kbd>{index + 1}</Kbd>
    </div>
  );
}

/* ─── Category header ─── */
function CategoryHeader({ title }: { title: string }) {
  return (
    <div className="mt-4 mb-2 first:mt-0">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
        {title}
      </h3>
    </div>
  );
}

/* ─── Main component ─── */
export function KeyboardShortcutsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="pointer-events-auto w-full max-w-lg rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border border-verified/30 bg-verified/10">
                    <Keyboard className="h-3.5 w-3.5 text-verified" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
                    <p className="text-[10px] text-muted-foreground font-mono">epistemic://shortcuts</p>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[70vh] overflow-y-auto px-5 py-3 scrollbar-thin">
                {/* Navigation */}
                <CategoryHeader title="Navigation" />
                {NAVIGATION_SHORTCUTS.map((s, i) => (
                  <ShortcutRow key={i} shortcut={s} />
                ))}

                {/* Actions */}
                <CategoryHeader title="Actions" />
                {ACTION_SHORTCUTS.map((s, i) => (
                  <ShortcutRow key={i} shortcut={s} />
                ))}

                {/* Section shortcuts */}
                <CategoryHeader title="Section Shortcuts" />
                <div className="grid grid-cols-2 gap-x-6">
                  {SECTION_SHORTCUTS.map((s, i) => (
                    <SectionShortcutRow key={s.key} index={i} label={s.label} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border/60 px-5 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground/60">
                <span className="font-mono">Press <Kbd className="inline mx-0.5 text-[9px]">?</Kbd> to toggle</span>
                <span className="font-mono">Epistemic Runtime v0.1</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
