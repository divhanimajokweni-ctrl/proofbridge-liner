# ProofBridge Liner — Repository Scope Standard

**Status:** Normative repository instruction
**Applies to:** Every human, coding agent, reviewer, contractor, deployment runner, and automation interacting with this repository.
**Owner:** Venture Vision Ubuntu / Divhani Majokweni

## 1. Product boundary

The production product is the existing **VVU Integrated Verification Environment (IVE)** in this repository.

The public VVU website is the entry surface. `app/workspace/page.tsx` is the authenticated workspace entry. It renders the existing `Workspace` component and therefore the existing IVE UI is the production baseline.

### Required user journey

```text
PUBLIC VVU WEBSITE
    ↓ Launch / Enter Workspace
AUTHENTICATED PRODUCTION IVE
    ↓
SAME PRODUCTION IVE + EMPTY USER STATE
    ↓
USER CREATES FIRST ARTIFACT
    ↓
SAME PRODUCTION IVE + USER DATA
```

A new user must **not** receive a different application, replacement dashboard, blank-canvas clone, or reconstructed IVE.

## 2. Preserve production

Do not rewrite, replace, fork, duplicate, or visually redesign the production IVE to implement user isolation.

Preserve:

- boot sequence
- production `Workspace`
- panel router and panels
- evidence interfaces
- proof graph / lattice interfaces
- reports and artifacts interfaces
- command system
- navigation
- visual language
- existing interactions
- frozen/system evidence and submission artifacts

User isolation is a **data-state boundary**, not a UI replacement.

## 3. User isolation rule

Clerk is the identity authority.

For every user-owned read or write:

1. obtain the authenticated Clerk identity on the server;
2. derive ownership from that identity;
3. query/write only records owned by that identity;
4. never trust a browser-supplied `userId` as the ownership authority.

A user must never see another user's workspace artifacts.

## 4. Empty-state rule

A new authenticated user sees the production IVE with no user-owned workspace artifacts.

The empty state may be an overlay, hint, panel state, or other minimal addition using the existing IVE visual language. It must not become a second application.

Once the user creates the first artifact, the empty-state gate disappears and the same production IVE remains in place.

## 5. Frozen/system data versus user data

Frozen submission evidence and system-level IVE data are not automatically user-owned data.

Do not mutate or delete frozen evidence merely to initialize a user workspace.

Keep this conceptual separation:

```text
FROZEN / SYSTEM IVE BASELINE
            +
AUTHENTICATED USER WORKSPACE STATE
            =
PRODUCTION IVE EXPERIENCE
```

## 6. Scope boundary

This task is limited to:

- authenticated user isolation;
- production IVE empty-user state;
- first user artifact initialization;
- persistence of user-owned workspace state;
- preservation of the existing production IVE;
- verification of two-user isolation;
- verification that the public CTA enters the production workspace;
- repository documentation that prevents future scope drift.

Do **not** expand this task into:

- redesigning the IVE;
- replacing the IVE with a new dashboard;
- implementing unrelated commercial strategy;
- implementing legal contracts;
- implementing the full VVU commercial dossier;
- rewriting mathematical specifications;
- changing the frozen hackathon evidence package;
- unrelated dependency upgrades;
- unrelated infrastructure work.

## 7. Founder/CEO operating boundary

The owner is **not an engineer** and is not expected to perform engineering operations.

Do not make the owner:

- run terminal commands;
- inspect source files manually;
- diagnose TypeScript/Prisma/Next.js errors;
- configure deployment environments;
- copy environment variables;
- perform database migrations manually;
- debug Vercel builds;
- resolve dependency conflicts;
- answer implementation questions that can be resolved from the repository, deployment configuration, documentation, or normal engineering investigation.

Agents and engineers are expected to investigate and resolve technical blockers themselves. Escalate only a genuine product, legal, security, or business decision that cannot be resolved from authoritative project information.

## 8. Environment and deployment boundary

The canonical source repository is:

`https://github.com/divhanimajokweni-ctrl/proofbridge-liner`

GitHub owner:

`divhanimajokweni-ctrl`

The production deployment platform is Vercel. Environment secrets must remain in the configured deployment environment or ignored local environment files. Never commit secrets.

When deployment configuration is required, inspect the existing Vercel/Git configuration first. Do not ask the owner to supply secrets that should already exist in the deployment environment.

## 9. Engineering decision rule

**Audit first. Preserve production. Implement minimally. Verify behavior.**

Before inventing a model, component, endpoint, or architecture:

1. search the repository;
2. inspect the existing implementation;
3. reuse existing production primitives where possible;
4. make the smallest change that satisfies the scope;
5. verify the behavior against the actual deployment/build.

Never assume that a familiar architecture (`Claim`, `/api/claims`, `BlankCanvasWorkspace`, `IveRoot`, etc.) exists without repository evidence.

## 10. Completion criteria

The task is complete only when all are true:

- public VVU CTA reaches the authenticated production workspace;
- production IVE UI remains the primary interface;
- a new authenticated user has no user-owned artifacts;
- the new user sees an empty-state indication inside the production IVE experience;
- the user can create the first artifact without leaving the production IVE;
- the same production IVE remains after creation;
- the user's artifact persists;
- a second user cannot see the first user's artifacts;
- no browser-supplied identity can bypass ownership filtering;
- frozen/system IVE artifacts remain intact;
- no unrelated product scope has been changed.

## 11. Mandatory reporting

Every implementation must report:

- **Implemented:** exactly what changed;
- **Verified:** what was actually tested;
- **Preserved:** what production behavior was deliberately left untouched;
- **Blocked:** any remaining blocker and why it cannot be resolved without a product/business decision.

Do not return a technical task list to the owner as the primary deliverable. Return the result.
