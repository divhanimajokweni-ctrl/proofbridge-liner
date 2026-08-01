# Plan: Landing Pages & Page Routing

## Current State (As-Is)

```
Routes:
  /                           → Gateway landing page (root) — brand + links to 3 entities
  /gateway                    → Main OS dashboard (922 lines, standalone layout hides nav)
  /proofbridge                → ProofBridge landing page (449 lines)
  /pools                      → Ubuntu Pools landing page (586 lines)
  /docs/api-reference         → Static docs
  /docs/architecture          → Static docs
  /docs/compliance/fscajs2    → Static docs
  /docs/cryptography          → Static docs
  /legal/popia                → Legal page

Layout:
  Root layout (app/layout.tsx) — fonts, Disclaimer footer, no nav
  Gateway layout (app/gateway/layout.tsx) — hides any nav/header with !important
  All pages use inline <style> blocks — no shared design system
```

**Problems:**
1. No shared navigation/header across public pages
2. Duplicated CSS — each page redefines colors, typography, spacing
3. Only 2 of 6 VVU entities have landing pages (SafeKrypte, SafeGrid, Ekasi, Lindiwe AI missing)
4. No consistent page template pattern
5. Gateway layout aggressively blocks nav injection
6. Root page only links 3/6 entities

---

## Proposed Architecture (To-Be)

### 1. Page Hierarchy

```
/                                     → VVU Brand Hub (upgraded from current root)
├── /pools                            → Ubuntu Pools — ROSCA/Stokvel landing
├── /proofbridge                      → ProofBridge Liner — ZK compliance landing
├── /safekrypte                       → SafeKrypte — HSM/Key management landing
├── /safegrid                         → SafeGrid — Grid/Energy landing
├── /ekasi                            → Ekasi Games — Gaming/Tournament landing
├── /agent/lindiwe                    → Lindiwe AI — Agent/AI landing
├── /gateway                          → Gateway OS Dashboard — agent loop, admin, monitors
├── /docs/*                           → Documentation (existing, restructure nav)
├── /legal/*                          → Legal pages (existing)
└── /api/*                            → API routes (existing, no change)
```

### 2. Shared Layout (app/layout.tsx)

Introduce a `<SiteHeader>` component with:
- VVU brand mark + name (left)
- Nav links to entity landing pages (center, condensed on mobile)
- Gateway OS link (right, accent styled)

Refactor existing `<Disclaimer>` into a shared `<SiteFooter>` with:
- Disclaimer text (existing)
- Quick nav links
- Legal links

Layout logic:
- `SiteHeader` renders on all routes EXCEPT `/gateway` (detected via `pathname`)
- `SiteFooter` renders on all routes (including gateway, but gateway's layout CSS can hide it)
- Keep gateway's layout override — it already has `display:none` for nav/footer

### 3. Entity Landing Page Template (`app/components/EntityLanding.tsx`)

Create a reusable component for entity landing pages:

```tsx
interface EntityConfig {
  id: string
  name: string
  tag: string
  status: string
  accentColor: string
  description: string
  metrics: { label: string; value: string }[]
  events: string[]
  icon: string
  ctaLabel: string
  ctaHref: string
}
```

An `<EntityLanding>` wrapper that provides:
- Hero section with icon, name, tagline, status badge
- Description card
- Metrics grid (3-column)
- Recent events feed
- Call-to-action button linking to gateway entity detail or external
- Consistent CSS variables — colors, spacing, typography via a shared `:root` block

### 4. Design System Consolidation (`app/styles/variables.css`)

Extract shared design tokens into a CSS file:

| Token | Current Value | Usage |
|---|---|---|
| `--color-bg` | varies per page | Centralize to `#07090C` (void) |
| `--color-surface` | varies | `#121925` |
| `--color-card` | varies | `#16202E` |
| `--color-border` | varies | `#1C2A38` |
| `--color-text-primary` | varies | `#DCE2EA` |
| `--color-text-secondary` | varies | `#6A8099` |
| `--font-display` | varies | `'Syne', sans-serif` |
| `--font-mono` | varies | `'IBM Plex Mono', monospace` |
| `--font-body` | varies | `'DM Sans', sans-serif` |

Page-specific accent colors (sage, ochre, crimson, gold, etc.) stay per-page.

### 5. Implementation Steps

**Step 1: Design System**
- Create `app/styles/variables.css` with shared CSS custom properties
- Import in root layout
- Create `<SiteHeader>` and `<SiteFooter>` components in `app/components/`

**Step 2: Root layout refactor**
- Add SiteHeader above `{children}` (conditional on pathname ≠ /gateway)
- Replace Disclaimer with SiteFooter

**Step 3: Entity Landing Pages (4 new)**
```
app/safekrypte/page.tsx   — SafeKrypte — HSM key management
app/safegrid/page.tsx     — SafeGrid — Grid infrastructure
app/ekasi/page.tsx        — Ekasi Games — Gaming platform
app/agent/lindiwe/page.tsx — Lindiwe AI — Autonomous agent
```

Each uses the `EntityLanding` template with entity-specific config from the existing `ENTITIES` array in `app/gateway/page.tsx:42-160`.

**Step 4: Update root page**
- Add links for all 6 entities (not just 3)
- Keep the convergence animation
- Update redirect grid from 2-column to 3-column layout for wider screens

**Step 5: Nav integration**
- SiteHeader renders entity nav links
- `/gateway` adds a "Back to VVU" link in its header area
- All existing pages get consistent top navigation

### 6. Files to Create/Modify

| Action | File | Reason |
|---|---|---|
| CREATE | `app/components/SiteHeader.tsx` | Nav bar for all public pages |
| CREATE | `app/components/SiteFooter.tsx` | Footer with disclaimer + links |
| CREATE | `app/components/EntityLanding.tsx` | Reusable landing page template |
| CREATE | `app/styles/variables.css` | Shared design tokens |
| CREATE | `app/safekrypte/page.tsx` | Entity landing — SafeKrypte |
| CREATE | `app/safegrid/page.tsx` | Entity landing — SafeGrid |
| CREATE | `app/ekasi/page.tsx` | Entity landing — Ekasi |
| CREATE | `app/agent/lindiwe/page.tsx` | Entity landing — Lindiwe AI |
| MODIFY | `app/layout.tsx` | Import design system, SiteHeader, SiteFooter |
| MODIFY | `app/page.tsx` | Link all 6 entities, 3-column grid |
| MODIFY | `app/pools/page.tsx` | Migrate to EntityLanding template |
| MODIFY | `app/proofbridge/page.tsx` | Migrate to EntityLanding template |

### 7. Non-Goals (Out of Scope)

- Redesigning the Gateway OS dashboard (`/gateway`) — it stays as-is, its layout already overrides global nav
- Adding authentication/authorization pages
- Internationalization
- Server-side data fetching for landing pages (all data stays static/client-side)
- Mobile hamburger menu — SiteHeader uses condensed text on small screens
