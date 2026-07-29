"""Integration tests for the full ledger lifecycle."""

from __future__ import annotations

import os
import tempfile

import pytest

from production_ledger.config import DatabaseConfig, LedgerConfig
from production_ledger.ledger import Ledger
from production_ledger.mmr import _leaf_pos


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def ledger_config(tmp_path: object) -> LedgerConfig:
    """Create a LedgerConfig with a temporary database path."""
    db_path = str(tmp_path) + "/test_ledger.db"  # type: ignore[union-attr]
    return LedgerConfig(
        database=DatabaseConfig(db_path=db_path),
    )


@pytest.fixture
def ledger(ledger_config: LedgerConfig) -> Ledger:
    """Create and open a ledger."""
    lg = Ledger(ledger_config)
    lg.open()
    yield lg
    lg.close()


# ---------------------------------------------------------------------------
# Init and open
# ---------------------------------------------------------------------------

class TestInitAndOpen:
    def test_init_and_open(self, ledger_config: LedgerConfig) -> None:
        """Initialize and open a ledger."""
        ledger = Ledger(ledger_config)
        ledger.open()
        assert ledger.get_sequence() == -1
        ledger.close()

    def test_open_twice_is_safe(self, ledger_config: LedgerConfig) -> None:
        """Opening an already-open ledger is safe."""
        ledger = Ledger(ledger_config)
        ledger.open()
        ledger.open()  # should not raise
        ledger.close()


# ---------------------------------------------------------------------------
# Append
# ---------------------------------------------------------------------------

class TestAppend:
    def test_append_entry(self, ledger: Ledger) -> None:
        """Append a single entry."""
        env = ledger.append(b"hello world")
        assert env.sequence == 0
        assert env.payload == b"hello world"
        assert ledger.get_sequence() == 0

    def test_append_multiple(self, ledger: Ledger) -> None:
        """Append multiple entries."""
        for i in range(5):
            env = ledger.append(f"entry {i}".encode())
            assert env.sequence == i

        assert ledger.get_sequence() == 4


# ---------------------------------------------------------------------------
# Chain verification
# ---------------------------------------------------------------------------

class TestVerifyChain:
    def test_verify_chain(self, ledger: Ledger) -> None:
        """Verify chain integrity after appending entries."""
        for i in range(5):
            ledger.append(f"entry {i}".encode())

        assert ledger.verify_chain()

    def test_verify_chain_single_entry(self, ledger: Ledger) -> None:
        """Verify chain with a single entry."""
        ledger.append(b"only entry")
        assert ledger.verify_chain()


# ---------------------------------------------------------------------------
# Get entry
# ---------------------------------------------------------------------------

class TestGetEntry:
    def test_get_entry(self, ledger: Ledger) -> None:
        """Retrieve entry by sequence number."""
        ledger.append(b"first")
        ledger.append(b"second")

        entry = ledger.get_entry(0)
        assert entry is not None
        assert entry.payload == b"first"

        entry = ledger.get_entry(1)
        assert entry is not None
        assert entry.payload == b"second"

    def test_get_entry_nonexistent(self, ledger: Ledger) -> None:
        """Non-existent entry returns None."""
        assert ledger.get_entry(999) is None


# ---------------------------------------------------------------------------
# Snapshots
# ---------------------------------------------------------------------------

class TestSnapshot:
    def test_create_snapshot(self, ledger: Ledger) -> None:
        """Create and verify a snapshot."""
        for i in range(3):
            ledger.append(f"entry {i}".encode())

        snapshot = ledger.create_snapshot()
        assert snapshot.sequence == 2
        assert len(snapshot.mmr_root) == 32
        assert len(snapshot.hash) == 32

        # Verify the snapshot
        if ledger._snapshot_manager is not None:
            assert ledger._snapshot_manager.verify_snapshot(snapshot.id)


# ---------------------------------------------------------------------------
# Inclusion proofs
# ---------------------------------------------------------------------------

class TestInclusionProof:
    def test_inclusion_proof(self, ledger: Ledger) -> None:
        """Generate and verify inclusion proof."""
        for i in range(5):
            ledger.append(f"entry {i}".encode())

        proof = ledger.get_proof(0)
        assert ledger.verify_proof(0, proof)

        proof = ledger.get_proof(4)
        assert ledger.verify_proof(4, proof)


# ---------------------------------------------------------------------------
# Key rotation
# ---------------------------------------------------------------------------

class TestKeyRotation:
    def test_key_rotation(self, ledger: Ledger) -> None:
        """Rotate key and verify new entries are signed with the new key."""
        # Sign with original key
        env1 = ledger.append(b"before rotation")
        assert env1.key_version == 1

        # Rotate
        new_kp = ledger.signer.rotate_key()
        assert new_kp.version == 2

        # New entries should be signed with the new key
        env2 = ledger.append(b"after rotation")
        assert env2.key_version == 2

        # Chain should still be valid
        assert ledger.verify_chain()
