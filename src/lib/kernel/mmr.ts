// Epistemic Runtime v0.8 — Merkle Mountain Range
// Real MMR implementation. No binary Merkle trees. No FNV.

import { computeSHA256, hashPair } from './hashing';
import type { MMRNode, MMRProof } from './types';

/**
 * Merkle Mountain Range — append-only authenticated data structure.
 *
 * Properties:
 * - O(log n) inclusion proofs
 * - O(log n) root updates
 * - Append-only (no deletion, no mutation)
 * - Deterministic: same leaves → same root, always
 */
export class MerkleMountainRange {
  private nodes: MMRNode[] = [];
  private leafCount: number = 0;

  /**
   * Append a leaf (fact hash) to the MMR.
   * Returns the index of the new leaf.
   */
  append(factId: string, factHash: string): number {
    const index = this.nodes.length;
    const node: MMRNode = {
      index,
      hash: factHash,
      factId,
    };
    this.nodes.push(node);
    this.leafCount++;

    // If we completed a mountain, create parent nodes
    this.bagPeaks();

    return index;
  }

  /**
   * Get the current root hash.
   * Bag all peaks together.
   */
  getRoot(): string {
    if (this.nodes.length === 0) {
      return computeSHA256('empty_mmr');
    }

    const peaks = this.getPeaks();
    if (peaks.length === 1) {
      return peaks[0].hash;
    }

    // Bag peaks right-to-left (deterministic)
    let root = peaks[peaks.length - 1].hash;
    for (let i = peaks.length - 2; i >= 0; i--) {
      root = hashPair(peaks[i].hash, root);
    }
    return root;
  }

  /**
   * Generate an inclusion proof for a leaf.
   */
  getInclusionProof(leafIndex: number): MMRProof {
    if (leafIndex < 0 || leafIndex >= this.nodes.length) {
      throw new Error(`Invalid leaf index: ${leafIndex}`);
    }

    const peaks = this.getPeaks();
    const authPath: string[] = [];

    // Walk from leaf to peak, collecting sibling hashes
    let currentIdx = leafIndex;
    while (!this.isPeak(currentIdx)) {
      const sibling = this.getSibling(currentIdx);
      if (sibling !== null) {
        authPath.push(this.nodes[sibling].hash);
      }
      currentIdx = this.getParent(currentIdx);
      if (currentIdx >= this.nodes.length) break;
    }

    return {
      index: leafIndex,
      rootHash: this.getRoot(),
      authPath,
      peaks: peaks.map((p) => p.hash),
    };
  }

  /**
   * Verify an inclusion proof.
   */
  static verifyProof(proof: MMRProof, leafHash: string): boolean {
    // Walk the authentication path
    let currentHash = leafHash;
    for (const siblingHash of proof.authPath) {
      currentHash = hashPair(currentHash, siblingHash);
    }

    // Check if our computed hash matches one of the peaks
    if (!proof.peaks.includes(currentHash)) {
      return false;
    }

    // Verify peak bagging produces the root
    if (proof.peaks.length === 1) {
      return proof.rootHash === proof.peaks[0];
    }

    let root = proof.peaks[proof.peaks.length - 1];
    for (let i = proof.peaks.length - 2; i >= 0; i--) {
      root = hashPair(proof.peaks[i], root);
    }
    return root === proof.rootHash;
  }

  /**
   * Get all peak nodes.
   */
  getPeaks(): MMRNode[] {
    if (this.nodes.length === 0) return [];

    const peaks: MMRNode[] = [];
    let pos = 0;

    // Find peaks by walking the mountain structure
    // Peaks are at positions determined by the binary representation
    let remaining = this.nodes.length;
    while (remaining > 0) {
      // Find the largest mountain that fits
      let height = Math.floor(Math.log2(remaining + 1));
      // Adjust: the mountain at this height has 2^height - 1 nodes
      const mountainSize = (1 << height) - 1;
      if (mountainSize > remaining) {
        height--;
      }
      const actualSize = (1 << height) - 1;

      // Peak of this mountain is at the last node of the mountain
      const peakIndex = pos + actualSize - 1;
      peaks.push(this.nodes[peakIndex]);

      pos += actualSize;
      remaining -= actualSize;
    }

    return peaks;
  }

  /**
   * Check if an index is a peak.
   */
  private isPeak(index: number): boolean {
    return this.getPeaks().some((p) => p.index === index);
  }

  /**
   * Get the sibling index for a given node.
   */
  private getSibling(index: number): number | null {
    // In an MMR, the sibling depends on whether the node is a left or right child
    // Left child: sibling is index + 1
    // Right child: sibling is index - 1
    // Parent is always the right child's index + 1

    // For simplicity, use the fact that parent = right_child_index + 1
    // and left_child = right_child_index - 1
    // We need to determine if this is a left or right child

    // A node is a right child if index + 1 is a parent
    // and it's a left child if index - 1 is a sibling pair

    // Simplified: check if index-1 forms a valid pair
    if (index > 0 && this.isParentOf(index - 1, index)) {
      return index - 1; // We're the right child, sibling is left
    }
    if (index < this.nodes.length - 1 && this.isParentOf(index, index + 1)) {
      return index + 1; // We're the left child, sibling is right
    }
    return null;
  }

  private isParentOf(leftIdx: number, rightIdx: number): boolean {
    // Check if leftIdx and rightIdx form a valid pair with a parent
    const parentIdx = rightIdx + 1;
    return parentIdx < this.nodes.length;
  }

  private getParent(index: number): number {
    if (index > 0 && this.isParentOf(index - 1, index)) {
      return index + 1; // Right child's index + 1
    }
    return index + 2; // Left child: parent is right_child + 1
  }

  /**
   * Bag peaks after append. Creates parent nodes for completed mountains.
   */
  private bagPeaks(): void {
    // After appending a leaf, check if we completed a mountain level
    // and need to create parent nodes
    while (this.shouldCreateParent()) {
      const rightIdx = this.nodes.length - 1;
      const leftIdx = rightIdx - 1;
      const parentHash = hashPair(
        this.nodes[leftIdx].hash,
        this.nodes[rightIdx].hash
      );
      this.nodes.push({
        index: this.nodes.length,
        hash: parentHash,
      });
    }
  }

  private shouldCreateParent(): boolean {
    const n = this.nodes.length;
    if (n < 2) return false;

    // Check if the last two nodes are a pair that should have a parent
    // This happens when the last node's index + 1 would be the parent
    // and both children are leaf or internal nodes at the same level

    // Simple heuristic: check if n+1 is a power of 2 minus 1
    // which indicates a complete binary tree
    const leftIdx = n - 2;
    const rightIdx = n - 1;

    // Nodes at the same level can be paired
    return this.nodeLevel(leftIdx) === this.nodeLevel(rightIdx);
  }

  private nodeLevel(index: number): number {
    // Calculate the level (height from bottom) of a node
    let level = 0;
    let idx = index;
    while (idx > 0) {
      // If this node is a parent (right child + 1), it's one level higher
      const rightChild = idx - 1;
      const leftChild = rightChild - 1;
      if (leftChild >= 0 && this.nodes[leftChild] && this.nodes[rightChild]) {
        // This might be a parent
        level++;
        idx = leftChild; // Continue checking up
      } else {
        break;
      }
    }
    return level;
  }

  /**
   * Get the number of leaves.
   */
  get size(): number {
    return this.leafCount;
  }

  /**
   * Get all nodes (for debugging/testing).
   */
  getNodes(): MMRNode[] {
    return [...this.nodes];
  }

  /**
   * Reset the MMR (for replay).
   */
  reset(): void {
    this.nodes = [];
    this.leafCount = 0;
  }
}
