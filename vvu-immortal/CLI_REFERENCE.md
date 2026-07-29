# VVU Immortal Keeper — Eve CLI Reference

## Quick Start

```bash
# Set API keys
export ANTHROPIC_API_KEY="sk-ant-..."
export FIRECRAWL_API_KEY="fc-..."

# Start dev server
npm run dev

# Immortalize a URL (in another terminal)
npm run immortalize URL="https://en.wikipedia.org/wiki/Ubuntu_philosophy"
```

---

## All Commands

### 1. Development

```bash
npm run dev            # Start local dev server with interactive TUI
npm run dev:ui         # Start without UI (background/headless)
npm run dev:remote     # Connect to a remote deployment
```

**Display flags:**
```
eve dev --tools collapsed --reasoning full --subagents auto-collapsed
```

| Flag | Values | Default | Effect |
|------|--------|---------|--------|
| `--tools` | full, collapsed, auto-collapsed, hidden | auto-collapsed | Tool call rendering |
| `--reasoning` | full, collapsed, auto-collapsed, hidden | full | Reasoning rendering |
| `--subagents` | full, collapsed, auto-collapsed, hidden | auto-collapsed | Subagent rendering |
| `--context-size` | token count | none | Model context window size |

**TUI slash commands:**

| Command | Action |
|---------|--------|
| `/model` | Configure model and provider |
| `/channels` | Show/add channels |
| `/connect` | Vercel Connect MCP catalog |
| `/deploy` | Deploy to Vercel production |
| `/new` | Start a fresh session |
| `/exit` | Quit |
| `/help` | List all commands |

### 2. Build

```bash
npm run build          # Compile agent for production
```

**Output artifacts under `.eve/`:**

| Artifact | Description |
|----------|-------------|
| `.eve/discovery/agent-discovery-manifest.json` | What Eve found on disk |
| `.eve/discovery/diagnostics.json` | Authored-shape errors and warnings |
| `.eve/compile/compiled-agent-manifest.json` | Serialized agent surface |
| `.eve/compile/module-map.mjs` | Compiled module entrypoints |

### 3. Serve (self-hosted)

```bash
npm run start          # Serve the built agent
npm run start:port     # Serve on specific port (e.g. eve start --port 3000)
```

### 4. Inspect

```bash
npm run info           # Print all discovered tools, skills, subagents, channels
npm run info:json      # Output as JSON
```

**Use when:** A tool isn't being discovered, you need diagnostics, or you want to verify what Eve loaded.

### 5. Deploy

```bash
npm run link           # Link to a Vercel project (pulls env vars into .env.local)
npm run deploy         # Build + deploy to Vercel production
```

### 6. Evals

```bash
npm run eval                       # Run all evals
npm run eval:list                  # List discovered evals without running
npm run eval:json                  # Output results as JSON
npx eve eval --url https://...     # Run evals on a remote target
npx eve eval --tag security        # Run evals with specific tag
npx eve eval --strict              # Fail on below-threshold scores
npx eve eval --junit ./results.xml # CI-friendly JUnit XML output
```

### 7. Channels

```bash
npm run channels          # List all user-authored channels
npm run channels:web      # Add web chat channel
npm run channels:slack    # Add Slack channel
npm run channels:add      # Add a channel interactively
```

---

## Complete Dev Cycle

```bash
# 1. Edit tools under agent/tools/
vim agent/tools/my-new-tool.ts

# 2. Verify discovery
npm run info

# 3. Test locally
npm run dev

# 4. Build for production
npm run build

# 5. Smoke-test built output
npm run start

# 6. Deploy
npm run deploy

# 7. Smoke-test remote
npm run dev:remote

# 8. Run evals
npm run eval -- --url https://your-app.vercel.app
```

---

## HTTP API (running agent)

```bash
# Start a new session
curl -X POST http://127.0.0.1:2000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Immortalize https://example.com"}'

# Continue a session
curl -X POST http://127.0.0.1:2000/eve/v1/session/<sessionId> \
  -H 'content-type: application/json' \
  -d '{"continuationToken":"<token>","message":"Verify against academic sources"}'

# Stream a session (NDJSON events)
curl http://127.0.0.1:2000/eve/v1/session/<sessionId>/stream
```

---

## CI/CD Pipeline

```bash
npm run ci         # eve build + eve eval --strict --junit ./test-results.xml
npm run pipeline   # eve build + eve eval --strict + eve deploy
```

---

## `package.json` Script Map

| Script | Expands to | Purpose |
|--------|-----------|---------|
| `dev` | `eve dev` | Local dev with TUI |
| `dev:ui` | `eve dev --no-ui` | Headless dev |
| `dev:remote` | `eve dev https://your-app.vercel.app` | Remote smoke-test |
| `build` | `eve build` | Production compile |
| `start` | `eve start` | Serve built agent |
| `start:port` | `eve start --port 3000` | Serve on port |
| `info` | `eve info` | Discovery inspect |
| `info:json` | `eve info --json` | Machine-readable inspect |
| `link` | `eve link` | Vercel project link |
| `deploy` | `eve deploy` | Vercel production deploy |
| `immortalize` | `eve dev --no-ui && curl ...` | One-command immortalize |
| `eval` | `eve eval` | Run evals |
| `eval:list` | `eve eval --list` | List evals |
| `eval:json` | `eve eval --json` | JSON eval results |
| `channels` | `eve channels list` | List channels |
| `channels:add` | `eve channels add` | Add channel |
| `channels:web` | `eve channels add web` | Web chat channel |
| `channels:slack` | `eve channels add slack` | Slack channel |
| `smoke-test` | `eve dev https://your-app.vercel.app` | Remote smoke test |
| `ci` | `build + eval --strict --junit` | CI pipeline |
| `pipeline` | `build + eval --strict + deploy` | Full pipeline |
