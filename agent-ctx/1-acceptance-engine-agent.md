# Task 1 — AcceptanceEngineSection Component

## Agent: acceptance-engine-agent
## Status: COMPLETE

## What was done
Created `/home/z/my-project/src/components/epistemic/acceptance-engine.tsx` — a comprehensive dashboard section for the Acceptance Engine, the deterministic acceptance pipeline kernel of the Epistemic Runtime.

## Component Structure
The `AcceptanceEngineSection` is a named export with `"use client"` directive, containing 6 sub-panels:

### 1. PipelineVisualization
- Horizontal pipeline flow (desktop) / vertical (mobile)
- 9 stages: Incoming Fact → Canonicalize → Hash → Verify Schema → Verify Signatures → Evaluate Policies → Assign Sequence → Persist → Emit Acceptance
- Each stage: icon, status indicator (active/complete/idle), processing time metric, success/failure counts
- Active stage (Verify Signatures) has pulsing animation and ring highlight
- Tooltips on desktop with latency and success/failure details

### 2. FactLifecyclePanel
- State machine visualization: Accepted → Rejected → Superseded → Expired → Compensated
- Desktop: horizontal state diagram with animated hover effects
- Mobile: vertical list with percentage bars
- Transition labels (policy fail, new version, TTL, undo)
- Note that transitions are projections over metadata (not mutations)
- Current counts for each status

### 3. CanonicalizerPanel
- Interface definition: `serialize()`, `deserialize()`, `hash()`
- Current implementation: RFC8785 JSON, future: CBOR
- Live canonicalization example with before/after toggle (animated)
- SHA-256 hash display using Hash primitive
- Properties: Deterministic, UTF-8 encoding, Lexicographic key order

### 4. SequencerPanel
- Total Order formula: `LogicalSequence → Timestamp → FactID` with color-coded components
- Key metrics: Sequence #, Logical Time, Epoch, Facts/Epoch
- Vector clock visualization with animated bars (5 nodes)
- Monotonic time display

### 5. FailureFactsPanel
- 7 failure fact types: FactRejected, ProofExpired, PolicyViolation, DuplicateFact, ReplayConflict, ConsensusFailure, ProjectionFailure
- Each with: SeverityBadge, count, expandable description, last occurrence
- Total failure count in header
- Note: errors are evidence facts, not thrown exceptions

### 6. AcceptanceMetrics
- Throughput (facts/sec) with SparkLine
- Average acceptance latency with SparkLine
- Rejection rate with SparkLine
- Policy evaluation time with SparkLine
- DonutChart: Accepted vs Rejected vs Superseded
- Pipeline latency breakdown as horizontal MiniBar chart

## Design Patterns Used
- Same Shell, H3, animation variants (cv/cardV/itemV) pattern from trust-runtime.tsx
- Color tokens: verified, repairing, violating, quarantined
- Primitives: StatusPill, Hash, StatCard, SeverityBadge, SeverityDot
- Chart primitives: SparkLine, DonutChart, MetricGauge, MiniBar
- framer-motion for animations (AnimatePresence, motion.div, spring transitions)
- Responsive: horizontal desktop, vertical mobile layouts
- Dark mode compatible via CSS variable color tokens
- Grid overlay, accent bars, backdrop blur

## Lint: 0 errors, 0 warnings
## Dev server: stable
