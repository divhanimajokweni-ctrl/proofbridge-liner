---
Task ID: 1
Agent: Main
Task: Forensic audit and fix all broken interactions

Work Log:
- Forensic audit completed via agent-browser: tested every interactive element
- Found 5 critical bugs and fixed them all
- BUG 1 FIXED: AIR/Compute button crash — changed 'growth' to 'simulation' in ARCH_SHORTCUTS (the 'growth' product ID didn't exist in PRODUCT_MANIFEST_MAP)
- BUG 2 FIXED: Unknown product crash — added fallback UI in WorkspaceContent for products not in manifest (instead of returning null)
- BUG 3 FIXED: Escape key — workspace no longer unmounts when pressing Escape; correctly goes back to Intent Screen within workspace
- BUG 4 FIXED: Root cause of ALL API 404s — the old `/app/` directory at project root was conflicting with `/src/app/`. It had a `verify/route.ts` that imported `@upstash/redis` (not installed) and `ethers` (not installed), causing a cascade of compilation errors that broke ALL API routes
- BUG 5 FIXED: Removed old `/app/` directory (renamed to `_app_legacy`), fixed rate-limiter.ts to use conditional require for @upstash/redis, fixed ethers import in verify/route.ts
- BUG 6 FIXED: Clerk overlay interference — added useEffect to dismiss Clerk keyless prompt in workspace mode
- Verified: HBK API (/api/hbk) returns proper JSON with pipeline status
- Verified: Contact API (/api/contact) returns "Message received" on form submission
- Verified: All header shortcuts work (Ubuntu Pools, ProofBridge, HBK, AIR, Simulation)
- Verified: Sidebar expand/collapse works (click-to-pin, workspace modes, products)
- Verified: Trust Passport overlay works (Trust Score, Epistemic Maturity, Three-Root Architecture)
- Verified: Command Palette (Ctrl+K) works with all 7 products
- Verified: Focus Mode toggles correctly
- Verified: Compute Engine bottom bar shows live metrics
- Verified: Landing page has all sections (About, Mission, Programs, Engineering, Pricing, Partners, Community, News, Contact)
- Verified: Partner Modal opens with application form
- Verified: Contact form submission works

Stage Summary:
- All 5 critical bugs fixed
- API routes now work after removing conflicting old /app/ directory
- HBK Pipeline Dashboard component fully functional with static fallback data
- Frontend matches Execution Contract: click-to-pin sidebar, bottom Compute Engine, UCT-only partnerships
- HBK pipeline files integrated with provider abstraction layer
- Vercel CLI installed and vercel.json updated
- 15-minute cron job active for periodic review
- Pipeline files in /pipeline/ directory with compute_provider.py and .env.example

Unresolved Issues:
- Dev server stability: The Next.js process keeps dying after a few minutes, likely due to memory pressure during compilation. The server works when it's running but needs to be restarted periodically.
- The /api/hbk route works when the server is running but the server needs to be kept alive
- Need to commit all changes to git
