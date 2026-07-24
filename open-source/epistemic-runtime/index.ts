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
// VVU EARTH TECH — Epistemic Runtime (Open Source, Apache 2.0)
// ============================================================================
//
// The Epistemic Runtime provides the core primitives for building trust-based
// systems: Facts, Proofs, Policies, Projections, and the Trust Runtime.
//
// This module re-exports runtime primitives from:
//   - src/lib/kernel/          — core kernel (AIR Kernel)
//   - src/lib/trust-runtime/   — Bayesian confidence scoring, verification gates
//   - src/lib/evidence/        — evidence envelope pipeline, AIR envelope engine
// ============================================================================

// Core kernel primitives — Facts, Proofs, Policies, Projections, MMR, etc.
export * from '../../src/lib/kernel';

// Trust Runtime — confidence scoring, Bayesian inference, verification gates
export * from '../../src/lib/trust-runtime';

// Evidence envelope pipeline — execution envelopes, policy gates, AIR engine
export * from '../../src/lib/evidence';
