import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import path from 'path';
import fs from 'fs';

export interface ExecutionInput {
  alpha: number;
  beta: number;
  tau_num: number;
  tau_den: number;
  salt: string;
  expected_root: string;
  path_elements: string[];
  path_indices: boolean[];
}

export async function generateNoirProof(input: ExecutionInput, recursive: boolean = false) {
  // Load pre-compiled circuit artifacts generated via 'nargo compile'
  const circuitPath = path.join(process.cwd(), 'circuits/threshold_merkle/target/threshold_merkle.json');
  const circuitCircuitText = fs.readFileSync(circuitPath, 'utf8');
  const circuitJson = JSON.parse(circuitCircuitText);

  // Spin up the fast native WASM constraint backend
  const backend = new BarretenbergBackend(circuitJson);
  const noir = new Noir(circuitJson);

  // Cast standard JavaScript primitives safely into the Noir execution context
  const witnessInput = {
    expected_root: input.expected_root,
    alpha: `0x${input.alpha.toString(16)}`,
    beta: `0x${input.beta.toString(16)}`,
    tau_num: `0x${input.tau_num.toString(16)}`,
    tau_den: `0x${input.tau_den.toString(16)}`,
    salt: input.salt,
    path_elements: input.path_elements,
    path_indices: input.path_indices,
  };

  // Execute non-blocking witness aggregation & proof generation
  const { witness } = await noir.execute(witnessInput);
  const proofResult = await (backend as any).generateProof(witness, { recursive });

  return {
    proof: Buffer.from(proofResult.proof).toString('hex'),
    publicInputs: proofResult.publicInputs,
    circuitJson
  };
}

export interface RecursiveExecutionInput {
  expected_root: string;
  proof_1: string[];
  public_inputs_1: string[];
  vk_1: string[];
  key_hash_1: string;
  proof_2: string[];
  public_inputs_2: string[];
  vk_2: string[];
  key_hash_2: string;
}

export async function generateRecursiveProof(input: RecursiveExecutionInput) {
  const circuitPath = path.join(process.cwd(), 'circuits/recursive_aggregator/target/recursive_aggregator.json');
  const circuitJson = JSON.parse(fs.readFileSync(circuitPath, 'utf8'));

  const backend = new BarretenbergBackend(circuitJson);
  const noir = new Noir(circuitJson);

  const witnessInput = {
    expected_root: input.expected_root,
    verification_key_1: input.vk_1,
    proof_1: input.proof_1,
    public_inputs_1: input.public_inputs_1,
    key_hash_1: input.key_hash_1,
    verification_key_2: input.vk_2,
    proof_2: input.proof_2,
    public_inputs_2: input.public_inputs_2,
    key_hash_2: input.key_hash_2,
  };

  console.log("    [engine:recursive] Executing witness generation...");
  const { witness } = await noir.execute(witnessInput);
  console.log("    [engine:recursive] Witness generation complete. Generating proof...");
  const proofResult = await backend.generateProof(witness);
  console.log("    [engine:recursive] Proof generation complete.");

  return {
    proof: Buffer.from(proofResult.proof).toString('hex'),
    publicInputs: proofResult.publicInputs,
    circuitJson
  };
}

export async function getVerificationKey(circuitJson: any) {
  const backend = new BarretenbergBackend(circuitJson);
  const vk = await backend.getVerificationKey();
  const fields: string[] = [];
  for (let i = 0; i < vk.length; i += 32) {
    const field = BigInt(`0x${Buffer.from(vk.slice(i, i + 32)).toString('hex')}`);
    fields.push(`0x${(field % 21888242871839275222246405745257275088548364400416034343698204186575808495617n).toString(16)}`);
  }
  return fields;
}

export function proofToFields(proofHex: string) {
  const proof = Buffer.from(proofHex, 'hex');
  const fields: string[] = [];
  for (let i = 0; i < proof.length; i += 32) {
    const field = BigInt(`0x${proof.slice(i, i + 32).toString('hex')}`);
    fields.push(`0x${(field % 21888242871839275222246405745257275088548364400416034343698204186575808495617n).toString(16)}`);
  }
  return fields;
}
