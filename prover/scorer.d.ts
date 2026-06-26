export function scoreAsset(
  assetId: string,
  ipfsCid: string,
  expectedHash: string,
  actualHash: string,
  mismatchCount: number,
  totalFields: number
): { triggerScore: number; classification: string; posteriorMean: number };

export function computePosteriorMean(
  mismatches: number,
  total: number,
  alpha?: number,
  beta?: number
): number;

export function classify(
  score: number
): 'Weak evidence' | 'Strong evidence' | 'Unreachable';

export const config: Record<string, unknown>;
