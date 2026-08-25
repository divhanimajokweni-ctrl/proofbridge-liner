---
name: pptx
metadata:
  author: AM
  version: "1.0"
description: "Three routes to a .pptx: new deck (gated pptxgenjs flow with research + image search), build from a user template (inherit its design system), or in-place edits (python-pptx / raw OOXML)."
---

# PPT Creation, Editing, and Analysis

## Overview

A user may ask you to create, edit, or analyze a `.pptx` file. You produce `.pptx` **directly** via pptxgenjs — no HTML intermediate step.

- **New deck from scratch** → follow **Route 1 — Creating a New Presentation** (five stages: clarify → research → plan/outline → build → deliver).
- **Template / brand PPTX as structure to fill** → **Route 2 — Creating FROM a user-provided template**.
- **Edit an existing deck** → **Route 3 — Editing an existing PowerPoint**.

**Language convention:** the deck's content language follows the user. All user-facing copy (Gate 1 widget options, Gate 2 outline table, completion summary) is written in the user's language — the templates in this document define structure, not language.

## Reading and analyzing content

### Text extraction

```bash
python -m markitdown path-to-file.pptx
```

### Raw XML access

```
python {skill_dir}/ooxml/scripts/unpack.py <office_file> <output_dir>
python {skill_dir}/ooxml/scripts/validate.py --original <office_file> [-v] <output_dir>
python {skill_dir}/ooxml/scripts/pack.py <output_dir> <output_file>   # add --force to overwrite
```

| Path | Contents |
|------|----------|
| `ppt/presentation.xml` | Main metadata and slide references |
| `ppt/slides/slide{N}.xml` | Per-slide content |
| `ppt/notesSlides/notesSlide{N}.xml` | Speaker notes |
| `ppt/slideLayouts/` | Layout templates |
| `ppt/slideMasters/` | Master slide templates |
| `ppt/theme/` | Theme and styling |
| `ppt/media/` | Images and other media |

---

# Part 1 · Slide Design Best Practices

In one sentence: **don't make boring slides.** Bullet points on a white background are forgettable.

But "not boring" is not "flashy." The goal is a deck that looks **ready to use in real life** — the kind you could drop into a real meeting, class, or client pitch without editing.

## 1. Decide three things before you start

**① Pick a content-informed color palette**
The palette should feel designed *for this topic*. A good test: if you could drop your colors into a completely unrelated deck and it would still "work," your choices aren't specific enough. For a deck about Changsha, "chili red + warm gold + deep ink" beats a generic blue.

**② Dominance, not equality**
One color should dominate 60–70% of the visual weight, supported by 1–2 secondary tones and one sharp accent. **Never give all colors equal weight.**

**③ Dark/light contrast + a visual motif**

- "Sandwich" structure: **dark backgrounds** for the title and closing slides, **light backgrounds** for content slides. Or commit to dark throughout for a premium feel.
- Pick **one** signature motif and repeat it on every slide: rounded image frames, icons/numbers/single characters inside colored circles, etc.
- ⚠️ **Do NOT** use a "color bar / accent stripe / sidebar strip" as your motif — that's a hallmark of AI-generated slides (see the avoid list).

## 2. Color palette reference (don't default to blue)

**Prefer deriving your own topic-specific palette** (per §1 ① — content-informed colors beat generic ones). The table below is **inspiration, not a menu**: it illustrates the dominance + contrast principle. Feel free to invent other palettes that fit your topic — or, when the topic is generic or you want a safe start, pick a row directly.

| Theme              | Primary               | Secondary             | Accent              |
| ------------------ | --------------------- | --------------------- | ------------------- |
| Midnight Executive | `1E2761` navy       | `CADCFC` ice blue   | `FFFFFF` white    |
| Forest & Moss      | `2C5F2D` forest     | `97BC62` moss       | `F5F5F5` cream    |
| Coral Energy       | `F96167` coral      | `F9E795` gold       | `2F3C7E` navy     |
| Warm Terracotta    | `B85042` terracotta | `E7E8D1` sand       | `A7BEAE` sage     |
| Ocean Gradient     | `065A82` deep blue  | `1C7293` teal       | `21295C` midnight |
| Charcoal Minimal   | `36454F` charcoal   | `F2F2F2` off-white  | `212121` black    |
| Teal Trust         | `028090` teal       | `00A896` seafoam    | `02C39A` mint     |
| Berry & Cream      | `6D2E46` berry      | `A26769` dusty rose | `ECE2D0` cream    |
| Sage Calm          | `84B59F` sage       | `69A297` eucalyptus | `50808E` slate    |
| Cherry Bold        | `990011` cherry     | `FCF6F5` off-white  | `2F3C7E` navy     |

## 3. Layout for each slide

**Every slide needs a visual element** — image, chart, icon, or shape. Text-only slides are forgettable.

**Layout options (vary them across slides):**

- Two columns (text left, illustration/figure right)
- Icon + text rows (icon in a colored circle, bold header, description below)
- 2×2 or 2×3 grid (image on one side, grid of content blocks on the other)
- Half-bleed image (full left/right side) with content overlay

**Data display — numbers must "grow shapes":**

Whenever a slide contains **≥3 comparable numbers**, plain text listing is forbidden — they MUST be mapped to one of the following native-shape constructs (`addShape('rect'|'roundRect'|'ellipse'|'line')` + text; must stand on their own without addChart):

- **hbar group** — horizontal bars with length ∝ value, label at the left end, value inside/at the end of the bar; best for 3–6 item comparisons (population, mileage, output)
- **percent bar** — one base bar + colored segments filled by share + endpoint percentage; for shares / attainment rates (2–3 segments)
- **big-number badge grid** — numbers at 28–44pt + small unit text + label below, arranged as a card grid; for at-a-glance KPI pages
- **dot scale** — a 10×10 dot field colored by proportion; for "Y out of every X people" ratios
- **timeline axis** — horizontal axis + alternating nodes above/below (year badge + event phrase + 1 detail sentence); for ≥5 time points
- **mirrored comparison bars** — left/right mirrored horizontal bars (before/after, two countries, two eras) with a dimension-label gutter in the middle
- **pyramid** — 3–4 stacked trapezoid tiers + tier labels; for social structures / priorities
- **flow chain** — node capsules + arrow connectors, nodes may contain mini numbers; for institutional / process chains
- **matrix grid** — 2×2 or 3×3 colored cells + axis labels; for classification positioning

Rules:
- Construct colors follow the palette (same category same color; larger value → darker color / longer bar), and keep the three base forms: Large stat callouts (60–72pt), Comparison columns, Timeline/process flow
- At the brief stage (Stage 3), assign the 1–2 constructs to be used via `visual_form` for every data-bearing slide; stats/overview pages default to ≥2 constructs
- `addChart` is still for true coordinate charts (bar/line/pie/scatter); constructs are for embedded information graphics — the two are complementary

**Visual polish:**

- Small colored circle + icon next to section headers
- Italic accent text for key stats or taglines

## 4. Typography

**Key insight:** the font names you write into the `.pptx` are rendered by the **user's PowerPoint**, not by your build environment. If you preview via LibreOffice, it substitutes fonts it doesn't have — and some substitutes have different character widths, so the preview's "overflow / fits" can disagree with the real deck.

- **Safe fonts** (render true-to-width in preview *and* ship with Office): **Arial, Calibri, Cambria, Times New Roman, Courier New, Bookman Old Style, Century Schoolbook**. Use these for body text and anything where fit matters.
- **Headers with personality at zero risk**: pair a safe serif header (Cambria / Bookman Old Style / Century Schoolbook) with a safe sans body (Calibri / Arial) — contrast without losing reliable overflow checks.
- **Preview-unreliable fonts** (substitute has different widths — overflow checks can be wrong): Georgia, Trebuchet MS, Impact, Arial Black, Garamond, Consolas, Palatino Linotype, Calibri Light. Fine for titles/accents with ~10% slack; don't trust the preview's apparent fit.
- **Never default to Aptos** (Office's post-2023 default) — no metric-compatible substitute in the preview environment, and missing from older Office installs, so it's unreliable on both ends.

| Element        | Size           |
| -------------- | -------------- |
| Slide title    | 36–44pt bold  |
| Section header | 20–24pt bold  |
| Body text      | 14–16pt       |
| Captions       | 10–12pt muted |

> **CJK note:** for Chinese/Japanese/Korean text, use a widely available font like **Microsoft YaHei** (present on all Windows, has a Mac substitute). But python-pptx / pptxgenjs set only the Latin face `<a:latin>` by default; for previews, installing **Noto Sans CJK SC** displays Chinese correctly — and since CJK glyphs are essentially full-width/monospaced, preview widths closely match YaHei, so overflow checks are fairly trustworthy.

## 5. Spacing

- Minimum margins **0.5"**
- **0.3–0.5"** between content blocks
- Leave breathing room — don't fill every inch

**Layout invariants (self-check before build; mechanically re-checked by audit_geometry.py before delivery):**

1. **Page clamp** — every shape/text box satisfies `x ≥ 0.15`, `y ≥ 0.15`, `x+w ≤ W-0.15`, `y+h ≤ H-0.15` (full-bleed images exempt, but they still may not exceed the page bounds)
2. **Header safety zone** — body content starts at `y ≥ 1.45` (the title band often reaches ≈1.34)
3. **Compute total width before dynamic layout** — for loop-generated chains/card groups: `total = Σw + gap×(n-1)`, start `x0 = MX + max(0,(IW-total)/2)`; if total > IW, narrow the units instead of forcing the layout
4. **Bottom safety line** — the lowest element satisfies `y+h ≤ 7.35` (page height 7.5)
5. **Zero tolerance for text-box overlap** — the bounding boxes of two text-bearing shapes must not overlap (overlap area >12% × the smaller one = FAIL). **Regardless of whether the current glyphs actually touch**: font substitution on the user's machine turns "close" into "truly colliding text"
6. **Font-substitution defense** — body text boxes (h≥0.45) uniformly add `fit:'shrink'` (writes normAutofit; PowerPoint/WPS auto-shrinks text instead of overflowing when fonts are substituted); reserve 10–15% height slack for critical text boxes

```js
// Defensive boilerplate (write at the top of generate.js together with the design tokens)
const clampX = (x, w) => Math.max(MX, Math.min(x, W - MX - w));   // page clamp
const safeY  = (y) => Math.max(1.45, y);                          // header safety zone
// Dynamic width centering (instead of naive accumulation):
const total = items.length * itemW + gap * (items.length - 1);
let px = MX + Math.max(0, (IW - total) / 2);
// Font-substitution defense: monkey-patch addText, body boxes get normAutofit automatically
const _addSlide = pptx.addSlide.bind(pptx);
pptx.addSlide = () => { const sl = _addSlide(); const _t = sl.addText.bind(sl);
  sl.addText = (t, o = {}) => { if (o && o.h >= 0.45 && !o.fit) o.fit = 'shrink'; return _t(t, o); }; return sl; };
```

## 6. Fonts

CJK fonts are required for Chinese documents (without them Chinese renders as boxes □). Environment font inventory: `assets/font_list.txt` (refresh with `fc-list > assets/font_list.txt`).

**CJK font principles:**

- Use **at most two Chinese families** per deck — one sans as the workhorse, plus at most one serif/handwriting face as accent.
- **Create hierarchy with weight, not by swapping fonts** — Noto Sans SC ships the full weight range; use bold for titles, regular for body.
- **Default to a sans (e.g. Noto Sans SC) for serious office / reporting decks**; reserve handwriting/Kai faces (e.g. LXGW WenKai) for covers, pull-quotes, or educational accents — never for body paragraphs.
- Always keep a CJK fallback (e.g. WenQuanYi Zen Hei) so missing glyphs never render as boxes □.

### Install fonts (portable)

**Linux server (recommended)** — the OS package manager installs Noto CJK etc. straight into
`/usr/share/fonts` where the manifest expects them:

```bash
sudo apt-get install -y fonts-noto-cjk fonts-noto-cjk-extra fonts-noto-color-emoji \
  fonts-dejavu fonts-liberation fonts-freefont-ttf
sudo apt-get install -y fonts-lxgw-wenkai || true   # optional
fc-cache -f
fc-list :lang=zh | head          # verify CJK coverage
```

**macOS:** `brew install --cask font-noto-sans-cjk-sc font-noto-serif-cjk-sc` (or drop TTFs
into `~/Library/Fonts`).

**CDN fallback** (per-file, if a package is unavailable): base
`https://z-cdn.chatglm.cn/office-skill/fonts/` — encode `[`/`]` as `%5B`/`%5D`. Note the CDN
has drifted; `chinese/NotoSansSC%5Bwght%5D.ttf` (variable, full CJK coverage) is the reliable
one. Prefer the OS package manager on servers.

## 7. Avoid list (sources of an "AI-generated" look)

- ❌ **Don't reuse the same layout on every slide** — vary between columns, cards, and callouts
- ❌ **Don't center body text** — left-align paragraphs and lists; center only titles
- ❌ **Make size contrast big enough** — titles need 36pt+ to stand out from 14–16pt body
- ❌ **Don't default to blue** — choose colors that reflect the topic
- ❌ **Don't mix spacing randomly** — pick 0.3" or 0.5" and use it consistently
- ❌ **Don't style one slide and leave the rest plain** — commit fully or keep it simple throughout
- ❌ **Don't create text-only slides** — add images/icons/charts/shapes
- ❌ **Mind text-box padding** — to align text with shapes/lines, set the text box `margin` to 0 (or offset the shape to compensate)
- ❌ **Don't use low contrast** — icons and text both need strong contrast against the background; avoid light-on-light or dark-on-dark
- 🚫 **Never add a decorative underline under titles** — a classic AI-slide tell; use whitespace or background color instead
- 🚫 **Never add decorative color bars / accent stripes** — including full-width header/footer bands, vertical sidebar strips, thin colored strips along a card edge, and "single-side borders" on rectangles. To set a card apart, use a **subtle background tint / shadow / icon**, not an edge stripe
- ❌ **Don't default to cream/beige backgrounds** — when unspecified, use white `FFFFFF` or your brand color; avoid warm-neutral defaults like `F5F5DC`, `FAF0E6`, `FAEBD7`, `FFF8E1`
- ❌ **Don't let text overflow its shape** — if it doesn't fit, reduce the font, split across slides, or enlarge the container; never leave content cut off or spilling out

## 8. QA (recommended)

**Content QA:** check for missing content, typos, wrong order; when using a template, grep for leftover placeholders (`xxx`, `lorem`, `TODO`, `[insert`, etc.).

Visual QA when needed: find and fix overlaps, overflow, misalignment. Find and fix those, then stop — don't chase pixel-level "perfection."

---

# Part 2 · pptxgenjs in Depth

pptxgenjs generates `.pptx` files in **JavaScript / Node.js**. Coordinates are in **inches**.

## Setup & basic structure

```bash
npm install -g pptxgenjs
```

```javascript
const pptxgen = require("pptxgenjs");

let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';   // or LAYOUT_16x10 / LAYOUT_4x3 / LAYOUT_WIDE
pres.author = 'Your Name';
pres.title  = 'Presentation Title';

let slide = pres.addSlide();
slide.addText("Hello World!", { x: 0.5, y: 0.5, fontSize: 36, color: "363636" });

pres.writeFile({ fileName: "Presentation.pptx" }).then(() => console.log("done"));
```

> ⚠️ pptxgenjs writes an **uncompressed ZIP** (with empty directory stubs), which bloats the file; its `compression: true` option has no effect. Recompress (rezip) the output once after writing.

## Layout dimensions

| Layout           | Size (inches)         |
| ---------------- | --------------------- |
| `LAYOUT_16x9`  | 10 × 5.625 (default) |
| `LAYOUT_16x10` | 10 × 6.25            |
| `LAYOUT_4x3`   | 10 × 7.5             |
| `LAYOUT_WIDE`  | 13.3 × 7.5           |

## Text & formatting

```javascript
// Basic text
slide.addText("Simple Text", {
  x: 1, y: 1, w: 8, h: 2, fontSize: 24, fontFace: "Arial",
  color: "363636", bold: true, align: "center", valign: "middle"
});

// Character spacing: use charSpacing (letterSpacing is silently ignored)
slide.addText("SPACED TEXT", { x: 1, y: 1, w: 8, h: 1, charSpacing: 6 });

// Rich text array (mixed styles in one paragraph)
slide.addText([
  { text: "Bold ",   options: { bold: true } },
  { text: "Italic ", options: { italic: true } }
], { x: 1, y: 3, w: 8, h: 1 });

// Multi-line (each line needs breakLine: true; the last may omit it)
slide.addText([
  { text: "Line 1", options: { breakLine: true } },
  { text: "Line 2", options: { breakLine: true } },
  { text: "Line 3" }
], { x: 0.5, y: 0.5, w: 8, h: 2 });

// Text-box padding: set margin: 0 to align with shapes/lines
slide.addText("Title", { x: 0.5, y: 0.3, w: 9, h: 0.6, margin: 0 });
```

## Lists & bullets

```javascript
// ✅ Correct: multiple bullets
slide.addText([
  { text: "First item",  options: { bullet: true, breakLine: true } },
  { text: "Second item", options: { bullet: true, breakLine: true } },
  { text: "Third item",  options: { bullet: true } }
], { x: 0.5, y: 0.5, w: 8, h: 3 });

// ❌ Wrong: never use unicode bullets (creates double bullets)
slide.addText("• First item", { ... });

// Sub-items & numbered lists
{ text: "Sub-item", options: { bullet: true, indentLevel: 1 } }
{ text: "First",    options: { bullet: { type: "number" }, breakLine: true } }
```

### Make bullets look good (default `bullet: true` looks amateurish)

The bare `bullet: true` renders a big dot with a **huge gap** to the text (pptxgenjs defaults to a ~27pt hanging indent) — a classic AI-list tell. Always style bullets:

```javascript
// bullet is a PARAGRAPH property — put it in EACH item's options, not top-level.
// A top-level `bullet` only styles the first paragraph; the rest get <a:buNone/> (no dot).
const bu = () => ({ code: "2022", indent: 14 });  // factory: fresh object per item (pptxgenjs mutates in place)
slide.addText([
  { text: "First item",  options: { bullet: bu(), breakLine: true } },
  { text: "Second item", options: { bullet: bu(), breakLine: true } },
  { text: "Third item",  options: { bullet: bu() } }
], {
  x: 0.5, y: 0.5, w: 8, h: 3, fontSize: 15, color: "334155",
  paraSpaceAfter: 8,   // item spacing (never lineSpacing)
  margin: 0,           // align glyph to x
});
```

- **`indent` matters most** — cut the default ~27pt to 10–16pt to kill the "floating dot" (`indent` = glyph→text gap in pt; try 10–16).
- **Refined glyphs** — `2022`(•), `25AA`(▪), `2013`(–), `25B8`(▸) read more designed than a fat dot; mute the color (e.g. `94A3B8`) to keep it subtle.
- **For short card lists** (3–4 items), skip native bullets: draw a small colored dot/square shape + a text box per row for full control.

## Shapes

```javascript
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 0.8, w: 1.5, h: 3.0,
  fill: { color: "FF0000" }, line: { color: "000000", width: 2 }
});

slide.addShape(pres.shapes.OVAL, { x: 4, y: 1, w: 2, h: 2, fill: { color: "0000FF" } });

slide.addShape(pres.shapes.LINE, {
  x: 1, y: 3, w: 5, h: 0, line: { color: "FF0000", width: 3, dashType: "dash" }
});

// Transparency
slide.addShape(pres.shapes.RECTANGLE, {
  x: 1, y: 1, w: 3, h: 2, fill: { color: "0088CC", transparency: 50 }
});

// Rounded rectangle (rectRadius works only on ROUNDED_RECTANGLE, not RECTANGLE)
slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 1, y: 1, w: 3, h: 2, fill: { color: "FFFFFF" }, rectRadius: 0.1
});

// Shadow (to make a card stand out — use this, not an edge stripe)
slide.addShape(pres.shapes.RECTANGLE, {
  x: 1, y: 1, w: 3, h: 2, fill: { color: "FFFFFF" },
  shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.15 }
});
```

**Shadow options:**

| Property    | Range / notes                                                                           |
| ----------- | --------------------------------------------------------------------------------------- |
| `type`    | `"outer"` / `"inner"`                                                               |
| `color`   | 6-char hex (no`#`, no 8-char hex)                                                     |
| `blur`    | 0–100 pt                                                                               |
| `offset`  | 0–200 pt,**must be non-negative** (negatives corrupt the file)                   |
| `angle`   | 0–359°, clockwise from 3 o'clock (45 = bottom-right, 135 = bottom-left, 270 = upward) |
| `opacity` | 0.0–1.0 (use this for transparency, never encode it in`color`)                       |

> To cast a shadow upward (e.g., a card near the bottom), use `angle: 270` + a positive offset — **not** a negative offset.
> Gradient fills are not natively supported — use a gradient image as the background instead.

## Images

```javascript
// Three sources
slide.addImage({ path: "images/photo.jpg", x: 1, y: 1, w: 5, h: 3 });            // local
slide.addImage({ path: "https://example.com/img.jpg", x: 1, y: 1, w: 5, h: 3 }); // URL
slide.addImage({ data: "image/png;base64,iVBORw0KGgo...", x: 1, y: 1, w: 5, h: 3 }); // base64 (faster)

// Options
slide.addImage({
  path: "image.png", x: 1, y: 1, w: 5, h: 3,
  rotate: 45, rounding: true /*circular crop*/, transparency: 50,
  flipH: true, flipV: false, altText: "Description",
  hyperlink: { url: "https://example.com" }
});

// Sizing modes (⚠️ pptxgenjs sizing is NOT written into the XML —
// it generates <a:srcRect l="0" r="0" t="0" b="0"/> + <a:stretch/>, i.e. "zero crop + forced stretch";
// both 'cover' and 'contain' drag the image to the placement box's ratio → distortion.)
{ sizing: { type: 'cover',   w: 4, h: 3 } }  // ❌ forbidden — no crop, direct stretch
{ sizing: { type: 'contain', w: 4, h: 3 } }  // ❌ equally unreliable
{ sizing: { type: 'crop', x: 0.5, y: 0.5, w: 2, h: 2 } } // ❌ srcRect likewise not written

// ✅ Correct: pre-crop before embedding; addImage with a box matching the image's aspect ratio (no sizing)
slide.addImage({ path: "assets/cover_c.jpg", x: 1, y: 1, w: 5.1, h: 3.4 }); // image and box share the ratio

// Pre-crop pipeline (mandatory): use {skill_dir}/scripts/precrop_images.py
// 1. Write precrop_jobs.json in the project dir: [{"src":"assets/cover.jpg","box_w":5.1,"box_h":3.4,"focal":0.5}, ...]
//    (box_w/box_h = placement box size in inches; focal = vertical crop focus 0=top / 0.5=center / 1=bottom)
// 2. python3 {skill_dir}/scripts/precrop_images.py precrop_jobs.json
//    → outputs *_c.jpg (EXIF-normalized + focal framing + low-res Lanczos upscale) and prints a per-image ratio check; all must be OK
// 3. generate.js references *_c.jpg with the box ratio strictly matching the image;
//    extreme aspect ratios (>3:1 or <1:3) must set focal explicitly in the jobs file

// Compute size from aspect ratio and center it
const origW = 1978, origH = 923, maxH = 3.0;
const calcW = maxH * (origW / origH);
const centerX = (10 - calcW) / 2;
slide.addImage({ path: "image.png", x: centerX, y: 1.2, w: calcW, h: maxH });
```

Supports PNG / JPG / GIF / SVG (SVG works in modern PowerPoint / Microsoft 365).

## Icons (react-icons → rasterized PNG)

```bash
npm install -g react-icons react react-dom sharp
```

```javascript
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { FaCheckCircle, FaChartLine } = require("react-icons/fa");

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

const iconData = await iconToBase64Png(FaCheckCircle, "#4472C4", 256);
slide.addImage({ data: iconData, x: 1, y: 1, w: 0.5, h: 0.5 });
```

Icon sets: `react-icons/fa` (Font Awesome), `/md` (Material), `/hi` (Heroicons), `/bi` (Bootstrap). Use size ≥ 256 for crisp icons (size controls rasterization resolution; display size is set by w/h).

## Backgrounds

```javascript
slide.background = { color: "F1F1F1" };                        // solid
slide.background = { color: "FF3399", transparency: 50 };      // with transparency
slide.background = { path: "https://example.com/bg.jpg" };     // image URL
slide.background = { data: "image/png;base64,iVBORw0KGgo..." };// image base64
```

## Tables

```javascript
slide.addTable([
  ["Header 1", "Header 2"],
  ["Cell 1", "Cell 2"]
], { x: 1, y: 1, w: 8, h: 2, border: { pt: 1, color: "999999" }, fill: { color: "F1F1F1" } });

// Merged cells
let tableData = [
  [{ text: "Header", options: { fill: { color: "6699CC" }, color: "FFFFFF", bold: true } }, "Cell"],
  [{ text: "Merged", options: { colspan: 2 } }]
];
slide.addTable(tableData, { x: 1, y: 3.5, w: 8, colW: [4, 4] });
```

## Charts

**Principle: keep charts native and editable.** Choose your approach by what PowerPoint can represent, not by what's quickest to code:

1. **Library-native** (bar/column/line/pie/area/scatter/bubble/radar/doughnut/combo) → use `addChart()`; **never** render to an image.
2. **PowerPoint-native but not exposed by the library** (trendlines, error bars) → stay native: compute the extra series yourself (e.g., a regression line as a second LINE/SCATTER series) or inject the OOXML. **Don't** fall back to a matplotlib PNG — you lose editability.
3. **Genuinely no native representation** (Sankey, network/graph, chord, complex statistical plots) → only here render to an image and insert via `addImage()`.

```javascript
// Bar
slide.addChart(pres.charts.BAR, [{
  name: "Sales", labels: ["Q1","Q2","Q3","Q4"], values: [4500,5500,6200,7100]
}], { x: 0.5, y: 0.6, w: 6, h: 3, barDir: 'col', showTitle: true, title: 'Quarterly Sales' });

// Line
slide.addChart(pres.charts.LINE, [{
  name: "Temp", labels: ["Jan","Feb","Mar"], values: [32,35,42]
}], { x: 0.5, y: 2.5, w: 6, h: 2.5, lineSize: 3, lineSmooth: true });

// Pie
slide.addChart(pres.charts.PIE, [{
  name: "Share", labels: ["A","B","Other"], values: [35,45,20]
}], { x: 6.5, y: 1, w: 3, h: 3, showPercent: true });
```

**Make charts look modern (defaults look dated):**

```javascript
slide.addChart(pres.charts.BAR, chartData, {
  x: 0.5, y: 1, w: 9, h: 4, barDir: "col",
  chartColors: ["0D9488", "14B8A6", "5EEAD4"],            // match your palette
  chartArea: { fill: { color: "FFFFFF" }, roundedCorners: true },
  catAxisLabelColor: "64748B", valAxisLabelColor: "64748B", // muted axis labels
  valGridLine: { color: "E2E8F0", size: 0.5 },             // subtle grid, value axis only
  catGridLine: { style: "none" },
  showValue: true, dataLabelPosition: "outEnd", dataLabelColor: "1E293B", // data labels
  showLegend: false,                                       // hide legend for single series
});
```

## Slide masters & speaker notes

```javascript
// Master
pres.defineSlideMaster({
  title: 'TITLE_SLIDE', background: { color: '283A5E' },
  objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 1, y: 2, w: 8, h: 2 } } }]
});
let titleSlide = pres.addSlide({ masterName: "TITLE_SLIDE" });
titleSlide.addText("My Title", { placeholder: "title" });

// Speaker notes (visible only in Presenter View, not on the slide)
slide.addNotes("Open with the FY25 revenue headline; pause after the number. If asked about the Q3 dip: supply chain, resolved in Q4.");
```

## Common pitfalls (file corruption / visual bugs / AI look)

1. **Never use `#` with hex** — corrupts the file: `color: "FF0000"` ✅ / `"#FF0000"` ❌
2. **Never encode opacity in hex** — 8-char hex (e.g., `"00000020"`) corrupts the file; use the `opacity` property
3. **Use `bullet: true`** — never unicode `•` (double bullets)
4. **Use `breakLine: true`** between array items
5. **Avoid `lineSpacing` with bullets** (excessive gaps) — use `paraSpaceAfter` instead
6. **Fresh instance per presentation** — don't reuse the `pptxgen()` object
7. **Don't reuse option objects across calls** — pptxgenjs **mutates objects in place** (e.g., converts shadow values to EMU), so sharing corrupts the second shape. Use a factory that returns a fresh object:
   ```javascript
   const makeShadow = () => ({ type:"outer", blur:6, offset:2, color:"000000", opacity:0.15 });
   slide.addShape(pres.shapes.RECTANGLE, { shadow: makeShadow(), ... }); // ✅
   ```
8. **Don't add edge accent bars to cards** — use a `fill` tint or `shadow` to set them apart

## Quick reference

- **Shapes**: RECTANGLE / OVAL / LINE / ROUNDED_RECTANGLE
- **Charts**: BAR / COLUMN / LINE / AREA / PIE / DOUGHNUT / SCATTER / BUBBLE / RADAR / combo (array of `{type, data, options}`)
- **Alignment**: `"left"` / `"center"` / `"right"`
- **Data-label position**: `"outEnd"` / `"inEnd"` / `"center"`

---

# Route 1 — Creating a New Presentation

**Routing rule for uploaded PPTX:**
- User wants to **modify the PPTX itself** (edit text / swap images / delete slides / adjust formatting) → **Route 3 — Editing an existing PowerPoint**.
- User wants to **use the PPTX as template/style/structure reference to generate NEW content** → stay here, set `reference_constraint = template_fill`, extract the style and lock it; OR if they want a full template-inheritance build, use **Route 2 — Creating FROM a user-provided template**.

You produce beautiful, content-rich decks **directly** with pptxgenjs. You operate in five strict stages. Do NOT skip or reorder stages.

═══════════════════════════════════════════════════════════════════════
STAGE 1 — CLARIFY (collect mandatory inputs + lock visual direction)
═══════════════════════════════════════════════════════════════════════

### Step 0 — Task dimension recognition (run BEFORE any user interaction)

Determine three dimensions: `content_source` (new_generation / source_conversion / mixed), `reference_constraint` (none / style_reference / template_fill / screenshot_replication), `usage_scenario` (quick_delivery / formal_report / courseware / proposal / data_report / tech_analysis / academic_defense / general).

`usage_scenario` detection priority: explicit statement by the user ("report to my boss" → formal_report / "training courseware" → courseware / "pitch deck" → proposal) > audience (leadership → formal / clients & investors → proposal / trainees → courseware) > content signals (KPI/finance → data_report / architecture & tech selection → tech_analysis / thesis & research → academic) > volume (<50 chars and no attachment → quick_delivery / >100 chars or attachments → formal_report); none matched → general.

**Scenario-driven defaults (the user's choices in show_widget override ALL defaults below):**
- `quick_delivery` → speaker-led / 6-10 pages; show_widget asks only topic + style
- `formal_report` / `courseware` / `academic_defense` → reading-first
- `proposal` → speaker-led; highest visual investment
- `data_report` → data-dense; charts first
- `tech_analysis` → reading-first; diagrams first

### Step 0b — Reference detection (run BEFORE asking any question)

Before `show_widget`, check uploads/prompt for a reference:

- **PPTX reference** ("use this template" / "follow this style" / "based on this"): unzip it (`{skill_dir}/ooxml/scripts/unpack.py`) and read colors and fonts from `ppt/theme/theme1.xml`; record into the design draft; `reference_constraint = template_fill`; **SKIP** palette/typography questions.
- No reference → ask normally.

### Step 1 — Ask the user via `show_widget` (Gate 1 · requirement confirmation)

**Gate 1 blocking policy (HIGHEST PRIORITY):**
- Blocking condition: the user confirms requirements in show_widget **AND has selected a style**; only then enter Stage 2
- Skip triggers: "just do it" / "don't ask" / "quick generate" / "skip" → do not send show_widget; proceed directly with scenario defaults
- If Gate 1 was skipped → the Stage 3 outline confirmation (Gate 2) degrades to non-blocking (rules in Step 3.2)
- This step handles requirement confirmation ONLY; outline confirmation (Gate 2) belongs to Stage 3 and never uses show_widget

**Ask only what is not already clear** — one `show_widget` form, typically 4–6 questions (fewer is better; for quick_delivery, topic + style swatches suffice; #7 is conditional and usually skipped). If the prompt already answers a dimension, adopt it silently instead of asking:

1. **Topic & purpose** — ask FIRST
2. **Target audience**
3. **Length** — 1–8 / 8–12 / 12+ pages (always offer a short option)
4. **Information density** — speaker-led / reading-first / data-dense (see table below)
5. **★ Style direction** — 2–3 「style swatches」 (single choice)
6. **Speaker notes** — none / short / full
7. **Content scope** — only when uploads exist and intent is unclear: materials only / may supplement with external research

**Density modes (option 4):**

| Mode | Target body text/page | Floor (audit) | Scenario |
|------|------------|-------------------|------|
| speaker-led | 120–180 CJK chars | 120 CJK / 70 words | live talk |
| reading-first | 220–320 CJK chars | 220 CJK / 130 words | standalone reading |
| data-dense | 300–450 CJK chars (chart numbers excluded) | 300 CJK / 175 words | data analysis |

> Non-CJK decks use the word floor. Audit counts characters/words per page code block in generate.js (headings and labels included); cover / section / closing pages are auto-exempt by the audit script.

**When to ask about content scope:** "convert this to a PPT" → stay faithful, don't ask; "based on / referencing this" → supplementing allowed, don't ask; no materials → don't ask, research allowed by default; materials present but fidelity unclear → ask.

**`show_widget` rules:**
- **Used ONLY for Gate 1 (Stage 1 requirement confirmation)**; Gate 2 outline confirmation uses a markdown table
- **At most one** widget per Stage 1 turn
- If all requirements are already clear from the prompt → style swatches alone are enough
- Style is **single-select**, **no pre-selection**
- The confirm button is always clickable (the platform injects `tg()` / `ok()`; do not write `<script>`)
- No body text after the widget

**Creative option construction:** every option must be a concrete creative direction fitting THIS topic (not a generic label). A finance report and a children's book never share the same option set.

### Style Sample UI Contract (style swatch spec)

Each card is a **16:9 miniature slide mood preview**:

```
┌─────────────────────────────────┐
│  Main title (user's topic, heading font)  │
│  Subtitle/keywords (body font/accent)     │
│  ┃██ ██ ██┃ ━━━ (abstract layout)│
├─────────────────────────────────┤
│ [A] Style name label                    │
└─────────────────────────────────┘
```

**Core rules:**
- The 3 directions differ in ALL of **palette, typographic temperament, spatial rhythm**
- Titles use the user's actual topic
- Colors are shown inside a layout context, never as a standalone palette
- User's choice → `style_sample_choice` → written into `slides_brief.design` at Stage 3
- ⛔ Invalid: pure gradient bars, isolated color dots, text-only descriptions, cards where the three factors are indistinguishable

═══════════════════════════════════════════════════════════════════════
STAGE 2 — RESEARCH (enough context for a sound outline)
═══════════════════════════════════════════════════════════════════════

**Purpose:** understand the topic well enough to plan the outline. Detailed per-slide content and image search happen AFTER Gate 2.

### 2a — Source digestion (when user provided materials)

Produce `source_digest`:

```json
{
  "key_sections": ["section summaries..."],
  "key_facts": ["verifiable facts with numbers/dates — verbatim"],
  "chart_candidates": ["data that could become a chart or diagram"],
  "available_assets": ["user-provided images/tables/logos"],
  "must_cover_points": ["critical content that MUST appear"],
  "image_direction": "likely image needs + search feasibility"
}
```

Preserve exact numbers, terminology, quotes.

**Data source attribution:** record sources for external statistics / third-party data; Stage 3 adds a footnote to the matching `task_brief` (e.g. "Source: National Bureau of Statistics, 2025"). The user's own internal data needs no attribution by default.

### 2b — External research (web_search)

**When to search:**
- `source_conversion` + "materials only" → SKIP
- `source_conversion` + "may supplement" → light background research
- `new_generation` → stop once you can support a 10–15 page outline

**No hard query limit.** Stop when the outline can be written. Batch in parallel:

```bash
z-ai function --name "web_search" --args '{"query": "...", "num": 3}'
z-ai function -n web_search -a '{"query": "...", "num": 3, "recency_days": 7}'
```

### 2c — Chart candidates (pptxgenjs native)

Chart tiers and implementation follow Part 2 `Charts` (native `addChart()` first → self-computed series for what can be simulated → Sankey/network graphs rendered as images). Also flag the four info-diagram opportunities: process / comparison / timeline / hierarchy. **Data honesty:** no fake KPIs / fake percentages without real data.

### 2d — Image availability (deck-level)

Assess user materials, image directions for the topic, search feasibility. **Do NOT run `image-search` at this stage.** Per-page `image_needed` / `image_source` are decided in Stage 3.1.

═══════════════════════════════════════════════════════════════════════
STAGE 3 — PLAN (narrative + slides_brief + outline gate + search)
═══════════════════════════════════════════════════════════════════════

### Step 3.0 — Narrative structure

Priority: **structure implied by user materials > explicit user instruction > model derivation > scenario inspiration frameworks** (e.g. proposal: problem → solution → evidence → differentiation → CTA; formal_report: background → findings → analysis → recommendations; courseware: hook → concept → example → practice — inspiration, not prescription).

Write a `narrative_goal` per page (its argumentative role, not a topic label):
- Bad: "introduce background" → "introduce data"
- Good: "build urgency with data" → "expose the root cause" → "propose the solution"

### Step 3.0b — Bind style to design tokens

`style_sample_choice` is the single source of visual truth. Derive tokens and write them into `slides_brief.json` under `design` (hex **without `#`**):

```json
"design": {
  "title": "...",
  "style_name": "...",
  "palette": {"background": "1E2761", "primary": "CADCFC", "accent": "FFFFFF"},
  "typography": {"heading": "Cambria", "body": "Calibri"},
  "reference": "..."
}
```

⛔ Never introduce a palette/typography that did not appear in the swatches.

### Step 3.1 — Write `slides_brief.json`

**Paths:** `work_dir = {workspace root}/{project name}/` (project name ≤10 CJK characters or a short ASCII slug, derived from the topic). **All commands below use the `{work_dir}` placeholder.**

```
{work_dir}/
├── slides_brief.json
├── generate.js          ← Stage 4
└── output.pptx          ← Stage 5
```

When many images are used, put them in `{work_dir}/assets/` and reference via relative paths in the generation script.

**Schema:**

```json
{
  "design": { "title": "...", "style_name": "...", "palette": {}, "typography": {}, "reference": "..." },
  "content_source": "new_generation|source_conversion|mixed",
  "usage_scenario": "...",
  "narrative_framework": "...",
  "language": "zh|en|bilingual",
  "density_mode": "speaker-led|reading-first|data-dense",
  "speaker_notes": "none|short|full",
  "slides": [
    {
      "title": "...",
      "narrative_goal": "argument role",
      "layout": "free-text layout description, e.g. left text + right full-bleed image",
      "visual_form": "data_chart|process_diagram|comparison|timeline|hero_image|text_focused|...",
      "image_needed": true,
      "image_source": "search|user_material|none",
      "task_brief": "Self-contained: exact copy, data, chart series, image URL if any."
    }
  ]
}
```

**Rules:**
- Array order = page order; `layout` is free text, not an enum
- Avoid the same `visual_form` on consecutive pages; never 3 consecutive pages with `image_needed: false`; the cover usually needs an image
- `task_brief` is self-contained: Stage 4 reads **only this file** to write code

### Step 3.2 — Outline confirmation (Gate 2)

⛔ **Gate 2 ALWAYS outputs the markdown outline table directly; using `show_widget` is forbidden** (`show_widget` is for Gate 1 requirement confirmation only).

After showing the markdown outline table, **STOP and wait** (unless skip logic applies):

```markdown
**PPT Outline · {Title}** ({N} pages · {density_mode} · {style_name})

| Page | Title | Key Content |
|------|-------|-------------|
| 1 | ... | — |
| 2 | ... | ① ... ② ... |

Narrative arc: {one-line arc}

📋 Outline above, {N} pages in total. Confirm to start generating — tell me any adjustments anytime.
```

**Gate 2 skip logic:**
- Gate 1 passed normally → Gate 2 blocks normally, wait for outline confirmation
- Gate 1 was skipped → Gate 2 **degrades to non-blocking**: show the outline and continue without waiting; if the user replies with changes, pause and adjust immediately
- User explicitly says "skip outline confirmation" / "don't need to see the outline" → Gate 2 is skipped too
- Structured content provided by the user (I. II. III. ...) is **SOURCE MATERIAL**, not a confirmed outline; Gate 2 still applies

⛔ Do NOT enter Stage 4 before approval (except the non-blocking display when Gate 1 was skipped). User changes the outline → update the brief → re-display → wait again.

### Step 3.2b — Supplementary research + Image search (after outline confirmation)

**Supplementary web_search:** when a page lacks facts/data/cases, search on demand and write into that page's `task_brief`.

**Image search** (`image_needed: true` and `image_source: search`):

```bash
# Standard invocation (--no-rank is mandatory, see below)
z-ai image-search --query "<natural-language sentence>" --count 3 --no-rank
# For overseas/English topics add --gl us; Chinese topics default to --gl cn, no flag needed
```

**Invocation discipline (ALL hard rules):**

- Queries must be **natural-language sentences**, not keyword lists
- **`--no-rank` is mandatory**: the service by default runs a Gemini caption pass over every returned image (a hidden VLM step that slows the search dramatically). Captions are useless for picking — select by metadata
- **`--count 3~5` is mandatory**: without it the service returns 10 images by default, wasting time
- **Output parsing:** the CLI prints results to stdout, but **the first few lines are run logs** — JSON starts at the first `{` character (redirect to a file and strip with a script); do not treat log lines as errors
- **≤2 concurrent calls per turn** (more triggers server-side 429 rate limiting); queue remaining queries for the next turn
- Give each Bash call a **90s timeout**; the CLI has no internal timeout — the outer layer is the only guard
- **Failure matrix** (diagnose before giving up):
  - `429 Too many requests` → `sleep 5`, retry that query once
  - `Unknown command "image-search"` → SDK too old; upgrade with `bun add -g z-ai-web-dev-sdk` (or `npm install -g z-ai-web-dev-sdk`) and retry
  - Timeout / empty results → retry once with an English query or `--gl us`
  - Still failing → switch that page to an info-diagram/chart; leaving a "plain text card page" is forbidden
- Call budget: ≤10 pages → max 6 calls; 11–20 pages → max 10; **reuse** returned URLs across pages
- **Image selection heuristics** (with `--no-rank` captions are empty; pick by metadata): prefer stock sources like Pexels/Unsplash → `original_width ≥ 800` → aspect ratio close to that page's placement box
- Write the best `results[].original_url` into that page's `task_brief` (the render stage reads only the brief; the URL must be inlined)
- **Fabricating URLs is forbidden**; local images must use relative paths
- After searching, **update and write back** `slides_brief.json`

═══════════════════════════════════════════════════════════════════════
STAGE 4 — BUILD (serial pptxgenjs script)
═══════════════════════════════════════════════════════════════════════

Single-model serial: read `slides_brief.json` → write one complete `generate.js`.

**Page markers (required by audit_content.py):** every page's code block must open with an `S{page_number}` comment marker — `// S{n} title` or `/* === S{n} title === */` (any other prefix like `P{n}` is NOT recognized and fails the content audit with zero pages found).

```javascript
const pptxgen = require("pptxgenjs");
let pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

const PALETTE = { bg: "1E2761", primary: "CADCFC", accent: "FFFFFF" };
const FONTS = { heading: "Cambria", body: "Calibri" };

// …build each page from task_brief / layout…

pres.writeFile({ fileName: "{work_dir}/output.pptx" });
```

**Rules:**
- Define `PALETTE` / `FONTS` at the top; reference them throughout
- All pages hang on the same `pres`; write in one pass by default (20+ pages may append in segments)
- **Every page's code block starts with a `// S{page_number} {title}` comment** (e.g. `// S4 From Myth to Empire`) — used by the content audit script to locate pages
- Content fidelity: every point/number in task_brief is a **minimum commitment** — only add, never drop; every body card carries ≥3 information points (1 claim + ≥2 details/numbers/examples)
- Prefer `addChart` for charts; use native-shape constructs for info graphics (see Part 1 §3 Data display)
- `sizing:{type:'cover'}` on images is **forbidden** (not written into the XML → stretched/distorted); images MUST go through the pre-crop pipeline `{skill_dir}/scripts/precrop_images.py` and then be placed in a ratio-matched box (see the Images section of Part 2)
- Hex without `#`; never reuse option objects that get mutated (use factories)
- Follow Part 1 design principles and Part 2 API / pitfalls

═══════════════════════════════════════════════════════════════════════
STAGE 5 — DELIVERY
═══════════════════════════════════════════════════════════════════════

### 5.0 — Content audit (mandatory; FAIL = no delivery)

```bash
python3 {skill_dir}/scripts/audit_content.py {work_dir}/generate.js {work_dir}/slides_brief.json
```

Checks two things: ① every page's text volume ≥ its density floor (CJK chars, or words for non-CJK decks; cover/section/closing pages auto-exempt); ② every number string and 「」/“”-quoted key phrase in `task_brief` is carried through (English proper nouns are WARN-only; alternative translations allowed). FAIL → back to Stage 4, add content and rerun until PASS before 5.1.

### 5.1 — Run

```bash
cd {workspace root} && NODE_PATH=$(npm root -g) node {work_dir}/generate.js
ls -lh {work_dir}/output.pptx
```

### 5.2 — Geometry audit (mandatory; FAIL = no delivery)

```bash
python3 {skill_dir}/scripts/audit_geometry.py {work_dir}/output.pptx
```

Unpacks the .pptx and checks every shape in the slide XML (an objective, font-independent audit):
① **Page bounds**: no sp/pic/graphicFrame may exceed the page (tolerance ±0.03in); ② **Text overlap**: two text-bearing shapes overlapping by >12% × the smaller one = FAIL (text-free cards/backgrounds don't participate — text over a card is legitimate layering).

It also catches "latent risks": bounding boxes that overlap without glyphs touching become real collisions after font substitution on the user's machine. FAIL → back to Stage 4, fix coordinates and rerun.

### 5.3 — Visual QA (mandatory)

```bash
cd {work_dir}
libreoffice --headless --convert-to pdf output.pptx
pdftoppm -png -r 55 output.pdf pg    # full-deck quick view
pdftoppm -png -r 120 -f N -l N output.pdf hiN   # hi-res re-check of changed/complex pages
```

Batch VLM QA (≤6 pages per batch): text overflow/clipping, element occlusion, garbled glyphs/boxes, image distortion/stretching, unbalanced layout.
**Iron rule: garbled/truncated/no-JSON VLM output = that batch is "unchecked" — rerun; treating it as passed is strictly forbidden.**
Where geometry PASSes but the VLM reports "tight/crowded", add spacing anyway (user-side fonts run wider).

### 5.4 — Deliver

```
send_file(title="{project name}", ext="pptx", filepath="{work_dir}/output.pptx")
```

### 5.5 — Completion summary

```markdown
✅ PPT generated!

**{Title}** · {N} pages · {style_name} style
File: {output.pptx path}

Next steps: tweak a page / add or remove pages / change style / local adjustments
```

> Content budget reminder: every content card ≥3 information points; ≥3 comparable numbers must be graphical (see Part 1 §3).

---

# Route 2 — Creating a Presentation FROM a User-Provided Template (.pptx)

Route here when the user supplies a .pptx and wants a NEW deck built on it. Working from a template, you can infer the deck's design system — its layouts, typography, spacing, colors, and recurring content patterns, including the rules embedded in the Slide Master — and apply those conventions consistently to new material. Two non-negotiables: study the template BEFORE writing any content, and verify AFTER building — most template failures come from skipping one of the two.

> **Template inheritance (mandatory)** — If the user provides an existing PPT, a corporate template, or a reference file, you **must** follow the "template inheritance" flow rather than recreating a look-alike from scratch:
>
> - Analyze fonts, color scheme, spacing, footers, page numbers, placeholders, and brand elements.
> - Build a mapping between source pages and new pages.
> - Inherit existing layouts as much as possible instead of recreating a new set.
> - Only modify elements that are allowed to be modified.
> - Preserve the original template's visual language unless the user asks for a redesign.
> - If no page in the original template can carry the target content, state the limitation explicitly and propose the closest alternative.

**1. Decide the mode — "use as template" hides two different jobs:**

| Mode                   | User signal                                                            | Build                                                                                    |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Clone & fill** | new outline or free structure — "make it this style" / "build an X on this template" | clone template pages and fill them; pick which pages to reuse by role and shape your outline around what the template offers |
| **Fill-in**      | new content maps ≈1:1 onto the template's pages (swap data / swap client)     | in-place replacement — Approach A of Route 3                                                                    |

Both modes edit the .pptx natively and output an editable PowerPoint — **never** route a template job through the from-scratch Route 1 build; a foreign page rendered next to the template's real pages is instantly visible and loses the theme. Clone & fill builds a new deck on the template; Fill-in is the lighter in-place path. Everything below applies to both.

**2. Study the template (before generating any content) — programmatic first, vision only to break ties:**
  • Inventory every text shape with python-pptx (recurse into GROUPs): position, size, font, current text length. The original text length is the budget ceiling — the **"Budget every shape"** rules of Route 3 apply verbatim. Collect this first; it also drives the role classification below.
  • Classify each page's role (cover / section / content / stats / quote / closing…) — this role map is your layout catalog for planning. Derive the role from the inventory, not from an image: cover = few shapes + an outsized title (≥36pt) and/or a full-page background image; section = only 1–2 short text shapes; stats = a 60pt+ numeric shape; quote = a single large centered long-text box; content = several body boxes. Derive every page's role from the inventory alone — never fall back to rendering an image.
  • Answer the one decisive structural question: does the design live in `slideLayouts` with real placeholders (→ clone & fill can `add_slide` + fill), or is it drawn on slides with free text boxes while layouts sit empty (common in downloaded templates; → clone & fill must clone slides at XML level)?
  • Read the design's source of truth: `presentation.xml` for slide size (never assume 16:9); `theme1.xml` for colors and fonts — slide XML uses `schemeClr` indirection, the real hex lives in the theme (remapped by the master's `clrMap`), and CJK text renders in the `<a:ea>` font.

**3. Plan, then build — always on a COPY of the user's file:**
  • Write a short plan first: final page order; each page's template source (slide index to clone, or layout name) chosen by ROLE; replacement text written WITHIN the budget. If the user's outline and the template's structure conflict, surface the trade-off instead of improvising. (Clone & fill: since structure is free, let the template's available page roles drive the outline rather than forcing a shape the template can't carry.)
  • Fill-in: follow Route 3's Approach A as written.
  • Clone & fill: materialize pages first — `add_slide` + fill placeholders when layouts are real; otherwise clone the slide at XML level (copy the slide part + its `.rels`, re-register media rIds, add to `sldIdLst` and `[Content_Types].xml`; `{skill_dir}/ooxml/scripts/unpack.py` → edit → `{skill_dir}/ooxml/scripts/pack.py` is often the clearest route). Then replace content page by page (scope mappings per slide — clones share identical source text), swap images by replacing the image part bytes (keep the shape and rId), and delete unused template pages LAST, high-index first. Never hand-build a from-scratch page next to template pages — a foreign page is instantly visible.

**4. Verify (mandatory before reporting done) — programmatic checks, no rendering:**
The whole checklist is decidable without an image; run these and fix until clean:
  • **Page order & count** — count `sldIdLst` against the plan.
  • **Leftover placeholders** — grep the slide XML for `Click to add`, `xxx`, `lorem`, `TODO`, `[insert`.
  • **Broken images** — confirm every image rId on a cloned page resolves to a real media part (empty frames come from dangling rels); `{skill_dir}/ooxml/scripts/validate.py` for spot checks, and `pack.py` validates the XML on pack.
  • **Fonts & colors unchanged** — diff the run/theme font+color against the original rather than eyeballing it.
  • **Overflow / collision** — re-check the "Budget every shape" rule (`len ≤ orig_len × 1.1`) on the final text and compare each `left+width` against its neighbor. A passing budget is the overflow guard here — treat any shape over budget as a real defect and fix it (trim, widen, or shrink per the Route 3 rules).
  • **Geometry audit** — run `{skill_dir}/scripts/audit_geometry.py` on the final file (added/changed shapes are subject to the same page-bounds and text-overlap constraints; FAIL = no delivery).
  • **Visual QA (spot-check changed pages)** — render changed pages to images; VLM checks overflow/clipping/leftover placeholders/garbled text (same rules and iron rule as Route 1 Stage 5.3).

# Route 3 — Editing an Existing PowerPoint Presentation (.pptx)

For in-place edits to an existing deck (Fill-in mode, and small fixes like typos or updating numbers), work on a COPY and pick the approach by what the edit touches:

- **Approach A — `python-pptx` script** — preferred for text replacement, deleting/reordering slides, and any edit that should preserve fonts/colors/layout. Simpler and safer than raw XML for content swaps.
- **Approach B — raw OOXML** — required for animations, transitions, comments, speaker notes XML, theme tweaks, custom layout edits — anything `python-pptx` can't reach.

### Approach A — `python-pptx` text replacement (preferred for text edits)

**Workflow**

1. **Inventory the deck** — walk every slide, recurse into GROUP shapes (`shape_type == 6`), `print(repr(para.text))`. Use the inventory as the source of truth for replacement keys; rendered text often contains hidden chars that won't survive copy-paste.
2. **Helpers** — keep the build script short:

   ```python
   from pptx import Presentation
   from pptx.enum.text import MSO_AUTO_SIZE
   from pptx.oxml.ns import qn
   from pptx.util import Emu, Pt

   def iter_text_frames(shapes):
       for s in shapes:
           if s.shape_type == 6:                 # GROUP → recurse
               yield from iter_text_frames(s.shapes)
           elif s.has_text_frame:
               yield s, s.text_frame

   def _norm(s):                                  # strip soft breaks before matching
       return s.replace("\x0b", "").replace("\r", "").strip()

   def replace_in_paragraph(p, new_text):         # first-run replace preserves formatting
       runs = p.runs
       if not runs:
           p.add_run().text = new_text; return
       runs[0].text = new_text
       for r in runs[1:]:
           r._r.getparent().remove(r._r)

   def apply_replacements(tf, mapping):           # full-frame match, then per-paragraph
       m = {_norm(k): v for k, v in mapping.items()}
       full = "\n".join(p.text for p in tf.paragraphs)
       if _norm(full) in m:
           parts = m[_norm(full)].split("\n")
           for i, p in enumerate(tf.paragraphs):
               replace_in_paragraph(p, parts[i] if i < len(parts) else "")
           return
       for p in tf.paragraphs:
           if _norm(p.text) in m:
               replace_in_paragraph(p, m[_norm(p.text)])

   def delete_slide(prs, idx):                    # call high-index first
       sld = list(prs.slides._sldIdLst)[idx]
       prs.part.drop_rel(sld.get(qn("r:id")))
       prs.slides._sldIdLst.remove(sld)
   ```

**Budget every shape BEFORE generating replacement text (do this first)**

Most overflow bugs come from generating copy without knowing the target box's capacity. Before drafting any replacement, walk the deck once and emit a capacity manifest — then feed it to the content step as a hard constraint.

For each text-bearing shape collect: `slide_idx, shape_id, w_cm, h_cm, font_pt, orig_text, orig_len`. Then:

- `budget = orig_len × 1.1`. The template designer already tuned `orig_len` for this box — treat it as the ceiling, not a starting point. This one rule is the actual overflow guard; don't over-engineer it with width/line-height estimates (glyph advance widths vary by font and by CJK-vs-Latin mix, so any `chars_per_line` formula is a rough guess that the `orig_len` cap already subsumes).
- `role = "label"` if `h_cm < 1.5` OR `orig_len ≤ 8` OR `font_pt ≥ 20`; else `"body"`.

Rules the generation step MUST obey:

- **Label boxes**: short phrase only. No full sentences, no trailing punctuation, no "term + explanation" expansion. Hard cap = `max(orig_len, 8)`. SWOT tiles, timeline tags, KPI labels all fall here.
- **Body boxes**: stay within `budget`. Font size is inherited from the template; shrinking is a last resort, not plan A.
- If the content is genuinely longer and the layout permits, **grow the box itself** (`widen_to_fit(shape, Emu(...))` — see below) rather than shrinking the font. Check first that `left + width` won't collide with the next shape.

**Handling long replacement / unwanted wrapping after replacement**

When a longer replacement wraps to a new line, apply remedies in this order (cheapest first):

```python
def widen_to_fit(shape, max_grow_emu=Emu(0)):
    """Let PowerPoint size the shape to its text. Pass max_grow_emu>0 to also
    grow the explicit width (centered on the original position) before sizing."""
    if max_grow_emu:
        shape.left -= max_grow_emu // 2
        shape.width += max_grow_emu
    shape.text_frame.word_wrap = True
    shape.text_frame.auto_size = MSO_AUTO_SIZE.SHAPE_TO_FIT_TEXT

def shrink_text_to_fit(shape):
    """Keep the box fixed; let PowerPoint shrink the font to fit."""
    shape.text_frame.word_wrap = True
    shape.text_frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
```

> ⚠️ Both helpers only **write the autofit flag** into the XML — python-pptx does not compute the resized shape or the shrunk font-scale itself. The actual fit is applied by the viewer (PowerPoint / LibreOffice) when the file is opened, so your programmatic overflow check can't see the result. Prefer trimming to `budget` (below), which *is* verifiable without rendering.

1. **Budget first (preferred).** Check `shape.width` × `font_size` from inventory and trim the replacement so it fits the original visual budget. Numeric badges / small label boxes (`width ≤ 0.7"`, `font_size ≥ 16pt`) hold ~3–4 chars max.
2. **Widen the shape** with `widen_to_fit(shape, Emu(...))` when the content is genuinely longer and there's free space next to it. Always check the shape isn't going to collide with a neighbor first (compare `left+width` against the next shape's `left`).
3. **Shrink the font** with `shrink_text_to_fit(shape)` only for tight-layout boxes (table cells, numeric badges) where widening would break the grid. Last resort — it visibly breaks the typographic rhythm.

Skip `word_wrap = False`: it makes text overflow the box invisibly in PowerPoint and looks broken when exported.

**Critical gotchas**

- **Soft line breaks (`\x0b`)** silently break exact-match. Always `_norm()` both keys and lookups.
- **GROUP shapes** (`shape_type == 6`) hide text frames — recurse.
- **First-run replace** preserves formatting; `paragraph.text = ...` destroys it.
- **Short tokens collide.** `"01"`, `"%"`, `"18"` recur across slides — keep identity mappings or scope per slide index, never global cross-mappings like `"18": "12"`.
- **Delete slides high-index first** — deleting index 5 first shifts every later index down by one.

**Verify (after edits, both approaches)**

- Run `{skill_dir}/scripts/audit_geometry.py` on the edited copy (budget widening / text swaps can cause neighbor collisions or page overflow; FAIL = no delivery).
- Render the edited pages to images; run one VLM spot-check (overflow/clipping/garbled text; same rules as Route 1 Stage 5.3).

# Code Style Guidelines

**IMPORTANT**: When generating code for PPTX operations:

- Write concise code
- Avoid verbose variable names and redundant operations
- Avoid unnecessary print statements

# Dependencies

Required dependencies (should already be installed):

- **markitdown**: `pip install "markitdown[pptx]"` (text extraction)
- **python-pptx**: `pip install python-pptx` (editing existing decks; also used by the audit scripts)
- **Pillow**: `pip install Pillow` (image pre-crop pipeline)
- **pptxgenjs**: `npm install -g pptxgenjs` (creating presentations)
- **z-ai-web-dev-sdk**: `npm install -g z-ai-web-dev-sdk` (provides `z-ai` CLI for `web_search` and `image-search`; if `image-search` subcommand is missing → SDK too old, upgrade. `bun add -g z-ai-web-dev-sdk` also works)
- **react-icons**: `npm install -g react-icons react react-dom` (icons)
- **sharp**: `npm install -g sharp` (SVG rasterization and image processing)
- **LibreOffice**: `sudo apt-get install libreoffice` (PDF conversion)
- **Poppler**: `sudo apt-get install poppler-utils` (pdftoppm)
- **defusedxml**: `pip install defusedxml` (secure XML parsing)
