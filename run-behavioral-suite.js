#!/usr/bin/env node
/**
 * run-behavioral-suite.js
 * Orchestrates the full behavioral coverage test suite with SafeKrypte mock.
 *
 * Flow:
 *   1. Start SafeKrypte mock service on port 5096
 *   2. Wait for mock to be ready
 *   3. Execute npx tsx scripts/behavioral-coverage.ts
 *   4. Capture exit code
 *   5. Stop mock service
 *   6. Exit with same code as behavioral coverage
 */
const { spawn } = require('child_process');
const SafeKrypteServiceMock = require('./tests/mocks/SafeKrypteServiceMock');
const path = require('path');

async function main() {
  console.log('='.repeat(60));
  console.log('  BEHAVIORAL COVERAGE SUITE — WITH SafeKrypte MOCK');
  console.log('='.repeat(60));

  // 1. Start mock
  console.log('\n[1/3] Starting SafeKrypte mock service...');
  await SafeKrypteServiceMock.start();
  console.log('  -> Mock listening on port 5096');

  // 2. Run behavioral coverage
  console.log('\n[2/3] Running behavioral coverage tests...');
  const coverageScript = path.join(__dirname, 'scripts', 'behavioral-coverage.ts');

  const result = await new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', coverageScript], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        SAFE_KRIPTE_URL: 'http://localhost:5096',
        VVU_API_BASE: process.env.VVU_API_BASE || 'http://localhost:3000',
      },
    });

    child.on('close', (code) => resolve(code));
    child.on('error', reject);
  });

  // 3. Stop mock
  console.log(`\n[3/3] Stopping SafeKrypte mock service...`);
  SafeKrypteServiceMock.stop();

  // 4. Report
  console.log('\n' + '='.repeat(60));
  if (result === 0) {
    console.log('  ✅ ALL BEHAVIORAL COVERAGE TESTS PASSED (5/5)');
  } else if (result === 2) {
    console.log('  ⚠️  BEHAVIORAL COVERAGE: Partial (some SKIP, none FAIL)');
  } else {
    console.log('  ❌ BEHAVIORAL COVERAGE FAILED');
  }
  console.log('='.repeat(60));

  process.exit(result);
}

main().catch((err) => {
  console.error('Fatal error in behavioral suite runner:', err);
  SafeKrypteServiceMock.stop();
  process.exit(1);
});
