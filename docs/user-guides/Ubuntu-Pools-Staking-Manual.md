# Ubuntu Pools — Liquidity & Staking Manual

Welcome to Ubuntu Pools. Ubuntu Pools is the community-governed savings circle layer of the VVU Trust Runtime — built on the African philosophy of *ubuntu*: *I am because we are*. Members contribute money in recurring cycles, every contribution is cryptographically verified, and every transaction is anchored to a public blockchain so that no record can be silently altered. This manual covers how to connect, stake, monitor, verify, and govern your pool.

---

## 1. Getting Started

### 1.1 Connecting Your Wallet

Ubuntu Pools runs on the Polygon Amoy testnet (chain ID 80002). To interact with pools:

1. Open the VVU Trust Runtime site and sign in.
2. Navigate to the **Ubuntu Pools** section from the dashboard.
3. If wallet interaction is required, connect a Web3 wallet (e.g., MetaMask) configured with the Polygon Amoy network.
4. Ensure your wallet holds sufficient MATIC for transaction gas on the Amoy testnet.

> **Note:** Contribution payments are processed via Stitch Money InstantEFT. The wallet connection is used for on-chain verification and governance interactions, not for payment processing.

### 1.2 Viewing Pool Overview

The pool overview screen displays all pools with the following information:

| Field | Description |
|-------|-------------|
| **Pool Name** | The name assigned by the pool creator |
| **Pool Type** | The savings circle structure (e.g., rotating, fixed) |
| **Contribution (ZAR)** | The contribution amount in South African Rand |
| **Cycle** | The current contribution cycle number |
| **Status** | Pool state (ACTIVE, PAUSED, CLOSED) |
| **On-Chain Receipt** | Whether the latest receipt has been anchored to Polygon |

> **Screenshot placeholder:** A card-grid layout where each pool is a card showing the pool name, type, contribution amount in ZAR, cycle number, and a green "ACTIVE" badge. At the bottom of each card, a small icon indicates on-chain receipt status (green checkmark = verified, grey circle = pending).

---

## 2. Validator Node Monitoring

### 2.1 Live Validator State Tracks

Each pool has associated validator nodes that process and verify contributions. The dashboard shows live validator state:

| State | Meaning |
|-------|---------|
| **IDLE** | Validator is online and awaiting work |
| **INGESTING** | Validator is receiving contribution data |
| **ATTESTING** | Validator is generating a cryptographic attestation |
| **VERIFYING** | Validator is verifying signatures and proofs |
| **COMMITTING** | Validator is writing results to the evidence store |
| **SETTLED** | Validator has completed the full cycle |
| **HAZARD** | Validator has detected an anomaly and halted |

> **Screenshot placeholder:** A horizontal state machine diagram showing the validator states (IDLE → INGESTING → ATTESTING → VERIFYING → COMMITTING → SETTLED) with the current state highlighted in blue. The HAZARD state is shown as a red detour branching off from any state.

### 2.2 Staking Commitments

Staking commitments represent the capital locked by validators to participate in pool processing. Each commitment includes:

- **Validator ID** — unique identifier for the validator
- **Staked Amount** — the amount of tokens or ZAR equivalent locked
- **Commitment Period** — duration of the stake (e.g., 30 days, 90 days)
- **Status** — Active, Unbonding, or Withdrawn

To view staking commitments, navigate to **Ubuntu Pools → Staking** in the dashboard.

### 2.3 Multi-Tenant Pool Distribution Rules

When multiple savings groups share the same infrastructure, pool distribution rules ensure fairness:

- **Proportional Distribution** — contributions are allocated to pools based on their size relative to total pool assets
- **Priority Queuing** — larger contribution amounts receive processing priority
- **Tenant Isolation** — each pool's data is completely isolated from others (no cross-pool data leakage)
- **Cycle Synchronisation** — pools on the same cycle are batched together for gas efficiency

---

## 3. On-Chain Staking

### 3.1 How to Stake

1. Navigate to **Ubuntu Pools → Staking** in the dashboard.
2. Click **New Stake**.
3. Select the pool you wish to stake in.
4. Enter the staked amount (minimums may apply based on pool configuration).
5. Choose a commitment period.
6. Review the transaction details and confirm.
7. The staking transaction is submitted to Polygon Amoy. You will see a transaction hash once confirmed.

### 3.2 How to Unstake

1. Navigate to **Ubuntu Pools → Staking**.
2. Locate your active stake and click **Unstake**.
3. If the commitment period has not elapsed, you will be prompted with any early withdrawal penalties.
4. Confirm the unstaking transaction.
5. During the unbonding period (typically 7–21 days), your stake remains locked. After the unbonding period, the funds become available for withdrawal.

### 3.3 Viewing Rewards

Pool rewards are distributed proportionally to all stakers at the end of each cycle:

1. Navigate to **Ubuntu Pools → Rewards**.
2. Select the pool and cycle you want to inspect.
3. The rewards panel shows:
   - **Total Pool Rewards** — total rewards earned by the pool in this cycle
   - **Your Share** — your proportional share based on stake size
   - **Reward Transaction** — the Polygon transaction hash for the reward distribution
   - **Claimed** — whether you have claimed your rewards

---

## 4. On-Chain Receipts

### 4.1 Cross-Referencing Pool Balances

Every pool contribution generates an on-chain receipt that can be cross-referenced against the public Polygon RPC ledger. This is how you confirm that the system's records match the blockchain.

To cross-reference:

1. Obtain the transaction hash from your pool's **On-Chain Receipt** section.
2. Open a Polygon Amoy block explorer (e.g., `amoy.polygonscan.com`).
3. Search for the transaction hash.
4. Compare the transaction details (amount, timestamp, sender, receiver) with the pool's contribution record in the dashboard.

### 4.2 Using Transaction Hashes

Each receipt contains:

| Field | Description |
|-------|-------------|
| **Transaction Hash** | Unique identifier for the blockchain transaction |
| **Block Number** | The block in which the transaction was mined |
| **From Address** | The sender's wallet or contract address |
| **To Address** | The recipient's wallet or contract address |
| **Value** | The amount transferred (in MATIC or ZAR equivalent) |
| **Timestamp** | When the transaction was mined |

### 4.3 Verifying Pool Integrity

To verify that a pool's on-chain records are consistent:

1. Navigate to the pool's detail view.
2. Click **Verify On-Chain**.
3. The system queries the Polygon RPC endpoint, retrieves the latest anchor count from the GovernanceAnchor contract, and compares it against the pool's expected anchor count.
4. A green **Verified** badge confirms consistency. A red **Mismatch** badge indicates a discrepancy that requires investigation.

---

## 5. Pool Governance

### 5.1 Voting

Pool members can vote on governance proposals that affect pool rules, contribution amounts, and validator selection:

1. Navigate to **Ubuntu Pools → Governance**.
2. Review the list of active proposals.
3. Click on a proposal to read its full description.
4. Cast your vote (For, Against, or Abstain).
5. Your vote is recorded on-chain and reflected in the proposal results.

### 5.2 Proposals

Any pool member with sufficient stake can submit a proposal. Common proposal types include:

- **Contribution Adjustment** — change the monthly contribution amount
- **Cycle Extension** — extend or shorten the contribution cycle
- **Validator Replacement** — remove a validator that is underperforming
- **Pool Rules Amendment** — modify payout order, late-payment penalties, or member eligibility

### 5.3 Community Decisions

Governance decisions follow a simple majority rule unless the pool's configuration specifies a higher threshold. Decisions are binding once the voting period closes. All votes and outcomes are recorded in the immutable audit trail.

---

## 6. Compliance

### 6.1 FIC Act Compliance

Ubuntu Pools operates under the Financial Intelligence Centre Act (FIC Act) as required for South African savings circles. Compliance includes:

- **Suspicious Transaction Reporting (STR)** — any transaction flagged by the Bayesian scoring engine as potentially adversarial (Category B) is automatically queued for STR filing via the goAML protocol
- **Record Keeping** — all transaction records, contribution histories, and audit trails are retained for the legally mandated period
- **Client Identification** — all pool members must complete identity verification (KYC) before participating

### 6.2 KYC Requirements

Before joining a pool, members must provide:

1. **Proof of Identity** — South African ID book, passport, or asylum document
2. **Proof of Address** — utility bill or bank statement dated within the last 3 months
3. **Contact Information** — email address and mobile number

KYC documents are verified through the compliance fabric and stored with tenant-level isolation. Documents are never shared between pools or tenants.

> **Note:** KYC verification is a prerequisite for pool participation. You cannot stake, contribute, or vote without completing KYC.

---

## 7. Troubleshooting

### Q: My contribution was processed but the on-chain receipt shows "pending."

On-chain anchoring occurs after the full prover pipeline completes (Fetcher → Validator → Scorer → Submitter → Broadcaster). If the pipeline is in progress or the CircuitBreaker is tripped, anchoring is deferred. Check the ProofBridge panel for pipeline status and circuit state. If the circuit breaker is tripped, all money movement is frozen until it is resolved.

### Q: I cannot connect my wallet to Polygon Amoy.

Ensure your wallet is configured with the following network settings:

| Setting | Value |
|---------|-------|
| Network Name | Polygon Amoy |
| RPC URL | `https://rpc-amoy.polygon.technology` |
| Chain ID | 80002 |
| Currency Symbol | MATIC |
| Block Explorer | `https://amoy.polygonscan.com` |

If you are using MetaMask, add a custom network with these values.

### Q: My staking transaction failed with "insufficient funds."

Staking transactions require gas fees in MATIC on the Polygon Amoy testnet. Obtain testnet MATIC from the Polygon Amoy faucet at `faucet.polygon.technology`. Ensure your wallet has sufficient MATIC to cover both the stake amount and the transaction gas.

### Q: A pool shows "HAZARD" status. What happened?

A HAZARD state means the validator detected an anomaly that meets one of the adversarial or infrastructure failure thresholds. The pool is frozen until a human operator investigates. Check the anomaly event log in the dashboard for details. Do not attempt to unstake or contribute to a pool in HAZARD state.

### Q: I cannot vote on a governance proposal.

You must have an active stake in the pool to vote. If your stake is in unbonding or withdrawn status, you are not eligible. Ensure you hold at least the minimum stake required by the pool's governance configuration.

### Q: How do I check if a pool member has completed KYC?

Pool administrators can view KYC status in the member list. Individual members cannot see other members' KYC details due to tenant isolation and privacy requirements. Contact your pool administrator for KYC status inquiries.
