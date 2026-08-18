# Merge Bundle Manifest

Target branch: `release/beta-v1.0-real`

Contents:
- `apps/ive/` — VVU·IVE application source, including API, EIS library, UI components, Prisma schema and configuration.
- `documentation/` — deployment/integration documentation and mobile UI command-palette specification.
- `release/VERSION` — release version marker.
- `START_HERE.md` — package orientation.

Secrets excluded:
- `.env`
- `.env.local`
- runtime credentials

Mobile UI direction:
- spread primary controls
- icon-first persistent rail
- gesture navigation
- file legend moved into command palette
