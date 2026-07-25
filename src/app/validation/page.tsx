"use client";

import { useEffect, useState } from "react";

type GateState = {
  gate: string;
  status: "PASS" | "FAIL" | "INCOMPLETE";
  summary: string;
};

type FrozenBuild = {
  tag?: string;
  commit?: string;
  image_digest?: string | null;
  image_status?: string;
};

type Status = {
  frozen_build?: FrozenBuild;
  gates?: GateState[];
  generated_at?: string;
};

export default function ValidationScoreboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/validation/frozen-build").then((r) =>
        r.status === 200 ? r.json() : null,
      ),
      fetch("/api/validation/gates").then((r) =>
        r.status === 200 ? r.json() : null,
      ),
    ])
      .then(([fb, gates]) => {
        setStatus({
          frozen_build: fb?.frozen_build,
          gates: gates?.gates,
          generated_at: new Date().toISOString(),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3 border-b border-border/60 pb-5">
          <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center">
            <span className="text-verified font-bold">VVU</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              VVU Validation Dashboard
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              72-HOUR VALIDATION EVENT · SCORECARD · EVIDENCE PIPELINE
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-violating/40 bg-violating/10 p-3 text-xs text-violating">
            {error}
          </div>
        )}

        {status && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              label="Frozen Build"
              value={status.frozen_build?.tag ?? "—"}
              sub={
                status.frozen_build?.image_status === "NOT_AVAILABLE"
                  ? "Image digest pending"
                  : "Build locked"
              }
            />
            <Card
              label="Gate Progress"
              value={`${status.gates?.filter((g) => g.status === "PASS").length ?? 0}/${status.gates?.length ?? 0}`}
              sub={status.gates?.find((g) => g.status === "FAIL")
                ? "Gate failure detected"
                : "No failures"}
            />
            <Card
              label="Generated At"
              value={new Date(status.generated_at ?? "").toLocaleString()}
              sub="Revalidation data"
            />
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
          <h2 className="text-sm font-semibold text-foreground/90">Validation Gates</h2>
          <div className="mt-3 divide-y divide-border/40">
            {(status?.gates ?? [
              { gate: "Gate A", status: "PASS as of commit" },
              { gate: "Gate B", status: "IMPLEMENTATION PASSED / OPERATIONAL VALIDATION PENDING" },
              { gate: "Gate C", status: "PROVISIONALLY PASS / RUNTIME VALIDATION PENDING" },
              { gate: "Gate D", status: "IMPLEMENTATION PASSED / VERIFICATION PENDING" },
            ]).map((g) => (
              <div key={g.gate} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">{g.gate}</div>
                  <div className="text-[11px] text-muted-foreground">{g.summary ?? "Awaiting runtime validation"}</div>
                </div>
                <StateBadge status={String(g.status)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      {sub && (
        <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

function StateBadge({
  status,
}: {
  status: string;
}) {
  let color = "bg-muted text-muted-foreground border-border/60";
  if (status.startsWith("PASS")) color = "bg-verified/15 text-verified border-verified/30";
  else if (status.startsWith("FAIL")) color = "bg-violating/15 text-violating border-violating/30";
  else if (status.startsWith("INCOMPLETE"))
    color = "bg-repairing/15 text-repairing border-repairing/30";

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-mono ${color}`}
    >
      {status}
    </span>
  );
}
