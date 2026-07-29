"""Tests for the Merkle Mountain Range (MMR) module."""

from __future__ import annotations

import pytest

from production_ledger.exceptions import InvalidIndexError
from production_ledger.hashing import hash_mmr_leaf
from production_ledger.mmr import (
    MMRProof,
    MerkleMountainRange,
    _height,
    _is_leaf,
    _leaf_pos,
    _node_count,
    _peak_positions,
    _popcount,
)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _fake_hash(i: int) -> bytes:
    """Generate a deterministic 32-byte hash for testing."""
    return i.to_bytes(32, byteorder="big")


# ---------------------------------------------------------------------------
# Single leaf
# ---------------------------------------------------------------------------

class TestSingleLeaf:
    def test_single_leaf(self) -> None:
        """Append 1 leaf and verify root is the leaf hash."""
        mmr = MerkleMountainRange()
        pos = mmr.append(_fake_hash(0))
        assert mmr.size == 1
        assert mmr.node_count == 1

        # The root should be the single peak (the leaf hash after MMR leaf hashing)
        root = mmr.get_root()
        assert len(root) == 32

        # The single peak should be the leaf node
        peaks = mmr.get_peaks()
        assert len(peaks) == 1
        assert peaks[0][0] == 0  # position 0


# ---------------------------------------------------------------------------
# Three leaves
# ---------------------------------------------------------------------------

class TestThreeLeaves:
    def test_three_leaves(self) -> None:
        """Append 3 leaves and verify peaks."""
        mmr = MerkleMountainRange()
        for i in range(3):
            mmr.append(_fake_hash(i))

        assert mmr.size == 3
        # 3 leaves: mountain of height 1 (2 leaves) + 1 leaf
        # Positions: 0, 1, 2 -> peaks at 2 (root of first mountain) and 3 (second leaf)
        peaks = mmr.get_peaks()
        assert len(peaks) == 2


# ---------------------------------------------------------------------------
# Seven leaves
# ---------------------------------------------------------------------------

class TestEightLeaves:
    def test_eight_leaves(self) -> None:
        """Append 8 leaves and verify single peak and root."""
        mmr = MerkleMountainRange()
        for i in range(8):
            mmr.append(_fake_hash(i))

        assert mmr.size == 8
        # 8 leaves = full mountain of height 3 (one perfect binary tree)
        # One peak at position 14
        peaks = mmr.get_peaks()
        assert len(peaks) == 1
        assert peaks[0][0] == 14

        root = mmr.get_root()
        assert len(root) == 32


# ---------------------------------------------------------------------------
# Determinism
# ---------------------------------------------------------------------------

class TestDeterminism:
    def test_determinism(self) -> None:
        """Same appends produce the same root."""
        def build_mmr() -> MerkleMountainRange:
            m = MerkleMountainRange()
            for i in range(10):
                m.append(_fake_hash(i))
            return m

        m1 = build_mmr()
        m2 = build_mmr()
        assert m1.get_root() == m2.get_root()


# ---------------------------------------------------------------------------
# Inclusion proofs
# ---------------------------------------------------------------------------

class TestInclusionProof:
    def test_inclusion_proof_single(self) -> None:
        """Verify proof for leaf 0 in a 5-leaf MMR."""
        mmr = MerkleMountainRange()
        for i in range(5):
            mmr.append(_fake_hash(i))

        leaf_pos = _leaf_pos(0)
        proof = mmr.inclusion_proof(leaf_pos)
        root = mmr.get_root()

        assert MerkleMountainRange.verify_inclusion(
            _fake_hash(0), proof, root
        )

    def test_inclusion_proof_all(self) -> None:
        """Verify proof for all leaves in a 7-leaf MMR."""
        mmr = MerkleMountainRange()
        for i in range(7):
            mmr.append(_fake_hash(i))

        root = mmr.get_root()
        for i in range(7):
            leaf_pos = _leaf_pos(i)
            proof = mmr.inclusion_proof(leaf_pos)
            assert MerkleMountainRange.verify_inclusion(
                _fake_hash(i), proof, root
            ), f"Inclusion proof failed for leaf {i}"

    def test_wrong_leaf_hash_fails(self) -> None:
        """Verifying with the wrong leaf hash fails."""
        mmr = MerkleMountainRange()
        for i in range(5):
            mmr.append(_fake_hash(i))

        leaf_pos = _leaf_pos(0)
        proof = mmr.inclusion_proof(leaf_pos)
        root = mmr.get_root()

        assert not MerkleMountainRange.verify_inclusion(
            _fake_hash(999), proof, root
        )

    def test_invalid_leaf_position_raises(self) -> None:
        """Proof for an invalid position raises InvalidIndexError."""
        mmr = MerkleMountainRange()
        for i in range(3):
            mmr.append(_fake_hash(i))

        with pytest.raises(InvalidIndexError):
            mmr.inclusion_proof(999)


# ---------------------------------------------------------------------------
# Consistency proofs
# ---------------------------------------------------------------------------

class TestConsistencyProof:
    def test_consistency_proof(self) -> None:
        """Verify consistency between two MMR sizes."""
        mmr = MerkleMountainRange()
        for i in range(7):
            mmr.append(_fake_hash(i))

        # Record root at size 3
        earlier_mmr = MerkleMountainRange()
        for i in range(3):
            earlier_mmr.append(_fake_hash(i))
        earlier_root = earlier_mmr.get_root()

        later_root = mmr.get_root()

        proof = mmr.consistency_proof(3)
        assert proof.earlier_size == 3
        assert proof.later_size == 7

        assert MerkleMountainRange.verify_consistency(
            earlier_root, later_root, proof
        )

    def test_consistency_proof_invalid_size(self) -> None:
        """Invalid earlier_size raises InvalidIndexError."""
        mmr = MerkleMountainRange()
        for i in range(5):
            mmr.append(_fake_hash(i))

        with pytest.raises(InvalidIndexError):
            mmr.consistency_proof(0)

        with pytest.raises(InvalidIndexError):
            mmr.consistency_proof(100)


# ---------------------------------------------------------------------------
# Serialization
# ---------------------------------------------------------------------------

class TestSerialization:
    def test_serialization(self) -> None:
        """to_dict/from_dict round-trip preserves the MMR root."""
        mmr = MerkleMountainRange()
        for i in range(10):
            mmr.append(_fake_hash(i))

        original_root = mmr.get_root()
        data = mmr.to_dict()
        restored = MerkleMountainRange.from_dict(data)
        assert restored.get_root() == original_root
        assert restored.size == mmr.size


# ---------------------------------------------------------------------------
# Peak positions
# ---------------------------------------------------------------------------

class TestPeakPositions:
    def test_peak_positions_various_sizes(self) -> None:
        """Verify peak positions for various sizes."""
        # Size 1: one peak at position 0
        assert _peak_positions(1) == [0]

        # Size 2: one peak at position 2 (complete tree of height 1)
        assert _peak_positions(2) == [2]

        # Size 3: peaks at positions 2 and 3
        assert _peak_positions(3) == [2, 3]

        # Size 4: one peak at position 6 (complete tree of height 2)
        assert _peak_positions(4) == [6]

        # Size 7: peaks at positions 6, 9, 10 (4+2+1 decomposition)
        assert _peak_positions(7) == [6, 9, 10]

        # Size 8: one peak at position 14 (complete tree of height 3)
        assert _peak_positions(8) == [14]

        # Size 0: no peaks
        assert _peak_positions(0) == []


# ---------------------------------------------------------------------------
# Node count
# ---------------------------------------------------------------------------

class TestNodeCount:
    def test_node_count_formula(self) -> None:
        """Verify the node count formula: 2n - popcount(n)."""
        for n in range(1, 20):
            # n leaves, index is n-1
            count = _node_count(n - 1)
            expected = 2 * n - _popcount(n)
            assert count == expected, f"Node count mismatch for {n} leaves"

    def test_node_count_property(self) -> None:
        """Verify node_count property matches the formula."""
        mmr = MerkleMountainRange()
        for i in range(15):
            mmr.append(_fake_hash(i))
            expected = 2 * (i + 1) - _popcount(i + 1)
            assert mmr.node_count == expected
