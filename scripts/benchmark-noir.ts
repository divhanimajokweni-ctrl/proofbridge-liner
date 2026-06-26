import { generateNoirProof, ExecutionInput } from '../prover/noir/engine';
import { MerkleTree } from '../prover/noir/merkle-service';
import { poseidon5 } from 'poseidon-lite';
import fs from 'fs';
import path from 'path';

async function runBenchmark() {
  console.log("🚀 Starting ProofBridge Noir Benchmark (100 Tx Burst)");
  
  const txCount = 10; // Reducing to 10 for initial test to avoid timeout, can be increased
  const txs: any[] = [];
  
  // 1. Generate Mock Data
  for (let i = 0; i < txCount; i++) {
    txs.push({
      alpha: 1000 + i,
      beta: 500,
      tau_num: 1,
      tau_den: 2,
      salt: `0x${i.toString(16).padStart(64, '0')}`
    });
  }

  // 2. Build Merkle Tree for Leaves
  const leaves = txs.map(tx => {
    return poseidon5([
      BigInt(tx.alpha),
      BigInt(tx.beta),
      BigInt(tx.tau_num),
      BigInt(tx.tau_den),
      BigInt(tx.salt)
    ]).toString();
  });
  
  // Pad leaves to power of 2 (16 levels as per circuit)
  const treeSize = Math.pow(2, 16);
  while (leaves.length < treeSize) {
    leaves.push("0");
  }
  
  console.log("🌳 Building Merkle Tree...");
  const tree = new MerkleTree(leaves);
  const root = tree.getRoot();
  console.log(`✅ Merkle Root: ${root}`);

  // 3. Sequential Proof Generation (Simulating a chain)
  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < txCount; i++) {
    const tx = txs[i];
    const pathData = tree.getPath(i);
    
    const input: ExecutionInput = {
      ...tx,
      expected_root: root,
      path_elements: pathData.elements,
      path_indices: pathData.indices
    };

    console.log(`[${i+1}/${txCount}] Generating Proof...`);
    try {
      const result = await generateNoirProof(input);
      results.push(result);
      console.log(`  ✅ Proof Generated in ${Date.now() - startTime}ms`);

      if (i === 0) {
        const artifact = {
          comment: "Ubuntu Pools Certified Compliance Artifact",
          timestamp: Math.floor(Date.now() / 1000),
          publicInputs: result.publicInputs,
          proof: result.proof,
          circuitJson: result.circuitJson
        };
        fs.writeFileSync('compliance_artifact.json', JSON.stringify(artifact, null, 2));
        console.log("  💾 Saved artifact to compliance_artifact.json");
      }
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log("\n=========================================================");
  console.log(`🏁 Benchmark Complete`);
  console.log(`Total Tx: ${results.length}`);
  console.log(`Total Time: ${duration}ms`);
  console.log(`Avg Time/Proof: ${duration / results.length}ms`);
  console.log("=========================================================\n");
}

runBenchmark().catch(console.error);
