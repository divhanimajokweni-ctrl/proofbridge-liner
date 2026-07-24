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
// VVU EARTH TECH — AIR Kernel (Open Source, Apache 2.0)
// ============================================================================
//
// The AIR Kernel is the horizontal infrastructure layer of the Epistemic DAG
// Runtime. It provides deterministic hashing, canonicalization, MMR proofs,
// acceptance pipeline, policy evaluation, projections, schema registry,
// sequencer, replay verification, observation adapters, and runtime providers.
//
// GOLDEN RULE: No product-specific logic lives here.
// The kernel is purely horizontal — it serves as the shared foundation for
// all VVU EARTH TECH products, both open-source and commercial.
// ============================================================================

export * from '../../src/lib/kernel';

// Decision 6 — Knowledge Graph, ADR Generator, Release Gate
export * from './knowledge-graph';
export * from './adr-generator';
export * from './release-gate';

// Decision 10 — Proof Package Generator (smart contract payload)
export * from './proof-package-generator';
