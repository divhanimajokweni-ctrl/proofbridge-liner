/**
 * EIS — Evidence Mesh
 *
 *   E(c) = E_You ∪ E_Brave ∪ E_Firecrawl ∪ E_Watchdog
 *
 * The Evidence Mesh aggregates observations from four sources. Per Theorem 4
 * Step 4, multiple sources are NOT automatically treated as independent —
 * the participation ratio N_ind identifies the true number of latent sources.
 */

import { EvidenceItem, EvidenceSource, EVIDENCE_SOURCES } from "./types";
import { synthesizeEmbedding } from "./participation-ratio";

export interface MeshQuery {
  claimId: string;
  query: string;
  sources?: EvidenceSource[]; // default: all four
}

export interface MeshResult {
  source: EvidenceSource;
  content: string;
  embedding: number[];
  weight: number;
  state: string; // default OBSERVED
}

const SOURCE_DESCRIPTIONS: Record<EvidenceSource, string[]> = {
  "you.com": [
    "Web search summary indicating claim is supported by recent primary sources.",
    "Aggregated search result with corroborating references from .edu and .gov domains.",
    "Search snapshot shows mixed evidence — some sources support, others challenge.",
  ],
  "brave": [
    "Independent crawl returned three corroborating pages with overlapping claims.",
    "Brave Search index matched two strong and one weak supporting document.",
    "Privacy-preserving search returned a single primary source with high confidence.",
  ],
  "firecrawl": [
    "Deep-scraped full-text extraction from authoritative primary source.",
    "Structured extraction produced a clean citation chain ending at peer-reviewed paper.",
    "Page scrape completed but content was thin — flagged for low confidence.",
  ],
  "watchdog": [
    "Runtime observation confirms claim holds under continuous monitoring (last 24h).",
    "Watchdog sensor detected drift — claim weakened but not falsified.",
    "Operational telemetry aligns with claim across 100 sampled invocations.",
  ],
};

/**
 * Synthesize evidence items from the Evidence Mesh for a claim.
 *
 * In the real VVU, this triggers live calls to You.com / Brave / Firecrawl /
 * Watchdog. Here we deterministically synthesize plausible evidence per source
 * so the demo is reproducible.
 */
export function queryEvidenceMesh(
  query: MeshQuery,
  seed: number = 1
): MeshResult[] {
  const sources = query.sources ?? EVIDENCE_SOURCES;
  const results: MeshResult[] = [];

  sources.forEach((source, idx) => {
    // Deterministic selection of description per source
    const descriptions = SOURCE_DESCRIPTIONS[source];
    const descIdx = (seed + idx) % descriptions.length;

    // Vary the weight per source to simulate real-world heterogeneity
    const baseWeight =
      source === "firecrawl" ? 0.95 :
      source === "watchdog" ? 0.85 :
      source === "brave" ? 0.75 :
      0.65; // you.com

    // Add small deterministic jitter
    const jitter = ((seed * (idx + 7)) % 11) / 100; // 0.00 .. 0.10
    const weight = Math.min(1, baseWeight + jitter);

    results.push({
      source,
      content: descriptions[descIdx],
      embedding: synthesizeEmbedding(source, seed * 10 + idx),
      weight,
      state: "OBSERVED",
    });
  });

  return results;
}

/**
 * Compute the provenance-graph node set for heat kernel diffusion.
 * Each evidence item is a node; weights are the source weights.
 */
export function evidenceToNodes(items: EvidenceItem[]): number[] {
  return items.map((e) => e.weight);
}

/**
 * Returns the set of sources that contributed evidence for a claim.
 */
export function distinctSources(items: EvidenceItem[]): EvidenceSource[] {
  return Array.from(new Set(items.map((e) => e.source))) as EvidenceSource[];
}
