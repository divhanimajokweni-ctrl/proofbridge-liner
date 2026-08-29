## 4. vvu-hbk-product-datasheet.pdf

**HYDRO-GATEWAY (HBK Mk-II) PRODUCT DATASHEET**

### 1. PHYSICAL & MECHANICAL SPECIFICATIONS

To support rapid deployment by field maintenance personnel, the system's spatial geometry and mass distribution are strictly optimized to pass single-operator lifting limits. The primary internal plate layout organizes six modular subsystems onto a single float assembly.

| Parameter Name | System Value & Tolerance | Engineering Baseline & Rationale |
|----------------|--------------------------|----------------------------------|
| Total Envelope Dimensions | 500 mm x 400 mm x 180 mm | Protective dual-wall injection-molded transit shell housing. Sized to float the internal |
| Dry Calculated System Mass | 10.485 kg | Strictly compliant with single-operator OSHA lifting limits (10.500 kg ceiling). |
| Internal Baseplate | 460 mm x 360 mm x 3.0 mm | High-stiffness 5052-H32 aluminum baseplate floating on vibration-isolating standoffs. |
| Mechanical Center of Mass | X: 140 mm, Y: 20 mm | Maintains an acceptable 13.9 mm left-ward tilt by positioning the heavy battery core. |

### 2. ELECTRICAL, COMPUTE & POWER ARCHITECTURE

The electronics stack is designed as an isolated, multi-board architecture. An integrated star-ground protocol separates high-current charging paths from ultra-sensitive sensor lines.

- **Compute Engine**: Powered by an AMD Kria K26 SoM incorporating a quad-core ARM Cortex-A53 processor and an integrated Deep Learning Processor Unit (DPU) for running real-time state estimation on-chip.
- **Sensor Acquisition Node**: The ASI-04 Interface Card uses a TI PCM1864-Q1 ADC supporting multi-channel TDM streams to process high-frequency acoustic emissions and dynamic pressure readings.
- **Signal-to-Noise Ratio**: Achieves a measurement sensitivity of ≥ 45 dB SNR, protected by a 15 mm spatial physical separation gap from electromagnetic interference (EMI) paths.
- **Power Storage Core**: Houses an 8S4P LiFePO4 battery pack (32700 cells) yielding a 25.6V nominal bus. This high-voltage configuration reduces resistive heat generation on the BMS during peak cellular transmit bursts.

### 3. THERMAL CONTAINMENT & ENVIRONMENT DEFENSE

Operating in harsh industrial loops requires a robust passive thermal strategy to shield sensitive battery chemistry and maintain edge processing stability without external vents.

- **Ingress Protection**: Fully certified to IP68 Ingress Protection standards. The system is completely sealed, eliminating all active airflow, dust accumulation, and internal humidity build-up.
- **Passive Heat Path**: High-performance TC1 Phase-Change Material (5-7 W/m-K) acts as a direct thermal bridge to conduct heat away from the AMD Ryzen SoC directly onto the outer aluminum radiator wall.
- **Aerogel Battery Isolation**: A 10 mm Pyrogel XTE aerogel blanket acts as a physical thermal barrier, isolating the sensitive LiFePO4 battery pack from localized processor heat.
- **Watchdog Temperature Thresholds**: Features an autonomous low-power shutdown loop at a 65°C core CPU threshold to prevent thermal runaway. Normal wake-on-acoustic sensing is restored when the core drops below 55°C.

### 4. PROCESS HYDRAULICS & CORROSION TRACKING

The mechanical and software-calibration kernels of the HBK Mk-II are designed to comply with South African municipal and heavy-industry design standards, converting environmental stresses into predictive data.

| Hydraulic Domain Parameter | Standard Compliance Bounding Value | Asset Verification Impact |
|----------------------------|-----------------------------------|---------------------------|
| Nominal Operating Pressure | 6.0 bar (SANS 10112 Standard) | Establishes a citable baseline to calculate flow velocity ceiling and structural integrity. |
| Surge Transient Survival | 20.0 bar (Class IV Catastrophic Air-Slam) | SANS 1123 PN16 Flange rating with 12x M24 bolts preloaded to 154.7 Nm. |
| Corrosivity Allowance Bounding | ISO 9223 Category C5 (Severe Coastal) | Determines structural steel spool wall-depletion limits over a 20-year design. |
| Celerity Propagation Bounds | 384 m/s (HDPE) to 1348 m/s (Carbon Steel) | Structures time-of-flight acoustic cross-correlation accurately maps leak coordinates. |

### 5. THE INTEGRATED PASSIVE DUMMY UNIT (PDU)

To bypass the Zero Fabrication Catch-22 and acquire physical, site-specific water chemistry variables, the HBK Mk-II supports the inline deployment of our zero-power Passive Dummy Unit (PDU) loop. Using the non-conductive PDU-CC-IND-01 PEEK coupon clamp bracket, operators can securely hold flat metallurgical coupons directly inside live process flows to empirically measure gravimetric mass loss and pitting depths over 90-day intervals, delivering zero-risk environmental baselines for digital-twin calibration.

**For technical inquiries or production lead times, contact:** info@vaguelyvanity.co.za

---
