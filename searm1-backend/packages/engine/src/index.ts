// ─────────────────────────────────────────────────────────────
// @searm1/engine — Public API
// ─────────────────────────────────────────────────────────────
// Pure-TypeScript evidence engine for the VVU-IVE pipeline.
// No I/O, no side effects (besides Math.random in spatialSignal).
// Suitable for both server (API) and worker (simulator) use.
// ─────────────────────────────────────────────────────────────

export * from './types';
export * from './evidence';
export * from './eis';
