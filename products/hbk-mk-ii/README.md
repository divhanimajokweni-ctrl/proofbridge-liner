# HBK Mk-II — Hydro-Bayesian Kernel Digital Twin

> *Portable hydraulic intelligence for South African water infrastructure.*

## Overview

The HBK Mk-II is VVU's applied research instrument for municipal condition assessment. This module contains the **digital twin**, **founding partners campaign framework**, **72-hour validation simulation**, and **engineering CAD architecture** for the portable HBK Mk-II platform.

## Architecture

### Enclosure Specification

| Spec | Value |
|------|-------|
| Shell | IP67 Ruggedized Transit |
| Outer Dimensions | 500×400×180 mm |
| Working Volume | 460×360×3 mm (base plate) |
| Base Material | 6061-T6 Anodized Aluminum |
| Fasteners | 316 Stainless Steel |
| Compute | AMD Ryzen AI Embedded APU |
| Edge Compute | Kria SoM |
| Isolation | Analog→Digital Clearance Zone |

### Module Layout (FreeCAD Coordinates)

| Module | X (mm) | Y (mm) | Z (mm) | Dimensions (mm) | Color Code |
|--------|--------|--------|--------|------------------|------------|
| Chassis Base Plate | 0 | 0 | 0 | 460×360×3 | Anodized Aluminum (#C0C0C0) |
| AMD Compute Module | 160 | 120 | 3 | 140×130×45 | Industrial Green (#1A9933) |
| Sensor Interface Module | 20 | 180 | 3 | 120×160×22 | Shielded Blue (#3366CC) |
| Power BMS Module | 20 | 20 | 3 | 110×140×38 | Power Red (#CC3333) |
| NVMe Storage Bay | 160 | 40 | 3 | 40×90×15 | Grey (#808080) |
| Comms Routing Node | 340 | 200 | 3 | 100×140×25 | Comms Yellow (#CC9900) |

### Analog Isolation Design

The **Sensor Interface Module** (X=20, Y=180) is physically separated from the **AMD Compute Module** (X=160, Y=120) by a clearance zone that shields analog acoustic sensor data from high-frequency digital switching on the edge-compute board. This isolation is critical for maintaining signal integrity during field data collection.

### Capitalization: 70/20/5 Equity Split

| Holder | Percentage | Description |
|--------|-----------|-------------|
| VVU | 70% | Venture Vision Ubuntu — founding entity |
| UCT & Wits | 20% | Research collaboration partners |
| Direct Investors | 5% | Seed investment partners |
| Unallocated (AMD Target) | 5% | Strategic reserve for AMD technology partnership |

## Founding 100 Campaign

### The One-Sentence Ask

> *"Will you become one of the first 100 organizations helping establish South Africa's HBK Applied Research Programme?"*

### Sponsorship Packages

| Package | Value | Impact |
|---------|-------|--------|
| Operations | R15,000–30,000 | Enables dedicated research workspace |
| Engineering | R30,000–90,000 | Powers engineering development and algorithm validation |
| Connectivity | R5,000–15,000/year | Enables field data transmission and cloud connectivity |
| Field Operations | R10,000–25,000 | Enables safe field deployment |
| Workshop | R5,000–15,000/workshop | Enables research workshops and stakeholder meetings |
| Branding | R8,000–25,000 | Professional presence and programme identity |

### Partner Categories

- **Consortium Members**: Formal agreements (UCT, Wits, WRC, NRF, AMD, NMBM)
- **Friends of VVU**: Informal support (small businesses, cafés, community organizations)
- **Community Partners**: Operational support (catering, uniforms, printing, transport)

## 72-Hour Validation Lifecycle

| Phase | Duration | Description |
|-------|----------|-------------|
| V1: Cold Boot | 0–4h | System boot, kernel assertion, module self-test |
| V2: Sensor Calibration | 4–12h | Acoustic sensor calibration, pressure baseline |
| V3: Bayesian Inference | 12–24h | MCMC derivation validation, Brier Score monitoring |
| V4: Stress Testing | 24–36h | Circuit breaker stress, failover testing |
| V5: Network Simulation | 36–48h | Cape Town water network simulation |
| V6: Edge-Compute | 48–60h | AMD Ryzen AI APU validation, Kria SoM integration |
| V7: Final Validation | 60–72h | Full validation index, audit report, TRIP verdict |

## Programme Timeline

| Phase | Months | Key Activities |
|-------|--------|---------------|
| Campaign Launch | 1–2 | Launch Founding 100, approach Tier 1–3 partners |
| Momentum Building | 3–6 | Expand to Tier 4–8, begin field operations |
| Programme Delivery | 7–18 | Deploy HBK Mk-II, collect field data, publish research |

## Files in This Module

| File | Purpose |
|------|---------|
| `hbk_mk_ii_chassis.py` | FreeCAD Python script for instant CAD layout generation |
| `types.ts` | TypeScript type definitions for all HBK data structures |
| `dashboard.tsx` | React dashboard component with 6 tabs |
| `api-data.ts` | API route for HBK module/equity/package data |
| `gitlog-api.ts` | API route for simulated git actions log |
| `resources-api.ts` | API route for resource register data |

## Quick Start (FreeCAD)

1. Open FreeCAD
2. Open the Python console (View → Panels → Python console)
3. Copy and paste `hbk_mk_ii_chassis.py`
4. All 6 module bounding blocks will appear in the workspace
5. Begin mapping 316 stainless steel fasteners and braided wiring harnesses

## License

VVU retains ownership of the HBK platform and its supporting IP. Research outputs such as papers and datasets may be jointly authored or shared under research agreements.
