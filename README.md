# ProofBridge-Liner

Production-grade deterministic verification and compliance runtime for the VVU ecosystem.

ProofBridge-Liner is the execution and evidence layer that transforms state transitions into cryptographically verifiable receipts, enabling replayability, auditability, and compliance across Ubuntu Pools and future financial infrastructure.

## Current Status

**Phase:** Production Hardening

Core architectural foundations are in place and the project is transitioning from a functional prototype toward a production-grade deterministic runtime.

Current focus:

- Compliance Fabric completion
- Transition Receipt stability
- Circuit Breaker enforcement
- Distributed trace continuity
- Immutable evidence generation
- End-to-end deterministic replay
- Ubuntu Pools production readiness

## North Star

The primary objective remains unchanged:

> Ubuntu Pools operating with real members, real money, and real contribution cycles.

Everything else in the repository exists to make that event cryptographically provable, operationally observable, and independently auditable.

## Core Architecture

```text
                 User Action
                      │
                      ▼
             State Transition Request
                      │
                      ▼
              Deterministic Evaluation
                      │
                      ▼
                Compliance Fabric
                      │
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
     Transition Receipt      Circuit Breaker
          │                        │
          └───────────┬────────────┘
                      │
                      ▼
             Cryptographic Evidence
                      │
                      ▼
              Immutable Audit Trail
                      │
                      ▼
                 Ubuntu Pools
```

## Major Components

- ProofBridge
- Compliance Fabric
- Transition Receipts
- Circuit Breaker Layer
- Embedded Watchdog
- Gate A Infrastructure
- Gate B Infrastructure

## Production Readiness

Current production capabilities include deterministic canonicalization, payload hashing, cryptographic signatures, telemetry validation, compliance token generation, watchdog infrastructure, Gate A authentication infrastructure, Gate B registration hooks, and schema v2.1 compatibility.

Development:

```bash
npm install
npm run dev
npm test
npm run test:e2e
```

Database:

```bash
npx supabase db migrate
```
