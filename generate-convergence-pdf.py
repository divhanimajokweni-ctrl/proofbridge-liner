#!/usr/bin/env python3
"""
Convergence Report PDF Generator — Epistemic Runtime v0.8 Specification Alignment Report
Generates a comprehensive 15+ page audit document using ReportLab.
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, PageBreak, KeepTogether, Flowable,
    ListFlowable, ListItem, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Palette ──────────────────────────────────────────────────────────────────
PAGE_BG       = colors.HexColor('#f4f4f3')
SECTION_BG    = colors.HexColor('#f0efee')
CARD_BG       = colors.HexColor('#f0efed')
TABLE_STRIPE  = colors.HexColor('#f2f1ef')
HEADER_FILL   = colors.HexColor('#625737')
COVER_BLOCK   = colors.HexColor('#80734e')
BORDER        = colors.HexColor('#c7c0ac')
ICON          = colors.HexColor('#887437')
ACCENT        = colors.HexColor('#8c7226')
ACCENT_2      = colors.HexColor('#7157c0')
TEXT_PRIMARY   = colors.HexColor('#262623')
TEXT_MUTED     = colors.HexColor('#7e7c74')
SEM_SUCCESS   = colors.HexColor('#3f8958')
SEM_WARNING   = colors.HexColor('#917948')
SEM_ERROR     = colors.HexColor('#9b443c')
SEM_INFO      = colors.HexColor('#567798')

# ── Fonts ────────────────────────────────────────────────────────────────────
FONT_DIR_FREE = '/usr/share/fonts/truetype/freefont'
FONT_DIR_LIB = '/usr/share/fonts/truetype/liberation'

pdfmetrics.registerFont(TTFont('FreeSerif', os.path.join(FONT_DIR_FREE, 'FreeSerif.ttf')))
pdfmetrics.registerFont(TTFont('FreeSerifBold', os.path.join(FONT_DIR_FREE, 'FreeSerifBold.ttf')))
pdfmetrics.registerFont(TTFont('FreeSerifItalic', os.path.join(FONT_DIR_FREE, 'FreeSerifItalic.ttf')))
pdfmetrics.registerFont(TTFont('LiberationMono', os.path.join(FONT_DIR_LIB, 'LiberationMono-Regular.ttf')))
pdfmetrics.registerFont(TTFont('LiberationMonoBold', os.path.join(FONT_DIR_LIB, 'LiberationMono-Bold.ttf')))

# ── Page Setup ───────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 60
RIGHT_MARGIN = 60
TOP_MARGIN = 50
BOTTOM_MARGIN = 50
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ── Styles ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_body = ParagraphStyle(
    'BodyCustom', parent=styles['Normal'],
    fontName='FreeSerif', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
    spaceAfter=8, spaceBefore=2,
)

style_body_muted = ParagraphStyle(
    'BodyMuted', parent=style_body,
    textColor=TEXT_MUTED,
)

style_h1 = ParagraphStyle(
    'H1Custom', parent=styles['Heading1'],
    fontName='FreeSerifBold', fontSize=22, leading=28,
    textColor=TEXT_PRIMARY, spaceAfter=12, spaceBefore=24,
    borderWidth=0, borderPadding=0,
)

style_h2 = ParagraphStyle(
    'H2Custom', parent=styles['Heading2'],
    fontName='FreeSerifBold', fontSize=14, leading=20,
    textColor=ACCENT, spaceAfter=8, spaceBefore=16,
)

style_h3 = ParagraphStyle(
    'H3Custom', parent=styles['Heading3'],
    fontName='FreeSerifBold', fontSize=12, leading=16,
    textColor=COVER_BLOCK, spaceAfter=6, spaceBefore=12,
)

style_code = ParagraphStyle(
    'CodeCustom', parent=styles['Code'],
    fontName='LiberationMono', fontSize=9, leading=13,
    textColor=TEXT_PRIMARY, backColor=CARD_BG,
    borderWidth=1, borderColor=BORDER, borderPadding=8,
    spaceAfter=10, spaceBefore=6,
    leftIndent=12,
)

style_toc_h1 = ParagraphStyle(
    'TOC1', parent=styles['Normal'],
    fontName='FreeSerifBold', fontSize=12, leading=22,
    textColor=TEXT_PRIMARY, leftIndent=20,
)

style_toc_h2 = ParagraphStyle(
    'TOC2', parent=styles['Normal'],
    fontName='FreeSerif', fontSize=10, leading=18,
    textColor=TEXT_MUTED, leftIndent=40,
)

style_table_header = ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontName='FreeSerifBold', fontSize=9, leading=13,
    textColor=colors.white, alignment=TA_LEFT,
)

style_table_cell = ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontName='FreeSerif', fontSize=9, leading=13,
    textColor=TEXT_PRIMARY,
)

style_table_cell_bold = ParagraphStyle(
    'TableCellBold', parent=style_table_cell,
    fontName='FreeSerifBold',
)

style_table_cell_center = ParagraphStyle(
    'TableCellCenter', parent=style_table_cell,
    alignment=TA_CENTER,
)

style_callout_title = ParagraphStyle(
    'CalloutTitle', parent=styles['Normal'],
    fontName='FreeSerifBold', fontSize=10, leading=14,
    textColor=SEM_ERROR,
)

style_callout_body = ParagraphStyle(
    'CalloutBody', parent=style_body,
    fontSize=10, leading=15,
    spaceAfter=0, spaceBefore=4,
)

style_bullet = ParagraphStyle(
    'BulletCustom', parent=style_body,
    leftIndent=24, bulletIndent=12,
    spaceAfter=4, spaceBefore=2,
)

# ── Custom Flowables ─────────────────────────────────────────────────────────

class CalloutBox(Flowable):
    """A highlighted callout box with left accent border."""
    def __init__(self, title, text, accent_color=SEM_ERROR, bg_color=None, width=None):
        Flowable.__init__(self)
        self.title = title
        self.text = text
        self.accent_color = accent_color
        self.bg_color = bg_color or colors.HexColor('#9b443c10')
        self._width = width or CONTENT_W
        # Pre-calculate height
        self._calc_height()

    def _calc_height(self):
        title_style = ParagraphStyle('t', fontName='FreeSerifBold', fontSize=10, leading=14, textColor=self.accent_color)
        body_style = ParagraphStyle('b', fontName='FreeSerif', fontSize=10, leading=15, textColor=TEXT_PRIMARY)
        tp = Paragraph(self.title, title_style)
        bp = Paragraph(self.text, body_style)
        tw, th = tp.wrap(self._width - 36, 10000)
        bw, bh = bp.wrap(self._width - 36, 10000)
        self._height = th + bh + 28

    def wrap(self, availWidth, availHeight):
        self._calc_height()
        return self._width, self._height

    def draw(self):
        canvas = self.canv
        # Background
        canvas.setFillColor(self.bg_color)
        canvas.setStrokeColor(self.bg_color)
        canvas.rect(0, 0, self._width, self._height, fill=1, stroke=0)
        # Left accent border
        canvas.setFillColor(self.accent_color)
        canvas.rect(0, 0, 4, self._height, fill=1, stroke=0)
        # Title
        title_style = ParagraphStyle('t', fontName='FreeSerifBold', fontSize=10, leading=14, textColor=self.accent_color)
        body_style = ParagraphStyle('b', fontName='FreeSerif', fontSize=10, leading=15, textColor=TEXT_PRIMARY)
        tp = Paragraph(self.title, title_style)
        bp = Paragraph(self.text, body_style)
        tw, th = tp.wrap(self._width - 36, 10000)
        bw, bh = bp.wrap(self._width - 36, 10000)
        tp.drawOn(canvas, 20, self._height - th - 10)
        bp.drawOn(canvas, 20, self._height - th - bh - 16)


class SectionDivider(Flowable):
    """Horizontal divider with optional chapter number."""
    def __init__(self, chapter_num=None, width=None):
        Flowable.__init__(self)
        self.chapter_num = chapter_num
        self._width = width or CONTENT_W
        self._height = 30

    def wrap(self, availWidth, availHeight):
        return self._width, self._height

    def draw(self):
        canvas = self.canv
        y = self._height / 2
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(0, y, self._width, y)
        if self.chapter_num:
            canvas.setFillColor(ACCENT)
            canvas.setFont('FreeSerifBold', 10)
            canvas.drawCentredString(self._width / 2, y + 3, f"  {self.chapter_num}  ")


# ── TOC Document Template ────────────────────────────────────────────────────

class TocDocTemplate(BaseDocTemplate):
    """Document template with TOC support and page numbering."""
    def __init__(self, filename, **kw):
        BaseDocTemplate.__init__(self, filename, **kw)
        self.page_count = 0

    def afterFlowable(self, flowable):
        """Register TOC entries."""
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            if style == 'H1Custom':
                self.page_count += 1
                key = f'h1_{self.page_count}'
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (0, text, self.page, key))
            elif style == 'H2Custom':
                key = f'h2_{self.page_count}'
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (1, text, self.page, key))


def page_footer(canvas, doc):
    """Draw page number and thin top line."""
    canvas.saveState()
    # Top accent line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.3)
    canvas.line(LEFT_MARGIN, PAGE_H - 30, PAGE_W - RIGHT_MARGIN, PAGE_H - 30)
    # Page number
    canvas.setFont('FreeSerif', 9)
    canvas.setFillColor(TEXT_MUTED)
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(PAGE_W / 2, 25, str(page_num))
    # Footer text
    canvas.setFont('FreeSerif', 7)
    canvas.drawString(LEFT_MARGIN, 25, "Epistemic Runtime v0.8 Convergence Report")
    canvas.drawRightString(PAGE_W - RIGHT_MARGIN, 25, "INTERNAL")
    canvas.restoreState()


# ── Helper Functions ─────────────────────────────────────────────────────────

def P(text, style=None):
    """Create a paragraph."""
    return Paragraph(text, style or style_body)

def PB(text):
    """Create a bold paragraph."""
    return Paragraph(f'<b>{text}</b>', style_body)

def PH1(text):
    """Create H1 heading with chapter number."""
    return Paragraph(text, style_h1)

def PH2(text):
    """Create H2 heading."""
    return Paragraph(text, style_h2)

def PH3(text):
    """Create H3 heading."""
    return Paragraph(text, style_h3)

def PC(text):
    """Create code block."""
    return Paragraph(text, style_code)

def PS(n=8):
    """Spacer."""
    return Spacer(1, n)

def bullet(text):
    """Bullet list item."""
    return Paragraph(f'<bullet>&bull;</bullet>{text}', style_bullet)

def make_table(headers, rows, col_widths=None):
    """Create a styled table with headers and rows."""
    header_cells = [Paragraph(h, style_table_header) for h in headers]
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(c), style_table_cell) for c in row])

    if col_widths is None:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'FreeSerifBold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    # Stripe odd rows
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))

    t.setStyle(TableStyle(style_cmds))
    return t


def callout(title, text, accent=SEM_ERROR, bg=None):
    """Create a callout box."""
    return CalloutBox(title, text, accent_color=accent, bg_color=bg)


# ── Document Builder ─────────────────────────────────────────────────────────

def build_document():
    output_path = '/home/z/my-project/convergence-report-body.pdf'

    doc = TocDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
    )

    frame = Frame(
        LEFT_MARGIN, BOTTOM_MARGIN,
        CONTENT_W, PAGE_H - TOP_MARGIN - BOTTOM_MARGIN,
        id='main',
    )

    template = PageTemplate(id='main', frames=[frame], onPage=page_footer)
    doc.addPageTemplates([template])

    story = []

    # ─────────────────────────────────────────────────────────────────────────
    # TABLE OF CONTENTS
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("Table of Contents", style_h1))
    story.append(PS(16))

    toc_chapters = [
        ("1", "Executive Summary"),
        ("2", "Repository Architecture"),
        ("3", "Specification Mapping Matrix"),
        ("4", "Drift Detection Report"),
        ("5", "Cryptographic Verification"),
        ("6", "Acceptance Pipeline Verification"),
        ("7", "Determinism Audit"),
        ("8", "Technical Debt Register"),
        ("9", "Convergence Assessment"),
        ("10", "Execution Roadmap"),
        ("11", "Risk Register"),
        ("12", "Final Verdict"),
    ]
    for num, title in toc_chapters:
        story.append(Paragraph(
            f'<b>{num}.</b>  {title}',
            ParagraphStyle('tocentry', fontName='FreeSerif', fontSize=11, leading=22,
                           textColor=TEXT_PRIMARY, leftIndent=20, spaceAfter=2, spaceBefore=2)
        ))
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 1: Executive Summary
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("1  Executive Summary"))
    story.append(PS(6))

    story.append(callout(
        "CRITICAL FINDING",
        "This project is a DASHBOARD that SIMULATES an Epistemic Runtime. It is NOT a working implementation. "
        "Specification implementation stands at approximately 8%. The .epd DSL evaluator is the only component "
        "that qualifies as real, kernel-quality code. Everything else is architectural only, contradicts the "
        "specification, or simply does not exist.",
        accent=SEM_ERROR,
        bg=colors.HexColor('#9b443c12'),
    ))
    story.append(PS(8))

    story.append(P(
        "This convergence audit was conducted against the Epistemic Runtime v0.8 specification to determine "
        "whether the current repository implementation is converging toward the specified architecture. The "
        "findings are unequivocal: it is not. The repository contains a well-constructed browser dashboard "
        "with 37 React components and 18 API routes, but the underlying kernel -- the acceptance pipeline, "
        "the fact log, the deterministic sequencer, the projection engine -- does not exist. What exists is "
        "a visual simulation that reads from and writes to SQLite via Prisma with no intermediate processing "
        "layer whatsoever."
    ))
    story.append(PS(4))

    story.append(PH2("Key Metrics"))
    story.append(make_table(
        ["Metric", "Value", "Assessment"],
        [
            ["Spec Implementation", "~8%", "CRITICAL"],
            ["Dashboard Completeness", "~90%", "GOOD"],
            ["Kernel Completeness", "~5%", "CRITICAL"],
            ["API Routes (Real)", "11/15", "MODERATE"],
            ["API Routes (Mock)", "3/15", "WARNING"],
            ["API Routes (Placeholder)", "1/15", "CRITICAL"],
            ["Non-determinism Instances", "8 CRITICAL", "CRITICAL"],
            ["Spec Contradictions", "3", "CRITICAL"],
            ["Test Coverage", "0%", "CRITICAL"],
        ],
        col_widths=[CONTENT_W * 0.35, CONTENT_W * 0.25, CONTENT_W * 0.40],
    ))
    story.append(PS(8))

    story.append(PH2("Three Critical Contradictions"))
    story.append(P(
        "The audit has identified three areas where the implementation directly contradicts the v0.8 specification, "
        "rather than merely falling short of it. These are not gaps or incomplete implementations; they are "
        "active contradictions that must be resolved before any convergence can occur."
    ))
    story.append(PS(4))
    story.append(bullet(
        "<b>Hash Algorithm:</b> The specification mandates SHA-256 for all content-addressed hashing. The "
        "implementation uses FNV-1a 32-bit, a non-cryptographic hash with known collision properties at scale. "
        "This is not a preference difference; it is a fundamental architectural divergence that affects data "
        "integrity, proof verification, and content addressing throughout the system."
    ))
    story.append(bullet(
        "<b>Merkle Structure:</b> The specification requires a Merkle Mountain Range (MMR) for efficient "
        "append-only proofs and historical verification. The implementation uses a simple binary Merkle tree "
        "that is rebuilt on every insertion, losing all historical proof capability. This contradicts the "
        "append-only, incrementally verifiable nature of the specification."
    ))
    story.append(bullet(
        "<b>Zero-Knowledge Proofs:</b> The specification describes ZK proof generation for policy compliance "
        "verification. The implementation generates random hexadecimal strings using <font face='LiberationMono'>"
        "Math.random().toString(16)</font> and presents them as proofs. These are fabricated values with zero "
        "cryptographic validity. Deploying this would constitute a security vulnerability."
    ))
    story.append(PS(6))

    story.append(P(
        "The single bright spot is the .epd DSL engine, which includes a real tokenizer, parser, validator, "
        "evaluator, and self-repair mechanism. This code is well-structured, spec-aligned, and represents genuine "
        "kernel-quality implementation. It is, however, the only such component in the entire repository."
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 2: Repository Architecture
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("2  Repository Architecture"))
    story.append(PS(6))

    story.append(P(
        "The repository is structured as a Next.js 15 application with a Prisma ORM layer backed by SQLite. "
        "The frontend consists of 37 React components organized under <font face='LiberationMono'>"
        "src/components/epistemic/</font>, each representing a section of the dashboard. The backend exposes "
        "18 API routes under <font face='LiberationMono'>src/app/api/</font>. The only standalone kernel "
        "module is the EPD engine located at <font face='LiberationMono'>src/lib/epd/</font>."
    ))
    story.append(PS(4))

    story.append(PH2("Architecture Graph"))
    story.append(PC(
        "  Browser (React/Next.js)\n"
        "    |\n"
        "    +--> 18 API Routes\n"
        "    |      |\n"
        "    |      +--> 11 REAL routes  --> Prisma ORM --> SQLite\n"
        "    |      +--> 3 MOCK routes   --> Hardcoded data\n"
        "    |      +--> 1 PLACEHOLDER   --> Empty handler\n"
        "    |      +--> 3 Hybrid routes --> Prisma + mock fallback\n"
        "    |\n"
        "    +--> EPD Engine (standalone)\n"
        "           tokenizer --> parser --> validator --> evaluator --> self-repair"
    ))
    story.append(PS(8))

    story.append(PH2("API Route Classification"))
    story.append(P(
        "Each API route was audited to determine whether it performs real data operations, returns hardcoded "
        "mock data, or is a placeholder with no implementation. The classification reveals that while most "
        "routes connect to Prisma for database operations, none of them route through an acceptance pipeline "
        "or perform the canonicalization, verification, or signature checks specified in the v0.8 architecture."
    ))
    story.append(PS(4))

    story.append(make_table(
        ["Category", "Count", "Routes", "Assessment"],
        [
            ["REAL (Prisma)", "11", "policies, policies/[id], shards, search, export, "
             "merges, merges/simulate, audit, metrics, system, convergence",
             "CRUD only, no kernel"],
            ["MOCK (Hardcoded)", "3", "proofs, trust-runtime, shadow-bridge",
             "No real data"],
            ["PLACEHOLDER", "1", "acceptance-engine",
             "Empty handler"],
            ["Hybrid", "3", "architecture, timeline, migration",
             "Partial Prisma + mock"],
        ],
        col_widths=[CONTENT_W * 0.18, CONTENT_W * 0.08, CONTENT_W * 0.44, CONTENT_W * 0.30],
    ))
    story.append(PS(8))

    story.append(PH2("The EPD Engine"))
    story.append(P(
        "The EPD (Epistemic Policy Definition) engine is the only component that qualifies as genuine "
        "kernel-quality code. Located at <font face='LiberationMono'>src/lib/epd/</font>, it consists of "
        "five modules that form a complete DSL processing pipeline:"
    ))
    story.append(PS(4))
    story.append(bullet(
        "<b>Tokenizer</b> (<font face='LiberationMono'>tokenizer.ts</font>): Lexes .epd source into typed "
        "tokens including keywords, operators, literals, and identifiers. Handles comments and whitespace."
    ))
    story.append(bullet(
        "<b>Parser</b> (<font face='LiberationMono'>parser.ts</font>): Constructs an abstract syntax tree "
        "from the token stream. Supports policy definitions, rule blocks, conditions, and actions."
    ))
    story.append(bullet(
        "<b>Validator</b> (<font face='LiberationMono'>validator.ts</font>): Performs semantic validation "
        "on the AST, checking for type errors, undefined references, and constraint violations."
    ))
    story.append(bullet(
        "<b>Evaluator</b> (<font face='LiberationMono'>index.ts</font>): Executes validated policies against "
        "runtime fact contexts. Returns structured evaluation results with match status and computed values."
    ))
    story.append(bullet(
        "<b>Self-Repair</b>: When evaluation fails due to schema drift or missing fields, the engine attempts "
        "automated repair by applying heuristics to reconcile the policy with the current fact schema."
    ))
    story.append(PS(6))

    story.append(P(
        "The critical issue is that there is no kernel connecting these components to the broader system. All "
        "data flows are direct CRUD operations through Prisma. There is no acceptance pipeline mediating writes, "
        "no fact log recording state transitions, and no deterministic sequencer ordering events. The EPD engine "
        "operates in isolation, evaluating policies that have no enforced effect on the data layer."
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 3: Specification Mapping Matrix
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("3  Specification Mapping Matrix"))
    story.append(PS(6))

    story.append(P(
        "The following matrix maps each component defined in the Epistemic Runtime v0.8 specification to "
        "its current implementation status. Each component is assessed on two axes: Architecture Status "
        "(whether the component's architecture exists in the codebase) and Implementation Status (whether "
        "the component is actually implemented and functional). The Readiness percentage represents the "
        "combined assessment of both axes."
    ))
    story.append(PS(6))

    spec_data = [
        ["Acceptance Pipeline", "Architectural Only", "NOT IMPLEMENTED", "5%", "No acceptance pipeline exists. Writes go directly to SQLite."],
        ["Fact Log (Event Store)", "Architectural Only", "NOT IMPLEMENTED", "5%", "No event sourcing. Prisma schema has no event/fact table."],
        ["Deterministic Sequencer", "Architectural Only", "NOT IMPLEMENTED", "0%", "No sequencer. All ordering is database-default."],
        ["Projection Engine", "Architectural Only", "NOT IMPLEMENTED", "0%", "No projection engine. Queries go directly to SQLite."],
        ["Content-Addressed Store", "Architectural Only", "CONTRADICTS SPEC", "10%", "FNV-1a 32-bit used instead of SHA-256."],
        ["Merkle Mountain Range", "Architectural Only", "CONTRADICTS SPEC", "10%", "Binary Merkle tree rebuilt on insertion, not MMR."],
        ["ZK Proof System", "Architectural Only", "CONTRADICTS SPEC", "0%", "Math.random() strings presented as proofs."],
        ["Ed25519 Signatures", "Not Present", "NOT IMPLEMENTED", "0%", "No signature code exists anywhere in the repository."],
        ["RFC8785 Canonicalizer", "Not Present", "NOT IMPLEMENTED", "0%", "No canonicalization logic. JSON.stringify used."],
        ["Schema Registry", "Architectural Only", "NOT IMPLEMENTED", "5%", "No schema registry or versioning system."],
        ["Policy Engine (EPD)", "Implemented", "IMPLEMENTED", "80%", "Tokenizer, parser, validator, evaluator, self-repair."],
        ["Policy Time-Travel", "Architectural Only", "PARTIALLY IMPLEMENTED", "15%", "UI exists, no actual historical replay."],
        ["DAG Topology", "Architectural Only", "PARTIALLY IMPLEMENTED", "20%", "Visualization exists, no real DAG structure."],
        ["Invariant Miner", "Architectural Only", "PARTIALLY IMPLEMENTED", "10%", "UI component exists, no mining algorithm."],
        ["Shadow Bridge", "Architectural Only", "NOT IMPLEMENTED", "5%", "Mock API only. No real shadow mode."],
        ["Federation Layer", "Architectural Only", "NOT IMPLEMENTED", "5%", "UI exists, no federation protocol."],
        ["CLI Binary", "Architectural Only", "PARTIALLY IMPLEMENTED", "20%", "EPD CLI exists for policy evaluation only."],
        ["Adapter System", "Not Present", "NOT IMPLEMENTED", "0%", "No adapter abstraction layer."],
        ["Consensus Protocol", "Not Present", "NOT IMPLEMENTED", "0%", "No consensus mechanism."],
        ["Verification Layer", "Architectural Only", "HARDCODED", "2%", "verified: true with no actual verification."],
    ]

    story.append(make_table(
        ["Spec Component", "Architecture", "Implementation", "Ready", "Notes"],
        spec_data,
        col_widths=[CONTENT_W * 0.18, CONTENT_W * 0.14, CONTENT_W * 0.16, CONTENT_W * 0.08, CONTENT_W * 0.44],
    ))
    story.append(PS(10))

    story.append(PH2("Summary Statistics"))
    story.append(P(
        "The specification mapping reveals a stark distribution across the 20 components defined in the "
        "v0.8 specification. The overwhelming majority fall into the 'Architectural Only' category, meaning "
        "UI components or database schemas exist but no functional implementation backs them."
    ))
    story.append(PS(4))

    story.append(make_table(
        ["Status Category", "Count", "Components"],
        [
            ["ARCHITECTURAL ONLY", "11",
             "Acceptance Pipeline, Fact Log, Sequencer, Projection, "
             "Content Store, MMR, ZK Proofs, Schema Registry, "
             "Policy Time-Travel, DAG Topology, Invariant Miner"],
            ["CONTRADICTS SPEC", "3",
             "Content-Addressed Store (FNV-1a), MMR (binary Merkle), "
             "ZK Proofs (random strings)"],
            ["PARTIALLY IMPLEMENTED", "3",
             "Shadow Bridge, Federation, CLI Binary"],
            ["IMPLEMENTED", "1",
             "Policy Engine (EPD)"],
            ["NOT PRESENT", "2",
             "Ed25519 Signatures, RFC8785 Canonicalizer"],
        ],
        col_widths=[CONTENT_W * 0.22, CONTENT_W * 0.08, CONTENT_W * 0.70],
    ))
    story.append(PS(8))

    story.append(callout(
        "CONVERGENCE BLOCKER",
        "Three components do not merely fail to implement the specification; they actively contradict it. "
        "These contradictions must be resolved before any convergence trajectory can be established. Adding "
        "more dashboard sections on top of contradictory foundations will only increase the cost of correction.",
        accent=SEM_WARNING,
        bg=colors.HexColor('#91794812'),
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 4: Drift Detection Report
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("4  Drift Detection Report"))
    story.append(PS(6))

    story.append(P(
        "Drift detection identifies areas where the implementation has diverged from the specification. "
        "Unlike gaps (where something is missing), drifts represent active divergences where the implementation "
        "has taken a different path than the one specified. Each drift is assessed for its impact on system "
        "integrity, compliance, and the feasibility of reconciliation."
    ))
    story.append(PS(6))

    drift_data = [
        ["1", "No Acceptance Pipeline", "CRITICAL",
         "All writes bypass canonicalization, verification, and policy evaluation. No fact can be trusted.",
         "Implement the full acceptance pipeline as the foundational layer."],
        ["2", "Non-deterministic Hashing", "CRITICAL",
         "FNV-1a is non-cryptographic and produces collisions at scale. Content addressing is unreliable.",
         "Replace FNV-1a with SHA-256 across all hash operations."],
        ["3", "No Event Store", "CRITICAL",
         "No append-only log exists. State is mutable via Prisma CRUD. No audit trail or replay capability.",
         "Implement Fact Log with append-only semantics."],
        ["4", "Binary Merkle vs MMR", "HIGH",
         "Binary Merkle tree rebuilt on insertion loses historical proofs. Cannot verify past states.",
         "Replace with proper Merkle Mountain Range implementation."],
        ["5", "Fabricated ZK Proofs", "CRITICAL",
         "Math.random() strings presented as cryptographic proofs. Security vulnerability if deployed.",
         "Remove fake proofs. Implement real ZK proof generation or stub honestly."],
        ["6", "No Canonicalization", "HIGH",
         "JSON.stringify used for serialization. Key ordering is non-deterministic across engines.",
         "Implement RFC8785 JSON Canonicalization Scheme."],
        ["7", "Hardcoded Verification", "HIGH",
         "verified: true returned with no actual verification. False sense of security.",
         "Implement real verification against signatures and proofs."],
        ["8", "Date.now() in Kernel Code", "HIGH",
         "5+ instances of Date.now() in code that should be deterministic. Timestamps vary on replay.",
         "Replace with deterministic tick counter or logical clock."],
        ["9", "No Schema Versioning", "MEDIUM",
         "No schema registry or version negotiation. Schema changes break existing policies silently.",
         "Implement Schema Registry with version negotiation."],
    ]

    story.append(make_table(
        ["#", "Drift", "Impact", "Description", "Reconciliation"],
        drift_data,
        col_widths=[CONTENT_W * 0.04, CONTENT_W * 0.16, CONTENT_W * 0.10, CONTENT_W * 0.38, CONTENT_W * 0.32],
    ))
    story.append(PS(10))

    story.append(PH2("Drift Impact Distribution"))
    story.append(P(
        "Of the nine identified drifts, four are rated CRITICAL, meaning they represent fundamental "
        "architectural failures that prevent the system from fulfilling its specified purpose. Three are "
        "rated HIGH, meaning they undermine specific guarantees but do not entirely prevent operation. "
        "Two are rated MEDIUM, meaning they create operational risks but do not immediately break core "
        "functionality. No drifts are rated LOW; every identified drift requires remediation."
    ))
    story.append(PS(4))

    story.append(callout(
        "HIGHEST-PRIORITY DRIFT",
        "The absence of an acceptance pipeline is the single most damaging drift. Every other drift either "
        "flows from this absence (no canonicalization, no verification, no signature checks) or is exacerbated "
        "by it (fabricated proofs go unchecked, non-deterministic hashes go unnoticed). Implementing the "
        "acceptance pipeline would create the structural backbone needed to address the remaining drifts.",
        accent=SEM_ERROR,
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 5: Cryptographic Verification
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("5  Cryptographic Verification"))
    story.append(PS(6))

    story.append(P(
        "The Epistemic Runtime v0.8 specification defines a comprehensive cryptographic foundation for "
        "ensuring data integrity, proof verification, and trust establishment. This chapter audits each "
        "cryptographic primitive against its specified requirement and the actual implementation."
    ))
    story.append(PS(6))

    story.append(PH2("RFC8785: JSON Canonicalization"))
    story.append(P(
        "Status: <b>NOT IMPLEMENTED</b>. The specification requires that all facts undergo RFC8785 "
        "canonicalization before hashing to ensure deterministic serialization across different JSON "
        "libraries and runtime environments. The implementation uses JavaScript's built-in "
        "<font face='LiberationMono'>JSON.stringify()</font>, which does not guarantee key ordering "
        "across different engines. This means the same logical fact can produce different hash values "
        "depending on the runtime, rendering content addressing unreliable and proof verification "
        "impossible across node boundaries."
    ))
    story.append(PS(4))

    story.append(PH2("SHA-256: Content-Addressed Hashing"))
    story.append(P(
        "Status: <b>CONTRADICTS SPEC</b>. The specification mandates SHA-256 for all content-addressed "
        "hashing operations. The implementation uses FNV-1a 32-bit, a fast but non-cryptographic hash "
        "function designed for hash tables, not content addressing. FNV-1a produces only 32-bit hashes, "
        "making collisions statistically inevitable at volumes as low as tens of thousands of entries. "
        "SHA-256 produces 256-bit hashes with collision resistance sufficient for any foreseeable scale. "
        "This is not a performance optimization; it is a fundamental architectural error that compromises "
        "the integrity of the entire content-addressed storage layer."
    ))
    story.append(PS(4))

    story.append(PH2("Ed25519: Digital Signatures"))
    story.append(P(
        "Status: <b>NOT IMPLEMENTED</b>. The specification requires Ed25519 signatures for fact "
        "authentication, ensuring that each fact can be attributed to a known identity and that "
        "tampering is detectable. No signature code exists anywhere in the repository. There is no "
        "key generation, no signing, no verification, and no key management infrastructure. Without "
        "signatures, there is no way to establish trust in the origin of any fact, and the trust "
        "runtime operates on hardcoded assumptions rather than cryptographic proof."
    ))
    story.append(PS(4))

    story.append(PH2("MMR: Merkle Mountain Range"))
    story.append(P(
        "Status: <b>CONTRADICTS SPEC</b>. The specification requires a Merkle Mountain Range for "
        "efficient append-only proof generation and historical verification. The implementation uses a "
        "simple binary Merkle tree that is fully rebuilt on every insertion. This approach has three "
        "critical failures: it is computationally expensive (O(n) per insertion instead of O(log n)), "
        "it destroys historical proof capability (previous root hashes become invalid), and it cannot "
        "produce membership proofs for arbitrary historical states. The MMR is fundamental to the "
        "specification's guarantee of incremental verifiability."
    ))
    story.append(PS(4))

    story.append(PH2("ZK Proofs: Zero-Knowledge Verification"))
    story.append(P(
        "Status: <b>FABRICATED</b>. The specification describes zero-knowledge proof generation for "
        "policy compliance verification, allowing parties to prove compliance without revealing underlying "
        "data. The implementation generates random hexadecimal strings using "
        "<font face='LiberationMono'>Math.random().toString(16)</font> and presents them as proof "
        "values. These are not proofs; they are random strings with zero cryptographic validity. If "
        "this system were deployed, an attacker could generate arbitrary 'proofs' using the same "
        "Math.random() approach and the system would accept them as valid."
    ))
    story.append(PS(4))

    story.append(PH2("Verification Status"))
    story.append(P(
        "Status: <b>HARDCODED</b>. The verification layer returns <font face='LiberationMono'>"
        "verified: true</font> for all entities without performing any actual verification. There is no "
        "signature checking, no proof validation, no hash comparison, and no policy compliance check. "
        "The verification field in the database and API responses is decorative, not functional."
    ))
    story.append(PS(6))

    story.append(callout(
        "CRYPTOGRAPHIC SUMMARY",
        "Of six cryptographic requirements, zero are correctly implemented. Three are contradicted "
        "(SHA-256, MMR, ZK Proofs), two are not implemented at all (RFC8785, Ed25519), and one is "
        "hardcoded (Verification). The cryptographic foundation of the specification is entirely absent.",
        accent=SEM_ERROR,
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 6: Acceptance Pipeline Verification
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("6  Acceptance Pipeline Verification"))
    story.append(PS(6))

    story.append(P(
        "The acceptance pipeline is the architectural backbone of the Epistemic Runtime. According to the "
        "v0.8 specification, every write operation must pass through the acceptance pipeline before being "
        "committed to the fact log. The pipeline performs five critical functions: canonicalization, schema "
        "verification, signature validation, policy evaluation, and deterministic sequencing. This chapter "
        "verifies whether the acceptance pipeline exists and operates as specified."
    ))
    story.append(PS(6))

    story.append(PH2("Pipeline Existence"))
    story.append(P(
        "The acceptance pipeline does not exist. There is no module, class, or function in the codebase "
        "that implements any part of the acceptance pipeline. The API route at <font face='LiberationMono'>"
        "/api/acceptance-engine</font> is a placeholder that returns an empty response. The component at "
        "<font face='LiberationMono'>src/components/epistemic/acceptance-engine.tsx</font> is a dashboard "
        "visualization that displays a mock pipeline UI with no connection to any backend pipeline logic."
    ))
    story.append(PS(4))

    story.append(PH2("Data Flow Analysis"))
    story.append(P(
        "Every write operation in the system follows the same path: the browser sends a request to an API "
        "route, the API route calls Prisma, Prisma writes directly to SQLite. There is no intermediate "
        "processing layer. The following table shows the analysis of each write-capable API route:"
    ))
    story.append(PS(4))

    story.append(make_table(
        ["Route", "Write Method", "Pipeline Stage", "Verification"],
        [
            ["POST /api/policies", "prisma.policy.create()", "NONE", "No canonicalization, no signature"],
            ["PUT /api/policies/[id]", "prisma.policy.update()", "NONE", "No schema check, no policy eval"],
            ["DELETE /api/policies/[id]", "prisma.policy.delete()", "NONE", "No tombstone, no audit trail"],
            ["POST /api/merges/simulate", "Hardcoded response", "NONE", "Not a real operation"],
            ["POST /api/acceptance-engine", "Empty handler", "NONE", "Route exists but does nothing"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.20, CONTENT_W * 0.30],
    ))
    story.append(PS(8))

    story.append(PH2("Missing Pipeline Stages"))
    story.append(P(
        "The specification defines five stages that must execute in order before any fact is committed. "
        "None of these stages exist in the current implementation:"
    ))
    story.append(PS(4))
    story.append(bullet(
        "<b>Canonicalization:</b> Facts must be serialized using RFC8785 to produce a deterministic byte "
        "representation. Currently, facts are stored as-is with no serialization guarantee."
    ))
    story.append(bullet(
        "<b>Schema Verification:</b> Facts must be validated against a registered schema before acceptance. "
        "There is no schema registry and no validation against any schema definition."
    ))
    story.append(bullet(
        "<b>Signature Validation:</b> Facts must carry an Ed25519 signature from an authorized identity. "
        "No signature mechanism exists in the codebase."
    ))
    story.append(bullet(
        "<b>Policy Evaluation:</b> Facts must pass through the EPD policy engine for compliance checking. "
        "While the EPD engine exists, it is never invoked during the write path."
    ))
    story.append(bullet(
        "<b>Deterministic Sequencing:</b> Accepted facts must be assigned a deterministic sequence number. "
        "Facts currently use database auto-increment IDs, which are non-deterministic across instances."
    ))
    story.append(PS(6))

    story.append(callout(
        "PIPELINE VERDICT",
        "The acceptance pipeline is entirely absent. Every write operation in the system bypasses all "
        "specified safety mechanisms. Three API routes return hardcoded mock data and perform no real "
        "operations at all. The system provides no guarantees about data integrity, provenance, or "
        "policy compliance.",
        accent=SEM_ERROR,
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 7: Determinism Audit
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("7  Determinism Audit"))
    story.append(PS(6))

    story.append(P(
        "Determinism is a non-negotiable property of the Epistemic Runtime. The specification requires that "
        "any fact, given the same inputs, must produce the same output at any point in time and on any node. "
        "This audit identifies every instance of non-determinism in the codebase, classified by severity."
    ))
    story.append(PS(6))

    story.append(PH2("CRITICAL Non-Determinism Instances"))
    story.append(P(
        "The following instances represent fundamental violations of the determinism requirement. Each one "
        "can cause the same logical operation to produce different results on different executions, nodes, "
        "or replay attempts."
    ))
    story.append(PS(4))

    story.append(make_table(
        ["#", "Instance", "Location", "Description"],
        [
            ["1", "Date.now()", "src/lib/epd/index.ts",
             "The now() function in the EPD evaluator returns Date.now(), making evaluation results "
             "time-dependent. Two evaluations of the same policy at different times produce different timestamps."],
            ["2", "Date.now()", "src/lib/seed.ts",
             "Seed data uses Date.now() for timestamp fields, making the seed non-reproducible across runs."],
            ["3", "Date.now()", "src/app/api/policies/route.ts",
             "Policy creation timestamps use Date.now(), ensuring the same policy created twice gets different timestamps."],
            ["4", "Date.now()", "src/app/api/merges/route.ts",
             "Merge operations use Date.now() for merge timestamps, making merge results non-reproducible."],
            ["5", "Date.now()", "src/app/api/audit/route.ts",
             "Audit log entries use Date.now(), making audit trails non-deterministic."],
            ["6", "Math.random()", "src/app/api/proofs/route.ts",
             "ZK 'proofs' are generated using Math.random(), producing different values on every request."],
            ["7", "Math.random()", "src/components/epistemic/zk-circuit.tsx",
             "Frontend ZK circuit visualization uses Math.random() for proof display values."],
            ["8", "JSON.stringify()", "src/lib/epd/index.ts",
             "Hash computation uses JSON.stringify() for serialization, which does not guarantee key ordering "
             "across JavaScript engines or even across V8 versions."],
        ],
        col_widths=[CONTENT_W * 0.04, CONTENT_W * 0.14, CONTENT_W * 0.26, CONTENT_W * 0.56],
    ))
    story.append(PS(8))

    story.append(PH2("HIGH Non-Determinism Instances"))
    story.append(make_table(
        ["#", "Instance", "Location", "Description"],
        [
            ["1", "Math.random()", "src/components/epistemic/gossip-sim.tsx",
             "Gossip simulation uses Math.random() for network delay and peer selection simulation."],
            ["2", "Math.random()", "src/components/epistemic/shard-rebalance.tsx",
             "Shard rebalance simulation uses Math.random() for shard assignment."],
            ["3", "Math.random()", "src/components/epistemic/invariant-miner.tsx",
             "Invariant mining visualization uses Math.random() for candidate selection display."],
        ],
        col_widths=[CONTENT_W * 0.04, CONTENT_W * 0.14, CONTENT_W * 0.32, CONTENT_W * 0.50],
    ))
    story.append(PS(8))

    story.append(PH2("Impact Summary"))
    story.append(P(
        "The determinism audit reveals 8 CRITICAL and 3 HIGH instances of non-determinism. The most damaging "
        "pattern is the use of <font face='LiberationMono'>Date.now()</font> in what should be kernel code. "
        "The EPD evaluator's <font face='LiberationMono'>now()</font> function is particularly concerning "
        "because it means policy evaluation results depend on wall-clock time, making replay impossible. "
        "The use of <font face='LiberationMono'>Math.random()</font> in the proofs API route means that "
        "the same query returns different 'proofs' on every request, which would be immediately detectable "
        "in any real deployment."
    ))
    story.append(PS(4))

    story.append(P(
        "The <font face='LiberationMono'>JSON.stringify()</font> usage for hashing is a subtle but critical "
        "issue. JavaScript does not guarantee key ordering in object serialization. Two logically identical "
        "facts with keys in different insertion order will produce different string representations and "
        "therefore different hashes. This breaks content addressing at a fundamental level."
    ))
    story.append(PS(6))

    story.append(callout(
        "DETERMINISM VERDICT",
        "The system is fundamentally non-deterministic. No replay, no verification, and no consensus "
        "is possible when the same inputs produce different outputs. The 8 CRITICAL instances must all "
        "be resolved before the system can be considered even minimally compliant with the specification.",
        accent=SEM_ERROR,
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 8: Technical Debt Register
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("8  Technical Debt Register"))
    story.append(PS(6))

    story.append(P(
        "Technical debt is categorized by domain to provide a structured view of what must be addressed "
        "to achieve convergence with the specification. Each debt item represents work that must be "
        "completed before the system can operate as specified. The debt is substantial and spans every "
        "architectural layer of the system."
    ))
    story.append(PS(6))

    story.append(PH2("Architecture Debt"))
    story.append(bullet(
        "<b>No Fact Model:</b> The specification defines facts as the fundamental unit of knowledge, with "
        "strict typing, canonicalization, and content addressing. The implementation has no fact model. Data "
        "is stored as generic Prisma models with no structural guarantees."
    ))
    story.append(bullet(
        "<b>No Event Sourcing:</b> The specification mandates an append-only fact log as the source of truth. "
        "The implementation uses mutable CRUD operations on SQLite. Records can be updated and deleted, "
        "destroying the audit trail."
    ))
    story.append(bullet(
        "<b>No Acceptance Pipeline:</b> As detailed in Chapter 6, the acceptance pipeline is entirely absent. "
        "This is the single largest architectural debt item, as the pipeline is the structural backbone of "
        "the specification."
    ))
    story.append(bullet(
        "<b>No Projection Engine:</b> The specification requires projections to derive current state from the "
        "fact log. Without a fact log, projections are impossible. Queries go directly to SQLite tables."
    ))
    story.append(PS(6))

    story.append(PH2("Implementation Debt"))
    story.append(bullet(
        "<b>FNV-1a Hash:</b> A 32-bit non-cryptographic hash function is used where SHA-256 is specified. "
        "This produces collisions at scale and provides no integrity guarantees."
    ))
    story.append(bullet(
        "<b>Binary Merkle Tree:</b> A simple binary Merkle tree that rebuilds on every insertion is used "
        "where a Merkle Mountain Range is specified. This destroys historical proof capability."
    ))
    story.append(bullet(
        "<b>Fake ZK Proofs:</b> Random strings generated by Math.random() are presented as zero-knowledge "
        "proofs. This is not a shortcut; it is a fabrication that must be removed."
    ))
    story.append(bullet(
        "<b>Hardcoded Verification:</b> The verification status of all entities is hardcoded to true. "
        "No actual verification is performed."
    ))
    story.append(PS(6))

    story.append(PH2("Infrastructure Debt"))
    story.append(bullet(
        "<b>No Adapters:</b> The specification defines an adapter abstraction for connecting external data "
        "sources. No adapter system exists."
    ))
    story.append(bullet(
        "<b>No Consensus:</b> The specification describes a consensus protocol for multi-node agreement. "
        "No consensus mechanism exists."
    ))
    story.append(bullet(
        "<b>No CLI Binary:</b> The EPD CLI tool exists but only handles policy evaluation. No kernel CLI "
        "binary exists for administrative operations."
    ))
    story.append(PS(6))

    story.append(PH2("Testing Debt"))
    story.append(bullet(
        "<b>No Test Suite:</b> The repository has zero test files. There are no unit tests, no integration "
        "tests, no property-based tests, and no end-to-end tests. Every aspect of the system is untested."
    ))
    story.append(bullet(
        "<b>No CI Pipeline:</b> There is no continuous integration pipeline. No automated checks run on "
        "commits or pull requests."
    ))
    story.append(PS(6))

    story.append(PH2("Security Debt"))
    story.append(bullet(
        "<b>No Cryptographic Verification:</b> As detailed in Chapter 5, no cryptographic primitives are "
        "correctly implemented. The system has no integrity verification mechanism."
    ))
    story.append(bullet(
        "<b>Fake Proofs:</b> The fabricated ZK proofs represent a security vulnerability. If deployed, "
        "they would provide a false sense of security while offering no actual protection."
    ))
    story.append(bullet(
        "<b>No Signature Validation:</b> Without Ed25519 signatures, there is no way to verify the origin "
        "of any fact. Any client can inject arbitrary data."
    ))
    story.append(PS(6))

    story.append(PH2("Operational Debt"))
    story.append(bullet(
        "<b>No Deployment Automation:</b> There is no infrastructure-as-code, no containerization, and "
        "no deployment pipeline."
    ))
    story.append(bullet(
        "<b>No Monitoring:</b> There are no health checks, no metrics collection, and no alerting. "
        "The system has no observability."
    ))
    story.append(bullet(
        "<b>No Runbook:</b> There are no operational procedures documented for incident response, "
        "backup, or recovery."
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 9: Convergence Assessment
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("9  Convergence Assessment"))
    story.append(PS(6))

    story.append(P(
        "The central question of this audit is whether the implementation is converging toward the Epistemic "
        "Runtime v0.8 specification. Convergence means that with each iteration, the implementation moves "
        "closer to the specified architecture, replacing mock data with real logic, adding missing components, "
        "and resolving contradictions. Divergence means the implementation is moving away from the specification, "
        "adding features that are not in the spec while neglecting those that are."
    ))
    story.append(PS(6))

    story.append(PH2("Current Trajectory: Diverging"))
    story.append(P(
        "The evidence from this audit is clear: the implementation is not converging toward the specification. "
        "The current development trajectory adds more dashboard sections and mock API routes, not kernel "
        "implementation. Each new visualization component makes the dashboard more impressive while leaving "
        "the kernel layer unchanged. The gap between specification and implementation is growing, not shrinking."
    ))
    story.append(PS(4))

    story.append(P(
        "This is not a criticism of the dashboard work -- the dashboard is excellent at approximately 90% "
        "completeness. The problem is that the dashboard is a visualization layer for a kernel that does not "
        "exist. A perfect dashboard on top of an empty kernel is still an empty kernel. The dashboard shows "
        "what the system would look like if it worked; it does not make the system work."
    ))
    story.append(PS(6))

    story.append(PH2("The Dashboard-Kernel Imbalance"))
    story.append(make_table(
        ["Layer", "Completeness", "Assessment"],
        [
            ["Dashboard (UI Components)", "~90%", "Well-structured, visually complete, good UX"],
            ["API Layer (Routes)", "~60%", "Most routes functional, some mock, some empty"],
            ["Kernel (Core Logic)", "~5%", "Only EPD engine qualifies as kernel code"],
            ["Infrastructure", "~2%", "No adapters, no consensus, no CLI"],
        ],
        col_widths=[CONTENT_W * 0.30, CONTENT_W * 0.15, CONTENT_W * 0.55],
    ))
    story.append(PS(8))

    story.append(PH2("What Convergence Would Look Like"))
    story.append(P(
        "True convergence would require the development trajectory to shift from dashboard-first to "
        "kernel-first. The single highest-impact action would be implementing the acceptance pipeline. "
        "This would establish the structural backbone that all other kernel components depend on. Without "
        "the acceptance pipeline, implementing the fact log, the deterministic sequencer, and the "
        "projection engine would have no integration point."
    ))
    story.append(PS(4))

    story.append(P(
        "Convergence would be measurable by tracking the following indicators over time: the percentage "
        "of API routes that route through the acceptance pipeline (currently 0%), the number of mock "
        "API routes replaced with real implementations (currently 0 of 3), the resolution of spec "
        "contradictions (currently 0 of 3), and the reduction in non-determinism instances (currently "
        "0 of 11). All four indicators are at zero, confirming that convergence has not begun."
    ))
    story.append(PS(6))

    story.append(callout(
        "CONVERGENCE VERDICT",
        "The implementation is NOT converging toward the specification. The development trajectory is "
        "adding visualization layers, not kernel logic. Without implementing the acceptance pipeline "
        "as the foundational layer, the project will continue to diverge. The dashboard is excellent; "
        "the kernel is nearly empty. Success requires pivoting from dashboard-first to kernel-first "
        "development immediately.",
        accent=SEM_ERROR,
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 10: Execution Roadmap
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("10  Execution Roadmap"))
    story.append(PS(6))

    story.append(P(
        "This roadmap defines ten implementation steps that would move the project from its current state "
        "toward specification compliance. Steps are ordered by dependency: foundational steps must be "
        "completed before dependent steps can begin. Each step includes its purpose, dependencies, affected "
        "modules, complexity assessment, and acceptance criteria."
    ))
    story.append(PS(8))

    # Step 1
    story.append(PH2("Step 1: Complete Acceptance Pipeline"))
    story.append(P(
        "<b>Purpose:</b> Establish the structural backbone of the kernel. The acceptance pipeline mediates "
        "all write operations, ensuring that every fact passes through canonicalization, schema verification, "
        "signature validation, and policy evaluation before being committed to the fact log."
    ))
    story.append(P(
        "<b>Dependencies:</b> None. This is the foundational step."
    ))
    story.append(P(
        "<b>Affected Modules:</b> All API routes, Prisma write operations, EPD evaluator integration"
    ))
    story.append(P(
        "<b>Complexity:</b> HIGH. Requires implementing the full pipeline with five stages, error handling, "
        "rejection logging, and integration with the existing EPD evaluator."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> All write operations route through the pipeline. Rejected facts are "
        "logged with reasons. Accepted facts carry canonical form, schema hash, and evaluation result."
    ))
    story.append(PS(6))

    # Step 2
    story.append(PH2("Step 2: Replace FNV-1a with SHA-256"))
    story.append(P(
        "<b>Purpose:</b> Ensure content-addressed hashing meets the specification's cryptographic "
        "requirements. SHA-256 provides 256-bit hashes with sufficient collision resistance for any "
        "foreseeable scale, replacing the 32-bit FNV-1a hashes that produce collisions at volume."
    ))
    story.append(P(
        "<b>Dependencies:</b> None. Can be implemented independently."
    ))
    story.append(P(
        "<b>Affected Modules:</b> All hash computation code, Merkle tree construction, content-addressed "
        "storage, API routes that compute or return hashes"
    ))
    story.append(P(
        "<b>Complexity:</b> MEDIUM. Straightforward replacement but requires database migration for "
        "existing hash values."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> All hash operations produce SHA-256 digests. Existing data is "
        "rehashed during migration. All tests pass with new hash values."
    ))
    story.append(PS(6))

    # Step 3
    story.append(PH2("Step 3: Implement RFC8785 Canonicalizer"))
    story.append(P(
        "<b>Purpose:</b> Ensure deterministic JSON serialization across all runtime environments. "
        "RFC8785 defines a canonical JSON serialization that produces identical byte representations "
        "regardless of key insertion order, whitespace preferences, or number formatting differences."
    ))
    story.append(P(
        "<b>Dependencies:</b> None. Can be implemented independently."
    ))
    story.append(P(
        "<b>Affected Modules:</b> Acceptance pipeline (canonicalization stage), hash computation, "
        "fact serialization, signature payload construction"
    ))
    story.append(P(
        "<b>Complexity:</b> MEDIUM. Requires implementing the JCS algorithm or integrating a "
        "proven library, plus replacing all JSON.stringify() calls in hash computation paths."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> The same logical object always produces the same canonical "
        "byte representation, regardless of key ordering in the source object."
    ))
    story.append(PS(6))

    # Step 4
    story.append(PH2("Step 4: Implement Fact Log"))
    story.append(P(
        "<b>Purpose:</b> Replace mutable CRUD with an append-only event store. The fact log is the "
        "source of truth, recording every accepted fact in immutable, sequenced order. Projections "
        "derive current state by replaying the fact log."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 1 (Acceptance Pipeline). Facts must be accepted before they are logged."
    ))
    story.append(P(
        "<b>Affected Modules:</b> All write operations, Prisma schema (new Fact table), API routes, "
        "projection queries"
    ))
    story.append(P(
        "<b>Complexity:</b> HIGH. Requires a new database schema, migration of existing data to fact "
        "format, and restructuring all read paths to use projections instead of direct queries."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> All accepted facts are recorded in the fact log. No update or "
        "delete operations exist on the fact table. Current state is derived from projections."
    ))
    story.append(PS(6))

    # Step 5
    story.append(PH2("Step 5: Implement Deterministic Sequencer"))
    story.append(P(
        "<b>Purpose:</b> Assign deterministic sequence numbers to accepted facts. The sequencer "
        "replaces database auto-increment IDs with a deterministic ordering scheme that produces "
        "identical sequences across nodes given the same input order."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 4 (Fact Log). The sequencer assigns positions within the fact log."
    ))
    story.append(P(
        "<b>Affected Modules:</b> Fact log writes, all references to record IDs, consensus protocol "
        "(future), replication (future)"
    ))
    story.append(P(
        "<b>Complexity:</b> MEDIUM. Requires a deterministic ordering algorithm (e.g., hybrid logical "
        "clocks or Lamport timestamps) and migration of existing ID references."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> The same set of facts, received in the same order, always produces "
        "the same sequence numbers on any node."
    ))
    story.append(PS(6))

    # Step 6
    story.append(PH2("Step 6: Implement Projection Engine"))
    story.append(P(
        "<b>Purpose:</b> Derive current state from the fact log by replaying events through projection "
        "functions. Projections replace direct database queries with computed views that are always "
        "consistent with the fact log."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 4 (Fact Log). Projections read from the fact log."
    ))
    story.append(P(
        "<b>Affected Modules:</b> All read operations, dashboard data sources, API read routes, "
        "search and filter logic"
    ))
    story.append(P(
        "<b>Complexity:</b> HIGH. Requires implementing projection functions for every current query, "
        "plus a projection registry and incremental update mechanism."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> All read operations use projections. Projections are automatically "
        "updated when new facts are appended. Point-in-time queries are supported."
    ))
    story.append(PS(6))

    # Step 7
    story.append(PH2("Step 7: Implement Ed25519 Signatures"))
    story.append(P(
        "<b>Purpose:</b> Enable cryptographic authentication of facts. Each fact carries an Ed25519 "
        "signature from the identity that authored it, allowing verification of fact provenance and "
        "detection of tampering."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 3 (RFC8785 Canonicalizer). Signatures are computed over canonical "
        "fact representations."
    ))
    story.append(P(
        "<b>Affected Modules:</b> Acceptance pipeline (signature validation stage), fact creation, "
        "trust runtime, verification layer"
    ))
    story.append(P(
        "<b>Complexity:</b> MEDIUM. Requires Ed25519 library integration, key management, and "
        "signature verification in the acceptance pipeline."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> Every accepted fact carries a valid Ed25519 signature. The "
        "acceptance pipeline rejects unsigned or invalidly signed facts."
    ))
    story.append(PS(6))

    # Step 8
    story.append(PH2("Step 8: Fix MMR Implementation"))
    story.append(P(
        "<b>Purpose:</b> Replace the simple binary Merkle tree with a proper Merkle Mountain Range. "
        "The MMR supports efficient append-only proof generation, historical verification, and "
        "incremental root updates without rebuilding the entire tree."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 2 (SHA-256). MMR nodes must use SHA-256 hashes."
    ))
    story.append(P(
        "<b>Affected Modules:</b> Merkle tree construction, proof generation, verification layer, "
        "dashboard MMR visualization"
    ))
    story.append(P(
        "<b>Complexity:</b> HIGH. Requires implementing the full MMR data structure with bagging "
        "peaks, proof generation, and verification. This is algorithmically non-trivial."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> The MMR supports O(log n) append operations, membership proofs "
        "for any historical fact, and consistent root hashes across nodes."
    ))
    story.append(PS(6))

    # Step 9
    story.append(PH2("Step 9: Implement Schema Registry"))
    story.append(P(
        "<b>Purpose:</b> Enable schema versioning and validation. The schema registry stores versioned "
        "schema definitions and validates facts against their declared schema before acceptance."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 4 (Fact Log). Schemas are associated with fact types in the fact log."
    ))
    story.append(P(
        "<b>Affected Modules:</b> Acceptance pipeline (schema verification stage), fact creation, "
        "policy evaluation, EPD engine"
    ))
    story.append(P(
        "<b>Complexity:</b> MEDIUM. Requires schema definition format, version negotiation protocol, "
        "and validation engine."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> Facts are validated against registered schemas. Schema changes "
        "are versioned. Backward compatibility is maintained."
    ))
    story.append(PS(6))

    # Step 10
    story.append(PH2("Step 10: Implement Policy Time-Travel"))
    story.append(P(
        "<b>Purpose:</b> Enable evaluation of policies against historical states. Policy time-travel "
        "allows querying what a policy would have evaluated to at any point in the fact log's history, "
        "supporting audit, compliance, and debugging use cases."
    ))
    story.append(P(
        "<b>Dependencies:</b> Step 9 (Schema Registry). Historical schemas must be available for "
        "correct historical evaluation."
    ))
    story.append(P(
        "<b>Affected Modules:</b> EPD evaluator, projection engine, timeline API, dashboard timeline "
        "visualization"
    ))
    story.append(P(
        "<b>Complexity:</b> MEDIUM. Requires point-in-time projection queries and EPD evaluator "
        "integration with historical fact contexts."
    ))
    story.append(P(
        "<b>Acceptance Criteria:</b> Any policy can be evaluated against any historical point in the "
        "fact log. Results are deterministic and reproducible."
    ))
    story.append(PS(8))

    story.append(PH2("Roadmap Dependencies"))
    story.append(PC(
        "  Step 1: Acceptance Pipeline      [no deps]     --> foundational\n"
        "  Step 2: SHA-256                  [no deps]     --> independent\n"
        "  Step 3: RFC8785 Canonicalizer    [no deps]     --> independent\n"
        "  Step 4: Fact Log                 [Step 1]      --> depends on pipeline\n"
        "  Step 5: Deterministic Sequencer  [Step 4]      --> depends on fact log\n"
        "  Step 6: Projection Engine        [Step 4]      --> depends on fact log\n"
        "  Step 7: Ed25519 Signatures       [Step 3]      --> depends on canonicalizer\n"
        "  Step 8: Fix MMR                  [Step 2]      --> depends on SHA-256\n"
        "  Step 9: Schema Registry          [Step 4]      --> depends on fact log\n"
        "  Step 10: Policy Time-Travel      [Step 9]      --> depends on schema registry"
    ))
    story.append(PS(6))

    story.append(P(
        "Steps 1, 2, and 3 have no dependencies and can begin immediately in parallel. Steps 4-10 form "
        "a dependency chain that must be executed in sequence. The estimated timeline for full completion "
        "is 8-12 months of focused kernel development with a team of at least two engineers dedicated "
        "to kernel work (not dashboard work)."
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 11: Risk Register
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("11  Risk Register"))
    story.append(PS(6))

    story.append(P(
        "The following risks are identified based on the current state of the implementation. Each risk "
        "is assessed for likelihood, impact, and the urgency of mitigation. Risks are ordered by severity."
    ))
    story.append(PS(6))

    story.append(PH2("Risk 1: Dashboard-First Development Continues"))
    story.append(P(
        "<b>Likelihood:</b> HIGH. <b>Impact:</b> CRITICAL. <b>Urgency:</b> IMMEDIATE."
    ))
    story.append(P(
        "The current development pattern adds dashboard sections and mock APIs rather than kernel "
        "implementation. If this continues, the gap between specification and implementation will widen "
        "indefinitely. Each new mock section increases the cost of replacing it with real logic, because "
        "the dashboard integration points multiply. Mitigation: mandate kernel-first development with "
        "dashboard updates only when kernel functionality exists to support them."
    ))
    story.append(PS(6))

    story.append(PH2("Risk 2: FNV-1a Hash Collisions at Scale"))
    story.append(P(
        "<b>Likelihood:</b> HIGH. <b>Impact:</b> CRITICAL. <b>Urgency:</b> HIGH."
    ))
    story.append(P(
        "FNV-1a 32-bit produces only 4,294,967,296 possible hash values. By the birthday paradox, "
        "collisions become likely at approximately 65,536 entries. In a production system with "
        "continuous writes, this threshold could be reached in days or hours. A collision would cause "
        "two different facts to be treated as identical, corrupting the content-addressed store. "
        "Mitigation: replace FNV-1a with SHA-256 as specified."
    ))
    story.append(PS(6))

    story.append(PH2("Risk 3: Non-deterministic Replay"))
    story.append(P(
        "<b>Likelihood:</b> CERTAIN. <b>Impact:</b> CRITICAL. <b>Urgency:</b> HIGH."
    ))
    story.append(P(
        "The 8 CRITICAL non-determinism instances guarantee that replay will produce different results. "
        "This makes audit and compliance impossible. In regulated environments (which the specification "
        "explicitly targets), the inability to demonstrate deterministic replay is a compliance failure. "
        "Mitigation: eliminate all Date.now(), Math.random(), and JSON.stringify() usage in kernel code."
    ))
    story.append(PS(6))

    story.append(PH2("Risk 4: Fabricated ZK Proofs as Security Vulnerability"))
    story.append(P(
        "<b>Likelihood:</b> HIGH (if deployed). <b>Impact:</b> CRITICAL. <b>Urgency:</b> HIGH."
    ))
    story.append(P(
        "If the system is deployed with fabricated ZK proofs, it will present a security interface that "
        "provides no actual security. An attacker can generate arbitrary 'proofs' using the same "
        "Math.random() approach and the system will accept them. This is not a theoretical risk; it is "
        "an active vulnerability that would be exploitable from day one. Mitigation: remove all fabricated "
        "proofs immediately and replace with honest stubs or real implementation."
    ))
    story.append(PS(6))

    story.append(PH2("Risk 5: No Test Coverage"))
    story.append(P(
        "<b>Likelihood:</b> CERTAIN. <b>Impact:</b> HIGH. <b>Urgency:</b> MEDIUM."
    ))
    story.append(P(
        "With zero test coverage, any change to the codebase risks introducing regressions that go "
        "undetected. As the kernel is implemented, the lack of tests will make it impossible to verify "
        "that new code does not break existing functionality. Mitigation: establish a test suite with "
        "at minimum unit tests for all kernel modules before beginning roadmap implementation."
    ))

    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 12: Final Verdict
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PH1("12  Final Verdict"))
    story.append(PS(6))

    story.append(P(
        "This convergence audit has examined the Epistemic Runtime repository against the v0.8 specification "
        "across twelve dimensions: specification mapping, drift detection, cryptographic verification, "
        "acceptance pipeline, determinism, technical debt, convergence trajectory, execution roadmap, and "
        "risk assessment. The verdict is based on four questions that determine whether the project is "
        "on track to deliver the specified system."
    ))
    story.append(PS(8))

    story.append(PH2("Question 1: Are We Building the Same System?"))
    story.append(callout(
        "ANSWER: PARTIALLY",
        "The specification describes an Epistemic Runtime kernel: an acceptance pipeline, fact log, "
        "deterministic sequencer, projection engine, and cryptographic verification layer. The "
        "implementation is a dashboard that visualizes what such a kernel would look like. These are "
        "fundamentally different things. The dashboard is a presentation layer; the kernel is an "
        "execution engine. The only shared component is the EPD policy engine, which is real and "
        "well-implemented but operates in isolation from the rest of the system.",
        accent=SEM_WARNING,
        bg=colors.HexColor('#91794812'),
    ))
    story.append(PS(8))

    story.append(PH2("Question 2: Is Implementation Converging?"))
    story.append(callout(
        "ANSWER: NO",
        "The development trajectory adds visualization components and mock API routes, not kernel "
        "logic. Each iteration makes the dashboard more impressive while leaving the kernel layer "
        "unchanged. The specification implementation percentage has not increased meaningfully. "
        "The gap between specification and implementation is growing, not shrinking. Convergence "
        "has not begun.",
        accent=SEM_ERROR,
        bg=colors.HexColor('#9b443c12'),
    ))
    story.append(PS(8))

    story.append(PH2("Question 3: Are There Contradictions?"))
    story.append(callout(
        "ANSWER: YES — THREE CRITICAL CONTRADICTIONS",
        "1. Hash Algorithm: FNV-1a 32-bit instead of SHA-256. This is not a preference; it is a "
        "fundamental architectural divergence affecting data integrity. "
        "2. Merkle Structure: Binary Merkle tree rebuilt on insertion instead of Merkle Mountain Range. "
        "This destroys historical proof capability. "
        "3. ZK Proofs: Math.random() strings instead of cryptographic proofs. This is fabrication, "
        "not implementation.",
        accent=SEM_ERROR,
        bg=colors.HexColor('#9b443c12'),
    ))
    story.append(PS(8))

    story.append(PH2("Question 4: What Is the Minimum Remaining Work?"))
    story.append(P(
        "The minimum remaining work to achieve specification compliance is defined by the 10-step "
        "execution roadmap in Chapter 10. This represents approximately 8-12 months of focused kernel "
        "development with a dedicated team. The three independent steps (Acceptance Pipeline, SHA-256, "
        "RFC8785 Canonicalizer) can begin immediately. The remaining seven steps form a dependency chain "
        "that must be executed in sequence."
    ))
    story.append(PS(4))

    story.append(make_table(
        ["Step", "Component", "Dependencies", "Complexity", "Estimated Duration"],
        [
            ["1", "Acceptance Pipeline", "None", "HIGH", "6-8 weeks"],
            ["2", "SHA-256 Hash", "None", "MEDIUM", "2-3 weeks"],
            ["3", "RFC8785 Canonicalizer", "None", "MEDIUM", "3-4 weeks"],
            ["4", "Fact Log", "Step 1", "HIGH", "6-8 weeks"],
            ["5", "Deterministic Sequencer", "Step 4", "MEDIUM", "3-4 weeks"],
            ["6", "Projection Engine", "Step 4", "HIGH", "6-8 weeks"],
            ["7", "Ed25519 Signatures", "Step 3", "MEDIUM", "3-4 weeks"],
            ["8", "MMR Implementation", "Step 2", "HIGH", "6-8 weeks"],
            ["9", "Schema Registry", "Step 4", "MEDIUM", "3-4 weeks"],
            ["10", "Policy Time-Travel", "Step 9", "MEDIUM", "3-4 weeks"],
        ],
        col_widths=[CONTENT_W * 0.06, CONTENT_W * 0.22, CONTENT_W * 0.16, CONTENT_W * 0.14, CONTENT_W * 0.42],
    ))
    story.append(PS(10))

    story.append(PH2("Closing Statement"))
    story.append(PS(4))

    # Final callout
    story.append(callout(
        "FROM HOPE TO PROOF",
        "The Epistemic Runtime v0.8 specification describes a system that provides cryptographic proof "
        "of knowledge integrity. The current implementation provides visualizations of what such proofs "
        "might look like. The distance between these two things is the distance between hope and proof. "
        "Closing this gap requires a fundamental shift in development priorities: from dashboard-first "
        "to kernel-first. The dashboard is excellent. The kernel is nearly empty. Success requires "
        "building the kernel that the dashboard promises. The roadmap exists. The specification is clear. "
        "What remains is the discipline to execute.",
        accent=ACCENT,
        bg=colors.HexColor('#8c722610'),
    ))

    # ── Build ─────────────────────────────────────────────────────────────────
    doc.build(story)
    print(f"Generated: {output_path}")


if __name__ == '__main__':
    build_document()
