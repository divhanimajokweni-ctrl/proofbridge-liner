#!/usr/bin/env python3
"""CTO External Brain v1.0 — Auto-updates KILOCODE_CONTEXT.md every cycle."""
import os
import json
import subprocess
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError

CONTEXT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "KILOCODE_CONTEXT.md")

def fetch_json(url, timeout=5):
    try:
        req = Request(url, headers={"Accept": "application/json"})
        with urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except (URLError, OSError, json.JSONDecodeError):
        return None

def git_summary():
    try:
        branch = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True, timeout=5).stdout.strip()
        sha = subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True, timeout=5).stdout.strip()
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, timeout=5).stdout.strip()
        dirty = len(status) > 0
        return f"{branch} @ {sha}" + (" (dirty)" if dirty else "")
    except Exception:
        return "unknown"

def build_context():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    git_info = git_summary()
    bridge_health = fetch_json("http://localhost:3456/health")
    bridge_ready = bridge_health.get("ready", False) if bridge_health else False

    md = f"""# KILOCODE_CONTEXT.md | Auto-Updated
Last Updated: {now} | By: ctosync.py

## 1. CURRENT TRUTH [Copy/Paste Only]
- GIT: {git_info}
- NEXTJS_PORT: 3000
- WHATSAPP_BRIDGE_PORT: 3456 | READY: {bridge_ready}
- BUILD: Run `npm run build` to verify
"""

    if bridge_ready:
        md += "- WHATSAPP_BRIDGE: Authenticated. curl http://localhost:3456/health returns ready:true\n"

    md += """
## 2. LAST DECISION LOG [Why we did X]
See KILOCODE_CONTEXT.md section 2 (manual entries preserved).

## 3. BLOCKED / TODO [Your only task list]
- [ ] Priority 1: Verify build with `npm run build`
- [ ] Priority 2: Check all API routes respond correctly
- [ ] Priority 3: Run test suite

## 4. DO NOT INVENT
- Do not create new env vars. Only use those in .env.example
- Some secrets are in Replit Secrets Manager, NOT in any .env file. Do not expect them locally.
- PROOFBRIDGE_HMAC_SECRET: In Vercel env + Replit Secrets, not local .env. Use getSecret() pattern.
- Do not change port 3000 (Next.js) or 3456 (whatsapp-bridge).
- Do not re-add module-level `throw` for PROOFBRIDGE_HMAC_SECRET. Use getSecret() pattern.
- Do not touch .replit deployment run without explicit approval.

If unsure: `curl http://localhost:3456/health` or ask Lindiwe in #vvu-war-room
"""
    return md

def update():
    ctx = build_context()
    with open(CONTEXT_PATH, "w") as f:
        f.write(ctx)
    print(f"[ctosync] Updated {CONTEXT_PATH} at {datetime.now(timezone.utc).isoformat()}")

if __name__ == "__main__":
    update()
