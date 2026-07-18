---
id: ADR-008
title: Two-Graph Operational Model
author: VVU Engineering
 reviewers: Drake (OpenCode), Sentinel (OpenCode)
 approver: Constitutional Council
 implementation_owner: Josh (OpenCode)
 verification_owner: Evidence Office
 status: Accepted
 date: "2026-07-18"
---

# Context

VVU platform operates in two distinct contexts:

1. **Operational Decision Graph** – Runtime execution of business logic
2. **Architecture Knowledge Graph** – Engineering governance and documentation

These graphs serve different purposes, have different consumers, and require different optimization strategies. Merging them would create:

- Performance bottlenecks (documentation queries in hot paths)
- Security risks (runtime data in documentation systems)
- Maintenance complexity (dual-purpose schemas)

# Decision

Adopt a **Two-Graph Operational Model** where:

1. **Operational Decision Graph** lives in Trust Runtime Kernel
   - Optimized for latency
   - Consumed by Kernel, Audit, Runtime
   - Grows with every decision

2. **Architecture Knowledge Graph** lives in Governance layer
   - Optimized for documentation/search
   - Consumed by Developers, AIR, Compliance
   - Grows with every ADR/RFC

**Constitution Reference:** Part 4, ADR-004

# Consequences

**Positive:**
- Clear separation of concerns
- Independent optimization strategies
- Reduced security surface
- Simplified maintenance
- Clear consumer boundaries

**Negative:**
- Increased operational complexity
- Requires synchronization mechanisms
- Multiple storage systems
- Documentation overhead

# Compliance

This decision implements:
- **Part 4** – Operational Model (Two Graphs)
- **ADR-004** – Two-graph separation

# Verification

Evidence Office will verify:
- Operational graph is optimized for latency
- Knowledge graph is optimized for documentation/search
- No runtime data exists in documentation systems
- Clear consumer boundaries are maintained
- Synchronization mechanisms are reliable

# Implementation Plan

- Operational graph: `src/lib/trust-runtime/event-store.ts`, `src/lib/trust-runtime/projection-manager.ts`
- Knowledge graph: `air/store/evidence_log.json`, `air/graph/graph.json`
- ADRs: `docs/governance/adrs/`, `air/adr/`
