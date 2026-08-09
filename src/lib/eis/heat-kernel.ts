/**
 * EIS — Heat Kernel Diffusion (Theorem 3)
 *
 *   u_t = -κ L u
 *
 * where L = D - A is the graph Laplacian of the provenance graph.
 *
 * Theorem 3 proves the heat kernel is the correct epistemic diffusion model:
 *   - Evidence accumulates (low-frequency modes persist)
 *   - Older, unverified evidence decays (high-frequency modes die out)
 *   - System converges to a stable state (only zero eigenspace survives)
 *
 * Contrast: the wave equation u_tt + c²Lu = 0 conserves energy exactly
 * (drift = 0.000e+00) but is inappropriate — evidence should not oscillate
 * forever.
 *
 * Key numeric signatures (from the proof):
 *   - Heat kernel L2 norm at t=25: 0.904 (91% retained, monotonic decay)
 *   - Heat kernel high-frequency energy ratio: 0.000× (suppressed)
 */

import { HeatKernelResult, HeatKernelStep } from "./types";

/**
 * Build the graph Laplacian L = D - A for a cycle graph of N nodes
 * (each node connected to its two neighbors). This is the topology
 * used in the proof's Experiment B.
 *
 * The cycle graph is circulant with eigenvalues λ_k = 2 - 2 cos(2πk/N).
 */
export function cycleGraphLaplacian(n: number): number[][] {
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    L[i][i] = 2;
    const left = (i - 1 + n) % n;
    const right = (i + 1) % n;
    L[i][left] = -1;
    L[i][right] = -1;
  }
  return L;
}

/**
 * Build a complete-graph Laplacian (every evidence item connected to every other).
 * This is the topology used when applying the heat kernel to an evidence set.
 */
export function completeGraphLaplacian(n: number): number[][] {
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    L[i][i] = n - 1;
    for (let j = 0; j < n; j++) {
      if (i !== j) L[i][j] = -1;
    }
  }
  return L;
}

/**
 * Matrix-vector multiplication.
 */
function matVec(M: number[][], v: number[]): number[] {
  const n = M.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < v.length; j++) {
      s += M[i][j] * v[j];
    }
    out[i] = s;
  }
  return out;
}

/**
 * Compute L2 norm of a vector.
 */
function l2Norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

/**
 * Compute the eigenvalues of a symmetric matrix using the Jacobi algorithm
 * (shared with participation-ratio.ts — duplicated here for module independence).
 */
function symmetricEigenvalues(matrix: number[][]): number[] {
  const n = matrix.length;
  if (n === 0) return [];
  if (n === 1) return [matrix[0][0]];

  const A: number[][] = matrix.map((row) => [...row]);
  const maxSweeps = 100;
  const tolerance = 1e-10;

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        off += A[i][j] * A[i][j];
      }
    }
    if (off < tolerance) break;

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
          t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        }
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
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

  const eigenvalues = A.map((row, i) => row[i]);
  eigenvalues.sort((a, b) => a - b); // ascending for Laplacian
  return eigenvalues;
}

/**
 * Apply the heat kernel diffusion u_t = -κ L u using explicit Euler steps.
 *
 *   u(t+dt) = u(t) - κ dt L u(t)
 *
 * For stability we use dt = 0.5 / λ_max where λ_max is the largest
 * eigenvalue of L (for the cycle graph this is ≤ 4, so dt ≤ 0.125).
 *
 * @param L          Graph Laplacian
 * @param u0         Initial evidence distribution
 * @param kappa      Diffusion constant (default 0.25, matching the proof)
 * @param steps      Number of diffusion steps (default 100)
 * @returns          Trace of L2 norms and node values per step
 */
export function heatKernelDiffusion(
  L: number[][],
  u0: number[],
  kappa: number = 0.25,
  steps: number = 100
): HeatKernelResult {
  const n = u0.length;
  const eigenvalues = symmetricEigenvalues(L);
  const lambdaMax = Math.max(...eigenvalues.map(Math.abs), 1e-9);
  const dt = 0.5 / lambdaMax; // CFL stability

  const stepRecords: HeatKernelStep[] = [];
  let u = [...u0];
  const initialL2 = l2Norm(u) || 1;

  // Define high-frequency band as eigenvalues in the top half of the spectrum
  const sortedDesc = [...eigenvalues].sort((a, b) => b - a);
  const highFreqCount = Math.max(1, Math.floor(n / 2));
  const highFreqThreshold = sortedDesc[highFreqCount - 1] || 0;

  for (let step = 0; step <= steps; step++) {
    const Lu = matVec(L, u);

    // High-frequency energy: sum of |u_i|² for nodes aligned with high-λ eigenvectors
    // Approximated here as the L2 norm of L u (which amplifies high-freq components)
    const highFreqEnergy = l2Norm(Lu);

    stepRecords.push({
      step,
      l2Norm: l2Norm(u),
      highFreqEnergy,
      nodeValues: [...u],
    });

    // Explicit Euler step
    const newU = u.map((ui, i) => {
      let lui = 0;
      for (let j = 0; j < n; j++) {
        lui += L[i][j] * u[j];
      }
      return ui - kappa * dt * lui;
    });
    u = newU;
  }

  const finalL2 = stepRecords[stepRecords.length - 1].l2Norm;
  const finalHighFreq = stepRecords[stepRecords.length - 1].highFreqEnergy;
  const initialHighFreq = stepRecords[0].highFreqEnergy || 1;

  return {
    steps: stepRecords,
    finalL2Norm: finalL2,
    finalHighFreqEnergy: finalHighFreq / initialHighFreq,
    retention: finalL2 / initialL2,
  };
}

/**
 * Build a Gaussian initial condition centered at a given node,
 * matching the proof's Experiment B setup.
 */
export function gaussianInitialCondition(
  n: number,
  center: number,
  sigma: number = 5.0
): number[] {
  const u: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = Math.min(
      Math.abs(i - center),
      n - Math.abs(i - center) // wrap-around for cycle graph
    );
    u.push(Math.exp(-(d * d) / (2 * sigma * sigma)));
  }
  // Normalize so initial L2 = 1
  const norm = l2Norm(u);
  return norm > 0 ? u.map((x) => x / norm) : u;
}

/**
 * Apply the heat kernel to an evidence set, returning the smoothed
 * evidence weights after diffusion.
 *
 * Each evidence item becomes a node in a complete graph; the heat
 * kernel propagates confidence across related items.
 */
export function smoothEvidenceWeights(
  evidenceWeights: number[],
  kappa: number = 0.1,
  steps: number = 25
): { smoothed: number[]; retention: number } {
  const n = evidenceWeights.length;
  if (n === 0) return { smoothed: [], retention: 0 };
  if (n === 1) return { smoothed: [...evidenceWeights], retention: 1 };

  const L = completeGraphLaplacian(n);
  const result = heatKernelDiffusion(L, evidenceWeights, kappa, steps);
  const smoothed = result.steps[result.steps.length - 1].nodeValues;
  return { smoothed, retention: result.retention };
}
