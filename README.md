# VVU — Venture Vision Ubuntu

> **The Constitutional Invariant (machine-checkable):**
>
> *Governance can decide what VVU should do; governance cannot decide that an invalid proof is valid.*
>
> Concretely, no governance decision — shareholder vote, CEO directive, board resolution, tribunal order — may produce the state:
>
> ```
> vote          = PASS
> proof         = FAIL
> authorization = EXECUTE
> ```
>
> The system rejects that state regardless of who voted for it. This is **Article I §1.3 (Three Constitutional Immunities)** of the VVU Governance Charter v1.0 and is enforced at the machine level, not as a guideline.

---

## What VVU is

VVU (Venture Vision Ubuntu) is a constitutionally governed, epistemically secure production system for verifying engineering truth and executing commercial operations. It is **not** an application in the conventional sense — it is an integration of governance, epistemic verification, execution, and immutable proof. The system separates five governance branches (which govern people and institutions) from the Epistemic Core (which governs claims and evidence), and enforces a two-gate execution rule: an action may execute only when both the epistemic gate (the claim is verified) and the constitutional gate (the action is authorized) have independently passed. Neither gate may impersonate the other.

This repository contains the production release: the Next.js 16 web platform, the Solidity sovereign registry contract (deployed dormant and activated only after verified git-sync), the deployment tooling for dual-network testnet anchoring, the auto-deploy watcher that closes the hands-free loop, the GPU pipeline activation workflow, and the constitutional / architectural / deployment documentation that ties it all together.

---

## Governance Stack

```
                         VVU CONSTITUTION
                               │
              ┌────────────────┼────────────────┐
              │                │                │
          SOVEREIGN         GOVERNANCE       EPISTEMIC
          AUTHORITY          BRANCHES           CORE
              │                │                │
       Shareholders      Council / CEO /      IVE / EIS /
                         Board / Tribunal     ProofBridge
              │                │                │
              └────────────────┼────────────────┘
                               │
                         ACCESS CONTROL
                               │
                         SAFEGRID / RBAC
                               │
                       EXECUTION / LEDGER
                               │
                         IMMUTABLE PROOF
```

The five governance branches govern **people and institutions**. The Epistemic Core governs **claims and evidence** — it is not a sixth branch; it is a different category of institution. The Charter, in full, lives at [`VVU-GOVERNANCE-CHARTER.md`](./VVU-GOVERNANCE-CHARTER.md) (committed as the constitutional baseline). Every other artifact in this repository is downstream of that document.

---

## Repository map

| Path | Role |
| --- | --- |
| `VVU-GOVERNANCE-CHARTER.md` | Constitutional baseline — the supreme rulebook |
| `VVU-ARCHITECTURE.md` | Six-layer architecture (L0 math → L5 governance) |
| `VVU-LAYER-MAP.md` | Evidence-discipline overlay — every concept tagged ✅ Deployed / ◇ Metaphor / 🔬 Research |
| `VVU-SESSION-PROTOCOL.md` | Standing operating principle for every runner session |
| `contracts/VVUSovereignRegistry.sol` | Sovereign registry — dormant-deploy pattern, dual-network anchoring |
| `contracts/VVUIVELedger.sol` | IVE ledger contract |
| `test/VVUSovereignRegistry.test.ts` | 22/22 passing sovereign registry test suite |
| `scripts/hardhat/deploy-all.ts` | Dual-network dormant deployment (Arbitrum Sepolia + Polygon Amoy) |
| `scripts/auto-deploy-watcher.ts` | Hands-free loop: file change → compile → test → build → GitHub `repository_dispatch` |
| `scripts/hostafrica/setup-dns.py` | Idempotent DNS A-record setup for `venturevisionubuntu.co.za` |
| `.github/workflows/gpu-pipeline-activation.yml` | GPU smoke → Hardhat → Playwright → benchmark → `activate()` → Vercel prod → DNS check |
| `Caddyfile` | Production reverse proxy + automatic Let's Encrypt TLS |
| `deploy.sh` | Operator deploy script |
| `download/DEPLOYMENT-ARTIFACT-2026-08-18T1557Z.{md,json}` | Canonical deployment artifact (build provenance, source provenance, contract bytecode provenance) |
| `download/SESSION-BLOCKER-2026-08-18T-DNS.md` | Verified blocker: DNS token retrieval path |
| `worklog.md` | Shared multi-agent worklog (Task IDs 1–11) |

---

## Current deployment state

| Layer | State |
| --- | --- |
| Next.js production build | **LIVE** on `0.0.0.0:3000` (pid detached via `setsid`) |
| BUILD_ID | `JTrqZ5EFko2KFojKSK8Z5` (sha256 `6b9a3bea…`) |
| Source commit at build | `ba3d083dc801ba948401a559ca5b5d32597de4c3` |
| Current HEAD | `db308fed11577887e7a164de218b843706a151a7` (docs/scripts only — no source regression) |
| Sovereign contract source | Prepared at `contracts/VVUSovereignRegistry.sol` |
| Sovereign contract bytecode | Compiled artifact sha256 `f0252bc2…` — dormant pattern verified present in bytecode |
| Dual-network deployment tooling | Prepared — `scripts/hardhat/deploy-all.ts` |
| AMD activation workflow | Prepared — `.github/workflows/gpu-pipeline-activation.yml` |
| Git-sync watcher | Prepared — `scripts/auto-deploy-watcher.ts` |
| Custom domain | **Pending** — DNS A/AAAA for `venturevisionubuntu.co.za` → `47.57.232.232` |
| Wallet contract deployment | **Pending** — operator transaction from Remix/MetaMask |
| AMD MI300x self-hosted runner | **Pending** — operator infrastructure |
| HostAfrica DNS API token | **Pending** — not retrievable from Vercel by the runner; see `download/SESSION-BLOCKER-2026-08-18T-DNS.md` |

---

## VVU lifecycle

The lifecycle preserves the distinction between **getting infrastructure deployed** and **allowing verified changes to become authoritative**. Deployment and activation are distinct stages in the bytecode — the contract ships with `paused = true` and is activated only when the AMD/EIS pipeline calls `activate(bytes32 gitCommitHash)` after a verified git-sync.

```
SOURCE
  │
  ▼
BUILD
  │
  ▼
WEB DEPLOYMENT ───────────────► LIVE              ← we are here (preview + :3000)
  │
  ▼
CONTRACT DEPLOYMENT ──────────► ON-CHAIN           ← pending operator transaction
  │
  ▼
VERIFY DEPLOYMENT
  │
  ▼
REGISTER ADDRESSES
  │
  ▼
AMD / EIS / TEST PIPELINE                          ← pending self-hosted runner
  │
  ▼
ACTIVATION / GOVERNANCE                            ← triggered by AMD pipeline
  │
  ▼
CONTINUOUS GIT-SYNC                                 ← launched by `bun run watch:dev-sync`
```

---

## Quick start (local)

```bash
# Install
bun install

# Database (Prisma + SQLite local)
bun run db:push

# Development server (with HMR, port 3000)
bun run dev

# Production build + standalone server
bun run build
PORT=3000 HOSTNAME=0.0.0.0 NODE_ENV=production \
  setsid -f bun .next/standalone/server.js > server.log 2>&1 < /dev/null

# Sovereign contract test suite
bun run hardhat:test          # uses tsconfig.hardhat.json for ESM/CJS interop

# Auto-deploy watcher (DRY_RUN for local validation)
bun run watch:dev-sync:dry
```

The dev server runs on `http://localhost:3000`. The production standalone server is what is currently running detached on this box — same build, same `BUILD_ID`, no HMR.

---

## Production deployment path (operator pending)

The web platform is already built and running locally. To bring `https://venturevisionubuntu.co.za/` live, the operator completes four steps in order:

1. **DNS A record** — `venturevisionubuntu.co.za` → `47.57.232.232`
   - Either via the HostAfrica web panel, OR
   - Via `scripts/hostafrica/setup-dns.py` (requires `HOSTAFRICA_DNS_API_TOKEN`; see `download/SESSION-BLOCKER-2026-08-18T-DNS.md` for the three unblock options)

2. **Caddy reverse proxy + TLS**
   ```bash
   caddy run --config Caddyfile
   ```
   The `Caddyfile` already targets `:3000` as upstream and provisions Let's Encrypt automatically once DNS resolves.

3. **Process persistence** — wrap `bun .next/standalone/server.js` and `caddy run` in `systemd` units or `pm2` so they survive reboot.

4. **Sovereign contract deployment** (separate stage, do not conflate with web deployment) — from Remix/MetaMask, deploy `VVUSovereignRegistry` dormant to Arbitrum Sepolia + Polygon Amoy. Record the deployed addresses in `artifacts/sovereign-arbitrum-sepolia.txt` and `artifacts/sovereign-polygon-amoy.txt`. The contract is now ON-CHAIN but not yet LIVE.

5. **Activation pipeline** — once DNS is live and contracts are deployed, register the AMD MI300x self-hosted runner and launch `bun run watch:dev-sync`. From that point, every verified git-sync triggers the GPU pipeline, which calls `activate(bytes32 gitCommitHash)` on both networks and the contracts transition from dormant to live.

---

## Constitutional articles → enforcement matrix (next artifact)

The Charter is the constitutional layer above the technical architecture. The next engineering artifact is the **Charter-to-System Control Matrix** — a table mapping every article to:

- its enforcement mechanism (contract modifier / M0 doctrine-lint / RBAC check / Tribunal ruling)
- the responsible branch
- the immutable constraint
- the event/audit record
- the failure mode

The matrix will live at `VVU-CHARTER-CONTROL-MATRIX.md` when authored. It is the bridge from the constitutional document to an actually enforceable VVU system. The smart contracts encode only the deterministic subset (identity, authority, permissions, quorum, timelocks, voting, proposal state, treasury constraints, contract ownership, activation state, evidence hashes, commit hashes, audit events, emergency controls). The deeper epistemic rules remain in ProofBridge, EIS, AIR, M0 doctrine-lint, cryptographic verification, and independent evidence.

The chain can prove:

> *"This authorized state transition occurred and corresponds to this evidence commitment."*

It cannot, by itself, prove:

> *"The underlying engineering proposition is scientifically true."*

That distinction is explicit throughout VVU documentation and operations.

---

## The constitutional execution rule

```
              CLAIM
                │
                ▼
        ┌───────────────┐
        │   EPISTEMIC   │
        │   VERIFICATION│
        └───────┬───────┘
                │
          ┌─────┴─────┐
          │           │
         FAIL        PASS
          │           │
          ▼           ▼
        BLOCK      AUTHORITY
                      │
                      ▼
                 GOVERNANCE
                  DECISION
                      │
                ┌─────┴─────┐
                │           │
               DENY       AUTHORIZE
                │           │
                ▼           ▼
              BLOCK       EXECUTE
                            │
                            ▼
                      PROOF / RECEIPT
```

Two independent, non-fungible gates:

- **Gate 1 — Epistemic:** *"Is the claim adequately verified?"* — determined by IVE / ProofBridge
- **Gate 2 — Constitutional:** *"Is the proposed action authorized?"* — determined by governance branches

M0 doctrine-lint is the constitutional sentinel that detects category errors between truth, authority, policy, evidence, and execution. It rejects statements such as *"Shareholders approved it, therefore it is true"* (FAIL — category error) and *"IVE verified the claim, therefore management may execute it"* (INCOMPLETE — authorization still required).

---

## Session protocol

Every VVU runner session closes with evidence of progress. A deployment session closes with a deployment artifact. A blocked session closes with a verified blocker and everything that was successfully completed before it. See [`VVU-SESSION-PROTOCOL.md`](./VVU-SESSION-PROTOCOL.md) §7.1 for the operating rule, and `worklog.md` (Task IDs 1–11) for the running record.

The current session's resume point is `download/DEPLOYMENT-ARTIFACT-2026-08-18T1557Z.md` (deployment state) and `download/SESSION-BLOCKER-2026-08-18T-DNS.md` (DNS blocker). The next session opens these two files before doing anything else.

---

## License & epistemic notice

VVU operates under epistemic immunity: no user, regulator, or shareholder may compel the system to accept an invalid proof as valid. Use of the system constitutes acceptance of this invariant. The constitutional articles **Article I §1.3 (Three Constitutional Immunities)** and **Article VI (The Epistemic Core)** are eternally unamendable — no supermajority, resolution, or judicial reinterpretation may weaken or bypass these provisions.

---

*This README is the canonical entry point. The Charter is the supreme rulebook. The architecture and layer-map documents are the constitutional reference. The deployment artifact is the provenance record. The session protocol is the runner's invariant. Together they form the bridge from constitutional prose to enforceable system.*
