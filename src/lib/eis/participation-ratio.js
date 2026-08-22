function squaredDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum;
}
function median(xs) {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function medianHeuristicGamma(embeddings) {
  if (embeddings.length < 2) return 1;
  const dists = [];
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      dists.push(squaredDistance(embeddings[i], embeddings[j]));
    }
  }
  const med = median(dists);
  if (med <= 1e-12) return 1;
  return 1 / med;
}
function rbfGramMatrix(embeddings, gamma) {
  const n = embeddings.length;
  const G = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        G[i][j] = 1;
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
          t = sign * 1 / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
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
  eigenvalues.sort((a, b) => Math.abs(b) - Math.abs(a));
  return eigenvalues;
}
function computeParticipationRatio(embeddings, gammaOverride) {
  const n = embeddings.length;
  if (n === 0) {
    return {
      nInd: 0,
      numEvidence: 0,
      numSources: 0,
      gamma: 0,
      eigenvalues: []
    };
  }
  if (n === 1) {
    return {
      nInd: 1,
      numEvidence: 1,
      numSources: 1,
      gamma: gammaOverride != null ? gammaOverride : 1,
      eigenvalues: [1]
    };
  }
  const gamma = gammaOverride != null ? gammaOverride : medianHeuristicGamma(embeddings);
  const G = rbfGramMatrix(embeddings, gamma);
  const eigenvalues = symmetricEigenvalues(G);
  const clamped = eigenvalues.map((e) => Math.max(0, e));
  const sumLambda = clamped.reduce((s, e) => s + e, 0);
  const sumLambdaSq = clamped.reduce((s, e) => s + e * e, 0);
  if (sumLambdaSq < 1e-15) {
    return {
      nInd: 0,
      numEvidence: n,
      numSources: 0,
      gamma,
      eigenvalues: clamped
    };
  }
  const nInd = sumLambda * sumLambda / sumLambdaSq;
  return {
    nInd,
    numEvidence: n,
    numSources: Math.round(nInd),
    gamma,
    eigenvalues: clamped
  };
}
function synthesizeEmbedding(source, seed, dim = 20) {
  const centerSeed = hashString(source);
  const center = seededVector(centerSeed, dim);
  const jitter = seededVector(centerSeed + seed * 7919, dim).map(
    (v) => v * 0.3
  );
  return center.map((c, i) => c + jitter[i]);
}
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = h * 16777619 >>> 0;
  }
  return h;
}
function seededVector(seed, dim) {
  let state = seed >>> 0;
  const rand = () => {
    state |= 0;
    state = state + 1831565813 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const v = [];
  for (let i = 0; i < dim; i++) {
    v.push(rand() * 2 - 1);
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map((x) => x / norm) : v;
}
export {
  computeParticipationRatio,
  medianHeuristicGamma,
  rbfGramMatrix,
  symmetricEigenvalues,
  synthesizeEmbedding
};
