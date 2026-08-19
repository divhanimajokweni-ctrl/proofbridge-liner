"use client";

/**
 * Challenge Card — the surface for productive disagreement.
 *
 * When IVE detects any of the 4 triggers (Contradiction / Unsupported
 * Assumption / Alternative Explanation / Overconfidence), it shows this
 * card BEFORE proceeding to verification. The user must respond explicitly.
 *
 * Per operator spec: "The user must explicitly respond to the challenge
 * before IVE proceeds to verification."
 */

import { useState } from "react";
import {
  type Challenge,
  type UserResponseType,
  challengeTypeEmoji,
  challengeTypeLabel,
  responseTypeLabel,
} from "@/lib/studi/challenge-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  X,
} from "lucide-react";

interface Props {
  challenge: Challenge;
  onResponse: (
    challenge: Challenge,
    responseType: UserResponseType,
    responseText: string,
  ) => void;
  onDismiss?: () => void;
}

export function ChallengeCard({ challenge, onResponse, onDismiss }: Props) {
  const [selected, setSelected] = useState<UserResponseType | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRespond = async () => {
    if (!selected) return;
    setSubmitting(true);
    // Brief delay so the UI doesn't jump — feels considered.
    await new Promise((r) => setTimeout(r, 250));
    onResponse(challenge, selected, responseText.trim());
    setSubmitting(false);
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/5 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span aria-hidden>{challengeTypeEmoji(challenge.type)}</span>
                CHALLENGE: {challengeTypeLabel(challenge.type)}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {challenge.description}
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-7 w-7 shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Claim excerpt */}
        <div className="space-y-1 rounded-md border border-border/60 bg-card/60 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Your claim
          </div>
          <p className="text-xs italic leading-relaxed text-foreground/90">
            &ldquo;{challenge.claim_excerpt}&rdquo;
          </p>
        </div>

        {/* Evidence excerpt (if any) */}
        {challenge.evidence_excerpt && (
          <div className="space-y-1 rounded-md border border-border/60 bg-card/60 p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Evidence provided
            </div>
            <p className="text-xs italic leading-relaxed text-foreground/90">
              &ldquo;{challenge.evidence_excerpt}&rdquo;
            </p>
          </div>
        )}

        {/* IVE's assessment */}
        <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-500">
            IVE&rsquo;s assessment
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">
            {challenge.assessment}
          </p>
          <Badge
            variant="outline"
            className="mt-2 font-mono text-[10px] uppercase tracking-wider"
          >
            Confidence: {Math.round(challenge.confidence * 100)}%
          </Badge>
        </div>

        {/* Response options */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            How do you respond?
          </div>
          <div className="grid gap-2">
            {(["provide_stronger_evidence", "adjust_claim", "proceed_with_uncertainty", "abandon_claim"] as UserResponseType[]).map(
              (rt) => {
                const isSelected = selected === rt;
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => setSelected(rt)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "border-vvu-studi bg-vvu-studi/10"
                        : "border-border bg-card/60 hover:border-vvu-studi/40 hover:bg-vvu-studi/5"
                    }`}
                  >
                    <span className="font-medium">
                      {responseTypeLabel(rt)}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-vvu-studi" />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Free-text response (optional) */}
        {selected && selected !== "abandon_claim" && (
          <Textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Optional: explain your response, or paste stronger evidence here…"
            className="min-h-[80px] text-xs"
            disabled={submitting}
          />
        )}

        {/* Submit */}
        <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelected(null);
              setResponseText("");
            }}
            disabled={!selected || submitting}
            className="text-xs"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleRespond}
            disabled={!selected || submitting}
            className="gap-2 text-xs"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            Respond &amp; continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
