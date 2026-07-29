#!/usr/bin/env python3
"""
VVU HBK Mk-II — Phase 2 Power & Thermal Architecture Engineering Specification
PDF Generator using ReportLab

Generates a professional engineering specification document for the HBK Mk-II
ruggedized edge terminal for municipal water infrastructure monitoring.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Frame, PageTemplate
)
from reportlab.platypus.doctemplate import BaseDocTemplate
from reportlab.lib import colors

# ─── Color Palette ───────────────────────────────────────────────────────────
VVU_DARK      = HexColor("#1a1a2e")
VVU_NAVY      = HexColor("#16213e")
VVU_ACCENT    = HexColor("#0f3460")
VVU_BLUE      = HexColor("#1a5276")
VVU_LIGHT_BG  = HexColor("#eaf2f8")
VVU_MED_BG    = HexColor("#d4e6f1")
VVU_HEADER_BG = HexColor("#1a3c5e")
VVU_ROW_ALT   = HexColor("#f0f4f8")
VVU_ROW_EVEN  = HexColor("#ffffff")
VVU_BORDER    = HexColor("#2c3e50")
VVU_WARM      = HexColor("#c0392b")
VVU_AMBER     = HexColor("#d4ac0d")
VVU_GREEN     = HexColor("#1e8449")
VVU_GRAY      = HexColor("#7f8c8d")
VVU_TEXT       = HexColor("#2c3e50")

# ─── Output Path ─────────────────────────────────────────────────────────────
OUTPUT_DIR = "/home/z/my-project/public/hbk/docs"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "hbk-mk2-engineering-spec.pdf")

# ─── Page Setup ──────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN_LEFT   = 20 * mm
MARGIN_RIGHT  = 20 * mm
MARGIN_TOP    = 25 * mm
MARGIN_BOTTOM = 20 * mm

# ─── Styles ──────────────────────────────────────────────────────────────────
def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="DocTitle",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=VVU_DARK,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="DocSubtitle",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=VVU_ACCENT,
        alignment=TA_CENTER,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="DocMeta",
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=VVU_GRAY,
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=VVU_HEADER_BG,
        spaceBefore=16,
        spaceAfter=6,
        borderWidth=0,
        borderPadding=0,
    ))
    styles.add(ParagraphStyle(
        name="SubSectionTitle",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=VVU_BLUE,
        spaceBefore=10,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="BodyText2",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=VVU_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="BulletItem",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=VVU_TEXT,
        leftIndent=14,
        spaceAfter=3,
        bulletIndent=4,
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=white,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=VVU_TEXT,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="TableCellCenter",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=VVU_TEXT,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="FooterStyle",
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=VVU_GRAY,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="CalloutText",
        fontName="Helvetica-BoldOblique",
        fontSize=9,
        leading=13,
        textColor=VVU_WARM,
        leftIndent=12,
        rightIndent=12,
        spaceBefore=6,
        spaceAfter=6,
        borderWidth=1,
        borderColor=VVU_WARM,
        borderPadding=6,
        backColor=HexColor("#fdf2f2"),
    ))
    styles.add(ParagraphStyle(
        name="SpecLabel",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=VVU_ACCENT,
    ))
    styles.add(ParagraphStyle(
        name="SpecValue",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=VVU_TEXT,
    ))
    return styles

# ─── Helper Functions ────────────────────────────────────────────────────────
def section_divider():
    return HRFlowable(
        width="100%", thickness=0.5, color=VVU_MED_BG,
        spaceBefore=4, spaceAfter=8
    )

def make_table(headers, rows, col_widths=None):
    """Build a styled engineering table with alternating row colors."""
    styles = build_styles()

    header_paras = [Paragraph(h, styles["TableHeader"]) for h in headers]
    data = [header_paras]
    for row in rows:
        data.append([Paragraph(str(c), styles["TableCellCenter"]) for c in row])

    if col_widths is None:
        available = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
        col_widths = [available / len(headers)] * len(headers)

    tbl = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), VVU_HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME",  (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",  (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING",    (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("TOPPADDING",    (0, 1), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
        ("GRID",       (0, 0), (-1, -1), 0.4, VVU_BORDER),
        ("LINEBELOW",  (0, 0), (-1, 0), 1.2, VVU_DARK),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [VVU_ROW_EVEN, VVU_ROW_ALT]),
    ]
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

def spec_row(label, value, styles):
    """Return a two-column spec table row as a list of Paragraphs."""
    return [Paragraph(label, styles["SpecLabel"]), Paragraph(value, styles["SpecValue"])]

def make_spec_table(pairs, styles):
    """Build a two-column key-value specification table."""
    data = [[Paragraph("Parameter", styles["TableHeader"]),
             Paragraph("Value", styles["TableHeader"])]]
    for label, value in pairs:
        data.append([Paragraph(label, styles["SpecLabel"]),
                     Paragraph(value, styles["SpecValue"])])

    available = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
    tbl = Table(data, colWidths=[available * 0.40, available * 0.60], repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), VVU_HEADER_BG),
        ("TEXTCOLOR",  (0, 0), (-1, 0), white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING",    (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("TOPPADDING",    (0, 1), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("GRID",       (0, 0), (-1, -1), 0.4, VVU_BORDER),
        ("LINEBELOW",  (0, 0), (-1, 0), 1.2, VVU_DARK),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [VVU_ROW_EVEN, VVU_ROW_ALT]),
    ]
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

# ─── Page Templates ──────────────────────────────────────────────────────────
def header_footer(canvas, doc):
    """Draw header bar and footer on every page."""
    canvas.saveState()
    # Header bar
    canvas.setFillColor(VVU_DARK)
    canvas.rect(0, PAGE_H - 18*mm, PAGE_W, 18*mm, fill=1, stroke=0)
    # VVU logo text
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(MARGIN_LEFT, PAGE_H - 12*mm, "VVU")
    canvas.setFont("Helvetica", 8)
    canvas.drawString(MARGIN_LEFT + 22*mm, PAGE_H - 12*mm, "Venture Vision Ubuntu")
    # Right header
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(PAGE_W - MARGIN_RIGHT, PAGE_H - 10*mm,
                           "HBK Mk-II Engineering Specification")
    canvas.drawRightString(PAGE_W - MARGIN_RIGHT, PAGE_H - 14*mm,
                           "Phase 2 — Power & Thermal Architecture")
    # Accent line
    canvas.setStrokeColor(HexColor("#3498db"))
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN_LEFT, PAGE_H - 18*mm, PAGE_W - MARGIN_RIGHT, PAGE_H - 18*mm)
    # Footer
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(VVU_GRAY)
    canvas.drawString(MARGIN_LEFT, 10*mm,
                      "VVU HBK Mk-II — CONFIDENTIAL — March 2025")
    canvas.drawRightString(PAGE_W - MARGIN_RIGHT, 10*mm,
                           f"Page {doc.page}")
    # Footer line
    canvas.setStrokeColor(VVU_MED_BG)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_LEFT, 14*mm, PAGE_W - MARGIN_RIGHT, 14*mm)
    canvas.restoreState()

# ─── Build Document Content ──────────────────────────────────────────────────
def build_content():
    styles = build_styles()
    story = []

    # ── Title Block ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(
        "VVU HBK Mk-II — Phase 2 Power &amp; Thermal<br/>Architecture Engineering Specification",
        styles["DocTitle"]
    ))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "8S4P 32700 LiFePO\u2084 Battery &bull; Star Ground Wiring &bull; Epistemic Thermal Governance",
        styles["DocSubtitle"]
    ))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("March 2025 &nbsp;|&nbsp; VVU (Venture Vision Ubuntu)", styles["DocMeta"]))
    story.append(section_divider())

    # ══════════════════════════════════════════════════════════════════════════
    # 1. SYSTEM OVERVIEW
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. System Overview", styles["SectionTitle"]))
    story.append(section_divider())
    story.append(Paragraph(
        "The HBK Mk-II is a ruggedized, Bayesian inference-capable edge terminal designed for "
        "municipal water infrastructure monitoring. The system operates within a 460\u00d7360\u2009mm "
        "working volume, mounted on a 3.0\u2009mm CNC-machined 6061-T6 aluminum base plate within "
        "an IP67-rated enclosure. The architecture integrates high-performance compute, precision "
        "analog sensing, and robust power management in a thermally constrained, electrically "
        "isolated package.",
        styles["BodyText2"]
    ))
    story.append(Paragraph(
        "Key design principles include epistemic thermal governance (four-tier temperature "
        "response), star-ground power distribution (P0\u2013P3 rail isolation), and mandatory EMI/RFI "
        "exclusion zones between analog and power domains. The 8S4P 32700 LiFePO\u2084 battery pack "
        "provides 614\u2009Wh of field-sustainable energy with a Daly 8S 20A BMS for cell-level "
        "protection.",
        styles["BodyText2"]
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # 2. CAD MODULE LAYOUT
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. CAD Module Layout", styles["SectionTitle"]))
    story.append(section_divider())
    story.append(Paragraph(
        "All modules are positioned relative to the base plate origin (0,0,0) at the lower-left "
        "corner. Z-coordinates reference the top surface of the 3.0\u2009mm base plate.",
        styles["BodyText2"]
    ))

    cad_headers = ["Module", "Material / Type", "Dimensions (mm)", "Position (x,y,z)"]
    cad_rows = [
        ["Base Plate", "6061-T6 Aluminum", "460 \u00d7 360 \u00d7 3", "(0, 0, 0)"],
        ["AMD Ryzen AI Compute Engine", "Compute Module", "140 \u00d7 130 \u00d7 45", "(160, 120, 3)"],
        ["Analog Front-End / Sensor Shield", "PCB + Shield", "120 \u00d7 160 \u00d7 22", "(20, 180, 3)"],
        ["PM-01 Power Dist. &amp; Daly 8S 20A BMS", "Power Module", "110 \u00d7 140 \u00d7 38", "(20, 20, 3)"],
        ["8S4P 32700 LiFePO\u2084 Pack", "Battery Pack", "150 \u00d7 85 \u00d7 80", "(140, 20, 3)"],
        ["Pyrogel XTE Aerogel Thermal Isolation", "Thermal Barrier", "160 \u00d7 95 \u00d7 85", "(135, 15, 3)"],
        ["NVMe Storage Bay", "Storage Module", "40 \u00d7 90 \u00d7 15", "(320, 60, 3)"],
        ["Sealed Comms Routing Node", "Comms Module", "100 \u00d7 140 \u00d7 25", "(340, 200, 3)"],
    ]
    available = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
    cad_widths = [available*0.28, available*0.22, available*0.24, available*0.26]
    story.append(make_table(cad_headers, cad_rows, cad_widths))

    # ══════════════════════════════════════════════════════════════════════════
    # 3. 8S4P 32700 LiFePO4 BATTERY SPECIFICATION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. 8S4P 32700 LiFePO\u2084 Battery Specification", styles["SectionTitle"]))
    story.append(section_divider())
    story.append(Paragraph(
        "The HBK Mk-II power source is an 8S4P pack constructed from IFR-32700 cylindrical "
        "LiFePO\u2084 cells. LiFePO\u2084 chemistry provides superior thermal stability, flat discharge "
        "voltage, and long cycle life (\u22652000 cycles at 80% DoD) — critical for unattended "
        "municipal deployments.",
        styles["BodyText2"]
    ))

    batt_specs = [
        ("Cell Type", "IFR-32700 cylindrical, 3.2\u2009V nominal"),
        ("Configuration", "8S4P (32 cells total)"),
        ("Pack Voltage (Nominal)", "25.6\u2009V (8 \u00d7 3.2\u2009V)"),
        ("Pack Voltage (Range)", "20.0\u201329.2\u2009V"),
        ("Pack Capacity", "20\u2009Ah (4 \u00d7 5\u2009Ah parallel)"),
        ("Pack Energy", "614\u2009Wh (25.6\u2009V \u00d7 20\u2009Ah \u00d7 1.2 ruggedization)"),
        ("BMS", "Daly 8S 20A — cell-level monitoring, balancing, protection"),
        ("Max Discharge", "20\u2009A continuous (1C)"),
        ("Ruggedization Overhead", "15% — busbars, cell holders, epoxy potting"),
        ("Operating Temperature", "\u221210\u00b0C to +60\u00b0C (charge limited 0\u201345\u00b0C)"),
    ]
    story.append(make_spec_table(batt_specs, styles))

    # ══════════════════════════════════════════════════════════════════════════
    # 4. STAR GROUND WIRING PROTOCOL (P0–P3)
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. Star Ground Wiring Protocol (P0\u2013P3)", styles["SectionTitle"]))
    story.append(section_divider())
    story.append(Paragraph(
        "The HBK Mk-II implements a four-rail star-ground architecture to prevent ground loops, "
        "minimize conducted EMI, and ensure analog signal integrity. Each rail originates from a "
        "single star point on the PM-01 power distribution module.",
        styles["BodyText2"]
    ))

    sg_headers = ["Rail", "Designation", "Wire Gauge", "Path / Description", "Isolation"]
    sg_rows = [
        ["P0", "Main Power Rail", "10 AWG", "Battery \u2192 BMS, high-current DC", "Direct"],
        ["P1", "System Power Rail", "14 AWG", "Compute power distribution", "Filtered"],
        ["P2", "Clean Rail", "18 AWG", "Galvanically isolated via DC-DC converter", "Galvanic"],
        ["P3", "Signal Rail", "STP*", "Physically separated from P0/P1", "Physical + Shield"],
    ]
    sg_widths = [available*0.08, available*0.18, available*0.14, available*0.35, available*0.25]
    story.append(make_table(sg_headers, sg_rows, sg_widths))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "* STP = Shielded Twisted Pair. P3 signal cabling maintains \u226550\u2009mm physical separation "
        "from P0/P1 power conductors throughout the enclosure.",
        styles["BodyText2"]
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # 5. EPISTEMIC THERMAL GOVERNANCE
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. Epistemic Thermal Governance", styles["SectionTitle"]))
    story.append(section_divider())
    story.append(Paragraph(
        "The HBK Mk-II implements a four-tier epistemic thermal governance framework. Each tier "
        "defines a mandatory system response triggered by measured temperature thresholds. The "
        "governance model is \u201cepistemic\u201d in that it reasons about system state under uncertainty "
        "\u2014 sensor readings are treated as evidence, not ground truth, and the system conservatively "
        "escalates when thermal evidence exceeds advisory thresholds.",
        styles["BodyText2"]
    ))

    tg_headers = ["Tier", "Temperature", "Classification", "System Response"]
    tg_rows = [
        ["T0", "22\u00b0C", "Ambient", "Baseline operating temperature — normal operation"],
        ["T1", "65\u00b0C", "Advisory", "Increased monitoring, reduced compute load, log escalation"],
        ["T2", "75\u00b0C", "Warning", "Graceful service degradation, active cooling engagement"],
        ["T3", "85\u00b0C", "Critical", "Emergency shutdown, data preservation, battery disconnect"],
    ]
    tg_widths = [available*0.08, available*0.14, available*0.16, available*0.62]
    story.append(make_table(tg_headers, tg_rows, tg_widths))

    # ══════════════════════════════════════════════════════════════════════════
    # 6. THERMAL CONTAINMENT ARCHITECTURE
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. Thermal Containment Architecture", styles["SectionTitle"]))
    story.append(section_divider())
    story.append(Paragraph(
        "Thermal containment is achieved through a four-layer architecture that directs heat "
        "from the compute engine outward to the enclosure while isolating the battery pack and "
        "analog front-end from thermal contamination.",
        styles["BodyText2"]
    ))

    tc_headers = ["Layer", "Mechanism", "Thermal Conductivity", "Function"]
    tc_rows = [
        ["1", "TIM PCM", "5\u20137\u2009W/m\u00b7K", "Phase-change thermal interface — absorbs transient heat spikes"],
        ["2", "Structural Conduction", "\u2014", "Mainboard-to-enclosure thermal path via base plate"],
        ["3", "Aerogel Isolation (Pyrogel XTE)", "0.015\u2009W/m\u00b7K", "Ultra-low-conductivity barrier around battery pack"],
        ["4", "Enclosure Radiation", "\u2014", "IP67 shell as final thermal boundary — radiative + convective"],
    ]
    tc_widths = [available*0.07, available*0.25, available*0.20, available*0.48]
    story.append(make_table(tc_headers, tc_rows, tc_widths))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "The Pyrogel XTE aerogel layer (0.015\u2009W/m\u00b7K) provides approximately 400\u00d7 thermal "
        "resistance compared to the TIM PCM layer, ensuring that battery pack temperature remains "
        "within safe operating limits even during sustained compute workloads.",
        styles["BodyText2"]
    ))

    # ══════════════════════════════════════════════════════════════════════════
    # 7. BILL OF MATERIALS (BOM)
    # ══════════════════════════════════════════════════════════════════════════
    story.append(PageBreak())
    story.append(Paragraph("7. Bill of Materials (BOM)", styles["SectionTitle"]))
    story.append(section_divider())

    bom_headers = ["#", "Component", "Specification", "Qty", "Source", "Category", "Status"]
    bom_rows = [
        ["1", "IFR-32700 LiFePO\u2084 Cell", "3.2\u2009V, 5\u2009Ah, cylindrical", "32", "EVE / Lishen", "Battery", "Qualification"],
        ["2", "Daly 8S 20A BMS", "8S, 20\u2009A continuous, UART", "1", "Daly Electronics", "BMS", "In Production"],
        ["3", "6061-T6 Base Plate", "460\u00d7360\u00d73\u2009mm, CNC machined", "1", "Custom Fab", "Structural", "Design Review"],
        ["4", "AMD Ryzen AI Compute Module", "Ryzen AI + 16\u2009GB LPDDR5", "1", "AMD", "Compute", "Evaluation"],
        ["5", "Analog Front-End PCB", "8-ch 24-bit ADC, anti-aliasing", "1", "Custom PCB", "Sensing", "Prototype"],
        ["6", "Pyrogel XTE Insulation", "160\u00d795\u00d785\u2009mm, 0.015\u2009W/m\u00b7K", "1", "Aspen Aerogels", "Thermal", "In Stock"],
        ["7", "TIM PCM Pad", "5\u20137\u2009W/m\u00b7K, phase-change", "4", "Honeywell / Laird", "Thermal", "In Stock"],
        ["8", "IP67 Enclosure", "500\u00d7400\u00d7150\u2009mm, alum alloy", "1", "Hammond / Custom", "Enclosure", "Design Review"],
        ["9", "NVMe SSD (Industrial)", "512\u2009GB, -40\u201385\u00b0C rated", "1", "Samsung / WD", "Storage", "In Stock"],
        ["10", "DC-DC Isolated Converter", "24\u219212\u2009V, 30\u2009W, galvanic isolation", "2", "Murata / Traco", "Power", "In Stock"],
        ["11", "Sealed Comms Module", "RS-485 + LTE + LoRa, IP67", "1", "Custom / Sierra", "Comms", "Prototype"],
        ["12", "Wiring Harness Kit", "10/14/18 AWG + STP, pre-terminated", "1", "Custom Assembly", "Electrical", "Design Review"],
    ]
    bom_widths = [
        available*0.04, available*0.18, available*0.22, available*0.05,
        available*0.14, available*0.10, available*0.12
    ]
    story.append(make_table(bom_headers, bom_rows, bom_widths))

    # ══════════════════════════════════════════════════════════════════════════
    # 8. EMI/RFI ISOLATION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("8. EMI/RFI Isolation", styles["SectionTitle"]))
    story.append(section_divider())

    story.append(Paragraph(
        "The 15.0\u2009mm physical isolation gap between the Analog Sensor Interface PCB and the "
        "Power Management Unit is a mandatory design constraint. This exclusion zone is enforced "
        "to prevent conducted and radiated EMI from the power domain from corrupting sensitive "
        "analog measurements.",
        styles["BodyText2"]
    ))

    story.append(Paragraph(
        "The following constraints apply within the 15.0\u2009mm EMI/RFI exclusion zone:",
        styles["BodyText2"]
    ))

    emi_constraints = [
        "\u2022 No conductive traces of any kind",
        "\u2022 No via fencing or via stitching",
        "\u2022 No copper pour (ground or power planes)",
        "\u2022 No ferromagnetic components",
        "\u2022 Physical separation enforced by base plate routed channel",
    ]
    for c in emi_constraints:
        story.append(Paragraph(c, styles["BulletItem"]))

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "VIOLATION: Any conductive element within the 15.0\u2009mm exclusion zone constitutes a "
        "critical design failure and requires immediate rework. The EMI isolation gap is verified "
        "by automated DRC (Design Rule Check) in the CAD toolchain and by physical inspection "
        "during assembly.",
        styles["CalloutText"]
    ))

    # ── End of Document ──────────────────────────────────────────────────────
    story.append(Spacer(1, 12*mm))
    story.append(section_divider())
    story.append(Paragraph(
        "End of Document &mdash; VVU HBK Mk-II Phase 2 Engineering Specification &mdash; March 2025",
        styles["DocMeta"]
    ))

    return story

# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP + 6*mm,  # extra for header bar
        bottomMargin=MARGIN_BOTTOM + 4*mm,
        title="VVU HBK Mk-II — Phase 2 Power & Thermal Architecture Engineering Specification",
        author="VVU (Venture Vision Ubuntu)",
        subject="HBK Mk-II Engineering Specification",
    )

    # Build content
    story = build_content()

    # Build with custom page template
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)

    # Report
    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"File size: {file_size:,} bytes ({file_size/1024:.1f} KB)")

if __name__ == "__main__":
    main()
