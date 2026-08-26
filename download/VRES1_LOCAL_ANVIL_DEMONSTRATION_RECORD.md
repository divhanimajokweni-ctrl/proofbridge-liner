# VRES1 · Local Anvil Demonstration Record

**Status:** COMPLETE · CAPTURED · FROZEN
**Date of record:** 2026-08-24 06:33 UTC (Africa/Johannesburg)
**Environment:** Local Foundry Anvil (chain ID 31337) — NOT Arbitrum Sepolia.
**Boundary:** This is the on-chain proof that the CorruptorTarget contract
behaves per the public spec. It is NOT the public Sepolia demonstration.
Sepolia requires RPC + private key credentials that are not present in this
sandbox; that boundary is owned by the on-call engineer.

---

## 1. Demonstration Summary

The full VRES1 fault-injection loop was executed against a local Foundry
Anvil EVM node. The CorruptorTarget contract was deployed, a victim deposit
was made, the `withdrawCorrupt()` reentrancy path was exercised, and the
`FraudAttempt(address,string)` event was captured from the on-chain
transaction receipt. The event decodes to:

```
FraudAttempt(
  attacker = 0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266,
  reason   = "reentrancy"
)
```

This is exactly the event the off-chain Watchdog listener is specified to
subscribe to (per `/download/VRES1_ANNOUNCEMENT_PREAMBLE.md` Section 3).

---

## 2. Captured Records

### 2.1 Foundry toolchain

| Component | Version |
|---|---|
| forge | 1.7.1 (4072e48705 2026-05-08) |
| cast  | 1.7.1 (4072e48705 2026-05-08) |
| anvil | 1.7.1 (4072e48705 2026-05-08) |
| solc  | 0.8.19 |
| forge-std | v1.16.2 |

### 2.2 On-chain transactions (chain ID 31337, local anvil)

| # | Step | Tx hash | Block | Gas used |
|---|---|---|---|---|
| 1 | Deploy `CorruptorTarget` | `0xd18d2fe5047cc8e72f41c0724fc9c0a65e2c75de724d1394bf304fddb3f551ee` | 21 | 294,939 |
| 2 | Victim deposit (0.05 ETH) | `0x7803d5eaaa0876a5cb65d451138577ead417bd76c4b70e70ffd3526e6ef12363` | 24 | 44,937 |
| 3 | `withdrawCorrupt()` — FraudAttempt emitted | `0x757c8b4804867852476f3dbeea78d6cc8a893fe41c22960b2b7fde12ad0c85b1` | 27 | 30,530 |

Contract address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
Deployer / victim / attacker (same wallet for demo): `0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266`

### 2.3 FraudAttempt event (raw log)

```
address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
topics[0]:  0x8a6848f174482cc45ecfc02a92746950dbaf10363c751e2637f2ee81c66b809f
            (= keccak256("FraudAttempt(address,string)"))
topics[1]:  0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266
            (indexed attacker address)
data:      0x0000...0020
            0000...000a
            7265656e7472616e6379000...  (= "reentrancy" — 10 bytes)
```

Decoded event:
```
FraudAttempt(
  attacker = 0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266,
  reason   = "reentrancy"
)
```

### 2.4 Unit tests (forge test)

```
Ran 3 tests for test/CorruptorTarget.t.sol:CorruptorTargetTest
[PASS] test_HonestWithdrawalDoesNotEmitFraud() (gas: 39128)
[PASS] test_ReentrancyDrainsMoreThanInitialDeposit() (gas: 39346)
[PASS] test_WithdrawCorruptEmitsFraudAttempt() (gas: 38802)
Suite result: ok. 3 passed; 0 failed; 0 skipped
```

---

## 3. L0 Provenance Hash

The L0 provenance hash binds this demonstration record to the on-chain event.
It is computed as `keccak256(fraud_tx_hash || fraud_event_topic || attacker_address)`:

```
fraud_tx_hash:  0x757c8b4804867852476f3dbeea78d6cc8a893fe41c22960b2b7fde12ad0c85b1
event_topic:   0x8a6848f174482cc45ecfc02a92746950dbaf10363c751e2637f2ee81c66b809f
attacker:       0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

Concatenated input (192 hex bytes / 384 hex chars + 0x prefix):
```
0x757c8b4804867852476f3dbeea78d6cc8a893fe41c22960b2b7fde12ad0c85b1
  8a6848f174482cc45ecfc02a92746950dbaf10363c751e2637f2ee81c66b809f
  000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

**L0 provenance hash (verified via `cast keccak`):**
```
0xfc6b51ba8bafa7032c07836b04d0edd97d1c5a0de6e12698b5c16016e6587054
```

Reproducible — any third party can recompute it:
```bash
cast keccak "0x757c8b4804867852476f3dbeea78d6cc8a893fe41c22960b2b7fde12ad0c85b18a6848f174482cc45ecfc02a92746950dbaf10363c751e2637f2ee81c66b809f000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"
# → 0xfc6b51ba8bafa7032c07836b04d0edd97d1c5a0de6e12698b5c16016e6587054
```

---

## 4. What This Proves (Bounded Claims)

Following the VRES1 scope-decision framework — Provable, Auditable, Honest,
Conservative — this record proves **exactly** the following and nothing more:

1. **Provable** — the CorruptorTarget contract emits the `FraudAttempt` event
   when the `withdrawCorrupt()` path is exercised. The unit test
   `test_WithdrawCorruptEmitsFraudAttempt` asserts this with `vm.expectEmit`,
   and the live anvil demonstration confirms it on a real EVM.

2. **Auditable** — every artefact is reproducible from this repository:
   - Contract: `contracts/watchdog-demo/src/CorruptorTarget.sol`
   - Tests: `contracts/watchdog-demo/test/CorruptorTarget.t.sol`
   - Deploy script: `contracts/watchdog-demo/script/DeployCorruptor.s.sol`
   - Reproduction: `forge test -vv` then run §5 below.

3. **Honest** — this demonstration is on **local anvil (chain ID 31337)**,
   **NOT** Arbitrum Sepolia. We are not claiming a public testnet proof. We
   are claiming that the contract + listener specification is correct and
   that the loop closes end-to-end on a real EVM.

4. **Conservative** — claims are scoped to "the target contract emits the
   documented event when the documented exploit path is exercised." We make
   no claim about cryptographic collision resistance, production mainnet
   behaviour, or any domain outside the declared value schema.

---

## 5. Reproduction Steps

Any third party with Foundry installed can reproduce this record exactly:

```bash
# 1. Install foundry
curl -sL https://foundry.paradigm.xyz | bash
foundryup

# 2. Run the unit tests (proves contract behaviour)
cd contracts/watchdog-demo
forge test -vv

# 3. Run the live anvil demonstration (proves EVM loop closes)
anvil --port 8545 --block-time 1 &
DEPLOYER=0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266

forge create src/CorruptorTarget.sol:CorruptorTarget \
  --rpc-url http://localhost:8545 --from $DEPLOYER --unlocked --broadcast

# Note the deployed address, then:
CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3

cast send --rpc-url http://localhost:8545 --from $DEPLOYER --unlocked \
  $CONTRACT "deposit()" --value 0.05ether

cast send --rpc-url http://localhost:8545 --from $DEPLOYER --unlocked \
  $CONTRACT "withdrawCorrupt()"

# Query the latest block for the fraud tx, then decode the receipt:
cast receipt --rpc-url http://localhost:8545 <FRAUD_TX>
```

Expected result: a single log entry whose `topic0` equals
`0x8a6848f174482cc45ecfc02a92746950dbaf10363c751e2637f2ee81c66b809f`
(= `keccak256("FraudAttempt(address,string)")`).

---

## 6. What This Does NOT Prove (Explicit Exclusions)

Per the VRES1 boundary:

- ❌ **Does NOT prove** Watchdog can detect the fault on Arbitrum Sepolia.
  That requires RPC + private key credentials not present in this sandbox.
- ❌ **Does NOT prove** the L0 provenance hash is collision-resistant across
  all possible domains. It is deterministic for the declared field set
  (tx_hash || event_topic || attacker_address).
- ❌ **Does NOT prove** the off-chain Watchdog listener subscribes correctly
  in production. The listener is specified in the VRES1 preamble; its
  implementation is the on-call engineer's responsibility.
- ❌ **Does NOT prove** anything about mainnet behaviour, gas economics on
  public networks, or mempool inclusion under real load.

---

## 7. Next Boundary (Sepolia — Owned by On-Call Engineer)

The Sepolia demonstration is the next boundary. The on-call engineer needs:

1. `SEPOLIA_RPC` — Arbitrum Sepolia RPC URL (Alchemy / Infura / etc.)
2. `DEPLOYER_PRIVATE_KEY` — funded testnet wallet (any amount > 0 for gas)
3. Run the same three commands from §5, swapping `http://localhost:8545` for
   `$SEPOLIA_RPC` and `--from $DEPLOYER --unlocked` for `--private-key $PK`.

The acceptance criteria are documented in
`/download/VRES1_ANNOUNCEMENT_PREAMBLE.md` Section 3:

1. A transaction hash on Arbitrum Sepolia where Watchdog detected the fault.
2. A screenshot of Arbiscan showing the `FraudAttempt` event.
3. The L0 decision hash from Watchdog's response.
4. A short post-mortem on what broke and how it was fixed.

This local anvil record is the **implementation proof**. The Sepolia record
will be the **public proof**.

---

## 8. Signature Block

```
VRES1 · LOCAL ANVIL DEMONSTRATION RECORD
Frozen: 2026-08-24 06:33 UTC (Africa/Johannesburg)
Chain ID: 31337 (local)
Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Fraud tx: 0x757c8b4804867852476f3dbeea78d6cc8a893fe41c22960b2b7fde12ad0c85b1
L0 hash:  0xfc6b51ba8bafa7032c07836b04d0edd97d1c5a0de6e12698b5c16016e6587054
Tests:    3 passed / 0 failed
Boundary: LOCAL ONLY — Sepolia demonstration owned by on-call engineer.
```

---

**Record status:** FROZEN.
**Reproducibility:** Full (§5).
**Honest scope:** Bounded (§4, §6).
