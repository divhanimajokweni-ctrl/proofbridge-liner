/**
 * SEARM1 — simulated water-network leak-detection engine.
 *
 * Pure TypeScript: no React, no DOM, no framework. This module is the seam where
 * real SCADA/telemetry data can later replace the synthetic sensor feed without
 * touching the UI.
 *
 * Everything is deterministic: SeededRandom(SEED=42) reproduces identical results
 * across runs, so demos are reproducible and export hashes are stable per state.
 */

export const SEED = 42;
export const MAX_CYCLES = 80;
export const LEAK_START_CYCLE = 20;
export const GRID_CELLS = 6; // 6x6 grid of cells -> 84 pipe segments
export const BLOCK = 0.008; // grid cell size in degrees
export const MAX_EVIDENCE = 50; // cap on alpha+beta per pipe
export const NAIVE_THRESHOLD = 0.6; // naive method: flag pipe when posterior > this
export const VERIFIED_THRESHOLD = 0.75;
export const CANDIDATE_THRESHOLD = 0.5;

// Pipeline interval between simulation steps (ms). Kept here so the UI and
// documentation agree on the "slow-motion" demo pacing.
export const STEP_INTERVAL_MS = 220;

export type Category = "INSUFFICIENT" | "CANDIDATE" | "VERIFIED";
export type EISGrade = "NONE" | "WEAK" | "MODERATE" | "STRONG";

export interface PipeTransition {
  cycle: number;
  category: Category;
  posterior: number;
}

export interface Pipe {
  id: string;
  dma: string;
  kind: "H" | "V";
  line: number;
  seg: number;
  /** Endpoints in grid degrees (map space). */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Midpoint in degrees (map space). */
  midX: number;
  midY: number;
  /** Approx length in metres. */
  lengthM: number;
  /** Burial depth in metres below surface (3D view). */
  depthM: number;
  alpha: number;
  beta: number;
  obs: number;
  hits: number;
  posterior: number;
  peakPosterior: number;
  eis: number;
  eisGrade: EISGrade;
  category: Category;
  isLeak: boolean;
  adjacentToLeak: boolean;
  history: PipeTransition[];
}

export interface SimStats {
  /** Pipes the VVU-IVE / EIS method flagged (reached VERIFIED at any point). */
  vvuCount: number;
  /** Pipes the naive threshold flagged (peak posterior > 0.6 at any point). */
  naiveCount: number;
  /** VVU-IVE flagged pipes that are not the true leak. */
  vvuFalsePositives: number;
  /** Naive flagged pipes that are not the true leak. */
  naiveFalsePositives: number;
  candidateCount: number;
}

export interface ExportMeta {
  app: string;
  seed: number;
  maxCycles: number;
  leakStartCycle: number;
  cyclesRun: number;
  leakPipeId: string;
  exportedAt: string;
}

/** Deterministic PRNG (mulberry32). */
export class SeededRandom {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}

/** Evaluate the Evidence Independence Score from a posterior probability. */
export function evaluateEIS(posterior: number): number {
  // primary evidence grows with posterior; correlated corroboration is softer;
  // an independent confirmation term rewards pipes that crossed the halfway mark.
  const primary = 0.35 + posterior * 0.65;
  const correlated = Math.sqrt(Math.max(0, posterior));
  const independent = posterior > CANDIDATE_THRESHOLD ? 1 : 0;
  return Math.min(1, 0.5 * primary + 0.3 * correlated + 0.2 * independent);
}

export function eisGradeOf(eis: number): EISGrade {
  if (eis >= 0.8) return "STRONG";
  if (eis >= 0.6) return "MODERATE";
  if (eis >= 0.45) return "WEAK";
  return "NONE";
}

export function categoryOf(posterior: number): Category {
  if (posterior >= VERIFIED_THRESHOLD) return "VERIFIED";
  if (posterior > CANDIDATE_THRESHOLD) return "CANDIDATE";
  return "INSUFFICIENT";
}

function distBetweenPipes(a: Pipe, b: Pipe): number {
  const dx = a.midX - b.midX;
  const dy = a.midY - b.midY;
  return Math.sqrt(dx * dx + dy * dy) / BLOCK; // distance in grid cells
}

/** Sensor hit probability for a pipe on a given cycle. */
function hitProbability(pipe: Pipe, leak: Pipe, leakActive: boolean): number {
  if (!leakActive) return 0.04;
  if (pipe.isLeak) return 0.8;
  const d = distBetweenPipes(pipe, leak);
  // Evidence falls off with distance from the leak — correlated readings near it.
  return 0.04 + 0.6 * Math.exp(-1.6 * d);
}

function sharesEndpoint(a: Pipe, b: Pipe): boolean {
  return (
    (a.x1 === b.x1 && a.y1 === b.y1) ||
    (a.x1 === b.x2 && a.y1 === b.y2) ||
    (a.x2 === b.x1 && a.y2 === b.y1) ||
    (a.x2 === b.x2 && a.y2 === b.y2)
  );
}

function makePipe(
  id: string,
  kind: "H" | "V",
  line: number,
  seg: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: SeededRandom,
): Pipe {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const metresPerDegree = 111320;
  const dLon = Math.abs(x2 - x1) * metresPerDegree * Math.cos((midY * Math.PI) / 180);
  const dLat = Math.abs(y2 - y1) * metresPerDegree;
  const lengthM = Math.max(1, Math.sqrt(dLon * dLon + dLat * dLat));
  const depthM = rng.range(0.8, 2.2);
  const quadrantX = midX >= 0 ? "E" : "W";
  const quadrantY = midY >= 0 ? "N" : "S";
  return {
    id,
    dma: `DMA-${quadrantY}${quadrantX}`,
    kind,
    line,
    seg,
    x1,
    y1,
    x2,
    y2,
    midX,
    midY,
    lengthM,
    depthM,
    alpha: 1,
    beta: 1,
    obs: 0,
    hits: 0,
    posterior: 0.5,
    peakPosterior: 0.5,
    eis: evaluateEIS(0.5),
    eisGrade: eisGradeOf(evaluateEIS(0.5)),
    category: "INSUFFICIENT",
    isLeak: false,
    adjacentToLeak: false,
    history: [],
  };
}

/**
 * Build the synthetic network: a 6x6 grid of cells gives 7 lines per direction,
 * each split into 6 segments -> (7*6)+(7*6) = 84 pipes. The true leak is the
 * middle vertical segment that passes through the grid centre.
 */
export function createNetwork(seed: number = SEED): Pipe[] {
  const rng = new SeededRandom(seed);
  const pipes: Pipe[] = [];
  const n = GRID_CELLS;
  const origin = -(n / 2) * BLOCK; // -0.024

  for (let row = 0; row <= n; row++) {
    const y = origin + row * BLOCK;
    for (let seg = 0; seg < n; seg++) {
      const x1 = origin + seg * BLOCK;
      pipes.push(makePipe(`H${row}-${seg}`, "H", row, seg, x1, y, x1 + BLOCK, y, rng));
    }
  }
  for (let col = 0; col <= n; col++) {
    const x = origin + col * BLOCK;
    for (let seg = 0; seg < n; seg++) {
      const y1 = origin + seg * BLOCK;
      pipes.push(makePipe(`V${col}-${seg}`, "V", col, seg, x, y1, x, y1 + BLOCK, rng));
    }
  }

  const mid = Math.floor(n / 2);
  const leak = pipes.find((p) => p.id === `V${mid}-${mid}`);
  if (leak) leak.isLeak = true;
  for (const p of pipes) {
    if (p.isLeak) continue;
    if (leak && sharesEndpoint(p, leak)) p.adjacentToLeak = true;
  }
  return pipes;
}

export function findLeakPipe(pipes: Pipe[]): Pipe {
  const leak = pipes.find((p) => p.isLeak);
  if (!leak) throw new Error("Network has no leak pipe");
  return leak;
}

/** Advance the whole network by one simulation cycle. */
export function step(pipes: Pipe[], cycle: number, rng: SeededRandom): void {
  const leak = findLeakPipe(pipes);
  const leakActive = cycle >= LEAK_START_CYCLE;
  for (const pipe of pipes) {
    const p = hitProbability(pipe, leak, leakActive);
    const hit = rng.next() < p;
    // EIS-weighted evidence growth: stronger independence scores move alpha/beta
    // more, so genuinely suspicious pipes converge faster than noise.
    const weight = 0.4 + pipe.eis * 0.8;
    const total = pipe.alpha + pipe.beta;
    if (total < MAX_EVIDENCE) {
      if (hit) pipe.alpha += weight;
      else pipe.beta += weight;
    }
    pipe.obs += 1;
    if (hit) pipe.hits += 1;
    pipe.posterior = pipe.alpha / (pipe.alpha + pipe.beta);
    if (pipe.posterior > pipe.peakPosterior) pipe.peakPosterior = pipe.posterior;
    pipe.eis = evaluateEIS(pipe.posterior);
    pipe.eisGrade = eisGradeOf(pipe.eis);
    const cat = categoryOf(pipe.posterior);
    if (cat !== pipe.category) {
      pipe.category = cat;
      pipe.history.push({ cycle, category: cat, posterior: pipe.posterior });
    }
  }
}

/** Return every pipe to its neutral starting state. */
export function resetPipes(pipes: Pipe[]): void {
  for (const pipe of pipes) {
    pipe.alpha = 1;
    pipe.beta = 1;
    pipe.obs = 0;
    pipe.hits = 0;
    pipe.posterior = 0.5;
    pipe.peakPosterior = 0.5;
    pipe.eis = evaluateEIS(0.5);
    pipe.eisGrade = eisGradeOf(pipe.eis);
    pipe.category = "INSUFFICIENT";
    pipe.history = [];
  }
}

export function confidenceInterval(pipe: Pipe): { low: number; high: number } {
  const n = Math.max(pipe.obs, 1);
  const se = Math.sqrt((pipe.posterior * (1 - pipe.posterior)) / n);
  return {
    low: Math.max(0, pipe.posterior - 1.96 * se),
    high: Math.min(1, pipe.posterior + 1.96 * se),
  };
}

/**
 * Comparative analysis. VVU-IVE (the EIS-driven method) counts pipes that reached
 * VERIFIED; the naive method counts pipes whose peak posterior exceeded 0.6.
 * False positives exclude the true leak pipe. Counting "flagged at any point"
 * reflects the operator workload each method imposes.
 */
export function computeStats(pipes: Pipe[]): SimStats {
  const vvu = pipes.filter((p) => p.peakPosterior >= VERIFIED_THRESHOLD);
  const naive = pipes.filter((p) => p.peakPosterior > NAIVE_THRESHOLD);
  return {
    vvuCount: vvu.length,
    naiveCount: naive.length,
    vvuFalsePositives: vvu.filter((p) => !p.isLeak).length,
    naiveFalsePositives: naive.filter((p) => !p.isLeak).length,
    candidateCount: pipes.filter((p) => p.category === "CANDIDATE").length,
  };
}

export function buildExportMeta(cyclesRun: number, pipes: Pipe[]): ExportMeta {
  const leak = findLeakPipe(pipes);
  return {
    app: "SEARM1 Water Network Map Stack",
    seed: SEED,
    maxCycles: MAX_CYCLES,
    leakStartCycle: LEAK_START_CYCLE,
    cyclesRun,
    leakPipeId: leak.id,
    exportedAt: new Date().toISOString(),
  };
}
