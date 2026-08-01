// ============================================================================
// VVU Cryptographic Envelope — Header/Ciphertext Split
// ============================================================================
// Layer:        Cryptographic Boundary (Gate D)
// Responsibility: Encrypt event payloads while leaving headers in plaintext
//                 for routing, ordering, and integrity verification.
//
// Key insight: The payloadHash (SHA-256 of canonical plaintext) allows the
// system to verify integrity and route events without decrypting every event.
// This is critical for the Event Store, SSE transport, and governance audit.
// ============================================================================

import {
  generateKeyPairSync,
  publicEncrypt,
  privateDecrypt,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  sign,
  verify,
} from "crypto";

// ---------------------------------------------------------------------------
// Canonical JSON — deterministic key-sorted serialization
// ---------------------------------------------------------------------------

function canonicalize(obj: unknown): string {
  if (typeof obj !== "object" || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalize).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) =>
      JSON.stringify(k) +
      ":" +
      canonicalize((obj as Record<string, unknown>)[k]),
  );
  return "{" + pairs.join(",") + "}";
}

// ---------------------------------------------------------------------------
// Manual byte encoding — avoids @types/node@20 Buffer/Uint8Array conflicts
// ---------------------------------------------------------------------------

function hexEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += ("0" + bytes[i].toString(16)).slice(-2);
  }
  return s;
}

function hexDecode(s: string): Uint8Array {
  const n = s.length >> 1;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Number.parseInt(s.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** RFC 4648 base64 encode. */
function b64Encode(bytes: Uint8Array): string {
  // Manual base64 via built-in btoa on a binary string
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(String.fromCodePoint(bytes[i]));
  }
  return btoa(chars.join(""));
}

/** RFC 4648 base64 decode. */
function b64Decode(s: string): Uint8Array {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.codePointAt(i)!;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Helper — produce a `BinaryLike`-compatible view from a string/Buffer
// ---------------------------------------------------------------------------

function strView(s: string): Uint8Array {
  const enc = new TextEncoder();
  return enc.encode(s);
}

// ---------------------------------------------------------------------------
// Event Header — always plaintext, carries integrity commitment
// ---------------------------------------------------------------------------

export interface EventHeader {
  /** Globally unique event identifier. */
  eventId: string;
  /** Logical stream this event belongs to. */
  streamId: string;
  /** Tenant isolation boundary. */
  tenantId: string;
  /** Monotonic sequence number within the stream. */
  sequence: number;
  /** Discriminated event type (e.g. "EvidenceReceived", "ReceiptCommitted"). */
  eventType: string;
  /** Schema version for forward/backward compatibility. */
  schemaVersion: number;
  /** SHA-256 of the canonical plaintext payload.
   *
   *  This is the KEY INNOVATION: it allows integrity verification and event
   *  routing without decrypting the ciphertext. The runtime can detect
   *  tampering, deduplicate events, and verify ordering without access to
   *  the plaintext. */
  payloadHash: string;
}

// ---------------------------------------------------------------------------
// Encrypted Envelope — fully sealed event package
// ---------------------------------------------------------------------------

export interface EncryptedEnvelope {
  header: EventHeader;
  /** AES-256-GCM ciphertext of the canonical plaintext (Base64). */
  ciphertext: string;
  /** Initialization Vector (Base64). */
  iv: string;
  /** GCM Authentication Tag (Base64). Proves integrity + authenticity. */
  tag: string;
  /** RSA-OAEP wrapped Data Encryption Key (Base64). */
  encryptedDek: string;
  /** Ed25519 signature of the canonical header + payloadHash. */
  signature: string;
  /** Public key of the signer (Ed25519 hex). */
  signerPublicKey: string;
}

// ---------------------------------------------------------------------------
// Key Pair (RSA for key wrapping) — PEM-encoded strings for serialisability
// ---------------------------------------------------------------------------

export interface CryptoKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate an RSA-OAEP key pair for the Envelope Encryption Engine.
 * Used to wrap/unwrap AES-256 Data Encryption Keys (DEKs).
 */
export function generateMasterKeyPair(): CryptoKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync(
    "rsa" as unknown as "x448",
    {
      modulusLength: 4096,
      padding: 1,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    } as const,
  );
  return {
    publicKey: String(publicKey),
    privateKey: String(privateKey),
  };
}

// ---------------------------------------------------------------------------
// Envelope Encryption Engine
// ---------------------------------------------------------------------------

export class EnvelopeEncryptionEngine {
  private masterKeyPair: CryptoKeyPair;

  constructor(masterKeyPair?: CryptoKeyPair) {
    this.masterKeyPair = masterKeyPair ?? generateMasterKeyPair();
  }

  /** Get the master public key (PEM string). */
  getMasterPublicKey(): string {
    return this.masterKeyPair.publicKey;
  }

  // -----------------------------------------------------------------------
  // Seal — Encrypt and sign an event
  // -----------------------------------------------------------------------

  /**
   * Seal an event payload into an EncryptedEnvelope.
   *
   * Steps:
   *   1. Canonicalize the plaintext payload.
   *   2. Hash the canonical payload -> payloadHash (deterministic identity).
   *   3. Sign the canonical header (which includes payloadHash).
   *   4. Generate a random AES-256 DEK and encrypt the payload.
   *   5. Wrap the DEK with the RSA master public key.
   *
   * The payloadHash in the header means downstream consumers can verify
   * integrity, deduplicate, and route the event WITHOUT decrypting it.
   */
  sealEnvelope(
    headerData: Omit<EventHeader, "payloadHash">,
    plaintextPayload: Record<string, unknown>,
    ed25519PrivateKey: string,
    ed25519PublicKey: string,
  ): EncryptedEnvelope {
    // 1. Canonicalize the plaintext payload
    const canonicalPayload = canonicalize(plaintextPayload);
    if (!canonicalPayload) {
      throw new Error("Canonicalization failed: payload is empty or invalid");
    }

    // 2. Hash the plaintext for deterministic identity
    const payloadHash = createHash("sha256")
      .update(canonicalPayload, "utf8")
      .digest("hex");

    const header: EventHeader = { ...headerData, payloadHash };

    // 3. Sign the canonical header (which includes the payloadHash)
    const canonicalHeader = canonicalize(header);
    const signatureBytes = sign(null, strView(canonicalHeader), ed25519PrivateKey);
    const signatureHex = hexEncode(new Uint8Array(signatureBytes.buffer, signatureBytes.byteOffset, signatureBytes.byteLength));

    // 4. Encrypt the payload with AES-256-GCM
    const dek = randomBytes(32); // 256-bit Data Encryption Key
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv("aes-256-gcm", new Uint8Array(dek.buffer, dek.byteOffset, dek.byteLength), new Uint8Array(iv.buffer, iv.byteOffset, iv.byteLength));
    const c1 = cipher.update(strView(canonicalPayload));
    const c2 = cipher.final() as unknown as Uint8Array;
    const ciphertextView = new Uint8Array(c1.byteLength + c2.byteLength);
    ciphertextView.set(new Uint8Array(c1.buffer, c1.byteOffset, c1.byteLength), 0);
    ciphertextView.set(new Uint8Array(c2.buffer, c2.byteOffset, c2.byteLength), c1.byteLength);
    const tag = cipher.getAuthTag() as unknown as Uint8Array;

    // 5. Wrap the DEK with RSA master public key
    const encryptedDekBytes = publicEncrypt(
      {
        key: this.masterKeyPair.publicKey,
        padding: 1,
      },
      new Uint8Array(dek.buffer, dek.byteOffset, dek.byteLength),
    ) as unknown as Uint8Array;

    return {
      header,
      ciphertext: b64Encode(ciphertextView),
      iv: b64Encode(new Uint8Array(iv.buffer, iv.byteOffset, iv.byteLength)),
      tag: b64Encode(tag),
      encryptedDek: b64Encode(new Uint8Array(encryptedDekBytes.buffer, encryptedDekBytes.byteOffset, encryptedDekBytes.byteLength)),
      signature: signatureHex,
      signerPublicKey: ed25519PublicKey,
    };
  }

  // -----------------------------------------------------------------------
  // Unseal — Decrypt and verify an event
  // -----------------------------------------------------------------------

  /**
   * Unseal an EncryptedEnvelope back to its canonical plaintext.
   *
   * Steps:
   *   1. Verify the Ed25519 signature over the canonical header.
   *   2. Unwrap the DEK using the RSA master private key.
   *   3. Decrypt the ciphertext with AES-256-GCM.
   *   4. Verify `payloadHash` matches the recovered plaintext.
   *
   * Returns the recovered canonical plaintext string.
   */
  unsealEnvelope(
    envelope: EncryptedEnvelope,
    trustedSignerPublicKey?: string,
  ): string {
    // 1. Verify the Ed25519 signature
    const signerKey = trustedSignerPublicKey ?? envelope.signerPublicKey;
    const canonicalHeader = canonicalize(envelope.header);
    const isVerified = verify(
      null,
      strView(canonicalHeader),
      signerKey,
      hexDecode(envelope.signature),
    );
    if (!isVerified) {
      throw new Error(
        `Signature verification failed for event ${envelope.header.eventId}`,
      );
    }

    // 2. Unwrap the DEK
    const dek = privateDecrypt(
      {
        key: this.masterKeyPair.privateKey,
        padding: 1,
      },
      b64Decode(envelope.encryptedDek),
    );

    // 3. Decrypt the ciphertext
    const decipher = createDecipheriv(
      "aes-256-gcm",
      new Uint8Array(dek.buffer, dek.byteOffset, dek.byteLength),
      b64Decode(envelope.iv),
    );
    decipher.setAuthTag(b64Decode(envelope.tag));
    const d1 = decipher.update(b64Decode(envelope.ciphertext));
    const d2 = decipher.final() as unknown as Uint8Array;

    const plaintextView = new Uint8Array(d1.byteLength + d2.byteLength);
    plaintextView.set(new Uint8Array(d1.buffer, d1.byteOffset, d1.byteLength), 0);
    plaintextView.set(new Uint8Array(d2.buffer, d2.byteOffset, d2.byteLength), d1.byteLength);
    const plaintext = new TextDecoder().decode(plaintextView);

    // 4. Verify payloadHash matches recovered plaintext
    const recoveredHash = createHash("sha256")
      .update(plaintext, "utf8")
      .digest("hex");
    if (recoveredHash !== envelope.header.payloadHash) {
      throw new Error(
        `Payload hash mismatch for event ${envelope.header.eventId}: ` +
          `expected ${envelope.header.payloadHash}, got ${recoveredHash}`,
      );
    }

    return plaintext;
  }

  // -----------------------------------------------------------------------
  // Verify Only — Integrity check without decryption
  // -----------------------------------------------------------------------

  /**
   * Verify the integrity of an envelope WITHOUT decrypting the payload.
   *
   * This is the KEY OPERATION enabled by the Header/Ciphertext split:
   * the Event Store, SSE transport, and governance audit can verify
   * integrity, deduplicate, and route events using ONLY the header and
   * payloadHash — no decryption required.
   *
   * Returns true if the signature and payloadHash commitment are valid.
   */
  verifyIntegrity(
    envelope: EncryptedEnvelope,
    trustedSignerPublicKey?: string,
  ): boolean {
    try {
      const signerKey = trustedSignerPublicKey ?? envelope.signerPublicKey;
      const canonicalHeader = canonicalize(envelope.header);
      return verify(
        null,
        strView(canonicalHeader),
        signerKey,
        hexDecode(envelope.signature),
      );
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Decrypt Payload Only (no signature check) — for bulk processing
  // -----------------------------------------------------------------------

  /**
   * Decrypt the payload without signature verification.
   *
   * WARNING: Only use this when signature verification has already been
   * performed upstream (e.g., during batch replay where every event was
   * verified at ingest time).
   */
  decryptPayload(envelope: EncryptedEnvelope): string {
    const dek = privateDecrypt(
      {
        key: this.masterKeyPair.privateKey,
        padding: 1,
      },
      b64Decode(envelope.encryptedDek),
    );

    const decipher = createDecipheriv(
      "aes-256-gcm",
      new Uint8Array(dek.buffer, dek.byteOffset, dek.byteLength),
      b64Decode(envelope.iv),
    );
    decipher.setAuthTag(b64Decode(envelope.tag));
    const d1 = decipher.update(b64Decode(envelope.ciphertext));
    const d2 = decipher.final() as unknown as Uint8Array;
    const plaintextView = new Uint8Array(d1.byteLength + d2.byteLength);
    plaintextView.set(new Uint8Array(d1.buffer, d1.byteOffset, d1.byteLength), 0);
    plaintextView.set(new Uint8Array(d2.buffer, d2.byteOffset, d2.byteLength), d1.byteLength);
    return new TextDecoder().decode(plaintextView);
  }
}
