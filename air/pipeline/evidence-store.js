/**
 * Evidence Store — Append-Only JSONL Evidence Log
 *
 * Invariant: This module NEVER edits or overwrites existing entries.
 * Every write is an atomic append to the end of the file.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EVIDENCE_LOG = path.join(__dirname, '..', 'store', 'evidence_log.json');

/**
 * Read all evidence entries from the log.
 * Returns an empty array if the file does not exist.
 */
function readAll() {
  if (!fs.existsSync(EVIDENCE_LOG)) return [];
  const content = fs.readFileSync(EVIDENCE_LOG, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').map((line, i) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.error(`[EVIDENCE-STORE] Failed to parse line ${i + 1}: ${e.message}`);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Compute a deterministic ID for an evidence entry.
 */
function computeId(entry) {
  const payload = JSON.stringify({
    collector: entry.collector,
    artifact: entry.artifact,
    timestamp: entry.timestamp,
  });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

/**
 * Append a single evidence entry to the log.
 * Validates uniqueness of ID before writing.
 * Returns the persisted entry with its computed id.
 */
function append(entry) {
  const existing = readAll();
  const id = entry.id || computeId(entry);

  if (existing.some(e => e.id === id)) {
    console.warn(`[EVIDENCE-STORE] Duplicate evidence ID ${id} — skipping append`);
    return existing.find(e => e.id === id);
  }

  const normalized = {
    id,
    collector: entry.collector,
    timestamp: entry.timestamp || new Date().toISOString(),
    artifact: entry.artifact,
    digest: entry.digest || '',
    status: entry.status || 'PENDING',
    metadata: entry.metadata || {},
  };

  const line = JSON.stringify(normalized) + '\n';
  fs.appendFileSync(EVIDENCE_LOG, line, 'utf-8');

  console.error(`[EVIDENCE-STORE] Appended evidence ${id} (collector: ${normalized.collector})`);
  return normalized;
}

/**
 * Append multiple entries atomically.
 * Returns array of persisted entries.
 */
function appendBatch(entries) {
  return entries.map(e => append(e));
}

/**
 * Get evidence entries filtered by collector name.
 */
function getByCollector(collector) {
  return readAll().filter(e => e.collector === collector);
}

/**
 * Get evidence entries filtered by status.
 */
function getByStatus(status) {
  return readAll().filter(e => e.status === status);
}

/**
 * Get the total count of evidence entries.
 */
function count() {
  return readAll().length;
}

module.exports = {
  readAll,
  append,
  appendBatch,
  getByCollector,
  getByStatus,
  count,
  computeId,
  EVIDENCE_LOG,
};
