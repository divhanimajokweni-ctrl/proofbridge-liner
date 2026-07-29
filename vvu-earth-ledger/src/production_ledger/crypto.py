"""VVU Earth Tech Ledger — High-level cryptographic operations wrapper.

The :class:`CryptoEngine` combines Ed25519 signing (from :mod:`production_ledger.ed25519`)
with domain-separated hashing (from :mod:`production_ledger.hashing`) into a single
unified interface.

All signing operations are domain-separated by default, and hash operations
use the project's domain-separated SHA-256 construction.  Key rotation is
supported through the underlying :class:`KeyStore`.

Usage::

    engine = CryptoEngine()
    sig = engine.sign(DOMAIN_PAYLOAD, b"hello world")
    assert engine.verify(DOMAIN_PAYLOAD, b"hello world", sig)
    payload_hash = engine.hash_payload(b"hello world")
"""

from __future__ import annotations

from .constants import DOMAIN_ENVELOPE, DOMAIN_PAYLOAD
from .ed25519 import Ed25519Signer, KeyPair, KeyStore, KeyVersion, Signature
from .exceptions import CryptoError, SignatureError
from .hashing import domain_hash, hash_envelope, hash_payload


class CryptoEngine:
    """Unified cryptographic engine combining Ed25519 signing and
    domain-separated hashing.

    This class provides a single entry point for all cryptographic
    operations required by the ledger: signing, verification, hashing,
    key rotation, and key export.

    Args:
        key_store: Optional :class:`KeyStore` instance.  If ``None``,
            a new :class:`KeyStore` is created and a signing key is
            generated automatically.
    """

    def __init__(self, key_store: KeyStore | None = None) -> None:
        """Initialize with optional key store. Creates one if not provided."""
        if key_store is None:
            self._key_store = KeyStore()
            self._key_store.generate_key()
        else:
            self._key_store = key_store
        self._signer = Ed25519Signer(self._key_store)

    # ------------------------------------------------------------------
    # Signing
    # ------------------------------------------------------------------

    def sign(self, domain: bytes, message: bytes) -> Signature:
        """Sign a domain-separated message.

        The signature is computed over a domain-separated pre-hash::

            prehash = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)
            signature = Ed25519.sign(prehash)

        Args:
            domain:  Domain separation prefix (e.g. ``DOMAIN_PAYLOAD``).
            message: Arbitrary message bytes.

        Returns:
            A :class:`Signature` object.

        Raises:
            SignatureError: If the domain is empty or signing fails.
            CryptoError:    If the underlying signing key is unavailable.
        """
        try:
            return self._signer.sign(domain, message)
        except SignatureError:
            raise
        except Exception as exc:
            raise CryptoError(
                f"Failed to sign message: {exc}",
                code="CRYPTO_SIGN_FAILED",
                detail={"domain": domain.decode("ascii", errors="replace")},
            ) from exc

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------

    def verify(self, domain: bytes, message: bytes, signature: Signature) -> bool:
        """Verify a domain-separated signature.

        Args:
            domain:    Domain separation prefix.
            message:   Original message bytes.
            signature: The :class:`Signature` to verify.

        Returns:
            ``True`` if the signature is valid.

        Raises:
            SignatureError: If the domain is empty or verification fails.
            CryptoError:    On unexpected errors.
        """
        try:
            return self._signer.verify(domain, message, signature)
        except SignatureError:
            raise
        except Exception as exc:
            raise CryptoError(
                f"Failed to verify signature: {exc}",
                code="CRYPTO_VERIFY_FAILED",
                detail={"domain": domain.decode("ascii", errors="replace")},
            ) from exc

    # ------------------------------------------------------------------
    # Hashing
    # ------------------------------------------------------------------

    def hash_payload(self, data: bytes) -> bytes:
        """Hash payload data with domain separation.

        Uses the ``VVU:PAYLOAD:1:`` domain prefix.

        Args:
            data: Raw payload bytes.

        Returns:
            32-byte SHA-256 digest.
        """
        return hash_payload(data)

    def hash_envelope(self, data: bytes) -> bytes:
        """Hash envelope data with domain separation.

        Uses the ``VVU:ENVELOPE:1:`` domain prefix.

        Args:
            data: Raw envelope bytes.

        Returns:
            32-byte SHA-256 digest.
        """
        return hash_envelope(data)

    # ------------------------------------------------------------------
    # Key management
    # ------------------------------------------------------------------

    def rotate_key(self) -> KeyPair:
        """Rotate the signing key.

        Generates a new Ed25519 key pair and adds it to the key store.
        The new key automatically becomes the active signing key.

        Returns:
            The newly generated :class:`KeyPair`.

        Raises:
            CryptoError: If key rotation fails.
        """
        try:
            return self._signer.rotate_key()
        except Exception as exc:
            raise CryptoError(
                f"Failed to rotate key: {exc}",
                code="CRYPTO_KEY_ROTATION_FAILED",
            ) from exc

    def get_active_key(self) -> KeyPair:
        """Get the current active signing key.

        Returns:
            The :class:`KeyPair` with the highest version number that
            has not been revoked.

        Raises:
            CryptoError: If no active signing key is available.
        """
        try:
            return self._key_store.get_signing_key()
        except Exception as exc:
            raise CryptoError(
                f"No active signing key: {exc}",
                code="CRYPTO_NO_ACTIVE_KEY",
            ) from exc

    def get_key_store(self) -> KeyStore:
        """Get the underlying key store.

        Returns:
            The :class:`KeyStore` used by this engine.
        """
        return self._key_store

    def export_public_keys(self) -> list[KeyVersion]:
        """Export all public key versions.

        The returned list contains **public keys only** — no private key
        material is included.

        Returns:
            List of :class:`KeyVersion` objects sorted by version.
        """
        return self._key_store.export_public_keys()
