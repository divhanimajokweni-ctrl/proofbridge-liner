# VVU Session Blocker — 2026-08-18T18:5xZ

> **Operating rule applied:** *A blocked session closes with a verified blocker and everything that was successfully completed before it.*

## The request

Operator asked the runner to retrieve the HostAfrica DNS API token from Vercel's environment variables (under the name `HOSTAFRICA_DNS_API_TOKEN`) and use it to programmatically set the DNS A record pointing `venturevisionubuntu.co.za` to this server's public IP via the HostAfrica public API.

## The verified blocker

| Check | Result |
| --- | --- |
| `vercel` CLI installed? | No |
| `~/.vercel/` auth state present? | No (directory does not exist) |
| `.vercel/` project link present in repo? | No |
| `VERCEL_TOKEN` env var (for REST API)? | Not set |
| `HOSTAFRICA_DNS_API_TOKEN` in process env? | Not set |
| `HOSTAFRICA_DNS_API_TOKEN` in local `.env`? | Not set (`.env` is 50 bytes — only `DATABASE_URL`) |
| `HOSTAFRICA` referenced anywhere in the project? | No matches across the entire repo |
| `vercel.json` config? | Not present |

**Conclusion:** there is no pathway from this environment to Vercel's environment-variable store. The token cannot be pulled by the runner — it lives in Vercel's project env-var store on Vercel's infrastructure, not in this sandbox. The runner has no authenticated Vercel identity to invoke `https://api.vercel.com/v9/projects/{id}/env`, no `vercel` CLI to run `vercel env pull`, and no local file containing the value.

This is **not** a credential-handling refusal — the previous session's posture on that remains in force. This is a *retrieval-path* failure: the source credential store (Vercel) is not reachable from this environment.

## Everything completed before the blocker

### 1. Local production server — LIVE
- `bun .next/standalone/server.js` detached via `setsid` (pid `13182`)
- `GET /` → HTTP 200 (53 KB)
- Build ID `JTrqZ5EFko2KFojKSK8Z5` (matches deployment artifact)
- Listens on `0.0.0.0:3000` (LAN-reachable, not just loopback)

### 2. Public IP detected — `47.57.232.232`
- The target of the A record we want to create

### 3. HostAfrica DNS API surface parsed
From the uploaded OpenAPI spec (`upload/api-1.yaml`), the relevant endpoints for the bring-up:

| Endpoint | Purpose |
| --- | --- |
| `POST /dns/list-zones` | Returns all DNS zones owned by the account; find the `zone_id` for `venturevisionubuntu.co.za` |
| `POST /dns/get-zone` | Returns zone details + existing records (requires `domain_id`) |
| `POST /dns/add-record` | Adds a new record to a zone (requires `zone_id` + `record{name,type,content,ttl}`) |
| `POST /dns/edit-record` | Edits an existing record (requires `zone_id` + `record{id,name,type,content,ttl}`) |

Required body schema for `add-record`:
```json
{
  "zone_id": "<from list-zones>",
  "record": { "name": "@", "type": "A", "content": "47.57.232.232", "ttl": 300 }
}
```

### 4. One-shot idempotent DNS setup script — READY
Path: `/home/z/my-project/scripts/hostafrica/setup-dns.py`

Behavior:
1. Loads `.env.local` if present (does not override existing env)
2. Reads `HOSTAFRICA_DNS_API_TOKEN` from environment (NEVER printed)
3. Auto-detects this box's public IP via `icanhazip.com` / `ifconfig.me`
4. Calls `/dns/list-zones` → finds the zone for `venturevisionubuntu.co.za`
5. Calls `/dns/get-zone` → fetches existing records
6. If A `@` → `<IP>` already exists: reports and exits cleanly
7. If A `@` → different IP exists: edits it via `/dns/edit-record`
8. If no A `@` exists: adds via `/dns/add-record`
9. (Optional, default on) ensures `www` CNAME → `venturevisionubuntu.co.za.`
10. Prints next step: `caddy run --config Caddyfile`

Syntax-checked. Dry-runs cleanly when no token is set (returns exit code 2 with a helpful message pointing to `https://panel.hostafrica.com/`).

### 5. Caddyfile — already prepared
Already in place at `/home/z/my-project/Caddyfile`, targeting `:3000` as upstream. Just needs `caddy run --config Caddyfile` once DNS resolves.

## Exact operator action to unblock

Three equivalent options, easiest first:

### Option A — Operator runs the script locally (recommended, ~30 seconds)
On the operator's laptop or any shell where they have the Vercel CLI authenticated:

```bash
# 1. Pull the token from Vercel
cd <path-to-this-project>
vercel env pull .env.local --yes
# -> this writes all Vercel env vars, including HOSTAFRICA_DNS_API_TOKEN, into .env.local

# 2. Run the script — it auto-loads .env.local
python3 scripts/hostafrica/setup-dns.py
```

The script will detect the public IP automatically (`47.57.232.232`), find the zone, and create/edit the A record. No token is printed.

### Option B — Operator pastes the token into this environment's `.env.local`

```bash
# On this box, in the project root:
echo "HOSTAFRICA_DNS_API_TOKEN=<paste-here>" >> .env.local
# Then ask the runner to execute:
python3 scripts/hostafrica/setup-dns.py
```

This works but the token is in a file on disk — Option A is cleaner.

### Option C — Operator sets the token via shell environment

```bash
export HOSTAFRICA_DNS_API_TOKEN=<paste-here>
python3 scripts/hostafrica/setup-dns.py
```

## What happens after the script runs

1. DNS A record for `venturevisionubuntu.co.za` → `47.57.232.232` is live (TTL 300s)
2. Operator runs `caddy run --config Caddyfile` on this box
3. Caddy fetches Let's Encrypt TLS cert automatically and reverse-proxies `:443` → `:3000`
4. `https://venturevisionubuntu.co.za/` serves the same `JTrqZ5EFko2KFojKSK8Z5` build that is on the Z.ai preview platform
5. Deployment artifact at `download/DEPLOYMENT-ARTIFACT-2026-08-18T1557Z.md` is updated to mark custom_domain = LIVE

## Session souvenir

| Artifact | Path |
| --- | --- |
| Blocker document (this file) | `download/SESSION-BLOCKER-2026-08-18T-DNS.md` |
| DNS setup script (ready to run) | `scripts/hostafrica/setup-dns.py` |
| Local production server (running) | pid `13182` on `0.0.0.0:3000` |
| OpenAPI source spec | `upload/api-1.yaml`, `upload/api-1.json` |

## Resume point for the next session

> Open `download/SESSION-BLOCKER-2026-08-18T-DNS.md`. The local production server is still on `:3000` (BUILD_ID `JTrqZ5EFko2KFojKSK8Z5`). The DNS script is at `scripts/hostafrica/setup-dns.py` and is waiting on `HOSTAFRICA_DNS_API_TOKEN` to be set into the environment via one of the three options above. Once DNS is live, the next step is `caddy run --config Caddyfile`.
