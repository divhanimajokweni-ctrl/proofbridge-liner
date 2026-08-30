import crypto from "node:crypto";
import fs from "node:fs";

/**
 * VVU Standalone Ed25519 Key Generator
 * Generates an Ed25519 key pair for use in SafeKrypte or other trust-layer components.
 */

const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });

const result = {
  status: "ED25519_GENERATED",
  timestamp: new Date().toISOString(),
  publicKey: publicKeyPem,
  privateKey: privateKeyPem,
};

console.log(JSON.stringify(result, null, 2));
