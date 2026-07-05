# Sample Brand Snapshot

## Brand Snapshot
- **Company:** Acme Design Studio
- **Primary Color:** `#1a1a2e` (deep navy)
- **Secondary Color:** `#e94560` (crimson accent)
- **Accent Color:** `#0f3460` (mid-blue)
- **Fonts:** `Playfair Display` (headings) / `Inter` (body)
- **Tone:** Sophisticated, confident, design-forward
- **Core Message:** "We build brands that dominate their category through strategic design thinking."

## Logo
- **Type:** SVG text logo + mark
- **Location:** Header `<img src="/logo.svg" alt="Acme Design Studio">`
- **Favicon:** `/favicon.ico` — monogram mark in navy

## Color System
- CSS custom properties found:
  ```css
  --color-primary: #1a1a2e;
  --color-secondary: #e94560;
  --color-accent: #0f3460;
  --color-bg: #f8f9fa;
  --color-text: #2d3436;
  ```
- Background: Light grey (`#f8f9fa`)
- Text: Near-black (`#2d3436`)
- Buttons: Primary with white text, hover darkens 10%

## Typography
- **Google Fonts loaded:** `Playfair Display` (weights 400, 700) + `Inter` (weights 300, 400, 500, 600)
- **Headings:** `Playfair Display`, serif, 700 weight
- **Body:** `Inter`, sans-serif, 400 weight, 1.6 line-height
- **Font sizes:** H1: 3rem, H2: 2rem, H3: 1.5rem, Body: 1rem

## Site Structure
- `/` — Homepage: hero, services overview, featured work, testimonials, CTA
- `/about` — About page: team, philosophy, timeline
- `/services` — Services: detailed service breakdown with pricing tiers
- `/work` — Portfolio: grid of case studies with filters
- `/work/[project]` — Individual case study
- `/contact` — Contact: form, map, social links
- `/blog` — Blog: article listing with categories
- `/blog/[slug]` — Individual article

## Tone of Voice Analysis
- **Formal but warm:** Uses "we believe" and "our approach" — confident without arrogance
- **Jargon-light:** Avoids excessive design terminology; explains concepts accessibly
- **Story-driven:** Homepage opens with a narrative hook about the founder's journey
- **Active voice:** "We design", "We build", "You get" — not passive constructions

## Key Messaging
- **Headline:** "Design That Makes Your Competition Irrelevant"
- **Tagline:** "Strategic branding for companies that refuse to blend in"
- **Value Prop:** "We combine design thinking with market research to create brands that don't just look good — they win."
- **CTA:** "Start Your Brand Audit"

## Content Inventory

### Homepage
- Hero section with full-bleed video background
- "Our Process" — 3-step visual explainer
- Featured client logos (4 logos, grayscale)
- Testimonial carousel (3 quotes)
- Stats bar: "200+ Projects · 50+ Clients · 98% Retention"
- Footer CTA: "Ready to dominate your category?"

### About Page
- Founder story (3 paragraphs)
- Team grid (8 people) with photos and titles
- Company timeline (2015 founding → 2026)
- Values section: 5 core values with icons

### Services Page
- 4 service categories: Brand Identity, Web Design, Content Strategy, SEO
- Each with description, starting price, and "Learn More" link
- FAQ accordion at bottom (6 questions)

### Work Page
- 12 case studies in 3-column grid
- Filters: All, Branding, Web, Strategy
- Each case: thumbnail, client name, category tag

### Contact Page
- Form fields: Name, Email, Company, Budget, Message
- Google Maps embed
- Phone, email, physical address
- Social media links (Instagram, LinkedIn, Dribbble)

## Technical Notes
- **Framework:** Next.js 14 (React)
- **Hosting:** Vercel
- **Animations:** Framer Motion (scroll reveals, hover effects)
- **CMS:** Notion (headless, via Notion API)
- **Performance:** 85+ Lighthouse (images need optimization)
- **Meta:** Open Graph tags present, Twitter cards present, no schema markup found
