import { poseidon2 } from 'poseidon-lite';

export class MerkleTree {
  private leaves: string[];
  private tree: string[][];

  constructor(leaves: string[]) {
    this.leaves = leaves;
    this.tree = [leaves];
    this.buildTree();
  }

  private buildTree() {
    let currentLevel = this.leaves;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Simple padding
        nextLevel.push(this.hash(left, right));
      }
      this.tree.push(nextLevel);
      currentLevel = nextLevel;
    }
  }

  private hash(a: string, b: string): string {
    return poseidon2([BigInt(a), BigInt(b)]).toString();
  }

  public getRoot(): string {
    return this.tree[this.tree.length - 1][0];
  }

  public getPath(index: number): { elements: string[], indices: boolean[] } {
    const elements: string[] = [];
    const indices: boolean[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.tree.length - 1; i++) {
      const level = this.tree[i];
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      
      elements.push(level[siblingIndex] || level[currentIndex]);
      indices.push(isRight);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return { elements, indices };
  }
}
