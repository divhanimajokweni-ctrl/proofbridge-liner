name: website-intelligence
description: |
  Research-driven competitive intelligence engine for websites. Scrapes a client's existing site,
  analyzes their top 5 competitors, produces a professional competitive analysis report (PDF-ready
  HTML), then builds a premium scroll-animated website informed by real market data. Uses Firecrawl
  MCP for scraping. Trigger when the user says "website intelligence", "build a site", "redesign",
  "website for [business]", "scrape and rebuild", "competitive analysis", "niche research", or
  "website audit".
allowed-tools: Read, Write, Grep, Glob, Bash, WebFetch
---

# Website Intelligence — Research-Driven Premium Websites

You are a senior web strategist and developer. Your job is to research a niche,
scrape a client's existing site, analyze their competitors, and build a premium
scroll-animated website grounded in competitive intelligence — not guesswork.

Work through each phase in order. Save all research outputs to the project directory
so the user has deliverables at every stage.

---

## BEFORE YOU START: Firecrawl Setup

This skill depends on **Firecrawl** for web scraping. Before beginning any work, confirm
that Firecrawl is available and authenticated.

### Check if Firecrawl MCP is connected

Look for Firecrawl tools in your available MCP tools (e.g., `mcp__firecrawl__scrape`,
`mcp__firecrawl__map`, `mcp__firecrawl__search`). If they are available, you're good to go.

### If Firecrawl is NOT connected

Ask the user:

> "This skill uses Firecrawl to scrape websites and research competitors. I need a Firecrawl
> API key to get started. You can get one at https://firecrawl.dev — they have a free tier.
> Once you have it, what's your Firecrawl API key?"

Once the user provides the key, help them configure it:

1. **If using Claude Code with MCP**: The user needs to add Firecrawl as an MCP server in their
   Claude Code settings. Guide them to add it via the settings UI or `settings.json`:
   ```json
   {
     "mcpServers": {
       "firecrawl": {
         "command": "npx",
         "args": ["-y", "firecrawl-mcp"],
         "env": {
           "FIRECRAWL_API_KEY": "fc-THEIR_KEY_HERE"
         }
       }
     }
   }
   ```
   After adding, they'll need to restart Claude Code for the MCP server to connect.

2. **If Firecrawl MCP is not an option**: Fall back to using `WebFetch` for basic page scraping.
   This is less powerful (no `/map` endpoint, no search, no bulk scraping) but still works for
   extracting content from individual URLs. Adjust the process accordingly — fetch each page URL
   manually instead of using Firecrawl's automated discovery.

### Firecrawl Tool Reference

Once connected, these are the key Firecrawl MCP tools you'll use:

| Tool | Purpose | When to use |
|------|---------|-------------|
| `mcp__firecrawl__scrape` | Scrape a single URL — returns full page content, HTML, metadata | Phase 1: scraping client site pages. Phase 2: deep-scraping competitor sites |
| `mcp__firecrawl__map` | Discover all URLs on a domain — returns the full site architecture | Phase 1: mapping client's site structure |
| `mcp__firecrawl__search` | Search the web for relevant pages/companies | Phase 2: finding competitors in the niche |

---

## PHASE 1: Client Brand Extraction

Before anything else, extract everything from the client's existing website.

**Using Firecrawl (or WebFetch as fallback), scrape the client's current site and extract:**

1. **Logo** — Find and download their logo image(s). Check `<img>` tags in header/nav, favicon, and Open Graph images.
2. **Brand colors** — Extract from CSS: primary, secondary, accent colors. Check inline styles, stylesheets, and CSS custom properties.
3. **Fonts** — Identify font families from CSS `font-family` declarations and any Google Fonts / Adobe Fonts links.
4. **Tone of voice** — Analyze homepage copy. Formal, casual, playful, authoritative?
5. **Key messaging** — Headline, tagline, value proposition.
6. **Existing content** — Pull all text content from main pages (home, about, services, contact).
7. **Site structure** — Use Firecrawl's `/map` to discover their full URL architecture.

**Save output as:** `research/01-client-brand.md`

Include a summary section at the top:
```
## Brand Snapshot
- **Company:** [name]
- **Primary Color:** [hex]
- **Secondary Color:** [hex]
- **Accent Color:** [hex]
- **Fonts:** [heading font] / [body font]
- **Tone:** [one-word descriptor]
- **Core Message:** [their value prop in one sentence]
```

For a full example of what this output should look like, see `examples/sample-brand-snapshot.md`.

---

## PHASE 2: Competitive Niche Analysis

Research the client's niche to understand what "top 10%" looks like.

**Step 1 — Find the top 10 competitors:**
Use Firecrawl's search to find leading companies in the same niche/industry.
Evaluate each against these criteria (score 1-10):

| Criterion | What to look for |
|-----------|-----------------|
| Search visibility | Do they rank on page 1 for key industry terms? |
| Review quality | Google reviews, Trustpilot, G2 — 4.5+ stars? |
| Visual design | Modern, professional, not template-looking? |
| Mobile responsive | Clean on mobile, not just "it works"? |
| Content depth | Real copy or placeholder garbage? |
| Social proof | Testimonials, logos, case studies visible? |
| CTA strategy | Clear next step for the visitor? |
| Page speed | Fast load, no layout shift? |

**Step 2 — Deep scrape the top 5:**
For each of the top 5 scoring sites, use Firecrawl to scrape and extract:

- **Visual identity** — colors (hex), typography, photography style, design aesthetic
- **Content strategy** — headline formula, CTA copy, value prop structure, word count
- **Site architecture** — number of pages, nav structure, depth
- **Conversion strategy** — primary CTA, lead capture method, social proof placement

**Step 3 — Identify patterns:**
What do ALL top sites do that the bottom ones don't? Find the 3-5 patterns
that separate elite from average.

**Save output as:** `research/02-competitor-analysis.md`

Include a comparison table and a clear "Patterns of the Top 10%" section.

---

## PHASE 3: Competitive Analysis Report (PDF-Ready HTML)

This is a **client-facing deliverable** — a polished, print-ready HTML report.

**Build it as a beautiful HTML page** (not markdown) styled for printing to PDF.

For the exact HTML/CSS reference, see `references/process-overview.html` — this is the design
language to follow: warm paper tones, Instrument Serif + DM Sans, subtle grain texture, elegant
cards with accent-colored left borders, flow connectors between phases, print-ready with
`@media print` rules.

**The report must include:**

1. **Cover section** — Report title, client name, date, "Competitive Analysis" badge
2. **Executive summary** — 3-4 sentence overview of findings
3. **Competitor profiles** — For each of the top 5:
   - Company name and logo (downloaded and embedded or linked)
   - Brand colors shown as visual swatches
   - Key strengths and weaknesses
   - Score breakdown across the 8 criteria
4. **Comparison table** — All 5 competitors scored side-by-side
5. **SEO landscape** — Keyword opportunities, gaps, and recommendations
6. **Patterns of the top 10%** — The 3-5 things all winning sites do
7. **Recommended design direction** — Colors, typography, structure, and animation recommendations
   backed by competitor data

**Save as:** `competitive-analysis.html` in the project root

**Design specs (matching the reference):**
- A4-formatted for clean PDF export (`@media print` rules)
- `Instrument Serif` for headings, `DM Sans` for body
- Warm paper background (`#f6f4f0`), terracotta accent (`#c45d3e`)
- Grain overlay via SVG filter
- Cards with 4px accent left border, `#fffefa` background, subtle shadow on hover
- Phase numbers large and faded, titles in serif
- Tags in pill-shaped badges below each section
- Flow connectors (dashed SVG lines) between sections
- Responsive with mobile breakpoint at 640px
- No JavaScript — pure HTML + CSS

---

## PHASE 4: Build Brief & Approval

Combine brand extraction + competitor analysis into a Website Build Brief.

**The brief must include:**

### Design Direction
- Recommended color palette — keep client's brand colors but refine based on competitor analysis
- Typography pairing — heading + body font recommendation
- Photography/asset style guide
- Animation recommendations (scroll-triggered effects, hover states, parallax)
- What to AVOID (things competitors do badly)

### Site Architecture
- Exact pages to build with the purpose of each
- Navigation structure
- Content hierarchy per page
- CTA strategy (primary + secondary per page)

### Content Framework
- Homepage headline — provide 3 options using proven formulas from top competitors
- Value proposition structure
- Section-by-section copy direction
- SEO keyword targets (based on what top competitors rank for)

### Conversion Playbook
- Primary conversion goal
- Lead capture strategy
- Social proof plan (what to include and where)
- Trust signal checklist

**Save output as:** `research/03-build-brief.md`

### HARD STOP — APPROVAL CHECKPOINT

**Do not proceed to the build until the user explicitly approves the brief.**
Present the brief, highlight the key decisions, and ask: "Ready to build?"

This checkpoint exists because once the build starts, major direction changes are expensive.
The user should review and reshape the plan here — not during the build.

---

## PHASE 5: Build the Website

Using the Build Brief, create the website.

### Tech Stack
- **HTML, CSS, JavaScript** — no frameworks (keeps it portable and fast)
- **GSAP + ScrollTrigger** — for all scroll animations
- **Mobile-first responsive design**
- **Semantic HTML5** — proper heading hierarchy, meta tags, Open Graph, schema markup

### Visual Requirements
- Hero section designed for a scroll-triggered 3D asset (leave a clearly marked placeholder
  with exact dimensions and comment: `<!-- 3D SCROLL ASSET HERE -->`)
- Scroll-triggered animations on every section transition
- Parallax depth on key visual elements
- Premium micro-interactions on buttons, cards, and nav
- Dark/light sections for visual rhythm
- Smooth, cinematic feel — Apple/Stripe quality

### Structure
Follow the architecture from the Build Brief. Every page must include:
- Proper `<title>` and meta description
- Single H1, logical H2/H3 hierarchy
- Alt text placeholders on all images
- Schema markup for the business type

### Performance Targets
- Lighthouse 90+ on all metrics
- Lazy load all images and videos
- `prefers-reduced-motion` support
- `will-change` hints on animated elements
- No render-blocking resources

### Code Quality
- Clean, commented code
- Logical file structure
- README.md with deployment instructions (Vercel/Netlify)

---

## PHASE 6: Quality Audit

Run a final check before handoff.

### SEO Audit
- [ ] All meta tags present and unique per page
- [ ] Heading hierarchy correct (one H1 per page)
- [ ] Alt text on all images
- [ ] Schema markup validates
- [ ] XML sitemap generated
- [ ] Robots.txt present
- [ ] Open Graph tags set

### Accessibility Audit
- [ ] Color contrast ratios pass WCAG AA
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] `prefers-reduced-motion` respected
- [ ] Semantic HTML used throughout

### Performance Audit
- [ ] Images optimized and lazy loaded
- [ ] No render-blocking CSS/JS
- [ ] GSAP loaded efficiently
- [ ] Animations don't cause layout shift

### Client-Ready Checklist
- [ ] All placeholder content clearly marked
- [ ] 3D asset placeholder clearly marked
- [ ] Forms have action endpoints noted
- [ ] Favicon set
- [ ] OG images set
- [ ] 404 page exists
- [ ] README includes deployment steps
- [ ] Project deployed to preview

**Save audit as:** `research/04-quality-audit.md`

Fix anything that fails before declaring the build complete.

---

## OUTPUT SUMMARY

When complete, the project directory should contain:

```
project/
├── research/
│   ├── 01-client-brand.md         # Brand extraction
│   ├── 02-competitor-analysis.md  # Niche research
│   ├── 03-build-brief.md          # Master build document
│   └── 04-quality-audit.md        # Final audit results
├── competitive-analysis.html      # PDF-ready client deliverable
├── site/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── ...
└── README.md
```

---

## IMPORTANT RULES

1. **Always scrape the client's existing site first.** Never start from scratch when they already have brand assets online.
2. **Save research at every phase.** Each file is a deliverable the user can share with the client.
3. **The competitive analysis report is a sales tool.** Format it as something impressive enough to email to a cold prospect or hand to a client in a meeting. Use the design reference in `references/process-overview.html` as your style guide.
4. **Leave clear 3D asset placeholders.** The user will generate scroll-stop video content separately (using the Image Generator skill) and drop it in.
5. **Be opinionated about design.** Pick specific colors, specific fonts, specific animations. Justify each choice with competitor data.
6. **The approval checkpoint is real.** Do not skip Phase 4's hard stop. The user must approve before you build.
7. **Speed matters.** The whole process should feel fast and automated, not like a consulting engagement.
