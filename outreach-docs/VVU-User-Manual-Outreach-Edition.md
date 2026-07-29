                VVU EARTH TECH
            User Manual — Outreach Distribution Edition

FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES

            Target Audience: End Users, Operators, Municipal Stakeholders




       CLASSIFICATION: Outreach Distribution — Scoping & Sales Framework Strategy

      Content Scope: Technical, Operational, and Strategic — Excludes Legal & Financial


                         Publication Date: 2026-07-28 | Version 1.0

                   Venture Vision Ubuntu (VVU) — EARTH TECH Division




                 VVU EARTH TECH — Outreach Distribution Document — 2026-07
Table of Contents
  • 1. What is VVU EARTH TECH?
  • 2. The Epistemic Runtime Dashboard
  • 3. Navigating the Dashboard
  • 4. Trust Runtime Safety Pipeline
  • 5. Circuit Breaker States
  • 6. Validation Suite (VVU-VAL-001)
  • 7. Resource Acquisition Strategy
  • 8. Cape Town Pilot Municipality
  • 9. Governance: Execution Principle & Communications Policy
  • 10. Getting Started




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
1. What is VVU EARTH TECH?
The VVU EARTH TECH platform is a deterministic evidence runtime for infrastructure monitoring,
municipal water network management, and autonomous decision-making. It combines an Epistemic DAG
Runtime (with four primitives: Fact, Proof, Policy, Projection), a Trust Runtime (5-state AIR safety
pipeline), and a 72-Hour Resilience Matrix to deliver verifiable, replay-deterministic, append-only
evidence for every decision the system makes.




Core Design Principles
       • Deterministic Replay: Every decision in the system can be replayed from the evidence log,
       producing the identical result every time.
       • Append-Only Evidence: No Fact can be modified or deleted after acceptance — the log is
       cryptographically sealed.
       • Golden Rule: The AIR Kernel is horizontal infrastructure — no product-specific logic in the
       open-source code.
       • Fail-Closed Philosophy: When the system cannot verify, it rejects — never accepts unverified
       inputs.



Four Epistemic Primitives
  Primitive                            Purpose                                       Key Property

Fact              Observed evidence from sensors, logs, or external   Append-only, SHA-256 hashed,
                  sources                                             MMR-indexed

Proof             Cryptographic attestation linking evidence to a     Ed25519/RSA-PSS-SHA256/ECDSA P-384
                  decision                                            signed

Policy            Governance rule governing how evidence is           Versioned, bi-temporal, replay-deterministic
                  evaluated

Projection        Derived state computed from Facts and Policies      Recomputable from evidence log alone




                             VVU EARTH TECH — Outreach Distribution Document — 2026-07
2. The Epistemic Runtime Dashboard
The VVU MASTER Dashboard is the primary user interface for the Epistemic DAG Runtime. It provides a
unified view of all system components: trust runtime status, validation progress, resource acquisition
tracking, resilience metrics, and policy governance.




Dashboard Sections
      Section                             Description                                  User Action

Overview              System health, validation index, phase progress     View real-time status

Trust Runtime         5-state AIR safety pipeline, risk scores, gates     Monitor safety state

Circuit Breaker       3-state municipal breaker + 5-state AIR breaker     Track state transitions

Resilience Matrix     72-Hour resilience pillars status                   Review pillar health

Policy Studio         Policy creation, versioning, diff comparison        Create/edit policies

DAG Topology          Interactive graph of epistemic dependencies         Explore evidence graph

MMR Proofs            Merkle Mountain Range proofs and verification       Verify evidence chains

Timeline              Historical events and milestone tracking            Review event history

Validation Suite      VVU-VAL-001 phases, milestones, outreach            Track validation progress

Resource              7-Track strategy status overview                    Review outreach progress
Acquisition

CLI Terminal          Direct command interface (air health, air ledger)   Execute commands

Performance Metrics   System throughput, latency, queue depth             Monitor performance

Audit Reports         Evidence bundle verification and audit trail        Review audit results




                           VVU EARTH TECH — Outreach Distribution Document — 2026-07
3. Navigating the Dashboard
The dashboard uses a tabbed interface with keyboard shortcuts for rapid navigation. Each section loads
dynamically for performance optimization. The command palette (Ctrl+K) provides instant search across
all sections and commands.




Keyboard Shortcuts
            Shortcut                                                  Action

Ctrl+K                            Open command palette (global search)

1-9                               Switch to section tab by number

Ctrl+/                            Show keyboard shortcuts overlay

Escape                            Close overlay/modal




Interactive Features
      • Drag & Drop: DAG topology nodes can be rearranged by dragging.
      • Zoom & Pan: Graph sections support zoom (scroll) and pan (drag).
      • Click-to-Expand: Click any node to see full detail in an overlay panel.
      • Real-Time Updates: Validation suite and trust runtime update live during a validation event.
      • Theme Toggle: Switch between dark and light themes (preserves readability).




                            VVU EARTH TECH — Outreach Distribution Document — 2026-07
4. Trust Runtime Safety Pipeline
The Trust Runtime implements a 5-state AIR (Autonomous Intelligence Runtime) safety pipeline with
hysteresis to prevent oscillation at threshold boundaries. This is separate from the 3-state municipal
infrastructure circuit breaker — they operate independently.




AIR Safety States
  State                 Meaning                            Trigger                           User Impact

NORMAL      All systems operating within safe   Risk score below warning          Full functionality, all features
            parameters                          threshold                         available

WARNING     Elevated risk detected —            Risk score ≥ 0.6 or delta ≥       Features available, monitoring
            monitoring intensified              0.05                              alerts active

TRIPPED     Risk exceeds safe limits —          Risk score ≥ 0.75 or delta ≥      Pending intents halted, new
            execution halted                    0.1                               submissions queued

RECOVER     Risk declining — minimum hold       Risk drops below trip threshold   Queued intents processed after
Y           period enforced                                                       hold period

ESCALAT     Repeated trips — system-wide        3 trips within 1-hour window      All execution suspended, manual
ED          escalation                                                            review required




Gate Pipeline Flow
    • Gate 0 — Temporal Validity: Intent must not exceed 72-hour maximum age.
    • Gate A — Convergence: Contracting behavior checked; divergence penalty applied.
    • Gate B — Accumulation: Tier-weighted exposure must stay below configured ceiling.
    • Gate C — Velocity: First-derivative (rate of change) must stay below max velocity.
    • Gate D — Acceleration: Second-derivative (rate of rate) must stay below max acceleration.
    • Gate E — State Drift: Current state must not drift beyond max distance from intent snapshot.
    • Composite Risk Score: Weighted sum of all gate outputs → circuit breaker evaluation.




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
5. Circuit Breaker States
The system operates two independent circuit breaker systems, each serving a distinct purpose:



     Breaker                 States                       Scope                         Purpose

AIR Safety         NORMAL / WARNING /             Trust Runtime            Autonomous decision safety —
Pipeline           TRIPPED / RECOVERY /                                    prevents unsafe AI actions
                   ESCALATED

Municipal          NORMAL / DEGRADED /            Resilience Manager       Infrastructure resilience — protects
Infrastructure     FAIL-CLOSED                                             water network monitoring



  ■ These two breakers are architecturally independent. The AIR breaker governs autonomous
  decision safety; the municipal breaker governs infrastructure resilience. They do not cascade.




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
6. Validation Suite (VVU-VAL-001)
The VVU-VAL-001 is a 72-hour continuous validation protocol that subjects the Epistemic Runtime to
controlled failure injection across 6 phases. The protocol is pre-registered (test plan frozen before
execution) with published success criteria and a computed Validation Index (PASS ≥ 90.0).




Validation Phases
  Pha         Name          Hours          Gate                            Objective                      Severity
   se

  P1     Nominal Load       0–12h     Baseline           Establish baseline under normal telemetry        Critical
                                                         traffic

  P2     Telemetry Flood    12–24     Acceptance         Verify acceptance pipeline absorbs 100×          Major
                            h         Capacity           flood

  P3     Network Chaos      24–36     HLC Ordering       Verify replay stays deterministic under packet   Critical
                            h                            loss

  P4     Storage            36–48     Append-Only        Verify graceful degradation under disk fill      Critical
         Pressure           h         Integrity

  P5     Node Failure       48–60     Recovery           Verify pods restart and no Fact is lost          Major
                            h

  P6     Security           60–66     HF-001/002/005     Verify every spoofed/malformed payload           Critical
         Injection          h                            rejected

  P7     Partition +        66–72     LVL-17             Verify deterministic HLC merge after partition   Critical
         Recovery           h




Validation Index Dimensions
        Dimension            Weight                                   What It Measures

Replay Determinism           0.25        Checksum match between live and replayed Fact Log

Append-Only Integrity        0.20        No Fact modified or deleted; MMR root valid

Policy Enforcement           0.15        Every violation produces Failure Fact; no crash

HLC Merge Correctness        0.15        Zero conflicts on partition reconnect

Evidence Bundle Integrity    0.15        Hourly bundles SHA-256 verified

Security Gate Rejection      0.10        All spoofed/malformed payloads rejected



  ■ PASS threshold: Validation Index ≥ 90.0. Zero Critical failures required (§3.1).




                            VVU EARTH TECH — Outreach Distribution Document — 2026-07
7. Resource Acquisition Strategy
7-Track Resource Acquisition & Partnership Strategy: Track A — Municipal Partnerships: Active
outreach to Cape Town and progressive municipalities for pilot deployment and validation partnerships.
Status: Active Outreach Track B — University Research Partnerships: Engagement with South African
and international universities for collaborative research, validation observation, and academic publication.
Status: Strategy Track C — Industry Integration: Partnership development with water infrastructure, IoT,
and municipal technology companies for integration, supply chain, and co-development. Status: Strategy
Track D — Public Funding: Application to national and provincial technology innovation funds, water
sector grants, and digital infrastructure programmes. Status: Strategy Track E — Private Investment:
Structured engagement with impact investors, technology venture capital, and ESG-aligned funds. Status:
Strategy Track F — Sponsorship & Equipment: Outreach to hardware manufacturers, cloud providers,
and technology sponsors for equipment, infrastructure, and in-kind support. Status: Strategy Track G —
Community & Open Source: Building developer community, open-source contributors, and civic
technology networks for grassroots validation and adoption. Status: Strategy



  ■ IMPORTANT: Tracks B–G are currently at Strategy stage. Only Track A (Cape Town outreach)
  is at Active Outreach stage. No track has reached Confirmed Commitment. VVU presents these
  as planned and active initiatives, NOT as outcomes already secured.




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
8. Cape Town Pilot Municipality
Cape Town serves as the alternative pilot municipality case study for the VVU EARTH TECH
Hydro-Gateway deployment. Cape Town was selected following a governance review that identified
operational risks at the originally proposed municipality. Cape Town's established water management
infrastructure, progressive governance framework, and existing IoT deployment experience make it an
ideal partner for validating municipal-grade infrastructure monitoring technology.




Cape Town Selection Criteria
    • Established Water Management: Cape Town has extensive water infrastructure experience
    following the 2018 water crisis, including advanced demand management and monitoring systems.
    • Progressive Governance: Transparent governance framework with established IoT deployment
    experience and digital transformation initiatives.
    • Technical Infrastructure: Existing sensor networks, data platforms, and municipal IT systems
    suitable for Hydro-Gateway integration.
    • Research Ecosystem: Proximity to University of Cape Town, Stellenbosch University, and CSIR for
    collaborative validation.




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
9. Governance Framework
Execution Principle: VVU EARTH TECH advances through multiple independent pathways in parallel.
Every activity is subject to formal governance review. Progress is measured by verified engineering
deliverables, not announcements. Where a pathway encounters obstacles, alternative pathways continue
without delay. This parallel execution model ensures continuous forward progress regardless of individual
pathway outcomes.


Communications Policy: VVU EARTH TECH follows a staged disclosure framework: (1) Engineering
progress is communicated only after verification — not before. (2) Outreach is structured in three stages:
Evidence Publication → Personalized Outreach → General Social & Press. (3) Sensitive operational
details are shared on a need-to-know basis. (4) Mass-blast communication is structurally impossible — the
outreach engine enforces sequential stage gates.




Staged Release Enforcement
Sta         Name                      Trigger                           Audiences            Cooldown
ge

1     Evidence            M72 milestone + Validation Index   Technical communities,        0 hours
      Publication         ≥ 90.0                             researchers

2     Personalized        Stage 1 complete + 24h elapsed     Investors, municipalities     24 hours
      Outreach            + no SEV-1

3     General Social &    Stage 2 complete + 48h elapsed     Journalists, general public   48 hours
      Press




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
10. Getting Started
Accessing the Dashboard
The VVU MASTER Dashboard is accessible via the web interface. All sections load dynamically for
optimal performance. The dashboard supports both SIM (simulation) and LIVE modes for validation event
monitoring.




First Steps
    • 1. Open the Dashboard: Navigate to the VVU MASTER Dashboard URL.
    • 2. Review Overview: Check system health, current phase, and validation index.
    • 3. Explore Sections: Use tab navigation or Ctrl+K to jump between sections.
    • 4. Monitor Trust Runtime: Watch the AIR safety state and risk score trends.
    • 5. Track Validation: During a VVU-VAL event, monitor phase progress and milestones.



Support & Outreach
For partnership inquiries, pilot deployment discussions, or technical questions, contact the VVU EARTH
TECH outreach team. All outreach follows the staged release enforcement protocol — no unsolicited mass
communication.




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
