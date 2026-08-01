const fs = require('fs');
const yaml = require('js-yaml');
const { spawn } = require('child_process');

const jurisdiction = process.env.JURISDICTION;
const manifest = yaml.load(fs.readFileSync('/app/jurisdiction-manifest.yaml', 'utf8'));

if (!manifest.jurisdictions[jurisdiction]) {
  console.error(`Unknown jurisdiction: ${jurisdiction}`);
  process.exit(1);
}

const entry = manifest.jurisdictions[jurisdiction];

if (entry.status === 'DEPRECATED') {
  console.error(`Jurisdiction ${jurisdiction} is DEPRECATED — refusing to start`);
  process.exit(1);
}

if (entry.agents.length === 0) {
  console.error(`Jurisdiction ${jurisdiction} has no agents configured — refusing to start`);
  process.exit(1);
}

function runGuarded(cmd, args) {
  const child = spawn(cmd, args, { stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${jurisdiction}] process exited ${code} — execution stopped`);
      process.exit(code);
    }
  });
}

switch (jurisdiction) {
  case 'proofbridge':
    runGuarded('npx', ['-y', 'kilo', '--config', 'kilo.json']);
    break;
  case 'lindiwe-openclaw':
    runGuarded('npx', ['-y', 'openclaw', 'start', '--config', 'openclaw.json']);
    break;
  default:
    console.error(`No entrypoint implemented for jurisdiction: ${jurisdiction}`);
    process.exit(1);
}
