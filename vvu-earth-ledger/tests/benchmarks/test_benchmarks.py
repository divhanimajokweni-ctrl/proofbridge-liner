"""Performance benchmarks for the ledger."""

from __future__ import annotations

import time

import pytest

from production_ledger.config import DatabaseConfig, LedgerConfig
from production_ledger.hashing import hash_payload
from production_ledger.ledger import Ledger
from production_ledger.mmr import MerkleMountainRange, _leaf_pos
from production_ledger.replay import ReplayEngine


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def ledger_config(tmp_path: object) -> LedgerConfig:
    """Create a LedgerConfig with a temporary database path."""
    db_path = str(tmp_path) + "/test_bench.db"  # type: ignore[union-attr]
    return LedgerConfig(
        database=DatabaseConfig(db_path=db_path),
    )


# ---------------------------------------------------------------------------
# Append throughput
# ---------------------------------------------------------------------------

class TestAppendThroughput:
    def test_append_throughput(self, ledger_config: LedgerConfig) -> None:
        """Measure append throughput (entries per second)."""
        lg = Ledger(ledger_config)
        lg.open()

        num_entries = 100
        start = time.monotonic()
        for i in range(num_entries):
            lg.append(f"benchmark entry {i}".encode())
        elapsed = time.monotonic() - start

        throughput = num_entries / elapsed
        lg.close()

        # Basic sanity: we should be able to do at least 50 appends/sec
        # on a local SQLite database
        assert throughput > 50, f"Append throughput too low: {throughput:.1f} entries/sec"


# ---------------------------------------------------------------------------
# Replay speed
# ---------------------------------------------------------------------------

class TestReplaySpeed:
    def test_replay_speed(self, ledger_config: LedgerConfig) -> None:
        """Measure replay speed (entries per second)."""
        lg = Ledger(ledger_config)
        lg.open()

        num_entries = 50
        for i in range(num_entries):
            lg.append(f"benchmark entry {i}".encode())
        lg.close()

        engine = ReplayEngine(ledger_config)
        start = time.monotonic()
        result = engine.replay()
        elapsed = time.monotonic() - start

        assert result.success
        replay_speed = num_entries / elapsed

        # Basic sanity: replay should be at least 25 entries/sec
        assert replay_speed > 25, f"Replay speed too low: {replay_speed:.1f} entries/sec"


# ---------------------------------------------------------------------------
# Proof generation
# ---------------------------------------------------------------------------

class TestProofGeneration:
    def test_proof_generation(self, ledger_config: LedgerConfig) -> None:
        """Measure proof generation time."""
        lg = Ledger(ledger_config)
        lg.open()

        num_entries = 50
        for i in range(num_entries):
            lg.append(f"benchmark entry {i}".encode())

        # Generate proofs for all entries
        start = time.monotonic()
        for i in range(num_entries):
            proof = lg.get_proof(i)
            assert lg.verify_proof(i, proof)
        elapsed = time.monotonic() - start

        proof_time_ms = (elapsed / num_entries) * 1000
        lg.close()

        # Each proof should take less than 100ms on average
        assert proof_time_ms < 100, f"Proof generation too slow: {proof_time_ms:.2f}ms/proof"
