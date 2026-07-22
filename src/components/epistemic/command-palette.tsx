"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, CornerDownLeft } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  sections: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }[];
  onNavigate: (id: string) => void;
}

const RECENT_KEY = "epistemic-recent-sections";
const MAX_RECENT = 3;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  if (typeof window === "undefined") return;
  try {
    const prev = getRecent().filter((r) => r !== id);
    const next = [id, ...prev].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Simple fuzzy matcher: each char of query must appear in order within target */
function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return { match: true, score: 0 };
  let qi = 0;
  let score = 0;
  let lastIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for consecutive matches
      score += lastIdx === ti - 1 ? 2 : 1;
      // Bonus for match at word boundary
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-") score += 1;
      lastIdx = ti;
      qi++;
    }
  }
  return { match: qi === q.length, score };
}

export function CommandPalette({ open, onClose, sections, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  // Track previous open state to reset when palette opens (React 19: adjust state during render)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIdx(0);
    }
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusTimerRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      focusTimerRef.current = requestAnimationFrame(() => inputRef.current?.focus());
    }
    return () => {
      if (focusTimerRef.current) cancelAnimationFrame(focusTimerRef.current);
    };
  }, [open]);

  // Read recent sections directly from localStorage (no state needed)
  const recentIds = getRecent();

  // Filtered + sorted results
  const filtered = (() => {
    if (!query.trim()) return sections;
    return sections
      .map((s) => {
        const labelMatch = fuzzyMatch(query, s.label);
        const hintMatch = fuzzyMatch(query, s.hint);
        const bestScore = Math.max(labelMatch.score, hintMatch.score);
        const match = labelMatch.match || hintMatch.match;
        return { ...s, _score: bestScore, _match: match };
      })
      .filter((s) => s._match)
      .sort((a, b) => b._score - a._score);
  })();

  // Handle query change: also reset active index (event handler, not effect)
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIdx(0);
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIdx]) {
          const id = filtered[activeIdx].id;
          pushRecent(id);
          onNavigate(id);
          onClose();
        }
        return;
      }
      // Number keys 1-9 to directly select
      if (e.key >= "1" && e.key <= "9" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < filtered.length) {
          e.preventDefault();
          const id = filtered[idx].id;
          pushRecent(id);
          onNavigate(id);
          onClose();
        }
      }
    },
    [activeIdx, filtered, onClose, onNavigate]
  );

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-idx="${activeIdx}"]`);
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Recent section items (shown when no query)
  const recentSections = query.trim()
    ? []
    : (recentIds
        .map((id) => sections.find((s) => s.id === id))
        .filter(Boolean) as typeof sections);

  // Build display list: recent items first, then all sections (deduped)
  type DisplayItem = (typeof sections)[number] & { _isRecent?: boolean };
  const displayItems: DisplayItem[] = query.trim()
    ? filtered.map((s) => ({ ...s, _isRecent: false }))
    : [
        ...recentSections.map((s) => ({ ...s, _isRecent: true })),
        ...sections.filter((s) => !recentIds.includes(s.id)).map((s) => ({ ...s, _isRecent: false })),
      ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />

          {/* Palette container */}
          <motion.div
            className="relative w-full max-w-[480px] mx-4 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-border/40">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search sections…"
                className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/50"
              />
              <kbd className="hidden sm:inline-flex items-center rounded border border-border/40 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60">
                esc
              </kbd>
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2 scrollbar-thin">
              {/* Recent label */}
              {!query.trim() && recentSections.length > 0 && (
                <div className="px-4 pb-1 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">
                  Recent
                </div>
              )}

              {displayItems.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground/60">
                  No sections found for &quot;{query}&quot;
                </div>
              )}

              {displayItems.map((s, idx) => {
                const Icon = s.icon;
                const isActive = idx === activeIdx;
                const sectionNumber = sections.findIndex((sec) => sec.id === s.id) + 1;
                return (
                  <div
                    key={s.id}
                    data-idx={idx}
                    onClick={() => {
                      pushRecent(s.id);
                      onNavigate(s.id);
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors " +
                      (isActive
                        ? "bg-verified/10 text-verified"
                        : "text-foreground/80 hover:bg-muted/40")
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground/60 truncate">{s.hint}</div>
                    </div>
                    {s._isRecent && (
                      <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wide">
                        recent
                      </span>
                    )}
                    {sectionNumber >= 1 && sectionNumber <= 9 && (
                      <kbd
                        className={
                          "inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-mono border transition-colors " +
                          (isActive
                            ? "border-verified/30 bg-verified/15 text-verified"
                            : "border-border/40 bg-muted/30 text-muted-foreground/50")
                        }
                      >
                        {sectionNumber}
                      </kbd>
                    )}
                    {isActive && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-verified/60" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between gap-3 border-t border-border/40 px-4 py-2 text-[10px] text-muted-foreground/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center rounded border border-border/30 bg-muted/30 px-1 py-0.5 font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center rounded border border-border/30 bg-muted/30 px-1 py-0.5 font-mono">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center rounded border border-border/30 bg-muted/30 px-1 py-0.5 font-mono">1-9</kbd>
                  jump
                </span>
              </div>
              <span className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />←→ switch tabs
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
