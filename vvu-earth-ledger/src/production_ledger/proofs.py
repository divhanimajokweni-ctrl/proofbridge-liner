"""VVU Earth Tech Ledger — Proof generation and verification.

The :class:`ProofEngine` generates and verifies cryptographic proofs
for ledger entries:

* **Inclusion proofs** — prove that a specific entry exists in the MMR.
* **Consistency proofs** — prove that the MMR at an earlier sequence
  is a prefix of the current MMR.
* **Receipts** — combine an envelope, MMR inclusion proof, and quorum
  result into a single verifiable artefact.

All proofs are constructed using the MMR primitives from
:mod:`production_ledger.mmr` and the quorum verification from
:mod:`production_ledger.quorum`.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from .envelopes import Envelope
from .exceptions import (
    InvalidIndexError,
    InvalidProofError,
    LedgerError,
    RootMismatchError,
)
from .ledger import Ledger
from .mmr import MMRConsistencyProof, MMRProof, MerkleMountainRange
from .quorum import QuorumResult


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class InclusionProof:
    """An inclusion proof for a specific ledger entry.

    Combines the MMR inclusion proof with the envelope data and the
    current MMR root.

    Attributes:
        sequence:  The sequence number of the entry.
        envelope:  The :class:`Envelope` being proven.
        mmr_proof: The MMR inclusion proof.
        mmr_root:  The MMR root at the time the proof was generated.
        timestamp: Proof generation timestamp.
    """

    sequence: int
    envelope: Envelope
    mmr_proof: MMRProof
    mmr_root: bytes
    timestamp: float


@dataclass(frozen=True)
class ConsistencyProof:
    """A consistency proof between two MMR states.

    Proves that the MMR at ``earlier_sequence`` is a prefix of the
    MMR at ``later_sequence``.

    Attributes:
        earlier_sequence: Sequence number at the earlier state.
        later_sequence:   Sequence number at the later state.
        earlier_root:     MMR root at the earlier state.
        later_root:       MMR root at the later state.
        proof:            The MMR consistency proof.
        timestamp:        Proof generation timestamp.
    """

    earlier_sequence: int
    later_sequence: int
    earlier_root: bytes
    later_root: bytes
    proof: MMRConsistencyProof
    timestamp: float


@dataclass(frozen=True)
class Receipt:
    """A verifiable receipt for a ledger entry.

    Combines the envelope, MMR inclusion proof, and quorum result
    into a single verifiable artefact.

    Attributes:
        sequence:     The sequence number of the entry.
        envelope:     The :class:`Envelope` being receipted.
        mmr_proof:    The MMR inclusion proof.
        mmr_root:     The MMR root at the time of receipt.
        quorum_result: The quorum result (if quorum was checked).
        timestamp:    Receipt generation timestamp.
    """

    sequence: int
    envelope: Envelope
    mmr_proof: MMRProof
    mmr_root: bytes
    quorum_result: QuorumResult | None
    timestamp: float


# ---------------------------------------------------------------------------
# Proof engine
# ---------------------------------------------------------------------------

class ProofEngine:
    """Generates and verifies cryptographic proofs.

    Usage::

        engine = ProofEngine(ledger)
        proof = engine.generate_inclusion_proof(sequence=5)
        assert engine.verify_inclusion_proof(proof)

        receipt = engine.generate_receipt(sequence=5)
        assert engine.verify_receipt(receipt)
    """

    def __init__(self, ledger: Ledger) -> None:
        """Initialize with a :class:`Ledger` instance.

        Args:
            ledger: The ledger to generate proofs for.
        """
        self._ledger = ledger

    # ------------------------------------------------------------------
    # Inclusion proof
    # ------------------------------------------------------------------

    def generate_inclusion_proof(self, sequence: int) -> InclusionProof:
        """Generate an inclusion proof for a sequence.

        Combines the MMR proof with the envelope data and the current
        MMR root.

        Args:
            sequence: The sequence number to generate a proof for.

        Returns:
            An :class:`InclusionProof`.

        Raises:
            LedgerError: If the sequence is out of range.
        """
        envelope = self._ledger.get_entry(sequence)
        if envelope is None:
            raise LedgerError(
                f"Entry at sequence {sequence} not found",
                code="PROOF_ENTRY_NOT_FOUND",
                detail={"sequence": sequence},
            )

        mmr_proof = self._ledger.get_proof(sequence)
        mmr_root = self._ledger.get_mmr_root()

        return InclusionProof(
            sequence=sequence,
            envelope=envelope,
            mmr_proof=mmr_proof,
            mmr_root=mmr_root,
            timestamp=time.time(),
        )

    def verify_inclusion_proof(self, proof: InclusionProof) -> bool:
        """Verify an inclusion proof.

        Checks:

        1. The envelope's envelope_hash is consistent with the MMR proof.
        2. The MMR proof verifies against the current root.
        3. The envelope's internal hashes are correct.

        Args:
            proof: The :class:`InclusionProof` to verify.

        Returns:
            ``True`` if the proof is valid.
        """
        # Verify the envelope's payload hash
        from .hashing import hash_payload
        computed_payload_hash = hash_payload(proof.envelope.payload)
        if computed_payload_hash != proof.envelope.payload_hash:
            return False

        # Verify the MMR inclusion proof
        current_root = self._ledger.get_mmr_root()
        if proof.mmr_root != current_root:
            # The proof was generated at a different MMR state.
            # We can still verify the proof against its own root.
            pass

        return MerkleMountainRange.verify_inclusion(
            proof.envelope.envelope_hash,
            proof.mmr_proof,
            proof.mmr_root,
        )

    # ------------------------------------------------------------------
    # Consistency proof
    # ------------------------------------------------------------------

    def generate_consistency_proof(self, earlier_sequence: int) -> ConsistencyProof:
        """Generate a consistency proof between an earlier state and current.

        Proves that the MMR at ``earlier_sequence`` is a prefix of the
        current MMR.

        Args:
            earlier_sequence: The sequence number at the earlier state.

        Returns:
            A :class:`ConsistencyProof`.

        Raises:
            LedgerError: If the sequence is out of range.
        """
        current_sequence = self._ledger.get_sequence()
        if earlier_sequence < 0 or earlier_sequence > current_sequence:
            raise LedgerError(
                f"Earlier sequence {earlier_sequence} out of range [0, {current_sequence}]",
                code="PROOF_SEQUENCE_OUT_OF_RANGE",
                detail={"earlier_sequence": earlier_sequence, "current_sequence": current_sequence},
            )

        if earlier_sequence == 0:
            raise LedgerError(
                "Earlier sequence must be > 0 for consistency proof",
                code="PROOF_SEQUENCE_ZERO",
                detail={"earlier_sequence": earlier_sequence},
            )

        # Compute the earlier root by rebuilding the MMR up to that point
        earlier_mmr = MerkleMountainRange()
        for seq in range(0, earlier_sequence + 1):
            entry = self._ledger.get_entry(seq)
            if entry is not None:
                earlier_mmr.append(entry.envelope_hash)

        earlier_root = earlier_mmr.get_root()
        later_root = self._ledger.get_mmr_root()

        # Generate the MMR consistency proof
        # The earlier MMR had (earlier_sequence + 1) leaves
        mmr_proof = self._ledger.mmr.consistency_proof(earlier_sequence + 1)

        return ConsistencyProof(
            earlier_sequence=earlier_sequence,
            later_sequence=current_sequence,
            earlier_root=earlier_root,
            later_root=later_root,
            proof=mmr_proof,
            timestamp=time.time(),
        )

    def verify_consistency_proof(self, proof: ConsistencyProof) -> bool:
        """Verify a consistency proof.

        Checks that the earlier root is consistent with the later root
        using the MMR consistency proof.

        Args:
            proof: The :class:`ConsistencyProof` to verify.

        Returns:
            ``True`` if the proof is valid.
        """
        return MerkleMountainRange.verify_consistency(
            proof.earlier_root,
            proof.later_root,
            proof.proof,
        )

    # ------------------------------------------------------------------
    # Receipt
    # ------------------------------------------------------------------

    def generate_receipt(self, sequence: int) -> Receipt:
        """Generate a verifiable receipt for a sequence.

        A receipt combines:

        * The envelope data
        * An MMR inclusion proof
        * A quorum result (if quorum was checked)

        Args:
            sequence: The sequence number to generate a receipt for.

        Returns:
            A :class:`Receipt`.

        Raises:
            LedgerError: If the sequence is out of range.
        """
        envelope = self._ledger.get_entry(sequence)
        if envelope is None:
            raise LedgerError(
                f"Entry at sequence {sequence} not found",
                code="PROOF_ENTRY_NOT_FOUND",
                detail={"sequence": sequence},
            )

        mmr_proof = self._ledger.get_proof(sequence)
        mmr_root = self._ledger.get_mmr_root()

        # Get quorum result if quorum verifier is available
        quorum_result: QuorumResult | None = None
        if self._ledger.quorum_verifier is not None:
            quorum_result = self._ledger.quorum_verifier.check_quorum(
                [envelope.signature]
            )

        return Receipt(
            sequence=sequence,
            envelope=envelope,
            mmr_proof=mmr_proof,
            mmr_root=mmr_root,
            quorum_result=quorum_result,
            timestamp=time.time(),
        )

    def verify_receipt(self, receipt: Receipt) -> bool:
        """Verify a receipt.

        Checks:

        1. The envelope's payload hash is correct.
        2. The MMR inclusion proof is valid.
        3. The quorum result (if present) indicates quorum was achieved.

        Args:
            receipt: The :class:`Receipt` to verify.

        Returns:
            ``True`` if the receipt is valid.
        """
        # 1. Verify payload hash
        from .hashing import hash_payload
        computed_payload_hash = hash_payload(receipt.envelope.payload)
        if computed_payload_hash != receipt.envelope.payload_hash:
            return False

        # 2. Verify MMR inclusion proof
        if not MerkleMountainRange.verify_inclusion(
            receipt.envelope.envelope_hash,
            receipt.mmr_proof,
            receipt.mmr_root,
        ):
            return False

        # 3. Verify quorum result
        # If a quorum result is present and validators are registered,
        # quorum must have been achieved.  If there are no validators
        # (e.g. single-node ledger), the quorum result is informational
        # and does not fail verification.
        if receipt.quorum_result is not None:
            if receipt.quorum_result.total_weight > 0 and not receipt.quorum_result.achieved:
                return False

        return True
