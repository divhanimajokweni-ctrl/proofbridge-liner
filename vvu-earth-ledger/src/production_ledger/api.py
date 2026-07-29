"""VVU Earth Tech Ledger — REST API using standard library http.server.

The :class:`LedgerAPI` provides an HTTP interface for the production ledger,
exposing endpoints for appending entries, querying, verification, proofs,
snapshots, and metrics.

All request and response bodies are JSON.  Binary data (payloads, hashes,
signatures) are encoded as base64 strings in JSON.

Endpoints:

* ``GET  /health``          — health check
* ``GET  /stats``           — ledger statistics
* ``GET  /entry/{seq}``     — get entry by sequence number
* ``POST /append``          — append new entry (JSON body)
* ``GET  /proof/{seq}``     — get MMR inclusion proof
* ``GET  /receipt/{seq}``   — get receipt (entry + proof)
* ``POST /verify``          — verify the chain
* ``POST /replay``          — trigger replay verification
* ``GET  /validators``      — list validators
* ``GET  /metrics``         — Prometheus metrics
* ``GET  /snapshots``       — list snapshots
* ``POST /snapshot``        — create snapshot

Usage::

    from production_ledger import Ledger, LedgerConfig
    from production_ledger.api import LedgerAPI
    from production_ledger.config import NetworkConfig

    config = LedgerConfig.default()
    ledger = Ledger(config)
    ledger.open()

    api = LedgerAPI(ledger, config.network)
    api.start()   # blocks
"""

from __future__ import annotations

import base64
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any
from urllib.parse import urlparse

from .config import NetworkConfig
from .exceptions import LedgerError
from .ledger import Ledger


# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------

def _json_response(
    handler: BaseHTTPRequestHandler,
    data: Any,
    status_code: int = 200,
) -> None:
    """Write a JSON response to the HTTP handler.

    Args:
        handler:     The HTTP request handler.
        data:        The data to serialize as JSON.
        status_code: HTTP status code (default 200).
    """
    body = json.dumps(data, default=str, indent=2).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _read_json_body(handler: BaseHTTPRequestHandler) -> dict | None:
    """Read and parse a JSON request body.

    Args:
        handler: The HTTP request handler.

    Returns:
        Parsed JSON dict, or ``None`` if the body is empty or invalid.
    """
    content_length = int(handler.headers.get("Content-Length", 0))
    if content_length == 0:
        return None
    raw = handler.rfile.read(content_length)
    try:
        return json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _serialize_envelope(envelope: Any) -> dict[str, Any]:
    """Serialize an Envelope to a JSON-compatible dict.

    Args:
        envelope: An :class:`Envelope` instance.

    Returns:
        Dictionary with all envelope fields, binary data as hex strings.
    """
    return {
        "sequence": envelope.sequence,
        "parent_hash": envelope.parent_hash.hex(),
        "payload": base64.b64encode(envelope.payload).decode("ascii"),
        "payload_hash": envelope.payload_hash.hex(),
        "envelope_hash": envelope.envelope_hash.hex(),
        "revision_hash": envelope.revision_hash.hex(),
        "key_id": envelope.key_id.hex(),
        "key_version": envelope.key_version,
        "timestamp": envelope.timestamp,
        "signature": {
            "key_id": envelope.signature.key_id.hex(),
            "key_version": envelope.signature.key_version,
            "signature": base64.b64encode(envelope.signature.signature).decode("ascii"),
            "timestamp": envelope.signature.timestamp,
        },
    }


def _serialize_proof(proof: Any) -> dict[str, Any]:
    """Serialize an MMRProof to a JSON-compatible dict.

    Args:
        proof: An :class:`MMRProof` instance.

    Returns:
        Dictionary with proof fields.
    """
    result: dict[str, Any] = {
        "leaf_index": proof.leaf_index,
    }
    if hasattr(proof, "hashes") and proof.hashes is not None:
        result["hashes"] = [h.hex() for h in proof.hashes]
    if hasattr(proof, "path") and proof.path is not None:
        result["path"] = [p.hex() if isinstance(p, bytes) else p for p in proof.path]
    if hasattr(proof, "directions") and proof.directions is not None:
        result["directions"] = proof.directions
    return result


def _serialize_snapshot(snapshot: Any) -> dict[str, Any]:
    """Serialize a Snapshot to a JSON-compatible dict.

    Args:
        snapshot: A :class:`Snapshot` instance.

    Returns:
        Dictionary with snapshot fields.
    """
    return {
        "id": snapshot.id,
        "sequence": snapshot.sequence,
        "mmr_root": snapshot.mmr_root.hex(),
        "created_at": snapshot.created_at,
        "hash": snapshot.hash.hex(),
    }


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------

class _LedgerHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the ledger API."""

    # References set by LedgerAPI
    ledger: Ledger
    audit: Any  # AuditLogger | None
    metrics: Any  # MetricsCollector | None

    # ------------------------------------------------------------------
    # Routing
    # ------------------------------------------------------------------

    def _route(self, method: str) -> None:
        """Route a request to the appropriate handler.

        Args:
            method: HTTP method (``"GET"`` or ``"POST"``).
        """
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        try:
            if method == "GET":
                if path == "/health":
                    self._handle_health()
                elif path == "/stats":
                    self._handle_stats()
                elif path == "/metrics":
                    self._handle_metrics()
                elif path == "/validators":
                    self._handle_validators()
                elif path == "/snapshots":
                    self._handle_snapshots()
                elif path.startswith("/entry/"):
                    self._handle_entry(path)
                elif path.startswith("/proof/"):
                    self._handle_proof(path)
                elif path.startswith("/receipt/"):
                    self._handle_receipt(path)
                else:
                    _json_response(self, {"error": "not found"}, status_code=404)

            elif method == "POST":
                if path == "/append":
                    self._handle_append()
                elif path == "/verify":
                    self._handle_verify()
                elif path == "/replay":
                    self._handle_replay()
                elif path == "/snapshot":
                    self._handle_create_snapshot()
                else:
                    _json_response(self, {"error": "not found"}, status_code=404)
            else:
                _json_response(self, {"error": "method not allowed"}, status_code=405)

        except LedgerError as exc:
            _json_response(self, {
                "error": str(exc),
                "code": exc.code,
                "detail": exc.detail,
            }, status_code=400)
        except Exception as exc:
            _json_response(self, {
                "error": str(exc),
                "code": "INTERNAL_ERROR",
            }, status_code=500)

    # ------------------------------------------------------------------
    # GET handlers
    # ------------------------------------------------------------------

    def _handle_health(self) -> None:
        """Handle GET /health — health check."""
        _json_response(self, {
            "status": "ok",
            "service": "production-ledger",
        })

    def _handle_stats(self) -> None:
        """Handle GET /stats — ledger statistics."""
        stats = self.ledger.get_stats()
        # Convert bytes values to hex for JSON
        sanitized: dict[str, Any] = {}
        for k, v in stats.items():
            if isinstance(v, bytes):
                sanitized[k] = v.hex()
            else:
                sanitized[k] = v
        _json_response(self, sanitized)

    def _handle_entry(self, path: str) -> None:
        """Handle GET /entry/{seq} — get entry by sequence."""
        parts = path.split("/")
        if len(parts) < 3:
            _json_response(self, {"error": "missing sequence number"}, status_code=400)
            return

        try:
            sequence = int(parts[2])
        except ValueError:
            _json_response(self, {"error": "invalid sequence number"}, status_code=400)
            return

        entry = self.ledger.get_entry(sequence)
        if entry is None:
            _json_response(self, {"error": f"entry {sequence} not found"}, status_code=404)
            return

        _json_response(self, _serialize_envelope(entry))

    def _handle_proof(self, path: str) -> None:
        """Handle GET /proof/{seq} — get inclusion proof."""
        parts = path.split("/")
        if len(parts) < 3:
            _json_response(self, {"error": "missing sequence number"}, status_code=400)
            return

        try:
            sequence = int(parts[2])
        except ValueError:
            _json_response(self, {"error": "invalid sequence number"}, status_code=400)
            return

        try:
            proof = self.ledger.get_proof(sequence)
            _json_response(self, _serialize_proof(proof))
        except LedgerError as exc:
            _json_response(self, {
                "error": str(exc),
                "code": exc.code,
            }, status_code=400)

    def _handle_receipt(self, path: str) -> None:
        """Handle GET /receipt/{seq} — get receipt (entry + proof)."""
        parts = path.split("/")
        if len(parts) < 3:
            _json_response(self, {"error": "missing sequence number"}, status_code=400)
            return

        try:
            sequence = int(parts[2])
        except ValueError:
            _json_response(self, {"error": "invalid sequence number"}, status_code=400)
            return

        entry = self.ledger.get_entry(sequence)
        if entry is None:
            _json_response(self, {"error": f"entry {sequence} not found"}, status_code=404)
            return

        try:
            proof = self.ledger.get_proof(sequence)
            _json_response(self, {
                "entry": _serialize_envelope(entry),
                "proof": _serialize_proof(proof),
            })
        except LedgerError as exc:
            _json_response(self, {
                "entry": _serialize_envelope(entry),
                "proof": None,
                "error": str(exc),
            }, status_code=200)

    def _handle_validators(self) -> None:
        """Handle GET /validators — list validators."""
        registry = self.ledger.validator_registry
        if registry is None:
            _json_response(self, {"validators": []})
            return

        active = registry.list_active()
        validators_data: list[dict[str, Any]] = []
        for rec in active:
            validators_data.append({
                "key_id": rec.key_id.hex(),
                "public_key": rec.public_key.hex(),
                "weight": rec.weight,
                "registration_sequence": rec.registration_sequence,
                "key_version": rec.key_version,
                "created_at": rec.created_at,
                "expires_at": rec.expires_at,
            })

        _json_response(self, {
            "validators": validators_data,
            "count": len(validators_data),
            "total_weight": registry.total_weight(),
        })

    def _handle_metrics(self) -> None:
        """Handle GET /metrics — Prometheus metrics."""
        if self.metrics is None:
            _json_response(self, {"metrics": "not configured"}, status_code=503)
            return

        prometheus_text = self.metrics.format_prometheus()
        body = prometheus_text.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_snapshots(self) -> None:
        """Handle GET /snapshots — list snapshots."""
        snapshot_mgr = self.ledger._snapshot_manager
        if snapshot_mgr is None:
            _json_response(self, {"snapshots": []})
            return

        snapshots = snapshot_mgr.list_snapshots()
        _json_response(self, {
            "snapshots": [_serialize_snapshot(s) for s in snapshots],
            "count": len(snapshots),
        })

    # ------------------------------------------------------------------
    # POST handlers
    # ------------------------------------------------------------------

    def _handle_append(self) -> None:
        """Handle POST /append — append new entry."""
        body = _read_json_body(self)
        if body is None:
            _json_response(self, {"error": "invalid JSON body"}, status_code=400)
            return

        payload_b64 = body.get("payload")
        if payload_b64 is None:
            _json_response(self, {"error": "missing 'payload' field"}, status_code=400)
            return

        try:
            payload = base64.b64decode(payload_b64)
        except Exception:
            _json_response(self, {"error": "invalid base64 payload"}, status_code=400)
            return

        # Parse optional signatures
        signatures = None
        sigs_data = body.get("signatures")
        if sigs_data is not None and isinstance(sigs_data, list):
            from .ed25519 import Signature
            signatures = []
            for sig_dict in sigs_data:
                try:
                    sig = Signature(
                        key_id=bytes.fromhex(sig_dict["key_id"]),
                        key_version=sig_dict["key_version"],
                        signature=base64.b64decode(sig_dict["signature"]),
                        timestamp=sig_dict.get("timestamp", 0.0),
                    )
                    signatures.append(sig)
                except (KeyError, ValueError, Exception):
                    # Skip invalid signatures
                    continue

        envelope = self.ledger.append(payload, signatures)

        # Record audit event
        if self.audit is not None:
            self.audit.log_append(
                sequence=envelope.sequence,
                payload_hash=envelope.payload_hash,
            )

        # Record metrics
        if self.metrics is not None:
            self.metrics.increment("ledger_appends_total")

        _json_response(self, _serialize_envelope(envelope), status_code=201)

    def _handle_verify(self) -> None:
        """Handle POST /verify — verify the chain."""
        body = _read_json_body(self) or {}

        from_sequence = body.get("from_sequence", 0)
        to_sequence = body.get("to_sequence")

        result = self.ledger.verify_chain(
            from_sequence=from_sequence,
            to_sequence=to_sequence,
        )

        # Record audit event
        if self.audit is not None:
            self.audit.log_verify(
                sequence=to_sequence or self.ledger.get_sequence(),
                result=result,
            )

        # Record metrics
        if self.metrics is not None:
            self.metrics.increment("ledger_verifications_total")

        _json_response(self, {
            "valid": result,
            "from_sequence": from_sequence,
            "to_sequence": to_sequence or self.ledger.get_sequence(),
        })

    def _handle_replay(self) -> None:
        """Handle POST /replay — trigger replay verification."""
        body = _read_json_body(self) or {}

        from_sequence = body.get("from_sequence", 0)
        to_sequence = body.get("to_sequence")

        from .replay import ReplayEngine
        engine = ReplayEngine(self.ledger._config)
        result = engine.replay(
            from_sequence=from_sequence,
            to_sequence=to_sequence,
        )

        # Record audit event
        if self.audit is not None:
            self.audit.log_replay(
                sequence=result.total_entries,
                violations=len(result.violations),
            )

        # Record metrics
        if self.metrics is not None:
            self.metrics.increment("ledger_replays_total")
            self.metrics.histogram("replay_duration_ms", result.duration_ms)

        # Serialize violations
        violations_data: list[dict[str, Any]] = []
        for v in result.violations:
            violations_data.append({
                "sequence": v.sequence,
                "check": v.check,
                "expected": v.expected,
                "actual": v.actual,
                "severity": v.severity,
            })

        _json_response(self, {
            "success": result.success,
            "total_entries": result.total_entries,
            "verified_entries": result.verified_entries,
            "violations": violations_data,
            "duration_ms": result.duration_ms,
            "mmr_root": result.mmr_root.hex(),
        })

    def _handle_create_snapshot(self) -> None:
        """Handle POST /snapshot — create snapshot."""
        snapshot = self.ledger.create_snapshot()

        # Record metrics
        if self.metrics is not None:
            self.metrics.increment("ledger_snapshots_created_total")

        _json_response(self, _serialize_snapshot(snapshot), status_code=201)

    # ------------------------------------------------------------------
    # HTTP method dispatch
    # ------------------------------------------------------------------

    def do_GET(self) -> None:
        """Handle GET requests."""
        self._route("GET")

    def do_POST(self) -> None:
        """Handle POST requests."""
        self._route("POST")

    def log_message(self, format: str, *args: Any) -> None:
        """Suppress default HTTP logging."""
        pass


# ---------------------------------------------------------------------------
# Ledger API
# ---------------------------------------------------------------------------

class LedgerAPI:
    """HTTP API for the production ledger.

    Provides a REST interface over the :class:`Ledger` with optional
    integration with :class:`AuditLogger` and :class:`MetricsCollector`.

    Args:
        ledger:  An open :class:`Ledger` instance.
        config:  A :class:`NetworkConfig` instance.
        audit:   Optional :class:`AuditLogger` for audit event recording.
        metrics: Optional :class:`MetricsCollector` for metrics recording.
    """

    def __init__(
        self,
        ledger: Ledger,
        config: NetworkConfig,
        audit: Any | None = None,
        metrics: Any | None = None,
    ) -> None:
        """Initialize the API.

        Args:
            ledger:  An open :class:`Ledger` instance.
            config:  A :class:`NetworkConfig` instance.
            audit:   Optional :class:`AuditLogger`.
            metrics: Optional :class:`MetricsCollector`.
        """
        self._ledger = ledger
        self._config = config
        self._audit = audit
        self._metrics = metrics
        self._server: HTTPServer | None = None
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        """Start the HTTP server.

        Binds to the host and port specified in the :class:`NetworkConfig`.
        Runs in a daemon thread so that it does not block the calling
        process.
        """
        # Create a custom handler class with references to the ledger
        handler = type(
            "LedgerHandler",
            (_LedgerHandler,),
            {
                "ledger": self._ledger,
                "audit": self._audit,
                "metrics": self._metrics,
            },
        )

        self._server = HTTPServer(
            (self._config.host, self._config.port),
            handler,
        )
        self._thread = threading.Thread(
            target=self._server.serve_forever,
            daemon=True,
            name="ledger-api",
        )
        self._thread.start()

    def stop(self) -> None:
        """Stop the HTTP server.

        Shuts down the server and waits for the thread to finish.
        """
        if self._server is not None:
            self._server.shutdown()
            self._server = None
        if self._thread is not None:
            self._thread.join(timeout=5.0)
            self._thread = None
