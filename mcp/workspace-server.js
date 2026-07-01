#!/usr/bin/env node
/**
 * workspace-server.js — MCP server for VVU workspace tools
 * 
 * Tools:
 *   - run_script:      Execute a script from scripts/ and return output
 *   - read_config:     Read a config file from config/
 *   - list_scripts:    List available utility scripts
 *   - codebase_search: Search the codebase for patterns
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const WORKSPACE = process.env.VVU_WORKSPACE || "/home/runner/workspace";
const SCRIPTS_DIR = path.join(WORKSPACE, "scripts");
const CONFIG_DIR = path.join(WORKSPACE, "config");
const TIMEOUT_MS = 60_000;

const server = new Server(
  { name: "vvu-workspace-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

function listScripts() {
  if (!existsSync(SCRIPTS_DIR)) return [];
  return readdirSync(SCRIPTS_DIR)
    .filter(f => f.endsWith(".js") || f.endsWith(".py") || f.endsWith(".sh"))
    .sort();
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_scripts",
      description: "List all available utility scripts in the workspace",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "run_script",
      description: "Run a script from scripts/ and return stdout/stderr",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Script filename (e.g. verify-setup.js)" },
          args: { type: "string", description: "CLI arguments to pass" },
        },
        required: ["name"],
      },
    },
    {
      name: "read_config",
      description: "Read a JSON config file from config/",
      inputSchema: {
        type: "object",
        properties: {
          file: { type: "string", description: "Config filename (e.g. maturity-gates.json)" },
        },
        required: ["file"],
      },
    },
    {
      name: "codebase_search",
      description: "Search codebase text with grep",
      inputSchema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Search pattern (regex)" },
          include: { type: "string", description: "File glob filter (e.g. *.ts, *.md)" },
          max_results: { type: "number", default: 20 },
        },
        required: ["pattern"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_scripts": {
      const scripts = listScripts();
      return { content: [{ type: "text", text: scripts.join("\n") || "No scripts found." }] };
    }

    case "run_script": {
      const scriptPath = path.join(SCRIPTS_DIR, args.name);
      if (!existsSync(scriptPath)) {
        // Check if name has extension
        const withExt = listScripts().find(s => s.startsWith(args.name) || s === args.name);
        if (withExt) {
          return { content: [{ type: "text", text: `Script "${args.name}" not found. Did you mean "${withExt}"?\n\nAvailable: ${listScripts().join(", ")}` }] };
        }
        return { content: [{ type: "text", text: `Script "${args.name}" not found in ${SCRIPTS_DIR}/\n\nAvailable: ${listScripts().join(", ")}` }] };
      }
      try {
        const stdout = execSync(
          scriptPath.endsWith(".py") ? `python3 ${scriptPath} ${args.args || ""}` :
          scriptPath.endsWith(".js") ? `node ${scriptPath} ${args.args || ""}` :
          `bash ${scriptPath} ${args.args || ""}`,
          { cwd: WORKSPACE, timeout: TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024 }
        );
        return { content: [{ type: "text", text: stdout.toString().slice(0, 100_000) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err.message}\n${err.stderr?.toString() || ""}` }] };
      }
    }

    case "read_config": {
      const configPath = path.join(CONFIG_DIR, args.file);
      if (!existsSync(configPath)) {
        const available = existsSync(CONFIG_DIR) ? readdirSync(CONFIG_DIR).join(", ") : "no config/ dir";
        return { content: [{ type: "text", text: `Config "${args.file}" not found in ${CONFIG_DIR}/\n\nAvailable: ${available}` }] };
      }
      try {
        const content = readFileSync(configPath, "utf8");
        return { content: [{ type: "text", text: content }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error reading config: ${err.message}` }] };
      }
    }

    case "codebase_search": {
      const { pattern, include, max_results = 20 } = args;
      try {
        const includeFlag = include ? `--include="${include}"` : "";
        const result = execSync(
          `rg --no-heading -n "${pattern.replace(/"/g, '\\"')}" ${includeFlag} --max-count=${max_results} ${WORKSPACE} 2>/dev/null | head -${max_results}`,
          { timeout: 15000, maxBuffer: 2 * 1024 * 1024 }
        );
        const output = result.toString();
        return { content: [{ type: "text", text: output || "No matches found." }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Search error or no matches: ${err.message}` }] };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
