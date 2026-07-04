#!/usr/bin/env node
/**
 * Ant Feast — Test Runner
 * Executes all test suites for the plain JS modules.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  'test-raidtime.js',
  'test-sensory.js',
];

let allPassed = true;

console.log('='.repeat(56));
console.log('  ANT FEAST — PLAIN JS MODULE TESTS');
console.log('='.repeat(56));

for (const testFile of tests) {
  const testPath = path.join(__dirname, testFile);
  console.log(`\n\u25B6 Running: ${testFile}`);
  const result = spawnSync('node', [testPath], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  if (result.status !== 0) {
    allPassed = false;
  }
}

console.log(`\n${'='.repeat(56)}`);
if (allPassed) {
  console.log('  \u2705 ALL TESTS PASSED');
} else {
  console.log('  \u274C SOME TESTS FAILED');
}
process.exit(allPassed ? 0 : 1);
