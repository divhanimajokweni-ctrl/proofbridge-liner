#!/usr/bin/env python3
"""
VVU HBK Mk-II — Terminal-as-a-Service (TaaS) Commercial Framework Specification
Phase 2 — Power & Thermal Architecture + Commercial Model

Comprehensive PDF generator via ReportLab with dark theme, gold accent, and all 10 sections.
"""

import hashlib
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, CondPageBreak, KeepTogether, HRFlowable, Flowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate

# ━━ Cascade Palette — Dark Theme with Gold Accent ━━

# Dark backgrounds
PAGE_BG       = colors.HexColor('#1a1a1e')
SECTION_BG    = colors.HexColor('#222226')
CARD_BG       = colors.HexColor('#2a2a2e')
TABLE_STRIPE  = colors.HexColor('#2e2e33')

# Structural fills
HEADER_FILL   = colors.HexColor('#1e1e22')
COVER_BLOCK   = colors.HexColor('#141418')

# Borders and edges
BORDER        = colors.HexColor('#3a3a40')
ICON          = colors.HexColor('#C9A84C')

# Gold accent — VVU branding
VVU_GOLD      = colors.HexColor('#C9A84C')
ACCENT        = colors.HexColor('#C9A84C')
ACCENT_2      = colors.HexColor('#4296b2')

# Typography
TEXT_PRIMARY   = colors.HexColor('#e8e6e0')
TEXT_MUTED     = colors.HexColor('#87847d')
TEXT_LIGHT     = colors.HexColor('#c8c6be')

# Semantic (low-saturation)
SEM_SUCCESS   = colors.HexColor('#5aad7a')
SEM_WARNING   = colors.HexColor('#C9A84C')
SEM_ERROR     = colors.HexColor('#d46a62')
SEM_INFO      = colors.HexColor('#5a9ac0')

# Table colors
TABLE_HEADER_COLOR = colors.HexColor('#2a2520')
TABLE_HEADER_TEXT  = VVU_GOLD
TABLE_ROW_EVEN     = colors.HexColor('#1e1e22')
TABLE_ROW_ODD      = colors.HexColor('#252528')

# ─── Page Dimensions ───
PAGE_WIDTH, PAGE_HEIGHT = A4  # 595.27 x 841.89 points
LEFT_MARGIN = 2.2 * cm
RIGHT_MARGIN = 2.2 * cm
TOP_MARGIN = 2.5 * cm
BOTTOM_MARGIN = 2.5 * cm
CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN

OUTPUT_PATH = '/home/z/my-project/public/hbk/docs/taas-commercial-framework-spec.pdf'

# ─── Styles ───
def create_styles():
    styles = getSampleStyleSheet()

    # H1 — Section title
    styles.add(ParagraphStyle(
        name='H1',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=VVU_GOLD,
        spaceBefore=24,
        spaceAfter=12,
        alignment=TA_LEFT,
    ))

    # H2 — Subsection title
    styles.add(ParagraphStyle(
        name='H2',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=ACCENT_2,
        spaceBefore=16,
        spaceAfter=8,
        alignment=TA_LEFT,
    ))

    # H3 — Minor heading
    styles.add(ParagraphStyle(
        name='H3',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=TEXT_LIGHT,
        spaceBefore=10,
        spaceAfter=6,
        alignment=TA_LEFT,
    ))

    # Body text
    styles.add(ParagraphStyle(
        name='BodyTaaS',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_PRIMARY,
        alignment=TA_JUSTIFY,
        spaceBefore=3,
        spaceAfter=6,
    ))

    # Bullet text
    styles.add(ParagraphStyle(
        name='BulletTaaS',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_PRIMARY,
        leftIndent=18,
        spaceBefore=2,
        spaceAfter=3,
    ))

    # Bold emphasis
    styles.add(ParagraphStyle(
        name='EmphasisTaaS',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=VVU_GOLD,
        spaceBefore=3,
        spaceAfter=6,
    ))

    # Callout box text
    styles.add(ParagraphStyle(
        name='CalloutTaaS',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=VVU_GOLD,
        leftIndent=12,
        spaceBefore=4,
        spaceAfter=4,
    ))

    # Table header
    styles.add(ParagraphStyle(
        name='TH',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TABLE_HEADER_TEXT,
        alignment=TA_CENTER,
    ))

    # Table cell
    styles.add(ParagraphStyle(
        name='TC',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_PRIMARY,
        alignment=TA_LEFT,
    ))

    # Table cell centered
    styles.add(ParagraphStyle(
        name='TCC',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_PRIMARY,
        alignment=TA_CENTER,
    ))

    # TOC Level 0
    styles.add(ParagraphStyle(
        name='TOC0',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=VVU_GOLD,
        spaceBefore=8,
        spaceAfter=4,
        leftIndent=0,
    ))

    # TOC Level 1
    styles.add(ParagraphStyle(
        name='TOC1',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_LIGHT,
        spaceBefore=4,
        spaceAfter=2,
        leftIndent=24,
    ))

    # Footer page number
    styles.add(ParagraphStyle(
        name='PageNum',
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
    ))

    # Cover title
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=VVU_GOLD,
        alignment=TA_CENTER,
        spaceBefore=20,
        spaceAfter=12,
    ))

    # Cover subtitle
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=TEXT_LIGHT,
        alignment=TA_CENTER,
        spaceBefore=8,
        spaceAfter=8,
    ))

    # Cover info
    styles.add(ParagraphStyle(
        name='CoverInfo',
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
        spaceBefore=4,
        spaceAfter=4,
    ))

    return styles


# ─── TocDocTemplate ───
class TocDocTemplate(BaseDocTemplate):
    """Custom DocTemplate that supports Table of Contents via afterFlowable."""
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))


# ─── Heading helper ───
def add_heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


# ─── Page number footer ───
def footer_arabic(canvas, doc):
    """Arabic page number, centered in footer with VVU branding."""
    canvas.saveState()
    # Dark background
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    # Footer line
    canvas.setStrokeColor(VVU_GOLD)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT_MARGIN, BOTTOM_MARGIN - 4 * mm, PAGE_WIDTH - RIGHT_MARGIN, BOTTOM_MARGIN - 4 * mm)
    # Page number
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(PAGE_WIDTH / 2, BOTTOM_MARGIN - 12 * mm, str(doc.page))
    # VVU branding in footer
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(colors.HexColor('#555555'))
    canvas.drawString(LEFT_MARGIN, BOTTOM_MARGIN - 12 * mm, 'VVU EARTH TECH')
    canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, BOTTOM_MARGIN - 12 * mm, 'TaaS-CFS-2025-001')
    canvas.restoreState()


def footer_cover(canvas, doc):
    """Cover page footer — no page number."""
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.restoreState()


# ─── Custom Flowables ───
class GoldRule(Flowable):
    """A thin gold horizontal rule for section emphasis."""
    def __init__(self, width, thickness=1.5, color=VVU_GOLD):
        Flowable.__init__(self)
        self.width = width
        self.thickness = thickness
        self.color = color
        self.height = thickness + 4

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 2, self.width, 2)


class SectionDivider(Flowable):
    """A wider section divider with gold accent line and muted text."""
    def __init__(self, width, label=''):
        Flowable.__init__(self)
        self.width = width
        self.label = label
        self.height = 18

    def draw(self):
        self.canv.setStrokeColor(BORDER)
        self.canv.setLineWidth(0.5)
        self.canv.line(0, 10, self.width, 10)
        if self.label:
            self.canv.setFont('Helvetica', 7)
            self.canv.setFillColor(TEXT_MUTED)
            self.canv.drawString(4, 2, self.label)


class CoverBlock(Flowable):
    """Cover page decorative block with VVU branding."""
    def __init__(self, width, height=200):
        Flowable.__init__(self)
        self.width = width
        self.height = height

    def draw(self):
        # Gold accent bar at top
        self.canv.setFillColor(VVU_GOLD)
        self.canv.rect(0, self.height - 4, self.width, 4, fill=1, stroke=0)
        # Dark card background
        self.canv.setFillColor(CARD_BG)
        self.canv.roundRect(0, 0, self.width, self.height - 8, 6, fill=1, stroke=0)
        # Gold accent bar at bottom
        self.canv.setFillColor(VVU_GOLD)
        self.canv.rect(0, 0, self.width, 3, fill=1, stroke=0)


# ─── Helper: build alternating-row table style ───
def make_table_style(num_rows):
    """Generate a TableStyle with alternating row colors."""
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]
    for i in range(1, num_rows):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    return TableStyle(cmds)


# ─── Build the Story ───
def build_story(styles):
    story = []

    # ════════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════════
    story.append(Spacer(1, 80))
    story.append(GoldRule(CONTENT_WIDTH, thickness=3))
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        'VVU HBK Mk-II',
        styles['CoverTitle']
    ))
    story.append(Paragraph(
        'Terminal-as-a-Service (TaaS)<br/>Commercial Framework Specification',
        styles['CoverTitle']
    ))
    story.append(Spacer(1, 16))
    story.append(GoldRule(CONTENT_WIDTH * 0.4, thickness=1))
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        'Phase 2 — Power &amp; Thermal Architecture + Commercial Model',
        styles['CoverSubtitle']
    ))
    story.append(Spacer(1, 40))
    story.append(Paragraph(
        'March 2025',
        styles['CoverInfo']
    ))
    story.append(Paragraph(
        'Author: VVU (Venture Vision Ubuntu)',
        styles['CoverInfo']
    ))
    story.append(Paragraph(
        'Document Reference: TaaS-CFS-2025-001',
        styles['CoverInfo']
    ))
    story.append(Spacer(1, 60))
    story.append(GoldRule(CONTENT_WIDTH, thickness=3))
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        '<b>CONFIDENTIAL</b> — VVU EARTH TECH Proprietary Document',
        ParagraphStyle('ConfNote', parent=styles['CoverInfo'], textColor=SEM_WARNING, fontSize=9)
    ))
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ════════════════════════════════════════════════════════
    toc = TableOfContents()
    toc.levelStyles = [styles['TOC0'], styles['TOC1']]
    story.append(Paragraph('Table of Contents', styles['H1']))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 8))
    story.append(toc)
    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # SECTION 1: Executive Summary
    # ════════════════════════════════════════════════════════
    story.append(add_heading('1. Executive Summary', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'The Terminal-as-a-Service (TaaS) model represents a fundamental strategic pivot from '
        'traditional CapEx-based hardware procurement toward a Non-Recourse OpEx Treatment framework '
        'for municipal water infrastructure. Under conventional procurement paradigms, municipalities '
        'are compelled to allocate substantial upfront capital for hardware acquisition, installation, '
        'and commissioning — creating an immediate balance sheet liability with no guarantee of operational '
        'performance or data yield.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        'The TaaS framework eliminates this structural inefficiency by transferring the entire hardware '
        'lifecycle — from manufacturing through deployment, maintenance, and eventual decommissioning — '
        'under VVU\'s operational umbrella. The core value propositions are:',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        '<b>CapEx to OpEx Pivot</b>: Municipalities receive the HBK Mk-II Hydro-Gateway Assembly as a '
        'fully operational service unit without assuming ownership liability. The subscription-based OpEx '
        'structure allows deployment within existing operational budgets, bypassing prohibitive CapEx approval '
        'cycles that delay critical infrastructure modernization by years.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Balance Sheet De-risking</b>: The hardware remains on VVU\'s balance sheet, not the client\'s. '
        'Depreciation risk, obsolescence exposure, and residual value uncertainty are entirely absorbed by VVU. '
        'The municipality\'s balance sheet carries only a predictable operational expense line item.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>100% Equity Retention</b>: VVU retains absolute ownership of all core technology, platform IP, '
        'and Terminal hardware. No client, partner, or third party may acquire ownership stakes. The hardware '
        'never becomes a liability on the client\'s balance sheet, and VVU never dilutes its control over '
        'the terminal\'s operational parameters.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Sole Data Sovereignty</b>: All data collected by VVU Terminals belongs exclusively to VVU. '
        'The Observation Vector (O_t) — comprising Pressure, Flow, Acoustic, and Temperature dimensions — '
        'constitutes proprietary intelligence that no third party may access, replicate, or redistribute '
        'without VVU\'s explicit written authorization.',
        styles['BulletTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 2: TaaS Core Pillars
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('2. TaaS Core Pillars', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(add_heading('2.1 100% Equity Retention', styles['H2'], level=1))
    story.append(Paragraph(
        'VVU maintains absolute ownership of every HBK Mk-II Hydro-Gateway Assembly deployed under '
        'the TaaS framework. This is not a lease arrangement with transfer provisions, nor a financed '
        'purchase with a vesting schedule — it is an uncompromised equity position that persists from '
        'manufacturing through deployment, operation, and eventual decommissioning or redeployment.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        '<b>Non-Transferable Rights</b>: No client, partner, or third party may acquire ownership '
        'stakes in the deployed hardware. The commercial relationship remains a pure service contract — '
        'the client pays for intelligence delivery, not asset acquisition.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Asset Security</b>: Because VVU retains full ownership, the hardware cannot be seized, '
        'lien-attached, or otherwise encumbered by municipal financial distress. In the event of client '
        'default or contract termination, VVU exercises its unilateral recovery right.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Capital Efficiency</b>: The 100% equity position grants VVU the exclusive right to retrieve '
        'and redeploy HBK Mk-II assets across successive service engagements — transforming each hardware '
        'unit from a single-deployment cost center into a multi-lifecycle revenue generator.',
        styles['BulletTaaS']
    ))

    story.append(add_heading('2.2 Sole Data Sovereignty', styles['H2'], level=1))
    story.append(Paragraph(
        'Under the TaaS framework, VVU holds exclusive and non-shareable sovereignty over all data '
        'generated by the deployed HBK Mk-II terminal. The Observation Vector (O_t) comprises four '
        'primary measurement dimensions: <b>P</b> (Pressure), <b>F</b> (Flow), <b>A</b> (Acoustic '
        'signature), and <b>T</b> (Temperature). No client, academic partner, or third-party vendor '
        'may access, replicate, or redistribute this data without VVU\'s explicit written authorization.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        'The sovereignty framework is enforced through <b>Data-Audit Inseparability</b>: every '
        'Observation Vector packet is cryptographically bound to its generating terminal via SHA-256 '
        'hash chaining. This creates an immutable audit trail ensuring data provenance, integrity, '
        'and non-tampering. The Bayesian inference algorithms, probabilistic models, and localization '
        'methodologies that transform raw O_t data into actionable intelligence are VVU\'s proprietary '
        'intellectual property.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('2.3 InfrastructureRight Abstraction', styles['H2'], level=1))
    story.append(Paragraph(
        'The TaaS framework introduces the InfrastructureRight Abstraction — a four-pillar resource '
        'interface that transforms physical infrastructure access into digital rights within a pooled '
        'resource interface. The four pillars are:',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        '<b>Water</b>: Hydraulic access and flow measurement rights — the municipality subscribes to '
        'a Water Right that guarantees a defined level of hydraulic intelligence delivery.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Energy</b>: Power supply and backup entitlements — guaranteed power continuity for the '
        'terminal\'s operational availability.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Compute</b>: Bayesian inference processing allocation — the probabilistic leak-localization '
        'processing capacity delivered as a service.',
        styles['BulletTaaS']
    ))
    story.append(Paragraph(
        '<b>Storage</b>: Telemetry data retention and archival capacity — secure, sovereign data '
        'persistence with guaranteed retention periods.',
        styles['BulletTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        'This abstraction decouples the client\'s infrastructure requirements from the specific hardware '
        'implementation. The municipality does not purchase "a pressure sensor" or "a flow meter" — it '
        'subscribes to a Water Right that guarantees a defined level of hydraulic intelligence delivery. '
        'If VVU upgrades the sensor array or reconfigures the inference pipeline, the client\'s service '
        'level remains constant — the InfrastructureRight is hardware-agnostic.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 3: Hydro-Gateway Assembly — 11 Integrated Components
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('3. Hydro-Gateway Assembly — 11 Integrated Components', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'The HBK Mk-II Hydro-Gateway Assembly comprises 11 integrated components, each positioned within '
        'a precise XYZ coordinate framework that defines the physical architecture of the terminal. The '
        'coordinate system establishes the spatial relationships necessary for structural integrity, hydraulic '
        'coupling, and Bayesian inference processing.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── Asset Identification Table ──
    asset_data = [
        [Paragraph('<b>Component</b>', styles['TH']),
         Paragraph('<b>X (mm)</b>', styles['TH']),
         Paragraph('<b>Y (mm)</b>', styles['TH']),
         Paragraph('<b>Z (mm)</b>', styles['TH']),
         Paragraph('<b>Functional Role</b>', styles['TH'])],
        [Paragraph('Pressure Pipe', styles['TC']),
         Paragraph('0', styles['TCC']),
         Paragraph('0', styles['TCC']),
         Paragraph('750', styles['TCC']),
         Paragraph('Nodal Head Estimation', styles['TC'])],
        [Paragraph('South Datum Skid', styles['TC']),
         Paragraph('0', styles['TCC']),
         Paragraph('-560', styles['TCC']),
         Paragraph('40', styles['TCC']),
         Paragraph('Base structural support', styles['TC'])],
        [Paragraph('North Datum Skid', styles['TC']),
         Paragraph('0', styles['TCC']),
         Paragraph('+560', styles['TCC']),
         Paragraph('40', styles['TCC']),
         Paragraph('Base structural support', styles['TC'])],
        [Paragraph('Left Service Rack', styles['TC']),
         Paragraph('-720', styles['TCC']),
         Paragraph('-240', styles['TCC']),
         Paragraph('290', styles['TCC']),
         Paragraph('Lateral mounting', styles['TC'])],
        [Paragraph('Right Service Rack', styles['TC']),
         Paragraph('+720', styles['TCC']),
         Paragraph('+240', styles['TCC']),
         Paragraph('290', styles['TCC']),
         Paragraph('Lateral mounting', styles['TC'])],
        [Paragraph('Edge Control Cabinet', styles['TC']),
         Paragraph('0', styles['TCC']),
         Paragraph('+400', styles['TCC']),
         Paragraph('400', styles['TCC']),
         Paragraph('Bayesian inference', styles['TC'])],
        [Paragraph('Power Backup Module', styles['TC']),
         Paragraph('0', styles['TCC']),
         Paragraph('-400', styles['TCC']),
         Paragraph('400', styles['TCC']),
         Paragraph('Power redundancy', styles['TC'])],
        [Paragraph('Inlet Meter Pod', styles['TC']),
         Paragraph('-750', styles['TCC']),
         Paragraph('-160', styles['TCC']),
         Paragraph('930', styles['TCC']),
         Paragraph('Primary flow measurement', styles['TC'])],
        [Paragraph('Outlet Meter Pod', styles['TC']),
         Paragraph('+750', styles['TCC']),
         Paragraph('+160', styles['TCC']),
         Paragraph('930', styles['TCC']),
         Paragraph('Secondary flow measurement', styles['TC'])],
        [Paragraph('Telemetry Mast', styles['TC']),
         Paragraph('0', styles['TCC']),
         Paragraph('0', styles['TCC']),
         Paragraph('1290', styles['TCC']),
         Paragraph('Data transmission', styles['TC'])],
        [Paragraph('Top Height Beacon', styles['TC']),
         Paragraph('+100', styles['TCC']),
         Paragraph('0', styles['TCC']),
         Paragraph('1465', styles['TCC']),
         Paragraph('Site identification', styles['TC'])],
    ]

    col_widths = [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.10, CONTENT_WIDTH * 0.10,
                  CONTENT_WIDTH * 0.10, CONTENT_WIDTH * 0.48]
    asset_table = Table(asset_data, colWidths=col_widths, repeatRows=1)
    asset_table.setStyle(make_table_style(len(asset_data)))
    story.append(asset_table)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'The datum skids (North and South) anchor the assembly to the installation surface, while the '
        'service racks provide lateral stability. The Edge Control Cabinet houses the Bayesian inference '
        'engine that transforms raw sensor observations into probabilistic leak-localization outputs. The '
        'dual meter pods generate the differential flow measurements essential for the Observation Vector, '
        'and the Telemetry Mast transmits encrypted data packets to VVU\'s central processing infrastructure.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 4: Revenue Split — 60/30/10
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('4. Revenue Split — 60/30/10', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'All TaaS subscription revenue is distributed according to a fixed 60/30/10 allocation model '
        'that balances operational sustainability, growth investment, and risk governance. This split '
        'is contractually fixed and cannot be modified without triparty agreement.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── Revenue Split Table ──
    revenue_data = [
        [Paragraph('<b>Allocation</b>', styles['TH']),
         Paragraph('<b>Percentage</b>', styles['TH']),
         Paragraph('<b>Scope</b>', styles['TH']),
         Paragraph('<b>Description</b>', styles['TH'])],
        [Paragraph('Operational Baseline', styles['TC']),
         Paragraph('60%', styles['TCC']),
         Paragraph('Hardware + Operations', styles['TC']),
         Paragraph('Hardware amortization, server costs, HBK inference runtime', styles['TC'])],
        [Paragraph('Growth &amp; R&amp;D', styles['TC']),
         Paragraph('30%', styles['TCC']),
         Paragraph('Software + Research', styles['TC']),
         Paragraph('Software refinement, Bayesian algorithm improvement, scaling, academic collaboration', styles['TC'])],
        [Paragraph('Risk &amp; Compliance', styles['TC']),
         Paragraph('10%', styles['TCC']),
         Paragraph('Audit + Regulatory', styles['TC']),
         Paragraph('ProofBridge-Liner audit chain, regulatory alignment, SRS parameter verification', styles['TC'])],
    ]

    rev_col_widths = [CONTENT_WIDTH * 0.18, CONTENT_WIDTH * 0.12,
                      CONTENT_WIDTH * 0.20, CONTENT_WIDTH * 0.50]
    revenue_table = Table(revenue_data, colWidths=rev_col_widths, repeatRows=1)
    revenue_table.setStyle(make_table_style(len(revenue_data)))
    story.append(revenue_table)
    story.append(Spacer(1, 8))

    story.append(add_heading('4.1 Operational Baseline (60%)', styles['H2'], level=1))
    story.append(Paragraph(
        'The 60% Operational Baseline allocation covers the essential cost structure of terminal deployment '
        'and operation: hardware amortization across the terminal\'s projected lifecycle, server infrastructure '
        'costs for the HBK inference engine runtime, field service operations including calibration and '
        'maintenance, and the operational overhead of maintaining 24/7 terminal availability. This allocation '
        'ensures that the core service delivery remains financially sustainable independent of R&D or '
        'compliance budget fluctuations.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('4.2 Growth & R&D (30%)', styles['H2'], level=1))
    story.append(Paragraph(
        'The 30% Growth & R&D allocation funds the continuous improvement pipeline: Bayesian algorithm '
        'refinement and next-generation inference models, software platform development and scaling, '
        'academic collaboration funding for independent validation research, and next-generation terminal '
        'development. This allocation is the engine of the TaaS model\'s competitive moat — it ensures '
        'that the terminal\'s intelligence capabilities improve continuously rather than stagnating at '
        'the initial deployment level.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('4.3 Risk & Compliance (10%)', styles['H2'], level=1))
    story.append(Paragraph(
        'The 10% Risk & Compliance allocation funds the governance infrastructure: ProofBridge-Liner '
        'audit chain operations, regulatory alignment and compliance documentation, SRS parameter '
        'verification, and the independent audit functions that validate the terminal\'s performance '
        'claims. This allocation protects both VVU and the municipal client from operational risk by '
        'ensuring that all performance claims are independently verified and documented.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 5: Verification Gates — VR1 to VR5
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('5. Verification Gates — VR1 to VR5', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'The Zero Fabrication Mandate is enforced through a five-stage verification gate system that '
        'progressively validates the terminal from geometric specification through field acceptance. '
        'Each gate represents a mandatory checkpoint that must be passed before the next stage can '
        'proceed. No gate may be skipped, combined, or conditionally waived.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── Verification Gates Table ──
    gate_data = [
        [Paragraph('<b>Gate</b>', styles['TH']),
         Paragraph('<b>Designation</b>', styles['TH']),
         Paragraph('<b>Scope</b>', styles['TH']),
         Paragraph('<b>Validation Criteria</b>', styles['TH'])],
        [Paragraph('VR1', styles['TCC']),
         Paragraph('Geometry Verification', styles['TC']),
         Paragraph('CMM data, nominal diameter', styles['TC']),
         Paragraph('All 11 component XYZ positions verified; nominal diameter 114.3 mm confirmed', styles['TC'])],
        [Paragraph('VR2', styles['TCC']),
         Paragraph('Material Verification', styles['TC']),
         Paragraph('Mill test reports, NDT', styles['TC']),
         Paragraph('Material certificates, corrosion resistance testing, structural strength validation', styles['TC'])],
        [Paragraph('VR3', styles['TCC']),
         Paragraph('Assembly Verification', styles['TC']),
         Paragraph('Torque logs, route card sign-offs', styles['TC']),
         Paragraph('Inter-component connectivity, hydraulic seal integrity, electrical bonding verification', styles['TC'])],
        [Paragraph('VR4', styles['TCC']),
         Paragraph('Functional Verification', styles['TC']),
         Paragraph('FAT, sensor calibration', styles['TC']),
         Paragraph('Factory Acceptance Testing under simulated conditions, Bayesian inference output validation', styles['TC'])],
        [Paragraph('VR5', styles['TCC']),
         Paragraph('Field Acceptance', styles['TC']),
         Paragraph('SAT, municipal commissioning', styles['TC']),
         Paragraph('Site Acceptance Testing at deployment site, live hydraulic conditions, telemetry confirmation', styles['TC'])],
    ]

    gate_col_widths = [CONTENT_WIDTH * 0.08, CONTENT_WIDTH * 0.16,
                       CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.54]
    gate_table = Table(gate_data, colWidths=gate_col_widths, repeatRows=1)
    gate_table.setStyle(make_table_style(len(gate_data)))
    story.append(gate_table)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'The verification gates establish a linear, non-parallel validation path that ensures every '
        'dimension of the terminal\'s specification is independently confirmed. VR1 and VR2 are '
        'prerequisites for Tranche 1 budget release, ensuring that no manufacturing capital is deployed '
        'before the terminal\'s physical and material specifications have been independently validated.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 6: Zero Fabrication Mandate — 32 SRS Parameters
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('6. Zero Fabrication Mandate — 32 SRS Parameters', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'The Zero Fabrication Mandate prohibits any production manufacturing of the HBK Mk-II Hydro-Gateway '
        'Assembly until all 32 System Requirements Specification (SRS) parameters have been independently '
        'verified against their respective verification gates. The 32 parameters are distributed across '
        'the five verification gates: 3 Geometry (VR1), 3 Material (VR2), 2 Assembly (VR3), 15 Functional '
        '(VR4), and 9 Field (VR5).',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── 32 SRS Parameters Table ──
    srs_params = [
        # VR1: Geometry (3)
        (1, 'Nominal Diameter', 'Geometry', '114.3 mm', 'VR1', 'Pending'),
        (2, 'Wall Thickness', 'Geometry', '6.02 mm', 'VR1', 'Pending'),
        (3, 'Overall Length', 'Geometry', '750 mm', 'VR1', 'Pending'),
        # VR2: Material (3)
        (4, 'Material Grade', 'Material', 'API 5L X42', 'VR2', 'Pending'),
        (5, 'Yield Strength', 'Material', '≥ 290 MPa', 'VR2', 'Pending'),
        (6, 'Corrosion Allowance', 'Material', '≤ 3.0 mm', 'VR2', 'Pending'),
        # VR3: Assembly (2)
        (7, 'Bolt Torque', 'Assembly', '85 ± 5 Nm', 'VR3', 'Pending'),
        (8, 'Seal Integrity', 'Assembly', '0 leak points', 'VR3', 'Pending'),
        # VR4: Functional (15)
        (9, 'Pressure Range', 'Functional', '0 — 16 bar', 'VR4', 'Pending'),
        (10, 'Flow Range', 'Functional', '0 — 500 m³/h', 'VR4', 'Pending'),
        (11, 'Acoustic Bandwidth', 'Functional', '0.1 — 500 Hz', 'VR4', 'Pending'),
        (12, 'Temperature Range', 'Functional', '-10 — +60 °C', 'VR4', 'Pending'),
        (13, 'Bayesian Inference Latency', 'Functional', '≤ 200 ms', 'VR4', 'Pending'),
        (14, 'Leak Localization Radius', 'Functional', '≤ 500 m', 'VR4', 'Pending'),
        (15, 'False Positive Rate', 'Functional', '≤ 5%', 'VR4', 'Pending'),
        (16, 'Sensor Sampling Rate', 'Functional', '≥ 100 Hz', 'VR4', 'Pending'),
        (17, 'Data Throughput', 'Functional', '≥ 1.2 Mbps', 'VR4', 'Pending'),
        (18, 'Power Consumption', 'Functional', '≤ 45 W', 'VR4', 'Pending'),
        (19, 'Backup Duration', 'Functional', '≥ 4 hours', 'VR4', 'Pending'),
        (20, 'EMC Compliance', 'Functional', 'IEC 61000', 'VR4', 'Pending'),
        (21, 'Surge Tolerance', 'Functional', '≤ 20 bar', 'VR4', 'Pending'),
        (22, 'Wave Celerity', 'Functional', '1400 m/s', 'VR4', 'Pending'),
        (23, 'Inference Accuracy', 'Functional', '≥ 95%', 'VR4', 'Pending'),
        # VR5: Field (9)
        (24, 'Site Commissioning', 'Field', 'SAT passed', 'VR5', 'Pending'),
        (25, 'Telemetry Uplink', 'Field', '≥ 99.5% uptime', 'VR5', 'Pending'),
        (26, 'Environmental Sealing', 'Field', 'IP67', 'VR5', 'Pending'),
        (27, 'Vibration Resistance', 'Field', 'IEC 60068', 'VR5', 'Pending'),
        (28, 'UV Resistance', 'Field', 'ISO 4892', 'VR5', 'Pending'),
        (29, 'Corrosion Field Test', 'Field', 'ISO 9223', 'VR5', 'Pending'),
        (30, 'Municipal Integration', 'Field', 'SCADA compatible', 'VR5', 'Pending'),
        (31, 'Regulatory Compliance', 'Field', 'SANS 241', 'VR5', 'Pending'),
        (32, 'Operational Handover', 'Field', 'Sign-off complete', 'VR5', 'Pending'),
    ]

    srs_header = [
        Paragraph('<b>#</b>', styles['TH']),
        Paragraph('<b>Parameter</b>', styles['TH']),
        Paragraph('<b>Category</b>', styles['TH']),
        Paragraph('<b>Target</b>', styles['TH']),
        Paragraph('<b>Gate</b>', styles['TH']),
        Paragraph('<b>Status</b>', styles['TH']),
    ]
    srs_data = [srs_header]
    for p in srs_params:
        srs_data.append([
            Paragraph(str(p[0]), styles['TCC']),
            Paragraph(p[1], styles['TC']),
            Paragraph(p[2], styles['TC']),
            Paragraph(p[3], styles['TCC']),
            Paragraph(p[4], styles['TCC']),
            Paragraph(p[5], styles['TCC']),
        ])

    srs_col_widths = [CONTENT_WIDTH * 0.05, CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.13,
                      CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.08, CONTENT_WIDTH * 0.10]
    # Adjust to use remaining width
    remaining = CONTENT_WIDTH - sum(srs_col_widths)
    srs_col_widths[-1] += remaining  # add leftover to Status column

    srs_table = Table(srs_data, colWidths=srs_col_widths, repeatRows=1)
    srs_table.setStyle(make_table_style(len(srs_data)))
    story.append(srs_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        'No production fabrication may commence until all 32 parameters have achieved "Verified" status '
        'through their respective gate validations. The Prototyping Exemptions clause permits limited '
        'experimental validation builds (1-3 units) for laboratory testing and calibration, funded from '
        'the 30% R&D allocation — not from the Tranche 1 tooling deposit.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 7: SLA Metrics
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('7. SLA Metrics', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(add_heading('7.1 Leak Localization', styles['H2'], level=1))
    story.append(Paragraph(
        'The primary SLA metric for the TaaS framework is leak localization accuracy, measured as the '
        'reduction in search uncertainty relative to conventional detection methods. The HBK Mk-II terminal, '
        'operating under its Bayesian inference engine, commits to achieving a <b>95% reduction in search '
        'uncertainty</b> compared to traditional acoustic correlation methods. This translates to a '
        '<b>maximum search radius of 500 meters</b> for any detected leak event.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        'The accuracy target is achieved through the convergence of three technical capabilities: '
        'the Observation Vector\'s four-dimensional sensor data (P, F, A, T), the Bayesian inference '
        'engine\'s probabilistic spatial mapping, and the SHA-256 hash-chained data integrity that ensures '
        'no sensor drift or data corruption degrades the localization output.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('7.2 False Positive Rate', styles['H2'], level=1))
    story.append(Paragraph(
        'False-positive events represent the most costly failure mode in leak detection operations. The '
        'TaaS SLA framework addresses this through a strict <b>False-Positive Rate (FPR) target of '
        '≤ 5%</b>, enforced via Poisson-Gaussian mixture distributions in the Bayesian inference engine. '
        'The Poisson component models the discrete event frequency (how many leak events occur in a given '
        'observation window), while the Gaussian component models the continuous measurement noise (sensor '
        'signal variability under normal operating conditions). The mixture distribution enables the '
        'inference engine to distinguish between genuine hydraulic anomalies and statistical noise '
        'fluctuations with high confidence.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        'The 5% FPR target is validated against historical pipeline data from comparable municipal networks '
        'and is subject to continuous recalibration as the terminal accumulates site-specific operational data. '
        'Each false-positive event is logged, analyzed, and fed back into the inference engine\'s training '
        'dataset — ensuring that the FPR metric improves over the deployment lifecycle.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('7.3 Information Density', styles['H2'], level=1))
    story.append(Paragraph(
        'The Information Density (ID) metric is the ultimate efficiency indicator for the TaaS framework, '
        'defined as:',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        '<b>ID = Information Gained / Deployment Cost</b>',
        styles['EmphasisTaaS']
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        'This ratio measures the operational intelligence yield per unit of financial investment. Unlike raw '
        'accuracy metrics that measure detection performance in isolation, Information Density contextualizes '
        'performance within the commercial framework — ensuring that the intelligence delivery is not merely '
        'accurate but economically efficient. The ID metric provides the Municipal Client with a quantifiable '
        'return-on-investment indicator and provides VVU with an internal efficiency benchmark.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── SLA Metrics Summary Table ──
    sla_data = [
        [Paragraph('<b>SLA Metric</b>', styles['TH']),
         Paragraph('<b>Target</b>', styles['TH']),
         Paragraph('<b>Method</b>', styles['TH']),
         Paragraph('<b>Governance</b>', styles['TH'])],
        [Paragraph('Leak Localization', styles['TC']),
         Paragraph('≤ 500m radius (95% reduction)', styles['TC']),
         Paragraph('Bayesian inference spatial probability mapping', styles['TC']),
         Paragraph('30% R&D allocation for algorithm refinement', styles['TC'])],
        [Paragraph('False Positive Rate', styles['TC']),
         Paragraph('≤ 5%', styles['TC']),
         Paragraph('Poisson-Gaussian mixture distribution analysis', styles['TC']),
         Paragraph('Continuous recalibration against site-specific data', styles['TC'])],
        [Paragraph('Information Density', styles['TC']),
         Paragraph('ID = Info Gained / Deploy Cost', styles['TC']),
         Paragraph('Ratio of intelligence yield to subscription investment', styles['TC']),
         Paragraph('Internal efficiency benchmark driving R&D priority', styles['TC'])],
    ]

    sla_col_widths = [CONTENT_WIDTH * 0.18, CONTENT_WIDTH * 0.20,
                      CONTENT_WIDTH * 0.30, CONTENT_WIDTH * 0.32]
    sla_table = Table(sla_data, colWidths=sla_col_widths, repeatRows=1)
    sla_table.setStyle(make_table_style(len(sla_data)))
    story.append(sla_table)

    # ════════════════════════════════════════════════════════
    # SECTION 8: Vendor Financing
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('8. Vendor Financing', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(add_heading('8.1 Tranche 1 — Budget Lock', styles['H2'], level=1))
    story.append(Paragraph(
        'The TaaS vendor financing framework establishes a structured capital release mechanism that enforces '
        'the Zero Fabrication Mandate at the financial level. The <b>Tranche 1 Budget Lock</b> of '
        '<b>R812,490.00</b> is a ring-fenced tooling deposit that covers the production mold fabrication '
        'and the KCL (Kinematic Calibration Library) parametric library development. This deposit is released '
        'only upon successful completion of Verification Gate VR1 (Geometry) and VR2 (Material) — ensuring '
        'that no manufacturing capital is deployed before the terminal\'s physical and material specifications '
        'have been independently validated.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── Vendor Financing Table ──
    finance_data = [
        [Paragraph('<b>Category</b>', styles['TH']),
         Paragraph('<b>Amount (ZAR)</b>', styles['TH']),
         Paragraph('<b>Tranche</b>', styles['TH']),
         Paragraph('<b>Release Condition</b>', styles['TH'])],
        [Paragraph('Hardware', styles['TC']),
         Paragraph('R340,000', styles['TCC']),
         Paragraph('Tranche 1', styles['TCC']),
         Paragraph('VR1 + VR2 completion', styles['TC'])],
        [Paragraph('Software', styles['TC']),
         Paragraph('R185,000', styles['TCC']),
         Paragraph('Tranche 1', styles['TCC']),
         Paragraph('VR1 + VR2 completion', styles['TC'])],
        [Paragraph('Academic Collaboration', styles['TC']),
         Paragraph('R127,490', styles['TCC']),
         Paragraph('Tranche 1', styles['TCC']),
         Paragraph('VR1 + VR2 completion', styles['TC'])],
        [Paragraph('Municipal Pilot', styles['TC']),
         Paragraph('R160,000', styles['TCC']),
         Paragraph('Tranche 2', styles['TCC']),
         Paragraph('VR4 (FAT) completion', styles['TC'])],
        [Paragraph('Operational Scaling', styles['TC']),
         Paragraph('R500,000', styles['TCC']),
         Paragraph('Tranche 3', styles['TCC']),
         Paragraph('VR5 (SAT) completion + first deployment', styles['TC'])],
    ]

    fin_col_widths = [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.16,
                      CONTENT_WIDTH * 0.14, CONTENT_WIDTH * 0.48]
    finance_table = Table(finance_data, colWidths=fin_col_widths, repeatRows=1)
    finance_table.setStyle(make_table_style(len(finance_data)))
    story.append(finance_table)
    story.append(Spacer(1, 8))

    story.append(add_heading('8.2 Tranche Structure', styles['H2'], level=1))
    story.append(Paragraph(
        'The three-tranche structure ensures that capital is released only against verified milestones. '
        'Tranche 1 (R812,490) covers tooling and initial development, released upon VR1/VR2 completion. '
        'Tranche 2 (R160,000) funds the municipal pilot deployment, released upon VR4 (Factory Acceptance '
        'Testing) completion. Tranche 3 (R500,000) funds operational scaling, released upon VR5 (Site '
        'Acceptance Testing) completion and the first successful deployment. This progressive release '
        'mechanism ensures that VVU\'s manufacturing investment is preceded by validated specifications.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 9: Triparty SRS Delegation Addendum — "Three Keys"
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('9. Triparty SRS Delegation Addendum — "Three Keys"', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'The Triparty SRS Delegation Addendum establishes a three-key governance structure for the '
        'System Requirements Specification verification process. Each keyholder holds an independent, '
        'non-transferable validation authority over the SRS parameters. No verification gate may be '
        'declared passed without the affirmative sign-off of all three keyholders. The "Three Keys" '
        'framework ensures that no single party can unilaterally advance the terminal through the '
        'verification pipeline — creating a structural safeguard against specification shortcuts, '
        'verification conflicts of interest, and governance failures.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── Three Keys Table ──
    keys_data = [
        [Paragraph('<b>Keyholder</b>', styles['TH']),
         Paragraph('<b>Key Designation</b>', styles['TH']),
         Paragraph('<b>Role</b>', styles['TH']),
         Paragraph('<b>Validation Authority</b>', styles['TH'])],
        [Paragraph('VVU', styles['TC']),
         Paragraph('Master Key', styles['TCC']),
         Paragraph('Technology Owner', styles['TC']),
         Paragraph('Full authority over SRS parameter definitions, design specifications, and technical architecture. VVU defines what the terminal must achieve.', styles['TC'])],
        [Paragraph('Academic Partner', styles['TC']),
         Paragraph('Validation Key', styles['TCC']),
         Paragraph('Independent Validator', styles['TC']),
         Paragraph('Independent verification authority over SRS parameter compliance. The Academic Partner confirms that VVU\'s specifications are met through objective, reproducible testing.', styles['TC'])],
        [Paragraph('Municipal Authority', styles['TC']),
         Paragraph('Operational Key', styles['TCC']),
         Paragraph('Operational Authority', styles['TC']),
         Paragraph('Operational acceptance authority over field deployment conditions. The Municipal Authority confirms that the terminal meets the operational requirements of the deployment environment.', styles['TC'])],
    ]

    keys_col_widths = [CONTENT_WIDTH * 0.14, CONTENT_WIDTH * 0.14,
                       CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.56]
    keys_table = Table(keys_data, colWidths=keys_col_widths, repeatRows=1)
    keys_table.setStyle(make_table_style(len(keys_data)))
    story.append(keys_table)
    story.append(Spacer(1, 8))

    story.append(add_heading('9.1 Key Interdependence', styles['H2'], level=1))
    story.append(Paragraph(
        'The three keys are structurally interdependent: no single key can override the others. The '
        'Master Key (VVU) defines what must be verified, the Validation Key (Academic Partner) confirms '
        'that verification is genuine, and the Operational Key (Municipal Authority) confirms that the '
        'verified specification meets the deployment environment\'s requirements. This separation of '
        'concerns — definition, validation, and acceptance — ensures that the SRS verification process '
        'is both technically rigorous and operationally relevant.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        'The Three Keys framework also provides the governance foundation for the ProofBridge-Liner audit '
        'chain. Every verification gate sign-off is recorded as a triparty-signed audit entry, creating '
        'an immutable record of who validated what, when, and on what basis. This audit trail is maintained '
        'independently of any single keyholder and is accessible to all three parties for dispute resolution.',
        styles['BodyTaaS']
    ))

    # ════════════════════════════════════════════════════════
    # SECTION 10: Default & Asset Recovery Provisions
    # ════════════════════════════════════════════════════════
    story.append(CondPageBreak(PAGE_HEIGHT * 0.25))
    story.append(add_heading('10. Default &amp; Asset Recovery Provisions', styles['H1'], level=0))
    story.append(GoldRule(CONTENT_WIDTH))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        'The default and asset recovery framework is the ultimate enforcement mechanism of VVU\'s 100% '
        'equity retention principle. In the event of client default — whether through subscription payment '
        'failure, contract violation, or operational non-compliance — VVU exercises its unilateral right '
        'to recover and redeploy HBK Mk-II assets. This right is absolute and non-negotiable.',
        styles['BodyTaaS']
    ))
    story.append(Spacer(1, 8))

    # ── Default Provisions Table ──
    default_data = [
        [Paragraph('<b>Provision</b>', styles['TH']),
         Paragraph('<b>Timeline</b>', styles['TH']),
         Paragraph('<b>Description</b>', styles['TH'])],
        [Paragraph('Terminal Return', styles['TC']),
         Paragraph('Within 30 days', styles['TCC']),
         Paragraph('Hardware returned to VVU upon default confirmation. VVU dispatches field recovery team to decommission and extract the terminal assembly.', styles['TC'])],
        [Paragraph('Data Extraction', styles['TC']),
         Paragraph('Within 14 days', styles['TCC']),
         Paragraph('VVU extracts all stored data from the terminal. Municipal copy provided within 14 days of extraction. VVU retains original data under sole sovereignty.', styles['TC'])],
        [Paragraph('IP Preservation', styles['TC']),
         Paragraph('Immediate', styles['TCC']),
         Paragraph('VVU retains all IP, model weights, and inference code. No client, partner, or third party may retain copies of VVU\'s proprietary algorithms or trained models.', styles['TC'])],
        [Paragraph('ProofBridge-Liner Audit', styles['TC']),
         Paragraph('Activated on default', styles['TCC']),
         Paragraph('Independent audit chain activated. All terminal data, verification records, and operational logs are sealed and preserved for independent review.', styles['TC'])],
        [Paragraph('Escalation Protocol', styles['TC']),
         Paragraph('After 60 days', styles['TCC']),
         Paragraph('Payment default exceeding 60 days triggers reduced-function mode. Terminal operates in degraded state with limited intelligence output until payment is remediated.', styles['TC'])],
    ]

    def_col_widths = [CONTENT_WIDTH * 0.18, CONTENT_WIDTH * 0.14, CONTENT_WIDTH * 0.68]
    default_table = Table(default_data, colWidths=def_col_widths, repeatRows=1)
    default_table.setStyle(make_table_style(len(default_data)))
    story.append(default_table)
    story.append(Spacer(1, 8))

    story.append(add_heading('10.1 Recovery Procedure', styles['H2'], level=1))
    story.append(Paragraph(
        'Upon default event confirmation, VVU issues a formal Recovery Notice to the Municipal Client '
        'with a 30-day compliance window. If the default is not remediated within this window, VVU '
        'dispatches a field recovery team to decommission and extract the terminal assembly. The recovered '
        'asset enters VVU\'s refurbishment pipeline: components are inspected, recalibrated, and upgraded '
        'as necessary before redeployment at a subsequent service location. The recovery cost is absorbed '
        'by VVU\'s 10% Risk &amp; Compliance allocation — ensuring that asset recovery does not impose '
        'additional financial burden on the Operational Baseline or R&amp;D budget lines.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('10.2 Reduced-Function Mode', styles['H2'], level=1))
    story.append(Paragraph(
        'The escalation protocol provides a graduated response to payment default. After 60 days of '
        'non-payment, the terminal transitions to reduced-function mode: the Bayesian inference engine '
        'operates with diminished accuracy, the telemetry uplink frequency is reduced, and the '
        'Information Density metric is correspondingly degraded. This mode is not a punitive measure — '
        'it is a cost-alignment mechanism that reduces VVU\'s operational expenditure on the terminal '
        'while the default is being resolved. Full operational capability is restored immediately upon '
        'payment remediation, with no re-verification required.',
        styles['BodyTaaS']
    ))

    story.append(add_heading('10.3 Asset Lifecycle Continuity', styles['H2'], level=1))
    story.append(Paragraph(
        'The recovery mechanism transforms the TaaS model from a rental arrangement into a true service '
        'lifecycle: the hardware is never "sold and forgotten" but remains a perpetually managed commercial '
        'asset that generates revenue across multiple deployment cycles. The unilateral recovery right '
        'ensures that VVU\'s capital investment in each HBK Mk-II unit is protected regardless of individual '
        'client outcomes — de-risking the overall portfolio and enabling confident investment in next-generation '
        'terminal development.',
        styles['BodyTaaS']
    ))

    # ── End of document marker ──
    story.append(Spacer(1, 24))
    story.append(GoldRule(CONTENT_WIDTH, thickness=2))
    story.append(Spacer(1, 8))
    story.append(SectionDivider(CONTENT_WIDTH, 'VVU-TaaS-CFS-2025-001 — END OF SPECIFICATION'))

    return story


# ─── Main ───
def main():
    styles = create_styles()

    # Define frame
    frame = Frame(
        LEFT_MARGIN, BOTTOM_MARGIN,
        CONTENT_WIDTH, PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN,
        id='body_frame'
    )

    # Cover page template (no page number)
    cover_template = PageTemplate(
        id='cover',
        frames=[frame],
        onPage=footer_cover,
    )

    # Body template with Arabic footer
    body_template = PageTemplate(
        id='body',
        frames=[frame],
        onPage=footer_arabic,
    )

    # Build document
    doc = TocDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        title='VVU HBK Mk-II Terminal-as-a-Service (TaaS) Commercial Framework Specification',
        author='VVU (Venture Vision Ubuntu)',
        subject='Phase 2 — Power & Thermal Architecture + Commercial Model',
        creator='ReportLab via VVU Document Pipeline',
    )

    doc.addPageTemplates([cover_template, body_template])

    story = build_story(styles)

    # Insert template switch after cover page
    from reportlab.platypus import NextPageTemplate
    story.insert(0, NextPageTemplate('cover'))
    # After cover page, switch to body template
    # Find the first PageBreak and insert template switch before it
    for i, item in enumerate(story):
        if isinstance(item, PageBreak):
            story.insert(i, NextPageTemplate('body'))
            break

    doc.multiBuild(story)

    import os
    file_size = os.path.getsize(OUTPUT_PATH)
    print(f'PDF generated: {OUTPUT_PATH}')
    print(f'File size: {file_size:,} bytes ({file_size / 1024:.1f} KB)')


if __name__ == '__main__':
    main()
