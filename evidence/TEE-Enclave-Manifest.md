# TEE Enclave Manifest — Hardware Attestation Baseline

**Version:** 1.0.0
**Date:** 2026-07-17
**Classification:** CONFIDENTIAL — PRODUCTION USE ONLY
**Entity:** Venture Vision Ubuntu (VVU) / ProofBridge Liner
**Document Owner:** Reliability Engineer, VVU

---

## Supported Platforms

| Platform | Vendor | Status | Integration Level |
|----------|--------|--------|-------------------|
| AMD SEV-SNP | AMD | STANDBY | Specification complete, hardware pending |
| Intel SGX | Intel | STANDBY | Specification complete, hardware pending |
| AWS Nitro Enclaves | Amazon Web Services | STANDBY | Specification complete, infrastructure pending |

All three platforms are supported in the attestation specification. Hardware-level integration is pending deployment to TEE-capable infrastructure. The software interfaces are implemented and tested against mock attestations.

---

## 1. Enclave Configuration

### 1.1 TEE_ENCLAVE_PRIVATE_KEY_PEM Injection

The enclave private key (`TEE_ENCLAVE_PRIVATE_KEY_PEM`) is injected into the Trusted Execution Environment through platform-specific secure bootstrapping mechanisms. The key is never exposed to the host operating system, hypervisor, or any software running outside the enclave boundary.

**Injection Flow:**

```
1. Key Generation
   ├── Hardware RNG or DRBG seeded from hardware entropy source
   ├── Key generated inside enclave memory
   └── Key material never crosses enclave boundary in plaintext

2. Key Storage
   ├── Platform-specific secure key vault
   ├── AMD SEV-SNP: VM Page Manager encrypted region
   ├── Intel SGX: EPC (Enclave Page Cache) with MEE encryption
   └── AWS Nitro: Nitro Security Module (NSM) dedicated hardware

3. Key Derivation
   ├── TEE_ENCLAVE_PRIVATE_KEY_PEM used as HKDF input key material
   ├── Derives domain-separated subkeys for:
   │   ├── Signing key (evidence ledger attestation)
   │   ├── Encryption key (enclave communication)
   │   └── Attestation key (platform-specific quote generation)
   └── Each derivation uses a unique, fixed-info string per domain
```

**Key Injection Properties:**

| Property | Requirement | Enforcement |
|----------|-------------|-------------|
| Confidentiality | Key never exists outside enclave memory | Hardware memory encryption |
| Integrity | Key cannot be tampered with by host | Platform integrity verification |
| Freshness | Key generated per-enclave instance | Per-boot entropy source |
| Isolation | Key inaccessible to co-tenants | Hardware-enforced isolation |

### 1.2 Enclave Lifecycle

```
PROVISION → INIT → ATTEST → RUNTIME → SHUTDOWN
    │          │        │         │          │
    │          │        │         │          └── Key zeroization
    │          │        │         └── Continuous attestation
    │          │        └── Platform quote generation
    │          └── Memory encryption setup
    └── Key material injected
```

---

## 2. Attestation Flow

### 2.1 Intel SGX Quote Generation

```
┌─────────────────────────────────────────────────┐
│                 SGX Enclave                      │
│                                                  │
│  1. Enclave generates report data                │
│     ├── report_data = SHA-256(enclave_state)     │
│     └── report_data includes enclave measurement │
│                                                  │
│  2. Enclave requests quote from QE               │
│     ├── SGX_QE reports enclave identity          │
│     └── QE signs report with Intel key           │
│                                                  │
│  3. Quote returned to enclave                    │
│     ├── Quote contains:                          │
│     │   ├── Enclave measurement (MRENCLAVE)      │
│     │   ├── Enclave signer (MRSIGNER)            │
│     │   ├── Report data (hash of enclave state)  │
│     │   ├── QE identity                          │
│     │   └── Quote signature                      │
│     └── Quote is platform-attested evidence      │
│                                                  │
│  4. Quote submitted to GovernanceAnchor          │
│     └── On-chain verification via verifier       │
└─────────────────────────────────────────────────┘
```

**SGX Attestation Properties:**

| Property | Description |
|----------|-------------|
| MRENCLAVE | SHA-256 hash of enclave code and data at load time |
| MRSIGNER | SHA-256 hash of enclave signer's public key |
| ISVPRODID | Product identifier assigned by Intel |
| ISVSVN | Security version number for the product |
| REPORTDATA | 64 bytes of user-defined data (enclave state hash) |
| QUOTE | SGX-signed attestation binding measurement to report data |

### 2.2 AMD SEV-SNP Attestation Report

```
┌─────────────────────────────────────────────────┐
│               SEV-SNP Guest VM                   │
│                                                  │
│  1. Guest requests attestation report            │
│     ├── Guest generates report_data              │
│     │   ├── report_data = SHA-256(vm_state)      │
│     │   └── Includes VM measurement              │
│     └── Report request to PSP                    │
│                                                  │
│  2. PSP generates attestation report             │
│     ├── Platform Security Processor signs report │
│     ├── Report contains:                         │
│     │   ├── Measurement (launch digest)          │
│     │   ├── Host data                            │
│     │   ├── Report data (guest-provided)         │
│     │   ├── VMPL (virtual machine privilege level)│
│     │   └── Report signature (ECDSA-P256)        │
│     └── Report is platform-attested evidence     │
│                                                  │
│  3. Report verified by relying party             │
│     ├── Verify PSP certificate chain             │
│     ├── Verify report signature                  │
│     └── Verify measurement against expected      │
│                                                  │
│  4. Report submitted to GovernanceAnchor         │
│     └── On-chain verification via verifier       │
└─────────────────────────────────────────────────┘
```

**SEV-SNP Attestation Properties:**

| Property | Description |
|----------|-------------|
| Measurement | SHA-384 of guest VM image at launch |
| HostData | 32 bytes provided by hypervisor at launch |
| ReportData | 64 bytes provided by guest (enclave state hash) |
| VMPL | Virtual Machine Privilege Level (0 = most privileged) |
| Policy | Security policy bits (debug, migration, etc.) |
| Signature | ECDSA-P256 over the report body |

### 2.3 AWS Nitro Enclave Attestation (PCA)

```
┌─────────────────────────────────────────────────┐
│            Nitro Enclave                          │
│                                                  │
│  1. Enclave generates attestation document       │
│     ├── Calls NSM: /attest/cbor                 │
│     ├── Document contains:                       │
│     │   ├── PCR0 (hash of enclave image)         │
│     │   ├── PCR1 (hash of Linux kernel + app)    │
│     │   ├── PCR2 (hash of application)           │
│     │   ├── PCR3 (hash of IAM role)              │
│     │   ├── User data (enclave state hash)       │
│     │   └── Nonce (challenge value)              │
│     └── Document signed by NSM private key       │
│                                                  │
│  2. Attestation document sent to AWS Nitro       │
│     Enclaves KMS                                 │
│     ├── KMS verifies NSM certificate chain       │
│     ├── KMS verifies PCRs against expected       │
│     └── KMS returns encrypted response           │
│                                                  │
│  3. Certificate-based attestation                │
│     ├── Private CA issues certificate based      │
│     │   on attestation document                  │
│     └── Certificate binds enclave identity       │
│                                                  │
│  4. Certificate submitted to GovernanceAnchor   │
│     └── On-chain verification via verifier       │
└─────────────────────────────────────────────────┘
```

**Nitro Attestation Properties:**

| Property | Description |
|----------|-------------|
| PCR0 | Hash of the enclave image (EIF) |
| PCR1 | Hash of the Linux kernel and bootstrap |
| PCR2 | Hash of the application code |
| PCR3 | Hash of the IAM role |
| Nonce | Challenge value for freshness |
| Document | CBOR-encoded, signed by NSM |

---

## 3. Runtime Isolation

### 3.1 Memory Encryption

| Platform | Encryption Mechanism | Key Source | Scope |
|----------|---------------------|------------|-------|
| AMD SEV-SNP | AES-128 per-VM key (VMK) | AMD PSP | Full VM memory |
| Intel SGX | AES-128-XTS per-page (MEE) | Intel CPU | EPC pages only |
| AWS Nitro | AES-256 per-enclave | Nitro Security Module | Full enclave memory |

All three platforms encrypt enclave memory using hardware-derived keys. The encryption keys are generated and managed entirely within the hardware security boundary. The host OS, hypervisor, and other tenants cannot access enclave memory in plaintext.

### 3.2 Secure Key Storage

```
┌──────────────────────────────────────────────────────┐
│                    Key Hierarchy                       │
│                                                       │
│  Root Key (RK)                                        │
│  ├── Hardware-derived, per-platform                   │
│  ├── Never exported from security boundary            │
│  └── Used to derive:                                  │
│       │                                               │
│       ├── VMK (AMD) / EPK (Intel) / NSM Key (AWS)    │
│       │   └── Memory encryption key                   │
│       │                                               │
│       ├── Attestation Key                             │
│       │   └── Signs platform attestation reports      │
│       │                                               │
│       └── TEE_ENCLAVE_PRIVATE_KEY_PEM (derived)       │
│           └── Application-level signing key            │
│               ├── HKDF-SHA256(RK, "signing", info)   │
│               ├── HKDF-SHA256(RK, "encryption", info)│
│               └── HKDF-SHA256(RK, "attestation", info)│
└──────────────────────────────────────────────────────┘
```

### 3.3 Attestation Verification

Runtime attestation verification ensures that the enclave is running genuine, unmodified code. Verification is performed at two levels:

**Level 1 — Platform Verification:**
- Verify the platform attestation report signature (SGX QE, SEV PSP, Nitro NSM)
- Verify the certificate chain to the platform vendor's root of trust
- Verify the measurement (MRENCLAVE / launch digest / PCR0) against the expected value
- Verify the report data matches the current enclave state hash

**Level 2 — Application Verification:**
- Verify the `TEE_ENCLAVE_PRIVATE_KEY_PEM` was derived from a valid attestation root
- Verify the HKDF derivation used correct domain separation strings
- Verify the derived signing key matches the key used to sign evidence ledger entries
- Verify the attestation timestamp is within acceptable bounds (no replay)

---

## 4. Key Binding

### 4.1 SafeKrypte TEE Integration

SafeKrypte binds to TEE hardware through a Hierarchical Key Derivation Function (HKDF) chain that links the application-level signing key to the hardware attestation root.

**Binding Flow:**

```
Hardware Root Key (platform-specific)
    │
    ├── HKDF-SHA256 Extract
    │   ├── IKM = Hardware Root Key
    │   ├── Salt = Platform-specific salt
    │   └── PRK = Pseudo-Random Key
    │
    └── HKDF-SHA256 Expand
        ├── PRK = Pseudo-Random Key
        ├── Info = "safekrypte-tee-binding-v1"
        └── L = 32 bytes
            │
            └── TEE Binding Key (TBK)
                │
                ├── TBK → Evidence Ledger Signing Key
                ├── TBK → Enclave Communication Key
                └── TBK → Threshold Share Encryption Key
```

**Key Binding Properties:**

| Property | Description |
|----------|-------------|
| Hardware-Bound | TBK cannot be derived without access to hardware root key |
| Domain-Separated | Different info strings produce different derived keys |
| Forward-Secure | Compromise of derived key does not expose root key |
| Attestation-Linked | TBK derivation is only possible after valid attestation |

### 4.2 Binding Verification Protocol

```
1. Enclave generates attestation report
2. Attestation report includes measurement of:
   ├── Enclave code (MRENCLAVE / PCR0)
   ├── Enclave configuration
   └── Derived key metadata
3. Relying party verifies attestation report
4. Relying party computes expected TBK from:
   ├── Verified hardware root key
   ├── Platform-specific salt
   └── Domain separation string
5. Relying party confirms TBK matches enclave's claimed key
6. Binding confirmed: enclave code is verified AND keys are derived from verified hardware
```

---

## 5. Verification Protocol

### 5.1 Challenge-Response Flow

```
┌──────────────┐                    ┌──────────────┐
│  Verifier    │                    │   Enclave    │
│              │                    │              │
│  1. Generate │──── Challenge ────>│  2. Receive  │
│     nonce    │     (random)       │     nonce    │
│              │                    │              │
│  3. Enclave  │                    │  4. Generate │
│     signs    │<──── Response ─────│     response │
│     nonce    │  (signed nonce +  │     sign with│
│              │   attestation)    │     TBK       │
│              │                    │              │
│  5. Verify   │                    │              │
│     signature│                    │              │
│              │                    │              │
│  6. Verify   │                    │              │
│     attestation                  │              │
│     report   │                    │              │
│              │                    │              │
│  7. Confirm  │──── Success ──────>│  8. Continue │
│     binding  │     or Fail        │     runtime  │
└──────────────┘                    └──────────────┘
```

### 5.2 Challenge Parameters

| Parameter | Value |
|-----------|-------|
| Challenge Length | 32 bytes (cryptographically random) |
| Challenge Freshness | 60 seconds (max age) |
| Response Format | `sign(TBK, challenge \|\| attestation_report_hash)` |
| Attestation Report Max Age | 300 seconds |
| Replay Window | Single-use (challenge consumed after verification) |

### 5.3 Verification Decision

| Outcome | Action |
|---------|--------|
| Challenge expired | REJECT — replay risk |
| Attestation report invalid | REJECT — platform compromise |
| Attestation report stale | REJECT — state may have changed |
| Signature invalid | REJECT — key binding failure |
| Measurement mismatch | REJECT — code integrity failure |
| All checks pass | ACCEPT — enclave verified |

---

## 6. Fail-Closed Behavior

### 6.1 Attestation Failure Response

When TEE attestation fails, the system enforces fail-closed behavior. No operation proceeds without verified attestation.

```
Attestation Failure
    │
    ├── IMMEDIATE: Halt all enclave operations
    │   ├── Stop processing incoming requests
    │   ├── Flush in-flight operations (graceful drain)
    │   └── Zeroize all key material in enclave memory
    │
    ├── EVIDENCE: Record failure in evidence ledger
    │   ├── Timestamp of failure
    │   ├── Attestation report (if available)
    │   ├── Failure reason code
    │   └── Platform identification
    │
    ├── ALERT: Notify governance layer
    │   ├── CircuitBreaker transition to HALT state
    │   ├── Oracle notification to `0xdA74438a8FBB0A5B71387dBd8e61d610b988D324`
    │   └── GovernanceAnchor receives rollback signal
    │
    └── RECOVERY: Requires manual intervention
        ├── Investigate root cause
        ├── Repair or replace hardware
        ├── Re-provision enclave with fresh attestation
        └── Re-run MPC ceremony if key material compromised
```

### 6.2 Fail-Closed Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| No unverified operations | Attestation check before every key use |
| No key material leakage | Zeroization on attestation failure |
| No silent failure | Evidence ledger entry + circuit breaker transition |
| No partial trust | Binary decision: fully verified or fully rejected |
| No stale attestation | Timestamp-based freshness checks |

### 6.3 CircuitBreaker Integration

The CircuitBreaker contract at `0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A` (Polygon Amoy) monitors attestation status:

| Attestation State | CircuitBreaker State | Effect |
|-------------------|---------------------|--------|
| All platforms verified | CLOSED | Normal operations |
| One platform fails | OPEN | Halt affected operations |
| All platforms fail | HALT | Full system halt |
| Attestation stale | OPEN | Refresh attestation before proceeding |

---

## Appendix: Platform-Specific Configuration

### AMD SEV-SNP Configuration

| Parameter | Value |
|-----------|-------|
| Firmware Version | SEV-SNP capable (AMD PSP 1.5+) |
| Guest OS | Linux 5.19+ with SEV-SNP support |
| Kernel Config | `CONFIG_KVM_AMD_SEV=y`, `CONFIG_KVM_AMD_SEV_SNP=y` |
| PSP Device | `/dev/sev` |
| Attestation Report | `ioctl(/dev/sev, SEV_IOCTL_GET_ATTESTATION_REPORT, ...)` |
| Expected Measurement | Computed from enclave ELF binary |
| VMPL | 0 (most privileged, required for key access) |

### Intel SGX Configuration

| Parameter | Value |
|-----------|-------|
| CPU Support | SGX-capable processor with SGX1/SGX2 |
| BIOS Config | SGX enabled in BIOS |
| Driver | `/dev/sgx_enclave` (Intel SGX driver) |
| SDK | Intel SGX SDK 2.17+ or Gramine 1.5+ |
| QE | Intel SGX QE (Quote Enclave) |
| Quote Format | SGX Quote v3 (ECDSA-256-with-P-256) |
| Expected MRENCLAVE | SHA-256 of enclave measurement |
| Expected MRSIGNER | SHA-256 of signer public key |

### AWS Nitro Enclave Configuration

| Parameter | Value |
|-----------|-------|
| Instance Type | Nitro-enables instance (`.en` suffix, e.g., `m5.xlarge.en`) |
| Enclave Config | `--memory 1024 --cpu 2` |
| EIF Building | `nitro-cli build-enclave --docker-uri <image> --output-file <eif>` |
| NSM | `/dev/nsm` (Nitro Security Module device) |
| Attestation | `curl --unix-socket /dev/nsm -d '{"op":"attest"}'` |
| PCR0 | SHA-256 of EIF |
| PCR1 | SHA-256 of Linux kernel + bootstrap |
| PCR2 | SHA-256 of application |
| PCR3 | SHA-256 of IAM role |
| KMS Integration | AWS KMS `Decrypt` with `aws:NitroEnclave` condition |

### Cross-Platform Attestation Normalization

All platform-specific attestation reports are normalized to a common format before submission to the GovernanceAnchor contract:

```json
{
  "platform": "amd-sev-snp|intel-sgx|aws-nitro",
  "measurement": "hex-encoded measurement",
  "report_data": "hex-encoded report data",
  "timestamp": "ISO 8601 timestamp",
  "signature": "hex-encoded signature",
  "certificate_chain": "PEM-encoded certificate chain",
  "freshness": "unix timestamp of attestation generation",
  "nonce": "hex-encoded challenge nonce"
}
```

This normalization allows the GovernanceAnchor contract to verify attestation from any supported platform without platform-specific logic, maintaining the AIR Constitution's Separation of Concerns invariant.

---

*End of TEE Enclave Manifest*
