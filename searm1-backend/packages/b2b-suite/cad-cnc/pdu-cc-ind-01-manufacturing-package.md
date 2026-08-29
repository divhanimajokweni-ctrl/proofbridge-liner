## 13. pdu-cc-ind-01-manufacturing-package (Extracted)

### FreeCAD Python Macro

```python
# ==============================================================================
# FREECAD PYTHON MACRO: PDU-CC-IND-01 COUPON CLAMP BRACKET
# DESIGNED BY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MATERIAL: VIRGIN PEEK (POLYETHER ETHER KETONE) OR DUPLEX 2205
# ==============================================================================
import FreeCAD as App
import Part

doc = App.newDocument("PDU_CC_IND_01_Clamp_Bracket")

# 2. Base PEEK Block: 100 mm (X) x 60 mm (Y) x 35 mm (Z)
block = Part.makeBox(100.0, 60.0, 35.0)

# 3. Define 4 Parallel Slots (Length 75 mm, Width 3.10 mm, Depth 20 mm)
slots = []
y_positions = [12.0, 24.0, 36.0, 48.0]
for y_pos in y_positions:
    slot_tool = Part.makeBox(75.0, 3.10, 25.0)
    slot_tool.translate(App.Vector(12.5, y_pos - 1.55, 15.0))
    slots.append(slot_tool)

# 4. Transverse Retaining Pin Hole (∅ 6.2 mm / Radius 3.1 mm)
pin_cylinder = Part.makeCylinder(3.1, 60.0)
pin_cylinder.rotate(App.Vector(0, 0, 0), App.Vector(1, 0, 0), 90.0)
pin_cylinder.translate(App.Vector(50.0, 60.0, 10.0))

# 5. Vertical Baseplate M6 Anchor Holes (∅ 6.5 mm / Radius 3.25 mm)
anchor_1 = Part.makeCylinder(3.25, 35.0)
anchor_1.translate(App.Vector(15.0, 30.0, 0.0))

anchor_2 = Part.makeCylinder(3.25, 35.0)
anchor_2.translate(App.Vector(85.0, 30.0, 0.0))

# 6. Execute Constructive Solid Geometry (CSG) Cuts
final_body = block
for slot_tool in slots:
    final_body = final_body.cut(slot_tool)
final_body = final_body.cut(pin_cylinder)
final_body = final_body.cut(anchor_1)
final_body = final_body.cut(anchor_2)

Part.show(final_body)
doc.recompute()
print("Success: PDU-CC-IND-01 geometry successfully generated.")
```

### Fanuc-Compatible CNC G-code

```gcode
%
O1001 (PDU-CC-IND-01 MILLING OPERATION)
G21 (Metric Units)
G90 (Absolute Programming)
G17 (XY Plane Selection)
G80 (Cancel Canned Cycles)
G40 (Cancel Tool Radius Compensation)

(----------------------------------------------------------------)
(STEP 1: DRILL VERTICAL M6 ANCHOR HOLES)
(T4 - 6.5MM DRILL - SPINDLE 2200 RPM - FEED 180 MM/MIN)
(----------------------------------------------------------------)
T4 M6
G54 G00 X15.0 Y30.0 S2200 M03
G43 H04 Z10.0 M08
G83 R3.0 Z-38.0 Q5.0 F180
G00 Z10.0
X85.0 Y30.0
G83 R3.0 Z-38.0 Q5.0 F180
G80 G00 Z25.0 M09
M05

(----------------------------------------------------------------)
(STEP 2: ROUGH SLOTS - T1 6.0MM ENDMILL)
(SPINDLE 3000 RPM - FEED 250 MM/MIN)
(----------------------------------------------------------------)
T1 M6
G54 G00 X12.5 Y12.0 S3000 M03
G43 H01 Z10.0 M08

(SLOT 1)
G01 Z35.0 F100
G01 Z15.0 F80
G01 X87.5 F250
G00 Z25.0

(SLOT 2)
X12.5 Y24.0
G01 Z15.0 F80
G01 X87.5 F250
G00 Z25.0

(SLOT 3)
X12.5 Y36.0
G01 Z15.0 F80
G01 X87.5 F250
G00 Z25.0

(SLOT 4)
X12.5 Y48.0
G01 Z15.0 F80
G01 X87.5 F250
G00 Z25.0 M09
M05

(----------------------------------------------------------------)
(STEP 3: FINISH SLOTS TO EXACT 3.10MM WIDTH)
(T2 - 3.0MM ENDMILL - SPINDLE 4500 RPM - FEED 350 MM/MIN)
(----------------------------------------------------------------)
T2 M6
G54 G00 X12.5 Y11.95 S4500 M03
G43 H02 Z10.0 M08

(FINISH SLOT 1)
G01 Z15.0 F100
G01 X87.5 F350
G01 Y12.05 F100
G01 X12.5 F350
G00 Z25.0

(FINISH SLOT 2)
X12.5 Y23.95
G01 Z15.0 F100
G01 X87.5 F350
G01 Y24.05 F100
G01 X12.5 F350
G00 Z25.0

(FINISH SLOT 3)
X12.5 Y35.95
G01 Z15.0 F100
G01 X87.5 F350
G01 Y36.05 F100
G01 X12.5 F350
G00 Z25.0

(FINISH SLOT 4)
X12.5 Y47.95
G01 Z15.0 F100
G01 X87.5 F350
G01 Y48.05 F100
G01 X12.5 F350
G00 Z25.0 M09
M05

G28 G91 Z0
G90
M30
%
```

---
