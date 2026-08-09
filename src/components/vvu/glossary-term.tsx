"use client";

/**
 * <GlossaryTerm> — contextual inline tooltip for VVU SEARM terminology.
 *
 * Wraps a piece of inline text and, on hover or keyboard focus, reveals a
 * shadcn Tooltip with the term's plain-English definition, optional formula,
 * and optional "see also" references. Designed to lower cognitive load on
 * dense domain prose without sacrificing readability of the surrounding copy.
 *
 * Usage:
 *   <GlossaryTerm term="N_ind">independent sources</GlossaryTerm>
 *   <GlossaryTerm term="CEISR" /> // renders "CEISR" inline automatically
 */

import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getGlossaryEntry } from "@/lib/glossary";

export interface GlossaryTermProps {
  /** Key into the GLOSSARY dictionary. */
  term: string;
  /** Optional inline text to wrap; defaults to the term key itself. */
  children?: React.ReactNode;
  /** Optional extra className for the inline trigger element. */
  className?: string;
}

export function GlossaryTerm({
  term,
  children,
  className,
}: GlossaryTermProps) {
  const entry = getGlossaryEntry(term);
  const label = children ?? term;

  return (
    <TooltipProvider delayDuration={200} disableHoverableContent={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            role="term"
            aria-label={`Glossary term: ${entry.term}`}
            className={cn(
              "underline decoration-dotted decoration-muted-foreground/50",
              "underline-offset-4 cursor-help outline-none rounded-sm",
              "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
              "focus-visible:ring-offset-background",
              className
            )}
          >
            {label}
            <sup
              aria-hidden="true"
              className="text-[9px] text-muted-foreground/70 ml-0.5 font-normal"
            >
              ?
            </sup>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className={cn(
            "max-w-[200px] md:max-w-[280px] p-3 text-left",
            "bg-popover text-popover-foreground border border-border",
            "shadow-md font-normal leading-relaxed"
          )}
        >
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-xs font-semibold tracking-tight text-foreground">
              {entry.term}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {entry.definition}
            </p>
            {entry.formula ? (
              <div className="mt-0.5 rounded-sm border-l-2 border-emerald-500/60 bg-emerald-500/5 px-2 py-1 font-mono text-[10px] leading-snug text-emerald-700 dark:text-emerald-400">
                {entry.formula}
              </div>
            ) : null}
            {entry.seeAlso && entry.seeAlso.length > 0 ? (
              <div className="mt-0.5 text-[10px] text-muted-foreground/80">
                <span className="font-medium text-muted-foreground">See also:</span>{" "}
                {entry.seeAlso.join(" · ")}
              </div>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default GlossaryTerm;
