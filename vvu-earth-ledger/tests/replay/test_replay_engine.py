"""Tests for the replay engine."""

from __future__ import annotations

import os

import pytest

from production_ledger.config import DatabaseConfig, LedgerConfig
from production_ledger.ledger import Ledger
from production_ledger.replay import ReplayEngine, ReplayResult


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def ledger_config(tmp_path: object) -> LedgerConfig:
    """Create a LedgerConfig with a temporary database path."""
    db_path = str(tmp_path) + "/test_replay.db"  # type: ignore[union-attr]
    return LedgerConfig(
        database=DatabaseConfig(db_path=db_path),
    )


@pytest.fixture
def ledger_with_entries(ledger_config: LedgerConfig) -> Ledger:
    """Create a ledger with some entries."""
    lg = Ledger(ledger_config)
    lg.open()
    for i in range(5):
        lg.append(f"entry {i}".encode())
    return lg


# ---------------------------------------------------------------------------
# Empty ledger
# ---------------------------------------------------------------------------

class TestReplayEmptyLedger:
    def test_replay_empty_ledger(self, ledger_config: LedgerConfig) -> None:
        """Replay an empty ledger succeeds."""
        lg = Ledger(ledger_config)
        lg.open()
        lg.close()

        engine = ReplayEngine(ledger_config)
        result = engine.replay()
        assert result.success
        assert result.total_entries == 0


# ---------------------------------------------------------------------------
# Ledger with entries
# ---------------------------------------------------------------------------

class TestReplayWithEntries:
    def test_replay_with_entries(self, ledger_config: LedgerConfig) -> None:
        """Replay a ledger with entries succeeds."""
        lg = Ledger(ledger_config)
        lg.open()
        for i in range(5):
            lg.append(f"entry {i}".encode())
        lg.close()

        engine = ReplayEngine(ledger_config)
        result = engine.replay()
        assert result.success
        assert result.verified_entries > 0


# ---------------------------------------------------------------------------
# Tampering detection
# ---------------------------------------------------------------------------

class TestReplayDetectsTampering:
    def test_replay_detects_tampering(self, ledger_config: LedgerConfig) -> None:
        """Replay detects modified payload data."""
        lg = Ledger(ledger_config)
        lg.open()
        lg.append(b"original data")
        lg.close()

        # Tamper with the payload directly in the database
        db_config = ledger_config.database
        import sqlite3
        conn = sqlite3.connect(db_config.db_path)
        # Update the payload to something different
        conn.execute("UPDATE entries SET payload = ? WHERE sequence = 0", (b"tampered data",))
        conn.commit()
        conn.close()

        engine = ReplayEngine(ledger_config)
        result = engine.replay()
        # The replay should detect hash mismatches
        assert not result.success or len(result.violations) > 0
