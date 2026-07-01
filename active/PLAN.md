# PLAN — SESSION REMEDIATION + CORE AGENT AMMO — 2026-07-01

## Business Intent
Resolve the Slack authentication blocker from the failed previous session, wire up the War Room with workspace-provided tokens, and add MCP server capabilities for the core agent to operate effectively.

## Last Session Autopsy
**What failed**: Slack channel blocked — Socket Mode required interactive OAuth browser popup that was impossible in headless mode.
**Root cause**: `SLACK_USER_TOKEN` was enterprise-grid format (xoxe.xoxp-) not standard workspace token (xoxp-). Slack plugin lacked explicit trust in `plugins.entries`.
**Evidence**: INVESTIGATION.md (line 23), VALIDATION.md (line 73-74), doctor output (`plugins.entries.slack.enabled=true` missing).

## Acceptance Criteria
- [x] **AC-1**: `.env` updated with workspace User OAuth Token (xoxp-) and existing bot/app tokens retained
- [x] **AC-2**: `openclaw.json` Slack config includes `userToken` SecretRef to `SLACK_USER_TOKEN`
- [x] **AC-3**: `plugins.entries.slack.enabled = true` set (plugin trusted)
- [x] **AC-4**: Gateway restarts with Slack Socket Mode connected: `running=true, connected=true, healthState=healthy`
- [x] **AC-5**: MCP servers `fetch` and `workspace` created and registered in config
- [x] **AC-6**: MCP servers probe success (tools listed for each)
- [x] **AC-7**: War Room verification suite passes 15/15
- [x] **AC-8**: `daily/` folder created for Obsidian vault

## MCP Server Tool Inventory

### fetch (vvu-fetch-mcp v1.0.0)
| Tool | Description |
|------|-------------|
| `fetch_url` | GET a URL, return content as text (30s timeout, 100KB limit) |
| `fetch_json` | Fetch JSON API, return parsed response |

### workspace (vvu-workspace-mcp v1.0.0)
| Tool | Description |
|------|-------------|
| `list_scripts` | List available scripts in `scripts/` |
| `run_script` | Execute a script (`.js`, `.py`, `.sh`) with args |
| `read_config` | Read a JSON config file from `config/` |
| `codebase_search` | Search codebase with ripgrep |

## Files Changed
| File | Change |
|------|--------|
| `.env` | `SLACK_USER_TOKEN` updated to workspace token |
| `openclaw.json` | `userToken` + `plugins.entries.slack.enabled` + new MCP servers `fetch` + `workspace` |
| `mcp/fetch-server.js` | **New** — HTTP/JSON fetch MCP server |
| `mcp/workspace-server.js` | **New** — workspace scripts/configs/search MCP server |
| `daily/` | Created directory |
| `active/INVESTIGATION.md` | Updated with current state |
| `active/PLAN.md` | Current file |

## Branch
`compliance-fabric`
