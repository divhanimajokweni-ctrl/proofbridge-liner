"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["←", "→"], description: "Switch tabs" },
      { keys: ["⌘", "K"], description: "Search" },
      { keys: ["F8"], description: "Notifications" },
      { keys: ["?"], description: "This help" },
    ],
  },
  {
    title: "Sections",
    items: [
      { keys: ["1", "–", "9"], description: "Jump to section" },
      { keys: ["0"], description: "Last section" },
    ],
  },
  {
    title: "Actions",
    items: [
      { keys: ["Esc"], description: "Close overlay / dialog" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-border/60 bg-muted/50 text-[11px] font-mono text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsOverlay({ open, onClose }: KeyboardShortcutsOverlayProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={backdropRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-[480px] mx-4 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/40">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-verified/10 border border-verified/20">
                <Keyboard className="h-4 w-4 text-verified" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Keyboard Shortcuts</h2>
                <p className="text-[10px] text-muted-foreground font-mono">Quick reference for all shortcuts</p>
              </div>
            </div>

            {/* Groups */}
            <div className="px-6 py-4 space-y-5">
              {SHORTCUT_GROUPS.map((group, gi) => (
                <div key={group.title}>
                  {gi > 0 && <div className="border-t border-border/30 mb-4" />}
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    {group.title}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.description} className="flex items-center justify-between gap-4">
                        <span className="text-xs text-foreground/80">{item.description}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, ki) => (
                            <span key={ki} className="flex items-center gap-1">
                              {ki > 0 && (
                                <span className="text-[9px] text-muted-foreground/50 mx-0.5">+</span>
                              )}
                              <Kbd>{key}</Kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-border/30 bg-muted/20">
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <span>Press</span>
                <Kbd>?</Kbd>
                <span>or</span>
                <Kbd>Esc</Kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
