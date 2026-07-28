"""VVU Earth Tech Ledger — Complete exception hierarchy.

Every exception carries a machine-readable ``code`` attribute and an optional
``detail`` dictionary so that callers can programmatically inspect failures
without parsing message strings.

Hierarchy::

    LedgerError
    ├── SerializationError
    │   ├── DepthExceededError
    │   ├── SizeExceededError
    │   └── InvalidTypeError
    ├── HashError
    │   ├── DomainViolationError
    │   └── HashMismatchError
    ├── CryptoError
    │   ├── SignatureError
    │   │   ├── InvalidSignatureError
    │   │   ├── KeyNotFoundError
    │   │   └── KeyExpiredError
    │   └── KeyRotationError
    │       ├── RotationInProgressError
    │       └── InvalidEpochError
    ├── MMRError
    │   ├── InvalidIndexError
    │   ├── InvalidProofError
    │   └── RootMismatchError
    ├── StorageError
    │   ├── DatabaseError
    │   │   ├── DBConnectionFailedError
    │   │   ├── DatabaseBusyError
    │   │   ├── DatabaseCorruptError
    │   │   └── MigrationFailedError
    │   └── SnapshotError
    │       ├── SnapshotCreationError
    │       ├── SnapshotRestorationError
    │       └── SnapshotIntegrityError
    ├── ReplayError
    │   ├── SequenceViolationError
    │   ├── ParentChainBrokenError
    │   ├── ReplayHashMismatchError
    │   └── ValidatorHistoryError
    ├── ValidatorError
    │   ├── ValidatorNotFoundError
    │   ├── DuplicateValidatorError
    │   ├── ValidatorExpiredError
    │   ├── WeightInvalidError
    │   └── QuorumFailedError
    ├── EnvelopeError
    │   ├── InvalidEnvelopeFormatError
    │   ├── MissingFieldError
    │   └── EnvelopeSignatureError
    ├── ConfigError
    │   ├── InvalidValueError
    │   ├── MissingConfigFieldError
    │   └── ImmutableAfterStartupError
    └── NetworkError
        ├── NetworkConnectionFailedError
        ├── TLSError
        ├── AuthFailedError
        └── RateLimitedError
"""

from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class LedgerError(Exception):
    """Base exception for all ledger errors.

    Attributes:
        code: Machine-readable error code (e.g. ``"LEDGER_UNKNOWN"``).
        detail: Optional dictionary with additional context.
    """

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "LEDGER_UNKNOWN",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code: str = code
        self.detail: dict[str, Any] | None = detail

    def __repr__(self) -> str:  # pragma: no cover
        return f"{type(self).__name__}(code={self.code!r}, message={str(self)!r})"


# ---------------------------------------------------------------------------
# Serialization
# ---------------------------------------------------------------------------

class SerializationError(LedgerError):
    """Raised when canonical serialization or deserialization fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "SERIALIZATION_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class DepthExceededError(SerializationError):
    """Nesting depth exceeded MAX_DEPTH during encoding."""

    def __init__(
        self,
        depth: int,
        max_depth: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Serialization depth {depth} exceeds maximum {max_depth}",
            code="SERIALIZATION_DEPTH_EXCEEDED",
            detail={"depth": depth, "max_depth": max_depth, **(detail or {})},
        )


class SizeExceededError(SerializationError):
    """Encoded object size exceeds MAX_OBJECT_SIZE."""

    def __init__(
        self,
        size: int,
        max_size: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Serialized size {size} exceeds maximum {max_size}",
            code="SERIALIZATION_SIZE_EXCEEDED",
            detail={"size": size, "max_size": max_size, **(detail or {})},
        )


class InvalidTypeError(SerializationError):
    """An unsupported type was encountered during serialization."""

    def __init__(
        self,
        type_name: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Unsupported type for canonical serialization: {type_name}",
            code="SERIALIZATION_INVALID_TYPE",
            detail={"type": type_name, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

class HashError(LedgerError):
    """Raised when a domain-separated hash operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "HASH_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class DomainViolationError(HashError):
    """A domain prefix was used in an inappropriate context."""

    def __init__(
        self,
        domain: bytes,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Domain violation for prefix {domain!r}",
            code="HASH_DOMAIN_VIOLATION",
            detail={"domain": domain.decode("ascii", errors="replace"), **(detail or {})},
        )


class HashMismatchError(HashError):
    """Computed hash does not match the expected value."""

    def __init__(
        self,
        expected: bytes,
        actual: bytes,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Hash mismatch: expected {expected.hex()}, got {actual.hex()}",
            code="HASH_MISMATCH",
            detail={"expected": expected.hex(), "actual": actual.hex(), **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Crypto
# ---------------------------------------------------------------------------

class CryptoError(LedgerError):
    """Base exception for cryptographic operations."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "CRYPTO_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class SignatureError(CryptoError):
    """Raised when a digital signature operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "SIGNATURE_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class InvalidSignatureError(SignatureError):
    """A signature could not be verified."""

    def __init__(
        self,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            "Invalid signature",
            code="SIGNATURE_INVALID",
            detail=detail,
        )


class KeyNotFoundError(SignatureError):
    """The signing key was not found."""

    def __init__(
        self,
        key_id: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Key not found: {key_id}",
            code="SIGNATURE_KEY_NOT_FOUND",
            detail={"key_id": key_id, **(detail or {})},
        )


class KeyExpiredError(SignatureError):
    """The signing key has expired."""

    def __init__(
        self,
        key_id: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Key expired: {key_id}",
            code="SIGNATURE_KEY_EXPIRED",
            detail={"key_id": key_id, **(detail or {})},
        )


class KeyRotationError(CryptoError):
    """Raised when a key rotation operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "KEY_ROTATION_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class RotationInProgressError(KeyRotationError):
    """A key rotation is already in progress."""

    def __init__(
        self,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            "Key rotation already in progress",
            code="KEY_ROTATION_IN_PROGRESS",
            detail=detail,
        )


class InvalidEpochError(KeyRotationError):
    """The supplied epoch is not valid for the current rotation state."""

    def __init__(
        self,
        epoch: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Invalid key rotation epoch: {epoch}",
            code="KEY_ROTATION_INVALID_EPOCH",
            detail={"epoch": epoch, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# MMR (Merkle Mountain Range)
# ---------------------------------------------------------------------------

class MMRError(LedgerError):
    """Raised when an MMR operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "MMR_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class InvalidIndexError(MMRError):
    """An MMR index is out of range."""

    def __init__(
        self,
        index: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Invalid MMR index: {index}",
            code="MMR_INVALID_INDEX",
            detail={"index": index, **(detail or {})},
        )


class InvalidProofError(MMRError):
    """An MMR proof is malformed or cannot be verified."""

    def __init__(
        self,
        message: str = "Invalid MMR proof",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code="MMR_INVALID_PROOF", detail=detail)


class RootMismatchError(MMRError):
    """The computed MMR root does not match the expected value."""

    def __init__(
        self,
        expected: bytes,
        actual: bytes,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"MMR root mismatch: expected {expected.hex()}, got {actual.hex()}",
            code="MMR_ROOT_MISMATCH",
            detail={"expected": expected.hex(), "actual": actual.hex(), **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

class StorageError(LedgerError):
    """Base exception for storage operations."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "STORAGE_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class DatabaseError(StorageError):
    """Raised when a database operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "DATABASE_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class DBConnectionFailedError(DatabaseError):
    """Could not establish a database connection."""

    def __init__(
        self,
        path: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Database connection failed: {path}",
            code="DATABASE_CONNECTION_FAILED",
            detail={"path": path, **(detail or {})},
        )


class DatabaseBusyError(DatabaseError):
    """The database is locked and the busy timeout expired."""

    def __init__(
        self,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            "Database busy: timeout expired",
            code="DATABASE_BUSY",
            detail=detail,
        )


class DatabaseCorruptError(DatabaseError):
    """The database file is corrupt."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Database corrupt: {reason}",
            code="DATABASE_CORRUPT",
            detail={"reason": reason, **(detail or {})},
        )


class MigrationFailedError(DatabaseError):
    """A database migration failed."""

    def __init__(
        self,
        version: int,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Database migration to version {version} failed: {reason}",
            code="DATABASE_MIGRATION_FAILED",
            detail={"version": version, "reason": reason, **(detail or {})},
        )


class SnapshotError(StorageError):
    """Raised when a snapshot operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "SNAPSHOT_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class SnapshotCreationError(SnapshotError):
    """Failed to create a snapshot."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Snapshot creation failed: {reason}",
            code="SNAPSHOT_CREATION_FAILED",
            detail={"reason": reason, **(detail or {})},
        )


class SnapshotRestorationError(SnapshotError):
    """Failed to restore a snapshot."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Snapshot restoration failed: {reason}",
            code="SNAPSHOT_RESTORATION_FAILED",
            detail={"reason": reason, **(detail or {})},
        )


class SnapshotIntegrityError(SnapshotError):
    """A snapshot failed an integrity check."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Snapshot integrity check failed: {reason}",
            code="SNAPSHOT_INTEGRITY_FAILED",
            detail={"reason": reason, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Replay
# ---------------------------------------------------------------------------

class ReplayError(LedgerError):
    """Raised when a replay verification fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "REPLAY_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class SequenceViolationError(ReplayError):
    """Entries are not in sequential order."""

    def __init__(
        self,
        expected: int,
        actual: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Sequence violation: expected sequence {expected}, got {actual}",
            code="REPLAY_SEQUENCE_VIOLATION",
            detail={"expected": expected, "actual": actual, **(detail or {})},
        )


class ParentChainBrokenError(ReplayError):
    """A parent reference does not point to the previous entry."""

    def __init__(
        self,
        expected_parent: bytes,
        actual_parent: bytes,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            "Parent chain broken",
            code="REPLAY_PARENT_CHAIN_BROKEN",
            detail={
                "expected_parent": expected_parent.hex(),
                "actual_parent": actual_parent.hex(),
                **(detail or {}),
            },
        )


class ReplayHashMismatchError(ReplayError):
    """A hash computed during replay does not match the stored hash."""

    def __init__(
        self,
        field: str,
        expected: bytes,
        actual: bytes,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Replay hash mismatch for {field}",
            code="REPLAY_HASH_MISMATCH",
            detail={
                "field": field,
                "expected": expected.hex(),
                "actual": actual.hex(),
                **(detail or {}),
            },
        )


class ValidatorHistoryError(ReplayError):
    """A validator history check failed during replay."""

    def __init__(
        self,
        validator_id: str,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Validator history error for {validator_id}: {reason}",
            code="REPLAY_VALIDATOR_HISTORY",
            detail={"validator_id": validator_id, "reason": reason, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------

class ValidatorError(LedgerError):
    """Raised when a validator operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "VALIDATOR_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class ValidatorNotFoundError(ValidatorError):
    """The requested validator was not found."""

    def __init__(
        self,
        validator_id: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Validator not found: {validator_id}",
            code="VALIDATOR_NOT_FOUND",
            detail={"validator_id": validator_id, **(detail or {})},
        )


class DuplicateValidatorError(ValidatorError):
    """A validator with the same identifier already exists."""

    def __init__(
        self,
        validator_id: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Duplicate validator: {validator_id}",
            code="VALIDATOR_DUPLICATE",
            detail={"validator_id": validator_id, **(detail or {})},
        )


class ValidatorExpiredError(ValidatorError):
    """A validator's key has expired."""

    def __init__(
        self,
        validator_id: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Validator key expired: {validator_id}",
            code="VALIDATOR_EXPIRED",
            detail={"validator_id": validator_id, **(detail or {})},
        )


class WeightInvalidError(ValidatorError):
    """A validator's weight is outside the valid range."""

    def __init__(
        self,
        validator_id: str,
        weight: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Invalid weight {weight} for validator {validator_id}",
            code="VALIDATOR_WEIGHT_INVALID",
            detail={"validator_id": validator_id, "weight": weight, **(detail or {})},
        )


class QuorumFailedError(ValidatorError):
    """Quorum was not reached for a decision."""

    def __init__(
        self,
        required: int,
        actual: int,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Quorum failed: required {required}, got {actual}",
            code="VALIDATOR_QUORUM_FAILED",
            detail={"required": required, "actual": actual, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Envelope
# ---------------------------------------------------------------------------

class EnvelopeError(LedgerError):
    """Raised when an envelope operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "ENVELOPE_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class InvalidEnvelopeFormatError(EnvelopeError):
    """The envelope format is not recognised."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Invalid envelope format: {reason}",
            code="ENVELOPE_INVALID_FORMAT",
            detail={"reason": reason, **(detail or {})},
        )


class MissingFieldError(EnvelopeError):
    """A required envelope field is missing."""

    def __init__(
        self,
        field: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Missing envelope field: {field}",
            code="ENVELOPE_MISSING_FIELD",
            detail={"field": field, **(detail or {})},
        )


class EnvelopeSignatureError(EnvelopeError):
    """An envelope signature could not be verified."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Envelope signature verification failed: {reason}",
            code="ENVELOPE_SIGNATURE_VERIFICATION_FAILED",
            detail={"reason": reason, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class ConfigError(LedgerError):
    """Raised when a configuration error is detected."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "CONFIG_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class InvalidValueError(ConfigError):
    """A configuration value is outside the valid range."""

    def __init__(
        self,
        field: str,
        value: Any,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Invalid config value for {field}: {value!r} ({reason})",
            code="CONFIG_INVALID_VALUE",
            detail={"field": field, "value": repr(value), "reason": reason, **(detail or {})},
        )


class MissingConfigFieldError(ConfigError):
    """A required configuration field is missing."""

    def __init__(
        self,
        field: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Missing config field: {field}",
            code="CONFIG_MISSING_FIELD",
            detail={"field": field, **(detail or {})},
        )


class ImmutableAfterStartupError(ConfigError):
    """Attempted to modify a configuration value after startup."""

    def __init__(
        self,
        field: str,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Config field {field!r} is immutable after startup",
            code="CONFIG_IMMUTABLE_AFTER_STARTUP",
            detail={"field": field, **(detail or {})},
        )


# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------

class NetworkError(LedgerError):
    """Raised when a network operation fails."""

    def __init__(
        self,
        message: str = "",
        *,
        code: str = "NETWORK_ERROR",
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, detail=detail)


class NetworkConnectionFailedError(NetworkError):
    """Could not establish a network connection."""

    def __init__(
        self,
        target: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Network connection failed: {target}",
            code="NETWORK_CONNECTION_FAILED",
            detail={"target": target, **(detail or {})},
        )


class TLSError(NetworkError):
    """A TLS handshake or certificate error occurred."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"TLS error: {reason}",
            code="NETWORK_TLS_ERROR",
            detail={"reason": reason, **(detail or {})},
        )


class AuthFailedError(NetworkError):
    """Authentication failed."""

    def __init__(
        self,
        reason: str = "",
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            f"Authentication failed: {reason}",
            code="NETWORK_AUTH_FAILED",
            detail={"reason": reason, **(detail or {})},
        )


class RateLimitedError(NetworkError):
    """The request was rate-limited."""

    def __init__(
        self,
        *,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            "Rate limited",
            code="NETWORK_RATE_LIMITED",
            detail=detail,
        )
