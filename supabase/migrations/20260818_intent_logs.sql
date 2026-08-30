-- ─────────────────────────────────────────────────────────────────────────
-- VVU·SEARM Telemetry — Intent Logs
-- Migration: 20260818_intent_logs.sql
--
-- Records every ALLOW / DENY flag fired by the Intent Worker through
-- the Epistemic Hazard Wall. The dashboard's Evolution Matrix
-- Ghost Buffer consumes this stream to achieve the 0ms latency
-- standard — when an ALLOW is recorded, the matrix pre-renders the
-- predicted stage immediately, before the next /api/theorem-state
-- poll (5s cadence) catches up.
--
-- Table: vvu_intent_logs
--   - id              bigserial PK
--   - session_id      text         — operator session
--   - decision        text         — 'ALLOW' | 'DENY'
--   - predicted_stage smallint    — 0..3 (sphere/antone/web/miles)
--   - score           real         — operator-confidence 0..1
--   - reason          text         — DENY reason (NULL when ALLOW)
--   - breaker_tripped boolean     — was the breaker tripped at decision time
--   - studi_verdict   text         — UNKNOWN | INCONCLUSIVE | PROVEN
--   - ive_verdict     text         — UNKNOWN | INCONCLUSIVE | PROVEN
--   - confidence_bp   smallint     — basis-points 0..10000 (mirrors the
--                                     contract's confidence field)
--   - conjuncts       jsonb        — {C,E,I,S,R} boolean tuple
--   - created_at      timestamptz  — decision timestamp
--
-- Indexes:
--   - created_at desc              — chronological scan
--   - session_id, created_at       — per-session timeline
--   - decision                     — ALLOW/DENY ratio queries
--   - predicted_stage              — per-stage hit rate queries
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists vvu_intent_logs
(
    id              bigserial primary key,
    session_id      text        not null,
    decision        text        not null check (decision in ('ALLOW', 'DENY')),
    predicted_stage smallint    not null check (predicted_stage between 0 and 3),
    score           real        not null check (score between 0 and 1),
    reason          text,
    breaker_tripped boolean     not null default false,
    studi_verdict   text        not null default 'UNKNOWN',
    ive_verdict     text        not null default 'UNKNOWN',
    confidence_bp   smallint    not null default 0,
    conjuncts       jsonb       not null default '{}'::jsonb,
    created_at      timestamptz not null default now()
);

create index if not exists idx_intent_logs_created_at
    on vvu_intent_logs (created_at desc);

create index if not exists idx_intent_logs_session_created
    on vvu_intent_logs (session_id, created_at desc);

create index if not exists idx_intent_logs_decision
    on vvu_intent_logs (decision);

create index if not exists idx_intent_logs_predicted_stage
    on vvu_intent_logs (predicted_stage);

-- Allow/deny ratio in the last hour — drives the operator dashboard.
create or replace view vvu_intent_hourly_summary as
select
    count(*)                                                      as total,
    count(*) filter (where decision = 'ALLOW')                    as allows,
    count(*) filter (where decision = 'DENY')                     as denies,
    count(*) filter (where breaker_tripped)                       as tripped,
    round(
        count(*) filter (where decision = 'ALLOW')::numeric
        / nullif(count(*), 0),
        4
    )                                                            as allow_rate
from vvu_intent_logs
where created_at > now() - interval '1 hour';

comment on table  vvu_intent_logs is
    'Intent Worker ALLOW/DENY stream through the Epistemic Hazard Wall — drives the Ghost Buffer';
comment on column vvu_intent_logs.predicted_stage is
    '0=sphere 1=antone 2=web-spider 3=miles';
comment on column vvu_intent_logs.confidence_bp is
    'basis-points 0..10000 — mirrors the VVUIVELedger confidence field';
