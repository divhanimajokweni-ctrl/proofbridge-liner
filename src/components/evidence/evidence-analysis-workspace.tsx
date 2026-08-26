"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Database,
  GitMerge,
} from "lucide-react";
import {
  EISv1Engine,
  DEFAULT_EIS_CONFIG,
  type Observation,
  type EvidenceGraph,
  type EISConfiguration,
} from "@/lib/evidence/EISv1Engine";
import { DMAConfigurationPanel } from "@/components/evidence/dma-configuration-panel";
import { ExportAuditButton } from "@/components/evidence/export-audit-button";

// ─── MOCK MUNICIPAL DATA (The Replay Scenario) ───
// All data is SIMULATION — not municipal operational data.
const SCENARIO_OBSERVATIONS: Observation[] = [
  {
    id: "OBS-01",
    source: "SCADA_FLOW_01",
    type: "FLOW",
    timestamp: "2026-08-26T00:00:00Z",
    value: 102,
    baseline: 100,
    qualityFlag: "VALID",
  },
  {
    id: "OBS-02",
    source: "SCADA_FLOW_01",
    type: "FLOW",
    timestamp: "2026-08-26T04:00:00Z",
    value: 111,
    baseline: 100,
    qualityFlag: "VALID",
  }, // 11% anomaly
  {
    id: "OBS-03",
    source: "SCADA_PRESS_04",
    type: "PRESSURE",
    timestamp: "2026-08-26T04:05:00Z",
    value: 46.1,
    baseline: 48.5,
    qualityFlag: "VALID",
  }, // correlated drop
  {
    id: "OBS-04",
    source: "FIELD_ACST_09",
    type: "ACOUSTIC",
    timestamp: "2026-08-26T06:30:00Z",
    value: "ABNORMAL_FREQ",
    qualityFlag: "VALID",
  }, // independent evidence
  {
    id: "OBS-05",
    source: "SCADA_PRESS_04",
    type: "PRESSURE",
    timestamp: "2026-08-26T07:15:00Z",
    value: 999,
    baseline: 48.5,
    qualityFlag: "IMPOSSIBLE_PHYSICS",
  }, // filtered out by quality gate
];

/**
 * Evidence Analysis Workspace — the full-screen Activity for the Data Room.
 *
 * This is the interactive EIS v1.0 demonstration surface:
 * - DMA Calibration Panel (sliders for flow/pressure/correlation thresholds)
 * - Raw SCADA observations (ingested, with quality flags visible)
 * - Evidence Provenance Chain (classified: PRIMARY / CORRELATED / INDEPENDENT / SYSTEM_CONTEXT)
 * - Verdict banner (VERIFIED_CANDIDATE / INSUFFICIENT_EVIDENCE / REJECTED_FALSE_POSITIVE)
 * - Export Audit Receipt button (SHA-256 hashed JSON with appliedConfiguration)
 *
 * When the engineer adjusts the calibration sliders, the EIS engine
 * re-evaluates instantly via useMemo — proving the system applies their
 * specific engineering parameters to the data.
 */
export function EvidenceAnalysisWorkspace() {
  const [config, setConfig] = useState<EISConfiguration>(DEFAULT_EIS_CONFIG);

  // EIS engine is a pure function — safe to compute via useMemo (no effect needed)
  const evidenceGraph: EvidenceGraph = useMemo(() => {
    const engine = new EISv1Engine(config);
    return engine.processEvidence(SCENARIO_OBSERVATIONS, "CLAIM-NMBM-001");
  }, [config]);

  const isVerified = evidenceGraph.verdict === "VERIFIED_CANDIDATE";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950 font-mono text-slate-200">
      {/* STRICT DWS LABELING */}
      <div className="absolute left-1/2 top-0 z-50 -translate-x-1/2 rounded-b-md bg-amber-500 px-6 py-1 text-xs font-bold tracking-widest text-black shadow-lg">
        SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA
      </div>

      {/* HEADER */}
      <header className="flex shrink-0 items-end justify-between border-b border-slate-800 bg-slate-900/50 p-6">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-emerald-400">
            <Activity className="h-6 w-6" />
            EVIDENCE ANALYSIS WORKSPACE
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            ENGINE: EIS v1.0 | TARGET: DMA-7 (NELSON MANDELA BAY)
          </p>
        </div>
        <ExportAuditButton evidenceGraph={evidenceGraph} isSimulation={true} />
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="grid flex-1 grid-cols-12 gap-6 overflow-hidden p-6">
        {/* LEFT COLUMN: Calibration & Raw Data */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
          <DMAConfigurationPanel
            dmaId="DMA-7"
            currentConfig={config}
            onConfigChange={setConfig}
          />

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h3 className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-2 text-sm font-bold text-slate-400">
              <Database className="h-4 w-4" /> SPARSE OBSERVATIONS (INGESTED)
            </h3>
            <div className="space-y-2">
              {SCENARIO_OBSERVATIONS.map((obs) => (
                <div
                  key={obs.id}
                  className={`flex items-center justify-between rounded p-2 text-xs ${
                    obs.qualityFlag === "VALID"
                      ? "bg-slate-800"
                      : "border border-rose-900/50 bg-rose-950/30"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sky-400">{obs.source}</span>
                    <span className="ml-2 text-slate-500">
                      {obs.timestamp.split("T")[1]?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300">{obs.value}</span>
                    {obs.qualityFlag !== "VALID" && (
                      <AlertCircle
                        className="ml-2 inline h-3 w-3 text-rose-500"
                        title={obs.qualityFlag}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Evidence Graph & Verdict */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* VERDICT BANNER */}
          <div
            className={`flex items-center justify-between rounded-lg border p-6 shadow-2xl ${
              isVerified
                ? "border-emerald-900/50 bg-emerald-950/30"
                : evidenceGraph.verdict === "REJECTED_FALSE_POSITIVE"
                ? "border-rose-900/50 bg-rose-950/30"
                : "border-amber-900/50 bg-amber-950/30"
            }`}
          >
            <div className="flex items-center gap-4">
              {isVerified ? (
                <ShieldCheck className="h-12 w-12 text-emerald-500" />
              ) : (
                <ShieldAlert
                  className={`h-12 w-12 ${
                    evidenceGraph.verdict === "REJECTED_FALSE_POSITIVE"
                      ? "text-rose-500"
                      : "text-amber-500"
                  }`}
                />
              )}
              <div>
                <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-400">
                  System Conclusion
                </h2>
                <div
                  className={`text-3xl font-bold ${
                    isVerified
                      ? "text-emerald-400"
                      : evidenceGraph.verdict === "REJECTED_FALSE_POSITIVE"
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {evidenceGraph.verdict.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            {/* CONFIDENCE METER */}
            <div className="w-48 text-right">
              <div className="mb-2 text-sm text-slate-400">
                EIS CONFIDENCE SCORE
              </div>
              <div className="mb-2 text-2xl font-bold text-white">
                {(evidenceGraph.confidenceScore * 100).toFixed(0)}%
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    isVerified
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(100, evidenceGraph.confidenceScore * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* EVIDENCE PROVENANCE GRAPH */}
          <div className="flex flex-1 flex-col rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-6 flex items-center gap-2 border-b border-slate-700 pb-2 text-sm font-bold text-slate-400">
              <GitMerge className="h-4 w-4" /> EVIDENCE PROVENANCE CHAIN
            </h3>

            {evidenceGraph.nodes.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                No anomalies detected under current configuration parameters.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2">
                {evidenceGraph.nodes.map((node, idx) => (
                  <div
                    key={idx}
                    className="relative border-l-2 border-slate-700 pb-4 pl-6 last:border-0 last:pb-0"
                  >
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-sky-500 bg-slate-900" />

                    <div className="rounded-md border border-slate-700 bg-slate-800/50 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                            node.classification === "PRIMARY_ANOMALY"
                              ? "bg-rose-900/50 text-rose-400"
                              : node.classification === "INDEPENDENT_CORROBORATION"
                              ? "bg-emerald-900/50 text-emerald-400"
                              : node.classification === "SYSTEM_CONTEXT"
                              ? "bg-amber-900/50 text-amber-400"
                              : "bg-sky-900/50 text-sky-400"
                          }`}
                        >
                          {node.classification.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-500">
                          {node.observation.source}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-300">{node.reasoning}</p>

                      <div className="mt-3 rounded bg-slate-950/50 p-2 font-mono text-xs text-slate-500">
                        Raw Value: {node.observation.value} | Baseline:{" "}
                        {node.observation.baseline || "N/A"} | Time:{" "}
                        {node.observation.timestamp.split("T")[1]?.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
