# Task 6-8: Missing Deliverables Implementation

## Summary
Implemented three missing deliverables from the Execution Contract:

### 1. OperationalCollector (`src/lib/kernel/operational-collector.ts`)
- `ObservationSource` interface for pluggable external system collectors
- `OperationalCollector` class with registerSource/removeSource/collect/listSources
- Three built-in deterministic sources:
  - `GitSource` — git commit observations (config: repoPath + commits array)
  - `FileSystemSource` — file change observations (config: watchPaths + changes array)
  - `CISource` — CI/CD pipeline status observations (config: pipeline + runs array)
- All sources are READ-ONLY and DETERMINISTIC (no Date.now/Math.random)
- collect() submits through kernel.submit() → AcceptancePipeline (never writes directly)

### 2. state.sh (`scripts/state.sh`)
- Read-only projection client using curl + python3
- Subcommands: list, get <name>, watch <name>, root, verify, help
- Configurable via ER_BASE_URL and ER_WATCH_INTERVAL env vars
- Watch polls for stateHash changes

### 3. ProjectionRegistry (`src/lib/kernel/projection-registry.ts`)
- ProjectionMeta interface with lifecycle metadata
- register() returns { meta, fact } — fact payload for pipeline submission
- deprecate() returns { meta, fact } — fact payload for pipeline submission
- History tracking, active/deprecated queries, reset for replay
- Separation from ProjectionEngine: registry=bookkeeping, engine=computation

### Exports Updated
- `src/lib/kernel/index.ts` now exports projection-registry and operational-collector

### Verification
- Lint: 0 errors, 0 warnings
