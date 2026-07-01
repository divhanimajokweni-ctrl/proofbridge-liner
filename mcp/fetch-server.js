#!/usr/bin/env node
/**
 * fetch-server.js — MCP server for HTTP fetching and web access
 * 
 * Tools:
 *   - fetch_url:   GET a URL and return the content as text
 *   - fetch_json:  GET a JSON API endpoint and return parsed data
 *   - search_web:  Perform a web search (uses configurable search endpoint)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const TIMEOUT_MS = 30_000;

const server = new Server(
  { name: "vvu-fetch-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch_url",
      description: "Fetch a URL and return its content as text",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch" },
          format: { type: "string", enum: ["text", "markdown", "html"], default: "markdown" },
        },
        required: ["url"],
      },
    },
    {
      name: "fetch_json",
      description: "Fetch a JSON API endpoint and return the parsed response",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "The JSON API URL" },
          headers: { type: "object", description: "Optional HTTP headers" },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "fetch_url": {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const resp = await fetch(args.url, {
          signal: controller.signal,
          headers: { "User-Agent": "VVU-Fetch-MCP/1.0" },
        });
        const text = await resp.text();
        return { content: [{ type: "text", text: text.slice(0, 100_000) }] };
      } finally {
        clearTimeout(timeout);
      }
    }

    case "fetch_json": {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const resp = await fetch(args.url, {
          signal: controller.signal,
          headers: { "User-Agent": "VVU-Fetch-MCP/1.0", ...(args.headers || {}) },
        });
        const data = await resp.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2).slice(0, 100_000) }] };
      } finally {
        clearTimeout(timeout);
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
