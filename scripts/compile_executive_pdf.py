#!/usr/bin/env python3
"""
Compile VVU IVE Executive Documentation Bundle → single PDF for DWS meeting.
Uses ReportLab. Dark terminal aesthetic matching the web app (cyan/green/amber).
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
)

# ─── Colors (kernel theme) ────────────────────────────────────────────
BG_DARK = HexColor('#060a10')
BG_ELEVATED = HexColor('#0d141d')
CYAN = HexColor('#00d4ff')
GREEN = HexColor('#00ff88')
AMBER = HexColor('#ffb800')
RED = HexColor('#ff4d4d')
DIM = HexColor('#5b7280')
FG = HexColor('#cbd5d9')
LINE = HexColor('#1e3140')

# ─── Page templates with dark background ──────────────────────────────

def draw_page_bg(canv, doc):
    canv.saveState()
    canv.setFillColor(BG_DARK)
    canv.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canv.setStrokeColor(CYAN)
    canv.setLineWidth(1.5)
    canv.line(20*mm, A4[1] - 15*mm, A4[0] - 20*mm, A4[1] - 15*mm)
    canv.setFont('Helvetica-Bold', 7)
    canv.setFillColor(CYAN)
    canv.drawString(20*mm, A4[1] - 12*mm, 'VVU IVE')
    canv.setFillColor(DIM)
    canv.setFont('Helvetica', 7)
    canv.drawRightString(A4[0] - 20*mm, A4[1] - 12*mm,
                         'Executive Documentation Bundle · DWS Meeting · 2026-08-26')
    canv.setStrokeColor(LINE)
    canv.setLineWidth(0.5)
    canv.line(20*mm, 15*mm, A4[0] - 20*mm, 15*mm)
    canv.setFont('Helvetica', 7)
    canv.setFillColor(AMBER)
    canv.drawString(20*mm, 11*mm, '[SIMULATION — NOT MUNICIPAL OPERATIONAL DATA]')
    canv.setFillColor(DIM)
    canv.drawRightString(A4[0] - 20*mm, 11*mm, f'Page {canv.getPageNumber()}')
    canv.restoreState()

def draw_cover_bg(canv, doc):
    canv.saveState()
    canv.setFillColor(BG_DARK)
    canv.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canv.setStrokeColor(HexColor('#0a1520'))
    canv.setLineWidth(0.3)
    for x in range(0, int(A4[0]), 20):
        canv.line(x, 0, x, A4[1])
    for y in range(0, int(A4[1]), 20):
        canv.line(0, y, A4[0], y)
    canv.setStrokeColor(CYAN)
    canv.setLineWidth(3)
    canv.line(0, A4[1] - 5*mm, A4[0], A4[1] - 5*mm)
    canv.setStrokeColor(GREEN)
    canv.setLineWidth(3)
    canv.line(0, 5*mm, A4[0], 5*mm)
    canv.restoreState()

# ─── Styles ────────────────────────────────────────────────────────────

def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CoverTitle', fontName='Helvetica-Bold', fontSize=28, textColor=CYAN, alignment=TA_CENTER, spaceAfter=8, leading=34))
    styles.add(ParagraphStyle(name='CoverSubtitle', fontName='Helvetica', fontSize=12, textColor=FG, alignment=TA_CENTER, spaceAfter=6, leading=16))
    styles.add(ParagraphStyle(name='CoverMeta', fontName='Helvetica', fontSize=9, textColor=DIM, alignment=TA_CENTER, spaceAfter=4, leading=12))
    styles.add(ParagraphStyle(name='H1', fontName='Helvetica-Bold', fontSize=16, textColor=CYAN, spaceBefore=20, spaceAfter=10, leading=20))
    styles.add(ParagraphStyle(name='H2', fontName='Helvetica-Bold', fontSize=12, textColor=GREEN, spaceBefore=14, spaceAfter=6, leading=16))
    styles.add(ParagraphStyle(name='H3', fontName='Helvetica-Bold', fontSize=10, textColor=AMBER, spaceBefore=10, spaceAfter=4, leading=14))
    styles.add(ParagraphStyle(name='BodyDark', fontName='Helvetica', fontSize=9.5, textColor=FG, alignment=TA_JUSTIFY, spaceAfter=6, leading=14))
    styles.add(ParagraphStyle(name='BodyDarkLeft', fontName='Helvetica', fontSize=9.5, textColor=FG, alignment=TA_LEFT, spaceAfter=6, leading=14))
    styles.add(ParagraphStyle(name='KCode', fontName='Courier', fontSize=8, textColor=CYAN, backColor=BG_ELEVATED, leftIndent=10, rightIndent=10, spaceAfter=8, leading=11))
    styles.add(ParagraphStyle(name='Quote', fontName='Helvetica-Oblique', fontSize=9, textColor=AMBER, leftIndent=15, rightIndent=15, spaceAfter=8, leading=13))
    styles.add(ParagraphStyle(name='Label', fontName='Helvetica-Bold', fontSize=8, textColor=DIM, spaceAfter=2, leading=10))
    return styles

# ─── Build content ────────────────────────────────────────────────────

def build_cover(styles):
    s = []
    s.append(Spacer(1, 80*mm))
    s.append(Paragraph('VVU IVE', styles['CoverTitle']))
    s.append(Paragraph('Immersive Virtual Environment', styles['CoverSubtitle']))
    s.append(Spacer(1, 8*mm))
    s.append(Paragraph('Evidence-Verification Layer for', styles['CoverSubtitle']))
    s.append(Paragraph('Infrastructure Observations', styles['CoverSubtitle']))
    s.append(Spacer(1, 20*mm))
    class_data = [[Paragraph('<font color="#ffb800"><b>SIMULATION DATA — NOT MUNICIPAL OPERATIONAL DATA</b></font>', styles['BodyDarkLeft'])]]
    class_table = Table(class_data, colWidths=[140*mm])
    class_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BG_ELEVATED),('BOX',(0,0),(-1,-1),1,AMBER),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    s.append(class_table)
    s.append(Spacer(1, 25*mm))
    s.append(Paragraph('Executive Documentation Bundle', styles['CoverSubtitle']))
    s.append(Paragraph('Prepared for: Department of Water and Sanitation (DWS)', styles['CoverMeta']))
    s.append(Paragraph('From: Venture Vision Ubuntu (VVU)', styles['CoverMeta']))
    s.append(Paragraph('Date: 2026-08-26', styles['CoverMeta']))
    s.append(Spacer(1, 8*mm))
    s.append(Paragraph('Repository: github.com/divhanimajokweni-ctrl/proofbridge-liner', styles['CoverMeta']))
    s.append(Paragraph('Branch: feat/vvu-gov-deploy', styles['CoverMeta']))
    s.append(Paragraph('Domain: vvu-gov.space-z.ai', styles['CoverMeta']))
    s.append(PageBreak())
    return s

def build_toc(styles):
    s = []
    s.append(Paragraph('Table of Contents', styles['H1']))
    s.append(Spacer(1, 5*mm))
    toc_items = [
        ('01','Executive','01a One-Page Executive Brief','4'),
        ('01','Executive','01b Technical Demonstration Brief','5'),
        ('02','Scientific','02a HOM — Hydraulic Observability Model','7'),
        ('02','Scientific','02b Sparse Sensor Hypothesis','8'),
        ('02','Scientific','02c EIS v1.0 — Evidence Independence Spec','9'),
        ('02','Scientific','02d Architecture Figure','11'),
        ('03','Software Evidence','03a VRES v1.0 Component Inventory','12'),
        ('03','Software Evidence','03b Repository Verification','13'),
        ('04','Water Demo','04a Leakage Validation Brief','14'),
        ('04','Water Demo','04b NMBM Sandbox Specification','15'),
        ('04','Water Demo','04c Hydraulic Incident Replay Script','16'),
        ('05','Pilot','05a 72-Hour Validation Protocol','17'),
        ('05','Pilot','05b Data Requirements','19'),
    ]
    data = [['#','Folder','Document','Page']]
    for num, folder, title, page in toc_items:
        data.append([num, folder, title, page])
    toc_table = Table(data, colWidths=[12*mm, 40*mm, 100*mm, 15*mm])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,0),8),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'),('FONTSIZE',(0,1),(-1,-1),8.5),
        ('TEXTCOLOR',(0,1),(0,-1),CYAN),('TEXTCOLOR',(1,1),(1,-1),DIM),
        ('TEXTCOLOR',(2,1),(2,-1),FG),('TEXTCOLOR',(3,1),(3,-1),GREEN),
        ('ALIGN',(3,0),(3,-1),'RIGHT'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('LEFTPADDING',(0,0),(-1,-1),8),
    ]))
    s.append(toc_table)
    s.append(PageBreak())
    return s

def build_exec_brief(styles):
    s = []
    s.append(Paragraph('01a · One-Page Executive Brief', styles['H1']))
    s.append(Paragraph('From: Venture Vision Ubuntu (VVU) · To: DWS Technical Validation · Date: 2026-08-26', styles['Label']))
    s.append(Spacer(1, 5*mm))
    s.append(Paragraph('What VVU IVE Is', styles['H2']))
    s.append(Paragraph('VVU IVE is an <b>evidence-verification layer</b> for infrastructure observations. It allows sparse municipal observations to be correlated, independently assessed, provenance-tracked, and converted into auditable engineering evidence.', styles['BodyDark']))
    s.append(Paragraph('Why Water-Loss Matters', styles['H2']))
    s.append(Paragraph('Municipal water networks lose significant volumes to non-revenue water (NRW) — underground leaks that are difficult to locate with sparse sensor coverage. SCADA systems generate measurements, but the engineering challenge is converting those measurements into verified, auditable evidence that supports maintenance decisions.', styles['BodyDark']))
    s.append(Paragraph('What We Have', styles['H2']))
    for item in [
        '<b>Working software</b> — zero lint errors, zero console errors, healthy routes, reproducible build',
        '<b>EIS v1.0 engine</b> — Evidence Independence Scoring that prevents evidence inflation (5 correlated sensors &ne; 5 independent proofs)',
        '<b>Hydro-Bayesian Kernel (HBK)</b> — Sequential Bayesian localization over 32&times;32 grid, MAP estimate + 95% credible radius',
        '<b>Sandbox pipeline</b> — setup.sh + run.sh generates auditable evidence files',
        '<b>Provenance chain</b> — every observation carries 11 fields: sensor ID, firmware, calibration, timestamp, location, DMA, environment, processing, attestation, quality, type',
    ]:
        s.append(Paragraph(f'&bull; {item}', styles['BodyDarkLeft']))
    s.append(Paragraph('What We Have NOT Done', styles['H2']))
    s.append(Paragraph('VVU has <b>not</b> operated a municipal water distribution network. We do not represent the current prototype as having been validated against municipal operational data. All water demonstration data is clearly labelled as <b>SIMULATION / PLACEHOLDER</b>.', styles['BodyDark']))
    s.append(Paragraph('What We Seek from DWS', styles['H2']))
    s.append(Paragraph('<b>Domain validation.</b> Does the engineering model VVU has encoded map correctly to how DWS and municipalities actually observe, diagnose, and verify infrastructure problems?', styles['BodyDark']))
    s.append(Paragraph('If DWS provides governed historical or test data, VVU will run the system against it under a 72-hour validation protocol and measure whether it identifies the patterns DWS engineers already recognise.', styles['BodyDark']))
    s.append(Spacer(1, 8*mm))
    s.append(Paragraph('"I haven\'t operated a municipal water network myself. My practical experience is on the systems-engineering and software side. I built IVE to address an evidence and verification problem, and I\'m here to test whether the assumptions we\'ve encoded correspond to how DWS and municipalities actually observe, diagnose, and verify infrastructure problems."', styles['Quote']))
    s.append(PageBreak())
    return s

def build_tech_demo(styles):
    s = []
    s.append(Paragraph('01b · Technical Demonstration Brief', styles['H1']))
    s.append(Paragraph('Audience: DWS technical engineers and validators · Classification: SIMULATION DATA', styles['Label']))
    s.append(Spacer(1, 5*mm))
    s.append(Paragraph('What VVU IVE Is', styles['H2']))
    s.append(Paragraph('VVU IVE (Immersive Virtual Environment) is an <b>evidence-verification layer</b> for infrastructure observations. It sits around existing SCADA and operational systems — it does not replace them.', styles['BodyDark']))
    s.append(Paragraph('The Engineering Chain', styles['H2']))
    for step in ['Municipal water network','&rarr; sparse observations (flow, pressure, level, pump/valve status)','&rarr; anomaly detection (hydraulic deviation from baseline)','&rarr; evidence correlation (link related observations across sensors + time)','&rarr; independence assessment (are corroborating observations genuinely independent?)','&rarr; candidate location inference (narrow the search area)','&rarr; field verification (human confirms or rejects)','&rarr; auditable evidence record (complete provenance chain)']:
        s.append(Paragraph(step, styles['BodyDarkLeft']))
    s.append(Paragraph('EIS v1.0 — Evidence Independence Scoring', styles['H2']))
    s.append(Paragraph('The system does <b>NOT</b> count "5 sensors agree = 100% confidence." It asks: are those 5 observations genuinely independent, or are they correlated measurements of the same event?', styles['BodyDark']))
    s.append(Paragraph('Scoring: PRIMARY (0.3) + CORRELATED (0.2) + INDEPENDENT (0.4) = 0.9 confidence &rarr; VERIFIED_CANDIDATE', styles['KCode']))
    s.append(Paragraph('5 pressure sensors on the same DMA = 1 correlated hydraulic event. 1 flow anomaly + 1 field observation + 1 acoustic signal = 3 independent evidence types.', styles['BodyDark']))
    s.append(Paragraph('HBK — Hydro-Bayesian Kernel', styles['H2']))
    s.append(Paragraph('Sequential Bayesian localization over a 32&times;32 candidate-location grid. P(S_t | O_1:t) &prop; P(O_t | S_t) &middot; P(S_t | S_{t-1}). Location is inferred from distance-attenuated acoustic/pressure amplitude at fixed listening taps. Mining-blast noise is handled as a Poisson mixture and down-weighted (not excluded) to suppress false positives.', styles['BodyDark']))
    s.append(Paragraph('Zero Fabrication Rule', styles['H2']))
    s.append(Paragraph('Missing data is never guessed. It is flagged as UNDEFINED. The system may not manufacture evidence. The 11-field provenance spine per observation ensures every conclusion traces to specific, auditable observations.', styles['BodyDark']))
    s.append(Paragraph('Repository State (Verified)', styles['H2']))
    repo_data = [['Check','Result'],['Lint','&#10003; 0 errors, 0 warnings'],['Console errors','&#10003; 0'],['Dev server','&#10003; All routes 200'],['Reproducible build','&#10003; git clone &rarr; bun install &rarr; bun run dev'],['Sandbox pipeline','&#10003; setup.sh + run.sh &rarr; /evidence'],['Custom domain','vvu-gov.space-z.ai']]
    repo_table = Table(repo_data, colWidths=[50*mm, 100*mm])
    repo_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),9),('TEXTCOLOR',(0,1),(0,-1),DIM),('TEXTCOLOR',(1,1),(1,-1),GREEN),('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LEFTPADDING',(0,0),(-1,-1),8)]))
    s.append(repo_table)
    s.append(Paragraph('Proposed DWS Validation', styles['H2']))
    s.append(Paragraph('A <b>72-hour validation protocol</b> where VVU IVE is run against a DWS-provided historical or test dataset from a single DMA. Success criteria: detected events, lead time, false alerts, missed events, independence scores.', styles['BodyDark']))
    s.append(PageBreak())
    return s

def build_eis_spec(styles):
    s = []
    s.append(Paragraph('02c · EIS v1.0 — Evidence Independence Specification', styles['H1']))
    s.append(Spacer(1, 5*mm))
    s.append(Paragraph('Purpose', styles['H2']))
    s.append(Paragraph('EIS v1.0 defines how VVU IVE evaluates whether observations that appear to corroborate each other are <b>genuinely independent</b> — or are merely correlated measurements of the same underlying phenomenon.', styles['BodyDark']))
    s.append(Paragraph('Evidence States', styles['H2']))
    states_data = [['State','Meaning','Example'],['Valid','Within physical range, quality VALID','Flow 111 L/s with VALID flag'],['Missing','No data for 17+ minutes','Sensor offline &rarr; UNDEFINED'],['Anomalous','Impossible physics','999m pressure spike'],['Correlated','Same DMA, time, type','2 pressure sensors on same DMA'],['Independent','Different principle, location','Flow + field + acoustic'],['Insufficient','Not enough to assess','Only 1 sensor, no field evidence']]
    states_table = Table(states_data, colWidths=[28*mm, 55*mm, 67*mm])
    states_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('TEXTCOLOR',(0,1),(0,-1),GREEN),('TEXTCOLOR',(1,1),(-1,-1),FG),('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6)]))
    s.append(states_table)
    s.append(Paragraph('Independence Scoring', styles['H2']))
    s.append(Paragraph('Score = (has_primary &times; 0.3) + (has_correlated &times; 0.2) + (has_independent &times; 0.4)', styles['KCode']))
    s.append(Paragraph('If has_primary AND has_pump_context &rarr; REJECTED (false positive)<br/>If score &ge; 0.8 &rarr; VERIFIED_CANDIDATE<br/>Else &rarr; INSUFFICIENT_EVIDENCE', styles['KCode']))
    s.append(Paragraph('Key Rule: Correlated observations cap out', styles['H2']))
    s.append(Paragraph('Multiple correlated sensors add <b>small</b> confidence (proves event happened), but they do NOT scale linearly. 1 flow anomaly + 5 correlated pressure drops &ne; 6 independent proofs. It equals 1 primary + 1 correlated event.', styles['BodyDark']))
    s.append(Paragraph('Key Rule: Independent corroboration is the gold standard', styles['H2']))
    s.append(Paragraph('1 flow anomaly + 1 acoustic signal = <b>higher confidence</b> than 1 flow anomaly + 10 pressure sensors on the same DMA. Different measurement principles provide genuinely new information.', styles['BodyDark']))
    s.append(Paragraph('DMA Calibration', styles['H2']))
    cal_data = [['Parameter','Default','Range','Purpose'],['flowDeviationThreshold','10%','1-50%','Min flow deviation to flag'],['pressureDropThreshold','5%','1-30%','Min pressure drop to correlate'],['correlationTimeWindow','60 min','1-1440','Max time gap for correlation']]
    cal_table = Table(cal_data, colWidths=[45*mm, 25*mm, 25*mm, 55*mm])
    cal_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('TEXTCOLOR',(0,1),(-1,-1),FG),('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6)]))
    s.append(cal_table)
    s.append(Paragraph('Parameters are serialized into the audit receipt so the result is mathematically reproducible — a municipal investigator can verify exactly why the system made its decision.', styles['BodyDark']))
    s.append(Paragraph('Zero Fabrication Rule', styles['H2']))
    s.append(Paragraph('Missing data is never guessed. It is flagged as UNDEFINED. If a sensor is offline, EIS does not interpolate a value and treat it as evidence. The observation count drops, and the independence score is recomputed from remaining observations.', styles['BodyDark']))
    s.append(Paragraph('<b>The system may not manufacture evidence.</b>', styles['Quote']))
    s.append(PageBreak())
    return s

def build_validation_brief(styles):
    s = []
    s.append(Paragraph('04a · Leakage Validation Brief', styles['H1']))
    s.append(Spacer(1, 5*mm))
    s.append(Paragraph('The Chain', styles['H2']))
    s.append(Paragraph('Municipal water network &rarr; sparse observations &rarr; anomaly detection &rarr; evidence correlation &rarr; independent evidence assessment &rarr; location/claim &rarr; verification &rarr; maintenance decision &rarr; auditable evidence record', styles['KCode']))
    s.append(Paragraph('Hydraulic Incident Replay', styles['H2']))
    s.append(Paragraph('The 10-step interactive replay demonstrates the full evidence pipeline: baseline &rarr; anomaly injection &rarr; field evidence &rarr; acoustic evidence &rarr; operational context &rarr; correlation &rarr; independence assessment &rarr; claim &rarr; verification &rarr; audit trail.', styles['BodyDark']))
    replay_data = [['Step','Action','Result'],['1','BASELINE','97 L/s @ 48.5m — nominal'],['2','INTRODUCE ANOMALY','Flow &uarr; 111 L/s, Pressure &darr; 46.1m'],['3','ADD FIELD EVIDENCE','Ground moisture at segment S-142'],['4','ADD ACOUSTIC','Anomalous signal at S-142'],['5','CHECK CONTEXT','No pump/valve changes'],['6','CORRELATE','5 observations linked'],['7','ASSESS INDEPENDENCE','Score 1.00 &rarr; VERIFIED_CANDIDATE'],['8','GENERATE CLAIM','Zone S-142, DMA-7'],['9','VERIFY','Field confirms leak at pipe joint'],['10','AUDIT','SHA-256 receipt + 11-field provenance']]
    replay_table = Table(replay_data, colWidths=[12*mm, 45*mm, 93*mm])
    replay_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('TEXTCOLOR',(0,1),(0,-1),CYAN),('TEXTCOLOR',(1,1),(1,-1),GREEN),('TEXTCOLOR',(2,1),(2,-1),FG),('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6)]))
    s.append(replay_table)
    s.append(PageBreak())
    s.append(Paragraph('05a · 72-Hour Validation Protocol', styles['H1']))
    s.append(Spacer(1, 5*mm))
    s.append(Paragraph('Objective', styles['H2']))
    s.append(Paragraph('Validate whether VVU IVE can ingest real DWS/municipal SCADA data, detect hydraulic anomalies that correspond to known historical failure events, and produce auditable evidence packages with complete provenance.', styles['BodyDark']))
    s.append(Paragraph('Protocol Phases', styles['H2']))
    phases_data = [['Phase','Hours','Key Actions','Pass Criterion'],['A','0-8','Ingest SCADA + failure register + asset metadata','All records imported, no data loss'],['B','8-24','Run anomaly detection vs historical time series','Anomaly list + match/no-match table'],['C','24-48','EIS v1.0 evidence assessment per anomaly','Independence score + 11-field provenance'],['D','48-72','Reporting + DWS engineer review','Detected, lead time, false alerts, missed']]
    phases_table = Table(phases_data, colWidths=[15*mm, 20*mm, 70*mm, 45*mm])
    phases_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('TEXTCOLOR',(0,1),(0,-1),CYAN),('TEXTCOLOR',(1,1),(1,-1),GREEN),('TEXTCOLOR',(2,1),(-1,-1),FG),('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6)]))
    s.append(phases_table)
    s.append(Paragraph('Success Criteria', styles['H2']))
    for c in ['Events detected at least 48h early: &ge; 50% of confirmed failures','Median lead time: &ge; 24 hours','False alerts: &lt; 1 per 10 pipe-months','Evidence reproducibility: 100% deterministic (same data &rarr; same result)','Provenance completeness: 100% of flagged events (all 11 fields)','Zero Fabrication Rule: no fabricated data, all UNDEFINED preserved']:
        s.append(Paragraph(f'&bull; {c}', styles['BodyDarkLeft']))
    s.append(Paragraph('Termination Criteria', styles['H2']))
    s.append(Paragraph('The protocol terminates when all 4 phases are complete, OR DWS determines the model does not map correctly, OR 72 hours elapsed. <b>Either outcome is valid.</b> The purpose is to measure, not to prove success.', styles['BodyDark']))
    s.append(PageBreak())
    return s

def build_data_reqs(styles):
    s = []
    s.append(Paragraph('05b · Data Requirements for DWS Validation', styles['H1']))
    s.append(Spacer(1, 5*mm))
    s.append(Paragraph('Data Needed from DWS', styles['H2']))
    data_req = [['Category','Fields','Purpose'],['Flow','timestamp, meter ID, value (L/s), quality flags','Anomaly detection'],['Pressure','timestamp, sensor ID, value (m), quality flags','Anomaly detection'],['Reservoir level','timestamp, sensor ID, value (m)','Context'],['Pump/Valve status','timestamp, asset ID, state','Operating context'],['DMA inflow','timestamp, bulk meter, value (L/s)','Water balance'],['Min night flow','time series (02:00-04:00)','Baseline computation'],['Known leak events','asset ID, failure type, location, verification','Validation ground truth'],['Contextual','rainfall, temperature, power interruptions','False-positive suppression']]
    data_table = Table(data_req, colWidths=[35*mm, 65*mm, 50*mm])
    data_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BG_ELEVATED),('TEXTCOLOR',(0,0),(-1,0),CYAN),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8.5),('TEXTCOLOR',(0,1),(0,-1),GREEN),('TEXTCOLOR',(1,1),(-1,-1),FG),('LINEBELOW',(0,0),(-1,0),1,CYAN),('LINEBELOW',(0,1),(-1,-1),0.3,LINE),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6)]))
    s.append(data_table)
    s.append(Paragraph('Success Criteria', styles['H2']))
    for q, a in [('Does system reduce search area?','Yes — narrows to DMA/segment'),('Distinguish valid/missing/anomalous/correlated/independent?','Yes — EIS v1.0'),('Can engineer inspect why system believes claim?','Yes — provenance drill-down'),('Can result be reproduced via pipeline?','Yes — deterministic'),('False alert rate','&lt; 1 per 10 pipe-months'),('Lead time','&ge; 48 hours before confirmed onset')]:
        s.append(Paragraph(f'<b>{q}</b> &rarr; <font color="#00ff88">{a}</font>', styles['BodyDarkLeft']))
    s.append(Paragraph('Data Sharing Agreement', styles['H2']))
    s.append(Paragraph('Both parties sign a data sharing agreement covering permitted use, retention period, and de-identification requirements before any real DWS data is provided.', styles['BodyDark']))
    s.append(Spacer(1, 15*mm))
    footer_data = [[Paragraph('<font color="#00d4ff"><b>Repository:</b></font> github.com/divhanimajokweni-ctrl/proofbridge-liner<br/><font color="#00d4ff"><b>Branch:</b></font> feat/vvu-gov-deploy<br/><font color="#00d4ff"><b>Domain:</b></font> vvu-gov.space-z.ai<br/><font color="#ffb800"><b>Classification:</b></font> SIMULATION — NOT MUNICIPAL OPERATIONAL DATA', styles['BodyDarkLeft'])]]
    footer_table = Table(footer_data, colWidths=[150*mm])
    footer_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BG_ELEVATED),('BOX',(0,0),(-1,-1),1,CYAN),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    s.append(footer_table)
    return s

# ─── Main ──────────────────────────────────────────────────────────────

def main():
    output_path = '/home/z/my-project/docs/executive-bundle/VVU_IVE_Executive_Bundle_DWS.pdf'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(output_path, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=22*mm, bottomMargin=20*mm, title='VVU IVE — Executive Documentation Bundle for DWS', author='Venture Vision Ubuntu (VVU)', subject='Evidence-Verification Layer for Infrastructure Observations', creator='VVU IVE')
    styles = make_styles()
    story = []
    story.extend(build_cover(styles))
    story.extend(build_toc(styles))
    story.extend(build_exec_brief(styles))
    story.extend(build_tech_demo(styles))
    story.extend(build_eis_spec(styles))
    story.extend(build_validation_brief(styles))
    story.extend(build_data_reqs(styles))
    doc.build(story, onFirstPage=draw_cover_bg, onLaterPages=draw_page_bg)
    print(f'✓ PDF compiled: {output_path}')
    print(f'  Size: {os.path.getsize(output_path) / 1024:.1f} KB')

if __name__ == '__main__':
    main()
