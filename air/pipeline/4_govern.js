/**
 * Pass 4: Govern — Inference IR to Governance Decisions
 *
 * Evaluates the complete Inference IR block against all pluggable constitutional
 * rule modules. Rules assess whole capability matrices — no gating on single
 * disjointed observations.
 *
 * Usage: node air/pipeline/4_govern.js
 * Input: Inference IR JSON from 3_infer.js (piped or from file)
 * Output: Array of governance decisions to stdout
 */

'use strict';

const path = require('path');
const fs = require('fs');

const RULES_DIR = path.join(__dirname, '..', 'governance', 'rules');

/**
 * Load all rule modules from the governance/rules/ directory.
 */
function loadRules() {
  const ruleFiles = fs.readdirSync(RULES_DIR)
    .filter(f => f.endsWith('.js') && f !== 'index.js');

  const rules = [];
  for (const file of ruleFiles) {
    try {
      const ruleModule = require(path.join(RULES_DIR, file));
      if (ruleModule && ruleModule.name && typeof ruleModule.evaluate === 'function') {
        rules.push(ruleModule);
      }
    } catch (e) {
      console.error(`[GOVERN] Failed to load rule ${file}: ${e.message}`);
    }
  }

  return rules;
}

/**
 * Evaluate all rules against the inference block.
 */
function governAll(inferences) {
  const rules = loadRules();
  console.error(`[GOVERN] Loaded ${rules.length} governance rule modules`);

  const decisions = [];

  for (const rule of rules) {
    const result = rule.evaluate(inferences);
    decisions.push({
      ruleId: rule.name,
      ruleDescription: rule.description || '',
      conclusion: result.conclusion,
      reason: result.reason || '',
      affectedCapabilities: result.affectedCapabilities || [],
      evaluatedAt: new Date().toISOString(),
    });

    const icon = result.conclusion === 'PASS' ? '✅' : '❌';
    console.error(`[GOVERN] ${icon} ${rule.name}: ${result.conclusion}`);
  }

  return decisions;
}

if (require.main === module) {
  let inputData = '';

  if (process.argv[2]) {
    inputData = fs.readFileSync(process.argv[2], 'utf-8');
  } else {
    inputData = fs.readFileSync('/dev/stdin', 'utf-8');
  }

  try {
    const inferences = JSON.parse(inputData);
    const block = Array.isArray(inferences) ? inferences : [inferences];
    const decisions = governAll(block);
    process.stdout.write(JSON.stringify(decisions, null, 2));
  } catch (e) {
    console.error(`[GOVERN] Failed to process input: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { governAll, loadRules };
