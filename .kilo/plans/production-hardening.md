# Production-Hardening Plan for VVU Earth-Tech

## Goal
Reconcile the 10-fix production spec with the existing Foundry-based codebase. Merge spec improvements into canonical contracts and fix broken configs.

---

## Audit Findings

| Location | Issue |
|----------|-------|
| `contracts/` | Exists with Foundry; spec's `src/lib/contracts/` path conflicts |
| `src/lib/contracts/CircuitBreaker.sol` | Duplicate — different from `contracts/CircuitBreakerV2.sol` |
| `hardhat.config.js` | Requires `@nomicfoundation/hardhat-toolbox` (not installed); project uses Foundry |
| `src/lib/contracts/test/` | Wrong test path for Foundry — should be `test/` |
| `src/lib/security/*.py` | Correct location, unfinalized relative to spec |
| `scripts/deploy.py` | Python-era deploy; canonical is `scripts/deploy.js` (Foundry) |

---

## Steps

### 1. Merge spec's EIP-712/production hardening into `contracts/CircuitBreakerV2.sol`
Current V2 has threshold multisig but lacks:
- EIP-712 typed data (`ALIGNMENT_ASSERTION_TYPEHASH`)
- Cooldown rate limiting (`MIN_TRIP_INTERVAL`, `lastTripTimestamp`)
- Indexed events with verifier address
- Timestamp staleness checks
- `rotateVerifier()` and `emergencyResume()` 
Update V2 to include these. The existing `CircuitBreaker.sol` (MVP) remains unchanged for now.

### 2. Clean up duplicate contract
Delete `src/lib/contracts/CircuitBreaker.sol` — it duplicates the canonical `contracts/CircuitBreakerV2.sol` after merge.

### 3. Move forge test to correct path
Move `src/lib/contracts/test/CircuitBreaker.t.sol` → `test/CircuitBreaker.t.sol`.
Update import paths. Remove empty `src/lib/contracts/test/` dir.

### 4. Fix `hardhat.config.js`
Replace `require("@nomicfoundation/hardhat-toolbox")` with a no-op stub that exports an empty config if hardhat isn't installed. This prevents runtime errors if node modules are loaded during Next.js build.

### 5. Finalize `.env.example`
Add all new spec variables: `POLYGON_AMOY_RPC_URL`, `AMOY_RPC_URL`, `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `AUTHORIZED_VERIFIER`, `CONTRACT_ADDRESS`, `POLYGONSCAN_API_KEY`, `ETHERSCAN_API_KEY`.

### 6. Keep Python files
`src/lib/security/alignment_bridge.py`, `contract_client.py`, `metrics.py`, `src/lib/models/sae_monitor.py` — already in correct location, keep as-is.

### 7. Keep `scripts/deploy.py`, `deploy.sh`
As reference/alternative deploy paths. Canonical Foundry deploy remains `scripts/deploy.js`.

### 8. Commit & push
Stage all changes, commit with message describing the 10-fix production hardening, push to `compliance-fabric` then merge to `main`.

---

## Files Changed Summary
| File | Action |
|------|--------|
| `contracts/CircuitBreakerV2.sol` | Update — merge EIP-712, rate limiting, indexed events from spec |
| `src/lib/contracts/CircuitBreaker.sol` | Delete — duplicate of V2 |
| `test/CircuitBreaker.t.sol` | Create (moved from `src/lib/contracts/test/`) |
| `hardhat.config.js` | Fix — remove broken toolbox require |
| `.env.example` | Update — add new spec vars |
| `src/lib/contracts/` | Remove empty dir |
| All other new files | Keep as-is |
