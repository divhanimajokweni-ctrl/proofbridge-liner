/**
 * VVU AIR v3.1.0 — Kernel Store
 *
 * Manages mutable session state for the Adaptive Intelligence Runtime.
 * All state lives in module-level variables (no external storage).
 *
 * Responsibilities:
 *   - Telemetry baselines and readings
 *   - Drift event tracking
 *   - Constitution version history
 *   - Evidence attachment management
 *   - Custom rule registration and merging
 *   - RFC lifecycle (Draft → Review → Approved → Rejected)
 */

import {
  Rule,
  TelemetryBaseline,
  DEFAULT_CAPABILITIES,
  DEFAULT_BASELINES,
  DEFAULT_RULES,
  DEFAULT_RFC_ENTRIES,
  RFCEntry,
} from './data';

// ─── STATE CONTAINERS ───────────────────────────────────────────────────────

/**
 * Per-capability telemetry baselines.
 * Keyed by capabilityId, each value holds the baseline metric record.
 */
export const telemetryBaselines: Map<string, Record<string, number>> = new Map<
  string,
  Record<string, number>
>();

/**
 * Append-only log of telemetry readings received at runtime.
 */
export const telemetryReadings: Array<{
  capabilityId: string;
  field: string;
  value: number;
  timestamp: string;
}> = [];

/**
 * Recorded drift events — whenever a reading deviates from its baseline.
 */
export const driftEvents: Array<{
  id: string;
  capabilityId: string;
  field: string;
  baseline: number;
  actual: number;
  severity: 'WARN' | 'CRITICAL';
  resolved: boolean;
  timestamp: string;
}> = [];

/**
 * Historical record of constitution versions.
 * Initialized with v1.0.0, v2.0.0, v2.1.0.
 */
export const constitutionVersions: Array<{
  version: string;
  date: string;
  changelog: string;
  rfcOrigin?: string;
}> = [
  {
    version: '1.0.0',
    date: '2025-06-01T00:00:00Z',
    changelog: 'Initial AIR constitution. Established core telemetry and evidence model.',
    rfcOrigin: undefined,
  },
  {
    version: '2.0.0',
    date: '2025-09-15T00:00:00Z',
    changelog: 'Telemetry baseline architecture. Added per-capability baselines and drift detection.',
    rfcOrigin: 'rfc-001',
  },
  {
    version: '2.1.0',
    date: '2025-11-20T00:00:00Z',
    changelog: 'Evidence attachment system. Field-level validation with 9 evidence types.',
    rfcOrigin: 'rfc-002',
  },
];

/**
 * User-registered custom rules that augment the builtin defaults.
 */
export const customRules: Array<{
  id: string;
  title: string;
  description: string;
  schema: Record<string, string>;
  enabled: boolean;
  source: string;
}> = [];

// ─── RFC LIFECYCLE STATE ────────────────────────────────────────────────────

/**
 * Internal RFC registry — drives the Draft → Review → Approved lifecycle.
 * Seeded with historical RFCs from data.ts defaults.
 */
const rfcRegistry: RFCEntry[] = [...DEFAULT_RFC_ENTRIES];

// ─── EVIDENCE MANAGEMENT ────────────────────────────────────────────────────

/**
 * The 9 valid evidence field types that can be attached to capabilities.
 */
export const VALID_EVIDENCE_FIELDS: string[] = [
  'deployment',
  'test',
  'attestation',
  'audit',
  'certification',
  'monitoring',
  'documentation',
  'configuration',
  'integration',
];

/**
 * Internal evidence store — keyed by `${capabilityId}::${field}`.
 */
const evidenceStore: Map<string, string> = new Map<string, string>();

// ─── DRIFT DETECTION THRESHOLDS ─────────────────────────────────────────────

const WARN_THRESHOLD_PERCENT = 10;
const CRITICAL_THRESHOLD_PERCENT = 25;

// ─── HELPER: generate unique IDs ────────────────────────────────────────────

let idCounter = 0;

function generateId(prefix: string): string {
  idCounter += 1;
  const ts = Date.now().toString(36);
  const seq = idCounter.toString(36).padStart(4, '0');
  return `${prefix}-${ts}-${seq}`;
}

function currentTimestamp(): string {
  return new Date().toISOString();
}

// ─── INITIALIZATION ─────────────────────────────────────────────────────────

/**
 * Populate default baselines for each known capability.
 * Each capability gets a copy of DEFAULT_BASELINES so mutations are isolated.
 */
function initializeBaselines(): void {
  for (const cap of DEFAULT_CAPABILITIES) {
    const baselineRecord: Record<string, number> = {
      latency: DEFAULT_BASELINES.latency,
      availability: DEFAULT_BASELINES.availability,
      errorRate: DEFAULT_BASELINES.errorRate,
      adapterVersion: DEFAULT_BASELINES.adapterVersion,
    };
    telemetryBaselines.set(cap, baselineRecord);
  }
}

initializeBaselines();

// ─── EVIDENCE FUNCTIONS ─────────────────────────────────────────────────────

/**
 * Attach an evidence value to a capability field.
 *
 * Validates the field against VALID_EVIDENCE_FIELDS before writing.
 * Overwrites any existing value for the same capability + field pair.
 *
 * @returns `{ success: true }` on attachment, or `{ success: false, error }` on failure.
 */
export function attachEvidence(
  capabilityId: string,
  field: string,
  value: string,
): { success: boolean; error?: string } {
  if (!capabilityId || typeof capabilityId !== 'string') {
    return { success: false, error: 'capabilityId is required and must be a non-empty string.' };
  }

  if (!field || typeof field !== 'string') {
    return { success: false, error: 'field is required and must be a non-empty string.' };
  }

  if (!VALID_EVIDENCE_FIELDS.includes(field)) {
    return {
      success: false,
      error: `Invalid evidence field "${field}". Valid fields: ${VALID_EVIDENCE_FIELDS.join(', ')}.`,
    };
  }

  if (value === undefined || value === null) {
    return { success: false, error: 'value is required and must not be null or undefined.' };
  }

  const key = `${capabilityId}::${field}`;
  evidenceStore.set(key, String(value));

  return { success: true };
}

/**
 * Detach (remove) an evidence value from a capability field.
 *
 * @returns `{ success: true }` if removed, or `{ success: false, error }` if not found or invalid.
 */
export function detachEvidence(
  capabilityId: string,
  field: string,
): { success: boolean; error?: string } {
  if (!capabilityId || typeof capabilityId !== 'string') {
    return { success: false, error: 'capabilityId is required and must be a non-empty string.' };
  }

  if (!field || typeof field !== 'string') {
    return { success: false, error: 'field is required and must be a non-empty string.' };
  }

  if (!VALID_EVIDENCE_FIELDS.includes(field)) {
    return {
      success: false,
      error: `Invalid evidence field "${field}". Valid fields: ${VALID_EVIDENCE_FIELDS.join(', ')}.`,
    };
  }

  const key = `${capabilityId}::${field}`;

  if (!evidenceStore.has(key)) {
    return {
      success: false,
      error: `No evidence found for capability "${capabilityId}" on field "${field}".`,
    };
  }

  evidenceStore.delete(key);
  return { success: true };
}

// ─── RULE MANAGEMENT ────────────────────────────────────────────────────────

/**
 * Merge builtin rules with any registered custom rules.
 *
 * Custom rules with the same `id` as a builtin rule will shadow (override) the builtin.
 * Disabled rules are excluded from the returned list.
 *
 * @returns Array of active (enabled) Rule objects.
 */
export function getActiveRules(): Array<Rule> {
  const merged = new Map<string, Rule>();

  // Load builtin rules first
  for (const rule of DEFAULT_RULES) {
    if (rule.enabled) {
      merged.set(rule.id, { ...rule });
    }
  }

  // Overlay custom rules — shadows builtins with matching id
  for (const rule of customRules) {
    if (rule.enabled) {
      merged.set(rule.id, { ...rule });
    } else {
      // Explicitly disabled custom rule removes the builtin if present
      merged.delete(rule.id);
    }
  }

  return Array.from(merged.values());
}

/**
 * Register a new custom rule at runtime.
 *
 * @returns `{ success: true, rule }` on registration, or `{ success: false, error }` on failure.
 */
export function registerCustomRule(
  rule: Omit<typeof customRules[number], 'source'> & { source?: string },
): { success: boolean; rule?: typeof customRules[number]; error?: string } {
  if (!rule.id || typeof rule.id !== 'string') {
    return { success: false, error: 'Rule id is required and must be a non-empty string.' };
  }

  if (!rule.title || typeof rule.title !== 'string') {
    return { success: false, error: 'Rule title is required and must be a non-empty string.' };
  }

  const existing = customRules.find((r) => r.id === rule.id);
  if (existing) {
    return {
      success: false,
      error: `Rule with id "${rule.id}" already exists. Use updateCustomRule to modify it.`,
    };
  }

  const newRule: typeof customRules[number] = {
    id: rule.id,
    title: rule.title,
    description: rule.description ?? '',
    schema: rule.schema ?? {},
    enabled: rule.enabled ?? true,
    source: rule.source ?? 'user',
  };

  customRules.push(newRule);
  return { success: true, rule: newRule };
}

/**
 * Update an existing custom rule by id.
 *
 * @returns `{ success: true, rule }` on update, or `{ success: false, error }` if not found.
 */
export function updateCustomRule(
  ruleId: string,
  patch: Partial<Pick<typeof customRules[number], 'title' | 'description' | 'schema' | 'enabled'>>,
): { success: boolean; rule?: typeof customRules[number]; error?: string } {
  const rule = customRules.find((r) => r.id === ruleId);
  if (!rule) {
    return { success: false, error: `No custom rule found with id "${ruleId}".` };
  }

  if (patch.title !== undefined) rule.title = patch.title;
  if (patch.description !== undefined) rule.description = patch.description;
  if (patch.schema !== undefined) rule.schema = { ...patch.schema };
  if (patch.enabled !== undefined) rule.enabled = patch.enabled;

  return { success: true, rule };
}

/**
 * Remove a custom rule by id. Cannot remove builtin rules.
 *
 * @returns `{ success: true }` on removal, or `{ success: false, error }` if not found.
 */
export function removeCustomRule(ruleId: string): { success: boolean; error?: string } {
  const idx = customRules.findIndex((r) => r.id === ruleId);
  if (idx === -1) {
    return { success: false, error: `No custom rule found with id "${ruleId}".` };
  }

  customRules.splice(idx, 1);
  return { success: true };
}

/**
 * Get the latest constitution version string (e.g. "2.1.0").
 */
export function getConstitutionVersion(): string {
  if (constitutionVersions.length === 0) {
    return '0.0.0';
  }
  return constitutionVersions[constitutionVersions.length - 1].version;
}

// ─── TELEMETRY FUNCTIONS ────────────────────────────────────────────────────

/**
 * Record a telemetry reading and optionally detect drift against the baseline.
 *
 * @returns The drift event if one was generated, otherwise null.
 */
export function recordTelemetryReading(
  capabilityId: string,
  field: string,
  value: number,
): { driftEvent: typeof driftEvents[number] | null } {
  const reading = {
    capabilityId,
    field,
    value,
    timestamp: currentTimestamp(),
  };

  telemetryReadings.push(reading);

  // Check baseline drift
  const baseline = telemetryBaselines.get(capabilityId);
  if (!baseline || baseline[field] === undefined) {
    return { driftEvent: null };
  }

  const baselineValue = baseline[field];
  const percentDeviation = Math.abs((value - baselineValue) / baselineValue) * 100;

  if (percentDeviation < WARN_THRESHOLD_PERCENT) {
    return { driftEvent: null };
  }

  const severity: 'WARN' | 'CRITICAL' =
    percentDeviation >= CRITICAL_THRESHOLD_PERCENT ? 'CRITICAL' : 'WARN';

  const driftEvent = {
    id: generateId('drift'),
    capabilityId,
    field,
    baseline: baselineValue,
    actual: value,
    severity,
    resolved: false,
    timestamp: reading.timestamp,
  };

  driftEvents.push(driftEvent);
  return { driftEvent };
}

/**
 * Mark a drift event as resolved.
 *
 * @returns `{ success: true }` on resolution, or `{ success: false, error }` if not found.
 */
export function resolveDriftEvent(
  eventId: string,
): { success: boolean; error?: string } {
  const event = driftEvents.find((e) => e.id === eventId);
  if (!event) {
    return { success: false, error: `No drift event found with id "${eventId}".` };
  }

  if (event.resolved) {
    return { success: false, error: `Drift event "${eventId}" is already resolved.` };
  }

  event.resolved = true;
  return { success: true };
}

/**
 * Update the telemetry baseline for a capability field.
 *
 * @returns `{ success: true }` on update, or `{ success: false, error }` on validation failure.
 */
export function setBaseline(
  capabilityId: string,
  field: string,
  value: number,
): { success: boolean; error?: string } {
  if (!capabilityId || typeof capabilityId !== 'string') {
    return { success: false, error: 'capabilityId is required.' };
  }

  const validBaselineFields = ['latency', 'availability', 'errorRate', 'adapterVersion'];
  if (!validBaselineFields.includes(field)) {
    return {
      success: false,
      error: `Invalid baseline field "${field}". Valid fields: ${validBaselineFields.join(', ')}.`,
    };
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { success: false, error: 'value must be a valid number.' };
  }

  // Sanity checks from baseline-sanity rule
  if (field === 'latency' && value < 0) {
    return { success: false, error: 'latency baseline must be >= 0.' };
  }
  if (field === 'availability' && (value < 0 || value > 100)) {
    return { success: false, error: 'availability baseline must be between 0 and 100.' };
  }
  if (field === 'errorRate' && value < 0) {
    return { success: false, error: 'errorRate baseline must be >= 0.' };
  }

  let baseline = telemetryBaselines.get(capabilityId);
  if (!baseline) {
    baseline = {};
    telemetryBaselines.set(capabilityId, baseline);
  }

  baseline[field] = value;
  return { success: true };
}

// ─── RFC LIFECYCLE ──────────────────────────────────────────────────────────

/**
 * Get an RFC entry by id from the internal registry.
 */
function getRFCById(rfcId: string): RFCEntry | undefined {
  return rfcRegistry.find((rfc) => rfc.id === rfcId);
}

/**
 * Advance an RFC to the next status in the lifecycle:
 *
 *   Draft  → Review
 *   Review → Approved
 *
 * Only valid transitions succeed. Already Approved or Rejected RFCs cannot be advanced.
 *
 * @returns `{ success: true }` on transition, or `{ success: false, error }` on invalid transition.
 */
export function advanceRFC(rfcId: string): { success: boolean; error?: string } {
  const rfc = getRFCById(rfcId);
  if (!rfc) {
    return { success: false, error: `No RFC found with id "${rfcId}".` };
  }

  const now = currentTimestamp();

  switch (rfc.status) {
    case 'Draft':
      rfc.status = 'Review';
      rfc.updatedAt = now;
      return { success: true };

    case 'Review':
      rfc.status = 'Approved';
      rfc.updatedAt = now;
      return { success: true };

    case 'Approved':
      return { success: false, error: `RFC "${rfcId}" is already Approved. Cannot advance further.` };

    case 'Rejected':
      return { success: false, error: `RFC "${rfcId}" is Rejected. Cannot advance a rejected RFC.` };

    default:
      return { success: false, error: `RFC "${rfcId}" has unknown status "${(rfc as any).status}".` };
  }
}

/**
 * Reject an RFC at any point in its lifecycle (except already Rejected).
 *
 * @returns `{ success: true }` on rejection, or `{ success: false, error }` if already rejected.
 */
export function rejectRFC(rfcId: string): { success: boolean; error?: string } {
  const rfc = getRFCById(rfcId);
  if (!rfc) {
    return { success: false, error: `No RFC found with id "${rfcId}".` };
  }

  if (rfc.status === 'Rejected') {
    return { success: false, error: `RFC "${rfcId}" is already Rejected.` };
  }

  rfc.status = 'Rejected';
  rfc.updatedAt = currentTimestamp();
  return { success: true };
}

/**
 * Submit a new RFC into the Draft state.
 *
 * @returns `{ success: true, rfc }` with the newly created RFC entry.
 */
export function submitRFC(
  title: string,
  author: string,
  description: string,
  changelog: string,
): { success: boolean; rfc?: RFCEntry; error?: string } {
  if (!title || typeof title !== 'string') {
    return { success: false, error: 'title is required.' };
  }
  if (!author || typeof author !== 'string') {
    return { success: false, error: 'author is required.' };
  }
  if (!description || typeof description !== 'string') {
    return { success: false, error: 'description is required.' };
  }
  if (!changelog || typeof changelog !== 'string') {
    return { success: false, error: 'changelog is required.' };
  }

  const now = currentTimestamp();
  const rfc: RFCEntry = {
    id: generateId('rfc'),
    title,
    author,
    status: 'Draft',
    description,
    changelog,
    createdAt: now,
    updatedAt: now,
  };

  rfcRegistry.push(rfc);
  return { success: true, rfc };
}

/**
 * Get all RFCs in the registry.
 */
export function listRFCs(): RFCEntry[] {
  return rfcRegistry.map((rfc) => ({ ...rfc }));
}

/**
 * Get a single RFC by id.
 */
export function getRFC(rfcId: string): RFCEntry | undefined {
  const rfc = getRFCById(rfcId);
  return rfc ? { ...rfc } : undefined;
}

// ─── CONVERSION HELPERS ─────────────────────────────────────────────────────

/**
 * Convert a customRules entry (plain object) to a full Rule type.
 */
function customRuleToRule(entry: typeof customRules[number]): Rule {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    schema: { ...entry.schema },
    enabled: entry.enabled,
    source: entry.source,
  };
}

/**
 * Get all custom rules as Rule objects (useful for consumers expecting the Rule type).
 */
export function getCustomRulesAsRuleType(): Rule[] {
  return customRules.map(customRuleToRule);
}

/**
 * Get the builtin rules as Rule objects.
 */
export function getBuiltinRules(): Rule[] {
  return DEFAULT_RULES.map((r) => ({ ...r }));
}

// ─── SNAPSHOT / DEBUG ───────────────────────────────────────────────────────

/**
 * Return a read-only snapshot of all store state.
 * Useful for debugging, logging, or serializing to a persistence layer.
 */
export function getStoreSnapshot(): {
  version: string;
  constitutionVersions: Array<{ version: string; date: string; changelog: string; rfcOrigin?: string }>;
  telemetryBaselines: Record<string, Record<string, number>>;
  telemetryReadingsCount: number;
  driftEventsCount: number;
  unresolvedDriftEvents: number;
  evidenceCount: number;
  activeRulesCount: number;
  customRulesCount: number;
  rfcCount: number;
} {
  const baselineSnapshot: Record<string, Record<string, number>> = {};
  for (const [key, value] of telemetryBaselines.entries()) {
    baselineSnapshot[key] = { ...value };
  }

  const unresolvedDrift = driftEvents.filter((e) => !e.resolved);

  return {
    version: getConstitutionVersion(),
    constitutionVersions: constitutionVersions.map((cv) => ({ ...cv })),
    telemetryBaselines: baselineSnapshot,
    telemetryReadingsCount: telemetryReadings.length,
    driftEventsCount: driftEvents.length,
    unresolvedDriftEvents: unresolvedDrift.length,
    evidenceCount: evidenceStore.size,
    activeRulesCount: getActiveRules().length,
    customRulesCount: customRules.length,
    rfcCount: rfcRegistry.length,
  };
}
