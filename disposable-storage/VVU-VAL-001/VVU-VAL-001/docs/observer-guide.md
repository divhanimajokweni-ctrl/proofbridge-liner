# Independent Observer Guide

## Your Role

You are an independent observer for VVU-VAL-001, a 72-hour continuous validation of the Epistemic Runtime. Your role is **narrow and well-defined**: you do not endorse the system, and you do not assess whether the runtime is "good." You only attest that the published artifacts match what you observed during the run.

This attestation is what moves the validation from a self-reported demonstration toward an independently corroborated engineering validation.

## Before the Run

1. Read the [Pre-Registration Protocol PDF](../protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf) — especially §3 (Success Criteria), §7 (Validation Index), and §8 (Threat Model).
2. Note the frozen commit hash from `protocol/frozen-build.json`.
3. Familiarize yourself with the [Independent Reproduction procedure](../protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf) (§12).

## During the Run (72 hours)

- Visit the public Mission Control scoreboard at irregular intervals.
- At each visit, record:
  - The timestamp (UTC)
  - The elapsed time shown on the scoreboard
  - The current phase
  - The Circuit Breaker state
  - The Validation Index value
  - The MMR root (first 12 characters)
- Note any discrepancy between the scoreboard and your own independent query of the runtime's API (if available).
- You are NOT required to watch continuously — spot checks at irregular intervals are sufficient.

## After the Run

1. **Download the evidence package** from the GitHub Release (URL published at H72).
2. **Verify the package SHA-256** against the `SHA256SUMS` ledger:
   ```bash
   sha256sum VVU-72H-VALIDATION.zip
   grep VVU-72H-VALIDATION.zip SHA256SUMS
   ```
3. **Run the Independent Reproduction procedure** (§12 of the protocol):
   ```bash
   bash validation/VVU-VAL-001/rehearsal/verify.sh --observer-mode
   ```
4. **Publish your attestation letter** using the format in §10.3 of the protocol. The letter states whether the published artifacts match what you observed. It does NOT assess the runtime's quality.

## Attestation Letter Format

See §10.3 of the protocol PDF. The letter includes:
- Your name, affiliation, and observer category (Academic / Industry / Community)
- Observation period (start and end timestamps)
- Timestamps of your checkpoint observations
- Hash verification result (YES / NO)
- Replay verification result (YES / NO)
- Any discrepancies (or "none observed")
- Your attestation statement
- Your digital signature

## What You Are NOT Doing

- You are NOT endorsing the Epistemic Runtime.
- You are NOT assessing whether the runtime is fit for any particular purpose.
- You are NOT evaluating the quality of the code or the design.
- You are NOT testing the runtime yourself — you are only attesting that the published artifacts match what you observed.

Your attestation is about **artifact integrity**, not system quality.
