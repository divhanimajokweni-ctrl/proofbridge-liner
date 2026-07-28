"""VVU Earth Tech Ledger — Merkle Mountain Range (MMR).

Implements a Merkle Mountain Range following the specification from
https://github.com/mimblewimble/grin/blob/master/doc/mmr.md

An MMR is a forest of perfect binary trees (mountains).  Leaves are
appended sequentially and the root is computed by *bagging* all peaks.
Supports inclusion proofs and consistency proofs.

All hashes are 32-byte SHA-256 digests produced by the domain-separated
hashing helpers in :mod:`production_ledger.hashing`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .hashing import hash_mmr_bagging, hash_mmr_branch, hash_mmr_leaf
from .exceptions import InvalidIndexError, InvalidProofError, RootMismatchError


# ---------------------------------------------------------------------------
# Internal helper – popcount
# ---------------------------------------------------------------------------

def _popcount(n: int) -> int:
    """Return the number of 1-bits in the binary representation of *n*."""
    return bin(n).count("1")


# ---------------------------------------------------------------------------
# Height function
# ---------------------------------------------------------------------------

def _height(pos: int) -> int:
    """Return the height of the MMR node at *pos* (0-indexed).

    A leaf has height 0.  The height is determined by decomposing
    ``pos + 1`` into a sum of mountain sizes (``2^(h+1) - 1``) from
    largest to smallest; the height of the *last* mountain in the
    decomposition is the node's height.
    """
    n = pos + 1
    while True:
        h = n.bit_length() - 1           # floor(log2(n))
        mountain_size = (1 << (h + 1)) - 1
        if mountain_size > n:
            h -= 1
            mountain_size = (1 << (h + 1)) - 1
        if n == mountain_size:
            return h
        n -= mountain_size


# ---------------------------------------------------------------------------
# Module-level helper functions
# ---------------------------------------------------------------------------

def _node_count(index: int) -> int:
    """Return the total number of MMR nodes up to and including leaf *index*.

    *index* is 0-based, so ``_node_count(0) == 1`` (one leaf, zero
    internal nodes).
    """
    n = index + 1
    return 2 * n - _popcount(n)


def _is_leaf(pos: int) -> bool:
    """Return ``True`` if the MMR node at *pos* is a leaf (height 0)."""
    return _height(pos) == 0


def _leaf_index(pos: int) -> int:
    """Convert a node position to its leaf index (0-based).

    Returns the number of leaves that appear at positions strictly less
    than *pos*.  For a leaf node this is exactly its index; for an
    internal node it is the index of the first leaf in its subtree.
    """
    if pos <= 0:
        return 0
    # Binary search: find the largest i such that _leaf_pos(i) < pos
    lo, hi = 0, pos
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if _leaf_pos(mid) < pos:
            lo = mid
        else:
            hi = mid - 1
    return lo + 1


def _leaf_pos(index: int) -> int:
    """Convert a leaf index (0-based) to its node position in the MMR."""
    return 2 * index - _popcount(index)


def _peak_positions(size: int) -> list[int]:
    """Return the positions of all peaks for an MMR with *size* leaves.

    The peaks are ordered from left (largest mountain) to right
    (smallest mountain).
    """
    if size <= 0:
        return []
    peaks: list[int] = []
    offset = 0  # cumulative number of nodes from previous mountains
    remaining = size
    while remaining > 0:
        h = remaining.bit_length() - 1  # floor(log2(remaining))
        mountain_leaves = 1 << h
        # Peak of a mountain of height h is at position:
        #   offset + 2^(h+1) - 2
        peak_pos = offset + (1 << (h + 1)) - 2
        peaks.append(peak_pos)
        offset += (1 << (h + 1)) - 1  # mountain node count
        remaining -= mountain_leaves
    return peaks


def _is_right_child(pos: int) -> bool:
    """Return ``True`` if *pos* is a right child in the MMR tree."""
    h = _height(pos)
    # A node is a right child iff the node at (pos+1) has height > h.
    return _height(pos + 1) > h


def _sibling(pos: int, size: int) -> int | None:
    """Return the sibling position of node *pos*, or ``None``."""
    total = _node_count(size - 1) if size > 0 else 0
    h = _height(pos)
    if _is_right_child(pos):
        sib = pos - ((1 << (h + 1)) - 1)
    else:
        sib = pos + ((1 << (h + 1)) - 1)
    if 0 <= sib < total:
        return sib
    return None


def _parent(pos: int, size: int) -> int | None:
    """Return the parent position of node *pos*, or ``None``."""
    total = _node_count(size - 1) if size > 0 else 0
    h = _height(pos)
    if _is_right_child(pos):
        p = pos + 1
    else:
        p = pos + (1 << (h + 1))
    if 0 <= p < total:
        return p
    return None


def _left_child(pos: int) -> int:
    """Return the left child position of node *pos*.

    Assumes *pos* is an internal node (height > 0).
    """
    h = _height(pos)
    return pos - (1 << h)


def _right_child(pos: int) -> int:
    """Return the right child position of node *pos*.

    Assumes *pos* is an internal node (height > 0).
    """
    return pos - 1


def _is_peak(pos: int, size: int) -> bool:
    """Return ``True`` if *pos* is a peak in the MMR with *size* leaves."""
    return _parent(pos, size) is None


# ---------------------------------------------------------------------------
# Proof data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class MMRProof:
    """Inclusion proof for a single leaf in an MMR.

    Attributes:
        leaf_position: Position of the leaf being proven.
        leaf_hash:     Hash of the leaf.
        path:          Sibling (position, hash) pairs from leaf to peak.
        peaks:         All (position, hash) pairs for peaks at proof time.
        mmr_size:      Number of leaves in the MMR at proof time.
    """

    leaf_position: int
    leaf_hash: bytes
    path: list[tuple[int, bytes]]
    peaks: list[tuple[int, bytes]]
    mmr_size: int


@dataclass(frozen=True)
class MMRConsistencyProof:
    """Consistency proof between two MMR sizes.

    Attributes:
        earlier_size:  Number of leaves in the earlier MMR.
        later_size:    Number of leaves in the later MMR.
        earlier_peaks: (position, hash) pairs for peaks at the earlier size.
        later_peaks:   (position, hash) pairs for peaks at the later size.
        proof_hashes:  Additional hashes needed to verify consistency.
    """

    earlier_size: int
    later_size: int
    earlier_peaks: list[tuple[int, bytes]]
    later_peaks: list[tuple[int, bytes]]
    proof_hashes: list[bytes]


# ---------------------------------------------------------------------------
# MerkleMountainRange class
# ---------------------------------------------------------------------------

class MerkleMountainRange:
    """Append-only Merkle Mountain Range.

    Leaves are added via :meth:`append`; the root hash is computed by
    *bagging* the mountain peaks.  Inclusion and consistency proofs are
    supported.
    """

    def __init__(self) -> None:
        self._size: int = 0          # number of leaves
        self._nodes: dict[int, bytes] = {}  # position → hash

    # -- properties --------------------------------------------------------

    @property
    def size(self) -> int:
        """Number of leaves in the MMR."""
        return self._size

    @property
    def node_count(self) -> int:
        """Total number of nodes (leaves + internal)."""
        if self._size == 0:
            return 0
        return _node_count(self._size - 1)

    # -- core mutator ------------------------------------------------------

    def append(self, leaf_hash: bytes) -> int:
        """Append a leaf and return its position.

        Computes and stores parent hashes as needed.
        """
        pos = self.node_count  # next available position
        self._nodes[pos] = hash_mmr_leaf(leaf_hash)
        self._size += 1

        # Number of new parent nodes = number of trailing 0-bits in
        # the new leaf count (1-indexed).
        new_leaves = self._size
        num_parents = 0
        tmp = new_leaves
        while tmp & 1 == 0 and tmp > 0:
            num_parents += 1
            tmp >>= 1

        for k in range(1, num_parents + 1):
            parent_pos = pos + k
            left_pos = parent_pos - (1 << k)
            right_pos = parent_pos - 1
            left_hash = self._nodes[left_pos]
            right_hash = self._nodes[right_pos]
            self._nodes[parent_pos] = hash_mmr_branch(left_hash, right_hash)

        return pos

    # -- queries -----------------------------------------------------------

    def get_root(self) -> bytes:
        """Compute and return the root hash by bagging peaks."""
        peaks = self.get_peaks()
        peak_hashes = [h for _, h in peaks]
        return hash_mmr_bagging(peak_hashes)

    def get_peaks(self) -> list[tuple[int, bytes]]:
        """Return list of (position, hash) for all peaks."""
        result: list[tuple[int, bytes]] = []
        for p in _peak_positions(self._size):
            h = self._nodes.get(p)
            if h is not None:
                result.append((p, h))
        return result

    def get_hash(self, pos: int) -> bytes | None:
        """Return the hash at the given position, or ``None``."""
        return self._nodes.get(pos)

    # -- inclusion proof ---------------------------------------------------

    def inclusion_proof(self, leaf_pos: int) -> MMRProof:
        """Generate an inclusion proof for the leaf at *leaf_pos*.

        Raises:
            InvalidIndexError: If *leaf_pos* is not a valid leaf position.
        """
        if leaf_pos < 0 or leaf_pos >= self.node_count:
            raise InvalidIndexError(leaf_pos)
        if not _is_leaf(leaf_pos):
            raise InvalidIndexError(leaf_pos, detail={"reason": "not a leaf"})

        leaf_hash = self._nodes.get(leaf_pos)
        if leaf_hash is None:
            raise InvalidIndexError(leaf_pos, detail={"reason": "hash not found"})

        path: list[tuple[int, bytes]] = []
        current = leaf_pos
        while not _is_peak(current, self._size):
            sib = _sibling(current, self._size)
            if sib is None:
                break
            sib_hash = self._nodes.get(sib)
            if sib_hash is None:
                break
            path.append((sib, sib_hash))
            p = _parent(current, self._size)
            if p is None:
                break
            current = p

        peaks = self.get_peaks()
        return MMRProof(
            leaf_position=leaf_pos,
            leaf_hash=leaf_hash,
            path=path,
            peaks=peaks,
            mmr_size=self._size,
        )

    @staticmethod
    def verify_inclusion(leaf_hash: bytes, proof: MMRProof, root: bytes) -> bool:
        """Verify an inclusion proof against an expected *root*.

        Returns ``True`` if the proof is valid, ``False`` otherwise.
        """
        try:
            # Recompute the hash from leaf to peak
            current_pos = proof.leaf_position
            current_hash = hash_mmr_leaf(leaf_hash)

            for sib_pos, sib_hash in proof.path:
                if _is_right_child(current_pos):
                    # current is right child → sibling is left
                    current_hash = hash_mmr_branch(sib_hash, current_hash)
                else:
                    # current is left child → sibling is right
                    current_hash = hash_mmr_branch(current_hash, sib_hash)
                current_pos = _parent_static(current_pos, proof.mmr_size)
                if current_pos is None:
                    return False

            # Verify current_hash matches the corresponding peak
            peak_match = False
            for peak_pos, peak_hash in proof.peaks:
                if peak_pos == current_pos and peak_hash == current_hash:
                    peak_match = True
                    break
            if not peak_match:
                return False

            # Verify the bagged root
            peak_hashes = [h for _, h in proof.peaks]
            computed_root = hash_mmr_bagging(peak_hashes)
            return computed_root == root
        except Exception:
            return False

    # -- consistency proof -------------------------------------------------

    def consistency_proof(self, earlier_size: int) -> MMRConsistencyProof:
        """Generate a consistency proof between *earlier_size* and current size.

        Raises:
            InvalidIndexError: If *earlier_size* is invalid.
        """
        if earlier_size < 0 or earlier_size > self._size:
            raise InvalidIndexError(
                earlier_size,
                detail={"reason": "earlier_size out of range", "current_size": self._size},
            )
        if earlier_size == 0:
            raise InvalidIndexError(
                earlier_size,
                detail={"reason": "earlier_size must be > 0"},
            )

        earlier_peaks = []
        for p in _peak_positions(earlier_size):
            h = self._nodes.get(p)
            if h is not None:
                earlier_peaks.append((p, h))

        later_peaks = self.get_peaks()

        # Collect additional hashes needed to connect earlier peaks to
        # later peaks.
        later_peak_positions = {p for p, _ in later_peaks}
        earlier_peak_positions = {p for p, _ in earlier_peaks}
        proof_hashes: list[bytes] = []
        added_positions: set[int] = set()  # track positions already added

        for ep_pos, _ in earlier_peaks:
            if ep_pos in later_peak_positions:
                continue
            # Walk up from the earlier peak to the nearest later peak,
            # collecting sibling hashes.
            current = ep_pos
            while current not in later_peak_positions:
                sib = _sibling(current, self._size)
                if sib is None:
                    break
                sib_hash = self._nodes.get(sib)
                if sib_hash is None:
                    break
                # Only add if the sibling is not already known to the
                # verifier (earlier peak, later peak, or already added).
                if (sib not in later_peak_positions
                        and sib not in earlier_peak_positions
                        and sib not in added_positions):
                    proof_hashes.append(sib_hash)
                    added_positions.add(sib)
                p = _parent(current, self._size)
                if p is None:
                    break
                current = p

        return MMRConsistencyProof(
            earlier_size=earlier_size,
            later_size=self._size,
            earlier_peaks=earlier_peaks,
            later_peaks=later_peaks,
            proof_hashes=proof_hashes,
        )

    @staticmethod
    def verify_consistency(
        earlier_root: bytes,
        later_root: bytes,
        proof: MMRConsistencyProof,
    ) -> bool:
        """Verify a consistency proof.

        Returns ``True`` if the proof is valid, ``False`` otherwise.
        """
        try:
            # Step 1: verify earlier_root from earlier_peaks
            earlier_peak_hashes = [h for _, h in proof.earlier_peaks]
            computed_earlier = hash_mmr_bagging(earlier_peak_hashes)
            if computed_earlier != earlier_root:
                return False

            # Step 2: verify later_root from later_peaks
            later_peak_hashes = [h for _, h in proof.later_peaks]
            computed_later = hash_mmr_bagging(later_peak_hashes)
            if computed_later != later_root:
                return False

            # Step 3: verify that the earlier peaks are consistent with
            # the later peaks using the proof hashes.
            later_peak_map = {p: h for p, h in proof.later_peaks}
            earlier_peak_map = {p: h for p, h in proof.earlier_peaks}

            # We'll try to derive the later peaks from the earlier peaks
            # and the proof hashes.
            known: dict[int, bytes] = {}
            known.update(earlier_peak_map)

            proof_idx = 0
            for ep_pos, ep_hash in proof.earlier_peaks:
                if ep_pos in later_peak_map:
                    continue
                # Walk up from the earlier peak using proof hashes
                current_pos = ep_pos
                current_hash = ep_hash
                while current_pos not in later_peak_map:
                    sib_pos = _sibling_static(current_pos, proof.later_size)
                    if sib_pos is None:
                        return False
                    # Get sibling hash from proof hashes or known nodes
                    if sib_pos in known:
                        sib_hash = known[sib_pos]
                    elif proof_idx < len(proof.proof_hashes):
                        sib_hash = proof.proof_hashes[proof_idx]
                        proof_idx += 1
                        known[sib_pos] = sib_hash
                    else:
                        return False

                    if _is_right_child(current_pos):
                        parent_hash = hash_mmr_branch(sib_hash, current_hash)
                    else:
                        parent_hash = hash_mmr_branch(current_hash, sib_hash)

                    parent_pos = _parent_static(current_pos, proof.later_size)
                    if parent_pos is None:
                        return False

                    known[parent_pos] = parent_hash
                    current_pos = parent_pos
                    current_hash = parent_hash

                # Verify the derived peak matches the later peak
                if current_hash != later_peak_map.get(current_pos):
                    return False

            # Verify remaining later peaks not derived from earlier peaks
            # are present in the proof
            for lp_pos, lp_hash in proof.later_peaks:
                if lp_pos not in earlier_peak_map:
                    # This later peak was not an earlier peak.
                    # It should be derivable from the known nodes or
                    # already verified.
                    if lp_pos in known:
                        if known[lp_pos] != lp_hash:
                            return False

            return True
        except Exception:
            return False

    # -- serialization -----------------------------------------------------

    def to_dict(self) -> dict:
        """Serialize MMR state for storage."""
        return {
            "size": self._size,
            "nodes": {str(pos): h.hex() for pos, h in self._nodes.items()},
        }

    @classmethod
    def from_dict(cls, data: dict) -> MerkleMountainRange:
        """Deserialize MMR state from a dict produced by :meth:`to_dict`."""
        mmr = cls()
        mmr._size = data["size"]
        mmr._nodes = {
            int(pos): bytes.fromhex(h) for pos, h in data["nodes"].items()
        }
        return mmr


# ---------------------------------------------------------------------------
# Static helper variants (no MMR instance needed)
# ---------------------------------------------------------------------------

def _parent_static(pos: int, size: int) -> int | None:
    """Compute parent position from *pos* and MMR *size* (leaf count)."""
    total = _node_count(size - 1) if size > 0 else 0
    h = _height(pos)
    if _is_right_child(pos):
        p = pos + 1
    else:
        p = pos + (1 << (h + 1))
    if 0 <= p < total:
        return p
    return None


def _sibling_static(pos: int, size: int) -> int | None:
    """Compute sibling position from *pos* and MMR *size* (leaf count)."""
    total = _node_count(size - 1) if size > 0 else 0
    h = _height(pos)
    if _is_right_child(pos):
        sib = pos - ((1 << (h + 1)) - 1)
    else:
        sib = pos + ((1 << (h + 1)) - 1)
    if 0 <= sib < total:
        return sib
    return None
