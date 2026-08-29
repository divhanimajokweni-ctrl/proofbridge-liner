import type { ExportMeta, Pipe, SimStats } from "./engine";
import { buildExportMeta, computeStats } from "./engine";
import { dateStamp, downloadFile, sha256Hex } from "./hash";

/** Serialize every pipe to a CSV table for spreadsheet analysis. */
export function pipesToCSV(pipes: Pipe[]): string {
  const header = [
    "id",
    "dma",
    "kind",
    "length_m",
    "depth_m",
    "posterior",
    "peak_posterior",
    "eis",
    "eis_grade",
    "category",
    "observations",
    "hits",
    "alpha",
    "beta",
    "is_leak",
    "adjacent_to_leak",
  ].join(",");
  const rows = pipes.map((p) =>
    [
      p.id,
      p.dma,
      p.kind,
      p.lengthM.toFixed(1),
      p.depthM.toFixed(2),
      p.posterior.toFixed(6),
      p.peakPosterior.toFixed(6),
      p.eis.toFixed(4),
      p.eisGrade,
      p.category,
      p.obs,
      p.hits,
      p.alpha.toFixed(4),
      p.beta.toFixed(4),
      p.isLeak ? 1 : 0,
      p.adjacentToLeak ? 1 : 0,
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

export interface ReportResult {
  json: string;
  sha256: string;
  payload: {
    meta: ExportMeta;
    stats: SimStats;
    pipes: Array<{
      id: string;
      dma: string;
      posterior: number;
      peakPosterior: number;
      eis: number;
      eisGrade: string;
      category: string;
      obs: number;
      hits: number;
      history: Pipe["history"];
    }>;
  };
}

/** Build the full JSON report and its SHA-256 digest of the serialized payload. */
export async function buildReport(pipes: Pipe[], cyclesRun: number): Promise<ReportResult> {
  const payload: ReportResult["payload"] = {
    meta: buildExportMeta(cyclesRun, pipes),
    stats: computeStats(pipes),
    pipes: pipes.map((p) => ({
      id: p.id,
      dma: p.dma,
      posterior: p.posterior,
      peakPosterior: p.peakPosterior,
      eis: p.eis,
      eisGrade: p.eisGrade,
      category: p.category,
      obs: p.obs,
      hits: p.hits,
      history: p.history,
    })),
  };
  const json = JSON.stringify(payload, null, 2);
  const sha256 = await sha256Hex(json);
  return { json, sha256, payload };
}

export function exportCSV(pipes: Pipe[]): void {
  downloadFile(`searm1-pipes-${dateStamp()}.csv`, pipesToCSV(pipes), "text/csv;charset=utf-8");
}

export async function exportJSONReport(pipes: Pipe[], cyclesRun: number): Promise<string> {
  const { json, sha256 } = await buildReport(pipes, cyclesRun);
  const stamp = dateStamp();
  downloadFile(`searm1-report-${stamp}.json`, json, "application/json;charset=utf-8");
  downloadFile(`searm1-report-${stamp}.json.sha256`, `${sha256}\n`, "text/plain;charset=utf-8");
  return sha256;
}
