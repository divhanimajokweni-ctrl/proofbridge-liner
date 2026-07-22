// Epistemic Runtime v0.8 — Operational Collector
// External systems produce observations. They enter AcceptancePipeline.
// Only then may OperationalSnapshotFact exist.
//
// CONTRACT: This collector is READ-ONLY. It only creates observations
// and submits them through the pipeline. It NEVER writes directly
// to the fact log or any storage.

import type { FactType, AcceptanceResult } from './types';
import type { RuntimeKernel } from './runtime';

/**
 * An observation source — produces observations from external systems.
 * Implementations must be DETERMINISTIC: no Date.now(), Math.random(),
 * or other non-deterministic APIs. Configuration drives output.
 */
export interface ObservationSource {
  /** Unique name for this source */
  name: string;
  /** Collect observations from the external system */
  collect(): Promise<Array<{ type: FactType; body: Record<string, unknown> }>>;
}

// ---------------------------------------------------------------------------
// Built-in Sources
// ---------------------------------------------------------------------------

/**
 * GitSource — collects git log entries as observations.
 *
 * DETERMINISTIC: Given the same repoPath and commits config, always produces
 * the same observations. Does NOT use Date.now() or Math.random().
 *
 * In production, this would shell out to `git log` and parse the output.
 * For the kernel's deterministic replay guarantee, we accept pre-computed
 * commit data via the `commits` config parameter.
 */
export interface GitSourceConfig {
  /** Path to the git repository (used as metadata, not accessed at runtime) */
  repoPath: string;
  /** Pre-computed commit entries — drives deterministic output */
  commits: Array<{
    hash: string;
    author: string;
    message: string;
    branch: string;
    sequence: number;
  }>;
}

export class GitSource implements ObservationSource {
  readonly name: string;
  private config: GitSourceConfig;

  constructor(config: GitSourceConfig) {
    this.name = `git:${config.repoPath}`;
    this.config = config;
  }

  async collect(): Promise<Array<{ type: FactType; body: Record<string, unknown> }>> {
    return this.config.commits.map((commit) => ({
      type: 'observation' as FactType,
      body: {
        source: 'git',
        repoPath: this.config.repoPath,
        commitHash: commit.hash,
        author: commit.author,
        message: commit.message,
        branch: commit.branch,
        commitSequence: commit.sequence,
      },
    }));
  }
}

/**
 * FileSystemSource — collects file system change observations.
 *
 * DETERMINISTIC: Given the same watchPaths and changes config,
 * always produces the same observations.
 *
 * In production, this would use filesystem watchers (e.g., chokidar).
 * For deterministic replay, changes are provided via config.
 */
export interface FileSystemSourceConfig {
  /** Paths being watched (metadata) */
  watchPaths: string[];
  /** Pre-computed file change entries */
  changes: Array<{
    path: string;
    changeType: 'created' | 'modified' | 'deleted';
    contentHash: string;
    sizeBytes: number;
    sequence: number;
  }>;
}

export class FileSystemSource implements ObservationSource {
  readonly name: string;
  private config: FileSystemSourceConfig;

  constructor(config: FileSystemSourceConfig) {
    this.name = `filesystem:${config.watchPaths.join(',')}`;
    this.config = config;
  }

  async collect(): Promise<Array<{ type: FactType; body: Record<string, unknown> }>> {
    return this.config.changes.map((change) => ({
      type: 'observation' as FactType,
      body: {
        source: 'filesystem',
        watchPaths: this.config.watchPaths,
        filePath: change.path,
        changeType: change.changeType,
        contentHash: change.contentHash,
        sizeBytes: change.sizeBytes,
        changeSequence: change.sequence,
      },
    }));
  }
}

/**
 * CISource — collects CI/CD pipeline status observations.
 *
 * DETERMINISTIC: Given the same pipeline and runs config,
 * always produces the same observations.
 */
export interface CISourceConfig {
  /** CI/CD pipeline name */
  pipeline: string;
  /** Pre-computed CI run entries */
  runs: Array<{
    runId: string;
    status: 'success' | 'failure' | 'running' | 'cancelled';
    stage: string;
    commitHash: string;
    durationMs: number;
    sequence: number;
  }>;
}

export class CISource implements ObservationSource {
  readonly name: string;
  private config: CISourceConfig;

  constructor(config: CISourceConfig) {
    this.name = `ci:${config.pipeline}`;
    this.config = config;
  }

  async collect(): Promise<Array<{ type: FactType; body: Record<string, unknown> }>> {
    return this.config.runs.map((run) => ({
      type: 'observation' as FactType,
      body: {
        source: 'ci',
        pipeline: this.config.pipeline,
        runId: run.runId,
        status: run.status,
        stage: run.stage,
        commitHash: run.commitHash,
        durationMs: run.durationMs,
        runSequence: run.sequence,
      },
    }));
  }
}

// ---------------------------------------------------------------------------
// OperationalCollector — the orchestrator
// ---------------------------------------------------------------------------

/**
 * OperationalCollector — collects observations from external systems
 * and submits them through the AcceptancePipeline.
 *
 * INVARIANT: This collector NEVER writes directly to the fact log.
 * All observations flow through kernel.submit() which routes through
 * the AcceptancePipeline. This preserves the universal write gate
 * contract.
 */
export class OperationalCollector {
  private sources: Map<string, ObservationSource> = new Map();

  /**
   * Register an observation source.
   */
  registerSource(source: ObservationSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Remove a previously registered source by name.
   */
  removeSource(name: string): void {
    this.sources.delete(name);
  }

  /**
   * Collect all observations from all registered sources
   * and submit them through the kernel's acceptance pipeline.
   *
   * Each observation is submitted individually so that the pipeline
   * can accept/reject each one independently.
   *
   * The submittedBy field uses the source name to maintain provenance.
   * The schemaId defaults to the standard observation schema.
   */
  async collect(kernel: RuntimeKernel): Promise<AcceptanceResult[]> {
    const results: AcceptanceResult[] = [];

    for (const [sourceName, source] of this.sources) {
      const observations = await source.collect();

      for (const observation of observations) {
        const result = await kernel.submit(
          observation.type,
          observation.body,
          `operational-collector:${sourceName}`,
          `schema-${observation.type}-v1`,
        );
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get the names of all registered sources.
   */
  listSources(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Check if a source is registered.
   */
  hasSource(name: string): boolean {
    return this.sources.has(name);
  }

  /**
   * Get the count of registered sources.
   */
  get sourceCount(): number {
    return this.sources.size;
  }
}
