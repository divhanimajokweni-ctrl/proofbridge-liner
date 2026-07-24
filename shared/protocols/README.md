# Shared Protocols

**License:** Apache 2.0 (shared wire format definitions)
**Tier:** Shared — Cross-Module Wire Formats (Placeholder)

## Purpose

The `shared/protocols` module defines wire formats for cross-module and
cross-service communication in the VVU EARTH TECH platform. This ensures
deterministic, interoperable data exchange between all modules and services.

### Planned Wire Formats

| Format | Purpose | Encoding |
|--------|---------|----------|
| Evidence Envelope | Fact + Proof serialization | RFC 8785 JSON → binary |
| MMR Proof | Inclusion/consistency proof transmission | Binary (leaf hash + auth path) |
| License Payload | License wire format for commercial modules | RFC 8785 JSON + Ed25519 signature |
| SSE Event | Trust Runtime streaming events | JSON (event type + payload + timestamp) |
| Policy IR | Deterministic opcode binary encoding | Binary (opcode ID + operands) |
| Observation Adapter | Cross-service observation translation | JSON (source → ER format) |

### Protocol Design Principles

1. **Deterministic encoding** — RFC 8785 JCS for JSON, fixed byte order for binary
2. **Versioned** — every envelope carries a protocol version for forward compatibility
3. **Hash-first** — SHA-256 payload hash is computed before encoding, verified after decoding
4. **No ambiguity** — one canonical encoding per format, no "pretty-print" or "minified" variants

### Status

**NOT IMPLEMENTED** — This module is a placeholder. The type definitions for
`ProtocolEnvelope`, `WireFormat`, and `PROTOCOL_VERSION` are defined but the
encoding/decoding functions throw `NOT_IMPLEMENTED`.

### Relationship to Other Modules

- Depends on: `shared/types` (for core type definitions)
- Used by: `air-kernel` (for MMR proof wire format)
- Used by: `epistemic-runtime` (for SSE event streaming)
- Used by: `shared/license` (for license payload wire format)
- Used by: `commercial/*` (for all cross-service communication)
