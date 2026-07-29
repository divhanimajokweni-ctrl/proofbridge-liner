"""VVU Earth Tech Ledger — Command-line interface.

Provides a full CLI using ``argparse`` from the standard library.  Every
subcommand delegates to the real production modules — no stubs, no TODOs.

Subcommands
-----------

* ``init``          — Initialise a new ledger database.
* ``migrate``       — Run database migrations.
* ``append``        — Append an entry to the ledger.
* ``replay``        — Replay and verify the ledger.
* ``verify``        — Verify the chain integrity.
* ``snapshot``      — Create a snapshot.
* ``proof``         — Generate an inclusion proof.
* ``validators``    — List / register / revoke / rotate validators.
* ``rotate-key``    — Rotate the signing key.
* ``backup``        — Export the database to a file.
* ``restore``       — Import from a backup file.
* ``metrics``       — Show metrics in Prometheus format.
* ``serve``         — Start the HTTP API server.
* ``version``       — Print version.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sqlite3
import sys
import time
from pathlib import Path
from typing import Any, TextIO


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_config(config_path: str | None) -> "LedgerConfig":
    """Load a :class:`LedgerConfig` from a TOML file or return defaults."""
    from .config import LedgerConfig

    if config_path is not None:
        return LedgerConfig.from_toml(config_path)
    return LedgerConfig.default()


def _open_ledger(config: "LedgerConfig") -> "Ledger":
    """Create and open a :class:`Ledger` from *config*."""
    from .ledger import Ledger

    ledger = Ledger(config)
    ledger.open()
    return ledger


def _ensure_parent_dir(path: str) -> None:
    """Create the parent directory of *path* if it does not exist."""
    parent = Path(path).parent
    parent.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Subcommand handlers
# ---------------------------------------------------------------------------

def _cmd_init(args: argparse.Namespace) -> None:
    """Initialise a new ledger database."""
    from .config import LedgerConfig

    config = _load_config(args.config)

    # Ensure the database directory exists
    db_dir = Path(config.database.db_path).parent
    if db_dir and str(db_dir) != ".":
        db_dir.mkdir(parents=True, exist_ok=True)

    # Also ensure the data directory exists for the default config
    data_dir = Path("./data")
    data_dir.mkdir(parents=True, exist_ok=True)

    ledger = _open_ledger(config)
    try:
        seq = ledger.get_sequence()
        if seq < 0:
            print("Ledger initialised with 0 entries.")
        else:
            print(f"Ledger already exists with {seq + 1} entries.")
        print(f"  Database : {config.database.db_path}")
        print(f"  MMR root : {ledger.get_mmr_root().hex()}")
    finally:
        ledger.close()


def _cmd_migrate(args: argparse.Namespace) -> None:
    """Run database migrations."""
    from .config import LedgerConfig, DatabaseConfig
    from .storage import LedgerStorage
    from .migrations import MigrationManager

    config = _load_config(args.config)
    storage = LedgerStorage(config.database)
    storage.open()

    try:
        mgr = MigrationManager(storage)

        if args.down:
            # Rollback to a specific version
            target = args.to if args.to is not None else mgr.get_current_version() - 1
            rolled_back = mgr.migrate_down(target_version=target)
            if rolled_back:
                print(f"Rolled back migrations: {rolled_back}")
            else:
                print("No migrations to roll back.")
        else:
            # Apply pending migrations
            target = args.to
            applied = mgr.migrate_up(target_version=target)
            if applied:
                print(f"Applied migrations: {applied}")
            else:
                print("No pending migrations.")

        current = mgr.get_current_version()
        print(f"Current schema version: {current}")
    finally:
        storage.close()


def _cmd_append(args: argparse.Namespace) -> None:
    """Append an entry to the ledger."""
    config = _load_config(args.config)
    ledger = _open_ledger(config)

    try:
        if args.file:
            with open(args.file, "rb") as f:
                payload = f.read()
        elif args.payload:
            payload = args.payload.encode("utf-8")
        else:
            print("Error: --payload or --file is required", file=sys.stderr)
            sys.exit(1)

        envelope = ledger.append(payload)

        print(f"Appended entry at sequence {envelope.sequence}")
        print(f"  Payload hash  : {envelope.payload_hash.hex()}")
        print(f"  Envelope hash : {envelope.envelope_hash.hex()}")
        print(f"  Revision hash : {envelope.revision_hash.hex()}")
        print(f"  Key ID        : {envelope.key_id.hex()}")
        print(f"  Key version   : {envelope.key_version}")
        print(f"  Timestamp     : {envelope.timestamp}")
    finally:
        ledger.close()


def _cmd_replay(args: argparse.Namespace) -> None:
    """Replay and verify the ledger."""
    from .replay import ReplayEngine

    config = _load_config(args.config)
    engine = ReplayEngine(config)

    result = engine.replay(
        from_sequence=args.from_seq,
        to_sequence=args.to_seq,
    )

    print(f"Replay result: {'SUCCESS' if result.success else 'FAILED'}")
    print(f"  Total entries   : {result.total_entries}")
    print(f"  Verified entries : {result.verified_entries}")
    print(f"  Duration (ms)    : {result.duration_ms:.2f}")
    print(f"  MMR root         : {result.mmr_root.hex()}")
    print(f"  Violations       : {len(result.violations)}")

    if args.verbose and result.violations:
        print()
        for v in result.violations:
            print(
                f"  seq={v.sequence} check={v.check} "
                f"severity={v.severity}: expected={v.expected} actual={v.actual}"
            )


def _cmd_verify(args: argparse.Namespace) -> None:
    """Verify the chain integrity."""
    config = _load_config(args.config)
    ledger = _open_ledger(config)

    try:
        result = ledger.verify_chain()
        if result:
            print("Chain verification: PASSED")
        else:
            print("Chain verification: FAILED")
            sys.exit(1)

        stats = ledger.get_stats()
        print(f"  Sequence : {stats['sequence']}")
        print(f"  MMR root : {stats['mmr_root']}")
    finally:
        ledger.close()


def _cmd_snapshot(args: argparse.Namespace) -> None:
    """Create a snapshot."""
    config = _load_config(args.config)
    ledger = _open_ledger(config)

    try:
        snapshot = ledger.create_snapshot()

        print(f"Snapshot created:")
        print(f"  ID       : {snapshot.id}")
        print(f"  Sequence : {snapshot.sequence}")
        print(f"  MMR root : {snapshot.mmr_root.hex()}")
        print(f"  Hash     : {snapshot.hash.hex()}")

        if args.export:
            # Export the snapshot to a file
            from .snapshots import SnapshotManager

            if ledger._snapshot_manager is not None:
                ledger._snapshot_manager.export_snapshot(snapshot.id, args.export)
                print(f"  Exported to : {args.export}")
            else:
                print("Error: snapshot manager not available", file=sys.stderr)
                sys.exit(1)
    finally:
        ledger.close()


def _cmd_proof(args: argparse.Namespace) -> None:
    """Generate an inclusion proof for a sequence."""
    from .proofs import ProofEngine

    config = _load_config(args.config)
    ledger = _open_ledger(config)

    try:
        engine = ProofEngine(ledger)
        proof = engine.generate_inclusion_proof(sequence=args.seq)

        print(f"Inclusion proof for sequence {args.seq}:")
        print(f"  MMR root : {proof.mmr_root.hex()}")
        print(f"  Timestamp: {proof.timestamp}")

        mmr_proof = proof.mmr_proof
        print(f"  Leaf index: {mmr_proof.leaf_index}")

        if hasattr(mmr_proof, "hashes") and mmr_proof.hashes is not None:
            print(f"  Hashes   : {[h.hex() for h in mmr_proof.hashes]}")
        if hasattr(mmr_proof, "path") and mmr_proof.path is not None:
            print(f"  Path     : {[p.hex() if isinstance(p, bytes) else p for p in mmr_proof.path]}")
        if hasattr(mmr_proof, "directions") and mmr_proof.directions is not None:
            print(f"  Directions: {mmr_proof.directions}")

        # Verify the proof
        is_valid = engine.verify_inclusion_proof(proof)
        print(f"  Proof valid: {is_valid}")
    finally:
        ledger.close()


def _cmd_validators(args: argparse.Namespace) -> None:
    """List / register / revoke / rotate validators."""
    config = _load_config(args.config)
    ledger = _open_ledger(config)

    try:
        registry = ledger.validator_registry
        if registry is None:
            print("Error: validator registry not initialised", file=sys.stderr)
            sys.exit(1)

        if args.register:
            # Register a new validator with the given hex-encoded public key
            import hashlib

            public_key = bytes.fromhex(args.register)
            key_id = hashlib.sha256(public_key).digest()[:4]
            sequence = ledger.get_sequence()

            record = registry.register(
                key_id=key_id,
                public_key=public_key,
                weight=1,
                sequence=sequence + 1,
            )
            print(f"Registered validator:")
            print(f"  Key ID    : {record.key_id.hex()}")
            print(f"  Public key: {record.public_key.hex()}")
            print(f"  Weight    : {record.weight}")

        elif args.revoke:
            key_id = bytes.fromhex(args.revoke)
            sequence = ledger.get_sequence()
            registry.revoke(key_id, sequence + 1)
            print(f"Revoked validator: {key_id.hex()}")

        elif args.rotate:
            old_key_id = bytes.fromhex(args.rotate)
            sequence = ledger.get_sequence()

            # Generate a new key pair for the rotation
            from .ed25519 import KeyStore

            temp_store = KeyStore()
            new_kp = temp_store.generate_key()

            new_record = registry.rotate_key(
                old_key_id=old_key_id,
                new_public_key=new_kp.public_key,
                new_key_version=new_kp.version,
                sequence=sequence + 1,
            )
            print(f"Rotated validator key:")
            print(f"  Old key ID : {old_key_id.hex()}")
            print(f"  New key ID : {new_record.key_id.hex()}")
            print(f"  New public : {new_record.public_key.hex()}")

        else:
            # List all active validators
            active = registry.list_active()
            if not active:
                print("No active validators.")
            else:
                print(f"Active validators ({len(active)}):")
                for rec in active:
                    print(
                        f"  key_id={rec.key_id.hex()} "
                        f"weight={rec.weight} "
                        f"reg_seq={rec.registration_sequence} "
                        f"key_ver={rec.key_version}"
                    )
    finally:
        ledger.close()


def _cmd_rotate_key(args: argparse.Namespace) -> None:
    """Rotate the signing key."""
    config = _load_config(args.config)
    ledger = _open_ledger(config)

    try:
        new_kp = ledger.signer.rotate_key()
        print(f"Key rotated:")
        print(f"  Key ID    : {new_kp.key_id.hex()}")
        print(f"  Version   : {new_kp.version}")
        print(f"  Public key: {new_kp.public_key.hex()}")
    finally:
        ledger.close()


def _cmd_backup(args: argparse.Namespace) -> None:
    """Export the database to a file."""
    config = _load_config(args.config)
    db_path = config.database.db_path

    output_path = args.output
    if output_path is None:
        output_path = f"ledger_backup_{int(time.time())}.db"

    _ensure_parent_dir(output_path)

    # Copy the database file (SQLite supports file-level backup)
    # First, checkpoint the WAL to ensure the main DB file is up to date
    if not Path(db_path).exists():
        print(f"Error: database file not found at {db_path}", file=sys.stderr)
        sys.exit(1)

    # Use SQLite backup API for a consistent snapshot
    source_conn = sqlite3.connect(db_path)
    try:
        source_conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    except sqlite3.Error:
        pass

    dest_conn = sqlite3.connect(output_path)
    try:
        source_conn.backup(dest_conn)
        dest_conn.commit()
    finally:
        dest_conn.close()
        source_conn.close()

    # Also copy the WAL and SHM files if they exist
    for suffix in ("-wal", "-shm"):
        src = Path(f"{db_path}{suffix}")
        dst = Path(f"{output_path}{suffix}")
        if src.exists():
            shutil.copy2(str(src), str(dst))

    size = Path(output_path).stat().st_size
    print(f"Backup created: {output_path} ({size} bytes)")


def _cmd_restore(args: argparse.Namespace) -> None:
    """Import from a backup file."""
    config = _load_config(args.config)
    db_path = config.database.db_path

    input_path = args.input
    if input_path is None:
        print("Error: --input is required", file=sys.stderr)
        sys.exit(1)

    if not Path(input_path).exists():
        print(f"Error: backup file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    # Verify the backup is a valid SQLite database
    try:
        conn = sqlite3.connect(input_path)
        result = conn.execute("PRAGMA integrity_check").fetchone()
        conn.close()
        if result is None or result[0] != "ok":
            print(f"Error: backup file failed integrity check: {result}", file=sys.stderr)
            sys.exit(1)
    except sqlite3.Error as exc:
        print(f"Error: backup file is not a valid SQLite database: {exc}", file=sys.stderr)
        sys.exit(1)

    _ensure_parent_dir(db_path)

    # Copy the backup file to the database location
    shutil.copy2(input_path, db_path)

    # Also copy WAL and SHM files if they exist
    for suffix in ("-wal", "-shm"):
        src = Path(f"{input_path}{suffix}")
        dst = Path(f"{db_path}{suffix}")
        if src.exists():
            shutil.copy2(str(src), str(dst))
        elif dst.exists():
            dst.unlink()

    # Verify the restored database works
    try:
        ledger = _open_ledger(config)
        seq = ledger.get_sequence()
        ledger.close()
        print(f"Restored ledger from backup: {input_path}")
        print(f"  Entries: {seq + 1 if seq >= 0 else 0}")
    except Exception as exc:
        print(f"Error: restored database failed to open: {exc}", file=sys.stderr)
        sys.exit(1)


def _cmd_metrics(args: argparse.Namespace) -> None:
    """Show metrics in Prometheus format."""
    from .config import MetricsConfig
    from .metrics import MetricsCollector

    config = _load_config(args.config)
    metrics = MetricsCollector(config.metrics)

    # Record some basic metrics from the ledger
    try:
        ledger = _open_ledger(config)
        try:
            stats = ledger.get_stats()
            metrics.gauge("ledger_sequence", stats["sequence"])
            metrics.gauge("ledger_mmr_size", stats["mmr_size"])
            metrics.gauge("ledger_validator_count", stats.get("validator_count", 0))
            metrics.gauge("ledger_total_weight", stats.get("total_weight", 0))
        finally:
            ledger.close()
    except Exception:
        # If the ledger cannot be opened, just show empty metrics
        pass

    prometheus_text = metrics.format_prometheus()
    print(prometheus_text, end="")


def _cmd_serve(args: argparse.Namespace) -> None:
    """Start the HTTP API server."""
    import signal

    from .api import LedgerAPI
    from .config import NetworkConfig
    from .audit import AuditLogger
    from .metrics import MetricsCollector

    config = _load_config(args.config)

    # Override host/port if specified on the command line
    host = args.host if args.host else config.network.host
    port = args.port if args.port else config.network.port

    # Build a new NetworkConfig with the resolved host/port
    from dataclasses import fields as dc_fields

    network_kwargs: dict[str, Any] = {}
    for f in dc_fields(NetworkConfig):
        if f.name == "host":
            network_kwargs["host"] = host
        elif f.name == "port":
            network_kwargs["port"] = port
        else:
            network_kwargs[f.name] = getattr(config.network, f.name)
    network_config = NetworkConfig(**network_kwargs)

    ledger = _open_ledger(config)
    audit = AuditLogger(config.logging)
    metrics = MetricsCollector(config.metrics)

    api = LedgerAPI(ledger, network_config, audit=audit, metrics=metrics)
    api.start()

    print(f"Production Ledger API server running on {host}:{port}")
    print("Press Ctrl+C to stop.")

    # Graceful shutdown on SIGINT / SIGTERM
    def _shutdown(signum: int, frame: Any) -> None:
        print("\nShutting down...")
        api.stop()
        ledger.close()
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    # Block the main thread
    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        pass
    finally:
        api.stop()
        ledger.close()


def _cmd_version(args: argparse.Namespace) -> None:
    """Print version."""
    from .version import __version__

    print(f"production-ledger {__version__}")


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    """Build the top-level argument parser with all subcommands."""
    parser = argparse.ArgumentParser(
        prog="ledger",
        description="VVU Earth Tech Ledger — Deterministic, cryptographically verifiable production ledger",
    )
    parser.add_argument(
        "--config", "-c",
        default=None,
        help="Path to a TOML configuration file",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # ---- init ----
    init_parser = subparsers.add_parser("init", help="Initialise a new ledger database")
    init_parser.set_defaults(func=_cmd_init)

    # ---- migrate ----
    migrate_parser = subparsers.add_parser("migrate", help="Run database migrations")
    migrate_parser.add_argument("--up", action="store_true", default=True, help="Apply pending migrations (default)")
    migrate_parser.add_argument("--down", action="store_true", default=False, help="Rollback migrations")
    migrate_parser.add_argument("--to", type=int, default=None, help="Target schema version")
    migrate_parser.set_defaults(func=_cmd_migrate)

    # ---- append ----
    append_parser = subparsers.add_parser("append", help="Append an entry to the ledger")
    append_parser.add_argument("--payload", "-p", default=None, help="Payload string to append")
    append_parser.add_argument("--file", "-f", default=None, help="Path to file to append as payload")
    append_parser.set_defaults(func=_cmd_append)

    # ---- replay ----
    replay_parser = subparsers.add_parser("replay", help="Replay and verify the ledger")
    replay_parser.add_argument("--from", dest="from_seq", type=int, default=0, help="Starting sequence number")
    replay_parser.add_argument("--to", dest="to_seq", type=int, default=None, help="Ending sequence number")
    replay_parser.add_argument("--verbose", "-v", action="store_true", default=False, help="Show detailed output")
    replay_parser.set_defaults(func=_cmd_replay)

    # ---- verify ----
    verify_parser = subparsers.add_parser("verify", help="Verify the chain integrity")
    verify_parser.set_defaults(func=_cmd_verify)

    # ---- snapshot ----
    snapshot_parser = subparsers.add_parser("snapshot", help="Create a snapshot")
    snapshot_parser.add_argument("--export", "-e", default=None, help="Export snapshot to file")
    snapshot_parser.set_defaults(func=_cmd_snapshot)

    # ---- proof ----
    proof_parser = subparsers.add_parser("proof", help="Generate an inclusion proof")
    proof_parser.add_argument("--seq", "-s", type=int, required=True, help="Sequence number")
    proof_parser.set_defaults(func=_cmd_proof)

    # ---- validators ----
    validators_parser = subparsers.add_parser("validators", help="List / register / revoke / rotate validators")
    validators_parser.add_argument("--register", "-r", default=None, help="Register a validator (hex-encoded public key)")
    validators_parser.add_argument("--revoke", default=None, help="Revoke a validator (hex-encoded key ID)")
    validators_parser.add_argument("--rotate", default=None, help="Rotate a validator key (hex-encoded old key ID)")
    validators_parser.set_defaults(func=_cmd_validators)

    # ---- rotate-key ----
    rotate_key_parser = subparsers.add_parser("rotate-key", help="Rotate the signing key")
    rotate_key_parser.set_defaults(func=_cmd_rotate_key)

    # ---- backup ----
    backup_parser = subparsers.add_parser("backup", help="Export the database to a file")
    backup_parser.add_argument("--output", "-o", default=None, help="Output file path")
    backup_parser.set_defaults(func=_cmd_backup)

    # ---- restore ----
    restore_parser = subparsers.add_parser("restore", help="Import from a backup file")
    restore_parser.add_argument("--input", "-i", default=None, help="Input backup file path")
    restore_parser.set_defaults(func=_cmd_restore)

    # ---- metrics ----
    metrics_parser = subparsers.add_parser("metrics", help="Show metrics in Prometheus format")
    metrics_parser.set_defaults(func=_cmd_metrics)

    # ---- serve ----
    serve_parser = subparsers.add_parser("serve", help="Start the HTTP API server")
    serve_parser.add_argument("--host", default=None, help="Bind host")
    serve_parser.add_argument("--port", type=int, default=None, help="Bind port")
    serve_parser.set_defaults(func=_cmd_serve)

    # ---- version ----
    version_parser = subparsers.add_parser("version", help="Print version")
    version_parser.set_defaults(func=_cmd_version)

    return parser


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main() -> None:
    """Main CLI entry point."""
    parser = _build_parser()
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    try:
        args.func(args)
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
