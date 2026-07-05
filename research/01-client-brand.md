# Phase 1: Client Brand Extraction — venturevisionubuntu.co.za

> Extracted: 2026-07-05
> Source: Direct scrape of 9 pages (homepage, gateway, dashboard, proofbridge, pools, safekrypte, agent/lindiwe, legal/popia, ekasi)

---

## 1. Brand Identity

| Field | Value |
|-------|-------|
| **Brand Name** | VVU (Venture Vision Ubuntu) |
| **Full Name** | Venture Vision Ubuntu |
| **Legal Entity** | Vaguely Vanity LLC (CIPC 2026/259053/07) / VVU Foundation |
| **Tagline** | Agent Loop · Cryptographic Attestation & Sovereign ROSCA Infrastructure |
| **Location** | Gqeberha, Eastern Cape, South Africa |
| **Version** | v2.0-STABLE / v2.1-ORCHESTRATOR |
| **Domain** | venturevisionubuntu.co.za |
| **Zulu Proverb** | "Umuntu ngumuntu ngabantu" — a person is a person through people |

## 2. Design System — Color Palette

Extracted from raw HTML/CSS (inline styles + `<style>` block):

| Token | Hex | Usage |
|-------|-----|-------|
| **Background (primary)** | `#07090B` | Main page background |
| **Card/Surface** | `#121925` | Card backgrounds, nav sidebar |
| **Muted surface** | `#12192580` | Header backdrop (translucent) |
| **Border** | `#1C2A38` | All borders and dividers |
| **Progress track** | `#16202E` | Progress bars, input backgrounds |
| **Accent — Gold** | `#C8A84A` | Headings, highlights, version badges, status values |
| **Accent — Cyan** | `#00E5FF` | Active status, link indicators, selection highlight, live indicators |
| **Accent — Green** | `#3ECF8E` | ACTIVE status badges, positive states |
| **Accent — Red/Dev** | `#C4254F` / `#8C1A3E` | DEV status badge, SafeGrid water section |
| **Status — PRE-PROD** | `#C8A84A22` bg / `#C8A84A` text | Pre-production badge |
| **Status — PILOT** | `#00E5FF22` bg / `#00E5FF` text | Pilot stage badge |
| **Status — ACTIVE** | `#3ECF8E22` bg / `#3ECF8E` text | Active service badge |
| **Text — White** | `#FFFFFF` | H1 headings, brand name |
| **Text — Primary** | `#DCE2EA` | Body content |
| **Text — Muted** | `#6A8099` | Secondary text, descriptions |
| **Text — Dim** | `#334658` | Labels, meta, footer |
| **Text — Sidebar** | `#94A3B8` (slate-400) | Navigation links |
| **Selection** | `#00E5FF` at 30% opacity | Text selection highlight |
| **Glow — Gold** | `rgba(200, 168, 74, 0.25)` → `0.4` | `vvuGlowPulse` animation |
| **Glow — Cyan** | `rgba(0, 229, 255, 0.4)` | Box shadows on cyan elements |

### Gradient Usage
- **Header bar**: `linear-gradient(90deg, transparent, #C8A84A, #00E5FF, transparent)`
- **Progress bar**: `linear-gradient(90deg, #C8A84A, #00E5FF, #3ECF8E)`
- **Background**: `radial-gradient(ellipse at 30% 0%, #121925 0%, #07090B 70%)`
- **Scanline overlay**: `linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.15) 50%)` — 4px grid, 12% opacity

## 3. Typography

All fonts loaded via Google Fonts:

| Font | Weight | Usage |
|------|--------|-------|
| **Syne** | 400, 500, 600, 700, 800 | All headings (H1, H2, H3), brand name, card titles |
| **DM Sans** | 400, 500, 600, 700 | Body text, descriptions, paragraphs |
| **IBM Plex Mono** | 400, 500 | All technical/monospace text, labels, status badges, nav buttons, metrics |
| IBM Plex Sans | 300, 400, 500 | Secondary body (fallback) |
| DM Mono | 400, 500 | Monospace variant (limited use) |
| JetBrains Mono | 400, 500, 700 | Code/monospace (loaded, limited use) |
| Fira Code | 400, 500, 700 | Code/monospace (loaded, limited use) |

**Fallback stack**: `"DM Sans", "IBM Plex Mono", monospace, sans-serif`

**Scale** (from inline styles):
- `.5rem` (8px) → version badges, footer, gate target
- `.55rem` (8.8px) → card labels, status indicators
- `.6rem` (9.6px) → nav buttons
- `.65rem` (10.4px) → body text, location, descriptions
- `.75rem` (12px) → base body
- `.8rem` (12.8px) → sidebar brand
- `.95rem` (15.2px) → card titles (H3)
- `1.3rem` (20.8px) → H1 brand heading

## 4. Site Structure

All discovered pages (13 pages, 1 external):

| Path | Title | Status |
|------|-------|--------|
| `/` (home) | VVU Gateway · Venture Vision Ubuntu | **Main dashboard** |
| `/gateway` | Secure Access Portal | Sign-in page |
| `/dashboard` | Dashboard | System monitoring + Access Token Console |
| `/dashboard/infra` | Infrastructure | (discovered in nav) |
| `/proofbridge` | ProofBridge Liner v2.0 · NEXUS | ZK compliance + bounty platform |
| `/pools` | Ubuntu Pools | ROSCA/Stokvel platform |
| `/safekrypte` | SafeKrypte | HSM-as-a-Service |
| `/safegrid` | SafeLiner | Credential issuance |
| `/ubuntu-games` | Ubuntu Games | (discovered in nav) |
| `/studio` | Ubuntu Studio | (discovered in nav) |
| `/ekasi` | Ekasi | Pan-African open-world RPG |
| `/agent/lindiwe` | Lindiwe AI | Internal intelligence layer |
| `/dashboard/telemetry` | Telemetry | (discovered in nav) |
| `/legal/popia` | POPIA Compliance Statement | Legal/privacy |

## 5. Navigation Structure

Sidebar (VVU-BRAIN OS) with 4 sections:

### Command Center
- 🚨 Gateway Deck → `/gateway`
- 📊 Dashboard → `/dashboard`
- ⚡ Infrastructure → `/dashboard/infra`

### Compliance OS
- 🔗 ProofBridge → `/proofbridge`
- 🏦 Ubuntu Pools → `/pools`
- 🔐 SafeKrypte → `/safekrypte`
- 🛡️ SafeLiner → `/safegrid`

### Products
- 🎮 Ubuntu Games → `/ubuntu-games`
- 💻 Ubuntu Studio → `/studio`
- 🌍 Ekasi Portal → `/ekasi`

### System
- 🤖 Lindiwe AI → `/agent/lindiwe`
- 📡 Telemetry → `/dashboard/telemetry`
- 📋 POPIA → `/legal/popia`

## 6. Products & Services

| Product | Category | Status | Description |
|---------|----------|--------|-------------|
| **SafeKrypte Lite** | ED25519 Signing | ACTIVE | Free-tier signing for 1000 creators |
| **SafeLiner Lite** | Credential Issuance | ACTIVE | QR-verifiable credential issuance |
| **VVU Operatus** | Microkernel | ACTIVE | Headless scheduler for SafeLiner + SafeKrypte |
| **Lindiwe Agent Kernel** | AI/Intelligence | ACTIVE | Internal ops evaluation, compliance audit |
| **Ubuntu Pools** | ROSCA/Stokvel | PILOT | Decentralized mutual financial pooling |
| **ProofBridge Liner** | ZK/Compliance | PILOT | Zero-knowledge circuit validation |
| **SafeGrid** | Utility/Water | DEV | NMB Municipality infrastructure mapping |
| **Ekasi** | Gaming/RPG | PRE-PROD | Pan-African open-world RPG |

## 7. Content & Tone of Voice

- **Style**: Cyberpunk-terminal meets Ubuntu African tech. Dark command center aesthetic.
- **Technical depth**: Heavy use of cryptographic terminology (ED25519, zero-knowledge, attestation, HMAC, Argon2id)
- **Iconography**: Emoji-based navigation icons (🚨📊⚡🔗🏦🔐🛡️🎮💻🌍🤖📡📋🐜)
- **Status indicators**: Every card has a colored badge (ACTIVE=green, PILOT=cyan, DEV=red, PRE-PROD=gold)
- **Footer legal**: "© 2026 Vaguely Vanity LLC (CIPC 2026/259053/07)"
- **Security messaging**: "Argon2id · HTTP-Only Cookies · Fail2Ban Protection"
- **Regional pride**: Gqeberha mentioned multiple times, Zulu proverb, POPIA compliance
- **Metrics-heavy**: Live counters for free tier remaining, pools locked, kernel operators, latency, etc.

## 8. Technology Stack

| Technology | Usage |
|------------|-------|
| **Next.js** | App Router framework |
| **Tailwind CSS** | Utility CSS framework |
| **Google Fonts** | Syne, DM Sans, IBM Plex Mono, etc. |
| **Supabase** | Auth (magic-link, PKCE), database (Ubuntu Pools governance) |
| **Stitch** | Instant EFT payment rail (Ubuntu Pools) |
| **ProofBridge** | ED25519 attestation receipts |
| **NATS JetStream** | Event bus for Lindiwe AI |
| **FastMCP** | MCP protocol server (15 tools) |
| **Lean 4** | Formal verification pipeline |
| **Firebase** | (env vars not set — displayed as unavailable) |
| **AWS af-south-1** | Data storage (POPIA) |
| **Vercel** | Hosting (implied by Next.js) |

## 9. Key Design Patterns

1. **Scanline CRT overlay** — fixed position, `pointer-events: none`, 12% opacity scanline grid
2. **GlowPulse animation** — keyframes `vvuGlowPulse` on gold/cyan box shadows
3. **Progress bars** — thin (3-4px), gradient-filled with glow
4. **Card design** — dark `#12192560` bg, `#1C2A38` border, 10px radius, gold corner decoration (top-right 8px)
5. **Staggered fade-in** — cards have `opacity: 0; transform: translateY(8px)` (JS-animated)
6. **Header with gradient line** — 2px gradient bar at top (transparent → gold → cyan → transparent)
7. **Dual sidebar** — Tailwind `<aside>` + JSX inline `<aside>` (seems like a transition state)
8. **Live indicators** — `animate-pulse` on cyan dots for active status
9. **Badge system** — colored border + background for status: ACTIVE/PILOT/DEV/PRE-PROD
10. **Responsive grid** — `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` for cards

---

## Extracted CSS Animations

```css
@keyframes vvuGlowPulse {
  0%, 100% { box-shadow: rgba(200, 168, 74, 0.25) 0px 0px 14px; }
  50%      { box-shadow: rgba(200, 168, 74, 0.4) 0px 0px 24px; }
}

@keyframes vvuScanline {
  0%   { transform: translateY(0px); }
  100% { transform: translateY(100px); }
}
```

## Extracted Scrollbar Styles

```css
.vvu-scrollbar::-webkit-scrollbar { width: 3px; }
.vvu-scrollbar::-webkit-scrollbar-track { background: #07090B; }
.vvu-scrollbar::-webkit-scrollbar-thumb { background: #1C2A38; border-radius: 2px; }
.vvu-scrollbar::-webkit-scrollbar-thumb:hover { background: #C8A84A; }
```
