# Task 3 — OperationalCollector Strengthening

## Summary
Strengthened the OperationalCollector with versioning, capabilities, authentication, correlation support, and adapter integration per the §1–§10 architectural strengthening recommendations.

## Changes Made

### File: `/home/z/my-project/src/lib/kernel/operational-collector.ts`

**1. ObservationSource Interface — Expanded (§1, §2, §3, §7)**
- Added `producer: string` and `producerVersion: string` fields to the interface
- Expanded `collect()` return type to include:
  - `schemaId: string` and `schemaVersion: number` (§1 — Observation Versioning)
  - `capabilities: CapabilitySet` (§2 — Capability Sets)
  - `auth: ObservationAuth` (§7 — Observation Authentication)
  - `causationId?: string`, `correlationId?: string`, `parentFactId?: string` (§3 — Correlation Graph)

**2. Built-in Sources — Updated**
- **GitSource**: `producer='GitSource'`, `producerVersion='1.0'`, capabilities=['automation.review'], auth={method:'internal', identity:'git-source'}, correlationId=`git-branch-{branch}`
- **FileSystemSource**: `producer='FileSystemSource'`, `producerVersion='1.0'`, capabilities=['automation.review', 'automation.fix'], auth={method:'internal', identity:'fs-source'}, correlationId=`fs-watch-{paths}`
- **CISource**: `producer='CISource'`, `producerVersion='1.0'`, capabilities=['automation.deploy', 'automation.review'], auth={method:'internal', identity:'ci-source'}, causationId=`git-commit-{hash}`, correlationId=`ci-pipeline-{pipeline}`

**3. OperationalCollector.collect() — Enhanced**
- Enriches observation body with versioning, capabilities, auth, and correlation metadata before submitting through the pipeline
- Uses observation's own `schemaId` instead of the generic `schema-${type}-v1` format
- Preserves backward compatibility — all existing functionality intact

**4. collectFromAdapter() — New Method (§10)**
- Added `collectFromAdapter(adapter: ObservationAdapter, event: unknown, kernel: RuntimeKernel): Promise<AcceptanceResult>`
- Vendor-neutral entry point — ER never knows about specific external systems
- Enriches adapter output with versioning defaults (schemaId, schemaVersion, producer, producerVersion)
- Passes adapter capabilities and auth through to the pipeline
- submittedBy uses `adapter:{sourceSystem}` format

**5. Imports — Updated**
- Added imports: `ObservationAuth`, `ObservationAuthMethod`, `CapabilitySet`, `ObservationAdapter` from types
- Removed unused `Capability` import

## Verification
- **Lint**: 0 errors, 0 warnings (verified with `bun run lint`)
- **Dev server**: Stable, no compilation errors
- **Backward compatibility**: All existing ObservationSource, GitSource, FileSystemSource, CISource, OperationalCollector APIs preserved with expanded return types

## Design Decisions
- Each source embeds versioning metadata in both the observation body AND the top-level fields, ensuring the acceptance pipeline can access it during policy evaluation AND it gets stored in the Fact record
- Adapter-based collection provides defaults for missing versioning fields, ensuring every fact in the log carries complete provenance
- Auth uses `internal` method for built-in sources since they operate within the ER trust boundary
- CISource includes `causationId` linking CI runs to their git commits — this is the first built-in source with a non-undefined causationId, demonstrating correlation graph usage
