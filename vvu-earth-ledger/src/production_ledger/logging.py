"""VVU Earth Tech Ledger — Structured JSON logger.

The :class:`LedgerLogger` provides structured JSON logging for the
production ledger.  Every log line is a self-contained JSON object with
a timestamp, severity level, message, and optional context fields
(correlation ID, trace ID, replay ID, and arbitrary extra fields).

The logger integrates with the project's :class:`LoggingConfig` for
configuration but does **not** depend on Python's standard ``logging``
module — it writes directly to ``stderr`` (or a file) for maximum
control and minimal overhead.

Usage::

    from production_ledger.config import LoggingConfig
    from production_ledger.logging import LedgerLogger

    config = LoggingConfig()
    logger = LedgerLogger(config)

    logger.info("Ledger opened", db_path="/data/ledger.db")
    logger.warning("Key rotation overdue", days_since_rotation=95)
    logger.error("Verification failed", sequence=42, expected="abc", actual="def")
"""

from __future__ import annotations

import json
import sys
import time
import traceback
from dataclasses import dataclass
from typing import Any, TextIO

from .config import LoggingConfig


# ---------------------------------------------------------------------------
# Severity levels (ordered by severity)
# ---------------------------------------------------------------------------

_SEVERITY_LEVELS: dict[str, int] = {
    "TRACE": 0,
    "DEBUG": 1,
    "INFO": 2,
    "WARN": 3,
    "WARNING": 3,
    "ERROR": 4,
    "FATAL": 5,
    "CRITICAL": 5,
}


# ---------------------------------------------------------------------------
# Log entry
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class LogEntry:
    """A single structured log entry.

    Attributes:
        timestamp:      ISO 8601 formatted timestamp.
        level:          Severity level string.
        message:        Human-readable log message.
        correlation_id: Optional correlation ID.
        trace_id:       Optional distributed trace ID.
        replay_id:      Optional replay verification ID.
        extra:          Optional dictionary of additional fields.
    """

    timestamp: str
    level: str
    message: str
    correlation_id: str | None
    trace_id: str | None
    replay_id: str | None
    extra: dict[str, Any] | None


# ---------------------------------------------------------------------------
# Ledger logger
# ---------------------------------------------------------------------------

class LedgerLogger:
    """Structured JSON logger for the production ledger.

    Every log line is a self-contained JSON object written to a stream
    (default: ``stderr``).  The logger respects the severity level
    configured in :class:`LoggingConfig` and can optionally include
    stack traces on error-level messages.

    Args:
        config: A frozen :class:`LoggingConfig` instance.
        stream: Optional output stream (default: ``sys.stderr``).
    """

    def __init__(
        self,
        config: LoggingConfig,
        stream: TextIO | None = None,
    ) -> None:
        """Initialize the logger.

        Args:
            config: A frozen :class:`LoggingConfig` instance.
            stream: Optional output stream (default: ``sys.stderr``).
        """
        self._config = config
        self._stream = stream or sys.stderr
        self._min_level = _SEVERITY_LEVELS.get(config.severity.upper(), 2)
        self._correlation_id = config.correlation_id or None
        self._trace_id = config.trace_id or None
        self._replay_id = config.replay_id or None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def debug(self, message: str, **kwargs: Any) -> None:
        """Log a message at DEBUG level.

        Args:
            message: Human-readable log message.
            **kwargs: Additional key-value pairs to include in the log entry.
        """
        self._log("DEBUG", message, **kwargs)

    def info(self, message: str, **kwargs: Any) -> None:
        """Log a message at INFO level.

        Args:
            message: Human-readable log message.
            **kwargs: Additional key-value pairs to include in the log entry.
        """
        self._log("INFO", message, **kwargs)

    def warning(self, message: str, **kwargs: Any) -> None:
        """Log a message at WARNING level.

        Args:
            message: Human-readable log message.
            **kwargs: Additional key-value pairs to include in the log entry.
        """
        self._log("WARNING", message, **kwargs)

    def error(self, message: str, **kwargs: Any) -> None:
        """Log a message at ERROR level.

        Args:
            message: Human-readable log message.
            **kwargs: Additional key-value pairs to include in the log entry.
        """
        self._log("ERROR", message, **kwargs)

    def critical(self, message: str, **kwargs: Any) -> None:
        """Log a message at CRITICAL level.

        Args:
            message: Human-readable log message.
            **kwargs: Additional key-value pairs to include in the log entry.
        """
        self._log("CRITICAL", message, **kwargs)

    # ------------------------------------------------------------------
    # Core logging
    # ------------------------------------------------------------------

    def _log(self, level: str, message: str, **kwargs: Any) -> None:
        """Write a structured log entry.

        The output is a single JSON line with the following fields:

        * ``timestamp``      — ISO 8601 formatted timestamp.
        * ``level``          — Severity level string.
        * ``message``        — Human-readable log message.
        * ``correlation_id`` — Correlation ID (if configured or provided).
        * ``trace_id``       — Distributed trace ID (if configured or provided).
        * ``replay_id``      — Replay verification ID (if configured or provided).
        * Any additional key-value pairs from ``**kwargs``.

        If ``include_stack_trace`` is enabled in the config and the level
        is ERROR or higher, the current stack trace is included as a
        ``stack_trace`` field.

        Args:
            level:   Severity level string.
            message: Human-readable log message.
            **kwargs: Additional key-value pairs to include.
        """
        # Check if this level should be logged
        level_num = _SEVERITY_LEVELS.get(level.upper(), 2)
        if level_num < self._min_level:
            return

        # Build the log entry
        entry: dict[str, Any] = {
            "timestamp": self._format_timestamp(time.time()),
            "level": level,
            "message": message,
        }

        # Add correlation context
        correlation_id = kwargs.pop("correlation_id", self._correlation_id)
        if correlation_id:
            entry["correlation_id"] = correlation_id

        trace_id = kwargs.pop("trace_id", self._trace_id)
        if trace_id:
            entry["trace_id"] = trace_id

        replay_id = kwargs.pop("replay_id", self._replay_id)
        if replay_id:
            entry["replay_id"] = replay_id

        # Add extra fields
        if kwargs:
            entry["extra"] = kwargs

        # Include stack trace on error+ if configured
        if self._config.include_stack_trace and level_num >= _SEVERITY_LEVELS["ERROR"]:
            entry["stack_trace"] = traceback.format_stack()

        # Write the log entry
        if self._config.json_logging:
            line = json.dumps(entry, default=str, ensure_ascii=False)
            self._stream.write(line + "\n")
        else:
            # Fallback to plain text for non-JSON logging
            parts = [f"[{entry['timestamp']}] {level}: {message}"]
            if correlation_id:
                parts.append(f"corr={correlation_id}")
            if trace_id:
                parts.append(f"trace={trace_id}")
            if replay_id:
                parts.append(f"replay={replay_id}")
            if kwargs:
                parts.append(str(kwargs))
            self._stream.write(" ".join(parts) + "\n")

        self._stream.flush()

    # ------------------------------------------------------------------
    # Timestamp formatting
    # ------------------------------------------------------------------

    @staticmethod
    def _format_timestamp(epoch: float) -> str:
        """Format a POSIX timestamp as ISO 8601.

        Args:
            epoch: POSIX timestamp.

        Returns:
            ISO 8601 formatted string with microsecond precision.
        """
        return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(epoch)) + f".{int(epoch % 1 * 1_000_000):06d}Z"

    # ------------------------------------------------------------------
    # Context management
    # ------------------------------------------------------------------

    def set_correlation_id(self, correlation_id: str) -> None:
        """Set the default correlation ID for subsequent log entries.

        Args:
            correlation_id: The correlation ID to set.
        """
        self._correlation_id = correlation_id

    def set_trace_id(self, trace_id: str) -> None:
        """Set the default trace ID for subsequent log entries.

        Args:
            trace_id: The trace ID to set.
        """
        self._trace_id = trace_id

    def set_replay_id(self, replay_id: str) -> None:
        """Set the default replay ID for subsequent log entries.

        Args:
            replay_id: The replay ID to set.
        """
        self._replay_id = replay_id
