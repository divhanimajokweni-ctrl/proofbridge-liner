from dataclasses import dataclass, field
from typing import Set, Optional, Dict, Any
from enum import Enum
import hashlib
from datetime import datetime


class Channel(str, Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    GOOGLE_CHAT = "google_chat"
    SLACK = "slack"
    REST = "rest"
    CLI = "cli"
    TELEGRAM = "telegram"


class Tenant(str, Enum):
    UBUNTU_GROUP = "ubuntu-group"
    SAFE_KRYPTE = "safe-krypte"
    SAFE_GRID = "safe-grid"
    EKASI_GAMES = "ekasi-games"
    PROOFBRIDGE = "proofbridge"
    SYSTEM = "system"


@dataclass(frozen=True)
class Identity:
    subject: str
    tenant_id: str
    roles: Set[str] = field(default_factory=set)
    channel: Channel = Channel.REST
    authenticated: bool = True
    session_id: Optional[str] = None
    auth_method: str = "basic"
    expires_at: Optional[datetime] = None

    @classmethod
    def from_openclaw_message(cls, message: Dict[str, Any]) -> "Identity":
        sender = message.get("sender", "anonymous")
        channel_str = message.get("channel", "rest")

        channel_map = {
            "whatsapp": Channel.WHATSAPP,
            "email": Channel.EMAIL,
            "googlechat": Channel.GOOGLE_CHAT,
            "slack": Channel.SLACK,
            "rest": Channel.REST,
            "cli": Channel.CLI,
            "telegram": Channel.TELEGRAM,
        }
        channel = channel_map.get(channel_str, Channel.REST)

        tenant_map = {
            "+27761234567": Tenant.UBUNTU_GROUP.value,
            "admin@vvu.africa": Tenant.UBUNTU_GROUP.value,
            "+27821234567": Tenant.SAFE_KRYPTE.value,
            "system": Tenant.SYSTEM.value,
        }
        tenant = tenant_map.get(sender, "default")

        role_map = {
            "+27761234567": {"admin", "operator", "auditor"},
            "admin@vvu.africa": {"admin", "operator", "auditor"},
            "+27821234567": {"operator", "viewer"},
            "system": {"system"},
        }
        roles = role_map.get(sender, {"viewer"})

        session_id = message.get("session_id") or cls._generate_session_id(sender, channel)

        return cls(
            subject=sender,
            tenant_id=tenant,
            roles=roles,
            channel=channel,
            session_id=session_id,
            auth_method=message.get("auth_method", "basic"),
        )

    @staticmethod
    def _generate_session_id(subject: str, channel: Channel) -> str:
        raw = f"{subject}:{channel.value}:{datetime.utcnow().date().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def has_role(self, role: str) -> bool:
        return role in self.roles

    def has_any_role(self, roles: Set[str]) -> bool:
        return bool(self.roles.intersection(roles))

    def is_authenticated_for_channel(self) -> bool:
        if self.channel in [Channel.WHATSAPP, Channel.TELEGRAM]:
            return self.authenticated and self.auth_method in ["whatsapp_verified", "telegram_verified"]
        return self.authenticated
