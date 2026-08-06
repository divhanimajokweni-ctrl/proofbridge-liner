---
name: vvu-architecture
description: "VVU architectural decision records and coding standards. Load when naming a new service or event, choosing between patterns, reviewing code for VVU conventions, or designing a new integration. This is 'What Would The Architecture Review Say' — the encoded standards Mino and the team have established across ProofBridge, SafeKrypte, Ubuntu Pools, SafeGrid, and Ekasi. Load it before naming anything, structuring any API, or choosing any technology pattern. Prevents the quality debt that compounds when each agent-generated PR introduces a different convention."
triggers:
  file_pattern:
    - "**/*.sol"
    - "**/route.ts"
    - "**/*-server.ts"
    - "**/middleware.ts"
    - "openclaw.json"
    - "kilo.jsonc"
    - "docs/**/ADR*"
  event_types:
    - "architecture"
    - "naming"
    - "new-service"
    - "new-integration"
    - "api-design"
  tier: [1, 2, 3]
---

## VVU ARCHITECTURAL DECISION RECORDS

### NAMING CONVENTIONS
Services  : kebab-case, vvu- prefix for internal (vvu-lindiwe, vvu-audit-bus, vvu-gateway-os)
Contracts : PascalCase (GovernanceAnchor, CircuitBreaker, UbuntuPools)
Events    : namespace.entity.action format
  Confirmed namespaces (7): proofbridge | pools | safekrypte | safegrid | lindiwe | ekasi | vvu
  Example  : proofbridge.credential.issued | pools.cycle.drawn | safekrypte.key.requested
DB tables : snake_case (contribution_receipts, halt_events, learning_records, turns)
Branches  : feature/[ticket-id]-short-desc | fix/[ticket-id]-short-desc | compliance-fabric

### TECHNOLOGY DECISIONS (ADR — do not override without creating a new ADR)
ADR-001: Payment gateway       = Stitch InstantEFT. Dodo Payments was scrapped. Never reference Dodo.
ADR-002: WhatsApp transport    = @whiskeysockets/baileys (WhatsApp Web multi-device protocol)
ADR-003: Agent memory DB       = better-sqlite3 WAL (not Redis, not Postgres for this use case)
ADR-004: VC governance format  = ED25519 + VCT (not JWT — different signing semantics)
ADR-005: Threshold escrow      = FROST-DAML | 3-of-5 internal | 5-of-7 institutional
ADR-006: Event bus             = NATS JetStream | 34 events (extended to 42 for BioWeave)
ADR-007: Blockchain network    = Polygon Amoy testnet → Polygon mainnet (not Ethereum L1)
ADR-008: AI model (pinned)     = claude-sonnet-4-6 (do not use "latest" — pin explicitly)
ADR-009: HSM tier              = SafeKrypte SK-1 (Rust FROST-DAML middleware)
ADR-010: MCP server protocol   = FastMCP HTTP /tools/{name} POST (not stdio in production)

### SERVICE BOUNDARY RULES
ProofBridge ↔ SafeKrypte  : NATS event bus only (not direct HTTP between services)
Ubuntu Pools ↔ Stitch      : Webhook + HMAC domain-separated validation only
Lindiwe ↔ FastMCP          : HTTP POST /tools/{name} with AbortSignal.timeout(12_000)
New cross-service call      : Add event to Ubuntu Data Bus schema BEFORE writing the call
Any new external dependency : Requires ADR entry before code is written

### ERROR HANDLING PATTERNS (WHAT WOULD THE ARCHITECTURE SAY)
Tool errors      : Return structured error string to Claude; do not throw
  Reason         : Tool errors are Claude inputs — Claude must reason about failures, not the runtime
Blockchain errors: Log to NATS bus → update audit chain → return error VC (never swallow)
Webhook errors   : HMAC-validated reply with error event; include domain-prefix in key derivation
HMAC keys        : Always domain-separated: deriveKey("webhook:" + secret) vs deriveKey("vct:" + secret)
Async external   : Always AbortSignal.timeout(12_000) on every fetch; never fire-and-forget
DB writes        : Always use WAL transactions for multi-row (save_turns pattern)
Logs             : Structured JSON via pino; no console.log in production paths

### WHAT NOT TO DO (learned from audit findings and incidents)
✗ Do not share HMAC namespaces between webhook and VCT subsystems (HF-4)
✗ Do not mock the TEE in production config with a JS flag (HF-1)
✗ Do not write theatrical unit tests that mock all dependencies — test real behavior
✗ Do not inline 7K-token knowledge blocks in MEMORY.md — use pointer pattern
✗ Do not push Tier-3 changes to main branch (30-commit incident)
✗ Do not reference Dodo Payments — use Stitch InstantEFT (ADR-001)
✗ Do not start a new cross-service HTTP call without an ADR entry
