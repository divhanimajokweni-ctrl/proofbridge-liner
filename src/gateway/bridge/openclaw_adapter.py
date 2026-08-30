from typing import Dict, Any, Optional, List
from ..core.identity import Identity
from ..core.policy import PolicyEngine
from ..core.tools import TOOLS
from ..core.events import EventBus, publish_event, event_bus
from ..audit.logger import audit_logger


class OpenClawAdapter:
    def __init__(self):
        self.policy_engine = PolicyEngine()
        self.event_bus = event_bus
        self._tools = {}

    async def initialize(self):
        self._register_tools()

    def _register_tools(self):
        for name in TOOLS:
            self._tools[name] = self._create_tool_handler(name)

    def _create_tool_handler(self, tool_name: str):
        tool_def = TOOLS[tool_name]

        async def handler(params: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
            identity = Identity.from_openclaw_message(context.get("message", {}))

            if not self.policy_engine.evaluate(identity, tool_def.capability):
                return {
                    "error": f"Unauthorized: {identity.subject} cannot use {tool_name}",
                    "required_capability": tool_def.capability,
                    "tenant": identity.tenant_id,
                    "roles": list(identity.roles),
                }

            if identity.channel.value in ["whatsapp", "email"]:
                if not tool_def.read_only:
                    return {
                        "error": f"{tool_name} requires higher authentication channel",
                        "channel": identity.channel.value,
                        "suggestion": "Use Google Chat or CLI for write operations",
                    }

            try:
                result = await tool_def.handler(identity, params)

                audit_logger.append({
                    "event_type": f"tool.{tool_name}.executed",
                    "tenant_id": identity.tenant_id,
                    "actor": identity.subject,
                    "channel": identity.channel.value,
                    "tool": tool_name,
                    "metadata": {"params": params, "result": result, "read_only": tool_def.read_only},
                })

                return result
            except Exception as e:
                error_result = {"error": f"Tool execution failed: {str(e)}", "tool": tool_name}

                audit_logger.append({
                    "event_type": f"tool.{tool_name}.failed",
                    "tenant_id": identity.tenant_id,
                    "actor": identity.subject,
                    "channel": identity.channel.value,
                    "tool": tool_name,
                    "metadata": {"params": params, "error": str(e)},
                    "severity": "error",
                })

                return error_result

        return handler

    def get_tools_for_agent(self, agent_name: str) -> List[Dict[str, Any]]:
        if agent_name == "lindiwe":
            allowed = [name for name, defn in TOOLS.items() if defn.read_only]
        elif agent_name == "core":
            allowed = list(TOOLS.keys())
        elif agent_name == "auditor":
            allowed = [name for name, defn in TOOLS.items() if defn.read_only or "audit" in name]
        else:
            allowed = []

        return [
            {"name": name, "description": TOOLS[name].description, "capability": TOOLS[name].capability, "read_only": TOOLS[name].read_only}
            for name in allowed
        ]

    async def process_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        identity = Identity.from_openclaw_message(message)

        if not identity.is_authenticated_for_channel():
            return {
                "error": "Authentication required",
                "channel": identity.channel.value,
                "suggestion": "Please verify your identity through the channel",
            }

        if identity.tenant_id == "default":
            return {
                "error": "Unknown tenant",
                "subject": identity.subject,
                "suggestion": "Contact admin to register this identity",
            }

        return {
            "status": "processed",
            "tenant": identity.tenant_id,
            "subject": identity.subject,
            "allowed_actions": self.policy_engine.get_allowed_actions(identity),
        }
