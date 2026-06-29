# VVU Gateway UI — Implementation Notes

## Recent Changes
- Marketing pages rewritten: `/`, `/about`, `/faqs`, `/ubuntu-pools`.
- Dashboard (`/dashboard`) expanded from placeholder into functional Village OS UI with real-time ANT metrics, Ubuntu Score Simulator, Pool Creator, Architecture Visualizer, and Lindiwe AI Console.
- Fixed middleware so marketing routes no longer require auth.
- Removed root-level `overflow: hidden` to restore scrolling on marketing pages.
- `src/app/globals.css` updated with both warm Ubuntu Pools tokens and dark VVU dashboard tokens.

## Phase Scope
### Phase 1 (current)
- Ubuntu Pools (marketing + core pool creation)
- ProofBridge (receipting + anchoring simulation)
- ANT Telemetry tickers + health indicators
- Gate-1 flow evaluation placeholder UI
- Agent Loop — conversational AI interface via Mistral with email response loop
  - `app/api/agent/converse/route.ts` — conversation API with thread persistence
  - `src/lib/agent/conversation-store.ts` — file-backed conversation store
  - Gateway OS "AGENT LOOP" view with chat UI
  - Email response delivery via Resend
  - Full conversation history with Mistral LLM context window

### Phase 2 (Q1 2027 overview — oncoming federal transition period)
- SAFEGRID
- SAFESTAKES
- Parallel Water Economy
- Ubuntu Pools + ProofBridge-Liner scaling
- Automated scaling gates and transition controls

## Deploy
- Build passes: `npm run build`
- Canonical branch: `compliance-fabric`
- Expected deploy target: `vercel --prod --force`
