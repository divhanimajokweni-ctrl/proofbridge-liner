"""VVU Earth Tech Ledger — Structured audit logging with correlation IDs.

The :class:`AuditLogger` provides structured, append-only audit logging
with support for correlation IDs, trace context, and severity levels.
Every audit event is an immutable :class:`AuditEvent` dataclass.

Events are stored in memory and can be queried, filtered, and exported
as JSON.  The logger integrates with the project's :class:`LoggingConfig`
for configuration.

Usage::

    config = LoggingConfig()
    audit = AuditLogger(config)
    audit.log_append(sequence=1, payload_hash=b"\\x00" * 32)
    audit.log_verify(sequence=1, result=True)
    events = audit.get_events(event_type="append")
    trail = audit.export_trail()
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field, asdict

from .config import LoggingConfig
from .exceptions import LedgerError


# ---------------------------------------------------------------------------
# Valid severity levels
# ---------------------------------------------------------------------------

_VALID_SEVERITIES: frozenset[str] = frozenset({
    "info", "warning", "error", "critical",
})


# ---------------------------------------------------------------------------
# Audit event
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class AuditEvent:
    """An immutable audit event record.

    Attributes:
        event_type:     Category of the event (e.g. ``"append"``, ``"verify"``).
        actor:          Identity of the entity that triggered the event.
        target:         Target of the event (e.g. a sequence number or key ID).
        detail:         Optional dictionary with additional context.
        severity:       Severity level — one of ``"info"``, ``"warning"``,
                        ``"error"``, ``"critical"``.
        timestamp:      POSIX epoch seconds when the event was created.
        correlation_id: Optional correlation ID linking related events.
        trace_id:       Optional distributed trace ID.
        replay_id:      Optional replay verification ID.
        sequence:       Optional sequence number associated with the event.
    """

    event_type: str
    actor: str
    target: str
    detail: dict | None
    severity: str
    timestamp: float
    correlation_id: str | None
    trace_id: str | None
    replay_id: str | None
    sequence: int | None


# ---------------------------------------------------------------------------
# Audit logger
# ---------------------------------------------------------------------------

class AuditLogger:
    """Structured audit logging with correlation IDs and trace context.

    All events are stored in an in-memory list and can be queried,
    filtered by event type or severity, and exported as JSON.

    Args:
        config: A :class:`LoggingConfig` instance.
    """

    def __init__(self, config: LoggingConfig) -> None:
        """Initialize the audit logger.

        Args:
            config: A frozen :class:`LoggingConfig` instance.
        """
        self._config = config
        self._events: list[AuditEvent] = []
        self._default_correlation_id: str | None = (
            config.correlation_id if config.correlation_id else None
        )
        self._default_trace_id: str | None = (
            config.trace_id if config.trace_id else None
        )
        self._default_replay_id: str | None = (
            config.replay_id if config.replay_id else None
        )

    # ------------------------------------------------------------------
    # Core logging
    # ------------------------------------------------------------------

    def log(
        self,
        event_type: str,
        actor: str,
        target: str,
        detail: dict | None = None,
        severity: str = "info",
        correlation_id: str | None = None,
        trace_id: str | None = None,
        replay_id: str | None = None,
        sequence: int | None = None,
    ) -> AuditEvent:
        """Log an audit event.

        Args:
            event_type:     Category of the event.
            actor:          Identity of the triggering entity.
            target:         Target of the event.
            detail:         Optional dictionary with additional context.
            severity:       Severity level (default ``"info"``).
            correlation_id: Optional correlation ID.  Falls back to the
                            default from :class:`LoggingConfig` if not
                            provided.
            trace_id:       Optional distributed trace ID.
            replay_id:      Optional replay verification ID.
            sequence:       Optional sequence number.

        Returns:
            The created :class:`AuditEvent`.

        Raises:
            ValueError: If *severity* is not a valid level.
        """
        if severity not in _VALID_SEVERITIES:
            raise ValueError(
                f"Invalid severity {severity!r}; "
                f"must be one of {sorted(_VALID_SEVERITIES)}"
            )

        event = AuditEvent(
            event_type=event_type,
            actor=actor,
            target=target,
            detail=detail,
            severity=severity,
            timestamp=time.time(),
            correlation_id=correlation_id or self._default_correlation_id,
            trace_id=trace_id or self._default_trace_id,
            replay_id=replay_id or self._default_replay_id,
            sequence=sequence,
        )
        self._events.append(event)
        return event

    # ------------------------------------------------------------------
    # Convenience methods
    # ------------------------------------------------------------------

    def log_append(
        self,
        sequence: int,
        payload_hash: bytes,
        correlation_id: str | None = None,
    ) -> AuditEvent:
        """Log a ledger append event.

        Args:
            sequence:      The sequence number of the appended entry.
            payload_hash:  The SHA-256 hash of the payload.
            correlation_id: Optional correlation ID.

        Returns:
            The created :class:`AuditEvent`.
        """
        return self.log(
            event_type="append",
            actor="ledger",
            target=f"sequence:{sequence}",
            detail={"payload_hash": payload_hash.hex(), "sequence": sequence},
            severity="info",
            correlation_id=correlation_id,
            sequence=sequence,
        )

    def log_verify(
        self,
        sequence: int,
        result: bool,
        correlation_id: str | None = None,
    ) -> AuditEvent:
        """Log a verification event.

        Args:
            sequence:       The sequence number that was verified.
            result:         Whether the verification passed.
            correlation_id: Optional correlation ID.

        Returns:
            The created :class:`AuditEvent`.
        """
        return self.log(
            event_type="verify",
            actor="ledger",
            target=f"sequence:{sequence}",
            detail={"sequence": sequence, "result": result},
            severity="info" if result else "warning",
            correlation_id=correlation_id,
            sequence=sequence,
        )

    def log_key_rotation(
        self,
        key_id: bytes,
        correlation_id: str | None = None,
    ) -> AuditEvent:
        """Log a key rotation event.

        Args:
            key_id:         The 4-byte key identifier of the new key.
            correlation_id: Optional correlation ID.

        Returns:
            The created :class:`AuditEvent`.
        """
        return self.log(
            event_type="key_rotation",
            actor="crypto",
            target=f"key:{key_id.hex()}",
            detail={"key_id": key_id.hex()},
            severity="info",
            correlation_id=correlation_id,
        )

    def log_validator_change(
        self,
        key_id: bytes,
        action: str,
        correlation_id: str | None = None,
    ) -> AuditEvent:
        """Log a validator registration/revocation.

        Args:
            key_id:         The 4-byte key identifier of the validator.
            action:         Either ``"register"`` or ``"revoke"``.
            correlation_id: Optional correlation ID.

        Returns:
            The created :class:`AuditEvent`.
        """
        return self.log(
            event_type="validator_change",
            actor="validator_registry",
            target=f"key:{key_id.hex()}",
            detail={"key_id": key_id.hex(), "action": action},
            severity="info" if action == "register" else "warning",
            correlation_id=correlation_id,
        )

    def log_replay(
        self,
        sequence: int,
        violations: int,
        correlation_id: str | None = None,
    ) -> AuditEvent:
        """Log a replay event.

        Args:
            sequence:       The sequence number up to which replay was run.
            violations:     Number of violations found during replay.
            correlation_id: Optional correlation ID.

        Returns:
            The created :class:`AuditEvent`.
        """
        return self.log(
            event_type="replay",
            actor="replay_engine",
            target=f"sequence:{sequence}",
            detail={"sequence": sequence, "violations": violations},
            severity="info" if violations == 0 else "error",
            correlation_id=correlation_id,
            sequence=sequence,
        )

    def log_error(
        self,
        error: LedgerError,
        correlation_id: str | None = None,
    ) -> AuditEvent:
        """Log an error.

        Args:
            error:          A :class:`LedgerError` instance.
            correlation_id: Optional correlation ID.

        Returns:
            The created :class:`AuditEvent`.
        """
        detail: dict = {
            "error_code": error.code,
            "message": str(error),
        }
        if error.detail:
            detail["error_detail"] = error.detail

        return self.log(
            event_type="error",
            actor="system",
            target=error.code,
            detail=detail,
            severity="error",
            correlation_id=correlation_id,
        )

    # ------------------------------------------------------------------
    # Querying
    # ------------------------------------------------------------------

    def get_events(
        self,
        event_type: str | None = None,
        severity: str | None = None,
        limit: int = 100,
    ) -> list[AuditEvent]:
        """Query audit events.

        Args:
            event_type: Optional filter by event type.
            severity:   Optional filter by severity.
            limit:      Maximum number of events to return (default 100).

        Returns:
            List of :class:`AuditEvent` objects matching the filters,
            ordered by timestamp (most recent first).
        """
        results = self._events

        if event_type is not None:
            results = [e for e in results if e.event_type == event_type]
        if severity is not None:
            results = [e for e in results if e.severity == severity]

        # Return most recent first
        results = sorted(results, key=lambda e: e.timestamp, reverse=True)
        return results[:limit]

    # ------------------------------------------------------------------
    # Export
    # ------------------------------------------------------------------

    def export_trail(self, format: str = "json") -> str:
        """Export the full audit trail.

        Args:
            format: Export format. Currently only ``"json"`` is supported.

        Returns:
            A JSON string representing the full audit trail.

        Raises:
            ValueError: If *format* is not ``"json"``.
        """
        if format != "json":
            raise ValueError(
                f"Unsupported export format {format!r}; only 'json' is supported"
            )

        events_data: list[dict] = []
        for event in self._events:
            event_dict = asdict(event)
            # Convert bytes in detail to hex strings for JSON serialization
            if event_dict.get("detail") and isinstance(event_dict["detail"], dict):
                sanitized: dict = {}
                for k, v in event_dict["detail"].items():
                    if isinstance(v, bytes):
                        sanitized[k] = v.hex()
                    else:
                        sanitized[k] = v
                event_dict["detail"] = sanitized
            events_data.append(event_dict)

        return json.dumps(events_data, indent=2, default=str)
