"""VVU Earth Tech Ledger — Metrics collection and exposition (Prometheus-compatible).

The :class:`MetricsCollector` collects counters, gauges, and histograms
and exposes them in the Prometheus exposition text format.

Metric points are stored in memory as :class:`MetricPoint` frozen dataclasses.
Counters are monotonically increasing; gauges represent point-in-time values;
histograms track distributions of observations.

Usage::

    config = MetricsConfig()
    metrics = MetricsCollector(config)

    metrics.increment("ledger_appends_total", labels={"status": "success"})
    metrics.gauge("ledger_sequence", 42)
    metrics.histogram("append_duration_seconds", 0.025)

    with metrics.time("verify_duration_seconds"):
        ledger.verify_chain()

    prometheus_text = metrics.format_prometheus()
"""

from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Generator

from .config import MetricsConfig


# ---------------------------------------------------------------------------
# Metric point
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class MetricPoint:
    """A single metric observation.

    Attributes:
        name:        Metric name (e.g. ``"ledger_appends_total"``).
        value:       Numeric value of the observation.
        labels:      Optional dictionary of label key-value pairs.
        timestamp:   POSIX epoch seconds when the observation was recorded.
        metric_type: One of ``"counter"``, ``"gauge"``, ``"histogram"``.
    """

    name: str
    value: float
    labels: dict | None
    timestamp: float
    metric_type: str


# ---------------------------------------------------------------------------
# Internal: label key formatting
# ---------------------------------------------------------------------------

def _format_labels(labels: dict | None) -> str:
    """Format labels into Prometheus label notation.

    Args:
        labels: Optional dictionary of label key-value pairs.

    Returns:
        A string like ``{key1="val1",key2="val2"}`` or empty string.
    """
    if not labels:
        return ""
    parts = []
    for k, v in sorted(labels.items()):
        # Escape double quotes and backslashes in label values
        escaped = str(v).replace("\\", "\\\\").replace('"', '\\"')
        parts.append(f'{k}="{escaped}"')
    return "{" + ",".join(parts) + "}"


def _label_key(labels: dict | None) -> str:
    """Create a hashable key from labels for grouping.

    Args:
        labels: Optional dictionary of label key-value pairs.

    Returns:
        A string key suitable for dictionary grouping.
    """
    if not labels:
        return ""
    return ",".join(f"{k}={v}" for k, v in sorted(labels.items()))


# ---------------------------------------------------------------------------
# Metrics collector
# ---------------------------------------------------------------------------

class MetricsCollector:
    """Collects and exposes metrics in Prometheus format.

    Supports three metric types:

    * **Counter** — monotonically increasing cumulative value.
    * **Gauge** — point-in-time value that can go up or down.
    * **Histogram** — distribution of observations with configurable buckets.

    Args:
        config: A :class:`MetricsConfig` instance.
    """

    # Default histogram buckets (in seconds)
    _DEFAULT_BUCKETS: list[float] = [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0,
    ]

    def __init__(self, config: MetricsConfig) -> None:
        """Initialize the metrics collector.

        Args:
            config: A frozen :class:`MetricsConfig` instance.
        """
        self._config = config
        self._points: list[MetricPoint] = []
        # Counter aggregation: (name, label_key) -> cumulative value
        self._counters: dict[tuple[str, str], float] = {}
        # Gauge current values: (name, label_key) -> value
        self._gauges: dict[tuple[str, str], float] = {}
        # Histogram data: (name, label_key) -> {bucket_values, sum, count}
        self._histograms: dict[tuple[str, str], dict[str, Any]] = {}
        self._buckets: list[float] = list(self._DEFAULT_BUCKETS)

    # ------------------------------------------------------------------
    # Counters
    # ------------------------------------------------------------------

    def increment(
        self,
        name: str,
        value: float = 1.0,
        labels: dict | None = None,
    ) -> None:
        """Increment a counter.

        Counters are monotonically increasing.  Each call adds *value*
        to the counter's cumulative total.

        Args:
            name:   Metric name (e.g. ``"ledger_appends_total"``).
            value:  Value to add (default 1.0).  Must be non-negative.
            labels: Optional dictionary of label key-value pairs.

        Raises:
            ValueError: If *value* is negative.
        """
        if value < 0:
            raise ValueError(
                f"Counter increment value must be non-negative, got {value}"
            )

        key = (name, _label_key(labels))
        current = self._counters.get(key, 0.0)
        new_value = current + value
        self._counters[key] = new_value

        self._points.append(MetricPoint(
            name=name,
            value=new_value,
            labels=labels,
            timestamp=time.time(),
            metric_type="counter",
        ))

    # ------------------------------------------------------------------
    # Gauges
    # ------------------------------------------------------------------

    def gauge(
        self,
        name: str,
        value: float,
        labels: dict | None = None,
    ) -> None:
        """Set a gauge value.

        Gauges represent point-in-time values that can increase or decrease.

        Args:
            name:   Metric name (e.g. ``"ledger_sequence"``).
            value:  Current value of the gauge.
            labels: Optional dictionary of label key-value pairs.
        """
        key = (name, _label_key(labels))
        self._gauges[key] = value

        self._points.append(MetricPoint(
            name=name,
            value=value,
            labels=labels,
            timestamp=time.time(),
            metric_type="gauge",
        ))

    # ------------------------------------------------------------------
    # Histograms
    # ------------------------------------------------------------------

    def histogram(
        self,
        name: str,
        value: float,
        labels: dict | None = None,
    ) -> None:
        """Record a histogram observation.

        Observations are sorted into pre-defined buckets and the sum
        and count are tracked.

        Args:
            name:   Metric name (e.g. ``"append_duration_seconds"``).
            value:  Observed value.
            labels: Optional dictionary of label key-value pairs.
        """
        key = (name, _label_key(labels))
        hist = self._histograms.get(key)
        if hist is None:
            hist = {
                "buckets": {b: 0 for b in self._buckets},
                "sum": 0.0,
                "count": 0,
                "labels": labels,
            }
            self._histograms[key] = hist

        # Increment bucket counts
        for bucket in self._buckets:
            if value <= bucket:
                hist["buckets"][bucket] += 1

        hist["sum"] += value
        hist["count"] += 1

        self._points.append(MetricPoint(
            name=name,
            value=value,
            labels=labels,
            timestamp=time.time(),
            metric_type="histogram",
        ))

    # ------------------------------------------------------------------
    # Timer
    # ------------------------------------------------------------------

    @contextmanager
    def time(
        self,
        name: str,
        labels: dict | None = None,
    ) -> Generator[None, None, None]:
        """Context manager to time an operation.

        Records the elapsed wall-clock time as a histogram observation
        in seconds.

        Args:
            name:   Metric name (e.g. ``"verify_duration_seconds"``).
            labels: Optional dictionary of label key-value pairs.

        Usage::

            with metrics.time("operation_duration_seconds"):
                do_something()
        """
        start = time.monotonic()
        try:
            yield
        finally:
            elapsed = time.monotonic() - start
            self.histogram(name, elapsed, labels)

    # ------------------------------------------------------------------
    # Querying
    # ------------------------------------------------------------------

    def get_metric(self, name: str) -> list[MetricPoint]:
        """Get metric points by name.

        Returns all recorded observations for the given metric name,
        ordered by timestamp.

        Args:
            name: Metric name to look up.

        Returns:
            List of :class:`MetricPoint` objects.
        """
        return [p for p in self._points if p.name == name]

    def get_all_metrics(self) -> dict[str, list[MetricPoint]]:
        """Get all metrics grouped by name.

        Returns:
            Dictionary mapping metric names to lists of :class:`MetricPoint`.
        """
        result: dict[str, list[MetricPoint]] = {}
        for point in self._points:
            result.setdefault(point.name, []).append(point)
        return result

    # ------------------------------------------------------------------
    # Prometheus exposition format
    # ------------------------------------------------------------------

    def format_prometheus(self) -> str:
        """Format all metrics in Prometheus exposition format.

        The output follows the `Prometheus text-based exposition format
        <https://prometheus.io/docs/instrumenting/exposition_formats/>`_.

        Returns:
            A string in Prometheus exposition format.
        """
        lines: list[str] = []

        # Format counters
        seen_counter_names: set[str] = set()
        for (name, _lk), value in sorted(self._counters.items()):
            # Find the matching point for labels
            labels = self._find_labels_for_key(name, _lk)
            label_str = _format_labels(labels)

            if name not in seen_counter_names:
                lines.append(f"# TYPE {name} counter")
                seen_counter_names.add(name)
            lines.append(f"{name}{label_str} {value}")

        # Format gauges
        seen_gauge_names: set[str] = set()
        for (name, _lk), value in sorted(self._gauges.items()):
            labels = self._find_labels_for_key(name, _lk)
            label_str = _format_labels(labels)

            if name not in seen_gauge_names:
                lines.append(f"# TYPE {name} gauge")
                seen_gauge_names.add(name)
            lines.append(f"{name}{label_str} {value}")

        # Format histograms
        seen_hist_names: set[str] = set()
        for (name, _lk), hist in sorted(self._histograms.items()):
            labels = hist.get("labels")
            label_str = _format_labels(labels)

            if name not in seen_hist_names:
                lines.append(f"# TYPE {name} histogram")
                seen_hist_names.add(name)

            # Bucket lines
            for bucket in sorted(hist["buckets"].keys()):
                bucket_labels = dict(labels) if labels else {}
                bucket_labels["le"] = str(bucket)
                bucket_label_str = _format_labels(bucket_labels)
                lines.append(
                    f"{name}_bucket{bucket_label_str} {hist['buckets'][bucket]}"
                )

            # +Inf bucket
            inf_labels = dict(labels) if labels else {}
            inf_labels["le"] = "+Inf"
            inf_label_str = _format_labels(inf_labels)
            lines.append(
                f"{name}_bucket{inf_label_str} {hist['count']}"
            )

            # Sum and count
            lines.append(f"{name}_sum{label_str} {hist['sum']}")
            lines.append(f"{name}_count{label_str} {hist['count']}")

        return "\n".join(lines) + "\n" if lines else ""

    def _find_labels_for_key(self, name: str, label_key: str) -> dict | None:
        """Find the labels dict for a given metric key.

        Searches backwards through recorded points to find matching labels.

        Args:
            name:      Metric name.
            label_key: Hashable label key string.

        Returns:
            Labels dict or None.
        """
        for point in reversed(self._points):
            if point.name == name and _label_key(point.labels) == label_key:
                return point.labels
        return None

    # ------------------------------------------------------------------
    # Reset
    # ------------------------------------------------------------------

    def reset(self) -> None:
        """Reset all metrics.

        Clears all counters, gauges, histograms, and recorded points.
        """
        self._points.clear()
        self._counters.clear()
        self._gauges.clear()
        self._histograms.clear()
