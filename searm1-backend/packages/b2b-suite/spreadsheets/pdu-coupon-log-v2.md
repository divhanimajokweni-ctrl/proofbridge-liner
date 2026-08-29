## 11. pdu-coupon-log-v2.xlsx (Extracted Data)

**Sheet 1: Overview & Instructions**

**Executive Context (Zero Fabrication Compliance)**

Pursuant to the absolute Zero Fabrication Policy, the primary manufacturing budget and tooling release (including the ZAR 812,490.00 Tranche 1 deposit) remain contractually locked until all 32 System Requirements Specification (SRS) parameters are verified. To resolve this administrative bottleneck, Vaguely Vanity LLC is deploying a Passive Dummy Unit (PDU) in Nelson Mandela Bay Metro (NMBM) Zone A. This zero-power mechanical assembly contains metallurgical test coupons to actively measure salinity, localized chloride content, and corrosion loss rates.

**Laboratory Standard Operating Procedure (SOP) Summary:**

| Step | Description |
|------|-------------|
| **1** | Isolation & Retrieval – Safely isolate the bypass chamber of the DN100 pressure pipe. Carefully extract the coupon rack. |
| **2** | Cleaning & De-scaling – Clean the retrieved coupons in accordance with ASTM G1 standards to remove all surface corrosion products. |
| **3** | Gravimetric Measurement – Oven-dry the coupons. Weigh each coupon on a calibrated analytical balance (±0.1 mg precision). |
| **4** | Pitting Assessment – Utilize a microscopic dial depth gauge to measure and log the maximum localized pitting depth. |
| **5** | Data Integration – Input retrieve dates, final masses, and pit depths into the Coupon Log tab. Formulas auto-evaluate. |

**Mathematical Formulas Encoded:**

| Parameter | Formula | Description |
|-----------|---------|-------------|
| Surface Area (A) | `= (2 * (L*W + W*T + L*T)) / 100` | Calculates total surface area of a rectangular coupon in cm² |
| Mass Loss (W) | `= Initial Mass - Final Mass` | Determines total dry gravimetric mass loss in grams |
| Corrosion Rate (CR) | `= (W * 8.76e4) / (A * T * D)` | Computes annualized corrosion rate in mm/year using ASTM G31 |
| Exposure Hours (T) | `= Exposure Days * 24` | Annualization parameter representing total in-situ deployment hours |

**Sheet 2: Material_Reference**

| Material Candidate | Density (g/cm³) |
|-------------------|-----------------|
| 316L Stainless Steel | 8.00 |
| 304 Stainless Steel | 8.00 |
| Galvanized Steel | 7.85 |
| Mild Steel | 7.85 |
| HDPE | 0.95 |
| Aluminium (6061-T6) | 2.70 |

**Sheet 3: Coupon Evaluation Log**

| PDU Trial Metadata | Value |
|-------------------|-------|
| PDU Device ID | PDU-NMBM-01 (Zone A Bypass) |
| Site Location | NMBM Zone A (Coastal Inlet) |
| Lead Scientist | Dr. S. Praise-God Khumalo (Wits) |
| Engineering Lead | Vaguely Vanity LLC |
| Nominal Pressure | 6.0 bar (SANS 10112) |
| Fluid Class | Potable Water (SANS 241) |
| Deployment Date | 2026-08-25 |
| Target Exposure | 90 Days Nominal |

**Sample Coupon Data:**

| Coupon ID | Material | Density | Length (mm) | Width (mm) | Thickness (mm) | Surface Area (cm²) | Initial Mass (g) | Retrieval Date | Exposure (Days) | Final Dry Mass (g) | Mass Loss (g) | Corrosion Rate (mm/yr) | Max Pit Depth (mm) |
|-----------|----------|---------|-------------|------------|----------------|-------------------|------------------|----------------|----------------|-------------------|--------------|----------------------|-------------------|
| CP-316L-01 | 316L Stainless Steel | 8.00 | 75 | 25 | 3 | 19.50 | 54.321 | 2026-11-23 | 90 | 54.318 | 0.003 | 0.000 | 0.00 |
| CP-304S-02 | 304 Stainless Steel | 8.00 | 75 | 25 | 3 | 19.50 | 54.110 | 2026-11-23 | 90 | 53.945 | 0.165 | 0.042 | 0.45 |
| CP-GALV-03 | Galvanized Steel | 7.85 | 75 | 25 | 3 | 19.50 | 53.250 | 2026-11-23 | 90 | 50.810 | 2.440 | 0.619 | 1.25 |
| CP-HDPE-04 | HDPE | 0.95 | 75 | 25 | 3 | 19.50 | 6.450 | 2026-11-23 | 90 | 6.450 | 0.000 | 0.000 | 0.00 |

---
