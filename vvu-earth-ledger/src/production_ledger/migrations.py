"""VVU Earth Tech Ledger — Database migration framework with versioned schema evolution.

Migrations are registered explicitly and applied in version order.  Each
migration carries an ``up_sql`` (forward) and ``down_sql`` (rollback)
script so the schema can evolve in both directions.

The migration history is persisted in the ``metadata`` table so that
the system knows which migrations have already been applied.

Usage::

    storage = LedgerStorage(config)
    storage.open()

    mgr = MigrationManager(storage)
    applied = mgr.migrate_up()          # apply all pending migrations
    history = mgr.get_migration_history()

    mgr.migrate_down(target_version=1)  # roll back to v1
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from .exceptions import DatabaseError, MigrationFailedError
from .storage import LedgerStorage


# ---------------------------------------------------------------------------
# Migration data class
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Migration:
    """A single database migration.

    Attributes:
        version:     Monotonically increasing version number.
        description: Human-readable description of the migration.
        up_sql:      SQL script to apply the migration.
        down_sql:    SQL script to roll back the migration.
    """

    version: int
    description: str
    up_sql: str
    down_sql: str


# ---------------------------------------------------------------------------
# Migration manager
# ---------------------------------------------------------------------------

class MigrationManager:
    """Manages database schema migrations.

    Register migrations via :meth:`register_migration`, then apply them
    with :meth:`migrate_up` or roll back with :meth:`migrate_down`.
    """

    def __init__(self, storage: LedgerStorage) -> None:
        """Initialize with storage reference.

        The built-in migration set (v1 and v2) is registered
        automatically.

        Args:
            storage: An open :class:`LedgerStorage` instance.
        """
        self._storage: LedgerStorage = storage
        self._migrations: dict[int, Migration] = {}
        self._register_builtin_migrations()

    # ------------------------------------------------------------------
    # Built-in migrations
    # ------------------------------------------------------------------

    def _register_builtin_migrations(self) -> None:
        """Register the default migration set shipped with the ledger."""

        # Migration 1: Create core tables
        self.register_migration(Migration(
            version=1,
            description="Create core tables (metadata, entries, validators, snapshots, mmr_nodes)",
            up_sql="""
                CREATE TABLE IF NOT EXISTS metadata (
                    key   TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS entries (
                    sequence         INTEGER PRIMARY KEY,
                    parent_hash      BLOB,
                    payload_hash     BLOB,
                    envelope_hash    BLOB,
                    revision_hash   BLOB,
                    mmr_position     INTEGER,
                    created_at       REAL NOT NULL,
                    signature_key_id BLOB,
                    signature        BLOB
                );

                CREATE TABLE IF NOT EXISTS validators (
                    key_id               BLOB PRIMARY KEY,
                    public_key           BLOB NOT NULL,
                    weight               INTEGER NOT NULL,
                    registration_sequence INTEGER,
                    revocation_sequence  INTEGER,
                    key_version          INTEGER,
                    created_at           REAL NOT NULL,
                    expires_at           REAL
                );

                CREATE TABLE IF NOT EXISTS snapshots (
                    id         INTEGER PRIMARY KEY,
                    sequence   INTEGER NOT NULL,
                    mmr_root   BLOB NOT NULL,
                    data       BLOB NOT NULL,
                    created_at REAL NOT NULL,
                    hash       BLOB NOT NULL
                );

                CREATE TABLE IF NOT EXISTS mmr_nodes (
                    position INTEGER PRIMARY KEY,
                    hash     BLOB NOT NULL
                );

                INSERT OR IGNORE INTO metadata (key, value)
                    VALUES ('schema_version', '1');
            """,
            down_sql="""
                DROP TABLE IF EXISTS mmr_nodes;
                DROP TABLE IF EXISTS snapshots;
                DROP TABLE IF EXISTS validators;
                DROP TABLE IF EXISTS entries;
                DELETE FROM metadata WHERE key='schema_version';
            """,
        ))

        # Migration 2: Add audit and indexing
        self.register_migration(Migration(
            version=2,
            description="Add audit_log table and indexes on entries, validators, audit_log",
            up_sql="""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id              INTEGER PRIMARY KEY,
                    sequence        INTEGER,
                    event_type      TEXT NOT NULL,
                    actor           TEXT,
                    target          TEXT,
                    detail          TEXT,
                    timestamp       REAL NOT NULL,
                    correlation_id  TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_entries_sequence
                    ON entries (sequence);

                CREATE INDEX IF NOT EXISTS idx_entries_payload_hash
                    ON entries (payload_hash);

                CREATE INDEX IF NOT EXISTS idx_validators_key_id
                    ON validators (key_id);

                CREATE INDEX IF NOT EXISTS idx_audit_log_sequence
                    ON audit_log (sequence);

                INSERT OR REPLACE INTO metadata (key, value)
                    VALUES ('schema_version', '2');
            """,
            down_sql="""
                DROP INDEX IF EXISTS idx_audit_log_sequence;
                DROP INDEX IF EXISTS idx_validators_key_id;
                DROP INDEX IF EXISTS idx_entries_payload_hash;
                DROP INDEX IF EXISTS idx_entries_sequence;
                DROP TABLE IF EXISTS audit_log;
                INSERT OR REPLACE INTO metadata (key, value)
                    VALUES ('schema_version', '1');
            """,
        ))

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register_migration(self, migration: Migration) -> None:
        """Register a migration.

        Raises:
            MigrationFailedError: If a migration with the same version
                is already registered.
        """
        if migration.version in self._migrations:
            raise MigrationFailedError(
                migration.version,
                f"Migration version {migration.version} is already registered",
                detail={"version": migration.version},
            )
        self._migrations[migration.version] = migration

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_current_version(self) -> int:
        """Get the current schema version.

        Returns:
            The current schema version integer, or ``0`` if no
            migrations have been applied.
        """
        return self._storage.get_schema_version()

    def get_pending_migrations(self) -> list[Migration]:
        """Get migrations that haven't been applied yet.

        Returns:
            List of pending :class:`Migration` objects sorted by version.
        """
        current = self.get_current_version()
        pending = [
            m for m in self._migrations.values()
            if m.version > current
        ]
        return sorted(pending, key=lambda m: m.version)

    # ------------------------------------------------------------------
    # Forward migration
    # ------------------------------------------------------------------

    def migrate_up(self, target_version: int | None = None) -> list[int]:
        """Apply pending migrations up to *target_version* (or all).

        Each migration is applied inside its own transaction.  If a
        migration fails the transaction is rolled back and the error is
        re-raised as :class:`MigrationFailedError`.

        Args:
            target_version: Apply migrations up to and including this
                version.  If ``None``, apply all pending migrations.

        Returns:
            List of applied version numbers.

        Raises:
            MigrationFailedError: If any migration fails.
        """
        pending = self.get_pending_migrations()

        if target_version is not None:
            pending = [m for m in pending if m.version <= target_version]

        applied: list[int] = []

        for migration in pending:
            try:
                self._storage.begin_transaction()
                self._storage.execute_script(migration.up_sql)
                # Record the migration in the history table
                self._storage.execute(
                    "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
                    ("schema_version", str(migration.version)),
                )
                self._storage.commit()
                applied.append(migration.version)
            except DatabaseError as exc:
                try:
                    self._storage.rollback()
                except DatabaseError:
                    pass  # best-effort rollback
                raise MigrationFailedError(
                    migration.version,
                    str(exc),
                    detail={
                        "version": migration.version,
                        "description": migration.description,
                        "error": str(exc),
                    },
                ) from exc
            except Exception as exc:
                try:
                    self._storage.rollback()
                except Exception:
                    pass
                raise MigrationFailedError(
                    migration.version,
                    str(exc),
                    detail={
                        "version": migration.version,
                        "description": migration.description,
                        "error": str(exc),
                    },
                ) from exc

        return applied

    # ------------------------------------------------------------------
    # Rollback
    # ------------------------------------------------------------------

    def migrate_down(self, target_version: int) -> list[int]:
        """Rollback migrations down to *target_version*.

        Migrations are rolled back in reverse version order.  Each
        rollback is applied inside its own transaction.

        Args:
            target_version: Roll back to this version.  All migrations
                with version > *target_version* are reversed.

        Returns:
            List of rolled-back version numbers (in rollback order,
                i.e. highest first).

        Raises:
            MigrationFailedError: If any rollback fails.
        """
        current = self.get_current_version()
        if target_version >= current:
            return []

        # Collect migrations to roll back, in reverse version order
        to_rollback = sorted(
            [
                m for m in self._migrations.values()
                if target_version < m.version <= current
            ],
            key=lambda m: m.version,
            reverse=True,
        )

        rolled_back: list[int] = []

        for migration in to_rollback:
            try:
                self._storage.begin_transaction()
                self._storage.execute_script(migration.down_sql)
                # Update schema version
                new_version = migration.version - 1
                self._storage.execute(
                    "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
                    ("schema_version", str(new_version)),
                )
                self._storage.commit()
                rolled_back.append(migration.version)
            except DatabaseError as exc:
                try:
                    self._storage.rollback()
                except DatabaseError:
                    pass
                raise MigrationFailedError(
                    migration.version,
                    f"Rollback failed: {exc}",
                    detail={
                        "version": migration.version,
                        "description": migration.description,
                        "direction": "down",
                        "error": str(exc),
                    },
                ) from exc
            except Exception as exc:
                try:
                    self._storage.rollback()
                except Exception:
                    pass
                raise MigrationFailedError(
                    migration.version,
                    f"Rollback failed: {exc}",
                    detail={
                        "version": migration.version,
                        "description": migration.description,
                        "direction": "down",
                        "error": str(exc),
                    },
                ) from exc

        return rolled_back

    # ------------------------------------------------------------------
    # History
    # ------------------------------------------------------------------

    def get_migration_history(self) -> list[dict]:
        """Return migration history.

        Since the current schema only stores the current version in
        ``metadata``, the history is reconstructed from the registered
        migrations up to the current version.

        Returns:
            List of dicts with keys: ``version``, ``description``,
            ``applied_at``.
        """
        current = self.get_current_version()
        history: list[dict] = []

        for version in sorted(self._migrations.keys()):
            if version > current:
                break
            migration = self._migrations[version]
            history.append({
                "version": migration.version,
                "description": migration.description,
                "applied_at": None,  # no per-migration timestamp stored
            })

        return history
