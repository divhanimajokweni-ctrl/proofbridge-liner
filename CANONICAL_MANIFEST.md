# CANONICAL ATTESTATION

> This file attests that `ARCHITECTURE.md` and `branch-policy.md` at the repository root
> are the living canonical documents for VVU OS architecture and branch governance.
> All agent sessions, human sessions, CI pipelines, and deploy loops must read these
> before writing or merging any branch.
>
> Attested: 2026-07-02
> Branch: compliance-fabric (canonical)
> Attested by: VVU OS Orchestrator

## Canonical Documents

| Document | Path | Purpose |
|----------|------|---------|
| Architecture manifest | `ARCHITECTURE.md` | Canonical three-layer trust stack, business core, open-source posture, entity taxonomy, key terms, conflation guardrails |
| Branch protection policy | `branch-policy.md` | Canonical branch names, continuity-check procedure, merge precedence, auth enforcement guard, pick list |

## Agent-Infrastructure Integration

Before any agent session writes code, it must read:
1. `active/INVESTIGATION.md` — current state
2. `active/PLAN.md` — approved plan
3. `ARCHITECTURE.md` — canonical trust-stack and business boundaries
4. `branch-policy.md` — canonical branch names and merge policy

No agent may create or promote a new `compliance-fabric*`-named branch without first diffing against `origin/compliance-fabric` and updating `branch-policy.md` if a new variant is legitimately required.

## Superseded Documents

The following are explicitly superseded by this attestation:
- Any AI-generated "vision document" describing auto-publishing, systemd-timer public libraries, or EXIF-only sanitization as governance
- Any prior `branch-policy.md` 3-line stub
- Any prior `ARCHITECTURE.md` that predates the 2026-07-01 audit findings and the 2026-07-02 canonical write-up

## Enforcement

This attestation is enforced by:
- The `compliance-fabric` pre-push hook (`scripts/deployment-loop.sh`)
- The agent continuity-check pattern documented in `branch-policy.md`
- The compliance-gate skill's branch-gate check (VALIDATION.md must show PASS before PR)

Any session that bypasses this attestation creates a divergence event that must be documented in `DEPLOY_LOG.md` with a remediation plan.
