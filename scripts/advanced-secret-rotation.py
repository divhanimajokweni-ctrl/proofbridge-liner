#!/usr/bin/env python3
"""
Advanced Secret Rotation Agent
- Generates new Mistral API keys via Mistral Management API
- Rotates GitHub Actions secrets
- Rotates Vercel OIDC environment variables via Vercel API
- Cleans up .vscode/mcp.json pathing
- Syncs local .env

Prerequisites:
  pip install PyGithub requests python-dotenv

Env required:
  GITHUB_MANAGEMENT_TOKEN
  VERCEL_MANAGEMENT_TOKEN
  VERCEL_TEAM_ID (optional)
  MISTRAL_MANAGEMENT_TOKEN
  TARGET_GITHUB_REPO  (owner/repo)
  TARGET_VERCEL_PROJECT (project id)
"""

import os
import json
import sys
import requests
from github import Github
from dotenv import load_dotenv, set_key

ENV_PATH = ".env"
MCP_PATH = ".vscode/mcp.json"

load_dotenv(ENV_PATH)


class AdvancedSecretRotationAgent:
    def __init__(self):
        self.gh_management_token = os.getenv("GITHUB_MANAGEMENT_TOKEN")
        self.vercel_management_token = os.getenv("VERCEL_MANAGEMENT_TOKEN")
        self.vercel_team_id = os.getenv("VERCEL_TEAM_ID")
        self.mistral_management_token = os.getenv("MISTRAL_MANAGEMENT_TOKEN")
        self.target_github_repo = os.getenv("TARGET_GITHUB_REPO", "")
        self.target_vercel_project = os.getenv("TARGET_VERCEL_PROJECT", "")

    def generate_new_mistral_key(self, name="agent-ecosystem-rotated") -> str:
        """Generates a fresh Mistral API key using the Mistral Management API."""
        print("🔑 Agent Action: Requesting new API key from Mistral...")
        if not self.mistral_management_token:
            raise EnvironmentError("MISTRAL_MANAGEMENT_TOKEN is not set")

        headers = {
            "Authorization": f"Bearer {self.mistral_management_token}",
            "Content-Type": "application/json",
        }
        # Note: adjust endpoint to your Mistral org/management API surface
        url = "https://api.mistral.ai/v1/keys"
        data = {"name": name, "scopes": ["api:core"]}

        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        body = response.json()
        new_key = body.get("secret_key") or body.get("key") or body.get("api_key")
        if not new_key:
            raise RuntimeError(f"Mistral key response missing key field: {body}")
        print("✅ Successfully generated new Mistral API key.")
        return new_key

    def rotate_github_secret(self, target_repo: str, secret_name: str, new_value: str):
        """Updates or creates an action/environment secret inside a specific GitHub repository."""
        print(f"🔄 Agent Action: Rotating GitHub secret '{secret_name}' in {target_repo}...")
        if not self.gh_management_token:
            raise EnvironmentError("GITHUB_MANAGEMENT_TOKEN is not set")

        g = Github(self.gh_management_token)
        repo = g.get_repo(target_repo)
        repo.create_secret(secret_name, new_value)
        print(f"✅ Successfully rotated GitHub secret: {secret_name}")

    def rotate_vercel_oidc_env(self, project_id: str, secret_key: str, new_value: str):
        """Updates environment configurations in Vercel supporting OIDC workflows."""
        print(f"🔄 Agent Action: Rotating Vercel configuration for '{secret_key}'...")
        if not self.vercel_management_token:
            raise EnvironmentError("VERCEL_MANAGEMENT_TOKEN is not set")

        headers = {"Authorization": f"Bearer {self.vercel_management_token}"}
        base = f"https://api.vercel.com/v9/projects/{project_id}/env"
        params = {}
        if self.vercel_team_id:
            params["teamId"] = self.vercel_team_id

        get_resp = requests.get(base, headers=headers, params=params)
        get_resp.raise_for_status()
        envs = get_resp.json().get("envs", [])
        env_id = next((env["id"] for env in envs if env["key"] == secret_key), None)

        payload = {"value": new_value, "target": ["development", "preview", "production"], "type": "encrypted"}

        if env_id:
            patch_url = f"{base}/{env_id}"
            res = requests.patch(patch_url, headers=headers, json=payload, params=params)
        else:
            payload.update({"key": secret_key})
            res = requests.post(base, headers=headers, json=payload, params=params)

        if res.status_code in (200, 201):
            print(f"✅ Successfully rotated Vercel environment variable: {secret_key}")
        else:
            print(f"❌ Vercel API Error: {res.status_code} {res.text}")
            res.raise_for_status()

    def fix_mcp_config_paths(self):
        """Fixes the daytona-mcp Windows paths inside .vscode/mcp.json."""
        print(f"🛠️ Agent Action: Cleaning paths in {MCP_PATH}...")
        if not os.path.exists(MCP_PATH):
            print(f"⚠️ {MCP_PATH} not found. Skipping file path alignment.")
            return

        with open(MCP_PATH, "r", encoding="utf-8") as f:
            config = json.load(f)

        modified = False

        def normalize(obj):
            nonlocal modified
            if isinstance(obj, dict):
                for k, v in list(obj.items()):
                    if isinstance(v, str):
                        new_v = v.replace("\\\\", "/").replace("\\", "/")
                        if new_v != v:
                            obj[k] = new_v
                            modified = True
                    else:
                        normalize(v)
            elif isinstance(obj, list):
                for item in obj:
                    normalize(item)

        normalize(config)

        if modified:
            with open(MCP_PATH, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2)
            print(f"✅ Successfully adjusted pathing schema in {MCP_PATH}")
        else:
            print("ℹ️ No specific daytona-mcp Windows-specific blocks needed alignment.")

    def sync_local_env(self, key: str, value: str):
        """Updates local environment configuration parameters."""
        print(f"💾 Agent Action: Syncing {key} to local {ENV_PATH}...")
        set_key(ENV_PATH, key, value)
        os.environ[key] = value

    def execute_full_cycle(self, repo: str, vercel_project: str):
        """Executes automated generation, remote propagation, and configuration hygiene."""
        if not repo or not vercel_project:
            raise EnvironmentError("TARGET_GITHUB_REPO and TARGET_VERCEL_PROJECT must be set")

        new_token = self.generate_new_mistral_key()
        self.rotate_github_secret(repo, "MISTRAL_API_KEY", new_token)
        self.rotate_vercel_oidc_env(vercel_project, "MISTRAL_API_KEY", new_token)
        self.sync_local_env("MISTRAL_API_KEY", new_token)
        self.fix_mcp_config_paths()
        print("\n🎉 Full automation complete. All infrastructure components synchronized successfully.")


if __name__ == "__main__":
    repo = os.getenv("TARGET_GITHUB_REPO", "")
    vercel_project = os.getenv("TARGET_VERCEL_PROJECT", "")
    if not repo or not vercel_project:
        print("Usage: TARGET_GITHUB_REPO=owner/repo TARGET_VERCEL_PROJECT=prj_xxx python advanced-secret-rotation.py")
        sys.exit(1)

    agent = AdvancedSecretRotationAgent()
    agent.execute_full_cycle(repo, vercel_project)
