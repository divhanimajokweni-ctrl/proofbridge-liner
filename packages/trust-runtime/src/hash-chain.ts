// packages/trust-runtime/src/hash-chain.ts
// ───────────────────────────────────────────────────────────────
// Hash Chain Implementation
// Tamper-evident sequential hash journal for Trust Context events
// ───────────────────────────────────────────────────────────────

import {
  sha256Hex,
  computeHashChainLink,
  createHashChain,
  appendToHashChain,
  type HashChain,
  type HashChainLink,
} from '@proofbridge/trust-crypto';
import type { TrustEvent } from '@proofbridge/trust-events';

// ───────────────────────────────────────────────────────────────
// Hash Chain Types
// ───────────────────────────────────────────────────────────────

/**
 * Trust Context Hash Chain
 * Maintains the tamper-evident chain of event hashes
 */
export interface TrustContextHashChain {
  contextId: string;
  genesisHash: string;
  currentHash: string;
  links: HashChainLink[];
  length: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Hash Chain State stored in database
 */
export interface HashChainState {
  contextId: string;
  currentHash: string;
  length: number;
  updatedAt: number;
}

// ───────────────────────────────────────────────────────────────
// Hash Chain Manager
// ───────────────────────────────────────────────────────────────

/**
 * Hash Chain Manager Configuration
 */
export interface HashChainManagerConfig {
  contextId: string;
  genesisHash?: string;
}

/**
 * Hash Chain Manager
 * Manages the tamper-evident hash chain for a Trust Context
 */
export class HashChainManager {
  private contextId: string;
  private chain: TrustContextHashChain;
  private eventHashes: Map<string, string>; // eventId -> eventHash

  constructor(config: HashChainManagerConfig) {
    this.contextId = config.contextId;
    this.eventHashes = new Map();
    
    // Initialize with genesis hash or create new
    const genesisHash = config.genesisHash || this.computeGenesisHash();
    
    this.chain = {
      contextId: config.contextId,
      genesisHash,
      currentHash: genesisHash,
      links: [],
      length: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
  * Compute genesis hash from context ID
  */
  private computeGenesisHash(): string {
    return sha256Hex(`GENESIS:${this.contextId}`);
  }

  /**
  * Get the current hash chain
  */
  getChain(): TrustContextHashChain {
    return { ...this.chain };
  }

  /**
  * Get current hash
  */
  getCurrentHash(): string {
    return this.chain.currentHash;
  }

  /**
  * Get chain length
  */
  getLength(): number {
    return this.chain.length;
  }

  /**
  * Append an event to the hash chain
  * Returns the new chain state
  */
  appendEvent(event: TrustEvent): HashChainLink {
    const eventHash = event.eventHash;
    
    // Store event hash for verification
    this.eventHashes.set(event.eventId, eventHash);
    
    // Compute chain link: SHA-256(previousHash + currentEventHash)
    const chainHash = computeHashChainLink(this.chain.currentHash, eventHash);
    
    const link: HashChainLink = {
      previousHash: this.chain.currentHash,
      currentHash: eventHash,
      chainHash,
    };

    // Update chain
    this.chain = {
      ...this.chain,
      links: [...this.chain.links, link],
      currentHash: chainHash,
      length: this.chain.length + 1,
      updatedAt: Date.now(),
    };

    return link;
  }

  /**
  * Verify hash chain integrity
  * Recomputes all chain links and verifies they match
  */
  verifyChainIntegrity(): boolean {
    if (this.chain.links.length === 0) {
      return this.chain.currentHash === this.chain.genesisHash;
    }

    let previousHash = this.chain.genesisHash;
    
    for (const link of this.chain.links) {
      const expectedChainHash = computeHashChainLink(previousHash, link.currentHash);
      
      if (expectedChainHash !== link.chainHash) {
        return false;
      }
      
      previousHash = link.chainHash;
    }

    return this.chain.currentHash === previousHash;
  }

  /**
  * Verify event is in the chain
  */
  verifyEventInChain(eventId: string, eventHash: string): boolean {
    const storedHash = this.eventHashes.get(eventId);
    return storedHash === eventHash;
  }

  /**
  * Get hash chain state for persistence
  */
  getState(): HashChainState {
    return {
      contextId: this.contextId,
      currentHash: this.chain.currentHash,
      length: this.chain.length,
      updatedAt: this.chain.updatedAt,
    };
  }

  /**
  * Restore hash chain from state
  */
  restoreFromState(state: HashChainState): void {
    this.chain = {
      ...this.chain,
      currentHash: state.currentHash,
      length: state.length,
      updatedAt: state.updatedAt,
    };
  }

  /**
  * Get event hash by event ID
  */
  getEventHash(eventId: string): string | undefined {
    return this.eventHashes.get(eventId);
  }

  /**
  * Get all event hashes
  */
  getAllEventHashes(): Map<string, string> {
    return new Map(this.eventHashes);
  }

  /**
  * Verify chain continuity from a specific point
  */
  verifyChainFrom(eventHash: string, expectedChainHash: string): boolean {
    const computedChainHash = computeHashChainLink(eventHash, this.chain.currentHash);
    return computedChainHash === expectedChainHash;
  }
}

// ───────────────────────────────────────────────────────────────
// Hash Chain Factory
// ───────────────────────────────────────────────────────────────

/**
 * Create a new hash chain manager
 */
export function createHashChainManager(config: HashChainManagerConfig): HashChainManager {
  return new HashChainManager(config);
}

// ───────────────────────────────────────────────────────────────
// Hash Chain Verification Utilities
// ───────────────────────────────────────────────────────────────

/**
 * Verify a complete hash chain
 */
export function verifyHashChain(
  chain: TrustContextHashChain
): boolean {
  if (chain.links.length === 0) {
    return chain.currentHash === chain.genesisHash;
  }

  let previousHash = chain.genesisHash;
  
  for (const link of chain.links) {
    const expectedChainHash = computeHashChainLink(previousHash, link.currentHash);
    
    if (expectedChainHash !== link.chainHash) {
      return false;
    }
    
    previousHash = link.chainHash;
  }

  return chain.currentHash === previousHash;
}

/**
 * Verify hash chain between two events
 */
export function verifyHashChainBetween(
  startEventHash: string,
  endEventHash: string,
  expectedChainHash: string
): boolean {
  const computedChainHash = computeHashChainLink(startEventHash, endEventHash);
  return computedChainHash === expectedChainHash;
}

/**
 * Compute the hash chain for a sequence of events
 */
export function computeEventHashChain(events: TrustEvent[]): string {
  if (events.length === 0) {
    throw new Error('Cannot compute hash chain for empty event array');
  }

  let chainHash = events[0].eventHash;
  
  for (let i = 1; i < events.length; i++) {
    chainHash = computeHashChainLink(chainHash, events[i].eventHash);
  }
  
  return chainHash;
}
