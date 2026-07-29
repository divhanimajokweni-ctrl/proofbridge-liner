# VVU Earth Tech — Environment Freeze

**Captured:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Git HEAD:** $(git rev-parse HEAD)
**Branch:** $(git branch --show-current)

## Runtime Versions

| Tool | Version |
|------|---------|
| Python | $(python3 --version 2>&1) |
| Node.js | $(node --version 2>&1) |
| npm | $(npm --version 2>&1) |
| Bun | $(bun --version 2>&1) |
| Rust | Not installed |
| Go | Not installed |
| Docker | Not installed |
| Git | $(git --version 2>&1) |

## Key Dependencies

### Next.js / Frontend
$(cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); deps=d.get('dependencies',{}); devdeps=d.get('devDependencies',{}); print('#### Dependencies'); [print(f'- {k}: {v}') for k,v in sorted(deps.items())]; print('#### DevDependencies'); [print(f'- {k}: {v}') for k,v in sorted(devdeps.items())]")

### Python (vvu-earth-ledger)
$(cat vvu-earth-ledger/pyproject.toml 2>/dev/null | python3 -c "import sys; lines=sys.stdin.readlines(); in_deps=False; print(''.join(lines))" 2>/dev/null || echo "See vvu-earth-ledger/pyproject.toml")

## Lockfiles
- `bun.lock` (Next.js project)
- `vvu-earth-ledger/` uses pyproject.toml with pip

## Build Artifacts
- `.next/` — Next.js build output
- `db/custom.db` — SQLite database
- `vvu-earth-ledger/` — Python ledger package

## Environment Variables
No .env files detected in repository (secrets not committed).
See `.env.example` for required configuration.
