#!/usr/bin/env python3
"""
VVU HostAfrica DNS setup — venturevisionubuntu.co.za -> server public IP.

One-shot idempotent script:
  1. Calls /dns/list-zones to find the zone for venturevisionubuntu.co.za
  2. Calls /dns/get-zone to fetch existing records
  3. If the A record @ -> <IP> already exists, reports it and exits
  4. If an A record @ exists with a different IP, edits it (PUT /dns/edit-record)
  5. If no A record @ exists, adds it (POST /dns/add-record)
  6. Optionally adds www CNAME -> venturevisionubuntu.co.za

Usage:
    export HOSTAFRICA_DNS_API_TOKEN="<your-bearer-token>"
    export TARGET_DOMAIN="venturevisionubuntu.co.za"      # optional, default below
    export TARGET_IP="47.57.232.232"                       # optional, auto-detected
    python3 scripts/hostafrica/setup-dns.py

Or with a .env.local in the project root:
    HOSTAFRICA_DNS_API_TOKEN=...
    python3 scripts/hostafrica/setup-dns.py

The token is NEVER printed. Failures are surfaced with HTTP status + sanitized body.

References:
- OpenAPI spec: /home/z/my-project/upload/api-1.yaml
- Endpoints used: /dns/list-zones, /dns/get-zone, /dns/add-record, /dns/edit-record
- Auth: Bearer <token> in Authorization header
- Base URL: https://api.hostafrica.com
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

API_BASE = "https://api.hostafrica.com"
DEFAULT_DOMAIN = "venturevisionubuntu.co.za"
TTL = 300  # 5 min — short so we can fail fast during the bring-up


def _load_env_local() -> None:
    """Load .env.local from project root if present (does not override existing env)."""
    env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _detect_public_ip() -> str:
    """Use icanhazip / ifconfig.me to detect this box's public IP."""
    for url in ("https://icanhazip.com", "https://ifconfig.me"):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "vvu-dns-setup/1.0"})
            with urllib.request.urlopen(req, timeout=5) as r:
                ip = r.read().decode().strip()
                if ip and ip.count(".") == 3:
                    return ip
        except Exception:
            continue
    raise RuntimeError("Could not detect public IP via icanhazip/ifconfig.me")


def _post(path: str, body: dict, token: str) -> dict:
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "vvu-dns-setup/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        # Sanitize — never echo the token back, but body should be safe
        raise RuntimeError(f"HTTP {e.code} on {path}: {body_text[:500]}") from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error on {path}: {e.reason}") from None


def _find_zone_for_domain(token: str, target_domain: str) -> dict:
    """Return the zone dict whose domain_name matches target_domain."""
    resp = _post("/dns/list-zones", {}, token)
    if resp.get("status") != "success":
        raise RuntimeError(f"list-zones failed: {resp}")
    zones = resp.get("data", {}).get("zones", []) or []
    # Tolerate case-insensitive match and trailing dot
    target = target_domain.lower().rstrip(".")
    for z in zones:
        if z.get("domain_name", "").lower().rstrip(".") == target:
            return z
    # If exact match fails, look for any zone that is a suffix (subdomain case)
    candidates = [z for z in zones if target.endswith(z.get("domain_name", "").lower().rstrip("."))]
    if len(candidates) == 1:
        return candidates[0]
    if not zones:
        raise RuntimeError(
            f"No DNS zones found on this HostAfrica account. "
            f"Is venturevisionubuntu.co.za registered/transferred to this account?"
        )
    available = ", ".join(z.get("domain_name", "?") for z in zones)
    raise RuntimeError(
        f"No zone found matching '{target_domain}'. "
        f"Available zones on this account: {available}"
    )


def _get_zone_records(token: str, domain_id: str) -> list:
    """Fetch existing records for a zone via /dns/get-zone."""
    resp = _post("/dns/get-zone", {"domain_id": str(domain_id)}, token)
    if resp.get("status") != "success":
        raise RuntimeError(f"get-zone failed: {resp}")
    data = resp.get("data", {}) or {}
    if not data.get("zone_exists"):
        raise RuntimeError(f"Zone does not exist for domain_id={domain_id}")
    return data.get("records", []) or []


def _add_record(token: str, zone_id: str, name: str, rtype: str, content: str, ttl: int = TTL) -> dict:
    body = {
        "zone_id": str(zone_id),
        "record": {"name": name, "type": rtype, "content": content, "ttl": ttl},
    }
    return _post("/dns/add-record", body, token)


def _edit_record(token: str, zone_id: str, record_id: str, name: str, rtype: str,
                 content: str, ttl: int = TTL) -> dict:
    body = {
        "zone_id": str(zone_id),
        "record": {"id": str(record_id), "name": name, "type": rtype,
                   "content": content, "ttl": ttl},
    }
    return _post("/dns/edit-record", body, token)


def main() -> int:
    _load_env_local()

    token = os.environ.get("HOSTAFRICA_DNS_API_TOKEN", "").strip()
    if not token:
        print("ERROR: HOSTAFRICA_DNS_API_TOKEN is not set in the environment.", file=sys.stderr)
        print("Set it via one of:", file=sys.stderr)
        print("  export HOSTAFRICA_DNS_API_TOKEN='<your-token>'  # shell", file=sys.stderr)
        print("  echo 'HOSTAFRICA_DNS_API_TOKEN=...' >> .env.local  # file", file=sys.stderr)
        print("Token is obtainable at https://panel.hostafrica.com/ -> API Settings", file=sys.stderr)
        return 2

    target_domain = os.environ.get("TARGET_DOMAIN", DEFAULT_DOMAIN).strip().lower()
    target_ip = os.environ.get("TARGET_IP", "").strip() or _detect_public_ip()
    add_www = os.environ.get("ADD_WWW_CNAME", "1") in ("1", "true", "yes", "on")

    print(f"[VVU DNS setup]")
    print(f"  target_domain = {target_domain}")
    print(f"  target_ip    = {target_ip}")
    print(f"  add_www_cname = {add_www}")
    print()

    # Step 1: find zone
    print("[1/4] resolving zone via /dns/list-zones ...")
    zone = _find_zone_for_domain(token, target_domain)
    print(f"      zone_id    = {zone.get('zone_id')}")
    print(f"      domain_id  = {zone.get('domain_id')}")
    print(f"      domain     = {zone.get('domain_name')}")
    print()

    # Step 2: list existing records
    print("[2/4] fetching existing records via /dns/get-zone ...")
    records = _get_zone_records(token, zone["domain_id"])
    print(f"      {len(records)} records present")
    a_at = next((r for r in records if r.get("type") == "A" and r.get("name") in ("@", target_domain, "")), None)
    www_cname = next((r for r in records if r.get("type") == "CNAME" and r.get("name") in ("www", f"www.{target_domain}.")), None)
    print()

    # Step 3: ensure A record @ -> target_ip
    print("[3/4] ensuring A record @ -> target_ip ...")
    if a_at and a_at.get("content") == target_ip:
        print(f"      OK: A @ -> {target_ip} already exists (record_id={a_at.get('id')})")
    elif a_at:
        print(f"      EDIT: A @ -> {a_at.get('content')} (id={a_at.get('id')}), updating to {target_ip}")
        resp = _edit_record(token, zone["zone_id"], a_at["id"], "@", "A", target_ip)
        print(f"      -> {resp.get('status')}: {resp.get('data', {}).get('message', '')}")
    else:
        print(f"      ADD: A @ -> {target_ip}")
        resp = _add_record(token, zone["zone_id"], "@", "A", target_ip)
        print(f"      -> {resp.get('status')}: {resp.get('data', {}).get('message', '')}")
    print()

    # Step 4: ensure www CNAME -> target_domain (optional)
    print("[4/4] ensuring www CNAME -> target_domain ...")
    if not add_www:
        print("      skipped (ADD_WWW_CNAME=0)")
    elif www_cname:
        target_cname = f"{target_domain}." if not target_domain.endswith(".") else target_domain
        if www_cname.get("content") == target_cname:
            print(f"      OK: CNAME www -> {target_cname} already exists")
        else:
            print(f"      EDIT: CNAME www -> {www_cname.get('content')} (id={www_cname.get('id')}), updating to {target_cname}")
            resp = _edit_record(token, zone["zone_id"], www_cname["id"], "www", "CNAME", target_cname)
            print(f"      -> {resp.get('status')}: {resp.get('data', {}).get('message', '')}")
    else:
        target_cname = f"{target_domain}." if not target_domain.endswith(".") else target_domain
        print(f"      ADD: CNAME www -> {target_cname}")
        resp = _add_record(token, zone["zone_id"], "www", "CNAME", target_cname)
        print(f"      -> {resp.get('status')}: {resp.get('data', {}).get('message', '')}")

    print()
    print("[done] DNS A record for venturevisionubuntu.co.za -> this box is configured.")
    print("       Next: 'caddy run --config Caddyfile' on this box to auto-provision TLS")
    print("       and reverse-proxy https://venturevisionubuntu.co.za -> http://localhost:3000")
    return 0


if __name__ == "__main__":
    sys.exit(main())
