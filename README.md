# ProofBridge Liner

ProofBridge Liner is the production shell for Venture Vision Ubuntu and Ubuntu Pools. It serves the public VVU pages, pool journey pages, Gate-1 verification routes, Liquidity Leap telemetry ingress, and the SARB/BOP3 cryptographic compliance execution fabric.

## Current Production State

- Canonical production domain: `https://venturevisionubuntu.co.za`
- Custom domain alignment: apex `venturevisionubuntu.co.za` and `www.venturevisionubuntu.co.za` resolve to Vercel edge IP `76.76.21.21` in current DNS checks.
- Health route: `https://venturevisionubuntu.co.za/api/health`
- Gate-1 verify route: `POST https://venturevisionubuntu.co.za/api/verify`
- Gate-1 mint route: `POST https://venturevisionubuntu.co.za/api/mint`
- Liquidity Leap telemetry ingress: `POST https://venturevisionubuntu.co.za/api/liquidity-leap/telemetry`
- Production signing contract: RS256 receipts with `PROOFBRIDGE_RECEIPT_PRIVATE_KEY`; the old Gate-1 shared-secret receipt path has been removed from active handlers.

The typo domain `venturevisualubuntu.co.za` is not part of the production surface and must not be recreated.

## Runtime Surfaces

### Vercel

Vercel serves static files and serverless routes from root `vercel.json`.

```txt
/                              -> /vvv/index.html
/gate-1                        -> /vvv/gate-1.html
/pools                         -> /vvv/pools.html
/pools/blueprint               -> /vvv/pools-blueprint.html
/pools/onboarding              -> /vvv/pools-onboarding.html
/pools/trust                   -> /vvv/pools-trust.html
/pools/ledger                  -> /vvv/pools-ledger.html
/pools/governance              -> /vvv/pools-governance.html
/pools/learning                -> /vvv/pools-learning.html
/pools/profile                 -> /vvv/pools-profile.html
/pools/compliance              -> /vvv/pools-compliance.html
/admin/pools                   -> /vvv/admin-pools.html
/proofbridge                   -> /vvv/proofbridge.html
/submission                    -> /vvv/submission.html
/api/health                    -> /api/verify.js
/api/status                    -> /api/verify.js
/api/verify                    -> /api/verify.js
/api/mint                      -> /api/mint.js
/api/liquidity-leap/telemetry  -> /api/liquidity-leap/telemetry.js
```

### Replit

Replit remains the autoscale dashboard/runtime surface.

```txt
Workflow: Start application
Command: npm run start
Server: dashboard/server.js
Port: 5000
Deployment target: autoscale
```

### Unity Liquidity Leap

`unity/liquidity-leap/LiquidityLeapManager.cs` sends schemaed gameplay telemetry to two boundaries:

- vLLM/Kasi WebSocket bridge: `ws://localhost:8000/v1/chat/stream`
- Vercel ingress: `https://venturevisionubuntu.co.za/api/liquidity-leap/telemetry`

The telemetry schema is `liquidity-leap.telemetry.v1` and includes `session_id`, `game_event`, `last_action`, `asset_class`, `shock_type`, `current_pool_balance`, `impulse_stability_score`, `volatility_multiplier`, and `client_unix_ms`.

## Production Environment Contract

Set these in Vercel production and Replit secrets where applicable:

```txt
PROOFBRIDGE_RECEIPT_PRIVATE_KEY
PROOFBRIDGE_RECEIPT_PUBLIC_KEY
PROOFBRIDGE_RECEIPT_KEY_ID
LIQUIDITY_LEAP_TELEMETRY_KEY
ORACLE_PRIVATE_KEY
ORACLE_PUBLIC_KEY
CONTRACT_ADDRESS
STITCH_CLIENT_ID
STITCH_CLIENT_SECRET
STITCH_SECRET
POOLS_ENGINE_ADDRESS
```

`PROOFBRIDGE_RECEIPT_PRIVATE_KEY` must be a PEM private key with escaped newlines or a base64-encoded PEM. Do not use a random hex string for this value.

## Deploy

Preferred Replit-to-Vercel deploy path:

```bash
export VERCEL_AUTH_TOKEN=...
export EXPECTED_GIT_BRANCH=main
export EXPECTED_GIT_HEAD=<short-or-full-commit>
export CONFIRM_PROD_DEPLOY=yes
export PRODUCTION_ALIAS_DOMAIN=venturevisionubuntu.co.za
export PRODUCTION_HEALTH_URL=https://venturevisionubuntu.co.za/api/health
npm run deploy:vercel:replit
```

The deploy helper fails before build/deploy if the branch, commit, clean tree, route surface, Vercel env names, contract addresses, alias state, or Vercel CLI path do not match the production contract.

## Local Verification

Use Node.js 22 LTS.

```bash
npm ci
npm run build
node --test test/gate1-smoke.test.js
```

The smoke test verifies:

- RS256 Gate-1 verify receipts
- MAINNET rejection before proof computation
- signed Liquidity Leap telemetry ingress receipts

## Cryptographic Compliance Execution Fabric

The TypeScript compliance fabric signs deterministic compliance artifacts and verifies SARB/BOP3-style evidence envelopes.

```txt
prover/compliance_tokenizer.ts       RS256 pool tokens and signed compliance envelopes
server/mock_sarb_endpoint.ts         Mock SARB ingest endpoint for signature verification
scripts/generate_keys.mjs            Local RSA keypair generation
test/verification_loop.test.ts       End-to-end verification loop
tsconfig.json                        Strict TypeScript build config
report_and_justification_mapping.txt Design rationale and mapping
```

## DNS

Authoritative DNS remains with `ns1.host-ww.net` and `ns2.host-ww.net` unless the registrar is moved. Required Vercel records:

```txt
@    A     76.76.21.21
www  CNAME cname.vercel-dns.com.
api  A     76.76.21.21
```

`vvv/dns/zone.corrected.bind` and `vvv/dns/zone.updated.txt` are aligned to this Vercel contract.

## Repository Hygiene

Do not commit generated or local-only artifacts:

```txt
.env
.env.*
private_key.pem
public_key.pem
dist/
node_modules/
.vercel/output
.vercel/.env*.local
.local/
```

The old deprecated Gate-1 legacy API folder was removed because it preserved the obsolete shared-secret receipt path.

## Security Notes

- Keep GitHub, Hugging Face, Vercel, wallet, RPC, and telemetry keys in provider secrets only.
- Use token-free Git remotes.
- Rotate any credential that previously appeared in local config or documentation.
- Treat deployment as incomplete until the production endpoint returns RS256 receipt metadata from `/api/health`.
