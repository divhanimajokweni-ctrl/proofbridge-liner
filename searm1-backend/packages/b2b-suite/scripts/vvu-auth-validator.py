#!/usr/bin/env python3
# ==============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: VVU-AUTH-VALIDATOR-v1.0 (API CREDENTIALS DRY-RUN VERIFIER)
# DESCRIPTION: Securely checks and validates .env API tokens for Apollo, 
#              HubSpot, Resend, LinkedIn, and X (Twitter) before running 
#              active outreach. Uses zero dependencies (standard urllib).
# ==============================================================================

import os
import sys
import json
import urllib.request
import urllib.error

# ─── Load .env if it exists ────────────────────────────────────────────
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip()

load_env()

# ─── Credential masking ───────────────────────────────────────────────
def mask(key):
    if not key or len(key) < 8:
        return '****'
    return key[:4] + '...' + key[-4:]

# ─── Print header ──────────────────────────────────────────────────────
print("=" * 70)
print("  VVU AUTH VALIDATOR v1.0 · API Credentials Dry-Run Verifier")
print("  Venture Vision Ubuntu · We Serve Trust")
print("=" * 70)
print()

# ─── Test Resend (email) ───────────────────────────────────────────────
def test_resend():
    key = os.environ.get('RESEND_API_KEY', '')
    print(f"  RESEND_API_KEY: {mask(key)}")
    if not key or key == 're_your_api_key_here':
        print("  STATUS: ⚠ NOT CONFIGURED (using placeholder)")
        return False
    try:
        req = urllib.request.Request(
            'https://api.resend.com/emails',
            data=b'{}',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            method='POST'
        )
        urllib.request.urlopen(req, timeout=10)
        print("  STATUS: ✓ VALID (unexpected 200)")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print("  STATUS: ✓ VALID (422 = authenticated, empty payload rejected)")
            return True
        elif e.code == 401:
            print("  STATUS: ✗ FAILED (401 Unauthorized — key invalid)")
            return False
        else:
            print(f"  STATUS: ⚠ UNKNOWN (HTTP {e.code})")
            return False
    except Exception as e:
        print(f"  STATUS: ✗ ERROR ({e})")
        return False

# ─── Test Apollo.io ───────────────────────────────────────────────────
def test_apollo():
    key = os.environ.get('APOLLO_API_KEY', '')
    print(f"\n  APOLLO_API_KEY: {mask(key)}")
    if not key or 'your_api_key' in key:
        print("  STATUS: ⚠ NOT CONFIGURED (using placeholder)")
        return False
    try:
        payload = json.dumps({
            "api_key": key,
            "domain": "example.com",
            "titles": ["CEO"]
        }).encode('utf-8')
        req = urllib.request.Request(
            'https://api.apollo.io/v1/people/match',
            data=payload,
            headers={'Content-Type': 'application/json', 'Cache-Control': 'no-cache'},
            method='POST'
        )
        resp = urllib.request.urlopen(req, timeout=10)
        print("  STATUS: ✓ VALID (Apollo API responding)")
        return True
    except urllib.error.HTTPError as e:
        if e.code in (400, 404):
            print(f"  STATUS: ✓ VALID (HTTP {e.code} = key accepted, test query)")
            return True
        elif e.code == 401:
            print("  STATUS: ✗ FAILED (401 Unauthorized)")
            return False
        else:
            print(f"  STATUS: ⚠ UNKNOWN (HTTP {e.code})")
            return False
    except Exception as e:
        print(f"  STATUS: ✗ ERROR ({e})")
        return False

# ─── Test HubSpot CRM ─────────────────────────────────────────────────
def test_hubspot():
    token = os.environ.get('HUBSPOT_ACCESS_TOKEN', '')
    print(f"\n  HUBSPOT_ACCESS_TOKEN: {mask(token)}")
    if not token or 'your_token' in token:
        print("  STATUS: ⚠ NOT CONFIGURED (using placeholder)")
        return False
    try:
        req = urllib.request.Request(
            'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
            headers={'Authorization': f'Bearer {token}'},
            method='GET'
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        count = len(data.get('results', []))
        print(f"  STATUS: ✓ VALID (CRM accessible, {count} contact(s) returned)")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("  STATUS: ✗ FAILED (401 Unauthorized)")
            return False
        else:
            print(f"  STATUS: ⚠ UNKNOWN (HTTP {e.code})")
            return False
    except Exception as e:
        print(f"  STATUS: ✗ ERROR ({e})")
        return False

# ─── Test X (Twitter) ─────────────────────────────────────────────────
def test_x_platform():
    token = os.environ.get('X_BEARER_TOKEN', '')
    print(f"\n  X_BEARER_TOKEN: {mask(token)}")
    if not token or 'your_bearer' in token:
        print("  STATUS: ⚠ NOT CONFIGURED (using placeholder)")
        return False
    try:
        req = urllib.request.Request(
            'https://api.twitter.com/2/users/me',
            headers={'Authorization': f'Bearer {token}'},
            method='GET'
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        username = data.get('data', {}).get('username', 'unknown')
        print(f"  STATUS: ✓ VALID (authenticated as @{username})")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("  STATUS: ✗ FAILED (401 Unauthorized)")
            return False
        else:
            print(f"  STATUS: ⚠ UNKNOWN (HTTP {e.code})")
            return False
    except Exception as e:
        print(f"  STATUS: ✗ ERROR ({e})")
        return False

# ─── Test LinkedIn ────────────────────────────────────────────────────
def test_linkedin():
    token = os.environ.get('LINKEDIN_OAUTH_TOKEN', '')
    print(f"\n  LINKEDIN_OAUTH_TOKEN: {mask(token)}")
    if not token or 'your_linkedin' in token:
        print("  STATUS: ⚠ NOT CONFIGURED (using placeholder)")
        return False
    try:
        req = urllib.request.Request(
            'https://api.linkedin.com/v2/me',
            headers={'Authorization': f'Bearer {token}'},
            method='GET'
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        name = data.get('localizedFirstName', 'unknown')
        print(f"  STATUS: ✓ VALID (authenticated as {name})")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("  STATUS: ✗ FAILED (401 Unauthorized — token expired)")
            return False
        else:
            print(f"  STATUS: ⚠ UNKNOWN (HTTP {e.code})")
            return False
    except Exception as e:
        print(f"  STATUS: ✗ ERROR ({e})")
        return False

# ─── Run all tests ────────────────────────────────────────────────────
results = {
    'Resend': test_resend(),
    'Apollo': test_apollo(),
    'HubSpot': test_hubspot(),
    'X (Twitter)': test_x_platform(),
    'LinkedIn': test_linkedin(),
}

print()
print("=" * 70)
print("  SUMMARY")
print("=" * 70)
for service, ok in results.items():
    status = "✓ VALID" if ok else "✗ FAILED/NOT SET"
    print(f"  {service:15s} {status}")

valid = sum(results.values())
total = len(results)
print(f"\n  {valid}/{total} services validated")
if valid == total:
    print("  ✓ All systems ready for outreach")
else:
    print(f"  ⚠ {total - valid} service(s) need configuration")
print()
print("  VVU · We Serve Trust")
print("=" * 70)

sys.exit(0 if valid == total else 1)
