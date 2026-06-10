# VVU Platform - Embedded Watchdog + Gate A Integration

A production-grade implementation of the VVU Platform featuring:
- Embedded Watchdog system for operational observability
- Gate A Authentication & Identity Infrastructure integration
- Pre-registered Gate B Contribution Rail Infrastructure hooks
- Schema v2.1 compliant

## Architecture Overview

This implementation combines systemic observability with a Next.js/Supabase auth stack, featuring:

### Core Components
1. **Watchdog System** (`src/lib/watchdog/`)
   - HeartbeatSchema: Operational tags, incident contracts, fault classification
   - HeartbeatBus: Distributed event bus using IndexedDB and BroadcastChannel
   - WatchdogProbes: Operational probe classes for direct error boundary instrumentation
   - OrchestratorEngine: Priority-sorted diagnostic engine running on eternal clock loop

2. **Gate A: Auth & Identity Infrastructure**
   - Remediated cookies() invocation in route handlers
   - Loop protection middleware with redirect counting
   - RLS compliance with explicit UUID type casting
   - Health monitoring with infrastructure degradation detection

3. **Gate B: Contribution Rail Infrastructure (Pre-Registered)**
   - Pre-registered fault tags for future integration
   - Stubbed E2E tests for zero-friction activation

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase CLI
- Playwright browsers (for E2E testing)

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Migrations
```bash
npx supabase db migrate
```

### Development
```bash
npm run dev
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Watchdog Usage

### Adding Observability to Components
As part of your development process, initialize components with an explicit tracking boundary:

```typescript
// Add this line to your constructors before writing business logic
private probe = new NullProbe();

// When you hit a production code checkpoint, replace the NullProbe 
// with the correct typed probe class from WatchdogProbes.ts
```

### Available Probes
- **Operational (P01-P06)**: Tab coordination, network sync, cache eviction, etc.
- **Gate A Infrastructure**: Cookie faults, middleware loops, RLS violations, etc.
- **Gate B Contribution Pipeline**: Payment webhook failures, ledger mismatches, etc.

## Gate B Integration Roadmap

Once Gate A pipeline is verified, Gate B integration can proceed with:

1. **Webhook Payload Structure** (see below)
2. **Ledger Reconciliation Engine** 
3. **FX Oracle Integration**
4. **Idempotency Key Management**

## License
MIT