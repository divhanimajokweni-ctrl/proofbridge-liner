"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  GitBranch,
  Network,
  ShieldCheck,
  GitMerge,
  KeyRound,
  Cpu,
  Sparkles,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "policy" | "shard" | "invariant" | "merge" | "proof" | "shadow" | "mined";
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  section: string;
  severity?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  q: string;
}

const TYPE_META: Record<
  SearchResult["type"],
  { icon: LucideIcon; color: string; label: string }
> = {
  policy: { icon: GitBranch, color: "text-verified", label: "Policy" },
  shard: { icon: Network, color: "text-repairing", label: "Shard" },
  invariant: { icon: ShieldCheck, color: "text-quarantined", label: "Invariant" },
  merge: { icon: GitMerge, color: "text-verified", label: "Merge" },
  proof: { icon: KeyRound, color: "text-verified", label: "Proof" },
  shadow: { icon: Cpu, color: "text-repairing", label: "Shadow" },
  mined: { icon: Sparkles, color: "text-quarantined", label: "Mined" },
};

export function GlobalSearch({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onNavigate: (section: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setTotal(0);
      setActiveIndex(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=30`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d: SearchResponse = await r.json();
        setResults(d.results);
        setTotal(d.total);
        setActiveIndex(0);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[activeIndex];
        if (selected) {
          onNavigate(selected.section);
          onOpenChange(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    },
    [results, activeIndex, onNavigate, onOpenChange],
  );

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!g[r.type]) g[r.type] = [];
      g[r.type].push(r);
    }
    return g;
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden border-border/60 bg-card/95 backdrop-blur-xl"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Search className={cn("h-4 w-4 shrink-0", loading ? "text-repairing animate-spin" : "text-muted-foreground")} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search policies, shards, invariants, merges, proofs, events…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[420px] overflow-y-auto">
          {!query.trim() ? (
            <div className="px-4 py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                Start typing to search across the entire runtime
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap text-[10px] text-muted-foreground">
                {Object.entries(TYPE_META).map(([k, m]) => {
                  const Icon = m.icon;
                  return (
                    <span key={k} className="flex items-center gap-1">
                      <Icon className={cn("h-3 w-3", m.color)} />
                      {m.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No results for <span className="font-mono text-foreground">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          ) : (
            <div className="py-1">
              {Object.entries(grouped).map(([type, items]) => {
                const meta = TYPE_META[type as SearchResult["type"]];
                const Icon = meta.icon;
                return (
                  <div key={type} className="mb-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      <Icon className={cn("h-3 w-3", meta.color)} />
                      {meta.label}
                      <span className="ml-auto font-mono">{items.length}</span>
                    </div>
                    {items.map((r) => {
                      const idx = results.indexOf(r);
                      const isActive = idx === activeIndex;
                      const RIcon = TYPE_META[r.type].icon;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          data-idx={idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => {
                            onNavigate(r.section);
                            onOpenChange(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                            isActive ? "bg-verified/10" : "hover:bg-muted/30",
                          )}
                        >
                          <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-current/10", TYPE_META[r.type].color)}>
                            <RIcon className={cn("h-3.5 w-3.5", TYPE_META[r.type].color)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{r.title}</span>
                              {r.severity && (
                                <span className={cn(
                                  "text-[9px] uppercase font-semibold px-1 rounded shrink-0",
                                  r.severity === "critical" ? "text-violating" :
                                  r.severity === "high" ? "text-repairing" :
                                  "text-muted-foreground"
                                )}>
                                  {r.severity}
                                </span>
                              )}
                              {isActive && (
                                <CornerDownLeft className="h-3 w-3 text-verified ml-auto shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate font-mono">
                              {r.subtitle} · {r.detail}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="border-t border-border/60 px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono">
                <ArrowUp className="h-2.5 w-2.5" />
                <ArrowDown className="h-2.5 w-2.5" />
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono">
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              open
            </span>
            <span className="ml-auto font-mono">
              {results.length} of {total} results
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
