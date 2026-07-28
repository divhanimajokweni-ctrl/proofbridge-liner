"""VVU Earth Tech Ledger — Quorum verification for validator signatures.

A :class:`QuorumVerifier` checks whether a set of Ed25519 signatures
achieves the required quorum threshold.  The default threshold is 2/3
of the total active validator weight, with a minimum of 2 validators
required to sign.

Quorum verification is a critical step in the ledger append flow:
without sufficient validator endorsement, an entry is not considered
finalised.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .ed25519 import Signature
from .exceptions import QuorumFailedError
from .validator_registry import ValidatorRegistry


# ---------------------------------------------------------------------------
# Quorum result
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class QuorumResult:
    """Result of a quorum check.

    Attributes:
        achieved:          Whether quorum was achieved.
        total_weight:      Total weight of all active validators.
        signed_weight:     Combined weight of validators that signed.
        required_weight:   Minimum weight required for quorum.
        signed_validators: List of key_ids of validators that signed.
        missing_validators: List of key_ids of active validators that did not sign.
    """

    achieved: bool
    total_weight: int
    signed_weight: int
    required_weight: int
    signed_validators: list[bytes]
    missing_validators: list[bytes]


# ---------------------------------------------------------------------------
# Quorum verifier
# ---------------------------------------------------------------------------

class QuorumVerifier:
    """Verifies that validator signatures achieve quorum.

    Usage::

        verifier = QuorumVerifier(registry, min_quorum=2, threshold_pct=0.67)
        result = verifier.check_quorum(signatures)
        if result.achieved:
            print("Quorum reached!")
    """

    def __init__(
        self,
        registry: ValidatorRegistry,
        min_quorum: int = 2,
        threshold_pct: float = 0.67,
    ) -> None:
        """Initialize with a validator registry and quorum parameters.

        Args:
            registry:     The :class:`ValidatorRegistry` for validator lookup.
            min_quorum:   Minimum number of validators required for quorum.
            threshold_pct: Fraction of total weight required (default 2/3).
        """
        self._registry = registry
        self._min_quorum = min_quorum
        self._threshold_pct = threshold_pct

    # ------------------------------------------------------------------
    # Check quorum
    # ------------------------------------------------------------------

    def check_quorum(
        self,
        signatures: list[Signature],
        sequence: int | None = None,
    ) -> QuorumResult:
        """Check if the given signatures achieve quorum.

        The algorithm:

        1. Look up each signing validator by ``signature.key_id``.
        2. Verify each signer is an active validator at the given sequence.
        3. Sum the weights of signed validators.
        4. Compare against the required threshold (``threshold_pct`` of total
           weight by default).
        5. Return a :class:`QuorumResult`.

        Duplicate signatures from the same validator are counted only once.

        Args:
            signatures: List of :class:`Signature` objects to check.
            sequence:   Optional sequence number for historical lookup.

        Returns:
            A :class:`QuorumResult` indicating whether quorum was achieved.
        """
        active_validators = self._registry.list_active(sequence)
        total_weight = sum(v.weight for v in active_validators)

        # Build a map of key_id -> weight for active validators
        active_map: dict[bytes, int] = {v.key_id: v.weight for v in active_validators}

        # Collect signed validator key_ids (deduplicate)
        signed_key_ids: list[bytes] = []
        seen: set[bytes] = set()
        for sig in signatures:
            if sig.key_id in active_map and sig.key_id not in seen:
                signed_key_ids.append(sig.key_id)
                seen.add(sig.key_id)

        # Sum signed weight
        signed_weight = sum(active_map[kid] for kid in signed_key_ids)

        # Calculate required weight
        req_weight = self.required_weight(sequence)

        # Missing validators
        missing_key_ids = [
            v.key_id for v in active_validators
            if v.key_id not in seen
        ]

        achieved = (
            signed_weight >= req_weight
            and len(signed_key_ids) >= self._min_quorum
        )

        return QuorumResult(
            achieved=achieved,
            total_weight=total_weight,
            signed_weight=signed_weight,
            required_weight=req_weight,
            signed_validators=signed_key_ids,
            missing_validators=missing_key_ids,
        )

    # ------------------------------------------------------------------
    # Required weight
    # ------------------------------------------------------------------

    def required_weight(self, sequence: int | None = None) -> int:
        """Calculate the required weight for quorum.

        The required weight is ``ceil(threshold_pct * total_weight)``.

        Args:
            sequence: Optional sequence number for historical lookup.

        Returns:
            The minimum total weight required for quorum.
        """
        total = self._registry.total_weight(sequence)
        if total == 0:
            return 0
        return math.ceil(self._threshold_pct * total)

    # ------------------------------------------------------------------
    # Individual validator check
    # ------------------------------------------------------------------

    def is_validator_signed(
        self,
        key_id: bytes,
        signatures: list[Signature],
    ) -> bool:
        """Check if a specific validator has signed.

        Args:
            key_id:     4-byte key identifier of the validator.
            signatures: List of :class:`Signature` objects.

        Returns:
            ``True`` if the validator's signature is present.
        """
        return any(sig.key_id == key_id for sig in signatures)
