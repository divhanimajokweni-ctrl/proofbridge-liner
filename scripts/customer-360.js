#!/usr/bin/env node
/**
 * Wrapper: customer-360
 *
 * Usage:
 *   node scripts/customer-360.js user@example.com
 *   node scripts/customer-360.js --company AcmeCorp
 *   node scripts/customer-360.js --json user@example.com
 */

import { spawnSync } from 'node:child_process';

const script = new URL('customer-360/customer-360.mjs', import.meta.url).pathname;
const args = process.argv.slice(2);

if (!args.length) {
  console.error('Usage: node scripts/customer-360.js [--company] [--json] <email_or_company>');
  process.exit(1);
}

const result = spawnSync(process.execPath, [script, ...args], {
  stdio: ['inherit', 'inherit', 'inherit'],
  cwd: new URL('..', import.meta.url).pathname,
});

process.exit(result.status ?? 0);
