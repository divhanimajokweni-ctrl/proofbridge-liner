"""Tests for the configuration module."""

from __future__ import annotations

import os
import tempfile

import pytest

from production_ledger.config import (
    DatabaseConfig,
    LedgerConfig,
)
from production_ledger.exceptions import ConfigError, InvalidValueError


# ---------------------------------------------------------------------------
# Default config
# ---------------------------------------------------------------------------

class TestDefaultConfig:
    def test_default_config(self) -> None:
        """Default config is valid and can be constructed."""
        config = LedgerConfig.default()
        assert config.database.db_path == "ledger.db"
        assert config.database.journal_mode == "wal"
        assert config.crypto.hash_algorithm == "sha256"
        assert config.validators.min_quorum == 2
        assert config.network.port == 50051


# ---------------------------------------------------------------------------
# Frozen config
# ---------------------------------------------------------------------------

class TestFrozenConfig:
    def test_frozen_config(self) -> None:
        """Cannot modify a frozen config."""
        config = LedgerConfig.default()
        with pytest.raises(AttributeError):
            config.database.db_path = "new.db"  # type: ignore[misc]

    def test_frozen_database_config(self) -> None:
        """Cannot modify a frozen DatabaseConfig."""
        db_config = DatabaseConfig()
        with pytest.raises(AttributeError):
            db_config.journal_mode = "off"  # type: ignore[misc]


# ---------------------------------------------------------------------------
# Invalid db_path
# ---------------------------------------------------------------------------

class TestInvalidDbPath:
    def test_invalid_db_path(self) -> None:
        """Empty db_path raises InvalidValueError."""
        with pytest.raises(InvalidValueError):
            DatabaseConfig(db_path="")


# ---------------------------------------------------------------------------
# From TOML
# ---------------------------------------------------------------------------

class TestFromToml:
    def test_from_toml(self) -> None:
        """Load config from a TOML file."""
        toml_content = """
[database]
db_path = "test.db"
journal_mode = "wal"
synchronous = "full"
busy_timeout = 5000

[crypto]
hash_algorithm = "sha256"

[network]
port = 50051
tls_enabled = false
"""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".toml", delete=False
        ) as f:
            f.write(toml_content)
            f.flush()
            try:
                config = LedgerConfig.from_toml(f.name)
                assert config.database.db_path == "test.db"
                assert config.database.journal_mode == "wal"
                assert config.crypto.hash_algorithm == "sha256"
                assert config.network.port == 50051
            finally:
                os.unlink(f.name)

    def test_missing_toml(self) -> None:
        """Missing file raises ConfigError."""
        with pytest.raises(ConfigError):
            LedgerConfig.from_toml("/nonexistent/path/config.toml")

    def test_invalid_journal_mode(self) -> None:
        """Invalid journal_mode raises InvalidValueError."""
        toml_content = """
[database]
journal_mode = "invalid_mode"
"""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".toml", delete=False
        ) as f:
            f.write(toml_content)
            f.flush()
            try:
                with pytest.raises(InvalidValueError):
                    LedgerConfig.from_toml(f.name)
            finally:
                os.unlink(f.name)
