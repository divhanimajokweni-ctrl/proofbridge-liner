// packages/trust-crypto/src/merkle.ts
// ───────────────────────────────────────────────────────────────
// Merkle Tree Implementation
// For receipt verification and batch proofs
// ───────────────────────────────────────────────────────────────

import { sha256Hex, hashObject } from './hash';

/**
 * Merkle Tree Node
 */
export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  leafHash?: string; // Original leaf hash (for proof verification)
}

/**
 * Merkle Proof - path from leaf to root
 */
export interface MerkleProof {
  leafHash: string;
  leafIndex: number;
  path: MerkleProofStep[];
  rootHash: string;
}

export interface MerkleProofStep {
  side: 'left' | 'right';
  hash: string;
}

/**
 * Build Merkle tree from leaf hashes
 */
export function buildMerkleTree(leafHashes: string[]): MerkleNode {
  if (leafHashes.length === 0) {
    throw new Error('Cannot build Merkle tree with zero leaves');
  }
  
  if (leafHashes.length === 1) {
    return {
      hash: leafHashes[0],
      leafHash: leafHashes[0],
    };
  }
  
  // Pad to power of 2 if necessary
  const paddedLeaves = padToPowerOfTwo(leafHashes);
  
  const leaves: MerkleNode[] = paddedLeaves.map((hash) => ({
    hash,
    leafHash: leafHashes.indexOf(hash) !== -1 ? hash : undefined,
  }));
  
  return buildTreeFromLeaves(leaves);
}

/**
 * Pad array to next power of two
 */
function padToPowerOfTwo<T>(arr: T[]): T[] {
  const length = arr.length;
  if (length <= 1) return [...arr];
  
  const nextPower = Math.pow(2, Math.ceil(Math.log2(length)));
  const padded = [...arr];
  
  // Duplicate last element for padding (standard Merkle tree behavior)
  while (padded.length < nextPower) {
    padded.push(arr[arr.length - 1]);
  }
  
  return padded;
}

/**
 * Build tree from leaves recursively
 */
function buildTreeFromLeaves(leaves: MerkleNode[]): MerkleNode {
  if (leaves.length === 1) {
    return leaves[0];
  }
  
  const nextLevel: MerkleNode[] = [];
  
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = leaves[i + 1] || leaves[i]; // Duplicate if odd number
    
    const combinedHash = sha256Hex(left.hash + right.hash);
    
    nextLevel.push({
      hash: combinedHash,
      left,
      right,
    });
  }
  
  return buildTreeFromLeaves(nextLevel);
}

/**
 * Get Merkle root hash
 */
export function getMerkleRoot(tree: MerkleNode): string {
  return tree.hash;
}

/**
 * Generate Merkle proof for a specific leaf
 */
export function generateMerkleProof(
  tree: MerkleNode,
  leafHash: string
): MerkleProof | null {
  const path: MerkleProofStep[] = [];
  let current: MerkleNode | undefined = tree;
  let found = false;
  
  // Find the leaf and collect the path
  function findLeaf(node: MerkleNode, leafHash: string): boolean {
    // Check if this is the leaf
    if (node.leafHash === leafHash) {
      return true;
    }
    
    if (node.left && findLeaf(node.left, leafHash)) {
      // Found in left subtree, need right sibling for proof
      if (node.right) {
        path.push({ side: 'right', hash: node.right.hash });
      }
      return true;
    }
    
    if (node.right && findLeaf(node.right, leafHash)) {
      // Found in right subtree, need left sibling for proof
      if (node.left) {
        path.push({ side: 'left', hash: node.left.hash });
      }
      return true;
    }
    
    return false;
  }
  
  found = findLeaf(tree, leafHash);
  
  if (!found) {
    return null;
  }
  
  // Reverse the path (we collected from leaf to root, need root to leaf)
  path.reverse();
  
  return {
    leafHash,
    leafIndex: findLeafIndex(tree, leafHash),
    path,
    rootHash: tree.hash,
  };
}

/**
 * Find leaf index in the tree
 */
function findLeafIndex(node: MerkleNode, leafHash: string, index = 0): number {
  if (node.leafHash === leafHash) {
    return index;
  }
  
  if (node.left) {
    const leftResult = findLeafIndex(node.left, leafHash, index * 2);
    if (leftResult !== -1) return leftResult;
  }
  
  if (node.right) {
    const rightResult = findLeafIndex(node.right, leafHash, index * 2 + 1);
    if (rightResult !== -1) return rightResult;
  }
  
  return -1;
}

/**
 * Verify Merkle proof
 */
export function verifyMerkleProof(
  leafHash: string,
  leafIndex: number,
  path: MerkleProofStep[],
  rootHash: string
): boolean {
  let currentHash = leafHash;
  
  for (const step of path) {
    if (step.side === 'left') {
      currentHash = sha256Hex(step.hash + currentHash);
    } else {
      currentHash = sha256Hex(currentHash + step.hash);
    }
  }
  
  return currentHash === rootHash;
}

/**
 * Build Merkle tree from objects (auto-hash leaves)
 */
export function buildMerkleTreeFromObjects<T>(
  objects: T[],
  hashFn: (obj: T) => string = hashObject
): MerkleNode {
  const leafHashes = objects.map(hashFn);
  return buildMerkleTree(leafHashes);
}

/**
 * Generate Merkle proof for an object
 */
export function generateMerkleProofForObject<T>(
  tree: MerkleNode,
  obj: T,
  hashFn: (obj: T) => string = hashObject
): MerkleProof | null {
  const leafHash = hashFn(obj);
  return generateMerkleProof(tree, leafHash);
}

/**
 * Verify object inclusion in Merkle tree
 */
export function verifyObjectInMerkleTree<T>(
  obj: T,
  proof: MerkleProof,
  hashFn: (obj: T) => string = hashObject
): boolean {
  const leafHash = hashFn(obj);
  return verifyMerkleProof(leafHash, proof.leafIndex, proof.path, proof.rootHash);
}

// ───────────────────────────────────────────────────────────────
// Batch Merkle Utilities
// ───────────────────────────────────────────────────────────────

/**
 * Batch Merkle proof for multiple leaves
 */
export interface BatchMerkleProof {
  rootHash: string;
  proofs: MerkleProof[];
}

/**
 * Generate batch proof for multiple leaves
 */
export function generateBatchMerkleProof(
  tree: MerkleNode,
  leafHashes: string[]
): BatchMerkleProof {
  const proofs = leafHashes.map((hash) => {
    const proof = generateMerkleProof(tree, hash);
    if (!proof) {
      throw new Error(`Leaf hash ${hash} not found in tree`);
    }
    return proof;
  });
  
  return {
    rootHash: tree.hash,
    proofs,
  };
}

/**
 * Verify batch proof
 */
export function verifyBatchMerkleProof(
  batchProof: BatchMerkleProof
): boolean {
  return batchProof.proofs.every((proof) =>
    verifyMerkleProof(
      proof.leafHash,
      proof.leafIndex,
      proof.path,
      batchProof.rootHash
    )
  );
}
