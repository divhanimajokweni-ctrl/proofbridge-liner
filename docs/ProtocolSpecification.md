# VVU Earth Tech Ledger — Protocol Specification

## 1. Introduction

This document specifies the wire protocol for the VVU Earth Tech Ledger, including the canonical serialization format, versioned envelopes, receipt format, gRPC service definitions, TLS 1.3 mTLS requirements, rate limiting, and error codes.

## 2. Canonical Serialization Format

### 2.1 Overview

The canonical serializer produces a deterministic binary encoding from Python objects. The same Python object always produces the same byte sequence.

### 2.2 Version Header

Every encoded stream starts with a 4-byte version header:

```
VVU\x01
```

Bytes: `56 56 55 01`

### 2.3 Type Tags

Each value is encoded as:

```
type_tag (1 byte) + length_or_count (4 bytes, big-endian) + data
```

| Tag | Type | Data Layout |
|-----|------|-------------|
| 0x00 | None | (no length, no data) |
| 0x01 | True | (no length, no data) |
| 0x02 | False | (no length, no data) |
| 0x03 | int | sign (1B) + magnitude (minimal big-endian) |
| 0x04 | bytes | raw bytes |
| 0x05 | str | UTF-8 encoded bytes |
| 0x06 | list | element_count (4B) + encoded elements |
| 0x07 | dict | pair_count (4B) + sorted key-value pairs |

### 2.4 Integer Encoding

Integer encoding uses sign-magnitude:

- **Zero**: `0x00` (sign byte only, no magnitude bytes)
- **Positive**: `0x00` + magnitude (minimal big-endian)
- **Negative**: `0x01` + magnitude (minimal big-endian)

The magnitude uses the minimum number of bytes (no leading zeros).

### 2.5 Dictionary Ordering

Dictionary keys are sorted by their UTF-8 byte representation for determinism. This ensures that the same dictionary produces the same byte sequence regardless of insertion order.

### 2.6 Limits

| Parameter | Value | Description |
|-----------|-------|-------------|
| `MAX_DEPTH` | 64 | Maximum nesting depth |
| `MAX_OBJECT_SIZE` | 16 MiB | Maximum encoded size of a single object |
| `MAX_INT_WIDTH` | 256 bytes | Maximum byte-width of an integer value |
| `MAX_STRING_LENGTH` | 2 MiB | Maximum length of a string value in bytes |

### 2.7 Streaming Support

The serializer supports streaming encoding and decoding:

```python
canonical_encode_stream(obj, stream)
canonical_decode_stream(stream)
```

## 3. Versioned Envelopes

### 3.1 Envelope Structure

Each ledger entry is wrapped in an `Envelope`:

| Field | Type | Description |
|-------|------|-------------|
| `sequence` | int | Monotonically increasing sequence number |
| `parent_hash` | bytes (32) | Hash of the previous entry's envelope |
| `payload` | bytes | Raw data bytes |
| `payload_hash` | bytes (32) | SHA-256 of payload under DOMAIN_PAYLOAD |
| `envelope_hash` | bytes (32) | SHA-256 of envelope pre-image under DOMAIN_ENVELOPE |
| `revision_hash` | bytes (32) | SHA-256 of (payload_hash + envelope_hash) under DOMAIN_REVISION |
| `signature` | Signature | Ed25519 signature with key metadata |
| `key_id` | bytes (4) | 4-byte key identifier of the signing key |
| `key_version` | int | Version number of the signing key |
| `timestamp` | float | Creation timestamp (POSIX epoch seconds) |

### 3.2 Envelope Pre-Image

The envelope pre-image is the canonical encoding of:

```python
{
    "sequence": int,
    "parent_hash": bytes (32),
    "payload_hash": bytes (32),
    "timestamp": bytes (8)  # 8-byte big-endian IEEE 754 double
}
```

The timestamp is encoded as an 8-byte big-endian IEEE 754 double because the canonical serializer does not support floats.

### 3.3 Hash Chain Construction

```
payload_hash  = domain_hash(VVU:PAYLOAD:1:, payload)
pre_image     = canonical_encode({sequence, parent_hash, payload_hash, timestamp})
envelope_hash = domain_hash(VVU:ENVELOPE:1:, pre_image)
revision_hash = domain_hash(VVU:REVISION:1:, payload_hash + envelope_hash)
```

### 3.4 Signature Domain

The signature is computed over the `revision_hash` with domain `VVU:REVISION:1:`:

```
prehash = domain_hash(VVU:REVISION:1:, revision_hash)
signature = Ed25519.sign(prehash)
```

## 4. Receipt Format

### 4.1 Receipt Structure

A receipt combines an envelope, MMR inclusion proof, and quorum result:

| Field | Type | Description |
|-------|------|-------------|
| `sequence` | int | Sequence number of the entry |
| `envelope` | Envelope | The complete envelope |
| `mmr_proof` | MMRProof | MMR inclusion proof |
| `mmr_root` | bytes (32) | MMR root at the time of receipt |
| `quorum_result` | QuorumResult or None | Quorum result (if quorum was checked) |
| `timestamp` | float | Receipt generation timestamp |

### 4.2 Receipt Verification

A receipt is verified by:

1. **Payload hash verification**: `hash_payload(envelope.payload) == envelope.payload_hash`
2. **MMR inclusion proof verification**: The proof verifies against the MMR root
3. **Quorum verification**: If a quorum result is present and validators are registered, quorum must have been achieved

## 5. REST API Specification

### 5.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/stats` | Ledger statistics |
| GET | `/entry/{seq}` | Get entry by sequence number |
| POST | `/append` | Append new entry |
| GET | `/proof/{seq}` | Get MMR inclusion proof |
| GET | `/receipt/{seq}` | Get receipt (entry + proof) |
| POST | `/verify` | Verify the chain |
| POST | `/replay` | Trigger replay verification |
| GET | `/validators` | List validators |
| GET | `/metrics` | Prometheus metrics |
| GET | `/snapshots` | List snapshots |
| POST | `/snapshot` | Create snapshot |

### 5.2 Append Request

```json
{
    "payload": "<base64-encoded bytes>",
    "signatures": [
        {
            "key_id": "<hex-encoded 4 bytes>",
            "key_version": 1,
            "signature": "<base64-encoded 64 bytes>",
            "timestamp": 1234567890.0
        }
    ]
}
```

### 5.3 Append Response

```json
{
    "sequence": 1,
    "parent_hash": "<hex-encoded 32 bytes>",
    "payload": "<base64-encoded bytes>",
    "payload_hash": "<hex-encoded 32 bytes>",
    "envelope_hash": "<hex-encoded 32 bytes>",
    "revision_hash": "<hex-encoded 32 bytes>",
    "key_id": "<hex-encoded 4 bytes>",
    "key_version": 1,
    "timestamp": 1234567890.0,
    "signature": {
        "key_id": "<hex-encoded 4 bytes>",
        "key_version": 1,
        "signature": "<base64-encoded 64 bytes>",
        "timestamp": 1234567890.0
    }
}
```

### 5.4 Binary Data Encoding

All binary data in JSON API responses is encoded as:

- **Hashes**: Hex-encoded (lowercase)
- **Payloads**: Base64-encoded
- **Signatures**: Base64-encoded
- **Key IDs**: Hex-encoded (lowercase)

## 6. gRPC Service Definitions (Future)

### 6.1 LedgerService

```protobuf
syntax = "proto3";

package vvu.ledger;

service LedgerService {
    rpc Append(AppendRequest) returns (AppendResponse);
    rpc GetEntry(GetEntryRequest) returns (Envelope);
    rpc GetProof(GetProofRequest) returns (InclusionProof);
    rpc GetReceipt(GetReceiptRequest) returns (Receipt);
    rpc VerifyChain(VerifyChainRequest) returns (VerifyChainResponse);
    rpc Replay(ReplayRequest) returns (stream ReplayStatus);
    rpc GetStats(GetStatsRequest) returns (Stats);
    rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}
```

### 6.2 Message Definitions

```protobuf
message AppendRequest {
    bytes payload = 1;
    repeated ValidatorSignature signatures = 2;
}

message AppendResponse {
    Envelope envelope = 1;
}

message Envelope {
    int64 sequence = 1;
    bytes parent_hash = 2;
    bytes payload = 3;
    bytes payload_hash = 4;
    bytes envelope_hash = 5;
    bytes revision_hash = 6;
    ValidatorSignature signature = 7;
    bytes key_id = 8;
    int32 key_version = 9;
    double timestamp = 10;
}

message ValidatorSignature {
    bytes key_id = 1;
    int32 key_version = 2;
    bytes signature = 3;
    double timestamp = 4;
}

message InclusionProof {
    int32 leaf_position = 1;
    bytes leaf_hash = 2;
    repeated PathEntry path = 3;
    repeated PeakEntry peaks = 4;
    int32 mmr_size = 5;
}

message Receipt {
    int64 sequence = 1;
    Envelope envelope = 2;
    InclusionProof proof = 3;
    bytes mmr_root = 4;
    QuorumResult quorum_result = 5;
    double timestamp = 6;
}
```

## 7. TLS 1.3 mTLS Requirements

### 7.1 TLS Configuration

| Parameter | Requirement |
|-----------|-------------|
| TLS version | 1.3 minimum |
| Certificate type | X.509 v3 |
| Key type | ECDSA P-256 or Ed25519 |
| Cipher suites | TLS_AES_256_GCM_SHA384, TLS_AES_128_GCM_SHA256 |
| Certificate validation | Full chain verification |

### 7.2 mTLS Configuration

For mutual TLS (mTLS):

| Parameter | Requirement |
|-----------|-------------|
| Client certificates | Required |
| CA certificate | Must be specified (`ca_path`) |
| Server certificate | Must be specified (`cert_path`) |
| Server private key | Must be specified (`key_path`) |
| Certificate rotation | Must be supported without downtime |

### 7.3 Configuration

```toml
[network]
tls_enabled = true
mtls_enabled = true
cert_path = "/etc/ledger/certs/server.crt"
key_path = "/etc/ledger/certs/server.key"
ca_path = "/etc/ledger/certs/ca.crt"
```

## 8. Rate Limiting

### 8.1 Rate Limit Strategy

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| POST /append | 100 requests/second | Per client IP |
| POST /verify | 50 requests/second | Per client IP |
| POST /replay | 10 requests/second | Per client IP |
| GET /entry/* | 1000 requests/second | Per client IP |
| GET /proof/* | 500 requests/second | Per client IP |
| GET /receipt/* | 500 requests/second | Per client IP |
| GET /metrics | 10 requests/second | Per client IP |
| GET /health | Unlimited | — |

### 8.2 Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### 8.3 Rate Limit Response

When rate limited:

```json
{
    "error": "rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 30
}
```

HTTP status code: 429 Too Many Requests

## 9. Error Codes

### 9.1 Error Response Format

```json
{
    "error": "human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "detail": {
        "key": "value"
    }
}
```

### 9.2 Error Code Registry

| Category | Code | HTTP Status | Description |
|----------|------|-------------|-------------|
| **Serialization** | | | |
| | `SERIALIZATION_UNKNOWN_TAG` | 400 | Unknown type tag in binary data |
| | `SERIALIZATION_INVALID_HEADER` | 400 | Invalid version header |
| | `SERIALIZATION_DATA_TOO_SHORT` | 400 | Data too short for header |
| | `SERIALIZATION_TRAILING_DATA` | 400 | Trailing data after decoded value |
| | `SERIALIZATION_INT_WIDTH_EXCEEDED` | 400 | Integer width exceeds maximum |
| | `SERIALIZATION_STRING_LENGTH_EXCEEDED` | 400 | String length exceeds maximum |
| | `SERIALIZATION_NEGATIVE_ZERO` | 400 | Negative zero is not representable |
| | `SERIALIZATION_DECODE_INT_EMPTY` | 400 | Empty integer data |
| | `SERIALIZATION_INVALID_INT_SIGN` | 400 | Invalid integer sign byte |
| | `SERIALIZATION_UNEXPECTED_EOF` | 400 | Unexpected end of data |
| | `SERIALIZATION_DICT_KEY_NOT_STRING` | 400 | Dictionary key must be a string |
| **Hashing** | | | |
| | `HASH_DOMAIN_VIOLATION` | 400 | Empty domain prefix |
| | `HASH_INVALID_INPUT` | 400 | Invalid input type |
| | `HASH_MMR_PEAK_SIZE` | 400 | MMR peak has wrong size |
| **Cryptography** | | | |
| | `SIGNATURE_EMPTY_DOMAIN` | 400 | Domain prefix must not be empty |
| | `SIGNATURE_SIGN_FAILED` | 500 | Failed to sign message |
| | `SIGNATURE_VERIFY_FAILED` | 500 | Failed to verify signature |
| | `SIGNATURE_KEY_ALREADY_REVOKED` | 400 | Key is already revoked |
| | `CRYPTO_SIGN_FAILED` | 500 | Crypto engine sign failed |
| | `CRYPTO_VERIFY_FAILED` | 500 | Crypto engine verify failed |
| | `CRYPTO_KEY_ROTATION_FAILED` | 500 | Key rotation failed |
| | `CRYPTO_NO_ACTIVE_KEY` | 500 | No active signing key |
| **Database** | | | |
| | `DATABASE_NOT_OPEN` | 500 | Database connection is not open |
| | `DATABASE_OPERATIONAL_ERROR` | 500 | SQLite operational error |
| | `DATABASE_INTEGRITY_ERROR` | 400 | SQLite integrity constraint violation |
| | `DATABASE_COMMIT_ERROR` | 500 | Commit failed |
| | `DATABASE_ROLLBACK_ERROR` | 500 | Rollback failed |
| | `DATABASE_PRAGMA_FAILED` | 500 | Failed to apply PRAGMA |
| | `DATABASE_VACUUM_ERROR` | 500 | VACUUM failed |
| | `DATABASE_CHECKPOINT_ERROR` | 500 | WAL checkpoint failed |
| | `DATABASE_EXECUTEMANY_ERROR` | 500 | executemany failed |
| | `DATABASE_EXECUTESCRIPT_ERROR` | 500 | executescript failed |
| **Ledger** | | | |
| | `LEDGER_SEQUENCE_OUT_OF_RANGE` | 400 | Sequence number out of range |
| | `LEDGER_NOT_OPEN` | 500 | Ledger is not open |
| | `PROOF_ENTRY_NOT_FOUND` | 404 | Entry not found |
| | `PROOF_SEQUENCE_OUT_OF_RANGE` | 400 | Sequence out of range |
| | `PROOF_SEQUENCE_ZERO` | 400 | Sequence must be > 0 for consistency proof |
| **Configuration** | | | |
| | `CONFIG_FILE_NOT_FOUND` | 400 | Configuration file not found |
| | `CONFIG_NOT_A_FILE` | 400 | Configuration path is not a file |
| | `CONFIG_TOML_PARSE_ERROR` | 400 | Failed to parse TOML |

## 10. Replication Protocol

### 10.1 Sync Request

```json
{
    "from_sequence": 10,
    "requestor_id": "peer-node-abc",
    "max_entries": 1000
}
```

### 10.2 Sync Response

```json
{
    "entries": [
        {
            "sequence": 10,
            "parent_hash": "<hex>",
            "payload": "<hex>",
            "payload_hash": "<hex>",
            "envelope_hash": "<hex>",
            "revision_hash": "<hex>",
            "key_id": "<hex>",
            "key_version": 1,
            "timestamp": 1234567890.0,
            "signature": {
                "key_id": "<hex>",
                "key_version": 1,
                "signature": "<hex>",
                "timestamp": 1234567890.0
            }
        }
    ],
    "from_sequence": 10,
    "to_sequence": 42,
    "total_entries": 33,
    "timestamp": 1234567890.0
}
```

### 10.3 Entry Serialization for Replication

In the replication protocol, binary fields are hex-encoded (not base64) for compatibility with text-based protocols.
