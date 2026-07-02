# ARCHITECTURE — VVU OS
> Canonical. Attested from verified evidence across the compliance-fabric branch
> and the external-review anchor repos on 2026-07-02. Supersedes all prior
> architecture summaries, including the fabricated document reviewed in the 2026-07-01
> audit session.

## Canonical Architecture: VVU OS

At its foundation, VVU OS is not a kernel and never should be one — it is the name over a constitutional promise, the Ubuntu Meta-Protocol, instantiated as running code across nine entities that a single founder governs through a network of AI agents standing in for roles no human has filled yet. What makes this more than branding is that the promise is enforced in software, not just stated in a charter: every credential SafeLiner issues, every hash SafeKrypte signs, every trip of CircuitBreaker.sol on Polygon exists because "no entity may extract value from a vulnerable node" had to become a function signature before it could become a business.

## Three-Layer Trust Stack

The canonical architecture has three layers, and the discipline of VVU OS going forward is refusing to let any layer absorb responsibilities that belong to another.

### Layer 1: SafeKrypte (Cryptographic Primitive)
- Generates ED25519 keypairs per identity
- Stores public keys
- Signs content hashes into attestations
- Has no opinion about what it's signing or why
- Does exactly one thing, does it as a dependency, never as a product

### Layer 2: SafeLiner (Credential Layer)
- Built on top of SafeKrypte
- Issues structured, signed credentials (holder / issuer / credential type / timestamp)
- Turns a bare cryptographic signature into something a regulator, bank, or stokvel member can read and trust
- Consumes SafeKrypte's raw signing capability; does not reimplement it

### Layer 3: ProofBridge Liner (Compliance Application)
- Gates A through F
- Bayesian fraud-scoring prover pipeline
- IPFS-diverse document fetchers
- Threshold-signed circuit breaker
- Consumes the trust layer beneath it rather than reimplementing it

## Provenance of the Stack

This layering is not incidental; it is the architectural insight the repos themselves demonstrate whether or not it was ever written down before today.

- The Prover Pipeline's Fetcher-Validator-Scorer-Submitter-Broadcaster chain, with its Beta-Binomial posterior probability scoring and TEE-deterministic overrides, is a genuinely sophisticated piece of fraud-detection engineering.
- Scenario A/B/C differentiation (transient mismatch / adversarial mismatch / network failure) is the kind of nuance that separates a real compliance system from a checkbox one.
- That pipeline's credibility depends entirely on the layer beneath it being sound: a fraud score is worthless if the attestation carrying it can't be proven to have come from where it claims.
- SafeKrypte and SafeLiner are what make ProofBridge's outputs non-repudiable rather than merely computed.

## Correctly Scoped Infrastructure

### AMD MI300X / ROCm 7 (GPU-Accelerated Scoring)
- 0.82ms P99 latency against a 1ms banking SLA, sustained at 500 tps
- Rightful place: compute story for the scoring engine, evidence for the pitch deck
- NOT a general hosting substrate to be repurposed for unrelated products

### Encrypted Notification Delivery
- SafeKrypte-signed payloads relayed through Resend
- Gated behind a kernel-secret bearer token
- Purpose: delivery mechanism for compliance receipts a regulator or account holder can verify
- NOT a competing consumer mailbox product
- Resend handles deliverability because deliverability is a specialty VVU doesn't need to own

## Business Core

The business core of VVU OS is the compliance-and-attestation stack sold as infrastructure to institutions that already have regulatory exposure and need to reduce it:
- Banks needing sub-millisecond fraud scoring with an audit trail
- Water utilities needing Bayesian non-revenue-water detection with a defensible mass-properties audit behind the hardware
- Financial regulators needing the JS2-exportable audit trail Ubuntu Pools is built to produce

This is a narrower business than "an operating system for creators," and narrower is the point — every entity in the four-tier structure (foundational infrastructure, product entities, operational layer, communicative output) earns its place by strengthening this same trust claim, not by diversifying into an unrelated market.

## Ubuntu Pools: Business Core's Most Ambitious Instrument

Ubuntu Pools reframes what SafeKrypte and SafeLiner make possible at civilizational scale rather than transactional scale:
- A stokvel cooperative's trust relationships, historically enforced by community reputation alone, backed by cryptographically signed participation records
- Can eventually become the Ubuntu Score — a credit history that exists independent of any single bank's ledger

North star milestone: a real ROSCA cycle completed by real members, with an exportable FSCA audit trail. This is not a feature to ship; it is the proof that the entire trust stack works end to end, from SafeKrypte's raw signature up through SafeLiner's credential up through Ubuntu Pools' user-facing cooperative logic.

## Open-Source Posture (Corrected from Fabricated Document)

The open-source layer is where VVU OS should be most disciplined about scope.

**What the fabricated document proposed (rejected):**
- Auto-publishing every user's private file to a public library after nothing more than EXIF stripping
- No consent step, no opt-out shown
- A systemd timer with no consent step, no matter how efficient that automation looks on paper

**Correct posture:**
Publish the primitives, not the private work product built on top of them:
- SafeKrypte's signing scheme
- SafeLiner's credential schema
- Beta-Binomial scoring methodology
- Mass-properties audit corrections for the Hydro-Bayesian Kernel

Published deliberately and with consent, this builds the credibility of a continental alternative credit bureau and an uncontested Eastern Cape territory. A user's private ProofBridge submission or a water utility's proprietary pipeline data is exactly the kind of vulnerable node the Meta-Protocol exists to protect — it should never be swept into a public catalog automatically.

## Canonical Shape of VVU OS

A signing primitive, a credential layer built on it, a compliance application built on that, a GPU-accelerated scoring engine that makes the application's claims fast enough to matter, a delivery mechanism that makes its outputs provable to the people who receive them, and a business model that sells exactly this stack — trust, made falsifiable — to institutions that need it most, in South Africa first, before anywhere else.

Everything that isn't in this chain — mail hosting, game engine compilers, audio DSP marketplaces, public-by-default file libraries — isn't wrong because it's ambitious; it's wrong because it asks the same nine-entity, single-founder-approval-gate structure to hold a shape it wasn't built to hold, diluting the one claim — that VVU's trust layer cannot be corrupted for growth — that makes everything else worth building at all.

## Four-Tier Structure

The entity taxonomy aligned to this architecture:

| Tier | Role | Canonical Representation |
|------|------|-------------------------|
| Foundational Infrastructure | Cryptographic primitives, attestation, compliance kernel | SafeKrypte, SafeLiner, GovernanceAnchor.sol |
| Product Entities | User-facing products that exercise the trust stack | ProofBridge Liner, Ubuntu Pools, SafeGrid, Ubuntu Studio |
| Operational Layer | Internal tooling, monitoring, agent infrastructure | LINDIWE, CircuitBreaker, War Room, Operatus |
| Communicative Output | Documentation, pitch artifacts, advisory relationships | ARCHITECTURE.md, FOUNDERS_VIEW.md, pitch materials |

## Key Terms

- **SafeKrypte** = cryptographic primitive layer (ED25519 keypair generation, signing)
- **SafeLiner** = credential layer (structured signed credentials issued using SafeKrypte)
- **ProofBridge Liner** = the overall compliance app (Gates A–F, dashboard, prover pipeline)
- **GovernanceAnchor.sol** = on-chain attestation anchor (Polygon Amoy)
- **CircuitBreaker** = threshold-signed circuit breaker
- **Ubuntu Pools** = stokvel cooperative platform with cryptographically signed participation records
- **Ubuntu Score** = future credit history independent of any single bank's ledger
- **Meta-Protocol** = the constitutional promise enforced in software
- **Ubuntu Meta-Protocol** = same as Meta-Protocol; the foundational governance layer

## Do Not Conflate

- ProofBridge Liner ≠ SafeKrypte (ProofBridge consumes SafeKrypte; it does not reimplement signing)
- SafeKrypte ≠ consumer encrypted email (it's a signing primitive, not a mailbox product)
- Ubuntu Pools stokvel records ≠ auto-published public library (records are private; only the primitives and methodology are open-sourced)
- ROCA compute layer ≠ general hosting (GPU-accelerated inference is scoped to fraud-scoring evidence)
