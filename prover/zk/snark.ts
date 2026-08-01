import { groth16 } from 'snarkjs';
import path from 'path';

export async function generateProof(input: any) {
  // Paths based on compiled output
  const wasmPath = path.join(process.cwd(), 'circuits/threshold_js/threshold.wasm');
  const zkeyPath = path.join(process.cwd(), 'circuits/threshold_final.zkey');

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  return { proof, publicSignals };
}
