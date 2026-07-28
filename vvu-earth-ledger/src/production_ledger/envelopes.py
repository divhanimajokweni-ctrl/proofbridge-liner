"""VVU Earth Tech Ledger — Cryptographic envelopes.

An :class:`Envelope` wraps a ledger entry with domain-separated hashes,
an Ed25519 signature, and metadata that links it into the append-only chain.

The hash chain is::

    payload_hash  = hash_payload(payload)
    envelope_hash = hash_envelope(envelope_pre_image)
    revision_hash = hash_revision(payload_hash + envelope_hash)

where ``envelope_pre_image`` is the canonical encoding of a dict with
keys ``sequence``, ``parent_hash``, ``payload_hash``, and ``timestamp``.
Since the canonical serializer does not support floats, the timestamp
is encoded as a 64-bit big-endian IEEE 754 double before being placed
in the dict as bytes.

The signature is computed over the ``revision_hash`` with domain
``DOMAIN_REVISION``.
"""

from __future__ import annotations

import struct
import time
from dataclasses import dataclass

from .constants import DOMAIN_ENVELOPE, DOMAIN_REVISION
from .ed25519 import Ed25519Signer, KeyPair, Signature
from .exceptions import (
    EnvelopeError,
    EnvelopeSignatureError,
    HashMismatchError,
    InvalidEnvelopeFormatError,
    MissingFieldError,
)
from .hashing import hash_envelope, hash_payload, hash_revision
from .serializer import canonical_encode


# ---------------------------------------------------------------------------
# Genesis hash — all-zero 32-byte sentinel for the first entry
# ---------------------------------------------------------------------------

GENESIS_HASH: bytes = b"\x00" * 32


# ---------------------------------------------------------------------------
# Timestamp encoding helper
# ---------------------------------------------------------------------------

def _encode_timestamp(timestamp: float) -> bytes:
    """Encode a timestamp as 8-byte big-endian IEEE 754 double.

    This is deterministic across platforms and avoids the canonical
    serializer's float limitation.
    """
    return struct.pack(">d", timestamp)


def _decode_timestamp(data: bytes) -> float:
    """Decode a timestamp from 8-byte big-endian IEEE 754 double."""
    return struct.unpack(">d", data)[0]


# ---------------------------------------------------------------------------
# Envelope pre-image construction
# ---------------------------------------------------------------------------

def _build_envelope_pre_image(
    sequence: int,
    parent_hash: bytes,
    payload_hash: bytes,
    timestamp: float,
) -> bytes:
    """Construct the deterministic envelope pre-image for hashing.

    The pre-image is the canonical encoding of a dict with keys:
    ``sequence`` (int), ``parent_hash`` (bytes), ``payload_hash`` (bytes),
    ``timestamp`` (bytes — 8-byte big-endian double).

    Args:
        sequence:     Sequence number.
        parent_hash:  32-byte parent hash.
        payload_hash: 32-byte payload hash.
        timestamp:    POSIX timestamp.

    Returns:
        The canonical binary encoding of the envelope pre-image.
    """
    timestamp_bytes = _encode_timestamp(timestamp)
    return canonical_encode({
        "sequence": sequence,
        "parent_hash": parent_hash,
        "payload_hash": payload_hash,
        "timestamp": timestamp_bytes,
    })


# ---------------------------------------------------------------------------
# Envelope data class
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Envelope:
    """A signed envelope wrapping a ledger entry.

    Attributes:
        sequence:      Monotonically increasing sequence number.
        parent_hash:   Hash of the previous entry's envelope (chain link).
        payload:       The actual data bytes.
        payload_hash:  SHA-256 of *payload* with domain separation.
        envelope_hash: SHA-256 of the envelope pre-image with domain separation.
        revision_hash: SHA-256 of (payload_hash + envelope_hash).
        signature:     Ed25519 signature from :mod:`production_ledger.ed25519`.
        key_id:        4-byte key identifier of the signing key.
        key_version:   Version number of the signing key.
        timestamp:     Creation timestamp (POSIX epoch seconds).
    """

    sequence: int
    parent_hash: bytes
    payload: bytes
    payload_hash: bytes
    envelope_hash: bytes
    revision_hash: bytes
    signature: Signature
    key_id: bytes
    key_version: int
    timestamp: float


# ---------------------------------------------------------------------------
# Envelope builder
# ---------------------------------------------------------------------------

class EnvelopeBuilder:
    """Builds envelopes with proper hashing and signing.

    Usage::

        builder = EnvelopeBuilder(signer)
        envelope = builder.build(sequence=1, parent_hash=GENESIS_HASH, payload=b"data")
    """

    def __init__(self, signer: Ed25519Signer) -> None:
        """Initialize with an Ed25519 signer.

        Args:
            signer: The :class:`Ed25519Signer` used for signing envelopes.
        """
        self._signer = signer

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build(self, sequence: int, parent_hash: bytes, payload: bytes) -> Envelope:
        """Build a complete envelope with all hashes and signature.

        The construction is::

            1. payload_hash  = hash_payload(payload)
            2. pre-image     = canonical_encode({sequence, parent_hash, payload_hash, timestamp})
            3. envelope_hash = hash_envelope(pre-image)
            4. revision_hash = hash_revision(payload_hash + envelope_hash)
            5. signature     = signer.sign(DOMAIN_REVISION, revision_hash)

        Args:
            sequence:    Monotonically increasing sequence number.
            parent_hash: Hash of the previous entry's envelope (or ``GENESIS_HASH``).
            payload:     The raw data bytes for the entry.

        Returns:
            A fully constructed :class:`Envelope`.

        Raises:
            EnvelopeError: If any step in the construction fails.
        """
        if sequence < 0:
            raise InvalidEnvelopeFormatError(
                f"Sequence number must be non-negative, got {sequence}",
                detail={"sequence": sequence},
            )
        if not isinstance(parent_hash, bytes) or len(parent_hash) != 32:
            raise InvalidEnvelopeFormatError(
                f"Parent hash must be 32 bytes, got {len(parent_hash) if isinstance(parent_hash, bytes) else 'non-bytes'}",
                detail={"parent_hash_length": len(parent_hash) if isinstance(parent_hash, bytes) else None},
            )

        timestamp = time.time()

        # Step 1: Compute payload_hash
        payload_hash = hash_payload(payload)

        # Step 2: Compute envelope pre-image via canonical encoding
        pre_image = _build_envelope_pre_image(
            sequence=sequence,
            parent_hash=parent_hash,
            payload_hash=payload_hash,
            timestamp=timestamp,
        )

        # Step 3: Compute envelope_hash
        envelope_hash = hash_envelope(pre_image)

        # Step 4: Compute revision_hash
        revision_hash = hash_revision(payload_hash + envelope_hash)

        # Step 5: Sign the revision_hash with domain DOMAIN_REVISION
        try:
            signature = self._signer.sign(DOMAIN_REVISION, revision_hash)
        except Exception as exc:
            raise EnvelopeSignatureError(
                f"Failed to sign envelope: {exc}",
                detail={"sequence": sequence, "error": str(exc)},
            ) from exc

        # Step 6: Construct the complete Envelope
        key_pair = self._signer._key_store.get_signing_key()

        return Envelope(
            sequence=sequence,
            parent_hash=parent_hash,
            payload=payload,
            payload_hash=payload_hash,
            envelope_hash=envelope_hash,
            revision_hash=revision_hash,
            signature=signature,
            key_id=key_pair.key_id,
            key_version=key_pair.version,
            timestamp=timestamp,
        )

    # ------------------------------------------------------------------
    # Verify
    # ------------------------------------------------------------------

    @staticmethod
    def verify(envelope: Envelope, signer: Ed25519Signer) -> bool:
        """Verify an envelope's hashes and signature.

        Checks performed (in order):

        1. Verify ``payload_hash`` matches ``hash_payload(payload)``.
        2. Reconstruct envelope pre-image and verify ``envelope_hash``.
        3. Verify ``revision_hash`` matches ``hash_revision(payload_hash + envelope_hash)``.
        4. Verify the Ed25519 signature over ``revision_hash``.

        Args:
            envelope: The :class:`Envelope` to verify.
            signer:   The :class:`Ed25519Signer` used for verification.

        Returns:
            ``True`` if all checks pass.

        Raises:
            HashMismatchError:       If any hash does not match.
            EnvelopeSignatureError:  If the signature is invalid.
        """
        # 1. Verify payload_hash
        computed_payload_hash = hash_payload(envelope.payload)
        if computed_payload_hash != envelope.payload_hash:
            raise HashMismatchError(
                expected=envelope.payload_hash,
                actual=computed_payload_hash,
                detail={"field": "payload_hash", "sequence": envelope.sequence},
            )

        # 2. Reconstruct envelope pre-image and verify envelope_hash
        pre_image = _build_envelope_pre_image(
            sequence=envelope.sequence,
            parent_hash=envelope.parent_hash,
            payload_hash=envelope.payload_hash,
            timestamp=envelope.timestamp,
        )
        computed_envelope_hash = hash_envelope(pre_image)
        if computed_envelope_hash != envelope.envelope_hash:
            raise HashMismatchError(
                expected=envelope.envelope_hash,
                actual=computed_envelope_hash,
                detail={"field": "envelope_hash", "sequence": envelope.sequence},
            )

        # 3. Verify revision_hash
        computed_revision_hash = hash_revision(
            envelope.payload_hash + envelope.envelope_hash
        )
        if computed_revision_hash != envelope.revision_hash:
            raise HashMismatchError(
                expected=envelope.revision_hash,
                actual=computed_revision_hash,
                detail={"field": "revision_hash", "sequence": envelope.sequence},
            )

        # 4. Verify signature
        try:
            signer.verify(DOMAIN_REVISION, envelope.revision_hash, envelope.signature)
        except Exception as exc:
            raise EnvelopeSignatureError(
                f"Signature verification failed for sequence {envelope.sequence}: {exc}",
                detail={"sequence": envelope.sequence, "error": str(exc)},
            ) from exc

        return True
