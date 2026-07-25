"use client";

import { useEffect, useState } from "react";

type FrozenBuild = Record<string, any>;

export default function RehearsalPage() {
  const [frozen, setFrozen] = useState<FrozenBuild | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/validation/frozen-build")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setFrozen(data?.frozen_build ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center text-verified font-bold">VVU</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rehearsal</h1>
          <p className="text-xs text-muted-foreground font-mono">PRE-RUN CHECKS · FREEZE METADATA · READINESS</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-violating/40 bg-violating/10 p-3 text-xs text-violating">{error}</div>
      )}

      {frozen && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="Event" value={frozen.validation_event ?? "—"} sub="Validation event id" />
          <Kpi label="Commit" value={frozen.commit_short ?? "—"} sub={frozen.commit_hash ?? "—"} />
          <Kpi label="Image" value={frozen.image_status ?? "—"} sub={frozen.image_tag ?? "—"} />
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
        <h2 className="text-sm font-semibold text-foreground/90">Readiness</h2>
        <p className="mt-2 text-xs text-muted-foreground">Run freeze-build.sh and verify.sh before starting the 72-hour validation event.</p>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
