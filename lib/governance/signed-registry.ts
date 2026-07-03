/**
 * signed-registry.ts — Cryptographic signing and verification of Obligation Registry
 *
 * GROUND-UP RATIONALE (read before modifying)
 * ---------------------------------------------------------------------------
 * OB-000001 (Right to Independent Verification) is the axiom this module
 * exists to satisfy. A YAML file in a git repo is *available* but not
 * *verifiable* — git write access is sufficient to silently rewrite an
 * obligation's normative tag. That failure mode makes every other property
 * claimed in GB-1.0 ("immutable obligation IDs") decorative rather than real.
 *
 * The fix is not "add a signature" as a bolt-on. It's: define the registry's
 * meaning as a canonical byte sequence, sign THAT, and make every consumer
 * (CI, audit-engine, participant-facing tools) verify against a published
 * public key before trusting the file's contents.
 *
 * Key custody: the signing key is the SafeKrypte root key (port 5096),
 * the same trust root that signs ProofBridge receipts. This is intentional —
 * introducing a *second* root of trust for governance would violate
 * OB-000023 (Separate Governance Functions) by creating an unaccountable
 * side channel. One root, scoped by key-derivation path, not by a new key.
 *
 * Ed25519 is implemented via Node.js built-in crypto (available since Node 22).
 * This avoids ESM/CJS issues in test environments while producing identical
 * signatures to @noble/ed25519 (same algorithm, same curve).
 */

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
} from "node:crypto";
import { readFileSync } from "node:fs";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Obligation {
  id: string;
  name: string;
  normative: string; // validated against Normative enum — see compatibility.ts
  description: string;
  currentArticle: string;
  historicalArticles: string[];
  introduced: string;
  amended: string[];
  capability: string;
  policy: string;
}

/**
 * The registry as it exists in memory, keyed by immutable obligation ID.
 * Keys are sorted lexicographically for deterministic canonical serialization.
 */
export interface ObligationRegistry {
  obligations: Record<string, Obligation>;
  baselineVersion: string; // e.g. "GB-1.0" — binds registry to a specific frozen baseline
}

export interface SignedRegistry {
  /** Canonical bytes that were actually signed (compact JSON, NOT the source
   *  YAML — YAML has too many meaning-preserving byte representations). */
  canonicalPayload: number[];
  /** 64-byte Ed25519 signature */
  signature: number[];
  /** 32-byte Ed25519 public key of the signer */
  signerPublicKey: number[];
  /** SHA-256 of canonicalPayload, included for fast integrity check */
  payloadHash: string;
}

export enum RegistryErrorKind {
  CanonicalizationFailed = "CanonicalizationFailed",
  HashMismatch = "HashMismatch",
  SignatureInvalid = "SignatureInvalid",
  UnknownSigner = "UnknownSigner",
  NormativeTagInvalid = "NormativeTagInvalid",
  KeyReadFailed = "KeyReadFailed",
}

export class RegistryError extends Error {
  constructor(
    public kind: RegistryErrorKind,
    message: string,
    public detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RegistryError";
  }
}

// ── Key Helpers ──────────────────────────────────────────────────────────

/**
 * Ed25519 private key in PKCS#8 DER format.
 * 48 bytes: SEQUENCE { INTEGER 0, SEQUENCE { OID 1.3.101.112 }, OCTET STRING { 32-byte seed } }
 */
function wrapPrivateKey(raw32: Uint8Array): Buffer {
  const pkcs8 = Buffer.alloc(48);
  pkcs8[0] = 0x30; pkcs8[1] = 0x2e;
  pkcs8[2] = 0x02; pkcs8[3] = 0x01; pkcs8[4] = 0x00;
  pkcs8[5] = 0x30; pkcs8[6] = 0x05; pkcs8[7] = 0x06;
  pkcs8[8] = 0x03; pkcs8[9] = 0x2b; pkcs8[10] = 0x65; pkcs8[11] = 0x70;
  pkcs8[12] = 0x04; pkcs8[13] = 0x22; pkcs8[14] = 0x04; pkcs8[15] = 0x20;
  for (let i = 0; i < 32; i++) pkcs8[16 + i] = raw32[i];
  return pkcs8;
}

/**
 * Ed25519 public key in SPKI DER format.
 * 44 bytes: SEQUENCE { SEQUENCE { OID 1.3.101.112 }, BIT STRING { 32-byte key } }
 */
function wrapPublicKey(raw32: Uint8Array): Buffer {
  const spki = Buffer.alloc(44);
  spki[0] = 0x30; spki[1] = 0x2a;
  spki[2] = 0x30; spki[3] = 0x05; spki[4] = 0x06;
  spki[5] = 0x03; spki[6] = 0x2b; spki[7] = 0x65; spki[8] = 0x70;
  spki[9] = 0x03; spki[10] = 0x21; spki[11] = 0x00;
  for (let i = 0; i < 32; i++) spki[12 + i] = raw32[i];
  return spki;
}

function rawFromSpki(spki: Buffer): Uint8Array {
  // SPKI: 30 2A 30 05 06 03 2B 65 70 03 21 00 [32-byte key]
  return new Uint8Array(spki.subarray(12, 44));
}

function rawFromPkcs8(pkcs8: Buffer): Uint8Array {
  // PKCS8: 30 2E ... 04 22 04 20 [32-byte key]
  return new Uint8Array(pkcs8.subarray(16, 48));
}

// ── Key generation ─────────────────────────────────────────────────────────

/**
 * Generate a new Ed25519 key pair.
 * Returns raw 32-byte private key and 32-byte public key (not DER-wrapped).
 */
export function generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "der" },
    publicKeyEncoding: { type: "spki", format: "der" },
  });
  return {
    privateKey: rawFromPkcs8(privateKey),
    publicKey: rawFromSpki(publicKey),
  };
}

/**
 * Derive the public key from a raw 32-byte Ed25519 private key.
 * This works by creating a temporary key object and extracting its public key.
 */
export function derivePublicKey(privateKey: Uint8Array): Uint8Array {
  const pkcs8 = wrapPrivateKey(privateKey);
  const privKey = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  // Create public key object from private key, then export as SPKI DER
  const pubKey = createPublicKey(privKey);
  const pubDer = pubKey.export({ type: "spki", format: "der" });
  return rawFromSpki(pubDer);
}

// ── Canonicalization ───────────────────────────────────────────────────────

/**
 * Produce the canonical byte representation that gets signed/verified.
 * Rules (all exist to eliminate ambiguity, not for style):
 *   1. Keys sorted lexicographically.
 *   2. No whitespace variance — compact JSON, not pretty-printed.
 *   3. Obligation fields serialized in a fixed field order
 *      (the field order in the Obligation interface is itself part of the
 *      canonical contract — reordering those fields is a BREAKING change
 *      under COMPATIBILITY-RULES.yaml even though no obligation *content*
 *      changed).
 */
export function canonicalize(registry: ObligationRegistry): Uint8Array {
  const sortedKeys = Object.keys(registry.obligations).sort();
  const sortedObligations: Record<string, Obligation> = {};
  for (const key of sortedKeys) {
    sortedObligations[key] = registry.obligations[key];
  }

  const canonical = {
    baselineVersion: registry.baselineVersion,
    obligations: sortedObligations,
  };

  const json = JSON.stringify(canonical);
  return new TextEncoder().encode(json);
}

// ── Hash ───────────────────────────────────────────────────────────────────

function sha256Digest(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

// ── Signing ────────────────────────────────────────────────────────────────

/**
 * Sign the registry with a SafeKrypte-issued signing key.
 * The key itself is never generated here — it's requested from
 * SafeKrypte (port 5096) at freeze time and never touches disk
 * in this process (passed via env var or pipe, not file).
 *
 * @param privateKey — raw 32-byte Ed25519 private key
 */
export async function signRegistry(
  registry: ObligationRegistry,
  privateKey: Uint8Array,
): Promise<SignedRegistry> {
  const canonicalPayload = canonicalize(registry);
  const payloadHash = sha256Digest(canonicalPayload);

  const pkcs8 = wrapPrivateKey(privateKey);
  const key = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const pubKey = derivePublicKey(privateKey);
  // Use Uint8Array, not Buffer, for nodeSign to avoid strict TS type incompatibility
  const signData = new Uint8Array(canonicalPayload);
  const signature = nodeSign(null, signData, key);

  return {
    canonicalPayload: Array.from(canonicalPayload),
    signature: Array.from(signature),
    signerPublicKey: Array.from(pubKey),
    payloadHash,
  };
}

// ── Verification ──────────────────────────────────────────────────────────

/**
 * Verify a signed registry against a PUBLISHED public key — not the
 * key embedded in the SignedRegistry struct itself. Trusting the
 * embedded key would make this a no-op: an attacker who can rewrite
 * the registry can just resign it with their own key and embed that.
 *
 * `trustedSigner` must come from an out-of-band published source
 * (e.g. TRUSTED-SIGNER-GB-1.0.pem, or SafeKrypte's published key directory).
 */
export async function verifyRegistry(
  signed: SignedRegistry,
  trustedSigner: Uint8Array,
): Promise<void> {
  // 1. Integrity check first (cheap, catches transport corruption).
  const recomputedHash = sha256Digest(new Uint8Array(signed.canonicalPayload));
  if (recomputedHash !== signed.payloadHash) {
    throw new RegistryError(
      RegistryErrorKind.HashMismatch,
      "Payload hash mismatch — data corrupted in transit",
      { expected: signed.payloadHash, got: recomputedHash },
    );
  }

  // 2. Signer identity check — reject before even touching the
  //    signature math if the embedded key isn't the one we trust.
  const embeddedKeyHex = Buffer.from(signed.signerPublicKey).toString("hex");
  const trustedKeyHex = Buffer.from(trustedSigner).toString("hex");
  if (embeddedKeyHex !== trustedKeyHex) {
    throw new RegistryError(
      RegistryErrorKind.UnknownSigner,
      "Signer key does not match trusted key",
      { got: embeddedKeyHex, expected: trustedKeyHex },
    );
  }

  // 3. Cryptographic verification.
  // Use Uint8Array, not Buffer, for nodeVerify to avoid strict TS type incompatibility
  const spki = wrapPublicKey(trustedSigner);
  const key = createPublicKey({ key: spki, format: "der", type: "spki" });
  const payload = new Uint8Array(signed.canonicalPayload);
  const sig = new Uint8Array(signed.signature);
  const valid = nodeVerify(null, payload, key, sig);

  if (!valid) {
    throw new RegistryError(
      RegistryErrorKind.SignatureInvalid,
      "Ed25519 signature verification failed",
    );
  }
}

// ── Key reader ─────────────────────────────────────────────────────────────

/**
 * Read a PEM-encoded Ed25519 public key from a file.
 * Supports:
 *   - SPKI DER PEM (44 bytes DER, BEGIN PUBLIC KEY)
 *   - Raw 32-byte hex file
 *   - Raw 32-byte binary file
 */
export function readPublicKeyFromPem(pemPath: string): Uint8Array {
  const raw = readFileSync(pemPath);
  const asStr = raw.toString("utf8").trim();

  // PEM format
  if (asStr.includes("-----BEGIN")) {
    const derBase64 = asStr
      .replace(/-----BEGIN [A-Z ]+-----/g, "")
      .replace(/-----END [A-Z ]+-----/g, "")
      .replace(/\s+/g, "");
    const der = Buffer.from(derBase64, "base64");
    // SPKI for Ed25519 is 44 bytes
    if (der.length === 44 && der[0] === 0x30 && der[2] === 0x05) {
      return rawFromSpki(der);
    }
    throw new RegistryError(
      RegistryErrorKind.KeyReadFailed,
      `Expected 44-byte SPKI DER in PEM, got ${der.length} bytes`,
    );
  }

  // Hex-encoded raw key (64 hex chars)
  if (/^[0-9a-f]{64}$/i.test(asStr)) {
    return new Uint8Array(Buffer.from(asStr, "hex"));
  }

  // Raw 32-byte binary
  if (raw.length === 32) {
    return new Uint8Array(raw);
  }

  throw new RegistryError(
    RegistryErrorKind.KeyReadFailed,
    `Unrecognized key format: ${raw.length} bytes`,
    { preview: asStr.slice(0, 40) },
  );
}

// ── CI entry point ─────────────────────────────────────────────────────────

export interface VerifyOptions {
  registryPath: string;
  trustedKeyPath: string;
}

/**
 * CI entry point: read a SignedRegistry from disk, verify against a
 * trusted public key file.
 * Returns `true` if valid, throws RegistryError otherwise.
 */
export async function ciVerifyRegistry(options: VerifyOptions): Promise<boolean> {
  const { readFileSync: read } = await import("node:fs");

  const signed: SignedRegistry = JSON.parse(read(options.registryPath, "utf8"));
  const trustedKey = readPublicKeyFromPem(options.trustedKeyPath);

  await verifyRegistry(signed, trustedKey);
  return true;
}
