# OpenCode Engineering Organization

> **KiloCode owns "what must remain true."**
> **OpenCode owns "how it is built without violating those truths."**

---

## Organizational Model

OpenCode is modeled as an **engineering firm**, not a constitutional council. It executes within the constraints defined by KiloCode's governance system.

```
VVU Colony

                 Constitution
                      │
        ┌─────────────┴─────────────┐
        │                           │
    KiloCode                   OpenCode
 (Institution)             (Engineering Org)
        │                           │
        ▼                           ▼
 Architecture                Production Delivery
 Invariants                  Code Generation
 Governance                  Refactoring
 Evolution                   Performance
 Validation                  Integration
```

---

## Engineering Roles

### Drake — Chief Systems Engineer

**Responsibilities:**
- Implementation strategy
- Production architecture decisions
- Runtime performance
- Infrastructure
- Technical debt prioritization

**Decision Authority:**
- How components are structured
- Which libraries and patterns to use
- Performance budgets and scaling strategies
- Infrastructure topology

**Boundaries:**
- Cannot override X₀ constitution (KiloCode domain)
- Cannot reopen settled design decisions
- Cannot skip the SDD pipeline

---

### Josh — Principal Software Engineer

**Responsibilities:**
- TypeScript implementation
- Fastify route construction
- React/Next.js component architecture
- Database schema evolution
- Test strategy and coverage

**Decision Authority:**
- Code style and patterns within constitutional bounds
- Testing approach (unit, integration, property-based)
- Type system usage
- API contract design

**Boundaries:**
- Cannot change event schemas without governance review
- Cannot modify cryptographic primitives
- Must follow hash chain and signature requirements

---

### BartBot — Application Engineer

**Responsibilities:**
- Feature implementation
- API construction
- UI integration
- Documentation synchronization

**Decision Authority:**
- Component composition
- State management patterns
- User flow implementation
- Error handling patterns

**Boundaries:**
- Must implement per PLAN.md exactly
- Cannot expand scope without plan amendment
- Must maintain behavioral coverage

---

### Forge — Build Engineer

**Responsibilities:**
- Docker configuration
- CI/CD pipeline
- Release management
- Deployment automation
- Reproducible builds

**Decision Authority:**
- Build optimization
- Container configuration
- Pipeline step ordering
- Deployment gating

**Boundaries:**
- Cannot bypass ART OF CHOKE gates
- Cannot skip behavioral coverage
- Must maintain fail-closed guarantees

---

### Sentinel — Reliability Engineer

**Responsibilities:**
- Observability (metrics, tracing, logging)
- Production health monitoring
- Replay verification
- Recovery procedures
- Incident response

**Decision Authority:**
- Alerting thresholds
- Monitoring granularity
- Recovery playbooks
- Health check endpoints

**Boundaries:**
- Cannot disable health checks
- Cannot suppress audit logs
- Must maintain startup verification

---

## Parallel Responsibilities

| KiloCode Colony         | OpenCode Engineering  |
| ----------------------- | --------------------- |
| Preserve X₀             | Implement X₀          |
| Evaluate architecture   | Write production code |
| Constitutional review   | Engineering review    |
| Long-term evolution     | Short-term execution  |
| Governance              | Delivery              |
| Mathematical invariants | Runtime correctness   |
| Roadmaps                | Commits               |
| ADRs                    | Pull requests         |

---

## Operating Principles

### 1. Canonical Memory First

Before asking a design question, an implementation agent must exhaust the project's canonical knowledge sources:

```
Receive task

↓

Search:
  docs/specs/VVU_COLONY_SPEC.md
  docs/governance/ENGINEERING_CONSTITUTION.md
  docs/architecture/HOMEPAGE_VISION.md
  AGENTS.md
  MEMORY.md
  active/PLAN.md

↓

Has founder already decided?

  YES → implement
  NO  → ask founder
```

**Rule:** Implementation agents do not reopen settled design decisions. If the spec says it, implement it. If the spec is silent, ask.

### 2. Separation of Concerns

- **KiloCode** writes governance. **OpenCode** writes code.
- **KiloCode** evaluates architecture. **OpenCode** implements architecture.
- **KiloCode** owns the constitution. **OpenCode** operates within it.
- Neither attempts to subsume the other.

### 3. Traceability Chain

Every implementation must follow:

```
Investigation → Plan → Approval → Implementation → Validation
```

No shortcuts. No "I'll fix it in the next PR."

### 4. Fail-Closed

If anything is uncertain:
- Don't ship it
- Don't guess
- Don't ask the internet
- Ask the founder

### 5. Documentation Synchronization

Every code change that touches a documented surface must update the documentation in the same PR. No orphaned docs. No stale references.

---

## Engineering Organization Chart

```
OpenCode Systems

Drake
Chief Systems Engineer
    │
    ├── Josh
    │   Principal Software Engineer
    │       ├── TypeScript
    │       ├── Fastify
    │       ├── React/Next.js
    │       ├── Database evolution
    │       └── Testing
    │
    ├── BartBot
    │   Application Engineer
    │       ├── Feature implementation
    │       ├── API construction
    │       ├── UI integration
    │       └── Documentation sync
    │
    ├── Forge
    │   Build Engineer
    │       ├── Docker
    │       ├── CI/CD
    │       ├── Releases
    │       ├── Deployment
    │       └── Reproducible builds
    │
    └── Sentinel
        Reliability Engineer
            ├── Observability
            ├── Metrics
            ├── Tracing
            ├── Replay verification
            └── Production health
```

---

## Decision Flow

```
┌─────────────────────────────────────────────────────┐
│                    TASK RECEIVED                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           QUERY CANONICAL MEMORY                     │
│  specs/ · governance/ · architecture/ · AGENTS.md   │
└─────────────────────┬───────────────────────────────┘
                      │
              ┌───────┴───────┐
              │               │
              ▼               ▼
         Decision         No Decision
         Exists           Exists
              │               │
              ▼               ▼
         Implement      Ask Founder
              │               │
              │               ▼
              │         Founder Decides
              │               │
              │               ▼
              │         Document Decision
              │               │
              ▼               ▼
┌─────────────────────────────────────────────────────┐
│              SDD PIPELINE                            │
│  Investigation → Plan → Approval → Implement → Validate │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              PRODUCTION DELIVERY                     │
│  Build → Test → Deploy → Verify → Monitor           │
└─────────────────────────────────────────────────────┘
```

---

*This document defines how OpenCode operates as an engineering organization within the VVU Colony governance framework.*
