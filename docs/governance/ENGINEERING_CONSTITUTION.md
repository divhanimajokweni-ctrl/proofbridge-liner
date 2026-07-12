# Engineering Constitution

> "If the system can't explain itself to a stranger, it's not production-ready."

## 1. Systems Don't Get Second Chances — They Get Runbooks

Every deployment, every migration, every config change has a documented rollback path **before** it ships. No "we'll fix it in the next release." If you can't roll it back, you don't deploy it.

## 2. Compliance Is Architecture, Not a Feature

Governance rules, circuit breakers, kill switches, and trust policies are not bolted on after the fact. They are architectural constraints that shape how code is written from the first commit. The Compliance Gate doesn't care about velocity — it cares about auditability.

## 3. The Build Pipeline Is the Single Source of Truth

If `scripts/deployment-loop.sh` doesn't pass, the code doesn't ship. No manual overrides. No "works on my machine." No bypassing typecheck because "it's just a config change." The pipeline is the contract between every agent that touches this codebase.

## 4. Agent Code Is Infrastructure Code

An agent that writes a migration without a rollback plan is indistinguishable from an unskilled junior engineer. Every agent that touches production systems must follow the same traceability chain: Investigation → Plan → Approval → Implementation → Validation. No shortcuts.

## 5. Behavioral Coverage Is Non-Negotiable

Diff review is insufficient. Type-checking is insufficient. Lint passing is insufficient. Before any change ships, we must verify the system **behaves** correctly — not just that it compiles. The five compliance flows (VC issuance, circuit breaker, webhook, SafeKrypte, Ubuntu Pools) are the minimum behavioral coverage bar.

## 6. Documentation Prevents Institutional Amnesia

When an agent is decommissioned, when a team member leaves, when memory resets — the codebase must explain itself. Every architectural decision, every deployment procedure, every compliance rule must live in the repository, not in someone's head. Institutional knowledge that isn't written down is institutional knowledge that will be lost.

## 7. Ship Nothing That Can't Be Explained to a Stranger

If a new engineer can't read the README, follow the onboarding flow, and understand what this system does and why it exists, the documentation has failed. Code clarity is a feature. Documentation clarity is survival.

---

## Documentation Law

**The "Tourist Test":** If a new team member (or agent) cannot pick up the README, follow the onboarding flow, and understand what the system does, why it exists, and how to work on it — the documentation has failed.

### Documentation Lifecycle

| Step | Action | Gate |
|------|--------|------|
| 1 | Code change touches a documented surface | Developer identifies affected docs |
| 2 | Relevant documentation updated in same PR | PR review blocks merge if docs missing |
| 3 | README reviewed for accuracy | No stale references, no orphaned links |
| 4 | CHANGELOG updated if user-facing | New entries above "Unreleased" |
| 5 | Post-merge: deployed docs verified | Live docs match merged code |

### Documentation Anti-Patterns

- **"We'll document it later"** — Later never comes. Document now or accept the debt.
- **"The code is the documentation"** — Code explains *how*. Documentation explains *why*.
- **"Everyone knows that"** — New agents, new team members, future-you. They don't know.
- **"It's just a small change"** — Small changes accumulate. Each one that skips docs creates rot.

### Language Migration Guide

To eliminate first-person voice from documentation:

| First-Person | Institutional Replacement |
|---|---|
| I built | The system implements |
| I realized | Analysis revealed |
| I'm not comfortable | The architecture rejects |
| I believe | The codebase establishes |
| we decided | the team established |
| we need to | the system requires |

---

*This constitution governs all code, documentation, and agent behavior within the VVU ProofBridge ecosystem. No exceptions.*
