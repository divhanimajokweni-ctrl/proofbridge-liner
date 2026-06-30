from typing import List, Set, Dict, Any, Optional
from dataclasses import dataclass, field
from .identity import Identity, Tenant


@dataclass
class PolicyStatement:
    effect: str
    actions: Set[str]
    conditions: Dict[str, Any] = field(default_factory=dict)
    priority: int = 0
    description: str = ""


class PolicyEngine:
    def __init__(self):
        self.policies: List[PolicyStatement] = []
        self._load_default_policies()
        self._cache: Dict[str, bool] = {}

    def _load_default_policies(self):
        self.policies.append(PolicyStatement(
            effect="deny",
            actions={"system.*"},
            conditions={"tenant": Tenant.SYSTEM.value},
            priority=100,
            description="System tenant internal only"
        ))
        self.policies.append(PolicyStatement(
            effect="allow",
            actions={"system.health", "system.metrics"},
            conditions={"roles": {"admin", "operator", "auditor"}},
            priority=90,
            description="Health checks for authenticated users"
        ))
        self.policies.append(PolicyStatement(
            effect="allow",
            actions={"*"},
            conditions={"roles": {"admin"}, "tenant": Tenant.UBUNTU_GROUP.value},
            priority=80,
            description="Ubuntu Group admins have full access"
        ))
        self.policies.append(PolicyStatement(
            effect="allow",
            actions={"infra.read", "infra.write", "infra.deploy"},
            conditions={"roles": {"operator"}, "tenant": Tenant.UBUNTU_GROUP.value},
            priority=70,
            description="Ubuntu Group operators can manage infrastructure"
        ))
        self.policies.append(PolicyStatement(
            effect="allow",
            actions={"proofbridge.read", "proofbridge.verify"},
            conditions={"roles": {"viewer", "operator", "admin"}},
            priority=60,
            description="Read-only access to proof verification"
        ))
        self.policies.append(PolicyStatement(
            effect="allow",
            actions={"proofbridge.write", "proofbridge.deploy"},
            conditions={"roles": {"admin"}, "requires_approval": True},
            priority=50,
            description="ProofBridge changes require admin + approval"
        ))
        self.policies.append(PolicyStatement(
            effect="allow",
            actions={"governance.read"},
            conditions={"roles": {"viewer", "operator", "admin", "auditor"}},
            priority=40,
            description="Governance state is readable by all authenticated"
        ))
        self.policies.append(PolicyStatement(
            effect="deny",
            actions={"governance.write"},
            conditions={"requires_approval": True},
            priority=100,
            description="All governance writes require approval"
        ))
        self.policies.append(PolicyStatement(
            effect="deny",
            actions={"*"},
            conditions={},
            priority=0,
            description="Default deny"
        ))

    def evaluate(self, identity: Identity, capability: str) -> bool:
        cache_key = f"{identity.subject}:{identity.tenant_id}:{capability}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        sorted_policies = sorted(self.policies, key=lambda p: -p.priority)
        result = False
        allow_found = False

        for policy in sorted_policies:
            if not self._policy_applies(policy, identity, capability):
                continue
            if policy.effect == "deny":
                if not allow_found:
                    result = False
                    break
                continue
            if policy.effect == "allow":
                allow_found = True
                result = True

        self._cache[cache_key] = result
        return result

    def _policy_applies(self, policy: PolicyStatement, identity: Identity, capability: str) -> bool:
        if "roles" in policy.conditions:
            required_roles = set(policy.conditions["roles"])
            if not identity.roles.intersection(required_roles):
                return False
        if "tenant" in policy.conditions:
            if identity.tenant_id != policy.conditions["tenant"]:
                return False
        if "channels" in policy.conditions:
            if identity.channel.value not in policy.conditions["channels"]:
                return False
        for action_pattern in policy.actions:
            if self._match_capability(capability, action_pattern):
                return True
        return False

    def _match_capability(self, capability: str, pattern: str) -> bool:
        if pattern == "*":
            return True
        if pattern.endswith(".*"):
            prefix = pattern[:-2]
            return capability.startswith(prefix)
        if pattern.endswith(":*"):
            prefix = pattern[:-2]
            return capability.startswith(prefix)
        return capability == pattern

    def filter_tools(self, identity: Identity, tool_definitions: Dict[str, Any]) -> List[str]:
        allowed = []
        for name, tool_def in tool_definitions.items():
            capability = getattr(tool_def, 'capability', f"{getattr(tool_def, 'category', 'general')}.{name}")
            if self.evaluate(identity, capability):
                allowed.append(name)
        return allowed

    def get_allowed_actions(self, identity: Identity) -> List[str]:
        allowed = []
        capabilities = [
            "infra.read", "infra.write", "infra.deploy",
            "proofbridge.read", "proofbridge.write", "proofbridge.verify",
            "governance.read", "governance.write",
            "system.health", "system.metrics",
        ]
        for cap in capabilities:
            if self.evaluate(identity, cap):
                allowed.append(cap)
        return allowed

    def clear_cache(self):
        self._cache.clear()
