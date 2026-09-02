import { db } from '@/lib/db';

// Seed the sovereign DB with the Gqeberha test ground data — mirrors
// vvu-init-db-20260901.sh. Idempotent: safe to call on every boot.
// Returns a summary of what was seeded.

const GQEBERHA_TENANT = {
  id: 'e1002324-0000-0000-0000-000000000001',
  name: 'Gqeberha Beachfront R&D Sector',
  slug: 'gqeberha-beachfront-rd',
};

const ANCHOR = {
  siteName: 'Humewood Beachfront Test Grounds',
  latitude: -33.9608,
  longitude: 25.6022,
  originEcefX: 4758000.0,
  originEcefY: 2244000.0,
  originEcefZ: -3543000.0,
};

const NODES = [
  { componentName: 'Telemetry Mast', xEnuMm: 0, yEnuMm: 0, zEnuMm: 1290, functionalRole: 'Antenna mast and edge-cloud telemetry transceiver' },
  { componentName: 'Inlet Meter Pod', xEnuMm: -750, yEnuMm: -160, zEnuMm: 930, functionalRole: 'Primary inlet flow sensor and acoustic transducer housing' },
  { componentName: 'Outlet Meter Pod', xEnuMm: 750, yEnuMm: 160, zEnuMm: 930, functionalRole: 'Primary outlet flow sensor and acoustic transducer housing' },
  { componentName: 'Pressure Pipe', xEnuMm: 0, yEnuMm: 0, zEnuMm: 750, functionalRole: 'Central structural pressure-retaining spooled fluid line' },
  { componentName: 'Edge Control Cabinet', xEnuMm: 0, yEnuMm: 400, zEnuMm: 400, functionalRole: 'Sealed edge node for local probabilistic processing and Bayesian inference' },
  { componentName: 'Power Backup Module', xEnuMm: 0, yEnuMm: -400, zEnuMm: 400, functionalRole: 'Sealed cabinet housing the 8S4P LiFePO4 battery cell packs' },
  { componentName: 'Left Service Rack', xEnuMm: -720, yEnuMm: -240, zEnuMm: 290, functionalRole: 'Symmetric equipment lateral mounting and cable management bracket' },
  { componentName: 'Right Service Rack', xEnuMm: 720, yEnuMm: 240, zEnuMm: 290, functionalRole: 'Symmetric equipment lateral mounting and cable management bracket' },
  { componentName: 'South Datum Skid', xEnuMm: 0, yEnuMm: -560, zEnuMm: 40, functionalRole: 'Heavy base support chassis and pipeline leveling rail' },
  { componentName: 'North Datum Skid', xEnuMm: 0, yEnuMm: 560, zEnuMm: 40, functionalRole: 'Heavy base support chassis and pipeline leveling rail' },
  { componentName: 'Top Height Beacon', xEnuMm: 100, yEnuMm: 0, zEnuMm: 1465, functionalRole: 'Visual vertical reference warning indicator' },
];

const SPOOLS = [
  { nominalSize: 'DN100', outerDiameterMm: 114.3, innerDiameterMm: 102.3, wallThicknessMm: 6.0, materialGrade: '316L Stainless Steel', flangeStandard: 'SANS 1299 DN100 Standard Flange', boltSpecification: '8x M16 Stainless Steel Grade 8.8', targetTorqueNm: 85.0 },
  { nominalSize: 'DN300', outerDiameterMm: 326.0, innerDiameterMm: 300.0, wallThicknessMm: 13.0, materialGrade: 'Ductile Iron SANS 2531', flangeStandard: 'SANS 1123 / EN 1092-1 PN16', boltSpecification: '12x M24 Grade 8.8 Coarse Thread', targetTorqueNm: 154.7 },
];

const INVARIANTS = {
  minWaveCelerityMs: 200.0,
  maxWaveCelerityMs: 1400.0,
  minFavadExponent: 0.5,
  maxFavadExponent: 2.5,
  maxSacrificialCorrosionMm: 10.0,
  minFactorOfSafety: 1.5,
  maxFactorOfSafety: 3.0,
};

export interface SeedResult {
  tenant: { id: string; name: string; created: boolean };
  anchor: { created: boolean };
  nodes: { created: number; total: number };
  spools: { created: number; total: number };
  invariants: { created: boolean };
}

export async function seedSovereignDb(): Promise<SeedResult> {
  // Tenant (idempotent)
  const existingTenant = await db.tenant.findUnique({ where: { id: GQEBERHA_TENANT.id } });
  let tenantCreated = false;
  if (!existingTenant) {
    await db.tenant.create({ data: GQEBERHA_TENANT });
    tenantCreated = true;
  }

  // Anchor (idempotent — check by siteName + tenantId)
  const existingAnchor = await db.geographicAnchor.findFirst({
    where: { tenantId: GQEBERHA_TENANT.id, siteName: ANCHOR.siteName },
  });
  let anchorCreated = false;
  if (!existingAnchor) {
    await db.geographicAnchor.create({ data: { tenantId: GQEBERHA_TENANT.id, ...ANCHOR } });
    anchorCreated = true;
  }

  // Nodes (idempotent — create individually, skip if componentName already exists)
  for (const n of NODES) {
    const exists = await db.physicalNode.findFirst({
      where: { tenantId: GQEBERHA_TENANT.id, componentName: n.componentName },
    });
    if (!exists) {
      await db.physicalNode.create({ data: { tenantId: GQEBERHA_TENANT.id, ...n } });
    }
  }
  const finalNodeCount = await db.physicalNode.count({ where: { tenantId: GQEBERHA_TENANT.id } });

  // Spools (idempotent — create individually)
  for (const s of SPOOLS) {
    const exists = await db.pipeSpoolProfile.findFirst({
      where: { tenantId: GQEBERHA_TENANT.id, nominalSize: s.nominalSize },
    });
    if (!exists) {
      await db.pipeSpoolProfile.create({ data: { tenantId: GQEBERHA_TENANT.id, ...s } });
    }
  }
  const finalSpoolCount = await db.pipeSpoolProfile.count({ where: { tenantId: GQEBERHA_TENANT.id } });

  // Invariants (idempotent)
  const existingInv = await db.hydraulicInvariant.findFirst({ where: { tenantId: GQEBERHA_TENANT.id } });
  let invariantsCreated = false;
  if (!existingInv) {
    await db.hydraulicInvariant.create({ data: { tenantId: GQEBERHA_TENANT.id, ...INVARIANTS } });
    invariantsCreated = true;
  }

  return {
    tenant: { id: GQEBERHA_TENANT.id, name: GQEBERHA_TENANT.name, created: tenantCreated },
    anchor: { created: anchorCreated },
    nodes: { created: tenantCreated ? finalNodeCount : 0, total: finalNodeCount },
    spools: { created: tenantCreated ? finalSpoolCount : 0, total: finalSpoolCount },
    invariants: { created: invariantsCreated },
  };
}

export async function getDbStats() {
  const [tenants, nodes, spools, invariants, telemetry, audit, ledger] = await Promise.all([
    db.tenant.count(),
    db.physicalNode.count(),
    db.pipeSpoolProfile.count(),
    db.hydraulicInvariant.count(),
    db.telemetryLog.count(),
    db.auditLog.count(),
    db.ledgerEntry.count(),
  ]);
  return { tenants, nodes, spools, invariants, telemetry, audit, ledger };
}
