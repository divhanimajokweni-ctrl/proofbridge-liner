# Validator Bootstrap Procedure — VVU Earth Ledger

This document describes the process for bootstrapping a new validator node in the VVU Earth Ledger network.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Key Generation](#key-generation)
3. [Registration Process](#registration-process)
4. [Initial Quorum Setup](#initial-quorum-setup)
5. [Verification Steps](#verification-steps)
6. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)

---

## Prerequisites

Before bootstrapping a validator, ensure the following are in place:

### System Requirements

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB SSD | 100 GB NVMe |
| Network | 10 Mbps | 100 Mbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Software Requirements

- Python 3.11+
- OpenSSL 3.0+
- `production_ledger` package installed
- Access to the VVU Earth Ledger repository
- Network connectivity to existing validator nodes

### Access Requirements

- Valid organizational identity (verified by existing quorum)
- API endpoint for the ledger gRPC service
- CA certificate for TLS verification
- Bootstrap token (provided by an existing validator)

### Configuration Files

Ensure the following configuration files are available:

```bash
vvu-earth-ledger/
├── configs/
│   ├── production.toml    # Production ledger configuration
│   ├── tls.toml          # TLS settings
│   ├── metrics.toml      # Metrics configuration
│   └── logging.toml      # Logging configuration
├── certs/
│   ├── ca.crt            # CA certificate (from existing quorum)
│   ├── server.crt        # New server certificate (generated below)
│   ├── server.key        # New server private key (generated below)
│   ├── client.crt        # New client certificate (generated below)
│   └── client.key        # New client private key (generated below)
└── scripts/
    └── generate-certs.sh # Certificate generation script
```

---

## Key Generation

### Step 1: Generate Ed25519 Validator Key Pair

The Ed25519 key pair is used for signing facts, evidence envelopes, and participating in quorum consensus.

```bash
# Generate a new Ed25519 key pair
python -c "
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

key = Ed25519PrivateKey.generate()

# Save private key (KEEP SECURE)
with open('keys/validator_ed25519.key', 'wb') as f:
    f.write(key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ))

# Save public key (share with other validators)
with open('keys/validator_ed25519.pub', 'wb') as f:
    f.write(key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ))

print('Validator Ed25519 key pair generated.')
print('Public key fingerprint:')
import hashlib, base64
pub_bytes = key.public_key().public_bytes(
    encoding=serialization.Encoding.Raw,
    format=serialization.PublicFormat.Raw
)
print(base64.b64encode(hashlib.sha256(pub_bytes).digest()).decode()[:16])
"
```

Set appropriate permissions on the private key:
```bash
chmod 600 keys/validator_ed25519.key
chown vvu-ledger:vvu-ledger keys/validator_ed25519.key
```

### Step 2: Generate TLS Certificates

Generate TLS certificates for secure communication:

```bash
# Generate certificates signed by the existing CA
./scripts/generate-certs.sh --days 90 --output ./certs

# Verify the certificates
openssl verify -CAfile ./certs/ca.crt ./certs/server.crt
openssl verify -CAfile ./certs/ca.crt ./certs/client.crt
```

### Step 3: Record Key Fingerprints

Record the key fingerprints for verification during registration:

```bash
# Ed25519 public key fingerprint
python -c "
from cryptography.hazmat.primitives import serialization
with open('keys/validator_ed25519.pub', 'rb') as f:
    pub = serialization.load_pem_public_key(f.read())
pub_bytes = pub.public_bytes(
    encoding=serialization.Encoding.Raw,
    format=serialization.PublicFormat.Raw
)
import hashlib, base64
print('Ed25519 fingerprint:', base64.b64encode(hashlib.sha256(pub_bytes).digest()).decode()[:32])
"

# Server certificate fingerprint
openssl x509 -in ./certs/server.crt -noout -fingerprint -sha256
```

---

## Registration Process

### Step 1: Submit Registration Request

Submit a registration request to the existing quorum:

```bash
python -m production_ledger.cli validator register \
  --validator-id "VVU-VAL-$(openssl rand -hex 4 | tr '[:lower:]' '[:upper:]')" \
  --public-key keys/validator_ed25519.pub \
  --endpoint "vvu-earth-ledger.new-validator.svc.cluster.local:50051" \
  --tls-cert certs/server.crt \
  --bootstrap-token "$BOOTSTRAP_TOKEN"
```

### Step 2: Quorum Approval

The registration request must be approved by a quorum of existing validators (typically 2/3 + 1):

1. The registration request is broadcast to all existing validators
2. Each validator reviews the request and verifies:
   - The public key is valid and has a correct fingerprint
   - The TLS certificate is signed by the trusted CA
   - The endpoint is reachable
   - The organizational identity is verified
3. Each validator casts a vote (approve/reject)
4. Once the quorum threshold is reached, the registration is approved

### Step 3: Configuration Distribution

After approval, the new validator receives:

1. The current quorum configuration
2. The list of all active validators and their public keys
3. The current epoch number and ledger state
4. The genesis block hash

```bash
python -m production_ledger.cli validator sync-config \
  --endpoint "vvu-earth-ledger.existing-validator.svc.cluster.local:50051" \
  --tls-cert certs/client.crt \
  --tls-key certs/client.key \
  --ca-cert certs/ca.crt
```

### Step 4: Start the Validator Node

```bash
# Start the ledger service
python -m production_ledger.cli start \
  --config configs/production.toml \
  --validator-key keys/validator_ed25519.key \
  --tls-cert certs/server.crt \
  --tls-key certs/server.key

# Verify the service is running
curl -s http://localhost:3000/health | jq .
```

---

## Initial Quorum Setup

For the very first validator in a new network (genesis validator):

### Step 1: Initialize the Ledger

```bash
python -m production_ledger.cli init \
  --genesis-validator-id "VVU-VAL-0001" \
  --public-key keys/validator_ed25519.pub \
  --quorum-threshold 1 \
  --output ./data/ledger
```

### Step 2: Create the Genesis Block

```bash
python -m production_ledger.cli genesis \
  --validator-id "VVU-VAL-0001" \
  --validator-key keys/validator_ed25519.key \
  --config configs/production.toml
```

### Step 3: Add Subsequent Validators

For each additional validator, repeat the [Registration Process](#registration-process) above. The quorum threshold should be updated as validators are added:

| Validators | Quorum Threshold (2/3 + 1) |
|-----------|---------------------------|
| 1 | 1 |
| 3 | 2 |
| 5 | 4 |
| 7 | 5 |
| 10 | 7 |

### Step 4: Finalize the Quorum

Once all initial validators are registered:

```bash
python -m production_ledger.cli quorum finalize \
  --quorum-threshold <CALCULATED_THRESHOLD>
```

---

## Verification Steps

After bootstrapping, verify the following:

### 1. Service Health

```bash
# Health check
curl -s http://localhost:3000/health | jq .

# Readiness check
curl -s http://localhost:3000/ready | jq .

# Liveness check
curl -s http://localhost:3000/live | jq .
```

### 2. TLS Connectivity

```bash
# Verify TLS handshake with another validator
openssl s_client -connect other-validator:50051 \
  -cert certs/client.crt \
  -key certs/client.key \
  -CAfile certs/ca.crt < /dev/null 2>/dev/null | grep "Verify return code"

# Expected: "Verify return code: 0 (ok)"
```

### 3. Key Verification

```bash
# Verify the validator key is registered
python -m production_ledger.cli validator list-keys --validator-id <VALIDATOR_ID>

# Verify the key can sign a test fact
python -m production_ledger.cli test sign \
  --validator-key keys/validator_ed25519.key \
  --payload '{"test": "bootstrap"}'
```

### 4. Quorum Participation

```bash
# Verify quorum status
python -m production_ledger.cli quorum status

# Verify all validators are participating
python -m production_ledger.cli quorum validators --show-status

# Submit a test fact through the full pipeline
python -m production_ledger.cli test submit-fact --payload '{"test": "bootstrap"}'
```

### 5. Metrics and Logging

```bash
# Verify Prometheus metrics are being exported
curl -s http://localhost:9090/metrics | head -20

# Verify structured logging is working
journalctl -u vvu-earth-ledger --since "5 minutes ago" | tail -5

# Verify OpenTelemetry traces are being exported
# Check the OTLP endpoint for recent traces
```

---

## Common Issues and Troubleshooting

### Issue: TLS Handshake Failure

**Symptoms**: `connection refused`, `certificate verify failed`, `handshake failure`

**Causes and Solutions**:

| Cause | Solution |
|-------|----------|
| Server certificate not signed by the trusted CA | Re-generate certificates using `generate-certs.sh` with the correct CA |
| SAN mismatch (wrong hostname/IP) | Re-generate server certificate with correct SAN entries |
| Expired certificate | Re-generate certificates with a valid date range |
| Client certificate not trusted | Ensure the client certificate is signed by the CA that the server trusts |

### Issue: Quorum Registration Rejected

**Symptoms**: Registration request is not approved, timeout waiting for votes

**Causes and Solutions**:

| Cause | Solution |
|-------|----------|
| Invalid bootstrap token | Request a new bootstrap token from an existing validator |
| Public key format mismatch | Ensure the public key is in PEM format and is a valid Ed25519 key |
| Endpoint unreachable | Verify the endpoint is accessible from existing validators |
| Organizational identity not verified | Complete the identity verification process |

### Issue: Validator Not Participating in Consensus

**Symptoms**: Validator is registered but not voting, quorum threshold not met

**Causes and Solutions**:

| Cause | Solution |
|-------|----------|
| Network partition | Check network connectivity to other validators |
| Configuration mismatch | Verify `production.toml` matches the quorum configuration |
| Epoch mismatch | Re-sync the ledger state from another validator |
| Key mismatch | Verify the Ed25519 key matches the registered public key |

### Issue: Ledger State Divergence

**Symptoms**: Validator's ledger state differs from the quorum, replay failures

**Causes and Solutions**:

| Cause | Solution |
|-------|----------|
| Missed events | Re-sync from the latest snapshot and replay missing events |
| Conflicting facts | Run the merge reconciliation protocol |
| Corrupted storage | Restore from the latest backup and re-sync |
| Clock skew | Synchronize system time using NTP |

### Issue: High Memory Usage

**Symptoms**: OOM kills, slow response times, increasing memory footprint

**Causes and Solutions**:

| Cause | Solution |
|-------|----------|
| Large MMR tree | Enable periodic snapshots and pruning |
| Unbounded log buffer | Check log rotation configuration in `logging.toml` |
| Memory leak in replay engine | Restart the service and report the issue |

---

## References

- [Key Rotation Guide](./KeyRotation.md)
- [Observability Stack](./Observability.md)
- [generate-certs.sh](../scripts/generate-certs.sh)
- [ADR-002: Ed25519 Signatures](./governance/adrs/ADR-002-ed25519-signatures.md)
- [Architecture Documentation](../vvu-earth-ledger/docs/architecture.md)
