# PLAN — Agent Execution Contract — 2026-07-11

## Business Intent
Define a tool-agnostic contract that any AI agent must satisfy before contributing code to VVU. Every line of code traces back to an agent, a task, evidence, and an approval. The governance layer stays constant; implementations are replaceable.

## User Story
As a **VVU founder governing AI-generated code**, I need every agent execution to produce a cryptographic receipt with verifiable evidence — so that I can trust the software development lifecycle with the same principles as the financial platform.

## Acceptance Criteria

### AC1: Schema — execution_receipts table
- [ ] Add `execution_receipts` table to `contracts/db/trust-runtime.ts`
- [ ] Fields: receiptId, agentId, taskId, taskSpecHash, branch, baseCommit, headCommit, evidence (jsonb), diffManifest (jsonb), verificationStatus, verifiedBy, contextId, createdAt
- [ ] FK to trust_contexts

### AC2: Types — ExecutionReceipt, AgentIdentity, TaskSpec, DiffManifest
- [ ] Add types to `contracts/api/types.ts`
- [ ] Extend ReceiptType union with `'execution'`
- [ ] Add `AgentIdentity`, `TaskSpec`, `DiffManifest`, `ExecutionEvidence`, `ExecutionReceipt` types

### AC3: Event types — execution lifecycle events
- [ ] Add 5 event types to `TrustEventType` in `packages/trust-events/src/definitions.ts`: execution.task_accepted, execution.completed, execution.verified, execution.rejected, execution.merged
- [ ] Add corresponding payload interfaces
- [ ] Update validateTrustEvent validTypes array

### AC4: Contract enforcement — enforceExecutionContract()
- [ ] New file `packages/trust-api/src/enforce-execution-contract.ts`
- [ ] Orchestrates: agent registration check → TaskSpec validation → scope check → receipt generation → verification
- [ ] Returns `ExecutionContractResult`

### AC5: Agent registration — registerAgent() / getAgent()
- [ ] New file `packages/trust-api/src/agent-registry.ts`
- [ ] In-memory registry with optional PostgreSQL backing (same pattern as EventJournal)
- [ ] Functions: registerAgent, getAgent, listAgents, updateAgent

### AC6: Founder Brief — Plain-English summary
- [ ] New file `packages/trust-api/src/founder-brief.ts`
- [ ] Generates structured summary from TaskSpec + ExecutionReceipt + VerificationAttestation

### AC7: Validation
- [ ] Typecheck all packages
- [ ] Tests for enforceExecutionContract, agent-registry, founder-brief

## Affected Files

### New Files
```
packages/trust-api/src/enforce-execution-contract.ts
packages/trust-api/src/agent-registry.ts
packages/trust-api/src/founder-brief.ts
```

### Modified Files
```
contracts/db/trust-runtime.ts                     # Add execution_receipts table
contracts/api/types.ts                             # Add types, extend ReceiptType
packages/trust-events/src/definitions.ts           # Add execution event types
packages/trust-api/src/index.ts                    # Re-export new modules
```

## Implementation Order
1. Types first (contracts/api/types.ts) — add all new types
2. Schema (contracts/db/trust-runtime.ts) — add table
3. Events (trust-events/definitions.ts) — add event types + payloads
4. Agent registry (trust-api/agent-registry.ts)
5. Contract enforcement (trust-api/enforce-execution-contract.ts)
6. Founder brief (trust-api/founder-brief.ts)
7. Barrel exports (trust-api/index.ts)
8. Validation

## APPROVED BY: Mino DATE: 2026-07-11
