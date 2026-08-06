# Safe Liner Basic

**License:** Apache 2.0
**Tier:** Open Source — Data Protection Infrastructure (Placeholder)

## Purpose

Safe Liner Basic will provide a DPI (Data Protection Infrastructure) Proxy —
an infrastructure-level layer for data flow inspection, redaction, and policy
enforcement. This is particularly relevant for South African compliance (POPIA)
and global data protection regulations.

### Planned Capabilities

- **Data flow inspection** — monitor and classify data flowing through the system
- **Field-level redaction** — automatic PII redaction based on policy rules
- **Policy enforcement proxy** — enforce data protection policies at the infrastructure layer
- **Compliance-aware routing** — route data based on jurisdiction and compliance requirements

### Status

**NOT IMPLEMENTED** — This module is a placeholder. The API surface is defined
but no functionality is available yet.

### Relationship to Other Modules

- Depends on: `air-kernel` (for policy evaluation primitives)
- Complements: `compliance-automation` (commercial tier provides auto-evidence generation)
- Complements: `shared/license` (license validation for feature gating)
