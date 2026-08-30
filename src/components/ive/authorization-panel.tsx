"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { AuthorizationResult } from "@/lib/eis";
import { GlossaryTerm } from "@/components/vvu/glossary-term";

interface AuthorizationPanelProps {
  auth: AuthorizationResult | null;
  safetyCritical: boolean;
  onAuthorize?: (safetyOverride: boolean, reviewSignedOff: boolean) => void;
  loading?: boolean;
}

const CONJUNCTS: Array<{
  key: keyof Pick<AuthorizationResult, "claimOk" | "evidenceOk" | "integrityOk" | "safetyOk" | "reviewOk">;
  label: string;
  symbol: string;
  description: string;
}> = [
  { key: "claimOk",     label: "Claim",       symbol: "C", description: "Claim state ≥ SUPPORTED" },
  { key: "evidenceOk",  label: "Evidence",    symbol: "E", description: "≥2 distinct sources OR ≥3 evidence items" },
  { key: "integrityOk", label: "Integrity",   symbol: "I", description: "N_ind ≥ 2 (safety-critical) or ≥1" },
  { key: "safetyOk",    label: "Safety",      symbol: "S", description: "SafeGrid / SafeStacks clearance" },
  { key: "reviewOk",    label: "Review",      symbol: "R", description: "Second-reviewer signoff" },
];

export function AuthorizationPanel({ auth, safetyCritical, onAuthorize, loading }: AuthorizationPanelProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            <GlossaryTerm term="Authorization">Authorization</GlossaryTerm>
          </h3>
          <div className="flex items-center gap-1 mt-1" title="A = C ∧ E ∧ I ∧ S ∧ R">
            <span className="text-[11px] font-mono text-muted-foreground">A =</span>
            {["C", "E", "I", "S", "R"].map((sym, i) => (
              <span key={sym} className="flex items-center gap-1">
                <span className="inline-flex h-4 min-w-4 px-1 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {sym}
                </span>
                {i < 4 && <span className="text-[10px] text-muted-foreground/70" aria-hidden>&middot;</span>}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Theorem 1, 4</span>
      </div>
      {auth ? (
        <>
          <div className="grid grid-cols-5 gap-2">
            {CONJUNCTS.map(({ key, label, symbol }) => {
              const ok = auth[key];
              const required = key === "safetyOk" || key === "reviewOk" ? safetyCritical : true;
              return (
                <div key={key} className={cn(
                  "rounded-md border p-2 text-center transition-colors",
                  ok
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : required
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-muted bg-muted/30 opacity-60"
                )}>
                  <div className="flex items-center justify-center mb-1">
                    {ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      : required
                        ? <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        : <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="font-mono text-base font-bold">{symbol}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
                </div>
              );
            })}
          </div>
          <div className={cn(
            "mt-3 rounded-md border p-3 text-center",
            auth.authorized
              ? "border-emerald-500/50 bg-emerald-500/10"
              : "border-red-500/50 bg-red-500/10"
          )}>
            <div className="flex items-center justify-center gap-2">
              {auth.authorized
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                : <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />}
              <span className={cn(
                "font-mono text-lg font-bold tracking-wider",
                auth.authorized
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              )}>
                A = {auth.authorized ? "TRUE" : "FALSE"}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground font-mono leading-relaxed">{auth.reason}</p>
          </div>
          {safetyCritical && onAuthorize && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAuthorize(true, false)}
                  disabled={loading}
                  className="flex-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  Approve Safety (S)
                </button>
                <button
                  onClick={() => onAuthorize(false, true)}
                  disabled={loading}
                  className="flex-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                >
                  Sign Review (R)
                </button>
                <button
                  onClick={() => onAuthorize(true, true)}
                  disabled={loading}
                  className="flex-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  Approve Both
                </button>
              </div>
              <button
                onClick={() => onAuthorize(false, false)}
                disabled={loading}
                className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-mono font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Re-run (no overrides)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-md">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-xs font-medium text-muted-foreground">No authorization record yet</p>
          <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">Run the authorization check (A = C &middot; E &middot; I &middot; S &middot; R)</p>
        </div>
      )}
    </Card>
  );
}
