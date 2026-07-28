"""VVU Earth Tech Ledger — Deterministic canonical serializer.

Binary format
~~~~~~~~~~~~~

Every encoded stream starts with a 4-byte **version header** ``VVU\\x01``.

Each value is encoded as::

    type_tag (1 byte)  +  length_or_count (4 bytes, big-endian)  +  data

Type tags
^^^^^^^^^

+--------+-----------+-------------------------------------------+
| Tag    | Type      | Data layout                               |
+========+===========+===========================================+
| 0x00   | None      | (no length, no data)                      |
+--------+-----------+-------------------------------------------+
| 0x01   | True      | (no length, no data)                      |
+--------+-----------+-------------------------------------------+
| 0x02   | False     | (no length, no data)                      |
+--------+-----------+-------------------------------------------+
| 0x03   | int       | sign (1B) + magnitude (minimal big-endian)|
+--------+-----------+-------------------------------------------+
| 0x04   | bytes     | raw bytes                                 |
+--------+-----------+-------------------------------------------+
| 0x05   | str       | UTF-8 encoded bytes                       |
+--------+-----------+-------------------------------------------+
| 0x06   | list      | element_count (4B) + encoded elements     |
+--------+-----------+-------------------------------------------+
| 0x07   | dict      | pair_count (4B) + sorted key-value pairs  |
+--------+-----------+-------------------------------------------+

Integer encoding uses sign-magnitude: the first byte of the data is ``0x00``
for non-negative and ``0x01`` for negative.  The remaining bytes are the
absolute value in minimal big-endian form (zero is encoded as sign-only).

Determinism
^^^^^^^^^^^

* Dictionary keys are sorted by their UTF-8 byte representation.
* Integer magnitudes use the minimum number of bytes (no leading zeros).
* The same Python object always produces the same byte sequence.
"""

from __future__ import annotations

import hashlib
import struct
from typing import Any, BinaryIO

from .constants import (
    MAX_DEPTH,
    MAX_INT_WIDTH,
    MAX_OBJECT_SIZE,
    MAX_STRING_LENGTH,
)
from .exceptions import (
    DepthExceededError,
    InvalidTypeError,
    SerializationError,
    SizeExceededError,
)

# ---------------------------------------------------------------------------
# Type tags
# ---------------------------------------------------------------------------

TAG_NONE: int = 0x00
TAG_TRUE: int = 0x01
TAG_FALSE: int = 0x02
TAG_INT: int = 0x03
TAG_BYTES: int = 0x04
TAG_STR: int = 0x05
TAG_LIST: int = 0x06
TAG_DICT: int = 0x07

# ---------------------------------------------------------------------------
# Version header
# ---------------------------------------------------------------------------

VERSION_HEADER: bytes = b"VVU\x01"

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _int_to_bytes(value: int) -> bytes:
    """Encode an integer as sign byte + minimal big-endian magnitude.

    * Zero → ``b"\\x00"`` (sign only, no magnitude bytes).
    * Positive → ``b"\\x00" + magnitude``.
    * Negative → ``b"\\x01" + magnitude``.
    """
    if value == 0:
        return b"\x00"
    if value > 0:
        return b"\x00" + _magnitude_bytes(value)
    return b"\x01" + _magnitude_bytes(-value)


def _magnitude_bytes(value: int) -> bytes:
    """Return the minimal big-endian representation of a positive integer."""
    if value == 0:
        return b""
    length = (value.bit_length() + 7) // 8
    return value.to_bytes(length, byteorder="big")


def _bytes_to_int(data: bytes) -> int:
    """Decode sign byte + magnitude back to an integer."""
    if not data:
        raise SerializationError(
            "Empty integer data",
            code="SERIALIZATION_DECODE_INT_EMPTY",
        )
    sign = data[0]
    magnitude_data = data[1:]
    if sign == 0x00:
        if not magnitude_data:
            return 0
        return int.from_bytes(magnitude_data, byteorder="big")
    if sign == 0x01:
        if not magnitude_data:
            raise SerializationError(
                "Negative zero is not representable",
                code="SERIALIZATION_NEGATIVE_ZERO",
            )
        return -int.from_bytes(magnitude_data, byteorder="big")
    raise SerializationError(
        f"Invalid integer sign byte: 0x{sign:02x}",
        code="SERIALIZATION_INVALID_INT_SIGN",
        detail={"sign_byte": sign},
    )


def _encode_none() -> bytes:
    """Encode None."""
    return struct.pack("B", TAG_NONE)


def _encode_bool(value: bool) -> bytes:
    """Encode a boolean."""
    return struct.pack("B", TAG_TRUE if value else TAG_FALSE)


def _encode_int(value: int) -> bytes:
    """Encode an integer with tag and length prefix."""
    data = _int_to_bytes(value)
    # Validate integer width
    if len(data) - 1 > MAX_INT_WIDTH:  # subtract sign byte
        raise SerializationError(
            f"Integer width {len(data) - 1} exceeds maximum {MAX_INT_WIDTH}",
            code="SERIALIZATION_INT_WIDTH_EXCEEDED",
            detail={"width": len(data) - 1, "max_width": MAX_INT_WIDTH},
        )
    return struct.pack("B", TAG_INT) + struct.pack(">I", len(data)) + data


def _encode_bytes(value: bytes) -> bytes:
    """Encode a bytes object with tag and length prefix."""
    return struct.pack("B", TAG_BYTES) + struct.pack(">I", len(value)) + value


def _encode_str(value: str) -> bytes:
    """Encode a string as UTF-8 with tag and length prefix."""
    encoded = value.encode("utf-8")
    if len(encoded) > MAX_STRING_LENGTH:
        raise SerializationError(
            f"String length {len(encoded)} exceeds maximum {MAX_STRING_LENGTH}",
            code="SERIALIZATION_STRING_LENGTH_EXCEEDED",
            detail={"length": len(encoded), "max_length": MAX_STRING_LENGTH},
        )
    return struct.pack("B", TAG_STR) + struct.pack(">I", len(encoded)) + encoded


def _encode_list(value: list[Any], depth: int, max_size: int) -> bytes:
    """Encode a list with tag and count prefix."""
    parts: list[bytes] = [struct.pack("B", TAG_LIST), struct.pack(">I", len(value))]
    for item in value:
        parts.append(_encode_value(item, depth + 1, max_size))
    return b"".join(parts)


def _encode_dict(value: dict[str, Any], depth: int, max_size: int) -> bytes:
    """Encode a dict with tag, count prefix, and sorted keys."""
    # Sort keys by their UTF-8 byte representation for determinism
    sorted_keys = sorted(value.keys(), key=lambda k: k.encode("utf-8"))
    parts: list[bytes] = [struct.pack("B", TAG_DICT), struct.pack(">I", len(value))]
    for key in sorted_keys:
        parts.append(_encode_str(key))
        parts.append(_encode_value(value[key], depth + 1, max_size))
    return b"".join(parts)


def _encode_value(obj: Any, depth: int, max_size: int) -> bytes:
    """Encode a single value with depth and size tracking."""
    if depth > MAX_DEPTH:
        raise DepthExceededError(depth, MAX_DEPTH)

    if obj is None:
        result = _encode_none()
    elif isinstance(obj, bool):
        # Must check bool before int because bool is a subclass of int
        result = _encode_bool(obj)
    elif isinstance(obj, int):
        result = _encode_int(obj)
    elif isinstance(obj, bytes):
        result = _encode_bytes(obj)
    elif isinstance(obj, str):
        result = _encode_str(obj)
    elif isinstance(obj, list):
        result = _encode_list(obj, depth, max_size)
    elif isinstance(obj, dict):
        result = _encode_dict(obj, depth, max_size)
    elif isinstance(obj, float):
        raise InvalidTypeError("float", detail={"reason": "floats are not supported"})
    else:
        raise InvalidTypeError(
            type(obj).__name__,
            detail={"reason": f"type {type(obj).__name__} is not serializable"},
        )

    if len(result) > max_size:
        raise SizeExceededError(len(result), max_size)

    return result


# ---------------------------------------------------------------------------
# Streaming encode helpers
# ---------------------------------------------------------------------------

def _stream_write(stream: BinaryIO, data: bytes) -> None:
    """Write bytes to a stream."""
    stream.write(data)


def _encode_none_stream(stream: BinaryIO) -> None:
    """Encode None to a stream."""
    _stream_write(stream, struct.pack("B", TAG_NONE))


def _encode_bool_stream(stream: BinaryIO, value: bool) -> None:
    """Encode a boolean to a stream."""
    _stream_write(stream, struct.pack("B", TAG_TRUE if value else TAG_FALSE))


def _encode_int_stream(stream: BinaryIO, value: int) -> bytes:
    """Encode an integer to a stream. Returns the data bytes for size tracking."""
    data = _int_to_bytes(value)
    if len(data) - 1 > MAX_INT_WIDTH:
        raise SerializationError(
            f"Integer width {len(data) - 1} exceeds maximum {MAX_INT_WIDTH}",
            code="SERIALIZATION_INT_WIDTH_EXCEEDED",
            detail={"width": len(data) - 1, "max_width": MAX_INT_WIDTH},
        )
    _stream_write(stream, struct.pack("B", TAG_INT))
    _stream_write(stream, struct.pack(">I", len(data)))
    _stream_write(stream, data)
    return data


def _encode_bytes_stream(stream: BinaryIO, value: bytes) -> None:
    """Encode bytes to a stream."""
    _stream_write(stream, struct.pack("B", TAG_BYTES))
    _stream_write(stream, struct.pack(">I", len(value)))
    _stream_write(stream, value)


def _encode_str_stream(stream: BinaryIO, value: str) -> None:
    """Encode a string to a stream."""
    encoded = value.encode("utf-8")
    if len(encoded) > MAX_STRING_LENGTH:
        raise SerializationError(
            f"String length {len(encoded)} exceeds maximum {MAX_STRING_LENGTH}",
            code="SERIALIZATION_STRING_LENGTH_EXCEEDED",
            detail={"length": len(encoded), "max_length": MAX_STRING_LENGTH},
        )
    _stream_write(stream, struct.pack("B", TAG_STR))
    _stream_write(stream, struct.pack(">I", len(encoded)))
    _stream_write(stream, encoded)


def _encode_value_stream(obj: Any, stream: BinaryIO, depth: int) -> int:
    """Encode a value to a stream. Returns the number of bytes written."""
    if depth > MAX_DEPTH:
        raise DepthExceededError(depth, MAX_DEPTH)

    start_pos = stream.tell() if hasattr(stream, "tell") else 0

    if obj is None:
        _encode_none_stream(stream)
    elif isinstance(obj, bool):
        _encode_bool_stream(stream, obj)
    elif isinstance(obj, int):
        _encode_int_stream(stream, obj)
    elif isinstance(obj, bytes):
        _encode_bytes_stream(stream, obj)
    elif isinstance(obj, str):
        _encode_str_stream(stream, obj)
    elif isinstance(obj, list):
        _stream_write(stream, struct.pack("B", TAG_LIST))
        _stream_write(stream, struct.pack(">I", len(obj)))
        for item in obj:
            _encode_value_stream(item, stream, depth + 1)
    elif isinstance(obj, dict):
        sorted_keys = sorted(obj.keys(), key=lambda k: k.encode("utf-8"))
        _stream_write(stream, struct.pack("B", TAG_DICT))
        _stream_write(stream, struct.pack(">I", len(obj)))
        for key in sorted_keys:
            _encode_str_stream(stream, key)
            _encode_value_stream(obj[key], stream, depth + 1)
    elif isinstance(obj, float):
        raise InvalidTypeError("float", detail={"reason": "floats are not supported"})
    else:
        raise InvalidTypeError(
            type(obj).__name__,
            detail={"reason": f"type {type(obj).__name__} is not serializable"},
        )

    if hasattr(stream, "tell"):
        size = stream.tell() - start_pos
        if size > MAX_OBJECT_SIZE:
            raise SizeExceededError(size, MAX_OBJECT_SIZE)

    return 0  # approximate when tell() is unavailable


# ---------------------------------------------------------------------------
# Decoding helpers
# ---------------------------------------------------------------------------

def _read_exact(stream: BinaryIO, n: int) -> bytes:
    """Read exactly *n* bytes from a stream."""
    data = stream.read(n)
    if len(data) < n:
        raise SerializationError(
            f"Unexpected end of data: expected {n} bytes, got {len(data)}",
            code="SERIALIZATION_UNEXPECTED_EOF",
            detail={"expected": n, "got": len(data)},
        )
    return data


def _read_tag(stream: BinaryIO) -> int:
    """Read a type tag byte."""
    data = _read_exact(stream, 1)
    return data[0]


def _read_length(stream: BinaryIO) -> int:
    """Read a 4-byte big-endian length."""
    data = _read_exact(stream, 4)
    return struct.unpack(">I", data)[0]


def _decode_value(stream: BinaryIO, depth: int) -> Any:
    """Decode a single value from a stream."""
    if depth > MAX_DEPTH:
        raise DepthExceededError(depth, MAX_DEPTH)

    tag = _read_tag(stream)

    if tag == TAG_NONE:
        return None
    elif tag == TAG_TRUE:
        return True
    elif tag == TAG_FALSE:
        return False
    elif tag == TAG_INT:
        length = _read_length(stream)
        if length > MAX_INT_WIDTH + 1:
            raise SerializationError(
                f"Integer data length {length} exceeds maximum {MAX_INT_WIDTH + 1}",
                code="SERIALIZATION_INT_WIDTH_EXCEEDED",
                detail={"length": length, "max_length": MAX_INT_WIDTH + 1},
            )
        data = _read_exact(stream, length)
        return _bytes_to_int(data)
    elif tag == TAG_BYTES:
        length = _read_length(stream)
        if length > MAX_OBJECT_SIZE:
            raise SizeExceededError(length, MAX_OBJECT_SIZE)
        return _read_exact(stream, length)
    elif tag == TAG_STR:
        length = _read_length(stream)
        if length > MAX_STRING_LENGTH:
            raise SerializationError(
                f"String length {length} exceeds maximum {MAX_STRING_LENGTH}",
                code="SERIALIZATION_STRING_LENGTH_EXCEEDED",
                detail={"length": length, "max_length": MAX_STRING_LENGTH},
            )
        data = _read_exact(stream, length)
        return data.decode("utf-8")
    elif tag == TAG_LIST:
        count = _read_length(stream)
        result: list[Any] = []
        for _ in range(count):
            result.append(_decode_value(stream, depth + 1))
        return result
    elif tag == TAG_DICT:
        count = _read_length(stream)
        result: dict[str, Any] = {}
        for _ in range(count):
            # Keys are always strings
            key_tag = _read_tag(stream)
            if key_tag != TAG_STR:
                raise SerializationError(
                    f"Dictionary key must be a string, got tag 0x{key_tag:02x}",
                    code="SERIALIZATION_DICT_KEY_NOT_STRING",
                    detail={"tag": key_tag},
                )
            key_length = _read_length(stream)
            if key_length > MAX_STRING_LENGTH:
                raise SerializationError(
                    f"Dictionary key length {key_length} exceeds maximum {MAX_STRING_LENGTH}",
                    code="SERIALIZATION_STRING_LENGTH_EXCEEDED",
                    detail={"length": key_length, "max_length": MAX_STRING_LENGTH},
                )
            key_data = _read_exact(stream, key_length)
            key = key_data.decode("utf-8")
            value = _decode_value(stream, depth + 1)
            result[key] = value
        return result
    else:
        raise SerializationError(
            f"Unknown type tag: 0x{tag:02x}",
            code="SERIALIZATION_UNKNOWN_TAG",
            detail={"tag": tag},
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def canonical_encode(obj: Any) -> bytes:
    """Encode a Python object to a deterministic binary format.

    The output is prefixed with the version header ``VVU\\x01``.

    Args:
        obj: A Python object composed of ``None``, ``bool``, ``int``,
             ``bytes``, ``str``, ``list``, and ``dict`` values.

    Returns:
        The canonical binary encoding.

    Raises:
        SerializationError: On depth, size, or type violations.
    """
    encoded = _encode_value(obj, depth=1, max_size=MAX_OBJECT_SIZE)
    result = VERSION_HEADER + encoded
    if len(result) > MAX_OBJECT_SIZE:
        raise SizeExceededError(len(result), MAX_OBJECT_SIZE)
    return result


def canonical_decode(data: bytes) -> Any:
    """Decode a canonical binary encoding back to a Python object.

    Args:
        data: The binary data produced by :func:`canonical_encode`.

    Returns:
        The decoded Python object.

    Raises:
        SerializationError: If the data is malformed or constraints are
            violated.
    """
    if len(data) < len(VERSION_HEADER):
        raise SerializationError(
            "Data too short to contain version header",
            code="SERIALIZATION_DATA_TOO_SHORT",
            detail={"min_length": len(VERSION_HEADER), "actual_length": len(data)},
        )
    if data[: len(VERSION_HEADER)] != VERSION_HEADER:
        raise SerializationError(
            f"Invalid version header: expected {VERSION_HEADER!r}, "
            f"got {data[:len(VERSION_HEADER)]!r}",
            code="SERIALIZATION_INVALID_HEADER",
            detail={
                "expected": VERSION_HEADER.hex(),
                "actual": data[: len(VERSION_HEADER)].hex(),
            },
        )

    import io

    stream = io.BytesIO(data[len(VERSION_HEADER) :])
    value = _decode_value(stream, depth=1)
    # Check for trailing data
    remaining = stream.read()
    if remaining:
        raise SerializationError(
            f"Trailing data after decoded value: {len(remaining)} bytes",
            code="SERIALIZATION_TRAILING_DATA",
            detail={"trailing_bytes": len(remaining)},
        )
    return value


def canonical_hash(obj: Any) -> bytes:
    """Encode an object and compute its SHA-256 hash.

    This is equivalent to ``hashlib.sha256(canonical_encode(obj)).digest()``.

    Args:
        obj: A Python object to encode and hash.

    Returns:
        32-byte SHA-256 digest.
    """
    return hashlib.sha256(canonical_encode(obj)).digest()


def canonical_encode_stream(obj: Any, stream: BinaryIO) -> None:
    """Encode a Python object and write it to a binary stream.

    The version header is written first, followed by the encoded data.

    Args:
        obj:    A Python object to encode.
        stream: A writable binary stream (e.g. ``open("file", "wb")``).

    Raises:
        SerializationError: On depth, size, or type violations.
    """
    _stream_write(stream, VERSION_HEADER)
    _encode_value_stream(obj, stream, depth=1)


def canonical_decode_stream(stream: BinaryIO) -> Any:
    """Decode a Python object from a binary stream.

    The stream must start with the version header.

    Args:
        stream: A readable binary stream.

    Returns:
        The decoded Python object.

    Raises:
        SerializationError: If the data is malformed or constraints are
            violated.
    """
    header = _read_exact(stream, len(VERSION_HEADER))
    if header != VERSION_HEADER:
        raise SerializationError(
            f"Invalid version header: expected {VERSION_HEADER!r}, got {header!r}",
            code="SERIALIZATION_INVALID_HEADER",
            detail={
                "expected": VERSION_HEADER.hex(),
                "actual": header.hex(),
            },
        )
    return _decode_value(stream, depth=1)
