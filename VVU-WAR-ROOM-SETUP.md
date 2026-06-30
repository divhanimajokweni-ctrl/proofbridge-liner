# VVU War Room Setup

## Step 2 — Gateway Connect

| Field | Value |
|-------|-------|
| Gateway URL (local) | `http://127.0.0.1:18789` |
| Gateway URL (Tailscale) | Set up via `tailscale serve --bg 18789` |
| Auth Token | `vvu-war-room-2026-local` |
| Gateway Status | `{"ok":true,"status":"live"}` |

## Step 3 — Obsidian Vault

The VVU War Room plugin is installed at:
```
.obsidian/plugins/vvu-war-room/
```

**Plugin files:**
- `manifest.json` — plugin metadata (id: `vvu-war-room`, v1.0.0)
- `main.js` — compiled plugin code (11 KB)
- `src/main.ts` — TypeScript source (385 lines)
- `data.json` — pre-configured with gateway URL + token
- `esbuild.config.mjs`, `tsconfig.json`, `package.json`

**Obsidian config:**
- `.obsidian/community-plugins.json` — auto-enables `vvu-war-room`
- `.obsidian/app.json` — daily notes enabled, community plugins on

**Vault folders created:**
- `daily/` — daily note storage
- `compliance/` — compliance document storage

### If plugin doesn't appear in Obsidian:

1. Restart Obsidian completely
2. Settings → Community Plugins → **Turn on community plugins** (one-time gate)
3. Toggle **VVU War Room** on under Installed Plugins

## Plugin Features

| Feature | Description |
|---------|-------------|
| Ribbon icon (shield) | Opens War Room dashboard |
| Ribbon icon (calendar) | Creates daily note |
| Status bar | Shows OpenClaw connection status |
| Commands (Cmd/Ctrl+P) | Open War Room, New daily note, Insert compliance link, Search compliance, Ping gateway |

## Branch

All setup committed to `compliance-fabric` (canonical branch).
