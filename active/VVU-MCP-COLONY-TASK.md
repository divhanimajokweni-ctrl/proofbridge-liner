# VVU MCP Server + Colony Model + Kilocode Multi-Agent Setup

## Objective
Build a custom MCP server for the VVU Trust Runtime and set up a multi-agent workflow in Kilocode. This gives Kilo the same power as Devin but with own API keys and no credit system.

## Deliverables

### 1. VVU MCP Server (`vvu-mcp-server/`)
- **16 MCP tools** for runtime interaction:
  - Core: `vvu_get_snapshot`, `vvu_list_snapshots`, `vvu_emit_event`, `vvu_replay_snapshot`, `vvu_compare_snapshots`
  - Attestation: `vvu_get_attestations`, `vvu_verify_attestation`
  - Journal: `vvu_get_journal`, `vvu_add_journal_entry`
  - Receipts: `vvu_verify_receipt`, `vvu_export_receipt`, `vvu_list_receipts`
  - Trust: `vvu_get_trust_score`
  - Policy: `vvu_get_policy_decisions`
  - Evidence Colony: `vvu_get_evidence_leaves`, `vvu_add_evidence_leaf`
  - System: `vvu_get_system_status`
- File persistence at `~/.vvu/` (snapshots, journal, receipts, leaves)
- Deterministic snapshot builder matching VVU state machine

### 2. Colony Model (`colony-model.html`)
Standalone visual operating model with:
- **5 Castes**: Scouts (discover), Carriers (transport), Verifiers (inspect), Archivists (store), Sentinels (protect)
- **Breathing Kernel**: Pulses with trust — faster when healthy, slower when degraded
- **Trust Seasons**: Spring → Summer → Autumn → Winter
- **Canopy Growth**: Every verified receipt becomes a permanent leaf
- **Replay Mode**: Time-lapse slider to scrub colony history
- **Real-time Stats**: Ant count, leaf count, canopy size, season, trust

### 3. Kilocode Agents (`.kilocode/`)
- **vvu-frontend**: Frontend architect — builds UI as pure projection of runtime state
- **vvu-backend**: Backend/runtime architect — builds Bayesian Safety Kernel
- **vvu-review**: Code reviewer — ensures quality, no fake data, correct crypto paths
- **vvu-dev-workflow**: Multi-agent workflow (backend → frontend → review)

### 4. Quick Start Script (`vvu-dev.sh`)
- Installs MCP server deps, creates Kilocode config, starts servers

## Files to Create
```
vvu-mcp-server/
  package.json          — Node package with @modelcontextprotocol/sdk
  index.js              — MCP server with 16 tools
.kilocode/
  config.json           — Kilocode configuration with MCP server paths
  agents/
    vvu-frontend.json    — Frontend agent spec
    vvu-backend.json     — Backend agent spec
    vvu-review.json      — Review agent spec
  workflows/
    vvu-dev-workflow.json — Multi-agent dev workflow
colony-model.html        — Living visual operating model (5 castes, kernel, seasons, replay)
vvu-dev.sh               — Setup script
```

## Implementation Order
1. `vvu-mcp-server/package.json` + `index.js` — MCP server (16 tools, persistence, snapshot builder)
2. `colony-model.html` — Visual operating model with canvas colony animation
3. `.kilocode/config.json` + agents/ + workflows/ — Kilocode multi-agent setup
4. `vvu-dev.sh` — Setup script
5. Verify: `npm install` in vvu-mcp-server, typecheck, build
