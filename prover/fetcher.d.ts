export interface EvidencePackage {
  assetId: string;
  ipfsCid: string;
  expectedHash: string;
  actualHash: string;
  match: boolean;
}

export function runOnce(): Promise<void>;
export function checkAsset(assetId: string): Promise<EvidencePackage>;
export function sha256(data: Buffer | string): string;
export function loadAssets(): Array<{ assetId: string; ipfsCid: string; expectedHash: string }>;
export function loadPreviousState(): Record<string, string>;
