/**
 * Seed the AIR Evidence Store with existing evidence files.
 * Run once: node air/pipeline/seed-evidence.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { append } = require('./evidence-store');

const EVIDENCE_DIR = path.join(__dirname, '..', '..', 'evidence');

function seed() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    console.error('[SEED] No evidence/ directory found — nothing to migrate');
    return;
  }

  const files = fs.readdirSync(EVIDENCE_DIR).filter(f => f.endsWith('.json'));
  console.error(`[SEED] Found ${files.length} evidence files to migrate`);

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, file), 'utf-8'));

    const entry = {
      collector: 'validation-run',
      timestamp: raw.timestamp,
      artifact: `evidence/${file}`,
      digest: raw.signature || '',
      status: raw.summary && raw.summary.failed === 0 ? 'PASS' : 'FAIL',
      metadata: {
        runId: raw.runId,
        constitutionVersion: raw.constitutionVersion,
        commit: raw.commit,
        summary: raw.summary,
        results: raw.results,
      },
    };

    append(entry);
  }

  console.error('[SEED] Migration complete');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
