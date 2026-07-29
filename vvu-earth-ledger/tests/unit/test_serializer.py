"""Tests for the deterministic canonical serializer."""

from __future__ import annotations

import hashlib
import io

import pytest

from production_ledger.constants import MAX_DEPTH
from production_ledger.exceptions import (
    DepthExceededError,
    InvalidTypeError,
    SerializationError,
)
from production_ledger.serializer import (
    VERSION_HEADER,
    canonical_decode,
    canonical_decode_stream,
    canonical_encode,
    canonical_encode_stream,
    canonical_hash,
)


# ---------------------------------------------------------------------------
# Round-trip helper
# ---------------------------------------------------------------------------

def roundtrip(obj: object) -> object:
    """Encode and decode an object, returning the decoded value."""
    return canonical_decode(canonical_encode(obj))


# ---------------------------------------------------------------------------
# None
# ---------------------------------------------------------------------------

class TestNone:
    def test_none(self) -> None:
        assert roundtrip(None) is None


# ---------------------------------------------------------------------------
# Bool
# ---------------------------------------------------------------------------

class TestBool:
    def test_bool_true(self) -> None:
        assert roundtrip(True) is True

    def test_bool_false(self) -> None:
        assert roundtrip(False) is False


# ---------------------------------------------------------------------------
# Int
# ---------------------------------------------------------------------------

class TestInt:
    def test_int_zero(self) -> None:
        assert roundtrip(0) == 0

    def test_int_positive(self) -> None:
        assert roundtrip(42) == 42

    def test_int_negative(self) -> None:
        assert roundtrip(-42) == -42

    def test_int_large(self) -> None:
        assert roundtrip(2**64) == 2**64

    def test_int_one(self) -> None:
        assert roundtrip(1) == 1

    def test_int_minus_one(self) -> None:
        assert roundtrip(-1) == -1


# ---------------------------------------------------------------------------
# Bytes
# ---------------------------------------------------------------------------

class TestBytes:
    def test_bytes_empty(self) -> None:
        assert roundtrip(b"") == b""

    def test_bytes_value(self) -> None:
        assert roundtrip(b"hello") == b"hello"


# ---------------------------------------------------------------------------
# Str
# ---------------------------------------------------------------------------

class TestStr:
    def test_str_empty(self) -> None:
        assert roundtrip("") == ""

    def test_str_value(self) -> None:
        assert roundtrip("hello world") == "hello world"


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

class TestList:
    def test_list_empty(self) -> None:
        assert roundtrip([]) == []

    def test_list_nested(self) -> None:
        assert roundtrip([1, [2, 3]]) == [1, [2, 3]]


# ---------------------------------------------------------------------------
# Dict
# ---------------------------------------------------------------------------

class TestDict:
    def test_dict_empty(self) -> None:
        assert roundtrip({}) == {}

    def test_dict_ordering(self) -> None:
        """Dicts with different insertion order encode identically."""
        d1 = {"b": 1, "a": 2}
        d2 = {"a": 2, "b": 1}
        assert canonical_encode(d1) == canonical_encode(d2)

    def test_dict_nested(self) -> None:
        assert roundtrip({"a": {"b": 1}}) == {"a": {"b": 1}}


# ---------------------------------------------------------------------------
# Depth limit
# ---------------------------------------------------------------------------

class TestDepthLimit:
    def test_depth_limit(self) -> None:
        """Deeply nested objects raise DepthExceededError."""
        # Create an object nested deeper than MAX_DEPTH
        obj: list = []
        current = obj
        for _ in range(MAX_DEPTH + 5):
            current.append([])
            current = current[0]
        with pytest.raises(DepthExceededError):
            canonical_encode(obj)


# ---------------------------------------------------------------------------
# Type rejection
# ---------------------------------------------------------------------------

class TestTypeRejection:
    def test_float_rejected(self) -> None:
        """Float values raise InvalidTypeError."""
        with pytest.raises(InvalidTypeError):
            canonical_encode(3.14)


# ---------------------------------------------------------------------------
# Version header
# ---------------------------------------------------------------------------

class TestVersionHeader:
    def test_version_header(self) -> None:
        """Output starts with the correct magic bytes."""
        encoded = canonical_encode(42)
        assert encoded[:4] == VERSION_HEADER
        assert encoded[:4] == b"VVU\x01"


# ---------------------------------------------------------------------------
# Streaming
# ---------------------------------------------------------------------------

class TestStreaming:
    def test_streaming(self) -> None:
        """Stream round-trip matches direct round-trip."""
        obj = {"key": "value", "num": 42, "data": b"\x00\x01\x02"}
        # Direct
        direct = canonical_encode(obj)
        # Stream
        buf = io.BytesIO()
        canonical_encode_stream(obj, buf)
        stream_bytes = buf.getvalue()
        assert direct == stream_bytes
        # Decode stream
        buf.seek(0)
        decoded = canonical_decode_stream(buf)
        assert decoded == obj


# ---------------------------------------------------------------------------
# Canonical hash
# ---------------------------------------------------------------------------

class TestCanonicalHash:
    def test_canonical_hash(self) -> None:
        """canonical_hash produces a 32-byte SHA-256 digest."""
        h = canonical_hash({"test": 42})
        assert len(h) == 32
        # Verify it matches SHA-256 of the encoded form
        assert h == hashlib.sha256(canonical_encode({"test": 42})).digest()
