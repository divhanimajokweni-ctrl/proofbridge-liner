"use client";

/**
 * StudiGateEditor — the one-click fail-closed valve demo.
 *
 * Lists every STUDI governance gate with its current status. Clicking
 * a status pill flips the gate to that status via
 * PATCH /api/theorem-state/gates/[slug]. The next /api/theorem-state
 * poll (≤5s) recomputes the STUDI verdict, which feeds the global
 * theorem-state store, which the Evolution Matrix is subscribed to —
 * so the STUDI hero morphs from sphere → antone when all gates hit
 * GO/FILED/RESOLVED, and back to sphere when any gate flips to
 * PENDING/NOT-FILED/BLOCKED.
 *
 * This component reads the gate list directly from the theorem-state
 * store (hydrated by the poller), so it stays in sync with the matrix
 * without an extra fetch.
 *
 * Fail-closed guarantee: the editor cannot force IVE to GO. It can
 * only mutate gate rows. If IVE's breaker is tripped, IVE stays at
 * INCONCLUSIVE regardless of what STUDI does here — Theorem 5 still
 * holds.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheoremStore } from "@/lib/theorem/theorem-store";
import { RotateCcw, Loader2, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

type GateStatus =
  | "GO"
  | "FILED"
  | "RESOLVED"
  | "DRAFT"
  | "READY"
  | "PENDING"
  | "NOT-FILED"
  | "BLOCKED";

/** All possible gate statuses, grouped by lattice bucket for the UI. */
const STATUS_GROUPS: Array<{
  bucket: "PROVEN" | "INCONCLUSIVE" | "UNKNOWN";
  label: string;
  statuses: GateStatus[];
  color: string;
}> = [
  {
    bucket: "PROVEN",
    label: "Met",
    statuses: ["GO", "FILED", "RESOLVED"],
    color: "#10b981",
  },
  {
    bucket: "INCONCLUSIVE",
    label: "Draft",
    statuses: ["DRAFT", "READY"],
    color: "#e67e22",
  },
  {
    bucket: "UNKNOWN",
    label: "Blocked",
    statuses: ["PENDING", "NOT-FILED", "BLOCKED"],
    color: "#e74c3c",
  },
];

function statusBucket(s: GateStatus): "PROVEN" | "INCONCLUSIVE" | "UNKNOWN" {
  for (const g of STATUS_GROUPS) {
    if (g.statuses.includes(s)) return g.bucket;
  }
  return "UNKNOWN";
}

function bucketColor(b: "PROVEN" | "INCONCLUSIVE" | "UNKNOWN") {
  if (b === "PROVEN") return "#10b981";
  if (b === "INCONCLUSIVE") return "#e67e22";
  return "#e74c3c";
}

const ALL_STATUSES = STATUS_GROUPS.flatMap((g) => g.statuses);

export function StudiGateEditor() {
  // We need the whole studiGates array, not just the verdict. The poller
  // already pushes studiGates into the snapshot — but our snapshot only
  // carries verdict/confidence. So this component also fetches the gate
  // list directly on mount and after every PATCH, with optimistic updates.
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);

  const [gates, setGates] = useState<GateRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial + manual refresh fetch.
  const fetchGates = async () => {
    try {
      const res = await fetch("/api/theorem-state", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGates(data.studiGates ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // Mount-only fetch. Subsequent updates come from the PATCH handler's
  // optimistic setGates + the global poller's store update.
  useEffect(() => {
    void fetchGates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFlip = async (slug: string, nextStatus: GateStatus) => {
    if (!gates) return;
    const prev = gates.find((g) => g.slug === slug);
    if (!prev || prev.status === nextStatus) return;

    // Optimistic update
    setUpdatingSlug(slug);
    setGates((cur) =>
      (cur ?? []).map((g) => (g.slug === slug ? { ...g, status: nextStatus } : g))
    );

    try {
      const res = await fetch(
        `/api/theorem-state/gates/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      // Re-fetch to pull the authoritative updatedAt + note from the server
      await fetchGates();
    } catch (e) {
      // Roll back
      setGates((cur) =>
        (cur ?? []).map((g) =>
          g.slug === slug && prev ? { ...g, status: prev.status } : g
        )
      );
      setError(e instanceof Error ? e.message : "patch failed");
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleResetAll = async () => {
    if (!gates) return;
    setUpdatingSlug("__all__");
    // Flip every gate back to its "natural" baseline — the original seed.
    // We do this in sequence (small N, ~6 gates) so the optimistic UI
    // feels instant.
    const baseline: Record<string, GateStatus> = {
      charter: "DRAFT",
      moi: "DRAFT",
      sha: "PENDING",
      cipc: "NOT-FILED",
      audit: "READY",
      "trust-bound": "READY",
    };
    for (const g of gates) {
      const target = baseline[g.slug] ?? "PENDING";
      if (g.status !== target) {
        await fetch(`/api/theorem-state/gates/${g.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        });
      }
    }
    await fetchGates();
    setUpdatingSlug(null);
  };

  if (loading && !gates) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex items-center gap-2 py-8 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading gates…
        </CardContent>
      </Card>
    );
  }

  if (error && !gates) {
    return (
      <Card className="border-red-500/40">
        <CardContent className="flex items-center gap-2 py-6 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </CardContent>
      </Card>
    );
  }

  const allMet = (gates ?? []).every((g) =>
    ["GO", "FILED", "RESOLVED"].includes(g.status)
  );

  return (
    <Card className="border-vvu-studi/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-3.5 w-3.5 text-vvu-studi" style={{ color: "var(--vvu-studi)" }} />
            Governance Gate Editor
            <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              · valve demo
            </span>
          </CardTitle>
          <button
            onClick={handleResetAll}
            disabled={updatingSlug !== null}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Reset all gates to baseline seed status"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Aggregate valve state */}
        <div
          className="flex items-center justify-between rounded-md border px-3 py-2"
          style={{
            borderColor: `color-mix(in oklab, ${bucketColor(studiVerdict)} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${bucketColor(studiVerdict)} 8%, transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            {studiVerdict === "PROVEN" ? (
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: bucketColor(studiVerdict) }}
              />
            ) : (
              <AlertTriangle
                className="h-4 w-4"
                style={{ color: bucketColor(studiVerdict) }}
              />
            )}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                STUDI verdict · driving the matrix
              </div>
              <div
                className="font-mono text-sm font-bold uppercase tracking-wider"
                style={{ color: bucketColor(studiVerdict) }}
              >
                {studiVerdict}
              </div>
            </div>
          </div>
          {allMet ? (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-[10px] font-mono uppercase tracking-wider text-emerald-400"
            >
              valve open
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-red-500/40 text-[10px] font-mono uppercase tracking-wider text-red-400"
            >
              valve closed
            </Badge>
          )}
        </div>

        {/* Per-gate editor */}
        <div className="space-y-2">
          {(gates ?? []).map((g) => {
            const b = statusBucket(g.status);
            const isUpdating = updatingSlug === g.slug || updatingSlug === "__all__";
            return (
              <div
                key={g.slug}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-tight text-foreground">
                      {g.label}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                      {g.slug}
                    </span>
                  </div>
                  {g.description && (
                    <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      {g.description}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {ALL_STATUSES.map((s) => {
                    const sg = STATUS_GROUPS.find((g) => g.statuses.includes(s))!;
                    const active = g.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleFlip(g.slug, s)}
                        disabled={isUpdating}
                        className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
                        style={{
                          background: active
                            ? `color-mix(in oklab, ${sg.color} 22%, transparent)`
                            : "transparent",
                          border: `1px solid color-mix(in oklab, ${sg.color} ${
                            active ? "55%" : "25%"
                          }, transparent)`,
                          color: active ? sg.color : "var(--muted-foreground)",
                          cursor: isUpdating ? "wait" : "pointer",
                          fontWeight: active ? 700 : 400,
                        }}
                        title={`Set ${g.label} → ${s}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : (
              "patch → poll → store → matrix"
            )}
          </span>
          {lastUpdatedAt && (
            <span>
              store: {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface GateRow {
  id: string;
  slug: string;
  label: string;
  description: string;
  status: GateStatus;
  note: string;
  order: number;
  updatedAt: string;
}
