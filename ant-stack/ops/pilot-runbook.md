# Pilot Runbook — Ant Stack + Ubuntu Pools
## Gqeberha, Eastern Cape | June 2026

### 1. Pre-Pilot Checklist

- [ ] Docker Compose running (server, redis, postgres)
- [ ] Nginx configured (reverse proxy + WebSocket)
- [ ] SSL/TLS certificates installed
- [ ] Monitoring stack active (Prometheus + Grafana)
- [ ] Backup strategy tested
- [ ] Incident response contacts notified

### 2. Onboarding Flow

1. Pool Facilitator creates match
2. Members join via Stitch (R50 stake)
3. Match starts (3-6 colony players + 1 anteater)
4. 7-round gameplay
5. Match ends → payouts distributed
6. Trust factors updated
7. Audit log generated

### 3. Success Criteria

- [ ] 3 matches completed
- [ ] R0 disputed payouts
- [ ] 100% uptime during pilot
- [ ] 3+ member testimonials

### 4. Rollback Plan

```bash
docker-compose down
docker-compose exec postgres psql -U antstack antstack < backup.sql
docker-compose up -d
```

### 5. Incident Response

| Severity | Response | Time |
|----------|----------|------|
| Critical | Rollback + notify | 5 min |
| High | Investigate + hotfix | 15 min |
| Medium | Log + fix next day | 1 hour |
| Low | Schedule fix | 1 day |
