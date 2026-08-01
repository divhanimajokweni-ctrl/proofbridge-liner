/**
 * prover/pipeline.js
 * ----------------------------------------------------------
 * Orchestrator for the off-chain prover pipeline.
 */

const { runOnce: fetchAssets } = require('./fetcher');
const { attestActions, planActions } = require('./submitter');
const { broadcast } = require('./broadcaster');

async function runPipeline() {
  console.log('Starting Prover Pipeline...');

  try {
    // Phase 1: Fetch and Score (fetcher calls scorer internally)
    console.log('Phase 1: Fetching asset status...');
    const state = await fetchAssets();
    
    // Phase 2: Plan
    console.log('Phase 2: Planning actions...');
    const actions = planActions(state);
    
    if (actions.length > 0) {
      console.log(`Found ${actions.length} actions to perform.`);
      
      // Phase 3: Attest
      console.log('Phase 3: Attesting actions...');
      await attestActions(actions, state);

      // CHAOS POINT: Post-Attestation / Pre-Broadcast
      if (process.env.CHAOS_MODE === 'post-attestation-crash') {
        console.error('[Chaos] Injecting post-attestation failure.');
        process.exit(1);
      }
      
      // Phase 4: Broadcast
      console.log('Phase 4: Broadcasting to chain (dry-run)...');
      await broadcast({ dryRun: true });

      // CHAOS POINT: Mid-Broadcast
      if (process.env.CHAOS_MODE === 'mid-broadcast-interrupt') {
        console.error('[Chaos] Injecting mid-broadcast failure.');
        process.exit(1);
      }
    } else {
      console.log('No actions required. System healthy.');
    }

    console.log('Pipeline execution complete.');
  } catch (error) {
    console.error('Pipeline failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runPipeline().catch(console.error);
}
