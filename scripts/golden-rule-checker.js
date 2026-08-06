#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────
// golden-rule-checker.js — VVU EARTH TECH Boundary Enforcement
// AST scanner that checks open-source/ directory for product-specific
// strings. Enforces the Golden Rule: AIR is horizontal infrastructure
// — no product-specific code in open-source.
//
// USAGE:
//   node scripts/golden-rule-checker.js
//
// PREREQUISITES:
//   - Node.js 18+ installed
//   - open-source/ directory exists (created by other agents)
// ──────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCAN_DIR = path.join(PROJECT_ROOT, 'open-source');

// File extensions to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.rs', '.go'];

// Product-specific strings that MUST NOT appear in open-source code
// The Golden Rule: AIR is horizontal infrastructure — no product code here
const FORBIDDEN_STRINGS = [
  // Commercial products
  'ProofBridge',
  'Ubuntu Pools',
  'UbuntuPools',
  'SafeGrid',

  // Financial/regulatory domain-specific
  'Stokvel',
  'ROSCA',
  'FSCA',
  'FICA',
  'POPIA',

  // Internal tools / agent identifiers
  'kimi_reply',
  'vision_agent',
  'Hydro-Gateway',
  'HBK',
  'VVU EARTH TECH',
];

// ═══════════════════════════════════════════════════════════════
// STYLING UTILITIES
// ═══════════════════════════════════════════════════════════════

const BOX_WIDTH = 58;

function boxLine(text) {
  const pad = BOX_WIDTH - text.length - 2;
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return `║ ${' '.repeat(left)}${text}${' '.repeat(right)} ║`;
}

function printHeader() {
  console.log(`╔${'═'.repeat(BOX_WIDTH)}╗`);
  console.log(boxLine('VVU EARTH TECH — Golden Rule Checker'));
  console.log(boxLine('AIR is horizontal infrastructure.'));
  console.log(boxLine('No product-specific code in open-source.'));
  console.log(`╚${'═'.repeat(BOX_WIDTH)}╝`);
  console.log('');
}

function printSection(title) {
  const line = '─'.repeat(BOX_WIDTH + 2);
  console.log(`  ${title}`);
  console.log(`  ${line}`);
}

function printResult(passed, violationCount) {
  console.log('');
  console.log(`╔${'═'.repeat(BOX_WIDTH)}╗`);
  if (passed) {
    console.log(boxLine('✅  GOLDEN RULE COMPLIANT'));
    console.log(boxLine(''));
    console.log(boxLine('No forbidden strings detected.'));
    console.log(boxLine('open-source/ is clean.'));
  } else {
    console.log(boxLine('❌  GOLDEN RULE VIOLATIONS'));
    console.log(boxLine(''));
    console.log(boxLine(`${violationCount} violation(s) detected.`));
    console.log(boxLine('Remove product-specific code from'));
    console.log(boxLine('open-source/ before merging.'));
  }
  console.log(`╚${'═'.repeat(BOX_WIDTH)}╝`);
}

// ═══════════════════════════════════════════════════════════════
// SCANNING LOGIC
// ═══════════════════════════════════════════════════════════════

function recursivelyListFiles(dir, extensions) {
  const results = [];

  if (!fs.existsSync(dir)) {
    console.log(`  ⚠️  Directory does not exist: ${dir}`);
    console.log(`     Creating placeholder for future scans.`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .git, and hidden dirs
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
        continue;
      }
      results.push(...recursivelyListFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function scanFile(filePath) {
  const violations = [];
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const forbidden of FORBIDDEN_STRINGS) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const idx = line.indexOf(forbidden);
        if (idx !== -1) {
          // Skip if it appears in a comment explaining the golden rule
          // (i.e., the check script itself or governance docs mentioning the rule)
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) {
            // Allow mentions in comments that explicitly reference "forbidden" or "golden rule"
            if (trimmed.toLowerCase().includes('forbidden') ||
                trimmed.toLowerCase().includes('golden rule') ||
                trimmed.toLowerCase().includes('do not') ||
                trimmed.toLowerCase().includes('must not') ||
                trimmed.toLowerCase().includes('boundary')) {
              continue;
            }
          }

          violations.push({
            file: relativePath,
            line: i + 1,
            column: idx + 1,
            forbidden,
            context: line.trim().substring(0, 80),
          });
        }
      }
    }
  } catch (err) {
    console.log(`  ⚠️  Could not read file: ${relativePath} — ${err.message}`);
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

function main() {
  printHeader();

  // Step 1: Discover files to scan
  printSection('🔍 Scanning open-source/ directory');
  console.log(`  Target: ${SCAN_DIR}`);
  console.log(`  Extensions: ${SCAN_EXTENSIONS.join(', ')}`);
  console.log('');

  const files = recursivelyListFiles(SCAN_DIR, SCAN_EXTENSIONS);
  console.log(`  Found ${files.length} file(s) to scan`);
  console.log('');

  if (files.length === 0) {
    console.log('  ℹ️  No files found — open-source/ is empty or missing.');
    console.log('     This is acceptable if the directory has not been populated yet.');
    printResult(true, 0);
    process.exit(0);
  }

  // Step 2: Scan each file
  printSection('🔍 Checking for forbidden strings');
  console.log(`  Forbidden strings (${FORBIDDEN_STRINGS.length}):`);
  for (const s of FORBIDDEN_STRINGS) {
    console.log(`    • "${s}"`);
  }
  console.log('');

  const allViolations = [];

  for (const file of files) {
    const violations = scanFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
    }
  }

  // Step 3: Report results
  printSection('📋 Scan Results');

  if (allViolations.length === 0) {
    console.log('  ✅ All files are compliant — no forbidden strings found');
    for (const file of files) {
      console.log(`    ✅ ${path.relative(PROJECT_ROOT, file)}`);
    }
    printResult(true, 0);
    process.exit(0);
  } else {
    console.log(`  ❌ Found ${allViolations.length} violation(s):`);
    console.log('');
    for (const v of allViolations) {
      console.log(`    ❌ ${v.file}:${v.line}:${v.column}`);
      console.log(`       Forbidden: "${v.forbidden}"`);
      console.log(`       Context:   ${v.context}`);
      console.log('');
    }

    // Group violations by forbidden string
    console.log('  Violation Summary by String:');
    const byString = {};
    for (const v of allViolations) {
      if (!byString[v.forbidden]) byString[v.forbidden] = [];
      byString[v.forbidden].push(v);
    }
    for (const [str, viols] of Object.entries(byString)) {
      console.log(`    • "${str}" — ${viols.length} occurrence(s) in ${new Set(viols.map(v => v.file)).size} file(s)`);
    }

    printResult(false, allViolations.length);
    process.exit(1);
  }
}

main();
