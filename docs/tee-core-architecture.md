# TEE Core Architecture — ProofBridge Liner

## 1. Threat Model

### Adversary Profile
| Threat Actor | Capability | Target |
|-------------|-----------|--------|
| Ghost conveyancer | Forged identity, synthetic data | Submit invalid conveyancing records |
| Tampered validator | Modified verification logic | Bypass circuit breaker |
| Data leakage | Memory scraping, side-channel | Extract client PII/financial data |
| Replay attacker | Re-submit old valid proofs | Re-enter frozen state |

### Attack Surfaces
- **Ingress:** API endpoints accepting conveyancing data
- **Runtime:** Memory inside enclave during execution
- **Egress:** Audit chain export, VCT issuance
- **Key material:** ED25519 signing keys, salt/nonce values

### Security Guarantees
- Confidentiality: Data never visible outside enclave
- Integrity: Code execution attested at boot
- Authenticity: Every output signed with hardware-bound key
- Non-repudiation: Immutable audit chain anchors every state change

---

## 2. Stack

### Hardware Layer
| Option | Use Case | Status |
|--------|----------|--------|
| Intel SGX (TDX) | On-prem / cloud VM | Primary |
| AWS Nitro Enclaves | Cloud-native isolation | Secondary |
| GCP Confidential VM | GCP workloads | Tertiary |

### Runtime Layer
```
┌─────────────────────────────────────┐
│         Host OS (untrusted)         │
├─────────────────────────────────────┤
│       Enclave Runtime (Trusted)     │
│  ┌───────────────────────────────┐  │
│  │         Rust Execution        │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   ProofBridge Liner     │  │  │
│  │  │   - Alpha/Beta compute  │  │  │
│  │  │   - Threshold check     │  │  │
│  │  │   - Poseidon hash       │  │  │
│  │  │   - Merkle leaf gen     │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Attestation Chain
1. **Hardware attestation** — CPU generates report signed by Intel/GCP/Amazon root key
2. ** enclave identity** — SHA-256 of enclave measurement = unique fingerprint
3. **VCT binding** — ED25519 credential ties enclave identity + timestamp + policy version
4. **Client verification** — Any auditor can validate chain without trusting enclave operator

---

## 3. Data Flow

```
[Law Firm Upload]
       │
       ▼
[Encrypted Channel] ──► TLS 1.3 + mTLS
       │
       ▼
[Enclave Seal] ──► Data never decrypted outside enclave
       │
       ▼
[Alpha/Beta Compute] ──► Threshold evaluation
       │
       ▼
[Outcome Branch]
       │
       ├── VALID ──► Poseidon leaf hash ──► Merkle append ──► VCT issue
       │
       └── INVALID ──► Circuit breaker trip ──► Audit anchor ──► Alert
```

### State Machine
```
PENDING ──► VERIFIED ──► CONSUMED ──► ARCHIVED
    │           │            │
    │           ▼            ▼
    │      [Merkle]    [12h purge]
    │
    └── FAILED ──► [Circuit breaker active]
```

---

## 4. FSCA Compliance Mapping

| FSCA Requirement | TEE Attestation Document | Immutable Log |
|-----------------|--------------------------|---------------|
| Reg. 7 — Record keeping | Enclave measurement + code hash | Merkle root + timestamp |
| Reg. 10 — Client verification | VCT signed attestation | Identity check result |
| Reg. 21 — Suspicious activity | Circuit breaker event | SAR/STR trigger log |
| Reg. 23 — Compliance officer | Policy version hash | OPA rule active at ms |
| POPIA s19 — Security measures | Hardware root of trust | Access audit trail |

### Audit Export Format
```json
{
  "$schema": "https://proofbridge.network/v2",
  "enclave": {
    "measurement": "sha256:...",
    "hardware": "intel-tdx",
    "policyVersion": "opa-v1.2.3"
  },
  "evidence": {
    "vkHashCommitment": "0x...",
    "expectedRoot": "0x...",
    "publicInputs": ["0x...", "0x..."]
  },
  "signature": {
    "algorithm": "ed25519",
    "publicKey": "0x...",
    "timestamp": "2026-06-29T17:00:00Z"
  }
}
```

---

## 5. Test Plan

### Unit Tests
| Test | Input | Expected |
|------|-------|----------|
| Threshold valid | α=70, β=30, τ=50/100 | `valid = true` |
| Threshold invalid | α=30, β=70, τ=50/100 | `valid = false` |
| Zero denominator | α=0, β=0 | Circuit breaker trip |
| Replay attack | Re-submit old jobId | Idempotency guard rejects |

### Integration Tests
| Test | Flow | Pass Condition |
|------|------|----------------|
| Tamper code | Modify enclave binary | Attestation fails |
| Circuit breaker | Trigger 3x invalid | Throughput drops to 0 |
| Key rotation | ED25519 key expiry | Zero downtime re-issue |
| Merkle depth | 65,536 leaves | Proof size < 10KB |

### Chaos Tests
- Kill enclave mid-compute → state recovered from WAL
- Network partition → local queue, sync on reconnect
- Clock skew → NTP attestation rejected

---

## 6. Deployment Topology

```
┌──────────────┐      mTLS       ┌──────────────────┐
│  Law Firm    │ ──────────────► │  VVU Gateway     │
│  (Browser)   │                 │  (Vercel Edge)   │
└──────────────┘                 └────────┬─────────┘
                                           │
                                     Queue (NATS)
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                    ┌─────────▼──────────┐   ┌─────────▼──────────┐
                    │  Worker Pool        │   │  TEE Enclave Pool   │
                    │  (Piscina)          │   │  (SGX / Nitro)     │
                    │  - Deserialize      │   │  - Alpha/Beta eval  │
                    │  - Validate inputs  │   │  - Poseidon hash    │
                    │  - Post to enclave  │   │  - VCT sign         │
                    └────────────────────┘   └────────────────────┘
```

---

## 7. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Enclave latency | < 200ms p99 | Inside TEE |
| End-to-end latency | < 500ms p99 | Upload → VCT |
| Throughput | 1000 proofs/min | Per enclave node |
| Merkle proof size | < 10KB | 16-depth tree |
| VCT issuance | < 100ms | ED25519 sign |
| Circuit breaker trip | < 50ms | Fail-closed |

---

## 8. Open Questions
- [ ] SGX vs Nitro vs GCP CVM — finalize on first enterprise PoC
- [ ] Key rotation cadence — 30d / 90d / on-demand?
- [ ] Multi-enclave consensus — single enclave sufficient for Year 1?
- [ ] Side-channel mitigation budget — allocate 20% dev time?
- [ ] Attestation refresh — per-session or per-transaction?
