export const MAN_PAGES: Record<string, string> = {
  help: `
AIR v3.1.0 — Master Help
════════════════════════════════════════════════════════════════

  VVU AIR (Architecture Integrity Runtime) enforces
  constitutional rules over a project's source tree.

  RUNTIMES
  ────────
    gate        Constitutional gate pipeline (PASS/FAIL/UNKNOWN)
    graph       Knowledge graph query and traversal
    adr         Architecture Decision Record lifecycle
    debt        Constitutional debt tracking
    evolution   Constitution version evolution

  COMMANDS
  ────────
    air help            Show this master help screen
    air man <topic>     Show man page for a specific topic
    air status          System status overview
    air ls              List virtual filesystem
    air cd <path>       Navigate virtual filesystem
    air cat <file>      Display file contents from VFS
    air tree [path]     Show directory tree
    air find <glob>     Find files by pattern
    air grep <pattern>  Search file contents

  PRINCIPLES
  ──────────
    R1  Reproducibility
    R2  Evidence-Backing
    R3  Executable Rules
    R4  Differentiation Surface
    R5  Traceability
    R6  Constitutional Validation

  THEMES
  ──────
    green     Green phosphor (default)
    amber     Amber phosphor
    white     White phosphor

  SEE ALSO
  ────────
    air man man          How to use man pages
    air man principles   Architectural principles
    air man rule         Constitutional rules
`,

  man: `
AIR v3.1.0 — Man Pages
════════════════════════════════════════════════════════════════

  NAME
  ────
    air man — display help topics for AIR runtimes

  SYNOPSIS
  ────────
    air man
    air man <topic>
    air man --list

  DESCRIPTION
  ──────────
    The air man command displays scrollable help topics
    covering every runtime, command, and principle in AIR.

    With no arguments it lists all available topics.
    With a topic name it renders the corresponding page.

    Topic lookup is case-insensitive. You may type "Gate"
    or "GATE" or "gate" and all resolve correctly.

  TOPICS
  ──────
    help         Master help screen
    man          This page
    rule         Constitutional rules
    capability   Capability records
    gate         Constitutional gate
    evidence     Evidence system
    graph        Knowledge graph
    adr          Architecture Decision Records
    debt         Constitutional debt
    blocker      Hard failure blockers
    theme        Theme switching
    filesystem   Virtual filesystem
    principles   Architectural principles
    status       System status
    telemetry    Telemetry drift detection
    rfc          RFC lifecycle
    evolution    Constitution evolution

  EXAMPLES
  ────────
    $ air man              # list all topics
    $ air man gate         # show gate page
    $ air man EVIDENCE     # case-insensitive lookup

  SEE ALSO
  ────────
    air help, air man principles, air man rule
`,

  rule: `
AIR v3.1.0 — Constitutional Rules
════════════════════════════════════════════════════════════════

  NAME
  ────
    rule — constitutional rules deep dive

  OVERVIEW
  ────────
    Constitutional rules are the enforceable invariants of
    the project. Every rule has a unique ID, a severity
    level, and an evidence requirement.

  RULE STRUCTURE
  ──────────────
    ┌──────────────┬──────────────────────────────────────┐
    │ Field        │ Description                          │
    ├──────────────┼──────────────────────────────────────┤
    │ id           │ Unique rule identifier (R-NNN)       │
    │ title        │ Human-readable name                  │
    │ severity     │ BLOCKER | MINOR | ADVISORY            │
    │ category     │ Security, Architecture, Quality, etc.│
    │ evidence     │ What proof is needed to pass         │
    │ enabled      │ Boolean toggle                       │
    │宪constitution │ Version that introduced this rule    │
    └──────────────┴──────────────────────────────────────┘

  HOW RULES WORK
  ──────────────
    1. The gate runtime loads all enabled rules.
    2. Each rule is evaluated against the source tree.
    3. The rule produces PASS, FAIL, or UNKNOWN.
    4. A BLOCKER failure halts the pipeline immediately.
    5. MINOR failures accumulate as constitutional debt.

  ENABLING / DISABLING RULES
  ──────────────────────────
    Rules can be toggled via the constitution file:

      rules:
        R-001: { enabled: true }
        R-042: { enabled: false }

    Disabled rules are skipped during evaluation but
    remain in the registry for audit purposes.

  EVIDENCE REQUIREMENTS
  ─────────────────────
    Each rule declares what evidence it requires:

      - test_output    Test suite must pass
      - lint_clean     No lint warnings
      - graph_node     Node must exist in knowledge graph
      - adr_record     ADR must be linked
      - audit_log      Entry in audit trail
      - manual_review  Human sign-off required

  SEVERITY LEVELS
  ───────────────
    BLOCKER  Pipeline halts. No deployment allowed.
    MINOR    Adds to constitutional debt. Warning shown.
    ADVISORY Informational. No action required.

  SEE ALSO
  ────────
    air man gate, air man evidence, air man debt,
    air man blocker, air man capability
`,

  capability: `
AIR v3.1.0 — Capability Records
════════════════════════════════════════════════════════════════

  NAME
  ────
    capability — capability records explained

  OVERVIEW
  ────────
    A capability record describes what a module or service
    is permitted to do. It serves as the adapter boundary
    between constitutional enforcement and runtime behavior.

  RECORD STRUCTURE
  ───────────────
    ┌────────────────┬────────────────────────────────────┐
    │ Field          │ Description                        │
    ├────────────────┼────────────────────────────────────┤
    │ name           │ Capability identifier              │
    │ classification │ PUBLIC | INTERNAL | CONFIDENTIAL   │
    │ maturity       │ EXPERIMENTAL | STABLE | DEPRECATED │
    │ evidence       │ Supporting evidence links          │
    │ owner          │ Responsible team or person         │
    │ expires        │ Optional expiry date               │
    └────────────────┴────────────────────────────────────┘

  CLASSIFICATION
  ──────────────
    PUBLIC       Accessible to all consumers.
    INTERNAL     Within the organization only.
    CONFIDENTIAL Restricted access. Audit required.

  MATURITY LEVELS
  ───────────────
    EXPERIMENTAL  May change without notice.
    STABLE        Semantic versioning enforced.
    DEPRECATED    Scheduled for removal.

  ADAPTER BOUNDARY
  ────────────────
    The adapter boundary defines the surface where
    constitutional rules are enforced. Crossing this
    boundary requires evidence and may trigger re-evaluation.

    Adapter boundary violations are BLOCKER-severity.

  EXIT STRATEGY
  ─────────────
    Each capability may declare an exit strategy:

      - MIGRATE   Transition path to replacement
      - DEPRECATE  Sunset timeline
      - REMOVE    Immediate removal

  SEE ALSO
  ────────
    air man rule, air man evidence, air man adr
`,

  gate: `
AIR v3.1.0 — Constitutional Gate
════════════════════════════════════════════════════════════════

  NAME
  ────
    gate — constitutional gate pipeline

  OVERVIEW
  ────────
    The constitutional gate is the central enforcement
    pipeline. Every commit, build, and deployment passes
    through it. The gate evaluates all enabled rules and
    produces one of three outcomes.

  PIPELINE FLOW
  ─────────────
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  INGEST  │──▶│  ATTEST  │──▶│ VERIFY   │
    └──────────┘   └──────────┘   └──────────┘
                                          │
                                    ┌─────▼─────┐
                                    │  SETTLE    │
                                    └───────────┘

    1. INGEST    Source tree is loaded and parsed.
    2. ATTEST    Hardware attestation is verified.
    3. VERIFY    Each enabled rule is evaluated.
    4. SETTLE    Results are recorded. Receipt emitted.

  OUTCOMES
  ────────
    PASS     All rules satisfied. Pipeline continues.
    FAIL     One or more rules failed. Review required.
    UNKNOWN  Insufficient evidence. Manual inspection.

  EXIT CODES
  ──────────
    0   PASS — all rules satisfied
    1   FAIL — one or more rules failed
    2   UNKNOWN — insufficient evidence
    3   ERROR — runtime or environment error

  GATE CONFIGURATION
  ──────────────────
    gate:
      strict: true          # halt on first BLOCKER
      parallel: false       # sequential rule evaluation
      timeout: 30000        # ms before UNKNOWN
      retries: 2            # retry on transient failure

  EXAMPLES
  ────────
    $ air gate              # run gate pipeline
    $ air gate --strict     # strict mode (halt on first)
    $ air gate --report     # generate gate report

  SEE ALSO
  ────────
    air man rule, air man evidence, air man status,
    air man blocker, air man telemetry
`,

  evidence: `
AIR v3.1.0 — Evidence System
════════════════════════════════════════════════════════════════

  NAME
  ────
    evidence — evidence system explained

  OVERVIEW
  ────────
    Every constitutional rule requires evidence. The
    evidence system manages, validates, and audits
    the proof artifacts that support rule evaluations.

  EVIDENCE TYPES
  ──────────────
    1. test_output     Test suite results (pass/fail)
    2. lint_clean      Linter output (zero warnings)
    3. graph_node      Knowledge graph node presence
    4. graph_edge      Knowledge graph edge validity
    5. adr_record      Linked Architecture Decision Record
    6. audit_log       Audit trail entry with timestamp
    7. manual_review   Human sign-off with identity
    8. telemetry       Telemetry baseline comparison
    9. attestation     Hardware attestation certificate

  ATTACH FLOW
  ───────────
    1. Rule declares required evidence type.
    2. Evidence collector gathers the artifact.
    3. Artifact is hashed (SHA-256) and timestamped.
    4. Evidence leaf is added to the colony.
    5. Rule evaluator verifies evidence exists and is valid.

  DETACH FLOW
  ───────────
    1. Evidence leaf is identified by ID.
    2. Detach request is logged in the audit trail.
    3. Leaf is removed from the colony.
    4. Dependent rules are re-evaluated.
    5. Gate outcome may change (PASS → FAIL).

  AUDIT
  ─────
    All evidence operations are recorded in the
    append-only runtime journal. This provides:

      - Complete history of evidence lifecycle
      - Tamper-evident audit trail
      - Replay capability for any snapshot

  EXAMPLES
  ────────
    $ air evidence list           # list all evidence
    $ air evidence attach <id>    # attach evidence
    $ air evidence detach <id>    # detach evidence

  SEE ALSO
  ────────
    air man rule, air man gate, air man graph
`,

  graph: `
AIR v3.1.0 — Knowledge Graph
════════════════════════════════════════════════════════════════

  NAME
  ────
    graph — knowledge graph explained

  OVERVIEW
  ────────
    The knowledge graph is a directed graph of nodes and
    edges representing the project's architectural
    structure. It is queried during rule evaluation and
    gate verification.

  NODES
  ─────
    Nodes represent architectural entities:

      module       A code module or package
      service      A running service
      interface    An API boundary
      data_model   A data structure or schema
      rule         A constitutional rule
      evidence     An evidence artifact
      adr          An Architecture Decision Record

    Each node has:
      - id         Unique identifier
      - type       Entity type
      - properties Key-value metadata
      - version    Constitution version

  EDGES
  ─────
    Edges represent relationships:

      depends_on     Module dependency
      implements     Interface implementation
      owns           Ownership relationship
      enforces       Rule enforcement link
      supports       Evidence support link
      supersedes     Version supersession

  QUERY LANGUAGE
  ──────────────
    Simple query syntax:

      graph nodes --type module
      graph edges --from mod:auth
      graph query "depends_on" --from mod:api
      graph path --from mod:api --to mod:db

  SEE ALSO
  ────────
    air man evidence, air man adr, air man rule
`,

  adr: `
AIR v3.1.0 — Architecture Decision Records
════════════════════════════════════════════════════════════════

  NAME
  ────
    adr — Architecture Decision Records explained

  OVERVIEW
  ────────
    ADRs capture significant architectural decisions.
    They provide context, rationale, and consequences
    for each decision made in the project.

  LIFECYCLE
  ─────────
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │  DRAFT  │──▶│  REVIEW  │──▶│ APPROVED │
    └─────────┘   └──────────┘   └──────────┘
                                      │
                                ┌─────▼─────┐
                                │ SUPERSEDED │
                                └───────────┘

    1. DRAFT     Initial proposal. Work in progress.
    2. REVIEW    Under team review. Comments expected.
    3. APPROVED  Accepted. Decision is final.
    4. SUPERSEDED Replaced by a newer ADR.

  STRUCTURE
  ─────────
    adr-NNNN:
      title:      Short description
      status:     DRAFT | REVIEW | APPROVED | SUPERSEDED
      date:       ISO-8601 timestamp
      context:    Why this decision is needed
      decision:   What was decided
      consequences: Positive and negative outcomes
      evidence:   Links to supporting evidence

  GENERATION
  ──────────
    $ air adr new "Use event sourcing for audit log"

    Creates adr-0043 with DRAFT status.

  EXPORT
  ──────
    $ air adr export adr-0043          # export single ADR
    $ air adr export --format markdown # all ADRs as MD
    $ air adr export --format json     # all ADRs as JSON

  SEE ALSO
  ────────
    air man graph, air man evidence, air man evolution
`,

  debt: `
AIR v3.1.0 — Constitutional Debt
════════════════════════════════════════════════════════════════

  NAME
  ────
    debt — constitutional debt tracking

  OVERVIEW
  ────────
    Constitutional debt accumulates when rules fail with
    MINOR severity. Each debt item tracks the violated
    rule, its age, and its resolution path.

  DEBT CATEGORIES
  ───────────────
    BLOCKER    Hard failure. Must resolve before deploy.
    MINOR      Warning. Accumulates as technical debt.
    ADVISORY   Informational. No action required.

  STRUCTURE
  ─────────
    debt-item:
      rule_id:     The violated rule (R-NNN)
      severity:    BLOCKER | MINOR | ADVISORY
      created:     First failure timestamp
      last_seen:   Most recent failure timestamp
      count:       Total failure count
      resolution:  Planned fix description
      owner:       Responsible team or person

  RESOLUTION
  ──────────
    1. Identify the debt item.
    2. Plan the fix in a sprint or ticket.
    3. Implement the fix and re-evaluate.
    4. If rule passes, debt item is resolved.
    5. Resolution is logged in the audit trail.

  EXAMPLES
  ────────
    $ air debt list              # list all debt items
    $ air debt show R-017        # show specific item
    $ air debt resolve R-017     # mark as resolved

  SEE ALSO
  ────────
    air man rule, air man gate, air man blocker,
    air man status, air man telemetry
`,

  blocker: `
AIR v3.1.0 — Hard Failure Blockers
════════════════════════════════════════════════════════════════

  NAME
  ────
    blocker — hard failure blockers explained

  OVERVIEW
  ────────
    Blockers are critical failures that halt the gate
    pipeline immediately. No deployment is allowed while
    any blocker is active.

  BLOCKER LIST
  ────────────
    HF-001   Evidence Tampering Detected
             An evidence artifact has been modified after
             recording. The audit trail shows a hash
             mismatch.

    HF-002   Attestation Failure
             Hardware attestation could not be verified.
             The execution environment may be compromised.

    HF-003   Rule Registry Corruption
             The rule registry contains invalid or
             duplicate entries. Constitutional enforcement
             cannot proceed.

    HF-004   Graph Inconsistency
             The knowledge graph contains cycles or orphans
             that violate structural invariants.

    HF-005   Constitution Version Mismatch
             The running constitution version does not
             match the committed version.

  BEHAVIOR
  ────────
    1. Blocker is detected during gate evaluation.
    2. Pipeline halts immediately.
    3. A blocker receipt is emitted with full context.
    4. The system enters HAZARD state.
    5. Manual intervention is required to clear.

  CLEARING
  ────────
    $ air blocker list               # list active blockers
    $ air blocker show HF-001        # show details
    $ air blocker clear HF-001       # clear (requires auth)

  SEE ALSO
  ────────
    air man gate, air man rule, air man evidence,
    air man status, air man telemetry
`,

  theme: `
AIR v3.1.0 — Theme Switching
════════════════════════════════════════════════════════════════

  NAME
  ────
    theme — theme switching

  OVERVIEW
  ────────
    AIR supports three terminal phosphor themes. The
    theme affects all output rendering including gate
    reports, status displays, and man pages.

  THEMES
  ──────
    green    Green phosphor. Classic terminal aesthetic.
             Default theme. High contrast on dark bg.

    amber    Amber phosphor. Warm, low-blue-light option.
             Good for extended reading sessions.

    white    White phosphor. Clean, neutral appearance.
             Best for light terminal backgrounds.

  SWITCHING
  ─────────
    $ air theme green        # switch to green
    $ air theme amber        # switch to amber
    $ air theme white        # switch to white
    $ air theme              # show current theme
    $ air theme --preview    # preview all themes

  PERSISTENCE
  ───────────
    Theme preference is stored in:

      ~/.config/air/theme

    This file persists across sessions. The theme
    is also respected during pipe output.

  SEE ALSO
  ────────
    air man help, air man status, air man filesystem
`,

  filesystem: `
AIR v3.1.0 — Virtual Filesystem
════════════════════════════════════════════════════════════════

  NAME
  ────
    filesystem — virtual filesystem navigation

  OVERVIEW
  ────────
    AIR provides a virtual filesystem (VFS) for navigating
    the project structure. Commands mirror Unix conventions
    but operate on the constitutional model.

  COMMANDS
  ────────
    ls [path]          List directory contents
    cd <path>          Change current directory
    cat <file>         Display file contents
    tree [path]        Show directory tree
    find <glob>        Find files by glob pattern
    grep <pattern>     Search file contents (regex)

  DIRECTORY STRUCTURE
  ───────────────────
    /                  Root of VFS
    ├── constitution/  Constitution files
    │   ├── rules/     Rule definitions
    │   ├── adr/       Architecture decisions
    │   └── evolution/ Version history
    ├── evidence/      Evidence artifacts
    │   ├── leaves/    Evidence leaves
    │   └── colony/    Colony structure
    ├── graph/         Knowledge graph
    │   ├── nodes/     Graph nodes
    │   └── edges/     Graph edges
    ├── gate/          Gate configuration
    ├── telemetry/     Telemetry data
    │   ├── baselines/ Stored baselines
    │   └── readings/  Recent readings
    └── journal/       Runtime journal

  EXAMPLES
  ────────
    $ air ls /                     # list root
    $ air cd constitution/rules    # navigate
    $ air cat constitution/rules   # show rules
    $ air tree /graph              # tree view
    $ air find "**/*.adr"          # find ADRs
    $ air grep "HF-001"            # search content

  SEE ALSO
  ────────
    air man graph, air man evidence, air man adr
`,

  principles: `
AIR v3.1.0 — Architectural Principles
════════════════════════════════════════════════════════════════

  NAME
  ────
    principles — AIR architectural principles

  OVERVIEW
  ────────
    The six architectural principles define the design
    philosophy of AIR. Every feature and rule must
    align with one or more of these principles.

  R1 — REPRODUCIBILITY
  ─────────────────────
    The same input must produce the same gate outcome.
    All evaluations are deterministic. No randomness.
    No external state dependencies.

  R2 — EVIDENCE-BACKING
  ──────────────────────
    Every rule evaluation must be supported by
    verifiable evidence. No rule may rely on
    assumption or manual assertion alone.

  R3 — EXECUTABLE RULES
  ──────────────────────
    Rules must be machine-evaluable. Each rule has
    a clear predicate that evaluates to PASS, FAIL,
    or UNKNOWN. Ambiguous rules are not permitted.

  R4 — DIFFERENTIATION SURFACE
  ────────────────────────────
    AIR must provide clear differentiation from
    alternative approaches. The constitutional model
    itself is a competitive advantage.

  R5 — TRACEABILITY
  ──────────────────
    Every action must be traceable to its source.
    The runtime journal provides a complete,
    append-only history of all operations.

  R6 — CONSTITUTIONAL VALIDATION
  ───────────────────────────────
    The constitution itself must be validated.
    Version mismatches, corruption, and tampering
    are detected and flagged as blockers.

  SEE ALSO
  ────────
    air man rule, air man gate, air man evidence,
    air man blocker, air man evolution
`,

  status: `
AIR v3.1.0 — System Status
════════════════════════════════════════════════════════════════

  NAME
  ────
    status — system status overview

  OVERVIEW
  ────────
    The status command provides a comprehensive view of
    the system's current state including health, metrics,
    and active concerns.

  STATUS SECTIONS
  ───────────────
    Health        Overall system health indicator
    Gate          Current gate state and last outcome
    Rules         Enabled/disabled/failed rule counts
    Evidence      Evidence leaf count and validity
    Graph         Node and edge counts
    Debt          Active debt items and severity
    Blockers      Active blockers (should be zero)
    ADRs          Draft/review/approved counts
    Telemetry     Drift status and last reading
    Journal       Journal sequence number
    Attestation   Hardware attestation status

  HEALTH STATES
  ─────────────
    HEALTHY    All systems operational.
    DEGRADED   One or more non-critical issues.
    HAZARD     Blocker detected. Deployment blocked.
    UNKNOWN    Status cannot be determined.

  EXAMPLES
  ────────
    $ air status                  # full status
    $ air status --json           # JSON output
    $ air status --section gate   # specific section

  SEE ALSO
  ────────
    air man gate, air man debt, air man blocker,
    air man telemetry
`,

  telemetry: `
AIR v3.1.0 — Telemetry Drift Detection
════════════════════════════════════════════════════════════════

  NAME
  ────
    telemetry — telemetry drift detection

  OVERVIEW
  ────────
    Telemetry monitors runtime metrics and detects
    drift from established baselines. Drift events
    indicate behavioral changes that may require
    investigation.

  BASELINES
  ─────────
    Baselines are established reference points:

      - gate_duration    Average gate pipeline duration
      - rule_pass_rate   Percentage of rules passing
      - evidence_count   Total evidence leaves
      - graph_density    Node-to-edge ratio
      - debt_trend       Debt item count over time

    Baselines are stored in /telemetry/baselines/
    and updated on each stable gate pass.

  READINGS
  ────────
    Readings are point-in-time measurements:

      - timestamp        When the reading was taken
      - metric           Which metric was measured
      - value            Measured value
      - baseline         Reference baseline value
      - deviation        Difference from baseline

  DRIFT EVENTS
  ─────────────
    A drift event is emitted when a reading deviates
    beyond the configured threshold:

      - deviation > 20%  ADVISORY drift event
      - deviation > 50%  MINOR drift event
      - deviation > 80%  BLOCKER drift event

    Drift events are recorded in the runtime journal
    and included in gate reports.

  EXAMPLES
  ────────
    $ air telemetry baseline list   # list baselines
    $ air telemetry readings        # recent readings
    $ air telemetry drift           # drift events
    $ air telemetry drift --clear   # clear resolved

  SEE ALSO
  ────────
    air man gate, air man status, air man evidence,
    air man debt
`,

  rfc: `
AIR v3.1.0 — RFC Lifecycle
════════════════════════════════════════════════════════════════

  NAME
  ────
    rfc — RFC lifecycle explained

  OVERVIEW
  ────────
    RFCs (Requests for Comments) propose changes to the
    constitution. They follow a structured lifecycle from
    draft to promotion.

  LIFECYCLE
  ─────────
    ┌───────┐   ┌────────┐   ┌──────────┐   ┌──────────┐
    │ DRAFT │──▶│ REVIEW │──▶│ APPROVED │──▶│ PROMOTED │
    └───────┘   └────────┘   └──────────┘   └──────────┘
       │            │
       └────▶ REJECTED
                  │
                  └────▶ REVISED ──▶ REVIEW

    1. DRAFT      Author proposes changes.
    2. REVIEW     Team reviews and comments.
    3. APPROVED   Changes accepted by consensus.
    4. PROMOTED   Changes applied to constitution.
    5. REJECTED   Changes denied. May be revised.
    6. REVISED    Revised version resubmitted.

  STRUCTURE
  ─────────
    rfc-NNNN:
      title:      Short description
      author:     Proposer identity
      status:     DRAFT | REVIEW | APPROVED | REJECTED
      date:       ISO-8601 timestamp
      summary:    High-level description
      motivation: Why this change is needed
      proposal:   What the change looks like
      alternatives: What was considered and rejected
      impact:     Affected rules and capabilities

  EXAMPLES
  ────────
    $ air rfc new "Add pg_vector rule"   # create RFC
    $ air rfc review rfc-0012            # submit review
    $ air rfc approve rfc-0012           # approve
    $ air rfc promote rfc-0012           # promote to const.
    $ air rfc list                       # list all RFCs

  SEE ALSO
  ────────
    air man evolution, air man adr, air man rule
`,

  evolution: `
AIR v3.1.0 — Constitution Evolution
════════════════════════════════════════════════════════════════

  NAME
  ────
    evolution — constitution version evolution

  OVERVIEW
  ────────
    The constitution evolves over time through RFCs,
    ADRs, and direct edits. Version evolution tracks
    how the constitution has changed and why.

  VERSIONING
  ──────────
    Constitution versions follow semantic versioning:

      MAJOR   Breaking rule changes or removals
      MINOR   New rules or capabilities added
      PATCH   Bug fixes or documentation updates

    Example: v3.1.0 → v3.2.0 → v3.2.1 → v4.0.0

  VERSION HISTORY
  ───────────────
    Each version records:

      - version        Semantic version string
      - date           ISO-8601 timestamp
      - changes        List of changes
      - rfc            Associated RFC (if any)
      - adr            Associated ADR (if any)
      - migration      Steps to migrate (if breaking)

  EVOLUTION FLOW
  ──────────────
    1. Change is proposed via RFC.
    2. RFC goes through lifecycle (see air man rfc).
    3. On promotion, constitution is updated.
    4. Version number is incremented.
    5. Migration guide is generated (if breaking).
    6. Change is recorded in version history.

  MIGRATION
  ─────────
    Breaking changes require a migration path:

      $ air evolution migrate 3.1.0 -> 4.0.0
      $ air evolution show-migration v4.0.0

    The migration command generates a step-by-step
    guide for adapting to the new constitution.

  EXAMPLES
  ────────
    $ air evolution history          # show all versions
    $ air evolution show v3.1.0      # show version details
    $ air evolution diff v3.1.0 v4.0.0  # diff two versions

  SEE ALSO
  ────────
    air man rfc, air man adr, air man rule,
    air man status
`,
};

const _topicKeys = Object.keys(MAN_PAGES);

export const manTopics: string[] = _topicKeys.sort();

export function getManPage(topic: string): string | null {
  const key = _topicKeys.find((k) => k.toLowerCase() === topic.toLowerCase());
  return key ? MAN_PAGES[key] : null;
}

export const manpages = {
  lookup: (topic: string) => getManPage(topic),
  topics: manTopics,
};
