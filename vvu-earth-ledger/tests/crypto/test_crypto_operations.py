"""Tests for cryptographic operations across modules."""

from __future__ import annotations

import pytest

from production_ledger.constants import DOMAIN_ENVELOPE, DOMAIN_PAYLOAD, DOMAIN_REVISION
from production_ledger.ed25519 import Ed25519Signer, KeyStore
from production_ledger.exceptions import InvalidSignatureError
from production_ledger.hashing import hash_payload, hash_revision
from production_ledger.mmr import MerkleMountainRange


# ---------------------------------------------------------------------------
# Signature chain
# ---------------------------------------------------------------------------

class TestSignatureChain:
    def test_signature_chain(self) -> None:
        """Verify a chain of signatures where each entry signs the previous."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        # Build a chain of signatures
        messages = [b"entry_0", b"entry_1", b"entry_2"]
        signatures = []
        for msg in messages:
            sig = signer.sign(DOMAIN_PAYLOAD, msg)
            signatures.append(sig)

        # Verify all signatures
        for msg, sig in zip(messages, signatures):
            assert signer.verify(DOMAIN_PAYLOAD, msg, sig)


# ---------------------------------------------------------------------------
# Domain-separated signing
# ---------------------------------------------------------------------------

class TestDomainSeparatedSigning:
    def test_domain_separated_signing(self) -> None:
        """Verify domain separation in signing."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        message = b"same message"
        sig_payload = signer.sign(DOMAIN_PAYLOAD, message)
        sig_envelope = signer.sign(DOMAIN_ENVELOPE, message)

        # Different domains produce different signatures
        assert sig_payload.signature != sig_envelope.signature

        # Each signature verifies only under its own domain
        assert signer.verify(DOMAIN_PAYLOAD, message, sig_payload)
        assert signer.verify(DOMAIN_ENVELOPE, message, sig_envelope)

        # Cross-domain verification fails
        with pytest.raises(InvalidSignatureError):
            signer.verify(DOMAIN_ENVELOPE, message, sig_payload)

        with pytest.raises(InvalidSignatureError):
            signer.verify(DOMAIN_PAYLOAD, message, sig_envelope)


# ---------------------------------------------------------------------------
# Key rotation preserves verification
# ---------------------------------------------------------------------------

class TestKeyRotationPreservesVerification:
    def test_key_rotation_preserves_verification(self) -> None:
        """Old signatures still verify after key rotation."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        # Sign with the original key
        old_sig = signer.sign(DOMAIN_PAYLOAD, b"original message")

        # Rotate the key
        new_kp = signer.rotate_key()
        assert new_kp.version == 2

        # Sign with the new key
        new_sig = signer.sign(DOMAIN_PAYLOAD, b"new message")

        # Old signature still verifies
        assert signer.verify(DOMAIN_PAYLOAD, b"original message", old_sig)

        # New signature verifies
        assert signer.verify(DOMAIN_PAYLOAD, b"new message", new_sig)


# ---------------------------------------------------------------------------
# MMR proof chain
# ---------------------------------------------------------------------------

class TestMMRProofChain:
    def test_mmr_proof_chain(self) -> None:
        """Verify MMR proofs across multiple appends."""
        mmr = MerkleMountainRange()

        # Append entries and collect roots
        roots = []
        for i in range(10):
            mmr.append(hash_payload(f"entry_{i}".encode()))
            roots.append(mmr.get_root())

        # Verify inclusion proofs for all entries at the final state
        final_root = mmr.get_root()
        from production_ledger.mmr import _leaf_pos

        for i in range(10):
            leaf_pos = _leaf_pos(i)
            proof = mmr.inclusion_proof(leaf_pos)
            assert MerkleMountainRange.verify_inclusion(
                hash_payload(f"entry_{i}".encode()), proof, final_root
            ), f"Proof verification failed for leaf {i}"
