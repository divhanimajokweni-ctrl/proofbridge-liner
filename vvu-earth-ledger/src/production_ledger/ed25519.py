"""VVU Earth Tech Ledger — Production Ed25519 signing and verification.

This module provides the production Ed25519 implementation using PyNaCl as the
vetted cryptographic backend.  It wraps PyNaCl's ``SigningKey`` / ``VerifyKey``
with key versioning, rotation support, and domain-separated signing.

Key design decisions:

* **PyNaCl backend** — all cryptographic operations delegate to ``nacl.signing``
  which wraps libsodium's vetted Ed25519 implementation.
* **Domain separation** — every signature produced through :class:`Ed25519Signer`
  is computed over a domain-separated hash::

      SHA-256(domain ‖ len(domain)₄ ‖ message)

  This prevents cross-protocol signature replay.
* **Key versioning** — each key pair carries a monotonically increasing version
  number so that consumers can identify which key produced a given signature.
* **Revocation** — keys can be revoked at a specific epoch; revoked keys are
  refused for both signing and verification.

All key material is stored as raw ``bytes`` (never hex strings).  The private
signing key is never exposed outside this module.
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass

import nacl.exceptions
import nacl.signing

from .exceptions import (
    InvalidSignatureError,
    KeyExpiredError,
    KeyNotFoundError,
    SignatureError,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _compute_key_id(public_key: bytes) -> bytes:
    """Compute a 4-byte key identifier from an Ed25519 public key.

    The identifier is the first 4 bytes of ``SHA-256(public_key)``.  This
    provides a compact, collision-resistant tag for key lookup.

    Args:
        public_key: 32-byte Ed25519 public key.

    Returns:
        4-byte key identifier.
    """
    return hashlib.sha256(public_key).digest()[:4]


def _domain_hash(domain: bytes, message: bytes) -> bytes:
    """Compute a domain-separated SHA-256 hash.

    The construction is::

        SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)

    This matches the domain-hash used in :mod:`production_ledger.hashing`.

    Args:
        domain:  Domain separation prefix (e.g. ``DOMAIN_PAYLOAD``).
        message: Arbitrary payload bytes.

    Returns:
        32-byte SHA-256 digest.
    """
    h = hashlib.sha256()
    h.update(domain)
    h.update(len(domain).to_bytes(4, "big"))
    h.update(message)
    return h.digest()


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class KeyVersion:
    """Public-only view of an Ed25519 key with versioning metadata.

    This is the *shareable* representation of a key — it contains the public
    key and metadata but **no** private key material.

    Attributes:
        version:          Key version number (starts at 1).
        key_id:           4-byte key identifier.
        public_key:       32-byte Ed25519 public key.
        created_at:       Creation timestamp (POSIX epoch seconds).
        revocation_epoch: Epoch when key was revoked, or ``None`` if active.
    """

    version: int
    key_id: bytes
    public_key: bytes
    created_at: float
    revocation_epoch: int | None = None

    @property
    def is_active(self) -> bool:
        """Return ``True`` if this key has not been revoked."""
        return self.revocation_epoch is None


@dataclass(frozen=True)
class Signature:
    """An Ed25519 signature together with key-identifying metadata.

    Attributes:
        key_id:      4-byte identifier of the signing key.
        key_version: Version number of the signing key.
        signature:   64-byte Ed25519 signature.
        timestamp:   Signing timestamp (POSIX epoch seconds).
    """

    key_id: bytes
    key_version: int
    signature: bytes
    timestamp: float


@dataclass(frozen=True)
class KeyPair:
    """An Ed25519 key pair with versioning metadata.

    .. warning::

       The ``signing_key`` field contains the 32-byte private key and **MUST
       NOT** be exposed outside this module.

    Attributes:
        version:     Key version number.
        signing_key: 32-byte Ed25519 private key (seed).
        public_key:  32-byte Ed25519 public key.
        key_id:      4-byte key identifier.
        created_at:  Creation timestamp (POSIX epoch seconds).
    """

    version: int
    signing_key: bytes
    public_key: bytes
    key_id: bytes
    created_at: float

    # -- Signing -----------------------------------------------------------

    def sign(self, message: bytes) -> Signature:
        """Sign *message* using the Ed25519 private key.

        The message is signed as-is.  When used through :class:`Ed25519Signer`
        the caller is expected to pass a domain-separated pre-hash so that
        the final signature is domain-separated.

        Args:
            message: The message bytes to sign.

        Returns:
            A :class:`Signature` object containing the 64-byte Ed25519
            signature together with key metadata.

        Raises:
            SignatureError: If the underlying signing operation fails.
        """
        try:
            sk = nacl.signing.SigningKey(self.signing_key)
            signed = sk.sign(message)
            return Signature(
                key_id=self.key_id,
                key_version=self.version,
                signature=bytes(signed.signature),
                timestamp=time.time(),
            )
        except Exception as exc:
            raise SignatureError(
                f"Failed to sign message: {exc}",
                code="SIGNATURE_SIGN_FAILED",
                detail={"key_id": self.key_id.hex()},
            ) from exc

    # -- Conversion --------------------------------------------------------

    def to_key_version(self) -> KeyVersion:
        """Return a public-only :class:`KeyVersion` view of this key pair.

        The returned object contains **no** private key material and is safe
        to share with external parties.
        """
        return KeyVersion(
            version=self.version,
            key_id=self.key_id,
            public_key=self.public_key,
            created_at=self.created_at,
        )


# ---------------------------------------------------------------------------
# KeyStore
# ---------------------------------------------------------------------------

class KeyStore:
    """Manages multiple Ed25519 key versions with rotation and revocation.

    The store maintains an ordered collection of :class:`KeyPair` objects and
    supports key generation, revocation, and signature verification.

    Typical usage::

        store = KeyStore()
        kp = store.generate_key()          # version 1
        store.revoke_key(kp.key_id, 42)    # revoke at epoch 42
        kp2 = store.generate_key()         # version 2
    """

    def __init__(self) -> None:
        """Initialise an empty key store."""
        self._keys: dict[bytes, KeyPair] = {}          # key_id -> KeyPair
        self._revocations: dict[bytes, int] = {}        # key_id -> revocation_epoch
        self._next_version: int = 1

    # -- Key generation ----------------------------------------------------

    def generate_key(self) -> KeyPair:
        """Generate a new Ed25519 key pair and add it to the store.

        The version number is automatically incremented starting from 1.

        Returns:
            The newly generated :class:`KeyPair`.
        """
        sk = nacl.signing.SigningKey.generate()
        private_bytes = bytes(sk)
        public_bytes = bytes(sk.verify_key)
        key_id = _compute_key_id(public_bytes)

        keypair = KeyPair(
            version=self._next_version,
            signing_key=private_bytes,
            public_key=public_bytes,
            key_id=key_id,
            created_at=time.time(),
        )

        self._next_version += 1
        self._keys[key_id] = keypair
        return keypair

    # -- Key management ----------------------------------------------------

    def add_key(self, keypair: KeyPair) -> None:
        """Add an existing key pair to the store.

        This is useful when restoring keys from persistent storage.  The
        internal version counter is adjusted so that subsequent calls to
        :meth:`generate_key` will not collide with the imported key's
        version.

        Args:
            keypair: The :class:`KeyPair` to add.
        """
        self._keys[keypair.key_id] = keypair
        if keypair.version >= self._next_version:
            self._next_version = keypair.version + 1

    def get_signing_key(self, key_id: bytes | None = None) -> KeyPair:
        """Return the active signing key.

        If *key_id* is ``None``, returns the **latest** active key (highest
        version number).  If *key_id* is specified, returns the key with
        that identifier.

        Args:
            key_id: Optional 4-byte key identifier.

        Returns:
            The requested :class:`KeyPair`.

        Raises:
            KeyNotFoundError: If no matching key exists.
            KeyExpiredError:  If the requested key has been revoked.
        """
        if key_id is None:
            # Return the latest active key (highest version)
            active_keys = [
                kp for kp in self._keys.values()
                if kp.key_id not in self._revocations
            ]
            if not active_keys:
                raise KeyNotFoundError(
                    "no active signing key available",
                    detail={"reason": "no_active_keys"},
                )
            return max(active_keys, key=lambda kp: kp.version)

        kp = self._keys.get(key_id)
        if kp is None:
            raise KeyNotFoundError(
                key_id.hex(),
                detail={"key_id": key_id.hex()},
            )
        if key_id in self._revocations:
            raise KeyExpiredError(
                key_id.hex(),
                detail={
                    "key_id": key_id.hex(),
                    "revocation_epoch": self._revocations[key_id],
                },
            )
        return kp

    def get_key_version(self, key_id: bytes) -> KeyVersion | None:
        """Look up a key version by its identifier.

        Unlike :meth:`get_signing_key`, this method does **not** raise on
        revoked keys — it simply returns the :class:`KeyVersion` with the
        revocation metadata populated.

        Args:
            key_id: 4-byte key identifier.

        Returns:
            A :class:`KeyVersion` if the key exists, otherwise ``None``.
        """
        kp = self._keys.get(key_id)
        if kp is None:
            return None
        return KeyVersion(
            version=kp.version,
            key_id=kp.key_id,
            public_key=kp.public_key,
            created_at=kp.created_at,
            revocation_epoch=self._revocations.get(key_id),
        )

    # -- Revocation --------------------------------------------------------

    def revoke_key(self, key_id: bytes, epoch: int) -> None:
        """Mark a key as revoked at the given *epoch*.

        Once revoked, the key can no longer be used for signing or
        verification.

        Args:
            key_id: 4-byte key identifier.
            epoch:  The epoch at which the key was revoked.

        Raises:
            KeyNotFoundError: If the key is not found in the store.
            SignatureError:   If the key is already revoked.
        """
        if key_id not in self._keys:
            raise KeyNotFoundError(
                key_id.hex(),
                detail={"key_id": key_id.hex()},
            )
        if key_id in self._revocations:
            raise SignatureError(
                f"Key {key_id.hex()} is already revoked",
                code="SIGNATURE_KEY_ALREADY_REVOKED",
                detail={
                    "key_id": key_id.hex(),
                    "existing_epoch": self._revocations[key_id],
                },
            )
        self._revocations[key_id] = epoch

    # -- Listing -----------------------------------------------------------

    def list_active_keys(self) -> list[KeyVersion]:
        """Return all active (non-revoked) keys, sorted by version."""
        result: list[KeyVersion] = []
        for kp in self._keys.values():
            if kp.key_id not in self._revocations:
                result.append(kp.to_key_version())
        return sorted(result, key=lambda kv: kv.version)

    def list_all_keys(self) -> list[KeyVersion]:
        """Return all keys including revoked ones, sorted by version."""
        result: list[KeyVersion] = []
        for kp in self._keys.values():
            result.append(
                KeyVersion(
                    version=kp.version,
                    key_id=kp.key_id,
                    public_key=kp.public_key,
                    created_at=kp.created_at,
                    revocation_epoch=self._revocations.get(kp.key_id),
                )
            )
        return sorted(result, key=lambda kv: kv.version)

    # -- Verification ------------------------------------------------------

    def verify_signature(self, message: bytes, signature: Signature) -> bool:
        """Verify *signature* against the correct key version.

        The key is located via ``signature.key_id``.  If the key has been
        revoked, verification fails with :class:`KeyExpiredError`.

        Args:
            message:   The original message bytes that were signed.
            signature: The :class:`Signature` to verify.

        Returns:
            ``True`` if the signature is valid.

        Raises:
            KeyNotFoundError:      If the signing key is not found.
            KeyExpiredError:       If the signing key has been revoked.
            InvalidSignatureError: If the signature is cryptographically
                                   invalid.
        """
        kp = self._keys.get(signature.key_id)
        if kp is None:
            raise KeyNotFoundError(
                signature.key_id.hex(),
                detail={"key_id": signature.key_id.hex()},
            )

        if signature.key_id in self._revocations:
            raise KeyExpiredError(
                signature.key_id.hex(),
                detail={
                    "key_id": signature.key_id.hex(),
                    "revocation_epoch": self._revocations[signature.key_id],
                },
            )

        try:
            vk = nacl.signing.VerifyKey(kp.public_key)
            vk.verify(message, signature.signature)
            return True
        except nacl.exceptions.BadSignatureError:
            raise InvalidSignatureError(
                detail={
                    "key_id": signature.key_id.hex(),
                    "key_version": signature.key_version,
                },
            )
        except Exception as exc:
            raise SignatureError(
                f"Signature verification failed: {exc}",
                code="SIGNATURE_VERIFY_FAILED",
                detail={"key_id": signature.key_id.hex()},
            ) from exc

    # -- Export ------------------------------------------------------------

    def export_public_keys(self) -> list[KeyVersion]:
        """Export all key versions for sharing.

        The returned list contains **public keys only** — no private key
        material is included.

        Returns:
            List of :class:`KeyVersion` objects sorted by version.
        """
        return self.list_all_keys()


# ---------------------------------------------------------------------------
# Ed25519Signer — main signing / verification interface
# ---------------------------------------------------------------------------

class Ed25519Signer:
    """High-level Ed25519 signing and verification with domain separation.

    All signatures are computed over a domain-separated hash::

        hash = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)
        signature = Ed25519.sign(hash)

    This ensures that signatures produced under one domain cannot be replayed
    in another, even if the underlying message is identical.

    Typical usage::

        store  = KeyStore()
        signer = Ed25519Signer(store)
        store.generate_key()

        sig = signer.sign(DOMAIN_PAYLOAD, b"hello world")
        assert signer.verify(DOMAIN_PAYLOAD, b"hello world", sig)
    """

    def __init__(self, key_store: KeyStore) -> None:
        """Initialise with a :class:`KeyStore`.

        Args:
            key_store: The key store managing the signing keys.
        """
        self._key_store = key_store

    # -- Signing -----------------------------------------------------------

    def sign(self, domain: bytes, message: bytes) -> Signature:
        """Sign a domain-separated message.

        The construction is::

            prehash = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)
            signature = Ed25519.sign(prehash)

        Args:
            domain:  Domain separation prefix (e.g. ``DOMAIN_PAYLOAD``).
            message: Arbitrary message bytes.

        Returns:
            A :class:`Signature` object.

        Raises:
            SignatureError:   If domain is empty or signing fails.
            KeyNotFoundError: If no active signing key is available.
        """
        if not domain:
            raise SignatureError(
                "Domain prefix must not be empty",
                code="SIGNATURE_EMPTY_DOMAIN",
                detail={"reason": "empty_domain"},
            )
        prehashed = _domain_hash(domain, message)
        keypair = self._key_store.get_signing_key()
        return keypair.sign(prehashed)

    # -- Verification ------------------------------------------------------

    def verify(self, domain: bytes, message: bytes, signature: Signature) -> bool:
        """Verify a domain-separated message signature.

        The construction mirrors :meth:`sign`::

            prehash = SHA-256(domain ‖ len(domain).to_bytes(4, 'big') ‖ message)
            valid = Ed25519.verify(prehash, signature)

        Args:
            domain:    Domain separation prefix.
            message:   Original message bytes.
            signature: The :class:`Signature` to verify.

        Returns:
            ``True`` if the signature is valid.

        Raises:
            SignatureError:        If domain is empty.
            KeyNotFoundError:      If the signing key is not found.
            KeyExpiredError:       If the signing key has been revoked.
            InvalidSignatureError: If the signature is cryptographically
                                   invalid.
        """
        if not domain:
            raise SignatureError(
                "Domain prefix must not be empty",
                code="SIGNATURE_EMPTY_DOMAIN",
                detail={"reason": "empty_domain"},
            )
        prehashed = _domain_hash(domain, message)
        return self._key_store.verify_signature(prehashed, signature)

    # -- Key rotation ------------------------------------------------------

    def rotate_key(self) -> KeyPair:
        """Generate a new key pair and add it to the store.

        This is the primary mechanism for key rotation: the new key
        automatically becomes the latest active signing key.

        Returns:
            The newly generated :class:`KeyPair`.
        """
        return self._key_store.generate_key()
