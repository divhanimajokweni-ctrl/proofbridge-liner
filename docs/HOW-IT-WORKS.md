# How This Whole System Works — Explained Simply

> This guide assumes you know **nothing**. No jargon without a plain-English translation.
> If you read only one doc to understand VVU, read this one.
> Whenever a fancy word shows up, it's followed by "**(i.e. ...)**" in normal words.

---

## 1. The One-Sentence Version

**We built a machine that checks whether something is trustworthy, proves it with math and cryptography, and refuses to let money move if something looks wrong.**

That's it. Everything below is just *how* that machine is built and *why* each piece exists.

---

## 2. The Kitchen Analogy (read this first)

Imagine a restaurant kitchen that makes one dish: **"a trustworthy decision."**

- **The order comes in** — someone wants to do something (send money, register a house, join a savings group).
- **The head chef tastes everything** — a smart checker decides "this looks safe" or "this looks wrong."
- **Every step gets a receipt** — like a printed ticket that can never be faked, so later anyone can prove exactly what happened.
- **There's a big red emergency switch** — if something dangerous happens, the whole kitchen stops immediately. No more dishes go out until a human says it's fine.
- **A health inspector is always watching** — a background robot that constantly checks the kitchen is still running and shouts if anything breaks.

VVU is that kitchen, but for **trust and money** instead of food. Now let's name the real parts.

---

## 3. The Three Core Layers (the heart of everything)

The system is built in **three stacked layers**. The golden rule: **each layer does ONE job and never does another layer's job.** This is the most important design idea in the whole project.

Think of it like a **pen, a signature, and a contract**:

| Layer | Real name | What it is (plain English) | The pen/signature/contract analogy |
|-------|-----------|----------------------------|-------------------------------------|
| Bottom | **SafeKrypte** | A signing machine. You give it some data, it stamps it with an unforgeable cryptographic signature. It has **no idea** what it's signing and doesn't care. | The **pen**. It just makes ink marks. It doesn't know if you're signing a birthday card or a mortgage. |
| Middle | **SafeLiner** | Takes a raw signature and wraps it into a proper **credential (i.e. an official certificate)** — who issued it, who it's for, what type, and when. | The **signature** — a pen-stroke that now *means* "I, this person, agree to this, on this date." |
| Top | **ProofBridge** | The actual product. It uses the certificate to make real decisions: allow/deny, score risk, halt money. | The **contract** — the finished document that actually does something in the real world. |

**Why split it into three?** Because if you let one layer do everything, it becomes a tangled mess that nobody can trust or audit. Keeping them separate means:
- The pen (SafeKrypte) can be tested on its own.
- The signature (SafeLiner) can't secretly change how the pen works.
- The contract (ProofBridge) can't secretly forge signatures.

> **Cryptographic signature (i.e. a mathematical wax seal):** a bit of math that proves "this exact data came from this exact person and hasn't been changed." If even one letter changes, the seal breaks. VVU uses a type called **ED25519** — just a specific, fast, very secure recipe for these seals.

---

## 4. ProofBridge's "Gates" (A through F) — the checkpoints

ProofBridge (the top layer) is made of six **gates (i.e. checkpoints something must pass through)**. Picture airport security with six desks:

| Gate | Nickname | What it actually does |
|------|----------|-----------------------|
| **Gate A** | Front door / ID desk | **Logging in and identity.** Checks who you are, keeps the site healthy, limits how many requests one person can spam. **This is where the new Supabase login lives** (see Section 8). |
| **Gate B** | Money-in desk | **Webhooks (i.e. "a text message from the bank saying money moved").** When the payment provider tells us "a payment happened," this desk verifies the message is real and records it. |
| **Gate C** | Paperwork desk | **Compliance & legal reporting.** Auto-generates the reports South African regulators (FSCA, FICA, POPIA) require. |
| **Gate D** | Emergency switch desk | **The Circuit Breaker.** A program living on the blockchain that can freeze all money movement instantly. More on this in Section 6. |
| **Gate E** | Mail desk | **Emails.** Sends verified emails from our domain. |
| **Gate F** | Sealed-room desk | **Attestation (i.e. a tamper-proof "this ran in a safe, un-hacked environment" certificate).** |

To "pass" means every desk said yes. If any desk says no, you don't get through.

---

## 5. The Brain: the "Prover Pipeline" and Bayesian scoring

This is the smart part — the head chef tasting the dish.

When a decision needs to be made, it goes down an assembly line called the **Prover Pipeline**:

1. **Fetcher** — goes and grabs the evidence (i.e. the facts we need to look at).
2. **Validator** — checks the evidence isn't garbage or malformed.
3. **Scorer** — the brain. Gives it a **trust score** from 0 to 1.
4. **Submitter** — records the decision.
5. **Broadcaster** — tells everyone else the result.

### How the Scorer thinks (Bayesian, explained with a coin)

**Bayesian (i.e. updating your belief as new evidence arrives)** is just common sense written as math.

Imagine you find a coin. Is it fair? You don't know yet. You flip it:
- Heads, heads, heads, heads, heads... After many heads in a row, you start believing "this coin is rigged."
- Each flip **updates your belief**. That's Bayesian thinking.

VVU does the same with trust: every new piece of evidence nudges a **confidence number** up or down. When confidence crosses a line, it outputs:
- **SAFE** — go ahead.
- **TRIP** — stop, something's wrong.

The specific math recipe is called a **Beta-Binomial posterior** — don't worry about the name; it's just "the coin-flipping belief updater" tuned with a risk dial called **γ (gamma)**. A stricter γ means "be more suspicious."

It also sorts problems into three buckets:
- **A – Transient** (i.e. a hiccup, like bad wifi) → just retry.
- **B – Adversarial** (i.e. someone's actually attacking) → escalate, sound the alarm.
- **C – Infrastructure failure** (i.e. something's broken on our side) → page a human.

---

## 6. The Circuit Breaker (Gate D) — the big red button

A **circuit breaker** in your house cuts the power when there's a dangerous electrical surge, so your house doesn't burn down. VVU has the same thing for money.

- It's a **smart contract (i.e. a small program that lives on a blockchain and can't be secretly changed)** running on **Polygon** (a blockchain — think "a public ledger that everyone can see and nobody can quietly edit").
- When the brain says **TRIP**, the circuit breaker **flips open** and all money transfers halt.
- While it's tripped, the system returns an error (HTTP 423, which literally means "Locked") instead of moving money.
- It only resumes when inputs are verified safe again.

**Why on a blockchain?** So that *nobody* — not even us — can quietly cheat and move money while the safety switch is supposed to be on. The switch is public and tamper-proof.

---

## 7. The Watchdog and LINDIWE (the always-on helpers)

### Embedded Watchdog — the health inspector
A background system (**HeartbeatBus, WatchdogProbes**) that constantly asks every part "are you still alive?" If something goes quiet or breaks, it classifies the fault and files an incident report. It's the smoke detector of the system.

### LINDIWE — the AI project manager
LINDIWE is the AI orchestration layer (i.e. the system that coordinates AI helpers to build and check the software). It enforces a strict recipe so no sloppy code ships. That recipe has **5 roles** that must happen in order:

1. **Investigator** — writes down the facts of the current code (no opinions).
2. **Planner** — writes a plan of what to change.
3. **Mino Reviewer** — the founder (you) approves or rejects the plan.
4. **Implementer** — writes the code, exactly to the approved plan.
5. **Validator** — checks it works, and is *not allowed* to be the same person who wrote it (so nobody grades their own homework).

These produce three files every time: `INVESTIGATION.md`, `PLAN.md`, `VALIDATION.md`. This is called **SDD (Spec-Driven Development — i.e. "decide exactly what you're building and get it approved before writing a single line").**

---

## 8. The Login System (the part we just built)

### What login is doing
When someone visits the site, we need to know: **are they a signed-in user, or a stranger?** Some pages (like `/dashboard`) should only be visible to signed-in users.

### What we use: Supabase
**Supabase (i.e. a ready-made "user accounts + database" service)** handles storing users, passwords (safely scrambled), and sessions. We chose it because it needs **no special DNS setup** and was already wired into the project.

> We previously tried **Clerk** (another login service), but its live key was locked to a web address (`clerk.venturevisionubuntu.co.za`) that **had no DNS records** — meaning that address didn't exist on the internet, so Clerk's login box never loaded. Supabase avoids that problem entirely.

### The pieces we added (in plain terms)

| File | What it does |
|------|--------------|
| `app/login/page.tsx` | The login screen — type email + password to **sign in** or **create an account**. |
| `src/lib/session/client.ts` | Talks to Supabase from the user's **browser**. |
| `src/lib/session/server.ts` | Talks to Supabase from **our server** (remembers you via a cookie). |
| `middleware.ts` | The **bouncer**. Runs on every request. If a stranger tries to open `/dashboard` or `/safekrypte`, it sends them to `/login` first. |
| `app/session/callback/route.ts` | Handles the "click the link in your confirmation email" step. |
| `app/session/signout/route.ts` | The **Sign out** button's handler — clears your session. |
| `app/AuthControl.tsx` | The little control top-right of the homepage: shows **"Sign in"** if you're a stranger, or **your email + "Sign out"** if you're logged in. |

### The one setting you need to decide: "Confirm email"
Supabase can be set two ways:
- **Confirm email ON (current setting):** After signing up, a person must click a link emailed to them before they can log in. Safer, but adds a step.
- **Confirm email OFF:** Sign up → instantly logged in. Smoother, less friction.

You change this in the Supabase dashboard: **Authentication → Providers → Email → Confirm email**. Our code handles both cases correctly.

> **Cookie (i.e. a small note the website leaves in your browser):** it's how the site remembers you're logged in as you click around, so you don't have to type your password on every page.

> **`NEXT_PUBLIC_` prefix (i.e. "this value is safe to show in the browser"):** the Supabase URL and the "anon key" are *designed* to be public — they ship inside the web page. The truly secret keys (service role, JWT secret) never leave the server. These public values are already stored in Vercel Production.

---

## 9. Tenant Isolation — how multiple clients stay separated

### The problem

When more than one client (e.g. a savings group, a company, a regulator) uses the same ProofBridge system, their data **must never mix**. Tenant A's evidence, secrets, and audit trail must be completely invisible to Tenant B — even if someone makes a coding mistake.

### What we built: "Port-Based Isolation" (lightweight version)

Think of it like **apartments in a building**. Everyone shares the same kitchen (the server), but each apartment has its own locked room (tenant ID). You can't walk into someone else's room even if you're in the same building.

| Component | What it does (plain English) | File |
|-----------|------------------------------|------|
| **TenantContext** | An ID card that says "this request belongs to Client X." Carried on every operation like a stamp. | `src/lib/tenant/context.ts` |
| **TenantRegistry** | The reception desk — stores which clients exist, their tier (starter/professional/enterprise), and jurisdiction. | `src/lib/tenant/registry.ts` |
| **SecretProvider** | Each client's secret keys are stored separately. Client A's API key is never visible to Client B. | `src/lib/tenant/secrets.ts` |
| **Tenant-Scoped Ledger** | Each client's evidence events live in their own room. Client A's events have their own sequence numbers — Client B can't even count them. | `src/lib/tenant/ledger.ts` |
| **Tenant Audit Logger** | Every action is recorded with the client's ID. You can query "what did Client A do?" but never "show me Client B's audit trail." | `src/lib/tenant/audit.ts` |

### How it flows through the system

```
User logs in (Supabase)
        │
        ▼
Middleware extracts tenant info from user metadata
        │
        ▼
Sets x-vvu-tenant-id, x-vvu-tenant-tier, x-vvu-tenant-jurisdiction headers
        │
        ▼
Route handlers read tenant from headers → pass to TenantContext
        │
        ▼
All events, receipts, and audit entries carry tenant_id
        │
        ▼
Each tenant's data is stored in its own isolated space
```

### What the tests verify (27 automated checks)

- Tenant A's secrets are never visible to Tenant B
- Tenant A's ledger events are invisible to Tenant B (separate sequence numbers)
- The system throws an `ISOLATION_VIOLATION` error if someone tries to cross tenants
- Audit entries are scoped per-tenant (you can't query another tenant's logs)
- The Tenant Registry enforces unique client IDs

> **Tenant (i.e. a client or organization):** in VVU's world, a tenant is a savings group, a company, or a regulatory body that uses ProofBridge. Each tenant's data is isolated from every other tenant.

---

## 9. The Tech Stack (what tools we're built on)

| Tool | What it is, simply |
|------|--------------------|
| **Next.js** | The website framework (i.e. the toolkit for building the pages and the server behind them). It's what turns our code into the actual website. |
| **Vercel** | The hosting company (i.e. the place on the internet where the website actually lives and runs). When we "deploy," we're sending the site to Vercel. |
| **Supabase** | User accounts + database (see Section 8). |
| **Polygon** | The blockchain where the Circuit Breaker smart contract lives. |
| **TypeScript** | The programming language — like JavaScript but with a spell-checker for code that catches mistakes before they ship. |
| **Foundry** | The toolkit for building/testing the blockchain smart contracts. |

---

## 10. How Code Ships to the Live Site — "ART OF CHOKE"

Before any change reaches the real website, it must survive a **13-step gauntlet** called the **Deployment Lock Loop**, nicknamed **ART OF CHOKE**. The motto: *"Nothing ships until the ENTIRE pipeline passes. No exceptions."*

Think of it as **13 locked doors in a row** — you can't open door 5 until doors 1–4 are open, and if *any* door slams shut, you start over from door 1.

The doors, in order (simplified):
1. **Commit check** — did you actually save your work, and are the critical files present?
2. **Typecheck** — does the code have any type mistakes? (`tsc`)
3. **Lint** — is the code tidy and following the rules? (`npm run lint`)
4. **Tests** — do the automated tests pass? (`npm test`)
5. **Build** — does the site actually build? (`npm run build`)
6. **Behavioral coverage** — do the 5 real end-to-end flows work?
7. **Vercel deploy** — build it for real on the hosting platform.
8. **Push** — send the code to GitHub.
9. **DNS check** — does the domain still resolve (i.e. does the web address still point somewhere)?
10. **Health check** — does the live site answer "I'm OK" (HTTP 200)?
11. **Logs** — record the deployment.
12. **Docs checklist** — regenerate the checklist.
13. **Final push** — save the paperwork from steps 11–12.

**Important:** this runs automatically only when pushing to the **`compliance-fabric`** branch (the "real production" branch). Because step 7 does a **real production deploy**, you don't run this casually — you run it when you truly intend to ship.

> **Branch (i.e. a parallel copy of the code):** we do work on a side copy (a "feature branch") so the live site isn't affected. When we're happy, we **merge** that copy into `compliance-fabric`, which triggers the real deploy.

---

## 11. The Big Picture Flow (start to finish)

```
A person does something (web / WhatsApp / API)
        │
        ▼
The request hits ProofBridge
        │
        ▼
The Brain (Prover Pipeline) scores it:  SAFE  or  TRIP
        │
   ┌────┴─────┐
   ▼          ▼
 SAFE        TRIP
   │          │
   │          ▼
   │   Circuit Breaker flips → all money frozen → humans notified
   │
   ▼
SafeKrypte signs a receipt  →  SafeLiner wraps it as a credential
   │
   ▼
Receipt saved to a permanent, un-editable audit trail
   │
   ▼
Money moves (e.g. Ubuntu Pools savings contribution) — with proof attached
```

And the whole time, the **Watchdog** is checking everyone's pulse, and **LINDIWE** made sure the code that runs all this was planned, approved, built, and validated properly.

---

## 12. Mini-Glossary (all the scary words in one place)

- **Cryptographic signature** — a math "wax seal" proving data came from someone and wasn't changed.
- **ED25519** — the specific signature recipe VVU uses (fast + secure).
- **Credential** — an official digital certificate (who, for whom, what, when).
- **Gate** — a checkpoint that must say "yes" to proceed.
- **Webhook** — an automatic message from another service (e.g. the bank) telling us something happened.
- **Bayesian** — updating your belief as new evidence arrives (coin-flip logic).
- **Beta-Binomial posterior** — the exact math for that belief-updating.
- **γ (gamma)** — the strictness dial for how suspicious to be.
- **Smart contract** — a small tamper-proof program living on a blockchain.
- **Blockchain / Polygon** — a public ledger nobody can secretly edit; Polygon is the one we use.
- **Circuit Breaker** — the emergency switch that freezes money on danger.
- **Attestation** — a certificate that code ran in a safe, un-hacked environment.
- **Supabase** — ready-made user accounts + database service (our login).
- **Middleware** — the "bouncer" code that runs on every request to check permissions.
- **Cookie** — a small note in your browser that remembers you're logged in.
- **Session** — the state of "you are currently logged in."
- **Next.js** — the website framework.
- **Vercel** — where the website is hosted / lives online.
- **Deploy** — push the site live to the internet.
- **Branch** — a parallel copy of the code; `compliance-fabric` is the real/production one.
- **Merge** — combine a side copy back into the main copy.
- **ART OF CHOKE** — the 13-step "everything must pass" shipping pipeline.
- **SDD** — decide + get approval on exactly what you're building before coding.
- **LINDIWE** — the AI orchestration layer that enforces the 5-role build process.

---

*If any part of this still feels fuzzy, that's a doc bug, not a you problem — ask and we'll make this section clearer.*
