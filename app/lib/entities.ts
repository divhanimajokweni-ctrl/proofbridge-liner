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
    icon: "\u25CB",
    description: "Community savings OS. ROSCA rotation cycles. Stitch InstantEFT payment rail. Ubuntu Score governance weighting.",
    metrics: [
      { label: "Active Cycles", value: "3" },
      { label: "Payment Rail", value: "Stitch" },
      { label: "Ubuntu Score", value: "74 / 100" },
    ],
    events: [
      "ROSCA cycle #2 opened \u00B7 payout scheduled",
      "Stitch webhook HMAC-SHA256 verified",
      "Ubuntu Score recalibrated \u2192 74",
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
    icon: "\u2B21",
    description: "ZK pre-settlement compliance fabric. Bayesian safety kernel. On-chain circuit breaker for RWA tokenisation. Polygon Amoy testnet.",
    metrics: [
      { label: "Open Findings", value: "18" },
      { label: "Hard Failures", value: "5" },
      { label: "Release Target", value: "2026-07-30" },
    ],
    events: [
      "ZK signal schema divergence patched vs circuit source",
      "GovernanceAnchor.sol deployed 0x7703\u2026600Eb",
      "compliance-fabric branch protected \u00B7 main is mirror-only",
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
    icon: "\u2295",
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
];
