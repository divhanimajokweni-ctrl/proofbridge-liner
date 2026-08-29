## 12. nmbm-engineering-briefing.pdf

**NELSON MANDELA BAY METRO (NMBM) FIELD VALIDATION PORTFOLIO**

**Authoritative Specification:** Calibrated EPANET Simulation Scenarios, Severe Coastal Soil Corrosivity Allowances, and the Phase 5 Zero-Power Passive Dummy Unit (PDU) In-Situ Grounding Protocol.

**EPISTEMIC QUALITY & SOURCE DATA DISCLOSURE:** In accordance with the VVU Zero-Fabrication Policy, this document serves as an engineering specification, not an operational report. All water network SCADA data, flow readings, and leak events described herein are SIMULATION / PLACEHOLDER parameters designed to pre-calibrate our systems. No operational municipal data from the Nelson Mandela Bay Municipality is active in this release.

### 1. SYSTEM PHILOSOPHY & THE SPARSE SENSOR HYPOTHESIS

The central challenge of municipal water distribution in the Eastern Cape is localized observability. Traditional SCADA networks are highly under-instrumented, typical of legacy Class D systems, with a sparse telemetry density of ≤ 1 pressure logger per 5 km². Under such sparse constraints, localizing underground leaks using simple water-balance metrics only identifies that a volume of non-revenue water (NRW) has escaped, but provides no spatial resolution of the failure point.

The VVU Infrastructure Verification Engine (IVE) functions as a non-invasive, probabilistic evidence-verification layer that maps raw observations to network states without replacing existing SCADA infrastructure. A single high-fidelity acoustic-pressure sensor node, combined with a sequential Bayesian estimator (the Hydro-Bayesian Kernel) operating on a calibrated EPANET digital twin, can reduce the leak search radius from ≥ 10 km to a highly localized target of ≤ 500 m for Continuous Background Leaks (≥ 1 L/s).

### 2. SPATIAL EVALUATION TOPOLOGY: ZONE A & ZONE B

| Experimental Zone | Node Configuration | Telemetry Protocol | Algorithmic Treatment |
|-------------------|-------------------|-------------------|----------------------|
| **Zone A (Active Hypothesis)** | 3 VVU-HG Virtual Nodes (Junctions J-42, J-78, J-112) | 1Hz Telemetry Vector O_t = {P, F, A, T, H} | Hydro-Bayesian Kernel (HBK) sequential Monte Carlo / particle filter estimation. |
| **Zone B (Control)** | 1 Reference Node (Junction J-09) | Standard SCADA telemetry Pressure + Flow only | Classical threshold-based alarms only. Used as baseline for comparative analysis. |

### 3. SPATIAL SIMULATION: THE 5 EPANET EVALUATION SCENARIOS

| Scenario | Description |
|----------|-------------|
| **1: Dead-End Link Deficit** | Models under-instrumented dead-end spurs typical of high-density rural-urban margins. Target: Detect leaks ≥ 1 L/s across a 4.5 km polyline. |
| **2: Looped Network Interface** | Simulates highly interconnected municipal loops where pressure transient signals divide across multi-path channels. |
| **3: Topographic Low & High-Noise Stress** | Valley-bottom installations characterized by extremely low operating pressures and heavy environmental/industrial noise. Noise modeled as joint mixture distribution: P(Data|Noise) = Poisson(λ blasts) + Gaussian(μ machine)σ². |
| **4: Background Leakage Joint Evolution** | Models gradual temporal degradation of joint seals over a multi-month period. Under FAVAD regime, leakage exponent increases from 1.0 to 2.2. |
| **5: Multi-Zone Complex Topology** | Large-scale topological challenge incorporating filled polygon pressure zones, active booster pump stations, and PRV nodes. |

### 4. CORROSION BOUNDING & MATERIAL DECISION SELECTION

| Aggressiveness Profile | Chloride Levels | Soil Resistivity | Corrosion Rate (CR) | Mandated Material Impact |
|------------------------|-----------------|------------------|---------------------|--------------------------|
| Low Aggressiveness (Inland Karoo) | < 50 mg/kg | > 5000 Ohm-cm | < 0.01 mm/year | Grade 304 Stainless Steel or carbon steel acceptable. |
| Moderate Aggressiveness (Standard Municipal) | 50 - 200 mg/kg | 2000 - 5000 Ohm-cm | 0.01 - 0.05 mm/year | Grade 304 Stainless Steel with epoxy protective coatings (SANS 1217). |
| Severe Aggressiveness (Coastal NMBM / AMD) | > 200 mg/kg | < 2000 Ohm-cm | > 0.10 mm/year | Mandatory sacrificial zinc anodes, Grade 316L Stainless Steel, or HDPE. |

### 5. THE PASSIVE DUMMY UNIT (PDU) FIELD PROTOCOL

**PDU Bill of Materials:**
- Raw Metal Test Coupons: Formed from Candidate A (316L Stainless Steel), Candidate B (304 Stainless Steel), and standard Galvanized Mild Steel.
- Neoprene Isolating Washers: To electrically isolate the test coupons from the skid chassis, preventing galvanic bridging.

**4-Step Extraction SOP:**

| Step | Procedure |
|------|-----------|
| **1** | Hydraulic Isolation: Close upstream gate valves in the bypass loop and blow down remaining static pressure. |
| **2** | Enclosure Purge: Flush the deployment pit with fresh water to clear coastal silt, sand, and localized chloride deposits. |
| **3** | Mechanical Extraction: Unbolt the M8 Grade 8.8 structural fasteners securing the test plates, extracting the isolated coupons using polymer-tipped forceps. |
| **4** | Hermetic Preservation: Dry coupons immediately with dry nitrogen gas and seal them inside vacuum-packed, desiccated Mylar envelopes for transport to the Wits laboratory. |

---

**TRI-PARTY TECHNICAL ALIGNMENT SIGN-OFF**

| For Vaguely Vanity LLC (VVU) | For Wits University (Academic Lead) |
|-----------------------------|-------------------------------------|
| Name: Mihle Iviwe Majokweni | Name: Dr. Siphesihle Praise-God Khumalo |
| Title: Project Conductor & Information Officer | Title: Independent Prototype Field Auditor |
| Registration: 2026/259053/07 | Credentials: BSc, MSc, PhD (UKZN) |
| Certificate: 2026-033744 | Department: Civil & Environmental Engineering |
| Signature: | Signature: |
| Date: [INSERT] | Date: [INSERT] |

---
