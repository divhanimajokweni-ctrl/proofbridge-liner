import { EVIDENCE_SOURCES } from "./types";
import { synthesizeEmbedding } from "./participation-ratio";
const SOURCE_DESCRIPTIONS = {
  "you.com": [
    "Web search summary indicating claim is supported by recent primary sources.",
    "Aggregated search result with corroborating references from .edu and .gov domains.",
    "Search snapshot shows mixed evidence \u2014 some sources support, others challenge."
  ],
  "brave": [
    "Independent crawl returned three corroborating pages with overlapping claims.",
    "Brave Search index matched two strong and one weak supporting document.",
    "Privacy-preserving search returned a single primary source with high confidence."
  ],
  "firecrawl": [
    "Deep-scraped full-text extraction from authoritative primary source.",
    "Structured extraction produced a clean citation chain ending at peer-reviewed paper.",
    "Page scrape completed but content was thin \u2014 flagged for low confidence."
  ],
  "watchdog": [
    "Runtime observation confirms claim holds under continuous monitoring (last 24h).",
    "Watchdog sensor detected drift \u2014 claim weakened but not falsified.",
    "Operational telemetry aligns with claim across 100 sampled invocations."
  ]
};
function queryEvidenceMesh(query, seed = 1) {
  var _a;
  const sources = (_a = query.sources) != null ? _a : EVIDENCE_SOURCES;
  const results = [];
  sources.forEach((source, idx) => {
    const descriptions = SOURCE_DESCRIPTIONS[source];
    const descIdx = (seed + idx) % descriptions.length;
    const baseWeight = source === "firecrawl" ? 0.95 : source === "watchdog" ? 0.85 : source === "brave" ? 0.75 : 0.65;
    const jitter = seed * (idx + 7) % 11 / 100;
    const weight = Math.min(1, baseWeight + jitter);
    results.push({
      source,
      content: descriptions[descIdx],
      embedding: synthesizeEmbedding(source, seed * 10 + idx),
      weight,
      state: "OBSERVED"
    });
  });
  return results;
}
function evidenceToNodes(items) {
  return items.map((e) => e.weight);
}
function distinctSources(items) {
  return Array.from(new Set(items.map((e) => e.source)));
}
export {
  distinctSources,
  evidenceToNodes,
  queryEvidenceMesh
};
