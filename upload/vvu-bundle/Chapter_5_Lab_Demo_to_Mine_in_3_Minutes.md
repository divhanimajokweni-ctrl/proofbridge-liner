# CHAPTER 5 LAB — HOW TO DEMO THIS TO A MINE IN 3 MINUTES
## Venture Vision Ubuntu Master Governance v2.1 · Zero Capital Edition

> **Caption for Figure 4.1:** *"One DFA, two projections — Operator vs Analyst — same ledger, Reg 2026/259053/07, R0 build."*

---

### PRE-DEMO CHECKLIST (do this BEFORE you walk in)

| Item | Why | Time |
|------|-----|------|
| Laptop charged ≥75% | No powerpoint excuses | 30s |
| `localhost:3000` loaded in browser | Boot screen + Borromean logo visible | 10s |
| Terminal open with `vvu-hash-verifier-v3-FINAL.sh` ready | "Hash is Proof" moment | 10s |
| Phone off | Respect their time | 5s |
| **B-BBEE certificate PDF** on phone homescreen | The 135% procurement recognition close | 0s |

**Total pre-demo:** 55 seconds. You have 2 minutes 5 seconds of demo.

---

### THE 3-MINUTE DEMO SCRIPT

#### MINUTE 0:00–0:30 — THE OPERATOR VIEW (MINE MANAGER LENS)

**You say:** "This is what your shift supervisor sees. Dark screen, 3D wireframe terrain of your Gqeberha test ground, Borromean rings logo — three interlinked rings, zero ambiguity."

**You do:**
1. Point to the **topbar badges**: "SHA-256 15/15, RLS GATED, SANS 1200 COMPLIANT, APU temp, DFA state, POPIA ENFORCED — these are live checks, not typed badges."
2. Point to the **3D terrain**: "That's your pipe network. Click any node pin — see the orange leak pulse? That's the FAVAD leak simulation."
3. Press **`T`** on the keyboard: "Thermal throttle — the terrain turns orange because the APU hit 65°C. The DFA state machine just transitioned."

**You say:** "That's Operator View. One question: *is there a leak?* Answer: yes or no, in 3 seconds."

#### MINUTE 0:30–1:00 — THE TOGGLE (THE WORM MOMENT)

**You say:** "Now watch this. I'm switching to Analyst View — but the WORM ledger logs the route toggle."

**You do:**
1. Click the **bright lime button** bottom-right: `WORKSPACE_ANALYTICS >`
2. The page switches to `/analytics` — dark black with `#c8ff00` lime text.
3. Open browser console (F12): show `[BLE_ADV_BROADCAST]`, `[AUTH_SUCCESS]`, `[ROUTE_TOGGLE]` log entries.
4. Open `localStorage` → `vvu_events`: show the `ROUTE_TOGGLE` entry with `ts`, `from`, `to`, `fsm` fields.

**You say:** "That's the WORM — Write Once, Read Many. Every state transition is logged with a timestamp. You can't edit it. That's your Gate 3A audit trail."

#### MINUTE 1:00–2:00 — THE ANALYST VIEW (ENGINEER LENS)

**You say:** "Now you're seeing what your engineer sees. Same FSM, different lens."

**You do:**
1. Point to the **Trust Gates panel**: "Gate 3A — one R5k pilot, 66.93% founder control. Gate 3B — R50k MRR, 68.44%. Gate 3C — three physical nodes, 70.66% terminal. That's my MOI Article 5.3.4 top-up right."
2. Point to the **LEAK_SIMULATION_ACTIVE panel**: "Click TRIGGER RAYCASTER LEAK — the FSM transitions `STEADY_STATE_LOCKED → LEAK_SIMULATION_ACTIVE`. The WORM logs `LEAK_TRIGGERED`."
3. Point to the **physics readouts**: "228.96kN hydrostatic separation force. 154.7Nm clamp torque. SANS 1123 PN16. FAVAD N1=2.5. HBK 614Wh battery. These aren't estimates — they're hashed."

**You say:** "Same DFA, two projections. The mine manager sees *is there a leak*. The engineer sees *228.96kN*. Same ledger, same hash, same Reg 2026/259053/07."

#### MINUTE 2:00–2:30 — THE HASH IS PROOF MOMENT

**You say:** "Let me prove these numbers aren't fabricated."

**You do:**
1. Switch to the terminal.
2. Run: `bash vvu-hash-verifier-v3-FINAL.sh`
3. Show all 19 files returning `OK`.
4. Show the final line: `✅ Design Freeze Level 1 - 19 files verified - Hash is Proof`

**You say:** "Nineteen files, SHA-256 hashed, WORM-stored. If anyone changes a single byte — a torque value, a flow rate, a coordinate — the hash breaks. That's not a claim. That's math."

#### MINUTE 2:30–3:00 — THE CLOSE (B-BBEE + 135%)

**You say:** "One last thing."

**You do:** Hold up your phone with the B-BBEE Level 1 certificate.

**You say:** "Vaguely Vanity Pty Ltd, Reg 2026/259053/07. B-BBEE Level 1. 135% procurement recognition. 100% Black Owned. When you pay me R5,000 for a pilot, you get 135% of that back in your B-BBEE scorecard. Anglo American, Sibanye, Sasol, Exxaro — they all need Level 1 suppliers. I'm the only one with a hashed, WORM-verified, DFA-governed proof of work."

**You say:** "Gate 3A is R5k. Gate 3B is R50k MRR. Gate 3C is three nodes deployed. I'm at Gate 1 with one node live. The question isn't *can you afford me*. The question is *can you afford to wait*."

**Silence. Let them speak first.**

---

### POST-DEMO FOLLOW-UP (if they say "send me something")

| They say | You send | Format |
|----------|----------|--------|
| "Send me a proposal" | One-pager PDF + tx hash of the hashed bundle | `0x...` |
| "Send me the technical specs" | The 19-file bundle zip + verifier script | `.zip` + `.sh` |
| "Send me your B-BBEE" | The certificate PDF | `.pdf` |
| "Send me your banking details" | Nedbank Startup Bundle one-pager (R0 fees, under R10m) | `.pdf` |
| "Come back next quarter" | "I'll be at Gate 3B by then — R50k MRR. The price goes up." | Verbal |

---

### THE 5 GATE-3C PROOFS YOU'VE DEMONSTRATED

1. **Determinism:** `fsm.replay(['INIT','CHAL','TOTP_OK'])` hits `STEADY_STATE_LOCKED` on both routes — replay determinism from Chapter 4.
2. **Trust:** Toggle logs `ROUTE_TOGGLE` with `ts` + `from` + `to` — that's your `KNOWLEDGE_SYNC_SUCCESS` fact.
3. **MOI:** Footer shows Reg `2026/259053/07` on both routes — company identity preserved.
4. **No partner needed:** All runs on laptop port 3000, no AMD node, no UCT, no cloud.
5. **Zero capital:** R0 spent. One person. One laptop. One DFA. Two lenses. Nineteen hashed files.

---

### IF THEY ASK "CAN YOU DEPLOY THIS TO OUR SITE?"

**You say:** "Yes. Three steps. One, I ship a physical node (R15k BOM). Two, I plug it into your DN300 flange (154.7Nm, SANS 1123 PN16). Three, your shift supervisor opens the URL and sees the same screen you just saw — but with your pipe network, your coordinates, your hashes. The WORM ledger is yours. I don't touch your data."

**Pricing:** R5k/month pilot (Gate 3A) → R50k MRR (Gate 3B) → R150k deployment (Gate 3C).

---

### WHAT YOU DON'T SAY

- Don't say "I'm a startup." Say "I'm a sovereign supplier."
- Don't say "I think." Say "The hash proves."
- Don't say "eventually." Say "Gate 3C is three nodes."
- Don't apologize for being broke. The R0 build IS the proof.

---

**End of Chapter 5 Lab.** This is the demo script for the VVU Master Textbook v0.3 FINAL. Hash is Proof.
