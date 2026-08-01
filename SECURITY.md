# Security: VVU Trust Chain

This project implements a CI/CD Trust Chain to ensure the integrity of all executable scripts and deployment claims.

## Architecture
- **Signed Manifest:** `.manifest.json` defines authorized scripts and their SHA-256 hashes, signed with Ed25519.
- **Fabrication Auditor:** `scripts/audit-commit-fabrication.sh` checks for fabrication in deployment logs.
- **Verification Gate:** `.github/workflows/deploy-verification-gate.yml` enforces integrity checks on every push.

## Verification
Authorized personnel can verify the integrity of the scripts using the manifest and signing keys. See `scripts/common.sh` for shared utilities.
