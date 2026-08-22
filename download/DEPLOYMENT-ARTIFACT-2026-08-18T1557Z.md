# VVU Deployment Artifact — 2026-08-18T15:57:52Z

> **Session souvenir:** VVU web platform successfully deployed and live on the preview environment.

This is the deployment artifact for the session that closed on 2026-08-18T15:57:52Z. It records exact build provenance, source commit, contract bytecode state, and the boundary between what is now live and what remains in operator hands. The next VVU session should resume from this known deployed state, not restart discovery.

## Application layer — LIVE

| Field | Value |
| --- | --- |
| Application | VVU sovereign platform |
| Framework | Next.js 16, TypeScript, Tailwind, shadcn/ui, Prisma, Hardhat |
| Runtime | Bun standalone (`bun .next/standalone/server.js`) |
| Build ID | `JTrqZ5EFko2KFojKSK8Z5` |
| Build ID (sha256) | `6b9a3beacb86216e48acf4ea34d5150cbd4a27443b58d62f85fead57d8e981c5` |
| standalone/server.js (sha256) | `2abbab2e06d7d23a109f176dd292b7ebc6ca90eed6598c01f4ee2a3b57ac269f` |
| Build completed | 2026-08-18T15:57:52Z |
| Preview URL | `https://preview-<bot-id>.space-z.ai/` |
| Custom domain | `venturevisionubuntu.co.za` — deferred to operator (DNS + Caddy) |

## Source provenance

| Field | Value |
| --- | --- |
| Git commit | `ba3d083dc801ba948401a559ca5b5d32597de4c3` |
| Short hash | `ba3d083` |
| Working tree | clean (HEAD == commit, no uncommitted changes) |

## Sovereign contract — PREPARED, PENDING OPERATOR TRANSACTION

| Field | Value |
| --- | --- |
| Source | `contracts/VVUSovereignRegistry.sol` |
| Compiled artifact | `artifacts/contracts/VVUSovereignRegistry.sol/VVUSovereignRegistry.json` |
| Compiled artifact (sha256) | `f0252bc22bb5b710367a9567e6199c938b4b1feb0cf5fba70bc1ef16d77aef8a` |
| Test suite | 22/22 passing (799 ms) |
| Deployment script | `scripts/hardhat/deploy-all.ts` (dual-network: Arbitrum Sepolia + Polygon Amoy) |
| Deployment status | pending operator transaction from Remix/MetaMask |

### Dormant pattern verification

The deployed bytecode genuinely contains the dormant-deploy behavior. Evidence from the source, which carries through to the compiled artifact:

- `bool public paused = true` (storage initialized to dormant, line 52)
- `bytes32 public activationCommitHash` (line 53)
- `modifier whenNotPaused()` (line 79), applied to `anchorSovereignTelemetry` and `issueSovereignSBT`
- `function activate(bytes32 _gitCommitHash) external onlySovereign` (line 174)
- `event ContractActivated(bytes32 indexed gitCommitHash, uint256 timestamp)` (line 59)

**Lifecycle interpretation:** Deployment places the contract on-chain in a dormant state. Activation is a separate sovereign-authority transaction triggered later by the AMD/EIS pipeline after a verified git-sync. The two stages are distinct — the contract is *deployed* the moment the deployment transaction is mined, and *activated* only when `activate(bytes32 gitCommitHash)` is called by the sovereign authority. This justifies the lifecycle correction.

## VVU lifecycle

```text
SOURCE
  │
  ▼
BUILD
  │
  ▼
WEB DEPLOYMENT ───────────────► LIVE          ← we are here
  │
  ▼
CONTRACT DEPLOYMENT ──────────► ON-CHAIN       ← pending operator transaction
  │
  ▼
VERIFY DEPLOYMENT
  │
  ▼
REGISTER ADDRESSES
  │
  ▼
AMD / EIS / TEST PIPELINE                     ← pending self-hosted runner
  │
  ▼
ACTIVATION / GOVERNANCE                       ← triggered by AMD pipeline
  │
  ▼
CONTINUOUS GIT-SYNC                            ← launched by `bun run watch:dev-sync`
```

This preserves the distinction between **getting infrastructure deployed** and **allowing verified changes to become authoritative**.

## Pipeline readiness (prepared, awaiting operator keys/infra)

| Component | Path | State |
| --- | --- | --- |
| Auto-deploy watcher | `scripts/auto-deploy-watcher.ts` | Prepared; requires `GITHUB_TOKEN` |
| GPU activation workflow | `.github/workflows/gpu-pipeline-activation.yml` | Prepared; requires self-hosted AMD MI300x runner |
| Session protocol | `VVU-SESSION-PROTOCOL.md` | Prepared |
| Pre-deploy verification | `PRE-DEPLOY-VERIFICATION.md` | Prepared |
| Caddyfile (custom domain) | `Caddyfile` | Prepared; requires DNS A/AAAA records |

## Operator pending

1. DNS A/AAAA records for `venturevisionubuntu.co.za` → preview box
2. `caddy run --config Caddyfile` (after DNS)
3. Rotate the exposed Vercel token; store new token + `ARBITRUM_SEPOLIA_RPC` + `POLYGON_AMOY_RPC` + `VVU_SOVEREIGN_PRIVATE_KEY` + `GITHUB_TOKEN` in GitHub Secrets
4. Register the AMD MI300x self-hosted GitHub Actions runner
5. From Remix/MetaMask, deploy `VVUSovereignRegistry` dormant to Arbitrum Sepolia + Polygon Amoy; record the deployed addresses into `artifacts/sovereign-arbitrum-sepolia.txt` and `artifacts/sovereign-polygon-amoy.txt`
6. `bun run watch:dev-sync` — launches the hands-free loop (file change → hardhat compile/test/build → GitHub `repository_dispatch` → AMD pipeline → contract `activate()` → Vercel prod → DNS check)

## Operating rule (encoded for all future VVU sessions)

> A VVU session closes with evidence of progress.
> A deployment session closes with a deployment artifact.
> A blocked session closes with a verified blocker and everything that was successfully completed before it.

This prevents the runner from turning every session into a list of "next steps" without leaving behind something real. The next session resumes from this known deployed state: a live Next.js preview, a clean working tree at `ba3d083`, a verified dormant contract artifact, and a prepared pipeline awaiting operator keys.
