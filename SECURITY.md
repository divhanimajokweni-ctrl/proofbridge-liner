# VVU CI/CD Trust Chain — v3.1

## Architecture

The VVU deployment pipeline enforces a cryptographic trust chain from
source code to production evidence. The chain is:

1. **Signed Commits** (recommended) → pushed to protected branches.
2. **Branch Protection** → requires PR, status checks, and CODEOWNERS review.
3. **Manifest Verification** → `.manifest.json` signature validated; every
   script's hash checked before execution.
4. **Pipeline Execution** → typecheck, lint, test, build on every change.
5. **Fabrication Gate** → DEPLOY_LOG.md claims cross‑checked against real
   pipeline output.
6. **Health Verification** → production health endpoint must return the
   correct commit SHA and ready status.
7. **Signed Evidence Envelope** → the workflow produces a SHA‑256 hash
   over the evidence, signed with an Ed25519 key held in CI secrets.
8. **Artifact Upload** → evidence is archived for independent verification.

## Key Material

- **MANIFEST_SIGNING_KEY / MANIFEST_PUBLIC_KEY** — Ed25519 keypair used to
  sign and verify the `.manifest.json` file. Private key stored in
  GitHub Actions secrets; public key stored as a secret or variable.
- **EVIDENCE_SIGNING_KEY** — Ed25519 private key used to sign the evidence
  hash. Stored in GitHub Actions secrets.

## Authorized Scripts

Only scripts listed in `.manifest.json` with matching SHA‑256 hashes may
be executed in CI. Changes to the manifest require CODEOWNERS review and a
valid signature from the MANIFEST_SIGNING_KEY.

## Baseline Tags

All baseline tags must be signed using `git tag -s`. The signer's public
key is documented in this file.

## Independent Verification

Every evidence artifact can be independently verified by:

1. Recomputing the SHA‑256 hash of the evidence envelope and supporting
   files.
2. Verifying the Ed25519 signature using the evidence public key.
3. Checking that the signed manifest matches the repository state.

## Contact

For security concerns, contact the repository owner via GitHub.
