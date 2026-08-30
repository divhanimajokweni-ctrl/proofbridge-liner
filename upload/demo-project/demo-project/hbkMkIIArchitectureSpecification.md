# HBK Mk-II Three-Tier Research Platform Architecture Specification

**Document status:** Architecture baseline for design review — not frozen for implementation  
**Scope:** Systems architecture only; no implementation code, UI design, or production CAD  
**Operating context:** Portable academic hydraulic research in South African municipal water infrastructure  
**Mandate:** Unknown values and unresolved requirements are explicitly marked **UNDEFINED**, **REQUIRES DECISION**, **REQUIRES VALIDATION**, or **REQUIRES ENGINEERING DATA**.

---

## 0. Architecture Rules

1. Tier 1 is autonomous and remains safe without Tier 2 or Tier 3.
2. Tier 2 is a temporary local research workstation, not a process controller.
3. Tier 3 is a long-term scientific platform and never sends runtime field-equipment commands.
4. Every authoritative responsibility has one owner.
5. Copies and caches do not acquire ownership merely because they hold data.
6. Raw observations are preserved separately from derived inference products.
7. Bayesian outputs are derived scientific products, not substitutes for deterministic evidence.
8. Safety enforcement occurs inside Tier 1 and cannot be bypassed by Tier 2.
9. Cloud or internet availability is never a Tier 1 safety or acquisition dependency.
10. Baseline field communication is Tier 1 ↔ Tier 2 and Tier 2 ↔ Tier 3. Direct Tier 3 control of Tier 1 is prohibited.
11. Hydraulic actuation authority and scope are **UNDEFINED**. Until resolved, the baseline architecture is observation-first and fails to a non-actuating state.

---

# 1. Tier 1 — HBK Mk-II Research Instrument

## 1.1 Mission

Tier 1 is the authoritative field instrument. It acquires deterministic observations, applies active calibration, records evidence, performs approved edge inference, manages local storage, enforces all hardware safety constraints, and communicates without depending on external infrastructure.

## 1.2 Hardware responsibilities

Tier 1 exclusively owns:

- Field sensors and sensor excitation.
- Analogue and digital signal acquisition.
- Sensor interface protection and electrical isolation where required.
- Sampling clocks and acquisition timing.
- Edge compute hardware.
- Local non-volatile storage.
- Local power conversion, distribution, monitoring, and protection.
- Battery management where batteries are included.
- Environmental monitoring internal to the instrument.
- Hardware watchdogs and independent safety circuits.
- Local status indication required for safe operation.
- Physical communication interfaces.
- Any approved integrated hydraulic hardware.

The sensor suite, hydraulic wetted path, pressure class, flow range, water-contact materials, backflow protection, contamination controls, and integrated actuation are **REQUIRES ENGINEERING DATA**.

## 1.3 Software and firmware responsibilities

Tier 1 exclusively owns:

- Deterministic acquisition scheduling.
- Timestamp generation and clock-quality reporting.
- Sensor-driver execution.
- Conversion from raw counts to engineering values using the active calibration package.
- Raw-count preservation when technically available.
- Quality flags, missing-sample flags, saturation flags, and plausibility flags.
- Local experiment state machine.
- Command validation and authorization enforcement.
- Safety interlock evaluation.
- Fault detection, isolation, and safe-state transition.
- Local experiment telemetry generation.
- Local health and diagnostic telemetry generation.
- Local evidence packaging.
- Local data retention and storage integrity checks.
- Approved Bayesian inference execution at the edge.
- Model-version, prior, parameter, and result provenance for edge inference.
- Recovery after unexpected reset or power interruption.
- Secure boot and firmware integrity enforcement.
- Device identity and local credential protection.

## 1.4 Research responsibilities

Tier 1 exclusively owns the authoritative field execution record:

- The actual experiment start and stop times.
- The exact deployed experiment package identifier.
- The exact active configuration hash.
- The exact calibration package identifiers used by each channel.
- The exact firmware and inference-model versions used.
- The sample sequence and acquisition gaps.
- The field run manifest.
- The final field run completion or abort reason.

Tier 1 may calculate edge inference, but it must never overwrite, discard, or relabel raw observations as inference results.

## 1.5 Communications responsibilities

Tier 1 exclusively owns:

- Discovery and pairing endpoints.
- Local protocol parsing.
- Message integrity validation.
- Replay protection for commands.
- Command admission and rejection.
- Telemetry publication.
- Evidence-transfer resumption.
- Link-health monitoring.
- Rate limiting and denial-of-service containment at the device boundary.

## 1.6 Safety responsibilities

Tier 1 is the sole runtime safety authority for field hardware. It owns:

- Safe-state definition and enforcement.
- Independent hard limits.
- Sensor plausibility checks required for safe operation.
- Power and thermal protection.
- Pressure, flow, leakage, and isolation protection if hydraulic actuation exists.
- Emergency-stop input handling if an emergency stop is required.
- Prevention of unsafe command execution.
- Automatic abort and controlled depressurization where applicable.
- Prevention of automatic restart after safety-significant faults unless explicitly approved by the safety case.

All safety thresholds are **REQUIRES ENGINEERING DATA**.

## 1.7 Tier 1 prohibited responsibilities

Tier 1 does not own:

- Institutional research governance.
- Long-term dataset curation.
- Publication preparation.
- Fleet-wide analytics.
- User-interface design.
- Experiment-library governance.
- Digital Twin management.
- Operator workstation reporting.

---

# 2. Tier 2 — Portable Research Controller

## 2.1 Mission

Tier 2 is the local operator and research workstation. It configures and deploys approved experiments, provides local monitoring and diagnostics, guides calibration workflows, issues manual requests, and produces local field reports. It may disconnect without making Tier 1 unsafe.

## 2.2 Experiment responsibilities

Tier 2 exclusively owns:

- Instantiation of a field experiment from an approved template.
- Binding site-specific and run-specific parameters.
- Pre-deployment compatibility checking against the connected Tier 1 capability declaration.
- Operator review and approval of the deployment package.
- Creation of the deployment transaction and operator authorization record.
- Transfer of the deployment package to Tier 1.
- Receipt and display of Tier 1 acceptance or rejection.
- Local monitoring of the active experiment.
- Operator-requested pause, resume, stop, or manual actions, subject to Tier 1 approval.
- Local field notes and annotations.

Tier 2 requests actions; it does not directly drive hardware outputs.

## 2.3 Calibration responsibilities

Tier 2 exclusively owns calibration workflow orchestration:

- Selecting the calibration procedure.
- Guiding the operator through required setup steps.
- Capturing reference-standard identifiers and environmental conditions.
- Requesting calibration acquisition from Tier 1.
- Calculating or invoking approved calibration analysis.
- Presenting calibration acceptance criteria.
- Recording operator disposition.
- Packaging a proposed calibration package for Tier 1 validation and activation.

Tier 1 owns application of the active coefficients. Tier 3 owns long-term calibration-record governance and archive.

Calibration standards, uncertainty budgets, reference equipment, intervals, acceptance criteria, and traceability requirements are **REQUIRES ENGINEERING DATA**.

## 2.4 Diagnostics responsibilities

Tier 2 exclusively owns:

- Interactive diagnostic sessions.
- Diagnostic procedure selection.
- Visualization of Tier 1 health and fault reports.
- Retrieval of device logs.
- Non-invasive sensor-channel tests.
- Maintenance technician workflows.
- Generation of a local diagnostic report.

Any intrusive diagnostic action is treated as a command request and remains subject to Tier 1 safety enforcement.

## 2.5 Local data responsibilities

Tier 2 exclusively owns:

- The transient field-session cache.
- Operator annotations.
- Local deployment receipts.
- Local calibration-session working data.
- Local diagnostic reports.
- Local field reports.
- Store-and-forward synchronization queues for Tier 3.

Tier 2 caches Tier 1 evidence but does not become the authority for the original field evidence.

## 2.6 Security responsibilities

Tier 2 exclusively owns:

- Local operator authentication.
- Local role and session enforcement.
- Workstation lock and timeout policy.
- Operator authorization signing for deployment transactions.
- Protection of locally cached research data.
- Verification of Tier 1 device identity.
- Verification of Tier 3 research-library artifacts before field use.
- Audit of operator actions performed through Tier 2.

## 2.7 Tier 2 prohibited responsibilities

Tier 2 does not own:

- Runtime safety decisions.
- Direct process control.
- Direct hardware-output timing.
- Long-term fleet management.
- Long-term evidence archive.
- Institutional model governance.
- Autonomous field operation after disconnection.
- Bypass of Tier 1 limits or interlocks.

---

# 3. Tier 3 — Research Platform

## 3.1 Mission

Tier 3 is the authoritative long-term scientific and collaborative platform. It manages research definitions, datasets, model versions, simulations, Digital Twins, evidence archives, collaboration, and publication preparation. It never directly controls field equipment.

## 3.2 Research-management responsibilities

Tier 3 exclusively owns:

- Project, programme, study, and campaign records.
- Research questions and hypotheses.
- Experiment-template library.
- Approval status and lifecycle of experiment templates.
- Research protocol documentation.
- Site and asset research metadata, subject to governance approval.
- Collaboration workspaces.
- Institutional review and approval records where applicable.

## 3.3 Data and evidence responsibilities

Tier 3 exclusively owns:

- Accepted long-term evidence objects.
- Authoritative research datasets assembled from accepted evidence.
- Dataset versions and release states.
- Data lineage and provenance graphs.
- Retention, legal-hold, archival, and disposal policy.
- Access-control policy for archived research data.
- Publication datasets and reproducibility packages.
- Evidence-integrity verification after ingest.

Tier 3 may reject an ingest package for integrity or completeness reasons, but it cannot alter the original Tier 1 evidence object.

## 3.4 Bayesian-model responsibilities

Tier 3 exclusively owns:

- Bayesian model library.
- Model versioning and approval state.
- Prior-definition governance.
- Training and validation datasets.
- Model validation reports.
- Model retirement and supersession.
- Reproducible batch inference.
- Comparison of edge and platform inference results.

Tier 1 executes only models packaged and approved for edge use. Tier 2 deploys but does not govern model truth.

## 3.5 Simulation and Digital Twin responsibilities

Tier 3 exclusively owns:

- Hydraulic simulation management.
- Digital Twin model definitions.
- Asset-model versions.
- Boundary-condition datasets.
- Scenario libraries.
- Simulation result archives.
- Model-to-observation comparison.
- Calibration and validation status of Digital Twins.

A Digital Twin cannot issue runtime commands to Tier 1. Any proposed field experiment generated from simulation must enter the governed experiment lifecycle and be manually deployed through Tier 2.

## 3.6 Fleet and lifecycle responsibilities

Tier 3 exclusively owns:

- Fleet inventory and configuration history.
- Device lifecycle records.
- Firmware and model release governance.
- Calibration due-state tracking.
- Maintenance history archive.
- Cross-device health analytics.
- Long-term utilization and reliability analytics.

Tier 3 fleet analytics are advisory and have no direct runtime control path.

## 3.7 Security responsibilities

Tier 3 exclusively owns:

- Organisational identity and access management.
- Research-role governance.
- Public-key infrastructure or equivalent trust-root governance.
- Artifact signing policy.
- Key issuance, rotation, revocation, and recovery policy.
- Central security audit archive.
- Dataset access review.
- Collaboration and external-sharing controls.
- Security incident coordination.

Cryptographic algorithms, key hierarchy, offline revocation behavior, and trust-root custody are **REQUIRES DECISION**.

## 3.8 Tier 3 prohibited responsibilities

Tier 3 does not own:

- Field runtime control.
- Safety interlocks.
- Hardware-output commands.
- Real-time sampling.
- Device-local safe-state decisions.
- Assumption of continuous connectivity.

---

# 4. Data Ownership Matrix

| Data object | Authoritative owner | Allowed copies | Ownership rule |
|---|---|---|---|
| Tier 1 capability declaration | Tier 1 | Tier 2, Tier 3 | Generated and signed by Tier 1 |
| Active Tier 1 configuration | Tier 1 | Tier 2 read-only; Tier 3 history | Tier 1 state is authoritative |
| Active calibration package | Tier 1 | Tier 2 working copy; Tier 3 archive | Tier 1 owns active use; archived calibration record is a separate Tier 3 object |
| Experiment template | Tier 3 | Tier 2 cache; Tier 1 receives packaged subset | Tier 3 governs version and approval |
| Field experiment instance | Tier 2 before deployment | Tier 1 after acceptance; Tier 3 after ingest | Ownership transfers by explicit lifecycle state |
| Deployment transaction | Tier 2 | Tier 1 receipt; Tier 3 archive | Tier 2 operator authorization is authoritative |
| Field run manifest | Tier 1 | Tier 2 cache; Tier 3 archive | Tier 1 is authoritative producer |
| Raw observations | Tier 1 | Tier 2 cache; Tier 3 accepted archive | Original values are immutable |
| Engineering-unit observations | Tier 1 | Tier 2 cache; Tier 3 archive | Must reference calibration package |
| Edge Bayesian result | Tier 1 | Tier 2 display; Tier 3 archive | Derived product with model provenance |
| Tier 1 health/fault record | Tier 1 | Tier 2 display; Tier 3 lifecycle archive | Tier 1 is authoritative producer |
| Operator annotation | Tier 2 | Tier 3 archive | Must not modify Tier 1 evidence |
| Local field report | Tier 2 | Tier 3 archive | Tier 2 is authoritative author |
| Accepted evidence object | Tier 3 | Tier 2 confirmation; Tier 1 receipt status | Created by immutable ingest of Tier 1 package |
| Curated dataset | Tier 3 | Controlled exports | Versioned and governed by Tier 3 |
| Bayesian model | Tier 3 | Tier 2 cache; Tier 1 approved deployment copy | Tier 3 governs model identity |
| Digital Twin | Tier 3 | Tier 2 visualization copy if required | No control authority |
| Maintenance session report | Tier 2 | Tier 3 archive | Tier 2 authors; Tier 3 retains |
| Fleet lifecycle record | Tier 3 | Tier 2 read-only subset | Tier 3 system of record |

---

# 5. Communication Matrix

| Source | Destination | Direction | Content | Availability assumption | Control authority |
|---|---|---|---|---|---|
| Tier 2 | Tier 1 | Request | Pairing, experiment deployment, calibration requests, diagnostic requests, manual operator requests, time-quality assistance | Intermittent local link | Requests only; Tier 1 may reject |
| Tier 1 | Tier 2 | Publish/response | Capability, acceptance/rejection, live telemetry, health, faults, evidence chunks, receipts | Intermittent local link | Tier 1 authoritative |
| Tier 2 | Tier 3 | Synchronization | Field reports, evidence packages, operator annotations, calibration sessions, diagnostics, local queue status | Intermittent internet or institutional network | No field control |
| Tier 3 | Tier 2 | Synchronization | Experiment templates, model packages, fleet metadata, revocation information, research assignments | Intermittent internet or institutional network | Library and governance content only |
| Tier 3 | Tier 1 | Prohibited baseline path | No runtime commands | Not applicable | None |
| Tier 1 | Tier 3 | Prohibited baseline direct path | Evidence travels through Tier 2 or approved removable-media workflow | Not applicable | None |

Protocol selection, physical interfaces, bandwidth, range, radio approvals, encryption suite, and data-volume limits are **REQUIRES ENGINEERING DATA**.

---

# 6. Command Flow

1. Tier 3 publishes an approved experiment template or model package.
2. Tier 2 verifies the artifact and creates a field experiment instance.
3. An authenticated Tier 2 operator binds site-specific parameters.
4. Tier 2 performs schema, compatibility, completeness, and authorization checks.
5. Tier 2 creates an immutable deployment transaction.
6. Tier 1 receives the package and independently verifies:
   - Package integrity.
   - Artifact approval and trust.
   - Device compatibility.
   - Calibration availability.
   - Required sensors and storage.
   - Safety-policy compatibility.
   - Current hardware health.
7. Tier 1 accepts or rejects the package with a deterministic reason code.
8. An accepted experiment remains unarmed until Tier 1 entry conditions are satisfied.
9. Tier 2 may request start, pause, resume, stop, or a defined manual action.
10. Tier 1 validates each request against state, authorization, replay protection, and safety conditions.
11. Tier 1 alone changes hardware state.
12. Tier 1 records the request, disposition, resulting state, and relevant evidence.

No Tier 2 command is guaranteed to execute. No Tier 3 runtime command is permitted.

---

# 7. Telemetry Flow

1. Sensors produce physical observations.
2. Tier 1 acquires raw samples using its local timebase.
3. Tier 1 attaches channel identity, sequence, timestamp, clock quality, calibration identity, and quality flags.
4. Tier 1 stores the authoritative observation locally before or independently of transmission.
5. Tier 1 generates separate live telemetry views for Tier 2. Live telemetry may be decimated or summarized but must be identified as such.
6. Tier 2 displays and optionally caches live telemetry.
7. Loss of Tier 2 connectivity does not stop Tier 1 acquisition unless the approved experiment explicitly requires operator presence and Tier 1 enforces that condition.
8. Tier 2 later forwards complete evidence packages to Tier 3.
9. Tier 3 verifies integrity and creates accepted archive objects.

Sampling rates, channel synchronization tolerance, latency, telemetry decimation rules, and storage capacity are **REQUIRES ENGINEERING DATA**.

---

# 8. Evidence Flow

## 8.1 Evidence classes

- **Raw evidence:** Original sensor counts or native sensor values, timestamps, sequence, channel identity, and quality state.
- **Calibrated observation:** Raw evidence transformed using an identified calibration package.
- **Derived deterministic result:** Filtering, aggregation, event detection, or calculated hydraulic quantity with declared method and parameters.
- **Bayesian result:** Posterior, likelihood-related outputs, uncertainty summaries, model identity, prior identity, parameters, and convergence/quality indicators.
- **Context evidence:** Site identifiers, operator annotations, photographs or external records if approved, environmental state, and instrument placement records.
- **Operational evidence:** Configuration, health, faults, commands, acceptance/rejection, firmware identity, and run-state transitions.

## 8.2 Evidence package

Each Tier 1 evidence package shall contain, subject to data-format design:

- Unique device identity.
- Unique experiment and run identities.
- Run manifest.
- Start, stop, abort, and recovery state.
- Firmware, configuration, model, and calibration identifiers.
- Raw observations.
- Calibrated observations where produced.
- Derived results separated by type.
- Health and fault records.
- Command and state-transition records.
- Clock source and clock-quality record.
- File/object integrity values.
- Chain-of-custody transfer receipts.

Exact data schemas, encoding, compression, integrity algorithms, and retention periods are **REQUIRES DECISION**.

## 8.3 Chain of custody

1. Tier 1 seals the completed or aborted run package.
2. Tier 2 copies without modifying the original evidence payload.
3. Tier 2 records operator and transfer context separately.
4. Tier 3 verifies completeness and integrity.
5. Tier 3 creates an immutable accepted evidence object.
6. Curated datasets reference accepted evidence objects and never silently replace them.
7. Corrections are new versioned objects with explicit reasons.

---

# 9. Safety Ownership

## 9.1 Sole authority

Tier 1 owns all field runtime safety. Tier 2 presents status and requests actions. Tier 3 owns safety governance records but has no runtime authority.

## 9.2 Required Tier 1 safety domains

- Electrical shock and energy protection.
- Battery and charging protection.
- Thermal protection.
- Mechanical stability and handling.
- Environmental ingress.
- Hydraulic pressure containment.
- Overpressure protection.
- Backflow and contamination prevention.
- Safe isolation from municipal infrastructure.
- Leakage detection where required.
- Safe venting or depressurization.
- Sensor-failure detection for safety-critical channels.
- Watchdog and fail-safe behavior.
- Emergency stop where hazard analysis requires it.
- Prevention of unintended actuation.
- Safe recovery after power loss.

Hazard limits, safety integrity targets, pressure ratings, proof factors, relief settings, material compatibility, and emergency procedures are **REQUIRES ENGINEERING DATA**.

## 9.3 Safety-state hierarchy

The exact state machine is **REQUIRES DECISION**, but must distinguish at minimum:

- De-energized safe state.
- Boot self-test.
- Standby safe state.
- Configured but not armed.
- Armed.
- Experiment active.
- Controlled stopping.
- Fault-latched safe state.
- Maintenance/calibration state.

Tier 1 must not infer that communication loss means permission to continue an unsafe action.

---

# 10. Security Ownership

| Security domain | Owner | Boundary |
|---|---|---|
| Device secure boot and firmware integrity | Tier 1 | Instrument hardware and firmware |
| Device identity and local secret protection | Tier 1 | Instrument trust boundary |
| Command verification and replay protection | Tier 1 | Field command boundary |
| Operator authentication and session security | Tier 2 | Portable workstation |
| Deployment authorization record | Tier 2 | Operator-to-device transaction |
| Organisational identity governance | Tier 3 | Research platform and institutions |
| Artifact signing and trust-root governance | Tier 3 | Experiment/model/firmware governance |
| Dataset access and collaboration controls | Tier 3 | Long-term research data |
| Security incident coordination | Tier 3 | Organisational process |

Additional required decisions:

- Threat model: **REQUIRES DECISION**.
- Adversary capability assumptions: **UNDEFINED**.
- Cryptographic suite: **REQUIRES DECISION**.
- Key-storage hardware: **REQUIRES ENGINEERING DATA**.
- Offline revocation policy: **REQUIRES DECISION**.
- Lost or stolen Tier 2 response: **REQUIRES DECISION**.
- Research participant, site, and municipal data privacy classification: **REQUIRES VALIDATION**.
- Applicable South African legal, municipal, and institutional requirements: **REQUIRES VALIDATION**.

---

# 11. Failure Behaviour

| Failure | Tier 1 required behaviour | Tier 2 effect | Tier 3 effect |
|---|---|---|---|
| Tier 2 link loss | Continue safe approved experiment or enter defined safe state according to experiment policy; keep recording locally | Session becomes disconnected | None |
| Tier 3 unavailable | No Tier 1 effect | Queue synchronization | Platform services unavailable only |
| Sensor failure | Flag channel, apply experiment-specific degradation rule, abort if safety or scientific validity requires | Display fault when connected | Archive fault context |
| Safety-critical sensor disagreement | Enter defined safe state and latch fault unless validated redundancy logic permits continued operation | Cannot override | None |
| Local storage nearing capacity | Warn, stop accepting new experiments, preserve current evidence according to policy | Display condition | None |
| Local storage failure | Preserve safe hardware state; abort if evidence requirements cannot be met | Retrieve diagnostics if possible | None |
| Clock-quality loss | Mark time quality; continue only if experiment validity and safety policy permit | Display degraded timing | Archive quality state |
| Edge inference failure | Preserve deterministic acquisition; disable inference output or mark invalid; do not corrupt raw data | Display model fault | Reprocess later if data valid |
| Firmware process crash | Independent watchdog returns hardware to safe state and records reset cause where possible | Reconnect and diagnose | Lifecycle record after sync |
| Power loss | Hardware fails safe; storage uses power-loss-safe transaction strategy; recover interrupted run explicitly | Link lost | None |
| Overpressure or hydraulic containment fault | Immediate Tier 1 protective action defined by hydraulic safety design | Display fault; no override | Archive event later |
| Authentication failure | Reject request and record security event | Operator notified | Security audit after sync |
| Corrupt experiment package | Reject before arming | Correct package required | Artifact investigation if systemic |
| Calibration invalid or expired | Reject affected experiment unless approved policy permits degraded operation | Guide recalibration | Track due state |
| Thermal limit exceeded | Reduce load or enter safe state according to validated policy | Display condition | Reliability analysis later |

Exact degraded modes are **REQUIRES DECISION** and must be justified by hazard analysis and scientific-validity requirements.

---

# 12. Offline Behaviour

## 12.1 Tier 1 offline

Tier 1 shall support, subject to validated capacity:

- Boot without network access.
- Load locally approved experiment packages.
- Execute approved experiments.
- Apply local calibration.
- Acquire and store observations.
- Run approved edge inference.
- Enforce safety.
- Record health, faults, and evidence.
- Seal completed or aborted evidence packages.
- Resume interrupted evidence transfer later.

Offline duration, storage endurance, battery endurance, and number of cached experiments are **REQUIRES ENGINEERING DATA**.

## 12.2 Tier 2 offline from Tier 3

Tier 2 shall support:

- Local operator authentication using approved offline policy.
- Use of previously synchronized approved templates and model packages.
- Local experiment configuration and deployment.
- Live monitoring, calibration, diagnostics, annotations, and reports.
- Store-and-forward queues.
- Conflict detection on later synchronization.

## 12.3 Tier 2 disconnected from Tier 1

- Tier 2 shall clearly mark the session disconnected.
- It shall not simulate successful command execution.
- Pending runtime commands expire and are not automatically replayed unless the protocol explicitly defines safe idempotent behavior.
- Tier 1 remains autonomous.

---

# 13. Startup Sequence

## 13.1 Tier 1 startup

1. Establish hardware-safe outputs before software initialization.
2. Verify boot integrity.
3. Start independent watchdogs.
4. Validate power rails, battery state, thermal state, and safety inputs.
5. Mount and verify local storage.
6. Recover or quarantine interrupted transactions.
7. Initialize time sources and declare clock quality.
8. Initialize sensor interfaces without unsafe actuation.
9. Load device identity and active configuration.
10. Load calibration packages and verify validity.
11. Execute self-tests.
12. Evaluate hydraulic safe state if hydraulic hardware exists.
13. Publish capability, health, and fault state.
14. Enter standby safe state.
15. Accept Tier 2 pairing only after the safe state is established.
16. Never auto-resume a safety-significant action without an explicitly validated recovery policy.

## 13.2 Tier 2 startup

1. Verify workstation integrity.
2. Authenticate operator.
3. Load local trust and revocation state.
4. Recover local synchronization queues.
5. Discover Tier 1 locally.
6. Verify Tier 1 identity.
7. Retrieve capability, configuration, calibration status, health, and faults.
8. Present discrepancies before experiment deployment.
9. Do not auto-arm Tier 1.

## 13.3 Tier 3 startup

Tier 3 startup has no field-safety effect. Services restore research management, archive, model, simulation, collaboration, and synchronization functions independently.

---

# 14. Shutdown Sequence

## 14.1 Normal Tier 1 shutdown

1. Refuse new experiment starts.
2. Stop or complete the active experiment according to approved policy.
3. Transition hydraulic hardware to safe state.
4. Confirm isolation and depressurization where applicable.
5. Flush acquisition buffers.
6. Finalize run state and reason.
7. Seal evidence package.
8. Verify storage commit.
9. Record shutdown reason.
10. De-energize outputs in a controlled sequence.

## 14.2 Emergency Tier 1 shutdown

- Hardware protection overrides normal sequencing.
- The system transitions to the safest achievable state.
- Evidence preservation is secondary to personnel, infrastructure, and environmental safety.
- On restart, Tier 1 creates an interrupted-run record and does not conceal missing data.

## 14.3 Tier 2 shutdown or disconnect

- Tier 2 sends a session-close notice if possible.
- It flushes local reports and synchronization queues.
- Disconnection does not imply a Tier 1 stop unless the experiment policy explicitly requires operator presence.

## 14.4 Tier 3 shutdown

Tier 3 shutdown affects only long-term services and synchronization. It has no direct field effect.

---

# 15. Research Workflow

1. **Research definition — Tier 3:** Define question, hypothesis, required evidence, analysis plan, and acceptance criteria.
2. **Safety and feasibility review — Tier 3 governance with engineering input:** Determine whether field work is permissible. Runtime enforcement remains Tier 1.
3. **Experiment template — Tier 3:** Create versioned experiment definition and approved model references.
4. **Field preparation — Tier 2:** Synchronize approved artifacts, verify equipment status, prepare local site metadata.
5. **Instrument setup — Tier 2 operator / Tier 1 validation:** Connect sensors and hydraulic interfaces; Tier 1 performs self-checks.
6. **Calibration check — Tier 2 workflow / Tier 1 acquisition:** Verify calibration status and perform required calibration.
7. **Deployment — Tier 2:** Bind field parameters and submit the experiment package.
8. **Admission — Tier 1:** Independently accept or reject.
9. **Execution — Tier 1:** Acquire observations, enforce safety, store evidence, and run approved edge inference.
10. **Monitoring — Tier 2:** Observe, annotate, and issue permitted requests.
11. **Closeout — Tier 1:** Stop safely and seal the run evidence.
12. **Field report — Tier 2:** Add operator context without changing Tier 1 evidence.
13. **Ingest — Tier 3:** Verify, archive, and acknowledge evidence.
14. **Analysis — Tier 3:** Curate datasets, run models and simulations, compare with Digital Twins.
15. **Review — Tier 3:** Record findings, limitations, anomalies, and reproducibility status.
16. **Publication preparation — Tier 3:** Create governed publication datasets and evidence references.

---

# 16. Experiment Lifecycle

| State | Owner | Entry condition | Exit condition |
|---|---|---|---|
| Draft template | Tier 3 | Research need recorded | Review submission |
| Under review | Tier 3 | Required reviewers assigned | Approved, rejected, or revised |
| Approved template | Tier 3 | Governance and validation complete | Instantiation or retirement |
| Field instance draft | Tier 2 | Approved template synchronized | Operator validation |
| Ready for deployment | Tier 2 | Site parameters and authorization complete | Submitted to Tier 1 |
| Rejected by instrument | Tier 1 | Admission check fails | Corrected new deployment transaction |
| Accepted/configured | Tier 1 | Admission checks pass | Armed or cancelled |
| Armed | Tier 1 | Safety and readiness conditions pass | Started, disarmed, or faulted |
| Active | Tier 1 | Valid start request and conditions | Completed, stopped, or aborted |
| Controlled stopping | Tier 1 | Stop condition occurs | Safe and sealed |
| Completed | Tier 1 | Planned completion | Evidence transfer |
| Aborted/faulted | Tier 1 | Fault or abort condition | Safe and sealed |
| Field-reported | Tier 2 | Operator report completed | Synchronization |
| Ingested | Tier 3 | Integrity and completeness checks pass | Curation |
| Curated dataset member | Tier 3 | Dataset rules accept evidence | Dataset release or revision |
| Published/archived | Tier 3 | Governance approval | Retention or supersession |
| Retired | Tier 3 | Template/model no longer approved | Read-only retention |

---

# 17. Future Expansion Roadmap

## Phase A — Requirements and hazard baseline

- Define hydraulic boundary and permitted field interactions.
- Define sensor suite and metrology targets.
- Define environmental, ingress, transport, and power requirements.
- Define evidence schema and scientific validity criteria.
- Complete preliminary hazard analysis and threat model.

## Phase B — Tier 1 bench research instrument

- Deterministic acquisition.
- Local storage and evidence sealing.
- Basic health/fault management.
- Independent safety architecture.
- Bench calibration and timing validation.
- No municipal deployment until hydraulic safety gates pass.

## Phase C — Tier 2 portable controller

- Local experiment deployment.
- Calibration and diagnostics workflows.
- Live monitoring and local reporting.
- Offline trust and store-and-forward validation.

## Phase D — Tier 3 evidence and research platform

- Immutable evidence ingest.
- Experiment and model libraries.
- Dataset versioning and collaboration controls.
- Reproducibility and publication packages.

## Phase E — Simulation and Digital Twin integration

- Validated hydraulic simulation interfaces.
- Observation-to-model comparison.
- Scenario management.
- No direct field-control path.

## Phase F — Multi-device research fleet

- Fleet lifecycle analytics.
- Cross-device calibration and reliability analysis.
- Controlled firmware/model release governance.
- Institutional collaboration.

## Phase G — Advanced research modules

Potential modules, all **REQUIRES DECISION**:

- Additional pressure, flow, acoustic, vibration, water-quality, and environmental sensing.
- GNSS or alternative site-positioning support.
- Additional edge inference accelerators.
- Removable evidence media.
- Extended battery modules.
- Isolated hydraulic excitation or test-loop modules.
- Remote data-only gateway with no inbound control authority.

---

# 18. Open Engineering Decisions

## 18.1 Hydraulic

- Municipal connection method: **UNDEFINED**.
- Observation-only versus active hydraulic excitation: **REQUIRES DECISION**.
- Maximum and minimum pressure: **REQUIRES ENGINEERING DATA**.
- Flow range and allowable pressure loss: **REQUIRES ENGINEERING DATA**.
- Pipe diameters and connection standards: **REQUIRES ENGINEERING DATA**.
- Wetted materials and potable-water compatibility: **REQUIRES VALIDATION**.
- Backflow, contamination, disinfection, and drainage strategy: **REQUIRES ENGINEERING DATA**.
- Pressure relief, isolation, and depressurization design: **REQUIRES ENGINEERING DATA**.

## 18.2 Sensors and metrology

- Sensor types, ranges, accuracy, bandwidth, and sampling rates: **UNDEFINED**.
- Channel synchronization requirement: **UNDEFINED**.
- Calibration uncertainty targets: **UNDEFINED**.
- Traceability requirements: **REQUIRES DECISION**.
- Reference standards and calibration intervals: **REQUIRES ENGINEERING DATA**.

## 18.3 Evidence and research validity

- Minimum evidence set per research question: **REQUIRES DECISION**.
- Raw-data retention duration: **REQUIRES DECISION**.
- Accepted missing-data and clock-quality limits: **REQUIRES ENGINEERING DATA**.
- Bayesian-model acceptance criteria: **REQUIRES VALIDATION**.
- Reproducibility package requirements: **REQUIRES DECISION**.

## 18.4 Power and environment

- Runtime and standby endurance: **UNDEFINED**.
- Battery chemistry and charging method: **UNDEFINED**.
- Operating and storage environment: **REQUIRES ENGINEERING DATA**.
- Ingress-protection target: **REQUIRES DECISION**.
- EMC, surge, lightning, and earthing requirements: **REQUIRES ENGINEERING DATA**.
- Transport shock and vibration: **REQUIRES ENGINEERING DATA**.

## 18.5 Communications

- Physical link and radio technologies: **REQUIRES DECISION**.
- Required range, throughput, and coexistence: **REQUIRES ENGINEERING DATA**.
- Allowed municipal-network connectivity: **REQUIRES VALIDATION**.
- Removable-media policy: **REQUIRES DECISION**.

## 18.6 Safety, security, and governance

- Safety integrity targets: **UNDEFINED**.
- Emergency-stop requirement: **REQUIRES HAZARD ANALYSIS**.
- Operator roles and competencies: **REQUIRES DECISION**.
- Cybersecurity threat model: **REQUIRES DECISION**.
- Data classification and privacy obligations: **REQUIRES VALIDATION**.
- South African municipal, legal, water-quality, radio, electrical, and institutional approvals: **REQUIRES VALIDATION**.

## 18.7 Lifecycle

- Design life and service interval: **UNDEFINED**.
- Repair versus replacement strategy: **REQUIRES DECISION**.
- Spare-parts policy: **REQUIRES DECISION**.
- Firmware/model support period: **REQUIRES DECISION**.
- End-of-life data and key destruction: **REQUIRES DECISION**.

---

# 19. Validation Gates Before Implementation

Implementation shall not begin until Gates 1–5 pass. Field deployment shall not begin until all applicable gates pass.

## Gate 1 — Mission and scope

- Research questions are defined.
- Observation-only versus actuation scope is resolved.
- Municipal use cases and prohibited uses are defined.
- Tier ownership and prohibited dependencies are accepted.

## Gate 2 — Hydraulic engineering basis

- Hydraulic schematic approved.
- Pressure, flow, temperature, water quality, and connection data approved.
- Materials and compatibility reviewed.
- Isolation, relief, backflow, drainage, and depressurization reviewed.
- Containment and proof-test requirements approved.

## Gate 3 — Safety basis

- Hazard analysis completed.
- Safe states and fault reactions approved.
- Safety-significant sensors and independent protection identified.
- Emergency procedures approved.
- No single unanalysed Tier 2 or Tier 3 failure can create unsafe Tier 1 behaviour.

## Gate 4 — Metrology and scientific validity

- Sensor performance requirements approved.
- Calibration strategy and uncertainty budgets approved.
- Timing and synchronization requirements approved.
- Evidence completeness and quality criteria approved.
- Bayesian validation plan approved.

## Gate 5 — Architecture and interfaces

- Interface-control documents approved.
- Command and telemetry schemas approved.
- State machines approved.
- Data ownership and lifecycle approved.
- Offline and recovery behavior approved.
- No circular dependency remains.

## Gate 6 — Cybersecurity and data governance

- Threat model approved.
- Identity, signing, key management, revocation, and audit design approved.
- Data classification, access, privacy, and collaboration controls approved.
- Offline authorization policy tested.

## Gate 7 — Tier 1 verification

- Boot, watchdog, storage, timing, acquisition, calibration, safety, fault, and recovery tests pass.
- Power-loss tests pass.
- Communication-loss tests pass.
- Evidence integrity and transfer-resumption tests pass.
- Hydraulic pressure and containment verification passes where applicable.

## Gate 8 — Tier 2 verification

- Deployment, monitoring, calibration, diagnostics, reports, and offline workflows pass.
- Tier 2 disconnection cannot compromise Tier 1 safety.
- Invalid and replayed commands are rejected by Tier 1.

## Gate 9 — Tier 3 verification

- Evidence ingest, immutability, lineage, dataset versioning, model governance, and access control pass.
- Tier 3 has no direct runtime-control path.
- Reproducibility package generation is validated.

## Gate 10 — Integrated bench and field readiness

- End-to-end experiment lifecycle demonstrated.
- Failure injection completed.
- Environmental and EMC qualification completed to approved requirements.
- Calibration and evidence chain of custody demonstrated.
- Municipal site procedure, permits, contamination control, and operator training approved.

## Gate 11 — Controlled research pilot

- Limited pilot scope approved.
- Independent safety and scientific review completed.
- Exit criteria and stop-work authority defined.
- Pilot evidence reviewed before wider deployment.

---

# 20. Architecture Review

## 20.1 Strengths of the proposed baseline

- Tier 1 remains autonomous and safe without cloud or workstation availability.
- Tier 3 has no direct field-control path.
- Deterministic evidence is separated from Bayesian inference.
- Field evidence, operator context, and curated datasets have distinct owners.
- Experiment definitions are governed before field deployment.
- Offline operation and store-and-forward behavior are explicit.
- Runtime safety authority is singular and local.

## 20.2 Critical ambiguities blocking architecture freeze

1. Hydraulic actuation scope is **UNDEFINED**.
2. Municipal connection and isolation method is **UNDEFINED**.
3. Sensor suite and metrology requirements are **UNDEFINED**.
4. Safety limits and integrity targets are **UNDEFINED**.
5. Evidence schemas and data-retention requirements are **REQUIRES DECISION**.
6. Connectivity technologies and radio requirements are **REQUIRES DECISION**.
7. Power endurance and environmental envelope are **UNDEFINED**.
8. Applicable legal, municipal, water-quality, electrical, radio, privacy, and institutional requirements are **REQUIRES VALIDATION**.
9. Calibration traceability and uncertainty requirements are **REQUIRES ENGINEERING DATA**.
10. Operator competence, maintenance authority, and field procedures are **REQUIRES DECISION**.

## 20.3 Assumptions requiring explicit approval

- Tier 1 is permitted to continue an approved observation-only experiment after Tier 2 disconnects.
- Tier 1 has sufficient local storage and power for the required offline period.
- Tier 2 is the baseline transfer gateway between Tier 1 and Tier 3.
- Tier 3 experiment and model artifacts are synchronized before field deployment.
- No cloud service is safety-significant.
- Bayesian inference can fail without terminating deterministic acquisition unless experiment validity requires abort.
- Municipal infrastructure interaction is supervised by authorized personnel.

All assumptions above are **REQUIRES VALIDATION**.

## 20.4 Freeze recommendation

**DO NOT FREEZE FOR IMPLEMENTATION.** Freeze is blocked until hydraulic scope, safety basis, metrology requirements, evidence requirements, environmental requirements, communications, security trust model, and South African deployment obligations are resolved and pass Validation Gates 1–6.
