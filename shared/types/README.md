# Shared Types

**License:** Apache 2.0 (shared type definitions)
**Tier:** Shared — Cross-Tier Type Definitions

## Purpose

The `shared/types` module provides a single, canonical re-export point for all
core type definitions used across the VVU EARTH TECH platform. All types
originate from `src/lib/kernel/types.ts` — the definitive type definition file
for the Epistemic DAG Runtime.

### Why Re-export?

Having a shared types module ensures:
1. **Single source of truth** — all modules reference the same type definitions
2. **Clean dependency graph** — commercial modules import from `shared/types`, not directly from `src/`
3. **Version consistency** — type changes propagate automatically to all consumers
4. **Documentation clarity** — each module can reference `shared/types` as its type dependency

### Type Categories

| Category | Types |
|----------|-------|
| Primitive Kinds | `PrimitiveKind`, `FactType`, `Severity`, `PolicyResult`, `EvidenceState` |
| Authorization | `Capability`, `CapabilitySet`, `ObservationAuthMethod`, `ObservationAuth` |
| Provenance | `AutomationProvenance`, `ProvenancedBody` |
| Core Data | `Fact`, `Proof`, `PolicyRule`, `PolicyOpcode`, `Projection`, `ProjectionManifest` |
| Evidence | `EvidenceEnvelope`, `AcceptanceResult` |
| Runtime | `RuntimeProviders`, `ClockProvider`, `EntropyProvider`, `UuidProvider`, `SignerProvider`, `StorageProvider` |
| MMR | `MMRNode`, `MMRProof` |
| Schema & Config | `SchemaDefinition`, `KernelConfig` |
| Verification | `VerificationAssertion`, `ReplayVerification`, `ReplayCertificate`, `ObservationAdapter` |
| License | `LicenseTier`, `LicensePayload`, `SignedLicense`, `LicenseValidationResult` |

### Usage

```typescript
import type { Fact, Proof, LicenseTier } from 'shared/types';
```
