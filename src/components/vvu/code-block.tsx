"use client";

/**
 * <CodeBlock> — small reusable inline math/code block for EIS proof sketches.
 *
 * Renders a <pre> with an emerald left border accent, muted background, and
 * monospace typography. Designed to display mathematical formulas inline
 * within the interactive theorem proofs viewer. An optional label tag can be
 * pinned to the top-right corner (e.g. "PDE", "QED", "union bound") to give
 * each formula a short categorical caption.
 *
 * Usage:
 *   <CodeBlock>|E_claim| ≤ N_ind · log(1/δ)</CodeBlock>
 *   <CodeBlock label="QED">N_ind := PR   ∎</CodeBlock>
 */

import * as React from "react";

import { cn } from "@/lib/utils";

export interface CodeBlockProps {
  /** Formula or code content to render inside the <pre>. */
  children: React.ReactNode;
  /** Optional short label pinned to the top-right corner. */
  label?: string;
  /** Optional extra className for the outer wrapper. */
  className?: string;
}

export function CodeBlock({ children, label, className }: CodeBlockProps) {
  return (
    <div className={cn("relative", className)}>
      {label ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-2 top-1.5 z-10",
            "rounded-sm bg-background/70 px-1.5 py-0.5 backdrop-blur-sm",
            "text-[9px] font-medium uppercase tracking-wider text-muted-foreground/70"
          )}
        >
          {label}
        </span>
      ) : null}
      <pre
        className={cn(
          "overflow-x-auto rounded-md border-l-2 border-emerald-500/40 bg-muted/30",
          "px-3 py-2 font-mono text-xs leading-relaxed text-foreground/90",
          "whitespace-pre-wrap break-words",
          label ? "pr-20" : undefined
        )}
      >
        {children}
      </pre>
    </div>
  );
}

export default CodeBlock;
