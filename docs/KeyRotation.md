# Key Rotation Guide — VVU Earth Ledger

This document describes procedures for rotating cryptographic keys and TLS certificates in the VVU Earth Ledger system.

---

## Table of Contents

1. [When to Rotate Keys](#when-to-rotate-keys)
2. [Rotating Ed25519 Keys](#rotating-ed25519-keys)
3. [Rotating TLS Certificates](#rotating-tls-certificates)
4. [Rotating Validator Keys](#rotating-validator-keys)
5. [Rollback Procedure](#rollback-procedure)
6. [Verification Steps](#verification-steps)

---

## When to Rotate Keys

### Scheduled Rotation

| Key Type | Rotation Interval | Rationale |
|----------|-------------------|-----------|
| Ed25519 signing keys | 90 days | Limit exposure window for compromised keys |
| TLS server certificates | 90 days | Industry best practice; aligns with Let's Encrypt |
| TLS client certificates | 90 days | mTLS requires both sides to rotate |
| CA certificate | 5 years | Long-lived; rotation requires chain re-issuance |
| Validator keys | On validator change | When a validator joins or leaves the quorum |

### Emergency Rotation

Rotate keys immediately if any of the following occur:

- **Key compromise**: A private key is suspected or confirmed to be exposed
- **Validator change**: A validator is added or removed from the quorum
- **Incident response**: Any security incident that may have involved key material
- **Compliance mandate**: Audit findings or regulatory requirements
- **Certificate expiry**: Certificate is within 30 days of expiry

---

## Rotating Ed25519 Keys

Ed25519 keys are used for signing facts, evidence envelopes, and proofs in the ledger.

### Procedure

1. **Generate a new key pair**:
   ```bash
   python -c "
   from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
   key = Ed25519PrivateKey.generate()
   # Save private key
   with open('keys/new_ed25519.key', 'wb') as f:
       from cryptography.hazmat.primitives.serialization import PrivateKeySerialization
       f.write(key.private_bytes(
           encoding=serialization.Encoding.PEM,
           format=serialization.PrivateFormat.PKCS8,
           encryption_algorithm=serialization.NoEncryption()
       ))
   # Save public key
   with open('keys/new_ed25519.pub', 'wb') as f:
       f.write(key.public_key().public_bytes(
           encoding=serialization.Encoding.PEM,
           format=serialization.PublicFormat.SubjectPublicKeyInfo
       ))
   print('New Ed25519 key pair generated.')
   "
   ```

2. **Register the new public key** with the validator registry:
   ```bash
   # Update the validator registry with the new public key
   # The old key remains active until all pending facts are signed
   python -m production_ledger.cli validator register-key \
     --validator-id <VALIDATOR_ID> \
     --public-key keys/new_ed25519.pub \
     --key-type ed25519
   ```

3. **Transition period**: Keep both old and new keys active for one epoch (typically 24 hours). During this period:
   - New facts are signed with the new key
   - Old facts already signed with the old key remain valid
   - The old key is marked as "rotating" in the registry

4. **Retire the old key** after the transition period:
   ```bash
   python -m production_ledger.cli validator retire-key \
     --validator-id <VALIDATOR_ID> \
     --public-key keys/old_ed25519.pub
   ```

5. **Securely delete the old private key**:
   ```bash
   shred -vfz -n 3 keys/old_ed25519.key
   rm keys/old_ed25519.key
   ```

---

## Rotating TLS Certificates

TLS certificates protect gRPC and HTTP communication between ledger nodes and clients.

### Procedure

1. **Generate new certificates** using the existing CA:
   ```bash
   ./scripts/generate-certs.sh --days 90 --output ./certs-new
   ```

2. **Verify the new certificates**:
   ```bash
   openssl verify -CAfile ./certs-new/ca.crt ./certs-new/server.crt
   openssl verify -CAfile ./certs-new/ca.crt ./certs-new/client.crt
   ```

3. **Deploy new certificates** (zero-downtime rollout):
   ```bash
   # Step 1: Copy new certs alongside existing ones
   cp ./certs-new/server.crt ./certs/server.crt.new
   cp ./certs-new/server.key ./certs/server.key.new
   cp ./certs-new/client.crt ./certs/client.crt.new
   cp ./certs-new/client.key ./certs/client.key.new

   # Step 2: Atomic swap
   mv ./certs/server.crt ./certs/server.crt.old
   mv ./certs/server.crt.new ./certs/server.crt
   mv ./certs/server.key ./certs/server.key.old
   mv ./certs/server.key.new ./certs/server.key

   # Step 3: Restart the ledger service
   systemctl restart vvu-earth-ledger

   # Step 4: Verify service is healthy
   curl -s http://localhost:3000/health | jq .
   ```

4. **Clean up old certificates** after verification:
   ```bash
   rm ./certs/server.crt.old ./certs/server.key.old
   ```

### CA Rotation

When rotating the CA certificate itself:

1. Generate a new CA certificate
2. Issue new server and client certificates signed by the new CA
3. Add the new CA to all trust stores (while keeping the old CA)
4. Deploy new leaf certificates
5. Verify all connections work with the new CA
6. Remove the old CA from trust stores

---

## Rotating Validator Keys

Validator keys are used for quorum participation and consensus voting.

### When a Validator Joins

1. The new validator generates an Ed25519 key pair
2. The public key is submitted to the validator registry
3. The quorum configuration is updated to include the new validator
4. The quorum threshold is recalculated (typically 2/3 + 1 of validators)
5. All existing validators acknowledge the new configuration
6. The new validator begins participating in the next epoch

### When a Validator Leaves

1. The departing validator is marked as "leaving" in the registry
2. The quorum configuration is updated to exclude the departing validator
3. The quorum threshold is recalculated
4. All remaining validators acknowledge the new configuration
5. The departing validator's key is retired after the transition period
6. Any pending operations from the departing validator are completed

### Emergency Validator Removal

If a validator is compromised or malicious:

1. Immediately remove the validator from the quorum configuration
2. Recalculate the quorum threshold
3. Force a new epoch with the updated configuration
4. Invalidate any pending operations signed by the removed validator
5. Re-sign any critical facts that relied on the removed validator's signature
6. Conduct a full audit of all operations since the compromise window

---

## Rollback Procedure

If a key rotation fails or causes issues, follow these steps to roll back:

### Ed25519 Key Rollback

1. **Keep the old key pair** in a secure location during the transition period
2. If the new key fails, reactivate the old key in the validator registry:
   ```bash
   python -m production_ledger.cli validator activate-key \
     --validator-id <VALIDATOR_ID> \
     --public-key keys/old_ed25519.pub
   ```
3. Mark the new key as "failed" in the registry
4. Investigate the root cause of the failure
5. Generate a replacement key pair and retry the rotation

### TLS Certificate Rollback

1. **Keep old certificate files** with `.old` suffix during deployment
2. If the new certificates cause connection failures:
   ```bash
   # Restore old certificates
   mv ./certs/server.crt ./certs/server.crt.failed
   mv ./certs/server.crt.old ./certs/server.crt
   mv ./certs/server.key ./certs/server.key.failed
   mv ./certs/server.key.old ./certs/server.key

   # Restart the service
   systemctl restart vvu-earth-ledger
   ```
3. Verify the service is healthy with the old certificates
4. Investigate the certificate issue (common causes: SAN mismatch, CA chain, expiry)

### Validator Key Rollback

1. If a new validator cannot join properly, revert the quorum configuration
2. If a validator was incorrectly removed, re-add it with the same key
3. Force a new epoch with the reverted configuration
4. Verify all validators are participating correctly

---

## Verification Steps

After any key rotation, verify the following:

### Ed25519 Key Verification

```bash
# Verify the new key is registered
python -m production_ledger.cli validator list-keys --validator-id <VALIDATOR_ID>

# Verify new facts are being signed with the new key
python -m production_ledger.cli audit recent-signatures --limit 10

# Verify the old key is no longer active
python -m production_ledger.cli validator list-keys --validator-id <VALIDATOR_ID> --show-inactive
```

### TLS Certificate Verification

```bash
# Verify server certificate is valid
openssl s_client -connect localhost:50051 -showcerts < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject

# Verify mTLS handshake
openssl s_client -connect localhost:50051 \
  -cert ./certs/client.crt \
  -key ./certs/client.key \
  -CAfile ./certs/ca.crt < /dev/null 2>/dev/null | grep "Verify return code"

# Verify Prometheus metrics endpoint
curl -sk https://localhost:9090/metrics | head -5

# Verify health check
curl -s http://localhost:3000/health | jq .
```

### Validator Quorum Verification

```bash
# Verify quorum configuration
python -m production_ledger.cli quorum status

# Verify all validators are participating
python -m production_ledger.cli quorum validators --show-status

# Run a test fact through the full pipeline
python -m production_ledger.cli test submit-fact --payload '{"test": "rotation"}'
```

### Monitoring After Rotation

Monitor the following metrics for 24 hours after rotation:

- `append_count` — should continue incrementing normally
- `proof_generation_time` — should not spike
- `replay_duration` — should remain stable
- TLS handshake errors — should be zero
- Validator participation rate — should be 100%
- Log entries with `key_rotation` tag — should show successful rotation

---

## References

- [ADR-002: Ed25519 Signatures](./governance/adrs/ADR-002-ed25519-signatures.md)
- [generate-certs.sh](../scripts/generate-certs.sh)
- [Validator Bootstrap](./ValidatorBootstrap.md)
- [Observability Stack](./Observability.md)
