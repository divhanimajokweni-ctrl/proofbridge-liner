"use client";

/**
 * ValveCockpit — the unified operator surface for the fail-closed valve.
 *
 * Both halves of the valve (STUDI gates upstream, IVE claims + breaker
 * downstream) drive the same global theorem-state store. The Valve
 * Cockpit puts them side-by-side under a single Evolution Matrix that
 * morphs across all 4 stages of the VVU trust story as the operator
 * flips gates and authorises/trips claims:
 *
 *   0  SPHERE        STUDI gates not all met (valve input not ready)
 *   1  ANTONE        STUDI PROVEN · IVE waiting (governance done)
 *   2  WEB-SPIDER    STUDI PROVEN · IVE INCONCLUSIVE (active, pulsing
 *                    red when breaker TRIPPED)
 *   3  MILES         STUDI PROVEN · IVE PROVEN (full release GO)
 *
 * The cockpit matrix uses `combinedStage: true` — a fourth stage mode
 * distinct from the per-workspace hero backdrops. STUDI's hero shows
 * stage 0→1 only; IVE's hero shows stage 2→3 only. The cockpit shows
 * the full 0→3 morph as one coherent valve.
 *
 * If STUDI gates are blocked, the cockpit matrix stays at sphere
 * regardless of what IVE is doing. That's the visible fail-closed
 * bound: governance blocks engineering release, no matter how many
 * IVE claims are authorised. Theorem 5 holds.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvolutionMatrix } from "@/components/vvu/evolution-matrix";
import { StudiGateEditor } from "@/components/studi/studi-gate-editor";
import { IveClaimInjector } from "@/components/ive-workspace/ive-claim-injector";
import { useTheoremStore } from "@/lib/theorem/theorem-store";
import { stageForCockpit } from "@/lib/theorem/theorem-store";
import {
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Workflow,
} from "lucide-react";

// ─── Verdict color helpers (mirrors StudiGateEditor palette) ────────────────

function verdictColor(v: "UNKNOWN" | "INCONCLUSIVE" | "PROVEN") {
  if (v === "PROVEN") return "#10b981";
  if (v === "INCONCLUSIVE") return "#e67e22";
  return "#e74c3c";
}

function breakerColor(b: "NORMAL" | "TRIPPED") {
  return b === "TRIPPED" ? "#e74c3c" : "#10b981";
}

// ─── Stage labels for the cockpit strip ─────────────────────────────────────

const STAGE_LABELS = [
  { id: 0, label: "0 · SPHERE", desc: "STUDI gates blocked · valve input not ready" },
  { id: 1, label: "1 · ANTONE", desc: "STUDI PROVEN · IVE waiting" },
  { id: 2, label: "2 · WEB-SPIDER", desc: "IVE INCONCLUSIVE · pulsing red if breaker tripped" },
  { id: 3, label: "3 · MILES", desc: "IVE PROVEN · full engineering release GO" },
];

export function ValveCockpit() {
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const breaker = useTheoremStore((s) => s.breaker);
  const confidence = useTheoremStore((s) => s.confidence);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);
  const stage = useTheoremStore((s) => stageForCockpit(s));

  // Combined verdict — what the cockpit matrix is "saying" right now.
  const combinedVerdict =
    studiVerdict !== "PROVEN"
      ? "UNKNOWN"
      : iveVerdict === "PROVEN"
        ? "PROVEN"
        : iveVerdict === "INCONCLUSIVE"
          ? "INCONCLUSIVE"
          : "UNKNOWN";

  return (
    <div className="space-y-5">
      {/* Hero: combined valve state + matrix */}
      <Card className="relative overflow-hidden border-vvu-gold/30 bg-gradient-to-br from-card via-card to-[color-mix(in_oklab,var(--vvu-gold)_8%,card)]">
        <EvolutionMatrix
          mode="hero"
          dataDriven
          combinedStage
          stageRange={[0, 3]}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,12,12,0.88) 0%, rgba(15,12,12,0.45) 50%, rgba(15,12,12,0.12) 100%)",
          }}
        />
        <CardContent className="relative z-[2] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <Badge
                className="mb-3 font-mono uppercase tracking-wider"
                variant="outline"
              >
                <Gauge className="mr-1 h-3 w-3" />
                VVU · Valve Cockpit
              </Badge>
              <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                One valve, two halves, four stages.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The fail-closed valve that binds VVU STUDI (governance) to
                VVU IVE (engineering release) is one coherent machine.
                STUDI gates feed forward into IVE; IVE's breaker feeds
                backward to block release. The Fibonacci matrix above is
                the visible face of the entire valve — flip a gate below,
                authorise a claim, trip a breaker; watch the morph respond
                within the 5s poll cadence.
              </p>
            </div>

            {/* Combined verdict + stage readout */}
            <div className="flex flex-col gap-2 md:w-72">
              <div
                className="rounded-md border px-3 py-2 backdrop-blur-sm"
                style={{
                  borderColor: `color-mix(in oklab, ${verdictColor(combinedVerdict)} 40%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${verdictColor(combinedVerdict)} 8%, transparent)`,
                }}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Combined valve verdict · stage {stage}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  {combinedVerdict === "PROVEN" ? (
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: verdictColor(combinedVerdict) }}
                    />
                  ) : (
                    <AlertTriangle
                      className="h-4 w-4"
                      style={{ color: verdictColor(combinedVerdict) }}
                    />
                  )}
                  <span
                    className="font-mono text-sm font-bold uppercase tracking-wider"
                    style={{ color: verdictColor(combinedVerdict) }}
                  >
                    {combinedVerdict}
                  </span>
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  {STAGE_LABELS[stage].desc}
                </div>
              </div>

              {/* 4 mini readouts */}
              <div className="grid grid-cols-2 gap-1.5">
                <ReadoutTile
                  label="STUDI"
                  value={studiVerdict}
                  color={verdictColor(studiVerdict)}
                />
                <ReadoutTile
                  label="IVE"
                  value={iveVerdict}
                  color={verdictColor(iveVerdict)}
                />
                <ReadoutTile
                  label="breaker"
                  value={breaker}
                  color={breakerColor(breaker)}
                />
                <ReadoutTile
                  label="confidence"
                  value={`${(confidence * 100).toFixed(0)}%`}
                  color="#7c8bf5"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage strip — 4 stages of the morph */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Workflow className="h-3.5 w-3.5 text-vvu-gold" style={{ color: "var(--vvu-gold)" }} />
            Stage morph
            <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              · combined verdict across both workspaces
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            {STAGE_LABELS.map((s) => {
              const active = s.id === stage;
              const passed = s.id < stage;
              return (
                <div
                  key={s.id}
                  className="rounded-md border px-3 py-2 transition-all"
                  style={{
                    borderColor: active
                      ? "color-mix(in oklab, var(--vvu-gold) 55%, transparent)"
                      : passed
                        ? "color-mix(in oklab, #10b981 30%, transparent)"
                        : "var(--border)",
                    backgroundColor: active
                      ? "color-mix(in oklab, var(--vvu-gold) 10%, transparent)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider"
                      style={{
                        color: active
                          ? "var(--vvu-gold)"
                          : passed
                            ? "#10b981"
                            : "var(--muted-foreground)",
                        fontWeight: active || passed ? 700 : 400,
                      }}
                    >
                      {s.label}
                    </span>
                    {active && (
                      <span
                        className="text-[9px] font-mono uppercase tracking-wider"
                        style={{ color: "var(--vvu-gold)" }}
                      >
                        ● here
                      </span>
                    )}
                    {passed && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    {s.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two-column injector grid — both halves of the valve */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StudiGateEditor />
        <IveClaimInjector />
      </div>

      {/* Footer: pipeline + last-updated */}
      <Card className="border-border/60">
        <CardContent className="flex items-center justify-between gap-2 p-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>
            patch → poll → store → matrix · 5s cadence · fail-closed by EIS Theorem 5
          </span>
          {lastUpdatedAt && (
            <span>
              store: {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Small inline readout tile used in the hero's mini-grid ─────────────────

function ReadoutTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-2 py-1.5 backdrop-blur-sm">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
