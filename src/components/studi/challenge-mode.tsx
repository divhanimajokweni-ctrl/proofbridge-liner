"use client";

/**
 * Challenge Mode Orchestrator — the productive-disagreement surface.
 *
 * This component is the user-facing surface for the entire Challenge Mode
 * flow:
 *   1. User enters a claim + evidence
 *   2. IVE scans the claim for the 4 triggers (Contradiction / Unsupported
 *      Assumption / Alternative Explanation / Overconfidence)
 *   3. If challenges are found, Challenge Cards surface — the user MUST
 *      respond to each before IVE proceeds to verification
 *   4. Each challenge + response is stored as an epistemic object
 *   5. After all challenges are resolved (or the user explicitly proceeds
 *      with uncertainty), IVE proceeds to verification (or marks the claim
 *      abandoned)
 *
 * Auto-enabled for all Study Mode users per operator directive. Badge:
 *   "This system challenges assumptions to improve accuracy."
 */

import { useCallback, useEffect, useState } from "react";
import {
  scanClaim,
  type Challenge,
  type EpistemicObject,
  type UserResponseType,
  challengeTypeLabel,
  challengeTypeEmoji,
} from "@/lib/studi/challenge-scanner";
import {
  generateEpistemicObjectId,
  loadEpistemicObjects,
  saveEpistemicObject,
  updateEpistemicObject,
  getEpistemicStats,
} from "@/lib/studi/epistemic-objects";
import { loadInterestInception } from "@/lib/studi/interest-inception-state";
import { ChallengeCard } from "@/components/studi/challenge-card";
import { ChallengeModeBadge } from "@/components/studi/challenge-mode-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ListChecks,
  Send,
  RotateCcw,
} from "lucide-react";

interface Props {
  /** Optional callback when a claim completes the challenge flow. */
  onClaimResolved?: (obj: EpistemicObject) => void;
}

export function ChallengeMode({ onClaimResolved }: Props) {
  const [claim, setClaim] = useState("");
  const [evidence, setEvidence] = useState("");
  const [scanning, setScanning] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [resolvedChallenges, setResolvedChallenges] = useState<
    { challenge: Challenge; responseType: UserResponseType; responseText: string }[]
  >([]);
  const [currentObj, setCurrentObj] = useState<EpistemicObject | null>(null);
  const [history, setHistory] = useState<EpistemicObject[]>([]);
  const [stats, setStats] = useState(getEpistemicStats());

  // Load history + stats on mount.
  useEffect(() => {
    setHistory(loadEpistemicObjects());
    setStats(getEpistemicStats());
  }, []);

  const refreshStats = useCallback(() => {
    setStats(getEpistemicStats());
    setHistory(loadEpistemicObjects());
  }, []);

  // Run the challenge scan.
  const handleScan = useCallback(async () => {
    if (!claim.trim()) return;
    setScanning(true);
    setActiveChallenges([]);
    setResolvedChallenges([]);

    // Local heuristic scan first (always available).
    let challenges = scanClaim(claim.trim(), evidence.trim() || null);

    // Try AI router for refined scan (optional).
    try {
      const res = await fetch("/api/studi/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim: claim.trim(),
          evidence: evidence.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          // AI challenges override heuristic — they're typically richer.
          challenges = data.challenges as Challenge[];
        }
      }
    } catch {
      // AI unavailable — local heuristic is fine.
    }

    // Create the epistemic object immediately (pending state).
    const inception = loadInterestInception();
    const obj: EpistemicObject = {
      id: generateEpistemicObjectId(),
      claim: claim.trim(),
      evidence: evidence.trim() || null,
      challenges,
      user_responses: [],
      final_resolution: "pending",
      timestamp: new Date().toISOString(),
      project_id: inception.projectId,
      interest_category: inception.interestCategory,
    };
    saveEpistemicObject(obj);
    setCurrentObj(obj);
    setActiveChallenges(challenges);
    setScanning(false);
    refreshStats();
  }, [claim, evidence, refreshStats]);

  // Handle user response to a challenge.
  const handleChallengeResponse = useCallback(
    (challenge: Challenge, responseType: UserResponseType, responseText: string) => {
      setResolvedChallenges((prev) => [
        ...prev,
        { challenge, responseType, responseText },
      ]);
      setActiveChallenges((prev) => prev.filter((c) => c.id !== challenge.id));

      // Update the epistemic object.
      if (currentObj) {
        const updated: EpistemicObject = {
          ...currentObj,
          user_responses: [
            ...currentObj.user_responses,
            {
              challenge_id: challenge.id,
              response_type: responseType,
              response_text: responseText,
            },
          ],
        };
        // If user abandoned, mark the object abandoned.
        if (responseType === "abandon_claim") {
          updated.final_resolution = "abandoned";
        }
        // If all challenges resolved, mark revised (user addressed them).
        else if (updated.user_responses.length === updated.challenges.length) {
          updated.final_resolution = "revised";
        }
        updateEpistemicObject(updated.id, updated);
        setCurrentObj(updated);

        // If all challenges resolved or abandoned, notify parent + refresh.
        if (updated.final_resolution !== "pending") {
          onClaimResolved?.(updated);
          refreshStats();
        }
      }
    },
    [currentObj, onClaimResolved, refreshStats],
  );

  // User explicitly chooses to proceed to verification despite remaining challenges.
  const handleProceedWithUncertainty = useCallback(() => {
    if (!currentObj) return;
    // Mark remaining challenges as "proceed with uncertainty".
    const remainingResponses = activeChallenges.map((c) => ({
      challenge_id: c.id,
      response_type: "proceed_with_uncertainty" as UserResponseType,
      response_text: "",
    }));
    const updated: EpistemicObject = {
      ...currentObj,
      user_responses: [
        ...currentObj.user_responses,
        ...remainingResponses,
      ],
      final_resolution: "unresolved",
    };
    updateEpistemicObject(updated.id, updated);
    setCurrentObj(updated);
    setActiveChallenges([]);
    onClaimResolved?.(updated);
    refreshStats();
  }, [currentObj, activeChallenges, onClaimResolved, refreshStats]);

  // Reset the form for a new claim.
  const handleReset = useCallback(() => {
    setClaim("");
    setEvidence("");
    setActiveChallenges([]);
    setResolvedChallenges([]);
    setCurrentObj(null);
  }, []);

  const hasActiveChallenges = activeChallenges.length > 0;
  const allResolved = currentObj && !hasActiveChallenges && currentObj.final_resolution !== "pending";

  return (
    <div className="space-y-5">
      {/* Header with badge */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Challenge Mode</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            IVE scans every claim for contradictions, unsupported assumptions,
            alternative explanations, and overconfidence — before proceeding
            to verification.
          </p>
        </div>
        <ChallengeModeBadge variant="full" />
      </div>

      {/* Stats summary */}
      {stats.total > 0 && (
        <Card className="border-vvu-studi/20 bg-vvu-studi/5">
          <CardContent className="flex items-center gap-6 p-3 text-xs">
            <Stat label="Total challenges" value={stats.total} />
            <Stat
              label="Resolution rate"
              value={`${Math.round(stats.resolution_rate * 100)}%`}
            />
            {Object.entries(stats.by_challenge_type).map(([type, count]) => (
              <Stat
                key={type}
                label={challengeTypeLabel(type as Challenge["type"])}
                value={count}
                emoji={challengeTypeEmoji(type as Challenge["type"])}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Claim + evidence input */}
      {!currentObj && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Enter a claim to challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Your claim
              </label>
              <Textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g., This investment will double in 6 months."
                className="min-h-[60px]"
                disabled={scanning}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Evidence (optional)
              </label>
              <Textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Paste a screenshot, link, article excerpt, or anything that supports your claim."
                className="min-h-[80px]"
                disabled={scanning}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleScan}
                disabled={!claim.trim() || scanning}
                className="gap-2"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Scan for challenges
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active challenges */}
      {hasActiveChallenges && currentObj && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">
                {activeChallenges.length} challenge
                {activeChallenges.length === 1 ? "" : "s"} awaiting your response
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProceedWithUncertainty}
              className="text-xs"
            >
              Proceed with uncertainty →
            </Button>
          </div>
          {activeChallenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              onResponse={handleChallengeResponse}
            />
          ))}
        </div>
      )}

      {/* Resolution */}
      {allResolved && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex items-start gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold">
                Challenges resolved — claim moves to verification
              </h3>
              <p className="text-xs text-muted-foreground">
                Resolution:{" "}
                <Badge variant="outline" className="ml-1 font-mono text-[10px] uppercase tracking-wider">
                  {currentObj.final_resolution}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                {resolvedChallenges.length} of {currentObj.challenges.length}{" "}
                challenges addressed.
              </p>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleReset} size="sm" variant="outline">
                  Submit another claim
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecks className="h-4 w-4" />
              Boundary dataset ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Every challenge and response is stored as a structured epistemic
              object — the most valuable data for improving the system.
            </p>
            {history.slice(0, 5).map((obj) => (
              <div
                key={obj.id}
                className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card/60 p-2.5 text-xs"
              >
                <div className="flex-1 space-y-1">
                  <p className="italic text-foreground/80">
                    &ldquo;{obj.claim.slice(0, 120)}
                    {obj.claim.length > 120 ? "…" : ""}&rdquo;
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {obj.challenges.map((c) => (
                      <Badge
                        key={c.id}
                        variant="outline"
                        className="font-mono text-[9px] uppercase tracking-wider"
                      >
                        {challengeTypeEmoji(c.type)} {challengeTypeLabel(c.type)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`font-mono text-[9px] uppercase tracking-wider ${
                    obj.final_resolution === "verified" || obj.final_resolution === "revised"
                      ? "border-emerald-500/40 text-emerald-500"
                      : obj.final_resolution === "abandoned"
                        ? "border-red-500/40 text-red-500"
                        : "border-amber-500/40 text-amber-500"
                  }`}
                >
                  {obj.final_resolution}
                </Badge>
              </div>
            ))}
            {history.length > 5 && (
              <div className="text-center text-[10px] text-muted-foreground">
                + {history.length - 5} more in localStorage
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Reset the entire boundary dataset? This cannot be undone.")) {
                  window.localStorage.removeItem("vvu-epistemic-objects");
                  refreshStats();
                }
              }}
              className="mt-2 gap-1.5 text-[10px] text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset boundary dataset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string | number;
  emoji?: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {emoji && <span className="mr-1">{emoji}</span>}
        {label}
      </div>
      <div className="font-mono text-base font-semibold">{value}</div>
    </div>
  );
}
