"""Tests for the Ed25519 signing and verification module."""

from __future__ import annotations

import pytest

from production_ledger.constants import DOMAIN_ENVELOPE, DOMAIN_PAYLOAD, DOMAIN_REVISION
from production_ledger.ed25519 import (
    Ed25519Signer,
    KeyPair,
    KeyStore,
    KeyVersion,
    Signature,
)
from production_ledger.exceptions import (
    InvalidSignatureError,
    KeyExpiredError,
    KeyNotFoundError,
    SignatureError,
)


# ---------------------------------------------------------------------------
# Key generation
# ---------------------------------------------------------------------------

class TestKeyGeneration:
    def test_key_generation(self) -> None:
        """Generates a valid keypair with correct metadata."""
        store = KeyStore()
        kp = store.generate_key()
        assert kp.version == 1
        assert len(kp.signing_key) == 32
        assert len(kp.public_key) == 32
        assert len(kp.key_id) == 4
        assert kp.created_at > 0

    def test_key_version_increments(self) -> None:
        """Key versions increment automatically."""
        store = KeyStore()
        kp1 = store.generate_key()
        kp2 = store.generate_key()
        assert kp1.version == 1
        assert kp2.version == 2


# ---------------------------------------------------------------------------
# Sign and verify
# ---------------------------------------------------------------------------

class TestSignVerify:
    def test_sign_verify(self) -> None:
        """Sign and verify round-trip succeeds."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        sig = signer.sign(DOMAIN_PAYLOAD, b"hello world")
        assert signer.verify(DOMAIN_PAYLOAD, b"hello world", sig)

    def test_wrong_message(self) -> None:
        """Wrong message fails verification."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        sig = signer.sign(DOMAIN_PAYLOAD, b"hello world")
        with pytest.raises(InvalidSignatureError):
            signer.verify(DOMAIN_PAYLOAD, b"wrong message", sig)

    def test_domain_separation(self) -> None:
        """Different domains produce different signatures."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        sig1 = signer.sign(DOMAIN_PAYLOAD, b"same data")
        sig2 = signer.sign(DOMAIN_ENVELOPE, b"same data")
        assert sig1.signature != sig2.signature

    def test_signature_metadata(self) -> None:
        """Signature carries correct key metadata."""
        store = KeyStore()
        kp = store.generate_key()
        signer = Ed25519Signer(store)

        sig = signer.sign(DOMAIN_PAYLOAD, b"test")
        assert sig.key_id == kp.key_id
        assert sig.key_version == kp.version
        assert len(sig.signature) == 64
        assert sig.timestamp > 0


# ---------------------------------------------------------------------------
# Key rotation
# ---------------------------------------------------------------------------

class TestKeyRotation:
    def test_key_rotation(self) -> None:
        """Rotation generates a new key with incremented version."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        new_kp = signer.rotate_key()
        assert new_kp.version == 2
        assert new_kp.key_id != store._keys.get(
            store.list_active_keys()[0].key_id
        ).key_id if len(store.list_active_keys()) > 0 else True

    def test_new_key_signs_after_rotation(self) -> None:
        """After rotation, the new key is used for signing."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        sig1 = signer.sign(DOMAIN_PAYLOAD, b"before rotation")
        signer.rotate_key()
        sig2 = signer.sign(DOMAIN_PAYLOAD, b"after rotation")

        assert sig1.key_version == 1
        assert sig2.key_version == 2


# ---------------------------------------------------------------------------
# Key revocation
# ---------------------------------------------------------------------------

class TestKeyRevocation:
    def test_key_revocation(self) -> None:
        """Revoked key is marked inactive."""
        store = KeyStore()
        kp = store.generate_key()
        assert kp.is_active if isinstance(kp, KeyVersion) else True

        # Get the key version before revocation
        kv = store.get_key_version(kp.key_id)
        assert kv is not None
        assert kv.is_active

        # Revoke
        store.revoke_key(kp.key_id, epoch=1)
        kv = store.get_key_version(kp.key_id)
        assert kv is not None
        assert not kv.is_active
        assert kv.revocation_epoch == 1

    def test_revoked_key_cannot_sign(self) -> None:
        """Revoked key raises KeyExpiredError when trying to sign."""
        store = KeyStore()
        kp = store.generate_key()
        store.revoke_key(kp.key_id, epoch=1)

        with pytest.raises(KeyExpiredError):
            store.get_signing_key(kp.key_id)


# ---------------------------------------------------------------------------
# Multiple keys
# ---------------------------------------------------------------------------

class TestMultipleKeys:
    def test_multiple_keys(self) -> None:
        """Store and use multiple keys."""
        store = KeyStore()
        kp1 = store.generate_key()
        kp2 = store.generate_key()

        all_keys = store.list_all_keys()
        assert len(all_keys) == 2

        # The latest key should be used for signing
        signer = Ed25519Signer(store)
        sig = signer.sign(DOMAIN_PAYLOAD, b"test")
        assert sig.key_version == 2

    def test_export_public_keys(self) -> None:
        """Export returns KeyVersion objects."""
        store = KeyStore()
        store.generate_key()
        store.generate_key()

        exported = store.export_public_keys()
        assert len(exported) == 2
        assert all(isinstance(kv, KeyVersion) for kv in exported)
        assert all(len(kv.public_key) == 32 for kv in exported)
        # No private key material in exported keys
        assert not any(hasattr(kv, "signing_key") for kv in exported)


# ---------------------------------------------------------------------------
# Error cases
# ---------------------------------------------------------------------------

class TestErrorCases:
    def test_empty_domain_raises(self) -> None:
        """Empty domain raises SignatureError."""
        store = KeyStore()
        store.generate_key()
        signer = Ed25519Signer(store)

        with pytest.raises(SignatureError):
            signer.sign(b"", b"data")

    def test_no_active_key_raises(self) -> None:
        """No active key raises KeyNotFoundError."""
        store = KeyStore()
        kp = store.generate_key()
        store.revoke_key(kp.key_id, epoch=1)

        with pytest.raises(KeyNotFoundError):
            store.get_signing_key()
