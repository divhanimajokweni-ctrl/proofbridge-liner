import { generateNoirProof, generateRecursiveProof, getVerificationKey, proofToFields, ExecutionInput, RecursiveExecutionInput } from '../prover/noir/engine';
import { MerkleTree } from '../prover/noir/merkle-service';
import { poseidon5 } from 'poseidon-lite';
import fs from 'fs';
import path from 'path';

async function runRecursiveBenchmark() {
  console.log("🚀 Starting ProofBridge Recursive Noir Benchmark");
  
  // 1. Generate 2 Leaf Proofs
  const txs = [
    { alpha: 1000, beta: 500, tau_num: 1, tau_den: 2, salt: "0x0" },
    { alpha: 1100, beta: 500, tau_num: 1, tau_den: 2, salt: "0x1" }
  ];

  const leaves = txs.map(tx => {
    return poseidon5([BigInt(tx.alpha), BigInt(tx.beta), BigInt(tx.tau_num), BigInt(tx.tau_den), BigInt(tx.salt)]).toString();
  });
  
  // Pad leaves to 2^4
  const treeSize = Math.pow(2, 4);
  const paddedLeaves = [...leaves];
  while (paddedLeaves.length < treeSize) paddedLeaves.push("0");
  
  const tree = new MerkleTree(paddedLeaves);
  const root = tree.getRoot();

  console.log("📄 Generating Leaf Proofs...");
  const leafResults = [];
  for (let i = 0; i < 2; i++) {
    const pathData = tree.getPath(i);
    const input: ExecutionInput = {
      ...txs[i],
      expected_root: root,
      path_elements: pathData.elements,
      path_indices: pathData.indices
    };
    const result = await generateNoirProof(input, true);
    leafResults.push(result);
    console.log(`  ✅ Leaf Proof ${i+1} generated.`);
  }

  // 2. Aggregate Leaf Proofs into 1 Recursive Proof
  console.log("🔁 Aggregating Proofs Recursively...");
  
  const vk = await getVerificationKey(leafResults[0].circuitJson);
  const proofFields = proofToFields(leafResults[0].proof);
  console.log(`  🔍 VK Length: ${vk.length}`);
  console.log(`  🔍 Proof Length (Fields): ${proofFields.length}`);
  
  const recursiveInput: RecursiveExecutionInput = {
    expected_root: root,
    vk_1: vk,
    proof_1: proofFields,
    public_inputs_1: leafResults[0].publicInputs,
    key_hash_1: "0",
    vk_2: vk,
    proof_2: proofToFields(leafResults[1].proof),
    public_inputs_2: leafResults[1].publicInputs,
    key_hash_2: "0"
  };

  const startTime = Date.now();
  try {
    const finalProof = await generateRecursiveProof(recursiveInput);
    console.log(`\n✅ RECURSIVE PROOF GENERATED in ${Date.now() - startTime}ms`);
    console.log(`Public Root: ${finalProof.publicInputs[0]}`);
    
    // Save for verification
    const artifact = {
      comment: "ProofBridge Recursive Audit Certificate",
      timestamp: Math.floor(Date.now() / 1000),
      proof: finalProof.proof,
      publicInputs: finalProof.publicInputs,
      circuitJson: finalProof.circuitJson
    };
    fs.writeFileSync('recursive_audit_certificate.json', JSON.stringify(artifact, null, 2));
    console.log("💾 Saved artifact to recursive_audit_certificate.json");

  } catch (err: any) {
    console.error(`❌ Recursive Proof Failed: ${err.message}`);
  }
}

runRecursiveBenchmark().catch(console.error);
