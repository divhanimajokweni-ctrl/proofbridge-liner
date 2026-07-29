const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).argv;

const EXPECTED_OUTCOME = {
  'worker-crash': { mustRetry: true, mustAlert: true, mustRollback: false },
  'redis-down': { mustRetry: true, mustAlert: true, mustRollback: true },
  'db-failure': { mustAbort: true, mustAlert: true }
};

const scenarios = {
  'worker-crash': () => {
    console.log('[Chaos] Crashing worker pods...');
    execSync("kubectl delete pod -l app=proofbridge-worker");
  },
  'redis-down': () => {
    console.log('[Chaos] Scaling Redis cluster to 0...');
    execSync("kubectl scale statefulset redis-cluster --replicas=0");
  },
  'db-failure': () => {
    console.log('[Chaos] Injecting DB connection drop...');
    execSync("kubectl exec deployment/api-deployment -- iptables -A OUTPUT -p tcp --dport 5432 -j DROP");
  }
};

const scenario = argv.scenario;
if (scenarios[scenario]) {
  console.log(`[Chaos] Executing scenario: ${scenario}, Expected outcome:`, EXPECTED_OUTCOME[scenario]);
  scenarios[scenario]();
} else {
  console.error(`Scenario ${scenario} not found. Available: ${Object.keys(scenarios).join(', ')}`);
  process.exit(1);
}
