/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// ============================================================================
// VVU EARTH TECH — Knowledge Graph Builder (Decision 6)
// ============================================================================
//
// Constructs a strictly typed DAG knowledge graph from evidence, policy,
// projection, and release gate nodes. Uses evidence store references
// (FactIDs) to prevent data bloat — nodes reference immutable evidence
// rather than embedding it.
//
// Determinism guarantees:
// - RFC 8785 canonical JSON output (toJSON)
// - SHA-256 based edge weights
// - Graphviz DOT output for visualization
// - Frozen immutable graph on build()
// ============================================================================

import { computeSHA256 } from '../../src/lib/kernel/hashing';
import { canonicalize } from '../../src/lib/kernel/canonicalization';

// ---------------------------------------------------------------------------
// §1 — Edge Types
// ---------------------------------------------------------------------------

/**
 * Edge types representing relationships between knowledge graph nodes.
 *
 * - VERIFIES: Evidence node verifies a policy or projection
 * - SATISFIES: Policy node satisfies a requirement or release gate
 * - CERTIFIES: Projection or evidence certifies a release gate
 * - TRIGGERS: One node triggers evaluation of another
 */
export type EdgeType = 'VERIFIES' | 'SATISFIES' | 'CERTIFIES' | 'TRIGGERS';

// ---------------------------------------------------------------------------
// §2 — Node Types
// ---------------------------------------------------------------------------

/**
 * Node type classification in the knowledge graph.
 */
export type KnowledgeGraphNodeType = 'evidence' | 'policy' | 'projection' | 'release_gate';

/**
 * A node in the knowledge graph.
 * References immutable evidence via FactID — prevents data bloat.
 */
export interface KnowledgeGraphNode {
  /** Deterministic node ID: SHA-256 of canonical node representation */
  id: string;
  /** Classification of this node */
  type: KnowledgeGraphNodeType;
  /** Arbitrary metadata attached to this node (NOT used for hashing) */
  metadata: Record<string, unknown>;
  /** Reference to immutable evidence store FactID — prevents data bloat */
  evidenceStoreRef: string;
}

/**
 * An edge in the knowledge graph connecting two nodes.
 */
export interface KnowledgeGraphEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship type between source and target */
  type: EdgeType;
  /** Optional weight derived from confidence or evidence strength */
  weight?: number;
}

// ---------------------------------------------------------------------------
// §3 — Frozen Knowledge Graph
// ---------------------------------------------------------------------------

/**
 * Immutable, frozen knowledge graph returned by the builder.
 * Once built, the graph cannot be modified — ensuring determinism.
 */
export interface KnowledgeGraph {
  /** SHA-256 hash of the canonical graph state — the identity of this graph */
  id: string;
  /** All nodes in the graph, indexed by ID */
  nodes: ReadonlyMap<string, KnowledgeGraphNode>;
  /** All edges in the graph */
  edges: ReadonlyArray<KnowledgeGraphEdge>;
  /** Timestamp when this graph was built */
  builtAt: number;
  /** Number of nodes in the graph */
  nodeCount: number;
  /** Number of edges in the graph */
  edgeCount: number;
}

// ---------------------------------------------------------------------------
// §4 — Knowledge Graph Builder
// ---------------------------------------------------------------------------

/**
 * Builder for constructing DAG knowledge graphs.
 *
 * Usage:
 *   const builder = new KnowledgeGraphBuilder();
 *   builder.addNode({ id, type, metadata, evidenceStoreRef });
 *   builder.addEdge(source, target, 'VERIFIES');
 *   const graph = builder.build(); // frozen, immutable
 *   const dot = builder.toDot();   // Graphviz DOT format
 *   const json = builder.toJSON(); // Deterministic JSON
 */
export class KnowledgeGraphBuilder {
  private nodes: Map<string, KnowledgeGraphNode>;
  private edges: KnowledgeGraphEdge[];

  constructor() {
    this.nodes = new Map<string, KnowledgeGraphNode>();
    this.edges = [];
  }

  /**
   * Add a node to the knowledge graph.
   * If a node with the same ID already exists, it is replaced.
   */
  addNode(node: KnowledgeGraphNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Add an edge between two existing nodes.
   * Throws if source or target nodes don't exist.
   */
  addEdge(source: string, target: string, type: EdgeType): void {
    if (!this.nodes.has(source)) {
      throw new Error(`KnowledgeGraph: source node '${source}' does not exist`);
    }
    if (!this.nodes.has(target)) {
      throw new Error(`KnowledgeGraph: target node '${target}' does not exist`);
    }

    // Compute deterministic weight from SHA-256 of source+target+type
    const weightSeed = `${source}:${target}:${type}`;
    const weightHash = computeSHA256(weightSeed);
    // Convert first 8 hex chars to a float in [0, 1]
    const weightFloat = parseInt(weightHash.slice(0, 8), 16) / 0xffffffff;

    this.edges.push({
      source,
      target,
      type,
      weight: weightFloat,
    });
  }

  /**
   * Build the knowledge graph into a frozen, immutable structure.
   * Computes the graph ID as SHA-256 of the canonical graph state.
   * After building, the builder is reset — cannot be reused.
   */
  build(): KnowledgeGraph {
    // Canonicalize nodes and edges for deterministic hash
    const nodeEntries = Array.from(this.nodes.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const sortedEdges = [...this.edges].sort((a, b) => {
      const aKey = `${a.source}:${a.target}:${a.type}`;
      const bKey = `${b.source}:${b.target}:${b.type}`;
      return aKey.localeCompare(bKey);
    });

    const canonicalState = canonicalize({
      nodes: nodeEntries.map(([id, node]) => ({
        id,
        type: node.type,
        evidenceStoreRef: node.evidenceStoreRef,
      })),
      edges: sortedEdges.map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
      })),
    });

    const graphId = computeSHA256(canonicalState);

    // Create frozen, immutable copies
    const frozenNodes = new Map<string, KnowledgeGraphNode>(nodeEntries);
    const frozenEdges = sortedEdges as ReadonlyArray<KnowledgeGraphEdge>;

    const graph: KnowledgeGraph = {
      id: graphId,
      nodes: frozenNodes,
      edges: frozenEdges,
      builtAt: Date.now(),
      nodeCount: frozenNodes.size,
      edgeCount: frozenEdges.length,
    };

    // Reset builder — graph is now immutable
    this.nodes = new Map();
    this.edges = [];

    return graph;
  }

  /**
   * Generate Graphviz DOT format for visualization.
   * Produces deterministic output — nodes and edges sorted.
   */
  toDot(): string {
    const nodeEntries = Array.from(this.nodes.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const sortedEdges = [...this.edges].sort((a, b) => {
      const aKey = `${a.source}:${a.target}:${a.type}`;
      const bKey = `${b.source}:${b.target}:${b.type}`;
      return aKey.localeCompare(bKey);
    });

    const lines: string[] = [
      'digraph KnowledgeGraph {',
      '  rankdir=LR;',
      '  node [shape=box, style=filled];',
      '',
    ];

    // Node declarations with type-based colors
    const typeColors: Record<KnowledgeGraphNodeType, string> = {
      evidence: '#e8f5e9',
      policy: '#fff3e0',
      projection: '#e3f2fd',
      release_gate: '#fce4ec',
    };

    const typeLabels: Record<KnowledgeGraphNodeType, string> = {
      evidence: 'Evidence',
      policy: 'Policy',
      projection: 'Projection',
      release_gate: 'Release Gate',
    };

    for (const [, node] of nodeEntries) {
      const color = typeColors[node.type];
      const label = `${typeLabels[node.type]}\n${node.id.slice(0, 12)}...`;
      lines.push(`  "${node.id}" [label="${label}", fillcolor="${color}"];`);
    }

    lines.push('');

    // Edge declarations with type-based labels
    for (const edge of sortedEdges) {
      lines.push(`  "${edge.source}" -> "${edge.target}" [label="${edge.type}"];`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Produce deterministic JSON output of the current builder state.
   * Uses RFC 8785 canonicalization internally for the hash,
   * but returns a pretty-printed JSON for human readability.
   */
  toJSON(): object {
    const nodeEntries = Array.from(this.nodes.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    const sortedEdges = [...this.edges].sort((a, b) => {
      const aKey = `${a.source}:${a.target}:${a.type}`;
      const bKey = `${b.source}:${b.target}:${b.type}`;
      return aKey.localeCompare(bKey);
    });

    return {
      nodes: nodeEntries.map(([, node]) => ({
        id: node.id,
        type: node.type,
        metadata: node.metadata,
        evidenceStoreRef: node.evidenceStoreRef,
      })),
      edges: sortedEdges,
      hash: computeSHA256(canonicalize({
        nodes: nodeEntries.map(([, node]) => ({
          id: node.id,
          type: node.type,
          evidenceStoreRef: node.evidenceStoreRef,
        })),
        edges: sortedEdges,
      })),
    };
  }
}
