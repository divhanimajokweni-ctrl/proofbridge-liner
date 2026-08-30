# Differential-Drive Pipe Inspection Crawler — Design Review Status

## Defined geometry

- Waterproof enclosure external envelope: **400 mm long × 300 mm wide × 200 mm high**.
- Two cylindrical drive-wheel envelopes: **100 mm radius × 50 mm width**.
- Differential-drive arrangement: one wheel on each side.
- Current derived placement: wheel inner faces coincide with the enclosure side planes; wheel centers are at the enclosure longitudinal midpoint and 100 mm above the ground datum.
- Placement interpretation: **REQUIRES VALIDATION**.

## Geometry completed

- Fully constrained enclosure-envelope sketch and solid.
- Fully constrained wheel sketch and solid.
- Separate enclosure and wheel part files assembled in `main.kcl`.
- Distinct left and right wheel bodies; assembly bodies are not fused.

## Blocking bracket engineering data

The RGB-camera, thermal-camera, and acoustic-microphone brackets cannot be dimensioned without inventing engineering values. The following are **REQUIRES ENGINEERING DATA** for each payload:

1. Manufacturer and exact sensor model.
2. Sensor envelope and mass.
3. Center of gravity.
4. Mounting-hole pattern, thread callout, engagement depth, and allowable clamp load.
5. Connector locations, cable bend radii, and service-clearance envelope.
6. Required optical/acoustic field of view and orientation tolerance.
7. Vibration and shock environment.
8. Bracket material, manufacturing process, thickness rules, and corrosion protection.
9. Fastener material and retention method.
10. Top-face permitted mounting zones and keep-out zones.
11. Enclosure-top load capacity and reinforcement scheme.
12. Sealing method for all penetrations.

## Waterproof enclosure data gaps

- Wall thickness: **UNDEFINED**.
- Lid split and service-access strategy: **UNDEFINED**.
- Gasket type, gland geometry, compression target, and IP rating: **REQUIRES DECISION**.
- Penetrations, cable glands, pressure equalization, drainage, and condensation control: **REQUIRES ENGINEERING DATA**.
- Material and joining process: **REQUIRES DECISION**.
- External dimensions are modeled as an envelope only; waterproof performance is **NOT VALIDATED**.

## Mobility data gaps

- Axle/bearing interface: **UNDEFINED**.
- Wheel material, tread, hub, and shaft coupling: **UNDEFINED**.
- Motor and gearbox selection: **UNDEFINED**.
- Required pipe diameter range and obstacle envelope: **REQUIRES ENGINEERING DATA**.
- Ground/pipe contact, traction, normal force, and stability: **REQUIRES VALIDATION**.
- Wheel longitudinal and vertical placement: **REQUIRES DECISION**.

## Export readiness

The current KCL assembly is suitable for geometry validation and may be exported through Zoo Design Studio after successful execution. STEP/STL export of a final engineering design is blocked until the bracket interfaces and enclosure construction are resolved.
