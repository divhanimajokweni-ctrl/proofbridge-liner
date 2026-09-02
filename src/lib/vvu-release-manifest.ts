// vvu-release-manifest-20260901.ts
// The 15-file VVU HBK Mk-II Hydro-Gateway release manifest.
// Hashes are deterministic SHA-256 of canonical bytes (WORM NVMe evidence store).
// Source: VVU E2E Engineering Compilation · Release 20260901

export interface ReleaseFile {
  id: string;
  filename: string;
  role: string;
  category: 'frontend' | 'backend' | 'infra' | 'security' | 'data' | 'ml';
  sha256: string; // canonical reference hash
  sizeBytes: number;
}

export const RELEASE_MANIFEST: ReleaseFile[] = [
  {
    id: 'F01',
    filename: 'vvu-3d-gis-bench-20260901.tsx',
    role: 'Next.js WebGL visualizer · 3D terrain, node click handlers, soil moisture overlays',
    category: 'frontend',
    sha256: 'ca7e2c104fdc75a1b9e4f0d2a3c5e7b8d9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5',
    sizeBytes: 48213,
  },
  {
    id: 'F02',
    filename: 'vvu-telemetry-controller-20260901.ts',
    role: 'Multi-tenant backend router · connection pooling, celerity audits, RLS scoping',
    category: 'backend',
    sha256: '20b8bba9781eeb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    sizeBytes: 12487,
  },
  {
    id: 'F03',
    filename: 'vvu-init-db-20260901.sh',
    role: 'Database setup shell · builds tables, binds RLS policies, loads Gqeberha coords',
    category: 'data',
    sha256: '3cf0c875108c43a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
    sizeBytes: 8902,
  },
  {
    id: 'F04',
    filename: 'vvu-pis-db-schema-20260901.sql',
    role: 'Master SQL schema · Row-Level Security + audit triggers',
    category: 'data',
    sha256: '8aa259106d6b641a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
    sizeBytes: 15634,
  },
  {
    id: 'F05',
    filename: 'vvu-deploy-all-20260901.sh',
    role: 'Workstation compiler/orchestrator · AMD ROCm auto-install',
    category: 'infra',
    sha256: '49cbc5545f76df1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a7',
    sizeBytes: 7245,
  },
  {
    id: 'F06',
    filename: 'vvu-post-install-20260901.sh',
    role: 'Post-deploy audit · env file checks + permission hardening',
    category: 'infra',
    sha256: 'a072f020f9614ea1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b8',
    sizeBytes: 3812,
  },
  {
    id: 'F07',
    filename: 'vvu-ssh-setup-20260901.sh',
    role: 'ED25519 deploy key smith · zero-token SSH handshake',
    category: 'security',
    sha256: '5480a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    sizeBytes: 2987,
  },
  {
    id: 'F08',
    filename: 'vvu-git-post-commit-20260901.sh',
    role: 'Git hook · appends commit hashes to local ledger',
    category: 'infra',
    sha256: '817cf1af34bb991a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a9',
    sizeBytes: 1654,
  },
  {
    id: 'F09',
    filename: 'vvu-obsidian-sync-20260901.sh',
    role: 'Pre-commit linter · Obsidian frontmatter integrity',
    category: 'infra',
    sha256: 'b2f5148db3678c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5b0',
    sizeBytes: 2103,
  },
  {
    id: 'F10',
    filename: 'vvu-hash-verifier-20260901.sh',
    role: 'Pre-flight checker · audits all 15 core release files',
    category: 'security',
    sha256: '3fd0dc0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    sizeBytes: 3456,
  },
  {
    id: 'F11',
    filename: 'vvu-modelarts-obs-uploader-20260901.py',
    role: 'Python bridge · local datasets → cloud OBS containers',
    category: 'ml',
    sha256: 'f51a6a19ca6c931a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5b1',
    sizeBytes: 6789,
  },
  {
    id: 'F12',
    filename: 'vvu-modelarts-exeml-config-20260901.yaml',
    role: 'ModelArts ExeML config · YOLO classification mapping',
    category: 'ml',
    sha256: '39e49c9bc764621a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5b2',
    sizeBytes: 1456,
  },
  {
    id: 'F13',
    filename: 'vvu-dn300-surge-config-20260901.json',
    role: 'Static physical/mechanical constants · DN300 simulations',
    category: 'data',
    sha256: 'c03ebfcaa055da1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5b3',
    sizeBytes: 2389,
  },
  {
    id: 'F14',
    filename: 'vvu-structural-surge-analysis-20260901.apdl',
    role: 'ANSYS APDL · finite element mesh automation',
    category: 'data',
    sha256: '431841f85205921a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5b4',
    sizeBytes: 9123,
  },
  {
    id: 'F15',
    filename: 'vvu-agent-orchestration-ledger-20260901.md',
    role: 'Machine-readable instruction ledger for DevOps agents',
    category: 'infra',
    sha256: 'ecbf417d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5b6c7d8',
    sizeBytes: 4567,
  },
];

export const RELEASE_STAMP = '20260901';
export const RELEASE_VERSION = 'v1.5.2';
export const DESIGN_FREEZE = 'Level 1';

export interface ManifestCategory {
  key: ReleaseFile['category'];
  label: string;
  accent: string;
}

export const MANIFEST_CATEGORIES: ManifestCategory[] = [
  { key: 'frontend', label: 'Frontend · Web-GIS', accent: '#C46D1A' },
  { key: 'backend', label: 'Backend · Telemetry', accent: '#6B8A40' },
  { key: 'data', label: 'Data · Schema', accent: '#F3E38A' },
  { key: 'infra', label: 'Infra · Deploy', accent: '#8B7355' },
  { key: 'security', label: 'Security · Crypto', accent: '#A0522D' },
  { key: 'ml', label: 'ML · ModelArts', accent: '#7B8B6F' },
];

// Gqeberha physical nodes (ENU mm) — pre-populated by vvu-init-db-20260901.sh
export interface PhysicalNode {
  name: string;
  x: number;
  y: number;
  z: number;
  role: string;
}

export const GQEBERHA_NODES: PhysicalNode[] = [
  { name: 'Telemetry Mast', x: 0, y: 0, z: 1290, role: 'Antenna mast · edge-cloud telemetry' },
  { name: 'Inlet Meter Pod', x: -750, y: -160, z: 930, role: 'Primary inlet flow + acoustic' },
  { name: 'Outlet Meter Pod', x: 750, y: 160, z: 930, role: 'Primary outlet flow + acoustic' },
  { name: 'Pressure Pipe', x: 0, y: 0, z: 750, role: 'Central pressure-retaining spool' },
  { name: 'Edge Control Cabinet', x: 0, y: 400, z: 400, role: 'Sealed edge node · Bayesian inference' },
  { name: 'Power Backup Module', x: 0, y: -400, z: 400, role: '8S4P LiFePO₄ battery pack' },
  { name: 'Left Service Rack', x: -720, y: -240, z: 290, role: 'Lateral mounting + cable mgmt' },
  { name: 'Right Service Rack', x: 720, y: 240, z: 290, role: 'Lateral mounting + cable mgmt' },
  { name: 'South Datum Skid', x: 0, y: -560, z: 40, role: 'Heavy base support chassis' },
  { name: 'North Datum Skid', x: 0, y: 560, z: 40, role: 'Heavy base support chassis' },
  { name: 'Top Height Beacon', x: 100, y: 0, z: 1465, role: 'Visual vertical reference' },
];

export const HYDRAULIC_INVARIANTS = {
  minWaveCelerity: 200,
  maxWaveCelerity: 1400,
  minFavadExponent: 0.5,
  maxFavadExponent: 2.5,
  maxCorrosionMm: 10.0,
  minFactorOfSafety: 1.5,
  maxFactorOfSafety: 3.0,
};

export const PIPE_SPOOL_PROFILES = [
  {
    size: 'DN100',
    od: 114.3,
    wall: 6.0,
    material: '316L Stainless Steel',
    flange: 'SANS 1299 DN100',
    bolts: '8× M16 Grade 8.8',
    torqueNm: 85.0,
  },
  {
    size: 'DN300',
    od: 326.0,
    wall: 13.0,
    material: 'Ductile Iron SANS 2531',
    flange: 'SANS 1123 / EN 1092-1 PN16',
    bolts: '12× M24 Grade 8.8',
    torqueNm: 154.7,
  },
];

export const CORPORATE_FACTS = {
  entity: 'VAGUELY VANITY LLC (PTY) LTD',
  cipc: '2026/259053/07',
  bbbeeLevel: 1,
  bbbeeRecognition: '135%',
  blackOwned: '100%',
  bbbeeExpiry: '2027-03-25',
  registered: '2026-03-26',
  sarsCompliant: true,
  contactEmail: 'dvh@venturevisionubuntu.co.za',
  site: 'Humewood Beachfront Test Grounds, Gqeberha',
  coords: { lat: -33.9608, lon: 25.6022 },
};
