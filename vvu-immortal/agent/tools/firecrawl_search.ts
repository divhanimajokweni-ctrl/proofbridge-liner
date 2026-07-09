import { defineTool } from "eve/tools";
import { z } from "zod";
import { never } from "eve/tools/approval";

export default defineTool({
  description:
    "Search the web with Firecrawl and return structured results with evidence extraction. Use this when you need to find information across multiple sources rather than scraping a single known URL.",

  inputSchema: z.object({
    query: z.string().min(1).describe("The search query"),
    limit: z
      .number()
      .default(5)
      .describe("Maximum number of results to return"),
    extractEvidence: z
      .boolean()
      .default(true)
      .describe(
        "Whether to extract evidence pieces from each result's content",
      ),
  }),

  // Reading is safe — no approval needed
  approval: never(),

  async execute({ query, limit, extractEvidence }, ctx) {
    const response = await fetch("http://localhost:3001/firecrawl/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, extractEvidence }),
    });
    const results = await response.json();

    return {
      query,
      count: results.length,
      results: results.map((r: any) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        evidence: r.evidence || [],
        score: r.score || 0,
      })),
      timestamp: new Date().toISOString(),
    };
  },

  toModelOutput(output) {
    return {
      type: "text",
      value: `🔍 Found ${output.count} results for "${output.query}"`,
    };
  },
});
