# Threat Model — VVU-VAL-001

## What This Validation Proves

The 72-hour protocol validates specific engineering properties of the Epistemic Runtime under controlled failure injection. It does NOT validate properties that depend on real-world deployment conditions, sensor hardware, or adversarial conditions outside the published schedule.

## Validated by This Protocol

| Property | How validated | Phase |
|----------|---------------|-------|
| Deterministic replay of the Fact Log | Replay checksum vs live checksum at every hourly checkpoint | All phases |
| Append-only Fact Log integrity | No Fact modified or deleted after acceptance; MMR root valid | All phases |
| HLC merge correctness under partition | P7 partition + reconnect; zero conflicts observed | P7 |
| MMR integrity under stress | MMR root valid at every checkpoint; identical live vs replay | All phases |
| Policy enforcement under degradation | Every violation produces a Failure Fact; no crash | P2–P6 |
| TEE attestation rejection (HF-001) | Every spoofed payload quarantined at Pass 2 | P6 |
| ZK proof rejection (HF-002) | Every bad ZK proof rejected; no WRT minted | P6 |
| Decision derivation halt (HF-005) | Contradictory telemetry halts inference; TRIP verdict | P6 |
| Recovery from node failure | Pods restart; no Fact loss; CB recovers | P5 |
| Evidence bundle integrity | Hourly bundles SHA-256 verified | All phases |

## NOT Validated by This Protocol

| Property | Why not validated | Where it would be validated |
|----------|-------------------|----------------------------|
| Municipal hydraulics accuracy | No real water-network telemetry; synthetic payloads only | Municipal pilot (separate programme) |
| Sensor accuracy (acoustic leak detection) | No physical Hydro-Gateway hardware; simulated telemetry | Hardware prototype validation + municipal pilot |
| Production cybersecurity (penetration testing) | Controlled security injection only (P6); no adversarial red-team | Independent security audit (planned, separate) |
| Manufacturing reliability (24 parametric constraints) | No fabricated hardware; specification only | Fabricator FAI + production-quality audit |
| Long-term durability (10-year field life) | 72-hour run only; no accelerated life testing | Field deployment + multi-year observation |
| Federation correctness (multi-org) | Single-writer ledger only; federation is v1.2 | VVU-VAL-002+ after v1.2 release |
| ZK proof system soundness (production trusted setup) | Test-only trusted setup in use | Production trusted-setup ceremony (separate) |
| On-chain proof registry (Polygon mainnet) | Polygon Amoy testnet only | Post-pilot mainnet migration |
| Human-factors / operator UX | No human operators in the loop during the run | Municipal pilot + operator training |
| Regulatory compliance certification | No audit; policies are Draft for Adoption | ISO 27001 / SOC 2 audits (separate) |

## Reading Guidance

A PASS on this protocol means the Epistemic Runtime's core engineering guarantees (replay, append-only, merge, MMR, policy, HF gates) hold under the published failure schedule. It does **NOT** mean:

- The Hydro-Gateway detects real leaks
- The hardware survives field deployment
- The system is secure against red-team attack
- The runtime is certified for production

Each of those is a separate validation programme.
