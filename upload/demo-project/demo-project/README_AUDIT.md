# README Audit

**Audited file:** root `README.md` on `amd-rocm-validation`

## Result

**FAIL**

The root README does not describe the frozen submission product or the HBK MK-II demonstration application.

## Identity findings

| Required wording | Repository wording | Result |
|---|---|---|
| VVU Integrated Verification Environment (IVE) | `proofbridge-liner` | FAIL |
| Engineer systems that can prove themselves. | `From hope to proof. From trust to verification.` | FAIL |
| HBK MK-II as demonstration application | HBK is not the root README's organizing case study | FAIL |
| IVE engineering workflow | Epistemic Runtime 11-step observation acceptance pipeline | FAIL |

## Implementation alignment

The root README describes:

- Epistemic Runtime v0.8.
- An 11-step acceptance pipeline.
- MMR inclusion proofs.
- WORM storage.
- AWS KMS, IAM federation, and OIDC signers.
- Twelve kernel assertions.
- A Vitest suite.
- Numerous general automation integrations.

The HBK pipeline outputs and Zoo/CAD demonstration are not the primary narrative. A judge following the README will not be led to `pipeline/`, the latest run, the Hydro-Gateway CAD, the proof-obligation model, or the IVE dashboard contract.

## Setup and execution

The repository appears to contain a TypeScript application and a standalone Python pipeline. The README sections inspected do not establish one short, submission-specific path that:

1. Starts IVE.
2. Loads the HBK demonstration.
3. Runs or loads proof obligations.
4. Loads `/ive-output/results.json`.
5. Shows evidence and ledger state.
6. Demonstrates a native Zoo API call.

## Engineering claims

The root README contains strong general claims including append-only immutability, bit-identical replay, WORM enforcement, and production integrations. These may apply to the general Epistemic Runtime implementation, but the HBK Python pipeline uses a separate ledger and unseeded execution. The README does not distinguish which guarantees apply to which runtime.

The generated HBK report correctly labels ten engineering placeholders as unverified, but it still overstates ledger immutability and hardware architecture.

## Competition alignment

The generated report uses outdated or incorrect event names:

- `Zoo Makeathon` rather than `Zoo API Makeathon 2026`.
- `AMD Radeon Robotics Hackathon` rather than `AMD AI DevMaster Hackathon`.

## Missing evaluator guidance

- IVE-first explanation.
- HBK as demonstration application.
- Exact current branch and run timestamp.
- Explicit synthetic-data disclaimer at the root.
- Engineering Release: BLOCKED.
- Native Zoo API versus wrapper table.
- CAD paths that actually exist on the branch.
- Current artifact schema and limitations.
- A verified approximately one-minute demo reference.

## Three-minute comprehension test

**FAIL**

The repository is broad and technically dense, while the root README presents a different product narrative. A judge cannot reliably infer the intended IVE/HBK submission within three minutes.

## Conclusion

The README is not release-aligned and cannot serve as the Zoo API Makeathon submission README in its current form.
