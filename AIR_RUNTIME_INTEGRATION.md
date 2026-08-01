# AIR RUNTIME INTEGRATION SPECIFICATION
## Execution Guide & Compiler Pipeline Refactor

### 1. Target Repository Workspace Layout
The runner must strictly refactor the workspace into the following structure:

```text
proofbridge-liner-1/
├── air/
│   ├── store/           # Append-only Evidence Store JSON logs
│   ├── pipeline/        # Deterministic Multi-Pass Compiler scripts
│   │   ├── 1_collect.js
│   │   ├── 2_normalize.js
│   │   ├── 3_infer.js
│   │   ├── 4_govern.js
│   │   └── 5_codegen.js
│   ├── shared/
│   │   └── schemas/     # Strict validation contracts for IR layers
│   ├── governance/
│   │   └── rules/       # The standalone pluggable rule modules
│   ├── adr/             # Generated ADR markdown output
│   └── graph/           # Knowledge Graph output
└── products/
    └── proofbridge/     # Decoupled application logic manifest
```

### 2. Multi-Pass Compiler Specification

```text
[Repository/Artifacts] ──► (1_collect) ──► (2_normalize) ──► [Evidence IR] ──► (3_infer) ──► [Inference IR] ──► (4_govern) ──► [Decisions] ──► (5_codegen) ──► [Outputs]
```

* **Pass 1 (Collect):** Stateless collectors poll local repositories, Foundry deployment logs (`broadcast/`), test output JSONs, and telemetry hooks. They output unparsed payloads.
* **Pass 2 (Normalize):** Ingests raw collector outputs and normalizes them into the strict **Evidence IR** contract. No interpretation or confidence weighting is allowed here.
* **Pass 3 (Infer):** Reads the Evidence IR. Calculates a floating-point confidence metric using explicit, explainable contributors. Outputs **Inference IR**.
* **Pass 4 (Govern):** Evaluates entire capability states against the pluggable constitutional rule modules.
* **Pass 5 (Codegen):** Generates causal Knowledge Graph nodes, builds markdown ADRs, and writes the definitive CI/CD binary release state.

### 3. Data Contracts (Intermediate Representations)

#### Evidence Intermediate Representation (Evidence IR)

```json
{
  "id": "String (UUID/Hash)",
  "collector": "String (e.g., foundry-broadcast)",
  "timestamp": "ISO-8601 String",
  "artifact": "String (Path or URI)",
  "digest": "String (SHA-256 Hash)",
  "status": "PASS | FAIL | PENDING",
  "metadata": "Object"
}
```

#### Inference Intermediate Representation (Inference IR)

```json
{
  "inferenceId": "String",
  "evidenceReferences": ["String (EvidenceIDs)"],
  "capabilityId": "String",
  "conclusion": "String",
  "confidence": "Float (0.00 to 1.00)",
  "explainability": {
    "contributors": [
      { "factor": "String", "weight": "Float", "satisfied": "Boolean" }
    ]
  },
  "derivedAt": "ISO-8601 String"
}
```

### 4. Known Release Blockers (Hard Failure Target Map)

The runner must implement collectors and inference passes to explicitly trap and report these open production blockers using the new model:

| Blocker | Required Collector | Required Inference Input | Required Constitutional Rule Test |
| --- | --- | --- | --- |
| **TEE Attestation Flag** | `1_collect.js` checks source code paths for attestation parsing. | If parsing is a mock config boolean → set confidence to `0.31`. | `trust-boundary-integrity` fails if confidence score threshold < 0.80. |
| **Undeployed GovernanceAnchor.sol** | `1_collect.js` scans `broadcast/` for contract deployment addresses. | If deployment block and bytecode are missing → status `PENDING`. | `adapter-boundary-integrity` flags as an active deployment blocker. |
| **Unverified Client ZK Proofs** | `1_collect.js` verifies Solidity on-chain verifier test suites. | Maps public parameters against verification inputs. | `adapter-boundary-integrity` forces a `FAIL` status if proof verification is unexecuted. |

### 5. CI/CD Invariant Compatibility

The runner must maintain the exact behavioral interface of the existing system. The public execution commands (`npm run gate`) must remain unchanged in behavior. The runner will swap the underlying engine to use the multi-pass compiler pipeline without modifying the CI/CD gate's external integration lifecycle.

### 6. Non-Goals

* Rewriting the mathematical evaluation logic inside the core governance rules.
* Modifying existing external scripts that invoke `npm run gate`. The command interface must remain completely stable; only the underlying architecture shifts to the multi-pass compilation model.

### 7. Acceptance Criteria & Definition of Done

Integration is classified as complete if and only if:

1. AIR contains **zero product-specific strings** or hardcoded variables.
2. The Evidence Store operates as a strictly append-only file (`air/store/evidence_log.json`).
3. Running a historical replay pass across the evidence store reproduces identical rule outcomes.
4. The confidence score is computed entirely dynamically inside `3_infer.js` using explainable structural contributors.
5. The Knowledge Graph maps the full causal sequence: **Observation → Evidence → Inference → Rule → Decision → Release**.
6. The terminal exit codes (`0` for PASS, `1` for BLOCKED) execute correctly based on the new inference engine outputs.
