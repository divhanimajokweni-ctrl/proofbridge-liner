#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PATTERNS = [
  { label: 'Private Key Block', pattern: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/ },
  { label: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { label: 'SendGrid API Key', pattern: /SG\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}/ },
  { label: 'HuggingFace Token', pattern: /hf_[a-zA-Z0-9]{10,}/ },
  { label: 'Slack Webhook URL', pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9_\-]+/ },
  { label: 'Generic API Key', pattern: /(?:api[_-]?key|apikey|apiSecret|client_secret)\s*[:=]\s*(?:["']?[A-Za-z0-9_\-]{10,}["']?)/i },
  { label: 'Base64 Secret', pattern: /(?:SECRET|PASSWORD|TOKEN|KEY)\s*[:=]\s*(?:["']?[A-Za-z0-9+\/]{40,}={0,2}["']?)/i },
];

let failed = false;
try {
  const files = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const { label, pattern } of PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (pattern.test(line)) {
          console.log(`[SECRET-SCAN] ${rel}:${i + 1} (${label}): ${line.trim()}`);
          failed = true;
        }
      }
    }
  }
} catch {}

if (failed) {
  console.error('\n[SECRET-SCAN] Potential secrets detected in staged files. Review before committing.');
  process.exit(1);
}
console.log('[SECRET-SCAN] No obvious secret candidates detected in staged diff.');
process.exit(0);
