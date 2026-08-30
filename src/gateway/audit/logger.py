import sqlite3
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from .models import AuditEntry, AuditSeverity


class AuditLogger:
    def __init__(self, db_path: str = "/tmp/vvu_audit.db"):
        self.db_path = db_path
        self._last_hash: Optional[str] = None
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_chain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE NOT NULL,
                timestamp TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                actor TEXT NOT NULL,
                channel TEXT NOT NULL,
                tool TEXT NOT NULL,
                action TEXT NOT NULL,
                arguments TEXT NOT NULL,
                result TEXT NOT NULL,
                severity TEXT NOT NULL,
                previous_hash TEXT NOT NULL,
                hash TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_chain(tenant_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_chain(actor)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_chain(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_chain(severity)")
        conn.commit()
        conn.close()

    def append(self, event_data: Dict[str, Any]) -> str:
        last_hash = self._get_last_hash()
        entry = AuditEntry.from_event(event_data, previous_hash=last_hash)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_chain (
                event_id, timestamp, tenant_id, actor, channel, tool,
                action, arguments, result, severity, previous_hash, hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry.event_id,
            entry.timestamp.isoformat(),
            entry.tenant_id,
            entry.actor,
            entry.channel,
            entry.tool,
            entry.action,
            json.dumps(entry.arguments),
            json.dumps(entry.result),
            entry.severity.value,
            entry.previous_hash,
            entry.hash,
        ))
        conn.commit()
        conn.close()

        self._last_hash = entry.hash
        return entry.hash

    def _get_last_hash(self) -> str:
        if self._last_hash is not None:
            return self._last_hash
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT hash FROM audit_chain ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        self._last_hash = row[0] if row else "0" * 64
        return self._last_hash

    def verify_chain(self) -> bool:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, previous_hash, hash FROM audit_chain ORDER BY id")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return True

        expected = "0" * 64
        for row_id, prev, current in rows:
            if prev != expected:
                return False
            expected = current
        return True

    def query(
        self,
        tenant_id: Optional[str] = None,
        actor: Optional[str] = None,
        severity: Optional[AuditSeverity] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        query = "SELECT * FROM audit_chain WHERE 1=1"
        params = []

        if tenant_id:
            query += " AND tenant_id = ?"
            params.append(tenant_id)
        if actor:
            query += " AND actor = ?"
            params.append(actor)
        if severity:
            query += " AND severity = ?"
            params.append(severity.value)
        if start_time:
            query += " AND timestamp >= ?"
            params.append(start_time.isoformat())
        if end_time:
            query += " AND timestamp <= ?"
            params.append(end_time.isoformat())

        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        conn.close()

        result = []
        for row in rows:
            entry = dict(zip(columns, row))
            entry["arguments"] = json.loads(entry["arguments"])
            entry["result"] = json.loads(entry["result"])
            result.append(entry)
        return result


audit_logger = AuditLogger()


async def append_audit(event_data: Dict[str, Any]) -> str:
    return audit_logger.append(event_data)
