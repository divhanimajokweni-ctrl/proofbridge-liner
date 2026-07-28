"""VVU Earth Tech Ledger — Hardened SQLite storage engine.

Applies production-grade PRAGMAs on every connection to ensure data integrity,
crash safety, and consistent behaviour.  All database errors are wrapped in
the project's :class:`DatabaseError` hierarchy so callers never see raw
``sqlite3`` exceptions.

PRAGMA summary
~~~~~~~~~~~~~~~

* **journal_mode** = WAL — concurrent readers + single writer, no blocking.
* **synchronous** = FULL — every commit fsyncs to disk; maximum durability.
* **busy_timeout** — wait up to *N* ms instead of raising immediately.
* **cache_size** — negative values set an absolute KiB limit.
* **secure_delete** = ON — zero-fill deleted pages on VACUUM.
* **trusted_schema** = OFF — reject dangerous application-defined SQL
  functions inside triggers/views.
* **foreign_keys** = ON — enforce referential integrity.
* **temp_store** = MEMORY — temporary tables live in RAM only.
* **locking_mode** = NORMAL — allow other connections to read/write.
"""

from __future__ import annotations

import sqlite3
from typing import Any

from .config import DatabaseConfig
from .exceptions import (
    DatabaseBusyError,
    DatabaseCorruptError,
    DatabaseError,
    DBConnectionFailedError,
)


class LedgerStorage:
    """Hardened SQLite storage engine for the production ledger.

    Usage::

        config = DatabaseConfig(db_path="ledger.db")
        with LedgerStorage(config) as storage:
            storage.execute("INSERT INTO t (a) VALUES (?)", (1,))
            row = storage.fetch_one("SELECT a FROM t")

    The context manager commits on success and rolls back on exception.
    """

    def __init__(self, config: DatabaseConfig) -> None:
        """Initialize with production PRAGMAs applied.

        The database is **not** opened until :meth:`open` is called (or
        the context manager is entered).

        Args:
            config: Frozen database configuration dataclass.
        """
        self._config: DatabaseConfig = config
        self._conn: sqlite3.Connection | None = None

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    def open(self) -> None:
        """Open database connection and apply all PRAGMAs.

        Raises:
            DBConnectionFailedError: If the connection cannot be established.
            DatabaseError: If any PRAGMA fails to apply.
        """
        try:
            self._conn = sqlite3.connect(self._config.db_path)
        except sqlite3.Error as exc:
            raise DBConnectionFailedError(
                self._config.db_path,
                detail={"error": str(exc)},
            ) from exc

        try:
            # Apply all production PRAGMAs
            self._conn.execute(f"PRAGMA journal_mode={self._config.journal_mode}")
            self._conn.execute(f"PRAGMA synchronous={self._config.synchronous}")
            self._conn.execute(f"PRAGMA busy_timeout={self._config.busy_timeout}")
            self._conn.execute(f"PRAGMA cache_size={self._config.cache_size}")
            self._conn.execute(f"PRAGMA page_size={self._config.page_size}")
            self._conn.execute(
                f"PRAGMA secure_delete={'ON' if self._config.secure_delete else 'OFF'}"
            )
            self._conn.execute(
                f"PRAGMA trusted_schema={'ON' if self._config.trusted_schema else 'OFF'}"
            )
            self._conn.execute(
                f"PRAGMA foreign_keys={'ON' if self._config.foreign_keys else 'OFF'}"
            )
            self._conn.execute(f"PRAGMA temp_store={self._config.temp_store}")
            self._conn.execute(f"PRAGMA locking_mode={self._config.locking_mode}")
        except sqlite3.Error as exc:
            self._conn.close()
            self._conn = None
            raise DatabaseError(
                f"Failed to apply PRAGMAs: {exc}",
                code="DATABASE_PRAGMA_FAILED",
                detail={"error": str(exc)},
            ) from exc

    def close(self) -> None:
        """Close database connection with integrity check.

        Runs ``PRAGMA integrity_check`` before closing.  If the check
        fails, :class:`DatabaseCorruptError` is raised but the connection
        is still closed.

        Raises:
            DatabaseCorruptError: If the integrity check fails.
        """
        if self._conn is None:
            return

        try:
            result = self._conn.execute("PRAGMA integrity_check").fetchone()
            if result is None or result[0] != "ok":
                reason = result[0] if result else "unknown"
                self._conn.close()
                self._conn = None
                raise DatabaseCorruptError(
                    reason,
                    detail={"integrity_check": reason},
                )
        except DatabaseCorruptError:
            raise
        except sqlite3.Error:
            pass  # best-effort integrity check on close
        finally:
            if self._conn is not None:
                try:
                    self._conn.close()
                except sqlite3.Error:
                    pass
                self._conn = None

    # ------------------------------------------------------------------
    # Core execution helpers
    # ------------------------------------------------------------------

    def _ensure_open(self) -> sqlite3.Connection:
        """Return the active connection or raise."""
        if self._conn is None:
            raise DatabaseError(
                "Database connection is not open",
                code="DATABASE_NOT_OPEN",
            )
        return self._conn

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        """Execute a single SQL statement with error handling.

        Args:
            sql:    SQL statement with optional ``?`` placeholders.
            params: Parameter tuple for placeholder substitution.

        Returns:
            The ``sqlite3.Cursor`` from the execution.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            return conn.execute(sql, params)
        except sqlite3.OperationalError as exc:
            if "locked" in str(exc).lower() or "busy" in str(exc).lower():
                raise DatabaseBusyError(
                    detail={"sql": sql, "error": str(exc)},
                ) from exc
            raise DatabaseError(
                f"Operational error executing SQL: {exc}",
                code="DATABASE_OPERATIONAL_ERROR",
                detail={"sql": sql, "error": str(exc)},
            ) from exc
        except sqlite3.IntegrityError as exc:
            raise DatabaseError(
                f"Integrity constraint violation: {exc}",
                code="DATABASE_INTEGRITY_ERROR",
                detail={"sql": sql, "error": str(exc)},
            ) from exc
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"Database error executing SQL: {exc}",
                code="DATABASE_EXECUTE_ERROR",
                detail={"sql": sql, "error": str(exc)},
            ) from exc

    def execute_many(self, sql: str, params_list: list[tuple]) -> None:
        """Execute a SQL statement with multiple parameter sets.

        Args:
            sql:         SQL statement with optional ``?`` placeholders.
            params_list: List of parameter tuples.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            conn.executemany(sql, params_list)
        except sqlite3.OperationalError as exc:
            if "locked" in str(exc).lower() or "busy" in str(exc).lower():
                raise DatabaseBusyError(
                    detail={"sql": sql, "error": str(exc)},
                ) from exc
            raise DatabaseError(
                f"Operational error in executemany: {exc}",
                code="DATABASE_OPERATIONAL_ERROR",
                detail={"sql": sql, "error": str(exc)},
            ) from exc
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"Database error in executemany: {exc}",
                code="DATABASE_EXECUTEMANY_ERROR",
                detail={"sql": sql, "error": str(exc)},
            ) from exc

    def execute_script(self, sql: str) -> None:
        """Execute multiple SQL statements (for migrations).

        Unlike :meth:`execute`, this method runs *sql* as a script
        containing multiple semicolon-separated statements.

        Args:
            sql: Multi-statement SQL script.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            conn.executescript(sql)
        except sqlite3.OperationalError as exc:
            raise DatabaseError(
                f"Operational error in executescript: {exc}",
                code="DATABASE_OPERATIONAL_ERROR",
                detail={"error": str(exc)},
            ) from exc
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"Database error in executescript: {exc}",
                code="DATABASE_EXECUTESCRIPT_ERROR",
                detail={"error": str(exc)},
            ) from exc

    # ------------------------------------------------------------------
    # Query helpers
    # ------------------------------------------------------------------

    def fetch_one(self, sql: str, params: tuple = ()) -> tuple | None:
        """Fetch a single row.

        Args:
            sql:    SQL SELECT statement.
            params: Parameter tuple.

        Returns:
            A single row tuple, or ``None`` if no rows match.

        Raises:
            DatabaseError: On any SQLite error.
        """
        cursor = self.execute(sql, params)
        return cursor.fetchone()

    def fetch_all(self, sql: str, params: tuple = ()) -> list[tuple]:
        """Fetch all rows.

        Args:
            sql:    SQL SELECT statement.
            params: Parameter tuple.

        Returns:
            List of row tuples.

        Raises:
            DatabaseError: On any SQLite error.
        """
        cursor = self.execute(sql, params)
        return cursor.fetchall()

    # ------------------------------------------------------------------
    # Transaction management
    # ------------------------------------------------------------------

    def begin_transaction(self) -> None:
        """Begin a transaction.

        Any pending implicit transaction is committed first so that
        ``BEGIN TRANSACTION`` does not conflict with Python's sqlite3
        auto-transaction management.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        # Commit any pending implicit transaction started by Python's
        # sqlite3 module so that our explicit BEGIN does not conflict.
        try:
            conn.commit()
        except sqlite3.Error:
            pass  # no pending transaction — that's fine
        self.execute("BEGIN TRANSACTION")

    def commit(self) -> None:
        """Commit the current transaction.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            conn.commit()
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"Commit failed: {exc}",
                code="DATABASE_COMMIT_ERROR",
                detail={"error": str(exc)},
            ) from exc

    def rollback(self) -> None:
        """Rollback the current transaction.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            conn.rollback()
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"Rollback failed: {exc}",
                code="DATABASE_ROLLBACK_ERROR",
                detail={"error": str(exc)},
            ) from exc

    # ------------------------------------------------------------------
    # Context manager
    # ------------------------------------------------------------------

    def __enter__(self) -> LedgerStorage:
        """Context manager entry — open the database if not already open."""
        if self._conn is None:
            self.open()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit — rollback on error, commit on success."""
        if self._conn is None:
            return
        try:
            if exc_type is not None:
                self.rollback()
            else:
                self.commit()
        except DatabaseError:
            pass  # best-effort; the original exception takes priority
        finally:
            self.close()

    # ------------------------------------------------------------------
    # Introspection and maintenance
    # ------------------------------------------------------------------

    def check_integrity(self) -> bool:
        """Run ``PRAGMA integrity_check`` and return ``True`` if OK.

        Returns:
            ``True`` if the database passes integrity verification,
            ``False`` otherwise.
        """
        try:
            result = self.fetch_one("PRAGMA integrity_check")
            return result is not None and result[0] == "ok"
        except DatabaseError:
            return False

    def get_schema_version(self) -> int:
        """Get the current schema version from the metadata table.

        Returns:
            The schema version integer, or ``0`` if the metadata table
            does not exist or has no version entry.
        """
        try:
            # Check if the metadata table exists
            row = self.fetch_one(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'"
            )
            if row is None:
                return 0
            row = self.fetch_one(
                "SELECT value FROM metadata WHERE key='schema_version'"
            )
            if row is None:
                return 0
            return int(row[0])
        except DatabaseError:
            return 0

    def set_schema_version(self, version: int) -> None:
        """Set the schema version.

        Uses ``INSERT OR REPLACE`` so the row is created or updated
        atomically.

        Args:
            version: The new schema version number.
        """
        self.execute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES ('schema_version', ?)",
            (str(version),),
        )
        self.commit()

    def get_stats(self) -> dict[str, Any]:
        """Return database statistics.

        Returns:
            Dictionary with keys: ``page_count``, ``page_size``,
            ``free_pages``, ``journal_mode``, ``synchronous``,
            ``cache_size``, ``busy_timeout``, ``db_path``.
        """
        stats: dict[str, Any] = {}
        try:
            row = self.fetch_one("PRAGMA page_count")
            stats["page_count"] = row[0] if row else 0

            row = self.fetch_one("PRAGMA page_size")
            stats["page_size"] = row[0] if row else 0

            row = self.fetch_one("PRAGMA freelist_count")
            stats["free_pages"] = row[0] if row else 0

            row = self.fetch_one("PRAGMA journal_mode")
            stats["journal_mode"] = row[0] if row else "unknown"

            row = self.fetch_one("PRAGMA synchronous")
            stats["synchronous"] = row[0] if row else "unknown"

            row = self.fetch_one("PRAGMA cache_size")
            stats["cache_size"] = row[0] if row else 0

            row = self.fetch_one("PRAGMA busy_timeout")
            stats["busy_timeout"] = row[0] if row else 0

        except DatabaseError:
            pass  # return partial stats

        stats["db_path"] = self._config.db_path
        return stats

    def vacuum(self) -> None:
        """Run VACUUM to compact the database.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            conn.execute("VACUUM")
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"VACUUM failed: {exc}",
                code="DATABASE_VACUUM_ERROR",
                detail={"error": str(exc)},
            ) from exc

    def checkpoint(self) -> None:
        """Run WAL checkpoint.

        Performs a ``PRAGMA wal_checkpoint(TRUNCATE)`` which ensures
        the WAL file is fully checkpointed and truncated.

        Raises:
            DatabaseError: On any SQLite error.
        """
        conn = self._ensure_open()
        try:
            conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        except sqlite3.Error as exc:
            raise DatabaseError(
                f"WAL checkpoint failed: {exc}",
                code="DATABASE_CHECKPOINT_ERROR",
                detail={"error": str(exc)},
            ) from exc
