# INVESTIGATION — WAR ROOM SLACK AUTH + CORE AGENT AMMO — 2026-07-01

## Task
Wire up OpenClaw War Room with Slack Socket Mode authentication using workspace-provided tokens, and add additional MCP servers ("ammo") for the core agent to learn and use.

## Last Session Failure Analysis
The previous session (2026-07-01) VALIDATION.md showed Slack as "Configured, not authenticated (OAuth required)". Root causes:
1. **Missing userToken** — Only `SLACK_APP_TOKEN` (xapp) and `SLACK_BOT_TOKEN` (xoxb) were in `.env`. The `SLACK_USER_TOKEN` was set to an enterprise-grid format token (xoxe.xoxp-) instead of a standard workspace User OAuth Token (xoxp-).
2. **Slack plugin not explicitly trusted** — `plugins.entries.slack` was missing `enabled: true`, causing the doctor to warn about untrusted external plugins.
3. **Gateway process lifecycle** — The gateway was killed by SIGTERM from the background shell before Socket Mode could fully connect.

## Current State — OpenClaw Gateway

### Binary / CLI
- **OpenClaw v2026.6.10** installed at `/home/runner/workspace/node_modules/.bin/openclaw` (aa69b12)
- Gateway running on port 18789 (PID 6440) — health check returns `{"ok":true,"status":"live"}`

### Configuration (`openclaw.json`)
- **Gateway mode**: `local`, port `18789`, bind `loopback`, auth token `vvu-war-room-2026-local`
- **Model**: `anthropic/claude-sonnet-4-6`
- **Code Mode**: `tools.codeMode.enabled: true` with explicit limits

### Slack Channel — RESOLVED ✅
- **Status**: running, connected, healthy
- **Mode**: Socket Mode
- **Tokens**: `SLACK_APP_TOKEN` (env → available), `SLACK_BOT_TOKEN` (env → available), `SLACK_USER_TOKEN` (env → available)
- **Plugin**: `slack` installed (v2026.6.10), enabled, trusted

### MCP Servers (3 registered)

| Server | Tools | Access |
|--------|-------|--------|
| **gcp** | `gcloud_exec`, `terraform_exec`, `gemini_cli`, `datadog_alert` | RBAC: core |
| **fetch** | `fetch_url`, `fetch_json` | RBAC: core |
| **workspace** | `list_scripts`, `run_script`, `read_config`, `codebase_search` | RBAC: core |

### Channel Status
- **Slack**: ✅ LIVE — Socket Mode connected, all 3 tokens available
- **WhatsApp**: ❌ Blocked — missing `libglib-2.0.so.0`; `.wwebjs_auth/` session preserved
- **Google Chat**: ❌ Blocked — missing `auth/gcp.json`

## Files Changed
| File | Change |
|------|--------|
| `.env` | Updated `SLACK_USER_TOKEN` to workspace User OAuth Token |
| `openclaw.json` | Added `userToken` SecretRef to Slack config; added `plugins.entries.slack.enabled: true`; added `fetch` and `workspace` MCP servers |
| `openclaw.json.last-good` | Synced to current canonical config |
| `mcp/fetch-server.js` | **New** — MCP server for HTTP fetch and web access |
| `mcp/workspace-server.js` | **New** — MCP server for workspace scripts, configs, and codebase search |
| `daily/` | Created for Obsidian vault |

## Verifications
- War Room verification suite: **15/15 PASS**
- War Room verification suite: **15/15 PASS** (post-daily-folder)
- Slack channel: connected, healthy, all tokens available
