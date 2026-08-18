"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClaimType,
  EvidenceSource,
  VerificationState,
  AuthorizationResult,
  ParticipationRatioResult,
} from "@/lib/eis";
import { StateBadge } from "@/components/ive/state-badge";
import { StateLattice } from "@/components/ive/state-lattice";
import { AuthorizationPanel } from "@/components/ive/authorization-panel";
import { EvidenceMeshPanel } from "@/components/ive/evidence-mesh-panel";
import { ParticipationRatioPanel } from "@/components/ive/participation-ratio-panel";
import { HeatKernelPanel } from "@/components/ive/heat-kernel-panel";
import { CircuitBreakerPanel } from "@/components/ive/circuit-breaker-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Database,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EvidenceItem {
  id: string;
  claimId: string;
  source: EvidenceSource;
  content: string;
  embedding: number[];
  weight: number;
  state: VerificationState;
  collectedAt: string;
}

interface AuthorizationRecord extends AuthorizationResult {
  id: string;
  claimId: string;
  createdAt: string;
}

interface CircuitBreakerRecord {
  id: string;
  claimId: string;
  triggered: boolean;
  reason: string;
  trippedAt: string;
}

interface NIndRecord {
  id: string;
  claimId: string;
  numEvidence: number;
  numSources: number;
  nInd: number;
  gamma: number;
  eigenvalues: number[];
  createdAt: string;
}

interface Claim {
  id: string;
  title: string;
  description: string;
  claimType: ClaimType;
  state: VerificationState;
  intendedAction: string;
  safetyCritical: boolean;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceItem[];
  authorizations: AuthorizationRecord[];
  circuitEvents: CircuitBreakerRecord[];
  nIndRecords: NIndRecord[];
}

interface SystemState {
  claims: Claim[];
  summary: {
    totalClaims: number;
    authorizedClaims: number;
    breakerTripped: number;
    totalEvidence: number;
    stateCounts: Record<string, number>;
    evidenceBound: string;
    authorizationFormula: string;
    failClosed: boolean;
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * IveClaimsPipeline — the EIS demo (claims + evidence + verification +
 * authorization). Surfaces the full VVU stack against the existing
 * /api/state, /api/verify, /api/evidence, /api/authorize routes.
 *
 * This is the "case study" of the IVE workspace — the actual industrial
 * verification engine. Mounted in the AppShell under
 * IVE → CORE → Claims Pipeline.
 */
export function IveClaimsPipeline() {
  const { toast } = useToast();
  const [state, setState] = useState<SystemState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SystemState;
      setState(data);
      if (!selectedId && data.claims.length > 0) {
        setSelectedId(data.claims[0].id);
      }
    } catch (e) {
      toast({
        title: "Failed to load state",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedId, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const seed = async () => {
    setActionLoading("seed");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Database seeded",
        description: `${data.count} demonstration claims created with full VVU stack.`,
      });
      setSelectedId(null);
      await refresh();
    } catch (e) {
      toast({
        title: "Seed failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const ingestEvidence = async (claimId: string) => {
    setActionLoading(`ingest-${claimId}`);
    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, seed: Math.floor(Math.random() * 10000) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Evidence ingested",
        description: `${Array.isArray(data.evidence) ? data.evidence.length : 1} item(s) from Evidence Mesh.`,
      });
      await refresh();
    } catch (e) {
      toast({
        title: "Ingest failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const verify = async (claimId: string) => {
    setActionLoading(`verify-${claimId}`);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Verification complete",
        description: `${data.trace.previousState} → ${data.trace.newState}`,
      });
      await refresh();
    } catch (e) {
      toast({
        title: "Verify failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const recomputeNInd = async (claimId: string) => {
    setActionLoading(`nind-${claimId}`);
    try {
      const res = await fetch("/api/n-ind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
      toast({
        title: "N_ind recomputed",
        description: "Participation ratio updated from current evidence set.",
      });
    } catch (e) {
      toast({
        title: "N_ind failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const authorize = async (
    claimId: string,
    safetyOverride: boolean,
    reviewSignedOff: boolean
  ) => {
    setActionLoading(`auth-${claimId}`);
    try {
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, safetyOverride, reviewSignedOff }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: data.authorized ? "Authorized ✓" : "Authorization blocked",
        description: data.authorized
          ? "A = C∧E∧I∧S∧R = true — action permitted."
          : "A = false — fail-closed. See reason for details.",
        variant: data.authorized ? "default" : "destructive",
      });
      await refresh();
    } catch (e) {
      toast({
        title: "Authorize failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createClaim = async (form: {
    title: string;
    description: string;
    claimType: ClaimType;
    intendedAction: string;
    safetyCritical: boolean;
  }) => {
    setActionLoading("create");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      toast({
        title: "Claim created",
        description: `New ${form.claimType} claim: ${form.title}`,
      });
      setShowCreate(false);
      setSelectedId(data.claim.id);
      await refresh();
    } catch (e) {
      toast({
        title: "Create failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const selected = state?.claims.find((c) => c.id === selectedId) ?? null;
  const latestAuth = selected?.authorizations[0] ?? null;
  const latestNInd = selected?.nIndRecords[0] ?? null;
  const nIndResult: ParticipationRatioResult | null = latestNInd
    ? {
        nInd: latestNInd.nInd,
        numEvidence: latestNInd.numEvidence,
        numSources: latestNInd.numSources,
        gamma: latestNInd.gamma,
        eigenvalues: latestNInd.eigenvalues,
      }
    : null;

  return (
    <>
      {/* Action toolbar (replaces the old full-width header — AppShell provides branding & nav) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/40 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {state?.summary.evidenceBound ?? "Claim ≤ Evidence ≤ Verification ≤ Authorization ≤ Action"}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            {state?.summary.authorizationFormula ?? "A = C ∧ E ∧ I ∧ S ∧ R"}
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Activity className="h-3 w-3" />
            fail-closed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={seed}
            disabled={actionLoading === "seed"}
          >
            {actionLoading === "seed" ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Seed demo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New claim
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Summary strip ─── */}
      {state && (
        <div className="border-b bg-muted/20">
          <div className="mx-auto max-w-[1600px] px-4 py-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard
                icon={<Database className="h-3.5 w-3.5" />}
                label="Claims"
                value={state.summary.totalClaims}
              />
              <SummaryCard
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="Authorized"
                value={state.summary.authorizedClaims}
                tone="emerald"
              />
              <SummaryCard
                icon={<Activity className="h-3.5 w-3.5" />}
                label="Breakers tripped"
                value={state.summary.breakerTripped}
                tone={state.summary.breakerTripped > 0 ? "red" : "emerald"}
              />
              <SummaryCard
                icon={<Terminal className="h-3.5 w-3.5" />}
                label="Evidence items"
                value={state.summary.totalEvidence}
              />
              <SummaryCard
                icon={<Layers className="h-3.5 w-3.5" />}
                label="Claim types"
                value={Object.keys(state.summary.stateCounts).length}
              />
              <SummaryCard
                icon={<GitBranch className="h-3.5 w-3.5" />}
                label="State values"
                value={Object.keys(state.summary.stateCounts).length}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Main ─── */}
      <div className="flex-1 mx-auto max-w-[1400px] w-full px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-mono">
              Loading IVE state from EIS backend…
            </p>
          </div>
        ) : !state || state.claims.length === 0 ? (
          <EmptyState onSeed={seed} loading={actionLoading === "seed"} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* Claim list */}
            <aside className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Claims ({state.claims.length})
                </h2>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-1.5">
                {state.claims.map((c) => {
                  const auth = c.authorizations[0];
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left rounded-md border p-2.5 transition-colors ${
                        selectedId === c.id
                          ? "border-foreground bg-accent"
                          : "border-border bg-card hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold leading-tight line-clamp-2 flex-1">
                          {c.title}
                        </span>
                        <StateBadge state={c.state} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="uppercase tracking-wider">{c.claimType}</span>
                        <span className="flex items-center gap-1.5">
                          <span>{c.evidence.length} ev</span>
                          {auth && (
                            <span
                              className={
                                auth.authorized
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }
                            >
                              A={auth.authorized ? "✓" : "✗"}
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Selected claim detail */}
            {selected && (
              <div className="space-y-4">
                {/* Claim header card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            {selected.claimType}
                          </span>
                          {selected.safetyCritical && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                              safety-critical
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-base leading-tight">
                          {selected.title}
                        </CardTitle>
                      </div>
                      <StateBadge state={selected.state} size="lg" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {selected.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => ingestEvidence(selected.id)}
                        disabled={actionLoading?.startsWith("ingest-")}
                      >
                        <Database className="mr-1.5 h-3.5 w-3.5" />
                        Ingest evidence
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verify(selected.id)}
                        disabled={actionLoading?.startsWith("verify-")}
                      >
                        <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                        Verify (IVE)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => recomputeNInd(selected.id)}
                        disabled={actionLoading?.startsWith("nind-")}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        N_ind
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => authorize(selected.id, false, false)}
                        disabled={actionLoading?.startsWith("auth-")}
                      >
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        Authorize
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for detailed panels */}
                <Tabs defaultValue="pipeline" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="pipeline" className="text-xs">
                      Pipeline
                    </TabsTrigger>
                    <TabsTrigger value="lattice" className="text-xs">
                      State Lattice
                    </TabsTrigger>
                    <TabsTrigger value="diffusion" className="text-xs">
                      Diffusion
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="text-xs">
                      Raw State
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pipeline" className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <EvidenceMeshPanel
                        evidence={selected.evidence}
                        onIngest={() => ingestEvidence(selected.id)}
                        loading={actionLoading?.startsWith("ingest-")}
                      />
                      <AuthorizationPanel
                        auth={latestAuth}
                        safetyCritical={selected.safetyCritical}
                        onAuthorize={(s, r) => authorize(selected.id, s, r)}
                        loading={actionLoading?.startsWith("auth-")}
                      />
                      <ParticipationRatioPanel
                        result={nIndResult}
                        threshold={selected.safetyCritical ? 2 : 1}
                        loading={actionLoading?.startsWith("nind-")}
                        onRecompute={() => recomputeNInd(selected.id)}
                      />
                      <CircuitBreakerPanel
                        events={selected.circuitEvents}
                        safetyCritical={selected.safetyCritical}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="lattice" className="mt-4">
                    <StateLattice currentState={selected.state} />
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Card className="p-4">
                        <h3 className="text-sm font-semibold tracking-tight mb-2">
                          Evidence Contribution
                        </h3>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto">
                          {selected.evidence.length === 0 ? (
                            <p className="text-xs text-muted-foreground font-mono py-4 text-center">
                              No evidence yet. Click <em>Ingest evidence</em>.
                            </p>
                          ) : (
                            selected.evidence.map((e) => (
                              <div
                                key={e.id}
                                className="flex items-center justify-between rounded border bg-card p-2 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {e.source}
                                  </span>
                                  <span className="truncate text-muted-foreground">
                                    {e.content.slice(0, 50)}
                                    {e.content.length > 50 ? "…" : ""}
                                  </span>
                                </div>
                                <StateBadge state={e.state} size="sm" />
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                      <Card className="p-4">
                        <h3 className="text-sm font-semibold tracking-tight mb-2">
                          Authorization History
                        </h3>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto">
                          {selected.authorizations.length === 0 ? (
                            <p className="text-xs text-muted-foreground font-mono py-4 text-center">
                              No authorization records yet.
                            </p>
                          ) : (
                            selected.authorizations.slice(0, 10).map((a) => (
                              <div
                                key={a.id}
                                className="rounded border bg-card p-2 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`font-mono font-bold ${
                                      a.authorized
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    A = {a.authorized ? "TRUE" : "FALSE"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {new Date(a.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 font-mono text-[10px]">
                                  {[
                                    ["C", a.claimOk],
                                    ["E", a.evidenceOk],
                                    ["I", a.integrityOk],
                                    ["S", a.safetyOk],
                                    ["R", a.reviewOk],
                                  ].map(([sym, ok]) => (
                                    <span
                                      key={sym as string}
                                      className={
                                        ok
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-red-600 dark:text-red-400"
                                      }
                                    >
                                      {sym}={ok ? "✓" : "✗"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="diffusion" className="mt-4">
                    <HeatKernelPanel claimId={selected.id} topology="evidence" />
                    <div className="mt-4">
                      <HeatKernelPanel topology="cycle" />
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <Card className="p-4">
                      <h3 className="text-sm font-semibold tracking-tight mb-3">
                        Raw EIS state
                      </h3>
                      <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto rounded border bg-muted/30 p-3 max-h-[600px] overflow-y-auto">
                        {JSON.stringify(selected, null, 2)}
                      </pre>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Create modal ─── */}
      {showCreate && (
        <CreateClaimModal
          onClose={() => setShowCreate(false)}
          onCreate={createClaim}
          loading={actionLoading === "create"}
        />
      )}
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "emerald" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "red"
      ? "text-red-600 dark:text-red-400"
      : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {icon}
        {label}
      </div>
      <div className={`font-mono text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function EmptyState({ onSeed, loading }: { onSeed: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Layers className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          No claims in the IVE yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Seed the database with three demonstration claims that exercise the
          full VVU stack — or create a new claim from scratch.
        </p>
      </div>
      <Button onClick={onSeed} disabled={loading}>
        {loading ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Seed demonstration claims
      </Button>
    </div>
  );
}

function CreateClaimModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (form: {
    title: string;
    description: string;
    claimType: ClaimType;
    intendedAction: string;
    safetyCritical: boolean;
  }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("empirical");
  const [intendedAction, setIntendedAction] = useState("deploy");
  const [safetyCritical, setSafetyCritical] = useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold tracking-tight mb-4">New claim</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Model accuracy ≥ 95%"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"
              placeholder="Describe the proposition that needs verification…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Claim type
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as ClaimType)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="mathematical">mathematical (cap: PROVEN)</option>
                <option value="semantic">semantic (cap: VERIFIED)</option>
                <option value="empirical">empirical (cap: SUPPORTED)</option>
                <option value="operational">operational (cap: OBSERVED)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Intended action
              </label>
              <input
                type="text"
                value={intendedAction}
                onChange={(e) => setIntendedAction(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={safetyCritical}
              onChange={(e) => setSafetyCritical(e.target.checked)}
              className="rounded"
            />
            <span>Safety-critical (requires S + R conjuncts)</span>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onCreate({ title, description, claimType, intendedAction, safetyCritical })
            }
            disabled={!title || loading}
          >
            {loading ? "Creating…" : "Create claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
