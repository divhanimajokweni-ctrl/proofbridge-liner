// @ts-nocheck
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
// VVU EARTH TECH — WAL Corruption Healing
// ============================================================================
//
// Auto-recovery from torn writes during power failure.
//
// WAL entries include both CRC32c and SHA-256 hashes for integrity
// verification. CRC32c detects torn writes (partial writes from power
// failure), SHA-256 provides cryptographic integrity for the evidence store.
//
// Operations:
// - validateWAL(entries): iterate entries, verify CRC32c + SHA-256,
//   find first corrupted entry
// - healWAL(entries): truncate corrupted tail, compute healing report
// - resyncFromLeader(healedEntries, leaderEntries): resync missing
//   data from Raft leader
//
// All operations produce WALHealingReport with SHA-256 hash for
// the evidence store.
//
// All timestamps from injected Clock provider (NOT Date.now()).
// ============================================================================

import { computeSHA256 } from '@/lib/kernel/hashing';
import { canonicalize } from '@/lib/kernel/canonicalization';
import type { ClockProvider } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// §1 — CRC32c Implementation
// ---------------------------------------------------------------------------

/**
 * CRC32c (Castagnoli) lookup table.
 * Used for detecting torn writes (partial writes from power failure).
 * CRC32c is preferred over CRC32 for its better error detection properties.
 */
const CRC32C_TABLE = buildCRC32cTable();

function buildCRC32cTable(): Uint32Array {
  const table = new Uint32Array(256);
  // CRC32c polynomial: 0x1EDC6F41 (Castagnoli)
  const poly = 0x82F63B78; // Reversed representation

  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ poly;
      } else {
        crc = crc >>> 1;
      }
    }
    table[i] = crc;
  }
  return table;
}

/**
 * Compute CRC32c (Castagnoli) checksum of a string.
 * Returns the checksum as a hex string (8 characters).
 */
export function computeCRC32c(data: string): string {
  const bytes = new TextEncoder().encode(data);
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32C_TABLE[(crc ^ bytes[i]) & 0xFF];
  }

  crc = crc ^ 0xFFFFFFFF;
  return (crc >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// §2 — WAL Entry Interface
// ---------------------------------------------------------------------------

/**
 * WAL (Write-Ahead Log) entry with dual integrity hashes.
 *
 * CRC32c: detects torn writes (partial writes from power failure)
 * SHA-256: cryptographic integrity for the evidence store
 */
export interface WALEntry {
  /** Monotonically increasing sequence number */
  sequence_number: number;
  /** Entry data (serialized) */
  data: string;
  /** CRC32c hash for torn write detection */
  crc32c_hash: string;
  /** SHA-256 hash for cryptographic integrity */
  sha256_hash: string;
  /** Timestamp from injected clock (NOT Date.now()) */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// §3 — WAL Validation Result
// ---------------------------------------------------------------------------

/**
 * Result of WAL validation.
 */
export interface WALValidationResult {
  /** Whether the entire WAL is valid */
  valid: boolean;
  /** Total number of entries in the WAL */
  totalEntries: number;
  /** Number of valid entries */
  validEntries: number;
  /** Index of the first corrupted entry (null if all valid) */
  firstCorruptedIndex: number | null;
  /** Sequence number of the first corrupted entry (null if all valid) */
  firstCorruptedSequence: number | null;
  /** Type of corruption detected */
  corruptionType: 'crc32c_mismatch' | 'sha256_mismatch' | 'none';
  /** Detailed error messages for each corrupted entry */
  errors: string[];
}

// ---------------------------------------------------------------------------
// §4 — WAL Healing Report
// ---------------------------------------------------------------------------

/**
 * Healing report produced after WAL corruption repair.
 * SHA-256 hash ensures tamper-evident evidence store entry.
 */
export interface WALHealingReport {
  /** Unique report identifier (SHA-256) */
  id: string;
  /** Number of entries before healing */
  originalEntryCount: number;
  /** Number of entries after healing (truncated) */
  healedEntryCount: number;
  /** Number of entries lost due to corruption */
  entriesLost: number;
  /** Sequence number of the last valid entry */
  lastValidSequence: number | null;
  /** First corrupted entry index */
  firstCorruptedIndex: number | null;
  /** Healing method used */
  healingMethod: 'truncate' | 'resync' | 'none';
  /** SHA-256 hash of the report for evidence store */
  hash: string;
  /** Timestamp from injected clock */
  timestamp: number;
  /** Whether healing was required */
  healingRequired: boolean;
}

// ---------------------------------------------------------------------------
// §5 — WAL Resync Result
// ---------------------------------------------------------------------------

/**
 * Result of resyncing healed WAL with leader entries.
 */
export interface WALResyncResult {
  /** Whether resync succeeded */
  success: boolean;
  /** Number of entries resynced from leader */
  entriesResynced: number;
  /** Total entries after resync */
  totalEntries: number;
  /** SHA-256 hash of the resynced WAL for verification */
  resyncedWalHash: string;
  /** SHA-256 hash of the resync report for evidence store */
  reportHash: string;
  /** Timestamp from injected clock */
  timestamp: number;
  /** Errors encountered during resync */
  errors: string[];
}

// ---------------------------------------------------------------------------
// §6 — WAL Corruption Healing Operations
// ---------------------------------------------------------------------------

/**
 * validateWAL(entries) — iterate entries, verify CRC32c + SHA-256,
 * find first corrupted entry.
 *
 * @param entries WAL entries to validate
 * @returns WALValidationResult with detailed validation information
 */
export function validateWAL(entries: WALEntry[]): WALValidationResult {
  const errors: string[] = [];
  let firstCorruptedIndex: number | null = null;
  let firstCorruptedSequence: number | null = null;
  let corruptionType: 'crc32c_mismatch' | 'sha256_mismatch' | 'none' = 'none';
  let validEntries = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check CRC32c — detects torn writes (partial writes from power failure)
    const expectedCRC32c = computeCRC32c(entry.data);
    if (entry.crc32c_hash !== expectedCRC32c) {
      errors.push(
        `Entry ${entry.sequence_number} (index ${i}): CRC32c mismatch — expected ${expectedCRC32c}, got ${entry.crc32c_hash}`,
      );
      if (firstCorruptedIndex === null) {
        firstCorruptedIndex = i;
        firstCorruptedSequence = entry.sequence_number;
        corruptionType = 'crc32c_mismatch';
      }
      continue;
    }

    // Check SHA-256 — cryptographic integrity
    const expectedSHA256 = computeSHA256(entry.data);
    if (entry.sha256_hash !== expectedSHA256) {
      errors.push(
        `Entry ${entry.sequence_number} (index ${i}): SHA-256 mismatch — expected ${expectedSHA256}, got ${entry.sha256_hash}`,
      );
      if (firstCorruptedIndex === null) {
        firstCorruptedIndex = i;
        firstCorruptedSequence = entry.sequence_number;
        corruptionType = 'sha256_mismatch';
      }
      continue;
    }

    // Verify sequence number monotonicity
    if (i > 0 && entry.sequence_number <= entries[i - 1].sequence_number) {
      errors.push(
        `Entry ${entry.sequence_number} (index ${i}): Sequence number not monotonically increasing (previous: ${entries[i - 1].sequence_number})`,
      );
      // Sequence monotonicity violations are not corruption per se,
      // but they indicate potential ordering issues
    }

    validEntries++;
  }

  return {
    valid: firstCorruptedIndex === null && errors.length === 0,
    totalEntries: entries.length,
    validEntries,
    firstCorruptedIndex,
    firstCorruptedSequence,
    corruptionType,
    errors,
  };
}

/**
 * healWAL(entries) — truncate corrupted tail, compute healing report.
 *
 * After identifying the first corrupted entry (from validateWAL),
 * all entries from that point onward are truncated. This is the
 * safe approach: any entry after corruption may also be corrupted
 * (torn write cascading).
 *
 * @param clock Injected Clock provider (NOT Date.now())
 * @param entries WAL entries to heal
 * @returns Tuple of [healed entries, healing report]
 */
export function healWAL(
  clock: ClockProvider,
  entries: WALEntry[],
): { healedEntries: WALEntry[]; report: WALHealingReport } {
  const validation = validateWAL(entries);

  if (validation.valid) {
    // No corruption — no healing required
    const reportObj = {
      originalEntryCount: entries.length,
      healedEntryCount: entries.length,
      entriesLost: 0,
      lastValidSequence: entries.length > 0 ? entries[entries.length - 1].sequence_number : null,
      firstCorruptedIndex: null,
      healingMethod: 'none',
      timestamp: clock.now(),
      healingRequired: false,
    };
    const id = computeSHA256(canonicalize(reportObj));
    const hash = computeSHA256(canonicalize(reportObj) + id);

    return {
      healedEntries: entries,
      report: {
        id,
        ...reportObj,
        hash,
      },
    };
  }

  // Truncate corrupted tail
  const truncationIndex = validation.firstCorruptedIndex!;
  const healedEntries = entries.slice(0, truncationIndex);
  const entriesLost = entries.length - truncationIndex;
  const lastValidSequence = healedEntries.length > 0
    ? healedEntries[healedEntries.length - 1].sequence_number
    : null;

  const reportObj = {
    originalEntryCount: entries.length,
    healedEntryCount: healedEntries.length,
    entriesLost,
    lastValidSequence,
    firstCorruptedIndex: validation.firstCorruptedIndex,
    healingMethod: 'truncate',
    timestamp: clock.now(),
    healingRequired: true,
  };
  const id = computeSHA256(canonicalize(reportObj));
  const hash = computeSHA256(canonicalize(reportObj) + id);

  return {
    healedEntries,
    report: {
      id,
      ...reportObj,
      hash,
    },
  };
}

/**
 * resyncFromLeader(healedEntries, leaderEntries) — resync missing data
 * from Raft leader after healing.
 *
 * After WAL healing truncates the corrupted tail, missing entries can
 * be recovered from the Raft leader's WAL. This function verifies
 * leader entries and appends them to the healed WAL.
 *
 * @param clock Injected Clock provider (NOT Date.now())
 * @param healedEntries Healed WAL entries (after truncation)
 * @param leaderEntries Leader WAL entries to resync from
 * @returns WALResyncResult with resynced WAL and verification hash
 */
export function resyncFromLeader(
  clock: ClockProvider,
  healedEntries: WALEntry[],
  leaderEntries: WALEntry[],
): WALResyncResult {
  const errors: string[] = [];

  // First validate leader entries
  const leaderValidation = validateWAL(leaderEntries);
  if (!leaderValidation.valid) {
    errors.push('Leader WAL contains corrupted entries — cannot resync');
    errors.push(...leaderValidation.errors);

    const reportObj = {
      success: false,
      entriesResynced: 0,
      totalEntries: healedEntries.length,
      resyncedWalHash: computeSHA256(canonicalize(healedEntries)),
      timestamp: clock.now(),
      errors,
    };
    const reportHash = computeSHA256(canonicalize(reportObj));

    return {
      success: false,
      entriesResynced: 0,
      totalEntries: healedEntries.length,
      resyncedWalHash: reportObj.resyncedWalHash,
      reportHash,
      timestamp: clock.now(),
      errors,
    };
  }

  // Find the last sequence number in healed entries
  const lastHealedSequence = healedEntries.length > 0
    ? healedEntries[healedEntries.length - 1].sequence_number
    : 0;

  // Filter leader entries that are newer than our last healed entry
  const resyncCandidates = leaderEntries.filter(
    e => e.sequence_number > lastHealedSequence,
  );

  // Verify each candidate entry before resyncing
  const verifiedCandidates: WALEntry[] = [];
  for (const entry of resyncCandidates) {
    const crcExpected = computeCRC32c(entry.data);
    const shaExpected = computeSHA256(entry.data);

    if (entry.crc32c_hash === crcExpected && entry.sha256_hash === shaExpected) {
      verifiedCandidates.push(entry);
    } else {
      errors.push(
        `Leader entry ${entry.sequence_number}: integrity check failed during resync`,
      );
    }
  }

  // Append verified candidates to healed entries
  const resyncedEntries = [...healedEntries, ...verifiedCandidates];
  const entriesResynced = verifiedCandidates.length;

  // Compute hash of the resynced WAL for verification
  const resyncedWalHash = computeSHA256(canonicalize(resyncedEntries.map(e => ({
    sequence_number: e.sequence_number,
    sha256_hash: e.sha256_hash,
    timestamp: e.timestamp,
  }))));

  const success = errors.length === 0 || entriesResynced > 0;

  const reportObj = {
    success,
    entriesResynced,
    totalEntries: resyncedEntries.length,
    resyncedWalHash,
    timestamp: clock.now(),
    errors,
  };
  const reportHash = computeSHA256(canonicalize(reportObj));

  return {
    success,
    entriesResynced,
    totalEntries: resyncedEntries.length,
    resyncedWalHash,
    reportHash,
    timestamp: clock.now(),
    errors,
  };
}

// ---------------------------------------------------------------------------
// §7 — WAL Entry Creation Helper
// ---------------------------------------------------------------------------

/**
 * Create a new WAL entry with computed CRC32c and SHA-256 hashes.
 *
 * @param clock Injected Clock provider (NOT Date.now())
 * @param sequenceNumber Monotonically increasing sequence number
 * @param data Entry data (will be hashed for integrity)
 * @returns WALEntry with computed integrity hashes
 */
export function createWALEntry(
  clock: ClockProvider,
  sequenceNumber: number,
  data: string,
): WALEntry {
  return {
    sequence_number: sequenceNumber,
    data,
    crc32c_hash: computeCRC32c(data),
    sha256_hash: computeSHA256(data),
    timestamp: clock.now(),
  };
}
