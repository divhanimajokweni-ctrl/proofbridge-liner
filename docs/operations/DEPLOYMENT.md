# Deployment Guide — VVU Gateway (Phase 1)

**Domain:** https://venturevisionubuntu.co.za  
**CircuitBreaker (Amoy):** `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67`  
**Email:** `hello@venturevisionubuntu.co.za`  
**Updated:** 2026-06-20

---

## Current Production State

| Component | Value |
|-----------|-------|
| Canonical domain | `venturevisionubuntu.co.za` |
| Vercel project | `proofbridge-liner` |
| Vercel production alias | `venturevisionubuntu.co.za` |
| DNS apex | `76.76.21.21` (A record — served by Host Africa until NS delegation changes) |
| DNS nameservers | Current: `ns1.host-ww.net`, `ns2.host-ww.net` (Host Africa) |
| DNS nameservers | Target: `ns1.vercel-dns.com`, `ns2.vercel-dns.com` (Vercel DNS) |
| Health endpoint | `https://venturevisionubuntu.co.za/api/health` → HTTP 200 |
| Verify endpoint | `https://venturevisionubuntu.co.za/api/verify` (Bearer auth via KERNEL_SECRET) |
| Send-email endpoint | `https://venturevisionubuntu.co.za/api/send-email` (Bearer auth via KERNEL_SECRET) |
| CircuitBreaker | `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67` (Polygon Amoy, chain 80002) |
| Email sender | `hello@venturevisionubuntu.co.za` (Resend verified) |
| Git canonical branch | `compliance-fabric` |
| Git backup branch | `backup/local-compliance-fabric` |

---

## Production Deploy

```bash
npm install
npm test
npm run build
vercel --prod --force
```

If the production alias does not move automatically:
```bash
vercel alias set <deployment-url> venturevisionubuntu.co.za
```

Verify:
```bash
curl -I https://venturevisionubuntu.co.za                     # HTTP 200
curl -I https://venturevisionubuntu.co.za/api/health           # HTTP 200
curl -H "Authorization: Bearer $KERNEL_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"documentHash":"0xtest","signals":[]}' \
  https://venturevisionubuntu.co.za/api/verify                 # HTTP 200
```

---

## DNS Records

Zone managed at Host Africa via WHM / BIND. Zone file: `venturevisionubuntu.co.za.zone`.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 300 |
| CNAME | `www` | `cname.vercel-dns.com.` | 300 |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) | 300 |
| TXT | `@` | `"v=spf1 a mx include:spf.send.eu-west-1.amazonses.com ~all"` | 300 |
| TXT | `send` | `"v=spf1 include:amazonses.com ~all"` | 300 |
| TXT | `resend._domainkey` | `"k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."` | 300 |
| TXT | `_dmarc` | `"v=DMARC1; p=none; rua=mailto:dmarc@venturevisionubuntu.co.za"` | 300 |

---

## Environment Variables (Vercel Production)

| Variable | Type |
|----------|------|
| `KERNEL_SECRET` | Sensitive |
| `RESEND_API_KEY` | Sensitive |
| `STITCH_WEBHOOK_SECRET` | Sensitive |
| `POLYGON_AMOY_RPC_URL` | Sensitive |
| `ORACLE_ADDRESS` | Sensitive (pending) |
| `CIRCUIT_BREAKER_ADDRESS` | Plain: `0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67` |

---

## CircuitBreaker Contract Management

### Deploy (Foundry)
```bash
export PRIVATE_KEY=<deployer-key>
export ORACLE_ADDRESS=<oracle-address>
export POLYGON_AMOY_RPC_URL=<rpc-url>

node scripts/deploy.js --target cb
```

### Compile standalone
```bash
forge build contracts/CircuitBreaker.sol contracts/IProofHook.sol
```

### Verify (Etherscan)

```bash
forge verify-contract --watch --chain amoy 0x8f4A551F0566F5e3cff7c14cE0347ed8A954FB67 \
  src/CircuitBreaker.sol:CircuitBreaker \
  --verifier etherscan \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=80002" \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

---

## Test Suite

```bash
npm test                    # Jest unit/integration (4 tests)
npm run test:e2e            # Playwright E2E
forge test                  # Foundry contract tests (14 tests)
```

---

## Post-Deploy Checklist

1. `npm test` passes locally
2. `npm run build` succeeds
3. `vercel --prod --force` deploys cleanly
4. `curl -I https://venturevisionubuntu.co.za` → HTTP 200
5. `curl -I https://venturevisionubuntu.co.za/api/health` → HTTP 200
6. `/api/verify` returns attestation with on-chain circuit status
7. `/api/send-email` delivers email (test with known recipient)
8. DNS records all propagate (DKIM, SPF, MX, DMARC)
9. No secrets committed to git

---

## Rollback

Baseline deployment: `dpl_NBqotyxk4Rz4ikaNHwhnHroGuA97`

```bash
vercel rollback --prod
```

For CircuitBreaker: circuit break is one-way (trip → requires admin reset). See `contracts/CircuitBreaker.sol` for `reset()` with `onlyAdmin`.
