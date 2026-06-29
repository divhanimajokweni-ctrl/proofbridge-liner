#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "gcp-server.yaml");

function loadConfig() {
  const raw = readFileSync(CONFIG_PATH, "utf8");
  return parseYaml(raw);
}

function parseYaml(text) {
  const lines = text.split("\n");
  const result = {};
  let currentTool = null;
  let inArgs = false;
  let inEnv = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed === "tools:") {
      result.tools = [];
      continue;
    }

    if (trimmed.startsWith("- name:")) {
      currentTool = {
        name: trimmed.split(":")[1].trim(),
        description: "",
        command: [],
        args: { allow: [], deny: [] },
        env: {},
      };
      result.tools.push(currentTool);
      inArgs = false;
      inEnv = false;
      continue;
    }

    if (!currentTool) continue;

    if (trimmed.startsWith("description:")) {
      currentTool.description = trimmed.split(":")[1].trim().replace(/^"|"$/g, "");
      continue;
    }

    if (trimmed.startsWith("command:")) {
      const val = trimmed.split(":")[1].trim();
      if (val.startsWith("[")) {
        currentTool.command = val.replace(/[\[\]"]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        currentTool.command = [val];
      }
      continue;
    }

    if (trimmed === "args:") {
      inArgs = true;
      inEnv = false;
      continue;
    }

    if (trimmed === "env:") {
      inEnv = true;
      inArgs = false;
      continue;
    }

    if (trimmed.startsWith("- name:") || trimmed.startsWith("tools:")) {
      inArgs = false;
      inEnv = false;
      continue;
    }

    if (inArgs && trimmed.startsWith("- ")) {
      const val = trimmed.slice(2).trim();
      if (val === "deny:") continue;
      if (trimmed.startsWith("  -")) {
        currentTool.args.deny.push(val);
      } else {
        currentTool.args.allow.push(val);
      }
      continue;
    }

    if (inEnv && trimmed.includes(":")) {
      const [key, val] = trimmed.split(":").map((s) => s.trim());
      currentTool.env[key] = val.replace(/^"|"$/g, "");
    }
  }

  return result;
}

function mergeEnv(baseEnv, toolEnv) {
  const merged = { ...baseEnv };
  for (const [key, val] of Object.entries(toolEnv)) {
    if (val.startsWith("${") && val.endsWith("}")) {
      const envKey = val.slice(2, -1);
      merged[key] = process.env[envKey] || val;
    } else {
      merged[key] = val;
    }
  }
  return merged;
}

async function main() {
  const config = loadConfig();
  const tools = config.tools || [];

  const server = new Server(
    {
      name: "gcp-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: "object",
          properties: {},
        },
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    const args = request.params.arguments || {};
    const argList = Object.entries(args).map(([k, v]) => [k, String(v)]);

    const baseEnv = {
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || "vvu-prod-2026",
    };

    const toolEnv = mergeEnv(baseEnv, tool.env || {});

    let command = tool.command;
    if (!command || command.length === 0) {
      return {
        content: [{ type: "text", text: `Tool ${tool.name} has no command configured` }],
        isError: true,
      };
    }

    const denyList = tool.args?.deny || [];

    if (denyList.some((d) => argList.some(([k]) => k === d))) {
      return {
        content: [{ type: "text", text: `Tool ${tool.name}: denied arguments` }],
        isError: true,
      };
    }

    const fullArgs = [...argList.flat(), ...(tool.args?.allow || [])];

    return new Promise((resolve) => {
      const child = spawn(command[0], [...command.slice(1), ...fullArgs], {
        env: { ...process.env, ...toolEnv },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => { stdout += d.toString(); });
      child.stderr.on("data", (d) => { stderr += d.toString(); });

      child.on("close", (code) => {
        resolve({
          content: [{ type: "text", text: stdout || stderr || `Exit code: ${code}` }],
          isError: code !== 0,
        });
      });

      child.on("error", (err) => {
        resolve({
          content: [{ type: "text", text: `Spawn error: ${err.message}` }],
          isError: true,
        });
      });
    });
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
