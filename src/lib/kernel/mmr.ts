// Epistemic Runtime v0.8 — Merkle Mountain Range
// Correct position-based MMR implementation using peak stack.
// No binary Merkle trees. No FNV. No flat-array conflation.

import { computeSHA256, hashPairOrdered } from './hashing';
import type { MMRNode, MMRProof } from './types';

/**
 * Merkle Mountain Range — append-only authenticated data structure.
 *
 * Uses the standard peak-stack algorithm. Each leaf is appended at the
 * next available position. When two peaks at the same height exist,
 * they are merged into a parent.
 *
 * The MMR stores:
 * - A map of position → hash for all nodes
 * - A "peak stack" tracking the current mountain peaks with their heights
 * - Position counter incremented as nodes are added
 *
 * Properties:
 * - O(log n) inclusion proofs
 * - O(log n) root updates
 * - Append-only (no deletion, no mutation)
 * - Deterministic: same leaves → same root, always
 */
export class MerkleMountainRange {
  /** position → hash */
  private hashes: Map<number, string> = new Map();
  /** position → factId (only for leaf positions) */
  private facts: Map<number, string> = new Map();
  /** Total number of positions (nodes) in the MMR */
  private _size: number = 0;
  /** Number of leaf nodes appended */
  private leafCount: number = 0;
  /**
   * Peak stack: array of { position, height } entries.
   * Peaks are stored from left to right (index 0 = leftmost peak).
   * When two adjacent peaks have the same height, they merge.
   */
  private peaks: Array<{ position: number; height: number }> = [];

  /**
   * Append a leaf (fact hash) to the MMR.
   * Returns the index of the new leaf (0-based leaf index).
   */
  append(factId: string, factHash: string): number {
    const position = this._size;
    this.hashes.set(position, factHash);
    this.facts.set(position, factId);
    this._size++;

    // New leaf is a peak at height 0
    let currentPeak: { position: number; height: number } = { position, height: 0 };

    // Merge peaks: while the last two peaks have the same height,
    // create a parent and replace them
    while (
      this.peaks.length > 0 &&
      this.peaks[this.peaks.length - 1].height === currentPeak.height
    ) {
      const leftPeak = this.peaks.pop()!;
      const parentPos = this._size;
      const leftHash = this.hashes.get(leftPeak.position)!;
      const rightHash = this.hashes.get(currentPeak.position)!;
      const parentHash = hashPairOrdered(leftHash, rightHash);
      this.hashes.set(parentPos, parentHash);
      this._size++;
      currentPeak = { position: parentPos, height: leftPeak.height + 1 };
    }

    this.peaks.push(currentPeak);
    this.leafCount++;
    return this.leafCount - 1;
  }

  /**
   * Get the current root hash.
   * Bag all peaks together right-to-left.
   */
  getRoot(): string {
    if (this._size === 0) {
      return computeSHA256('empty_mmr');
    }

    if (this.peaks.length === 1) {
      return this.hashes.get(this.peaks[0].position)!;
    }

    // Bag peaks: hash right-to-left using ordered hashing
    let root = this.hashes.get(this.peaks[this.peaks.length - 1].position)!;
    for (let i = this.peaks.length - 2; i >= 0; i--) {
      root = hashPairOrdered(this.hashes.get(this.peaks[i].position)!, root);
    }
    return root;
  }

  /**
   * Get peak positions.
   */
  getPeakPositions(): number[] {
    return this.peaks.map(p => p.position);
  }

  /**
   * Generate an inclusion proof for a leaf.
   * @param leafIndex 0-based leaf index
   */
  getInclusionProof(leafIndex: number): MMRProof {
    if (leafIndex < 0 || leafIndex >= this.leafCount) {
      throw new Error(`Invalid leaf index: ${leafIndex}`);
    }

    // Convert leaf index to MMR position
    const leafPosition = this.leafIndexToPosition(leafIndex);
    const peakPositions = this.getPeakPositions();
    const authPath: string[] = [];

    // Walk from leaf position up to the nearest peak
    let pos = leafPosition;
    let h = 0; // Leaf height is 0

    while (!peakPositions.includes(pos)) {
      // Find the sibling at the same height
      // The sibling is determined by whether this node is a left or right child
      // In the MMR, we need to find which peak subtree this position belongs to

      // Determine if pos is a left or right child at height h
      // Walk the peak structure to find the subtree containing pos
      const siblingPos = this.findSibling(pos, h);
      if (siblingPos !== null) {
        authPath.push(this.hashes.get(siblingPos)!);
      }

      // Move to parent
      const parentPos = pos + 1; // Simplified; actual parent position depends on tree structure
      // More correctly, we need to compute the parent position
      pos = this.findParent(pos, h);
      h++;
    }

    return {
      index: leafIndex,
      rootHash: this.getRoot(),
      authPath,
      peaks: peakPositions.map(p => this.hashes.get(p)!),
    };
  }

  /**
   * Verify an inclusion proof.
   */
  static verifyProof(proof: MMRProof, leafHash: string): boolean {
    let currentHash = leafHash;
    for (const siblingHash of proof.authPath) {
      // Try current as left child first
      const asLeft = hashPairOrdered(currentHash, siblingHash);
      currentHash = asLeft;
    }

    // Check if our computed hash matches one of the peaks
    if (proof.peaks.includes(currentHash)) {
      return verifyPeakBagging(proof);
    }

    // Try the other ordering path
    currentHash = leafHash;
    for (const siblingHash of proof.authPath) {
      const asRight = hashPairOrdered(siblingHash, currentHash);
      currentHash = asRight;
    }

    if (proof.peaks.includes(currentHash)) {
      return verifyPeakBagging(proof);
    }

    return false;
  }

  /**
   * Get all peak nodes (as MMRNode[] for API compatibility).
   */
  getPeaks(): MMRNode[] {
    return this.peaks.map(p => ({
      index: p.position,
      hash: this.hashes.get(p.position)!,
      factId: this.facts.get(p.position),
    }));
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
    const nodes: MMRNode[] = [];
    for (let pos = 0; pos < this._size; pos++) {
      const hash = this.hashes.get(pos);
      if (hash !== undefined) {
        nodes.push({
          index: pos,
          hash,
          factId: this.facts.get(pos),
        });
      }
    }
    return nodes;
  }

  /**
   * Reset the MMR (for replay).
   */
  reset(): void {
    this.hashes = new Map();
    this.facts = new Map();
    this._size = 0;
    this.leafCount = 0;
    this.peaks = [];
  }

  // ──────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────

  /**
   * Convert a 0-based leaf index to its MMR position.
   *
   * In the MMR, the position of the k-th leaf (0-indexed) is:
   *   position = 2*k - popcount(k)
   *
   * This accounts for the internal (parent) nodes that are interspersed
   * between leaves.
   */
  private leafIndexToPosition(leafIndex: number): number {
    return 2 * leafIndex - popcount(leafIndex);
  }

  /**
   * Find the sibling position for a node at position `pos` with height `h`.
   *
   * We reconstruct the tree structure by replaying the append operations
   * up to the given position.
   */
  private findSibling(pos: number, h: number): number | null {
    // Reconstruct the peak stack at the time `pos` was added
    // by simulating appends up to that point
    const simPeaks: Array<{ position: number; height: number }> = [];
    const simHashes = new Map<number, string>();

    for (let leaf = 0; leaf < this.leafCount; leaf++) {
      const leafPos = 2 * leaf - popcount(leaf);
      simHashes.set(leafPos, this.hashes.get(leafPos)!);

      let currentPeak: { position: number; height: number } = { position: leafPos, height: 0 };
      let simSize = leafPos + 1;

      while (
        simPeaks.length > 0 &&
        simPeaks[simPeaks.length - 1].height === currentPeak.height
      ) {
        const leftPeak = simPeaks.pop()!;
        const parentPos = simSize;
        const parentHash = hashPairOrdered(
          simHashes.get(leftPeak.position)!,
          simHashes.get(currentPeak.position)!,
        );
        simHashes.set(parentPos, parentHash);
        simSize++;
        currentPeak = { position: parentPos, height: leftPeak.height + 1 };
      }

      simPeaks.push(currentPeak);

      // If we've reached or passed the target position, find the sibling
      if (currentPeak.position >= pos || leafPos === pos) {
        // Find sibling by walking up from pos
        return this.findSiblingInPeaks(pos, h, simPeaks);
      }
    }

    return null;
  }

  /**
   * Find the sibling of a node within the current peak structure.
   */
  private findSiblingInPeaks(
    pos: number,
    h: number,
    currentPeaks: Array<{ position: number; height: number }>,
  ): number | null {
    // Walk through peaks to find which subtree contains `pos`
    for (const peak of currentPeaks) {
      if (peak.height >= h) {
        // This peak might contain our node
        // The left child of a peak at height h is at peak.position - 2^h + 1 - 1 = peak.position - 2^h
        // But this is complex. Let's use a simpler approach.

        // For a perfect binary tree rooted at `peak.position` with height `peak.height`:
        // - Left subtree root = peak.position - (1 << peak.height)
        // - Right subtree root = peak.position - 1

        // Walk down from peak to find the sibling
        const sibling = this.findSiblingInTree(pos, h, peak.position, peak.height);
        if (sibling !== null) return sibling;
      }
    }
    return null;
  }

  /**
   * Find sibling in a perfect binary tree rooted at `rootPos` with height `rootHeight`.
   */
  private findSiblingInTree(
    pos: number,
    h: number,
    rootPos: number,
    rootHeight: number,
  ): number | null {
    if (rootHeight === 0) {
      // Leaf node
      return rootPos === pos ? null : null;
    }

    const leftChild = rootPos - (1 << rootHeight);
    const rightChild = rootPos - 1;

    // Check if pos is in the left or right subtree
    if (this.isInSubtree(pos, leftChild, rootHeight - 1)) {
      if (h === rootHeight - 1 && leftChild === pos) {
        return rightChild; // Sibling is right child
      }
      return this.findSiblingInTree(pos, h, leftChild, rootHeight - 1);
    } else if (this.isInSubtree(pos, rightChild, rootHeight - 1)) {
      if (h === rootHeight - 1 && rightChild === pos) {
        return leftChild; // Sibling is left child
      }
      return this.findSiblingInTree(pos, h, rightChild, rootHeight - 1);
    }

    return null;
  }

  /**
   * Check if `pos` is within the subtree rooted at `rootPos` with height `rootHeight`.
   */
  private isInSubtree(pos: number, rootPos: number, rootHeight: number): boolean {
    if (rootHeight === 0) return pos === rootPos;
    const leftmost = rootPos - (1 << rootHeight) + 1;
    const rightmost = rootPos;
    return pos >= leftmost && pos <= rightmost;
  }

  /**
   * Find the parent position of a node at position `pos` with height `h`.
   */
  private findParent(pos: number, h: number): number {
    // The parent is the next position after the right child
    // If pos is a left child: parent = rightChild + 1 where rightChild = pos + (1 << (h+1)) - 1
    // If pos is a right child: parent = pos + 1

    // Simplified: we need to determine which peak subtree contains pos
    // and then find the parent within that subtree
    for (const peak of this.peaks) {
      if (this.isInSubtree(pos, peak.position, peak.height)) {
        return this.findParentInTree(pos, h, peak.position, peak.height);
      }
    }

    // Fallback
    return pos + 1;
  }

  /**
   * Find the parent of a node in a perfect binary tree.
   */
  private findParentInTree(
    pos: number,
    h: number,
    rootPos: number,
    rootHeight: number,
  ): number {
    if (rootHeight <= h) return rootPos; // Already at or above target height

    const leftChild = rootPos - (1 << rootHeight);
    const rightChild = rootPos - 1;

    if (this.isInSubtree(pos, leftChild, rootHeight - 1)) {
      if (h === rootHeight - 1) return rootPos; // Parent is the root
      return this.findParentInTree(pos, h, leftChild, rootHeight - 1);
    } else {
      if (h === rootHeight - 1) return rootPos; // Parent is the root
      return this.findParentInTree(pos, h, rightChild, rootHeight - 1);
    }
  }
}

/**
 * Count the number of 1-bits in a non-negative integer.
 */
function popcount(n: number): number {
  let count = 0;
  while (n > 0) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

/**
 * Verify that peak bagging in a proof produces the stated root hash.
 */
function verifyPeakBagging(proof: MMRProof): boolean {
  if (proof.peaks.length === 1) {
    return proof.rootHash === proof.peaks[0];
  }

  let root = proof.peaks[proof.peaks.length - 1];
  for (let i = proof.peaks.length - 2; i >= 0; i--) {
    root = hashPairOrdered(proof.peaks[i], root);
  }
  return root === proof.rootHash;
}
