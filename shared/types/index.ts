/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU EARTH TECH — Shared Types (Shared)
// ============================================================================
//
// Re-exports core types from the AIR Kernel for use across all modules
// (open-source, commercial, and shared). This provides a single, canonical
// source of truth for the type system.
//
// All types originate from src/lib/kernel/types.ts — the definitive type
// definition file for the Epistemic DAG Runtime.
// ============================================================================

// Core primitive types
export type {
  PrimitiveKind,
  FactType,
  Severity,
  PolicyResult,
  EvidenceState,
} from '../../src/lib/kernel/types';

// Capability & authorization types
export type {
  Capability,
  CapabilitySet,
  ObservationAuthMethod,
  ObservationAuth,
} from '../../src/lib/kernel/types';

// Provenance types
export type {
  AutomationProvenance,
  ProvenancedBody,
} from '../../src/lib/kernel/types';

// Core data structures
export type {
  Fact,
  Proof,
  PolicyRule,
  PolicyOpcode,
  Projection,
  ProjectionManifest,
  EvidenceEnvelope,
  AcceptanceResult,
} from '../../src/lib/kernel/types';

// Runtime infrastructure types
export type {
  RuntimeProviders,
  ClockProvider,
  EntropyProvider,
  UuidProvider,
  SignerProvider,
  StorageProvider,
} from '../../src/lib/kernel/types';

// MMR types
export type {
  MMRNode,
  MMRProof,
} from '../../src/lib/kernel/types';

// Schema & config types
export type {
  SchemaDefinition,
  KernelConfig,
} from '../../src/lib/kernel/types';

// Verification & replay types
export type {
  VerificationAssertion,
  ReplayVerification,
  ReplayCertificate,
  ObservationAdapter,
} from '../../src/lib/kernel/types';

// License types (from shared/license)
export type {
  LicenseTier,
  LicensePayload,
  SignedLicense,
  LicenseValidationResult,
} from '../license/license-schema';
