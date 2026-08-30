function cycleGraphLaplacian(n) {
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    L[i][i] = 2;
    const left = (i - 1 + n) % n;
    const right = (i + 1) % n;
    L[i][left] = -1;
    L[i][right] = -1;
  }
  return L;
}
function completeGraphLaplacian(n) {
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    L[i][i] = n - 1;
    for (let j = 0; j < n; j++) {
      if (i !== j) L[i][j] = -1;
    }
  }
  return L;
}
function matVec(M, v) {
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
function l2Norm(v) {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}
function symmetricEigenvalues(matrix) {
  const n = matrix.length;
  if (n === 0) return [];
  if (n === 1) return [matrix[0][0]];
  const A = matrix.map((row) => [...row]);
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
        let t;
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
  eigenvalues.sort((a, b) => a - b);
  return eigenvalues;
}
function heatKernelDiffusion(L, u0, kappa = 0.25, steps = 100) {
  const n = u0.length;
  const eigenvalues = symmetricEigenvalues(L);
  const lambdaMax = Math.max(...eigenvalues.map(Math.abs), 1e-9);
  const dt = 0.5 / lambdaMax;
  const stepRecords = [];
  let u = [...u0];
  const initialL2 = l2Norm(u) || 1;
  const sortedDesc = [...eigenvalues].sort((a, b) => b - a);
  const highFreqCount = Math.max(1, Math.floor(n / 2));
  const highFreqThreshold = sortedDesc[highFreqCount - 1] || 0;
  for (let step = 0; step <= steps; step++) {
    const Lu = matVec(L, u);
    const highFreqEnergy = l2Norm(Lu);
    stepRecords.push({
      step,
      l2Norm: l2Norm(u),
      highFreqEnergy,
      nodeValues: [...u]
    });
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
    retention: finalL2 / initialL2
  };
}
function gaussianInitialCondition(n, center, sigma = 5) {
  const u = [];
  for (let i = 0; i < n; i++) {
    const d = Math.min(
      Math.abs(i - center),
      n - Math.abs(i - center)
      // wrap-around for cycle graph
    );
    u.push(Math.exp(-(d * d) / (2 * sigma * sigma)));
  }
  const norm = l2Norm(u);
  return norm > 0 ? u.map((x) => x / norm) : u;
}
function smoothEvidenceWeights(evidenceWeights, kappa = 0.1, steps = 25) {
  const n = evidenceWeights.length;
  if (n === 0) return { smoothed: [], retention: 0 };
  if (n === 1) return { smoothed: [...evidenceWeights], retention: 1 };
  const L = completeGraphLaplacian(n);
  const result = heatKernelDiffusion(L, evidenceWeights, kappa, steps);
  const smoothed = result.steps[result.steps.length - 1].nodeValues;
  return { smoothed, retention: result.retention };
}
export {
  completeGraphLaplacian,
  cycleGraphLaplacian,
  gaussianInitialCondition,
  heatKernelDiffusion,
  smoothEvidenceWeights
};
