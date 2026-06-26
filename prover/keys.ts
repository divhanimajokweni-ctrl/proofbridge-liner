export interface KeyVersion {
  keyId: string;
  publicKey: string;
  privateKey?: string;
  validFrom: number;
  validTo?: number;
}

/**
 * Global keyring for managing key versions and rotation.
 */
const KEYRING: KeyVersion[] = [];

/**
 * Adds a new key version to the keyring.
 */
export function addKey(key: KeyVersion): void {
  KEYRING.push(key);
}

/**
 * Retrieves the currently active key based on the current timestamp.
 */
export function getActiveKey(): KeyVersion {
  const now = Date.now();
  const key = KEYRING.find(k =>
    k.validFrom <= now && (!k.validTo || k.validTo > now)
  );

  if (!key) {
    throw new Error("KEY_ERR_NO_ACTIVE_KEY_FOUND");
  }

  return key;
}

/**
 * Retrieves a specific key version by its ID.
 */
export function getKeyById(keyId: string): KeyVersion | undefined {
  return KEYRING.find(k => k.keyId === keyId);
}
