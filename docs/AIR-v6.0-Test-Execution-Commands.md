# AIR Kernel v6.0 — Test Execution Commands Playbook

> ProofBridge-Liner deployment test execution reference. Every command in this document runs from the project root (`proofbridge-liner-1/`). All commands assume a POSIX-compatible shell with Node.js 18+, Foundry, and Circom installed.

---

## 1. Pre-Flight Checks

### 1.1 Environment Verification

```bash
node --version          # >= 18.x required
npm --version           # >= 9.x required
forge --version         # Foundry toolchain (forge, cast, anvil)
circom --version        # >= 2.1.0
npx vitest --version    # vitest runner
npx playwright --version # Playwright E2E
```

### 1.2 Dependency Check

```bash
npm ci                  # install production-locked dependencies
forge install           # install Foundry libs (forge-std, openzeppelin)
npx playwright install chromium  # browser binary for E2E
```

### 1.3 Critical Files Gate

```bash
test -f app/api/verify/route.ts   && echo "OK: verify route"   || echo "MISSING"
test -f app/api/mint/route.ts     && echo "OK: mint route"     || echo "MISSING"
test -f middleware.ts              && echo "OK: middleware"      || echo "MISSING"
test -f AGENTS.md                 && echo "OK: agents manifest" || echo "MISSING"
test -f .vercelignore             && echo "OK: vercelignore"    || echo "MISSING"
test -f jurisdiction-manifest.yaml && echo "OK: jurisdiction"   || echo "MISSING"
```

### 1.4 Service Reachability

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health   # expect 200
curl -s -o /dev/null --connect-timeout 3 http://localhost:5096/health     # SafeKrypte
vercel whoami                                                                # Vercel auth
```

### 1.5 Vercel Project Link

```bash
test -f .vercel/repo.json && jq -e '.projects[0].id' .vercel/repo.json && echo "Linked" || echo "Run: vercel link"
```

---

## 2. Unit Test Commands

### 2.1 Vitest Suite (334 tests)

```bash
npx vitest run
```

Output: `packages/**/__tests__/**/*.test.ts`, `src/**/__tests__/**/*.test.ts`, `contracts/**/__tests__/**/*.test.ts`

To run with coverage:

```bash
npx vitest run --coverage
```

To run a single test file:

```bash
npx vitest run packages/trust-crypto/__tests__/hash.test.ts
```

### 2.2 Foundry Forge Tests (52 tests)

```bash
forge test -vvv
```

Solidity contracts under `contracts/*.sol` with tests in `contracts/test/` and `test/`.

To run a specific test:

```bash
forge test --match-test testCircuitBreakerStateTransition -vvv
```

### 2.3 Lint

```bash
npm run lint
```

Runs `turbo run lint` across all workspace packages. Zero errors required.

### 2.4 TypeScript Type Check

```bash
npx tsc --noEmit --project packages/trust-crypto/tsconfig.json
npx tsc --noEmit --project packages/trust-runtime/tsconfig.json
npx tsc --noEmit --project packages/trust-api/tsconfig.json
npx tsc --noEmit --project packages/trust-projections/tsconfig.json
npx tsc --noEmit --project packages/bartbot/tsconfig.json
```

All five must exit 0. Alternatively:

```bash
npm run typecheck
```

---

## 3. Integration Test Commands

### 3.1 Behavioral Coverage (5 compliance flows)

```bash
npx tsx scripts/behavioral-coverage.ts
```

Flows tested:
1. VC issuance end-to-end: credential issued → GovernanceAnchor anchored → verifiable
2. Circuit breaker: halt trigger → throughput drops → audit log entry written
3. Webhook: event received → HMAC validated → event written to NATS bus
4. SafeKrypte: key request → threshold check → escrow state updated
5. Ubuntu Pools: contribution → Stitch InstantEFT → on-chain receipt generated

Exit codes: `0` = PASS, `1` = FAIL, `2` = all SKIP (services unreachable).

### 3.2 Chaos Gate Benchmark

```bash
npx tsx scripts/chaos-burst.js
```

Exercises fault injection, burst concurrency, and recovery under degraded conditions.

### 3.3 Stress Queue Test

```bash
npx tsx scripts/stress-test-queue.ts
```

Validates queue throughput, backpressure, and idempotency under sustained load.

---

## 4. Campaign Test Commands

All 12 campaigns are executed via `scripts/run-campaigns.sh`. Results are written to `test-campaign-results/`.

### Full Campaign Run

```bash
bash scripts/run-campaigns.sh all
```

### Individual Campaigns

| # | Campaign | Command |
|---|----------|---------|
| 1 | Constitutional Governance | `bash scripts/run-campaigns.sh 1` |
| 2 | Evidence Ledger | `bash scripts/run-campaigns.sh 2` |
| 3 | Capability & Contract Registry | `bash scripts/run-campaigns.sh 3` |
| 4 | Trust Runtime | `bash scripts/run-campaigns.sh 4` |
| 5 | Agent Runtime | `bash scripts/run-campaigns.sh 5` |
| 6 | Tenant Isolation | `bash scripts/run-campaigns.sh 6` |
| 7 | Auth & Identity | `bash scripts/run-campaigns.sh 7` |
| 8 | Governance | `bash scripts/run-campaigns.sh 8` |
| 9 | Watchdog & Observability | `bash scripts/run-campaigns.sh 9` |
| 10 | Compliance & SOC2 | `bash scripts/run-campaigns.sh 10` |
| 11 | E2E & Integration | `bash scripts/run-campaigns.sh 11` |
| 12 | Operational Stress | `bash scripts/run-campaigns.sh 12` |

### Campaign Detail Commands

**Campaign 1 — Constitutional Governance:**

```bash
npx vitest run packages/trust-api/__tests__/enforce-policy-gate.test.ts
npx vitest run packages/trust-api/__tests__/enforce-execution-contract.test.ts
npx vitest run packages/trust-api/__tests__/kill-switch.test.ts
npx vitest run packages/trust-api/__tests__/agent-registry.test.ts
npx vitest run packages/trust-api/__tests__/founder-brief.test.ts
```

**Campaign 2 — Evidence Ledger:**

```bash
npx vitest run src/lib/evidence/__tests__/evidence-envelope.test.ts
npx vitest run src/lib/evidence/__tests__/gate-integration.test.ts
npx tsx scripts/run-air-pipeline.ts
```

**Campaign 3 — Capability & Contract Registry:**

```bash
npx vitest run contracts/__tests__/runtime-contracts.test.ts
npx vitest run packages/trust-crypto/__tests__/hash.test.ts
```

**Campaign 4 — Trust Runtime:**

```bash
npx vitest run src/lib/trust-runtime/__tests__/runtime.test.ts
npx vitest run src/lib/trust-runtime/__tests__/reducer.test.ts
npx vitest run src/lib/trust-runtime/__tests__/projection-manager.test.ts
npx vitest run src/lib/trust-runtime/__tests__/event-store.test.ts
npx vitest run src/lib/trust-runtime/__tests__/verify-replay.test.ts
npx vitest run src/lib/trust-runtime/__tests__/verify-authoritative-sse.test.ts
npx vitest run src/lib/trust-runtime/__tests__/verify-projections-authoritative.test.ts
npx vitest run src/lib/trust-runtime/__tests__/verify-colony.test.ts
npx vitest run src/lib/trust-runtime/__tests__/verify-sse-reconnect.test.ts
```

**Campaign 5 — Agent Runtime:**

```bash
npx vitest run packages/trust-runtime/__tests__/event-journal-async.test.ts
npx vitest run packages/trust-runtime/__tests__/context-manager-async.test.ts
npx vitest run packages/trust-runtime/__tests__/risk-engine-rules.test.ts
```

**Campaign 6 — Tenant Isolation:**

```bash
npx vitest run src/lib/tenant/__tests__/isolation.test.ts
```

**Campaign 7 — Auth & Identity:**

```bash
npx vitest run src/lib/session/__tests__/clerk.test.ts
```

**Campaign 8 — Governance:**

```bash
npx jest tests/governance/signed-registry.test.ts --no-cache
npx jest tests/governance/compatibility.test.ts --no-cache
npx jest tests/governance/quorum-registry.test.ts --no-cache
```

**Campaign 9 — Watchdog & Observability:**

```bash
npx vitest run src/lib/watchdog/__tests__/HeartbeatSchema.test.ts
```

**Campaign 10 — Compliance & SOC2:**

```bash
npx jest __tests__/validate-specs.test.ts --no-cache
npx tsx scripts/behavioral-coverage.ts
```

**Campaign 11 — E2E & Integration (Playwright):**

```bash
npx playwright test e2e/proofbridge.spec.ts --reporter=line
npx playwright test e2e/auth.spec.ts --reporter=line
npx playwright test e2e/pools.spec.ts --reporter=line
npx playwright test e2e/gateway.spec.ts --reporter=line
```

**Campaign 12 — Operational Stress:**

```bash
npx tsx scripts/stress-test-queue.ts
npx tsx scripts/chaos-burst.js
```

---

## 5. E2E Test Commands

### 5.1 Playwright Configuration

`playwright.config.ts` — tests directory: `./tests`, base URL: `http://localhost:3000`, headless mode, 30s timeout, zero retries. Web server auto-starts via `npm run dev` on port 3000.

### 5.2 Execution

```bash
npx playwright install chromium
npx playwright test --reporter=list
```

### 5.3 Individual E2E Specs

```bash
npx playwright test e2e/proofbridge.spec.ts --reporter=list
npx playwright test e2e/auth.spec.ts --reporter=list
npx playwright test e2e/pools.spec.ts --reporter=list
npx playwright test e2e/gateway.spec.ts --reporter=list
```

### 5.4 Auth Spec

```bash
npx playwright test tests/auth.spec.ts --reporter=list
```

### 5.5 HTML Report

```bash
npx playwright show-report
```

---

## 6. ZK Circuit Compilation

### 6.1 Setup

```bash
npm install circomlib
```

### 6.2 Circuit Compilation

```bash
circom circom/threshold.circom --r1cs --wasm --sym --output circom/
circom circom/threshold_rescue.circom --r1cs --wasm --sym --output circom/
```

### 6.3 Trusted Setup

```bash
snarkjs groth16 setup circom/threshold.r1cs ./pot12_final.ptau circom/threshold_0000.zkey
snarkjs zkey contribute circom/threshold_0000.zkey circom/threshold_final.zkey \
  --name="First contribution" -v -e="random entropy text"
snarkjs zkey export verificationkey circom/threshold_final.zkey circom/verification_key.json
```

### 6.4 Proof Generation

```bash
snarkjs groth16 prove circom/threshold_final.zkey circom/witness.wtns circom/proof.json circom/public.json
```

### 6.5 Proof Verification

```bash
snarkjs groth16 verify circom/verification_key.json circom/public.json circom/proof.json
```

### 6.6 Full Setup Script

```bash
bash scripts/setup-zk.sh
```

---

## 7. Smart Contract Tests

### 7.1 Foundry Test Suite

```bash
forge test -vvv
```

### 7.2 Specific Contract Tests

```bash
forge test --match-contract CircuitBreaker -vvv
forge test --match-contract BayesianScorer -vvv
forge test --match-contract SafetyKernel -vvv
forge test --match-contract GovernanceAnchor -vvv
forge test --match-contract AssetRegistry -vvv
forge test --match-contract TEEVerifier -vvv
forge test --match-contract RescuePrimeHash -vvv
```

### 7.3 Coverage

```bash
forge coverage
```

### 7.4 Gas Snapshot

```bash
forge snapshot
```

### 7.5 Deployment Dry Run (Amoy testnet)

```bash
forge script script/GovernanceAnchor.s.sol --rpc-url amoy --broadcast --verify
```

---

## 8. Gate Pipeline Execution

### 8.1 Gate Orchestration

```bash
node scripts/orchestrate-gates.js
```

Runs Gate A through Gate E verification: Health & Infrastructure → Payments & Webhooks → Ledger → Governance → Prod Launch.

### 8.2 AIR Pipeline Runner

```bash
npx tsx scripts/run-air-pipeline.ts
```

Exercises the full evidence envelope lifecycle: build unsigned → hash → sign → verify → ledger commit.

### 8.3 Validate Specs

```bash
npx jest __tests__/validate-specs.test.ts --no-cache
```

---

## 9. Full Pipeline (13-Phase Deployment Loop)

### 9.1 Execute End to End

```bash
bash scripts/deployment-loop.sh
```

Phases executed in order:
1. Commit Gate — critical file check
2. TypeCheck — `tsc --noEmit` (5 packages)
3. Lint — `npm run lint`
4. Tests — `npx vitest run`
5. Build — `npx next build`
6. Behavioral Coverage — 5 compliance flows
7. Vercel Build Gate — jurisdiction-resolved production deploy
8. Push to Origin — `git push origin`
9. DNS Config — domain resolution check
10. Health Check — `/api/health` → HTTP 200
11. Logs & README Sync — deploy log entry
12. Docs Verification — checklist regeneration
13. Final Push — loop artifacts

### 9.2 Pre-Push Hook Installation

```bash
bash scripts/install-hooks.sh
```

### 9.3 Manual Single-Phase Re-run

If only a specific phase needs re-testing:

```bash
# TypeCheck only
npx tsc --noEmit --project packages/trust-crypto/tsconfig.json

# Lint only
npm run lint

# Tests only
npx vitest run

# Build only
npx next build

# Behavioral coverage only
npx tsx scripts/behavioral-coverage.ts

# Full Vercel deploy only (requires jurisdiction resolution)
vercel deploy --prod --force
```

---

## 10. Result Collection

### 10.1 Test Artifacts

| Artifact | Location |
|----------|----------|
| Vitest output | stdout (pipe to file: `npx vitest run 2>&1 \| tee vitest-results.txt`) |
| Forge output | stdout + `out/` directory |
| Campaign results | `test-campaign-results/` |
| Campaign summary | `test-campaign-results/campaign-summary-YYYYMMDD-HHMMSS.md` |
| Playwright report | `playwright-report/` |
| Deployment loop log | `deploy-loop.log` |
| Build output | `.next/` (gitignored) |
| Foundry artifacts | `out/`, `broadcast/` (gitignored) |

### 10.2 Archive Test Run

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "test-archives/$TIMESTAMP"

npx vitest run 2>&1 | tee "test-archives/$TIMESTAMP/vitest.txt"
forge test -vvv 2>&1 | tee "test-archives/$TIMESTAMP/forge.txt"
bash scripts/run-campaigns.sh all 2>&1 | tee "test-archives/$TIMESTAMP/campaigns.txt"
npx playwright test --reporter=list 2>&1 | tee "test-archives/$TIMESTAMP/e2e.txt"

cp deploy-loop.log "test-archives/$TIMESTAMP/" 2>/dev/null || true
cp test-campaign-results/campaign-summary-*.md "test-archives/$TIMESTAMP/" 2>/dev/null || true

echo "Archived to test-archives/$TIMESTAMP/"
```

### 10.3 CI Artifact Collection (GitHub Actions)

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-results-${{ github.run_id }}
    path: |
      test-archives/
      test-campaign-results/
      playwright-report/
      deploy-loop.log
    retention-days: 30
```

---

## Appendix: Environment Variable Requirements

### Required for Local Development

| Variable | Purpose |
|----------|---------|
| `STITCH_WEBHOOK_SECRET` | Ubuntu Pools webhook HMAC validation |
| `VERCEL_OIDC_TOKEN` | Vercel OIDC authentication |
| `KILO_API_KEY` | Kilo agent API access |
| `DEPLOYER_PRIVATE_KEY` | Deployment signer key |
| `CIRCUIT_BREAKER_ADDRESS` | Circuit breaker contract address |
| `ORACLE_PRIVATE_KEY` | Oracle signer |
| `CIRCUIT_BREAKER_ADMIN_KEY` | Circuit breaker admin |
| `CIRCUIT_BREAKER_UPDATER_KEY` | Circuit breaker state updates |
| `VVU_SIGNING_KEY` | VVU evidence signing |
| `SESSION_SECRET` | Session encryption key |
| `COMMAND_CODE_KEY` | Command authorization |
| `WALLET_ADDRESS` | Deployer wallet |
| `ETHERSCAN_PRIVATE` | Etherscan verification |

### Required for Vercel Deployment

| Variable | Purpose |
|----------|---------|
| `VERCEL_TOKEN_PROOFBRIDGE` | Vercel deploy token (jurisdiction-scoped) |
| `PROOFBRIDGE_LINER_KEY` | Application secret |
| `SECRET_KEY` | General application secret |

### Required for ZK Operations

| Variable | Purpose |
|----------|---------|
| `PRIMEINTELLECT_API` | PrimeIntellect compute API |
| `LE_MISTRAL_API` | Mistral AI API |
| `QODANA_TOKEN` | Qodana static analysis |
| `METAMASK_SECRET_TOKEN` | MetaMask SDK |
| `GITHUB_PAT` | GitHub API access |

### Required for CI/CD

| Variable | Purpose |
|----------|---------|
| `VERCEL_TOKEN` | Fallback Vercel token |
| `POLYGON_AMOY_RPC_URL` | Polygon Amoy testnet RPC |
| `ETHERSCAN_API_KEY` | Etherscan contract verification |
