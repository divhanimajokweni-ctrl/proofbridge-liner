# Phase 4: Build Brief & Approval

> Prepared: 2026-07-05
> Client: Venture Vision Ubuntu (venturevisionubuntu.co.za)
> Status: AWAITING APPROVAL

---

## Design Direction

Based on the brand extraction (Phase 1) and competitive analysis (Phases 2-3), the recommended direction is:

### Core Concept

**"African Cryptographic Trust"** — bridging Ubuntu philosophy with modern cryptographic infrastructure. The visual language communicates both warmth (community, stokvel, African identity) and rigor (ED25519, ZK, formal verification).

### Brand Personality
| Axis | Position |
|------|----------|
| Warm vs Technical | **Warm-technical hybrid** — approachable for stokvel members, authoritative for developers |
| Traditional vs Futuristic | **Future-rooted in tradition** — Zulu proverb meets zero-knowledge proofs |
| Local vs Global | **Proudly African, globally capable** — POPIA-native, built in Gqeberha |
| Serious vs Playful | **Purposeful with moments of delight** — trust infrastructure, not a game, but not cold |

---

## Proposed Color Palette

Extending VVU's existing dark-mode identity with a warmer, more welcoming marketing layer:

| Role | Marketing Site | Dashboard (existing) |
|------|---------------|---------------------|
| **Background** | `#f6f4f0` (warm paper) | `#07090B` (near-black) |
| **Surface** | `#fffefa` (cream) | `#121925` (dark navy) |
| **Primary** | `#c45d3e` (terracotta) | `#C8A84A` (gold) |
| **Accent** | `#c8a84a` (gold, shared) | `#00E5FF` (cyan) |
| **Success** | `#3ecf8e` (green, shared) | `#3ECF8E` (green) |
| **Text** | `#2a2520` (warm black) | `#DCE2EA` (light gray) |
| **Border** | `#e0d8d0` (warm border) | `#1C2A38` (dark slate) |

The gold accent (`#C8A84A`) bridges both worlds — appearing on both the marketing site and the dashboard.

---

## Typography System

| Role | Marketing Site | Dashboard (existing) |
|------|---------------|---------------------|
| **Headings** | Instrument Serif (warmth, editorial authority) | Syne (technical, modern) |
| **Body** | DM Sans (clean, readable) | DM Sans (shared) |
| **Monospace** | IBM Plex Mono (shared) | IBM Plex Mono (technical labels) |

---

## Site Architecture (Two-Site Strategy)

### 1. Marketing Landing Page (NEW — this build)
A single-page marketing site that tells the VVU story:

```
VVU Gateway — Marketing Page
├── Hero Section          → "Africa's Cryptographic Trust Layer"
│   ├── Headline + subtitle
│   ├── Animated 3D globe or particle network (cyberpunk-African)
│   ├── CTA: "Explore the Gateway →"
│   └── Trust indicators (POPIA, ED25519, Stitch)
├── Ubuntu Philosophy     → The "Umuntu ngumuntu ngabantu" section
│   ├── Zulu proverb with translation
│   ├── How Ubuntu informs the product vision
│   └── Quiet scroll animation
├── Products Grid         → 8 products in 4 categories
│   ├── Signing & Credentials (SafeKrypte, SafeLiner)
│   ├── Community Finance (Ubuntu Pools)
│   ├── Compliance & ZK (ProofBridge, Lindiwe)
│   └── Infrastructure (VVU Operatus, SafeGrid, Ekasi)
├── Free Tier Callout     → "Free for your first 1000 creators"
│   ├── Counter animation (creators used / 1000)
│   └── CTA: "Claim your free tier →"
├── Competitive Trust     → "Built different" section
│   ├── POPIA compliance badge
│   ├── ED25519 / Lean 4 / ZK icons
│   ├── Gqeberha, Eastern Cape location
│   └── Footer: legal + copyright
└── Navigation            → Sticky top nav
    ├── Logo + "VVU"
    ├── Products (dropdown)
    ├── Gateway (link to /gateway)
    └── CTA button: "Launch Dashboard"
```

### 2. Dashboard (EXISTING — preserve)
The current dark-mode terminal dashboard at `/` stays unchanged. Users land here after authentication.

---

## Animation & Interaction Design

| Element | Animation |
|---------|-----------|
| Hero section | Fade-in with staggered title reveal; subtle particle background |
| Ubuntu quote | Scroll-triggered fade with slight parallax |
| Product cards | Staggered grid fade-in with upward motion on scroll |
| Numbers (counters) | Animated counting from 0 when scrolled into view |
| CTA buttons | Hover: slight scale (1.03) + shadow lift; gradient underline |
| Navigation | Sticky with background blur on scroll |
| Page transitions | Smooth scroll behavior (`scroll-behavior: smooth`) |

**GSAP Timeline** (to be implemented in Phase 5):
- Hero: `gsap.fromTo(...)` with stagger on title words
- Cards: `ScrollTrigger.create(...)` with batch animations
- Counters: `gsap.to(...)` with `onUpdate` for number formatting

---

## Technical Requirements

| Requirement | Detail |
|-------------|--------|
| Framework | Vanilla HTML + CSS + JS (no build step) |
| Animation | GSAP (CDN) + ScrollTrigger plugin |
| Fonts | Google Fonts: Instrument Serif, DM Sans, IBM Plex Mono |
| Icons | Emoji or inline SVG (no icon library dependency) |
| Responsive | Mobile-first, tested at 320px–1440px |
| Performance | < 500KB total page weight, < 3s LCP |
| SEO | meta tags, Open Graph, semantic HTML |
| a11y | ARIA labels, keyboard nav, focus management |

---

## Deliverables for Phase 5

1. `site/index.html` — Single-page marketing site
2. `site/css/style.css` — Stylesheet
3. `site/js/animations.js` — GSAP scroll animations
4. `site/assets/` — SVG icons, images (if any)

---

## Approval Checkpoint

**Before Phase 5 begins, confirm:**

- [x] Brand extraction done (Phase 1) — research/01-client-brand.md
- [x] Competitive analysis done (Phases 2-3) — research/02-competitive-analysis.md + competitive-analysis.html
- [ ] **Design direction approved** — this document
- [ ] Color palette approved
- [ ] Site architecture approved
- [ ] Animation direction approved

> ════════════════════════════════════════════════════
> Status: **AWAITING APPROVAL**
> 
> Sign below to proceed to Phase 5 (Build):
> 
> Approved by: _______________
> Date: _______________
> ════════════════════════════════════════════════════
