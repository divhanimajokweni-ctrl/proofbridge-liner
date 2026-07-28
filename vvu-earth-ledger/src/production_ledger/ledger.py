"""VVU Earth Tech Ledger — The production ledger engine.

The :class:`Ledger` is the central coordinator that ties together all
subsystems: storage, signing, MMR, validator registry, quorum
verification, and envelope construction.

It supports:

* **Append** — add a new entry with automatic hashing, signing, and MMR update.
* **Verify** — check the integrity of the entire entry chain.
* **Query** — retrieve entries by sequence or hash.
* **Proof** — generate and verify MMR inclusion proofs.
* **Snapshot** — create point-in-time state captures.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from .config import LedgerConfig
from .constants import DOMAIN_REVISION
from .ed25519 import Ed25519Signer, KeyStore, Signature
from .envelopes import GENESIS_HASH, Envelope, EnvelopeBuilder
from .exceptions import (
    DatabaseError,
    EnvelopeError,
    LedgerError,
    QuorumFailedError,
)
from .hashing import hash_payload
from .migrations import MigrationManager
from .mmr import MMRProof, MerkleMountainRange
from .quorum import QuorumVerifier
from .snapshots import Snapshot, SnapshotManager
from .storage import LedgerStorage
from .validator_registry import ValidatorRegistry


# ---------------------------------------------------------------------------
# The production ledger
# ---------------------------------------------------------------------------

class Ledger:
    """The production ledger engine.

    Usage::

        config = LedgerConfig.default()
        ledger = Ledger(config)
        ledger.open()
        envelope = ledger.append(b"hello world")
        assert ledger.get_sequence() == 1
        ledger.close()
    """

    def __init__(self, config: LedgerConfig) -> None:
        """Initialize with all subsystems.

        The ledger is **not** open after construction; call :meth:`open`
        to start the storage engine and apply migrations.

        Args:
            config: A frozen :class:`LedgerConfig` instance.
        """
        self._config = config
        self._storage = LedgerStorage(config.database)
        self._key_store = KeyStore()
        self._signer = Ed25519Signer(self._key_store)
        self._envelope_builder = EnvelopeBuilder(self._signer)
        self._mmr = MerkleMountainRange()
        self._validator_registry: ValidatorRegistry | None = None
        self._quorum_verifier: QuorumVerifier | None = None
        self._snapshot_manager: SnapshotManager | None = None
        self._migration_manager: MigrationManager | None = None
        self._sequence: int = -1  # -1 means no entries yet
        self._last_envelope_hash: bytes = GENESIS_HASH
        self._is_open: bool = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def open(self) -> None:
        """Open the ledger (storage, migrations, load MMR state).

        This method:

        1. Opens the storage engine.
        2. Applies pending migrations.
        3. Loads the MMR state from storage.
        4. Loads the current sequence number.
        5. Initializes the validator registry, quorum verifier, and
           snapshot manager.

        Raises:
            DatabaseError: If the storage engine cannot be opened.
        """
        if self._is_open:
            return

        self._storage.open()

        # Apply migrations
        self._migration_manager = MigrationManager(self._storage)
        self._migration_manager.migrate_up()

        # Register and apply the v3 migration (adds payload column)
        from .migrations import Migration
        self._migration_manager.register_migration(Migration(
            version=3,
            description="Add payload and key_version columns to entries table",
            up_sql="""
                ALTER TABLE entries ADD COLUMN payload BLOB;
                ALTER TABLE entries ADD COLUMN key_version INTEGER DEFAULT 0;
                INSERT OR REPLACE INTO metadata (key, value)
                    VALUES ('schema_version', '3');
            """,
            down_sql="""
                CREATE TABLE entries_backup (
                    sequence         INTEGER PRIMARY KEY,
                    parent_hash      BLOB,
                    payload_hash     BLOB,
                    envelope_hash    BLOB,
                    revision_hash   BLOB,
                    mmr_position     INTEGER,
                    created_at       REAL NOT NULL,
                    signature_key_id BLOB,
                    signature        BLOB
                );
                INSERT INTO entries_backup SELECT sequence, parent_hash, payload_hash,
                    envelope_hash, revision_hash, mmr_position, created_at,
                    signature_key_id, signature FROM entries;
                DROP TABLE entries;
                ALTER TABLE entries_backup RENAME TO entries;
                INSERT OR REPLACE INTO metadata (key, value)
                    VALUES ('schema_version', '2');
            """,
        ))
        self._migration_manager.migrate_up()

        # Initialize subsystems that depend on storage
        self._validator_registry = ValidatorRegistry(self._storage)
        self._quorum_verifier = QuorumVerifier(
            self._validator_registry,
            min_quorum=self._config.validators.min_quorum,
        )
        self._snapshot_manager = SnapshotManager(self._storage)

        # Generate a signing key if none exists
        if not self._key_store.list_active_keys():
            self._key_store.generate_key()

        # Load MMR state from storage
        self._load_mmr_state()

        # Load current sequence
        self._load_sequence()

        self._is_open = True

    def close(self) -> None:
        """Close the ledger.

        Persists the MMR state and closes the storage engine.
        """
        if not self._is_open:
            return

        # Persist MMR state
        self._save_mmr_state()

        self._storage.close()
        self._is_open = False

    # ------------------------------------------------------------------
    # Internal: load / save state
    # ------------------------------------------------------------------

    def _load_mmr_state(self) -> None:
        """Load MMR state from the ``mmr_nodes`` table."""
        try:
            rows = self._storage.fetch_all(
                "SELECT position, hash FROM mmr_nodes ORDER BY position"
            )
            if rows:
                self._mmr = MerkleMountainRange()
                # Rebuild MMR from entries — we need to re-append
                # all leaf hashes in order.  We'll reconstruct from
                # the entries table instead.
                entry_rows = self._storage.fetch_all(
                    "SELECT envelope_hash FROM entries ORDER BY sequence ASC"
                )
                for row in entry_rows:
                    self._mmr.append(row[0])
        except DatabaseError:
            # Table may not exist yet
            self._mmr = MerkleMountainRange()

    def _load_sequence(self) -> None:
        """Load the current sequence number from the database."""
        try:
            row = self._storage.fetch_one(
                "SELECT MAX(sequence) FROM entries"
            )
            if row is not None and row[0] is not None:
                self._sequence = row[0]
                # Load last envelope hash
                last_row = self._storage.fetch_one(
                    "SELECT envelope_hash FROM entries WHERE sequence = ?",
                    (self._sequence,),
                )
                if last_row is not None:
                    self._last_envelope_hash = last_row[0]
            else:
                self._sequence = -1
                self._last_envelope_hash = GENESIS_HASH
        except DatabaseError:
            self._sequence = -1
            self._last_envelope_hash = GENESIS_HASH

    def _save_mmr_state(self) -> None:
        """Persist MMR state to the ``mmr_nodes`` table."""
        if not self._is_open:
            return
        try:
            mmr_data = self._mmr.to_dict()
            self._storage.begin_transaction()
            self._storage.execute("DELETE FROM mmr_nodes")
            for pos_str, hash_hex in mmr_data.get("nodes", {}).items():
                pos = int(pos_str)
                hash_bytes = bytes.fromhex(hash_hex)
                self._storage.execute(
                    "INSERT INTO mmr_nodes (position, hash) VALUES (?, ?)",
                    (pos, hash_bytes),
                )
            self._storage.commit()
        except DatabaseError:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass

    # ------------------------------------------------------------------
    # Append
    # ------------------------------------------------------------------

    def append(
        self,
        payload: bytes,
        signatures: list[Signature] | None = None,
    ) -> Envelope:
        """Append a new entry to the ledger.

        The construction is:

        1. Increment the sequence number.
        2. Get the parent hash (previous envelope hash or genesis hash).
        3. Build the envelope with signing.
        4. Verify quorum if signatures are provided.
        5. Append the envelope hash to the MMR.
        6. Store the entry in the database.
        7. Return the envelope.

        Args:
            payload:    The raw data bytes for the entry.
            signatures: Optional list of validator signatures for quorum.

        Returns:
            The fully constructed :class:`Envelope`.

        Raises:
            QuorumFailedError: If quorum verification fails.
            EnvelopeError:     If envelope construction fails.
            DatabaseError:     If the storage operation fails.
        """
        # 1. Get current sequence number
        new_sequence = self._sequence + 1

        # 2. Get parent hash
        parent_hash = self._last_envelope_hash

        # 3. Build envelope
        envelope = self._envelope_builder.build(
            sequence=new_sequence,
            parent_hash=parent_hash,
            payload=payload,
        )

        # 4. Verify quorum if signatures provided
        if signatures is not None and self._quorum_verifier is not None:
            result = self._quorum_verifier.check_quorum(signatures)
            if not result.achieved:
                raise QuorumFailedError(
                    required=result.required_weight,
                    actual=result.signed_weight,
                    detail={
                        "sequence": new_sequence,
                        "required_weight": result.required_weight,
                        "signed_weight": result.signed_weight,
                        "total_weight": result.total_weight,
                    },
                )

        # 5. Append to MMR
        self._mmr.append(envelope.envelope_hash)

        # 6. Store in database
        self._storage.begin_transaction()
        try:
            self._storage.execute(
                "INSERT INTO entries "
                "(sequence, parent_hash, payload_hash, envelope_hash, "
                "revision_hash, mmr_position, created_at, signature_key_id, "
                "signature, payload, key_version) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    new_sequence,
                    envelope.parent_hash,
                    envelope.payload_hash,
                    envelope.envelope_hash,
                    envelope.revision_hash,
                    self._mmr.size - 1,  # MMR leaf index
                    envelope.timestamp,
                    envelope.signature.key_id,
                    envelope.signature.signature,
                    envelope.payload,
                    envelope.key_version,
                ),
            )
            self._storage.commit()
        except DatabaseError:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass
            raise

        # 7. Update in-memory state
        self._sequence = new_sequence
        self._last_envelope_hash = envelope.envelope_hash

        return envelope

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def get_entry(self, sequence: int) -> Envelope | None:
        """Get an entry by sequence number.

        Args:
            sequence: The sequence number to look up.

        Returns:
            The :class:`Envelope`, or ``None`` if not found.
        """
        row = self._storage.fetch_one(
            "SELECT sequence, parent_hash, payload_hash, envelope_hash, "
            "revision_hash, created_at, signature_key_id, signature, "
            "payload, key_version "
            "FROM entries WHERE sequence = ?",
            (sequence,),
        )
        if row is None:
            return None

        (seq, parent_hash, payload_hash, envelope_hash, revision_hash,
         created_at, sig_key_id, sig_bytes, payload, key_version) = row

        # payload may be None if the column was added after the row was inserted
        if payload is None:
            payload = b""

        from .ed25519 import Signature as Sig

        signature = Sig(
            key_id=sig_key_id,
            key_version=key_version or 0,
            signature=sig_bytes,
            timestamp=created_at,
        )

        return Envelope(
            sequence=seq,
            parent_hash=parent_hash,
            payload=payload,
            payload_hash=payload_hash,
            envelope_hash=envelope_hash,
            revision_hash=revision_hash,
            signature=signature,
            key_id=sig_key_id,
            key_version=key_version or 0,
            timestamp=created_at,
        )

    def get_entry_by_hash(self, payload_hash: bytes) -> Envelope | None:
        """Get an entry by payload hash.

        Args:
            payload_hash: The SHA-256 hash of the payload.

        Returns:
            The :class:`Envelope`, or ``None`` if not found.
        """
        row = self._storage.fetch_one(
            "SELECT sequence, parent_hash, payload_hash, envelope_hash, "
            "revision_hash, created_at, signature_key_id, signature, "
            "payload, key_version "
            "FROM entries WHERE payload_hash = ?",
            (payload_hash,),
        )
        if row is None:
            return None

        (seq, parent_hash, ph, envelope_hash, revision_hash,
         created_at, sig_key_id, sig_bytes, payload, key_version) = row

        if payload is None:
            payload = b""

        from .ed25519 import Signature as Sig

        signature = Sig(
            key_id=sig_key_id,
            key_version=key_version or 0,
            signature=sig_bytes,
            timestamp=created_at,
        )

        return Envelope(
            sequence=seq,
            parent_hash=parent_hash,
            payload=payload,
            payload_hash=ph,
            envelope_hash=envelope_hash,
            revision_hash=revision_hash,
            signature=signature,
            key_id=sig_key_id,
            key_version=key_version or 0,
            timestamp=created_at,
        )

    def get_last_entry(self) -> Envelope | None:
        """Get the last entry.

        Returns:
            The last :class:`Envelope`, or ``None`` if the ledger is empty.
        """
        if self._sequence < 0:
            return None
        return self.get_entry(self._sequence)

    # ------------------------------------------------------------------
    # State queries
    # ------------------------------------------------------------------

    def get_sequence(self) -> int:
        """Get the current sequence number.

        Returns:
            The current sequence number, or ``-1`` if no entries exist.
        """
        return self._sequence

    def get_mmr_root(self) -> bytes:
        """Get the current MMR root.

        Returns:
            The 32-byte MMR root hash.
        """
        return self._mmr.get_root()

    # ------------------------------------------------------------------
    # Chain verification
    # ------------------------------------------------------------------

    def verify_chain(
        self,
        from_sequence: int = 0,
        to_sequence: int | None = None,
    ) -> bool:
        """Verify the integrity of the entry chain.

        Checks:

        1. Each entry's ``parent_hash`` matches the previous entry's ``envelope_hash``.
        2. Each entry's hashes are correct.
        3. Signatures are valid.

        Args:
            from_sequence: Starting sequence number (default 0).
            to_sequence:   Ending sequence number (default: last entry).

        Returns:
            ``True`` if the chain is valid.

        Raises:
            HashMismatchError:      If a hash mismatch is detected.
            EnvelopeSignatureError: If a signature is invalid.
        """
        if to_sequence is None:
            to_sequence = self._sequence

        if from_sequence > to_sequence:
            return True

        previous_envelope: Envelope | None = None

        for seq in range(from_sequence, to_sequence + 1):
            envelope = self.get_entry(seq)
            if envelope is None:
                return False

            # Check parent chain
            if previous_envelope is not None:
                if envelope.parent_hash != previous_envelope.envelope_hash:
                    return False
            else:
                # First entry should have genesis hash as parent
                if seq == 0 and envelope.parent_hash != GENESIS_HASH:
                    return False

            # Verify the envelope's hashes
            try:
                EnvelopeBuilder.verify(envelope, self._signer)
            except Exception:
                return False

            previous_envelope = envelope

        return True

    # ------------------------------------------------------------------
    # Proofs
    # ------------------------------------------------------------------

    def get_proof(self, sequence: int) -> MMRProof:
        """Generate an inclusion proof for a sequence.

        Args:
            sequence: The sequence number to generate a proof for.

        Returns:
            An :class:`MMRProof` for the entry.

        Raises:
            LedgerError: If the sequence is out of range.
        """
        if sequence < 0 or sequence > self._sequence:
            raise LedgerError(
                f"Sequence {sequence} out of range [0, {self._sequence}]",
                code="LEDGER_SEQUENCE_OUT_OF_RANGE",
                detail={"sequence": sequence, "max_sequence": self._sequence},
            )

        # The MMR leaf position corresponds to the sequence number
        # (since we append in order)
        from .mmr import _leaf_pos
        leaf_pos = _leaf_pos(sequence)

        return self._mmr.inclusion_proof(leaf_pos)

    def verify_proof(self, sequence: int, proof: MMRProof) -> bool:
        """Verify an inclusion proof against the current root.

        Args:
            sequence: The sequence number the proof is for.
            proof:    The :class:`MMRProof` to verify.

        Returns:
            ``True`` if the proof is valid.
        """
        envelope = self.get_entry(sequence)
        if envelope is None:
            return False

        root = self.get_mmr_root()
        return MerkleMountainRange.verify_inclusion(
            envelope.envelope_hash, proof, root
        )

    # ------------------------------------------------------------------
    # Snapshots
    # ------------------------------------------------------------------

    def create_snapshot(self) -> Snapshot:
        """Create a snapshot of the current ledger state.

        Returns:
            A :class:`Snapshot` capturing the current state.
        """
        if self._snapshot_manager is None:
            raise LedgerError(
                "Snapshot manager not initialized",
                code="LEDGER_NOT_OPEN",
            )

        # Collect entries for the snapshot
        # Note: timestamps are encoded as 8-byte big-endian doubles
        # because the canonical serializer does not support floats.
        import struct
        entries: list[dict] = []
        for seq in range(0, self._sequence + 1):
            entry = self.get_entry(seq)
            if entry is not None:
                entries.append({
                    "sequence": entry.sequence,
                    "parent_hash": entry.parent_hash.hex(),
                    "payload_hash": entry.payload_hash.hex(),
                    "envelope_hash": entry.envelope_hash.hex(),
                    "revision_hash": entry.revision_hash.hex(),
                    "timestamp": struct.pack(">d", entry.timestamp).hex(),
                })

        mmr_data = self._mmr.to_dict()

        return self._snapshot_manager.create_snapshot(
            sequence=self._sequence,
            mmr_root=self.get_mmr_root(),
            entries=entries,
            mmr_data=mmr_data,
        )

    # ------------------------------------------------------------------
    # Statistics
    # ------------------------------------------------------------------

    def get_stats(self) -> dict[str, Any]:
        """Return ledger statistics.

        Returns:
            Dictionary with keys: ``sequence``, ``mmr_size``, ``mmr_root``,
            ``validator_count``, ``total_weight``, ``db_stats``.
        """
        stats: dict[str, Any] = {
            "sequence": self._sequence,
            "mmr_size": self._mmr.size,
            "mmr_root": self.get_mmr_root().hex(),
            "is_open": self._is_open,
        }

        if self._validator_registry is not None:
            stats["validator_count"] = self._validator_registry.count()
            stats["total_weight"] = self._validator_registry.total_weight()
        else:
            stats["validator_count"] = 0
            stats["total_weight"] = 0

        try:
            stats["db_stats"] = self._storage.get_stats()
        except DatabaseError:
            stats["db_stats"] = {}

        return stats

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def storage(self) -> LedgerStorage:
        """The underlying storage engine."""
        return self._storage

    @property
    def validator_registry(self) -> ValidatorRegistry | None:
        """The validator registry, or ``None`` if the ledger is not open."""
        return self._validator_registry

    @property
    def quorum_verifier(self) -> QuorumVerifier | None:
        """The quorum verifier, or ``None`` if the ledger is not open."""
        return self._quorum_verifier

    @property
    def mmr(self) -> MerkleMountainRange:
        """The current MMR instance."""
        return self._mmr

    @property
    def signer(self) -> Ed25519Signer:
        """The Ed25519 signer."""
        return self._signer

    @property
    def key_store(self) -> KeyStore:
        """The key store."""
        return self._key_store

    @property
    def envelope_builder(self) -> EnvelopeBuilder:
        """The envelope builder."""
        return self._envelope_builder
