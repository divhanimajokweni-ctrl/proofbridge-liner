import { defineTool } from "eve/tools";
import { z } from "zod";
import { never } from "eve/tools/approval";

export default defineTool({
  description:
    "Scrape a URL with Firecrawl and extract structured data including markdown, metadata, and links. Automatically extracts evidence pieces from the content for verification.",

  inputSchema: z.object({
    url: z.string().url().describe("The URL to scrape"),
    formats: z
      .array(z.enum(["markdown", "html", "links", "metadata"]))
      .default(["markdown", "metadata"])
      .describe("Formats to extract from the page"),
    maxDepth: z
      .number()
      .default(1)
      .describe("Maximum crawl depth (1 = single page)"),
  }),

  // Reading is safe — no approval needed
  approval: never(),

  async execute({ url, formats, maxDepth }, ctx) {
    const response = await fetch("http://localhost:3001/firecrawl/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats, maxDepth }),
    });
    const data = await response.json();

    // Extract structured evidence from the scraped content
    const evidence = extractEvidence(data);

    return {
      url,
      title: data.metadata?.title || url,
      evidence,
      wordCount: data.markdown?.split(/\s+/).length || 0,
      links: (data.links || []).slice(0, 20),
      timestamp: new Date().toISOString(),
    };
  },

  toModelOutput(output) {
    return {
      type: "text",
      value: `🌐 Scraped "${output.title}" (${output.wordCount} words, ${output.evidence.length} evidence pieces extracted)`,
    };
  },
});

/**
 * Extract individual evidence claims from scraped content.
 * Uses sentence-level heuristics; in production this would use NLP or an LLM.
 */
function extractEvidence(data: any): Array<{
  claim: string;
  confidence: "low" | "medium" | "high";
  extractedAt: string;
}> {
  const evidence: Array<{
    claim: string;
    confidence: "low" | "medium" | "high";
    extractedAt: string;
  }> = [];
  const content = data.markdown || "";

  // Split into sentences and extract meaningful claims
  const sentences = content.split(/[.!?]+/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // Filter for substantive sentences (not too short, not too long)
    if (trimmed.length > 30 && trimmed.length < 300) {
      evidence.push({
        claim: trimmed,
        confidence: "medium",
        extractedAt: new Date().toISOString(),
      });
    }
  }

  // Limit to 20 evidence pieces per scrape to avoid overwhelming the colony
  return evidence.slice(0, 20);
}
