# VVU-IVE: Quick Deployment Guide for ProofBridge-Liner

## What You Have

### Project 1: ProofBridge-Liner (Base Stack)
- **Type:** Trust infrastructure monorepo (Turbo + Next.js + Turbo)
- **Role:** Authorization engine, trust runtime, proof verification
- **Location:** `/home/claude/proofbridge-liner`
- **Status:** Fully built, production-ready (IVE RC1)

### Project 2: VVU-IVE (Implementation)
- **Type:** Next.js microservice + EIS backend
- **Role:** Instantiates Theorems 1-5; provides evidence-bound authorization
- **Location:** `/home/claude/vvu-ive-src`
- **Status:** Complete, ready to plug into ProofBridge

---

## What Each Project Does

```
┌─────────────────────────────────────────────────────────────┐
│                    ProofBridge-Liner                         │
│                                                               │
│  Trust Sphere • Proof Graph • Evidence Runtime • Watchdog   │
│  + SafeGrid • SafeStacks • Circuit Breaker • Ubuntu Pools    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         VVU-IVE (Theorem 1-5 Implementation)           │  │
│  │                                                        │  │
│  │  ├─ Authorization: A = C ∧ E ∧ I ∧ S ∧ R (Th. 1)    │  │
│  │  ├─ N_ind Recovery: latent source counting (Th. 2)   │  │
│  │  ├─ Heat Kernel: evidence diffusion (Th. 3)          │  │
│  │  ├─ State Lattice: claim-state computation (Th. 4)   │  │
│  │  └─ Circuit Breaker: fail-closed (Th. 5)             │  │
│  │                                                        │  │
│  │  API: /api/authorize, /api/n-ind, /api/heat-kernel    │  │
│  │  UI: 7 visualization panels                           │  │
│  │  DB: Claims, Evidence, Authorizations, N_ind, Events  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Option A: Monorepo Integration (Recommended)

**Step 1: Copy VVU-IVE into ProofBridge**

```bash
cd /home/claude/proofbridge-liner

# Create apps directory if needed
mkdir -p apps/ive

# Copy source
cp -r /home/claude/vvu-ive-src/* apps/ive/

# Update Turbo workspace
cat >> turbo.json << 'EOF'
{
  "tasks": {
    "ive#dev": {
      "cache": false,
      "outputs": []
    },
    "ive#build": {
      "outputs": [".next/**"]
    }
  }
}
EOF
```

**Step 2: Install dependencies**

```bash
cd apps/ive
bun install
```

**Step 3: Configure environment**

```bash
cat > apps/ive/.env.local << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/vvu_ive"
NEXTAUTH_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3001"
EOF
```

**Step 4: Set up database**

```bash
cd apps/ive
bun run prisma migrate dev --name init
bun run prisma db seed  # Optional: load test data
```

**Step 5: Run together**

```bash
# Terminal 1: ProofBridge main
cd proofbridge-liner
bun run dev

# Terminal 2: VVU-IVE
cd proofbridge-liner/apps/ive
bun run dev

# IVE now at http://localhost:3001
# ProofBridge at http://localhost:3000
```

### Option B: Standalone Microservice

**Step 1: Deploy as separate service**

```bash
cd /home/claude/vvu-ive-src

# Copy to deployment location
cp -r . /opt/vvu-ive/

cd /opt/vvu-ive
bun install
```

**Step 2: Configure as external service**

```bash
# In ProofBridge env config:
export IVE_SERVICE_URL="http://localhost:3001"

# ProofBridge calls:
curl http://localhost:3001/api/authorize \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"claimId": "...", "safetyOverride": true}'
```

**Step 3: Run in Docker**

```dockerfile
# apps/ive/Dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY . .
RUN bun install
EXPOSE 3001
CMD ["bun", "run", "dev"]
```

```bash
# Build and run
docker build -t vvu-ive:latest apps/ive/
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  vvu-ive:latest
```

### Option C: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vvu-ive
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: ive
        image: vvu-ive:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ive-db-secret
              key: url
        livenessProbe:
          httpGet:
            path: /api/state
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: vvu-ive-svc
spec:
  ports:
  - port: 3001
    targetPort: 3001
  selector:
    app: vvu-ive
```

---

## Integration Points

### ProofBridge → IVE (Inbound)

**Authorization Queries**
```bash
POST /api/authorize
Body: {
  "claimId": "claim-123",
  "safetyOverride": true,
  "reviewSignedOff": true
}
Response: {
  "authorized": true,
  "claimOk": true,
  "evidenceOk": true,
  "integrityOk": true,
  "safetyOk": true,
  "reviewOk": true,
  "reason": "..."
}
```

**State Queries**
```bash
GET /api/state?claimId=claim-123
Response: {
  "claim": { ... },
  "evidence": [ ... ],
  "authorization": { ... },
  "nInd": { ... },
  "circuitBreaker": { ... }
}
```

**N_ind Computation**
```bash
POST /api/n-ind
Body: {
  "embeddings": [[...], [...], [...]]
}
Response: {
  "nInd": 2.1,
  "numSources": 2,
  "gamma": 0.5
}
```

### IVE → ProofBridge (Outbound)

**Circuit Breaker Notifications**
```bash
ProofBridge subscribes to /api/events/breaker
Receives:
{
  "claimId": "claim-123",
  "triggered": true,
  "reason": "stale_evidence",
  "action": "SAFE_SHUTDOWN"
}
```

**Authorization Updates**
```bash
ProofBridge listens to claim state changes
When A = 0 (authorization lost), triggers:
- Safe degradation
- Resource release
- Incident logging
```

---

## Theorems at a Glance

### Theorem 1: Evidence-Bound Principle
**Code:** `src/lib/eis/authorization.ts`  
**Formula:** $A = C \land E \land I \land S \land R$

```typescript
const authorized = claimOk && evidenceOk && integrityOk && safetyOk && reviewOk;
```

### Theorem 2: Participation Ratio
**Code:** `src/lib/eis/participation-ratio.ts`  
**Formula:** $N_{\text{ind}} = \frac{(\sum \lambda_i)^2}{\sum \lambda_i^2}$

```typescript
const nInd = (sumLambda * sumLambda) / sumLambdaSq;
```

### Theorem 3: Heat Kernel
**Code:** `src/lib/eis/heat-kernel.ts`  
**Formula:** $u_t = -\kappa L u$

```typescript
u = u.map((ui, i) => ui - kappa * dt * L[i] · u);
```

### Theorem 4: System Closure
**Code:** `src/lib/eis/state-lattice.ts`  
**Property:** No layer can be bypassed; all feedback flows through IVE

### Theorem 5: Fail-Closed
**Code:** `src/lib/eis/circuit-breaker.ts`  
**Property:** Loss of E → loss of A → breaker trips

---

## Testing the Integration

### 1. Unit Test Each Theorem

```bash
bun test src/lib/eis/__tests__/
```

### 2. Integration Test Full Flow

```bash
# Create synthetic claim + evidence
POST /api/seed?scenario=basic

# Compute N_ind
POST /api/n-ind < embeddings

# Authorize
POST /api/authorize?claimId=...

# Verify authorization result
GET /api/state?claimId=...
```

### 3. Reverification Loop Test

```bash
# 1. Authorize claim
POST /api/authorize?claimId=claim-123
→ Response: {"authorized": true}

# 2. Wait for stale timeout (default: 24h)
# OR manually update evidence:
POST /api/evidence?claimId=claim-123&action=add

# 3. Check if claim re-verifies
GET /api/state?claimId=claim-123
→ Watch claim state & authorization update
```

### 4. Circuit Breaker Test

```bash
# Create claim with safety_critical: true
POST /api/claims
Body: { "safetyCritical": true }

# Authorize with safety override
POST /api/authorize?safetyOverride=true

# Withdraw safety clearance (simulated)
POST /api/claims/[id]?action=clear_safety

# Watch circuit breaker trip
GET /api/state?claimId=...
→ Check: circuitBreaker.triggered === true
```

---

## Files to Integrate into ProofBridge

### Backend (EIS Library)
```
src/lib/eis/
├── types.ts                    # Type definitions
├── authorization.ts            # Theorem 1
├── participation-ratio.ts       # Theorem 2
├── heat-kernel.ts              # Theorem 3
├── state-lattice.ts            # Theorem 4
├── circuit-breaker.ts          # Theorem 5
├── evidence-mesh.ts            # Evidence Mesh adapters
└── index.ts                    # Barrel exports
```

### API Endpoints
```
src/app/api/
├── authorize/route.ts          # POST /api/authorize
├── n-ind/route.ts              # POST /api/n-ind
├── heat-kernel/route.ts        # POST /api/heat-kernel
├── state/route.ts              # GET /api/state
├── verify/route.ts             # POST /api/verify
├── claims/route.ts             # CRUD endpoints
├── evidence/route.ts           # Evidence endpoints
└── seed/route.ts               # Demo data
```

### UI Components
```
src/components/ive/
├── authorization-panel.tsx     # A = C∧E∧I∧S∧R breakdown
├── participation-ratio-panel.tsx
├── heat-kernel-panel.tsx
├── circuit-breaker-panel.tsx
├── evidence-mesh-panel.tsx
├── state-lattice.tsx
└── state-badge.tsx
```

### Database Schema
```
prisma/schema.prisma
├── Claim
├── EvidenceItem
├── AuthorizationRecord
├── NIndComputation
└── CircuitBreakerRecord
```

---

## Verification Checklist

- [ ] VVU-IVE source extracted and copied into ProofBridge
- [ ] Dependencies installed (`bun install`)
- [ ] Database migrations run (`prisma migrate dev`)
- [ ] Environment configured (`.env.local`)
- [ ] Backend tests pass (`bun test`)
- [ ] API endpoints verify (curl /api/authorize)
- [ ] UI panels render (check http://localhost:3001)
- [ ] Circuit breaker responds to state changes
- [ ] Authorization formula working (A = C∧E∧I∧S∧R)
- [ ] N_ind computation stable (test monotonicity)
- [ ] Heat kernel diffusion correct (retention ≈ 0.904)
- [ ] ProofBridge → IVE integration active
- [ ] IVE → ProofBridge event subscription working

---

## Troubleshooting

### Issue: Postgres connection fails
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Verify postgres is running
psql -U user -c "SELECT 1"

# Create database if needed
createdb vvu_ive
```

### Issue: API returns 404
```bash
# Check if IVE service is running
curl http://localhost:3001/api/state
# Should return claim list (empty if no seed data)

# If 404, ensure server started
bun run dev
```

### Issue: N_ind computation hangs
```bash
# Embeddings might be too large or degenerate
# Check:
# - Embedding dimension (should be ~20)
# - Number of embeddings (should be < 1000)
# - No NaN or Infinity in embeddings
```

### Issue: Circuit breaker won't trip
```bash
# Verify breaker conditions in circuit-breaker.ts
# - Evidence count decreased to 0?
# - Claim state fell to FALSIFIED/STALE/UNTESTED?
# - N_ind dropped below threshold?
# - Evidence older than staleness window?

# Manually trigger for testing:
POST /api/claims/[id]?action=trigger_breaker
```

---

## Success Criteria

When VVU-IVE is successfully integrated into ProofBridge:

1. ✓ All 5 theorems are instantiated in production code
2. ✓ Authorization decisions flow through IVE API
3. ✓ Evidence state updates trigger re-verification
4. ✓ Circuit breaker trips on drift (fail-closed)
5. ✓ N_ind recovers source count monotonically
6. ✓ Heat kernel smooths evidence weights correctly
7. ✓ UI panels visualize all states in real-time
8. ✓ Database persists all authorization history
9. ✓ ProofBridge and IVE communicate bidirectionally
10. ✓ System passes full integration tests

---

## Next Steps

1. **Deploy:** Run Option A (monorepo) or Option B (microservice)
2. **Test:** Run integration tests and verify all 5 theorems
3. **Integrate:** Wire ProofBridge → IVE API calls
4. **Monitor:** Watch circuit breaker and authorization logs
5. **Extend:** Add custom Evidence Mesh adapters (You.com, Brave, etc.)
6. **Scale:** Deploy to Kubernetes with 3+ replicas

Ready to build! 🚀
