"use client";

/**
 * <GlossaryIndexDialog> — full glossary browser dialog.
 *
 * Controlled via `open` / `onOpenChange`. Renders every entry in the GLOSSARY
 * dictionary as a small card in a responsive 1- (mobile) / 2-column (md+)
 * grid, with a live search input that filters by term name or definition.
 * Intended to be opened from a "Glossary" action in the header or docs page.
 */

import * as React from "react";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GLOSSARY, type GlossaryEntry } from "@/lib/glossary";
import { cn } from "@/lib/utils";

export interface GlossaryIndexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlossaryIndexDialog({
  open,
  onOpenChange,
}: GlossaryIndexDialogProps) {
  const [query, setQuery] = useState("");

  const entries = useMemo<Array<[string, GlossaryEntry]>>(() => {
    const all = Object.entries(GLOSSARY);
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(([, entry]) => {
      return (
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        (entry.formula?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col gap-4 p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            VVU Glossary
          </DialogTitle>
          <DialogDescription>
            Key terms used throughout the SEARM platform.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms or definitions…"
          aria-label="Search glossary"
          className="h-9"
        />

        <div className="max-h-[55vh] overflow-y-auto pr-1 -mr-1 vvu-scrollbar">
          {entries.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
              {query.trim() ? (
                <span>
                  No terms match{" "}
                  <span className="font-mono text-foreground">
                    &lsquo;{query.trim()}&rsquo;
                  </span>
                  .
                </span>
              ) : (
                <span>No glossary terms available.</span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(([key, entry]) => (
                <GlossaryCard key={key} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GlossaryCardProps {
  entry: GlossaryEntry;
}

function GlossaryCard({ entry }: GlossaryCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3",
        "transition-colors hover:border-emerald-500/40 hover:bg-accent/30"
      )}
    >
      <div className="font-mono text-sm font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
        {entry.term}
      </div>
      <p className="text-xs leading-relaxed text-foreground/90">
        {entry.definition}
      </p>
      {entry.formula ? (
        <div className="mt-0.5 rounded-sm border-l-2 border-amber-500/70 bg-amber-500/5 px-2 py-1 font-mono text-[10px] leading-snug text-amber-700 dark:text-amber-400">
          {entry.formula}
        </div>
      ) : null}
      {entry.seeAlso && entry.seeAlso.length > 0 ? (
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          <span className="font-medium">See also:</span>{" "}
          {entry.seeAlso.join(" · ")}
        </div>
      ) : null}
    </div>
  );
}

export default GlossaryIndexDialog;
