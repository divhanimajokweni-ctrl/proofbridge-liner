"use client";

import { useEffect, useState } from "react";

type EvidenceSummary = {
  index: any;
  replay: any;
  release: any;
  hours: string[];
};

export default function EvidencePage() {
  const [summary, setSummary] = useState<EvidenceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/validation/summary")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setSummary)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center text-verified font-bold">VVU</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Evidence Portal</h1>
          <p className="text-xs text-muted-foreground font-mono">IMMUTABLE EVIDENCE · HASHES · REPLAY · DOWNLOADS</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-violating/40 bg-violating/10 p-3 text-xs text-violating">{error}</div>
      )}

      {summary?.release && (
        <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="text-sm font-semibold text-foreground/90">Release</div>
          <div className="mt-2 text-xs text-muted-foreground">{JSON.stringify(summary.release, null, 2)}</div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
        <div className="text-sm font-semibold text-foreground/90">Hours</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(summary?.hours ?? []).map((h) => (
            <span key={h} className="rounded border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-mono text-muted-foreground">{h}</span>
          ))}
          {(!summary?.hours || summary.hours.length === 0) && <span className="text-xs text-muted-foreground">No hour bundles found.</span>}
        </div>
      </div>
    </div>
  );
}
