"use client";

/**
 * IveClaimInjector — the live system validation surface for the IVE
 * half of the fail-closed valve.
 *
 * Mirrors the STUDI Governance Gate Editor, but for IVE: lists every
 * claim with two buttons each (AUTHORIZE / REVOKE, TRIP / RESET
 * BREAKER). The next /api/theorem-state poll (≤5s) recomputes the
 * IVE verdict, which feeds the global theorem-state store, which the
 * Evolution Matrix is subscribed to — so the IVE hero morphs from
 * web-spider → Miles as the operator crosses the 50% authorisation
 * ratio, and to web-spider+pulsing-red the moment any breaker trips.
 *
 * Reads claim state directly from the theorem-state store (hydrated
 * by the poller), so it stays in sync with the matrix without an extra
 * fetch. On PATCH, applies an optimistic update to the local copy so
 * the UI reacts instantly even before the next poll arrives.
 *
 * Fail-closed guarantee preserved: this injector mutates only
 * Authorization and CircuitBreaker rows. It cannot bypass Theorem 5 —
 * if the breaker is tripped, IVE stays at INCONCLUSIVE regardless of
 * how many claims are authorised.
 *
 * NOTE: this is the OPERATIONAL OVERRIDE surface — what an operator
 * uses to drive the valve under live conditions to validate the
 * fail-closed bound. The reference EIS backend (/api/authorize)
 * evaluates A = C ∧ E ∧ I ∧ S ∧ R from evidence; this injector
 * writes operator-asserted overrides, recorded as audit events in the
 * Authorization and CircuitBreaker tables.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useTheoremStore,
  type TheoremIveClaimRow,
} from "@/lib/theorem/theorem-store";
import {
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldOff,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface PendingAction {
  claimId: string;
  type: "authorize" | "revoke" | "trip" | "reset";
}

// ─── Verdict color helpers (mirrors StudiGateEditor palette) ────────────────

function verdictColor(v: "UNKNOWN" | "INCONCLUSIVE" | "PROVEN") {
  if (v === "PROVEN") return "#10b981";
  if (v === "INCONCLUSIVE") return "#e67e22";
  return "#e74c3c";
}

export function IveClaimInjector() {
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const breaker = useTheoremStore((s) => s.breaker);
  const confidence = useTheoremStore((s) => s.confidence);
  const storeClaims = useTheoremStore((s) => s.iveClaims);
  const lastUpdatedAt = useTheoremStore((s) => s.lastUpdatedAt);
  const hydrate = useTheoremStore((s) => s.hydrate);

  // Local optimistic overlay — applied on top of the store's claims
  // so the UI reacts instantly before the next poll arrives.
  const [overlay, setOverlay] = useState<
    Record<string, Partial<TheoremIveClaimRow>>
  >({});
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // One-shot bootstrap fetch on mount — the poller may not have run
  // yet when this component mounts (e.g. user navigated straight to
  // the IVE overview before the 5s tick). Ensures the injector never
  // shows an empty list on first render.
  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);
    (async () => {
      try {
        const res = await fetch("/api/theorem-state", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        hydrate({
          studiVerdict: data.studiVerdict,
          iveVerdict: data.iveVerdict,
          breaker: data.breaker,
          confidence: data.confidence,
          iveClaims: Array.isArray(data.iveClaims) ? data.iveClaims : [],
        });
      } catch {
        // Swallow — the poller will catch up.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped]);

  // Merge the store's claims with any optimistic overlay entries.
  const claims: TheoremIveClaimRow[] = storeClaims.map((c) => ({
    ...c,
    ...(overlay[c.id] ?? {}),
  }));

  // ─── Actions ───────────────────────────────────────────────────────────

  const callAuthorize = async (
    claimId: string,
    authorized: boolean
  ): Promise<void> => {
    const res = await fetch(
      `/api/theorem-state/claims/${encodeURIComponent(claimId)}/authorize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorized }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  };

  const callBreaker = async (
    claimId: string,
    tripped: boolean
  ): Promise<void> => {
    const res = await fetch(
      `/api/theorem-state/claims/${encodeURIComponent(claimId)}/breaker`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripped }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
  };

  const handleAuthorize = async (claimId: string, next: boolean) => {
    const prev = claims.find((c) => c.id === claimId);
    if (!prev || prev.authorized === next) return;

    setPending({ claimId, type: next ? "authorize" : "revoke" });
    setOverlay((cur) => ({
      ...cur,
      [claimId]: {
        ...cur[claimId],
        authorized: next,
        authorizationUpdatedAt: new Date().toISOString(),
        authorizationReason: next
          ? "operator override — all five conjuncts asserted"
          : "operator revoke — claim no longer meets threshold",
      },
    }));

    try {
      await callAuthorize(claimId, next);
      setError(null);
    } catch (e) {
      // Roll back this overlay entry
      setOverlay((cur) => ({
        ...cur,
        [claimId]: {
          ...cur[claimId],
          authorized: prev.authorized,
          authorizationUpdatedAt: prev.authorizationUpdatedAt,
          authorizationReason: prev.authorizationReason,
        },
      }));
      setError(e instanceof Error ? e.message : "authorize failed");
    } finally {
      setPending(null);
    }
  };

  const handleBreaker = async (claimId: string, next: boolean) => {
    const prev = claims.find((c) => c.id === claimId);
    if (!prev || prev.breakerTripped === next) return;

    setPending({ claimId, type: next ? "trip" : "reset" });
    setOverlay((cur) => ({
      ...cur,
      [claimId]: {
        ...cur[claimId],
        breakerTripped: next,
        breakerUpdatedAt: new Date().toISOString(),
        breakerReason: "operator_override",
      },
    }));

    try {
      await callBreaker(claimId, next);
      setError(null);
    } catch (e) {
      setOverlay((cur) => ({
        ...cur,
        [claimId]: {
          ...cur[claimId],
          breakerTripped: prev.breakerTripped,
          breakerUpdatedAt: prev.breakerUpdatedAt,
          breakerReason: prev.breakerReason,
        },
      }));
      setError(e instanceof Error ? e.message : "breaker failed");
    } finally {
      setPending(null);
    }
  };

  // "Reset all" — authorise every claim, reset every breaker. This
  // pushes IVE to PROVEN (if totalClaims > 0 and breaker stays NORMAL),
  // which morphs the IVE hero to Miles. Used as the live validation
  // equivalent of "snap the valve open".
  const handleAuthoriseAll = async () => {
    setPending({ claimId: "__all__", type: "authorize" });
    try {
      for (const c of claims) {
        if (!c.authorized) await callAuthorize(c.id, true);
        if (c.breakerTripped) await callBreaker(c.id, false);
      }
      // Optimistically flip overlay
      const stamp = new Date().toISOString();
      const nextOverlay: Record<string, Partial<TheoremIveClaimRow>> = {};
      for (const c of claims) {
        nextOverlay[c.id] = {
          authorized: true,
          breakerTripped: false,
          authorizationUpdatedAt: stamp,
          breakerUpdatedAt: stamp,
          authorizationReason:
            "operator override — all five conjuncts asserted",
          breakerReason: "operator_override",
        };
      }
      setOverlay(nextOverlay);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "bulk action failed");
    } finally {
      setPending(null);
    }
  };

  const handleResetAll = async () => {
    setPending({ claimId: "__all__", type: "revoke" });
    try {
      for (const c of claims) {
        if (c.authorized) await callAuthorize(c.id, false);
        if (c.breakerTripped) await callBreaker(c.id, false);
      }
      const stamp = new Date().toISOString();
      const nextOverlay: Record<string, Partial<TheoremIveClaimRow>> = {};
      for (const c of claims) {
        nextOverlay[c.id] = {
          authorized: false,
          breakerTripped: false,
          authorizationUpdatedAt: stamp,
          breakerUpdatedAt: stamp,
          authorizationReason: "operator revoke — claim no longer meets threshold",
          breakerReason: "operator_override",
        };
      }
      setOverlay(nextOverlay);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "bulk action failed");
    } finally {
      setPending(null);
    }
  };

  // ─── Loading / empty / error states ────────────────────────────────────

  if (claims.length === 0) {
    return (
      <Card className="border-vvu-ive/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity
              className="h-3.5 w-3.5 text-vvu-ive"
              style={{ color: "var(--vvu-ive)" }}
            />
            IVE Claim Verification Injector
            <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              · valve demo · other half
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading claims — run{" "}
            <code className="rounded bg-card/60 px-1 py-0.5 font-mono text-[10px]">
              bun run scripts/seed-ive-claims.ts
            </code>{" "}
            if none appear.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalClaims = claims.length;
  const authorizedCount = claims.filter((c) => c.authorized).length;
  const trippedCount = claims.filter((c) => c.breakerTripped).length;
  const authRatio = totalClaims > 0 ? authorizedCount / totalClaims : 0;

  return (
    <Card className="border-vvu-ive/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity
              className="h-3.5 w-3.5 text-vvu-ive"
              style={{ color: "var(--vvu-ive)" }}
            />
            IVE Claim Verification Injector
            <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              · other half of the valve
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAuthoriseAll}
              disabled={pending !== null}
              data-test="all-go"
              data-pending={pending ? "true" : "false"}
              className="flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
              title="Authorise all claims + reset all breakers → IVE PROVEN"
            >
              <CheckCircle2 className="h-3 w-3" />
              All GO
            </button>
            <button
              onClick={handleResetAll}
              disabled={pending !== null}
              data-test="reset-all"
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="Revoke all authorisations + reset all breakers"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Aggregate valve state — drives the IVE hero matrix */}
        <div
          className="flex items-center justify-between rounded-md border px-3 py-2"
          style={{
            borderColor: `color-mix(in oklab, ${verdictColor(iveVerdict)} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${verdictColor(iveVerdict)} 8%, transparent)`,
          }}
        >
          <div className="flex items-center gap-2">
            {iveVerdict === "PROVEN" ? (
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: verdictColor(iveVerdict) }}
              />
            ) : (
              <AlertTriangle
                className="h-4 w-4"
                style={{ color: verdictColor(iveVerdict) }}
              />
            )}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                IVE verdict · driving the matrix · breaker {breaker}
              </div>
              <div
                className="font-mono text-sm font-bold uppercase tracking-wider"
                style={{ color: verdictColor(iveVerdict) }}
              >
                {iveVerdict}
                <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                  · {authorizedCount}/{totalClaims} authorised ·{" "}
                  {(authRatio * 100).toFixed(0)}%
                  {trippedCount > 0 && (
                    <span className="text-red-400">
                      {" · "}
                      {trippedCount} breaker{trippedCount !== 1 && "s"} tripped
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
          {iveVerdict === "PROVEN" ? (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-[10px] font-mono uppercase tracking-wider text-emerald-400"
            >
              valve open · miles
            </Badge>
          ) : breaker === "TRIPPED" ? (
            <Badge
              variant="outline"
              className="border-red-500/40 text-[10px] font-mono uppercase tracking-wider text-red-400"
            >
              valve tripped · pulsing red
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-500/40 text-[10px] font-mono uppercase tracking-wider text-amber-400"
            >
              valve held · web-spider
            </Badge>
          )}
        </div>

        {/* Per-claim injector rows */}
        <div className="space-y-2">
          {claims.map((c) => {
            const isPending =
              pending?.claimId === c.id || pending?.claimId === "__all__";
            const authInflight =
              isPending &&
              (pending.type === "authorize" || pending.type === "revoke");
            const breakerInflight =
              isPending &&
              (pending.type === "trip" || pending.type === "reset");

            return (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-md border border-border bg-card/40 px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                {/* Left: claim identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-tight text-foreground">
                      {c.title}
                    </span>
                    {c.safetyCritical && (
                      <Badge
                        variant="outline"
                        className="border-red-500/40 px-1 py-0 text-[9px] font-mono uppercase tracking-wider text-red-400"
                      >
                        safety
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                    <span>{c.claimType}</span>
                    <span>·</span>
                    <span>{c.intendedAction}</span>
                    <span>·</span>
                    <span>state={c.state}</span>
                  </div>
                  {c.description && (
                    <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      {c.description}
                    </div>
                  )}
                </div>

                {/* Right: live state + action buttons */}
                <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                  {/* Authorization state + toggle */}
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1">
                    {c.authorized ? (
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ShieldOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider"
                      style={{
                        color: c.authorized ? "#10b981" : "var(--muted-foreground)",
                        fontWeight: c.authorized ? 700 : 400,
                      }}
                    >
                      {c.authorized ? "AUTH" : "no-auth"}
                    </span>
                    <div className="ml-1 flex gap-0.5">
                      <button
                        onClick={() => handleAuthorize(c.id, true)}
                        disabled={isPending || c.authorized}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30"
                        style={{
                          background: c.authorized
                            ? "color-mix(in oklab, #10b981 22%, transparent)"
                            : "transparent",
                          border:
                            "1px solid color-mix(in oklab, #10b981 35%, transparent)",
                          color: c.authorized ? "#10b981" : "var(--muted-foreground)",
                          cursor: isPending || c.authorized ? "default" : "pointer",
                        }}
                        title="Authorise this claim"
                      >
                        {authInflight && pending?.type === "authorize" ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          "AUTH"
                        )}
                      </button>
                      <button
                        onClick={() => handleAuthorize(c.id, false)}
                        disabled={isPending || !c.authorized}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30"
                        style={{
                          background: !c.authorized
                            ? "color-mix(in oklab, #e74c3c 22%, transparent)"
                            : "transparent",
                          border:
                            "1px solid color-mix(in oklab, #e74c3c 35%, transparent)",
                          color: !c.authorized ? "#e74c3c" : "var(--muted-foreground)",
                          cursor: isPending || !c.authorized ? "default" : "pointer",
                        }}
                        title="Revoke authorisation"
                      >
                        {authInflight && pending?.type === "revoke" ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          "REVOKE"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Breaker state + toggle */}
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1">
                    {c.breakerTripped ? (
                      <Zap className="h-3 w-3 text-red-400" />
                    ) : (
                      <Zap className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider"
                      style={{
                        color: c.breakerTripped ? "#e74c3c" : "var(--muted-foreground)",
                        fontWeight: c.breakerTripped ? 700 : 400,
                      }}
                    >
                      {c.breakerTripped ? "TRIP" : "normal"}
                    </span>
                    <div className="ml-1 flex gap-0.5">
                      <button
                        onClick={() => handleBreaker(c.id, true)}
                        disabled={isPending || c.breakerTripped}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30"
                        style={{
                          background: c.breakerTripped
                            ? "color-mix(in oklab, #e74c3c 22%, transparent)"
                            : "transparent",
                          border:
                            "1px solid color-mix(in oklab, #e74c3c 35%, transparent)",
                          color: c.breakerTripped ? "#e74c3c" : "var(--muted-foreground)",
                          cursor: isPending || c.breakerTripped ? "default" : "pointer",
                        }}
                        title="Trip the breaker on this claim"
                      >
                        {breakerInflight && pending?.type === "trip" ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          "TRIP"
                        )}
                      </button>
                      <button
                        onClick={() => handleBreaker(c.id, false)}
                        disabled={isPending || !c.breakerTripped}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all disabled:opacity-30"
                        style={{
                          background: !c.breakerTripped
                            ? "color-mix(in oklab, #10b981 22%, transparent)"
                            : "transparent",
                          border:
                            "1px solid color-mix(in oklab, #10b981 35%, transparent)",
                          color: !c.breakerTripped ? "#10b981" : "var(--muted-foreground)",
                          cursor: isPending || !c.breakerTripped ? "default" : "pointer",
                        }}
                        title="Reset the breaker on this claim"
                      >
                        {breakerInflight && pending?.type === "reset" ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          "RESET"
                        )}
                      </button>
                    </div>
                  </div>
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
