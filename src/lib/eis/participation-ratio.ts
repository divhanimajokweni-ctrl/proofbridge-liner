/**
 * EIS — Participation Ratio Estimator (Theorem 2)
 *
 *   N_ind = (∑λ_i)² / ∑λ_i²
 *
 * where λ_i are the eigenvalues of the RBF Gram matrix
 *   G_ij = exp(-γ ‖φ_i - φ_j‖²)
 *
 * The median heuristic γ = 1 / median(pairwise squared distances) is used
 * by default for automatic bandwidth adaptation.
 *
 * Properties proven:
 *   - Monotonic non-decreasing in true source count m
 *   - Bounded bias: N_ind ≈ α(noise,γ)·m + β(noise,γ)
 *   - Robust across noise levels and γ choices
 *
 * Used by ProofBridge as the integrity conjunct (I) of A = C ∧ E ∧ I ∧ S ∧ R.
 */

import { ParticipationRatioResult } from "./types";

/**
 * Squared Euclidean distance between two vectors.
 */
function squaredDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum;
}

/**
 * Compute the median of a numeric array.
 */
function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Compute the median-heuristic RBF bandwidth γ.
 *   γ = 1 / median({ ‖φ_i - φ_j‖² : i < j })
 */
export function medianHeuristicGamma(embeddings: number[][]): number {
  if (embeddings.length < 2) return 1.0;
  const dists: number[] = [];
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      dists.push(squaredDistance(embeddings[i], embeddings[j]));
    }
  }
  const med = median(dists);
  if (med <= 1e-12) return 1.0; // degenerate — all embeddings identical
  return 1.0 / med;
}

/**
 * Build the RBF Gram matrix.
 *   G_ij = exp(-γ ‖φ_i - φ_j‖²)
 */
export function rbfGramMatrix(
  embeddings: number[][],
  gamma: number
): number[][] {
  const n = embeddings.length;
  const G: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        G[i][j] = 1.0;
      } else {
        const d2 = squaredDistance(embeddings[i], embeddings[j]);
        const v = Math.exp(-gamma * d2);
        G[i][j] = v;
        G[j][i] = v;
      }
    }
  }
  return G;
}

/**
 * Compute eigenvalues of a symmetric matrix using the Jacobi eigenvalue algorithm.
 * Returns eigenvalues sorted in descending order.
 *
 * This is a pure-TypeScript implementation suitable for the small matrices
 * (n ≤ ~100) typical of an evidence set per claim.
 */
export function symmetricEigenvalues(matrix: number[][]): number[] {
  const n = matrix.length;
  if (n === 0) return [];
  if (n === 1) return [matrix[0][0]];

  // Copy to working matrix
  const A: number[][] = matrix.map((row) => [...row]);

  // Track eigenvectors implicitly — we only need eigenvalues here
  const maxSweeps = 100;
  const tolerance = 1e-10;

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    // Compute off-diagonal norm
    let off = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        off += A[i][j] * A[i][j];
      }
    }
    if (off < tolerance) break;

    // Sweep through off-diagonal elements
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) < 1e-15) continue;

        const app = A[p][p];
        const aqq = A[q][q];
        const theta = (aqq - app) / (2 * apq);
        let t: number;
        if (Math.abs(theta) > 1e15) {
          t = 1 / (2 * theta);
        } else {
          const sign = theta >= 0 ? 1 : -1;
          t = (sign * 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        }
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;

        // Apply rotation
        for (let i = 0; i < n; i++) {
          if (i === p || i === q) continue;
          const aip = A[i][p];
          const aiq = A[i][q];
          A[i][p] = c * aip - s * aiq;
          A[p][i] = A[i][p];
          A[i][q] = s * aip + c * aiq;
          A[q][i] = A[i][q];
        }
        A[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
        A[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
        A[p][q] = 0;
        A[q][p] = 0;
      }
    }
  }

  // Extract diagonal (eigenvalues)
  const eigenvalues = A.map((row, i) => row[i]);
  // Sort descending by absolute value (Gram matrix is PSD, so all ≥ 0)
  eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
  return eigenvalues;
}

/**
 * Compute the participation ratio N_ind for a set of evidence embeddings.
 *
 *   N_ind = (∑λ_i)² / ∑λ_i²
 *
 * where λ_i are eigenvalues of the RBF Gram matrix.
 *
 * @param embeddings  Evidence provenance vectors (one per evidence item).
 * @param gammaOverride  If provided, use this bandwidth; otherwise use median heuristic.
 */
export function computeParticipationRatio(
  embeddings: number[][],
  gammaOverride?: number
): ParticipationRatioResult {
  const n = embeddings.length;
  if (n === 0) {
    return {
      nInd: 0,
      numEvidence: 0,
      numSources: 0,
      gamma: 0,
      eigenvalues: [],
    };
  }
  if (n === 1) {
    return {
      nInd: 1,
      numEvidence: 1,
      numSources: 1,
      gamma: gammaOverride ?? 1.0,
      eigenvalues: [1.0],
    };
  }

  const gamma = gammaOverride ?? medianHeuristicGamma(embeddings);
  const G = rbfGramMatrix(embeddings, gamma);
  const eigenvalues = symmetricEigenvalues(G);

  // Clamp tiny negative values from numerical error (matrix is PSD)
  const clamped = eigenvalues.map((e) => Math.max(0, e));

  const sumLambda = clamped.reduce((s, e) => s + e, 0);
  const sumLambdaSq = clamped.reduce((s, e) => s + e * e, 0);

  if (sumLambdaSq < 1e-15) {
    return {
      nInd: 0,
      numEvidence: n,
      numSources: 0,
      gamma,
      eigenvalues: clamped,
    };
  }

  const nInd = (sumLambda * sumLambda) / sumLambdaSq;

  return {
    nInd,
    numEvidence: n,
    numSources: Math.round(nInd),
    gamma,
    eigenvalues: clamped,
  };
}

/**
 * Generate a deterministic synthetic embedding for a given source.
 *
 * In the real VVU, embeddings come from a provenance encoder. Here we
 * deterministically synthesize them so the demo is reproducible: each
 * "source" has a stable center in R^D, and individual evidence items
 * are sampled around it.
 *
 * @param source  One of "you.com" | "brave" | "firecrawl" | "watchdog"
 * @param seed    Per-evidence seed (deterministic jitter)
 * @param dim     Embedding dimension (default 20)
 */
export function synthesizeEmbedding(
  source: string,
  seed: number,
  dim: number = 20
): number[] {
  // Stable per-source center
  const centerSeed = hashString(source);
  const center = seededVector(centerSeed, dim);

  // Per-evidence jitter (deterministic)
  const jitter = seededVector(centerSeed + seed * 7919, dim).map(
    (v) => v * 0.3
  );

  return center.map((c, i) => c + jitter[i]);
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function seededVector(seed: number, dim: number): number[] {
  // Mulberry32 PRNG — deterministic
  let state = seed >>> 0;
  const rand = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const v: number[] = [];
  for (let i = 0; i < dim; i++) {
    v.push(rand() * 2 - 1); // [-1, 1]
  }
  // Normalize to unit length
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map((x) => x / norm) : v;
}
