import crypto from "node:crypto";
import { getActiveKey, getKeyById } from "./keys";
import { canonicalize } from "./chain";

/**
 * Signs a payload using the currently active private key.
 */
export function signPayload(payload: any) {
  const key = getActiveKey();

  if (!key.privateKey) {
    throw new Error("KEY_ERR_PRIVATE_KEY_MISSING");
  }

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(canonicalize(payload));
  sign.end();

  const signature = sign.sign(key.privateKey, "hex");

  return {
    keyId: key.keyId,
    signature
  };
}

/**
 * Verifies a signature against a payload using a specific key version.
 */
export function verifySignature(payload: any, signature: string, keyId: string): boolean {
  const key = getKeyById(keyId);
  if (!key) return false;

  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(canonicalize(payload));
  verify.end();

  return verify.verify(key.publicKey, signature, "hex");
}
