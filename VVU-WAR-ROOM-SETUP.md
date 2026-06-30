# VVU War Room — Operational Setup

> **Status:** LIVE — Gateway verified, plugin configured, all 15 checks pass.

---

## Gateway

| Field | Value | Verified |
|-------|-------|----------|
| Local URL | `http://127.0.0.1:18789` | ✅ `{"ok":true,"status":"live"}` |
| Control UI | `http://127.0.0.1:18789` | ✅ Serves OpenClaw Control UI |
| Auth Token | `vvu-war-room-2026-local` | ✅ Extracted from `openclaw.json` |
| Config Path | `~/.openclaw/openclaw.json` | ✅ Synced |
| PID | `737` | ✅ Running |

### Startup

```bash
# Start the gateway (syncs config, waits for health check)
bash scripts/start-war-room.sh

# Expose via Tailscale (run after gateway is live)
tailscale serve --bg 18789
```

### Verification

```bash
# Run the full verification suite (15 checks)
bash scripts/verify-war-room.sh
```

---

## Obsidian Plugin

The VVU War Room plugin is installed at:

```
.obsidian/plugins/vvu-war-room/
├── manifest.json      # id: vvu-war-room, v1.0.0
├── main.js            # Compiled plugin code (11 KB)
├── src/main.ts        # TypeScript source (385 lines)
├── data.json          # Pre-configured gateway settings
├── esbuild.config.mjs
├── tsconfig.json
└── package.json
```

### To activate in Obsidian

1. Restart Obsidian (or reload via Ctrl/Cmd+P → "Reload app without saving")
2. Settings → **Community Plugins** → Click **"Turn on community plugins"** (one-time gate)
3. Under **Installed Plugins**, toggle **VVU War Room** on

### Plugin features

| Trigger | Action |
|---------|--------|
| Ribbon icon (shield) | Open War Room dashboard view |
| Ribbon icon (calendar) | Create daily note |
| Status bar | Shows `VVU | OpenClaw: LIVE` or `VVU | OpenClaw: DOWN` |
| Cmd/Ctrl+P → "Open VVU War Room" | Dashboard view |
| Cmd/Ctrl+P → "Create VVU daily note" | New daily note in `daily/` folder |
| Cmd/Ctrl+P → "Insert compliance link" | Browse `compliance/` folder |
| Cmd/Ctrl+P → "Search vault for compliance" | Full vault compliance search |
| Cmd/Ctrl+P → "Ping OpenClaw gateway" | Manual health check |

---

## Vault Structure

```
daily/           # Daily standup notes (created by plugin)
compliance/      # Compliance documents (FSCA, POPIA, SAR/STR)
.obsidian/
├── app.json               # Community plugins enabled, daily notes on
├── community-plugins.json # Auto-enables vvu-war-room
└── plugins/vvu-war-room/  # Plugin files
```

---

## Critical Files (AGENTS.md)

| File | Status |
|------|--------|
| `app/api/verify/route.ts` | ✅ Present |
| `app/api/mint/route.ts` | ✅ Present |
| `src/middleware.ts` | ✅ Present (circuit breaker active) |
| `AGENTS.md` | ✅ Present |

---

## Branch

```
compliance-fabric  ← canonical branch (all work here)
```

All commits:

| Commit | Description |
|--------|-------------|
| `708eced` | Wire up OpenClaw GCP MCP server with headless auth |
| `5f5c8f7` | Add VVU War Room Obsidian plugin |
| `a1f72ff` | Update War Room plugin: gateway health ping + status bar |
| `4cf5ab8` | Enable VVU War Room plugin in Obsidian community plugins |
| `d2367ee` | Configure VVU War Room plugin: gateway URL + token + enable |
| `10656a4` | docs: add VVU War Room setup guide with gateway config |
| `10879ce` | War Room: operational scripts + verification suite |
