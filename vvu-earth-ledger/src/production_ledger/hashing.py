"""VVU Earth Tech Ledger — Domain-separated SHA-256 hashing.

Every hash function in this module prepends a domain-specific prefix before
computing the SHA-256 digest.  The construction is::

    domain_hash(domain, data) = SHA-256(domain ‖ len(domain)₄ ‖ data)

where ``len(domain)₄`` is the domain length encoded as a 4-byte big-endian
unsigned integer.  This ensures that hashes computed under different domains
are cryptographically independent even if the payload data is identical.

All public functions return 32-byte SHA-256 digests.
"""

from __future__ import annotations

import hashlib

from .constants import (
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
from .exceptions import DomainViolationError, HashError


# ---------------------------------------------------------------------------
# Core primitive
# ---------------------------------------------------------------------------

def domain_hash(domain: bytes, data: bytes) -> bytes:
    """Compute a domain-separated SHA-256 hash.

    The construction is::

        SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ data)

    Args:
        domain: Domain separation prefix (e.g. ``DOMAIN_PAYLOAD``).
        data:   Arbitrary payload bytes.

    Returns:
        32-byte SHA-256 digest.

    Raises:
        HashError: If *domain* is empty.
    """
    if not domain:
        raise DomainViolationError(b"", detail={"reason": "domain prefix must not be empty"})
    if not isinstance(data, bytes):
        raise HashError(
            f"data must be bytes, got {type(data).__name__}",
            code="HASH_INVALID_INPUT",
            detail={"expected": "bytes", "got": type(data).__name__},
        )
    h = hashlib.sha256()
    h.update(domain)
    h.update(len(domain).to_bytes(4, "big"))
    h.update(data)
    return h.digest()


# ---------------------------------------------------------------------------
# Domain-specific convenience functions
# ---------------------------------------------------------------------------

def hash_payload(data: bytes) -> bytes:
    """Hash a payload using the ``VVU:PAYLOAD:1:`` domain.

    Args:
        data: Raw payload bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    return domain_hash(DOMAIN_PAYLOAD, data)


def hash_envelope(data: bytes) -> bytes:
    """Hash an envelope using the ``VVU:ENVELOPE:1:`` domain.

    Args:
        data: Raw envelope bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    return domain_hash(DOMAIN_ENVELOPE, data)


def hash_revision(data: bytes) -> bytes:
    """Hash a revision using the ``VVU:REVISION:1:`` domain.

    Args:
        data: Raw revision bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    return domain_hash(DOMAIN_REVISION, data)


def hash_mmr_leaf(data: bytes) -> bytes:
    """Hash an MMR leaf.

    The leaf hash prepends the ``LEAF_HASH_PREFIX`` (0x00) byte before
    hashing with the ``VVU:MMR:INT:1:`` domain::

        SHA-256(DOMAIN_MMR_INTERNAL ‖ len(…) ‖ 0x00 ‖ data)

    Args:
        data: Raw leaf data bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    prefixed = bytes([LEAF_HASH_PREFIX]) + data
    return domain_hash(DOMAIN_MMR_INTERNAL, prefixed)


def hash_mmr_branch(left: bytes, right: bytes) -> bytes:
    """Hash an MMR branch (internal) node.

    The branch hash prepends the ``BRANCH_HASH_PREFIX`` (0x01) byte,
    then concatenates the left and right child hashes, and hashes with
    the ``VVU:MMR:INT:1:`` domain::

        SHA-256(DOMAIN_MMR_INTERNAL ‖ len(…) ‖ 0x01 ‖ left ‖ right)

    Args:
        left:  Left child hash (32 bytes).
        right: Right child hash (32 bytes).

    Returns:
        32-byte SHA-256 digest.
    """
    prefixed = bytes([BRANCH_HASH_PREFIX]) + left + right
    return domain_hash(DOMAIN_MMR_INTERNAL, prefixed)


def hash_mmr_bagging(peaks: list[bytes]) -> bytes:
    """Compute the MMR root via bagging of peaks.

    If there are no peaks, returns the zero hash (SHA-256 of empty input
    under the ``VVU:MMR:BAG:1:`` domain).

    If there is a single peak, returns that peak directly.

    Otherwise, iteratively hashes peak pairs from right to left::

        acc = peaks[-1]
        for peak in peaks[-2::-1]:
            acc = SHA-256(DOMAIN_MMR_BAGGING ‖ len(…) ‖ peak ‖ acc)

    Args:
        peaks: Ordered list of MMR peak hashes (each 32 bytes).

    Returns:
        32-byte SHA-256 digest (the bagged root).

    Raises:
        HashError: If any peak is not 32 bytes.
    """
    if not peaks:
        return domain_hash(DOMAIN_MMR_BAGGING, b"")

    for i, p in enumerate(peaks):
        if len(p) != 32:
            raise HashError(
                f"MMR peak at index {i} is {len(p)} bytes, expected 32",
                code="HASH_MMR_PEAK_SIZE",
                detail={"index": i, "actual_size": len(p), "expected_size": 32},
            )

    if len(peaks) == 1:
        return peaks[0]

    # Bag right-to-left: hash consecutive pairs under the bagging domain.
    acc = peaks[-1]
    for peak in reversed(peaks[:-1]):
        acc = domain_hash(DOMAIN_MMR_BAGGING, peak + acc)
    return acc


def hash_snapshot(data: bytes) -> bytes:
    """Hash a snapshot using the ``VVU:SNAP:1:`` domain.

    Args:
        data: Raw snapshot bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    return domain_hash(DOMAIN_SNAPSHOT, data)


def hash_proof(data: bytes) -> bytes:
    """Hash a proof using the ``VVU:PROOF:1:`` domain.

    Args:
        data: Raw proof bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    return domain_hash(DOMAIN_PROOF, data)


def hash_key_rotation(data: bytes) -> bytes:
    """Hash key rotation data using the ``VVU:KEYROT:1:`` domain.

    Args:
        data: Raw key rotation bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    return domain_hash(DOMAIN_KEY_ROTATION, data)
