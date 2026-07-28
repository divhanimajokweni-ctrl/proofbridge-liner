"""VVU Earth Tech Ledger — Validator lifecycle management.

Manages validator registration, revocation, key rotation, and historical
lookup.  All validator records are persisted in the ``validators`` table
and cached in memory for fast access.

The registry supports **historical queries** — asking for the state of a
validator at a specific sequence number — which is essential for replay
verification.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from .constants import MAX_VALIDATORS, MAX_WEIGHT
from .exceptions import (
    DatabaseError,
    DuplicateValidatorError,
    ValidatorExpiredError,
    ValidatorNotFoundError,
    WeightInvalidError,
)
from .storage import LedgerStorage


# ---------------------------------------------------------------------------
# Validator record
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ValidatorRecord:
    """Immutable record of a validator's state.

    Attributes:
        key_id:               4-byte key identifier.
        public_key:           32-byte Ed25519 public key.
        weight:               Consensus weight of this validator.
        registration_sequence: Sequence number when the validator was registered.
        revocation_sequence:  Sequence number when revoked, or ``None`` if active.
        key_version:          Key version number (incremented on rotation).
        created_at:           Registration timestamp (POSIX epoch seconds).
        expires_at:           Optional expiry timestamp (POSIX epoch seconds).
    """

    key_id: bytes
    public_key: bytes
    weight: int
    registration_sequence: int
    revocation_sequence: int | None
    key_version: int
    created_at: float
    expires_at: float | None


# ---------------------------------------------------------------------------
# Validator registry
# ---------------------------------------------------------------------------

class ValidatorRegistry:
    """Manages validator lifecycle — registration, revocation, key rotation,
    and historical lookup.

    All mutations are persisted to the ``validators`` table and reflected
    in the in-memory cache.

    Usage::

        registry = ValidatorRegistry(storage)
        record = registry.register(key_id=b"\\x01\\x02\\x03\\x04",
                                   public_key=pk, weight=1, sequence=0)
        active = registry.list_active()
    """

    def __init__(self, storage: LedgerStorage) -> None:
        """Initialize with a storage backend.

        Args:
            storage: An open :class:`LedgerStorage` instance.
        """
        self._storage = storage
        self._validators: dict[bytes, ValidatorRecord] = {}
        self._load_from_storage()

    # ------------------------------------------------------------------
    # Internal: load from storage
    # ------------------------------------------------------------------

    def _load_from_storage(self) -> None:
        """Load existing validator records from the database into memory."""
        try:
            rows = self._storage.fetch_all(
                "SELECT key_id, public_key, weight, registration_sequence, "
                "revocation_sequence, key_version, created_at, expires_at "
                "FROM validators"
            )
        except DatabaseError:
            return  # table may not exist yet (pre-migration)

        for row in rows:
            key_id, public_key, weight, reg_seq, rev_seq, key_ver, created, expires = row
            record = ValidatorRecord(
                key_id=key_id,
                public_key=public_key,
                weight=weight,
                registration_sequence=reg_seq,
                revocation_sequence=rev_seq,
                key_version=key_ver,
                created_at=created,
                expires_at=expires,
            )
            self._validators[key_id] = record

    # ------------------------------------------------------------------
    # Register
    # ------------------------------------------------------------------

    def register(
        self,
        key_id: bytes,
        public_key: bytes,
        weight: int,
        sequence: int,
        key_version: int = 1,
        expires_at: float | None = None,
    ) -> ValidatorRecord:
        """Register a new validator.

        Args:
            key_id:      4-byte key identifier.
            public_key:  32-byte Ed25519 public key.
            weight:      Consensus weight (must be 1–MAX_WEIGHT).
            sequence:    Current ledger sequence number.
            key_version: Key version (defaults to 1).
            expires_at:  Optional expiry timestamp.

        Returns:
            The newly created :class:`ValidatorRecord`.

        Raises:
            DuplicateValidatorError: If *key_id* is already registered.
            WeightInvalidError:      If *weight* is out of range.
            ValidatorError:          If the maximum number of validators is exceeded.
        """
        if self.is_duplicate(key_id):
            raise DuplicateValidatorError(
                key_id.hex(),
                detail={"key_id": key_id.hex()},
            )

        if weight < 1 or weight > MAX_WEIGHT:
            raise WeightInvalidError(
                key_id.hex(),
                weight,
                detail={"key_id": key_id.hex(), "weight": weight, "max_weight": MAX_WEIGHT},
            )

        active_count = len(self.list_active())
        if active_count >= MAX_VALIDATORS:
            from .exceptions import ValidatorError
            raise ValidatorError(
                f"Maximum number of validators ({MAX_VALIDATORS}) reached",
                code="VALIDATOR_MAX_REACHED",
                detail={"max_validators": MAX_VALIDATORS, "current": active_count},
            )

        created_at = time.time()
        record = ValidatorRecord(
            key_id=key_id,
            public_key=public_key,
            weight=weight,
            registration_sequence=sequence,
            revocation_sequence=None,
            key_version=key_version,
            created_at=created_at,
            expires_at=expires_at,
        )

        # Persist to database
        self._storage.begin_transaction()
        try:
            self._storage.execute(
                "INSERT INTO validators "
                "(key_id, public_key, weight, registration_sequence, "
                "revocation_sequence, key_version, created_at, expires_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (key_id, public_key, weight, sequence, None, key_version, created_at, expires_at),
            )
            self._storage.commit()
        except DatabaseError:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass
            raise

        # Update in-memory cache
        self._validators[key_id] = record
        return record

    # ------------------------------------------------------------------
    # Revoke
    # ------------------------------------------------------------------

    def revoke(self, key_id: bytes, sequence: int) -> None:
        """Revoke a validator.

        Args:
            key_id:   4-byte key identifier.
            sequence: Current ledger sequence number.

        Raises:
            ValidatorNotFoundError: If the validator is not found.
            ValidatorExpiredError:  If the validator is already revoked.
        """
        record = self.get(key_id)
        if record is None:
            raise ValidatorNotFoundError(
                key_id.hex(),
                detail={"key_id": key_id.hex()},
            )
        if record.revocation_sequence is not None:
            raise ValidatorExpiredError(
                key_id.hex(),
                detail={
                    "key_id": key_id.hex(),
                    "revocation_sequence": record.revocation_sequence,
                },
            )

        # Update record
        updated = ValidatorRecord(
            key_id=record.key_id,
            public_key=record.public_key,
            weight=record.weight,
            registration_sequence=record.registration_sequence,
            revocation_sequence=sequence,
            key_version=record.key_version,
            created_at=record.created_at,
            expires_at=record.expires_at,
        )

        # Persist
        self._storage.begin_transaction()
        try:
            self._storage.execute(
                "UPDATE validators SET revocation_sequence = ? WHERE key_id = ?",
                (sequence, key_id),
            )
            self._storage.commit()
        except DatabaseError:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass
            raise

        self._validators[key_id] = updated

    # ------------------------------------------------------------------
    # Get
    # ------------------------------------------------------------------

    def get(self, key_id: bytes) -> ValidatorRecord | None:
        """Get a validator by key_id.

        Args:
            key_id: 4-byte key identifier.

        Returns:
            The :class:`ValidatorRecord`, or ``None`` if not found.
        """
        return self._validators.get(key_id)

    def get_at_sequence(self, key_id: bytes, sequence: int) -> ValidatorRecord | None:
        """Get a validator's state at a specific sequence (historical lookup).

        A validator is considered *active* at a given sequence if:

        * ``registration_sequence <= sequence``, and
        * ``revocation_sequence`` is ``None`` or ``revocation_sequence > sequence``.

        Args:
            key_id:   4-byte key identifier.
            sequence: The sequence number to query at.

        Returns:
            The :class:`ValidatorRecord` if the validator was active at the
            given sequence, otherwise ``None``.
        """
        record = self._validators.get(key_id)
        if record is None:
            return None

        # Check if the validator was registered at or before this sequence
        if record.registration_sequence > sequence:
            return None

        # Check if the validator was revoked at or before this sequence
        if record.revocation_sequence is not None and record.revocation_sequence <= sequence:
            return None

        return record

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    def list_active(self, sequence: int | None = None) -> list[ValidatorRecord]:
        """List all active validators.

        Args:
            sequence: Optional sequence number for historical lookup.
                      If ``None``, returns currently active validators.

        Returns:
            List of active :class:`ValidatorRecord` objects.
        """
        if sequence is None:
            return [
                rec for rec in self._validators.values()
                if rec.revocation_sequence is None
            ]
        return [
            rec for rec in self._validators.values()
            if rec.registration_sequence <= sequence
            and (rec.revocation_sequence is None or rec.revocation_sequence > sequence)
        ]

    # ------------------------------------------------------------------
    # Duplicate check
    # ------------------------------------------------------------------

    def is_duplicate(self, key_id: bytes) -> bool:
        """Check if a key_id is already registered.

        Args:
            key_id: 4-byte key identifier.

        Returns:
            ``True`` if the key_id is already registered.
        """
        return key_id in self._validators

    # ------------------------------------------------------------------
    # Key rotation
    # ------------------------------------------------------------------

    def rotate_key(
        self,
        old_key_id: bytes,
        new_public_key: bytes,
        new_key_version: int,
        sequence: int,
    ) -> ValidatorRecord:
        """Rotate a validator's key.

        Revokes the old key and registers a new one with the same weight.

        Args:
            old_key_id:      4-byte key identifier of the key to rotate.
            new_public_key:  32-byte new Ed25519 public key.
            new_key_version: Version number for the new key.
            sequence:        Current ledger sequence number.

        Returns:
            The newly created :class:`ValidatorRecord`.

        Raises:
            ValidatorNotFoundError: If the old key is not found.
        """
        old_record = self.get(old_key_id)
        if old_record is None:
            raise ValidatorNotFoundError(
                old_key_id.hex(),
                detail={"key_id": old_key_id.hex()},
            )

        # Compute new key_id from the new public key
        import hashlib
        new_key_id = hashlib.sha256(new_public_key).digest()[:4]

        # Revoke the old key
        self.revoke(old_key_id, sequence)

        # Register the new key with the same weight
        new_record = self.register(
            key_id=new_key_id,
            public_key=new_public_key,
            weight=old_record.weight,
            sequence=sequence,
            key_version=new_key_version,
            expires_at=None,
        )

        return new_record

    # ------------------------------------------------------------------
    # Aggregate queries
    # ------------------------------------------------------------------

    def total_weight(self, sequence: int | None = None) -> int:
        """Sum of active validator weights.

        Args:
            sequence: Optional sequence number for historical lookup.

        Returns:
            Total weight of active validators.
        """
        return sum(rec.weight for rec in self.list_active(sequence))

    def count(self, sequence: int | None = None) -> int:
        """Count of active validators.

        Args:
            sequence: Optional sequence number for historical lookup.

        Returns:
            Number of active validators.
        """
        return len(self.list_active(sequence))
