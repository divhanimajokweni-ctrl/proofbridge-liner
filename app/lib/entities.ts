export interface EntityMetric {
  label: string;
  value: string;
}

export interface EntityConfig {
  id: string;
  name: string;
  tag: string;
  status: string;
  accentColor: string;
  icon: string;
  description: string;
  metrics: EntityMetric[];
  events: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const ENTITIES = [
  {
    id: "pools",
    name: "Ubuntu Pools",
    tag: "ROSCA / STOKVEL",
    status: "PILOT",
    accentColor: "#8A9A5B",
    icon: "◎",
    description: "Community savings OS. ROSCA rotation cycles. Stitch InstantEFT payment rail. Ubuntu Score governance weighting.",
    metrics: [
      { label: "Active Cycles", value: "3" },
      { label: "Payment Rail", value: "Stitch" },
      { label: "Ubuntu Score", value: "74 / 100" },
    ],
    events: [
      "ROSCA cycle #2 opened · payout scheduled",
      "Stitch webhook HMAC-SHA256 verified",
      "Ubuntu Score recalibrated → 74",
    ],
    ctaLabel: "Explore Pools",
    ctaHref: "/pools",
  },
  {
    id: "proofbridge",
    name: "ProofBridge Liner",
    tag: "ZK / COMPLIANCE",
    status: "T-34 DAYS",
    accentColor: "#CC7722",
    icon: "⬡",
    description: "ZK pre-settlement compliance fabric. Bayesian safety kernel. On-chain circuit breaker for RWA tokenisation. Polygon Amoy testnet.",
    metrics: [
      { label: "Open Findings", value: "18" },
      { label: "Hard Failures", value: "5" },
      { label: "Release Target", value: "2026-07-30" },
    ],
    events: [
      "ZK signal schema divergence patched vs circuit source",
      "GovernanceAnchor.sol deployed 0x7703…600Eb",
      "compliance-fabric branch protected · main is mirror-only",
    ],
    ctaLabel: "View Bridge",
    ctaHref: "/proofbridge",
  },
  {
    id: "safekrypte",
    name: "SafeKrypte",
    tag: "HSM-AS-A-SERVICE",
    status: "DEV",
    accentColor: "#1CAF70",
    icon: "⊕",
    description: "Cryptographic root of trust. Threshold escrow 3-of-5 SSS internal / 5-of-7 institutional MPC. VCT bound to founder ED25519.",
    metrics: [
      { label: "Internal SSS", value: "3-of-5" },
      { label: "Institutional MPC", value: "5-of-7" },
      { label: "VCT Binding", value: "ED25519" },
    ],
    events: [
      "Threshold escrow policy formalised",
      "5-of-7 key ceremony scheduled Q3 2026",
      "VCT ED25519 cryptographic binding confirmed",
    ],
    ctaLabel: "Explore SafeKrypte",
    ctaHref: "/gateway",
  },
  {
    id: "safegrid",
    name: "SafeGrid",
    tag: "WATER / NMBM",
    status: "DEV",
    accentColor: "#4A9EE8",
    icon: "≋",
    description: "Nelson Mandela Bay water infrastructure. FROST-DAML Rust middleware. Community Prosperity Water Trust — 15% net profit distribution.",
    metrics: [
      { label: "Coverage", value: "NMBM" },
      { label: "Trust Distribution", value: "15% Net Profit" },
      { label: "FROST-DAML", value: "v3" },
    ],
    events: [
      "FROST-DAML v3 replay-safety via semantic nonce derivation",
      "15% NPD community trust architecture formalised",
      "NMBM Community Prosperity Water Trust charter active",
    ],
    ctaLabel: "Explore SafeGrid",
    ctaHref: "/gateway",
  },
  {
    id: "ekasi",
    name: "Ekasi",
    tag: "UBUNTU GAMES / RPG",
    status: "PRE-PROD",
    accentColor: "#8B5DE5",
    icon: "◈",
    description: "Pan-African open-world RPG set in fictional township metropolis. GDD complete. IP protection via CIPC trademark + Madrid Protocol.",
    metrics: [
      { label: "GDD Status", value: "Complete" },
      { label: "IP — CIPC", value: "Trademark Pending" },
      { label: "IP — Madrid", value: "Pathway Active" },
    ],
    events: [
      "GDD finalised with full IP protection strategy",
      "CIPC trademark application submitted",
      "Madrid Protocol pathway identified",
    ],
    ctaLabel: "Explore Ekasi",
    ctaHref: "/gateway",
  },
  {
    id: "lindiwe",
    name: "Lindiwe AI",
    tag: "INTERNAL INTELLIGENCE",
    status: "ACTIVE",
    accentColor: "#D07E18",
    icon: "◆",
    description: "Internal AI intelligence layer. FastMCP 15-tool stdio server. Ubuntu Data Bus integration via NATS JetStream.",
    metrics: [
      { label: "MCP Tools", value: "15" },
      { label: "Protocol", value: "FastMCP stdio" },
      { label: "Event Bus", value: "NATS JetStream" },
    ],
    events: [
      "FastMCP 15-tool stdio server deployed",
      "NATS JetStream 34-event schema across 7 namespaces live",
      "Lean 4 formalization pipeline v1.2.2 · pass@k correctness fixed",
    ],
    ctaLabel: "Meet Lindiwe",
    ctaHref: "/agent/lindiwe",
  },
];
