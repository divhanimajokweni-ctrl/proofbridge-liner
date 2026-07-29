"""VVU Earth Tech Ledger — Replication protocol handler.

The :class:`ReplicationProtocol` defines the wire format and message
handling for ledger replication.  It works with the
:class:`ReplicationManager` to exchange entries between peers.

This module provides the **protocol interface only** — no network
transport is implemented yet.  The protocol is designed to be
transport-agnostic (usable over HTTP, gRPC, WebSocket, etc.).

Protocol messages
-----------------

* **SyncRequest** — a peer requests entries starting from a sequence.
* **SyncResponse** — the responding peer sends back the requested entries.

Each entry is serialised as a dictionary with hex-encoded binary fields
for safe transmission over text-based protocols.

Usage::

    from production_ledger.replication import ReplicationManager
    from production_ledger.replication_protocol import ReplicationProtocol

    manager = ReplicationManager(ledger, config)
    protocol = ReplicationProtocol(manager)

    # Handle an incoming sync request
    response = protocol.handle_sync_request(from_sequence=10)

    # Process a sync response from a peer
    count = protocol.handle_sync_response(response)
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from .envelopes import Envelope
from .ed25519 import Signature
from .replication import ReplicationManager


# ---------------------------------------------------------------------------
# Sync request / response data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SyncRequest:
    """A sync request from a peer.

    Attributes:
        from_sequence:  Request entries starting from this sequence number.
        requestor_id:   Identifier of the requesting peer.
        max_entries:    Maximum number of entries to return (default 1000).
    """

    from_sequence: int
    requestor_id: str
    max_entries: int = 1000


# ---------------------------------------------------------------------------
# Replication protocol
# ---------------------------------------------------------------------------

class ReplicationProtocol:
    """Protocol handler for ledger replication.

    Handles the serialisation and deserialisation of replication messages
    and delegates state management to the :class:`ReplicationManager`.

    Args:
        replication: A :class:`ReplicationManager` instance.
    """

    def __init__(self, replication: ReplicationManager) -> None:
        """Initialize the protocol handler.

        Args:
            replication: A :class:`ReplicationManager` instance.
        """
        self._replication = replication

    # ------------------------------------------------------------------
    # Sync request handling
    # ------------------------------------------------------------------

    def handle_sync_request(self, from_sequence: int) -> dict:
        """Handle a sync request from a peer.

        Returns entries from the local ledger starting at *from_sequence*
        up to the current sequence.  Each entry is formatted using
        :meth:`format_entry_for_sync`.

        Args:
            from_sequence: The sequence number to start from.

        Returns:
            A dictionary with keys: ``entries``, ``from_sequence``,
            ``to_sequence``, ``total_entries``, ``timestamp``.
        """
        ledger = self._replication._ledger
        current_sequence = ledger.get_sequence()

        entries: list[dict] = []
        for seq in range(from_sequence, current_sequence + 1):
            entry = ledger.get_entry(seq)
            if entry is not None:
                entries.append(self.format_entry_for_sync(entry))

        return {
            "entries": entries,
            "from_sequence": from_sequence,
            "to_sequence": current_sequence,
            "total_entries": len(entries),
            "timestamp": time.time(),
        }

    # ------------------------------------------------------------------
    # Sync response handling
    # ------------------------------------------------------------------

    def handle_sync_response(self, response: dict) -> int:
        """Handle a sync response from a peer.

        Parses the entries from the response and applies them to the
        local ledger.  Returns the number of entries that were
        successfully applied.

        Currently, this is a **no-op** because the ledger does not
        support importing entries from external sources (entries must
        be appended through the normal :meth:`Ledger.append` path
        to maintain hash chain integrity).  When full replication
        is implemented, this method will apply entries from the
        response and update the replication manager state.

        Args:
            response: A dictionary with the sync response data.

        Returns:
            The number of entries applied (currently always 0).
        """
        entries_data = response.get("entries", [])
        if not entries_data:
            return 0

        # Parse entries to validate the response format
        for entry_data in entries_data:
            try:
                self.parse_entry_from_sync(entry_data)
            except (KeyError, ValueError, TypeError):
                # Skip malformed entries
                continue

        # Update the peer's last-known sequence
        requestor_id = response.get("requestor_id", "")
        to_sequence = response.get("to_sequence", -1)
        if requestor_id:
            self._replication.update_peer(requestor_id, to_sequence)

        self._replication.mark_synced()

        # Return 0 because we cannot apply external entries yet
        # (the hash chain must be preserved)
        return 0

    # ------------------------------------------------------------------
    # Entry serialisation
    # ------------------------------------------------------------------

    def format_entry_for_sync(self, entry: Envelope) -> dict:
        """Format an entry for network transmission.

        Converts binary fields to hex strings for safe transmission
        over text-based protocols.

        Args:
            entry: An :class:`Envelope` to format.

        Returns:
            A dictionary with all envelope fields, binary data as
            hex strings.
        """
        return {
            "sequence": entry.sequence,
            "parent_hash": entry.parent_hash.hex(),
            "payload": entry.payload.hex(),
            "payload_hash": entry.payload_hash.hex(),
            "envelope_hash": entry.envelope_hash.hex(),
            "revision_hash": entry.revision_hash.hex(),
            "key_id": entry.key_id.hex(),
            "key_version": entry.key_version,
            "timestamp": entry.timestamp,
            "signature": {
                "key_id": entry.signature.key_id.hex(),
                "key_version": entry.signature.key_version,
                "signature": entry.signature.signature.hex(),
                "timestamp": entry.signature.timestamp,
            },
        }

    # ------------------------------------------------------------------
    # Entry deserialisation
    # ------------------------------------------------------------------

    def parse_entry_from_sync(self, data: dict) -> Envelope:
        """Parse an entry from network transmission.

        Converts hex strings back to binary fields and constructs
        an :class:`Envelope`.

        Args:
            data: A dictionary with envelope fields as hex strings.

        Returns:
            An :class:`Envelope` reconstructed from the data.

        Raises:
            KeyError: If a required field is missing.
            ValueError: If a hex string cannot be decoded.
        """
        signature_data = data["signature"]
        signature = Signature(
            key_id=bytes.fromhex(signature_data["key_id"]),
            key_version=signature_data["key_version"],
            signature=bytes.fromhex(signature_data["signature"]),
            timestamp=signature_data["timestamp"],
        )

        return Envelope(
            sequence=data["sequence"],
            parent_hash=bytes.fromhex(data["parent_hash"]),
            payload=bytes.fromhex(data["payload"]),
            payload_hash=bytes.fromhex(data["payload_hash"]),
            envelope_hash=bytes.fromhex(data["envelope_hash"]),
            revision_hash=bytes.fromhex(data["revision_hash"]),
            signature=signature,
            key_id=bytes.fromhex(data["key_id"]),
            key_version=data["key_version"],
            timestamp=data["timestamp"],
        )
