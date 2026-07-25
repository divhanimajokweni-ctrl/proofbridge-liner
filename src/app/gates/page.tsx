"use client";

import { useEffect, useState } from "react";
import { deriveValidationState } from "@/lib/validation/state";

type Gate = { gate: string; passed: boolean; detail?: string };

export default function GatesPage() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-state")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const arr = Array.isArray(data?.gates) ? data.gates : [];
        setGates(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center text-verified font-bold">VVU</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gates</h1>
          <p className="text-xs text-muted-foreground font-mono">PROTOCOL GATES A–G</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {gates.map((g) => (
          <div key={g.gate} className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Gate {g.gate}</div>
              <span className={`text-[10px] font-mono ${g.passed ? "text-verified" : "text-violating"}`}>{g.passed ? "PASS" : "FAIL"}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{g.detail}</div>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground">Loading gate results…</div>}
      </div>
    </div>
  );
}
