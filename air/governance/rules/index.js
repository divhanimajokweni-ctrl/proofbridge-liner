/**
 * Governance Rule Registry
 *
 * Loads all pluggable rule modules from this directory.
 * Each rule module must export: { name, description, evaluate(inferences) }
 */

'use strict';

const fs = require('fs');
const path = require('path');

function loadAllRules() {
  const rulesDir = __dirname;
  const ruleFiles = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.js') && f !== 'index.js');

  const rules = [];
  for (const file of ruleFiles) {
    try {
      const ruleModule = require(path.join(rulesDir, file));
      if (ruleModule && ruleModule.name && typeof ruleModule.evaluate === 'function') {
        rules.push(ruleModule);
      }
    } catch (e) {
      console.error(`[RULE-REGISTRY] Failed to load ${file}: ${e.message}`);
    }
  }

  return rules;
}

module.exports = { loadAllRules };
