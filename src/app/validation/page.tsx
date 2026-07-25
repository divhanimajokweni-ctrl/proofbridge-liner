"use client";

import { useEffect, useState } from "react";

type Summary = {
  state: { state?: string };
  frozen: {
    validation_event?: string;
    frozen_at?: string;
    commit_short?: string;
    image_status?: string;
  };
  index?: any;
  replay?: any;
  release?: any;
  hours?: string[];
};

export default function ValidationPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/app-state")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setSummary((prev) => ({ ...prev, state: data, frozen: data.frozen })))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center text-verified font-bold">VVU</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Validation</h1>
          <p className="text-xs text-muted-foreground font-mono">72-HOUR VALIDATION EVENT · LIVE SCORECARD</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-violating/40 bg-violating/10 p-3 text-xs text-violating">{error}</div>
      )}

      {summary?.frozen && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi label="Event" value={summary.frozen?.validation_event ?? "—"} sub="Validation event id" />
          <Kpi label="Commit" value={summary.frozen?.commit_short ?? "—"} sub={summary.frozen?.frozen_at ?? "—"} />
          <Kpi label="Image Status" value={summary.frozen?.image_status ?? "—"} sub={summary.state?.state ?? "—"} />
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
        <h2 className="text-sm font-semibold text-foreground/90">Live Metrics</h2>
        <p className="mt-2 text-xs text-muted-foreground">This page becomes read-only after validation completion. All values are derived from evidence bundles.</p>
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
