# VVU — Getting Started: End-to-End Deploy, Stage & Release

> **Document ID:** VVU-GSG-001  
> **Revision:** 1.0  
> **Generated:** 2026-08-01 UTC  
> **Status:** Active

---

## 1. Prerequisites

Before you begin, ensure the following tools and accounts are set up:

| Requirement | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 20+ | JavaScript runtime (LTS recommended) |
| **Bun** | 1.0+ | Fast JavaScript runtime & package manager (primary for this project) |
| **Git** | 2.40+ | Version control |
| **GitHub Account** | — | Repository hosting, CI/CD, issues |
| **Domain** | `vvu.africa` | Production domain (DNS managed via AWS Route 53 or equivalent) |
| **AWS Account** | — | S3 (document storage), KMS (encryption), IAM (access control), CloudFront (CDN) |
| **Clerk Account** | — | Authentication provider for dashboard and portal access |
| **Sequenzy Account** | — | Partnership automation (email sequences, contact management, event tracking) |

### Environment Setup Checklist

- [ ] Node.js 20+ installed (`node --version`)
- [ ] Bun installed (`bun --version`)
- [ ] Git configured (`git config user.name`, `git config user.email`)
- [ ] GitHub repository cloned
- [ ] AWS credentials configured (`~/.aws/credentials` or environment variables)
- [ ] Clerk dashboard accessible with VVU application created
- [ ] Sequenzy workspace provisioned with VVU automata configured

---

## 2. Local Development

### 2.1 Clone the Repository

```bash
git clone https://github.com/venture-vision-ubuntu/vvu.git
cd vvu
```

### 2.2 Install Dependencies

```bash
bun install
```

This installs all packages defined in `package.json`, including:

- `next` (Next.js 16)
- `react` / `react-dom` (React 19)
- `tailwindcss` (Tailwind CSS 4)
- `@prisma/client` + `prisma` (Prisma ORM)
- `zustand` (Client state management)
- `@tanstack/react-query` (Server state management)
- `lucide-react` (Icon library)
- All `@/components/ui/*` shadcn/ui components

### 2.3 Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

**Required Variables:**

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Prisma SQLite connection string | `file:./dev.db` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk backend key | `sk_test_...` |
| `AWS_REGION` | AWS region for S3/KMS | `af-south-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `...` |
| `S3_BUCKET_DOCUMENTS` | S3 bucket for document storage | `vvu-documents-staging` |
| `KMS_KEY_ID` | KMS key for document encryption | `alias/vvu-documents` |
| `SEQUENZY_API_KEY` | Sequenzy API key for event tracking | `sk_seq_...` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |

### 2.4 Database Setup

```bash
bun run db:push
```

This pushes the Prisma schema to the local SQLite database and generates the Prisma Client.

### 2.5 Run the Development Server

```bash
bun run dev
```

The dev server starts on **port 3000**. Open the **Preview Panel** in your development interface to view the application.

> ⚠️ **Do not** navigate to `http://localhost:3000` directly. Use the Preview Panel or the "Open in New Tab" button.

### 2.6 Verify

- Landing page loads with VVU branding
- Icon Rail sidebar is visible (hover to expand)
- No console errors in the browser developer tools
- Lint passes: `bun run lint`

---

## 3. Project Architecture

### 3.1 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side rendering, API routes, middleware |
| **Language** | TypeScript 5 | Type safety across the entire codebase |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with design tokens |
| **UI Components** | shadcn/ui (New York style) | Pre-built, accessible component library |
| **Icons** | Lucide React | Consistent icon set |
| **Database** | Prisma ORM + SQLite | Schema-first data modelling and queries |
| **Client State** | Zustand | Lightweight, scalable state management |
| **Server State** | TanStack Query | Caching, refetching, and synchronising server data |
| **Auth** | Clerk | Magic-link auth, session management |
| **Email Automation** | Sequenzy | Partnership email sequences and event tracking |
| **Document Storage** | AWS S3 + KMS | Encrypted document storage for signing portal |

### 3.2 Directory Structure

```
vvu/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page (route: /)
│   │   └── hbk/
│   │       ├── briefing/
│   │       │   └── page.tsx   # Technical briefing page
│   │       ├── documents/
│   │       │   └── [documentRoomId]/
│   │       │       └── page.tsx  # Document signing portal
│   │       ├── dashboard/
│   │       │   ├── login/
│   │       │   │   └── page.tsx  # Dashboard login
│   │       │   └── page.tsx      # Dashboard (post-auth)
│   │       └── consortium/
│   │           └── portal/
│   │               └── page.tsx  # Resource pledge portal
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── workspace/         # Workspace-specific components
│   │   └── hbk/               # HBK portal components
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── utils.ts           # Utility functions
│   │   └── sequenzy.ts        # Sequenzy API client
│   └── stores/
│       └── *.ts               # Zustand stores
├── docs/
│   ├── partnership-agent.md   # Partnership automaton specification
│   └── getting-started.md     # This file
├── mini-services/
│   └── ...                    # Mini services (e.g., WebSocket)
├── .env.local                 # Local environment variables (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── Caddyfile                  # Gateway configuration
```

---

## 4. Workspace Overview

### 4.1 Landing Page vs. Workspace Mode

The VVU application has two primary modes:

1. **Landing Page** (`/`) — The public-facing homepage. Shows the VVU mission, program overview, and calls-to-action. No authentication required.
2. **Workspace Mode** (`/hbk/*`) — The authenticated partnership environment. Includes the briefing page, document portal, dashboard, and consortium portal.

### 4.2 Icon Rail Sidebar

The workspace uses an **Icon Rail** sidebar navigation pattern:

- **Collapsed state:** A narrow vertical bar (48px) showing only icons for each section.
- **Expanded state:** On hover, the rail expands to 240px, revealing labels alongside icons.
- **Sections:** Briefing, Documents, Dashboard, Consortium, Settings.
- **Behaviour:** The rail is always visible in workspace mode. It collapses automatically after 2 seconds of no hover interaction.

### 4.3 Compute Engine Widget

At the bottom of the workspace, a **Compute Engine** widget displays:

- Current HBK simulation status (running / idle / error)
- Last simulation run timestamp
- Key output metrics (compressed view)
- Expand/collapse toggle for detailed view

### 4.4 Three-Root Architecture

The VVU application is structured around three conceptual roots:

| Root | Path Prefix | Description |
|---|---|---|
| **Public** | `/` | Landing page, public info, SEO |
| **HBK Portal** | `/hbk/*` | Partnership-facing pages (briefing, documents, dashboard, consortium) |
| **API** | `/api/*` | Backend API routes (auth, documents, simulation, events) |

Each root has its own layout, middleware, and auth requirements. The `/hbk/*` root shares a common layout shell with the Icon Rail and Compute Engine widget.

---

## 5. The Five Programs

The VVU initiative is organised into five interdependent programs:

### 5.1 Ubuntu Pools

**Purpose:** Community-driven resource pooling and cooperative governance.  
**Status:** Active — pilot phase in Southern Africa.  
**Key Deliverable:** Pool management smart contracts, governance voting framework.

### 5.2 ProofBridge

**Purpose:** Formal verification and proof-carrying code for the HBK simulation. Bridges academic proof methods with production code.  
**Status:** Active — core proof engine operational.  
**Key Deliverable:** Verified HBK solver, proof certificates for gate compliance.

### 5.3 HBK Mk-II

**Purpose:** The High-Balance Knapsack validation simulation — the core proof-of-concept for African water security infrastructure financing.  
**Status:** Active — simulation running, gates in progress.  
**Key Deliverable:** Validated HBK simulation outputs, engineering gate compliance matrix.

### 5.4 Epistemic Runtime

**Purpose:** Knowledge management and epistemic transparency. Ensures all claims, data, and decisions are traceable to evidence.  
**Status:** Active — evidence ledger operational.  
**Key Deliverable:** Evidence versioning system, audit trail, compliance documentation.

### 5.5 Education & Outreach

**Purpose:** Capacity building, academic partnerships, and public communication about VVU's mission and methods.  
**Status:** Active — pilot workshops in development.  
**Key Deliverable:** Workshop curricula, academic paper submissions, public briefing materials.

---

## 6. Engineering Gates

The HBK validation simulation is governed by ten engineering gates. Each gate must be passed before the simulation can progress to the next phase.

| Gate | Name | Description | Current Status |
|---|---|---|---|
| **G-01** | Formal Specification | HBK problem formally specified in proof assistant (Lean 4) | ✅ Passed |
| **G-02** | Solver Correctness | HBK solver produces correct results on certified test instances | ✅ Passed |
| **G-03** | Constraint Validation | All real-world constraints validated against domain expert input | ✅ Passed |
| **G-04** | Distributed Consensus | Multi-node consensus protocol achieves agreement within tolerance | ✅ Passed |
| **G-05** | Ledger Integrity | Append-only ledger passes integrity checks (hash chain, no gaps) | ✅ Passed |
| **G-06** | Water Model Calibration | Water security model calibrated against South African hydrological data | 🔄 In Progress |
| **G-07** | Financial Constraint Compliance | No specific dollar figures in outputs; regulatory constraints met | 🔄 In Progress |
| **G-08** | Institutional Onboarding | Partnership automation (AUT-001 through AUT-005) operational | 🔄 In Progress |
| **G-09** | Evidence Packaging | All outputs reference evidence package version; audit trail complete | 🔄 In Progress |
| **G-10** | Production Readiness | Full system passes integration test suite; monitoring active | ⏳ Pending |

### Gate Passage Criteria

- Each gate has a **formal checklist** (stored in the evidence ledger).
- A gate is **passed** when all checklist items are verified and signed off by the responsible party.
- Gate status is visible on the dashboard (authenticated) and in the briefing page (read-only summary).

---

## 7. Partnership Automation

The VVU partnership automation system is fully specified in [`partnership-agent.md`](./partnership-agent.md). This section provides an operational summary.

### 7.1 Sequenzy Integration

Sequenzy is the email automation platform that powers all five automata (AUT-001 through AUT-005). It handles:

- **Contact management** — Segments, tags, custom fields
- **Event tracking** — `briefing_opened`, `document_signed`, `dashboard_first_view`, `resource_pledge_confirmed`, etc.
- **Email sequences** — Triggered sends, delays, conditional branches, escalation actions
- **Unsubscribe management** — POPIA-compliant one-click unsubscribe

### 7.2 Automata Summary

| Automaton | Trigger | Templates | Escalation |
|---|---|---|---|
| **AUT-001** Catalyst Welcome | Contact added to "Catalyst" segment | TMPL-001, TMPL-001-REMINDER | Flag for human review after 14 days |
| **AUT-002** Tri-Party Agreement | `document_room_created` event | TMPL-002 | `escalate_to_human` after 7 days unsigned |
| **AUT-003** Dashboard Access | `nda_signed` event | TMPL-003, TMPL-003-REMINDER | None (no escalation) |
| **AUT-004** Resource Recovery | `resource_pledge_stalled` event | TMPL-004, TMPL-004-FINAL | `escalate_to_human` after 14 days stalled |
| **AUT-005** Inactivity Check-in | 21-day inactivity | TMPL-005 | `flag_for_human_review` after 51 days |

### 7.3 Portal Routes

All portal routes are under `/hbk`:

| Route | URL | Auth |
|---|---|---|
| Technical briefing | `/hbk/briefing` | Public (optional `ref` tracking) |
| Document signing | `/hbk/documents/{document_room_id}` | Magic link |
| Dashboard login | `/hbk/dashboard/login?token={access_token}` | Magic link → session |
| Dashboard | `/hbk/dashboard` | Session cookie |
| Consortium portal | `/hbk/consortium/portal?token={access_token}` | Magic link |

### 7.4 Email Template Style

All HTML emails use the VVU green button style:

- Button background: `#0b3d2e` (VVU brand green)
- Button text: `#ffffff`
- Button border-radius: `6px`
- Button padding: `14px 28px`
- Font: `'Segoe UI', Arial, sans-serif`
- Max width: `600px`

See `partnership-agent.md` for the complete template source code and variable tables.

---

## 8. Staging Deployment

### 8.1 Environment Variables

Create a `.env.staging` file (or configure in your CI/CD platform):

| Variable | Staging Value |
|---|---|
| `DATABASE_URL` | `file:./staging.db` (or a remote SQLite/PostgreSQL connection) |
| `NEXT_PUBLIC_APP_URL` | `https://staging.vvu.africa` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk staging key |
| `CLERK_SECRET_KEY` | Clerk staging secret |
| `S3_BUCKET_DOCUMENTS` | `vvu-documents-staging` |
| `SEQUENZY_API_KEY` | Sequenzy staging API key |

### 8.2 Database Push

```bash
bun run db:push
```

This applies the Prisma schema to the staging database. **Note:** For staging and production, consider using `prisma migrate deploy` instead of `db:push` for controlled migrations.

### 8.3 Build Verification

```bash
bun run lint
```

Ensure lint passes with zero errors before proceeding.

### 8.4 Staging Checklist

- [ ] All environment variables set for staging
- [ ] Database schema pushed / migrated
- [ ] Lint passes (`bun run lint`)
- [ ] No TypeScript errors
- [ ] Landing page renders correctly
- [ ] HBK briefing page loads (with and without `ref` param)
- [ ] Document signing portal accessible via magic link
- [ ] Dashboard login flow works (magic link → session → redirect)
- [ ] Consortium portal accessible via magic link
- [ ] Sequenzy events fire correctly (check Sequenzy dashboard)
- [ ] Email templates render correctly (check TMPL-001 through TMPL-005)
- [ ] POPIA unsubscribe link functional
- [ ] Icon Rail sidebar works in workspace mode
- [ ] Compute Engine widget displays correct simulation status
- [ ] Mobile responsive layout verified
- [ ] Dark mode verified
- [ ] Accessibility audit passed (keyboard navigation, ARIA labels, screen reader)

---

## 9. Production Release

### 9.1 Pre-Release Checklist

- [ ] **Lint green:** `bun run lint` passes with zero errors
- [ ] **All gates passed:** G-01 through G-10 in the engineering gate matrix
- [ ] **Partnership portal live:** All `/hbk/*` routes functional on staging
- [ ] **Email automata tested:** All five automata (AUT-001 through AUT-005) tested end-to-end
- [ ] **Evidence version current:** All templates and portals reference `VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC`
- [ ] **Security review:** Magic-link tokens single-use and time-bound, session cookies `HttpOnly` + `Secure`
- [ ] **POPIA compliance:** Unsubscribe links functional, data deletion flow documented
- [ ] **Performance:** Lighthouse score > 90 for landing page
- [ ] **Monitoring:** Error tracking and uptime monitoring configured
- [ ] **DNS:** `vvu.africa` points to production infrastructure
- [ ] **SSL/TLS:** Certificate valid and auto-renewing
- [ ] **Backup:** Database backup verified

### 9.2 Deployment Steps

1. **Merge to main branch:**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **CI/CD pipeline runs automatically** (lint, type check, build).

3. **Deploy to production:**
   - If using Vercel: Deployment is automatic on merge to `main`.
   - If using AWS: Deploy via AWS Amplify or custom CI/CD pipeline.

4. **Verify production:**
   - Visit `https://vvu.africa` and confirm landing page loads.
   - Test a magic-link flow end-to-end.
   - Check that Sequenzy events are firing in the Sequenzy dashboard.
   - Verify monitoring dashboard shows healthy status.

5. **Tag the release:**
   ```bash
   git tag -a v1.0.0 -m "Production release: VVU v1.0.0"
   git push origin v1.0.0
   ```

### 9.3 DNS Configuration

| Record | Type | Value | TTL |
|---|---|---|---|
| `vvu.africa` | A | `[Production IP]` | 300 |
| `www.vvu.africa` | CNAME | `vvu.africa` | 300 |
| `staging.vvu.africa` | CNAME | `[Staging endpoint]` | 300 |

### 9.4 SSL/TLS

- Use **Let's Encrypt** (auto-renewing via Caddy) or **AWS Certificate Manager**.
- Enforce HTTPS redirect on all routes.
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### 9.5 Monitoring

- **Uptime:** UptimeRobot or AWS CloudWatch (check `https://vvu.africa` every 5 minutes)
- **Errors:** Sentry or equivalent (capture unhandled exceptions and API errors)
- **Performance:** Vercel Analytics or AWS CloudWatch RUM
- **Sequenzy:** Monitor email delivery rates and event tracking accuracy

---

## 10. CI/CD Pipeline

### 10.1 Pipeline Stages

```yaml
# .github/workflows/ci.yml (conceptual)
stages:
  - lint
  - type-check
  - build

lint:
  run: bun run lint
  fail_on: any error

type-check:
  run: bunx tsc --noEmit
  fail_on: any error

build:
  run: bun run build
  fail_on: build failure
```

### 10.2 Pre-Commit Hooks

Install pre-commit hooks via `husky` or `lefthook`:

```bash
# .husky/pre-commit
bun run lint
```

This ensures lint passes before every commit, preventing style or type errors from entering the codebase.

### 10.3 Key Commands

| Command | Purpose |
|---|---|
| `bun run lint` | Run ESLint (Next.js + TypeScript rules) |
| `bunx tsc --noEmit` | TypeScript type check without emitting files |
| `bun run build` | Production build (do NOT run locally in dev environment) |
| `bun run db:push` | Push Prisma schema to database |
| `bun run dev` | Start development server (port 3000) |

---

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Cause | Fix |
|---|---|---|
| **`bun install` fails** | Lock file conflict | Delete `bun.lockb` and run `bun install` again |
| **Dev server won't start** | Port 3000 in use | Kill the process on port 3000: `lsof -ti:3000 \| xargs kill -9` |
| **Prisma client not generated** | Schema changed but client not regenerated | Run `bun run db:push` or `bunx prisma generate` |
| **TypeScript errors in `.prisma` client** | Prisma client out of sync | Run `bunx prisma generate` |
| **Lint errors** | Code style violations | Run `bun run lint` and fix reported errors |
| **Magic link not working** | Token expired or already used | Generate a new magic link via the dashboard login form |
| **Sequenzy events not firing** | API key invalid or event name mismatch | Check `.env.local` for correct `SEQUENZY_API_KEY`; verify event names match automaton spec |
| **Document portal 403** | Magic link expired or auth failed | Check token TTL (72h for documents); request a new link via email |
| **Dashboard shows stale data** | TanStack Query cache | Hard-refresh the page or invalidate the query cache |
| **Dark mode not working** | `next-themes` not configured | Ensure `ThemeProvider` wraps the app in `layout.tsx` |
| **Mobile layout broken** | Missing responsive classes | Add `sm:`, `md:`, `lg:` prefixes to Tailwind classes |
| **Icon Rail not expanding** | Hover event not firing on mobile | Add touch event handlers or a manual toggle button for mobile |
| **`bun run dev` crashes on startup** | Syntax error in a file | Check the terminal output for the file and line number |

### 11.2 Debug Tips

- **Dev server log:** Read `/home/z/my-project/dev.log` for the most recent server logs.
- **Browser DevTools:** Use the Network tab to check API responses and the Console tab for errors.
- **Prisma Studio:** Run `bunx prisma studio` to visually inspect the database.
- **Sequenzy Dashboard:** Check the Sequenzy web interface for event delivery status and email logs.

---

## 12. Key Contacts & Resources

### 12.1 Team Contacts

| Role | Email | Purpose |
|---|---|---|
| **General Enquiries** | hello@venturevisionubuntu.co.za | Public-facing enquiries, partnership introductions |
| **Technical Lead** | divh@venturevisionubuntu.co.za | Engineering decisions, architecture reviews, escalation handling |

### 12.2 Key Resources

| Resource | URL | Description |
|---|---|---|
| **GitHub Repository** | `https://github.com/venture-vision-ubuntu/vvu` | Source code, issues, pull requests |
| **Partnership Agent Spec** | [`docs/partnership-agent.md`](./partnership-agent.md) | Email templates, portal structures, automata specification |
| **Sequenzy Dashboard** | `https://app.sequenzy.com` | Email automation, contact management, event tracking |
| **Clerk Dashboard** | `https://dashboard.clerk.com` | Authentication, user management, magic link configuration |
| **AWS Console** | `https://console.aws.amazon.com` | S3, KMS, IAM, CloudWatch |
| **Production Site** | `https://vvu.africa` | Live application |
| **Staging Site** | `https://staging.vvu.africa` | Pre-production environment |

### 12.3 Documentation Map

```
docs/
├── partnership-agent.md    # AUT-001–005 specification, email templates, portal structures
└── getting-started.md      # This file — end-to-end deploy, stage & release guide
```

---

> **End of Getting Started Guide**  
> **Document ID:** VVU-GSG-001 Rev 1.0  
> **For questions, contact:** hello@venturevisionubuntu.co.za
