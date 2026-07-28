"""VVU Earth Tech Ledger — Snapshot system for point-in-time ledger state capture.

A snapshot captures the complete ledger state at a given sequence number:
all entries up to that point and the full MMR node set.  The snapshot
data is serialized using the canonical serializer and integrity-protected
with a domain-separated hash.

Snapshots can be exported to and imported from files, enabling
point-in-time recovery and audit.

Usage::

    snap_mgr = SnapshotManager(storage)
    snap = snap_mgr.create_snapshot(
        sequence=42,
        mmr_root=mmr.get_root(),
        entries=entries_list,
        mmr_data=mmr.to_dict(),
    )
    snap_mgr.verify_snapshot(snap.id)
"""

from __future__ import annotations

import json
import os
import struct
import time
from dataclasses import dataclass

from .exceptions import (
    DatabaseError,
    SnapshotCreationError,
    SnapshotIntegrityError,
    SnapshotRestorationError,
)
from .hashing import hash_snapshot
from .serializer import canonical_decode, canonical_encode
from .storage import LedgerStorage


# ---------------------------------------------------------------------------
# Snapshot data class
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Snapshot:
    """A point-in-time snapshot of the ledger.

    Attributes:
        id:         Auto-incremented database row ID.
        sequence:   The ledger sequence number at snapshot time.
        mmr_root:   The MMR root hash at snapshot time.
        data:       Serialized snapshot payload (canonical encoding).
        created_at: Unix timestamp when the snapshot was created.
        hash:       Domain-separated integrity hash of the snapshot data.
    """

    id: int
    sequence: int
    mmr_root: bytes
    data: bytes
    created_at: float
    hash: bytes


# ---------------------------------------------------------------------------
# File format constants for export/import
# ---------------------------------------------------------------------------

_FILE_MAGIC: bytes = b"VVUSNAP\x01"
_FILE_HEADER_SIZE: int = len(_FILE_MAGIC) + 4  # magic + uint32 data_length


# ---------------------------------------------------------------------------
# Snapshot manager
# ---------------------------------------------------------------------------

class SnapshotManager:
    """Manages ledger snapshots.

    All operations are transactional.  Snapshot data is serialized using
    the project's canonical serializer and integrity-protected with a
    domain-separated hash (:func:`hash_snapshot`).
    """

    def __init__(self, storage: LedgerStorage) -> None:
        """Initialize with storage reference.

        Args:
            storage: An open :class:`LedgerStorage` instance.
        """
        self._storage: LedgerStorage = storage

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_snapshot(
        self,
        sequence: int,
        mmr_root: bytes,
        entries: list[dict],
        mmr_data: dict,
    ) -> Snapshot:
        """Create a snapshot at the given sequence point.

        The *entries* and *mmr_data* are serialized using the canonical
        serializer.  A domain-separated hash of the serialized data is
        computed and stored alongside the snapshot for integrity
        verification.

        Args:
            sequence:  The ledger sequence number to snapshot.
            mmr_root:  The MMR root hash at this sequence.
            entries:   List of entry dicts to include in the snapshot.
            mmr_data:  MMR state dict (as produced by ``MMR.to_dict()``).

        Returns:
            The newly created :class:`Snapshot`.

        Raises:
            SnapshotCreationError: If serialization or storage fails.
        """
        try:
            # Build the snapshot payload
            snapshot_payload: dict = {
                "sequence": sequence,
                "mmr_root": mmr_root.hex(),
                "entries": entries,
                "mmr_data": mmr_data,
            }

            # Serialize using the canonical serializer
            data = canonical_encode(snapshot_payload)

            # Compute integrity hash
            snap_hash = hash_snapshot(data)

            created_at = time.time()

            # Store in the snapshots table
            self._storage.begin_transaction()
            cursor = self._storage.execute(
                """
                INSERT INTO snapshots (sequence, mmr_root, data, created_at, hash)
                VALUES (?, ?, ?, ?, ?)
                """,
                (sequence, mmr_root, data, created_at, snap_hash),
            )
            row_id = cursor.lastrowid
            self._storage.commit()

            return Snapshot(
                id=row_id,
                sequence=sequence,
                mmr_root=mmr_root,
                data=data,
                created_at=created_at,
                hash=snap_hash,
            )

        except (DatabaseError, Exception) as exc:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass
            if isinstance(exc, DatabaseError):
                raise SnapshotCreationError(
                    str(exc),
                    detail={"sequence": sequence, "error": str(exc)},
                ) from exc
            raise SnapshotCreationError(
                str(exc),
                detail={"sequence": sequence, "error": str(exc)},
            ) from exc

    # ------------------------------------------------------------------
    # Restore
    # ------------------------------------------------------------------

    def restore_snapshot(self, snapshot_id: int) -> dict:
        """Restore ledger state from a snapshot.

        Loads the snapshot from the database, verifies its integrity
        hash, and returns the deserialized payload.

        Args:
            snapshot_id: The database row ID of the snapshot.

        Returns:
            Deserialized snapshot dict with keys: ``sequence``,
            ``mmr_root``, ``entries``, ``mmr_data``.

        Raises:
            SnapshotRestorationError: If the snapshot cannot be loaded.
            SnapshotIntegrityError: If the integrity hash does not match.
        """
        try:
            row = self._storage.fetch_one(
                "SELECT id, sequence, mmr_root, data, created_at, hash "
                "FROM snapshots WHERE id = ?",
                (snapshot_id,),
            )
        except DatabaseError as exc:
            raise SnapshotRestorationError(
                str(exc),
                detail={"snapshot_id": snapshot_id, "error": str(exc)},
            ) from exc

        if row is None:
            raise SnapshotRestorationError(
                f"Snapshot with id {snapshot_id} not found",
                detail={"snapshot_id": snapshot_id},
            )

        snap_id, sequence, mmr_root, data, created_at, stored_hash = row

        # Verify integrity before deserializing
        computed_hash = hash_snapshot(data)
        if computed_hash != stored_hash:
            raise SnapshotIntegrityError(
                "Snapshot hash mismatch on restore",
                detail={
                    "snapshot_id": snapshot_id,
                    "stored_hash": stored_hash.hex(),
                    "computed_hash": computed_hash.hex(),
                },
            )

        try:
            payload = canonical_decode(data)
        except Exception as exc:
            raise SnapshotRestorationError(
                f"Failed to deserialize snapshot data: {exc}",
                detail={"snapshot_id": snapshot_id, "error": str(exc)},
            ) from exc

        # Convert mmr_root from hex string back to bytes
        if isinstance(payload, dict) and "mmr_root" in payload:
            payload["mmr_root"] = bytes.fromhex(payload["mmr_root"])

        return payload

    # ------------------------------------------------------------------
    # Verify
    # ------------------------------------------------------------------

    def verify_snapshot(self, snapshot_id: int) -> bool:
        """Verify a snapshot's integrity.

        Loads the snapshot, recomputes the domain-separated hash, and
        compares it to the stored hash.

        Args:
            snapshot_id: The database row ID of the snapshot.

        Returns:
            ``True`` if the integrity check passes, ``False`` otherwise.
        """
        try:
            row = self._storage.fetch_one(
                "SELECT data, hash FROM snapshots WHERE id = ?",
                (snapshot_id,),
            )
        except DatabaseError:
            return False

        if row is None:
            return False

        data, stored_hash = row
        computed_hash = hash_snapshot(data)
        return computed_hash == stored_hash

    # ------------------------------------------------------------------
    # List / get
    # ------------------------------------------------------------------

    def list_snapshots(self) -> list[Snapshot]:
        """List all snapshots.

        Returns:
            List of :class:`Snapshot` objects ordered by sequence.
        """
        try:
            rows = self._storage.fetch_all(
                "SELECT id, sequence, mmr_root, data, created_at, hash "
                "FROM snapshots ORDER BY sequence ASC"
            )
        except DatabaseError:
            return []

        return [
            Snapshot(
                id=row[0],
                sequence=row[1],
                mmr_root=row[2],
                data=row[3],
                created_at=row[4],
                hash=row[5],
            )
            for row in rows
        ]

    def get_latest_snapshot(self) -> Snapshot | None:
        """Get the most recent snapshot.

        Returns:
            The latest :class:`Snapshot`, or ``None`` if no snapshots
            exist.
        """
        try:
            row = self._storage.fetch_one(
                "SELECT id, sequence, mmr_root, data, created_at, hash "
                "FROM snapshots ORDER BY sequence DESC LIMIT 1"
            )
        except DatabaseError:
            return None

        if row is None:
            return None

        return Snapshot(
            id=row[0],
            sequence=row[1],
            mmr_root=row[2],
            data=row[3],
            created_at=row[4],
            hash=row[5],
        )

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    def delete_snapshot(self, snapshot_id: int) -> None:
        """Delete a snapshot.

        Args:
            snapshot_id: The database row ID of the snapshot to delete.

        Raises:
            SnapshotRestorationError: If the deletion fails.
        """
        try:
            self._storage.begin_transaction()
            self._storage.execute(
                "DELETE FROM snapshots WHERE id = ?",
                (snapshot_id,),
            )
            self._storage.commit()
        except DatabaseError as exc:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass
            raise SnapshotRestorationError(
                f"Failed to delete snapshot {snapshot_id}: {exc}",
                detail={"snapshot_id": snapshot_id, "error": str(exc)},
            ) from exc

    # ------------------------------------------------------------------
    # Export / import
    # ------------------------------------------------------------------

    def export_snapshot(self, snapshot_id: int, path: str) -> None:
        """Export a snapshot to a file.

        The file format is::

            Magic (8 bytes): b"VVUSNAP\\x01"
            Data length (4 bytes, big-endian uint32)
            Data (variable length)

        Args:
            snapshot_id: The database row ID of the snapshot.
            path:        Filesystem path to write the snapshot file.

        Raises:
            SnapshotRestorationError: If the snapshot cannot be loaded.
            SnapshotCreationError:    If the file write fails.
        """
        try:
            row = self._storage.fetch_one(
                "SELECT id, sequence, mmr_root, data, created_at, hash "
                "FROM snapshots WHERE id = ?",
                (snapshot_id,),
            )
        except DatabaseError as exc:
            raise SnapshotRestorationError(
                f"Failed to load snapshot {snapshot_id}: {exc}",
                detail={"snapshot_id": snapshot_id, "error": str(exc)},
            ) from exc

        if row is None:
            raise SnapshotRestorationError(
                f"Snapshot with id {snapshot_id} not found",
                detail={"snapshot_id": snapshot_id},
            )

        snap_id, sequence, mmr_root, data, created_at, snap_hash = row

        try:
            with open(path, "wb") as f:
                f.write(_FILE_MAGIC)
                f.write(struct.pack(">I", len(data)))
                f.write(data)
        except OSError as exc:
            raise SnapshotCreationError(
                f"Failed to write snapshot file: {exc}",
                detail={"path": path, "error": str(exc)},
            ) from exc

    def import_snapshot(self, path: str) -> Snapshot:
        """Import a snapshot from a file.

        Reads the snapshot file, validates the magic header, and
        stores the snapshot data in the database.

        Args:
            path: Filesystem path to the snapshot file.

        Returns:
            The newly imported :class:`Snapshot`.

        Raises:
            SnapshotRestorationError: If the file cannot be read or is
                malformed.
            SnapshotCreationError:    If the database insert fails.
        """
        try:
            with open(path, "rb") as f:
                magic = f.read(len(_FILE_MAGIC))
                if magic != _FILE_MAGIC:
                    raise SnapshotRestorationError(
                        f"Invalid snapshot file: bad magic header",
                        detail={
                            "path": path,
                            "expected_magic": _FILE_MAGIC.hex(),
                            "actual_magic": magic.hex() if magic else "EOF",
                        },
                    )

                length_bytes = f.read(4)
                if len(length_bytes) < 4:
                    raise SnapshotRestorationError(
                        "Invalid snapshot file: truncated length header",
                        detail={"path": path},
                    )
                data_length = struct.unpack(">I", length_bytes)[0]
                data = f.read(data_length)
                if len(data) < data_length:
                    raise SnapshotRestorationError(
                        f"Invalid snapshot file: expected {data_length} bytes, "
                        f"got {len(data)}",
                        detail={"path": path, "expected": data_length, "got": len(data)},
                    )
        except SnapshotRestorationError:
            raise
        except OSError as exc:
            raise SnapshotRestorationError(
                f"Failed to read snapshot file: {exc}",
                detail={"path": path, "error": str(exc)},
            ) from exc

        # Deserialize to extract sequence and mmr_root
        try:
            payload = canonical_decode(data)
        except Exception as exc:
            raise SnapshotRestorationError(
                f"Failed to deserialize snapshot data: {exc}",
                detail={"path": path, "error": str(exc)},
            ) from exc

        if not isinstance(payload, dict):
            raise SnapshotRestorationError(
                "Snapshot payload is not a dict",
                detail={"path": path, "type": type(payload).__name__},
            )

        sequence = payload.get("sequence", 0)
        mmr_root_hex = payload.get("mmr_root", "")
        try:
            mmr_root = bytes.fromhex(mmr_root_hex)
        except (ValueError, TypeError) as exc:
            raise SnapshotRestorationError(
                f"Invalid mmr_root in snapshot: {exc}",
                detail={"path": path, "error": str(exc)},
            ) from exc

        # Compute integrity hash
        snap_hash = hash_snapshot(data)
        created_at = time.time()

        try:
            self._storage.begin_transaction()
            cursor = self._storage.execute(
                """
                INSERT INTO snapshots (sequence, mmr_root, data, created_at, hash)
                VALUES (?, ?, ?, ?, ?)
                """,
                (sequence, mmr_root, data, created_at, snap_hash),
            )
            row_id = cursor.lastrowid
            self._storage.commit()
        except DatabaseError as exc:
            try:
                self._storage.rollback()
            except DatabaseError:
                pass
            raise SnapshotCreationError(
                f"Failed to store imported snapshot: {exc}",
                detail={"path": path, "error": str(exc)},
            ) from exc

        return Snapshot(
            id=row_id,
            sequence=sequence,
            mmr_root=mmr_root,
            data=data,
            created_at=created_at,
            hash=snap_hash,
        )
