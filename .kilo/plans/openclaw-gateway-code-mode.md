# PLAN — OPENCLAW GATEWAY CODE MODE + HEADLESS AGENT ORCHESTRATION — 2026-07-01

## Business Intent
Enable OpenClaw Code Mode (`tools.codeMode.enabled: true`), register headless and orchestrator agents in `openclaw.json`, fix the gateway restart (port-free failure without `fuser`/`lsof`), and configure a valid model so the gateway serves agent requests without `openai/gpt-5.5` model errors.

## User Story
As the VVU OS Orchestrator, I need the OpenClaw Gateway running on port 18789 with Code Mode active (model sees only `exec`/`wait`), registered agents (orchestrator, headless, lindiwe) with valid models, so that the War Room can route agent turns through the OpenClaw agent runtime using the compact code-mode tool surface.

## Diagnosis (from live investigation)

### Gateway restart fails
```
Could not free port 18789: fuser not found; required for --force when lsof
is unavailable | spawnSync fuser ENOENT | ENOENT.
```
- `gateway run --force` depends on `fuser` or `lsof`, neither available
- **Fix**: `pkill -f "openclaw gateway"` before starting, do not use `--force`

### Model `openai/gpt-5.5` is unknown
- Gateway log: `FailoverError: Unknown model: openai/gpt-5.5`
- This is the default fallback model when no agent model is configured
- **Fix**: Configure explicit model in `agents.defaults.model`

### Code Mode runtime available
- `quickjs-wasi` IS installed at `node_modules/openclaw/node_modules/quickjs-wasi/`
- `quickjs.wasm` binary confirmed present
- Code mode should load — the hot reload detected the `tools` config change successfully

### quickjs-wasi details
- Runtime: `quickjs-wasi` v1.x with full dist (index.js, wasi-shim.js, extensions.js)
- WebAssembly binary: `quickjs.wasm` (WebAssembly MVP format, verified present)
- No additional system dependencies needed — QuickJS runs in-VM, no Chromium/glib

## Acceptance Criteria
- [ ] **AC-1**: Gateway restarts on port 18789 after `pkill` (not `--force`)
- [ ] **AC-2**: Config validated with `agents.defaults.model` set to a known model
- [ ] **AC-3**: `tools.codeMode.enabled: true` active — gateway log shows code mode runtime loaded
- [ ] **AC-4**: Agents registered: `orchestrator`, `headless`, `lindiwe` (lindiwe marked as paused/blocked)
- [ ] **AC-5**: `npx openclaw agents list` shows all 3 agents
- [ ] **AC-6**: `npx openclaw status` shows code mode enabled
- [ ] **AC-7**: Channel auth blockers documented in INVESTIGATION.md
- [ ] **AC-8**: Build passes (`npm run build`), no regressions

## Compliance Gate Status
- **HF-1 through HF-5**: Not affected (gateway config and agent registration, no TEE/ZK/Anchor/HMAC/calibration changes)
- **Risk note**: Code Mode is experimental — if QuickJS-WASI fails to load, OpenClaw fails closed. No silent fallback to full tool exposure.

## Architecture

```
openclaw.json config structure (relevant sections):

agents:
  defaults:
    model: "anthropic/claude-sonnet-4-20250514"
    workspace: "/home/runner/.openclaw/workspace"
  entries:
    orchestrator:
      model: "anthropic/claude-sonnet-4-20250514"
      codeMode: true  (inherits from tools.codeMode)
      workspace: "/home/runner/.openclaw/workspace/orchestrator"
    headless:
      model: "anthropic/claude-sonnet-4-20250514"
      codeMode: true
      workspace: "/home/runner/.openclaw/workspace/headless"
    lindiwe:
      model: "anthropic/claude-sonnet-4-20250514"
      codeMode: true
      workspace: "/home/runner/.openclaw/workspace/lindiwe"
      channels: ["whatsapp"]
      paused: true  (channel not authenticated)

tools:
  codeMode:
    enabled: true
    timeoutMs: 15000
    memoryLimitBytes: 67108864
    maxOutputBytes: 65536
```

## Affected Files

| File | Change |
|---|---|
| `openclaw.json` | Add `agents.defaults.model`, `agents.defaults.tools.codeMode`, named agent entries with models/workspaces; expand `tools.codeMode` with explicit limits |
| `openclaw.json.last-good` | Sync after changes |
| `~/.openclaw/openclaw.json` | Sync after changes (runtime copy) |
| `.kilo/agent/orchestrator.md` | No structural change needed (already references OpenClaw services) |
| `.kilo/agent/headless.md` | No structural change needed |
| `active/INVESTIGATION.md` | Update with channel blocker documentation |
| `active/PLAN.md` | Current file (this) |
| `active/VALIDATION.md` | Write after implementation |

## Implementation Steps (execution order)

### Step 1 — Kill existing gateway (no `--force`)
```bash
pkill -f "openclaw gateway" 2>/dev/null; sleep 2
```

### Step 2 — Update `openclaw.json`
- Add `agents.defaults.model: "anthropic/claude-sonnet-4-20250514"`
- Add `agents.defaults.tools.codeMode: { enabled: true }` (per-agent override inheriting global)
- Add named agents: `orchestrator`, `headless`, `lindiwe`
- Expand `tools.codeMode` with explicit limits (timeoutMs, memoryLimitBytes, maxOutputBytes)
- Validate with `openclaw config validate`

### Step 3 — Sync config
```bash
cp openclaw.json ~/.openclaw/openclaw.json
cp openclaw.json openclaw.json.last-good
```

### Step 4 — Start gateway
```bash
npx openclaw gateway run --port 18789 > /tmp/gateway.log 2>&1 &
```

### Step 5 — Verify health + code mode + agents
- Health check: HTTP 200
- Gateway log: no model errors, code mode runtime loaded
- `openclaw agents list`

### Step 6 — Update documentation files
- `active/INVESTIGATION.md`: update channel blocker status
- `active/VALIDATION.md`: write validation output

## Test Assertions
1. `pkill -f "openclaw gateway"; sleep 1; npx openclaw gateway run --port 18789 & sleep 4; curl -H "Authorization: Bearer vvu-war-room-2026-local" http://127.0.0.1:18789/health` → HTTP 200
2. Gateway log does NOT contain `Unknown model: openai/gpt-5.5`
3. Gateway log contains `quickjs` or `code mode` reference
4. `npx openclaw agents list` → shows `orchestrator`, `headless`, `lindiwe`
5. `openclaw config validate` → valid, no warnings
6. `npm run build` → passes (no frontend changes)

## Branch
`compliance-fabric`

## Token Budget Estimate
- Investigation + plan: ~15 turns (already complete)
- Implementation: ~8 turns
- Validation: ~3 turns
- Total remaining: ~11 turns

## Handoff Plan
If interrupted, the critical state is:
1. Gateway running on port 18789 (verify with health check)
2. Model configured as `anthropic/claude-sonnet-4-20250514` (not `openai/gpt-5.5`)
3. Code Mode active with QuickJS-WASI runtime loaded
4. Agents registered: orchestrator, headless, lindiwe (paused)
5. Channel blockers: Slack (OAuth), Google Chat (no gcp.json), WhatsApp (no glib)
