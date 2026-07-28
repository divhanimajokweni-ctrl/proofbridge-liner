# Publication Checklist — VVU-VAL-001

Complete every item before announcing T=0. Items marked **[FREEZE]** are performed by `rehearsal/freeze-build.sh` and recorded in `protocol/frozen-build.json`.

## Dress Rehearsal

- [ ] Dress rehearsal passes end-to-end (`make rehearsal` or `task rehearsal`)
- [ ] All 6 phases completed without Critical failure
- [ ] Replay verification PASS for all sampled bundles
- [ ] Validation Index ≥ 90.0 at Hour 72
- [ ] Any warnings from the rehearsal are resolved or documented

## Build Freeze

- [ ] **[FREEZE]** Git commit hash recorded
- [ ] **[FREEZE]** Git tag `VAL-001` created (validation event tag, separate from software release tags like `v1.0.0`)
- [ ] **[FREEZE]** Container image built and tagged (`:VAL-001`)
- [ ] **[FREEZE]** Container image digest recorded (`sha256:...`)
- [ ] **[FREEZE]** k8s manifests patched to pin image digest
- [ ] **[FREEZE]** `frozen-build.json` written
- [ ] **[FREEZE]** `frozen-build.sha256` generated (SHA-256 of all frozen artefacts)

## Protocol Publication

- [ ] Protocol PDF (v1.1) published with the frozen commit hash in §2
- [ ] `chaos/schedule.yaml` published with the frozen commit hash
- [ ] Validation Index formula, weights rationale (§7.1), and threshold rationale (§7.2) published
- [ ] Threat model (§8) published
- [ ] Operator public key published (`protocol/operator-public-key.pem`)

## Independent Observers

- [ ] At least one Academic observer invited and confirmed
- [ ] At least one Industry observer invited and confirmed
- [ ] At least one Community observer invited and confirmed
- [ ] Observer identities and methodology published
- [ ] Observer guide (`docs/observer-guide.md`) shared with all observers

## Infrastructure

- [ ] Provider-agnostic k3s cluster provisioned (8 vCPU, 32 GB RAM, 250 GB NVMe)
- [ ] All 6 k8s manifests applied (`kubernetes/*.yaml`)
- [ ] All pods running and healthy
- [ ] Persistent volumes provisioned (Fact Log, MMR, NATS, evidence, video)
- [ ] Public Mission Control scoreboard reachable
- [ ] SIMULATION/PRODUCTION label working on the scoreboard
- [ ] Headless streaming service configured and tested
- [ ] Evidence bundle archival (`evidence/bundle.sh`) verified (run one test bundle)

## Archival

- [ ] GitHub Release target configured (repo + tag)
- [ ] Long-term archival target configured (Zenodo account or immutable S3 bucket with object-lock)
- [ ] Dual-archival procedure documented (§6.2 of protocol)

## Outreach

- [ ] `outreach/milestones.yaml` published
- [ ] `outreach/recipients.yaml` published (all addresses marked "to-be-confirmed" until verified)
- [ ] `outreach/stages.yaml` published
- [ ] GitHub Actions workflows enabled (`github/validation.yml`, `github/rehearsal.yml`, `github/release.yml`)
- [ ] Staged-release enforcement tested (outreach engine halts if `stages.yaml` is missing)

## Final Checks

- [ ] Independent Reproduction procedure (§12) tested by at least one internal reviewer
- [ ] `frozen-build.json` commit hash matches the actual deployed build
- [ ] No uncommitted changes in the repository
- [ ] T=0 announced with the frozen commit hash and observer list

## Post-Run (after H72)

- [ ] Evidence package assembled (`evidence/archive.sh`)
- [ ] GitHub Release published (`evidence/archive.sh --release`)
- [ ] Long-term archival completed (Zenodo DOI recorded in GitHub Release notes)
- [ ] Independent observer attestations collected and published
- [ ] Final Report PDF generated and included in the evidence package
- [ ] Staged outreach sequence initiated (evidence → personalized → social)
