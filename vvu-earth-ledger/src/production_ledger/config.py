"""VVU Earth Tech Ledger — Frozen dataclass-based configuration system.

Every configuration object is a frozen (immutable) dataclass that validates
its inputs in ``__post_init__``.  A top-level :class:`LedgerConfig` holds
all sub-configs.  Two class methods provide construction:

* :meth:`LedgerConfig.default` — sensible production defaults.
* :meth:`LedgerConfig.from_toml` — load from a TOML file (section names
  match the sub-config class names in lowercase).
"""

from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .constants import (
    BUSY_TIMEOUT,
    CACHE_SIZE,
    DEFAULT_PORT,
    KEEPALIVE_MS,
    MAX_DEPTH,
    MAX_INT_WIDTH,
    MAX_MESSAGE_SIZE,
    MAX_OBJECT_SIZE,
    MAX_STRING_LENGTH,
    MAX_VALIDATORS,
    MAX_WEIGHT,
    MIN_QUORUM,
    PAGE_SIZE,
)
from .exceptions import ConfigError, InvalidValueError, MissingConfigFieldError


# ---------------------------------------------------------------------------
# Sub-configs
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class DatabaseConfig:
    """SQLite database configuration."""

    journal_mode: str = "wal"
    synchronous: str = "full"
    busy_timeout: int = BUSY_TIMEOUT
    cache_size: int = CACHE_SIZE
    page_size: int = PAGE_SIZE
    secure_delete: bool = True
    trusted_schema: bool = False
    foreign_keys: bool = True
    temp_store: str = "memory"
    locking_mode: str = "normal"
    db_path: str = "ledger.db"

    def __post_init__(self) -> None:
        _one_of(self, "journal_mode", {"delete", "truncate", "persist", "wal", "off"})
        _one_of(self, "synchronous", {"off", "normal", "full", "extra"})
        _positive_int(self, "busy_timeout")
        _nonzero_int(self, "cache_size")
        _one_of(self, "page_size", {512, 1024, 2048, 4096, 8192, 16384, 32768, 65536})
        _one_of(self, "temp_store", {"default", "file", "memory"})
        _one_of(self, "locking_mode", {"normal", "exclusive"})
        if not self.db_path:
            raise InvalidValueError("db_path", self.db_path, "must not be empty")


@dataclass(frozen=True)
class CryptoConfig:
    """Cryptographic configuration."""

    hash_algorithm: str = "sha256"
    key_rotation_enabled: bool = True
    key_rotation_interval_days: int = 90

    def __post_init__(self) -> None:
        _one_of(self, "hash_algorithm", {"sha256", "sha384", "sha512"})
        _positive_int(self, "key_rotation_interval_days")


@dataclass(frozen=True)
class ReplayConfig:
    """Replay verification configuration."""

    verify_sequence: bool = True
    verify_parent_chain: bool = True
    verify_payload_hash: bool = True
    verify_envelope_hash: bool = True
    verify_revision_hash: bool = True
    verify_mmr: bool = True
    verify_validator_history: bool = True
    verify_quorum: bool = True
    verify_snapshots: bool = True
    verify_proofs: bool = True
    verify_schema_versions: bool = True
    max_replay_entries: int = 1_000_000

    def __post_init__(self) -> None:
        _positive_int(self, "max_replay_entries")


@dataclass(frozen=True)
class ValidatorConfig:
    """Validator pool configuration."""

    max_validators: int = MAX_VALIDATORS
    min_quorum: int = MIN_QUORUM
    max_weight: int = MAX_WEIGHT
    key_expiry_days: int = 365

    def __post_init__(self) -> None:
        _positive_int(self, "max_validators")
        _positive_int(self, "min_quorum")
        _positive_int(self, "max_weight")
        _positive_int(self, "key_expiry_days")
        if self.min_quorum > self.max_validators:
            raise InvalidValueError(
                "min_quorum",
                self.min_quorum,
                f"must not exceed max_validators ({self.max_validators})",
            )


@dataclass(frozen=True)
class LoggingConfig:
    """Logging configuration."""

    json_logging: bool = True
    correlation_id: str = ""
    trace_id: str = ""
    replay_id: str = ""
    severity: str = "INFO"
    include_stack_trace: bool = False

    def __post_init__(self) -> None:
        _one_of(
            self,
            "severity",
            {"TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"},
        )


@dataclass(frozen=True)
class MetricsConfig:
    """Observability metrics configuration."""

    expose_prometheus: bool = True
    expose_otel: bool = False
    health_endpoint: str = "/health"
    latency: bool = True
    transactions: bool = True
    replay_duration: bool = True
    mmr_size: bool = True
    storage_size: bool = True
    validator_count: bool = True

    def __post_init__(self) -> None:
        if not self.health_endpoint:
            raise InvalidValueError("health_endpoint", self.health_endpoint, "must not be empty")
        if not self.health_endpoint.startswith("/"):
            raise InvalidValueError(
                "health_endpoint", self.health_endpoint, "must start with '/'"
            )


@dataclass(frozen=True)
class NetworkConfig:
    """Network / gRPC configuration."""

    host: str = "0.0.0.0"
    port: int = DEFAULT_PORT
    tls_enabled: bool = False
    mtls_enabled: bool = False
    cert_path: str = ""
    key_path: str = ""
    ca_path: str = ""
    max_message_size: int = MAX_MESSAGE_SIZE
    keepalive_ms: int = KEEPALIVE_MS
    compression_enabled: bool = True

    def __post_init__(self) -> None:
        _positive_int(self, "port", allow_zero=False)
        if self.port > 65535:
            raise InvalidValueError("port", self.port, "must be ≤ 65535")
        _positive_int(self, "max_message_size")
        _positive_int(self, "keepalive_ms")
        if self.mtls_enabled and not self.tls_enabled:
            raise InvalidValueError(
                "mtls_enabled", self.mtls_enabled, "requires tls_enabled=True"
            )
        if self.tls_enabled:
            if not self.cert_path:
                raise MissingConfigFieldError("cert_path")
            if not self.key_path:
                raise MissingConfigFieldError("key_path")
        if self.mtls_enabled and not self.ca_path:
            raise MissingConfigFieldError("ca_path")


@dataclass(frozen=True)
class SerializerConfig:
    """Canonical serializer configuration."""

    max_depth: int = MAX_DEPTH
    max_object_size: int = MAX_OBJECT_SIZE
    max_int_width: int = MAX_INT_WIDTH
    max_string_length: int = MAX_STRING_LENGTH
    canonical_utf8: bool = True
    strict_ordering: bool = True
    streaming_decoder: bool = False
    version_header: bytes = b"VVU\x01"

    def __post_init__(self) -> None:
        _positive_int(self, "max_depth")
        _positive_int(self, "max_object_size")
        _positive_int(self, "max_int_width")
        _positive_int(self, "max_string_length")
        # Convert version_header to bytes if it was loaded from TOML as a string
        if isinstance(self.version_header, str):
            try:
                object.__setattr__(self, "version_header", self.version_header.encode("ascii"))
            except (UnicodeEncodeError, ValueError) as exc:
                raise InvalidValueError(
                    "version_header",
                    self.version_header,
                    f"must be ASCII-encodable: {exc}",
                ) from exc
        if not self.version_header:
            raise InvalidValueError("version_header", self.version_header, "must not be empty")


# ---------------------------------------------------------------------------
# Top-level config
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class LedgerConfig:
    """Top-level configuration holding all sub-configs.

    Use :meth:`default` or :meth:`from_toml` to construct instances.
    """

    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    crypto: CryptoConfig = field(default_factory=CryptoConfig)
    replay: ReplayConfig = field(default_factory=ReplayConfig)
    validators: ValidatorConfig = field(default_factory=ValidatorConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    metrics: MetricsConfig = field(default_factory=MetricsConfig)
    network: NetworkConfig = field(default_factory=NetworkConfig)
    serializer: SerializerConfig = field(default_factory=SerializerConfig)

    # ------------------------------------------------------------------
    # Construction helpers
    # ------------------------------------------------------------------

    @classmethod
    def default(cls) -> LedgerConfig:
        """Return a :class:`LedgerConfig` with sensible production defaults."""
        return cls()

    @classmethod
    def from_toml(cls, path: str) -> LedgerConfig:
        """Read a TOML file and construct a :class:`LedgerConfig`.

        The TOML file may contain sections named after the sub-configs in
        lowercase (``database``, ``crypto``, ``replay``, ``validators``,
        ``logging``, ``metrics``, ``network``, ``serializer``).  Unknown
        sections are ignored.

        Example TOML::

            [database]
            journal_mode = "wal"
            busy_timeout = 5000

            [crypto]
            hash_algorithm = "sha256"

            [network]
            port = 50051
            tls_enabled = false
        """
        file_path = Path(path)
        if not file_path.exists():
            raise ConfigError(
                f"Configuration file not found: {path}",
                code="CONFIG_FILE_NOT_FOUND",
                detail={"path": path},
            )
        if not file_path.is_file():
            raise ConfigError(
                f"Configuration path is not a file: {path}",
                code="CONFIG_NOT_A_FILE",
                detail={"path": path},
            )

        try:
            with file_path.open("rb") as fh:
                raw: dict[str, Any] = tomllib.load(fh)
        except tomllib.TOMLDecodeError as exc:
            raise ConfigError(
                f"Failed to parse TOML configuration: {exc}",
                code="CONFIG_TOML_PARSE_ERROR",
                detail={"path": path, "error": str(exc)},
            ) from exc

        return cls(
            database=_build_sub(DatabaseConfig, raw, "database"),
            crypto=_build_sub(CryptoConfig, raw, "crypto"),
            replay=_build_sub(ReplayConfig, raw, "replay"),
            validators=_build_sub(ValidatorConfig, raw, "validators"),
            logging=_build_sub(LoggingConfig, raw, "logging"),
            metrics=_build_sub(MetricsConfig, raw, "metrics"),
            network=_build_sub(NetworkConfig, raw, "network"),
            serializer=_build_sub(SerializerConfig, raw, "serializer"),
        )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_sub(
    cls_type: type,
    raw: dict[str, Any],
    section: str,
) -> Any:
    """Construct a sub-config from a TOML section, ignoring unknown keys."""
    section_data: dict[str, Any] = raw.get(section, {})
    # Filter to only known fields of the dataclass
    from dataclasses import fields as dc_fields

    known = {f.name for f in dc_fields(cls_type)}
    filtered = {k: v for k, v in section_data.items() if k in known}
    return cls_type(**filtered)


def _one_of(obj: Any, field_name: str, allowed: set[Any]) -> None:
    """Validate that *field_name* on *obj* is one of *allowed*."""
    value = getattr(obj, field_name)
    if value not in allowed:
        raise InvalidValueError(
            field_name,
            value,
            f"must be one of {sorted(allowed)!r}",
        )


def _positive_int(obj: Any, field_name: str, *, allow_zero: bool = False) -> None:
    """Validate that *field_name* on *obj* is a positive integer."""
    value = getattr(obj, field_name)
    if not isinstance(value, int) or isinstance(value, bool):
        raise InvalidValueError(
            field_name, value, "must be an integer"
        )
    if allow_zero:
        if value < 0:
            raise InvalidValueError(
                field_name, value, "must be non-negative"
            )
    else:
        if value <= 0:
            raise InvalidValueError(
                field_name, value, "must be a positive integer"
            )


def _nonzero_int(obj: Any, field_name: str) -> None:
    """Validate that *field_name* on *obj* is a non-zero integer."""
    value = getattr(obj, field_name)
    if not isinstance(value, int) or isinstance(value, bool):
        raise InvalidValueError(
            field_name, value, "must be an integer"
        )
    if value == 0:
        raise InvalidValueError(
            field_name, value, "must be non-zero"
        )
