import crypto from "node:crypto";

export interface Receipt {
  id: string;
  prevHash: string | null;
  payload: any;
  timestamp: number;
}

export interface ChainedReceipt extends Receipt {
  receiptHash: string;
  chainHash: string;
}

/**
 * Canonical JSON serialization (sorted keys).
 */
export function canonicalize(value: unknown): string {
  if (value === undefined) throw new Error("CANONICALIZE_UNSUPPORTED_UNDEFINED");
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`;
}

function hash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Creates a chained receipt by hashing the current receipt and linking it to the previous chain hash.
 */
export function createChainedReceipt(
  receipt: Receipt,
  prevChainHash: string | null
): ChainedReceipt {
  const receiptHash = hash(canonicalize(receipt));

  const chainHash = hash(
    (prevChainHash || "") + receiptHash
  );

  return {
    ...receipt,
    receiptHash,
    chainHash
  };
}
