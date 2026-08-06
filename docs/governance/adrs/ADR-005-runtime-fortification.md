# ADR-005: Runtime Fortification — Institutional-Grade Evidence Substrate

## Status
Accepted (v0.8 LAST ITERATION)

## Context
The Epistemic Runtime v0.8 achieved 12/12 kernel assertions, 57/57 tests passing, deterministic replay verification, and production integrations (S3 Object Lock, AWS KMS, IAM Federation). However, the architecture review identified 10 areas where strengthening is needed to make the runtime durable over many years and across multiple automation ecosystems.

The review noted:
- The runtime had evolved from "logging automation" into a genuine evidence architecture
- Major strengths: single ingestion path, clear separation between observations/facts/projections, immutable evidence, deterministic replay, service-agnostic projection model
- Remaining work: making the architecture durable across multiple automation ecosystems

## Decision
We implement 10 architectural strengthening recommendations:

### 1. Observation Versioning
Every observation carries `schemaId`, `schemaVersion`, `producer`, `producerVersion`. This makes replay possible years later because the exact schema and producer version are recorded with each fact. Without versioning, replay becomes impossible as schemas evolve.

### 2. Capability Sets
9 vendor-neutral capabilities: `automation.review`, `automation.fix`, `automation.deploy`, `automation.triage`, `security.analysis`, `security.deep-analysis`, `vision.debug`, `webhook.ingest`, `app.build`. Policy can say "Allow automation.review, Reject automation.deploy" without knowing anything about Kilo. This makes ER vendor-neutral — the runtime doesn't know about specific services, only about capability claims.

### 3. Correlation Graph
Three identity fields: `causationId` (direct parent — what caused this), `correlationId` (workflow scope — what chain this belongs to), `parentFactId` (fact reference — evidence lineage). Each solves a different problem: causation for direct lineage, correlation for workflow grouping, parentFact for evidence chains. Bot Command → Review → Fix → PR → Merge → Deploy each becomes traceable, and later: Incident → Root Cause → Automation Chain becomes one query.

### 4. Confidence ≠ Evidence
INVARIANT: Trust scores, confidence values, and Bayesian posteriors are NEVER stored as Facts. They are ALWAYS Projections. Only evidence events ("Review Passed", "Fix Accepted", "Rollback Occurred", "Human Override", "False Positive") become Facts. Those are evidence. Confidence is derived. Storing "Trust = 0.94" as a fact would violate the fundamental invariant that facts record what happened, not what we think about what happened.

### 5. Typed Observation SDK
Instead of `emitObservation(any)`, we provide typed functions: `emitBotCommand()`, `emitReviewStarted()`, `emitReviewCompleted()`, `emitFixCreated()`, `emitSecurityFinding()`, `emitDeployment()`, `emitDriftObserved()`, `emitAgentSession()`. Every function compiles into `VersionedObservation` internally. This makes it impossible to emit untyped observations, preventing schema drift at compile time.

### 6. Observation Authentication
Every observation carries `ObservationAuth` metadata: method (mTLS/OIDC/IAM-role/API-key/internal), verified identity, issuer, role ARN, cert fingerprint. The collector NEVER trusts "source:kilo-bot" — the identity provider establishes that. Authentication chain: Service Identity → mTLS → OIDC → JWT → Capability Policy → Acceptance.

### 7. Projection Manifest
Projections are registered with `ProjectionManifest` metadata: id, version, dependencies, capabilitySet, projectionHash, deterministic flag, owner. Projections themselves become auditable — you can verify which projections are deterministic, which capabilities they require, and what their code hash is.

### 8. Replay Certificates
Every replay generates a `ReplayCertificate`: projection name/hash, fact count, MMR root, runtime version, policy version, passed flag, timestamp, signature. This becomes first-class replay evidence. Auditors love this because it provides cryptographic proof that deterministic replay was verified, not just a boolean "passed" field.

### 9. Automation Provenance
Every automation action records provenance: agent name, prompt hash (NOT the prompt itself), tool call hashes, output hash (NOT the output itself), human approval status. This lets you prove "this exact automation produced this exact action" without storing sensitive prompts or outputs. Only the hashes — the fingerprints, not the content.

### 10. Drift Facts
When a projection disagrees with the live system, an `operational_drift_observed` fact is emitted. The discrepancy becomes evidence (Projection ≠ Live System) and can trigger alerts. Drift is not just a projection — it's a fact. This closes the loop between what we believe (projection) and what is real (live system).

### Plus: Observation Adapter Layer
A vendor-neutral translation layer between external systems and ER: Kilo → Observation Adapter → Collector → Acceptance → Fact Log. ER shouldn't know what Kilo is. Tomorrow GitHub Actions, Azure DevOps, Jenkins, GitLab, Linear, Slack, Cursor, Claude Code, OpenHands can all emit observations through adapters. ER only understands observations, not vendors.

## Consequences
- The runtime moves beyond a Kilo integration and becomes a general-purpose evidence substrate
- Compatible with any orchestration platform (GitHub Actions, GitLab, Jenkins, Linear, Slack, Cursor, etc.)
- All 10 concepts maintain the deterministic replay guarantee
- Backward-compatible — new Fact fields are optional, existing code continues to work
- Capability sets make the runtime vendor-neutral and policy-driven
- Replay certificates provide cryptographic evidence for auditors
- The architecture is durable across many years and multiple automation ecosystems

## Implementation
- Types added to `src/lib/kernel/types.ts` (CapabilitySet, ObservationAuth, AutomationProvenance, ReplayCertificate, ProjectionManifest, ObservationAdapter, operational_drift_observed)
- Observation adapters in `src/lib/kernel/observation-adapter.ts` (KiloBotAdapter, CodeReviewAdapter, AutoFixAdapter, SecurityAgentAdapter, GitHubActionsAdapter)
- Typed Observation SDK in `src/lib/kernel/typed-observation-sdk.ts` (8 typed emitter functions)
- ReplayCertificate generation in `src/lib/kernel/replay.ts`
- ProjectionManifest support in `src/lib/kernel/projection-registry.ts`
- OperationalCollector strengthened with versioning, capabilities, auth, adapter support
- Push script at `scripts/push-to-main.sh` with placeholders for proofbridge-liner repo
