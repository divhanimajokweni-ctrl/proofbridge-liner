# AIR ARCHITECTURE REFERENCE
## Compiled Evidence System Layout

### 1. Component Execution Model
AIR operates as a pipeline compiler rather than a long-running background daemon process. Its internal architecture guarantees memory safety and state predictability by ensuring every pass is a pure function over immutable data files.

```text
+-------------------+      +----------------------+      +----------------------+
|  Evidence Store   | ===> |  Inference Runtime   | ===> |  Governance Runtime  |
|  (Append-Only)    |      |     (3_infer.js)     |      |     (4_govern.js)    |
+-------------------+      +----------------------+      +----------------------+
                                                                    |
                                                                    v
+-------------------+      +----------------------+      +----------------------+
|  Deployment Gate  | <=== |     ADR Generator    | <=== |  Graph Core Engine   |
|   (Exit 0 / 1)    |      |   (5_codegen.js)     |      |   (5_codegen.js)     |
+-------------------+      +----------------------+      +----------------------+
```

### 2. Shared Causal Graph Contract

The resulting schema stored inside `air/graph/graph.json` maps explicit relational edge definitions:

* `VERIFIES`: Connects an Observation to a Capability.
* `SATISFIES`: Connects a Capability to a Constitutional Rule.
* `CERTIFIES`: Connects a Rule to a Decision.
* `TRIGGERS`: Connects a Decision to a Release gate state or Business Objective.

### 3. Error Handling and Pipeline Diagnostics

When an inference pass returns a low confidence threshold or encounters an incomplete capability matrix, the system logs the exact missing contributors to standard error while allowing formatting operations to run to completion. This ensures that technical documentation and audit files are generated normally even when a build gate is actively blocked.

### 4. Structural Layer Isolation

```text
+-----------------------+
|  Products / Artifacts |
+-----------------------+
            |  (Emits Output)
            v
+-----------------------+
|   AIR Evidence Store  | <--- [Append-Only Operational Log]
+-----------------------+
            |  (Deterministic Replay)
            v
+-----------------------+
|   Inference Engine    | <--- [Computes Weights & Explainable Confidence]
+-----------------------+
            |  (Inference IR)
            v
+-----------------------+
|   Governance Engine   | <--- [Evaluates Constitutional Invariants]
+-----------------------+
            |  (Decisions)
            v
+-----------------------+
|   Knowledge Engine    | <--- [Emits Graph, ADRs, & CI/CD Pipeline Gates]
+-----------------------+
```

### 5. Graph Causal Lineage Spec

Graph generation must establish explicit relational tracing. Rather than embedding operational data directly inside nodes, structural linkages point back to persistent entries in the Evidence Store using unique identifiers:

```
Observation ID ──VERIFIES──> Capability ──SATISFIES──> Constitutional Rule ──CERTIFIES──> Release Decision
```
