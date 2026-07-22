// Epistemic Runtime v0.8 — Projection Registry
// Tracks registered projections with metadata, supports registration/deprecation
// lifecycle, and emits projection_registered / projection_deprecated facts
// through the acceptance pipeline.
//
// CONTRACT: The registry NEVER writes facts directly. It returns
// fact payloads that the caller submits through the AcceptancePipeline.

import type { FactType, ClockProvider, ProjectionManifest } from './types';
import type { ProjectionHandler } from './projection';
import { computeSHA256 } from './hashing';

/**
 * Metadata for a registered projection.
 */
export interface ProjectionMeta {
  /** Projection name (unique key) */
  name: string;
  /** Version — incremented on re-registration */
  version: number;
  /** Fact types this projection consumes */
  consumes: FactType[];
  /** Logical sequence number when registered */
  registeredAt: number;
  /** Whether this projection has been deprecated */
  deprecated: boolean;
  /** Logical sequence number when deprecated (if applicable) */
  deprecatedAt?: number;
  /** Optional human-readable description */
  description?: string;
}

/**
 * A lifecycle event emitted when a projection is registered or deprecated.
 * Callers should submit these through the AcceptancePipeline.
 */
export interface ProjectionLifecycleFact {
  type: FactType;
  body: Record<string, unknown>;
}

/**
 * History entry recording a registration or deprecation event.
 */
export interface ProjectionHistoryEntry {
  action: 'registered' | 'deprecated';
  name: string;
  at: number;
}

/**
 * ProjectionRegistry — separate from ProjectionEngine, this tracks
 * projection metadata and lifecycle. It does NOT apply facts to projections
 * (that's ProjectionEngine's job). Instead, it:
 *
 * 1. Tracks registered projections with metadata
 * 2. Supports registration/deprecation lifecycle
 * 3. Produces lifecycle fact payloads (projection_registered, projection_deprecated)
 *    that callers submit through the pipeline
 * 4. Provides metadata queries (list, get, history)
 *
 * The separation of concerns means:
 *   - ProjectionEngine: applies facts to projection state (computation)
 *   - ProjectionRegistry: tracks projection metadata (bookkeeping)
 */
export class ProjectionRegistry {
  private projections: Map<string, ProjectionMeta> = new Map();
  private handlers: Map<string, ProjectionHandler> = new Map();
  private manifests: Map<string, ProjectionManifest> = new Map();
  private history: ProjectionHistoryEntry[] = [];

  /**
   * Register a projection handler.
   *
   * Returns the metadata AND the lifecycle fact payload.
   * The caller is responsible for submitting the lifecycle fact
   * through the AcceptancePipeline.
   *
   * If the projection is already registered and not deprecated,
   * this increments the version.
   *
   * If the projection was deprecated, re-registration un-deprecates it
   * and increments the version.
   */
  register(
    handler: ProjectionHandler,
    clock: ClockProvider,
    description?: string,
  ): { meta: ProjectionMeta; fact: ProjectionLifecycleFact } {
    const existing = this.projections.get(handler.name);
    const now = clock.now();

    let version: number;
    let registeredAt: number;

    if (existing) {
      // Re-registration: increment version, clear deprecated status
      version = existing.version + 1;
      registeredAt = now;
    } else {
      version = 1;
      registeredAt = now;
    }

    const meta: ProjectionMeta = {
      name: handler.name,
      version,
      consumes: handler.consumes,
      registeredAt,
      deprecated: false,
      deprecatedAt: undefined,
      description,
    };

    this.projections.set(handler.name, meta);
    this.handlers.set(handler.name, handler);

    // Record history
    this.history.push({
      action: 'registered',
      name: handler.name,
      at: now,
    });

    // Produce lifecycle fact for pipeline submission
    const fact: ProjectionLifecycleFact = {
      type: 'projection_registered' as FactType,
      body: {
        projectionName: handler.name,
        version,
        consumes: handler.consumes,
        registeredAt,
        description: description ?? null,
        projectionId: computeSHA256(`projection:${handler.name}:${version}`),
      },
    };

    return { meta, fact };
  }

  /**
   * Deprecate a projection by name.
   *
   * Returns the lifecycle fact payload for pipeline submission.
   * Throws if the projection is not registered or already deprecated.
   */
  deprecate(
    name: string,
    clock: ClockProvider,
  ): { meta: ProjectionMeta; fact: ProjectionLifecycleFact } {
    const existing = this.projections.get(name);
    if (!existing) {
      throw new Error(`Projection "${name}" is not registered`);
    }
    if (existing.deprecated) {
      throw new Error(`Projection "${name}" is already deprecated`);
    }

    const now = clock.now();

    const meta: ProjectionMeta = {
      ...existing,
      deprecated: true,
      deprecatedAt: now,
    };

    this.projections.set(name, meta);

    // Record history
    this.history.push({
      action: 'deprecated',
      name,
      at: now,
    });

    // Produce lifecycle fact for pipeline submission
    const fact: ProjectionLifecycleFact = {
      type: 'projection_deprecated' as FactType,
      body: {
        projectionName: name,
        version: meta.version,
        deprecatedAt: now,
        projectionId: computeSHA256(`projection:${name}:${meta.version}`),
      },
    };

    return { meta, fact };
  }

  /**
   * Get projection metadata by name.
   */
  get(name: string): ProjectionMeta | null {
    return this.projections.get(name) ?? null;
  }

  /**
   * Get all registered projection metadata.
   */
  list(): ProjectionMeta[] {
    return Array.from(this.projections.values());
  }

  /**
   * Get only active (non-deprecated) projections.
   */
  listActive(): ProjectionMeta[] {
    return this.list().filter(p => !p.deprecated);
  }

  /**
   * Get only deprecated projections.
   */
  listDeprecated(): ProjectionMeta[] {
    return this.list().filter(p => p.deprecated);
  }

  /**
   * Get the registration/deprecation history.
   */
  getHistory(): ProjectionHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Check if a projection is registered (may be deprecated).
   */
  isRegistered(name: string): boolean {
    return this.projections.has(name);
  }

  /**
   * Check if a projection is active (registered and not deprecated).
   */
  isActive(name: string): boolean {
    const meta = this.projections.get(name);
    return meta !== undefined && !meta.deprecated;
  }

  /**
   * Get the handler for a projection (if registered).
   */
  getHandler(name: string): ProjectionHandler | null {
    return this.handlers.get(name) ?? null;
  }

  /**
   * Get the count of registered projections.
   */
  get count(): number {
    return this.projections.size;
  }

  /**
   * Get the count of active projections.
   */
  get activeCount(): number {
    return this.listActive().length;
  }

  /**
   * Register a projection with its manifest metadata.
   */
  registerWithManifest(handler: ProjectionHandler, manifest: ProjectionManifest): void {
    // Note: The basic register() requires a ClockProvider; for manifest-only
    // registration we store the manifest directly without lifecycle events.
    // Callers should also call register() separately if they need lifecycle facts.
    this.manifests.set(manifest.id, manifest);
  }

  /**
   * Get the manifest for a projection.
   */
  getManifest(id: string): ProjectionManifest | undefined {
    return this.manifests.get(id);
  }

  /**
   * List all projection manifests.
   */
  listManifests(): ProjectionManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Reset the registry for replay.
   */
  reset(): void {
    this.projections.clear();
    this.handlers.clear();
    this.manifests.clear();
    this.history = [];
  }
}
