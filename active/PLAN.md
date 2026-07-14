# PLAN — CI/CD Fix + GCP Integration Review — 2026-07-14

## Business Intent
Restore CI/CD pipeline health (currently 100% failure rate across 2,058 runs) and provide a grounded assessment of the GCP infrastructure briefing against VVU's actual codebase state.

## User Story
As a **VVU founder**, I need the CI/CD pipeline to pass so that code can ship confidently, and I need an honest assessment of whether the GCP briefing's proposals are actionable given current infrastructure.

## Acceptance Criteria

### AC1: CI/CD Pipeline Restored
- [ ] All 6 workflows use `pnpm install --frozen-lockfile` (already patched locally)
- [ ] Corepack enable step present in all workflows
- [ ] `cache: 'pnpm'` in all setup-node steps
- [ ] Foundry toolchain setup in contract-tests job
- [ ] All changes committed and pushed to `main`
- [ ] At least one workflow run passes on GitHub Actions

### AC2: README Grounded in Reality
- [ ] Remove or correct any claims that don't match actual CI state
- [ ] Session log accurately reflects what was done
- [ ] Infrastructure stack table matches actual deployment
- [ ] Build reference hash updated to reflect current HEAD after commit

### AC3: GCP Briefing Assessment Documented
- [ ] Clear list of what exists vs what the briefing assumes
- [ ] Cost/benefit analysis of GCP infrastructure at Phase 1 stage
- [ ] Recommendation on timing (now vs Phase 2)

## Compliance Gate Status
- Hard failures in scope: None (CI/CD fix is operational, not compliance)
- This plan resolves: CI/CD systemic failure (operational)
- This plan does not touch: HF-1 through HF-5 (compliance gates)

## Affected Files

### Modified Files
```
.github/workflows/ci-cd.yml          # npm→pnpm + Corepack + Foundry
.github/workflows/ci.yml             # npm→pnpm + Corepack
.github/workflows/deploy-vercel.yml  # npm→pnpm + Corepack
.github/workflows/deployment-loop.yml # npm→pnpm + Corepack
.github/workflows/validation-gate.yml # npm→pnpm + Corepack
.github/workflows/vercel-production.yml # npm→pnpm + Corepack
.github/workflows/replit-check.yml   # cache: npm→pnpm
.github/workflows/deploy-verification-gate.yml # diagnose-ci script path
README.md                            # Session log + status corrections
DEPLOY_LOG.md                        # Honest status entry
DEPLOYMENT_CHECKLIST.md              # Updated to reflect pnpm
active/INVESTIGATION.md              # This investigation
active/PLAN.md                       # This plan
active/VALIDATION.md                 # Post-fix validation
```

## Implementation Order

### Phase 1: CI/CD Fix (Immediate)
1. Verify all workflow patches are correct (already done locally)
2. Commit all changes with descriptive message
3. Push to `main`
4. Monitor first workflow run for pass/fail
5. Fix any remaining issues (lockfile, Node version, etc.)

### Phase 2: Documentation Update
1. Update README.md session log with accurate status
2. Update DEPLOY_LOG.md with honest entry
3. Update DEPLOYMENT_CHECKLIST.md
4. Verify no stale claims remain

### Phase 3: GCP Assessment
1. Document what GCP integrations actually exist (none)
2. Assess briefing proposals against VVU phase timeline
3. Provide clear recommendation on GCP implementation timing

## Test Assertions
- `git log --oneline -1` shows new commit with pnpm fix
- `act -l` or GitHub Actions UI shows workflow triggered
- First workflow run passes (at minimum: build-and-test job)
- README session log matches actual commit history

## Branch: `main`
## Token Budget Estimate: ~3,000 tokens (CI/CD fix is straightforward)
## Handoff Plan: Write active/HANDOFF.md when session ends

## APPROVED BY: _______________ DATE: _______________
