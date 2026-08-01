import { describe, it, expect } from 'vitest';
import {
  canonicalHash,
  chainHash,
  domainHash,
  GENESIS_HASH,
  verifyHashChain,
  sha256Hex,
  hashObject,
  computeHashChainLink,
  createHashChain,
  appendToHashChain,
  hmacSha256Hex,
  verifyHmacSha256,
} from '../src/hash';

describe('canonicalHash', () => {
  it('produces deterministic output for the same object', () => {
    const obj = { a: 1, b: 'hello', c: { nested: true } };
    const h1 = canonicalHash(obj);
    const h2 = canonicalHash(obj);
    expect(h1).toBe(h2);
  });

  it('normalizes key order — object key order does not affect hash', () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { a: 2, m: 3, z: 1 };
    expect(canonicalHash(a)).toBe(canonicalHash(b));
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const h = canonicalHash({ test: true });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different hashes for different objects', () => {
    const h1 = canonicalHash({ x: 1 });
    const h2 = canonicalHash({ x: 2 });
    expect(h1).not.toBe(h2);
  });
});

describe('chainHash', () => {
  it('computes SHA-256(previousHash + currentHash)', () => {
    const prev = 'aaa';
    const curr = 'bbb';
    const result = chainHash(prev, curr);
    const expected = sha256Hex(prev + curr);
    expect(result).toBe(expected);
  });

  it('is deterministic', () => {
    const r1 = chainHash('x', 'y');
    const r2 = chainHash('x', 'y');
    expect(r1).toBe(r2);
  });

  it('produces different results for different inputs', () => {
    const r1 = chainHash('a', 'b');
    const r2 = chainHash('b', 'a');
    expect(r1).not.toBe(r2);
  });
});

describe('domainHash', () => {
  it('includes domain separator in hash', () => {
    const data = 'some-event-data';
    const h1 = domainHash('domain-a', data);
    const h2 = domainHash('domain-b', data);
    expect(h1).not.toBe(h2);
  });

  it('produces different hashes for different data with same domain', () => {
    const h1 = domainHash('my-domain', 'event-1');
    const h2 = domainHash('my-domain', 'event-2');
    expect(h1).not.toBe(h2);
  });

  it('returns a valid SHA-256 hex string', () => {
    const h = domainHash('test', 'data');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same domain + same data = same hash', () => {
    const h1 = domainHash('d', 'v');
    const h2 = domainHash('d', 'v');
    expect(h1).toBe(h2);
  });
});

describe('GENESIS_HASH', () => {
  it('is a valid SHA-256 hex string', () => {
    expect(GENESIS_HASH).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('equals 0x followed by 64 zeros', () => {
    expect(GENESIS_HASH).toBe('0x' + '00'.repeat(32));
  });
});

describe('verifyHashChain', () => {
  it('returns true for empty chain', () => {
    expect(verifyHashChain([])).toBe(true);
  });

  it('returns true for single-element chain', () => {
    expect(verifyHashChain(['abcdef'])).toBe(true);
  });

  it('returns true for a valid chain when expectedChainHash matches', () => {
    const genesis = sha256Hex('genesis');
    const event1 = sha256Hex('event1');
    const event2 = sha256Hex('event2');
    const chainHash1 = computeHashChainLink(genesis, event1);
    const chainHash2 = computeHashChainLink(chainHash1, event2);
    expect(verifyHashChain([genesis, event1, event2], chainHash2)).toBe(true);
  });

  it('returns false when expectedChainHash does not match', () => {
    const genesis = sha256Hex('genesis');
    const event1 = sha256Hex('event1');
    expect(verifyHashChain([genesis, event1], 'WRONG_HASH')).toBe(false);
  });

  it('returns true for self-consistent chain without expected hash', () => {
    const genesis = sha256Hex('genesis');
    const event1 = sha256Hex('event1');
    expect(verifyHashChain([genesis, event1])).toBe(true);
  });

  it('returns false when chain is broken (expected hash mismatch)', () => {
    const genesis = sha256Hex('genesis');
    const event1 = sha256Hex('event1');
    const event2 = sha256Hex('event2');
    // Compute correct rolling hash for [genesis, event1, event2]
    const correctFinal = computeHashChainLink(
      computeHashChainLink(genesis, event1),
      event2
    );
    // But pass event1 twice — produces different rolling hash
    expect(verifyHashChain([genesis, event1, event1], correctFinal)).toBe(false);
  });

  it('returns false on wrong genesis (expected hash mismatch)', () => {
    const genesis = sha256Hex('genesis');
    const event1 = sha256Hex('event1');
    const correctFinal = computeHashChainLink(genesis, event1);
    // Wrong genesis produces different rolling hash
    expect(verifyHashChain(['WRONG_GENESIS', event1], correctFinal)).toBe(false);
  });
});

describe('sha256Hex', () => {
  it('returns 64-char hex for string input', () => {
    const h = sha256Hex('hello');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns 64-char hex for Buffer input', () => {
    const h = sha256Hex(Buffer.from('hello'));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('hmacSha256Hex / verifyHmacSha256', () => {
  it('generates and verifies HMAC signature', () => {
    const secret = 'my-secret-key';
    const message = 'important-message';
    const sig = hmacSha256Hex(secret, message);
    expect(verifyHmacSha256(secret, message, sig)).toBe(true);
  });

  it('rejects tampered message', () => {
    const secret = 'key';
    const sig = hmacSha256Hex(secret, 'original');
    expect(verifyHmacSha256(secret, 'tampered', sig)).toBe(false);
  });

  it('rejects wrong secret', () => {
    const sig = hmacSha256Hex('secret-a', 'msg');
    expect(verifyHmacSha256('secret-b', 'msg', sig)).toBe(false);
  });
});

describe('HashChain (createHashChain / appendToHashChain)', () => {
  it('creates chain with genesis hash', () => {
    const chain = createHashChain('genesis');
    expect(chain.genesisHash).toBe('genesis');
    expect(chain.currentHash).toBe('genesis');
    expect(chain.length).toBe(0);
    expect(chain.links).toHaveLength(0);
  });

  it('appends links and updates currentHash', () => {
    const chain = createHashChain('genesis');
    const updated = appendToHashChain(chain, 'event1');
    expect(updated.length).toBe(1);
    expect(updated.links).toHaveLength(1);
    expect(updated.currentHash).not.toBe('genesis');
  });

  it('maintains chain integrity across multiple appends', () => {
    let chain = createHashChain('genesis');
    chain = appendToHashChain(chain, 'a');
    chain = appendToHashChain(chain, 'b');
    chain = appendToHashChain(chain, 'c');
    expect(chain.length).toBe(3);
    expect(chain.currentHash).not.toBe('genesis');
  });
});
