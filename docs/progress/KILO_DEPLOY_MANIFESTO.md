# ProofBridge Liner: Kilo CLI Deployment Manifesto

This document provides absolute, zero-assumption instructions to deploy the complete **VVU Gateway System** and **Admin Dashboard** in a Replit/Kilo CLI environment.

---

## 1. Environment Priming (The "Source of Truth")

The system relies strictly on environment variables defined in the production environment (e.g., Vercel, Supabase, or Replit Secrets).

1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
    cd proofbridge-liner
    ```
2.  **Secret Injection:** Create or populate `.env.production` (or inject into your CI/CD provider):
    *   `CANTON_JSON_API`: (The Canton ledger endpoint)
    *   `CIRCUIT_BREAKER_ADDRESS`: (Deployed contract address on Polygon Amoy)
    *   `POLYGON_AMOY_RPC`: (https://rpc-amoy.polygon.technology)
    *   `CIRCUIT_BREAKER_UPDATER_KEY`: (Private key of wallet holding MATIC)
    *   `CIRCUIT_BREAKER_UPDATER_ADDRESS`: (Public address of above key)
    *   `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_SERVICE_KEY`: (For Admin RLS)
    *   `FROST_...`: (All 5 signing shares and group key)

---

## 2. Infrastructure Deployment (Contract & Ledger)

### A. Deploy Circuit Breaker Contract
1.  Navigate to `proofbridge-liner/` (if not already there).
2.  Install dependencies: `npm install`
3.  Deploy:
    ```bash
    DEPLOYER_PRIVATE_KEY=<your_key> npx hardhat run scripts/deploy.ts --network polygonAmoy
    ```
4.  **CRITICAL:** Take the output address and update `CIRCUIT_BREAKER_ADDRESS` in your environment settings immediately.

### B. Ledger Readiness
*   Ensure Canton API is reachable and authorized.
*   Verify `ProofBridge:Proposal` and `ProofBridge:Receipt` templates are active on the ledger.

---

## 3. VVU Gateway System UI & Admin Dashboard

The UI is built using Next.js.

### A. Build and Start
1.  **Install:** `npm install`
2.  **Build:** `npm run build`
3.  **Launch:** `npm run start`

### B. Verify Connectivity
*   **Gateway UI:** Ensure it connects to Canton and fetches proposal states.
*   **Admin Dashboard:** Access at `/ubuntu-group/admin`.
    *   *Action:* Check the "System Gates" view.
    *   *Action:* Verify Gate F ("On-Chain Settlement") status is "DELIVERED".
    *   *Action:* Confirm Admin Supabase policies are active.

---

## 4. Operational Maintenance (Closed-Loop Telemetry)

The system is self-healing. Ensure these processes are active:

1.  **Reconciliation Cron:** Runs via Vercel/Replit at `* * * * *` (path: `/api/cron/reconcile-gate-f`).
2.  **Polygon Listener:** Runs at `* * * * *` (path: `/api/cron/polygon-listener`).
3.  **Circuit Breaker:** If the dashboard shows **CIRCUIT OPEN**, do NOT close it blindly.
    *   Audit logs (`/api/cron/reconcile-gate-f` logs).
    *   Manually reconcile Canton vs Polygon hashes.
    *   Use the "Manually Close Circuit" button in the Admin Dashboard ONLY after parity is verified.

---

## 5. Success Criteria
- [ ] Proposals move from `REVIEW` → `AUTHORIZED` in Canton.
- [ ] `ReceiptAnchored` event triggers on Polygon Amoy Scan.
- [ ] Dashboard row updates from `Pending` → `✓ On-chain`.
- [ ] No red warnings on Admin Dashboard.
