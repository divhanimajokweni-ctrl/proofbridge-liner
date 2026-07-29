"""VVU Earth Tech Ledger — Distributed tracing with span creation and context propagation.

The :class:`Tracer` provides lightweight distributed tracing with span
creation, parent-child relationships, and OpenTelemetry-compatible output.

Each span has a unique ``span_id`` and ``trace_id``, and can optionally
reference a ``parent_id`` to form a span tree.  Spans are created via
:meth:`start_span` and completed via :meth:`end_span`, or can be used
as a context manager via :meth:`span`.

Usage::

    tracer = Tracer(service_name="production-ledger")

    # Manual span lifecycle
    span = tracer.start_span("append", attributes={"sequence": 1})
    # ... do work ...
    tracer.end_span(span, status="ok")

    # Context manager
    with tracer.span("verify", attributes={"sequence": 1}):
        ledger.verify_chain()

    # Query traces
    trace = tracer.get_trace(span.trace_id)
    active = tracer.get_active_spans()
    otel = tracer.format_otel()
"""

from __future__ import annotations

import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Generator


# ---------------------------------------------------------------------------
# Span
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Span:
    """An immutable tracing span.

    Attributes:
        span_id:     Unique identifier for this span (16-char hex string).
        trace_id:    Unique identifier for the trace (32-char hex string).
        parent_id:   Optional parent span ID (16-char hex string).
        operation:   Human-readable operation name.
        start_time:  Span start time (POSIX epoch seconds).
        end_time:    Span end time (POSIX epoch seconds), or ``None`` if active.
        status:      Span status — ``"ok"`` or ``"error"``.
        attributes:  Optional dictionary of key-value attributes.
    """

    span_id: str
    trace_id: str
    parent_id: str | None
    operation: str
    start_time: float
    end_time: float | None
    status: str
    attributes: dict | None

    @property
    def is_active(self) -> bool:
        """Return ``True`` if the span has not been ended."""
        return self.end_time is None

    @property
    def duration_ms(self) -> float | None:
        """Return the span duration in milliseconds, or ``None`` if active."""
        if self.end_time is None:
            return None
        return (self.end_time - self.start_time) * 1000.0


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _generate_span_id() -> str:
    """Generate a unique 16-character hex span ID."""
    return uuid.uuid4().hex[:16]


def _generate_trace_id() -> str:
    """Generate a unique 32-character hex trace ID."""
    return uuid.uuid4().hex


# ---------------------------------------------------------------------------
# Tracer
# ---------------------------------------------------------------------------

class Tracer:
    """Distributed tracing with span creation and context propagation.

    Spans are stored in memory and can be queried by trace ID, or
    formatted in OpenTelemetry-compatible JSON format.

    Args:
        service_name: Name of the service for trace attribution
            (default ``"production-ledger"``).
    """

    def __init__(self, service_name: str = "production-ledger") -> None:
        """Initialize the tracer.

        Args:
            service_name: Name of the service for trace attribution.
        """
        self._service_name = service_name
        self._spans: list[Span] = []
        # Track active spans by span_id for quick lookup
        self._active: dict[str, Span] = {}

    # ------------------------------------------------------------------
    # Span creation
    # ------------------------------------------------------------------

    def start_span(
        self,
        operation: str,
        parent_id: str | None = None,
        attributes: dict | None = None,
    ) -> Span:
        """Start a new span.

        If *parent_id* is provided, the new span inherits the parent's
        ``trace_id``.  Otherwise, a new trace ID is generated.

        Args:
            operation:  Human-readable operation name (e.g. ``"append"``).
            parent_id:  Optional parent span ID for creating child spans.
            attributes: Optional dictionary of key-value attributes.

        Returns:
            A new :class:`Span` with ``end_time=None`` (active).
        """
        # Determine trace_id from parent, or create a new one
        if parent_id is not None:
            parent_span = self._find_span(parent_id)
            trace_id = parent_span.trace_id if parent_span else _generate_trace_id()
        else:
            trace_id = _generate_trace_id()

        span = Span(
            span_id=_generate_span_id(),
            trace_id=trace_id,
            parent_id=parent_id,
            operation=operation,
            start_time=time.time(),
            end_time=None,
            status="ok",
            attributes=attributes,
        )

        self._spans.append(span)
        self._active[span.span_id] = span
        return span

    # ------------------------------------------------------------------
    # Span completion
    # ------------------------------------------------------------------

    def end_span(self, span: Span, status: str = "ok") -> Span:
        """End a span.

        Creates a new :class:`Span` with the ``end_time`` set to the
        current time and the given *status*.  The original span is
        replaced in the internal store.

        Args:
            span:   The :class:`Span` to end.
            status: Span status — ``"ok"`` or ``"error"``.

        Returns:
            The ended :class:`Span` with ``end_time`` populated.

        Raises:
            ValueError: If *status* is not ``"ok"`` or ``"error"``.
        """
        if status not in ("ok", "error"):
            raise ValueError(
                f"Invalid span status {status!r}; must be 'ok' or 'error'"
            )

        ended_span = Span(
            span_id=span.span_id,
            trace_id=span.trace_id,
            parent_id=span.parent_id,
            operation=span.operation,
            start_time=span.start_time,
            end_time=time.time(),
            status=status,
            attributes=span.attributes,
        )

        # Replace the span in the list
        for i, s in enumerate(self._spans):
            if s.span_id == span.span_id:
                self._spans[i] = ended_span
                break

        # Remove from active set
        self._active.pop(span.span_id, None)

        return ended_span

    # ------------------------------------------------------------------
    # Context manager
    # ------------------------------------------------------------------

    @contextmanager
    def span(
        self,
        operation: str,
        attributes: dict | None = None,
    ) -> Generator[Span, None, None]:
        """Context manager for a span.

        Automatically starts and ends the span, setting the status to
        ``"ok"`` on normal exit or ``"error"`` on exception.

        Args:
            operation:  Human-readable operation name.
            attributes: Optional dictionary of key-value attributes.

        Yields:
            The active :class:`Span`.

        Usage::

            with tracer.span("verify") as s:
                ledger.verify_chain()
        """
        s = self.start_span(operation, attributes=attributes)
        try:
            yield s
        except Exception:
            self.end_span(s, status="error")
            raise
        else:
            self.end_span(s, status="ok")

    # ------------------------------------------------------------------
    # Querying
    # ------------------------------------------------------------------

    def get_trace(self, trace_id: str) -> list[Span]:
        """Get all spans in a trace.

        Args:
            trace_id: The trace ID to look up.

        Returns:
            List of :class:`Span` objects in the trace, ordered by
            start time.
        """
        spans = [s for s in self._spans if s.trace_id == trace_id]
        return sorted(spans, key=lambda s: s.start_time)

    def get_active_spans(self) -> list[Span]:
        """Get currently active spans.

        Returns:
            List of :class:`Span` objects that have not been ended.
        """
        return list(self._active.values())

    # ------------------------------------------------------------------
    # OpenTelemetry format
    # ------------------------------------------------------------------

    def format_otel(self) -> dict:
        """Format spans in OpenTelemetry format.

        Returns a dictionary compatible with the OpenTelemetry trace
        data model, suitable for JSON serialization.

        Returns:
            Dictionary with keys ``"resource"`` and ``"scopeSpans"``.
        """
        span_data: list[dict[str, Any]] = []
        for s in self._spans:
            span_dict: dict[str, Any] = {
                "traceId": s.trace_id,
                "spanId": s.span_id,
                "name": s.operation,
                "kind": 1,  # INTERNAL
                "startTimeUnixNano": int(s.start_time * 1e9),
                "status": {
                    "code": 1 if s.status == "ok" else 2,
                },
            }

            if s.parent_id is not None:
                span_dict["parentSpanId"] = s.parent_id

            if s.end_time is not None:
                span_dict["endTimeUnixNano"] = int(s.end_time * 1e9)

            if s.attributes:
                attrs: dict[str, Any] = {}
                for k, v in s.attributes.items():
                    if isinstance(v, bool):
                        attrs[k] = {"value": {"boolValue": v}}
                    elif isinstance(v, int):
                        attrs[k] = {"value": {"intValue": v}}
                    elif isinstance(v, float):
                        attrs[k] = {"value": {"doubleValue": v}}
                    else:
                        attrs[k] = {"value": {"stringValue": str(v)}}
                span_dict["attributes"] = attrs

            span_data.append(span_dict)

        return {
            "resource": {
                "attributes": {
                    "service.name": {"value": {"stringValue": self._service_name}},
                },
            },
            "scopeSpans": [
                {
                    "scope": {
                        "name": "production-ledger-tracer",
                        "version": "1.0.0",
                    },
                    "spans": span_data,
                }
            ],
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _find_span(self, span_id: str) -> Span | None:
        """Find a span by its ID.

        Args:
            span_id: The span ID to look up.

        Returns:
            The :class:`Span` if found, otherwise ``None``.
        """
        for s in self._spans:
            if s.span_id == span_id:
                return s
        return None
