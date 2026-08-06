# VVU Trust Runtime Dashboard — User Guide

Welcome to the VVU Trust Runtime Dashboard. This dashboard gives you a single view into every layer of the VVU trust stack — from the cryptographic signing primitives in SafeKrypte, through the credential wrapping in SafeLiner, to the on-chain verification and circuit breaker enforcement in ProofBridge. You can monitor live system health, inspect verification states, track Ubuntu Pool activity, and review on-chain attestations — all without leaving the browser.

---

## 1. Getting Started

### 1.1 Account Setup

Navigate to the VVU Trust Runtime site. If this is your first visit, click **Sign In** on the homepage. You will be redirected to the login page where you can enter your email and password to create a new account or sign in to an existing one.

> **Note:** If the "Confirm email" setting is enabled in Supabase, you must click the confirmation link sent to your email before you can log in for the first time. Check your spam folder if you do not see the email.

Once signed in, you will see your email displayed in the top-right corner of the homepage alongside a **Sign out** button.

### 1.2 First Login

After signing in, you will be redirected to the dashboard. Protected routes — including `/dashboard` and `/safekrypte` — require an active session. If you are not signed in, you will be automatically redirected to the login page.

### 1.3 Dashboard Overview

The dashboard is organised into panels that correspond to the three-layer trust stack:

- **SafeKrypte Panel** — signing service health, key rotation state, tier usage, attestation count
- **ProofBridge Panel** — on-chain contract status, CircuitBreaker state, GovernanceAnchor verification
- **Ubuntu Pools Panel** — live pool data, contribution totals, on-chain receipt status
- **System Health** — overall service status with colour-coded indicators

> **Screenshot placeholder:** The dashboard loads with a bento-grid layout. The top row shows system health indicators with green/amber/red status dots. Below that, three cards display SafeKrypte (signing service), ProofBridge (on-chain), and Ubuntu Pools (live data). Each card shows key metrics at a glance.

---

## 2. SafeKrypte Operations

SafeKrypte is the cryptographic signing layer — the "pen" of the trust stack. It generates ED25519 keypairs, signs content hashes, and produces attestations. It has no opinion about what it signs.

### 2.1 Viewing ZK Verification States

The SafeKrypte status panel shows the current state of the signing service:

| Field | Description |
|-------|-------------|
| **Online** | Whether the SafeKrypte service (port 5096) is reachable |
| **Algorithm** | Signature algorithm in use (ED25519) |
| **Key Binding Mode** | Current mode: `lite` (in-process), `vault` (derivation key), or `tee` (hardware enclave) |
| **Tier** | Whether the service is `active` or `exhausted` based on creator count vs. tier limit |
| **Uptime** | Seconds since the signing service last started |

> **Screenshot placeholder:** The SafeKrypte card displays a green "Online" indicator with the algorithm (ED25519), key binding mode, and uptime. Below, a bar shows creator count out of tier maximum (e.g., 127 / 1000).

### 2.2 Monitoring Key Rotations

SafeKrypte supports automatic key rotation on a configurable interval controlled by the `KEY_ROTATION_MS` environment variable. When rotation occurs, the key rotation counter increments and a new keypair is generated.

To monitor rotations:

1. Open the SafeKrypte panel on the dashboard.
2. Check the **Key Rotations** counter — this tracks the total number of key rotations since service start.
3. The **Key Generated At** timestamp shows when the current active key was created.

If you observe unexpected rotation spikes, check the `KEY_ROTATION_MS` configuration or review the service logs for external triggers.

### 2.3 Tracking MPC Ceremony Validity

For multi-party computation ceremonies, SafeKrypte tracks creator registrations and attestation validity. Each creator is registered with an email address, public key, and key ID. The ceremony is valid when:

- All expected creators have registered public keys
- Attestation signatures can be verified against stored public keys
- The creator count has not exceeded the tier maximum

Review the creator list in the dashboard to confirm all participants have registered and their keys are valid.

> **Screenshot placeholder:** A table listing registered creators with columns for email, key ID, registration date, and attestation status (verified/pending/failed).

---

## 3. SafeLiner Monitoring

SafeLiner wraps raw SafeKrypte signatures into structured credentials — turning a cryptographic signature into a document a regulator, bank, or pool member can read. SafeLiner is also responsible for DPI proxy visual feeds, data-stream isolation, and tenant boundary enforcement.

### 3.1 DPI Proxy Visual Feeds

The dashboard provides visual monitoring of Data Proxy Isolation (DPI) feeds. These feeds show the flow of data through the system's proxy layer.

To access the DPI feed view:

1. Navigate to the SafeLiner section of the dashboard.
2. Select the **DPI Proxy** tab.
3. The feed displays real-time data flow indicators — green for healthy streams, amber for degraded, red for blocked.

> **Screenshot placeholder:** A real-time flow diagram showing data streams between tenants, with arrows coloured green (active), amber (throttled), or red (blocked). A sidebar lists active proxy connections.

### 3.2 Data-Stream Isolation Metrics

Each tenant's data streams are isolated at the network level. The dashboard reports:

- **Active Streams** — number of currently open data streams per tenant
- **Isolation Violations** — any attempts to cross tenant boundaries (should always be zero)
- **Stream Latency** — end-to-end latency per stream in milliseconds

If isolation violations appear, this indicates a potential security issue. Refer to the Incident Response Playbook immediately.

### 3.3 Tenant Security Boundary Alerts

The dashboard monitors tenant security boundaries and raises alerts when:

- A request attempts to access data from a different tenant
- A secret from one tenant is requested in another tenant's context
- An audit log query crosses tenant boundaries

Alerts appear as red banners at the top of the dashboard with a description of the violation and the affected tenant IDs.

### 3.4 Anomaly Events

The Watchdog subsystem continuously monitors all components and classifies anomalies into three categories:

| Category | Meaning | Response |
|----------|---------|----------|
| **A — Transient** | A temporary hiccup (e.g., network noise) | Automatic retry |
| **B — Adversarial** | An active attack or fraud attempt | Escalate and alert |
| **C — Infrastructure** | A system failure on our side | Page an engineer |

Anomaly events appear in the dashboard's event log with timestamps, classification, and affected component.

> **Screenshot placeholder:** An event log table with columns for timestamp, category (A/B/C), description, affected component, and resolution status. Recent events appear at the top.

---

## 4. ProofBridge Attestation Lookup

ProofBridge is the application layer that makes real compliance decisions. The attestation lookup lets you verify on-chain proofs by transaction hash.

### 4.1 Input Transaction Hash

1. Navigate to the **ProofBridge** section of the dashboard.
2. Click **Attestation Lookup**.
3. Enter a Polygon transaction hash in the search field (format: `0x` followed by 64 hex characters).
4. Click **Verify**.

> **Screenshot placeholder:** A search field with placeholder text "Enter transaction hash (0x...)" and a blue "Verify" button. Below, a panel is ready to display results.

### 4.2 Read Back On-Chain Proof

After entering a valid transaction hash, the verification panel displays:

| Field | Description |
|-------|-------------|
| **Transaction Hash** | The hash you entered |
| **Block Number** | The block containing the transaction |
| **Network** | Polygon Amoy (chain ID 80002) |
| **Asset ID** | The keccak256 asset identifier used in the anchoring |
| **Deed Hash** | The anchored proof hash |
| **Anchor Count** | Total anchors in the GovernanceAnchor contract |
| **Verifier Address** | The address of the on-chain verifier |

### 4.3 Verification Panel Walkthrough

The verification panel guides you through the proof validation:

1. **Contract Check** — confirms the GovernanceAnchor and CircuitBreaker contracts are deployed at the expected addresses on Polygon Amoy
2. **Fail-Closed Verification** — confirms that `isAnchoredValid()` returns `false` for an unset asset (this is the expected safe-state behaviour)
3. **Circuit State** — shows whether the CircuitBreaker is open (transactions halted) or closed (transactions flowing)
4. **Proof Anchoring** — if the asset is anchored, shows the deed hash and verification timestamp

> **Screenshot placeholder:** A two-column layout. Left column: verification steps with green checkmarks (pass) or red X marks (fail). Right column: raw JSON response from the on-chain verification for technical users.

---

## 5. Dashboard Settings

### 5.1 Theme Customization

The dashboard supports light and dark themes. Toggle between them using the theme switcher in the top-right corner of the dashboard. Your preference is saved locally in your browser and persists across sessions.

### 5.2 Notification Preferences

Configure which alerts appear as banners in the dashboard:

| Setting | Default | Description |
|---------|---------|-------------|
| **Circuit Breaker Trips** | On | Alert when the on-chain circuit breaker opens |
| **Tenant Isolation Violations** | On | Alert when a cross-tenant access is attempted |
| **SafeKrypte Key Rotations** | Off | Alert when signing keys are rotated |
| **Anomaly Events (B and C)** | On | Alert for adversarial and infrastructure anomalies |
| **Pool Status Changes** | On | Alert when a pool transitions status |

To modify notification settings, click the gear icon in the dashboard header and select **Notifications**.

> **Screenshot placeholder:** A settings panel with toggle switches for each notification type. Each toggle shows the current state (on/off) with a brief description below.

---

## 6. FAQ

### Q: The dashboard says SafeKrypte is offline. What do I do?

SafeKrypte runs on port 5096. Check that the service is running locally:

```bash
curl http://127.0.0.1:5096/health
```

If the service is not running, start it with:

```bash
npx tsx server/safekrypte-lite.ts
```

If it is running but the dashboard shows offline, check that the `SAFEKRIPTE_URL` environment variable is set correctly and that no firewall is blocking the connection.

### Q: The CircuitBreaker shows as "open" — are all transactions halted?

Yes. When the circuit breaker is open (`circuitOpen()` returns `true`), all money transfers are halted. The system returns HTTP 423 (Locked) for any verification request. This is a safety feature — transactions resume only when the circuit is manually closed after the underlying issue is resolved.

### Q: I entered a transaction hash but the verification panel is empty.

Ensure the hash is a valid Polygon Amoy transaction hash (66 characters including the `0x` prefix). If the transaction has not been mined yet, the panel will show "Pending." If the transaction is older than the RPC provider's archive range, you may need to use a block explorer.

### Q: How do I check if my pool contribution was recorded on-chain?

Navigate to the **Ubuntu Pools** panel and locate your pool. The `onChainReceipt` section shows:

- **Verified** — whether the receipt has been confirmed on-chain
- **Tx Hash** — the Polygon transaction hash (if anchored)
- **Block Number** — the block number (if anchored)

If the receipt shows `verified: false` with no transaction hash, the contribution has not yet been anchored to the blockchain. This may be due to pending confirmation or a circuit breaker trip.

### Q: Why do I keep getting redirected to the login page?

Your session may have expired. Clear your browser cookies for the site and sign in again. If the issue persists, confirm that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables are correctly configured in the deployment.

### Q: Can I access the dashboard without signing in?

No. The `/dashboard` and `/safekrypte` routes are protected by middleware. You must be signed in to access them. The homepage is publicly accessible.
