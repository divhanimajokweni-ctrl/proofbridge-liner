"""Tests for the domain-separated hashing module."""

from __future__ import annotations

import hashlib

import pytest

from production_ledger.constants import (
    BRANCH_HASH_PREFIX,
    DOMAIN_ENVELOPE,
    DOMAIN_KEY_ROTATION,
    DOMAIN_MMR_BAGGING,
    DOMAIN_MMR_INTERNAL,
    DOMAIN_PAYLOAD,
    DOMAIN_PROOF,
    DOMAIN_REVISION,
    DOMAIN_SNAPSHOT,
    LEAF_HASH_PREFIX,
)
from production_ledger.exceptions import DomainViolationError, HashError
from production_ledger.hashing import (
    domain_hash,
    hash_envelope,
    hash_key_rotation,
    hash_mmr_bagging,
    hash_mmr_branch,
    hash_mmr_leaf,
    hash_payload,
    hash_proof,
    hash_revision,
    hash_snapshot,
)


# ---------------------------------------------------------------------------
# domain_hash
# ---------------------------------------------------------------------------

class TestDomainHash:
    """Tests for the core domain_hash primitive."""

    def test_domain_separation(self) -> None:
        """Different domains produce different hashes for the same data."""
        data = b"hello world"
        h1 = domain_hash(DOMAIN_PAYLOAD, data)
        h2 = domain_hash(DOMAIN_ENVELOPE, data)
        assert h1 != h2

    def test_deterministic(self) -> None:
        """Same input always produces the same output."""
        data = b"deterministic test"
        h1 = domain_hash(DOMAIN_PAYLOAD, data)
        h2 = domain_hash(DOMAIN_PAYLOAD, data)
        assert h1 == h2

    def test_output_length(self) -> None:
        """All hashes are 32 bytes (SHA-256)."""
        h = domain_hash(DOMAIN_PAYLOAD, b"test")
        assert len(h) == 32

    def test_empty_domain_raises(self) -> None:
        """Empty domain prefix raises DomainViolationError."""
        with pytest.raises(DomainViolationError):
            domain_hash(b"", b"data")

    def test_non_bytes_data_raises(self) -> None:
        """Non-bytes data raises HashError."""
        with pytest.raises(HashError):
            domain_hash(DOMAIN_PAYLOAD, "not bytes")  # type: ignore[arg-type]

    def test_manual_construction(self) -> None:
        """Verify the hash construction matches the specification."""
        domain = DOMAIN_PAYLOAD
        data = b"manual verify"
        expected = hashlib.sha256(
            domain + len(domain).to_bytes(4, "big") + data
        ).digest()
        assert domain_hash(domain, data) == expected


# ---------------------------------------------------------------------------
# Convenience functions
# ---------------------------------------------------------------------------

class TestHashPayload:
    """Tests for hash_payload."""

    def test_correct_length_and_domain(self) -> None:
        """hash_payload produces 32 bytes under DOMAIN_PAYLOAD."""
        h = hash_payload(b"test payload")
        assert len(h) == 32
        # Verify it's equivalent to domain_hash with the same domain
        assert h == domain_hash(DOMAIN_PAYLOAD, b"test payload")

    def test_different_data_different_hash(self) -> None:
        """Different data produces different hashes."""
        h1 = hash_payload(b"data1")
        h2 = hash_payload(b"data2")
        assert h1 != h2


class TestHashEnvelope:
    """Tests for hash_envelope."""

    def test_correct_length_and_domain(self) -> None:
        """hash_envelope produces 32 bytes under DOMAIN_ENVELOPE."""
        h = hash_envelope(b"test envelope")
        assert len(h) == 32
        assert h == domain_hash(DOMAIN_ENVELOPE, b"test envelope")


class TestHashRevision:
    """Tests for hash_revision."""

    def test_correct_length_and_domain(self) -> None:
        """hash_revision produces 32 bytes under DOMAIN_REVISION."""
        h = hash_revision(b"test revision")
        assert len(h) == 32
        assert h == domain_hash(DOMAIN_REVISION, b"test revision")


class TestHashSnapshot:
    """Tests for hash_snapshot."""

    def test_correct_length_and_domain(self) -> None:
        """hash_snapshot produces 32 bytes under DOMAIN_SNAPSHOT."""
        h = hash_snapshot(b"test snapshot")
        assert len(h) == 32
        assert h == domain_hash(DOMAIN_SNAPSHOT, b"test snapshot")


class TestHashProof:
    """Tests for hash_proof."""

    def test_correct_length_and_domain(self) -> None:
        """hash_proof produces 32 bytes under DOMAIN_PROOF."""
        h = hash_proof(b"test proof")
        assert len(h) == 32
        assert h == domain_hash(DOMAIN_PROOF, b"test proof")


class TestHashKeyRotation:
    """Tests for hash_key_rotation."""

    def test_correct_length_and_domain(self) -> None:
        """hash_key_rotation produces 32 bytes under DOMAIN_KEY_ROTATION."""
        h = hash_key_rotation(b"test key rotation")
        assert len(h) == 32
        assert h == domain_hash(DOMAIN_KEY_ROTATION, b"test key rotation")


# ---------------------------------------------------------------------------
# MMR hashing
# ---------------------------------------------------------------------------

class TestHashMMRLeaf:
    """Tests for hash_mmr_leaf."""

    def test_includes_leaf_hash_prefix(self) -> None:
        """hash_mmr_leaf prepends LEAF_HASH_PREFIX (0x00) before hashing."""
        data = b"leaf data"
        h = hash_mmr_leaf(data)
        # Manually compute: domain_hash(DOMAIN_MMR_INTERNAL, 0x00 + data)
        expected = domain_hash(DOMAIN_MMR_INTERNAL, bytes([LEAF_HASH_PREFIX]) + data)
        assert h == expected

    def test_output_length(self) -> None:
        """Output is 32 bytes."""
        assert len(hash_mmr_leaf(b"test")) == 32


class TestHashMMRBranch:
    """Tests for hash_mmr_branch."""

    def test_includes_branch_hash_prefix(self) -> None:
        """hash_mmr_branch prepends BRANCH_HASH_PREFIX (0x01) before hashing."""
        left = b"\x00" * 32
        right = b"\x01" * 32
        h = hash_mmr_branch(left, right)
        expected = domain_hash(
            DOMAIN_MMR_INTERNAL,
            bytes([BRANCH_HASH_PREFIX]) + left + right,
        )
        assert h == expected

    def test_output_length(self) -> None:
        """Output is 32 bytes."""
        assert len(hash_mmr_branch(b"\x00" * 32, b"\x01" * 32)) == 32

    def test_order_matters(self) -> None:
        """Swapping left and right produces a different hash."""
        left = b"\xaa" * 32
        right = b"\xbb" * 32
        assert hash_mmr_branch(left, right) != hash_mmr_branch(right, left)


class TestHashMMRBagging:
    """Tests for hash_mmr_bagging."""

    def test_empty_peaks(self) -> None:
        """No peaks returns domain_hash of empty input under DOMAIN_MMR_BAGGING."""
        h = hash_mmr_bagging([])
        assert h == domain_hash(DOMAIN_MMR_BAGGING, b"")
        assert len(h) == 32

    def test_single_peak(self) -> None:
        """Single peak returns its hash directly."""
        peak = b"\xab" * 32
        assert hash_mmr_bagging([peak]) == peak

    def test_multiple_peaks(self) -> None:
        """Multiple peaks are iteratively hashed from right to left."""
        p1 = b"\x01" * 32
        p2 = b"\x02" * 32
        p3 = b"\x03" * 32

        # Manual: acc = p3; acc = domain_hash(BAG, p2 + acc); acc = domain_hash(BAG, p1 + acc)
        acc = p3
        acc = domain_hash(DOMAIN_MMR_BAGGING, p2 + acc)
        acc = domain_hash(DOMAIN_MMR_BAGGING, p1 + acc)
        assert hash_mmr_bagging([p1, p2, p3]) == acc

    def test_invalid_peak_size(self) -> None:
        """A peak that is not 32 bytes raises HashError."""
        with pytest.raises(HashError):
            hash_mmr_bagging([b"\x00" * 16])

    def test_two_peaks(self) -> None:
        """Two peaks bag correctly."""
        p1 = b"\x01" * 32
        p2 = b"\x02" * 32
        expected = domain_hash(DOMAIN_MMR_BAGGING, p1 + p2)
        assert hash_mmr_bagging([p1, p2]) == expected


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    """Edge-case tests for hashing."""

    def test_empty_input(self) -> None:
        """Handles empty bytes input."""
        h = hash_payload(b"")
        assert len(h) == 32
        assert h == domain_hash(DOMAIN_PAYLOAD, b"")

    def test_large_input(self) -> None:
        """Handles large input (1 MiB)."""
        data = b"\x42" * (1024 * 1024)
        h = hash_payload(data)
        assert len(h) == 32

    def test_all_domains_produce_different_hashes(self) -> None:
        """All defined domains produce different hashes for the same data."""
        data = b"common data"
        domains = [
            DOMAIN_PAYLOAD,
            DOMAIN_ENVELOPE,
            DOMAIN_REVISION,
            DOMAIN_MMR_INTERNAL,
            DOMAIN_MMR_BAGGING,
            DOMAIN_SNAPSHOT,
            DOMAIN_PROOF,
            DOMAIN_KEY_ROTATION,
        ]
        hashes = [domain_hash(d, data) for d in domains]
        # All hashes should be distinct
        assert len(set(hashes)) == len(hashes)
