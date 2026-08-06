/**
 * VVU Pricing & Proprietary Structure
 *
 * This module defines the complete pricing and proprietary structure for VVU's
 * product suite. Every product, every tier, every boundary between what's
 * open source and what's proprietary is defined here — no ambiguity.
 *
 * Currency: South African Rand (ZAR)
 * Target Market: South Africa (with African expansion)
 */

// ---------------------------------------------------------------------------
// Product Licensing Model
// ---------------------------------------------------------------------------

export type LicensingModel =
  | 'open-source'        // Apache 2.0 — full source available
  | 'open-core'          // Core is open source, enterprise features are proprietary
  | 'freemium'           // Free tier with paid upgrades
  | 'proprietary'        // Fully proprietary, paid only
  | 'community-free';    // Free for community use, paid for organizations

export interface ProductLicense {
  productId: string;
  productLabel: string;
  licensingModel: LicensingModel;
  license: string;           // e.g. "Apache 2.0", "VVU Proprietary"
  openSource: boolean;       // Is the core open source?
  sourceUrl: string | null;  // GitHub repo if open source
  /** What's free */
  freeIncludes: string[];
  /** What's paid/proprietary */
  paidIncludes: string[];
  /** Clear boundary: what makes the paid version different */
  boundary: string;
}

// ---------------------------------------------------------------------------
// Editions (Subscription Tiers)
// ---------------------------------------------------------------------------

export type EditionId = 'community' | 'professional' | 'enterprise';

export interface Edition {
  id: EditionId;
  label: string;
  tagline: string;
  priceMonthly: number | null;   // ZAR, null = free
  priceAnnual: number | null;    // ZAR, null = free (annual billing, ~2 months free)
  priceLabel: string;            // Human-readable price string
  description: string;
  targetAudience: string;
  features: EditionFeature[];
  limits: EditionLimits;
  highlight: boolean;            // Should this be visually highlighted?
  cta: string;                   // Call-to-action button text
  badge?: string;                // Optional badge text
}

export interface EditionFeature {
  label: string;
  included: boolean;
  detail?: string;               // Extra detail on hover
}

export interface EditionLimits {
  maxUsers: number | null;       // null = unlimited
  maxPipelines: number | null;
  maxReceipts: number | null;
  maxCampaigns: number | null;
  maxKnowledgeNodes: number | null;
  maxStorage: string;            // e.g. "1 GB", "100 GB"
  support: string;               // e.g. "Community", "Priority email", "Dedicated"
  sla: string;                   // e.g. "None", "99.5%", "99.9%"
  retention: string;             // e.g. "30 days", "1 year", "Unlimited"
}

// ---------------------------------------------------------------------------
// Trust Tiers (Authentication Levels)
// ---------------------------------------------------------------------------

export type TrustTierId = 'browse' | 'verified' | 'financial' | 'web3';

export interface TrustTier {
  id: TrustTierId;
  label: string;
  description: string;
  requirement: string;           // What you need to achieve this tier
  unlocks: string[];             // What capabilities this tier unlocks
  icon: string;
}

// ---------------------------------------------------------------------------
// Product Pricing (Per-Product Breakdown)
// ---------------------------------------------------------------------------

export interface ProductPricing {
  productId: string;
  productLabel: string;
  communityPrice: string;
  professionalPrice: string;
  enterprisePrice: string;
  unit: string;                  // e.g. "per month", "per pipeline", "per 1k receipts"
  notes: string;
}

// ---------------------------------------------------------------------------
// DATA: Product Licensing
// ---------------------------------------------------------------------------

export const PRODUCT_LICENSES: ProductLicense[] = [
  {
    productId: 'epistemic',
    productLabel: 'Epistemic Runtime',
    licensingModel: 'open-core',
    license: 'Apache 2.0 (Core) + VVU Proprietary (Enterprise)',
    openSource: true,
    sourceUrl: 'https://github.com/divhanimajokweni-ctrl/proofbridge-liner',
    freeIncludes: [
      'DAG control plane',
      '11-step acceptance pipeline',
      'MMR proofs',
      'SHA-256 hashing',
      'RFC 8785 canonicalization',
      'In-memory WORM storage',
      'Deterministic clock & entropy',
      'Policy DSL',
      'Community support',
    ],
    paidIncludes: [
      'S3 Object Lock storage',
      'AWS KMS signing',
      'Shard replication',
      'ZK-merge reconciliation',
      'Shadow bridge (hot standby)',
      'Multi-tenant isolation',
      'SLA guarantees',
      'Dedicated support',
    ],
    boundary: 'The core runtime is open source. Enterprise features (cloud storage, KMS signing, sharding, ZK-merge, SLA) require a paid subscription.',
  },
  {
    productId: 'proofbridge',
    productLabel: 'ProofBridge',
    licensingModel: 'freemium',
    license: 'VVU Proprietary (Free tier + Paid upgrades)',
    openSource: false,
    sourceUrl: null,
    freeIncludes: [
      'Up to 1,000 receipts/month',
      'Ed25519 signing',
      'Basic verification',
      'Community support',
      'Receipt history (30 days)',
    ],
    paidIncludes: [
      'Unlimited receipts',
      'ZK-proof generation',
      'Cross-system trust bridging',
      'API access (REST + WebSocket)',
      'Receipt history (unlimited)',
      'Batch verification',
      'Webhook integrations',
      'Priority support',
    ],
    boundary: 'Free for individuals and small organizations (up to 1k receipts/month). Paid tiers unlock unlimited receipts, ZK proofs, and API access.',
  },
  {
    productId: 'hbk',
    productLabel: 'HBK (Hydro-Bayesian Kernel)',
    licensingModel: 'proprietary',
    license: 'VVU Proprietary',
    openSource: false,
    sourceUrl: null,
    freeIncludes: [
      'Documentation & whitepapers',
      'Community forum access',
      'Demo environment (sandbox)',
    ],
    paidIncludes: [
      'MCMC inference engine',
      'Brier Score monitoring',
      'TRIP verdict system',
      'Municipal water loss detection',
      'Edge computing appliance',
      'Dedicated integration support',
      'On-site deployment',
      'Regulatory compliance reporting',
    ],
    boundary: 'HBK is a proprietary industrial product. No free usage of the inference engine. Municipalities and enterprises license the full system. Sandbox demos available for evaluation.',
  },
  {
    productId: 'ubuntu-pools',
    productLabel: 'Ubuntu Pools',
    licensingModel: 'community-free',
    license: 'VVU Proprietary (Free for individuals)',
    openSource: false,
    sourceUrl: null,
    freeIncludes: [
      'Create and join stokvels',
      'Cryptographic contribution receipts',
      'Ubuntu Score tracking',
      'Community governance tools',
      'Up to 3 pools per user',
      'Basic pool analytics',
    ],
    paidIncludes: [
      'Unlimited pools',
      'Ubuntu Prime tier',
      'Advanced analytics',
      'Organization pool management',
      'Stitch bank integration',
      'Cross-pool trust attestation',
      'Custom governance rules',
      'Financial reporting',
    ],
    boundary: 'Free for individuals participating in stokvels. Organizations and large-scale pool operators pay for advanced features and unlimited pools.',
  },
  {
    productId: 'air-runtime',
    productLabel: 'AIR Runtime',
    licensingModel: 'open-source',
    license: 'Apache 2.0',
    openSource: true,
    sourceUrl: 'https://github.com/divhanimajokweni-ctrl/proofbridge-liner',
    freeIncludes: [
      'Circuit Breaker state machine',
      'NATS queue integration',
      'HLC merge',
      'Hard-Failure gates',
      'Full source code',
      'Community support',
    ],
    paidIncludes: [
      'Managed hosting',
      'Enterprise support',
      'Custom integration',
    ],
    boundary: 'Fully open source. No paid features. Enterprise support and managed hosting are available separately.',
  },
  {
    productId: 'growth',
    productLabel: 'Growth Infrastructure',
    licensingModel: 'proprietary',
    license: 'VVU Proprietary',
    openSource: false,
    sourceUrl: null,
    freeIncludes: [
      'Documentation',
      'Architecture overview',
    ],
    paidIncludes: [
      '10 growth agents',
      'Knowledge graph',
      'Research agent',
      'Compliance agent',
      'Campaign management',
      'Asset reuse pipeline',
      'Trust scoring',
      'Cloud-native integrations',
      'Analytics dashboard',
    ],
    boundary: 'Growth Infrastructure is proprietary. Only available with Professional or Enterprise editions. No free tier.',
  },
  {
    productId: 'sphere',
    productLabel: 'Trust Sphere',
    licensingModel: 'community-free',
    license: 'VVU Proprietary (Free for all)',
    openSource: false,
    sourceUrl: null,
    freeIncludes: [
      'Global trust network visualization',
      'Personal view',
      'Node state inspection',
      'Real-time updates',
    ],
    paidIncludes: [
      'API access for trust data',
      'Custom visualization',
      'Embeddable widgets',
    ],
    boundary: 'Free for everyone. The visualization is a community resource. API access and embedding require a paid subscription.',
  },
  {
    productId: 'simulation',
    productLabel: '72h Simulation',
    licensingModel: 'open-core',
    license: 'Apache 2.0 (Core) + VVU Proprietary (Enterprise)',
    openSource: true,
    sourceUrl: 'https://github.com/divhanimajokweni-ctrl/proofbridge-liner',
    freeIncludes: [
      'HBK digital twin prototype',
      'Real-time Git Actions log',
      'Cape Town water network simulation',
      'Community support',
    ],
    paidIncludes: [
      'Custom network topologies',
      'Full validation reporting',
      'Multi-scenario comparison',
      'API access',
      'Dedicated compute resources',
    ],
    boundary: 'The core simulation framework is open source. Enterprise features (custom topologies, full reporting, API) require a paid subscription.',
  },
];

// ---------------------------------------------------------------------------
// DATA: Editions
// ---------------------------------------------------------------------------

export const EDITIONS: Edition[] = [
  {
    id: 'community',
    label: 'Community',
    tagline: 'Free forever. For individuals, students, and community members.',
    priceMonthly: null,
    priceAnnual: null,
    priceLabel: 'Free',
    description: 'Get started with VVU\'s core trust infrastructure at zero cost. Browse the trust network, verify receipts, and join community pools.',
    targetAudience: 'Individuals, students, community members, researchers',
    features: [
      { label: 'Trust Sphere visualization', included: true, detail: 'Full global and personal view of the trust network' },
      { label: 'ProofBridge verification', included: true, detail: 'Verify receipts and authenticity — up to 1,000/month' },
      { label: 'Ubuntu Pools participation', included: true, detail: 'Join and create up to 3 stokvel pools' },
      { label: 'Ubuntu Score tracking', included: true, detail: 'Your personal trust score across pools' },
      { label: 'AIR Runtime', included: true, detail: 'Full open-source circuit breaker' },
      { label: 'Epistemic Runtime (core)', included: true, detail: 'Open-source DAG control plane, 11-step pipeline, MMR proofs' },
      { label: '72h Simulation (core)', included: true, detail: 'HBK digital twin prototype, Cape Town water network' },
      { label: 'Community support', included: true, detail: 'Discord community, GitHub issues, documentation' },
      { label: 'Growth Infrastructure', included: false, detail: 'Requires Professional or Enterprise' },
      { label: 'HBK inference engine', included: false, detail: 'Requires Enterprise — municipal/industrial product' },
      { label: 'ZK-proof generation', included: false, detail: 'Requires Professional or Enterprise' },
      { label: 'Custom network topologies', included: false, detail: 'Requires Professional or Enterprise' },
      { label: 'SLA guarantees', included: false, detail: 'Requires Enterprise' },
      { label: 'Dedicated support', included: false, detail: 'Requires Enterprise' },
    ],
    limits: {
      maxUsers: 1,
      maxPipelines: 1,
      maxReceipts: 1000,
      maxCampaigns: 0,
      maxKnowledgeNodes: 0,
      maxStorage: '1 GB',
      support: 'Community',
      sla: 'None',
      retention: '30 days',
    },
    highlight: false,
    cta: 'Get Started Free',
    badge: undefined,
  },
  {
    id: 'professional',
    label: 'Professional',
    tagline: 'For teams, organizations, and growing businesses.',
    priceMonthly: 1499,
    priceAnnual: 14990,
    priceLabel: 'R1,499/mo',
    description: 'Unlock the full VVU platform. Growth Infrastructure, unlimited receipts, ZK proofs, API access, and priority support for your team.',
    targetAudience: 'Small teams, NGOs, startups, research groups, growing businesses',
    features: [
      { label: 'Everything in Community', included: true, detail: 'All Community features included' },
      { label: 'Growth Infrastructure', included: true, detail: '10 growth agents, knowledge graph, campaigns, trust scoring' },
      { label: 'ProofBridge unlimited', included: true, detail: 'Unlimited receipts with ZK-proof generation' },
      { label: 'Ubuntu Pools unlimited', included: true, detail: 'Unlimited pools, Ubuntu Prime tier, advanced analytics' },
      { label: 'Epistemic Runtime (full)', included: true, detail: 'S3 Object Lock, AWS KMS signing, shard replication, ZK-merge' },
      { label: '72h Simulation (full)', included: true, detail: 'Custom topologies, full validation reporting, API access' },
      { label: 'API access (REST + WebSocket)', included: true, detail: 'Full programmatic access to all VVU services' },
      { label: 'Webhook integrations', included: true, detail: 'Slack, Notion, GitHub, CRM integrations' },
      { label: 'Up to 5 team members', included: true, detail: 'Collaborative workspace with shared access' },
      { label: 'Priority email support', included: true, detail: '24-hour response time during business hours' },
      { label: 'HBK inference engine', included: false, detail: 'Requires Enterprise — municipal/industrial product' },
      { label: 'SLA guarantees', included: false, detail: 'Requires Enterprise' },
      { label: 'Dedicated support', included: false, detail: 'Requires Enterprise' },
      { label: 'On-site deployment', included: false, detail: 'Requires Enterprise' },
    ],
    limits: {
      maxUsers: 5,
      maxPipelines: 10,
      maxReceipts: null,
      maxCampaigns: null,
      maxKnowledgeNodes: 100,
      maxStorage: '100 GB',
      support: 'Priority email',
      sla: '99.5%',
      retention: '1 year',
    },
    highlight: true,
    cta: 'Start Professional',
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    tagline: 'For municipalities, large organizations, and government.',
    priceMonthly: null,
    priceAnnual: null,
    priceLabel: 'Custom',
    description: 'Full VVU platform with HBK, on-site deployment, SLA guarantees, dedicated support, and custom integration. Built for organizations that need trust infrastructure at scale.',
    targetAudience: 'Municipalities, government agencies, large enterprises, financial institutions',
    features: [
      { label: 'Everything in Professional', included: true, detail: 'All Professional features included' },
      { label: 'HBK inference engine', included: true, detail: 'Full MCMC inference, Brier Score monitoring, TRIP verdicts' },
      { label: 'On-site deployment', included: true, detail: 'Deploy in your own data center or cloud environment' },
      { label: 'Custom integration', included: true, detail: 'Municipal systems, CRM, banking, government APIs' },
      { label: 'Unlimited team members', included: true, detail: 'No user limits across your organization' },
      { label: 'SLA guarantees', included: true, detail: '99.9% uptime SLA with financial penalties' },
      { label: 'Dedicated support engineer', included: true, detail: 'Named contact, 4-hour response time, 24/7 critical' },
      { label: 'Regulatory compliance', included: true, detail: 'POPIA, FICA, FSCA, municipal procurement compliance' },
      { label: 'Custom training', included: true, detail: 'On-site training for your team, quarterly workshops' },
      { label: 'Audit & reporting', included: true, detail: 'SOC 2 preparation, audit logs, compliance reports' },
      { label: 'Multi-tenant isolation', included: true, detail: 'Full data isolation between departments and organizations' },
      { label: 'Shadow bridge (hot standby)', included: true, detail: 'Zero-downtime failover for critical infrastructure' },
      { label: 'Custom branding', included: true, detail: 'White-label VVU for your organization' },
      { label: 'Roadmap influence', included: true, detail: 'Shape the VVU product roadmap with priority feature requests' },
    ],
    limits: {
      maxUsers: null,
      maxPipelines: null,
      maxReceipts: null,
      maxCampaigns: null,
      maxKnowledgeNodes: null,
      maxStorage: 'Unlimited',
      support: 'Dedicated engineer',
      sla: '99.9%',
      retention: 'Unlimited',
    },
    highlight: false,
    cta: 'Contact Sales',
    badge: 'For Organizations',
  },
];

// ---------------------------------------------------------------------------
// DATA: Trust Tiers
// ---------------------------------------------------------------------------

export const TRUST_TIERS: TrustTier[] = [
  {
    id: 'browse',
    label: 'Browse',
    description: 'View-only access. No authentication required.',
    requirement: 'None — just visit the website',
    unlocks: ['Trust Sphere visualization', 'Public documentation', 'Community forum'],
    icon: 'Eye',
  },
  {
    id: 'verified',
    label: 'Verified',
    description: 'Email-authenticated. Can create and interact with VVU systems.',
    requirement: 'Email verification via Clerk',
    unlocks: ['Receipt creation & verification', 'Ubuntu Pools participation', 'Simulation runs', 'Growth Infrastructure', 'Epistemic Runtime'],
    icon: 'ShieldCheck',
  },
  {
    id: 'financial',
    label: 'Financial',
    description: 'KYC-verified. Can manage money pools and financial transactions.',
    requirement: 'KYC via Stitch (SA Banks) or Stripe (International)',
    unlocks: ['Ubuntu Pools management', 'Financial transactions', 'Stitch bank integration', 'Ubuntu Score financial history'],
    icon: 'Coins',
  },
  {
    id: 'web3',
    label: 'Web3',
    description: 'Wallet-connected. Can use on-chain features and ZK proofs.',
    requirement: 'Polygon wallet connection',
    unlocks: ['On-chain circuit breaker', 'ZK-proof artifacts', 'Cross-chain trust attestation', 'Decentralized identity'],
    icon: 'Link',
  },
];

// ---------------------------------------------------------------------------
// DATA: Product Pricing Grid
// ---------------------------------------------------------------------------

export const PRODUCT_PRICING_GRID: ProductPricing[] = [
  {
    productId: 'epistemic',
    productLabel: 'Epistemic Runtime',
    communityPrice: 'Free',
    professionalPrice: 'Included',
    enterprisePrice: 'Included',
    unit: 'per month',
    notes: 'Core is open source (Apache 2.0). Enterprise features (S3, KMS, sharding) require paid tier.',
  },
  {
    productId: 'proofbridge',
    productLabel: 'ProofBridge',
    communityPrice: 'Free (1k/mo)',
    professionalPrice: 'Included (unlimited)',
    enterprisePrice: 'Included (unlimited)',
    unit: 'per month',
    notes: 'Free for up to 1,000 receipts/month. ZK proofs require Professional+.',
  },
  {
    productId: 'hbk',
    productLabel: 'HBK',
    communityPrice: '—',
    professionalPrice: '—',
    enterprisePrice: 'Custom',
    unit: 'license',
    notes: 'Industrial product only. No free or standard tier. Municipal/enterprise licensing only.',
  },
  {
    productId: 'ubuntu-pools',
    productLabel: 'Ubuntu Pools',
    communityPrice: 'Free (3 pools)',
    professionalPrice: 'Included (unlimited)',
    enterprisePrice: 'Included (unlimited)',
    unit: 'per month',
    notes: 'Free for individuals. Organization management requires Professional+.',
  },
  {
    productId: 'air-runtime',
    productLabel: 'AIR Runtime',
    communityPrice: 'Free',
    professionalPrice: 'Included',
    enterprisePrice: 'Included',
    unit: 'per month',
    notes: 'Fully open source (Apache 2.0). No paid features. Enterprise support available.',
  },
  {
    productId: 'growth',
    productLabel: 'Growth Infrastructure',
    communityPrice: '—',
    professionalPrice: 'Included',
    enterprisePrice: 'Included',
    unit: 'per month',
    notes: 'Only available with Professional or Enterprise. No free tier.',
  },
  {
    productId: 'sphere',
    productLabel: 'Trust Sphere',
    communityPrice: 'Free',
    professionalPrice: 'Included',
    enterprisePrice: 'Included',
    unit: 'per month',
    notes: 'Free visualization for everyone. API access requires Professional+.',
  },
  {
    productId: 'simulation',
    productLabel: '72h Simulation',
    communityPrice: 'Free (core)',
    professionalPrice: 'Included (full)',
    enterprisePrice: 'Included (full)',
    unit: 'per month',
    notes: 'Core framework is open source. Custom topologies and reporting require Professional+.',
  },
];

// ---------------------------------------------------------------------------
// Helper: Format price
// ---------------------------------------------------------------------------

export function formatPrice(amount: number | null): string {
  if (amount === null) return 'Free';
  if (amount >= 1000) {
    return `R${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `R${amount.toLocaleString('en-ZA')}`;
}

export function formatAnnualSavings(monthly: number, annual: number): string {
  const monthlyAnnual = monthly * 12;
  const savings = monthlyAnnual - annual;
  const percent = Math.round((savings / monthlyAnnual) * 100);
  return `Save ${percent}% with annual billing (R${savings.toLocaleString('en-ZA')}/yr)`;
}
