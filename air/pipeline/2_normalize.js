/**
 * Pass 2: Normalize — Raw Payloads to Evidence IR
 *
 * Ingests raw collector outputs and maps them into the immutable Evidence IR
 * schema. Appends entries to the Evidence Store.
 *
 * This pass performs NO interpretation or confidence weighting.
 *
 * Usage: node air/pipeline/2_normalize.js
 * Input: JSON array from 1_collect.js (piped or from file)
 * Output: Count of normalized entries to stderr
 */

'use strict';

const { appendBatch } = require('./evidence-store');

function normalizePayloads(payloads) {
  return payloads.map(payload => ({
    collector: payload.collector,
    timestamp: new Date().toISOString(),
    artifact: payload.artifact,
    digest: payload.digest || '',
    status: payload.status || 'PENDING',
    metadata: payload.metadata || {},
  }));
}

function run(inputPayloads) {
  const payloads = inputPayloads || [];
  console.error(`[NORMALIZE] Processing ${payloads.length} raw payloads`);

  const normalized = normalizePayloads(payloads);
  const results = appendBatch(normalized);

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const pendingCount = results.filter(r => r.status === 'PENDING').length;

  console.error(`[NORMALIZE] Appended: ${results.length} entries (PASS: ${passCount}, FAIL: ${failCount}, PENDING: ${pendingCount})`);

  return results;
}

if (require.main === module) {
  let inputData = '';

  if (process.argv[2]) {
    const fs = require('fs');
    inputData = fs.readFileSync(process.argv[2], 'utf-8');
  } else {
    inputData = require('fs').readFileSync('/dev/stdin', 'utf-8');
  }

  try {
    const payloads = JSON.parse(inputData);
    const results = Array.isArray(payloads) ? payloads : [payloads];
    run(results);
  } catch (e) {
    console.error(`[NORMALIZE] Failed to parse input: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { normalizePayloads, run };
