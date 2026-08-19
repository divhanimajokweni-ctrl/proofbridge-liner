"use client";

/**
 * Interest Inception Modal — the immutable curiosity-first entry point.
 *
 * Per operator directive: "No user ever sees a 'project' or 'claim' or
 * 'evidence' field before they've answered one question:
 *   What are you interested in?"
 *
 * UX:
 *   - Blurred dashboard loads behind it (passed as children)
 *   - Single input field with placeholder: "I'm curious about..."
 *   - Below: quick-select chips (Investing, Politics, Education, Health, etc.)
 *   - One critical button: "I don't know. I'm just curious."
 *
 * On submit:
 *   - IVE parses the interest (locally + via /api/studi/interest)
 *   - Generates a contextual bridging prompt
 *   - Implicit project is created from this conversation
 *   - Modal calls onComplete(state) and the parent swaps to the dashboard
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadInterestInception,
  saveInterestInception,
  classifyInterest,
  generateBridgingPrompt,
  generateProjectId,
  INTEREST_QUICK_SELECTS,
  categoryLabel,
  categoryEmoji,
  type InterestCategory,
  type InterestInceptionState,
} from "@/lib/studi/interest-inception-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, HelpCircle, Loader2 } from "lucide-react";

interface Props {
  /** The dashboard content rendered behind the modal, blurred. */
  children: React.ReactNode;
  /** Called when the user has submitted their interest. */
  onComplete: (state: InterestInceptionState) => void;
}

export function InterestInceptionModal({ children, onComplete }: Props) {
  const [interest, setInterest] = useState("");
  const [category, setCategory] = useState<InterestCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus the input on mount.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ESC key clears the input. Enter submits.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && interest.trim() && !submitting) {
        e.preventDefault();
        handleSubmit(interest.trim());
      }
    },
    [interest, submitting],
  );

  const handleSubmit = useCallback(
    async (rawInterest: string) => {
      setSubmitting(true);
      const timestamp = new Date().toISOString();

      // Local heuristic classification (always available).
      let localCategory = classifyInterest(rawInterest);
      let prompt = generateBridgingPrompt(rawInterest, localCategory);
      let usedAi = false;

      // Try AI router for refined classification + prompt.
      try {
        const res = await fetch("/api/studi/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interest: rawInterest }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.interest_category && data.bridging_prompt) {
            localCategory = data.interest_category as InterestCategory;
            prompt = data.bridging_prompt as string;
            usedAi = true;
          }
        }
      } catch {
        // AI unavailable — local heuristic is fine.
      }

      const projectId = generateProjectId(rawInterest, timestamp);
      const state: InterestInceptionState = {
        completed: true,
        interest: rawInterest,
        interestCategory: localCategory,
        bridgingPrompt: prompt,
        projectId,
        timestamp,
      };
      saveInterestInception(state);
      setCategory(localCategory);
      setAiAssisted(usedAi);
      setSubmitting(false);

      // Brief reveal of the bridging prompt before handing control back.
      setTimeout(() => onComplete(state), 1200);
    },
    [onComplete],
  );

  const handleQuickSelect = useCallback(
    (cat: InterestCategory) => {
      // For quick-select, use the category label as the interest text
      // (e.g., "Investing") — the AI router will refine from there.
      const label = INTEREST_QUICK_SELECTS.find((q) => q.value === cat)?.label ?? cat;
      setInterest(label);
      handleSubmit(label);
    },
    [handleSubmit],
  );

  const handleDontKnow = useCallback(() => {
    handleSubmit("I'm just curious.");
  }, [handleSubmit]);

  // After submit, show the bridging-prompt reveal.
  const showReveal = category !== null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Blurred dashboard behind the modal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 scale-105 select-none opacity-60 blur-md"
      >
        {children}
      </div>

      {/* Dark scrim for contrast */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px]" />

      {/* The modal */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-vvu-studi/30 bg-card/95 shadow-2xl backdrop-blur-md">
          <CardContent className="p-8 md:p-10">
            {!showReveal ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-vvu-studi">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-mono text-xs uppercase tracking-widest">
                      VVU · Interest Inception
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                    What are you interested in?
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    One question, infinite paths. Your answer shapes everything
                    VVU shows you next — no projects to create, no claims to
                    file, just curiosity.
                  </p>
                </div>

                {/* Free-text input */}
                <div className="space-y-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="I'm curious about..."
                    disabled={submitting}
                    className="h-12 border-vvu-studi/30 bg-background/60 text-base"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Press Enter to submit</span>
                    <span>{interest.length}/200</span>
                  </div>
                </div>

                {/* Quick-select chips */}
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Or pick a common starting point
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_QUICK_SELECTS.map((q) => (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => handleQuickSelect(q.value)}
                        disabled={submitting}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium transition-colors hover:border-vvu-studi/50 hover:bg-vvu-studi/5 disabled:opacity-50"
                      >
                        <span aria-hidden>{q.emoji}</span>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* "I don't know" button */}
                <div className="flex flex-col items-center gap-3 border-t border-border/60 pt-5">
                  <p className="text-xs text-muted-foreground">
                    Don't have a specific interest yet? That's the best place
                    to start.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDontKnow}
                    disabled={submitting}
                    className="gap-2 border-vvu-studi/40 text-vvu-studi hover:bg-vvu-studi/10"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <HelpCircle className="h-4 w-4" />
                    )}
                    I don't know. I'm just curious.
                  </Button>
                </div>

                {/* Submit button (when there's typed text) */}
                {interest.trim() && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => handleSubmit(interest.trim())}
                      disabled={submitting}
                      className="gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <RevealBridgingPrompt
                interest={interest}
                category={category!}
                bridgingPrompt={
                  loadInterestInception().bridgingPrompt ?? ""
                }
                projectId={loadInterestInception().projectId ?? ""}
                aiAssisted={aiAssisted}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Reveal: bridging prompt + project ID ──────────────────────────────────

function RevealBridgingPrompt({
  interest,
  category,
  bridgingPrompt,
  projectId,
  aiAssisted,
}: {
  interest: string;
  category: InterestCategory;
  bridgingPrompt: string;
  projectId: string;
  aiAssisted: boolean;
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="flex items-center justify-center gap-2 text-vvu-studi">
        <Sparkles className="h-5 w-5" />
        <span className="font-mono text-xs uppercase tracking-widest">
          Project Initialized
        </span>
      </div>
      <div className="text-4xl">{categoryEmoji(category)}</div>
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Interest Category
        </div>
        <div className="text-lg font-bold">{categoryLabel(category)}</div>
      </div>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-foreground/90">
        {bridgingPrompt}
      </p>
      <div className="mx-auto max-w-md rounded-md border border-vvu-studi/30 bg-vvu-studi/5 p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Implicit Project ID
        </div>
        <div className="mt-1 font-mono text-sm font-semibold text-vvu-studi">
          {projectId}
        </div>
      </div>
      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
        {aiAssisted ? "✦ AI-assisted classification" : "Heuristic classification"}
      </Badge>
      <p className="text-xs text-muted-foreground">
        Taking you to your workspace…
      </p>
    </div>
  );
}
