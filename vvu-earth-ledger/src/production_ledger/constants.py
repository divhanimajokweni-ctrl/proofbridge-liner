"""VVU Earth Tech Ledger — Domain separation prefixes, limits, and protocol constants.

All domain separation prefixes are bytes literals used in domain-separated hashing
to ensure that hashes computed in one context cannot be replayed in another.

Serializer limits enforce bounds on canonical encoding to prevent denial-of-service
and ensure deterministic behaviour across implementations.

MMR, validator, database, and network constants tune the protocol and its
infrastructure layer.
"""

# ---------------------------------------------------------------------------
# Domain separation prefixes
# ---------------------------------------------------------------------------
# Each prefix is a bytes literal with a version tag so that the protocol can
# evolve without breaking existing hashes.  The trailing colon makes the
# boundary between the prefix and the payload unambiguous.

DOMAIN_PAYLOAD: bytes = b"VVU:PAYLOAD:1:"
DOMAIN_ENVELOPE: bytes = b"VVU:ENVELOPE:1:"
DOMAIN_REVISION: bytes = b"VVU:REVISION:1:"
DOMAIN_MMR_INTERNAL: bytes = b"VVU:MMR:INT:1:"
DOMAIN_MMR_BAGGING: bytes = b"VVU:MMR:BAG:1:"
DOMAIN_SNAPSHOT: bytes = b"VVU:SNAP:1:"
DOMAIN_REPLAY: bytes = b"VVU:REPLAY:1:"
DOMAIN_PROOF: bytes = b"VVU:PROOF:1:"
DOMAIN_KEY_ROTATION: bytes = b"VVU:KEYROT:1:"

# ---------------------------------------------------------------------------
# Serializer limits
# ---------------------------------------------------------------------------

MAX_DEPTH: int = 64
"""Maximum nesting depth for canonical encoding."""

MAX_OBJECT_SIZE: int = 16 * 1024 * 1024
"""Maximum encoded size of a single object in bytes (16 MiB)."""

MAX_INT_WIDTH: int = 256
"""Maximum byte-width of an integer value (256 bytes → 2048 bits)."""

MAX_STRING_LENGTH: int = 2 * 1024 * 1024
"""Maximum length of a string value in bytes (2 MiB)."""

# ---------------------------------------------------------------------------
# MMR constants
# ---------------------------------------------------------------------------

LEAF_HASH_PREFIX: int = 0x00
"""Prefix byte for MMR leaf hashing."""

BRANCH_HASH_PREFIX: int = 0x01
"""Prefix byte for MMR branch (internal node) hashing."""

# ---------------------------------------------------------------------------
# Validator constants
# ---------------------------------------------------------------------------

MAX_VALIDATORS: int = 256
"""Maximum number of active validators."""

MIN_QUORUM: int = 2
"""Minimum number of validators required for quorum."""

MAX_WEIGHT: int = 1000
"""Maximum weight a single validator may hold."""

# ---------------------------------------------------------------------------
# Database constants
# ---------------------------------------------------------------------------

BUSY_TIMEOUT: int = 5000
"""SQLite busy timeout in milliseconds."""

CACHE_SIZE: int = -64000
"""SQLite cache size in KiB (negative = absolute limit)."""

PAGE_SIZE: int = 4096
"""SQLite page size in bytes."""

# ---------------------------------------------------------------------------
# Network constants
# ---------------------------------------------------------------------------

DEFAULT_PORT: int = 50051
"""Default gRPC listen port."""

MAX_MESSAGE_SIZE: int = 4 * 1024 * 1024
"""Maximum gRPC message size in bytes (4 MiB)."""

KEEPALIVE_MS: int = 30000
"""gRPC keepalive interval in milliseconds."""
