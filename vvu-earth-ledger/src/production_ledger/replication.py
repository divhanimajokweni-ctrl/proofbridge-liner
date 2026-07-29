"""VVU Earth Tech Ledger — Replication manager.

The :class:`ReplicationManager` tracks replication state for the ledger.
This module provides the **interface only** — no network replication is
implemented yet.  It tracks local state and exposes the APIs that a future
network transport will consume.

When network replication is implemented, the manager will:

* Track known peers and their last-known sequence numbers.
* Detect replication lag by comparing the local sequence with the
  highest known peer sequence.
* Provide sync request/response handling via the
  :class:`ReplicationProtocol`.

Usage::

    from production_ledger.ledger import Ledger
    from production_ledger.config import LedgerConfig
    from production_ledger.replication import ReplicationManager

    config = LedgerConfig.default()
    ledger = Ledger(config)
    ledger.open()

    repl = ReplicationManager(ledger, config)
    status = repl.get_status()
    lag = repl.get_lag()
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

from .config import LedgerConfig
from .ledger import Ledger


# ---------------------------------------------------------------------------
# Peer record
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PeerInfo:
    """Information about a known replication peer.

    Attributes:
        peer_id:    Unique identifier for the peer (e.g. hex-encoded public key).
        address:    Network address of the peer (e.g. ``"host:port"``).
        last_sequence: Last-known sequence number on this peer.
        last_seen:  POSIX timestamp of the last successful contact.
        is_active:  Whether the peer is currently reachable.
    """

    peer_id: str
    address: str
    last_sequence: int
    last_seen: float
    is_active: bool


# ---------------------------------------------------------------------------
# Replication status
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ReplicationStatus:
    """Current replication status.

    Attributes:
        local_sequence:  The local ledger sequence number.
        highest_known:   The highest sequence number known across all peers.
        lag:             Entries behind the highest-known peer.
        peer_count:      Number of known peers.
        active_peers:    Number of reachable peers.
        is_synced:       Whether the local ledger is up to date.
        last_sync_at:    POSIX timestamp of the last successful sync.
    """

    local_sequence: int
    highest_known: int
    lag: int
    peer_count: int
    active_peers: int
    is_synced: bool
    last_sync_at: float | None


# ---------------------------------------------------------------------------
# Replication manager
# ---------------------------------------------------------------------------

class ReplicationManager:
    """Manages ledger replication (interface only — no network replication yet).

    The manager tracks local replication state and provides APIs for
    peer discovery, sync status, and lag detection.  When network
    replication is implemented, this class will coordinate with the
    :class:`ReplicationProtocol` to exchange entries with peers.

    Args:
        ledger: An open :class:`Ledger` instance.
        config: A frozen :class:`LedgerConfig` instance.
    """

    def __init__(self, ledger: Ledger, config: LedgerConfig) -> None:
        """Initialize the replication manager.

        Args:
            ledger: An open :class:`Ledger` instance.
            config: A frozen :class:`LedgerConfig` instance.
        """
        self._ledger = ledger
        self._config = config
        self._peers: dict[str, PeerInfo] = {}
        self._last_sync_at: float | None = None

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def get_status(self) -> dict:
        """Get replication status.

        Returns:
            A dictionary with keys: ``local_sequence``, ``highest_known``,
            ``lag``, ``peer_count``, ``active_peers``, ``is_synced``,
            ``last_sync_at``.
        """
        status = self._build_status()
        return {
            "local_sequence": status.local_sequence,
            "highest_known": status.highest_known,
            "lag": status.lag,
            "peer_count": status.peer_count,
            "active_peers": status.active_peers,
            "is_synced": status.is_synced,
            "last_sync_at": status.last_sync_at,
        }

    # ------------------------------------------------------------------
    # Peers
    # ------------------------------------------------------------------

    def get_peers(self) -> list[dict]:
        """Get known peers.

        Returns:
            A list of dictionaries, each with keys: ``peer_id``,
            ``address``, ``last_sequence``, ``last_seen``, ``is_active``.
        """
        return [
            {
                "peer_id": peer.peer_id,
                "address": peer.address,
                "last_sequence": peer.last_sequence,
                "last_seen": peer.last_seen,
                "is_active": peer.is_active,
            }
            for peer in self._peers.values()
        ]

    def add_peer(self, peer_id: str, address: str, last_sequence: int = -1) -> None:
        """Add a known peer.

        Args:
            peer_id:       Unique identifier for the peer.
            address:       Network address of the peer.
            last_sequence: Last-known sequence number on this peer.
        """
        self._peers[peer_id] = PeerInfo(
            peer_id=peer_id,
            address=address,
            last_sequence=last_sequence,
            last_seen=time.time(),
            is_active=True,
        )

    def remove_peer(self, peer_id: str) -> None:
        """Remove a known peer.

        Args:
            peer_id: The identifier of the peer to remove.
        """
        self._peers.pop(peer_id, None)

    def update_peer(self, peer_id: str, last_sequence: int) -> None:
        """Update a peer's last-known sequence number.

        Args:
            peer_id:       The identifier of the peer to update.
            last_sequence: The new last-known sequence number.
        """
        existing = self._peers.get(peer_id)
        if existing is not None:
            self._peers[peer_id] = PeerInfo(
                peer_id=existing.peer_id,
                address=existing.address,
                last_sequence=last_sequence,
                last_seen=time.time(),
                is_active=True,
            )

    # ------------------------------------------------------------------
    # Lag
    # ------------------------------------------------------------------

    def get_lag(self) -> int:
        """Get replication lag (entries behind).

        Compares the local sequence number with the highest known
        sequence across all peers.  Returns 0 if the local ledger is
        up to date or if there are no peers.

        Returns:
            The number of entries the local ledger is behind.
        """
        status = self._build_status()
        return status.lag

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _build_status(self) -> ReplicationStatus:
        """Build the current replication status.

        Returns:
            A :class:`ReplicationStatus` instance.
        """
        local_sequence = self._ledger.get_sequence()

        highest_known = local_sequence
        active_count = 0

        for peer in self._peers.values():
            if peer.last_sequence > highest_known:
                highest_known = peer.last_sequence
            if peer.is_active:
                active_count += 1

        lag = max(0, highest_known - local_sequence)
        is_synced = lag == 0

        return ReplicationStatus(
            local_sequence=local_sequence,
            highest_known=highest_known,
            lag=lag,
            peer_count=len(self._peers),
            active_peers=active_count,
            is_synced=is_synced,
            last_sync_at=self._last_sync_at,
        )

    def mark_synced(self) -> None:
        """Mark the current time as the last successful sync."""
        self._last_sync_at = time.time()
