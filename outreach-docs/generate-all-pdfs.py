#!/usr/bin/env python3
"""
VVU EARTH TECH — Outreach Document Suite Generator
Generates 6 PDF documents for outreach distribution, scoping, and sales framework strategies.

Documents:
1. User Manual (Outreach Distribution Edition)
2. Developer Specification (Technical Outreach Edition)
3. Administrator Specification (Operations Outreach Edition)
4. Research Proposal (Academic Partnership Edition)
5. Fabricator Specification Guide (Manufacturing Partnership Edition)
6. Assembly & Prototype Development Lifecycle Spec Guide

ALL documents exclude legal and financial content.
ALL documents are for outreach distribution, scoping, and sales framework strategies.
"""

import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, KeepTogether, HRFlowable,
    Image, Flowable
)
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ─── Color Palette ───
VVU_DARK = HexColor('#0f0f18')
VVU_BG = HexColor('#09090f')
VVU_GREEN = HexColor('#10b981')
VVU_EMERALD = HexColor('#059669')
VVU_TEAL = HexColor('#14b8a6')
VVU_CYAN = HexColor('#06b6d4')
VVU_ORANGE = HexColor('#f97316')
VVU_RED = HexColor('#ef4444')
VVU_YELLOW = HexColor('#eab308')
VVU_PURPLE = HexColor('#8b5cf6')
VVU_GRAY = HexColor('#6b7280')
VVU_LIGHT_GRAY = HexColor('#9ca3af')
VVU_WHITE = HexColor('#e5e7eb')
VVU_PURE_WHITE = HexColor('#ffffff')
ACCENT_GREEN = HexColor('#34d399')
SECTION_BG = HexColor('#1a1a2e')
TABLE_HEADER_BG = HexColor('#1e293b')
TABLE_ROW_BG = HexColor('#0f172a')
TABLE_ALT_ROW = HexColor('#1e1e3a')

OUTPUT_DIR = '/home/z/my-project/outreach-docs'

# ─── Custom Styles ───
def create_styles(doc_title_color=VVU_GREEN):
    styles = getSampleStyleSheet()

    # Cover styles
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=VVU_PURE_WHITE,
        alignment=TA_CENTER,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=ACCENT_GREEN,
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='CoverEdition',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=VVU_YELLOW,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))

    # Body styles
    styles.add(ParagraphStyle(
        name='DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=26,
        textColor=doc_title_color,
        spaceBefore=0,
        spaceAfter=16,
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=doc_title_color,
        spaceBefore=20,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        name='SubSection',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=HexColor('#94a3b8'),
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BodyText2',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=VVU_WHITE,
        alignment=TA_JUSTIFY,
        spaceBefore=2,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BulletText',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=VVU_WHITE,
        leftIndent=20,
        spaceBefore=2,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name='CodeBlock',
        fontName='Courier',
        fontSize=9,
        leading=12,
        textColor=ACCENT_GREEN,
        leftIndent=10,
        spaceBefore=4,
        spaceAfter=4,
        backColor=HexColor('#111827'),
    ))
    styles.add(ParagraphStyle(
        name='NoteText',
        fontName='Helvetica-BoldOblique',
        fontSize=10,
        leading=13,
        textColor=VVU_YELLOW,
        spaceBefore=6,
        spaceAfter=6,
        leftIndent=10,
    ))
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=VVU_PURE_WHITE,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=VVU_WHITE,
    ))
    styles.add(ParagraphStyle(
        name='FooterText',
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=VVU_GRAY,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='SmallBold',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=VVU_WHITE,
    ))
    return styles


# ─── Custom Page Template ───
class DarkDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        BaseDocTemplate.__init__(self, filename, **kw)
        page_width, page_height = A4
        frame = Frame(
            20*mm, 25*mm, page_width - 40*mm, page_height - 50*mm,
            id='normal'
        )
        template = PageTemplate(id='dark', frames=[frame], onPage=self._dark_page)
        self.addPageTemplates([template])

    def _dark_page(self, canvas, doc):
        canvas.saveState()
        # Full dark background
        canvas.setFillColor(VVU_BG)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        # Top accent line
        canvas.setStrokeColor(VVU_GREEN)
        canvas.setLineWidth(2)
        canvas.line(20*mm, A4[1] - 20*mm, A4[0] - 20*mm, A4[1] - 20*mm)
        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(VVU_GRAY)
        canvas.drawCentredString(A4[0]/2, 15*mm,
            f'VVU EARTH TECH — Outreach Distribution Document — {datetime.now().strftime("%Y-%m")}')
        # Bottom accent line
        canvas.setStrokeColor(VVU_GREEN)
        canvas.setLineWidth(1)
        canvas.line(20*mm, 20*mm, A4[0] - 20*mm, 20*mm)
        canvas.restoreState()


# ─── Helper Functions ───
def make_cover(styles, title, subtitle, edition, audience):
    """Generate a professional cover page."""
    elements = []
    elements.append(Spacer(1, 80*mm))

    # Decorative line
    elements.append(HRFlowable(width="80%", thickness=2, color=VVU_GREEN, spaceAfter=20))

    elements.append(Paragraph(title, styles['CoverTitle']))
    elements.append(Spacer(1, 8*mm))
    elements.append(Paragraph(subtitle, styles['CoverSubtitle']))
    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph(edition, styles['CoverEdition']))
    elements.append(Spacer(1, 4*mm))

    # Audience tag
    audience_style = ParagraphStyle(
        'AudienceTag', parent=styles['BodyText2'],
        fontSize=10, textColor=VVU_TEAL, alignment=TA_CENTER
    )
    elements.append(Paragraph(f'Target Audience: {audience}', audience_style))

    elements.append(Spacer(1, 12*mm))
    elements.append(HRFlowable(width="80%", thickness=1, color=VVU_GREEN, spaceBefore=10))

    # Classification
    classification_style = ParagraphStyle(
        'Classification', parent=styles['BodyText2'],
        fontSize=9, textColor=VVU_YELLOW, alignment=TA_CENTER
    )
    elements.append(Spacer(1, 8*mm))
    elements.append(Paragraph(
        'CLASSIFICATION: Outreach Distribution — Scoping & Sales Framework Strategy',
        classification_style
    ))
    elements.append(Paragraph(
        'Content Scope: Technical, Operational, and Strategic — Excludes Legal & Financial',
        classification_style
    ))

    # Date
    date_style = ParagraphStyle(
        'DateLine', parent=styles['BodyText2'],
        fontSize=9, textColor=VVU_LIGHT_GRAY, alignment=TA_CENTER
    )
    elements.append(Spacer(1, 4*mm))
    elements.append(Paragraph(
        f'Publication Date: {datetime.now().strftime("%Y-%m-%d")} | Version 1.0',
        date_style
    ))
    elements.append(Paragraph(
        'Venture Vision Ubuntu (VVU) — EARTH TECH Division',
        date_style
    ))

    elements.append(PageBreak())
    return elements


def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    header_paras = [Paragraph(h, ParagraphStyle('TH', fontName='Helvetica-Bold',
                                                  fontSize=9, textColor=VVU_PURE_WHITE,
                                                  alignment=TA_CENTER)) for h in headers]
    data = [header_paras]
    for row in rows:
        row_paras = [Paragraph(str(cell), ParagraphStyle('TC', fontName='Helvetica',
                                                          fontSize=9, textColor=VVU_WHITE)) for cell in row]
        data.append(row_paras)

    page_width = A4[0] - 40*mm
    if col_widths is None:
        n_cols = len(headers)
        col_widths = [page_width / n_cols] * n_cols

    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('BACKGROUND', (0, 1), (-1, -1), TABLE_ROW_BG),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_BG, TABLE_ALT_ROW]),
        ('TEXTCOLOR', (0, 0), (-1, 0), VVU_PURE_WHITE),
        ('TEXTCOLOR', (0, 1), (-1, -1), VVU_WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#334155')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


def section(title, styles):
    return Paragraph(title, styles['SectionTitle'])

def subsection(title, styles):
    return Paragraph(title, styles['SubSection'])

def body(text, styles):
    return Paragraph(text, styles['BodyText2'])

def note(text, styles):
    return Paragraph(f'▶ {text}', styles['NoteText'])

def bullet_list(items, styles):
    paras = []
    for item in items:
        paras.append(Paragraph(f'• {item}', styles['BulletText']))
    return paras

def spacer(h=6):
    return Spacer(1, h*mm)


# ─── Shared Content Blocks ───
SHARED_INTRO = """
The <b>VVU EARTH TECH</b> platform is a deterministic evidence runtime for infrastructure monitoring,
municipal water network management, and autonomous decision-making. It combines an <b>Epistemic DAG Runtime</b>
(with four primitives: Fact, Proof, Policy, Projection), a <b>Trust Runtime</b> (5-state AIR safety pipeline),
and a <b>72-Hour Resilience Matrix</b> to deliver verifiable, replay-deterministic, append-only evidence
for every decision the system makes.
"""

SHARED_CAPE_TOWN = """
<b>Cape Town</b> serves as the alternative pilot municipality case study for the VVU EARTH TECH
Hydro-Gateway deployment. Cape Town was selected following a governance review that identified
operational risks at the originally proposed municipality. Cape Town's established water management
infrastructure, progressive governance framework, and existing IoT deployment experience make it
an ideal partner for validating municipal-grade infrastructure monitoring technology.
"""

SHARED_EXECUTION_PRINCIPLE = """
<b>Execution Principle:</b> VVU EARTH TECH advances through multiple independent pathways in parallel.
Every activity is subject to formal governance review. Progress is measured by verified engineering
deliverables, not announcements. Where a pathway encounters obstacles, alternative pathways continue
without delay. This parallel execution model ensures continuous forward progress regardless of
individual pathway outcomes.
"""

SHARED_COMMUNICATIONS_POLICY = """
<b>Communications Policy:</b> VVU EARTH TECH follows a staged disclosure framework:
(1) Engineering progress is communicated only after verification — not before.
(2) Outreach is structured in three stages: Evidence Publication → Personalized Outreach → General Social & Press.
(3) Sensitive operational details are shared on a need-to-know basis.
(4) Mass-blast communication is structurally impossible — the outreach engine enforces sequential stage gates.
"""

SHARED_7_TRACK_STRATEGY = """
<b>7-Track Resource Acquisition & Partnership Strategy:</b>

<b>Track A — Municipal Partnerships:</b> Active outreach to Cape Town and progressive municipalities for pilot deployment and validation partnerships. <i>Status: Active Outreach</i>

<b>Track B — University Research Partnerships:</b> Engagement with South African and international universities for collaborative research, validation observation, and academic publication. <i>Status: Strategy</i>

<b>Track C — Industry Integration:</b> Partnership development with water infrastructure, IoT, and municipal technology companies for integration, supply chain, and co-development. <i>Status: Strategy</i>

<b>Track D — Public Funding:</b> Application to national and provincial technology innovation funds, water sector grants, and digital infrastructure programmes. <i>Status: Strategy</i>

<b>Track E — Private Investment:</b> Structured engagement with impact investors, technology venture capital, and ESG-aligned funds. <i>Status: Strategy</i>

<b>Track F — Sponsorship & Equipment:</b> Outreach to hardware manufacturers, cloud providers, and technology sponsors for equipment, infrastructure, and in-kind support. <i>Status: Strategy</i>

<b>Track G — Community & Open Source:</b> Building developer community, open-source contributors, and civic technology networks for grassroots validation and adoption. <i>Status: Strategy</i>
"""

SHARED_VALIDATION_PHASES_TABLE = [
    ['P1', 'Nominal Load', '0–12h', 'Baseline', 'Establish baseline under normal telemetry traffic', 'Critical'],
    ['P2', 'Telemetry Flood', '12–24h', 'Acceptance Capacity', 'Verify acceptance pipeline absorbs 100× flood', 'Major'],
    ['P3', 'Network Chaos', '24–36h', 'HLC Ordering', 'Verify replay stays deterministic under packet loss', 'Critical'],
    ['P4', 'Storage Pressure', '36–48h', 'Append-Only Integrity', 'Verify graceful degradation under disk fill', 'Critical'],
    ['P5', 'Node Failure', '48–60h', 'Recovery', 'Verify pods restart and no Fact is lost', 'Major'],
    ['P6', 'Security Injection', '60–66h', 'HF-001/002/005', 'Verify every spoofed/malformed payload rejected', 'Critical'],
    ['P7', 'Partition + Recovery', '66–72h', 'LVL-17', 'Verify deterministic HLC merge after partition', 'Critical'],
]

SHARED_MILESTONES_TABLE = [
    ['M00', 'Pre-Registration Published', 'Before T=0', 'Manual'],
    ['M12', 'Nominal Phase Complete', 'Hour 12', 'Evidence checkpoint'],
    ['M24', 'Flood Phase Complete', 'Hour 24', 'Evidence checkpoint'],
    ['M36', 'Network Chaos Complete', 'Hour 36', 'Evidence checkpoint'],
    ['M48', 'Storage Pressure Complete', 'Hour 48', 'Evidence checkpoint'],
    ['M60', 'Node Failure Complete', 'Hour 60', 'Evidence checkpoint'],
    ['M66', 'Security Injection Complete', 'Hour 66', 'Evidence checkpoint'],
    ['M71', 'Partition Recovery + HLC Merge', 'Hour 71', 'Evidence merge'],
    ['M72', 'Final Evidence Package Published', 'Hour 72', 'Validation complete'],
]

SHARED_HARD_FAILURE_CODES = [
    ['HF-001', 'Mock boolean / No TEE Verifier', '0.31 penalty', 'Evidence Compiler Pass 2'],
    ['HF-002', 'No ZK Prover', 'Critical', 'GovernanceAnchor.sol'],
    ['HF-006', 'Feature BLOCKED by invalid license', 'Hard block', 'requireFeature()'],
    ['HF-007', 'Tenant Boundary Violation', 'Critical', 'namespace = SHA-256(tenant_public_key)'],
]

SHARED_COMMERCIAL_TIERS = [
    ['OPEN_SOURCE', 'Apache-2.0', 'Community', 'Core Epistemic Runtime, MMR, CLI'],
    ['PRO', 'R5,000/mo*', 'Professional', 'Trust Runtime, Risk Score Engine, Gate Pipeline'],
    ['ENTERPRISE', 'R25,000/mo*', 'Enterprise', 'Full AIR Kernel, ZK Proofs, Federation'],
    ['GOVERNANCE', 'R100k+/mo*', 'Government', 'Municipal Pilot, Custom Policy, 24/7 Support'],
]

SHARED_RESILIENCE_PILLARS = [
    ['NATS/HLC', 'Hybrid Logical Clock', 'Durable queue + (wall_time, logical, node_id)', 'Partition tolerance'],
    ['Fail-Closed Circuit Breaker', '5-state hysteresis', 'NORMAL→WARNING→TRIPPED→RECOVERY→ESCALATED', 'Oscillation prevention'],
    ['Hydro-Gateway', 'IoT Sensor Bridge', 'Acoustic leak detection → Epistemic Runtime', 'Telemetry ingestion'],
    ['CSB/WAL', 'Cryptographic State Bundle', 'SHA-256 + CRC32c append-only log', 'Evidence integrity'],
    ['Policy Time Travel', 'Bi-temporal evaluation', 'Evaluate policies at any historical timestamp', 'Governance audit'],
]


# ════════════════════════════════════════════════════════════════════════
# DOCUMENT 1: USER MANUAL
# ════════════════════════════════════════════════════════════════════════

def generate_user_manual():
    styles = create_styles(VVU_GREEN)
    doc = DarkDocTemplate(
        os.path.join(OUTPUT_DIR, 'VVU-User-Manual-Outreach-Edition.pdf'),
        pagesize=A4,
        title='VVU EARTH TECH — User Manual',
        author='Venture Vision Ubuntu',
    )

    elements = []

    # Cover
    elements.extend(make_cover(styles,
        'VVU EARTH TECH',
        'User Manual — Outreach Distribution Edition',
        'FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES',
        'End Users, Operators, Municipal Stakeholders'
    ))

    # Table of Contents
    elements.append(section('Table of Contents', styles))
    toc_items = [
        '1. What is VVU EARTH TECH?',
        '2. The Epistemic Runtime Dashboard',
        '3. Navigating the Dashboard',
        '4. Trust Runtime Safety Pipeline',
        '5. Circuit Breaker States',
        '6. Validation Suite (VVU-VAL-001)',
        '7. Resource Acquisition Strategy',
        '8. Cape Town Pilot Municipality',
        '9. Governance: Execution Principle & Communications Policy',
        '10. Getting Started',
    ]
    elements.extend(bullet_list(toc_items, styles))
    elements.append(PageBreak())

    # Section 1
    elements.append(section('1. What is VVU EARTH TECH?', styles))
    elements.append(body(SHARED_INTRO, styles))
    elements.append(spacer())

    elements.append(subsection('Core Design Principles', styles))
    elements.extend(bullet_list([
        '<b>Deterministic Replay:</b> Every decision in the system can be replayed from the evidence log, producing the identical result every time.',
        '<b>Append-Only Evidence:</b> No Fact can be modified or deleted after acceptance — the log is cryptographically sealed.',
        '<b>Golden Rule:</b> The AIR Kernel is horizontal infrastructure — no product-specific logic in the open-source code.',
        '<b>Fail-Closed Philosophy:</b> When the system cannot verify, it rejects — never accepts unverified inputs.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('Four Epistemic Primitives', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Primitive', 'Purpose', 'Key Property'],
        [
            ['Fact', 'Observed evidence from sensors, logs, or external sources', 'Append-only, SHA-256 hashed, MMR-indexed'],
            ['Proof', 'Cryptographic attestation linking evidence to a decision', 'Ed25519/RSA-PSS-SHA256/ECDSA P-384 signed'],
            ['Policy', 'Governance rule governing how evidence is evaluated', 'Versioned, bi-temporal, replay-deterministic'],
            ['Projection', 'Derived state computed from Facts and Policies', 'Recomputable from evidence log alone'],
        ],
        col_widths=[pw*0.15, pw*0.45, pw*0.40]
    ))
    elements.append(PageBreak())

    # Section 2
    elements.append(section('2. The Epistemic Runtime Dashboard', styles))
    elements.append(body(
        'The VVU MASTER Dashboard is the primary user interface for the Epistemic DAG Runtime. '
        'It provides a unified view of all system components: trust runtime status, validation progress, '
        'resource acquisition tracking, resilience metrics, and policy governance.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Dashboard Sections', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Section', 'Description', 'User Action'],
        [
            ['Overview', 'System health, validation index, phase progress', 'View real-time status'],
            ['Trust Runtime', '5-state AIR safety pipeline, risk scores, gates', 'Monitor safety state'],
            ['Circuit Breaker', '3-state municipal breaker + 5-state AIR breaker', 'Track state transitions'],
            ['Resilience Matrix', '72-Hour resilience pillars status', 'Review pillar health'],
            ['Policy Studio', 'Policy creation, versioning, diff comparison', 'Create/edit policies'],
            ['DAG Topology', 'Interactive graph of epistemic dependencies', 'Explore evidence graph'],
            ['MMR Proofs', 'Merkle Mountain Range proofs and verification', 'Verify evidence chains'],
            ['Timeline', 'Historical events and milestone tracking', 'Review event history'],
            ['Validation Suite', 'VVU-VAL-001 phases, milestones, outreach', 'Track validation progress'],
            ['Resource Acquisition', '7-Track strategy status overview', 'Review outreach progress'],
            ['CLI Terminal', 'Direct command interface (air health, air ledger)', 'Execute commands'],
            ['Performance Metrics', 'System throughput, latency, queue depth', 'Monitor performance'],
            ['Audit Reports', 'Evidence bundle verification and audit trail', 'Review audit results'],
        ],
        col_widths=[pw*0.20, pw*0.45, pw*0.35]
    ))
    elements.append(PageBreak())

    # Section 3
    elements.append(section('3. Navigating the Dashboard', styles))
    elements.append(body(
        'The dashboard uses a tabbed interface with keyboard shortcuts for rapid navigation. '
        'Each section loads dynamically for performance optimization. The command palette '
        '(Ctrl+K) provides instant search across all sections and commands.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Keyboard Shortcuts', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Shortcut', 'Action'],
        [
            ['Ctrl+K', 'Open command palette (global search)'],
            ['1-9', 'Switch to section tab by number'],
            ['Ctrl+/', 'Show keyboard shortcuts overlay'],
            ['Escape', 'Close overlay/modal'],
        ],
        col_widths=[pw*0.30, pw*0.70]
    ))
    elements.append(spacer())

    elements.append(subsection('Interactive Features', styles))
    elements.extend(bullet_list([
        '<b>Drag & Drop:</b> DAG topology nodes can be rearranged by dragging.',
        '<b>Zoom & Pan:</b> Graph sections support zoom (scroll) and pan (drag).',
        '<b>Click-to-Expand:</b> Click any node to see full detail in an overlay panel.',
        '<b>Real-Time Updates:</b> Validation suite and trust runtime update live during a validation event.',
        '<b>Theme Toggle:</b> Switch between dark and light themes (preserves readability).',
    ], styles))
    elements.append(PageBreak())

    # Section 4
    elements.append(section('4. Trust Runtime Safety Pipeline', styles))
    elements.append(body(
        'The Trust Runtime implements a 5-state AIR (Autonomous Intelligence Runtime) safety pipeline '
        'with hysteresis to prevent oscillation at threshold boundaries. This is <b>separate from</b> the '
        '3-state municipal infrastructure circuit breaker — they operate independently.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('AIR Safety States', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['State', 'Meaning', 'Trigger', 'User Impact'],
        [
            ['NORMAL', 'All systems operating within safe parameters', 'Risk score below warning threshold', 'Full functionality, all features available'],
            ['WARNING', 'Elevated risk detected — monitoring intensified', 'Risk score ≥ 0.6 or delta ≥ 0.05', 'Features available, monitoring alerts active'],
            ['TRIPPED', 'Risk exceeds safe limits — execution halted', 'Risk score ≥ 0.75 or delta ≥ 0.1', 'Pending intents halted, new submissions queued'],
            ['RECOVERY', 'Risk declining — minimum hold period enforced', 'Risk drops below trip threshold', 'Queued intents processed after hold period'],
            ['ESCALATED', 'Repeated trips — system-wide escalation', '3 trips within 1-hour window', 'All execution suspended, manual review required'],
        ],
        col_widths=[pw*0.12, pw*0.30, pw*0.28, pw*0.30]
    ))
    elements.append(spacer())

    elements.append(subsection('Gate Pipeline Flow', styles))
    elements.extend(bullet_list([
        '<b>Gate 0 — Temporal Validity:</b> Intent must not exceed 72-hour maximum age.',
        '<b>Gate A — Convergence:</b> Contracting behavior checked; divergence penalty applied.',
        '<b>Gate B — Accumulation:</b> Tier-weighted exposure must stay below configured ceiling.',
        '<b>Gate C — Velocity:</b> First-derivative (rate of change) must stay below max velocity.',
        '<b>Gate D — Acceleration:</b> Second-derivative (rate of rate) must stay below max acceleration.',
        '<b>Gate E — State Drift:</b> Current state must not drift beyond max distance from intent snapshot.',
        '<b>Composite Risk Score:</b> Weighted sum of all gate outputs → circuit breaker evaluation.',
    ], styles))
    elements.append(PageBreak())

    # Section 5
    elements.append(section('5. Circuit Breaker States', styles))
    elements.append(body(
        'The system operates two independent circuit breaker systems, each serving a distinct purpose:',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Breaker', 'States', 'Scope', 'Purpose'],
        [
            ['AIR Safety Pipeline', 'NORMAL / WARNING / TRIPPED / RECOVERY / ESCALATED', 'Trust Runtime', 'Autonomous decision safety — prevents unsafe AI actions'],
            ['Municipal Infrastructure', 'NORMAL / DEGRADED / FAIL-CLOSED', 'Resilience Manager', 'Infrastructure resilience — protects water network monitoring'],
        ],
        col_widths=[pw*0.18, pw*0.28, pw*0.22, pw*0.32]
    ))
    elements.append(spacer())
    elements.append(note(
        'These two breakers are architecturally independent. The AIR breaker governs autonomous '
        'decision safety; the municipal breaker governs infrastructure resilience. They do not cascade.',
        styles
    ))
    elements.append(PageBreak())

    # Section 6
    elements.append(section('6. Validation Suite (VVU-VAL-001)', styles))
    elements.append(body(
        'The VVU-VAL-001 is a 72-hour continuous validation protocol that subjects the Epistemic '
        'Runtime to controlled failure injection across 6 phases. The protocol is pre-registered '
        '(test plan frozen before execution) with published success criteria and a computed '
        'Validation Index (PASS ≥ 90.0).',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Validation Phases', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Name', 'Hours', 'Gate', 'Objective', 'Severity'],
        SHARED_VALIDATION_PHASES_TABLE,
        col_widths=[pw*0.06, pw*0.16, pw*0.08, pw*0.16, pw*0.40, pw*0.10]
    ))
    elements.append(spacer())

    elements.append(subsection('Validation Index Dimensions', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Dimension', 'Weight', 'What It Measures'],
        [
            ['Replay Determinism', '0.25', 'Checksum match between live and replayed Fact Log'],
            ['Append-Only Integrity', '0.20', 'No Fact modified or deleted; MMR root valid'],
            ['Policy Enforcement', '0.15', 'Every violation produces Failure Fact; no crash'],
            ['HLC Merge Correctness', '0.15', 'Zero conflicts on partition reconnect'],
            ['Evidence Bundle Integrity', '0.15', 'Hourly bundles SHA-256 verified'],
            ['Security Gate Rejection', '0.10', 'All spoofed/malformed payloads rejected'],
        ],
        col_widths=[pw*0.25, pw*0.10, pw*0.65]
    ))
    elements.append(spacer())
    elements.append(note('PASS threshold: Validation Index ≥ 90.0. Zero Critical failures required (§3.1).', styles))
    elements.append(PageBreak())

    # Section 7
    elements.append(section('7. Resource Acquisition Strategy', styles))
    elements.append(body(SHARED_7_TRACK_STRATEGY, styles))
    elements.append(spacer())

    elements.append(note(
        'IMPORTANT: Tracks B–G are currently at Strategy stage. Only Track A (Cape Town outreach) '
        'is at Active Outreach stage. No track has reached Confirmed Commitment. VVU presents these '
        'as planned and active initiatives, NOT as outcomes already secured.',
        styles
    ))
    elements.append(PageBreak())

    # Section 8
    elements.append(section('8. Cape Town Pilot Municipality', styles))
    elements.append(body(SHARED_CAPE_TOWN, styles))
    elements.append(spacer())

    elements.append(subsection('Cape Town Selection Criteria', styles))
    elements.extend(bullet_list([
        '<b>Established Water Management:</b> Cape Town has extensive water infrastructure experience following the 2018 water crisis, including advanced demand management and monitoring systems.',
        '<b>Progressive Governance:</b> Transparent governance framework with established IoT deployment experience and digital transformation initiatives.',
        '<b>Technical Infrastructure:</b> Existing sensor networks, data platforms, and municipal IT systems suitable for Hydro-Gateway integration.',
        '<b>Research Ecosystem:</b> Proximity to University of Cape Town, Stellenbosch University, and CSIR for collaborative validation.',
    ], styles))
    elements.append(PageBreak())

    # Section 9
    elements.append(section('9. Governance Framework', styles))
    elements.append(body(SHARED_EXECUTION_PRINCIPLE, styles))
    elements.append(spacer())
    elements.append(body(SHARED_COMMUNICATIONS_POLICY, styles))
    elements.append(spacer())

    elements.append(subsection('Staged Release Enforcement', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Stage', 'Name', 'Trigger', 'Audiences', 'Cooldown'],
        [
            ['1', 'Evidence Publication', 'M72 milestone + Validation Index ≥ 90.0', 'Technical communities, researchers', '0 hours'],
            ['2', 'Personalized Outreach', 'Stage 1 complete + 24h elapsed + no SEV-1', 'Investors, municipalities', '24 hours'],
            ['3', 'General Social & Press', 'Stage 2 complete + 48h elapsed', 'Journalists, general public', '48 hours'],
        ],
        col_widths=[pw*0.06, pw*0.18, pw*0.30, pw*0.30, pw*0.16]
    ))
    elements.append(PageBreak())

    # Section 10
    elements.append(section('10. Getting Started', styles))
    elements.append(subsection('Accessing the Dashboard', styles))
    elements.append(body(
        'The VVU MASTER Dashboard is accessible via the web interface. All sections load dynamically '
        'for optimal performance. The dashboard supports both SIM (simulation) and LIVE modes for '
        'validation event monitoring.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('First Steps', styles))
    elements.extend(bullet_list([
        '<b>1. Open the Dashboard:</b> Navigate to the VVU MASTER Dashboard URL.',
        '<b>2. Review Overview:</b> Check system health, current phase, and validation index.',
        '<b>3. Explore Sections:</b> Use tab navigation or Ctrl+K to jump between sections.',
        '<b>4. Monitor Trust Runtime:</b> Watch the AIR safety state and risk score trends.',
        '<b>5. Track Validation:</b> During a VVU-VAL event, monitor phase progress and milestones.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('Support & Outreach', styles))
    elements.append(body(
        'For partnership inquiries, pilot deployment discussions, or technical questions, '
        'contact the VVU EARTH TECH outreach team. All outreach follows the staged release '
        'enforcement protocol — no unsolicited mass communication.',
        styles
    ))

    doc.build(elements)
    print('✅ User Manual PDF generated')


# ════════════════════════════════════════════════════════════════════════
# DOCUMENT 2: DEVELOPER SPECIFICATION
# ════════════════════════════════════════════════════════════════════════

def generate_dev_spec():
    styles = create_styles(VVU_CYAN)
    doc = DarkDocTemplate(
        os.path.join(OUTPUT_DIR, 'VVU-Dev-Spec-Technical-Outreach-Edition.pdf'),
        pagesize=A4,
        title='VVU EARTH TECH — Developer Specification',
        author='Venture Vision Ubuntu',
    )

    elements = []

    # Cover
    elements.extend(make_cover(styles,
        'VVU EARTH TECH',
        'Developer Specification — Technical Outreach Edition',
        'FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES',
        'Developers, Integrators, Technical Partners'
    ))

    # TOC
    elements.append(section('Table of Contents', styles))
    toc_items = [
        '1. Architecture Overview',
        '2. Epistemic Primitives & Type System',
        '3. Dependency Injection Framework',
        '4. Canonicalization & Hashing (RFC 8785 JCS + SHA-256)',
        '5. Merkle Mountain Range (MMR)',
        '6. Trust Runtime API',
        '7. Gate Pipeline Architecture',
        '8. Risk Score Engine',
        '9. Circuit Breaker State Machines',
        '10. 72-Hour Resilience Matrix',
        '11. Feature Gate & Hard Failure Codes',
        '12. VETPS Proof Standard',
        '13. 5-Pass Evidence Compiler',
        '14. Integration Guide',
    ]
    elements.extend(bullet_list(toc_items, styles))
    elements.append(PageBreak())

    # Section 1
    elements.append(section('1. Architecture Overview', styles))
    elements.append(body(SHARED_INTRO, styles))
    elements.append(spacer())

    elements.append(subsection('Two-Layer Architecture', styles))
    elements.extend(bullet_list([
        '<b>Layer 1 — Epistemic Runtime (Horizontal Infrastructure):</b> Deterministic evidence runtime, MMR, canonicalization, replay engine, acceptance pipeline. Open-source under Apache-2.0. NO product-specific logic (Golden Rule enforced by AST scanner).',
        '<b>Layer 2 — Product Applications (Vertical):</b> Municipal water monitoring (HBK), infrastructure management, decision dashboards. Commercial tier, builds on Layer 1 via adapters.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('Directory Structure', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Path', 'Layer', 'Access', 'Content'],
        [
            ['open-source/air-kernel/', 'Layer 1', 'Apache-2.0', 'Core runtime, MMR, replay, acceptance pipeline'],
            ['open-source/epistemic-runtime/', 'Layer 1', 'Apache-2.0', 'Fact/Proof/Policy/Projection primitives'],
            ['open-source/safe-krypte-basic/', 'Layer 1', 'Apache-2.0', 'Basic cryptographic operations'],
            ['commercial/feature-gate.ts', 'Layer 2', 'Commercial', 'requireFeature() with HF-006 enforcement'],
            ['shared/license/', 'Cross-layer', 'Shared', 'License schema, validator'],
            ['shared/vetps/', 'Cross-layer', 'Shared', 'VETPS proof standard schemas'],
            ['shared/verifiers/', 'Cross-layer', 'Shared', 'VerifierRegistry interfaces'],
        ],
        col_widths=[pw*0.25, pw*0.10, pw*0.12, pw*0.53]
    ))
    elements.append(PageBreak())

    # Section 2
    elements.append(section('2. Epistemic Primitives & Type System', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Primitive', 'Type Signature', 'Required Fields', 'Invariant'],
        [
            ['Fact', 'interface Fact { id, timestamp, body, sourceHash, mmrIndex }', 'id, body, sourceHash', 'Append-only; SHA-256(body) immutable'],
            ['Proof', 'interface Proof { id, factId, signerId, algorithm, signature }', 'factId, signerId, signature', 'Ed25519/RSA-PSS-SHA256/ECDSA P-384'],
            ['Policy', 'interface Policy { id, version, rules, effectiveFrom, effectiveTo }', 'version, rules', 'Bi-temporal; replay-deterministic'],
            ['Projection', 'interface Projection { id, sourceFacts, computedAt, value }', 'sourceFacts, value', 'Recomputable from Fact Log alone'],
        ],
        col_widths=[pw*0.12, pw*0.35, pw*0.20, pw*0.33]
    ))
    elements.append(PageBreak())

    # Section 3
    elements.append(section('3. Dependency Injection Framework', styles))
    elements.append(body(
        'The AIR Kernel uses constructor-based dependency injection for all external dependencies. '
        'This enables testing with mock implementations, runtime swapping of storage/signing backends, '
        'and deterministic replay with injected clocks and UUID generators.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Injectable', 'Interface', 'Default Implementation', 'Testing Use'],
        [
            ['Clock', 'now(): number', 'Date.now()', 'Injected fixed timestamp for replay'],
            ['UUID', 'generate(): string', 'crypto.randomUUID()', 'Deterministic UUIDs for test replay'],
            ['Entropy', 'bytes(n): Uint8Array', 'crypto.getRandomValues()', 'Fixed entropy for deterministic tests'],
            ['Signer', 'sign(data, algorithm): Signature', 'Ed25519 (default)', 'Mock signer for non-production'],
            ['EvidenceStore', 'append(fact): MMRIndex', 'S3 Object Lock COMPLIANCE', 'In-memory store for tests'],
            ['ProjectionRegistry', 'register/projection()', 'HashMap-based', 'Test projections with fixed outputs'],
            ['PolicyEngine', 'evaluate(facts, policy): Decision', 'Rule-based evaluator', 'Deterministic policy for replay'],
            ['MMR', 'append/verify/proof()', 'In-memory MMR', 'Pre-seeded MMR for replay'],
            ['Canonicalizer', 'canonicalize(obj): string', 'RFC 8785 JCS', 'Fixed canonicalization for hashing'],
            ['ReplayEngine', 'replay(fromTimestamp): ReplayResult', 'Full replay from Fact Log', 'Deterministic replay with injected deps'],
            ['AcceptancePipeline', 'accept(raw): AcceptedFact', '5-Pass compiler', 'Mock pipeline for unit tests'],
            ['VerifierRegistry', 'register/verify()', 'Ed25519 + RSA + ECDSA', 'Add custom verifiers per deployment'],
        ],
        col_widths=[pw*0.15, pw*0.25, pw*0.25, pw*0.35]
    ))
    elements.append(PageBreak())

    # Section 4
    elements.append(section('4. Canonicalization & Hashing', styles))
    elements.append(body(
        '<b>RFC 8785 JCS (JSON Canonicalization Scheme)</b> is the sole canonicalization method. '
        'All objects are serialized to a deterministic JSON string before hashing. This guarantees '
        'that the same logical object always produces the same hash, regardless of key order, '
        'whitespace, or encoding differences.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Hashing: SHA-256 Only', styles))
    elements.extend(bullet_list([
        '<b>SHA-256</b> is the sole hashing algorithm across the entire system.',
        'No SHA-1, no MD5, no Blake2, no custom hash functions.',
        'All Fact bodies, MMR nodes, evidence bundles, and state bundles use SHA-256.',
        'Canonicalization → SHA-256 is applied as: hash(SHA-256(JCS(object)))',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('Signing Algorithms', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Algorithm', 'Use Case', 'Key Type', 'Implementation'],
        [
            ['Ed25519', 'Default signing for Facts and Proofs', 'Elliptic curve (Curve25519)', 'Native crypto + AWS KMS'],
            ['RSA-PSS-SHA256', 'High-assurance institutional signing', 'RSA 2048/4096', 'AWS KMS + IAM Federation'],
            ['ECDSA P-384', 'Governance anchor signing (GovernanceAnchor.sol)', 'Elliptic curve (P-384)', 'AWS KMS + OIDC'],
        ],
        col_widths=[pw*0.20, pw*0.30, pw*0.25, pw*0.25]
    ))
    elements.append(PageBreak())

    # Section 5
    elements.append(section('5. Merkle Mountain Range (MMR)', styles))
    elements.append(body(
        'The Epistemic Runtime uses a <b>real Merkle Mountain Range</b> (not a binary Merkle tree). '
        'MMR provides efficient append-only proofs with logarithmic verification, supporting '
        'both inclusion proofs and consistency proofs without requiring the full tree.',
        styles
    ))
    elements.append(spacer())

    elements.extend(bullet_list([
        '<b>Append-Only:</b> New Facts are appended to the MMR without modifying existing peaks.',
        '<b>Peak Hashing:</b> MMR peaks are hashed together to produce the current root hash.',
        '<b>Inclusion Proofs:</b> Any Fact can be proven to be in the MMR with O(log n) path.',
        '<b>Consistency Proofs:</b> Prove that the current MMR root is a valid extension of any previous root.',
        '<b>Bagging:</b> Peak bagging algorithm compresses multiple peaks into a single root for compact verification.',
    ], styles))
    elements.append(PageBreak())

    # Section 6
    elements.append(section('6. Trust Runtime API', styles))
    elements.append(body(
        'The Trust Runtime provides the 5-state AIR safety pipeline with 7 gates, a composite '
        'risk score engine, and a hysteresis circuit breaker. It operates in two modes: '
        '<b>observe</b> (Phase 1-3: compute but do not enforce) and <b>enforce</b> (Phase 4: '
        'compute and halt execution on TRIPPED/ESCALATED).',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('API Endpoint', styles))
    elements.append(Paragraph('/api/trust-runtime — GET returns current AIR state, risk score, gate metrics', styles['CodeBlock']))
    elements.append(spacer())

    elements.append(subsection('GateMetrics Interface', styles))
    elements.append(Paragraph(
        'interface GateMetrics { exposure: [0,1]; failures: [0,1]; entropy: [0,1]; '
        'velocity: [0,1]; acceleration: [0,1]; intentAge: [0,1]; drift: [0,1]; '
        'convergencePenalty: [0,1]; }',
        styles['CodeBlock']
    ))
    elements.append(spacer())

    elements.append(note(
        'ALL GateMetrics values MUST be normalized to [0,1] before reaching the risk score engine. '
        'Unnormalized values trigger AIRUnnormalizedMetricError — this is a bounded-state invariant, '
        'not a cosmetic issue.',
        styles
    ))
    elements.append(PageBreak())

    # Section 7
    elements.append(section('7. Gate Pipeline Architecture', styles))
    elements.append(body(
        'The gate pipeline orchestrates: Temporal Validity → Convergence → Accumulation → '
        'Velocity → Acceleration → State Drift → Risk Score → Circuit Breaker. '
        'It is a pure function — the caller owns persisting state.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Gate', 'Function', 'Input', 'Output', 'Enforcement'],
        [
            ['Gate 0', 'Temporal Validity', 'Intent + now', 'normalizedAge or expiry', 'Phase 4: reject expired intents'],
            ['Gate A', 'Convergence', 'Contraction ratio', 'convergencePenalty [0,1]', 'Penalty grows if diverging'],
            ['Gate B', 'Accumulation', 'Exposure samples', 'normalized exposure [0,1]', 'Ceiling breach → trip'],
            ['Gate C', 'Velocity', 'Exposure history', 'localVelocity + trip flag', 'Phase 4: halt if exceeded'],
            ['Gate D', 'Acceleration', 'Velocity windows', 'deviation + trip flag', 'Phase 4: halt if exceeded'],
            ['Gate E', 'State Drift', 'currentState vs snapshotState', 'distance + normalized [0,1]', 'Phase 4: halt if exceeded'],
            ['Composite', 'Risk Score', 'All GateMetrics', 'score [0, ~1.3]', 'EWMA-smoothed, delta-tracked'],
            ['Final', 'Circuit Breaker', 'score + deltaScore', 'AIRState transition', 'Hysteresis with escalation'],
        ],
        col_widths=[pw*0.10, pw*0.16, pw*0.20, pw*0.25, pw*0.29]
    ))
    elements.append(PageBreak())

    # Section 8
    elements.append(section('8. Risk Score Engine', styles))
    elements.append(body(
        'The composite risk score is a weighted sum of all gate outputs. It is an <b>early-warning '
        'indicator</b>, NOT a proven-stable control quantity (formerly mislabeled "Lyapunov" — '
        'corrected in implementation).',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Weight', 'Value', 'Metric Source'],
        [
            ['exposure', '0.25', 'Gate B — Accumulation'],
            ['failures', '0.20', 'Decaying counter — adapter failures'],
            ['entropy', '0.10', 'Epistemic Runtime — belief-state contradiction'],
            ['velocity', '0.10', 'Gate C — first derivative'],
            ['acceleration', '0.10', 'Gate D — second derivative'],
            ['intentAge²', '0.10', 'Gate 0 — intent age squared (normalized)'],
            ['drift', '0.15', 'Gate E — state drift distance'],
            ['drift × intentAge', '0.10', 'Cross term — drift × age interaction'],
            ['convergencePenalty', '0.20', 'Gate A — divergence penalty'],
        ],
        col_widths=[pw*0.20, pw*0.10, pw*0.70]
    ))
    elements.append(spacer())
    elements.append(note('Weights are UNDERIVED defaults (P0). Phase 3 observation required before Phase 4 enforcement tuning.', styles))
    elements.append(PageBreak())

    # Section 9
    elements.append(section('9. Circuit Breaker State Machines', styles))
    elements.append(subsection('AIR Safety Pipeline (5-State)', styles))
    elements.append(body(
        'NORMAL → WARNING → TRIPPED → RECOVERY → NORMAL. '
        'TRIPPED → ESCALATED after 3 trips within 1-hour window. '
        'RECOVERY has minimum 5-minute hold to prevent flapping.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Municipal Infrastructure (3-State)', styles))
    elements.append(body(
        'NORMAL → DEGRADED → FAIL-CLOSED. '
        'DEGRADED allows reduced throughput. FAIL-CLOSED rejects all new submissions. '
        'This breaker is architecturally independent from the AIR safety pipeline.',
        styles
    ))
    elements.append(PageBreak())

    # Section 10
    elements.append(section('10. 72-Hour Resilience Matrix', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Pillar', 'Component', 'Mechanism', 'Guarantee'],
        SHARED_RESILIENCE_PILLARS,
        col_widths=[pw*0.18, pw*0.20, pw*0.35, pw*0.27]
    ))
    elements.append(PageBreak())

    # Section 11
    elements.append(section('11. Feature Gate & Hard Failure Codes', styles))
    elements.append(body(
        'The feature gate system enforces tier boundaries with hard failure codes. '
        'Any attempt to access a feature above the current tier throws HF-006.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Code', 'Description', 'Penalty', 'Gate Location'],
        SHARED_HARD_FAILURE_CODES,
        col_widths=[pw*0.10, pw*0.35, pw*0.15, pw*0.40]
    ))
    elements.append(spacer())

    elements.append(subsection('Feature Gate Implementation', styles))
    elements.append(Paragraph(
        'requireFeature(featureName): decorator that checks CACHED_VALIDATION.isValid '
        'and CACHED_VALIDATION.features.includes(featureName). Throws HF-006 on violation.',
        styles['CodeBlock']
    ))
    elements.append(PageBreak())

    # Section 12
    elements.append(section('12. VETPS Proof Standard', styles))
    elements.append(body(
        '<b>VETPS</b> (VVU Earth Tech Proof Standard) bridges HBK ↔ AIR. It defines the schema '
        'for proof packages that connect municipal infrastructure evidence to the Epistemic Runtime. '
        'VETPS proofs are structured, signed, and verifiable by any third party.',
        styles
    ))
    elements.append(spacer())

    elements.extend(bullet_list([
        '<b>Schema:</b> VETPS proof packages contain: evidence hash, signer identity, algorithm, signature, timestamp, and MMR inclusion proof.',
        '<b>Verification:</b> Any party can verify a VETPS proof by: (1) canonicalizing the evidence, (2) computing SHA-256, (3) verifying the signature, (4) checking the MMR inclusion proof.',
        '<b>HBK Adapter:</b> The hbk-adapter.ts implements SHA-256 hash verification for municipal telemetry, converting Hydro-Gateway sensor data into VETPS-compliant evidence.',
    ], styles))
    elements.append(PageBreak())

    # Section 13
    elements.append(section('13. 5-Pass Evidence Compiler', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Pass', 'Name', 'Operation', 'Output', 'Hard Failure Gate'],
        [
            ['1', 'Ingest', 'Receive raw telemetry/sensor data', 'RawObservation', '—'],
            ['2', 'Canonicalize', 'RFC 8785 JCS + SHA-256', 'CanonicalFact', 'HF-001 (bad signature → quarantine)'],
            ['3', 'Redact', 'Policy-based field redaction', 'RedactedFact', '—'],
            ['4', 'Infer', 'Policy evaluation + projection computation', 'InferredFact + Decision', 'HF-005 (contradiction → TRIP)'],
            ['5', 'CodeGen', 'Generate Proof + MMR append', 'AcceptedFact + Proof + MMRIndex', 'HF-002 (bad ZK → reject)'],
        ],
        col_widths=[pw*0.06, pw*0.14, pw*0.30, pw*0.25, pw*0.25]
    ))
    elements.append(PageBreak())

    # Section 14
    elements.append(section('14. Integration Guide', styles))
    elements.append(subsection('Prerequisites', styles))
    elements.extend(bullet_list([
        'Node.js 18+ or Bun runtime',
        'Next.js 16 with App Router',
        'TypeScript 5 strict mode',
        'Prisma ORM (SQLite client)',
        'Tailwind CSS 4 + shadcn/ui',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('API Endpoints', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Endpoint', 'Method', 'Returns', 'Layer'],
        [
            ['/api/trust-runtime', 'GET', 'AIR state, risk score, gate metrics', 'Layer 1'],
            ['/api/resilience', 'GET', 'Resilience manager status', 'Layer 1'],
            ['/api/resilience/circuit-breaker', 'GET', '3-state breaker status', 'Layer 1'],
            ['/api/kernel', 'GET', 'Kernel runtime status', 'Layer 1'],
            ['/api/kernel/verify', 'POST', 'Verification result', 'Layer 1'],
            ['/api/vvu-strategy', 'GET', '7-Track strategy data', 'Layer 2'],
            ['/api/validation-suite', 'GET', 'VAL-001 phases + milestones', 'Layer 2'],
            ['/api/metrics', 'GET', 'Performance metrics', 'Layer 1'],
            ['/api/policies', 'GET/POST', 'Policy CRUD', 'Layer 1'],
        ],
        col_widths=[pw*0.30, pw*0.08, pw*0.40, pw*0.12]
    ))
    elements.append(spacer())

    elements.append(subsection('Strategy & Outreach', styles))
    elements.append(body(SHARED_7_TRACK_STRATEGY, styles))
    elements.append(spacer())
    elements.append(body(SHARED_EXECUTION_PRINCIPLE, styles))

    doc.build(elements)
    print('✅ Dev Spec PDF generated')


# ════════════════════════════════════════════════════════════════════════
# DOCUMENT 3: ADMINISTRATOR SPECIFICATION
# ════════════════════════════════════════════════════════════════════════

def generate_admin_spec():
    styles = create_styles(VVU_ORANGE)
    doc = DarkDocTemplate(
        os.path.join(OUTPUT_DIR, 'VVU-Admin-Spec-Operations-Outreach-Edition.pdf'),
        pagesize=A4,
        title='VVU EARTH TECH — Administrator Specification',
        author='Venture Vision Ubuntu',
    )

    elements = []

    # Cover
    elements.extend(make_cover(styles,
        'VVU EARTH TECH',
        'Administrator Specification — Operations Outreach Edition',
        'FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES',
        'System Administrators, Operations Teams, Municipal IT'
    ))

    # TOC
    elements.append(section('Table of Contents', styles))
    toc_items = [
        '1. System Overview & Deployment Architecture',
        '2. Kubernetes Infrastructure',
        '3. Monitoring Stack',
        '4. Circuit Breaker Operations',
        '5. Validation Suite Operations (VVU-VAL-001)',
        '6. Operator Runbook',
        '7. Phase-by-Phase Monitoring Guide',
        '8. Critical Failure Response',
        '9. Outreach Staged Release Enforcement',
        '10. Cape Town Pilot Deployment',
        '11. Resource Acquisition & Partnership Strategy',
    ]
    elements.extend(bullet_list(toc_items, styles))
    elements.append(PageBreak())

    # Section 1
    elements.append(section('1. System Overview & Deployment Architecture', styles))
    elements.append(body(SHARED_INTRO, styles))
    elements.append(spacer())

    elements.append(subsection('Deployment Architecture', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Component', 'Deployment', 'Resources', 'Scaling'],
        [
            ['Epistemic Runtime', 'Kubernetes pod (runtime.yaml)', '2 CPU, 4GB RAM, 20GB disk', 'HPA: 2-10 replicas'],
            ['NATS Streaming', 'Kubernetes pod (streaming.yaml)', '1 CPU, 2GB RAM, 50GB disk', 'Single cluster'],
            ['Worker Pipeline', 'Kubernetes pod', '1 CPU, 2GB RAM', 'HPA: 2-8 replicas'],
            ['API Gateway', 'Kubernetes pod', '0.5 CPU, 1GB RAM', 'HPA: 2-4 replicas'],
            ['Evidence Collector', 'Kubernetes pod (evidence.yaml)', '0.5 CPU, 1GB RAM', 'Fixed 2 replicas'],
            ['Monitoring Stack', 'Prometheus + Grafana', '2 CPU, 4GB RAM', 'Fixed deployment'],
            ['Outreach Service', 'Kubernetes pod (outreach.yaml)', '0.25 CPU, 0.5GB RAM', 'Fixed 1 replica'],
        ],
        col_widths=[pw*0.22, pw*0.25, pw*0.28, pw*0.25]
    ))
    elements.append(PageBreak())

    # Section 2
    elements.append(section('2. Kubernetes Infrastructure', styles))
    elements.append(body(
        'VVU-VAL-001 deploys on provider-agnostic k3s with 6 Kubernetes manifests in the '
        'validation/VVU-VAL-001/kubernetes/ directory. All manifests use the vvu-validation namespace.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Manifest', 'Purpose', 'Key Configuration'],
        [
            ['namespace.yaml', 'vvu-validation namespace', 'Labels: app=vvu, tier=validation'],
            ['runtime.yaml', 'Epistemic Runtime deployment', 'Resource limits: 2CPU/4GB, Liveness probe, Readiness gate'],
            ['monitoring.yaml', 'Prometheus + Grafana stack', 'ServiceMonitor, alert rules, dashboard CM'],
            ['evidence.yaml', 'Evidence collection pods', 'SHA-256 verification, hourly bundle archival'],
            ['streaming.yaml', 'NATS durable queue', 'Cluster: vvu-nats, durable subscriptions, replay mode'],
            ['outreach.yaml', 'Staged outreach enforcement', '3-stage gate engine, recipient registry'],
        ],
        col_widths=[pw*0.18, pw*0.30, pw*0.52]
    ))
    elements.append(PageBreak())

    # Section 3
    elements.append(section('3. Monitoring Stack', styles))
    elements.append(body(
        'The monitoring stack consists of Prometheus (metrics collection), Grafana (visualization), '
        'and the VVU Mission Control Dashboard (public scoreboard). Key metrics are defined in '
        'scoreboard/metrics-schema.json.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Metric', 'Type', 'Source', 'Alert Threshold'],
        [
            ['circuit_breaker', 'enum (NORMAL/DEGRADED/RECOVERING/FAIL-CLOSED)', 'Runtime API', 'FAIL-CLOSED → Critical alert'],
            ['facts_accepted', 'counter', 'Acceptance Pipeline', 'Drop > 10% → Warning'],
            ['facts_rejected', 'counter', 'Evidence Compiler', 'Rejection rate > 5% → Warning'],
            ['queue_depth', 'gauge', 'NATS streaming', '> 10000 → Warning, > 50000 → Critical'],
            ['latency_p99_ms', 'gauge', 'API gateway', '> 500ms → Warning, > 2000ms → Critical'],
            ['cpu_pct / ram_pct', 'gauge', 'Kubernetes', '> 80% → Warning, > 95% → Critical'],
            ['mmr_root', 'string (SHA-256)', 'MMR append', 'Mismatch → Critical (replay divergent)'],
            ['replay_checksum', 'string (SHA-256)', 'Replay engine', 'Must match fact_log_checksum'],
            ['spoofed_payloads_quarantined', 'counter', 'Security gate', 'Must equal spoofed_payloads_injected'],
        ],
        col_widths=[pw*0.22, pw*0.22, pw*0.20, pw*0.36]
    ))
    elements.append(PageBreak())

    # Section 4
    elements.append(section('4. Circuit Breaker Operations', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Breaker', 'States', 'Transition Rules', 'Admin Action'],
        [
            ['AIR Safety (5-state)', 'NORMAL/WARNING/TRIPPED/RECOVERY/ESCALATED', 'Score-driven + hysteresis', 'Observe only; DO NOT manually transition'],
            ['Municipal (3-state)', 'NORMAL/DEGRADED/FAIL-CLOSED', 'Infrastructure-driven', 'Manual FAIL-CLOSED only for documented P5/P7 recovery'],
        ],
        col_widths=[pw*0.18, pw*0.30, pw*0.27, pw*0.25]
    ))
    elements.append(spacer())
    elements.append(note(
        'ADMIN RULE: No manual Circuit Breaker transitions except documented P5/P7 recovery sequences. '
        'Manual transitions on other phases = Critical failure = overall FAIL.',
        styles
    ))
    elements.append(PageBreak())

    # Section 5
    elements.append(section('5. Validation Suite Operations', styles))
    elements.append(body(
        'VVU-VAL-001 is a 72-hour continuous validation with 6 failure-injection phases. '
        'The protocol is pre-registered (frozen before T=0) with independent observers.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Name', 'Hours', 'Gate', 'Objective', 'Severity'],
        SHARED_VALIDATION_PHASES_TABLE,
        col_widths=[pw*0.06, pw*0.16, pw*0.08, pw*0.16, pw*0.40, pw*0.10]
    ))
    elements.append(spacer())

    elements.append(subsection('Milestone Tracking', styles))
    elements.append(make_table(
        ['Milestone', 'Name', 'Trigger', 'Actions'],
        SHARED_MILESTONES_TABLE,
        col_widths=[pw*0.08, pw*0.35, pw*0.25, pw*0.32]
    ))
    elements.append(PageBreak())

    # Section 6
    elements.append(section('6. Operator Runbook', styles))
    elements.append(subsection('Golden Rules (Non-Negotiable)', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Rule', 'Rationale'],
        [
            ['No code changes', 'Frozen commit hash must remain the build under test for 72 hours'],
            ['No configuration edits', 'Config changes could alter runtime behavior mid-run'],
            ['No manual Fact Log edits', 'Fact Log is append-only and immutable — edit = Critical failure'],
            ['No manual Circuit Breaker transitions (except documented)', 'CB must transition per state machine'],
            ['Hardware replacement only', 'Physical node failures: replace, log, sign entry'],
            ['All interventions logged', 'Every SSH, kubectl, hardware touch → append-only operator log'],
            ['All interventions signed', 'Every log entry signed with Ed25519 operator key'],
            ['No touching evidence bundles', 'Evidence bundles immutable — no write access'],
        ],
        col_widths=[pw*0.35, pw*0.65]
    ))
    elements.append(PageBreak())

    # Section 7
    elements.append(section('7. Phase-by-Phase Monitoring Guide', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Hours', 'What to Watch', 'When to Act'],
        [
            ['P1 Nominal', '0–12', 'CB stays NORMAL, MMR progresses', 'Only if CB goes FAIL-CLOSED'],
            ['P2 Flood', '12–24', 'Queue depth, CB may go DEGRADED', 'Only if CB goes FAIL-CLOSED'],
            ['P3 Network Chaos', '24–36', 'Replay status, latency', 'Only if replay goes DIVERGENT'],
            ['P4 Storage', '36–48', 'Disk usage, CB DEGRADED expected', 'Only if disk fills to 100%'],
            ['P5 Node Failure', '48–60', 'Pods restarting, CB recovery', 'Only if pod doesn\'t restart in 5 min'],
            ['P6 Security', '60–66', 'Rejected payloads, HF gates', 'Only if spoofed payload is ACCEPTED'],
            ['P7 Partition', '66–72', 'NATS queue, then HLC merge', 'Only if merge produces conflicts'],
        ],
        col_widths=[pw*0.12, pw*0.08, pw*0.40, pw*0.40]
    ))
    elements.append(PageBreak())

    # Section 8
    elements.append(section('8. Critical Failure Response', styles))
    elements.extend(bullet_list([
        '<b>1. Do NOT attempt to fix it.</b> The run terminates immediately; the outcome is FAIL.',
        '<b>2. Log the failure</b> in the operator log with timestamp and description.',
        '<b>3. Notify</b> the VVU engineering lead and independent observers.',
        '<b>4. Preserve all evidence</b> — do not delete or modify any logs, bundles, or state.',
        '<b>5. File a postmortem</b> within 48 hours, published alongside the evidence package.',
    ], styles))
    elements.append(spacer())
    elements.append(note(
        'A Critical failure is itself valuable evidence. The logs, artifacts, and postmortem '
        'are published alongside any subsequent successful rerun.',
        styles
    ))
    elements.append(PageBreak())

    # Section 9
    elements.append(section('9. Outreach Staged Release Enforcement', styles))
    elements.append(body(SHARED_COMMUNICATIONS_POLICY, styles))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Stage', 'Name', 'Trigger', 'Audiences', 'Cooldown'],
        [
            ['1', 'Evidence Publication', 'M72 + Validation Index ≥ 90.0 + zero Critical failures', 'Technical communities, researchers', '0h'],
            ['2', 'Personalized Outreach', 'Stage 1 complete + 24h elapsed + no SEV-1', 'Investors, municipalities', '24h'],
            ['3', 'General Social & Press', 'Stage 2 complete + 48h elapsed', 'Journalists, general public', '48h'],
        ],
        col_widths=[pw*0.06, pw*0.18, pw*0.30, pw*0.30, pw*0.16]
    ))
    elements.append(spacer())
    elements.append(note('Mass-blast communication is structurally impossible — the outreach engine enforces sequential stage gates.', styles))
    elements.append(PageBreak())

    # Section 10
    elements.append(section('10. Cape Town Pilot Deployment', styles))
    elements.append(body(SHARED_CAPE_TOWN, styles))
    elements.append(spacer())

    elements.append(subsection('Deployment Requirements', styles))
    elements.extend(bullet_list([
        '<b>Network:</b> Secure municipal network with IoT sensor connectivity.',
        '<b>Hardware:</b> Hydro-Gateway acoustic leak detection sensors at designated monitoring points.',
        '<b>Software:</b> Epistemic Runtime deployed on municipal Kubernetes cluster.',
        '<b>Monitoring:</b> Prometheus + Grafana + VVU Mission Control Dashboard.',
        '<b>Operations:</b> Trained municipal IT staff with operator runbook access.',
    ], styles))
    elements.append(PageBreak())

    # Section 11
    elements.append(section('11. Resource Acquisition & Partnership Strategy', styles))
    elements.append(body(SHARED_7_TRACK_STRATEGY, styles))
    elements.append(spacer())
    elements.append(body(SHARED_EXECUTION_PRINCIPLE, styles))

    doc.build(elements)
    print('✅ Admin Spec PDF generated')


# ════════════════════════════════════════════════════════════════════════
# DOCUMENT 4: RESEARCH PROPOSAL
# ════════════════════════════════════════════════════════════════════════

def generate_research_proposal():
    styles = create_styles(VVU_PURPLE)
    doc = DarkDocTemplate(
        os.path.join(OUTPUT_DIR, 'VVU-Research-Proposal-Academic-Partnership-Edition.pdf'),
        pagesize=A4,
        title='VVU EARTH TECH — Research Proposal',
        author='Venture Vision Ubuntu',
    )

    elements = []

    # Cover
    elements.extend(make_cover(styles,
        'VVU EARTH TECH',
        'Research Proposal — Academic Partnership Edition',
        'FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES',
        'Academic Researchers, University Partners, Validation Observers'
    ))

    # TOC
    elements.append(section('Table of Contents', styles))
    toc_items = [
        '1. Epistemic Theory Foundation',
        '2. Deterministic Evidence Runtime Methodology',
        '3. 72-Hour Continuous Validation Protocol',
        '4. Validation Index Formula',
        '5. Threat Model & Scope',
        '6. Independent Observer Methodology',
        '7. Independent Reproduction Procedure',
        '8. Research Collaboration Opportunities',
        '9. 7-Track Partnership Framework',
        '10. Cape Town Municipal Pilot Research Context',
        '11. Governance: Execution Principle & Communications Policy',
    ]
    elements.extend(bullet_list(toc_items, styles))
    elements.append(PageBreak())

    # Section 1
    elements.append(section('1. Epistemic Theory Foundation', styles))
    elements.append(body(
        'The VVU EARTH TECH Epistemic DAG Runtime is grounded in the principle that <b>every '
        'autonomous decision must be traceable to verifiable evidence</b>. Unlike conventional '
        'monitoring systems that treat data as ephemeral, the Epistemic Runtime treats evidence '
        'as an immutable, append-only DAG where each node is cryptographically linked to its '
        'predecessors.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Epistemic Primitives', styles))
    elements.extend(bullet_list([
        '<b>Fact:</b> An observed piece of evidence. Once accepted, it is appended to the Fact Log and indexed in the MMR. No Fact can be modified or deleted — the append-only invariant is a hard constraint verified at every checkpoint.',
        '<b>Proof:</b> A cryptographic attestation linking a Fact (or set of Facts) to a decision or derivation. Proofs are signed with Ed25519, RSA-PSS-SHA256, or ECDSA P-384, and their verification is deterministic.',
        '<b>Policy:</b> A governance rule that determines how evidence is evaluated. Policies are versioned and bi-temporal (effectiveFrom/effectiveTo), enabling "Policy Time Travel" — evaluating current evidence under any historical policy version.',
        '<b>Projection:</b> A derived state computed from Facts and Policies. Every Projection is recomputable from the Fact Log alone — no external state is required. This guarantees replay determinism.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('DAG Structure', styles))
    elements.append(body(
        'Evidence dependencies form a Directed Acyclic Graph (DAG). Each Fact may depend on '
        'zero or more predecessor Facts. Each Proof depends on the Facts it attests. Each '
        'Projection depends on the Facts and Policies that produced it. The DAG topology ensures '
        'that replay from any starting point produces the identical result — this is the core '
        'claim validated by VVU-VAL-001.',
        styles
    ))
    elements.append(PageBreak())

    # Section 2
    elements.append(section('2. Deterministic Evidence Runtime Methodology', styles))
    elements.append(body(
        'Determinism is achieved through three mechanisms: (1) <b>RFC 8785 JCS canonicalization</b> '
        'eliminates serialization ambiguity, (2) <b>SHA-256 hashing</b> provides deterministic '
        'fingerprinting, and (3) <b>Dependency Injection</b> allows replay with fixed clocks, '
        'UUID generators, and entropy sources.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Mechanism', 'Implementation', 'Guarantee'],
        [
            ['RFC 8785 JCS', 'JSON Canonicalization Scheme (IETF RFC 8785)', 'Same logical object → same byte sequence → same hash'],
            ['SHA-256', 'Sole hashing algorithm (no alternatives)', 'Deterministic fingerprint for all evidence'],
            ['Dependency Injection', 'Clock, UUID, Entropy, Signer injectable', 'Replay with fixed deps produces identical result'],
            ['MMR Append-Only', 'Merkle Mountain Range with peak bagging', 'Inclusion + consistency proofs without full tree'],
            ['Bi-temporal Policy', 'effectiveFrom/effectiveTo timestamps', 'Evaluate any historical policy version at any time'],
        ],
        col_widths=[pw*0.20, pw*0.40, pw*0.40]
    ))
    elements.append(PageBreak())

    # Section 3
    elements.append(section('3. 72-Hour Continuous Validation Protocol', styles))
    elements.append(body(
        'VVU-VAL-001 is a <b>pre-registered</b> 72-hour continuous validation protocol. The test plan, '
        'success criteria, failure schedule, and Validation Index formula are <b>frozen and published '
        'before T=0</b>. The public validation event is executed against one frozen build. Any '
        'subsequent execution constitutes a separately versioned validation event.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Name', 'Hours', 'Gate', 'Objective', 'Severity'],
        SHARED_VALIDATION_PHASES_TABLE,
        col_widths=[pw*0.06, pw*0.16, pw*0.08, pw*0.16, pw*0.40, pw*0.10]
    ))
    elements.append(PageBreak())

    # Section 4
    elements.append(section('4. Validation Index Formula', styles))
    elements.append(body(
        'The Validation Index is a weighted composite of 6 dimensions, published before T=0. '
        'PASS requires Index ≥ 90.0 and zero Critical failures.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Dimension', 'Weight', 'Formula', 'Verification Method'],
        [
            ['Replay Determinism', '0.25', 'checksum_match(live, replay)', 'SHA-256 of live Fact Log vs replayed Fact Log at every hourly checkpoint'],
            ['Append-Only Integrity', '0.20', 'no_modification(fact_log) AND mmr_root_valid', 'MMR root verification at every checkpoint'],
            ['Policy Enforcement', '0.15', 'violation → Failure_Fact, no crash', 'Every policy violation produces a Failure Fact, not a crash'],
            ['HLC Merge Correctness', '0.15', 'merge_conflicts = 0', 'P7 partition reconnect: zero conflicts observed'],
            ['Evidence Bundle Integrity', '0.15', 'bundle_sha256_verified', 'Hourly bundles SHA-256 verified against ledger'],
            ['Security Gate Rejection', '0.10', 'spoofed_rejected / spoofed_injected = 1.0', 'Every spoofed/malformed payload rejected at documented gate'],
        ],
        col_widths=[pw*0.18, pw*0.08, pw*0.25, pw*0.49]
    ))
    elements.append(spacer())
    elements.append(note('PASS threshold: Index ≥ 90.0. Zero Critical failures (§3.1). Formula frozen before T=0.', styles))
    elements.append(PageBreak())

    # Section 5
    elements.append(section('5. Threat Model & Scope', styles))
    elements.append(subsection('Validated by This Protocol', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Property', 'How Validated', 'Phase'],
        [
            ['Deterministic replay', 'Checksum vs live at every checkpoint', 'All'],
            ['Append-only Fact Log', 'No modification/deletion; MMR valid', 'All'],
            ['HLC merge under partition', 'P7 reconnect; zero conflicts', 'P7'],
            ['MMR integrity under stress', 'Root valid; identical live vs replay', 'All'],
            ['Policy enforcement under degradation', 'Violation → Failure Fact; no crash', 'P2-P6'],
            ['TEE attestation rejection (HF-001)', 'Spoofed payload quarantined at Pass 2', 'P6'],
            ['ZK proof rejection (HF-002)', 'Bad ZK proof rejected; no WRT minted', 'P6'],
            ['Decision derivation halt (HF-005)', 'Contradictory telemetry → TRIP verdict', 'P6'],
            ['Node failure recovery', 'Pods restart; no Fact loss; CB recovers', 'P5'],
            ['Evidence bundle integrity', 'Hourly SHA-256 verified', 'All'],
        ],
        col_widths=[pw*0.30, pw*0.45, pw*0.25]
    ))
    elements.append(spacer())

    elements.append(subsection('NOT Validated by This Protocol', styles))
    elements.append(make_table(
        ['Property', 'Why Not', 'Separate Validation'],
        [
            ['Municipal hydraulics accuracy', 'Synthetic payloads only', 'Municipal pilot'],
            ['Sensor accuracy (acoustic)', 'No physical Hydro-Gateway', 'Hardware prototype validation'],
            ['Production cybersecurity', 'Controlled injection only', 'Independent security audit'],
            ['Manufacturing reliability', 'Specification only, no hardware', 'Fabricator FAI + audit'],
            ['Long-term durability', '72-hour run only', 'Field deployment + multi-year observation'],
            ['Federation correctness', 'Single-writer ledger only', 'VVU-VAL-002+ after v1.2'],
        ],
        col_widths=[pw*0.25, pw*0.35, pw*0.40]
    ))
    elements.append(PageBreak())

    # Section 6
    elements.append(section('6. Independent Observer Methodology', styles))
    elements.append(body(
        'Independent observers attest <b>artifact integrity</b>, not system quality. Their role is '
        'narrow and well-defined: they verify that published artifacts match what they observed '
        'during the run. They do NOT endorse the system or assess fitness for purpose.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Observer Categories', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Category', 'Who', 'Attestation Scope'],
        [
            ['Academic', 'University researchers, CSIR scientists', 'Hash verification, replay verification, discrepancy report'],
            ['Industry', 'Technology professionals, municipal engineers', 'Same as Academic + operational context assessment'],
            ['Community', 'Open-source contributors, civic technologists', 'Hash verification, build reproduction, discrepancy report'],
        ],
        col_widths=[pw*0.15, pw*0.40, pw*0.45]
    ))
    elements.append(spacer())

    elements.append(subsection('Attestation Letter Format', styles))
    elements.extend(bullet_list([
        'Observer name, affiliation, and category (Academic / Industry / Community)',
        'Observation period (start and end timestamps)',
        'Timestamps of checkpoint observations',
        'Hash verification result (YES / NO)',
        'Replay verification result (YES / NO)',
        'Any discrepancies (or "none observed")',
        'Attestation statement + digital signature',
    ], styles))
    elements.append(PageBreak())

    # Section 7
    elements.append(section('7. Independent Reproduction Procedure', styles))
    elements.append(body(
        'Any third party can independently reproduce the validation results using the 8-step procedure:',
        styles
    ))
    elements.append(spacer())

    elements.extend(bullet_list([
        '<b>1. Clone</b> the VVU-VAL-001 repository at the frozen commit hash.',
        '<b>2. Checkout</b> the frozen commit (published in protocol/frozen-build.json).',
        '<b>3. Download</b> the evidence package from the GitHub Release.',
        '<b>4. Verify</b> SHA-256 of the evidence package against the SHA256SUMS ledger.',
        '<b>5. Replay</b> the Fact Log from the evidence package using the replay engine.',
        '<b>6. Compare</b> replay checksum against the published live checksum.',
        '<b>7. Publish</b> attestation letter if checksums match.',
        '<b>8. Report</b> any discrepancies via the public issue tracker.',
    ], styles))
    elements.append(PageBreak())

    # Section 8
    elements.append(section('8. Research Collaboration Opportunities', styles))
    elements.extend(bullet_list([
        '<b>Independent Observer Participation:</b> Academic researchers can serve as independent observers for VVU-VAL-001, attesting to artifact integrity.',
        '<b>Validation Methodology Co-Development:</b> Collaborate on extending the Validation Index formula, adding dimensions, or developing new chaos injection methodologies.',
        '<b>Epistemic Runtime Research:</b> Study the DAG topology, MMR proofs, and replay determinism properties. Publish comparative analyses with other evidence runtime approaches.',
        '<b>Policy Time Travel Research:</b> Investigate bi-temporal policy evaluation as a governance audit mechanism. Develop formal verification methods for policy version consistency.',
        '<b>Municipal Pilot Research:</b> Collaborate on Cape Town pilot deployment as a case study for infrastructure monitoring technology adoption in South African municipalities.',
        '<b>Threat Model Extension:</b> Develop additional threat models for production deployment, red-team testing, and manufacturing reliability validation.',
    ], styles))
    elements.append(PageBreak())

    # Section 9
    elements.append(section('9. 7-Track Partnership Framework', styles))
    elements.append(body(SHARED_7_TRACK_STRATEGY, styles))
    elements.append(spacer())

    elements.append(subsection('University Partnership Details (Track B)', styles))
    elements.extend(bullet_list([
        '<b>Target Institutions:</b> University of Cape Town, Stellenbosch University, University of the Witwatersrand, CSIR, international water research institutions.',
        '<b>Collaboration Models:</b> Independent observation, co-authored publications, student research projects, validation methodology development.',
        '<b>Requested Support:</b> Observer participation, research supervision, laboratory access for hardware prototype testing.',
        '<b>Status:</b> Strategy — outreach planned, not yet active.',
    ], styles))
    elements.append(PageBreak())

    # Section 10
    elements.append(section('10. Cape Town Municipal Pilot Research Context', styles))
    elements.append(body(SHARED_CAPE_TOWN, styles))
    elements.append(spacer())

    elements.append(subsection('Research Dimensions', styles))
    elements.extend(bullet_list([
        '<b>Water Infrastructure Monitoring:</b> Real-world validation of Hydro-Gateway acoustic leak detection against Cape Town\'s water network.',
        '<b>IoT Deployment Governance:</b> Study of municipal governance frameworks for IoT sensor deployment in public infrastructure.',
        '<b>Epistemic Runtime in Practice:</b> First real-world deployment of deterministic evidence runtime for municipal decision-making.',
        '<b>Community Engagement:</b> Civic technology adoption patterns and community-driven infrastructure monitoring.',
    ], styles))
    elements.append(PageBreak())

    # Section 11
    elements.append(section('11. Governance Framework', styles))
    elements.append(body(SHARED_EXECUTION_PRINCIPLE, styles))
    elements.append(spacer())
    elements.append(body(SHARED_COMMUNICATIONS_POLICY, styles))

    doc.build(elements)
    print('✅ Research Proposal PDF generated')


# ════════════════════════════════════════════════════════════════════════
# DOCUMENT 5: FABRICATOR SPECIFICATION GUIDE
# ════════════════════════════════════════════════════════════════════════

def generate_fabricator_spec():
    styles = create_styles(VVU_TEAL)
    doc = DarkDocTemplate(
        os.path.join(OUTPUT_DIR, 'VVU-Fabricator-Spec-Guide-Outreach-Edition.pdf'),
        pagesize=A4,
        title='VVU EARTH TECH — Fabricator Specification Guide',
        author='Venture Vision Ubuntu',
    )

    elements = []

    # Cover
    elements.extend(make_cover(styles,
        'VVU EARTH TECH',
        'Fabricator Specification Guide — Manufacturing Partnership Edition',
        'FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES',
        'Hardware Manufacturers, Fabrication Partners, Quality Engineers'
    ))

    # TOC
    elements.append(section('Table of Contents', styles))
    toc_items = [
        '1. Hydro-Gateway Hardware Overview',
        '2. 24 Parametric Constraints',
        '3. Acoustic Leak Detection Sensor Specifications',
        '4. Materials & Fabrication Requirements',
        '5. Assembly Requirements',
        '6. Quality Assurance Procedures',
        '7. Testing & Verification',
        '8. Prototype Development Lifecycle',
        '9. Epistemic Runtime Integration',
        '10. Cape Town Pilot Hardware Context',
        '11. Partnership & Supply Chain Strategy',
    ]
    elements.extend(bullet_list(toc_items, styles))
    elements.append(PageBreak())

    # Section 1
    elements.append(section('1. Hydro-Gateway Hardware Overview', styles))
    elements.append(body(
        'The <b>Hydro-Gateway</b> is the IoT sensor bridge that connects physical water infrastructure '
        'monitoring to the Epistemic DAG Runtime. It consists of an acoustic leak detection sensor array, '
        'a processing unit, and a communications module that transmits verified telemetry to the '
        'Epistemic Runtime via the AIR Kernel.',
        styles
    ))
    elements.append(spacer())

    elements.append(subsection('Hydro-Gateway Architecture', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Component', 'Function', 'Interface', 'Evidence Flow'],
        [
            ['Acoustic Sensor Array', 'Detect water leak signatures via acoustic monitoring', 'Analog → DSP pipeline', 'Raw acoustic data → Epistemic Runtime as Fact'],
            ['Processing Unit', 'Signal processing, pattern recognition, telemetry formatting', 'DSP → CAN/UART', 'Processed telemetry → canonicalized → SHA-256 hashed'],
            ['Communications Module', 'Secure telemetry transmission to AIR Kernel', 'LTE/WiFi/NB-IoT', 'Signed telemetry → NATS durable queue → Acceptance Pipeline'],
            ['Power Management', 'Battery + solar harvesting for continuous operation', 'Li-ion + solar panel', 'Power status → Fact Log (monitoring evidence)'],
            ['Enclosure', 'IP67-rated environmental protection', 'Marine-grade aluminum', 'Deployment metadata → Fact Log'],
        ],
        col_widths=[pw*0.18, pw*0.28, pw*0.18, pw*0.36]
    ))
    elements.append(PageBreak())

    # Section 2
    elements.append(section('2. 24 Parametric Constraints', styles))
    elements.append(body(
        'The Hydro-Gateway operates under 24 parametric constraints that define acceptable '
        'operational boundaries. These constraints are verified at fabrication (FAI), '
        'prototype testing, and field deployment stages.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    constraints = [
        ['Acoustic sensitivity', '≥ 45 dB SNR', 'DSP pipeline', 'Sensor array'],
        ['Frequency range', '20 Hz – 200 kHz', 'Signal processing', 'Acoustic sensor'],
        ['Detection accuracy', '≥ 95% (controlled)', 'Pattern recognition', 'Processing unit'],
        ['False positive rate', '≤ 5% (controlled)', 'Classification', 'Processing unit'],
        ['Operating temperature', '-10°C to +55°C', 'Environmental', 'Enclosure + electronics'],
        ['Humidity tolerance', '0–99% RH (non-condensing)', 'Environmental', 'Enclosure'],
        ['Depth rating', 'IP67 (1m, 30min)', 'Ingress protection', 'Enclosure'],
        ['Battery life', '≥ 72 hours continuous', 'Power management', 'Battery + solar'],
        ['Solar harvesting', '≥ 15Wh/day (average SA conditions)', 'Power management', 'Solar panel'],
        ['Communication latency', '≤ 500ms (p99)', 'Communications', 'LTE/NB-IoT module'],
        ['Data integrity', 'SHA-256 verified per packet', 'Cryptographic', 'Processing unit'],
        ['Clock synchronization', 'HLC (wall_time, logical, node_id)', 'Temporal', 'Processing unit'],
        ['Memory', '≥ 512KB buffer', 'Storage', 'Processing unit'],
        ['Processing throughput', '≥ 50 telemetry events/sec', 'Performance', 'Processing unit'],
        ['Mounting', 'Standard municipal pipe fittings', 'Mechanical', 'Enclosure mounting'],
        ['Weight', '≤ 2.5 kg (deployed unit)', 'Mechanical', 'Full assembly'],
        ['Vibration resistance', 'IEC 60068-2-6', 'Mechanical', 'Enclosure + internals'],
        ['EMC compliance', 'IEC 61000-6-2/6-4', 'Electromagnetic', 'Full assembly'],
        ['Mean time between failures', '≥ 10,000 hours', 'Reliability', 'Full assembly'],
        ['Field life', '≥ 10 years', 'Durability', 'Full assembly'],
        ['Upgrade path', 'Hot-swappable sensor module', 'Maintenance', 'Modular design'],
        ['Telemetry format', 'RFC 8785 JCS + SHA-256', 'Canonicalization', 'Processing unit'],
        ['Signing capability', 'Ed25519 onboard', 'Cryptographic', 'Secure element'],
        ['Kill switch compliance', 'Distributed kill switch integration', 'Safety', 'Processing unit'],
    ]
    elements.append(make_table(
        ['Constraint', 'Specification', 'Category', 'Component'],
        constraints,
        col_widths=[pw*0.22, pw*0.28, pw*0.18, pw*0.32]
    ))
    elements.append(PageBreak())

    # Section 3
    elements.append(section('3. Acoustic Leak Detection Sensor Specifications', styles))
    elements.append(body(
        'The acoustic sensor array is the primary sensing element of the Hydro-Gateway. '
        'It detects water leak signatures through continuous acoustic monitoring of pipe '
        'infrastructure, using pattern recognition to distinguish leak events from background noise.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Parameter', 'Specification', 'Measurement Method'],
        [
            ['Sensor type', 'Piezoelectric acoustic transducer', 'Component specification'],
            ['Sensitivity', '≥ 45 dB SNR at 1m distance', 'Laboratory calibration'],
            ['Frequency response', '20 Hz – 200 kHz (flat ±3 dB)', 'Frequency sweep test'],
            ['Sampling rate', '≥ 44.1 kHz', 'DSP pipeline configuration'],
            ['Dynamic range', '≥ 80 dB', 'Laboratory measurement'],
            ['Directionality', 'Omnidirectional (pipe-mounted)', 'Field deployment configuration'],
            ['Temperature compensation', 'Automatic (-10°C to +55°C)', 'Onboard calibration loop'],
            ['Self-test', 'Daily acoustic calibration pulse', 'Automated test sequence'],
        ],
        col_widths=[pw*0.22, pw*0.40, pw*0.38]
    ))
    elements.append(PageBreak())

    # Section 4
    elements.append(section('4. Materials & Fabrication Requirements', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Component', 'Material', 'Specification', 'Fabrication Process'],
        [
            ['Enclosure body', 'Marine-grade aluminum (6061-T6)', 'IP67, anodized finish', 'CNC machining + anodization'],
            ['Enclosure seals', 'Viton O-ring (fluoropolymer)', 'IP67 compliant, -20°C to +200°C', 'Precision molding'],
            ['Sensor housing', '316L stainless steel', 'Corrosion resistant, biocompatible', 'CNC machining + passivation'],
            ['PCB substrate', 'FR-4 (multi-layer)', '4-layer, 1.6mm, ENIG finish', 'Standard PCB fabrication'],
            ['Solar panel frame', 'Anodized aluminum', 'UV-resistant, weather-proof', 'Extrusion + anodization'],
            ['Mounting bracket', 'Galvanized steel', 'Standard municipal pipe fittings', 'Stamping + galvanization'],
            ['Antenna enclosure', 'UV-resistant polycarbonate', 'IP54, impact resistant', 'Injection molding'],
        ],
        col_widths=[pw*0.18, pw*0.25, pw*0.30, pw*0.27]
    ))
    elements.append(PageBreak())

    # Section 5
    elements.append(section('5. Assembly Requirements', styles))
    elements.extend(bullet_list([
        '<b>Assembly Sequence:</b> Defined step-by-step assembly procedure with quality gates at each stage.',
        '<b>Torque Specifications:</b> All fasteners torqued to specification with calibrated tools.',
        '<b>Seal Verification:</b> IP67 seal verification via pressure test after enclosure assembly.',
        '<b>PCB Installation:</b> PCB mounted with ESD-safe procedures; conformal coating applied to specified areas.',
        '<b>Sensor Calibration:</b> Each acoustic sensor individually calibrated against reference standard.',
        '<b>Communications Test:</b> Full communications module test (LTE/NB-IoT) before enclosure sealing.',
        '<b>Integration Test:</b> End-to-end telemetry flow test: acoustic event → processing → signing → transmission.',
        '<b>Final Inspection:</b> Visual inspection, dimensional verification, and functional test before shipment.',
    ], styles))
    elements.append(PageBreak())

    # Section 6
    elements.append(section('6. Quality Assurance Procedures', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['QA Stage', 'Procedure', 'Standard', 'Acceptance Criteria'],
        [
            ['Incoming Inspection', 'Material certification + dimensional check', 'ISO 9001', 'All materials meet specification'],
            ['In-Process Inspection', 'Assembly step verification at each gate', 'Work instruction', 'Each gate PASS before next step'],
            ['PCB Functional Test', 'Electrical test + firmware verification', 'IPC-6012', 'All test points within specification'],
            ['Sensor Calibration', 'Acoustic sensitivity + frequency response', 'Laboratory standard', 'SNR ≥ 45 dB, frequency ±3 dB'],
            ['IP67 Verification', 'Pressure test (1m, 30min water immersion)', 'IEC 60529', 'No ingress detected'],
            ['Communications Test', 'Network registration + data transmission', 'Operator specification', 'Successful telemetry transmission'],
            ['Integration Test', 'End-to-end acoustic → telemetry flow', 'System specification', 'SHA-256 verified telemetry received'],
            ['Final Inspection', 'Visual + dimensional + functional', 'Customer specification', 'All 24 parametric constraints met'],
        ],
        col_widths=[pw*0.18, pw*0.30, pw*0.18, pw*0.34]
    ))
    elements.append(PageBreak())

    # Section 7
    elements.append(section('7. Testing & Verification', styles))
    elements.append(subsection('First Article Inspection (FAI)', styles))
    elements.extend(bullet_list([
        '<b>FAI Purpose:</b> Verify that the first production article meets all 24 parametric constraints.',
        '<b>FAI Scope:</b> Full dimensional, functional, and environmental test suite.',
        '<b>FAI Documentation:</b> Results recorded as Facts in the Epistemic Runtime — immutable evidence.',
        '<b>FAI Verification:</b> Independent verification against specification; SHA-256 signed results.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('Production Quality Audit', styles))
    elements.extend(bullet_list([
        '<b>Sampling Plan:</b> Statistical sampling per AQL (Acceptable Quality Level) framework.',
        '<b>Environmental Test:</b> Temperature cycling, humidity exposure, vibration per IEC 60068.',
        '<b>Reliability Test:</b> Accelerated life testing for MTBF verification.',
        '<b>Evidence Recording:</b> All test results recorded as Facts; audit trail immutable.',
    ], styles))
    elements.append(PageBreak())

    # Section 8
    elements.append(section('8. Prototype Development Lifecycle', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Objective', 'Deliverable', 'Quality Gate'],
        [
            ['P0 — Concept', 'Define specifications, constraints, interfaces', 'Specification document', 'Review + approval'],
            ['P1 — Design', 'Detailed design, material selection, fabrication planning', 'Design package (CAD, BOM, process)', 'Design review'],
            ['P2 — Prototype Build', 'Fabricate first article, assemble, calibrate', 'Functional prototype', 'FAI (all 24 constraints)'],
            ['P3 — Integration Test', 'Connect to Epistemic Runtime, verify telemetry flow', 'Integrated system test report', 'End-to-end telemetry verified'],
            ['P4 — Field Trial', 'Deploy at Cape Town pilot site, monitor performance', 'Field trial data + analysis', 'Performance meets specification'],
            ['P5 — Production Readiness', 'Finalize fabrication process, QA procedures, supply chain', 'Production readiness review', 'All gates PASS'],
        ],
        col_widths=[pw*0.12, pw*0.28, pw*0.30, pw*0.30]
    ))
    elements.append(PageBreak())

    # Section 9
    elements.append(section('9. Epistemic Runtime Integration', styles))
    elements.append(body(
        'The Hydro-Gateway integrates with the Epistemic DAG Runtime through the AIR Kernel. '
        'Every telemetry event from the Hydro-Gateway follows this path:',
        styles
    ))
    elements.append(spacer())

    elements.extend(bullet_list([
        '<b>1. Sensing:</b> Acoustic sensor detects event → DSP processing → telemetry packet.',
        '<b>2. Canonicalization:</b> Telemetry canonicalized via RFC 8785 JCS.',
        '<b>3. Hashing:</b> SHA-256(JCS(telemetry)) produces deterministic fingerprint.',
        '<b>4. Signing:</b> Ed25519 signature created on the Hydro-Gateway secure element.',
        '<b>5. Transmission:</b> Signed telemetry transmitted via LTE/NB-IoT to NATS durable queue.',
        '<b>6. Acceptance:</b> AIR Kernel Acceptance Pipeline processes telemetry through 5-Pass Evidence Compiler.',
        '<b>7. Evidence:</b> Accepted telemetry becomes a Fact in the Fact Log, indexed in MMR.',
        '<b>8. Decision:</b> Policy evaluation produces Projections and Decisions based on the Fact.',
    ], styles))
    elements.append(PageBreak())

    # Section 10
    elements.append(section('10. Cape Town Pilot Hardware Context', styles))
    elements.append(body(SHARED_CAPE_TOWN, styles))
    elements.append(spacer())

    elements.append(subsection('Hardware Deployment Requirements', styles))
    elements.extend(bullet_list([
        '<b>Sensor Placement:</b> Hydro-Gateway units at designated monitoring points in Cape Town water network.',
        '<b>Communications:</b> LTE/NB-IoT connectivity for telemetry transmission.',
        '<b>Power:</b> Battery + solar harvesting; 72-hour minimum continuous operation.',
        '<b>Environmental:</b> IP67 rated for outdoor deployment in Cape Town climate conditions.',
        '<b>Quantity:</b> Initial pilot deployment scope to be determined in partnership discussions.',
    ], styles))
    elements.append(PageBreak())

    # Section 11
    elements.append(section('11. Partnership & Supply Chain Strategy', styles))
    elements.append(body(SHARED_7_TRACK_STRATEGY, styles))
    elements.append(spacer())

    elements.append(subsection('Track F — Sponsorship & Equipment (Fabricator-Relevant)', styles))
    elements.extend(bullet_list([
        '<b>Target Partners:</b> PCB fabricators, sensor manufacturers, enclosure fabricators, communications module suppliers.',
        '<b>Requested Support:</b> Prototype fabrication, component supply, FAI testing support.',
        '<b>Status:</b> Strategy — outreach planned, not yet active.',
    ], styles))

    doc.build(elements)
    print('✅ Fabricator Spec Guide PDF generated')


# ════════════════════════════════════════════════════════════════════════
# DOCUMENT 6: ASSEMBLY & PROTOTYPE DEVELOPMENT LIFECYCLE SPEC GUIDE
# ════════════════════════════════════════════════════════════════════════

def generate_assembly_lifecycle_spec():
    styles = create_styles(HexColor('#f472b6'))
    doc = DarkDocTemplate(
        os.path.join(OUTPUT_DIR, 'VVU-Assembly-Prototype-Lifecycle-Spec-Guide-Outreach-Edition.pdf'),
        pagesize=A4,
        title='VVU EARTH TECH — Assembly & Prototype Development Lifecycle Spec Guide',
        author='Venture Vision Ubuntu',
    )

    elements = []

    # Cover
    elements.extend(make_cover(styles,
        'VVU EARTH TECH',
        'Assembly & Prototype Development Lifecycle Spec Guide',
        'FOR OUTREACH DISTRIBUTION, SCOPING & SALES FRAMEWORK STRATEGIES',
        'Prototype Development Teams, Assembly Engineers, QA Specialists'
    ))

    # TOC
    elements.append(section('Table of Contents', styles))
    toc_items = [
        '1. Prototype Lifecycle Overview',
        '2. Lifecycle Phase Definitions',
        '3. Assembly Procedures & Sequences',
        '4. Component Integration Testing',
        '5. Epistemic Runtime Verification at Each Phase',
        '6. Quality Gates & Acceptance Criteria',
        '7. Validation Milestone Tracking',
        '8. Cape Town Pilot Deployment Timeline',
        '9. Handoff & Transition Procedures',
        '10. Resource Acquisition Strategy',
    ]
    elements.extend(bullet_list(toc_items, styles))
    elements.append(PageBreak())

    # Section 1
    elements.append(section('1. Prototype Lifecycle Overview', styles))
    elements.append(body(
        'The VVU EARTH TECH Hydro-Gateway prototype follows a 6-phase lifecycle from concept '
        'through production readiness. Each phase has defined objectives, deliverables, and '
        'quality gates. The Epistemic DAG Runtime provides immutable evidence tracking at every '
        'phase — all test results, inspection data, and acceptance decisions are recorded as '
        'Facts in the Fact Log.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Name', 'Duration (est.)', 'Key Deliverable', 'Quality Gate'],
        [
            ['P0', 'Concept & Specification', '4-8 weeks', '24 parametric constraints + interfaces', 'Specification review + approval'],
            ['P1', 'Design & Fabrication Planning', '6-12 weeks', 'Design package (CAD, BOM, process plan)', 'Design review + fabrication readiness'],
            ['P2', 'Prototype Build & FAI', '8-16 weeks', 'Functional prototype + FAI results', 'All 24 constraints verified'],
            ['P3', 'Integration & System Test', '4-8 weeks', 'Integrated test report + telemetry verified', 'End-to-end Epistemic Runtime flow'],
            ['P4', 'Field Trial (Cape Town)', '12-24 weeks', 'Field trial data + performance analysis', 'Specification met in real conditions'],
            ['P5', 'Production Readiness', '4-8 weeks', 'Production process + QA procedures + supply chain', 'Production readiness review PASS'],
        ],
        col_widths=[pw*0.06, pw*0.22, pw*0.14, pw*0.30, pw*0.28]
    ))
    elements.append(PageBreak())

    # Section 2
    elements.append(section('2. Lifecycle Phase Definitions', styles))

    elements.append(subsection('P0 — Concept & Specification', styles))
    elements.extend(bullet_list([
        '<b>Objective:</b> Define all specifications, parametric constraints, interfaces, and performance requirements.',
        '<b>Activities:</b> Requirements analysis, constraint derivation, interface definition, risk identification.',
        '<b>Deliverables:</b> Specification document (24 parametric constraints), interface control document, risk register.',
        '<b>Quality Gate:</b> Specification review by engineering lead + independent review; approval recorded as Fact.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('P1 — Design & Fabrication Planning', styles))
    elements.extend(bullet_list([
        '<b>Objective:</b> Complete detailed design, material selection, and fabrication process planning.',
        '<b>Activities:</b> CAD design, material specification, BOM creation, fabrication process development, DFA/DFM analysis.',
        '<b>Deliverables:</b> Design package (CAD files, BOM, process plan, assembly sequence), design analysis report.',
        '<b>Quality Gate:</b> Design review; all dimensions verified against constraints; DFA/DFM analysis PASS.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('P2 — Prototype Build & FAI', styles))
    elements.extend(bullet_list([
        '<b>Objective:</b> Fabricate first article, assemble, calibrate, and verify against all 24 parametric constraints.',
        '<b>Activities:</b> Component fabrication, PCB assembly, sensor calibration, enclosure assembly, functional test.',
        '<b>Deliverables:</b> Functional prototype, FAI results (all 24 constraints), calibration records.',
        '<b>Quality Gate:</b> FAI PASS — all 24 parametric constraints met; results SHA-256 signed and recorded as Facts.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('P3 — Integration & System Test', styles))
    elements.extend(bullet_list([
        '<b>Objective:</b> Connect prototype to Epistemic Runtime and verify end-to-end telemetry flow.',
        '<b>Activities:</b> Runtime integration, telemetry flow verification, 5-Pass Evidence Compiler test, MMR indexing test.',
        '<b>Deliverables:</b> Integrated system test report, telemetry verification evidence, MMR root hashes.',
        '<b>Quality Gate:</b> End-to-end telemetry verified: acoustic event → Fact Log → MMR inclusion proof.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('P4 — Field Trial (Cape Town Pilot)', styles))
    elements.extend(bullet_list([
        '<b>Objective:</b> Deploy prototype at Cape Town pilot site and verify performance under real conditions.',
        '<b>Activities:</b> Site installation, commissioning, continuous monitoring, data collection, performance analysis.',
        '<b>Deliverables:</b> Field trial data (recorded as Facts), performance analysis report, environmental compliance evidence.',
        '<b>Quality Gate:</b> Performance meets specification in real Cape Town conditions; all Facts SHA-256 verified.',
    ], styles))
    elements.append(spacer())

    elements.append(subsection('P5 — Production Readiness', styles))
    elements.extend(bullet_list([
        '<b>Objective:</b> Finalize fabrication process, QA procedures, supply chain, and production documentation.',
        '<b>Activities:</b> Process optimization, QA procedure finalization, supply chain qualification, production documentation.',
        '<b>Deliverables:</b> Production process specification, QA manual, supply chain qualification report.',
        '<b>Quality Gate:</b> Production readiness review — all gates PASS; documentation SHA-256 signed.',
    ], styles))
    elements.append(PageBreak())

    # Section 3
    elements.append(section('3. Assembly Procedures & Sequences', styles))
    elements.append(body(
        'The Hydro-Gateway assembly follows a defined sequence with quality gates at each step. '
        'All assembly data is recorded as Facts in the Epistemic Runtime.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Step', 'Operation', 'Tools/Equipment', 'Quality Gate', 'Evidence Recording'],
        [
            ['1', 'PCB preparation + ESD-safe handling', 'ESD workstation, magnification', 'Visual inspection (IPC-A-610)', 'Inspection Fact'],
            ['2', 'Component placement + soldering', 'Solder station, reflow oven', 'Electrical test + X-ray (if BGA)', 'Test Fact'],
            ['3', 'Conformal coating (specified areas)', 'Coating equipment, UV cure', 'Coating thickness verification', 'Verification Fact'],
            ['4', 'Firmware loading + verification', 'Programming station', 'Firmware version + checksum verified', 'Checksum Fact'],
            ['5', 'Sensor installation + calibration', 'Calibration fixture, reference standard', 'SNR ≥ 45 dB, freq ±3 dB', 'Calibration Fact'],
            ['6', 'Communications module installation', 'RF test station', 'Network registration + data TX', 'Communications Fact'],
            ['7', 'Enclosure assembly + seal', 'Torque tools, seal fixture', 'IP67 pressure test (1m, 30min)', 'Seal Verification Fact'],
            ['8', 'Integration test (end-to-end)', 'Epistemic Runtime test bench', 'Acoustic → telemetry → Fact Log', 'Integration Fact'],
            ['9', 'Final inspection + packaging', 'Inspection station', 'All 24 constraints verified', 'Final Inspection Fact'],
        ],
        col_widths=[pw*0.04, pw*0.22, pw*0.18, pw*0.28, pw*0.28]
    ))
    elements.append(PageBreak())

    # Section 4
    elements.append(section('4. Component Integration Testing', styles))
    elements.append(body(
        'Each component is tested individually before integration. Test results are recorded as '
        'Facts and indexed in the MMR for immutable evidence trails.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Component', 'Test', 'Method', 'Pass Criteria', 'Evidence'],
        [
            ['Acoustic Sensor', 'Sensitivity + frequency', 'Lab calibration vs reference', 'SNR ≥ 45 dB; ±3 dB flat', 'Calibration Fact (SHA-256 signed)'],
            ['Processing Unit', 'Functional + throughput', 'DSP test suite', '≥ 50 events/sec; no errors', 'Functional Test Fact'],
            ['Communications Module', 'Network + transmission', 'Operator network test', 'Registration + data TX verified', 'Communications Test Fact'],
            ['Power Management', 'Battery + solar', 'Load test + solar simulation', '≥ 72h battery; ≥ 15Wh/day solar', 'Power Test Fact'],
            ['Enclosure', 'IP67 + mechanical', 'Pressure test + dimensional', 'No ingress; dimensions within spec', 'Enclosure Test Fact'],
            ['Secure Element', 'Ed25519 signing', 'Cryptographic test vector', 'Signature verification PASS', 'Crypto Test Fact'],
        ],
        col_widths=[pw*0.15, pw*0.18, pw*0.22, pw*0.22, pw*0.23]
    ))
    elements.append(PageBreak())

    # Section 5
    elements.append(section('5. Epistemic Runtime Verification at Each Phase', styles))
    elements.append(body(
        'The Epistemic DAG Runtime provides evidence tracking throughout the prototype lifecycle. '
        'Every quality gate, test result, and acceptance decision is recorded as an immutable Fact.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Lifecycle Phase', 'Epistemic Verification', 'Evidence Type', 'MMR Inclusion'],
        [
            ['P0 Concept', 'Specification review decision recorded', 'Policy (specification standard)', 'Root hash of spec review'],
            ['P1 Design', 'Design review decision + constraint mapping', 'Fact (design parameters) + Proof', 'Root hash of design review'],
            ['P2 Build', 'FAI results for all 24 constraints', 'Fact (each constraint measurement)', 'Root hash of FAI batch'],
            ['P3 Integration', 'End-to-end telemetry flow verified', 'Fact (telemetry packet) + Proof (signature)', 'Root hash of integration test'],
            ['P4 Field Trial', 'Performance data from Cape Town deployment', 'Fact (field measurements) + Projection', 'Root hash of field trial batch'],
            ['P5 Production', 'Production readiness review decision', 'Policy (production standard) + Fact', 'Root hash of readiness review'],
        ],
        col_widths=[pw*0.15, pw*0.30, pw*0.25, pw*0.30]
    ))
    elements.append(PageBreak())

    # Section 6
    elements.append(section('6. Quality Gates & Acceptance Criteria', styles))
    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Gate', 'Phase', 'Criteria', 'Decision', 'Evidence'],
        [
            ['G0', 'P0', 'All specifications defined + constraints derived', 'PASS/FAIL', 'Specification review Fact'],
            ['G1', 'P1', 'Design meets all constraints + DFA/DFM PASS', 'PASS/FAIL', 'Design review Fact'],
            ['G2', 'P2', 'FAI: all 24 parametric constraints verified', 'PASS/FAIL', 'FAI measurement Facts (24)'],
            ['G3', 'P3', 'End-to-end telemetry: acoustic → Fact Log', 'PASS/FAIL', 'Integration test Fact'],
            ['G4', 'P4', 'Field performance meets specification', 'PASS/FAIL', 'Field trial Facts + analysis'],
            ['G5', 'P5', 'Production process + QA + supply chain qualified', 'PASS/FAIL', 'Production readiness review Fact'],
        ],
        col_widths=[pw*0.06, pw*0.08, pw*0.36, pw*0.10, pw*0.40]
    ))
    elements.append(spacer())
    elements.append(note(
        'FAIL at any gate does NOT terminate the project — it triggers a return to the previous '
        'phase for corrective action. The Epistemic Runtime records the failure as a Fact, enabling '
        'root cause analysis and evidence-based decision-making.',
        styles
    ))
    elements.append(PageBreak())

    # Section 7
    elements.append(section('7. Validation Milestone Tracking', styles))
    elements.append(body(
        'Prototype lifecycle milestones are tracked alongside VVU-VAL-001 validation milestones '
        'in the Epistemic Runtime. Both hardware and software evidence share the same MMR.',
        styles
    ))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Milestone', 'Name', 'Trigger', 'Actions'],
        [
            ['PM-0', 'Prototype Specification Approved', 'G0 PASS', 'Begin P1 design'],
            ['PM-1', 'Design Package Complete', 'G1 PASS', 'Begin P2 build'],
            ['PM-2', 'First Article Inspection PASS', 'G2 PASS (all 24 constraints)', 'Begin P3 integration'],
            ['PM-3', 'Integration Test Verified', 'G3 PASS (end-to-end telemetry)', 'Begin P4 field trial'],
            ['PM-4', 'Field Trial Complete', 'G4 PASS (Cape Town performance)', 'Begin P5 production readiness'],
            ['PM-5', 'Production Readiness Approved', 'G5 PASS', 'Production launch'],
        ],
        col_widths=[pw*0.08, pw*0.30, pw*0.30, pw*0.32]
    ))
    elements.append(PageBreak())

    # Section 8
    elements.append(section('8. Cape Town Pilot Deployment Timeline', styles))
    elements.append(body(SHARED_CAPE_TOWN, styles))
    elements.append(spacer())

    pw = A4[0] - 40*mm
    elements.append(make_table(
        ['Phase', 'Activity', 'Duration', 'Dependencies'],
        [
            ['P0', 'Cape Town site survey + requirements', '4-8 weeks', 'Municipal partnership agreement'],
            ['P1', 'Cape Town-specific design adaptation', '6-12 weeks', 'Site survey data + specifications'],
            ['P2', 'Prototype fabrication + FAI', '8-16 weeks', 'Design package + fabrication partner'],
            ['P3', 'Cape Town integration + commissioning', '4-8 weeks', 'Functional prototype + municipal IT'],
            ['P4', 'Cape Town field trial + monitoring', '12-24 weeks', 'Commissioned system + monitoring team'],
            ['P5', 'Production readiness for Cape Town scale', '4-8 weeks', 'Field trial results + supply chain'],
        ],
        col_widths=[pw*0.06, pw*0.38, pw*0.14, pw*0.42]
    ))
    elements.append(PageBreak())

    # Section 9
    elements.append(section('9. Handoff & Transition Procedures', styles))
    elements.extend(bullet_list([
        '<b>Phase Transition:</b> Each phase transition is gated by a quality gate (G0-G5). Transition requires PASS decision recorded as Fact.',
        '<b>Documentation Handoff:</b> All design, fabrication, test, and field trial documentation is SHA-256 signed and transferred to the next phase team.',
        '<b>Evidence Handoff:</b> All Facts, Proofs, and MMR root hashes from previous phases are included in the next phase\'s evidence baseline.',
        '<b>Failure Return:</b> FAIL at any gate triggers return to the previous phase with failure analysis Facts and corrective action plan.',
        '<b>Knowledge Transfer:</b> Phase completion includes knowledge transfer session with the next phase team; attendance recorded as Fact.',
    ], styles))
    elements.append(PageBreak())

    # Section 10
    elements.append(section('10. Resource Acquisition Strategy', styles))
    elements.append(body(SHARED_7_TRACK_STRATEGY, styles))
    elements.append(spacer())
    elements.append(body(SHARED_EXECUTION_PRINCIPLE, styles))
    elements.append(spacer())
    elements.append(body(SHARED_COMMUNICATIONS_POLICY, styles))

    doc.build(elements)
    print('✅ Assembly & Prototype Lifecycle Spec Guide PDF generated')


# ════════════════════════════════════════════════════════════════════════
# MAIN — Generate all 6 PDFs
# ════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print('VVU EARTH TECH — Outreach Document Suite Generator')
    print(f'Output directory: {OUTPUT_DIR}')
    print(f'Date: {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print()

    print('Generating 6 outreach PDFs...')
    print()

    generate_user_manual()
    generate_dev_spec()
    generate_admin_spec()
    generate_research_proposal()
    generate_fabricator_spec()
    generate_assembly_lifecycle_spec()

    print()
    print('═════════════════════════════════════════════════')
    print('ALL 6 PDFs GENERATED SUCCESSFULLY')
    print('═════════════════════════════════════════════════')
    print()
    print('Files:')
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.pdf'):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            print(f'  {f} ({size:,} bytes)')
