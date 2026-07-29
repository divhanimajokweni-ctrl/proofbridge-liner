                VVU EARTH TECH
    Administrator Specification — Operations Outreach Edition

FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES

       Target Audience: System Administrators, Operations Teams, Municipal IT




       CLASSIFICATION: Outreach Distribution — Scoping & Sales Framework Strategy

      Content Scope: Technical, Operational, and Strategic — Excludes Legal & Financial


                         Publication Date: 2026-07-28 | Version 1.0

                   Venture Vision Ubuntu (VVU) — EARTH TECH Division




                 VVU EARTH TECH — Outreach Distribution Document — 2026-07
Table of Contents
  • 1. System Overview & Deployment Architecture
  • 2. Kubernetes Infrastructure
  • 3. Monitoring Stack
  • 4. Circuit Breaker Operations
  • 5. Validation Suite Operations (VVU-VAL-001)
  • 6. Operator Runbook
  • 7. Phase-by-Phase Monitoring Guide
  • 8. Critical Failure Response
  • 9. Outreach Staged Release Enforcement
  • 10. Cape Town Pilot Deployment
  • 11. Resource Acquisition & Partnership Strategy




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
1. System Overview & Deployment Architecture
The VVU EARTH TECH platform is a deterministic evidence runtime for infrastructure monitoring,
municipal water network management, and autonomous decision-making. It combines an Epistemic DAG
Runtime (with four primitives: Fact, Proof, Policy, Projection), a Trust Runtime (5-state AIR safety
pipeline), and a 72-Hour Resilience Matrix to deliver verifiable, replay-deterministic, append-only
evidence for every decision the system makes.




Deployment Architecture
     Component              Deployment                     Resources                         Scaling

Epistemic Runtime     Kubernetes pod              2 CPU, 4GB RAM, 20GB disk         HPA: 2-10 replicas
                      (runtime.yaml)

NATS Streaming        Kubernetes pod              1 CPU, 2GB RAM, 50GB disk         Single cluster
                      (streaming.yaml)

Worker Pipeline       Kubernetes pod              1 CPU, 2GB RAM                    HPA: 2-8 replicas

API Gateway           Kubernetes pod              0.5 CPU, 1GB RAM                  HPA: 2-4 replicas

Evidence Collector    Kubernetes pod              0.5 CPU, 1GB RAM                  Fixed 2 replicas
                      (evidence.yaml)

Monitoring Stack      Prometheus + Grafana        2 CPU, 4GB RAM                    Fixed deployment

Outreach Service      Kubernetes pod              0.25 CPU, 0.5GB RAM               Fixed 1 replica
                      (outreach.yaml)




                        VVU EARTH TECH — Outreach Distribution Document — 2026-07
2. Kubernetes Infrastructure
VVU-VAL-001 deploys on provider-agnostic k3s with 6 Kubernetes manifests                               in    the
validation/VVU-VAL-001/kubernetes/ directory. All manifests use the vvu-validation namespace.



    Manifest                  Purpose                                    Key Configuration

namespace.yaml     vvu-validation namespace          Labels: app=vvu, tier=validation

runtime.yaml       Epistemic Runtime deployment      Resource limits: 2CPU/4GB, Liveness probe, Readiness
                                                     gate

monitoring.yaml    Prometheus + Grafana stack        ServiceMonitor, alert rules, dashboard CM

evidence.yaml      Evidence collection pods          SHA-256 verification, hourly bundle archival

streaming.yaml     NATS durable queue                Cluster: vvu-nats, durable subscriptions, replay mode

outreach.yaml      Staged outreach enforcement       3-stage gate engine, recipient registry




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
3. Monitoring Stack
The monitoring stack consists of Prometheus (metrics collection), Grafana (visualization), and the VVU
Mission    Control    Dashboard     (public  scoreboard).      Key     metrics     are     defined   in
scoreboard/metrics-schema.json.



        Metric                   Type                 Source                         Alert Threshold

circuit_breaker        enum (NORMAL/DEG         Runtime API            FAIL-CLOSED → Critical alert
                       RADED/RECOVERIN
                       G/FAIL-CLOSED)

facts_accepted         counter                  Acceptance Pipeline    Drop > 10% → Warning

facts_rejected         counter                  Evidence Compiler      Rejection rate > 5% → Warning

queue_depth            gauge                    NATS streaming         > 10000 → Warning, > 50000 → Critical

latency_p99_ms         gauge                    API gateway            > 500ms → Warning, > 2000ms →
                                                                       Critical

cpu_pct / ram_pct      gauge                    Kubernetes             > 80% → Warning, > 95% → Critical

mmr_root               string (SHA-256)         MMR append             Mismatch → Critical (replay divergent)

replay_checksum        string (SHA-256)         Replay engine          Must match fact_log_checksum

spoofed_payloads_qua   counter                  Security gate          Must equal spoofed_payloads_injected
rantined




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
4. Circuit Breaker Operations
     Breaker                    States                      Transition Rules                Admin Action

AIR Safety            NORMAL/WARNING/TRIPPED/         Score-driven + hysteresis        Observe only; DO NOT
(5-state)             RECOVERY/ESCALATED                                               manually transition

Municipal (3-state)   NORMAL/DEGRADED/FAIL-CL         Infrastructure-driven            Manual FAIL-CLOSED
                      OSED                                                             only for documented P5/P7
                                                                                       recovery



  ■ ADMIN RULE: No manual Circuit Breaker transitions except documented P5/P7 recovery
  sequences. Manual transitions on other phases = Critical failure = overall FAIL.




                           VVU EARTH TECH — Outreach Distribution Document — 2026-07
5. Validation Suite Operations
VVU-VAL-001 is a 72-hour continuous validation with 6 failure-injection phases. The protocol is
pre-registered (frozen before T=0) with independent observers.



  Pha         Name          Hours           Gate                            Objective                         Severity
   se

  P1     Nominal Load       0–12h      Baseline           Establish baseline under normal telemetry           Critical
                                                          traffic

  P2     Telemetry Flood    12–24      Acceptance         Verify acceptance pipeline absorbs 100×             Major
                            h          Capacity           flood

  P3     Network Chaos      24–36      HLC Ordering       Verify replay stays deterministic under packet      Critical
                            h                             loss

  P4     Storage            36–48      Append-Only        Verify graceful degradation under disk fill         Critical
         Pressure           h          Integrity

  P5     Node Failure       48–60      Recovery           Verify pods restart and no Fact is lost             Major
                            h

  P6     Security           60–66      HF-001/002/005     Verify every spoofed/malformed payload              Critical
         Injection          h                             rejected

  P7     Partition +        66–72      LVL-17             Verify deterministic HLC merge after partition      Critical
         Recovery           h




Milestone Tracking
Milest                     Name                                Trigger                              Actions
 one

M00      Pre-Registration Published                  Before T=0                    Manual

M12      Nominal Phase Complete                      Hour 12                       Evidence checkpoint

M24      Flood Phase Complete                        Hour 24                       Evidence checkpoint

M36      Network Chaos Complete                      Hour 36                       Evidence checkpoint

M48      Storage Pressure Complete                   Hour 48                       Evidence checkpoint

M60      Node Failure Complete                       Hour 60                       Evidence checkpoint

M66      Security Injection Complete                 Hour 66                       Evidence checkpoint

M71      Partition Recovery + HLC Merge              Hour 71                       Evidence merge

M72      Final Evidence Package Published            Hour 72                       Validation complete




                            VVU EARTH TECH — Outreach Distribution Document — 2026-07
6. Operator Runbook
Golden Rules (Non-Negotiable)
                 Rule                                                     Rationale

No code changes                         Frozen commit hash must remain the build under test for 72 hours

No configuration edits                  Config changes could alter runtime behavior mid-run

No manual Fact Log edits                Fact Log is append-only and immutable — edit = Critical failure

No manual Circuit Breaker transitions   CB must transition per state machine
(except documented)

Hardware replacement only               Physical node failures: replace, log, sign entry

All interventions logged                Every SSH, kubectl, hardware touch → append-only operator log

All interventions signed                Every log entry signed with Ed25519 operator key

No touching evidence bundles            Evidence bundles immutable — no write access




                            VVU EARTH TECH — Outreach Distribution Document — 2026-07
7. Phase-by-Phase Monitoring Guide
  Phase      Hours                 What to Watch                                   When to Act

P1           0–12    CB stays NORMAL, MMR progresses              Only if CB goes FAIL-CLOSED
Nominal

P2 Flood     12–24   Queue depth, CB may go DEGRADED              Only if CB goes FAIL-CLOSED

P3           24–36   Replay status, latency                       Only if replay goes DIVERGENT
Network
Chaos

P4 Storage   36–48   Disk usage, CB DEGRADED expected             Only if disk fills to 100%

P5 Node      48–60   Pods restarting, CB recovery                 Only if pod doesn't restart in 5 min
Failure

P6           60–66   Rejected payloads, HF gates                  Only if spoofed payload is ACCEPTED
Security

P7           66–72   NATS queue, then HLC merge                   Only if merge produces conflicts
Partition




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
8. Critical Failure Response
   • 1. Do NOT attempt to fix it. The run terminates immediately; the outcome is FAIL.
   • 2. Log the failure in the operator log with timestamp and description.
   • 3. Notify the VVU engineering lead and independent observers.
   • 4. Preserve all evidence — do not delete or modify any logs, bundles, or state.
   • 5. File a postmortem within 48 hours, published alongside the evidence package.



 ■ A Critical failure is itself valuable evidence. The logs, artifacts, and postmortem are published
 alongside any subsequent successful rerun.




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
9. Outreach Staged Release Enforcement
Communications Policy: VVU EARTH TECH follows a staged disclosure framework: (1) Engineering
progress is communicated only after verification — not before. (2) Outreach is structured in three stages:
Evidence Publication → Personalized Outreach → General Social & Press. (3) Sensitive operational
details are shared on a need-to-know basis. (4) Mass-blast communication is structurally impossible — the
outreach engine enforces sequential stage gates.



Sta          Name                     Trigger                          Audiences                Cooldown
ge

1      Evidence           M72 + Validation Index ≥ 90.0 +   Technical communities,         0h
       Publication        zero Critical failures            researchers

2      Personalized       Stage 1 complete + 24h elapsed    Investors, municipalities      24h
       Outreach           + no SEV-1

3      General Social &   Stage 2 complete + 48h elapsed    Journalists, general public    48h
       Press



    ■ Mass-blast communication is structurally impossible — the outreach engine enforces
    sequential stage gates.




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
10. Cape Town Pilot Deployment
Cape Town serves as the alternative pilot municipality case study for the VVU EARTH TECH
Hydro-Gateway deployment. Cape Town was selected following a governance review that identified
operational risks at the originally proposed municipality. Cape Town's established water management
infrastructure, progressive governance framework, and existing IoT deployment experience make it an
ideal partner for validating municipal-grade infrastructure monitoring technology.




Deployment Requirements
    • Network: Secure municipal network with IoT sensor connectivity.
    • Hardware: Hydro-Gateway acoustic leak detection sensors at designated monitoring points.
    • Software: Epistemic Runtime deployed on municipal Kubernetes cluster.
    • Monitoring: Prometheus + Grafana + VVU Mission Control Dashboard.
    • Operations: Trained municipal IT staff with operator runbook access.




                         VVU EARTH TECH — Outreach Distribution Document — 2026-07
11. Resource Acquisition & Partnership Strategy
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


Execution Principle: VVU EARTH TECH advances through multiple independent pathways in parallel.
Every activity is subject to formal governance review. Progress is measured by verified engineering
deliverables, not announcements. Where a pathway encounters obstacles, alternative pathways continue
without delay. This parallel execution model ensures continuous forward progress regardless of individual
pathway outcomes.




                          VVU EARTH TECH — Outreach Distribution Document — 2026-07
