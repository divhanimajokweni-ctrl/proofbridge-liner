import { ComponentManifestSchema, type ComponentManifest } from './contracts';

/** Capability is declared, not implicitly inherited. Value-transfer capability is never granted by the registry. */
export const SYSTEM_COMPONENTS: ComponentManifest[] = [
  { id:'evidence.collector', version:'1.0.0', title:'Evidence Collector', layer:'evidence', description:'Normalizes source observations and preserves source references.', requires:[], provides:['evidence.raw','evidence.source-reference'], capabilities:['read-evidence','write-evidence'], trustBoundary:'source adapters are untrusted until independently checked', failMode:'closed', status:'registered' },
  { id:'eis.boundary-check', version:'1.0.0', title:'Evidence Independence Specification', layer:'eis', description:'Checks provenance links, independence declarations, schema and causal bindings.', requires:['evidence.raw'], provides:['evidence.boundary-checked'], capabilities:['read-evidence','write-evidence'], trustBoundary:'does not assert source truth merely because the shape is valid', failMode:'closed', status:'registered' },
  { id:'safekrypte.verifier', version:'1.0.0', title:'SafeKrypte Verification Adapter', layer:'cryptography', description:'Adapter boundary for real signature, key epoch and attestation verification.', requires:['evidence.boundary-checked'], provides:['crypto.verified'], capabilities:['read-evidence','verify-signatures'], trustBoundary:'must call authoritative key custody and cryptographic verifier', failMode:'closed', status:'planned' },
  { id:'mainframe.triad', version:'1.0.0', title:'Mainframe Operational Triad', layer:'operations', description:'Checks metric freshness, reporter lineage and independent corroboration.', requires:['crypto.verified'], provides:['operations.corroborated'], capabilities:['read-evidence','emit-telemetry'], trustBoundary:'operational metrics are not underwriting decisions', failMode:'closed', status:'planned' },
  { id:'underwriting.policy', version:'1.0.0', title:'Underwriting Boundary', layer:'underwriting', description:'Matches verified incident facts against authoritative coverage terms and validity.', requires:['operations.corroborated'], provides:['underwriting.eligible'], capabilities:['read-evidence'], trustBoundary:'may classify eligibility; cannot execute payouts or change keys', failMode:'closed', status:'planned' },
  { id:'safestakes.policy', version:'1.0.0', title:'SafeStakes Policy Gate', layer:'policy', description:'Evaluates pool, bond, policy and slash conditions without owning key custody.', requires:['underwriting.eligible'], provides:['policy.permitted'], capabilities:['read-evidence','evaluate-policy'], trustBoundary:'policy evaluation is separate from execution', failMode:'closed', status:'planned' },
  { id:'ubuntu-pools.application', version:'1.0.0', title:'Ubuntu Pools Application Boundary', layer:'application', description:'Checks application events against the verified evidence and policy references.', requires:['policy.permitted'], provides:['application.consistent'], capabilities:['read-evidence'], trustBoundary:'application logic cannot bypass verification or invoke direct claims execution', failMode:'closed', status:'planned' },
  { id:'ive.final-verifier', version:'1.0.0', title:'VVU·IVE Final Verification', layer:'orchestration', description:'Aggregates gate results and emits the terminal verification report; it does not authorize value transfer.', requires:['application.consistent'], provides:['ive.terminal-decision','ive.verification-report'], capabilities:['read-evidence','write-evidence'], trustBoundary:'a PASS is not execution authorization', failMode:'closed', status:'registered' },
  { id:'evidence.durable-ledger', version:'1.0.0', title:'Durable Evidence Ledger', layer:'evidence', description:'Persists the terminal report and evidence references, then returns a verifiable durable-receipt reference.', requires:['ive.verification-report'], provides:['evidence.receipt-durable'], capabilities:['read-evidence','write-evidence'], trustBoundary:'production must bind this adapter to append-only/WORM storage; local registration alone proves no durability', failMode:'closed', status:'planned' },
  { id:'safestakes.execution-boundary', version:'1.0.0', title:'SafeStakes Execution Boundary', layer:'execution', description:'Checks that a separate execution request references the permitted policy, consistent application event and durable VVU·IVE receipt.', requires:['policy.permitted','application.consistent','evidence.receipt-durable'], provides:['execution.request-reviewed'], capabilities:['read-evidence','authorize-execution'], trustBoundary:'reviewing a request does not move funds; transactional execution remains in the authoritative SafeStakes service', failMode:'closed', status:'planned' },
  { id:'lab.workspace', version:'1.0.0', title:'VVU Lab Workspace', layer:'presentation', description:'Standalone Three.js spatial lab and presentation surface, served as a static UI component.', requires:[], provides:['ui.lab-workspace'], capabilities:['render-ui'], trustBoundary:'visualization only; no authority over evidence, policy or execution', failMode:'read-only', status:'registered', entrypoint:'/lab-workspace/' },
  { id:'system.observability', version:'1.0.0', title:'System Observability', layer:'observability', description:'Collects component health and trace identifiers without changing domain decisions.', requires:[], provides:['telemetry.component-health'], capabilities:['emit-telemetry'], trustBoundary:'telemetry is descriptive and cannot mutate domain state', failMode:'isolated', status:'registered' },
].map((item) => ComponentManifestSchema.parse(item));

export function listComponents() {
  return SYSTEM_COMPONENTS.map((component) => ({ ...component }));
}

export function resolveComponentGraph(components: ComponentManifest[] = SYSTEM_COMPONENTS) {
  const ids = new Set<string>();
  const provided = new Set<string>();
  for (const c of components) {
    if (ids.has(c.id)) throw new Error(`DUPLICATE_COMPONENT_ID:${c.id}`);
    ids.add(c.id);
    for (const capability of c.provides) provided.add(capability);
    if (c.capabilities.includes('execute-value-transfer')) throw new Error(`FORBIDDEN_CAPABILITY_GRANT:${c.id}`);
  }
  const missing = components.flatMap((c) => c.requires.filter((r) => !provided.has(r)).map((r) => ({ componentId:c.id, requirement:r })));
  if (missing.length) throw new Error(`MISSING_COMPONENT_REQUIREMENTS:${missing.map((m) => `${m.componentId}->${m.requirement}`).join(',')}`);

  const edges = new Map<string, Set<string>>(components.map((c) => [c.id, new Set()]));
  for (const consumer of components) for (const requirement of consumer.requires) {
    const providers = components.filter((c) => c.provides.includes(requirement));
    if (providers.length !== 1) throw new Error(`AMBIGUOUS_PROVIDER:${requirement}:${providers.map(p=>p.id).join(',')}`);
    edges.get(providers[0].id)!.add(consumer.id);
  }
  const indegree = new Map(components.map((c) => [c.id, 0]));
  for (const targets of edges.values()) for (const target of targets) indegree.set(target, (indegree.get(target) ?? 0) + 1);
  const queue = components.filter((c) => indegree.get(c.id) === 0).map((c) => c.id).sort();
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!; order.push(id);
    for (const target of [...edges.get(id)!].sort()) {
      const next = indegree.get(target)! - 1; indegree.set(target, next);
      if (next === 0) { queue.push(target); queue.sort(); }
    }
  }
  if (order.length !== components.length) throw new Error('COMPONENT_DEPENDENCY_CYCLE');
  return { order, count: components.length, missingRequirements: [], cycleDetected: false as const };
}

export function getSystemArchitecture() {
  return {
    architectureVersion: '1.0.0',
    extensionModel: 'manifest-driven, versioned, dependency-checked',
    decisionModel: 'fail-closed, evidence-linked, no implicit authority inheritance',
    components: listComponents(),
    graph: resolveComponentGraph(),
    invariants: [
      'A component can only claim capabilities explicitly declared in its manifest.',
      'Every required capability has exactly one registered provider.',
      'Dependency cycles and missing requirements block graph resolution.',
      'A verification PASS never authorizes value transfer.',
      'Cryptographic verification, underwriting, policy evaluation and execution remain distinct boundaries.',
      'Presentation components are read-only with respect to trust and execution state.',
      'Adding a component must not require rewriting the core orchestration contract.'
    ],
  };
}
