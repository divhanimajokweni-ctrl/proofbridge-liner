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
// VVU EARTH TECH — Shared Protocols (Shared)
// ============================================================================
//
// Wire format definitions for cross-module and cross-service communication.
//
// STATUS: NOT IMPLEMENTED
// This module will define the binary and JSON wire formats for:
//   - Evidence envelope serialization
//   - MMR proof transmission
//   - License payload wire format
//   - SSE event format for Trust Runtime streaming
//   - Policy IR opcode binary encoding
//   - Cross-service observation adapter protocol
// ============================================================================

export const SharedProtocols = {
  name: 'shared-protocols',
  version: '0.0.1-placeholder',
  status: 'NOT_IMPLEMENTED',
  tier: 'shared',
};

/**
 * Wire format versioning.
 * All protocols follow a versioned encoding scheme.
 */
export const PROTOCOL_VERSION = 1;

/**
 * Supported wire formats.
 */
export type WireFormat = 'json' | 'binary' | 'cbor';

/**
 * Protocol envelope — wraps any payload with metadata for cross-service
 * transmission.
 *
 * STATUS: NOT IMPLEMENTED — placeholder for the actual wire format.
 */
export interface ProtocolEnvelope {
  /** Protocol version */
  version: number;
  /** Wire format used for encoding */
  format: WireFormat;
  /** SHA-256 hash of the payload (for integrity verification) */
  payloadHash: string;
  /** Payload type identifier */
  payloadType: string;
  /** Encoded payload bytes (JSON string, binary buffer, or CBOR buffer) */
  payload: string | Uint8Array;
  /** Sender identity */
  sender: string;
  /** Timestamp (epoch ms) */
  timestamp: number;
}

export function encodeEnvelope(): never {
  throw new Error(
    'NOT_IMPLEMENTED: shared-protocols wire format encoding is not yet implemented. ' +
    'This module will define binary and JSON wire formats for cross-service communication.'
  );
}

export function decodeEnvelope(): never {
  throw new Error(
    'NOT_IMPLEMENTED: shared-protocols wire format decoding is not yet implemented. ' +
    'This module will define binary and JSON wire formats for cross-service communication.'
  );
}
